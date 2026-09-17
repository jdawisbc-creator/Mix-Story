/**
 * MIX GESTÃO — Tipos e Estruturas de Dados
 * Mix Variedades Store
 */

export interface User {
  id: string;
  name: string;
  login: string; // E-mail ou login de identificação
  email?: string;
  password?: string;
  active: boolean; // Status: Ativo / Inativo
  createdAt: string; // Data de criação
  avatar?: string;
  lastLogin?: string;
}

export type RouteId =
  | 'dashboard'
  | 'caixa-hoje'
  | 'caixa-historico'
  | 'vendas'
  | 'gastos'
  | 'estoque'
  | 'promocoes'
  | 'ordens-servico'
  | 'redes-calendario'
  | 'redes-postagens'
  | 'redes-biblioteca'
  | 'relatorios'
  | 'historico'
  | 'configuracoes';

// --- Caixa ---
export type CaixaStatus = 'aberto' | 'fechado' | 'pendente';
export type MovimentoTipo = 'abertura' | 'venda' | 'suprimento' | 'sangria' | 'fechamento' | 'estorno' | 'ordem_servico';

export interface MovimentoCaixa {
  id: string;
  caixaId: string;
  tipo: MovimentoTipo;
  valor: number;
  descricao: string;
  formaPagamento?: string;
  usuarioId: string;
  usuarioNome: string;
  timestamp: string;
}

export interface Caixa {
  id: string;
  data: string; // YYYY-MM-DD
  status: CaixaStatus;
  saldoInicial: number;
  totalEntradas: number;
  totalSaidas: number;
  saldoFinalCalculado: number;
  saldoFinalInformado?: number;
  diferenca?: number;
  tipoDiferenca?: 'exato' | 'falta' | 'sobra';
  operadorId: string;
  operadorNome: string;
  abertoEm: string;
  fechadoEm?: string;
  observacoes?: string;
  // Detalhamento do fechamento
  vendasDinheiro?: number;
  vendasPix?: number;
  vendasDebito?: number;
  vendasCredito?: number;
  vendasTransferencia?: number;
  vendasOutros?: number;
  totalVendido?: number;
  entradasAdicionais?: number;
  saidasTotal?: number;
  valorEsperadoCaixa?: number;
  valorContado?: number;
  valorPermaneceraTroco?: number;
}

// --- Vendas ---
export type FormaPagamento =
  | 'pix'
  | 'dinheiro'
  | 'cartao_debito'
  | 'cartao_credito'
  | 'transferencia'
  | 'outros'
  | 'misto'
  | 'crediario';

export interface PagamentoMistoParcela {
  forma: FormaPagamento;
  valor: number;
}

export interface ItemVenda {
  produtoId: string;
  nome: string;
  tipoItem: 'produto' | 'servico'; // produtos reduzem estoque; serviços não reduzem
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  desconto: number;
  total: number;
}

export interface Venda {
  id: string;
  numero: number | string;
  data: string; // DD/MM/AAAA
  horario: string; // HH:mm
  dataHora: string; // ISO 8601
  usuario: string; // Nome do usuário que registrou
  usuarioId: string;
  clienteNome?: string;
  clienteDocumento?: string;
  itens: ItemVenda[];
  subtotal: number;
  descontoTotal: number;
  total: number;
  formaPagamento: FormaPagamento;
  pagamentoMistoDetalhes?: PagamentoMistoParcela[];
  valorPago?: number;
  trocoDevolvido?: number;
  status: 'concluida' | 'cancelada';
  canceladaEm?: string;
  canceladaPor?: string;
  motivoCancelamento?: string;
  vendedorId?: string;
  vendedorNome?: string;
  caixaId: string;
}

// --- Gastos / Saídas ---
export type TipoSaida = 'despesa' | 'compra_revenda';

export type CategoriaDespesa =
  | 'aluguel'
  | 'energia'
  | 'internet'
  | 'agua'
  | 'manutencao'
  | 'materiais_loja'
  | 'assinaturas'
  | 'outros';

export type CategoriaGasto = CategoriaDespesa | 'fornecedores' | 'contas_fixas' | 'pessoal' | 'impostos' | 'marketing' | string;

export interface SaidaGasto {
  id: string;
  tipo: TipoSaida; // 'despesa' | 'compra_revenda'
  descricao: string;
  categoria: string;
  valor: number;
  data: string; // YYYY-MM-DD
  dataVencimento?: string;
  status: 'pago' | 'pendente';
  formaPagamento: FormaPagamento;
  observacao?: string;
  observacoes?: string;
  
  // Responsável
  usuarioId: string;
  usuarioNome: string;
  registradoPorId?: string;
  registradoPorNome?: string;

  // Fornecedor / Favorecido opcional
  fornecedor?: string;
  fornecedorOuFavorecido?: string;
  comprovanteUrl?: string;

  // Exclusivo: TIPO 2 — COMPRA PARA REVENDA
  produtoId?: string;
  produtoNome?: string;
  quantidade?: number;
  custoUnitario?: number;
  valorTotalCompra?: number; // quantidade * custoUnitario (igual ao valor da saída)
  precoPrevistoVenda?: number;
  receitaPotencial?: number; // quantidade * precoPrevistoVenda
  lucroProjetado?: number; // receitaPotencial - valorTotalCompra
  estoqueAtualizado?: boolean;

  criadoEm?: string;
}

// --- Estoque ---
export interface CategoriaProduto {
  id: string;
  nome: string;
  descricao?: string;
  ativa?: boolean; // Se a categoria está ativa para novos produtos
  totalProdutos?: number;
  criadaEm?: string;
}

export interface Produto {
  id: string;
  nome: string;
  foto?: string; // Foto opcional
  categoria: string;
  categoriaNome?: string; // Sinônimo para compatibilidade
  quantidade: number;
  estoqueAtual?: number; // Sinônimo para compatibilidade
  precoCusto: number; // Valor de custo unitário
  precoVenda: number; // Valor normal de venda
  precoNormalOriginal?: number; // Preço de venda original antes de entrar em promoção
  emPromocao?: boolean;
  promocaoAtivaId?: string;
  dataEntrada: string; // Data de entrada (YYYY-MM-DD)
  observacoes?: string;

  // Campos opcionais mantidos para compatibilidade com outros módulos
  sku?: string;
  codigoBarras?: string;
  estoqueMinimo?: number;
  unidade?: 'UN' | 'PC' | 'KG' | 'KIT' | string;
  ativo?: boolean;
  localizacao?: string;
  atualizadoEm?: string;
}

// Histórico interno de movimentações de estoque
export type TipoMovimentacaoEstoque = 'entrada' | 'venda' | 'saida_manual' | 'correcao';

export interface MovimentacaoEstoque {
  id: string;
  produtoId: string;
  produtoNome: string;
  tipo: TipoMovimentacaoEstoque; // Entrada, Venda, Saída manual, Correção
  quantidadeAnterior: number;
  quantidadeAlterada: number;
  quantidadeFinal: number;
  usuario: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM:SS
  motivo?: string;
  criadoEm?: string;
}

// --- Promoções ---
export type StatusPromocao = 'agendada' | 'ativa' | 'encerrada';
export type TipoPromocao = 'preco_direto' | 'porcentagem' | 'combo' | 'leve_x_pague_y';

export interface Promocao {
  id: string;
  produtoId: string;
  produtoNome: string;
  valorCusto: number; // Valor de custo
  precoNormal: number; // Preço normal
  precoPromocional: number; // Preço promocional direto
  dataInicial: string; // YYYY-MM-DD
  dataFinal: string; // YYYY-MM-DD
  descricao: string;
  status: StatusPromocao; // 'agendada' | 'ativa' | 'encerrada'
  tipoPromocao?: TipoPromocao; // default: 'preco_direto'

  // Suporte a campos opcionais/compatibilidade
  titulo?: string;
  ativa?: boolean;
  criadoEm?: string;
}

// --- Ordens de Serviço (Modelo Oficial Mix Variedades Store) ---
export type StatusOSMix =
  | 'aguardando_aprovacao'
  | 'aprovada'
  | 'em_producao'
  | 'pronta'
  | 'entregue'
  | 'cancelada';

export type OSStatus = StatusOSMix;

export type AprovacaoClienteOS = 'SIM' | 'NÃO' | 'SEM APROVAÇÃO';

export interface ItemOrdemServico {
  item: number; // 01, 02, 03...
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface OrdemServico {
  id: string;
  numeroOS: string; // Ex: "OS #0001"
  numeroSequencial: number; // 1, 2, 3...
  clienteNome: string;
  clienteTelefone: string;
  dataEntrada: string; // YYYY-MM-DD ou DD/MM/AAAA
  dataEntrega: string; // YYYY-MM-DD ou DD/MM/AAAA
  itens: ItemOrdemServico[];
  valorTotal: number;
  formasPagamento: string[]; // ['Pix', 'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'Transferência', 'Outros']
  outrosPagamento?: string;
  aprovacaoCliente: AprovacaoClienteOS; // 'SIM' | 'NÃO' | 'SEM APROVAÇÃO'
  observacoes: string;
  status: StatusOSMix;
  pago?: boolean;
  dataPagamento?: string;
  formaPagamentoRecebida?: string;
  valorPago?: number;
  trocoDevolvido?: number;
  entregueEm?: string;
  entreguePor?: string;
  criadoPor?: string;
  criadoEm?: string;
  atualizadoPor?: string;
  atualizadoEm?: string;

  // Campos legados opcionais para compatibilidade
  aparelhoOuItem?: string;
  marcaModelo?: string;
  numeroSerie?: string;
  defeitoRelatado?: string;
  diagnosticoTecnico?: string;
  servicosRealizados?: string;
  valorPecas?: number;
  valorMaoDeObra?: number;
  tecnicoResponsavelId?: string;
  tecnicoResponsavelNome?: string;
  previsaoEntrega?: string;
  dataConclusao?: string;
}

// --- Conteúdo & Redes Sociais (Mix Variedades Store) ---
export type RedeSocialPlataforma = 'instagram' | 'facebook' | 'tiktok' | 'whatsapp' | 'google_meu_negocio';

export type CategoriaPostagem =
  | 'promocao'
  | 'produto'
  | 'servico'
  | 'institucional'
  | 'data_comemorativa'
  | 'outros';

export type StatusPostagem =
  | 'ideia'
  | 'rascunho'
  | 'pronto'
  | 'agendado'
  | 'publicado'
  | 'cancelado';

export type StatusIntegracaoAPI =
  | 'conectado'
  | 'nao_conectado'
  | 'falha_publicacao'
  | 'publicado';

export type FormatoPostagem =
  | 'feed_imagem'
  | 'carrossel'
  | 'reels_video'
  | 'stories'
  | 'post_padrao';

export interface PostagemSocial {
  id: string;
  tituloInterno: string;
  legenda: string;
  imagemUrl?: string;
  videoUrl?: string;
  redeSocial: RedeSocialPlataforma;
  redesAdicionais?: RedeSocialPlataforma[];
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  categoria: CategoriaPostagem;
  status: StatusPostagem;
  formato?: FormatoPostagem;
  statusIntegracao: StatusIntegracaoAPI;
  mensagemIntegracao?: string;

  // Integração com Promoções
  promocaoId?: string;
  produtoNome?: string;
  precoNormal?: number;
  precoPromocional?: number;

  // Metadados
  criadoPor?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

// Compatibilidade com código legado anterior
export type PostagemRedeSocial = PostagemSocial;

export type TipoMidiaBiblioteca = 'logo' | 'foto' | 'arte' | 'video' | 'promocional';

export interface ItemBibliotecaMidia {
  id: string;
  nome: string;
  tipo: TipoMidiaBiblioteca;
  url: string;
  formato?: string; // PNG, JPG, MP4, etc.
  dimensoes?: string; // 1080x1080, 1080x1920, etc.
  tamanho?: string; // 1.2 MB
  dataUpload: string; // YYYY-MM-DD
  tags: string[];
  descricao?: string;
}

export interface MelhorHorarioConfig {
  diaSemana: number; // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  nomeDia: string; // Ex: 'Terça-feira'
  horarioPrincipal: string; // Ex: '19:30'
  horarioSecundario?: string; // Ex: '12:15'
  engajamentoEstimado: 'alto' | 'medio' | 'muito_alto';
  redeSocial: RedeSocialPlataforma;
  observacao?: string;
}

export interface ContaRedeSocial {
  id: string;
  plataforma: RedeSocialPlataforma;
  nomeExibicao: string;
  usuarioOuPagina: string;
  conectado: boolean;
  statusConexao: 'conectado' | 'nao_conectado' | 'token_expirado';
  ultimaVerificacao?: string;
  detalhes?: string;
}

// --- Histórico de Alterações / Auditoria Central da Loja ---
export type AuditModulo =
  | 'Produtos'
  | 'Estoque'
  | 'Caixa'
  | 'Vendas'
  | 'Gastos'
  | 'Promoções'
  | 'Ordens de Serviço'
  | 'Postagens'
  | 'Configurações'
  | 'Usuários'
  | 'Autenticação';

export type AuditTipoAcao =
  // PRODUTOS & ESTOQUE
  | 'Criação'
  | 'Edição'
  | 'Exclusão'
  | 'Entrada de Estoque'
  | 'Saída de Estoque'
  | 'Alteração de Preço'
  // CAIXA
  | 'Abertura'
  | 'Entrada'
  | 'Saída'
  | 'Fechamento'
  | 'Alteração'
  | 'Cancelamento'
  // GASTOS & PROMOÇÕES
  | 'Encerramento'
  // ORDENS DE SERVIÇO
  | 'Mudança de Status'
  | 'Pagamento'
  // POSTAGENS
  | 'Agendamento'
  // CONFIGURAÇÕES, USUÁRIOS E SESSÃO
  | 'Alteração de Configuração'
  | 'Ativação de Usuário'
  | 'Desativação de Usuário'
  | 'Alteração de Senha'
  | 'Login'
  | 'Logout';

export interface LogAuditoria {
  id: string;
  timestamp: string; // ISO 8601 para ordenação estrita mais recente -> mais antigo
  data: string; // DD/MM/AAAA (ex: 16/09/2026)
  horario: string; // HH:mm (ex: 14:32)
  usuario: string; // Nome do usuário (ex: Jhonatan)
  usuarioId: string; // ID do usuário (ex: usr_jhonatan_01)
  modulo: AuditModulo | string;
  tipoAcao: AuditTipoAcao | string;
  registroAfetado: string; // Registro ou produto afetado (ex: 'Caneta Azul', 'Caixa Turno 1')
  informacaoAnterior?: string | null; // Antes: R$ 4,00
  informacaoNova?: string | null; // Depois: R$ 5,00
  descricao?: string;
  detalhes?: Record<string, unknown>;
  // Campos legados mantidos para compatibilidade
  usuarioNome?: string;
  acao?: string;
}

// --- Formas de Pagamento Ativas/Desativadas ---
export interface FormasPagamentoConfig {
  pix: boolean;
  dinheiro: boolean;
  cartao_debito: boolean;
  cartao_credito: boolean;
  transferencia: boolean;
  outros: boolean;
}

// --- Configuração da Ordem de Serviço ---
export interface ConfiguracaoOrdemServico {
  usarLogoPersonalizado: boolean;
  logoUrl?: string;
  slogan: string;
  textoRodape: string;
  mostrarDadosLoja: boolean;
  telefone?: string;
  whatsapp?: string;
  endereco?: string;
}

// --- Configurações da Loja ---
export interface ConfiguracaoLoja {
  id: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  instagram: string;
  endereco: string;
  slogan: string;
  cidade: string;
  estado: string;
  logoUrl?: string;
  valorPadraoTroco: number; // Valor padrão para troco (ex: R$ 200,00)
  formasPagamento: FormasPagamentoConfig;
  ordemServico: ConfiguracaoOrdemServico;
  alertaEstoqueMinimo?: boolean;
  diasRetencaoLogs?: number;
  mensagemCabecalhoCupom?: string;
}

// --- Estrutura de Backup Seguro ---
export interface TotaisBackup {
  vendas: number;
  caixas: number;
  movimentosCaixa: number;
  produtos: number;
  categorias: number;
  movimentacoesEstoque: number;
  gastos: number;
  promocoes: number;
  ordensServico: number;
  usuarios: number;
  auditoria: number;
  redesSociais: number;
}

export interface SnapshotBackup {
  versao: string;
  sistema: string;
  timestamp: string;
  geradoPor: string;
  totais: TotaisBackup;
  dados: {
    configuracoes: ConfiguracaoLoja[];
    usuarios: User[];
    vendas: Venda[];
    caixas: Caixa[];
    movimentosCaixa: MovimentoCaixa[];
    produtos: Produto[];
    categorias: CategoriaProduto[];
    movimentacoesEstoque: MovimentacaoEstoque[];
    gastos: SaidaGasto[];
    promocoes: Promocao[];
    ordensServico: OrdemServico[];
    redesPosts?: any[];
    redesContas?: any[];
    auditoria: LogAuditoria[];
  };
}

export interface ItemBackupServidor {
  id: string;
  nomeArquivo: string;
  dataCriacao: string;
  tamanhoBytes: number;
  totalRegistros: number;
  geradoPor: string;
}

// --- Mensagens / Toasts ---
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
