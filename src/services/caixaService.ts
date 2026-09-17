/**
 * Serviço de Caixa Integrado com Vendas e Auditoria
 * MIX GESTÃO — Mix Variedades Store
 */

import { DatabaseService } from './databaseService';
import { AuditService, formatDataBrasil } from './auditService';
import type { Caixa, MovimentoCaixa, Venda, OrdemServico, FormaPagamento } from '../types';

const CAIXA_COLLECTION = 'caixa_sessoes';
const MOVIMENTOS_COLLECTION = 'caixa_movimentos';

const getTodayString = () => new Date().toISOString().split('T')[0];

const INITIAL_CAIXA_HOJE: Caixa = {
  id: `caixa_${getTodayString()}`,
  data: getTodayString(),
  status: 'aberto',
  saldoInicial: 200.0,
  totalEntradas: 1845.5 + 200.0,
  totalSaidas: 120.0,
  saldoFinalCalculado: 1925.5,
  operadorId: 'usr_jhonatan_01',
  operadorNome: 'Jhonatan',
  abertoEm: `${getTodayString()}T08:30:00Z`,
  observacoes: 'Turno padrão iniciado sem divergências.',
  vendasDinheiro: 450.0,
  vendasPix: 890.0,
  vendasDebito: 215.5,
  vendasCredito: 290.0,
  vendasTransferencia: 0,
  vendasOutros: 0,
  totalVendido: 1845.5,
  entradasAdicionais: 0,
  saidasTotal: 120.0,
};

const INITIAL_MOVIMENTOS: MovimentoCaixa[] = [
  {
    id: 'mov_01',
    caixaId: `caixa_${getTodayString()}`,
    tipo: 'abertura',
    valor: 200.0,
    descricao: 'Fundo de troco inicial do caixa',
    formaPagamento: 'dinheiro',
    usuarioId: 'usr_jhonatan_01',
    usuarioNome: 'Jhonatan',
    timestamp: `${getTodayString()}T08:30:00Z`,
  },
  {
    id: 'mov_02',
    caixaId: `caixa_${getTodayString()}`,
    tipo: 'venda',
    valor: 94.9,
    descricao: 'Venda #1042 — Fone Bluetooth + Cabo Turbo',
    formaPagamento: 'pix',
    usuarioId: 'usr_jhonatan_01',
    usuarioNome: 'Jhonatan',
    timestamp: `${getTodayString()}T09:15:00Z`,
  },
  {
    id: 'mov_03',
    caixaId: `caixa_${getTodayString()}`,
    tipo: 'sangria',
    valor: 120.0,
    descricao: 'Sangria de segurança para cofre central',
    formaPagamento: 'dinheiro',
    usuarioId: 'usr_jhonatan_01',
    usuarioNome: 'Jhonatan',
    timestamp: `${getTodayString()}T11:45:00Z`,
  },
];

export class CaixaService {
  static async getCaixaHoje(): Promise<Caixa> {
    const today = getTodayString();
    const caixa = await DatabaseService.getDocument<Caixa>(CAIXA_COLLECTION, `caixa_${today}`);
    if (!caixa) {
      const novo: Caixa = {
        ...INITIAL_CAIXA_HOJE,
        id: `caixa_${today}`,
        data: today,
        status: 'aberto',
      };
      await DatabaseService.setDocument(CAIXA_COLLECTION, novo.id, novo);
      return novo;
    }
    return caixa;
  }

  static async salvarCaixa(caixa: Caixa): Promise<void> {
    await DatabaseService.setDocument(CAIXA_COLLECTION, caixa.id, caixa);
  }

  static async getHistoricoCaixas(): Promise<Caixa[]> {
    const caixas = await DatabaseService.getCollection<Caixa>(CAIXA_COLLECTION);
    if (caixas.length === 0) {
      const hoje = await this.getCaixaHoje();
      return [hoje];
    }
    return caixas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  static async getMovimentosHoje(): Promise<MovimentoCaixa[]> {
    const movs = await DatabaseService.getCollection<MovimentoCaixa>(MOVIMENTOS_COLLECTION);
    if (movs.length === 0) {
      for (const m of INITIAL_MOVIMENTOS) {
        await DatabaseService.setDocument(MOVIMENTOS_COLLECTION, m.id, m);
      }
      return INITIAL_MOVIMENTOS;
    }
    return movs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static async adicionarMovimento(mov: MovimentoCaixa): Promise<void> {
    await DatabaseService.setDocument(MOVIMENTOS_COLLECTION, mov.id, mov);
  }

  static async excluirMovimento(id: string): Promise<void> {
    await DatabaseService.deleteDocument(MOVIMENTOS_COLLECTION, id);
  }

  /**
   * Abertura de Caixa:
   * "Todos os dias o caixa deverá ser aberto.
   * Campos: Data, Usuário responsável, Valor inicial para troco, Observações.
   * O sistema deverá impedir duas aberturas simultâneas no mesmo caixa."
   */
  static async abrirCaixa(
    dados: {
      valorTroco: number;
      observacoes?: string;
    },
    usuario: { id: string; name: string }
  ): Promise<Caixa> {
    const today = getTodayString();
    const caixaExistente = await DatabaseService.getDocument<Caixa>(CAIXA_COLLECTION, `caixa_${today}`);

    // IMPEDE DUAS ABERTURAS SIMULTÂNEAS NO MESMO CAIXA
    if (caixaExistente && caixaExistente.status === 'aberto') {
      throw new Error(
        `O caixa de hoje já se encontra ABERTO pelo operador ${caixaExistente.operadorNome}. Não é permitido realizar duas aberturas simultâneas no mesmo caixa.`
      );
    }

    const novoCaixa: Caixa = {
      id: `caixa_${today}`,
      data: today,
      status: 'aberto',
      saldoInicial: dados.valorTroco,
      totalEntradas: dados.valorTroco,
      totalSaidas: 0,
      saldoFinalCalculado: dados.valorTroco,
      operadorId: usuario.id,
      operadorNome: usuario.name,
      abertoEm: new Date().toISOString(),
      observacoes: dados.observacoes || 'Abertura de turno normal.',
      vendasDinheiro: 0,
      vendasPix: 0,
      vendasDebito: 0,
      vendasCredito: 0,
      vendasTransferencia: 0,
      vendasOutros: 0,
      totalVendido: 0,
      entradasAdicionais: 0,
      saidasTotal: 0,
    };

    await this.salvarCaixa(novoCaixa);

    // Movimento de abertura
    const movAbertura: MovimentoCaixa = {
      id: `mov_abertura_${Date.now()}`,
      caixaId: novoCaixa.id,
      tipo: 'abertura',
      valor: dados.valorTroco,
      descricao: `Fundo de troco inicial: R$ ${dados.valorTroco.toFixed(2)}`,
      formaPagamento: 'dinheiro',
      usuarioId: usuario.id,
      usuarioNome: usuario.name,
      timestamp: new Date().toISOString(),
    };
    await this.adicionarMovimento(movAbertura);

    // Auditoria Obrigatória
    await AuditService.registrar({
      usuario: usuario.name,
      usuarioId: usuario.id,
      modulo: 'Caixa',
      tipoAcao: 'Abertura',
      registroAfetado: `Caixa (${today})`,
      informacaoAnterior: 'Caixa Fechado',
      informacaoNova: `Fundo de Troco: R$ ${dados.valorTroco.toFixed(2)}`,
      descricao: `Abertura do caixa da loja realizada por ${usuario.name}. Valor inicial de troco: R$ ${dados.valorTroco.toFixed(2)}.`,
    });

    return novoCaixa;
  }

  /**
   * Integração Automática de Venda no Caixa:
   * Alimenta as entradas, o total vendido e o acumulador da forma de pagamento correspondente.
   * Suporta pagamento simples ou misto desmembrado com exatidão matemática.
   */
  static async registrarVendaNoCaixa(
    venda: Venda,
    usuario: { id: string; name: string }
  ): Promise<void> {
    const caixa = await this.getCaixaHoje();
    if (caixa.status !== 'aberto') {
      console.warn('Venda registrada com caixa em status diferente de aberto.');
    }

    const valorVenda = venda.total;

    // Se for pagamento misto, distribui os valores exatos de cada parcela
    let deltaDinheiro = 0;
    let deltaPix = 0;
    let deltaDebito = 0;
    let deltaCredito = 0;
    let deltaTransferencia = 0;
    let deltaOutros = 0;

    if (venda.formaPagamento === 'misto' && venda.pagamentoMistoDetalhes && venda.pagamentoMistoDetalhes.length > 0) {
      for (const parcela of venda.pagamentoMistoDetalhes) {
        const val = Number(parcela.valor) || 0;
        if (parcela.forma === 'dinheiro') deltaDinheiro += val;
        else if (parcela.forma === 'pix') deltaPix += val;
        else if (parcela.forma === 'cartao_debito') deltaDebito += val;
        else if (parcela.forma === 'cartao_credito') deltaCredito += val;
        else if (parcela.forma === 'transferencia') deltaTransferencia += val;
        else deltaOutros += val;
      }
    } else {
      if (venda.formaPagamento === 'dinheiro') deltaDinheiro = valorVenda;
      else if (venda.formaPagamento === 'pix') deltaPix = valorVenda;
      else if (venda.formaPagamento === 'cartao_debito') deltaDebito = valorVenda;
      else if (venda.formaPagamento === 'cartao_credito') deltaCredito = valorVenda;
      else if (venda.formaPagamento === 'transferencia') deltaTransferencia = valorVenda;
      else deltaOutros = valorVenda;
    }

    const vendasDinheiro = (caixa.vendasDinheiro || 0) + deltaDinheiro;
    const vendasPix = (caixa.vendasPix || 0) + deltaPix;
    const vendasDebito = (caixa.vendasDebito || 0) + deltaDebito;
    const vendasCredito = (caixa.vendasCredito || 0) + deltaCredito;
    const vendasTransferencia = (caixa.vendasTransferencia || 0) + deltaTransferencia;
    const vendasOutros = (caixa.vendasOutros || 0) + deltaOutros;

    const caixaAtualizado: Caixa = {
      ...caixa,
      totalVendido: (caixa.totalVendido || 0) + valorVenda,
      totalEntradas: caixa.totalEntradas + valorVenda,
      saldoFinalCalculado: caixa.saldoFinalCalculado + deltaDinheiro,
      vendasDinheiro,
      vendasPix,
      vendasDebito,
      vendasCredito,
      vendasTransferencia,
      vendasOutros,
    };

    await this.salvarCaixa(caixaAtualizado);

    // Adiciona movimento no extrato do caixa
    const movVenda: MovimentoCaixa = {
      id: `mov_venda_${Date.now()}_${venda.id}`,
      caixaId: caixa.id,
      tipo: 'venda',
      valor: valorVenda,
      descricao: `Venda #${venda.numero} — ${venda.clienteNome || 'Consumidor'} (${venda.formaPagamento.toUpperCase()})`,
      formaPagamento: venda.formaPagamento,
      usuarioId: usuario.id,
      usuarioNome: usuario.name,
      timestamp: new Date().toISOString(),
    };
    await this.adicionarMovimento(movVenda);
  }

  /**
   * Integração Automática de Recebimento de Ordem de Serviço no Caixa
   */
  static async registrarRecebimentoOS(
    ordem: OrdemServico,
    formaPagamento: FormaPagamento,
    valor: number,
    usuario: { id: string; name: string }
  ): Promise<void> {
    const caixa = await this.getCaixaHoje();
    const isDinheiro = formaPagamento === 'dinheiro';
    const deltaDinheiro = isDinheiro ? valor : 0;

    const vendasDinheiro = (caixa.vendasDinheiro || 0) + deltaDinheiro;
    const vendasPix = (caixa.vendasPix || 0) + (formaPagamento === 'pix' ? valor : 0);
    const vendasDebito = (caixa.vendasDebito || 0) + (formaPagamento === 'cartao_debito' ? valor : 0);
    const vendasCredito = (caixa.vendasCredito || 0) + (formaPagamento === 'cartao_credito' ? valor : 0);
    const vendasTransferencia = (caixa.vendasTransferencia || 0) + (formaPagamento === 'transferencia' ? valor : 0);
    const vendasOutros = (caixa.vendasOutros || 0) + (!['dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'transferencia'].includes(formaPagamento) ? valor : 0);

    const caixaAtualizado: Caixa = {
      ...caixa,
      totalVendido: (caixa.totalVendido || 0) + valor,
      totalEntradas: (caixa.totalEntradas || 0) + valor,
      saldoFinalCalculado: (caixa.saldoFinalCalculado || 0) + deltaDinheiro,
      vendasDinheiro,
      vendasPix,
      vendasDebito,
      vendasCredito,
      vendasTransferencia,
      vendasOutros,
    };

    await this.salvarCaixa(caixaAtualizado);

    const movOS: MovimentoCaixa = {
      id: `mov_os_${Date.now()}_${ordem.id}`,
      caixaId: caixa.id,
      tipo: 'ordem_servico',
      valor,
      descricao: `Recebimento ${ordem.numeroOS} — ${ordem.clienteNome} (${formaPagamento.toUpperCase()})`,
      formaPagamento,
      usuarioId: usuario.id,
      usuarioNome: usuario.name,
      timestamp: new Date().toISOString(),
    };
    await this.adicionarMovimento(movOS);
  }

  /**
   * Estorno de Venda no Caixa (ao cancelar uma venda):
   */
  static async estornarVendaDoCaixa(
    venda: Venda,
    motivo: string,
    usuario: { id: string; name: string }
  ): Promise<void> {
    const caixa = await this.getCaixaHoje();
    const valorVenda = venda.total;

    let deltaDinheiro = 0;
    let deltaPix = 0;
    let deltaDebito = 0;
    let deltaCredito = 0;
    let deltaTransferencia = 0;
    let deltaOutros = 0;

    if (venda.formaPagamento === 'misto' && venda.pagamentoMistoDetalhes && venda.pagamentoMistoDetalhes.length > 0) {
      for (const parcela of venda.pagamentoMistoDetalhes) {
        const val = Number(parcela.valor) || 0;
        if (parcela.forma === 'dinheiro') deltaDinheiro += val;
        else if (parcela.forma === 'pix') deltaPix += val;
        else if (parcela.forma === 'cartao_debito') deltaDebito += val;
        else if (parcela.forma === 'cartao_credito') deltaCredito += val;
        else if (parcela.forma === 'transferencia') deltaTransferencia += val;
        else deltaOutros += val;
      }
    } else {
      if (venda.formaPagamento === 'dinheiro') deltaDinheiro = valorVenda;
      else if (venda.formaPagamento === 'pix') deltaPix = valorVenda;
      else if (venda.formaPagamento === 'cartao_debito') deltaDebito = valorVenda;
      else if (venda.formaPagamento === 'cartao_credito') deltaCredito = valorVenda;
      else if (venda.formaPagamento === 'transferencia') deltaTransferencia = valorVenda;
      else deltaOutros = valorVenda;
    }

    const caixaAtualizado: Caixa = {
      ...caixa,
      totalVendido: Math.max(0, (caixa.totalVendido || 0) - valorVenda),
      totalEntradas: Math.max(0, caixa.totalEntradas - valorVenda),
      saldoFinalCalculado: Math.max(0, caixa.saldoFinalCalculado - deltaDinheiro),
      vendasDinheiro: Math.max(0, (caixa.vendasDinheiro || 0) - deltaDinheiro),
      vendasPix: Math.max(0, (caixa.vendasPix || 0) - deltaPix),
      vendasDebito: Math.max(0, (caixa.vendasDebito || 0) - deltaDebito),
      vendasCredito: Math.max(0, (caixa.vendasCredito || 0) - deltaCredito),
      vendasTransferencia: Math.max(0, (caixa.vendasTransferencia || 0) - deltaTransferencia),
      vendasOutros: Math.max(0, (caixa.vendasOutros || 0) - deltaOutros),
    };

    await this.salvarCaixa(caixaAtualizado);

    // Adiciona movimento de estorno
    const movEstorno: MovimentoCaixa = {
      id: `mov_estorno_${Date.now()}`,
      caixaId: caixa.id,
      tipo: 'estorno',
      valor: valorVenda,
      descricao: `Cancelamento da Venda #${venda.numero}: ${motivo}`,
      formaPagamento: venda.formaPagamento,
      usuarioId: usuario.id,
      usuarioNome: usuario.name,
      timestamp: new Date().toISOString(),
    };
    await this.adicionarMovimento(movEstorno);

    // Auditoria
    await AuditService.registrar({
      usuario: usuario.name,
      usuarioId: usuario.id,
      modulo: 'Caixa',
      tipoAcao: 'Cancelamento',
      registroAfetado: `Caixa (${caixa.data})`,
      informacaoAnterior: `Total Vendido: R$ ${(caixa.totalVendido || 0).toFixed(2)}`,
      informacaoNova: `Estorno de R$ ${valorVenda.toFixed(2)} (Venda #${venda.numero})`,
      descricao: `Estorno referente ao cancelamento da Venda #${venda.numero}. Motivo: ${motivo}.`,
    });
  }

  /**
   * Fechamento de Caixa:
   * "Ao fechar mostrar:
   * Troco inicial, Vendas em dinheiro, PIX, Débito, Crédito, Transferência, Outros,
   * Total vendido, Entradas adicionais, Saídas, Valor esperado em caixa,
   * Valor contado manualmente, Diferença (Diferença: R$ 0,00 ou Falta: R$ X ou Sobra: R$ X),
   * Valor que permanecerá para troco, Observações.
   * Depois do fechamento, gerar um resumo imprimível.
   * O fechamento não deverá poder ser simplesmente apagado."
   */
  static async fecharCaixa(
    dados: {
      valorContado: number;
      valorPermaneceraTroco: number;
      observacoes?: string;
    },
    usuario: { id: string; name: string }
  ): Promise<Caixa> {
    const caixa = await this.getCaixaHoje();

    // Valor esperado em dinheiro físico na gaveta:
    // Troco Inicial + Vendas em Dinheiro + Entradas Adicionais (Suprimentos) - Saídas (Sangrias)
    const trocoInicial = caixa.saldoInicial || 0;
    const vendasDinheiro = caixa.vendasDinheiro || 0;
    const entradasAdicionais = caixa.entradasAdicionais || 0;
    const saidas = caixa.totalSaidas || 0;

    const valorEsperadoGaveta = trocoInicial + vendasDinheiro + entradasAdicionais - saidas;
    const diferenca = Number((dados.valorContado - valorEsperadoGaveta).toFixed(2));

    let tipoDiferenca: 'exato' | 'falta' | 'sobra' = 'exato';
    if (diferenca < 0) tipoDiferenca = 'falta';
    else if (diferenca > 0) tipoDiferenca = 'sobra';

    const agora = new Date();
    const { data: dataFormatada, horario } = formatDataBrasil(agora);

    const caixaFechado: Caixa = {
      ...caixa,
      status: 'fechado',
      fechadoEm: agora.toISOString(),
      valorEsperadoCaixa: valorEsperadoGaveta,
      valorContado: dados.valorContado,
      saldoFinalInformado: dados.valorContado,
      diferenca: Math.abs(diferenca),
      tipoDiferenca,
      valorPermaneceraTroco: dados.valorPermaneceraTroco,
      observacoes: dados.observacoes || 'Fechamento de turno concluído.',
    };

    await this.salvarCaixa(caixaFechado);

    // Movimento de fechamento no extrato
    const movFechamento: MovimentoCaixa = {
      id: `mov_fechamento_${Date.now()}`,
      caixaId: caixa.id,
      tipo: 'fechamento',
      valor: dados.valorContado,
      descricao: `Fechamento do caixa conferido por ${usuario.name}. Diferença: R$ ${diferenca.toFixed(2)} (${tipoDiferenca.toUpperCase()})`,
      formaPagamento: 'dinheiro',
      usuarioId: usuario.id,
      usuarioNome: usuario.name,
      timestamp: agora.toISOString(),
    };
    await this.adicionarMovimento(movFechamento);

    // Auditoria Obrigatória do Fechamento
    const descDiferenca =
      tipoDiferenca === 'exato'
        ? 'Diferença: R$ 0,00 (Exato)'
        : tipoDiferenca === 'falta'
        ? `Falta: R$ ${Math.abs(diferenca).toFixed(2)}`
        : `Sobra: R$ ${Math.abs(diferenca).toFixed(2)}`;

    await AuditService.registrar({
      usuario: usuario.name,
      usuarioId: usuario.id,
      modulo: 'Caixa',
      tipoAcao: 'Fechamento',
      registroAfetado: `Caixa (${caixa.data})`,
      informacaoAnterior: 'Status: Aberto',
      informacaoNova: `Esperado: R$ ${valorEsperadoGaveta.toFixed(2)} | Contado: R$ ${dados.valorContado.toFixed(2)} | ${descDiferenca}`,
      descricao: `Fechamento definitivo de caixa efetuado em ${dataFormatada} às ${horario} por ${usuario.name}. ${descDiferenca}. Valor que permanecerá para troco: R$ ${dados.valorPermaneceraTroco.toFixed(2)}.`,
    });

    return caixaFechado;
  }

  /**
   * Obtém o caixa aberto atual (se houver)
   */
  static async getCaixaAberto(): Promise<Caixa | null> {
    const caixa = await this.getCaixaHoje();
    if (caixa && caixa.status === 'aberto') {
      return caixa;
    }
    return null;
  }

  /**
   * Registra uma sangria ou saída financeira do caixa aberto
   */
  static async registrarSangria(
    caixaId: string,
    valor: number,
    motivo: string,
    usuarioNome: string
  ): Promise<void> {
    const caixa = await this.getCaixaHoje();
    const novoTotalSaidas = (caixa.totalSaidas || 0) + valor;
    const novoSaldoFinal = Math.max(0, caixa.saldoFinalCalculado - valor);

    const caixaAtualizado: Caixa = {
      ...caixa,
      totalSaidas: novoTotalSaidas,
      saidasTotal: novoTotalSaidas,
      saldoFinalCalculado: novoSaldoFinal,
    };

    await this.salvarCaixa(caixaAtualizado);

    const movSangria: MovimentoCaixa = {
      id: `mov_sangria_${Date.now()}`,
      caixaId,
      tipo: 'sangria',
      valor,
      descricao: motivo,
      formaPagamento: 'dinheiro',
      usuarioId: 'usr_auto',
      usuarioNome,
      timestamp: new Date().toISOString(),
    };
    await this.adicionarMovimento(movSangria);
  }
}
