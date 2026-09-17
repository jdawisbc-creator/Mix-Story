export type TipoRelatorio =
  | 'vendas'
  | 'caixa'
  | 'entradas'
  | 'saidas'
  | 'compras_revenda'
  | 'estoque'
  | 'promocoes'
  | 'ordens_servico';

export type TipoPeriodo =
  | 'hoje'
  | 'ontem'
  | 'esta_semana'
  | 'este_mes'
  | 'mes_anterior'
  | 'personalizado';

export interface IntervaloDatas {
  inicio: Date;
  fim: Date;
  label: string;
  inicioFormatado: string; // DD/MM/AAAA
  fimFormatado: string; // DD/MM/AAAA
}

export interface ReportHeaderMeta {
  nomeRelatorio: string;
  periodoDescricao: string;
  dataGeracao: string;
  horaGeracao: string;
  usuarioResponsavel: string;
}
