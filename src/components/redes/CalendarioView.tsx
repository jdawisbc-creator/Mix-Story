import React, { useState } from 'react';
import type {
  PostagemSocial,
  StatusPostagem,
  RedeSocialPlataforma,
  CategoriaPostagem,
  MelhorHorarioConfig,
} from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Instagram,
  Facebook,
  Share2,
  Plus,
  Sparkles,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Trash2,
  Video,
  Tag,
} from 'lucide-react';

interface CalendarioViewProps {
  postagens: PostagemSocial[];
  melhoresHorarios: MelhorHorarioConfig[];
  onSelectPost: (post: PostagemSocial) => void;
  onEditarPost: (post: PostagemSocial) => void;
  onCriarNoDia: (dataStr: string) => void;
  onMudarDataPost: (postId: string, novaData: string) => void;
}

export const CalendarioView: React.FC<CalendarioViewProps> = ({
  postagens,
  melhoresHorarios,
  onSelectPost,
  onEditarPost,
  onCriarNoDia,
  onMudarDataPost,
}) => {
  // Estado de Visualização: Mês, Semana ou Lista
  const [modoVisualizacao, setModoVisualizacao] = useState<'mes' | 'semana' | 'lista'>('mes');

  // Data Base para Navegação (Inicia no mês atual)
  const [dataAtual, setDataAtual] = useState(new Date());

  // Filtros para a visão de lista / geral
  const [busca, setBusca] = useState('');
  const [filtroRede, setFiltroRede] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');

  // Drag and Drop de Postagens entre dias
  const [postArrastandoId, setPostArrastandoId] = useState<string | null>(null);

  // Navegação de Período
  const navegarPeriodo = (delta: number) => {
    const nova = new Date(dataAtual);
    if (modoVisualizacao === 'mes') {
      nova.setMonth(nova.getMonth() + delta);
    } else if (modoVisualizacao === 'semana') {
      nova.setDate(nova.getDate() + delta * 7);
    } else {
      nova.setMonth(nova.getMonth() + delta);
    }
    setDataAtual(nova);
  };

  const irParaHoje = () => {
    setDataAtual(new Date());
  };

  // Cores de Status
  const getStatusColor = (status: StatusPostagem) => {
    switch (status) {
      case 'publicado':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'agendado':
        return 'bg-[#7B2CF6]/25 text-[#C4B5FD] border-[#7B2CF6]/40';
      case 'pronto':
        return 'bg-[#FF8A00]/25 text-[#FFD6A5] border-[#FF8A00]/40';
      case 'rascunho':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'ideia':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'cancelado':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
  };

  // Helper para nome do mês/ano
  const nomesMeses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const tituloPeriodo = `${nomesMeses[dataAtual.getMonth()]} de ${dataAtual.getFullYear()}`;

  // =========================================================================
  // 1. VISÃO MÊS
  // =========================================================================
  const renderVisaoMes = () => {
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0 = Domingo
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
    const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();

    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(
      hoje.getDate()
    ).padStart(2, '0')}`;

    // Gerar células
    const celulas = [];

    // Dias do mês anterior
    for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
      const diaNum = totalDiasMesAnterior - i;
      const mesAnt = mes === 0 ? 11 : mes - 1;
      const anoAnt = mes === 0 ? ano - 1 : ano;
      const dataStr = `${anoAnt}-${String(mesAnt + 1).padStart(2, '0')}-${String(diaNum).padStart(
        2,
        '0'
      )}`;

      celulas.push({
        dia: diaNum,
        dataStr,
        isMesAtual: false,
        isHoje: dataStr === hojeStr,
      });
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDiasMes; d++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      celulas.push({
        dia: d,
        dataStr,
        isMesAtual: true,
        isHoje: dataStr === hojeStr,
      });
    }

    // Dias do próximo mês para completar 35 ou 42
    const totalNecessario = celulas.length > 35 ? 42 : 35;
    const diasRestantes = totalNecessario - celulas.length;
    for (let d = 1; d <= diasRestantes; d++) {
      const mesProx = mes === 11 ? 0 : mes + 1;
      const anoProx = mes === 11 ? ano + 1 : ano;
      const dataStr = `${anoProx}-${String(mesProx + 1).padStart(2, '0')}-${String(d).padStart(
        2,
        '0'
      )}`;
      celulas.push({
        dia: d,
        dataStr,
        isMesAtual: false,
        isHoje: dataStr === hojeStr,
      });
    }

    return (
      <div className="bg-[#111116] border border-[#20202D] rounded-2xl overflow-hidden shadow-xl">
        {/* Cabeçalho dos Dias da Semana */}
        <div className="grid grid-cols-7 border-b border-[#20202D] bg-[#161620] text-center text-xs font-bold text-zinc-400 py-3">
          <span className="text-zinc-500">DOM</span>
          <span>SEG</span>
          <span className="text-[#FF8A00]">TER</span>
          <span>QUA</span>
          <span className="text-[#7B2CF6]">QUI</span>
          <span className="text-emerald-400">SEX</span>
          <span className="text-amber-400">SÁB</span>
        </div>

        {/* Grid de Dias */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[#1D1D28]">
          {celulas.map((c, idx) => {
            const postsDoDia = postagens.filter((p) => p.data === c.dataStr);
            const [anoC, mesC, diaC] = c.dataStr.split('-').map(Number);
            const diaSemanaNum = new Date(anoC, mesC - 1, diaC).getDay();
            const configHorario = melhoresHorarios.find((h) => h.diaSemana === diaSemanaNum);

            return (
              <div
                key={idx}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (postArrastandoId) {
                    onMudarDataPost(postArrastandoId, c.dataStr);
                    setPostArrastandoId(null);
                  }
                }}
                className={`min-h-[125px] sm:min-h-[140px] p-2 flex flex-col transition-colors group relative ${
                  !c.isMesAtual
                    ? 'bg-[#0B0B0E]/60 text-zinc-600'
                    : c.isHoje
                    ? 'bg-[#7B2CF6]/5 text-white'
                    : 'bg-[#101015] text-zinc-300 hover:bg-[#15151E]'
                }`}
              >
                {/* Cabeçalho da Célula */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      c.isHoje
                        ? 'bg-gradient-to-r from-[#7B2CF6] to-[#FF8A00] text-white shadow-md'
                        : c.isMesAtual
                        ? 'text-zinc-200 group-hover:text-white'
                        : 'text-zinc-600'
                    }`}
                  >
                    {c.dia}
                  </span>

                  {/* Indicador de Melhor Horário */}
                  {c.isMesAtual && configHorario && (
                    <span
                      title={`Melhor Horário: ${configHorario.horarioPrincipal} (Engajamento ${configHorario.engajamentoEstimado})`}
                      className="text-[10px] font-mono text-[#FF8A00] hidden sm:flex items-center gap-0.5 opacity-70 group-hover:opacity-100"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      {configHorario.horarioPrincipal}
                    </span>
                  )}

                  {/* Botão de adicionar post rápido no dia */}
                  <button
                    type="button"
                    onClick={() => onCriarNoDia(c.dataStr)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded bg-white/10 hover:bg-[#7B2CF6] text-white flex items-center justify-center text-xs transition-opacity cursor-pointer"
                    title={`Agendar publicação para ${c.dataStr}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Lista de Postagens no Dia */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-24 custom-scrollbar">
                  {postsDoDia.map((post) => (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={() => setPostArrastandoId(post.id)}
                      onClick={() => onSelectPost(post)}
                      className={`p-1.5 rounded-lg border text-[11px] leading-tight cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex items-center gap-1.5 ${getStatusColor(
                        post.status
                      )}`}
                    >
                      {/* Ícone da Rede */}
                      {post.redeSocial === 'instagram' ? (
                        <Instagram className="w-3 h-3 text-[#fd1d1d] shrink-0" />
                      ) : post.redeSocial === 'facebook' ? (
                        <Facebook className="w-3 h-3 text-[#1877F2] shrink-0" />
                      ) : (
                        <Share2 className="w-3 h-3 text-[#7B2CF6] shrink-0" />
                      )}

                      {/* Miniatura ou Horário */}
                      <span className="font-mono text-[10px] opacity-80 shrink-0">
                        {post.horario}
                      </span>

                      {/* Título com truncamento */}
                      <span className="font-bold truncate flex-1">{post.tituloInterno}</span>

                      {/* Indicador de Promoção */}
                      {post.promocaoId && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A00] shrink-0" title="Promoção vinculada" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // =========================================================================
  // 2. VISÃO SEMANA
  // =========================================================================
  const renderVisaoSemana = () => {
    // Calcular o início da semana (Domingo) com base em dataAtual
    const d = new Date(dataAtual);
    const diaSemana = d.getDay();
    const domingo = new Date(d);
    domingo.setDate(d.getDate() - diaSemana);

    const diasSemana = [];
    const hojeStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const diaItem = new Date(domingo);
      diaItem.setDate(domingo.getDate() + i);
      const dataStr = `${diaItem.getFullYear()}-${String(diaItem.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(diaItem.getDate()).padStart(2, '0')}`;

      diasSemana.push({
        dataObj: diaItem,
        dataStr: dataStr,
        diaNum: diaItem.getDate(),
        nomeDia: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][i],
        isHoje: dataStr === hojeStr,
        config: melhoresHorarios.find((h) => h.diaSemana === i),
      });
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {diasSemana.map((coluna) => {
          const posts = postagens.filter((p) => p.data === coluna.dataStr);

          return (
            <div
              key={coluna.dataStr}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (postArrastandoId) {
                  onMudarDataPost(postArrastandoId, coluna.dataStr);
                  setPostArrastandoId(null);
                }
              }}
              className={`flex flex-col rounded-2xl border p-3 min-h-[460px] transition-all ${
                coluna.isHoje
                  ? 'bg-[#151520] border-[#7B2CF6]/50 shadow-lg shadow-[#7B2CF6]/10'
                  : 'bg-[#111116] border-[#22222F]'
              }`}
            >
              {/* Topo do Dia */}
              <div className="pb-3 border-b border-[#20202E] mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {coluna.nomeDia}
                  </span>
                  <span
                    className={`text-sm font-black px-2 py-0.5 rounded-full ${
                      coluna.isHoje
                        ? 'bg-[#7B2CF6] text-white shadow-md'
                        : 'text-zinc-300'
                    }`}
                  >
                    {coluna.diaNum}
                  </span>
                </div>

                {/* Card de Melhor Horário Recomendado */}
                {coluna.config && (
                  <div className="mt-2 p-2 rounded-xl bg-gradient-to-r from-[#FF8A00]/10 via-[#7B2CF6]/10 to-transparent border border-[#FF8A00]/20 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF8A00]" />
                      <div className="text-[10px] font-bold text-zinc-300">
                        Pico: <span className="text-[#FF8A00] font-mono">{coluna.config.horarioPrincipal}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase text-zinc-500">
                      {coluna.config.engajamentoEstimado}
                    </span>
                  </div>
                )}
              </div>

              {/* Botão de Adicionar Post no Dia */}
              <button
                type="button"
                onClick={() => onCriarNoDia(coluna.dataStr)}
                className="w-full py-2 mb-3 rounded-xl border border-dashed border-[#28283A] hover:border-[#7B2CF6] text-zinc-400 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agendar
              </button>

              {/* Postagens da Coluna */}
              <div className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar">
                {posts.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center p-3 text-zinc-600">
                    <span className="text-xs">Nenhum post agendado</span>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={() => setPostArrastandoId(post.id)}
                      onClick={() => onSelectPost(post)}
                      className="group p-3 rounded-xl bg-[#161622] border border-[#262638] hover:border-[#7B2CF6] shadow-md transition-all cursor-pointer space-y-2"
                    >
                      {/* Header do Card */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-[#FF8A00]">
                          <Clock className="w-3 h-3" />
                          {post.horario}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusColor(
                            post.status
                          )}`}
                        >
                          {post.status}
                        </span>
                      </div>

                      {/* Miniatura de Imagem se houver */}
                      {post.imagemUrl && (
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/40 border border-[#252535]">
                          <img
                            src={post.imagemUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}

                      {/* Título e Legenda Curta */}
                      <div>
                        <div className="text-xs font-bold text-white line-clamp-1">
                          {post.tituloInterno}
                        </div>
                        {post.legenda && (
                          <div className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                            {post.legenda}
                          </div>
                        )}
                      </div>

                      {/* Rodapé do Card */}
                      <div className="pt-2 border-t border-[#202030] flex items-center justify-between text-[10px] text-zinc-400">
                        <div className="flex items-center gap-1">
                          {post.redeSocial === 'instagram' ? (
                            <Instagram className="w-3 h-3 text-[#fd1d1d]" />
                          ) : (
                            <Facebook className="w-3 h-3 text-[#1877F2]" />
                          )}
                          <span className="capitalize">{post.categoria}</span>
                        </div>

                        {post.produtoNome && (
                          <span className="text-[#FF8A00] font-bold">R$ {post.precoPromocional?.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // =========================================================================
  // 3. VISÃO LISTA
  // =========================================================================
  const renderVisaoLista = () => {
    // Filtragem de Posts
    const filtrados = postagens.filter((post) => {
      const matchBusca =
        !busca ||
        post.tituloInterno.toLowerCase().includes(busca.toLowerCase()) ||
        post.legenda?.toLowerCase().includes(busca.toLowerCase()) ||
        post.produtoNome?.toLowerCase().includes(busca.toLowerCase());

      const matchRede = filtroRede === 'todas' || post.redeSocial === filtroRede;
      const matchStatus = filtroStatus === 'todas' || post.status === filtroStatus;
      const matchCat = filtroCategoria === 'todas' || post.categoria === filtroCategoria;

      return matchBusca && matchRede && matchStatus && matchCat;
    });

    // Ordenação por data/horário decrescente
    const ordenados = [...filtrados].sort((a, b) => {
      return `${b.data} ${b.horario}`.localeCompare(`${a.data} ${a.horario}`);
    });

    return (
      <div className="space-y-4">
        {/* Barra de Filtros da Lista */}
        <div className="p-4 rounded-2xl bg-[#111116] border border-[#222230] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar título, legenda, produto..."
              className="w-full pl-9 pr-3 py-2 bg-[#0D0D12] border border-[#252535] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#7B2CF6]"
            />
          </div>

          <div>
            <select
              value={filtroRede}
              onChange={(e) => setFiltroRede(e.target.value)}
              className="w-full px-3 py-2 bg-[#0D0D12] border border-[#252535] rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-[#7B2CF6]"
            >
              <option value="todas">Todas as Redes Sociais</option>
              <option value="instagram">Instagram Feed / Reels</option>
              <option value="facebook">Facebook Page</option>
              <option value="whatsapp">WhatsApp Status</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>

          <div>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full px-3 py-2 bg-[#0D0D12] border border-[#252535] rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-[#7B2CF6]"
            >
              <option value="todas">Todos os Status</option>
              <option value="agendado">Agendado</option>
              <option value="pronto">Pronto</option>
              <option value="publicado">Publicado</option>
              <option value="rascunho">Rascunho</option>
              <option value="ideia">Ideia</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-3 py-2 bg-[#0D0D12] border border-[#252535] rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-[#7B2CF6]"
            >
              <option value="todas">Todas as Categorias</option>
              <option value="promocao">Promoção</option>
              <option value="produto">Produto</option>
              <option value="servico">Serviço</option>
              <option value="institucional">Institucional</option>
              <option value="data_comemorativa">Data Comemorativa</option>
              <option value="outros">Outros</option>
            </select>
          </div>
        </div>

        {/* Tabela de Publicações */}
        <div className="bg-[#111116] border border-[#20202D] rounded-2xl overflow-hidden shadow-xl">
          {ordenados.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 space-y-2">
              <CalendarIcon className="w-8 h-8 mx-auto text-zinc-600" />
              <div className="text-sm font-semibold text-zinc-300">Nenhuma postagem encontrada</div>
              <p className="text-xs text-zinc-500">Tente ajustar seus termos de busca ou filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161622] border-b border-[#222232] text-zinc-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Data & Horário</th>
                    <th className="py-3 px-4">Publicação</th>
                    <th className="py-3 px-4">Rede</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">API Meta</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B1B26]">
                  {ordenados.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-[#161622]/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectPost(post)}
                    >
                      {/* Data / Horário */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-white">{post.data}</div>
                        <div className="text-[11px] text-[#FF8A00] font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.horario}
                        </div>
                      </td>

                      {/* Publicação */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {post.imagemUrl ? (
                            <img
                              src={post.imagemUrl}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover bg-black/40 border border-[#252535] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#181824] border border-[#252535] flex items-center justify-center text-zinc-500 shrink-0">
                              <Share2 className="w-4 h-4" />
                            </div>
                          )}

                          <div className="min-w-0 max-w-sm">
                            <div className="font-bold text-zinc-200 group-hover:text-white truncate">
                              {post.tituloInterno}
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {post.legenda || 'Sem legenda'}
                            </div>
                            {post.produtoNome && (
                              <div className="text-[10px] text-[#FF8A00] font-semibold mt-0.5">
                                Promoção: {post.produtoNome} (R$ {post.precoPromocional?.toFixed(2)})
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Rede */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                          {post.redeSocial === 'instagram' ? (
                            <Instagram className="w-4 h-4 text-[#fd1d1d]" />
                          ) : post.redeSocial === 'facebook' ? (
                            <Facebook className="w-4 h-4 text-[#1877F2]" />
                          ) : (
                            <Share2 className="w-4 h-4 text-[#7B2CF6]" />
                          )}
                          <span className="capitalize">{post.redeSocial}</span>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#181824] border border-[#262638] text-zinc-300">
                          {post.categoria}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(
                            post.status
                          )}`}
                        >
                          {post.status}
                        </span>
                      </td>

                      {/* Status da Integração API */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-semibold flex items-center gap-1 ${
                            post.statusIntegracao === 'conectado'
                              ? 'text-emerald-400'
                              : post.statusIntegracao === 'publicado'
                              ? 'text-blue-400'
                              : 'text-zinc-500'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {post.statusIntegracao === 'conectado'
                            ? 'Conectado'
                            : post.statusIntegracao === 'publicado'
                            ? 'Publicado'
                            : 'Pendente'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div
                          className="flex items-center justify-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectPost(post)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Visualizar Detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditarPost(post)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-[#FF8A00] hover:bg-[#FF8A00]/10 transition-colors"
                            title="Editar Publicação"
                          >
                            <Edit3 className="w-4 h-4" />
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
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Barra de Controles do Calendário */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#111116] border border-[#222230]">
        {/* Navegação Mês / Semana / Período */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navegarPeriodo(-1)}
              className="p-2 rounded-xl bg-[#181822] hover:bg-[#222232] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Período Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navegarPeriodo(1)}
              className="p-2 rounded-xl bg-[#181822] hover:bg-[#222232] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Próximo Período"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-base font-bold text-white tracking-wide">{tituloPeriodo}</span>

          <button
            type="button"
            onClick={irParaHoje}
            className="px-3 py-1.5 rounded-xl bg-[#1F1F2C] hover:bg-[#2A2A3C] text-xs font-bold text-zinc-200 transition-colors cursor-pointer"
          >
            Hoje
          </button>
        </div>

        {/* Alternador de Visualizações: MÊS / SEMANA / LISTA */}
        <div className="flex items-center p-1 rounded-xl bg-[#0D0D12] border border-[#222232] w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={() => setModoVisualizacao('mes')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              modoVisualizacao === 'mes'
                ? 'bg-[#7B2CF6] text-white shadow-md shadow-[#7B2CF6]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Mês</span>
          </button>

          <button
            type="button"
            onClick={() => setModoVisualizacao('semana')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              modoVisualizacao === 'semana'
                ? 'bg-[#7B2CF6] text-white shadow-md shadow-[#7B2CF6]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Semana</span>
          </button>

          <button
            type="button"
            onClick={() => setModoVisualizacao('lista')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              modoVisualizacao === 'lista'
                ? 'bg-[#7B2CF6] text-white shadow-md shadow-[#7B2CF6]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>
        </div>
      </div>

      {/* Renderização da Visualização Ativa */}
      {modoVisualizacao === 'mes' && renderVisaoMes()}
      {modoVisualizacao === 'semana' && renderVisaoSemana()}
      {modoVisualizacao === 'lista' && renderVisaoLista()}
    </div>
  );
};
