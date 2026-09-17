import React, { useMemo } from 'react';
import type { Promocao } from '../../types';
import type { IntervaloDatas } from '../../types/relatorios';
import { isDataNoIntervalo, formatarMoeda, exportarParaCSV } from '../../utils/relatorioUtils';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RelatorioHeaderTimbrado } from './RelatorioHeaderTimbrado';
import {
  Tag,
  Percent,
  CheckCircle2,
  Clock,
  Archive,
  Download,
  Printer,
  DollarSign,
} from 'lucide-react';

interface RelatorioPromocoesViewProps {
  promocoes: Promocao[];
  intervalo: IntervaloDatas;
  usuarioNome: string;
  onAbrirImpressao: (conteudo: React.ReactNode, titulo: string) => void;
}

export const RelatorioPromocoesView: React.FC<RelatorioPromocoesViewProps> = ({
  promocoes,
  intervalo,
  usuarioNome,
  onAbrirImpressao,
}) => {
  // Filtrar promoções com vigência no período
  const promocoesFiltradas = useMemo(() => {
    return promocoes.filter((p) => {
      const dataRef = p.dataInicial;
      return isDataNoIntervalo(dataRef, intervalo.inicio, intervalo.fim);
    });
  }, [promocoes, intervalo]);

  // Se nenhuma caiu estritamente na dataInicial, listar todas as promoções cadastradas da loja para utilidade máxima
  const listaParaExibir = promocoesFiltradas.length > 0 ? promocoesFiltradas : promocoes;

  const ativas = listaParaExibir.filter((p) => p.status === 'ativa');
  const agendadas = listaParaExibir.filter((p) => p.status === 'agendada');
  const encerradas = listaParaExibir.filter((p) => p.status === 'encerrada');

  // Economia média e percentual de desconto
  const { descontoMedioReais, descontoMedioPercentual } = useMemo(() => {
    if (listaParaExibir.length === 0) {
      return { descontoMedioReais: 0, descontoMedioPercentual: 0 };
    }

    let somaReais = 0;
    let somaPerc = 0;

    listaParaExibir.forEach((p) => {
      const diff = Math.max(0, p.precoNormal - p.precoPromocional);
      const perc = p.precoNormal > 0 ? (diff / p.precoNormal) * 100 : 0;
      somaReais += diff;
      somaPerc += perc;
    });

    return {
      descontoMedioReais: somaReais / listaParaExibir.length,
      descontoMedioPercentual: somaPerc / listaParaExibir.length,
    };
  }, [listaParaExibir]);

  // Exportar CSV
  const handleExportarCSV = () => {
    const headers = [
      'Produto',
      'Status',
      'Preço Normal (R$)',
      'Preço Promo (R$)',
      'Desconto (R$)',
      'Desconto (%)',
      'Data Início',
      'Data Fim',
      'Descrição',
    ];
    const rows = listaParaExibir.map((p) => {
      const diff = Math.max(0, p.precoNormal - p.precoPromocional);
      const perc = p.precoNormal > 0 ? (diff / p.precoNormal) * 100 : 0;
      return [
        p.produtoNome,
        p.status.toUpperCase(),
        p.precoNormal.toFixed(2),
        p.precoPromocional.toFixed(2),
        diff.toFixed(2),
        perc.toFixed(1) + '%',
        p.dataInicial,
        p.dataFinal,
        p.descricao || '',
      ];
    });
    exportarParaCSV(`relatorio-promocoes-${intervalo.inicioFormatado.replace(/\//g, '-')}`, headers, rows);
  };

  // Folha timbrada para impressão
  const PrintableSheet = () => (
    <div className="bg-white text-zinc-900 p-6 rounded-lg text-xs space-y-5 print:p-0 print:border-none">
      <RelatorioHeaderTimbrado
        nomeRelatorio="Relatório de Campanhas Promocionais & Ofertas"
        periodo={intervalo.label}
        usuarioResponsavel={usuarioNome}
        subtitulo="Mix Variedades Store • Demonstrativo de Preços Promocionais, Descontos e Vigência"
      />

      <div className="grid grid-cols-4 gap-3 bg-zinc-50 p-4 rounded border border-zinc-200 text-center">
        <div>
          <span className="text-zinc-500 font-medium block">Total de Promoções</span>
          <span className="text-base font-bold text-zinc-900">{listaParaExibir.length} campanhas</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Ofertas Ativas Agora</span>
          <span className="text-base font-bold text-emerald-600">{ativas.length} ativas</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Desconto Médio (R$)</span>
          <span className="text-base font-bold text-[#7B2CF6]">{formatarMoeda(descontoMedioReais)}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Desconto Médio (%)</span>
          <span className="text-base font-bold text-[#FF8A00]">{descontoMedioPercentual.toFixed(1)}% OFF</span>
        </div>
      </div>

      <div>
        <h4 className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] mb-2 border-b border-zinc-200 pb-1">
          Relação de Campanhas Promocionais
        </h4>
        <table className="w-full text-left border border-zinc-200">
          <thead className="bg-zinc-100 text-zinc-600 font-semibold border-b border-zinc-200">
            <tr>
              <th className="p-2">Produto</th>
              <th className="p-2 text-right">Preço Normal</th>
              <th className="p-2 text-right">Preço Promo</th>
              <th className="p-2 text-right">Desconto (%)</th>
              <th className="p-2 text-center">Vigência</th>
              <th className="p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {listaParaExibir.map((p) => {
              const diff = Math.max(0, p.precoNormal - p.precoPromocional);
              const perc = p.precoNormal > 0 ? (diff / p.precoNormal) * 100 : 0;
              return (
                <tr key={p.id}>
                  <td className="p-2 font-medium">{p.produtoNome}</td>
                  <td className="p-2 text-right text-zinc-500 line-through">{formatarMoeda(p.precoNormal)}</td>
                  <td className="p-2 text-right font-bold text-emerald-600">{formatarMoeda(p.precoPromocional)}</td>
                  <td className="p-2 text-right font-semibold text-[#FF8A00]">{perc.toFixed(0)}% OFF</td>
                  <td className="p-2 text-center text-zinc-600">{p.dataInicial} até {p.dataFinal}</td>
                  <td className="p-2 text-center font-bold uppercase text-[10px]">{p.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] text-zinc-400 text-center pt-3 border-t border-zinc-200">
        Relatório gerado eletronicamente através do sistema MIX GESTÃO • Mix Variedades Store
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Ações */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#13131B] border border-[#222230] p-4 rounded-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#7B2CF6]" />
            Relatório de Promoções
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Campanhas ativas, agendadas, encerradas, margens de desconto e economia média ao consumidor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportarCSV}
          >
            Exportar CSV
          </Button>
          <Button
            variant="accent"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={() => onAbrirImpressao(<PrintableSheet />, 'Relatório de Promoções')}
          >
            Imprimir / Gerar PDF
          </Button>
        </div>
      </div>

      {/* 4 Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Promoções Ativas</span>
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2">{ativas.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Produtos em oferta no balcão</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Agendadas</span>
              <div className="p-2 rounded-lg bg-[#FF8A00]/15 text-[#FFA633]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{agendadas.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Ofertas para datas futuras</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Desconto Médio</span>
              <div className="p-2 rounded-lg bg-[#7B2CF6]/15 text-[#9353FF]">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#9353FF] mt-2">{descontoMedioPercentual.toFixed(1)}%</p>
            <p className="text-xs text-zinc-500 mt-1">Economia média de {formatarMoeda(descontoMedioReais)}/un</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Encerradas</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
                <Archive className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-zinc-300 mt-2">{encerradas.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Histórico de promoções</p>
          </CardBody>
        </Card>
      </div>

      {/* Tabela de Promoções */}
      <Card variant="elevated">
        <CardHeader
          title="Tabela de Ofertas e Promoções da Loja"
          action={<span className="text-xs text-zinc-400">{listaParaExibir.length} campanhas</span>}
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#14141D] text-zinc-400 border-b border-[#232332]">
                <tr>
                  <th className="p-3">Produto</th>
                  <th className="p-3 text-right">Preço Normal</th>
                  <th className="p-3 text-right">Preço Promo</th>
                  <th className="p-3 text-right">Desconto</th>
                  <th className="p-3 text-center">Período de Vigência</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20202E]">
                {listaParaExibir.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-zinc-500">
                      Nenhuma promoção encontrada no período.
                    </td>
                  </tr>
                ) : (
                  listaParaExibir.map((p) => {
                    const diff = Math.max(0, p.precoNormal - p.precoPromocional);
                    const perc = p.precoNormal > 0 ? (diff / p.precoNormal) * 100 : 0;

                    return (
                      <tr key={p.id} className="hover:bg-[#181824] transition-colors">
                        <td className="p-3 font-semibold text-zinc-100">{p.produtoNome}</td>
                        <td className="p-3 text-right text-zinc-400 line-through">{formatarMoeda(p.precoNormal)}</td>
                        <td className="p-3 text-right font-bold text-emerald-400">{formatarMoeda(p.precoPromocional)}</td>
                        <td className="p-3 text-right font-semibold text-[#FFA633]">{perc.toFixed(0)}% OFF</td>
                        <td className="p-3 text-center text-zinc-300">{p.dataInicial} até {p.dataFinal}</td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={p.status === 'ativa' ? 'green' : p.status === 'agendada' ? 'orange' : 'purple'}
                            size="sm"
                          >
                            {p.status.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
