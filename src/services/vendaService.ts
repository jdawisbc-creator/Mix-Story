/**
 * Serviço de Vendas e PDV Integrado com Caixa, Estoque e Auditoria
 * Mix Variedades Store
 */

import { DatabaseService } from './databaseService';
import { CaixaService } from './caixaService';
import { EstoqueService } from './estoqueService';
import { AuditService, formatDataBrasil } from './auditService';
import type { Venda, ItemVenda, FormaPagamento, PagamentoMistoParcela } from '../types';

const VENDAS_COLLECTION = 'vendas_loja';

export interface ServicoPredefinido {
  id: string;
  nome: string;
  precoSugerido: number;
  unidade: string;
}

export const SERVICOS_CATALOGO: ServicoPredefinido[] = [
  { id: 'srv_xerox_pb', nome: 'Xerox P&B (Unidade)', precoSugerido: 0.5, unidade: 'UN' },
  { id: 'srv_xerox_cor', nome: 'Xerox Colorida (Unidade)', precoSugerido: 1.5, unidade: 'UN' },
  { id: 'srv_impressao', nome: 'Impressão de Documento', precoSugerido: 1.0, unidade: 'UN' },
  { id: 'srv_plastificacao', nome: 'Plastificação (Doc / Foto)', precoSugerido: 5.0, unidade: 'UN' },
  { id: 'srv_encadernacao', nome: 'Encadernação (Espiral)', precoSugerido: 8.0, unidade: 'UN' },
  { id: 'srv_arte', nome: 'Arte / Criação Digital', precoSugerido: 25.0, unidade: 'SRV' },
  { id: 'srv_3d', nome: 'Impressão 3D (Peça/Suporte)', precoSugerido: 35.0, unidade: 'PC' },
  { id: 'srv_personalizados', nome: 'Personalizados (Caneca / Brinde)', precoSugerido: 30.0, unidade: 'UN' },
];

const INITIAL_VENDAS: Venda[] = [
  {
    id: 'vd_1042',
    numero: 1042,
    data: '16/09/2026',
    horario: '14:15',
    dataHora: '2026-09-16T14:15:00.000Z',
    usuario: 'Jhonatan',
    usuarioId: 'usr_jhonatan_01',
    clienteNome: 'Consumidor Final',
    itens: [
      {
        produtoId: 'prod_01',
        nome: 'Fone de Ouvido Bluetooth TWS Pro Mix',
        tipoItem: 'produto',
        quantidade: 1,
        precoUnitario: 69.9,
        subtotal: 69.9,
        desconto: 0,
        total: 69.9,
      },
      {
        produtoId: 'prod_02',
        nome: 'Cabo Carregador Turbo 3 em 1 Reforçado',
        tipoItem: 'produto',
        quantidade: 1,
        precoUnitario: 25.0,
        subtotal: 25.0,
        desconto: 0,
        total: 25.0,
      },
    ],
    subtotal: 94.9,
    descontoTotal: 0,
    total: 94.9,
    formaPagamento: 'pix',
    status: 'concluida',
    vendedorId: 'usr_jhonatan_01',
    vendedorNome: 'Jhonatan',
    caixaId: 'caixa_hoje',
  },
  {
    id: 'vd_1041',
    numero: 1041,
    data: '16/09/2026',
    horario: '13:30',
    dataHora: '2026-09-16T13:30:00.000Z',
    usuario: 'Jhonatan',
    usuarioId: 'usr_jhonatan_01',
    clienteNome: 'Mariana Souza',
    itens: [
      {
        produtoId: 'prod_03',
        nome: 'Garrafa Térmica Inox Digital 500ml',
        tipoItem: 'produto',
        quantidade: 1,
        precoUnitario: 49.9,
        subtotal: 49.9,
        desconto: 0,
        total: 49.9,
      },
      {
        produtoId: 'srv_xerox_pb',
        nome: 'Xerox P&B (Unidade)',
        tipoItem: 'servico',
        quantidade: 6,
        precoUnitario: 0.5,
        subtotal: 3.0,
        desconto: 0,
        total: 3.0,
      },
    ],
    subtotal: 52.9,
    descontoTotal: 0,
    total: 52.9,
    formaPagamento: 'cartao_credito',
    status: 'concluida',
    vendedorId: 'usr_jhonatan_01',
    vendedorNome: 'Jhonatan',
    caixaId: 'caixa_hoje',
  },
];

export class VendaService {
  static async getVendas(): Promise<Venda[]> {
    const list = await DatabaseService.getCollection<Venda>(VENDAS_COLLECTION);
    if (list.length === 0) {
      for (const v of INITIAL_VENDAS) {
        await DatabaseService.setDocument(VENDAS_COLLECTION, v.id, v);
      }
      return INITIAL_VENDAS;
    }
    return list.sort(
      (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
    );
  }

  /**
   * Registra uma nova venda com integrações automáticas:
   * 1. Baixa de estoque apenas para produtos físicos (serviços não reduzem).
   * 2. Alimentação automática do caixa ativo do dia.
   * 3. Registro permanente na auditoria com o usuário logado.
   */
  static async registrarVenda(
    dados: {
      clienteNome?: string;
      clienteDocumento?: string;
      itens: ItemVenda[];
      subtotal: number;
      descontoTotal: number;
      total: number;
      formaPagamento: FormaPagamento;
      pagamentoMistoDetalhes?: PagamentoMistoParcela[];
      valorPago?: number;
      trocoDevolvido?: number;
    },
    usuario: { id: string; name: string }
  ): Promise<Venda> {
    const agora = new Date();
    const { data, horario } = formatDataBrasil(agora);
    const todasVendas = await this.getVendas();
    const proximoNumero =
      todasVendas.reduce((max, v) => (typeof v.numero === 'number' && v.numero > max ? v.numero : max), 1042) + 1;

    const idVenda = `vd_${Date.now()}`;
    const caixaHoje = await CaixaService.getCaixaHoje();

    const novaVenda: Venda = {
      id: idVenda,
      numero: proximoNumero,
      data,
      horario,
      dataHora: agora.toISOString(),
      usuario: usuario.name,
      usuarioId: usuario.id,
      clienteNome: dados.clienteNome || 'Consumidor Final',
      clienteDocumento: dados.clienteDocumento,
      itens: dados.itens,
      subtotal: dados.subtotal,
      descontoTotal: dados.descontoTotal,
      total: dados.total,
      formaPagamento: dados.formaPagamento,
      pagamentoMistoDetalhes: dados.pagamentoMistoDetalhes,
      valorPago: dados.valorPago,
      trocoDevolvido: dados.trocoDevolvido,
      status: 'concluida',
      vendedorId: usuario.id,
      vendedorNome: usuario.name,
      caixaId: caixaHoje.id,
    };

    // 1. Salvar no banco
    await DatabaseService.setDocument(VENDAS_COLLECTION, idVenda, novaVenda);

    // 2. INTEGRAÇÃO COM ESTOQUE:
    // Produtos físicos sofrem baixa imediata; serviços são ignorados
    for (const item of dados.itens) {
      if (item.tipoItem === 'produto') {
        const resultadoEstoque = await EstoqueService.diminuirEstoque(
          item.produtoId,
          item.quantidade
        );

        // Registro de auditoria específico da movimentação de estoque
        await AuditService.registrar({
          usuario: usuario.name,
          usuarioId: usuario.id,
          modulo: 'Estoque',
          tipoAcao: 'Saída de Estoque',
          registroAfetado: item.nome,
          informacaoAnterior: `${resultadoEstoque.estoqueAnterior} un`,
          informacaoNova: `${resultadoEstoque.novoEstoque} un`,
          descricao: `Venda #${proximoNumero}: saída de ${item.quantidade} un de "${item.nome}". Estoque atualizado de ${resultadoEstoque.estoqueAnterior} para ${resultadoEstoque.novoEstoque}.`,
        });
      }
    }

    // 3. INTEGRAÇÃO COM CAIXA:
    // Registrar movimento de venda no caixa ativo
    await CaixaService.registrarVendaNoCaixa(novaVenda, usuario);

    // 4. AUDITORIA CENTRAL DA VENDA
    const resumoItens = dados.itens
      .map((i) => `${i.quantidade}x ${i.nome}`)
      .join(', ');

    await AuditService.registrar({
      usuario: usuario.name,
      usuarioId: usuario.id,
      modulo: 'Vendas',
      tipoAcao: 'Criação',
      registroAfetado: `Venda #${proximoNumero}`,
      informacaoAnterior: 'Nova Venda',
      informacaoNova: `Total: R$ ${dados.total.toFixed(2)} (${dados.formaPagamento.toUpperCase()})`,
      descricao: `Venda #${proximoNumero} realizada com sucesso por ${usuario.name}. Itens: [${resumoItens}]. Valor total: R$ ${dados.total.toFixed(2)}.`,
    });

    return novaVenda;
  }

  /**
   * Cancelamento de Venda:
   * 1. Não apaga definitivamente: status vira CANCELADA.
   * 2. Devolve produtos físicos ao estoque.
   * 3. Desfaz lançamento do caixa.
   * 4. Registra ação detalhada na auditoria.
   */
  static async cancelarVenda(
    vendaId: string,
    motivo: string,
    usuario: { id: string; name: string }
  ): Promise<Venda> {
    const vendas = await this.getVendas();
    const venda = vendas.find((v) => v.id === vendaId);

    if (!venda) {
      throw new Error('Venda não encontrada.');
    }

    if (venda.status === 'cancelada') {
      throw new Error('Esta venda já se encontra cancelada.');
    }

    const agora = new Date().toISOString();
    const vendaAtualizada: Venda = {
      ...venda,
      status: 'cancelada',
      canceladaEm: agora,
      canceladaPor: usuario.name,
      motivoCancelamento: motivo || 'Cancelamento solicitado no balcão',
    };

    // Salvar alteração
    await DatabaseService.setDocument(VENDAS_COLLECTION, venda.id, vendaAtualizada);

    // 1. DEVOLVER PRODUTOS AO ESTOQUE
    for (const item of venda.itens) {
      if (item.tipoItem === 'produto') {
        const resultadoEstoque = await EstoqueService.devolverEstoque(
          item.produtoId,
          item.quantidade
        );

        await AuditService.registrar({
          usuario: usuario.name,
          usuarioId: usuario.id,
          modulo: 'Estoque',
          tipoAcao: 'Entrada de Estoque',
          registroAfetado: item.nome,
          informacaoAnterior: `${resultadoEstoque.estoqueAnterior} un`,
          informacaoNova: `${resultadoEstoque.novoEstoque} un`,
          descricao: `Devolução por cancelamento da Venda #${venda.numero}: retorno de ${item.quantidade} un de "${item.nome}". Estoque atualizado de ${resultadoEstoque.estoqueAnterior} para ${resultadoEstoque.novoEstoque}.`,
        });
      }
    }

    // 2. ESTORNAR DO CAIXA
    await CaixaService.estornarVendaDoCaixa(venda, motivo, usuario);

    // 3. AUDITORIA DA VENDA CANCELADA
    await AuditService.registrar({
      usuario: usuario.name,
      usuarioId: usuario.id,
      modulo: 'Vendas',
      tipoAcao: 'Cancelamento',
      registroAfetado: `Venda #${venda.numero}`,
      informacaoAnterior: `Status: Concluída (R$ ${venda.total.toFixed(2)})`,
      informacaoNova: 'Status: CANCELADA',
      descricao: `Cancelamento da Venda #${venda.numero} realizado pelo operador ${usuario.name}. Motivo: ${motivo}. Itens físicos devolvidos ao estoque.`,
    });

    return vendaAtualizada;
  }
}
