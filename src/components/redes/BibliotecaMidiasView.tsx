import React, { useState, useRef } from 'react';
import type { ItemBibliotecaMidia, TipoMidiaBiblioteca } from '../../types';
import { RedesSociaisService } from '../../services/redesSociaisService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  FolderOpen,
  Plus,
  Image as ImageIcon,
  Video,
  Tag,
  Trash2,
  Share2,
  UploadCloud,
  X,
  Search,
  CheckCircle2,
  Sparkles,
  Maximize2,
} from 'lucide-react';

interface BibliotecaMidiasViewProps {
  midias: ItemBibliotecaMidia[];
  onAtualizarLista: () => void;
  onUsarMidiaEmPost: (midia: ItemBibliotecaMidia) => void;
}

export const BibliotecaMidiasView: React.FC<BibliotecaMidiasViewProps> = ({
  midias,
  onAtualizarLista,
  onUsarMidiaEmPost,
}) => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<'todas' | TipoMidiaBiblioteca>('todas');
  const [busca, setBusca] = useState('');

  // Modal de Upload
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [nomeMidia, setNomeMidia] = useState('');
  const [tipoMidia, setTipoMidia] = useState<TipoMidiaBiblioteca>('foto');
  const [tagsTexto, setTagsTexto] = useState('');
  const [arquivoUrl, setArquivoUrl] = useState('');
  const [arquivoFormato, setArquivoFormato] = useState('PNG');
  const [arquivoTamanho, setArquivoTamanho] = useState('1.5 MB');
  const [arquivoDimensoes, setArquivoDimensoes] = useState('1080x1080');
  const [isDragging, setIsDragging] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Mídia Selecionada para Pré-visualização Ampliada
  const [midiaPreview, setMidiaPreview] = useState<ItemBibliotecaMidia | null>(null);

  // Processamento do Upload Local
  const processarArquivoLocal = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setArquivoUrl(res);
      setNomeMidia(file.name.replace(/\.[^/.]+$/, ''));
      setArquivoFormato(file.type.split('/')[1]?.toUpperCase() || 'ARQUIVO');
      setArquivoTamanho(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);

      if (file.type.startsWith('video/')) {
        setTipoMidia('video');
        setArquivoDimensoes('1080x1920');
      } else {
        setArquivoDimensoes('1080x1080');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSalvarNovaMidia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivoUrl) {
      error('Mídia obrigatória', 'Selecione ou arraste uma imagem ou vídeo.');
      return;
    }
    if (!nomeMidia.trim()) {
      error('Nome obrigatório', 'Informe o nome para identificação do arquivo.');
      return;
    }

    try {
      setEnviando(true);
      const tagsArray = tagsTexto
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      await RedesSociaisService.adicionarMidia(
        {
          nome: nomeMidia.trim(),
          tipo: tipoMidia,
          url: arquivoUrl,
          formato: arquivoFormato,
          dimensoes: arquivoDimensoes,
          tamanho: arquivoTamanho,
          tags: tagsArray.length > 0 ? tagsArray : ['mix', tipoMidia],
        },
        user?.name || 'Marketing Mix'
      );

      success('Mídia Adicionada', `"${nomeMidia}" foi armazenada com sucesso.`);
      setModalUploadAberto(false);
      limparFormUpload();
      onAtualizarLista();
    } catch (err) {
      error('Erro ao salvar', 'Não foi possível registrar a mídia.');
    } finally {
      setEnviando(false);
    }
  };

  const limparFormUpload = () => {
    setNomeMidia('');
    setArquivoUrl('');
    setTagsTexto('');
    setTipoMidia('foto');
  };

  const handleExcluirMidia = async (id: string, nome: string) => {
    if (!confirm(`Deseja remover "${nome}" da biblioteca?`)) return;
    const ok = await RedesSociaisService.excluirMidia(id, user?.name || 'Operador');
    if (ok) {
      success('Mídia Removida', 'Arquivo excluído da biblioteca.');
      onAtualizarLista();
      if (midiaPreview?.id === id) setMidiaPreview(null);
    }
  };

  // Filtragem
  const filtradas = midias.filter((m) => {
    const matchTipo = filtroTipo === 'todas' || m.tipo === filtroTipo;
    const matchBusca =
      !busca ||
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(busca.toLowerCase()));
    return matchTipo && matchBusca;
  });

  const getTipoBadge = (tipo: TipoMidiaBiblioteca) => {
    switch (tipo) {
      case 'logo':
        return { label: 'Logo Oficial', color: 'bg-[#7B2CF6]/20 text-[#A78BFA] border-[#7B2CF6]/30' };
      case 'promocional':
        return { label: 'Promocional', color: 'bg-[#FF8A00]/20 text-[#FFB057] border-[#FF8A00]/30' };
      case 'arte':
        return { label: 'Arte / Moldura', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'video':
        return { label: 'Vídeo / Reels', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'foto':
      default:
        return { label: 'Foto de Produto', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Ação de Enviar */}
      <div className="p-4 rounded-2xl bg-[#111116] border border-[#222230] flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Abas de Tipos de Mídia */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          {[
            { id: 'todas', label: 'Todas as Mídias' },
            { id: 'logo', label: 'Logos' },
            { id: 'foto', label: 'Fotos' },
            { id: 'arte', label: 'Artes' },
            { id: 'video', label: 'Vídeos' },
            { id: 'promocional', label: 'Promocionais' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroTipo(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroTipo === tab.id
                  ? 'bg-[#7B2CF6] text-white shadow-md shadow-[#7B2CF6]/25'
                  : 'text-zinc-400 hover:text-white hover:bg-[#181822]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Busca e Botão de Novo Arquivo */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou tag..."
              className="w-full pl-9 pr-3 py-2 bg-[#0D0D12] border border-[#252535] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#7B2CF6]"
            />
          </div>

          <button
            type="button"
            onClick={() => setModalUploadAberto(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7B2CF6] to-[#FF8A00] hover:from-[#6D28D9] hover:to-[#EA580C] text-white text-xs font-bold shadow-lg shadow-[#7B2CF6]/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Enviar Mídia</span>
          </button>
        </div>
      </div>

      {/* Grid de Cards da Galeria */}
      {filtradas.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#111116] border border-[#222230] text-center space-y-3">
          <FolderOpen className="w-12 h-12 text-zinc-600 mx-auto" />
          <div className="text-sm font-bold text-zinc-300">Nenhuma mídia encontrada</div>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Faça upload de fotos de produtos, logos oficiais ou artes promocionais para facilitar a criação de
            campanhas.
          </p>
          <button
            type="button"
            onClick={() => setModalUploadAberto(true)}
            className="px-4 py-2 rounded-xl bg-[#1C1C28] hover:bg-[#282838] text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
          >
            + Enviar Primeiro Arquivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtradas.map((midia) => {
            const badge = getTipoBadge(midia.tipo);

            return (
              <div
                key={midia.id}
                className="group relative rounded-2xl bg-[#111116] border border-[#222230] hover:border-[#7B2CF6] overflow-hidden shadow-lg transition-all flex flex-col"
              >
                {/* Imagem / Mídia */}
                <div className="relative aspect-square bg-black/40 overflow-hidden">
                  <img
                    src={midia.url}
                    alt={midia.nome}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Badges Flutuantes */}
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md uppercase ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {midia.formato && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/70 text-zinc-300 border border-white/10 backdrop-blur-md">
                        {midia.formato}
                      </span>
                    </div>
                  )}

                  {/* Overlay de Ações no Hover */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                    <button
                      type="button"
                      onClick={() => onUsarMidiaEmPost(midia)}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#7B2CF6] to-[#FF8A00] text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Criar Post
                    </button>
                    <button
                      type="button"
                      onClick={() => setMidiaPreview(midia)}
                      className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                      title="Visualizar Detalhes"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExcluirMidia(midia.id, midia.nome)}
                      className="p-2 rounded-xl bg-rose-500/30 hover:bg-rose-500/50 text-rose-300 transition-colors cursor-pointer"
                      title="Excluir Mídia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Detalhes do Arquivo */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#FF8A00] transition-colors">
                      {midia.nome}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono mt-1">
                      <span>{midia.dimensoes || '1080x1080'}</span>
                      <span>{midia.tamanho || '1.2 MB'}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-2 border-t border-[#1C1C26]">
                    {midia.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono text-zinc-400 bg-[#161622] px-1.5 py-0.5 rounded border border-[#222230]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Upload de Mídia */}
      {modalUploadAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setModalUploadAberto(false)} />

          <div className="relative w-full max-w-lg bg-[#121217] border border-[#252535] rounded-2xl shadow-2xl p-6 z-10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#20202E]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#7B2CF6]/20 text-[#7B2CF6] flex items-center justify-center font-bold">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Enviar Mídia para a Biblioteca
                </h3>
              </div>
              <button
                onClick={() => setModalUploadAberto(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovaMidia} className="space-y-4">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) processarArquivoLocal(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#7B2CF6] bg-[#7B2CF6]/10'
                    : 'border-[#282838] bg-[#0E0E14] hover:border-[#3E3E52]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files?.[0]) processarArquivoLocal(e.target.files[0]);
                  }}
                  accept="image/*,video/*"
                  className="hidden"
                />

                {arquivoUrl ? (
                  <div className="space-y-2">
                    <img
                      src={arquivoUrl}
                      alt="Prévia"
                      className="max-h-36 mx-auto rounded-lg object-contain shadow-md"
                    />
                    <div className="text-xs text-emerald-400 font-bold">
                      Arquivo selecionado com sucesso! Clique para alterar.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadCloud className="w-8 h-8 text-[#7B2CF6] mx-auto" />
                    <div className="text-xs font-bold text-zinc-300">
                      Arraste ou clique para selecionar fotos, logos ou artes
                    </div>
                    <div className="text-[11px] text-zinc-500">PNG, JPG, WEBP, MP4</div>
                  </div>
                )}
              </div>

              {/* URL alternativa */}
              <div>
                <input
                  type="url"
                  value={arquivoUrl}
                  onChange={(e) => setArquivoUrl(e.target.value)}
                  placeholder="Ou cole a URL direta da imagem..."
                  className="w-full px-3 py-2 bg-[#0E0E14] border border-[#252535] rounded-xl text-xs text-white focus:outline-none focus:border-[#7B2CF6]"
                />
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                  Nome da Mídia *
                </label>
                <input
                  type="text"
                  value={nomeMidia}
                  onChange={(e) => setNomeMidia(e.target.value)}
                  placeholder="Ex: Foto Fone Bluetooth Fundo Branco"
                  required
                  className="w-full px-3 py-2 bg-[#0E0E14] border border-[#252535] rounded-xl text-xs text-white focus:outline-none focus:border-[#7B2CF6]"
                />
              </div>

              {/* Categoria / Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Tipo de Mídia
                  </label>
                  <select
                    value={tipoMidia}
                    onChange={(e) => setTipoMidia(e.target.value as TipoMidiaBiblioteca)}
                    className="w-full px-3 py-2 bg-[#0E0E14] border border-[#252535] rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="foto">Foto de Produto</option>
                    <option value="logo">Logo Oficial</option>
                    <option value="arte">Arte / Moldura</option>
                    <option value="promocional">Material Promocional</option>
                    <option value="video">Vídeo / Reels</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={tagsTexto}
                    onChange={(e) => setTagsTexto(e.target.value)}
                    placeholder="fones, bluetooth, som"
                    className="w-full px-3 py-2 bg-[#0E0E14] border border-[#252535] rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="pt-3 border-t border-[#20202E] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalUploadAberto(false)}
                  className="px-4 py-2 rounded-xl border border-[#282838] text-zinc-400 hover:text-white text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7B2CF6] to-[#FF8A00] text-white text-xs font-bold shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {enviando ? 'Enviando...' : 'Salvar na Biblioteca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Ampliado */}
      {midiaPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setMidiaPreview(null)} />
          <div className="relative max-w-2xl w-full bg-[#111116] border border-[#262638] rounded-2xl overflow-hidden z-10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{midiaPreview.nome}</h3>
              <button onClick={() => setMidiaPreview(null)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-hidden rounded-xl bg-black flex items-center justify-center">
              <img
                src={midiaPreview.url}
                alt={midiaPreview.nome}
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#222230]">
              <div className="text-xs text-zinc-400 font-mono">
                {midiaPreview.formato} • {midiaPreview.dimensoes} • {midiaPreview.tamanho}
              </div>
              <button
                type="button"
                onClick={() => {
                  const m = midiaPreview;
                  setMidiaPreview(null);
                  onUsarMidiaEmPost(m);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7B2CF6] to-[#FF8A00] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Share2 className="w-4 h-4" />
                Criar Post com Esta Mídia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
