import type { OrdemServico, ItemOrdemServico, StatusOSMix, AprovacaoClienteOS, FormaPagamento } from '../types';
import { AuditService } from './auditService';
import { CaixaService } from './caixaService';

const STORAGE_KEY = 'mix_ordens_servico_oficial_v2';

const MOCK_ORDENS_INICIAIS: OrdemServico[] = [
  {
    id: 'os_0001',
    numeroOS: 'OS #0001',
    numeroSequencial: 1,
    clienteNome: 'Mariana Silveira',
    clienteTelefone: '(11) 98452-1100',
    dataEntrada: '2026-09-14',
    dataEntrega: '2026-09-17',
    itens: [
      {
        item: 1,
        descricao: 'Impressão A4 Colorida Papel Fotográfico',
        quantidade: 15,
        valorUnitario: 3.5,
        valorTotal: 52.5,
      },
      {
        item: 2,
        descricao: 'Plastificação A4 Polaseal',
        quantidade: 15,
        valorUnitario: 4.0,
        valorTotal: 60.0,
      },
      {
        item: 3,
        descricao: 'Encadernação Espiral Capa Dura Mix',
        quantidade: 2,
        valorUnitario: 18.0,
        valorTotal: 36.0,
      },
    ],
    valorTotal: 148.5,
    formasPagamento: ['Pix', 'Cartão de Crédito'],
    outrosPagamento: '',
    aprovacaoCliente: 'SIM',
    observacoes: 'Cliente solicitou conferência de cores das fotos antes da plastificação. Pronto para retirada na quinta-feira.',
    status: 'em_producao',
    criadoPor: 'Jhonatan',
    criadoEm: '2026-09-14T10:30:00.000Z',
    atualizadoPor: 'Jhonatan',
    atualizadoEm: '2026-09-14T10:30:00.000Z',
  },
  {
    id: 'os_0002',
    numeroOS: 'OS #0002',
    numeroSequencial: 2,
    clienteNome: 'Carlos Eduardo Ramos',
    clienteTelefone: '(11) 97123-9988',
    dataEntrada: '2026-09-15',
    dataEntrega: '2026-09-16',
    itens: [
      {
        item: 1,
        descricao: 'Impressão 3D Personagem Colecionável (PLA Silk Roxo)',
        quantidade: 1,
        valorUnitario: 120.0,
        valorTotal: 120.0,
      },
      {
        item: 2,
        descricao: 'Pintura e Acabamento Manual Personalizado',
        quantidade: 1,
        valorUnitario: 60.0,
        valorTotal: 60.0,
      },
    ],
    valorTotal: 180.0,
    formasPagamento: ['Pix'],
    outrosPagamento: '',
    aprovacaoCliente: 'SIM',
    observacoes: 'Arquivo STL fornecido pelo cliente. Aplicado verniz protetor semi-brilho.',
    status: 'pronta',
    criadoPor: 'Jhonatan',
    criadoEm: '2026-09-15T14:15:00.000Z',
    atualizadoPor: 'Lucas Oliveira',
    atualizadoEm: '2026-09-16T09:00:00.000Z',
  },
];

export class OrdemServicoService {
  private static getStorage(): OrdemServico[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ORDENS_INICIAIS));
        return MOCK_ORDENS_INICIAIS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao ler ordens do localStorage:', e);
      return MOCK_ORDENS_INICIAIS;
    }
  }

  private static setStorage(ordens: OrdemServico[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ordens));
    } catch (e) {
      console.error('Erro ao salvar ordens no localStorage:', e);
    }
  }

  static formatarNumeroOS(sequencial: number): string {
    return `OS #${String(sequencial).padStart(4, '0')}`;
  }

  static async getOrdens(): Promise<OrdemServico[]> {
    const list = this.getStorage();
    // Ordena da mais recente (maior sequencial) para a mais antiga
    return list.sort((a, b) => b.numeroSequencial - a.numeroSequencial);
  }

  static async getOrdemById(id: string): Promise<OrdemServico | null> {
    const list = this.getStorage();
    return list.find((o) => o.id === id) || null;
  }

  static async getProximoNumero(): Promise<{ numeroOS: string; numeroSequencial: number }> {
    const list = this.getStorage();
    let maxSeq = 0;
    for (const os of list) {
      if (os.numeroSequencial && os.numeroSequencial > maxSeq) {
        maxSeq = os.numeroSequencial;
      }
    }
    const proximoSeq = maxSeq + 1;
    return {
      numeroSequencial: proximoSeq,
      numeroOS: this.formatarNumeroOS(proximoSeq),
    };
  }

  static calcularTotal(itens: ItemOrdemServico[]): number {
    return itens.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario || 0), 0);
  }

  static async salvarOrdem(
    dados: Partial<OrdemServico> & { id?: string },
    usuarioNome: string = 'Jhonatan',
    usuarioId?: string
  ): Promise<OrdemServico> {
    const list = this.getStorage();
    const agora = new Date().toISOString();

    const itensCalculados: ItemOrdemServico[] = (dados.itens || []).map((it, idx) => ({
      item: idx + 1,
      descricao: it.descricao || '',
      quantidade: Number(it.quantidade) || 1,
      valorUnitario: Number(it.valorUnitario) || 0,
      valorTotal: (Number(it.quantidade) || 1) * (Number(it.valorUnitario) || 0),
    }));

    const valorTotal = this.calcularTotal(itensCalculados);

    if (dados.id) {
      // Edição
      const index = list.findIndex((o) => o.id === dados.id);
      if (index === -1) {
        throw new Error('Ordem de serviço não encontrada para edição.');
      }

      const anterior = list[index];
      const atualizada: OrdemServico = {
        ...anterior,
        ...dados,
        itens: itensCalculados,
        valorTotal,
        atualizadoPor: usuarioNome,
        atualizadoEm: agora,
      };

      list[index] = atualizada;
      this.setStorage(list);

      // Auditoria
      await AuditService.registrar({
        usuario: usuarioNome,
        usuarioId: usuarioId || 'user_1',
        modulo: 'Ordens de Serviço',
        tipoAcao: 'Edição',
        registroAfetado: `${atualizada.numeroOS} - ${atualizada.clienteNome}`,
        informacaoAnterior: `Total: R$ ${anterior.valorTotal.toFixed(2)} | Status: ${anterior.status}`,
        informacaoNova: `Total: R$ ${atualizada.valorTotal.toFixed(2)} | Status: ${atualizada.status}`,
        descricao: `Edição dos dados da Ordem de Serviço ${atualizada.numeroOS} (${atualizada.clienteNome}).`,
      });

      return atualizada;
    } else {
      // Criação Nova
      const { numeroOS, numeroSequencial } = await this.getProximoNumero();

      const nova: OrdemServico = {
        id: `os_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        numeroOS,
        numeroSequencial,
        clienteNome: dados.clienteNome || '',
        clienteTelefone: dados.clienteTelefone || '',
        dataEntrada: dados.dataEntrada || agora.split('T')[0],
        dataEntrega: dados.dataEntrega || agora.split('T')[0],
        itens: itensCalculados,
        valorTotal,
        formasPagamento: dados.formasPagamento || ['Pix'],
        outrosPagamento: dados.outrosPagamento || '',
        aprovacaoCliente: dados.aprovacaoCliente || 'SIM',
        observacoes: dados.observacoes || '',
        status: dados.status || 'aguardando_aprovacao',
        criadoPor: usuarioNome,
        criadoEm: agora,
        atualizadoPor: usuarioNome,
        atualizadoEm: agora,
      };

      list.push(nova);
      this.setStorage(list);

      // Auditoria
      await AuditService.registrar({
        usuario: usuarioNome,
        usuarioId: usuarioId || 'user_1',
        modulo: 'Ordens de Serviço',
        tipoAcao: 'Criação',
        registroAfetado: `${nova.numeroOS} - ${nova.clienteNome}`,
        informacaoAnterior: 'Inexistente',
        informacaoNova: `Total: R$ ${nova.valorTotal.toFixed(2)} | Status: ${nova.status}`,
        descricao: `Criação da Ordem de Serviço ${nova.numeroOS} para "${nova.clienteNome}" com ${nova.itens.length} itens.`,
      });

      return nova;
    }
  }

  static async atualizarStatus(
    id: string,
    novoStatus: StatusOSMix,
    usuarioNome: string = 'Jhonatan',
    usuarioId?: string
  ): Promise<OrdemServico> {
    const list = this.getStorage();
    const index = list.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error('Ordem de serviço não encontrada.');
    }

    const anterior = list[index];
    const statusAntigo = anterior.status;

    const atualizada: OrdemServico = {
      ...anterior,
      status: novoStatus,
      atualizadoPor: usuarioNome,
      atualizadoEm: new Date().toISOString(),
    };

    list[index] = atualizada;
    this.setStorage(list);

    // Auditoria
    await AuditService.registrar({
      usuario: usuarioNome,
      usuarioId: usuarioId || 'user_1',
      modulo: 'Ordens de Serviço',
      tipoAcao: 'Edição',
      registroAfetado: `${atualizada.numeroOS} - ${atualizada.clienteNome}`,
      informacaoAnterior: `Status: ${statusAntigo}`,
      informacaoNova: `Status: ${novoStatus}`,
      descricao: `Status da OS ${atualizada.numeroOS} alterado de "${statusAntigo}" para "${novoStatus}".`,
    });

    return atualizada;
  }

  /**
   * FLUXO COMPLETO: REGISTRAR PAGAMENTO E ENTREGA DA ORDEM DE SERVIÇO
   * 1. Atualiza a OS para pago: true e opcionalmente status: 'entregue'
   * 2. Integração com o Caixa: alimenta o caixa do dia com a forma de pagamento informada
   * 3. Registra auditoria imutável detalhada
   */
  static async registrarPagamento(
    id: string,
    formaPagamento: FormaPagamento,
    valorPago: number,
    usuario: { id: string; name: string },
    marcarComoEntregue: boolean = true,
    trocoDevolvido: number = 0
  ): Promise<OrdemServico> {
    const list = this.getStorage();
    const index = list.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error('Ordem de serviço não encontrada.');
    }
    const os = list[index];
    const agora = new Date().toISOString();

    const atualizada: OrdemServico = {
      ...os,
      pago: true,
      dataPagamento: agora,
      formaPagamentoRecebida: formaPagamento,
      valorPago,
      trocoDevolvido,
      status: marcarComoEntregue ? 'entregue' : os.status,
      entregueEm: marcarComoEntregue ? agora : os.entregueEm,
      entreguePor: marcarComoEntregue ? usuario.name : os.entreguePor,
      atualizadoPor: usuario.name,
      atualizadoEm: agora,
    };

    list[index] = atualizada;
    this.setStorage(list);

    // 2. Integração com o Caixa do Turno
    try {
      await CaixaService.registrarRecebimentoOS(atualizada, formaPagamento, os.valorTotal, usuario);
    } catch (err) {
      console.warn('Não foi possível registrar recebimento da OS no caixa:', err);
    }

    // 3. Auditoria do Pagamento
    await AuditService.registrar({
      usuario: usuario.name,
      usuarioId: usuario.id,
      modulo: 'Ordens de Serviço',
      tipoAcao: 'Pagamento',
      registroAfetado: `${os.numeroOS} - ${os.clienteNome}`,
      informacaoAnterior: `Pendente (Status: ${os.status})`,
      informacaoNova: `Pago: R$ ${os.valorTotal.toFixed(2)} (${formaPagamento.toUpperCase()}) ${marcarComoEntregue ? '| Entregue ao Cliente' : ''}`,
      descricao: `Recebimento de R$ ${os.valorTotal.toFixed(2)} referente à ${os.numeroOS} (${os.clienteNome}) via ${formaPagamento.toUpperCase()}. Caixa alimentado.`,
    });

    return atualizada;
  }

  static async excluirOrdem(
    id: string,
    usuarioNome: string = 'Jhonatan',
    usuarioId?: string
  ): Promise<void> {
    const list = this.getStorage();
    const os = list.find((o) => o.id === id);
    if (!os) return;

    const filtradas = list.filter((o) => o.id !== id);
    this.setStorage(filtradas);

    // Auditoria
    await AuditService.registrar({
      usuario: usuarioNome,
      usuarioId: usuarioId || 'user_1',
      modulo: 'Ordens de Serviço',
      tipoAcao: 'Exclusão',
      registroAfetado: `${os.numeroOS} - ${os.clienteNome}`,
      informacaoAnterior: `Total: R$ ${os.valorTotal.toFixed(2)} | Status: ${os.status}`,
      informacaoNova: 'Excluída',
      descricao: `Exclusão permanente da Ordem de Serviço ${os.numeroOS} (${os.clienteNome}).`,
    });
  }
}
