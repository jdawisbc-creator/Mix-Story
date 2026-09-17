import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { AuditService } from '../services/auditService';
import { UserService } from '../services/userService';
import { useToast } from '../context/ToastContext';
import type { LogAuditoria, User } from '../types';
import {
  History,
  RefreshCw,
  Shield,
  Clock,
  User as UserIcon,
  Search,
  Filter,
  XCircle,
  Eye,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const HistoricoPage: React.FC = () => {
  const { success } = useToast();
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [filterUsuario, setFilterUsuario] = useState('');
  const [filterModulo, setFilterModulo] = useState('');
  const [filterAcao, setFilterAcao] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Registro selecionado para inspeção detalhada
  const [selectedLog, setSelectedLog] = useState<LogAuditoria | null>(null);

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const [logsData, usersData] = await Promise.all([
        AuditService.getLogs(),
        UserService.getUsers(),
      ]);
      setLogs(logsData);
      setUsers(usersData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleRefresh = async () => {
    await carregarDados();
    success('Auditoria Atualizada', 'Todos os registros do sistema foram recarregados.');
  };

  const handleLimparFiltros = () => {
    setFilterUsuario('');
    setFilterModulo('');
    setFilterAcao('');
    setFilterDataInicio('');
    setFilterDataFim('');
    setSearchTerm('');
  };

  // Módulos disponíveis para filtro
  const modulosDisponiveis = [
    'Estoque',
    'Produtos',
    'Caixa',
    'Vendas',
    'Gastos',
    'Promoções',
    'Ordens de Serviço',
    'Postagens',
    'Configurações',
    'Usuários',
    'Autenticação',
  ];

  // Ações disponíveis para filtro
  const acoesDisponiveis = [
    'Alteração de Preço',
    'Criação',
    'Edição',
    'Exclusão',
    'Entrada de Estoque',
    'Saída de Estoque',
    'Abertura',
    'Entrada',
    'Saída',
    'Fechamento',
    'Cancelamento',
    'Encerramento',
    'Mudança de Status',
    'Pagamento',
    'Agendamento',
    'Alteração de Configuração',
    'Ativação de Usuário',
    'Desativação de Usuário',
    'Login',
    'Logout',
  ];

  // Filtragem e ordenação estrita (mais recente -> mais antigo)
  const logsFiltrados = useMemo(() => {
    return logs
      .filter((log) => {
        // Filtro de Usuário
        if (filterUsuario && log.usuario !== filterUsuario && log.usuarioId !== filterUsuario) {
          return false;
        }

        // Filtro de Módulo
        if (filterModulo && log.modulo !== filterModulo) {
          return false;
        }

        // Filtro de Ação
        if (filterAcao && log.tipoAcao !== filterAcao && log.acao !== filterAcao) {
          return false;
        }

        // Filtro de Data Inicial
        if (filterDataInicio) {
          const logTime = new Date(log.timestamp).getTime();
          const startTime = new Date(`${filterDataInicio}T00:00:00`).getTime();
          if (logTime < startTime) return false;
        }

        // Filtro de Data Final
        if (filterDataFim) {
          const logTime = new Date(log.timestamp).getTime();
          const endTime = new Date(`${filterDataFim}T23:59:59`).getTime();
          if (logTime > endTime) return false;
        }

        // Pesquisa por texto
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matches =
            log.usuario.toLowerCase().includes(term) ||
            log.modulo.toLowerCase().includes(term) ||
            (log.tipoAcao && log.tipoAcao.toLowerCase().includes(term)) ||
            (log.registroAfetado && log.registroAfetado.toLowerCase().includes(term)) ||
            (log.informacaoAnterior && log.informacaoAnterior.toLowerCase().includes(term)) ||
            (log.informacaoNova && log.informacaoNova.toLowerCase().includes(term)) ||
            (log.descricao && log.descricao.toLowerCase().includes(term));

          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, filterUsuario, filterModulo, filterAcao, filterDataInicio, filterDataFim, searchTerm]);

  // Função para estilizar o badge do módulo
  const getModuloBadge = (mod: string) => {
    switch (mod) {
      case 'Estoque':
      case 'Produtos':
        return <Badge variant="purple" size="sm">Estoque</Badge>;
      case 'Caixa':
      case 'Vendas':
        return <Badge variant="orange" size="sm">{mod}</Badge>;
      case 'Ordens de Serviço':
        return <Badge variant="purple" size="sm">O.S.</Badge>;
      case 'Gastos':
        return <Badge variant="danger" size="sm">Gastos</Badge>;
      case 'Promoções':
        return <Badge variant="success" size="sm">Promoções</Badge>;
      case 'Postagens':
        return <Badge variant="neutral" size="sm">Redes</Badge>;
      case 'Usuários':
      case 'Autenticação':
        return <Badge variant="purple" size="sm">{mod}</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{mod}</Badge>;
    }
  };

  // Função para estilizar o badge de ação
  const getAcaoBadge = (acao: string) => {
    if (acao.includes('Exclusão') || acao.includes('Cancelamento') || acao.includes('Encerramento')) {
      return <Badge variant="danger" size="sm">{acao}</Badge>;
    }
    if (acao.includes('Criação') || acao.includes('Abertura') || acao.includes('Ativação')) {
      return <Badge variant="success" size="sm">{acao}</Badge>;
    }
    if (acao.includes('Preço') || acao.includes('Edição') || acao.includes('Status')) {
      return <Badge variant="orange" size="sm">{acao}</Badge>;
    }
    return <Badge variant="neutral" size="sm">{acao}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <PageHeader
        title="HISTÓRICO DE ALTERAÇÕES"
        description="Coleção central de auditoria e rastreabilidade da Mix Variedades Store. Registro permanente das ações realizadas por cada usuário."
        actions={
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Registro Imutável do Sistema</span>
            </div>
            <Button
              variant="secondary"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={handleRefresh}
              isLoading={isLoading}
            >
              Atualizar
            </Button>
          </div>
        }
      />

      {/* Cartão Informativo de Segurança */}
      <div className="p-4 rounded-2xl bg-[#14141E] border border-[#262638] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7B2CF6]/20 border border-[#7B2CF6]/40 flex items-center justify-center text-[#A76BFF]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Segurança & Governança de Auditoria
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#252536] text-zinc-300">
                Append-Only
              </span>
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              O histórico não pode ser editado nem apagado manualmente. Apenas o próprio sistema registra automaticamente cada operação.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
          <div className="text-right">
            <span className="text-zinc-400 block text-[10px] uppercase">Total Registrado</span>
            <span className="text-white font-bold text-sm">{logs.length} ações</span>
          </div>
          <div className="h-7 w-px bg-[#262638]" />
          <div className="text-right">
            <span className="text-zinc-400 block text-[10px] uppercase">Exibindo</span>
            <span className="text-[#FF8A00] font-bold text-sm">{logsFiltrados.length}</span>
          </div>
        </div>
      </div>

      {/* Painel de Filtros Avançados */}
      <div className="p-5 rounded-2xl bg-[#12121A] border border-[#222230] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#FF8A00]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Filtros do Histórico
            </span>
          </div>
          {(filterUsuario || filterModulo || filterAcao || filterDataInicio || filterDataFim || searchTerm) && (
            <button
              onClick={handleLimparFiltros}
              className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Filtro: Pesquisa por Texto */}
          <div className="lg:col-span-2">
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
              Pesquisar por texto
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Produto, registro, usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#191924] border border-[#2B2B3E] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7B2CF6]"
              />
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-3" />
            </div>
          </div>

          {/* Filtro: Usuário */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
              Usuário
            </label>
            <select
              value={filterUsuario}
              onChange={(e) => setFilterUsuario(e.target.value)}
              className="w-full h-9 px-2.5 rounded-xl bg-[#191924] border border-[#2B2B3E] text-xs text-white focus:outline-none focus:border-[#7B2CF6] cursor-pointer"
            >
              <option value="">Todos os usuários</option>
              {users.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro: Módulo */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
              Módulo
            </label>
            <select
              value={filterModulo}
              onChange={(e) => setFilterModulo(e.target.value)}
              className="w-full h-9 px-2.5 rounded-xl bg-[#191924] border border-[#2B2B3E] text-xs text-white focus:outline-none focus:border-[#7B2CF6] cursor-pointer"
            >
              <option value="">Todos os módulos</option>
              {modulosDisponiveis.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro: Data Inicial */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={filterDataInicio}
              onChange={(e) => setFilterDataInicio(e.target.value)}
              className="w-full h-9 px-2 rounded-xl bg-[#191924] border border-[#2B2B3E] text-xs text-white focus:outline-none focus:border-[#7B2CF6] cursor-pointer"
            />
          </div>

          {/* Filtro: Data Final */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={filterDataFim}
              onChange={(e) => setFilterDataFim(e.target.value)}
              className="w-full h-9 px-2 rounded-xl bg-[#191924] border border-[#2B2B3E] text-xs text-white focus:outline-none focus:border-[#7B2CF6] cursor-pointer"
            />
          </div>
        </div>

        {/* Linha secundária de filtro: Tipo da Ação */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-zinc-400 mr-1">Filtrar Ação:</span>
          <button
            onClick={() => setFilterAcao('')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterAcao === ''
                ? 'bg-[#7B2CF6] text-white'
                : 'bg-[#191924] text-zinc-400 hover:text-white border border-[#2B2B3E]'
            }`}
          >
            Todas as Ações
          </button>
          {['Alteração de Preço', 'Criação', 'Edição', 'Exclusão', 'Abertura', 'Fechamento', 'Mudança de Status', 'Login'].map(
            (act) => (
              <button
                key={act}
                onClick={() => setFilterAcao(act === filterAcao ? '' : act)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterAcao === act
                    ? 'bg-[#FF8A00] text-black font-bold'
                    : 'bg-[#191924] text-zinc-400 hover:text-white border border-[#2B2B3E]'
                }`}
              >
                {act}
              </button>
            )
          )}
        </div>
      </div>

      {/* Tabela Central de Auditoria */}
      <div className="rounded-2xl border border-[#222230] bg-[#121218] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222230] bg-[#161622] text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4">Data / Horário</th>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Registro Afetado</th>
                <th className="py-3 px-4">Antes x Depois</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D1D28] text-xs">
              {logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold text-zinc-400">Nenhum registro encontrado</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Tente alterar ou limpar os filtros aplicados.
                    </p>
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-[#181824]/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    {/* Data / Horário */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-zinc-200">
                        <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="font-semibold text-white">{log.data}</span>
                        <span className="text-zinc-500">—</span>
                        <span className="text-zinc-300 font-bold">{log.horario}</span>
                      </div>
                    </td>

                    {/* Usuário Responsável */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#7B2CF6]/20 border border-[#7B2CF6]/40 flex items-center justify-center text-[#A76BFF] font-bold text-[10px]">
                          {log.usuario.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{log.usuario}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{log.usuarioId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Módulo */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getModuloBadge(log.modulo)}
                    </td>

                    {/* Tipo da Ação */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getAcaoBadge(log.tipoAcao || log.acao || 'Ação')}
                    </td>

                    {/* Registro Afetado */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-zinc-100 max-w-xs truncate">
                        {log.registroAfetado}
                      </p>
                      {log.descricao && (
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          {log.descricao}
                        </p>
                      )}
                    </td>

                    {/* Comparativo Antes x Depois */}
                    <td className="py-3.5 px-4">
                      {log.informacaoAnterior || log.informacaoNova ? (
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          {log.informacaoAnterior && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 line-through">
                              {log.informacaoAnterior}
                            </span>
                          )}
                          {log.informacaoAnterior && log.informacaoNova && (
                            <ArrowRight className="w-3 h-3 text-zinc-500 shrink-0" />
                          )}
                          {log.informacaoNova && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                              {log.informacaoNova}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-[11px] italic">Sem alteração direta de campo</span>
                      )}
                    </td>

                    {/* Botão de Ver Detalhes */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 rounded-lg bg-[#1D1D28] hover:bg-[#7B2CF6]/30 text-zinc-300 hover:text-white border border-[#2E2E40] transition-colors cursor-pointer"
                        title="Inspecionar Registro Completo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE INSPEÇÃO DETALHADA DO REGISTRO (Especificação Exata) */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="REGISTRO DE AUDITORIA"
        size="md"
      >
        {selectedLog && (
          <div className="space-y-4 text-sm">
            {/* Cabeçalho do Cartão de Auditoria */}
            <div className="p-4 rounded-2xl bg-[#161622] border border-[#2A2A3E] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Data e Horário
                </span>
                <p className="text-base font-black text-white font-mono mt-0.5">
                  {selectedLog.data} — {selectedLog.horario}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  ID do Registro
                </span>
                <span className="text-xs font-mono text-zinc-300 bg-[#202030] px-2 py-1 rounded-md border border-[#2F2F44]">
                  {selectedLog.id}
                </span>
              </div>
            </div>

            {/* Grid dos Campos Principais */}
            <div className="grid grid-cols-2 gap-3">
              {/* Usuário */}
              <div className="p-3.5 rounded-xl bg-[#181824] border border-[#262638]">
                <span className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Usuário:
                </span>
                <p className="text-sm font-bold text-white flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#A76BFF]" />
                  {selectedLog.usuario}
                </p>
                <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                  ID: {selectedLog.usuarioId}
                </span>
              </div>

              {/* Módulo */}
              <div className="p-3.5 rounded-xl bg-[#181824] border border-[#262638]">
                <span className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Módulo:
                </span>
                <p className="text-sm font-bold text-white">
                  {selectedLog.modulo}
                </p>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  {getModuloBadge(selectedLog.modulo)}
                </span>
              </div>

              {/* Ação */}
              <div className="p-3.5 rounded-xl bg-[#181824] border border-[#262638]">
                <span className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Ação:
                </span>
                <p className="text-sm font-bold text-[#FF8A00]">
                  {selectedLog.tipoAcao || selectedLog.acao}
                </p>
              </div>

              {/* Registro / Produto Afetado */}
              <div className="p-3.5 rounded-xl bg-[#181824] border border-[#262638]">
                <span className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Registro / Produto:
                </span>
                <p className="text-sm font-bold text-white truncate" title={selectedLog.registroAfetado}>
                  {selectedLog.registroAfetado}
                </p>
              </div>
            </div>

            {/* Comparativo de Alteração: Antes vs Depois (Exemplo Caneta Azul R$ 4 -> R$ 5) */}
            <div className="p-4 rounded-2xl bg-[#151520] border border-[#29293C] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Comparativo de Valores
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Auditoria Central</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                  <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                    Antes:
                  </span>
                  <p className="text-sm font-mono font-bold text-rose-200 break-words">
                    {selectedLog.informacaoAnterior || '— (Inexistente)'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    Depois:
                  </span>
                  <p className="text-sm font-mono font-bold text-emerald-200 break-words">
                    {selectedLog.informacaoNova || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Descrição Detalhada da Operação */}
            {selectedLog.descricao && (
              <div className="p-3.5 rounded-xl bg-[#181824] border border-[#262638]">
                <span className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Descrição Registrada pelo Sistema:
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {selectedLog.descricao}
                </p>
              </div>
            )}

            {/* Nota de Segurança Imutável */}
            <div className="p-3 rounded-xl bg-[#161622] border border-[#262638] flex items-center gap-2.5 text-xs text-zinc-400">
              <Shield className="w-4 h-4 text-[#7B2CF6] shrink-0" />
              <span>
                Registro de auditoria criptograficamente verificado e armazenado de forma imutável. Não sujeito a edições manuais.
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedLog(null)}
              >
                Fechar Visualização
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
