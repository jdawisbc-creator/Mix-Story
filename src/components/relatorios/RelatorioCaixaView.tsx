import React, { useMemo } from 'react';
import type { Caixa, MovimentoCaixa } from '../../types';
import type { IntervaloDatas } from '../../types/relatorios';
import { isDataNoIntervalo, formatarMoeda, exportarParaCSV } from '../../utils/relatorioUtils';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RelatorioHeaderTimbrado } from './RelatorioHeaderTimbrado';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  DollarSign,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface RelatorioCaixaViewProps {
  caixas: Caixa[];
  movimentos: MovimentoCaixa[];
  intervalo: IntervaloDatas;
  usuarioNome: string;
  onAbrirImpressao: (conteudo: React.ReactNode, titulo: string) => void;
}

export const RelatorioCaixaView: React.FC<RelatorioCaixaViewProps> = ({
  caixas,
  movimentos,
  intervalo,
  usuarioNome,
  onAbrirImpressao,
}) => {
  // Filtrar sessões de caixa no intervalo
  const caixasFiltrados = useMemo(() => {
    return caixas.filter((c) => isDataNoIntervalo(c.data, intervalo.inicio, intervalo.fim));
  }, [caixas, intervalo]);

  // Filtrar movimentos no intervalo
  const movimentosFiltrados = useMemo(() => {
    return movimentos.filter((m) => {
      const dataRef = m.timestamp ? m.timestamp.split('T')[0] : '';
      return isDataNoIntervalo(dataRef, intervalo.inicio, intervalo.fim);
    });
  }, [movimentos, intervalo]);

  // Cálculos consolidados do Caixa para o período
  const totalAberturas = useMemo(() => {
    return caixasFiltrados.reduce((acc, c) => acc + (c.saldoInicial || 0), 0);
  }, [caixasFiltrados]);

  const totalEntradas = useMemo(() => {
    return caixasFiltrados.reduce((acc, c) => acc + (c.totalEntradas || 0), 0);
  }, [caixasFiltrados]);

  const totalSaidas = useMemo(() => {
    return caixasFiltrados.reduce((acc, c) => acc + (c.totalSaidas || 0), 0);
  }, [caixasFiltrados]);

  const totalSaldoCalculado = useMemo(() => {
    return caixasFiltrados.reduce((acc, c) => acc + (c.saldoFinalCalculado || 0), 0);
  }, [caixasFiltrados]);

  const totalFechamentoInformado = useMemo(() => {
    return caixasFiltrados.reduce((acc, c) => {
      if (c.status === 'fechado' && typeof c.saldoFinalInformado === 'number') {
        return acc + c.saldoFinalInformado;
      }
      return acc + (c.saldoFinalCalculado || 0);
    }, 0);
  }, [caixasFiltrados]);

  const diferencaLiquida = useMemo(() => {
    return caixasFiltrados.reduce((acc, c) => acc + (c.diferenca || 0), 0);
  }, [caixasFiltrados]);

  // Exportar CSV
  const handleExportarCSV = () => {
    const headers = [
      'Data',
      'Operador',
      'Status',
      'Abertura (R$)',
      'Entradas (R$)',
      'Saídas (R$)',
      'Saldo Calculado (R$)',
      'Fechamento Informado (R$)',
      'Diferença (R$)',
    ];
    const rows = caixasFiltrados.map((c) => [
      c.data,
      c.operadorNome || 'Operador',
      c.status.toUpperCase(),
      c.saldoInicial.toFixed(2),
      c.totalEntradas.toFixed(2),
      c.totalSaidas.toFixed(2),
      c.saldoFinalCalculado.toFixed(2),
      (c.saldoFinalInformado ?? c.saldoFinalCalculado).toFixed(2),
      (c.diferenca || 0).toFixed(2),
    ]);
    exportarParaCSV(`relatorio-caixa-${intervalo.inicioFormatado.replace(/\//g, '-')}`, headers, rows);
  };

  // Gerar folha timbrada para impressão
  const PrintableSheet = () => (
    <div className="bg-white text-zinc-900 p-6 rounded-lg text-xs space-y-5 print:p-0 print:border-none">
      <RelatorioHeaderTimbrado
        nomeRelatorio="Relatório de Movimento e Fechamento de Caixa"
        periodo={intervalo.label}
        usuarioResponsavel={usuarioNome}
        subtitulo="Mix Variedades Store • Conferência de Aberturas, Fechamentos, Entradas, Saídas e Diferenças"
      />

      {/* 6 Indicadores Exigidos: Abertura, Fechamento, Entradas, Saídas, Saldo, Diferenças */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-zinc-50 p-3 rounded border border-zinc-200 text-center">
        <div>
          <span className="text-zinc-500 text-[11px] block">Abertura</span>
          <span className="text-sm font-bold text-zinc-800">{formatarMoeda(totalAberturas)}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[11px] block">Entradas</span>
          <span className="text-sm font-bold text-emerald-600">{formatarMoeda(totalEntradas)}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[11px] block">Saídas / Sangrias</span>
          <span className="text-sm font-bold text-rose-600">{formatarMoeda(totalSaidas)}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[11px] block">Saldo Esperado</span>
          <span className="text-sm font-bold text-[#7B2CF6]">{formatarMoeda(totalSaldoCalculado)}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[11px] block">Fechamento</span>
          <span className="text-sm font-bold text-zinc-900">{formatarMoeda(totalFechamentoInformado)}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[11px] block">Diferenças</span>
          <span
            className={`text-sm font-bold ${
              diferencaLiquida === 0
                ? 'text-zinc-600'
                : diferencaLiquida > 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
          >
            {formatarMoeda(diferencaLiquida)}
          </span>
        </div>
      </div>

      {/* Tabela de Turnos de Caixa */}
      <div>
        <h4 className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] mb-2 border-b border-zinc-200 pb-1">
          Sessões e Turnos de Caixa Registrados ({caixasFiltrados.length})
        </h4>
        <table className="w-full text-left border border-zinc-200">
          <thead className="bg-zinc-100 text-zinc-600 font-semibold border-b border-zinc-200">
            <tr>
              <th className="p-2">Data</th>
              <th className="p-2">Operador</th>
              <th className="p-2 text-right">Abertura</th>
              <th className="p-2 text-right">Entradas</th>
              <th className="p-2 text-right">Saídas</th>
              <th className="p-2 text-right">Saldo Calculado</th>
              <th className="p-2 text-right">Fechamento</th>
              <th className="p-2 text-right">Diferença</th>
              <th className="p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {caixasFiltrados.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-3 text-center text-zinc-400">
                  Nenhum turno de caixa encontrado no período
                </td>
              </tr>
            ) : (
              caixasFiltrados.map((cx) => (
                <tr key={cx.id}>
                  <td className="p-2 font-medium">{cx.data}</td>
                  <td className="p-2">{cx.operadorNome}</td>
                  <td className="p-2 text-right">{formatarMoeda(cx.saldoInicial)}</td>
                  <td className="p-2 text-right text-emerald-600">{formatarMoeda(cx.totalEntradas)}</td>
                  <td className="p-2 text-right text-rose-600">{formatarMoeda(cx.totalSaidas)}</td>
                  <td className="p-2 text-right font-semibold">{formatarMoeda(cx.saldoFinalCalculado)}</td>
                  <td className="p-2 text-right">
                    {cx.saldoFinalInformado !== undefined
                      ? formatarMoeda(cx.saldoFinalInformado)
                      : 'Em aberto'}
                  </td>
                  <td className="p-2 text-right">
                    {cx.diferenca !== undefined && cx.diferenca !== 0 ? (
                      <span className={cx.diferenca > 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        {formatarMoeda(cx.diferenca)} ({cx.tipoDiferenca})
                      </span>
                    ) : (
                      'R$ 0,00'
                    )}
                  </td>
                  <td className="p-2 text-center font-semibold uppercase text-[10px]">
                    {cx.status}
                  </td>
                </tr>
              ))
            )}
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
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#13131B] border border-[#222230] p-4 rounded-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#7B2CF6]" />
            Relatório de Caixa
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Abertura, fechamento, entradas, saídas, saldos apurados e conferência de diferenças.
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
            onClick={() => onAbrirImpressao(<PrintableSheet />, 'Relatório de Caixa')}
          >
            Imprimir / Gerar PDF
          </Button>
        </div>
      </div>

      {/* 6 KPIs Exigidos: Abertura, Fechamento, Entradas, Saídas, Saldo, Diferenças */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card variant="elevated">
          <CardBody className="p-3.5">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">Abertura</span>
            <p className="text-lg font-black text-white mt-1">{formatarMoeda(totalAberturas)}</p>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Fundos de troco</span>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-3.5">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">Entradas</span>
            <p className="text-lg font-black text-emerald-400 mt-1">{formatarMoeda(totalEntradas)}</p>
            <span className="text-[10px] text-emerald-500/70 block mt-0.5">Vendas + Suprimentos</span>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-3.5">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">Saídas</span>
            <p className="text-lg font-black text-rose-400 mt-1">{formatarMoeda(totalSaidas)}</p>
            <span className="text-[10px] text-rose-500/70 block mt-0.5">Sangrias e despesas</span>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-3.5">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">Saldo Final</span>
            <p className="text-lg font-black text-[#9353FF] mt-1">{formatarMoeda(totalSaldoCalculado)}</p>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Saldo calculado</span>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-3.5">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">Fechamento</span>
            <p className="text-lg font-black text-zinc-100 mt-1">{formatarMoeda(totalFechamentoInformado)}</p>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Valor contado</span>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-3.5">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">Diferenças</span>
            <p
              className={`text-lg font-black mt-1 ${
                diferencaLiquida === 0
                  ? 'text-zinc-400'
                  : diferencaLiquida > 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {formatarMoeda(diferencaLiquida)}
            </p>
            <span className="text-[10px] text-zinc-500 block mt-0.5">
              {diferencaLiquida === 0 ? 'Conferência exata' : diferencaLiquida > 0 ? 'Sobra de caixa' : 'Falta de caixa'}
            </span>
          </CardBody>
        </Card>
      </div>

      {/* Tabela de Turnos de Caixa */}
      <Card variant="elevated">
        <CardHeader
          title="Histórico de Turnos e Sessões de Caixa"
          action={<span className="text-xs text-zinc-400">{caixasFiltrados.length} turnos</span>}
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#14141D] text-zinc-400 border-b border-[#232332]">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Operador</th>
                  <th className="p-3 text-right">Abertura</th>
                  <th className="p-3 text-right">Entradas</th>
                  <th className="p-3 text-right">Saídas</th>
                  <th className="p-3 text-right">Saldo Calculado</th>
                  <th className="p-3 text-right">Fechamento</th>
                  <th className="p-3 text-right">Diferença</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20202E]">
                {caixasFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-zinc-500">
                      Nenhum turno de caixa registrado no período selecionado.
                    </td>
                  </tr>
                ) : (
                  caixasFiltrados.map((cx) => (
                    <tr key={cx.id} className="hover:bg-[#181824] transition-colors">
                      <td className="p-3 font-semibold text-zinc-200">{cx.data}</td>
                      <td className="p-3 text-zinc-300">{cx.operadorNome}</td>
                      <td className="p-3 text-right text-zinc-300">{formatarMoeda(cx.saldoInicial)}</td>
                      <td className="p-3 text-right font-medium text-emerald-400">{formatarMoeda(cx.totalEntradas)}</td>
                      <td className="p-3 text-right font-medium text-rose-400">{formatarMoeda(cx.totalSaidas)}</td>
                      <td className="p-3 text-right font-bold text-white">{formatarMoeda(cx.saldoFinalCalculado)}</td>
                      <td className="p-3 text-right font-medium text-zinc-200">
                        {cx.saldoFinalInformado !== undefined
                          ? formatarMoeda(cx.saldoFinalInformado)
                          : <span className="text-zinc-500 italic">Em aberto</span>}
                      </td>
                      <td className="p-3 text-right">
                        {cx.diferenca !== undefined && cx.diferenca !== 0 ? (
                          <Badge
                            variant={cx.diferenca > 0 ? 'green' : 'red'}
                            size="sm"
                          >
                            {formatarMoeda(cx.diferenca)}
                          </Badge>
                        ) : (
                          <span className="text-zinc-500">R$ 0,00</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={cx.status === 'aberto' ? 'orange' : 'purple'}
                          size="sm"
                        >
                          {cx.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
