import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { PromocaoService } from '../services/promocaoService';
import { AuditService } from '../services/auditService';
import { NovaPromocaoModal } from '../components/promocoes/NovaPromocaoModal';
import { ModalCriarEditarPost } from '../components/redes/ModalCriarEditarPost';
import type { Promocao, StatusPromocao } from '../types';

import {
  Tag,
  Plus,
  Calendar,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  RotateCw,
  Search,
  Filter,
  ArrowRight,
  Package,
  AlertTriangle,
  Share2,
} from 'lucide-react';

export const PromocoesPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todas' | StatusPromocao>('todas');

  // Modais
  const [isNovaPromoOpen, setIsNovaPromoOpen] = useState(false);
  const [promoParaEncerrar, setPromoParaEncerrar] = useState<Promocao | null>(null);
  const [promoParaExcluir, setPromoParaExcluir] = useState<Promocao | null>(null);
  const [promoParaPostagem, setPromoParaPostagem] = useState<Promocao | null>(null);

  const carregarPromocoes = async () => {
    try {
      setCarregando(true);
      const lista = await PromocaoService.getPromocoes();
      setPromocoes(lista);
    } catch (err) {
      console.error('Erro ao carregar promoções:', err);
      error('Erro', 'Não foi possível carregar as promoções.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPromocoes();
  }, []);

  // Forçar checagem de automação por datas
  const handleSincronizarDatas = async () => {
    try {
      setSincronizando(true);
      const resultado = await PromocaoService.verificarEAtualizarAutomacoes();
      await carregarPromocoes();
      success(
        'Automação executada',
        `Verificação de datas concluída. Ativadas: ${resultado.ativadas}, Encerradas: ${resultado.encerradas}.`
      );
    } catch (err) {
      error('Erro na automação', 'Falha ao sincronizar datas de promoção.');
    } finally {
      setSincronizando(false);
    }
  };

  // Encerrar manualmente uma promoção ativa
  const handleConfirmarEncerramento = async () => {
    if (!promoParaEncerrar) return;

    try {
      await PromocaoService.encerrarPromocao(promoParaEncerrar.id);

      if (user) {
        await AuditService.registrar({
          usuario: user.name,
          usuarioId: user.id,
          modulo: 'Promoções',
          tipoAcao: 'Encerramento',
          registroAfetado: promoParaEncerrar.produtoNome,
          informacaoAnterior: `Preço Promocional: R$ ${promoParaEncerrar.precoPromocional.toFixed(2)}`,
          informacaoNova: `Preço Normal Restaurado: R$ ${promoParaEncerrar.precoNormal.toFixed(2)}`,
          descricao: `Promoção para "${promoParaEncerrar.produtoNome}" encerrada manualmente. Preço normal restaurado no estoque.`,
        });
      }

      success(
        'Promoção encerrada',
        `Preço normal de R$ ${promoParaEncerrar.precoNormal.toFixed(2)} restaurado no estoque.`
      );
      setPromoParaEncerrar(null);
      await carregarPromocoes();
    } catch (err: any) {
      error('Erro ao encerrar', err.message || 'Falha ao encerrar promoção.');
    }
  };

  // Excluir promoção
  const handleConfirmarExclusao = async () => {
    if (!promoParaExcluir) return;

    try {
      await PromocaoService.excluirPromocao(promoParaExcluir.id);

      if (user) {
        await AuditService.registrar({
          usuario: user.name,
          usuarioId: user.id,
          modulo: 'Promoções',
          tipoAcao: 'Exclusão',
          registroAfetado: promoParaExcluir.produtoNome,
          informacaoAnterior: `Promoção R$ ${promoParaExcluir.precoPromocional.toFixed(2)}`,
          informacaoNova: 'Excluída',
          descricao: `Promoção para "${promoParaExcluir.produtoNome}" removida do sistema.`,
        });
      }

      success('Promoção excluída', 'Registro removido com sucesso.');
      setPromoParaExcluir(null);
      await carregarPromocoes();
    } catch (err: any) {
      error('Erro ao excluir', err.message || 'Falha ao excluir promoção.');
    }
  };

  const formatarData = (dataStr?: string) => {
    if (!dataStr) return '-';
    const partes = dataStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  };

  const getBadgeStatus = (status: StatusPromocao) => {
    switch (status) {
      case 'ativa':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Ativa
          </span>
        );
      case 'agendada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3" /> Agendada
          </span>
        );
      case 'encerrada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <XCircle className="w-3 h-3" /> Encerrada
          </span>
        );
    }
  };

  // Contadores
  const totalAtivas = promocoes.filter((p) => p.status === 'ativa').length;
  const totalAgendadas = promocoes.filter((p) => p.status === 'agendada').length;
  const totalEncerradas = promocoes.filter((p) => p.status === 'encerrada').length;

  const filtradas = promocoes.filter((p) => {
    if (filtroStatus !== 'todas' && p.status !== filtroStatus) {
      return false;
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      const matchNome = p.produtoNome.toLowerCase().includes(q);
      const matchDesc = p.descricao.toLowerCase().includes(q);
      if (!matchNome && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <PageHeader
        title="Promoções"
        subtitle="Módulo de promoções integrado ao estoque com automação por datas."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSincronizarDatas}
              disabled={sincronizando}
              id="btn-sincronizar-automacao"
              className="border-slate-300 dark:border-slate-700"
            >
              <RotateCw className={`w-4 h-4 mr-1.5 ${sincronizando ? 'animate-spin' : ''}`} />
              Sincronizar Datas
            </Button>

            <Button
              variant="primary"
              onClick={() => setIsNovaPromoOpen(true)}
              id="btn-nova-promocao"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nova Promoção
            </Button>
          </div>
        }
      />

      {/* Cards de Métricas e Status das Promoções */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFiltroStatus('ativa')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filtroStatus === 'ativa'
              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Promoções Ativas
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            {totalAtivas}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Preço promocional refletido no estoque e PDV
          </div>
        </div>

        <div
          onClick={() => setFiltroStatus('agendada')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filtroStatus === 'agendada'
              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Agendadas (Futuras)
            </span>
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-2">
            {totalAgendadas}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Aguardando a data inicial para ativação automática
          </div>
        </div>

        <div
          onClick={() => setFiltroStatus('encerrada')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filtroStatus === 'encerrada'
              ? 'border-slate-500 bg-slate-100 dark:bg-slate-800'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Encerradas
            </span>
            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-700 dark:text-slate-300 mt-2">
            {totalEncerradas}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Preço normal restaurado automaticamente
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            id="input-pesquisa-promocoes"
            type="text"
            placeholder="Buscar por produto ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            id="select-filtro-status-promocao"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as any)}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
          >
            <option value="todas">Todos os Status ({promocoes.length})</option>
            <option value="ativa">Apenas Ativas ({totalAtivas})</option>
            <option value="agendada">Apenas Agendadas ({totalAgendadas})</option>
            <option value="encerrada">Apenas Encerradas ({totalEncerradas})</option>
          </select>
        </div>
      </div>

      {/* Tabela de Promoções */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {carregando ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            Carregando promoções integradas ao estoque...
          </div>
        ) : filtradas.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Tag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto stroke-1" />
            <div className="text-slate-700 dark:text-slate-300 font-semibold">
              Nenhuma promoção encontrada
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Crie uma promoção com preço promocional direto para um produto do estoque.
            </p>
            <Button variant="outline" size="sm" onClick={() => setFiltroStatus('todas')}>
              Ver Todas
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4 text-right">Valor Custo</th>
                  <th className="py-3 px-4 text-right">Preço Normal</th>
                  <th className="py-3 px-4 text-right">Preço Promoção</th>
                  <th className="py-3 px-4">Período (Início → Fim)</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtradas.map((promo) => (
                  <tr
                    key={promo.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">{getBadgeStatus(promo.status)}</td>

                    {/* Produto */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {promo.produtoNome}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Tipo: Preço Direto (Ativo)
                      </div>
                    </td>

                    {/* Valor de Custo */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                      R$ {promo.valorCusto.toFixed(2)}
                    </td>

                    {/* Preço Normal */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono line-through text-slate-400 dark:text-slate-500">
                      R$ {promo.precoNormal.toFixed(2)}
                    </td>

                    {/* Preço Promocional */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                        R$ {promo.precoPromocional.toFixed(2)}
                      </span>
                    </td>

                    {/* Vigência */}
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatarData(promo.dataInicial)}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span>{formatarData(promo.dataFinal)}</span>
                      </div>
                    </td>

                    {/* Descrição */}
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-[220px] truncate">
                      {promo.descricao}
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPromoParaPostagem(promo)}
                          className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#7B2CF6]/20 to-[#FF8A00]/20 hover:from-[#7B2CF6]/30 hover:to-[#FF8A00]/30 border border-[#7B2CF6]/40 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          title="Criar postagem nas redes sociais com este produto e preços"
                        >
                          <Share2 className="w-3.5 h-3.5 text-[#FF8A00]" />
                          <span>Criar Postagem</span>
                        </button>

                        {promo.status === 'ativa' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPromoParaEncerrar(promo)}
                            title="Encerrar promoção agora e restaurar preço normal"
                            className="text-xs text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                          >
                            Encerrar
                          </Button>
                        )}

                        <button
                          type="button"
                          onClick={() => setPromoParaExcluir(promo)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Excluir promoção"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Criação de Promoção */}
      <NovaPromocaoModal
        isOpen={isNovaPromoOpen}
        onClose={() => setIsNovaPromoOpen(false)}
        onPromocaoCriada={carregarPromocoes}
      />

      {/* Integração: Modal de Criação de Postagem a partir de Promoção Existente */}
      <ModalCriarEditarPost
        isOpen={!!promoParaPostagem}
        onClose={() => setPromoParaPostagem(null)}
        promocaoOrigem={promoParaPostagem}
        onPostSalvo={(post) => {
          success(
            'Campanha Agendada!',
            `Postagem para "${post.produtoNome}" foi criada com sucesso no calendário de redes sociais da Mix.`
          );
          setPromoParaPostagem(null);
        }}
      />

      {/* Modal de Confirmação para Encerrar */}
      <ConfirmModal
        isOpen={Boolean(promoParaEncerrar)}
        onClose={() => setPromoParaEncerrar(null)}
        onConfirm={handleConfirmarEncerramento}
        title="Encerrar Promoção Manualmente"
        message={`Deseja encerrar a promoção de "${promoParaEncerrar?.produtoNome}" agora? O preço normal de R$ ${promoParaEncerrar?.precoNormal.toFixed(2)} será restaurado imediatamente no estoque.`}
        confirmText="Sim, Encerrar Promoção"
        variant="primary"
      />

      {/* Modal de Confirmação para Excluir */}
      <ConfirmModal
        isOpen={Boolean(promoParaExcluir)}
        onClose={() => setPromoParaExcluir(null)}
        onConfirm={handleConfirmarExclusao}
        title="Excluir Promoção"
        message={`Tem certeza que deseja excluir esta promoção de "${promoParaExcluir?.produtoNome}"? Caso esteja ativa, o preço normal será restaurado no estoque.`}
        confirmText="Sim, Excluir"
        variant="danger"
      />
    </div>
  );
};
