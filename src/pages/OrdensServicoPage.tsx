import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { OrdemServicoService } from '../services/ordemServicoService';
import { ModeloOficialDocumento } from '../components/ordens/ModeloOficialDocumento';
import { FormularioOrdemModal } from '../components/ordens/FormularioOrdemModal';
import { VisualizarOrdemModal } from '../components/ordens/VisualizarOrdemModal';
import { ReceberPagamentoOSModal } from '../components/ordens/ReceberPagamentoOSModal';
import type { OrdemServico, ItemOrdemServico, StatusOSMix } from '../types';
import {
  Plus,
  Search,
  Printer,
  FileDown,
  Eye,
  Edit3,
  Trash2,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  FileSpreadsheet,
  Layers,
  Save,
  Coins,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  StatusOSMix,
  { label: string; variant: 'warning' | 'info' | 'purple' | 'success' | 'default' | 'danger' }
> = {
  aguardando_aprovacao: { label: 'Aguardando aprovação', variant: 'warning' },
  aprovada: { label: 'Aprovada', variant: 'info' },
  em_producao: { label: 'Em produção', variant: 'purple' },
  pronta: { label: 'Pronta', variant: 'success' },
  entregue: { label: 'Entregue', variant: 'default' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
};

export const OrdensServicoPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [abaAtiva, setAbaAtiva] = useState<'emissao_oficial' | 'historico'>('emissao_oficial');
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Estado da Ordem Ativa no Modelo Oficial Interativo
  const [ordemAtiva, setOrdemAtiva] = useState<Partial<OrdemServico>>({
    numeroOS: 'OS #....',
    clienteNome: '',
    clienteTelefone: '',
    dataEntrada: new Date().toISOString().split('T')[0],
    dataEntrega: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    itens: [
      { item: 1, descricao: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 },
    ],
    formasPagamento: ['Pix'],
    outrosPagamento: '',
    aprovacaoCliente: 'SIM',
    observacoes: '',
    status: 'aguardando_aprovacao',
  });

  const [salvandoEmissao, setSalvandoEmissao] = useState(false);

  // Modais de Apoio
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [ordemParaEditar, setOrdemParaEditar] = useState<OrdemServico | null>(null);

  const [isVisualizarModalOpen, setIsVisualizarModalOpen] = useState(false);
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemServico | null>(null);

  const [ordemParaExcluir, setOrdemParaExcluir] = useState<OrdemServico | null>(null);
  const [ordemParaImprimir, setOrdemParaImprimir] = useState<OrdemServico | null>(null);
  const [ordemParaPagar, setOrdemParaPagar] = useState<OrdemServico | null>(null);

  // Filtros de Pesquisa
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroDataEntrada, setFiltroDataEntrada] = useState('');
  const [filtroDataEntrega, setFiltroDataEntrega] = useState('');

  // Carregar ordens do armazenamento
  const carregarOrdens = async () => {
    try {
      setCarregando(true);
      const lista = await OrdemServicoService.getOrdens();
      setOrdens(lista);
      if (lista.length > 0 && !ordemAtiva.id) {
        // Inicializa com o próximo número sequencial
        const proximo = await OrdemServicoService.getProximoNumero();
        setOrdemAtiva((prev) => ({
          ...prev,
          numeroOS: proximo.numeroOS,
          numeroSequencial: proximo.numeroSequencial,
        }));
      }
    } catch (e: any) {
      error('Erro ao carregar', 'Não foi possível carregar as ordens de serviço.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarOrdens();
  }, []);

  // Iniciar Nova Ordem Limpa no Modelo Oficial
  const handleIniciarNovaOS = async () => {
    const proximo = await OrdemServicoService.getProximoNumero();
    const hoje = new Date().toISOString().split('T')[0];
    const entrega = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    setOrdemAtiva({
      numeroOS: proximo.numeroOS,
      numeroSequencial: proximo.numeroSequencial,
      clienteNome: '',
      clienteTelefone: '',
      dataEntrada: hoje,
      dataEntrega: entrega,
      itens: Array.from({ length: 10 }, (_, i) => ({
        item: i + 1,
        descricao: '',
        quantidade: i === 0 ? 1 : 0,
        valorUnitario: 0,
        valorTotal: 0,
      })),
      formasPagamento: ['Pix'],
      outrosPagamento: '',
      aprovacaoCliente: 'SIM',
      observacoes: '',
      status: 'aguardando_aprovacao',
    });
    setAbaAtiva('emissao_oficial');
  };

  // Carregar OS existente para o Modelo Oficial Interativo
  const handleCarregarNoModeloOficial = (os: OrdemServico) => {
    setOrdemAtiva({ ...os });
    setAbaAtiva('emissao_oficial');
  };

  // Atualização de campos na Ordem Oficial Interativa
  const handleCampoChange = (campo: keyof OrdemServico, valor: any) => {
    setOrdemAtiva((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleItemChange = (index: number, campo: keyof ItemOrdemServico, valor: any) => {
    setOrdemAtiva((prev) => {
      const novosItens = [...(prev.itens || [])];
      while (novosItens.length <= index) {
        novosItens.push({
          item: novosItens.length + 1,
          descricao: '',
          quantidade: 0,
          valorUnitario: 0,
          valorTotal: 0,
        });
      }
      const itemModificado = { ...novosItens[index], [campo]: valor };
      itemModificado.valorTotal =
        (Number(itemModificado.quantidade) || 0) * (Number(itemModificado.valorUnitario) || 0);
      novosItens[index] = itemModificado;
      return { ...prev, itens: novosItens };
    });
  };

  // Salvar Ordem do Modelo Oficial Interativo
  const handleSalvarModeloOficial = async (imprimirApos: boolean = false) => {
    if (!ordemAtiva.clienteNome?.trim()) {
      error('Nome do Cliente Obrigatório', 'Preencha o nome do cliente na folha oficial.');
      return;
    }

    const itensPreenchidos = (ordemAtiva.itens || []).filter(
      (it) => it.descricao && it.descricao.trim().length > 0
    );

    if (itensPreenchidos.length === 0) {
      error('Serviço Obrigatório', 'Preencha pelo menos um item na tabela de serviços.');
      return;
    }

    try {
      setSalvandoEmissao(true);
      const salva = await OrdemServicoService.salvarOrdem(
        {
          ...ordemAtiva,
          itens: itensPreenchidos,
        },
        user?.name || 'Jhonatan',
        user?.id
      );

      setOrdemAtiva(salva);
      await carregarOrdens();

      success(
        'Ordem de Serviço Salva',
        `${salva.numeroOS} registrada no padrão oficial Mix Variedades.`
      );

      if (imprimirApos) {
        setTimeout(() => {
          handleImprimir(salva);
        }, 250);
      }
    } catch (e: any) {
      error('Erro ao salvar', e.message || 'Não foi possível salvar a ordem.');
    } finally {
      setSalvandoEmissao(false);
    }
  };

  // Impressão Direta A4
  const handleImprimir = (os: OrdemServico | Partial<OrdemServico>) => {
    const osCompleta: OrdemServico = {
      id: os.id || 'temp_print',
      numeroOS: os.numeroOS || 'OS #0001',
      numeroSequencial: os.numeroSequencial || 1,
      clienteNome: os.clienteNome || 'Cliente',
      clienteTelefone: os.clienteTelefone || '',
      dataEntrada: os.dataEntrada || '',
      dataEntrega: os.dataEntrega || '',
      itens: os.itens || [],
      valorTotal:
        os.valorTotal ||
        (os.itens || []).reduce(
          (acc, i) => acc + (Number(i.quantidade) || 0) * (Number(i.valorUnitario) || 0),
          0
        ),
      formasPagamento: os.formasPagamento || ['Pix'],
      outrosPagamento: os.outrosPagamento || '',
      aprovacaoCliente: os.aprovacaoCliente || 'SIM',
      observacoes: os.observacoes || '',
      status: os.status || 'aguardando_aprovacao',
    };

    setOrdemParaImprimir(osCompleta);
    const originalTitle = document.title;
    document.title = `${osCompleta.numeroOS} - ${osCompleta.clienteNome} - Mix Variedades`;

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 150);
  };

  // Formatação de data
  const formatarData = (dataStr?: string) => {
    if (!dataStr) return '—';
    if (dataStr.includes('/')) return dataStr;
    const partes = dataStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  };

  // Filtros da Tabela
  const ordensFiltradas = useMemo(() => {
    return ordens.filter((os) => {
      const termo = termoBusca.toLowerCase().trim();
      const matchBusca =
        !termo ||
        os.numeroOS.toLowerCase().includes(termo) ||
        os.clienteNome.toLowerCase().includes(termo) ||
        os.clienteTelefone.toLowerCase().includes(termo);

      const matchStatus = filtroStatus === 'todos' || os.status === filtroStatus;
      const matchEntrada = !filtroDataEntrada || os.dataEntrada === filtroDataEntrada;
      const matchEntrega = !filtroDataEntrega || os.dataEntrega === filtroDataEntrega;

      return matchBusca && matchStatus && matchEntrada && matchEntrega;
    });
  }, [ordens, termoBusca, filtroStatus, filtroDataEntrada, filtroDataEntrega]);

  // Contadores
  const contadores = useMemo(() => {
    return {
      total: ordens.length,
      emProducao: ordens.filter((o) => o.status === 'em_producao').length,
      prontas: ordens.filter((o) => o.status === 'pronta').length,
      aguardando: ordens.filter((o) => o.status === 'aguardando_aprovacao').length,
      entregues: ordens.filter((o) => o.status === 'entregue').length,
    };
  }, [ordens]);

  // Exclusão
  const handleConfirmarExclusao = async () => {
    if (!ordemParaExcluir) return;
    try {
      await OrdemServicoService.excluirOrdem(
        ordemParaExcluir.id,
        user?.name || 'Jhonatan',
        user?.id
      );
      setOrdens((prev) => prev.filter((o) => o.id !== ordemParaExcluir.id));
      if (ordemAtiva.id === ordemParaExcluir.id) {
        handleIniciarNovaOS();
      }
      success('Ordem excluída', `${ordemParaExcluir.numeroOS} removida com sucesso.`);
      setOrdemParaExcluir(null);
    } catch (e: any) {
      error('Erro ao excluir', e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Módulo com Seletor de Modo */}
      <div className="no-print">
        <PageHeader
          title="Ordens de Serviço"
          subtitle="Modelo Oficial Mix Variedades Store — Preenchimento, emissão, impressão A4 e gestão."
        >
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleIniciarNovaOS}
              id="btn-nova-os-oficial"
              className="border-purple-500/60 text-purple-300 hover:bg-purple-950/40"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nova O.S. Oficial
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={carregarOrdens}
              id="btn-atualizar-lista-os"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Navegação entre a Emissão Oficial (Visual da Imagem) e o Histórico */}
      <div className="no-print flex items-center justify-between border-b border-purple-900/50 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAbaAtiva('emissao_oficial')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              abaAtiva === 'emissao_oficial'
                ? 'bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white shadow-lg shadow-purple-900/40'
                : 'bg-[#140b24] text-slate-300 hover:bg-purple-950/50 border border-purple-900/40'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Modelo Oficial (Visual da Imagem)</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('historico')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              abaAtiva === 'historico'
                ? 'bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white shadow-lg shadow-purple-900/40'
                : 'bg-[#140b24] text-slate-300 hover:bg-purple-950/50 border border-purple-900/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Histórico de Ordens ({ordens.length})</span>
          </button>
        </div>

        {abaAtiva === 'emissao_oficial' && (
          <div className="text-[11px] text-purple-300 hidden sm:flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Você pode digitar diretamente na folha ou usar as ações abaixo.</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          ABA 1: EMISSÃO NO MODELO OFICIAL (RÉPLICA EXATA DA IMAGEM PREENCHÍVEL)
      ========================================================================= */}
      {abaAtiva === 'emissao_oficial' && (
        <div className="space-y-4">
          {/* Barra de Ações do Documento Oficial */}
          <div className="no-print p-3.5 rounded-2xl bg-[#140b24] border border-purple-900/60 shadow-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300">
                Ordem Atual:
              </span>
              <span className="px-3 py-1 rounded-lg bg-black border border-purple-500 font-mono font-black text-amber-300 text-xs shadow-sm">
                {ordemAtiva.numeroOS || 'OS #0001'}
              </span>

              {/* Seletor de Status Operacional */}
              <div className="flex items-center gap-2 pl-2 border-l border-purple-900/50">
                <span className="text-[11px] font-semibold text-slate-400">
                  Status:
                </span>
                <select
                  value={ordemAtiva.status || 'aguardando_aprovacao'}
                  onChange={(e) => handleCampoChange('status', e.target.value as StatusOSMix)}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg border border-purple-500/60 bg-[#0d071a] text-purple-300 outline-none cursor-pointer"
                >
                  <option value="aguardando_aprovacao">Aguardando aprovação</option>
                  <option value="aprovada">Aprovada</option>
                  <option value="em_producao">Em produção</option>
                  <option value="pronta">Pronta</option>
                  <option value="entregue">Entregue</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>

            {/* Botões Principais de Ação */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleIniciarNovaOS}
                className="text-xs border-purple-800 text-purple-300"
              >
                Limpar / Nova
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSalvarModeloOficial(false)}
                disabled={salvandoEmissao}
                className="text-xs border-purple-500 text-purple-200 hover:bg-purple-950/50"
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                {salvandoEmissao ? 'Salvando...' : 'Salvar Ordem'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleImprimir(ordemAtiva)}
                className="text-xs border-amber-500/60 text-amber-300 hover:bg-amber-950/30"
              >
                <FileDown className="w-3.5 h-3.5 mr-1" />
                Gerar PDF
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleSalvarModeloOficial(true)}
                disabled={salvandoEmissao}
                className="text-xs bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-800 hover:to-fuchsia-700 text-white font-bold shadow-md shadow-purple-900/40"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Salvar e Imprimir A4
              </Button>
            </div>
          </div>

          {/* O MODELO OFICIAL EXATO DA IMAGEM PREENCHÍVEL */}
          <div className="p-2 sm:p-4 rounded-3xl bg-[#07020d] border border-purple-900/40 shadow-2xl flex justify-center">
            <ModeloOficialDocumento
              ordem={ordemAtiva}
              onChange={handleCampoChange}
              onItemChange={handleItemChange}
              isEditable={true}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 2: HISTÓRICO DE ORDENS DE SERVIÇO (PAINEL DE GESTÃO E BUSCA)
      ========================================================================= */}
      {abaAtiva === 'historico' && (
        <div className="space-y-4">
          {/* Métricas e Contadores */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-[#140b24] border border-purple-900/50 shadow-md flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total de O.S.
                </div>
                <div className="text-xl font-mono font-black text-white mt-0.5">
                  {contadores.total}
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#140b24] border border-purple-900/50 shadow-md flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                  Em Produção
                </div>
                <div className="text-xl font-mono font-black text-purple-300 mt-0.5">
                  {contadores.emProducao}
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#140b24] border border-emerald-900/40 shadow-md flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Prontas
                </div>
                <div className="text-xl font-mono font-black text-emerald-300 mt-0.5">
                  {contadores.prontas}
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#140b24] border border-amber-900/40 shadow-md flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Aguardando
                </div>
                <div className="text-xl font-mono font-black text-amber-300 mt-0.5">
                  {contadores.aguardando}
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-[#140b24] border border-slate-800 shadow-md flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Entregues
                </div>
                <div className="text-xl font-mono font-black text-slate-300 mt-0.5">
                  {contadores.entregues}
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filtros de Pesquisa */}
          <div className="p-4 rounded-xl bg-[#140b24] border border-purple-900/40 shadow-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  id="input-busca-os-hist"
                  type="text"
                  placeholder="Pesquisar por Nº da OS, Cliente ou Telefone..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-9 bg-[#0d071a] border-purple-900/60 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  id="select-status-hist"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-[#0d071a] border border-purple-900/60 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="aguardando_aprovacao">Aguardando aprovação</option>
                  <option value="aprovada">Aprovada</option>
                  <option value="em_producao">Em produção</option>
                  <option value="pronta">Pronta</option>
                  <option value="entregue">Entregue</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <input
                  type="date"
                  title="Data de Entrada"
                  value={filtroDataEntrada}
                  onChange={(e) => setFiltroDataEntrada(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg bg-[#0d071a] border border-purple-900/60 text-white outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <input
                  type="date"
                  title="Data de Entrega"
                  value={filtroDataEntrega}
                  onChange={(e) => setFiltroDataEntrega(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg bg-[#0d071a] border border-purple-900/60 text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Tabela de Registros */}
          <div className="rounded-xl bg-[#140b24] border border-purple-900/40 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0e071c] text-purple-300 font-bold border-b border-purple-900/60">
                    <th className="py-3 px-4 w-28">Nº da OS</th>
                    <th className="py-3 px-4">Cliente / Contato</th>
                    <th className="py-3 px-3 text-center w-28">Entrada</th>
                    <th className="py-3 px-3 text-center w-28">Entrega</th>
                    <th className="py-3 px-4 text-right w-28">Valor Total</th>
                    <th className="py-3 px-4 text-center w-36">Status</th>
                    <th className="py-3 px-4 text-right w-52">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/30">
                  {ordensFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 text-purple-400/60 mx-auto mb-2" />
                        <p className="font-semibold text-sm">Nenhuma Ordem de Serviço encontrada.</p>
                      </td>
                    </tr>
                  ) : (
                    ordensFiltradas.map((os) => {
                      const cfgStatus = STATUS_CONFIG[os.status] || {
                        label: os.status,
                        variant: 'default',
                      };

                      return (
                        <tr
                          key={os.id}
                          className="hover:bg-purple-950/20 transition-colors group text-slate-200"
                        >
                          <td className="py-3 px-4">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-black border border-purple-600/70 font-mono font-black text-amber-300 text-xs shadow-sm">
                              {os.numeroOS}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">
                              {os.clienteNome}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                              <Phone className="w-3 h-3 text-purple-400" />
                              <span>{os.clienteTelefone || 'Sem telefone'}</span>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center font-mono text-slate-300">
                            {formatarData(os.dataEntrada)}
                          </td>

                          <td className="py-3 px-3 text-center font-mono font-semibold text-amber-400">
                            {formatarData(os.dataEntrega)}
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-sm">
                            <div className="font-black text-emerald-400">
                              R$ {(os.valorTotal || 0).toFixed(2)}
                            </div>
                            <div className="mt-0.5">
                              {os.pago ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Pago
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setOrdemParaPagar(os)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 px-1.5 py-0.5 rounded border border-amber-600/60 transition-all cursor-pointer shadow-sm"
                                  title="Receber valor e alimentar caixa"
                                >
                                  <Coins className="w-2.5 h-2.5 text-amber-400" /> Receber
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <Badge variant={cfgStatus.variant} size="sm">
                              {cfgStatus.label}
                            </Badge>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Receber no Caixa (se pendente) */}
                              {!os.pago && (
                                <button
                                  type="button"
                                  onClick={() => setOrdemParaPagar(os)}
                                  title="Receber Pagamento e Lançar no Caixa"
                                  className="p-1.5 rounded-lg bg-emerald-900/30 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-700/40 transition-colors"
                                >
                                  <Coins className="w-4 h-4" />
                                </button>
                              )}

                              {/* Carregar na Folha Oficial */}
                              <button
                                type="button"
                                onClick={() => handleCarregarNoModeloOficial(os)}
                                title="Abrir na Folha Oficial da Imagem"
                                className="p-1.5 rounded-lg bg-purple-900/30 hover:bg-purple-800/60 text-fuchsia-300 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Visualizar Modal */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOrdemSelecionada(os);
                                  setIsVisualizarModalOpen(true);
                                }}
                                title="Visualizar Modelo Oficial"
                                className="p-1.5 rounded-lg bg-purple-900/30 hover:bg-purple-800/50 text-purple-300 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Imprimir Modelo Oficial */}
                              <button
                                type="button"
                                onClick={() => handleImprimir(os)}
                                title="Imprimir Ordem Oficial"
                                className="p-1.5 rounded-lg bg-purple-900/30 hover:bg-purple-800/50 text-amber-300 transition-colors"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Excluir */}
                              <button
                                type="button"
                                onClick={() => setOrdemParaExcluir(os)}
                                title="Excluir Ordem"
                                className="p-1.5 rounded-lg bg-purple-900/30 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulário Digital de Apoio */}
      <FormularioOrdemModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setOrdemParaEditar(null);
        }}
        ordemParaEditar={ordemParaEditar}
        onOrdemSalva={(salva, imprimir) => {
          carregarOrdens();
          if (imprimir) {
            setTimeout(() => handleImprimir(salva), 200);
          }
        }}
      />

      {/* Modal de Visualização Oficial */}
      <VisualizarOrdemModal
        isOpen={isVisualizarModalOpen}
        onClose={() => {
          setIsVisualizarModalOpen(false);
          setOrdemSelecionada(null);
        }}
        ordem={ordemSelecionada}
        onEditar={(os) => handleCarregarNoModeloOficial(os)}
        onStatusAlterado={(atualizada) => {
          setOrdemSelecionada(atualizada);
          setOrdens((prev) => prev.map((o) => (o.id === atualizada.id ? atualizada : o)));
        }}
      />

      {/* Modal de Pagamento & Entrada no Caixa */}
      <ReceberPagamentoOSModal
        isOpen={Boolean(ordemParaPagar)}
        onClose={() => setOrdemParaPagar(null)}
        ordem={ordemParaPagar}
        onPagamentoRegistrado={(atualizada) => {
          carregarOrdens();
          setOrdemParaPagar(null);
        }}
      />

      {/* Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={Boolean(ordemParaExcluir)}
        onClose={() => setOrdemParaExcluir(null)}
        onConfirm={handleConfirmarExclusao}
        title="Excluir Ordem de Serviço?"
        description={`Tem certeza que deseja excluir permanentemente a ordem "${ordemParaExcluir?.numeroOS}" do cliente "${ordemParaExcluir?.clienteNome}"?`}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* CONTAINER EXCLUSIVO PARA IMPRESSÃO A4 OFICIAL VIA WINDOW.PRINT() */}
      {ordemParaImprimir && (
        <div className="hidden print:block fixed inset-0 z-[999999] bg-black">
          <ModeloOficialDocumento ordem={ordemParaImprimir} isPrintOnly={true} isEditable={false} />
        </div>
      )}
    </div>
  );
};
