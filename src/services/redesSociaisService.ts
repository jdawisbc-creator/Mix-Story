import type {
  PostagemSocial,
  ItemBibliotecaMidia,
  MelhorHorarioConfig,
  ContaRedeSocial,
  StatusPostagem,
  RedeSocialPlataforma,
} from '../types';
import { AuditService } from './auditService';

const STORAGE_POSTS_KEY = 'mix_gestao_postagens_sociais';
const STORAGE_MIDIAS_KEY = 'mix_gestao_biblioteca_midias';
const STORAGE_MELHORES_HORARIOS_KEY = 'mix_gestao_melhores_horarios';
const STORAGE_CONTAS_KEY = 'mix_gestao_contas_sociais';

// Melhores Horários Padrão para a Mix Variedades
const MELHORES_HORARIOS_PADRAO: MelhorHorarioConfig[] = [
  {
    diaSemana: 0,
    nomeDia: 'Domingo',
    horarioPrincipal: '18:30',
    horarioSecundario: '11:00',
    engajamentoEstimado: 'alto',
    redeSocial: 'instagram',
    observacao: 'Pico de engajamento no início da noite (relaxamento e preparação para a semana).',
  },
  {
    diaSemana: 1,
    nomeDia: 'Segunda-feira',
    horarioPrincipal: '12:15',
    horarioSecundario: '19:00',
    engajamentoEstimado: 'medio',
    redeSocial: 'instagram',
    observacao: 'Horário de almoço comercial e final de expediente.',
  },
  {
    diaSemana: 2,
    nomeDia: 'Terça-feira',
    horarioPrincipal: '19:30',
    horarioSecundario: '12:30',
    engajamentoEstimado: 'muito_alto',
    redeSocial: 'instagram',
    observacao: 'Excelente taxa de visualizações de Stories e Reels de produtos.',
  },
  {
    diaSemana: 3,
    nomeDia: 'Quarta-feira',
    horarioPrincipal: '18:00',
    horarioSecundario: '12:00',
    engajamentoEstimado: 'alto',
    redeSocial: 'instagram',
    observacao: 'Meio de semana: público muito receptivo a ofertas e novidades.',
  },
  {
    diaSemana: 4,
    nomeDia: 'Quinta-feira',
    horarioPrincipal: '19:00',
    horarioSecundario: '12:45',
    engajamentoEstimado: 'muito_alto',
    redeSocial: 'instagram',
    observacao: 'Dia ideal para antecipar promoções do final de semana (#TBT ou prévia).',
  },
  {
    diaSemana: 5,
    nomeDia: 'Sexta-feira',
    horarioPrincipal: '17:30',
    horarioSecundario: '20:00',
    engajamentoEstimado: 'muito_alto',
    redeSocial: 'instagram',
    observacao: 'Início do fim de semana, excelente para compras e visitas presenciais à loja.',
  },
  {
    diaSemana: 6,
    nomeDia: 'Sábado',
    horarioPrincipal: '11:30',
    horarioSecundario: '16:00',
    engajamentoEstimado: 'alto',
    redeSocial: 'instagram',
    observacao: 'Manhã de sábado: público buscando presentes e utilidades para o fim de semana.',
  },
];

// Contas de Redes Sociais da Mix
const CONTAS_PADRAO: ContaRedeSocial[] = [
  {
    id: 'conta_instagram_01',
    plataforma: 'instagram',
    nomeExibicao: 'Mix Variedades Store Oficial',
    usuarioOuPagina: '@mixvariedades.store',
    conectado: true,
    statusConexao: 'conectado',
    ultimaVerificacao: 'Hoje às 09:42',
    detalhes: 'Meta Graph API v20.0 • Permissões de publicação e agendamento ativas.',
  },
  {
    id: 'conta_facebook_01',
    plataforma: 'facebook',
    nomeExibicao: 'Página Mix Variedades Store',
    usuarioOuPagina: 'facebook.com/mixvariedadesstore',
    conectado: true,
    statusConexao: 'conectado',
    ultimaVerificacao: 'Hoje às 09:42',
    detalhes: 'Facebook Pages API • Conectado à conta empresarial da loja.',
  },
  {
    id: 'conta_whatsapp_01',
    plataforma: 'whatsapp',
    nomeExibicao: 'WhatsApp Business Mix Store',
    usuarioOuPagina: '(84) 99999-0000',
    conectado: false,
    statusConexao: 'nao_conectado',
    detalhes: 'Pronto para integração com WhatsApp Cloud API para catálogo e status.',
  },
  {
    id: 'conta_tiktok_01',
    plataforma: 'tiktok',
    nomeExibicao: 'TikTok Mix Variedades',
    usuarioOuPagina: '@mixvariedades',
    conectado: false,
    statusConexao: 'nao_conectado',
    detalhes: 'Estruturado para futura integração com TikTok for Business.',
  },
];

// Biblioteca de Mídias Padrão
const MIDIAS_PADRAO: ItemBibliotecaMidia[] = [
  {
    id: 'mid_01',
    nome: 'Logo Oficial Mix Variedades (Vetor Alta Resolução)',
    tipo: 'logo',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    formato: 'PNG',
    dimensoes: '1080x1080',
    tamanho: '1.4 MB',
    dataUpload: '2026-09-01',
    tags: ['logo', 'identidade', 'oficial', 'vetor'],
    descricao: 'Logo com degradê roxo e laranja sobre fundo preto clássico.',
  },
  {
    id: 'mid_02',
    nome: 'Arte Promocional "Super Ofertas da Semana"',
    tipo: 'promocional',
    url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
    formato: 'JPG',
    dimensoes: '1080x1080',
    tamanho: '2.1 MB',
    dataUpload: '2026-09-10',
    tags: ['promocao', 'feed', 'ofertas', 'descontos'],
    descricao: 'Template quadrado pronto para inserção de preços e chamadas de desconto.',
  },
  {
    id: 'mid_03',
    nome: 'Foto Fone de Ouvido Bluetooth Sem Fio TWS',
    tipo: 'foto',
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    formato: 'JPG',
    dimensoes: '1080x1350',
    tamanho: '1.8 MB',
    dataUpload: '2026-09-12',
    tags: ['eletronicos', 'fones', 'bluetooth', 'produto'],
    descricao: 'Fotografia de estúdio iluminação profissional em fundo neutro.',
  },
  {
    id: 'mid_04',
    nome: 'Carrossel: Moldura Institucional Mix Store',
    tipo: 'arte',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    formato: 'PNG',
    dimensoes: '1080x1080',
    tamanho: '890 KB',
    dataUpload: '2026-09-14',
    tags: ['carrossel', 'moldura', 'dicas', 'institucional'],
    descricao: 'Moldura elegante com faixas roxas e alaranjadas para postagens de utilidades.',
  },
  {
    id: 'mid_05',
    nome: 'Vídeo: Tour Rápido pelos Lançamentos da Loja',
    tipo: 'video',
    url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80',
    formato: 'MP4',
    dimensoes: '1080x1920',
    tamanho: '14.5 MB',
    dataUpload: '2026-09-15',
    tags: ['reels', 'video', 'tour', 'novidades'],
    descricao: 'Gravação em formato vertical 9:16 ideal para Reels e Stories.',
  },
];

// Helper para calcular datas relativas a hoje
function formatarDataRelativa(diasOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + diasOffset);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Postagens Padrão Realistas para a Mix Store
const POSTAGENS_PADRAO: PostagemSocial[] = [
  {
    id: 'post_01',
    tituloInterno: 'Lançamento Fones Bluetooth TWS Pro - Alta Definição',
    legenda:
      '🎧 QUALIDADE DE SOM QUE SURPREENDE!\n\nChegaram na Mix Variedades Store os novos Fones Bluetooth TWS Pro com cancelamento de ruído e bateria de até 28 horas!\n\n✨ Venha testar na loja ou garanta pelo nosso WhatsApp. Preço especial de lançamento!\n\n#mixvariedades #tecnologia #fonesdeouvido #promocao #novidades',
    imagemUrl:
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    redeSocial: 'instagram',
    redesAdicionais: ['facebook'],
    data: formatarDataRelativa(1),
    horario: '19:30',
    categoria: 'produto',
    status: 'agendado',
    formato: 'feed_imagem',
    statusIntegracao: 'conectado',
    mensagemIntegracao: 'Agendado no Meta Graph API para publicação automática.',
    criadoPor: 'Marketing Mix',
    criadoEm: '2026-09-16T10:00:00Z',
  },
  {
    id: 'post_02',
    tituloInterno: 'Super Oferta: Garrafa Térmica Inox 1L com Termômetro Digital',
    legenda:
      '🔥 OFERTA IMPERDÍVEL NA MIX VARIEDADES!\n\nGarrafa Térmica Inox 1L com visor LED de temperatura digital:\n❌ De: R$ 79,90\n✅ Por apenas: R$ 49,90 no Pix ou Dinheiro!\n\nÁgua gelada por até 24h ou café quentinho o dia todo. Corre que o estoque é limitado!\n\n#mixvariedades #promocao #garrafatermica #utilidades #ofertas',
    imagemUrl:
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
    redeSocial: 'instagram',
    redesAdicionais: ['facebook'],
    data: formatarDataRelativa(2),
    horario: '18:00',
    categoria: 'promocao',
    status: 'pronto',
    formato: 'feed_imagem',
    statusIntegracao: 'conectado',
    produtoNome: 'Garrafa Térmica Inox 1L Display LED',
    precoNormal: 79.9,
    precoPromocional: 49.9,
    criadoPor: 'Gerente Comercial',
    criadoEm: '2026-09-16T11:30:00Z',
  },
  {
    id: 'post_03',
    tituloInterno: 'Vídeo Reels: Conheça os 5 Acessórios Mais Vendidos da Semana',
    legenda:
      '🎬 TOP 5 DA SEMANA QUE VOCÊ PRECISA CONHECER!\n\nVocê já conhece os itens queridinhos dos nossos clientes? Arraste até o final e comente aqui qual é o seu favorito!\n\n📍 Mix Variedades Store - Tudo que você precisa em um só lugar!\n\n#reelsmix #mixvariedades #acessorios #utilidades',
    videoUrl: 'https://assets.mixstore.com/videos/reels_top5.mp4',
    imagemUrl:
      'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80',
    redeSocial: 'instagram',
    data: formatarDataRelativa(3),
    horario: '19:00',
    categoria: 'produto',
    status: 'agendado',
    formato: 'reels_video',
    statusIntegracao: 'conectado',
    criadoPor: 'Marketing Mix',
    criadoEm: '2026-09-15T16:20:00Z',
  },
  {
    id: 'post_04',
    tituloInterno: 'Carrossel Dicas: Como Preservar a Bateria do seu Smartphone',
    legenda:
      '💡 DICA DE OURO DA ASSISTÊNCIA TÉCNICA MIX!\n\nSua bateria anda durando pouco? Separamos 4 hábitos simples para você prolongar a vida útil do seu celular hoje mesmo.\n\nSalve este post para consultar depois e compartilhe com um amigo!\n\n#dicasmix #assistenciatecnica #bateriacelular #mixvariedades',
    imagemUrl:
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    redeSocial: 'instagram',
    redesAdicionais: ['facebook'],
    data: formatarDataRelativa(-2),
    horario: '17:30',
    categoria: 'servico',
    status: 'publicado',
    formato: 'carrossel',
    statusIntegracao: 'publicado',
    mensagemIntegracao: 'Publicado com sucesso via Meta Graph API em 14/09 às 17:30.',
    criadoPor: 'Técnico Especialista',
    criadoEm: '2026-09-14T14:00:00Z',
  },
  {
    id: 'post_05',
    tituloInterno: 'Ideia: Promoção Especial de Dia das Crianças Mix',
    legenda:
      'Brinquedos educativos, jogos de tabuleiro e eletrônicos infantis com descontos progressivos para a semana das crianças.',
    redeSocial: 'instagram',
    data: formatarDataRelativa(7),
    horario: '12:00',
    categoria: 'data_comemorativa',
    status: 'ideia',
    formato: 'feed_imagem',
    statusIntegracao: 'nao_conectado',
    criadoPor: 'Diretoria Mix',
    criadoEm: '2026-09-16T09:15:00Z',
  },
  {
    id: 'post_06',
    tituloInterno: 'Rascunho: Comunicado de Horário Especial de Feriado',
    legenda:
      'Informamos aos nossos clientes e amigos que no próximo feriado funcionaremos em horário especial das 08h às 13h.',
    redeSocial: 'facebook',
    data: formatarDataRelativa(5),
    horario: '10:00',
    categoria: 'institucional',
    status: 'rascunho',
    formato: 'post_padrao',
    statusIntegracao: 'nao_conectado',
    criadoPor: 'Atendimento',
    criadoEm: '2026-09-16T15:00:00Z',
  },
];

export class RedesSociaisService {
  // ==========================================
  // 1. POSTAGENS
  // ==========================================
  static async getPostagens(): Promise<PostagemSocial[]> {
    try {
      const stored = localStorage.getItem(STORAGE_POSTS_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(POSTAGENS_PADRAO));
        return POSTAGENS_PADRAO;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Erro ao ler postagens do localStorage:', e);
      return POSTAGENS_PADRAO;
    }
  }

  static async getPostagemById(id: string): Promise<PostagemSocial | null> {
    const lista = await this.getPostagens();
    return lista.find((p) => p.id === id) || null;
  }

  static async salvarPostagem(
    dados: Partial<PostagemSocial> & { tituloInterno: string; data: string; horario: string },
    usuarioNome = 'Operador',
    usuarioId = 'usr_operador'
  ): Promise<PostagemSocial> {
    const lista = await this.getPostagens();
    const agora = new Date().toISOString();

    let postSalvo: PostagemSocial;
    const isEdicao = !!dados.id && lista.some((p) => p.id === dados.id);

    if (isEdicao) {
      const antigo = lista.find((p) => p.id === dados.id)!;
      postSalvo = {
        ...antigo,
        ...dados,
        atualizadoEm: agora,
      };

      const novaLista = lista.map((p) => (p.id === postSalvo.id ? postSalvo : p));
      localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(novaLista));

      // Auditoria
      await AuditService.registrar({
        usuario: usuarioNome,
        usuarioId,
        modulo: 'Postagens',
        tipoAcao: 'Edição',
        registroAfetado: `${postSalvo.redeSocial.toUpperCase()}: ${postSalvo.tituloInterno}`,
        informacaoAnterior: `Data: ${antigo.data} ${antigo.horario} • Status: ${antigo.status}`,
        informacaoNova: `Data: ${postSalvo.data} ${postSalvo.horario} • Status: ${postSalvo.status}`,
        descricao: `Postagem editada por ${usuarioNome}. Categoria: ${postSalvo.categoria}.`,
      });
    } else {
      postSalvo = {
        id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tituloInterno: dados.tituloInterno.trim(),
        legenda: dados.legenda || '',
        imagemUrl: dados.imagemUrl || '',
        videoUrl: dados.videoUrl || '',
        redeSocial: dados.redeSocial || 'instagram',
        redesAdicionais: dados.redesAdicionais || [],
        data: dados.data,
        horario: dados.horario,
        categoria: dados.categoria || 'produto',
        status: dados.status || 'agendado',
        formato: dados.formato || 'feed_imagem',
        statusIntegracao: dados.statusIntegracao || 'conectado',
        mensagemIntegracao: dados.mensagemIntegracao,
        promocaoId: dados.promocaoId,
        produtoNome: dados.produtoNome,
        precoNormal: dados.precoNormal,
        precoPromocional: dados.precoPromocional,
        criadoPor: usuarioNome,
        criadoEm: agora,
        atualizadoEm: agora,
      };

      const novaLista = [postSalvo, ...lista];
      localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(novaLista));

      // Auditoria
      await AuditService.registrar({
        usuario: usuarioNome,
        usuarioId,
        modulo: 'Postagens',
        tipoAcao: 'Agendamento',
        registroAfetado: `${postSalvo.redeSocial.toUpperCase()}: ${postSalvo.tituloInterno}`,
        informacaoAnterior: 'Não existia',
        informacaoNova: `Agendado para ${postSalvo.data} às ${postSalvo.horario} (${postSalvo.status})`,
        descricao: `Nova publicação cadastrada no cronograma por ${usuarioNome}. Canal: ${postSalvo.redeSocial}.`,
      });
    }

    return postSalvo;
  }

  static async alterarStatus(
    id: string,
    novoStatus: StatusPostagem,
    usuarioNome = 'Operador',
    usuarioId = 'usr_operador'
  ): Promise<PostagemSocial | null> {
    const lista = await this.getPostagens();
    const post = lista.find((p) => p.id === id);
    if (!post) return null;

    const statusAnterior = post.status;
    post.status = novoStatus;
    post.atualizadoEm = new Date().toISOString();

    if (novoStatus === 'publicado') {
      post.statusIntegracao = 'publicado';
      post.mensagemIntegracao = `Publicado com sucesso em ${new Date().toLocaleDateString('pt-BR')}`;
    }

    localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(lista));

    // Auditoria
    await AuditService.registrar({
      usuario: usuarioNome,
      usuarioId,
      modulo: 'Postagens',
      tipoAcao: novoStatus === 'cancelado' ? 'Cancelamento' : 'Alteração',
      registroAfetado: post.tituloInterno,
      informacaoAnterior: `Status: ${statusAnterior}`,
      informacaoNova: `Status: ${novoStatus}`,
      descricao: `Status da postagem "${post.tituloInterno}" alterado de ${statusAnterior} para ${novoStatus} por ${usuarioNome}.`,
    });

    return post;
  }

  static async excluirPostagem(
    id: string,
    usuarioNome = 'Operador',
    usuarioId = 'usr_operador'
  ): Promise<boolean> {
    const lista = await this.getPostagens();
    const post = lista.find((p) => p.id === id);
    if (!post) return false;

    const novaLista = lista.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(novaLista));

    // Auditoria
    await AuditService.registrar({
      usuario: usuarioNome,
      usuarioId,
      modulo: 'Postagens',
      tipoAcao: 'Exclusão',
      registroAfetado: post.tituloInterno,
      informacaoAnterior: `Data: ${post.data} • Canal: ${post.redeSocial}`,
      informacaoNova: 'Removido permanentemente',
      descricao: `Postagem "${post.tituloInterno}" excluída do cronograma por ${usuarioNome}.`,
    });

    return true;
  }

  static async atualizarDataPostagem(
    id: string,
    novaData: string,
    novoHorario?: string,
    usuarioNome = 'Operador'
  ): Promise<PostagemSocial | null> {
    const lista = await this.getPostagens();
    const post = lista.find((p) => p.id === id);
    if (!post) return null;

    const dataAnterior = `${post.data} ${post.horario}`;
    post.data = novaData;
    if (novoHorario) post.horario = novoHorario;
    post.atualizadoEm = new Date().toISOString();

    localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(lista));

    await AuditService.registrar({
      usuario: usuarioNome,
      usuarioId: 'usr_operador',
      modulo: 'Postagens',
      tipoAcao: 'Edição',
      registroAfetado: post.tituloInterno,
      informacaoAnterior: dataAnterior,
      informacaoNova: `${post.data} ${post.horario}`,
      descricao: `Data/horário de publicação reagendado no calendário por ${usuarioNome}.`,
    });

    return post;
  }

  // ==========================================
  // 2. BIBLIOTECA DE MÍDIAS
  // ==========================================
  static async getBibliotecaMidias(): Promise<ItemBibliotecaMidia[]> {
    try {
      const stored = localStorage.getItem(STORAGE_MIDIAS_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_MIDIAS_KEY, JSON.stringify(MIDIAS_PADRAO));
        return MIDIAS_PADRAO;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Erro ao ler biblioteca de mídias:', e);
      return MIDIAS_PADRAO;
    }
  }

  static async adicionarMidia(
    dados: Omit<ItemBibliotecaMidia, 'id' | 'dataUpload'>,
    usuarioNome = 'Operador'
  ): Promise<ItemBibliotecaMidia> {
    const lista = await this.getBibliotecaMidias();
    const nova: ItemBibliotecaMidia = {
      ...dados,
      id: `mid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dataUpload: new Date().toISOString().split('T')[0],
    };

    const novaLista = [nova, ...lista];
    localStorage.setItem(STORAGE_MIDIAS_KEY, JSON.stringify(novaLista));

    await AuditService.registrar({
      usuario: usuarioNome,
      usuarioId: 'usr_operador',
      modulo: 'Postagens',
      tipoAcao: 'Criação',
      registroAfetado: `Mídia: ${nova.nome}`,
      informacaoAnterior: 'Não existia',
      informacaoNova: `Tipo: ${nova.tipo} • Formato: ${nova.formato || 'Imagem'}`,
      descricao: `Upload de mídia adicionado à Biblioteca por ${usuarioNome}.`,
    });

    return nova;
  }

  static async excluirMidia(id: string, usuarioNome = 'Operador'): Promise<boolean> {
    const lista = await this.getBibliotecaMidias();
    const midia = lista.find((m) => m.id === id);
    if (!midia) return false;

    const novaLista = lista.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_MIDIAS_KEY, JSON.stringify(novaLista));

    await AuditService.registrar({
      usuario: usuarioNome,
      usuarioId: 'usr_operador',
      modulo: 'Postagens',
      tipoAcao: 'Exclusão',
      registroAfetado: `Mídia: ${midia.nome}`,
      informacaoAnterior: midia.url,
      informacaoNova: 'Removida',
      descricao: `Mídia excluída da Biblioteca de Conteúdo por ${usuarioNome}.`,
    });

    return true;
  }

  // ==========================================
  // 3. MELHORES HORÁRIOS
  // ==========================================
  static async getMelhoresHorarios(): Promise<MelhorHorarioConfig[]> {
    try {
      const stored = localStorage.getItem(STORAGE_MELHORES_HORARIOS_KEY);
      if (!stored) {
        localStorage.setItem(
          STORAGE_MELHORES_HORARIOS_KEY,
          JSON.stringify(MELHORES_HORARIOS_PADRAO)
        );
        return MELHORES_HORARIOS_PADRAO;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Erro ao ler melhores horários:', e);
      return MELHORES_HORARIOS_PADRAO;
    }
  }

  static async salvarMelhoresHorarios(
    configs: MelhorHorarioConfig[],
    usuarioNome = 'Operador'
  ): Promise<MelhorHorarioConfig[]> {
    localStorage.setItem(STORAGE_MELHORES_HORARIOS_KEY, JSON.stringify(configs));

    await AuditService.registrar({
      usuario: usuarioNome,
      usuarioId: 'usr_operador',
      modulo: 'Postagens',
      tipoAcao: 'Alteração de Configuração',
      registroAfetado: 'Grade de Melhores Horários',
      informacaoAnterior: 'Configuração anterior',
      informacaoNova: 'Horários atualizados',
      descricao: `Configurações manuais de melhores horários de postagem atualizadas por ${usuarioNome}.`,
    });

    return configs;
  }

  static async getMelhorHorarioParaData(
    dataStr: string,
    plataforma: RedeSocialPlataforma = 'instagram'
  ): Promise<{ horario: string; diaNome: string } | null> {
    if (!dataStr) return null;
    try {
      const [ano, mes, dia] = dataStr.split('-').map(Number);
      const dataObj = new Date(ano, mes - 1, dia);
      const diaSemana = dataObj.getDay();

      const horarios = await this.getMelhoresHorarios();
      const config =
        horarios.find((h) => h.diaSemana === diaSemana && h.redeSocial === plataforma) ||
        horarios.find((h) => h.diaSemana === diaSemana);

      if (config) {
        return {
          horario: config.horarioPrincipal,
          diaNome: config.nomeDia,
        };
      }
    } catch (e) {
      console.error('Erro ao obter melhor horário:', e);
    }
    return null;
  }

  // ==========================================
  // 4. CONTAS & INTEGRAÇÃO COM APIS
  // ==========================================
  static async getContas(): Promise<ContaRedeSocial[]> {
    try {
      const stored = localStorage.getItem(STORAGE_CONTAS_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_CONTAS_KEY, JSON.stringify(CONTAS_PADRAO));
        return CONTAS_PADRAO;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Erro ao ler contas:', e);
      return CONTAS_PADRAO;
    }
  }

  static async alternarConexaoConta(
    id: string,
    usuarioNome = 'Operador'
  ): Promise<ContaRedeSocial[]> {
    const lista = await this.getContas();
    const conta = lista.find((c) => c.id === id);
    if (!conta) return lista;

    conta.conectado = !conta.conectado;
    conta.statusConexao = conta.conectado ? 'conectado' : 'nao_conectado';
    conta.ultimaVerificacao = conta.conectado ? `Conectado em ${new Date().toLocaleTimeString()}` : undefined;

    localStorage.setItem(STORAGE_CONTAS_KEY, JSON.stringify(lista));

    await AuditService.registrar({
      usuario: usuarioNome,
      usuarioId: 'usr_operador',
      modulo: 'Postagens',
      tipoAcao: 'Alteração de Configuração',
      registroAfetado: `Conta: ${conta.nomeExibicao}`,
      informacaoAnterior: conta.conectado ? 'Desconectado' : 'Conectado',
      informacaoNova: conta.conectado ? 'Conectado' : 'Desconectado',
      descricao: `Status de conexão da rede social ${conta.plataforma} alterado por ${usuarioNome}.`,
    });

    return lista;
  }
}
