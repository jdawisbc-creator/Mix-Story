/**
 * Coleção Central de Auditoria do Sistema
 * Mix Variedades Store
 * 
 * SEGURANÇA DO HISTÓRICO:
 * O histórico NÃO poderá ser editado nem apagado manualmente.
 * Ele funciona como registro de auditoria imutável do sistema.
 * Apenas o próprio sistema insere registros automaticamente (append-only).
 */

import { DatabaseService } from './databaseService';
import type { LogAuditoria, AuditModulo, AuditTipoAcao } from '../types';

const COLLECTION_NAME = 'historico_alteracoes';

// Helper para formatar data DD/MM/AAAA e horário HH:mm no fuso de Brasília (pt-BR)
export const formatDataBrasil = (date: Date = new Date()): { data: string; horario: string } => {
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();

  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');

  return {
    data: `${dia}/${mes}/${ano}`,
    horario: `${horas}:${minutos}`,
  };
};

// Registros iniciais do histórico para demonstração, incluindo o exemplo da especificação
const INITIAL_LOGS: LogAuditoria[] = [
  {
    id: 'log_spec_exemplo_01',
    timestamp: '2026-09-16T17:32:00.000Z',
    data: '16/09/2026',
    horario: '14:32',
    usuario: 'Jhonatan',
    usuarioId: 'usr_jhonatan_01',
    modulo: 'Estoque',
    tipoAcao: 'Alteração de Preço',
    registroAfetado: 'Caneta Azul',
    informacaoAnterior: 'R$ 4,00',
    informacaoNova: 'R$ 5,00',
    descricao: 'Preço de venda ajustado de R$ 4,00 para R$ 5,00.',
    usuarioNome: 'Jhonatan',
    acao: 'Alteração de Preço',
  },
  {
    id: 'log_seed_02',
    timestamp: '2026-09-16T16:15:00.000Z',
    data: '16/09/2026',
    horario: '13:15',
    usuario: 'Carla Santos',
    usuarioId: 'usr_carla_02',
    modulo: 'Caixa',
    tipoAcao: 'Abertura',
    registroAfetado: 'Caixa do Turno Tarde',
    informacaoAnterior: 'Caixa Fechado',
    informacaoNova: 'Fundo Inicial: R$ 200,00 em espécie',
    descricao: 'Abertura do caixa da tarde com conferência de troco.',
    usuarioNome: 'Carla Santos',
    acao: 'Abertura',
  },
  {
    id: 'log_seed_03',
    timestamp: '2026-09-16T15:40:00.000Z',
    data: '16/09/2026',
    horario: '12:40',
    usuario: 'Lucas Oliveira',
    usuarioId: 'usr_lucas_03',
    modulo: 'Ordens de Serviço',
    tipoAcao: 'Mudança de Status',
    registroAfetado: 'O.S. #108 — Smartphone Moto G54',
    informacaoAnterior: 'Status: Em Andamento',
    informacaoNova: 'Status: Concluído (Troca de conector)',
    descricao: 'Serviço concluído e testado. Aparelho pronto para retirada.',
    usuarioNome: 'Lucas Oliveira',
    acao: 'Mudança de Status',
  },
  {
    id: 'log_seed_04',
    timestamp: '2026-09-16T14:10:00.000Z',
    data: '16/09/2026',
    horario: '11:10',
    usuario: 'Jhonatan',
    usuarioId: 'usr_jhonatan_01',
    modulo: 'Gastos',
    tipoAcao: 'Criação',
    registroAfetado: 'Reposição de Sacolas e Bobinas Térmicas',
    informacaoAnterior: 'Inexistente',
    informacaoNova: 'Valor: R$ 145,00 (Pago via PIX)',
    descricao: 'Registro de despesa operacional de materiais de balcão.',
    usuarioNome: 'Jhonatan',
    acao: 'Criação',
  },
  {
    id: 'log_seed_05',
    timestamp: '2026-09-16T11:00:00.000Z',
    data: '16/09/2026',
    horario: '08:00',
    usuario: 'Jhonatan',
    usuarioId: 'usr_jhonatan_01',
    modulo: 'Autenticação',
    tipoAcao: 'Login',
    registroAfetado: 'Sessão do Terminal Principal',
    informacaoAnterior: 'Terminal desconectado',
    informacaoNova: 'Autenticado com sucesso como Jhonatan',
    descricao: 'Login efetuado no início da jornada.',
    usuarioNome: 'Jhonatan',
    acao: 'Login',
  },
];

export interface RegistrarAuditoriaParams {
  usuario: string;
  usuarioId: string;
  modulo: AuditModulo | string;
  tipoAcao: AuditTipoAcao | string;
  registroAfetado: string;
  informacaoAnterior?: string | null;
  informacaoNova?: string | null;
  descricao?: string;
  data?: string;
  horario?: string;
  detalhes?: Record<string, unknown>;
}

export class AuditService {
  /**
   * Registra automaticamente uma ação na coleção central de auditoria
   * Este método é append-only: não permite alteração nem exclusão posterior
   */
  static async registrar(params: RegistrarAuditoriaParams): Promise<LogAuditoria> {
    const now = new Date();
    const formatted = formatDataBrasil(now);

    const log: LogAuditoria = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now.toISOString(),
      data: params.data || formatted.data,
      horario: params.horario || formatted.horario,
      usuario: params.usuario,
      usuarioId: params.usuarioId,
      modulo: params.modulo,
      tipoAcao: params.tipoAcao,
      registroAfetado: params.registroAfetado,
      informacaoAnterior: params.informacaoAnterior ?? null,
      informacaoNova: params.informacaoNova ?? null,
      descricao:
        params.descricao ||
        `${params.tipoAcao} em ${params.modulo} (${params.registroAfetado})`,
      detalhes: params.detalhes,
      // Legado
      usuarioNome: params.usuario,
      acao: params.tipoAcao,
    };

    await DatabaseService.setDocument<LogAuditoria>(COLLECTION_NAME, log.id, log);
    return log;
  }

  /**
   * Método legado para compatibilidade com chamadas existentes
   */
  static async log(
    usuarioId: string,
    usuarioNome: string,
    modulo: string,
    acao: any,
    descricao: string,
    detalhes?: Record<string, unknown>
  ): Promise<LogAuditoria> {
    return this.registrar({
      usuarioId,
      usuario: usuarioNome,
      modulo,
      tipoAcao: acao,
      registroAfetado: modulo,
      informacaoAnterior: null,
      informacaoNova: descricao,
      descricao,
      detalhes,
    });
  }

  /**
   * Recupera todos os registros de auditoria
   * Organizados estritamente do mais recente para o mais antigo
   */
  static async getLogs(): Promise<LogAuditoria[]> {
    const list = await DatabaseService.getCollection<LogAuditoria>(COLLECTION_NAME);
    if (list.length === 0) {
      for (const item of INITIAL_LOGS) {
        await DatabaseService.setDocument<LogAuditoria>(COLLECTION_NAME, item.id, item);
      }
      return [...INITIAL_LOGS].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    return list.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}
