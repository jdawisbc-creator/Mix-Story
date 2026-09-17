/**
 * Serviço de Gestão de Saídas & Gastos
 * Mix Variedades Store
 *
 * Separação estrita entre:
 * - TIPO 1: DESPESAS OPERACIONAIS (Gasto real / Consumo da loja)
 * - TIPO 2: COMPRA PARA REVENDA (Saída Financeira + Entrada de Mercadoria no Estoque)
 */

import { DatabaseService } from './databaseService';
import { EstoqueService } from './estoqueService';
import { AuditService } from './auditService';
import { CaixaService } from './caixaService';
import type { SaidaGasto, FormaPagamento, Produto } from '../types';

const SAIDAS_COLLECTION = 'saidas_gastos';

const INITIAL_SAIDAS: SaidaGasto[] = [
  {
    id: 'saida_01',
    tipo: 'despesa',
    descricao: 'Aluguel do Ponto Comercial — Loja Centro',
    categoria: 'aluguel',
    valor: 1800.0,
    data: '2026-09-10',
    formaPagamento: 'transferencia',
    status: 'pago',
    observacao: 'Aluguel referente ao mês vigente pago pontualmente',
    usuarioId: 'usr_jhonatan_01',
    usuarioNome: 'Jhonatan',
    fornecedorOuFavorecido: 'Imobiliária Central Mix',
    criadoEm: '2026-09-10T09:00:00.000Z',
  },
  {
    id: 'saida_02',
    tipo: 'compra_revenda',
    descricao: '100x Adesivos Mix Vinil Holográfico',
    categoria: 'Papelaria e Escritório',
    valor: 100.0,
    data: '2026-09-14',
    formaPagamento: 'pix',
    status: 'pago',
    observacao: 'Compra de lote para revenda no balcão e personalizados',
    usuarioId: 'usr_jhonatan_01',
    usuarioNome: 'Jhonatan',
    fornecedor: 'Gráfica Master Vinil',
    fornecedorOuFavorecido: 'Gráfica Master Vinil',
    produtoId: 'prod_04',
    produtoNome: 'Adesivos Vinil Holográfico',
    quantidade: 100,
    custoUnitario: 1.0,
    valorTotalCompra: 100.0,
    precoPrevistoVenda: 2.0,
    receitaPotencial: 200.0,
    lucroProjetado: 100.0,
    estoqueAtualizado: true,
    criadoEm: '2026-09-14T11:20:00.000Z',
  },
  {
    id: 'saida_03',
    tipo: 'despesa',
    descricao: 'Energia Elétrica — Enel Distribuição',
    categoria: 'energia',
    valor: 430.5,
    data: '2026-09-12',
    formaPagamento: 'pix',
    status: 'pago',
    observacao: 'Consumo do mês da loja física e ar-condicionado',
    usuarioId: 'usr_jhonatan_01',
    usuarioNome: 'Jhonatan',
    fornecedorOuFavorecido: 'Enel São Paulo',
    criadoEm: '2026-09-12T14:10:00.000Z',
  },
  {
    id: 'saida_04',
    tipo: 'compra_revenda',
    descricao: '40x Cabo Carregador Turbo 3 em 1 Reforçado',
    categoria: 'Eletrônicos e Acessórios',
    valor: 288.0,
    data: '2026-09-15',
    formaPagamento: 'dinheiro',
    status: 'pago',
    observacao: 'Reposição de estoque com desconto no atacado',
    usuarioId: 'usr_jhonatan_01',
    usuarioNome: 'Jhonatan',
    fornecedor: 'Distribuidora Tech Brasil',
    fornecedorOuFavorecido: 'Distribuidora Tech Brasil',
    produtoId: 'prod_02',
    produtoNome: 'Cabo Carregador Turbo 3 em 1 Reforçado 1.2m',
    quantidade: 40,
    custoUnitario: 7.2,
    valorTotalCompra: 288.0,
    precoPrevistoVenda: 25.0,
    receitaPotencial: 1000.0,
    lucroProjetado: 712.0,
    estoqueAtualizado: true,
    criadoEm: '2026-09-15T15:30:00.000Z',
  },
  {
    id: 'saida_05',
    tipo: 'despesa',
    descricao: 'Link Fibra Óptica 500 Mega + IP Fixo',
    categoria: 'internet',
    valor: 149.9,
    data: '2026-09-15',
    formaPagamento: 'pix',
    status: 'pago',
    observacao: 'Internet dedicada para emissão de notas e PDV',
    usuarioId: 'usr_jhonatan_01',
    usuarioNome: 'Jhonatan',
    fornecedorOuFavorecido: 'Telefônica / Vivo Fibra',
    criadoEm: '2026-09-15T16:00:00.000Z',
  },
];

export interface RegistrarDespesaParams {
  descricao: string;
  categoria: string;
  valor: number;
  data: string; // YYYY-MM-DD
  formaPagamento: FormaPagamento;
  observacao?: string;
  fornecedorOuFavorecido?: string;
  usuario: { id: string; name: string };
  lancarNoCaixaSeDinheiro?: boolean;
}

export interface RegistrarCompraRevendaParams {
  // Produto
  produtoId?: string; // se produto já existir no estoque
  produtoNome: string;
  categoria: string;
  categoriaId?: string;
  quantidade: number;
  custoUnitario: number;
  precoPrevistoVenda: number;
  data: string; // YYYY-MM-DD
  formaPagamento: FormaPagamento;
  fornecedor?: string;
  observacoes?: string;
  usuario: { id: string; name: string };
  lancarNoCaixaSeDinheiro?: boolean;
}

export class GastoService {
  /**
   * Obtém todas as saídas cadastradas (Despesas e Compras para Revenda)
   */
  static async getSaidas(): Promise<SaidaGasto[]> {
    const lista = await DatabaseService.getCollection<SaidaGasto>(SAIDAS_COLLECTION);
    if (lista.length === 0) {
      for (const s of INITIAL_SAIDAS) {
        await DatabaseService.setDocument(SAIDAS_COLLECTION, s.id, s);
      }
      return INITIAL_SAIDAS;
    }
    // Ordena da mais recente para a mais antiga
    return lista.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  /**
   * TIPO 1: REGISTRAR DESPESA OPERACIONAL
   * Dinheiro realmente gasto pela operação da loja (Aluguel, Água, Luz, etc.)
   */
  static async registrarDespesa(params: RegistrarDespesaParams): Promise<SaidaGasto> {
    const id = `desp_${Date.now()}`;
    const valorNum = Number(params.valor);

    const novaDespesa: SaidaGasto = {
      id,
      tipo: 'despesa',
      descricao: params.descricao.trim(),
      categoria: params.categoria,
      valor: valorNum,
      data: params.data,
      formaPagamento: params.formaPagamento,
      status: 'pago',
      observacao: params.observacao?.trim() || '',
      observacoes: params.observacao?.trim() || '',
      usuarioId: params.usuario.id,
      usuarioNome: params.usuario.name,
      registradoPorId: params.usuario.id,
      registradoPorNome: params.usuario.name,
      fornecedorOuFavorecido: params.fornecedorOuFavorecido?.trim() || '',
      fornecedor: params.fornecedorOuFavorecido?.trim() || '',
      criadoEm: new Date().toISOString(),
    };

    // 1. Persiste saída
    await DatabaseService.setDocument(SAIDAS_COLLECTION, novaDespesa.id, novaDespesa);

    // 2. Se pagamento for em DINHEIRO e caixa estiver aberto, registra saída (sangria) no caixa
    if (params.formaPagamento === 'dinheiro' && params.lancarNoCaixaSeDinheiro) {
      try {
        const caixaAberto = await CaixaService.getCaixaAberto();
        if (caixaAberto) {
          await CaixaService.registrarSangria(
            caixaAberto.id,
            valorNum,
            `Despesa: ${novaDespesa.descricao}`,
            params.usuario.name
          );
        }
      } catch (err) {
        console.warn('Não foi possível lançar no caixa:', err);
      }
    }

    // 3. Auditoria Obrigatória
    await AuditService.registrar({
      usuario: params.usuario.name,
      usuarioId: params.usuario.id,
      modulo: 'Gastos',
      tipoAcao: 'Despesa Operacional',
      registroAfetado: novaDespesa.descricao,
      informacaoAnterior: 'Não existia',
      informacaoNova: `R$ ${valorNum.toFixed(2)} (${novaDespesa.categoria}) — Pago via ${novaDespesa.formaPagamento.toUpperCase()}`,
      descricao: `Despesa operacional "${novaDespesa.descricao}" registrada por ${params.usuario.name}. Valor: R$ ${valorNum.toFixed(2)}. Categoria: ${novaDespesa.categoria}.`,
    });

    return novaDespesa;
  }

  /**
   * TIPO 2: REGISTRAR COMPRA PARA REVENDA
   * SAÍDA FINANCEIRA + ENTRADA DE MERCADORIA
   *
   * 1. Registra saída financeira (investimento em estoque)
   * 2. Adiciona quantidade ao estoque
   * 3. Registra histórico e auditoria
   * 4. Mantém vínculo entre compra e estoque
   */
  static async registrarCompraRevenda(params: RegistrarCompraRevendaParams): Promise<{
    saida: SaidaGasto;
    produtoAfetado: Produto;
  }> {
    const id = `compra_${Date.now()}`;
    const quantidade = Number(params.quantidade);
    const custoUnitario = Number(params.custoUnitario);
    const valorTotalCompra = quantidade * custoUnitario;
    const precoPrevistoVenda = Number(params.precoPrevistoVenda);
    const receitaPotencial = quantidade * precoPrevistoVenda;
    const lucroProjetado = receitaPotencial - valorTotalCompra;

    // 1. INTEGRAÇÃO COM O ESTOQUE
    let produtoAfetado: Produto;
    let estoqueAnterior = 0;
    let novoEstoque = 0;

    if (params.produtoId) {
      // Produto já existente no estoque: incrementa estoque e atualiza custo/venda
      const res = await EstoqueService.adicionarEstoque(
        params.produtoId,
        quantidade,
        params.usuario?.name || 'Jhonatan',
        `Compra para revenda (Fornecedor: ${params.fornecedor || 'Geral'})`,
        custoUnitario,
        precoPrevistoVenda
      );
      produtoAfetado = res.produto;
      estoqueAnterior = res.estoqueAnterior;
      novoEstoque = res.novoEstoque;
    } else {
      // Produto novo: cadastra no catálogo com a quantidade comprada
      produtoAfetado = await EstoqueService.cadastrarProdutoComEstoque({
        nome: params.produtoNome.trim(),
        categoriaId: params.categoriaId || 'cat_variedades',
        categoriaNome: params.categoria,
        quantidade,
        precoCusto: custoUnitario,
        precoVenda: precoPrevistoVenda,
        fornecedor: params.fornecedor,
      });
      estoqueAnterior = 0;
      novoEstoque = quantidade;
    }

    // 2. REGISTRA A SAÍDA FINANCEIRA COM VÍNCULO COMPLETO
    const novaSaida: SaidaGasto = {
      id,
      tipo: 'compra_revenda',
      descricao: `${quantidade}x ${produtoAfetado.nome}`,
      categoria: params.categoria || produtoAfetado.categoriaNome,
      valor: valorTotalCompra,
      data: params.data,
      formaPagamento: params.formaPagamento,
      status: 'pago',
      observacao: params.observacoes?.trim() || '',
      observacoes: params.observacoes?.trim() || '',
      usuarioId: params.usuario.id,
      usuarioNome: params.usuario.name,
      registradoPorId: params.usuario.id,
      registradoPorNome: params.usuario.name,
      fornecedor: params.fornecedor?.trim() || '',
      fornecedorOuFavorecido: params.fornecedor?.trim() || '',
      // Vínculo detalhado com o estoque
      produtoId: produtoAfetado.id,
      produtoNome: produtoAfetado.nome,
      quantidade,
      custoUnitario,
      valorTotalCompra,
      precoPrevistoVenda,
      receitaPotencial,
      lucroProjetado,
      estoqueAtualizado: true,
      criadoEm: new Date().toISOString(),
    };

    await DatabaseService.setDocument(SAIDAS_COLLECTION, novaSaida.id, novaSaida);

    // 3. SE PAGAMENTO FOR EM DINHEIRO E CAIXA ESTIVER ABERTO, LANÇA SAÍDA NO CAIXA
    if (params.formaPagamento === 'dinheiro' && params.lancarNoCaixaSeDinheiro) {
      try {
        const caixaAberto = await CaixaService.getCaixaAberto();
        if (caixaAberto) {
          await CaixaService.registrarSangria(
            caixaAberto.id,
            valorTotalCompra,
            `Compra Revenda: ${novaSaida.descricao}`,
            params.usuario.name
          );
        }
      } catch (err) {
        console.warn('Não foi possível lançar no caixa:', err);
      }
    }

    // 4. AUDITORIA OBRIGATÓRIA (REGISTRO DE HISTÓRICO COM VÍNCULO)
    await AuditService.registrar({
      usuario: params.usuario.name,
      usuarioId: params.usuario.id,
      modulo: 'Gastos',
      tipoAcao: 'Compra para Revenda',
      registroAfetado: `Produto: ${produtoAfetado.nome} (SKU: ${produtoAfetado.sku})`,
      informacaoAnterior: `Estoque: ${estoqueAnterior} un.`,
      informacaoNova: `Estoque: ${novoEstoque} un. (+${quantidade} un.)`,
      descricao: `Compra para Revenda: ${quantidade} un. de "${produtoAfetado.nome}". Investimento: R$ ${valorTotalCompra.toFixed(2)} (Custo un: R$ ${custoUnitario.toFixed(2)}). Preço de venda: R$ ${precoPrevistoVenda.toFixed(2)}. Receita Potencial: R$ ${receitaPotencial.toFixed(2)}. Lucro previsto: R$ ${lucroProjetado.toFixed(2)}. Usuário: ${params.usuario.name}.`,
    });

    return { saida: novaSaida, produtoAfetado };
  }

  /**
   * Exclusão ou estorno de saída com auditoria
   */
  static async excluirSaida(
    saida: SaidaGasto,
    usuario: { id: string; name: string },
    motivo: string
  ): Promise<void> {
    await DatabaseService.deleteDocument(SAIDAS_COLLECTION, saida.id);

    // Se for compra para revenda, reduz estoque que havia entrado
    if (saida.tipo === 'compra_revenda' && saida.produtoId && saida.quantidade) {
      try {
        await EstoqueService.diminuirEstoque(saida.produtoId, saida.quantidade);
      } catch (err) {
        console.warn('Erro ao ajustar estoque no estorno:', err);
      }
    }

    await AuditService.registrar({
      usuario: usuario.name,
      usuarioId: usuario.id,
      modulo: 'Gastos',
      tipoAcao: 'Exclusão',
      registroAfetado: saida.descricao,
      informacaoAnterior: `R$ ${saida.valor.toFixed(2)} (${saida.tipo})`,
      informacaoNova: 'Excluído do sistema',
      descricao: `Saída "${saida.descricao}" de R$ ${saida.valor.toFixed(2)} excluída por ${usuario.name}. Motivo: ${motivo}.`,
    });
  }
}
