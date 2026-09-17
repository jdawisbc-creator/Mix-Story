import React from 'react';
import type { PostagemSocial, StatusPostagem } from '../../types';
import {
  X,
  Instagram,
  Facebook,
  Calendar,
  Clock,
  Tag,
  Share2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  DollarSign,
  User,
  Sparkles,
  Video,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ModalDetalhesPostProps {
  post: PostagemSocial | null;
  isOpen: boolean;
  onClose: () => void;
  onEditar: (post: PostagemSocial) => void;
  onMudarStatus: (id: string, novoStatus: StatusPostagem) => void;
  onExcluir: (id: string) => void;
}

export const ModalDetalhesPost: React.FC<ModalDetalhesPostProps> = ({
  post,
  isOpen,
  onClose,
  onEditar,
  onMudarStatus,
  onExcluir,
}) => {
  const { success, info } = useToast();

  if (!isOpen || !post) return null;

  const handleCopiarLegenda = () => {
    navigator.clipboard.writeText(post.legenda);
    success('Copiado', 'Texto da legenda copiado para a área de transferência!');
  };

  const getStatusBadge = (status: StatusPostagem) => {
    switch (status) {
      case 'publicado':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          label: 'PUBLICADO',
          dot: 'bg-emerald-400',
        };
      case 'agendado':
        return {
          bg: 'bg-[#7B2CF6]/10 text-[#A78BFA] border-[#7B2CF6]/30',
          label: 'AGENDADO',
          dot: 'bg-[#7B2CF6]',
        };
      case 'pronto':
        return {
          bg: 'bg-[#FF8A00]/10 text-[#FFA83A] border-[#FF8A00]/30',
          label: 'PRONTO',
          dot: 'bg-[#FF8A00]',
        };
      case 'rascunho':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          label: 'RASCUNHO',
          dot: 'bg-amber-400',
        };
      case 'ideia':
        return {
          bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          label: 'IDEIA',
          dot: 'bg-sky-400',
        };
      case 'cancelado':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          label: 'CANCELADO',
          dot: 'bg-rose-400',
        };
    }
  };

  const statusInfo = getStatusBadge(post.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-3xl bg-[#121217] border border-[#262635] rounded-2xl shadow-2xl shadow-black/90 overflow-hidden z-10 flex flex-col max-h-[92vh] my-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222230] bg-[#161620]">
          <div className="flex items-center gap-3">
            {post.redeSocial === 'instagram' ? (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#fd1d1d] to-[#833ab4] flex items-center justify-center text-white shadow-md">
                <Instagram className="w-5 h-5" />
              </div>
            ) : post.redeSocial === 'facebook' ? (
              <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center text-white shadow-md">
                <Facebook className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#7B2CF6] flex items-center justify-center text-white shadow-md">
                <Share2 className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide line-clamp-1">
                  {post.tituloInterno}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusInfo.bg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                  {statusInfo.label}
                </span>
              </div>
              <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-zinc-300">
                  {post.redeSocial === 'instagram'
                    ? 'Instagram (@mixvariedades.store)'
                    : post.redeSocial === 'facebook'
                    ? 'Facebook (Mix Variedades Store)'
                    : post.redeSocial}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#FF8A00] font-mono">
                  <Clock className="w-3 h-3" />
                  {post.data} às {post.horario}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEditar(post);
              }}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Editar Publicação"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Card de Promoção Vinculada (se existir) */}
          {(post.produtoNome || post.promocaoId) && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#FF8A00]/15 via-[#7B2CF6]/15 to-transparent border border-[#FF8A00]/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF8A00]/20 text-[#FF8A00] flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A00]">
                    PRODUTO EM PROMOÇÃO VINCULADO
                  </div>
                  <div className="text-sm font-bold text-white">{post.produtoNome}</div>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    De <span className="line-through">R$ {post.precoNormal?.toFixed(2)}</span> por apenas{' '}
                    <span className="text-emerald-400 font-bold text-sm">
                      R$ {post.precoPromocional?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Campanha Ativa
              </span>
            </div>
          )}

          {/* Grid de Preview do Feed + Detalhes Técnicos */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Visualizador Mockup de Publicação */}
            <div className="md:col-span-6 bg-[#0B0B0E] border border-[#22222E] rounded-2xl overflow-hidden shadow-xl">
              {/* Topo estilo perfil social */}
              <div className="p-3 border-b border-[#1A1A24] flex items-center justify-between bg-[#121218]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7B2CF6] to-[#FF8A00] p-0.5">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-black text-white">
                      MIX
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">mixvariedades.store</div>
                    <div className="text-[10px] text-zinc-400">Mix Variedades Store Oficial</div>
                  </div>
                </div>
                <div className="text-xs text-zinc-500 font-mono">•••</div>
              </div>

              {/* Mídia */}
              {post.imagemUrl ? (
                <div className="aspect-square bg-black/60 flex items-center justify-center overflow-hidden">
                  <img
                    src={post.imagemUrl}
                    alt={post.tituloInterno}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : post.videoUrl ? (
                <div className="aspect-square bg-zinc-900 flex flex-col items-center justify-center text-zinc-400 p-6 text-center">
                  <Video className="w-12 h-12 text-[#7B2CF6] mb-2" />
                  <span className="text-xs font-semibold text-white">Vídeo / Reels Configurado</span>
                  <span className="text-[11px] text-zinc-500 truncate max-w-[200px] mt-1">
                    {post.videoUrl}
                  </span>
                </div>
              ) : (
                <div className="aspect-square bg-gradient-to-br from-[#1A1A24] to-[#0E0E14] flex flex-col items-center justify-center text-zinc-500 p-6 text-center">
                  <Share2 className="w-12 h-12 text-zinc-600 mb-2" />
                  <span className="text-xs font-semibold text-zinc-400">Sem imagem anexada</span>
                  <span className="text-[11px] text-zinc-600 mt-1">Post em formato de texto</span>
                </div>
              )}

              {/* Barra de Ações Mockup */}
              <div className="p-3 border-t border-[#1A1A24] bg-[#121218] flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-zinc-300">❤️ Curtir</span>
                  <span className="text-xs font-semibold text-zinc-300">💬 Comentar</span>
                  <span className="text-xs font-semibold text-zinc-300">✈️ Enviar</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  {post.formato || 'feed'}
                </span>
              </div>

              {/* Legenda Mockup */}
              <div className="p-3.5 bg-[#0E0E14] text-xs text-zinc-300 leading-relaxed border-t border-[#1A1A24] max-h-48 overflow-y-auto custom-scrollbar whitespace-pre-line">
                <span className="font-bold text-white mr-1.5">mixvariedades.store</span>
                {post.legenda || <span className="text-zinc-500 italic">Sem legenda cadastrada.</span>}
              </div>
            </div>

            {/* Informações Operacionais e Auditoria */}
            <div className="md:col-span-6 space-y-4">
              {/* Card de Informações Técnicas */}
              <div className="p-4 rounded-xl bg-[#15151E] border border-[#242434] space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Dados do Planejamento
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-[#20202E]">
                    <span className="text-zinc-400">Categoria:</span>
                    <span className="font-bold text-white capitalize">{post.categoria}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-[#20202E]">
                    <span className="text-zinc-400">Formato:</span>
                    <span className="font-mono text-zinc-200">{post.formato || 'Feed Padrão'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-[#20202E]">
                    <span className="text-zinc-400">Criado Por:</span>
                    <span className="text-zinc-200">{post.criadoPor || 'Marketing Mix'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-zinc-400">Status da API:</span>
                    <span
                      className={`font-bold ${
                        post.statusIntegracao === 'conectado'
                          ? 'text-emerald-400'
                          : post.statusIntegracao === 'publicado'
                          ? 'text-blue-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {post.statusIntegracao.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status da Integração Oficial */}
              <div className="p-4 rounded-xl bg-[#14141E] border border-[#222232] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300">Disparo Automático (API)</span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    Meta Graph v20.0
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {post.statusIntegracao === 'publicado'
                    ? 'Esta postagem já foi confirmada e publicada nas redes oficiais da Mix Variedades.'
                    : post.statusIntegracao === 'conectado'
                    ? 'Conta sincronizada. A publicação ocorrerá automaticamente no horário agendado.'
                    : 'Aguardando sincronização oficial da conta ou publicação manual pelo operador.'}
                </p>
              </div>

              {/* Ações Rápidas de Status */}
              <div className="p-4 rounded-xl bg-[#15151E] border border-[#242434] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                  Ações Rápidas de Fluxo
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {post.status !== 'publicado' && (
                    <button
                      type="button"
                      onClick={() => {
                        onMudarStatus(post.id, 'publicado');
                        success('Publicado', 'Postagem marcada como publicada com sucesso!');
                      }}
                      className="px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Marcar Publicado
                    </button>
                  )}

                  {post.status !== 'pronto' && post.status !== 'publicado' && (
                    <button
                      type="button"
                      onClick={() => {
                        onMudarStatus(post.id, 'pronto');
                        info('Status Alterado', 'Postagem marcada como Pronta.');
                      }}
                      className="px-3 py-2 rounded-lg bg-[#FF8A00]/15 hover:bg-[#FF8A00]/25 border border-[#FF8A00]/30 text-[#FF8A00] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Mover p/ Pronto
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopiarLegenda}
                    className="px-3 py-2 rounded-lg bg-[#20202E] hover:bg-[#2A2A3C] text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Legenda
                  </button>

                  {post.status !== 'cancelado' && (
                    <button
                      type="button"
                      onClick={() => {
                        onMudarStatus(post.id, 'cancelado');
                        info('Postagem Cancelada', 'O agendamento foi cancelado.');
                      }}
                      className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      Cancelar Post
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-[#222230] bg-[#161620] flex items-center justify-between">
          <button
            type="button"
            onClick={() => onExcluir(post.id)}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Postagem
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#2A2A38] text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditar(post);
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7B2CF6] to-[#FF8A00] text-white text-xs font-bold shadow-lg shadow-[#7B2CF6]/20 transition-all cursor-pointer"
            >
              Editar Postagem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
