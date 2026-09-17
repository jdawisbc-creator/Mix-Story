/**
 * Serviço de Gestão de Promoções Integradas ao Estoque
 * Mix Variedades Store
 *
 * Módulo integrado ao estoque com automação por datas:
 * - Ativação automática ao atingir dataInicial
 * - Restauração automática do preço normal ao atingir dataFinal
 * - Prioridade: Preço Promocional Direto (com base estruturada para futuros: % , Combo, Leve X por Y)
 */

import { DatabaseService } from './databaseService';
import { EstoqueService } from './estoqueService';
import type { Promocao, StatusPromocao, TipoPromocao, Produto } from '../types';

const PROMOCOES_COLLECTION = 'estoque_promocoes';

const INITIAL_PROMOCOES: Promocao[] = [
  {
    id: 'promo_floratta_01',
    produtoId: 'prod_perfume_01',
    produtoNome: 'Perfume Floratta Gold Desodorante Colônia 75ml',
    valorCusto: 65.0,
    precoNormal: 119.9,
    precoPromocional: 99.9,
    dataInicial: '2026-09-10',
    dataFinal: '2026-09-25',
    descricao: 'Preço promocional direto para a Campanha Floratta',
    status: 'ativa',
    tipoPromocao: 'preco_direto',
    titulo: 'Oferta Especial Floratta Gold',
    ativa: true,
    criadoEm: '2026-09-10T09:00:00.000Z',
  },
  {
    id: 'promo_suporte3d_02',
    produtoId: 'prod_3d_01',
    produtoNome: 'Suporte Articulado para Celular & Tablet Impressão 3D',
    valorCusto: 6.0,
    precoNormal: 25.0,
    precoPromocional: 19.9,
    dataInicial: '2026-09-20',
    dataFinal: '2026-09-30',
    descricao: 'Campanha de Primavera Mix 3D com preço reduzido no balcão',
    status: 'agendada',
    tipoPromocao: 'preco_direto',
    titulo: 'Esquenta Primavera 3D',
    ativa: false,
    criadoEm: '2026-09-15T14:00:00.000Z',
  },
];

export class PromocaoService {
  /**
   * Obtém todas as promoções e roda a automação de status por data
   */
  static async getPromocoes(): Promise<Promocao[]> {
    let list = await DatabaseService.getCollection<Promocao>(PROMOCOES_COLLECTION);
    if (list.length === 0) {
      for (const p of INITIAL_PROMOCOES) {
        await DatabaseService.setDocument(PROMOCOES_COLLECTION, p.id, p);
      }
      list = [...INITIAL_PROMOCOES];
    }

    // Executa a automação de verificação de datas
    await this.verificarEAtualizarAutomacoes();

    // Recarrega atualizado
    const atualizadas = await DatabaseService.getCollection<Promocao>(PROMOCOES_COLLECTION);
    return atualizadas.sort(
      (a, b) => new Date(b.dataInicial).getTime() - new Date(a.dataInicial).getTime()
    );
  }

  /**
   * Cria uma nova promoção integrada ao estoque
   */
  static async criarPromocao(
    dados: {
      produtoId: string;
      produtoNome: string;
      valorCusto: number;
      precoNormal: number;
      precoPromocional: number;
      dataInicial: string;
      dataFinal: string;
      descricao: string;
      tipoPromocao?: TipoPromocao;
    },
    usuarioNome = 'Jhonatan'
  ): Promise<Promocao> {
    const hoje = new Date().toISOString().split('T')[0];
    let status: StatusPromocao = 'agendada';

    if (hoje >= dados.dataInicial && hoje <= dados.dataFinal) {
      status = 'ativa';
    } else if (hoje > dados.dataFinal) {
      status = 'encerrada';
    }

    const nova: Promocao = {
      id: `promo_${Date.now()}`,
      produtoId: dados.produtoId,
      produtoNome: dados.produtoNome,
      valorCusto: Number(dados.valorCusto) || 0,
      precoNormal: Number(dados.precoNormal) || 0,
      precoPromocional: Number(dados.precoPromocional) || 0,
      dataInicial: dados.dataInicial,
      dataFinal: dados.dataFinal,
      descricao: dados.descricao.trim(),
      status,
      tipoPromocao: dados.tipoPromocao || 'preco_direto',
      titulo: `${dados.produtoNome} - Preço Promocional`,
      ativa: status === 'ativa',
      criadoEm: new Date().toISOString(),
    };

    await DatabaseService.setDocument(PROMOCOES_COLLECTION, nova.id, nova);

    // Se estiver ativa imediatamente, atualiza o preço de venda do produto no estoque
    if (status === 'ativa') {
      await this.aplicarPrecoPromocionalNoEstoque(nova);
    }

    return nova;
  }

  /**
   * Salva alterações de uma promoção existente
   */
  static async salvarPromocao(promo: Promocao): Promise<void> {
    await DatabaseService.setDocument(PROMOCOES_COLLECTION, promo.id, promo);
    await this.verificarEAtualizarAutomacoes();
  }

  /**
   * Encerra manualmente uma promoção antes da data final
   */
  static async encerrarPromocao(id: string): Promise<void> {
    const promocoes = await DatabaseService.getCollection<Promocao>(PROMOCOES_COLLECTION);
    const promo = promocoes.find((p) => p.id === id);
    if (!promo) return;

    const promoEncerrada: Promocao = {
      ...promo,
      status: 'encerrada',
      ativa: false,
    };

    await DatabaseService.setDocument(PROMOCOES_COLLECTION, id, promoEncerrada);
    await this.restaurarPrecoNormalNoEstoque(promo);
  }

  /**
   * Exclui uma promoção
   */
  static async excluirPromocao(id: string): Promise<void> {
    const promocoes = await DatabaseService.getCollection<Promocao>(PROMOCOES_COLLECTION);
    const promo = promocoes.find((p) => p.id === id);
    if (promo && promo.status === 'ativa') {
      await this.restaurarPrecoNormalNoEstoque(promo);
    }
    await DatabaseService.deleteDocument(PROMOCOES_COLLECTION, id);
  }

  /**
   * AUTOMAÇÃO CENTRAL POR DATAS:
   * - Quando data atual >= dataInicial e <= dataFinal: ativa a promoção e define preço de venda no estoque.
   * - Quando data atual > dataFinal: encerra a promoção e restaura o preço normal do produto no estoque.
   */
  static async verificarEAtualizarAutomacoes(dataReferencia?: string): Promise<{
    ativadas: number;
    encerradas: number;
    mantidas: number;
  }> {
    const hoje = dataReferencia || new Date().toISOString().split('T')[0];
    const promocoes = await DatabaseService.getCollection<Promocao>(PROMOCOES_COLLECTION);

    let ativadas = 0;
    let encerradas = 0;
    let mantidas = 0;

    for (const promo of promocoes) {
      const statusAnterior = promo.status;
      let novoStatus: StatusPromocao = promo.status;

      if (hoje < promo.dataInicial) {
        novoStatus = 'agendada';
      } else if (hoje >= promo.dataInicial && hoje <= promo.dataFinal) {
        novoStatus = 'ativa';
      } else {
        novoStatus = 'encerrada';
      }

      if (statusAnterior !== novoStatus) {
        const atualizada: Promocao = {
          ...promo,
          status: novoStatus,
          ativa: novoStatus === 'ativa',
        };
        await DatabaseService.setDocument(PROMOCOES_COLLECTION, promo.id, atualizada);

        if (novoStatus === 'ativa') {
          await this.aplicarPrecoPromocionalNoEstoque(atualizada);
          ativadas++;
        } else if (novoStatus === 'encerrada' && statusAnterior === 'ativa') {
          await this.restaurarPrecoNormalNoEstoque(promo);
          encerradas++;
        }
      } else {
        // Se já estava ativa, garante que o produto tem o preço promocional
        if (novoStatus === 'ativa') {
          await this.aplicarPrecoPromocionalNoEstoque(promo);
        }
        mantidas++;
      }
    }

    return { ativadas, encerradas, mantidas };
  }

  /**
   * Aplica o preço promocional no produto do estoque, guardando o preço normal
   */
  private static async aplicarPrecoPromocionalNoEstoque(promo: Promocao): Promise<void> {
    try {
      const produtos = await EstoqueService.getProdutos();
      const prod = produtos.find((p) => p.id === promo.produtoId);
      if (!prod) return;

      // Guarda o preço normal original se não estava gravado
      const precoNormalOriginal = prod.precoNormalOriginal || promo.precoNormal || prod.precoVenda;

      const atualizado: Produto = {
        ...prod,
        precoNormalOriginal,
        precoVenda: promo.precoPromocional,
        emPromocao: true,
        promocaoAtivaId: promo.id,
      };

      await EstoqueService.salvarProduto(atualizado);
    } catch (e) {
      console.error('Erro ao aplicar preço promocional no estoque:', e);
    }
  }

  /**
   * Restaura o preço normal no produto do estoque quando a promoção encerra
   */
  private static async restaurarPrecoNormalNoEstoque(promo: Promocao): Promise<void> {
    try {
      const produtos = await EstoqueService.getProdutos();
      const prod = produtos.find((p) => p.id === promo.produtoId);
      if (!prod) return;

      const precoRestaurado = prod.precoNormalOriginal || promo.precoNormal;

      const atualizado: Produto = {
        ...prod,
        precoVenda: precoRestaurado,
        precoNormalOriginal: undefined,
        emPromocao: false,
        promocaoAtivaId: undefined,
      };

      await EstoqueService.salvarProduto(atualizado);
    } catch (e) {
      console.error('Erro ao restaurar preço normal no estoque:', e);
    }
  }
}
