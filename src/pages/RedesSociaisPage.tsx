import React, { useState, useEffect } from 'react';
import type {
  RouteId,
  PostagemSocial,
  ItemBibliotecaMidia,
  MelhorHorarioConfig,
  ContaRedeSocial,
  StatusPostagem,
  Promocao,
} from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { RedesSociaisService } from '../services/redesSociaisService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Subcomponentes do Módulo
import { CalendarioView } from '../components/redes/CalendarioView';
import { BibliotecaMidiasView } from '../components/redes/BibliotecaMidiasView';
import { ModalCriarEditarPost } from '../components/redes/ModalCriarEditarPost';
import { ModalDetalhesPost } from '../components/redes/ModalDetalhesPost';
import { MelhoresHorariosModal } from '../components/redes/MelhoresHorariosModal';
import { ContasConexaoModal } from '../components/redes/ContasConexaoModal';

import {
  Calendar as CalendarIcon,
  Share2,
  FolderOpen,
  Plus,
  Sparkles,
  Link2,
  Instagram,
  Facebook,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface RedesSociaisPageProps {
  currentTab: 'redes-calendario' | 'redes-postagens' | 'redes-biblioteca';
  onTabChange: (tab: RouteId) => void;
  promocaoOrigemInicial?: Promocao | null;
  onLimparPromocaoOrigem?: () => void;
}

export const RedesSociaisPage: React.FC<RedesSociaisPageProps> = ({
  currentTab,
  onTabChange,
  promocaoOrigemInicial,
  onLimparPromocaoOrigem,
}) => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  // Dados Centrais
  const [postagens, setPostagens] = useState<PostagemSocial[]>([]);
  const [midias, setMidias] = useState<ItemBibliotecaMidia[]>([]);
  const [melhoresHorarios, setMelhoresHorarios] = useState<MelhorHorarioConfig[]>([]);
  const [contas, setContas] = useState<ContaRedeSocial[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Estados dos Modais
  const [modalCriarEditarAberto, setModalCriarEditarAberto] = useState(false);
  const [postParaEditar, setPostParaEditar] = useState<PostagemSocial | null>(null);
  const [postParaDetalhes, setPostParaDetalhes] = useState<PostagemSocial | null>(null);
  const [dataPreSelecionada, setDataPreSelecionada] = useState<string | undefined>(undefined);
  const [promocaoOrigem, setPromocaoOrigem] = useState<Promocao | null>(
    promocaoOrigemInicial || null
  );
  const [midiaOrigem, setMidiaOrigem] = useState<ItemBibliotecaMidia | null>(null);

  const [modalHorariosAberto, setModalHorariosAberto] = useState(false);
  const [modalContasAberto, setModalContasAberto] = useState(false);

  // Carregamento de Dados
  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [listaPosts, listaMidias, listaHorarios, listaContas] = await Promise.all([
        RedesSociaisService.getPostagens(),
        RedesSociaisService.getBibliotecaMidias(),
        RedesSociaisService.getMelhoresHorarios(),
        RedesSociaisService.getContas(),
      ]);

      setPostagens(listaPosts);
      setMidias(listaMidias);
      setMelhoresHorarios(listaHorarios);
      setContas(listaContas);
    } catch (err) {
      console.error('Erro ao carregar dados de redes sociais:', err);
      error('Erro ao Carregar', 'Falha ao buscar publicações e mídias.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Se veio vindo de uma Promoção externa via props ou navigation
  useEffect(() => {
    if (promocaoOrigemInicial) {
      setPromocaoOrigem(promocaoOrigemInicial);
      setModalCriarEditarAberto(true);
    }
  }, [promocaoOrigemInicial]);

  // Contadores Rápidos
  const totalAgendados = postagens.filter((p) => p.status === 'agendado').length;
  const totalProntos = postagens.filter((p) => p.status === 'pronto').length;
  const totalPublicados = postagens.filter((p) => p.status === 'publicado').length;
  const contasConectadas = contas.filter((c) => c.conectado).length;

  // Handlers
  const handleAbrirCriar = (dataStr?: string) => {
    setPostParaEditar(null);
    setPromocaoOrigem(null);
    setMidiaOrigem(null);
    setDataPreSelecionada(dataStr);
    setModalCriarEditarAberto(true);
  };

  const handleAbrirEditar = (post: PostagemSocial) => {
    setPostParaEditar(post);
    setPromocaoOrigem(null);
    setMidiaOrigem(null);
    setModalCriarEditarAberto(true);
  };

  const handleUsarMidiaEmPost = (midia: ItemBibliotecaMidia) => {
    setPostParaEditar(null);
    setPromocaoOrigem(null);
    setMidiaOrigem(midia);
    setDataPreSelecionada(undefined);
    setModalCriarEditarAberto(true);
  };

  const handleMudarStatus = async (id: string, novoStatus: StatusPostagem) => {
    await RedesSociaisService.alterarStatus(
      id,
      novoStatus,
      user?.name || 'Operador',
      user?.id || 'usr_01'
    );
    await carregarDados();
    if (postParaDetalhes?.id === id) {
      const atualizado = await RedesSociaisService.getPostagemById(id);
      setPostParaDetalhes(atualizado);
    }
  };

  const handleMudarData = async (id: string, novaData: string) => {
    await RedesSociaisService.atualizarDataPostagem(id, novaData, undefined, user?.name || 'Operador');
    success('Reagendado', 'Data da publicação reagendada no calendário.');
    await carregarDados();
  };

  const handleExcluirPost = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta publicação?')) return;
    await RedesSociaisService.excluirPostagem(id, user?.name || 'Operador', user?.id || 'usr_01');
    success('Excluído', 'Postagem removida do cronograma.');
    setPostParaDetalhes(null);
    await carregarDados();
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <PageHeader
        title="CONTEÚDO E REDES SOCIAIS"
        description="Gestão editorial inspirada no Metricool e adaptada para a Mix Variedades Store. Calendário, agendamento de promoções, melhores horários e biblioteca de mídias."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Botão de Melhores Horários */}
            <button
              type="button"
              onClick={() => setModalHorariosAberto(true)}
              className="px-3.5 py-2 rounded-xl bg-[#161622] hover:bg-[#1E1E2E] border border-[#2A2A3E] text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF8A00]" />
              <span>Melhores Horários</span>
            </button>

            {/* Botão de Conexões de Contas */}
            <button
              type="button"
              onClick={() => setModalContasAberto(true)}
              className="px-3.5 py-2 rounded-xl bg-[#161622] hover:bg-[#1E1E2E] border border-[#2A2A3E] text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5 text-[#7B2CF6]" />
              <span>
                Contas ({contasConectadas}/{contas.length})
              </span>
            </button>

            {/* Botão Principal: Nova Postagem */}
            <Button
              variant="accent"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => handleAbrirCriar()}
            >
              + Criar Postagem
            </Button>
          </div>
        }
      />

      {/* Cards de Métricas e Status Rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#111116] border border-[#222230] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Agendados
            </div>
            <div className="text-xl font-black text-white mt-0.5">{totalAgendados}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#7B2CF6]/20 text-[#7B2CF6] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111116] border border-[#222230] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Prontos p/ Postar
            </div>
            <div className="text-xl font-black text-[#FF8A00] mt-0.5">{totalProntos}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#FF8A00]/20 text-[#FF8A00] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111116] border border-[#222230] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Publicados
            </div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{totalPublicados}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111116] border border-[#222230] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Mídias na Nuvem
            </div>
            <div className="text-xl font-black text-[#7B2CF6] mt-0.5">{midias.length}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#7B2CF6]/20 text-[#7B2CF6] flex items-center justify-center font-bold">
            <FolderOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub-navegação em Abas */}
      <div className="flex items-center gap-2 border-b border-[#20202B] pb-3">
        <button
          onClick={() => onTabChange('redes-calendario')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentTab === 'redes-calendario'
              ? 'bg-gradient-to-r from-[#7B2CF6] to-[#FF8A00] text-white shadow-lg shadow-[#7B2CF6]/25'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Calendário de Publicações</span>
        </button>

        <button
          onClick={() => onTabChange('redes-postagens')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentTab === 'redes-postagens'
              ? 'bg-gradient-to-r from-[#7B2CF6] to-[#FF8A00] text-white shadow-lg shadow-[#7B2CF6]/25'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Feed & Cronograma</span>
        </button>

        <button
          onClick={() => onTabChange('redes-biblioteca')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentTab === 'redes-biblioteca'
              ? 'bg-gradient-to-r from-[#7B2CF6] to-[#FF8A00] text-white shadow-lg shadow-[#7B2CF6]/25'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Biblioteca de Mídias</span>
        </button>
      </div>

      {/* Conteúdo Dinâmico da Aba Selecionada */}
      {carregando ? (
        <div className="p-16 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#7B2CF6] border-t-transparent rounded-full animate-spin" />
          <span>Sincronizando cronograma editorial da Mix...</span>
        </div>
      ) : currentTab === 'redes-calendario' || currentTab === 'redes-postagens' ? (
        <CalendarioView
          postagens={postagens}
          melhoresHorarios={melhoresHorarios}
          onSelectPost={(p) => setPostParaDetalhes(p)}
          onEditarPost={handleAbrirEditar}
          onCriarNoDia={handleAbrirCriar}
          onMudarDataPost={handleMudarData}
        />
      ) : (
        <BibliotecaMidiasView
          midias={midias}
          onAtualizarLista={carregarDados}
          onUsarMidiaEmPost={handleUsarMidiaEmPost}
        />
      )}

      {/* MODAL: CRIAR / EDITAR POSTAGEM */}
      <ModalCriarEditarPost
        isOpen={modalCriarEditarAberto}
        onClose={() => {
          setModalCriarEditarAberto(false);
          setPostParaEditar(null);
          setPromocaoOrigem(null);
          setMidiaOrigem(null);
          if (onLimparPromocaoOrigem) onLimparPromocaoOrigem();
        }}
        postParaEditar={postParaEditar}
        dataPreSelecionada={dataPreSelecionada}
        promocaoOrigem={promocaoOrigem}
        midiaOrigem={midiaOrigem}
        onPostSalvo={async () => {
          await carregarDados();
        }}
      />

      {/* MODAL: DETALHES DA POSTAGEM */}
      <ModalDetalhesPost
        post={postParaDetalhes}
        isOpen={!!postParaDetalhes}
        onClose={() => setPostParaDetalhes(null)}
        onEditar={(p) => {
          setPostParaDetalhes(null);
          handleAbrirEditar(p);
        }}
        onMudarStatus={handleMudarStatus}
        onExcluir={handleExcluirPost}
      />

      {/* MODAL: CONFIGURAÇÃO DE MELHORES HORÁRIOS */}
      <MelhoresHorariosModal
        isOpen={modalHorariosAberto}
        onClose={() => setModalHorariosAberto(false)}
        horarios={melhoresHorarios}
        onHorariosAtualizados={carregarDados}
      />

      {/* MODAL: STATUS DE CONEXÃO COM REDES SOCIAIS */}
      <ContasConexaoModal
        isOpen={modalContasAberto}
        onClose={() => setModalContasAberto(false)}
        contas={contas}
        onContasAtualizadas={carregarDados}
      />
    </div>
  );
};
