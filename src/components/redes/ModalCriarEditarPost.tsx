import React, { useState, useEffect, useRef } from 'react';
import type {
  PostagemSocial,
  RedeSocialPlataforma,
  CategoriaPostagem,
  StatusPostagem,
  StatusIntegracaoAPI,
  FormatoPostagem,
  Promocao,
  ItemBibliotecaMidia,
} from '../../types';
import { RedesSociaisService } from '../../services/redesSociaisService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Instagram,
  Facebook,
  Sparkles,
  Clock,
  Calendar,
  Image as ImageIcon,
  Video,
  Tag,
  Share2,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileText,
  DollarSign,
  Info,
} from 'lucide-react';

interface ModalCriarEditarPostProps {
  isOpen: boolean;
  onClose: () => void;
  postParaEditar?: PostagemSocial | null;
  dataPreSelecionada?: string;
  promocaoOrigem?: Promocao | null;
  midiaOrigem?: ItemBibliotecaMidia | null;
  onPostSalvo: (post: PostagemSocial) => void;
}

export const ModalCriarEditarPost: React.FC<ModalCriarEditarPostProps> = ({
  isOpen,
  onClose,
  postParaEditar,
  dataPreSelecionada,
  promocaoOrigem,
  midiaOrigem,
  onPostSalvo,
}) => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [tituloInterno, setTituloInterno] = useState('');
  const [legenda, setLegenda] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [redeSocial, setRedeSocial] = useState<RedeSocialPlataforma>('instagram');
  const [redesAdicionais, setRedesAdicionais] = useState<RedeSocialPlataforma[]>(['facebook']);
  const [dataPost, setDataPost] = useState('');
  const [horarioPost, setHorarioPost] = useState('19:30');
  const [categoria, setCategoria] = useState<CategoriaPostagem>('produto');
  const [status, setStatus] = useState<StatusPostagem>('agendado');
  const [formato, setFormato] = useState<FormatoPostagem>('feed_imagem');
  const [statusIntegracao, setStatusIntegracao] = useState<StatusIntegracaoAPI>('conectado');

  // Promoção Vinculada
  const [promocaoId, setPromocaoId] = useState<string | undefined>(undefined);
  const [produtoNome, setProdutoNome] = useState<string | undefined>(undefined);
  const [precoNormal, setPrecoNormal] = useState<number | undefined>(undefined);
  const [precoPromocional, setPrecoPromocional] = useState<number | undefined>(undefined);

  // Melhor horário sugerido para a data
  const [melhorHorarioSugerido, setMelhorHorarioSugerido] = useState<string | null>(null);
  const [nomeDiaSugerido, setNomeDiaSugerido] = useState<string>('');

  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Seletor de Mídias da Biblioteca
  const [mostrarSeletorBiblioteca, setMostrarSeletorBiblioteca] = useState(false);
  const [bibliotecaMidias, setBibliotecaMidias] = useState<ItemBibliotecaMidia[]>([]);

  // Inicialização do Formulário
  useEffect(() => {
    if (!isOpen) return;

    if (postParaEditar) {
      // Edição de Post Existente
      setTituloInterno(postParaEditar.tituloInterno || '');
      setLegenda(postParaEditar.legenda || '');
      setImagemUrl(postParaEditar.imagemUrl || '');
      setVideoUrl(postParaEditar.videoUrl || '');
      setRedeSocial(postParaEditar.redeSocial || 'instagram');
      setRedesAdicionais(postParaEditar.redesAdicionais || []);
      setDataPost(postParaEditar.data || '');
      setHorarioPost(postParaEditar.horario || '19:30');
      setCategoria(postParaEditar.categoria || 'produto');
      setStatus(postParaEditar.status || 'agendado');
      setFormato(postParaEditar.formato || 'feed_imagem');
      setStatusIntegracao(postParaEditar.statusIntegracao || 'conectado');
      setPromocaoId(postParaEditar.promocaoId);
      setProdutoNome(postParaEditar.produtoNome);
      setPrecoNormal(postParaEditar.precoNormal);
      setPrecoPromocional(postParaEditar.precoPromocional);
    } else if (promocaoOrigem) {
      // Criação vinda diretamente de uma Promoção Existente
      const hoje = new Date().toISOString().split('T')[0];
      setTituloInterno(`Promoção: ${promocaoOrigem.produtoNome}`);
      setRedeSocial('instagram');
      setRedesAdicionais(['facebook']);
      setDataPost(promocaoOrigem.dataInicial || hoje);
      setHorarioPost('19:30');
      setCategoria('promocao');
      setStatus('pronto');
      setFormato('feed_imagem');
      setStatusIntegracao('conectado');
      setPromocaoId(promocaoOrigem.id);
      setProdutoNome(promocaoOrigem.produtoNome);
      setPrecoNormal(promocaoOrigem.precoNormal);
      setPrecoPromocional(promocaoOrigem.precoPromocional);

      // Gerar copy atraente pré-preenchida
      const textoPromo = `🔥 SUPER OFERTA NA MIX VARIEDADES!\n\nGaranta já o seu ${promocaoOrigem.produtoNome} com preço promocional exclusivo:\n\n❌ Preço Normal: R$ ${promocaoOrigem.precoNormal.toFixed(2).replace('.', ',')}\n✅ PREÇO PROMOCIONAL: R$ ${promocaoOrigem.precoPromocional.toFixed(2).replace('.', ',')}!\n\n⚡ ${promocaoOrigem.descricao || 'Estoque limitado! Não perca tempo e garanta o seu.'}\n\n📍 Mix Variedades Store • Tudo que você precisa, em um só lugar!\nChame no WhatsApp ou visite nossa loja hoje mesmo.\n\n#mixvariedades #promocao #oferta #${promocaoOrigem.produtoNome.toLowerCase().replace(/\s+/g, '')} #varejo`;
      setLegenda(textoPromo);
      setImagemUrl('');
      setVideoUrl('');
    } else if (midiaOrigem) {
      // Criação vinda da Biblioteca de Mídias
      const hoje = new Date().toISOString().split('T')[0];
      setTituloInterno(`Publicação: ${midiaOrigem.nome}`);
      setLegenda(`✨ Novidade na Mix Variedades!\n\nConfira todos os detalhes em nossa loja.\n\n#mixvariedades #novidades`);
      setImagemUrl(midiaOrigem.tipo !== 'video' ? midiaOrigem.url : '');
      setVideoUrl(midiaOrigem.tipo === 'video' ? midiaOrigem.url : '');
      setRedeSocial('instagram');
      setRedesAdicionais(['facebook']);
      setDataPost(dataPreSelecionada || hoje);
      setHorarioPost('19:30');
      setCategoria(midiaOrigem.tipo === 'promocional' ? 'promocao' : 'produto');
      setStatus('pronto');
      setFormato(midiaOrigem.tipo === 'video' ? 'reels_video' : 'feed_imagem');
      setStatusIntegracao('conectado');
    } else {
      // Nova Postagem Limpa
      const hoje = dataPreSelecionada || new Date().toISOString().split('T')[0];
      setTituloInterno('');
      setLegenda('');
      setImagemUrl('');
      setVideoUrl('');
      setRedeSocial('instagram');
      setRedesAdicionais(['facebook']);
      setDataPost(hoje);
      setHorarioPost('19:30');
      setCategoria('produto');
      setStatus('agendado');
      setFormato('feed_imagem');
      setStatusIntegracao('conectado');
      setPromocaoId(undefined);
      setProdutoNome(undefined);
      setPrecoNormal(undefined);
      setPrecoPromocional(undefined);
    }
  }, [isOpen, postParaEditar, dataPreSelecionada, promocaoOrigem, midiaOrigem]);

  // Carregar biblioteca quando abrir modal
  useEffect(() => {
    if (isOpen) {
      RedesSociaisService.getBibliotecaMidias().then(setBibliotecaMidias);
    }
  }, [isOpen]);

  // Atualizar cálculo do Melhor Horário quando a data ou a rede social mudar
  useEffect(() => {
    if (dataPost) {
      RedesSociaisService.getMelhorHorarioParaData(dataPost, redeSocial).then((res) => {
        if (res) {
          setMelhorHorarioSugerido(res.horario);
          setNomeDiaSugerido(res.diaNome);
        } else {
          setMelhorHorarioSugerido(null);
          setNomeDiaSugerido('');
        }
      });
    }
  }, [dataPost, redeSocial]);

  if (!isOpen) return null;

  // Aplicar Melhor Horário
  const handleAplicarMelhorHorario = () => {
    if (melhorHorarioSugerido) {
      setHorarioPost(melhorHorarioSugerido);
      info('Horário Aplicado', `Horário ajustado para o melhor horário de ${nomeDiaSugerido}: ${melhorHorarioSugerido}`);
    }
  };

  // Upload de Imagem (Arquivo Local / Drag & Drop)
  const processarArquivo = (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      error('Formato não suportado', 'Selecione uma imagem (PNG, JPG, WEBP) ou vídeo (MP4).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultado = reader.result as string;
      if (file.type.startsWith('video/')) {
        setVideoUrl(resultado);
        setFormato('reels_video');
      } else {
        setImagemUrl(resultado);
      }
      success('Mídia carregada', `${file.name} foi adicionado à publicação.`);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processarArquivo(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processarArquivo(e.target.files[0]);
    }
  };

  // Alternar rede adicional
  const handleToggleRedeAdicional = (plataforma: RedeSocialPlataforma) => {
    if (redesAdicionais.includes(plataforma)) {
      setRedesAdicionais(redesAdicionais.filter((p) => p !== plataforma));
    } else {
      setRedesAdicionais([...redesAdicionais, plataforma]);
    }
  };

  // Salvar Postagem
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloInterno.trim()) {
      error('Campo Obrigatório', 'Informe um título interno para identificar a postagem.');
      return;
    }

    if (!dataPost) {
      error('Campo Obrigatório', 'Selecione a data de publicação.');
      return;
    }

    if (!horarioPost) {
      error('Campo Obrigatório', 'Defina o horário da postagem.');
      return;
    }

    try {
      setSalvando(true);
      const postSalvo = await RedesSociaisService.salvarPostagem(
        {
          id: postParaEditar?.id,
          tituloInterno: tituloInterno.trim(),
          legenda: legenda.trim(),
          imagemUrl: imagemUrl || undefined,
          videoUrl: videoUrl || undefined,
          redeSocial,
          redesAdicionais,
          data: dataPost,
          horario: horarioPost,
          categoria,
          status,
          formato,
          statusIntegracao,
          mensagemIntegracao:
            statusIntegracao === 'conectado'
              ? 'Pronto para publicação via Meta Graph API'
              : statusIntegracao === 'nao_conectado'
              ? 'Aguardando conexão com a conta oficial'
              : undefined,
          promocaoId,
          produtoNome,
          precoNormal,
          precoPromocional,
        },
        user?.name || 'Operador',
        user?.id || 'usr_01'
      );

      success(
        postParaEditar ? 'Postagem Atualizada' : 'Postagem Agendada',
        `"${postSalvo.tituloInterno}" foi salvo no cronograma com status ${postSalvo.status.toUpperCase()}.`
      );

      onPostSalvo(postSalvo);
      onClose();
    } catch (err: any) {
      console.error(err);
      error('Erro ao Salvar', 'Não foi possível salvar a postagem.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-4xl bg-[#111116] border border-[#262635] rounded-2xl shadow-2xl shadow-black/90 overflow-hidden z-10 flex flex-col max-h-[92vh] my-auto">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222230] bg-[#161620]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B2CF6] to-[#FF8A00] flex items-center justify-center text-white shadow-lg shadow-[#7B2CF6]/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {postParaEditar ? 'EDITAR PUBLICAÇÃO' : 'NOVA PUBLICAÇÃO & AGENDAMENTO'}
              </h2>
              <p className="text-xs text-zinc-400">
                Mix Variedades Store • Planejamento de Conteúdo e Campanhas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Alerta de Integração com Promoções (se vinculado) */}
          {(promocaoId || produtoNome) && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#FF8A00]/10 via-[#7B2CF6]/10 to-transparent border border-[#FF8A00]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#FF8A00]/20 text-[#FF8A00] flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#FF8A00]">
                    Campanha Vinculada a Promoção
                  </div>
                  <div className="text-sm font-semibold text-white">{produtoNome}</div>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    Preço Normal: <span className="line-through">R$ {precoNormal?.toFixed(2)}</span> • Preço Promoção:{' '}
                    <span className="text-emerald-400 font-bold">R$ {precoPromocional?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (produtoNome && precoNormal && precoPromocional) {
                    const copy = `🔥 MEGA OFERTA MIX VARIEDADES!\n\n${produtoNome}\n❌ De R$ ${precoNormal.toFixed(2)}\n✅ Por apenas R$ ${precoPromocional.toFixed(2)} à vista!\n\nCorra para a Mix Variedades Store ou peça pelo nosso WhatsApp antes que o estoque acabe!\n\n#mixvariedades #promocao #${produtoNome.toLowerCase().replace(/\s+/g, '')}`;
                    setLegenda(copy);
                    info('Copy Atualizada', 'Texto da legenda preenchido com dados da promoção.');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-[#FF8A00]/20 hover:bg-[#FF8A00]/30 text-[#FF8A00] text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Regerar Texto da Promoção
              </button>
            </div>
          )}

          {/* Grid Principal: 2 Colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna Esquerda: Dados Principais e Textos */}
            <div className="lg:col-span-7 space-y-5">
              {/* Título Interno */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Título Interno da Postagem <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={tituloInterno}
                  onChange={(e) => setTituloInterno(e.target.value)}
                  placeholder="Ex: Reels Fones Bluetooth TWS Pro - Lançamento"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#0D0D12] border border-[#2A2A38] rounded-xl text-white text-sm focus:outline-none focus:border-[#7B2CF6] transition-colors"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Usado para organização da equipe no calendário e relatórios.
                </span>
              </div>

              {/* Redes Sociais */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                  Rede Social Principal e Destinos
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Instagram */}
                  <button
                    type="button"
                    onClick={() => setRedeSocial('instagram')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      redeSocial === 'instagram'
                        ? 'bg-gradient-to-r from-[#833ab4]/20 via-[#fd1d1d]/20 to-[#fcb045]/20 border-[#fd1d1d] text-white shadow-lg shadow-[#fd1d1d]/10'
                        : 'bg-[#15151E] border-[#252535] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Instagram className="w-4 h-4 text-[#fd1d1d]" />
                    <span>Instagram</span>
                  </button>

                  {/* Facebook */}
                  <button
                    type="button"
                    onClick={() => setRedeSocial('facebook')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      redeSocial === 'facebook'
                        ? 'bg-[#1877F2]/20 border-[#1877F2] text-white shadow-lg shadow-[#1877F2]/10'
                        : 'bg-[#15151E] border-[#252535] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Facebook className="w-4 h-4 text-[#1877F2]" />
                    <span>Facebook</span>
                  </button>

                  {/* WhatsApp */}
                  <button
                    type="button"
                    onClick={() => setRedeSocial('whatsapp')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      redeSocial === 'whatsapp'
                        ? 'bg-[#25D366]/20 border-[#25D366] text-white'
                        : 'bg-[#15151E] border-[#252535] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Share2 className="w-4 h-4 text-[#25D366]" />
                    <span>WhatsApp</span>
                  </button>

                  {/* TikTok */}
                  <button
                    type="button"
                    onClick={() => setRedeSocial('tiktok')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      redeSocial === 'tiktok'
                        ? 'bg-[#00f2fe]/20 border-[#00f2fe] text-white'
                        : 'bg-[#15151E] border-[#252535] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Video className="w-4 h-4 text-[#00f2fe]" />
                    <span>TikTok</span>
                  </button>
                </div>

                {/* Publicação Simultânea */}
                <div className="mt-2.5 flex items-center gap-2 text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">Publicar também em:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={redesAdicionais.includes('facebook')}
                      onChange={() => handleToggleRedeAdicional('facebook')}
                      className="rounded border-[#2A2A38] text-[#7B2CF6] focus:ring-[#7B2CF6]"
                    />
                    <span>Facebook Page</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white ml-2">
                    <input
                      type="checkbox"
                      checked={redesAdicionais.includes('whatsapp')}
                      onChange={() => handleToggleRedeAdicional('whatsapp')}
                      className="rounded border-[#2A2A38] text-[#7B2CF6] focus:ring-[#7B2CF6]"
                    />
                    <span>Status WhatsApp</span>
                  </label>
                </div>
              </div>

              {/* Data, Horário e "Melhor Horário" */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Data da Publicação <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dataPost}
                      onChange={(e) => setDataPost(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-[#0D0D12] border border-[#2A2A38] rounded-xl text-white text-sm focus:outline-none focus:border-[#7B2CF6] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Horário <span className="text-rose-500">*</span>
                    </label>
                    {melhorHorarioSugerido && (
                      <button
                        type="button"
                        onClick={handleAplicarMelhorHorario}
                        className="text-[11px] text-[#FF8A00] hover:text-[#FFA83A] font-bold flex items-center gap-1 cursor-pointer"
                        title="Aplicar melhor horário recomendado para este dia"
                      >
                        <Sparkles className="w-3 h-3" />
                        Melhor: {melhorHorarioSugerido}
                      </button>
                    )}
                  </div>
                  <input
                    type="time"
                    value={horarioPost}
                    onChange={(e) => setHorarioPost(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#0D0D12] border border-[#2A2A38] rounded-xl text-white text-sm font-mono focus:outline-none focus:border-[#7B2CF6] transition-colors"
                  />
                </div>
              </div>

              {/* Categoria, Status e Formato */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as CategoriaPostagem)}
                    className="w-full px-3 py-2.5 bg-[#0D0D12] border border-[#2A2A38] rounded-xl text-white text-xs focus:outline-none focus:border-[#7B2CF6]"
                  >
                    <option value="promocao">🔥 Promoção</option>
                    <option value="produto">📦 Produto</option>
                    <option value="servico">🔧 Serviço</option>
                    <option value="institucional">🏢 Institucional</option>
                    <option value="data_comemorativa">🎉 Data Comemorativa</option>
                    <option value="outros">✨ Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusPostagem)}
                    className="w-full px-3 py-2.5 bg-[#0D0D12] border border-[#2A2A38] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-[#7B2CF6]"
                  >
                    <option value="ideia">💡 Ideia</option>
                    <option value="rascunho">📝 Rascunho</option>
                    <option value="pronto">✅ Pronto</option>
                    <option value="agendado">🕒 Agendado</option>
                    <option value="publicado">🚀 Publicado</option>
                    <option value="cancelado">❌ Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Formato
                  </label>
                  <select
                    value={formato}
                    onChange={(e) => setFormato(e.target.value as FormatoPostagem)}
                    className="w-full px-3 py-2.5 bg-[#0D0D12] border border-[#2A2A38] rounded-xl text-white text-xs focus:outline-none focus:border-[#7B2CF6]"
                  >
                    <option value="feed_imagem">Feed (1:1 / 4:5)</option>
                    <option value="reels_video">Reels / Vídeo (9:16)</option>
                    <option value="carrossel">Carrossel de Fotos</option>
                    <option value="stories">Stories / Status</option>
                    <option value="post_padrao">Post Padrão</option>
                  </select>
                </div>
              </div>

              {/* Legenda / Copywriting */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Legenda / Copy do Post
                  </label>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {legenda.length} caracteres
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={legenda}
                  onChange={(e) => setLegenda(e.target.value)}
                  placeholder="Escreva a legenda com emojis, informações do produto, valores e hashtags..."
                  className="w-full px-3.5 py-3 bg-[#0D0D12] border border-[#2A2A38] rounded-xl text-white text-sm leading-relaxed focus:outline-none focus:border-[#7B2CF6] transition-colors resize-y custom-scrollbar"
                />
                {/* Botões de Hashtags Rápidas */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-zinc-500 font-semibold mr-1">Hashtags Mix:</span>
                  {['#mixvariedades', '#variedades', '#promocao', '#novidades', '#ofertas', '#compreaqui'].map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setLegenda((prev) => (prev ? `${prev} ${tag}` : tag))}
                        className="px-2 py-0.5 rounded-md bg-[#1A1A24] hover:bg-[#2A2A38] text-zinc-300 text-[11px] font-mono transition-colors cursor-pointer"
                      >
                        +{tag}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Coluna Direita: Upload de Mídia, Integração e Preview */}
            <div className="lg:col-span-5 space-y-5">
              {/* Seletor de Mídia */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Imagem / Mídia da Publicação
                  </label>
                  <button
                    type="button"
                    onClick={() => setMostrarSeletorBiblioteca(!mostrarSeletorBiblioteca)}
                    className="text-xs text-[#7B2CF6] hover:text-[#9D5EFF] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Biblioteca de Mídias
                  </button>
                </div>

                {/* Seletor Rápido da Biblioteca */}
                {mostrarSeletorBiblioteca && (
                  <div className="mb-3 p-3 rounded-xl bg-[#161622] border border-[#2A2A3E] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                      <span>Escolher da Biblioteca da Mix:</span>
                      <button
                        type="button"
                        onClick={() => setMostrarSeletorBiblioteca(false)}
                        className="text-zinc-500 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                      {bibliotecaMidias.map((midia) => (
                        <div
                          key={midia.id}
                          onClick={() => {
                            if (midia.tipo === 'video') {
                              setVideoUrl(midia.url);
                              setFormato('reels_video');
                            } else {
                              setImagemUrl(midia.url);
                            }
                            setMostrarSeletorBiblioteca(false);
                            info('Mídia Selecionada', `"${midia.nome}" foi anexada.`);
                          }}
                          className="group relative aspect-square rounded-lg border border-[#2C2C3E] overflow-hidden cursor-pointer hover:border-[#7B2CF6] transition-colors"
                        >
                          <img
                            src={midia.url}
                            alt={midia.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-white transition-opacity">
                            Usar
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Área de Upload Drag & Drop */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                    isDragging
                      ? 'border-[#7B2CF6] bg-[#7B2CF6]/10'
                      : 'border-[#2A2A38] bg-[#0D0D12] hover:border-[#3E3E52]'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    className="hidden"
                  />

                  {imagemUrl ? (
                    <div className="relative group aspect-video sm:aspect-square max-h-52 w-full rounded-lg overflow-hidden bg-black/40 border border-[#252535] mx-auto">
                      <img
                        src={imagemUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-sm"
                        >
                          Trocar Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setImagemUrl('')}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white text-xs font-bold backdrop-blur-sm"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#1A1A24] text-zinc-400 flex items-center justify-center mx-auto">
                        <UploadCloud className="w-5 h-5 text-[#7B2CF6]" />
                      </div>
                      <div className="text-xs text-zinc-300 font-semibold">
                        Arraste uma imagem ou clique para selecionar
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        PNG, JPG ou WEBP até 10MB
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-[#1F1F2C] hover:bg-[#2A2A3C] text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Buscar no Computador
                      </button>
                    </div>
                  )}
                </div>

                {/* Campo de URL Direta opcional */}
                <div className="mt-2">
                  <input
                    type="url"
                    value={imagemUrl}
                    onChange={(e) => setImagemUrl(e.target.value)}
                    placeholder="Ou cole o link direto da imagem (URL)..."
                    className="w-full px-3 py-1.5 bg-[#0D0D12] border border-[#222230] rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-[#7B2CF6]"
                  />
                </div>
              </div>

              {/* Status de Integração com a API */}
              <div className="p-4 rounded-xl bg-[#14141E] border border-[#242436] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Status da Integração API
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      statusIntegracao === 'conectado'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : statusIntegracao === 'publicado'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : statusIntegracao === 'falha_publicacao'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {statusIntegracao === 'conectado'
                      ? 'Conectado'
                      : statusIntegracao === 'publicado'
                      ? 'Publicado'
                      : statusIntegracao === 'falha_publicacao'
                      ? 'Falha de Publicação'
                      : 'Não Conectado'}
                  </span>
                </div>

                <div className="text-[11px] text-zinc-400 leading-relaxed">
                  {statusIntegracao === 'conectado' ? (
                    <div className="flex items-start gap-2 text-emerald-400/90">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                      <span>
                        Meta Graph API autorizada para @mixvariedades.store. O agendamento será processado
                        automaticamente no horário estipulado.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-amber-400/90">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>
                        A conta não possui conexão de publicação direta ativa. A postagem ficará salva no cronograma
                        interno da Mix.
                      </span>
                    </div>
                  )}
                </div>

                {/* Seletor Manual de Status da API */}
                <div className="pt-2 border-t border-[#1F1F2E] flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Alterar status da API:</span>
                  <select
                    value={statusIntegracao}
                    onChange={(e) => setStatusIntegracao(e.target.value as StatusIntegracaoAPI)}
                    className="px-2.5 py-1 bg-[#0D0D12] border border-[#28283A] rounded-lg text-white text-xs focus:outline-none"
                  >
                    <option value="conectado">Conectado (Meta API)</option>
                    <option value="nao_conectado">Não Conectado</option>
                    <option value="publicado">Publicado</option>
                    <option value="falha_publicacao">Falha de Publicação</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé de Ações */}
          <div className="pt-4 border-t border-[#222230] flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#2A2A3A] text-zinc-300 hover:text-white hover:bg-white/5 text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7B2CF6] to-[#FF8A00] hover:from-[#6D28D9] hover:to-[#EA580C] text-white text-xs font-bold shadow-lg shadow-[#7B2CF6]/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {salvando
                ? 'Salvando Publicação...'
                : postParaEditar
                ? 'Salvar Alterações'
                : 'Confirmar & Agendar Publicação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
