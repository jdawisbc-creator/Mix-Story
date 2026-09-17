import React, { useMemo } from 'react';
import type { SaidaGasto, MovimentoCaixa } from '../../types';
import type { IntervaloDatas } from '../../types/relatorios';
import { isDataNoIntervalo, formatarMoeda, exportarParaCSV } from '../../utils/relatorioUtils';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RelatorioHeaderTimbrado } from './RelatorioHeaderTimbrado';
import {
  ArrowDownRight,
  Receipt,
  PieChart,
  DollarSign,
  Download,
  Printer,
  Calendar,
} from 'lucide-react';

interface RelatorioSaidasViewProps {
  saidas: SaidaGasto[];
  movimentos: MovimentoCaixa[];
  intervalo: IntervaloDatas;
  usuarioNome: string;
  onAbrirImpressao: (conteudo: React.ReactNode, titulo: string) => void;
}

export const RelatorioSaidasView: React.FC<RelatorioSaidasViewProps> = ({
  saidas,
  movimentos,
  intervalo,
  usuarioNome,
  onAbrirImpressao,
}) => {
  // Filtrar despesas e saídas no período
  const saidasFiltradas = useMemo(() => {
    return saidas.filter((s) => isDataNoIntervalo(s.data, intervalo.inicio, intervalo.fim));
  }, [saidas, intervalo]);

  // Sangrias de caixa no período
  const sangriasNoPeriodo = useMemo(() => {
    return movimentos.filter((m) => {
      const dataRef = m.timestamp ? m.timestamp.split('T')[0] : '';
      return m.tipo === 'sangria' && isDataNoIntervalo(dataRef, intervalo.inicio, intervalo.fim);
    });
  }, [movimentos, intervalo]);

  const totalDespesas = useMemo(() => {
    return saidasFiltradas
      .filter((s) => s.tipo === 'despesa')
      .reduce((acc, s) => acc + (s.valor || 0), 0);
  }, [saidasFiltradas]);

  const totalComprasRevenda = useMemo(() => {
    return saidasFiltradas
      .filter((s) => s.tipo === 'compra_revenda')
      .reduce((acc, s) => acc + (s.valor || 0), 0);
  }, [saidasFiltradas]);

  const totalSangrias = useMemo(() => {
    return sangriasNoPeriodo.reduce((acc, s) => acc + (s.valor || 0), 0);
  }, [sangriasNoPeriodo]);

  const totalGeralSaidas = saidasFiltradas.reduce((acc, s) => acc + (s.valor || 0), 0);

  // Distribuição por categoria de despesa
  const despesasPorCategoria = useMemo(() => {
    const mapa: Record<string, number> = {};
    saidasFiltradas.forEach((s) => {
      const cat = s.categoria || 'Outros';
      mapa[cat] = (mapa[cat] || 0) + (s.valor || 0);
    });

    return Object.entries(mapa)
      .map(([categoria, valor]) => ({
        categoria,
        valor,
        percentual: totalGeralSaidas > 0 ? (valor / totalGeralSaidas) * 100 : 0,
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [saidasFiltradas, totalGeralSaidas]);

  // Exportar CSV
  const handleExportarCSV = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Favorecido/Fornecedor', 'Forma Pagamento', 'Valor (R$)', 'Status'];
    const rows = saidasFiltradas.map((s) => [
      s.data,
      s.tipo === 'despesa' ? 'Despesa Operacional' : 'Compra p/ Revenda',
      s.descricao,
      s.categoria,
      s.fornecedorOuFavorecido || s.fornecedor || '-',
      s.formaPagamento.toUpperCase(),
      s.valor.toFixed(2),
      s.status.toUpperCase(),
    ]);
    exportarParaCSV(`relatorio-saidas-${intervalo.inicioFormatado.replace(/\//g, '-')}`, headers, rows);
  };

  // Gerar folha timbrada para impressão
  const PrintableSheet = () => (
    <div className="bg-white text-zinc-900 p-6 rounded-lg text-xs space-y-5 print:p-0 print:border-none">
      <RelatorioHeaderTimbrado
        nomeRelatorio="Relatório Analítico de Saídas & Gastos"
        periodo={intervalo.label}
        usuarioResponsavel={usuarioNome}
        subtitulo="Mix Variedades Store • Demonstrativo de Despesas Operacionais, Compras e Sangrias"
      />

      {/* Cards de Resumo no Documento */}
      <div className="grid grid-cols-4 gap-3 bg-zinc-50 p-4 rounded border border-zinc-200 text-center">
        <div>
          <span className="text-zinc-500 font-medium block">Total Geral de Saídas</span>
          <span className="text-base font-bold text-rose-600">{formatarMoeda(totalGeralSaidas)}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Despesas Operacionais</span>
          <span className="text-base font-bold text-zinc-800">{formatarMoeda(totalDespesas)}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Compras para Revenda</span>
          <span className="text-base font-bold text-[#7B2CF6]">{formatarMoeda(totalComprasRevenda)}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Sangrias de Caixa</span>
          <span className="text-base font-bold text-zinc-800">{formatarMoeda(totalSangrias)}</span>
        </div>
      </div>

      {/* Categorias no Documento */}
      <div>
        <h4 className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] mb-2 border-b border-zinc-200 pb-1">
          Distribuição por Categoria
        </h4>
        <table className="w-full text-left border border-zinc-200">
          <thead className="bg-zinc-100 text-zinc-600 font-semibold border-b border-zinc-200">
            <tr>
              <th className="p-2">Categoria</th>
              <th className="p-2 text-right">Valor Total</th>
              <th className="p-2 text-right">Participação (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {despesasPorCategoria.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-3 text-center text-zinc-400">Nenhuma saída registrada no período</td>
              </tr>
            ) : (
              despesasPorCategoria.map((c, i) => (
                <tr key={i}>
                  <td className="p-2 font-medium">{c.categoria}</td>
                  <td className="p-2 text-right font-semibold text-rose-600">{formatarMoeda(c.valor)}</td>
                  <td className="p-2 text-right">{c.percentual.toFixed(1)}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tabela de Saídas Analítica */}
      <div>
        <h4 className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] mb-2 border-b border-zinc-200 pb-1">
          Lançamentos de Saídas ({saidasFiltradas.length})
        </h4>
        <table className="w-full text-left border border-zinc-200">
          <thead className="bg-zinc-100 text-zinc-600 font-semibold border-b border-zinc-200">
            <tr>
              <th className="p-2">Data</th>
              <th className="p-2">Descrição</th>
              <th className="p-2">Categoria</th>
              <th className="p-2">Favorecido / Fornecedor</th>
              <th className="p-2">Pagamento</th>
              <th className="p-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {saidasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-3 text-center text-zinc-400">Nenhuma saída encontrada</td>
              </tr>
            ) : (
              saidasFiltradas.map((s) => (
                <tr key={s.id}>
                  <td className="p-2">{s.data}</td>
                  <td className="p-2 font-medium">{s.descricao}</td>
                  <td className="p-2 text-zinc-600">{s.categoria}</td>
                  <td className="p-2 text-zinc-600">{s.fornecedorOuFavorecido || s.fornecedor || '-'}</td>
                  <td className="p-2 uppercase text-[10px]">{s.formaPagamento}</td>
                  <td className="p-2 text-right font-semibold text-rose-600">{formatarMoeda(s.valor)}</td>
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
      {/* Cabeçalho de Ações */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#13131B] border border-[#222230] p-4 rounded-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-rose-400" />
            Relatório de Saídas & Gastos
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Despesas operacionais, investimentos em mercadorias e sangrias realizadas.
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
            onClick={() => onAbrirImpressao(<PrintableSheet />, 'Relatório de Saídas')}
          >
            Imprimir / Gerar PDF
          </Button>
        </div>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total de Saídas</span>
              <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-rose-400 mt-2">{formatarMoeda(totalGeralSaidas)}</p>
            <p className="text-xs text-zinc-500 mt-1">{saidasFiltradas.length} lançamentos de saída</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Despesas Operacionais</span>
              <div className="p-2 rounded-lg bg-[#FF8A00]/15 text-[#FFA633]">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{formatarMoeda(totalDespesas)}</p>
            <p className="text-xs text-zinc-500 mt-1">Aluguel, contas fixas, manutenção</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Compras p/ Revenda</span>
              <div className="p-2 rounded-lg bg-[#7B2CF6]/15 text-[#9353FF]">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{formatarMoeda(totalComprasRevenda)}</p>
            <p className="text-xs text-zinc-500 mt-1">Mercadorias adicionadas ao estoque</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Sangrias de Caixa</span>
              <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{formatarMoeda(totalSangrias)}</p>
            <p className="text-xs text-zinc-500 mt-1">{sangriasNoPeriodo.length} retiradas para cofre</p>
          </CardBody>
        </Card>
      </div>

      {/* Tabela de Saídas */}
      <Card variant="elevated">
        <CardHeader
          title="Extrato Detalhado de Saídas do Período"
          action={<span className="text-xs text-zinc-400">{saidasFiltradas.length} itens</span>}
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#14141D] text-zinc-400 border-b border-[#232332]">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Favorecido</th>
                  <th className="p-3">Pagamento</th>
                  <th className="p-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20202E]">
                {saidasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-zinc-500">
                      Nenhuma saída cadastrada no período selecionado.
                    </td>
                  </tr>
                ) : (
                  saidasFiltradas.map((s) => (
                    <tr key={s.id} className="hover:bg-[#181824] transition-colors">
                      <td className="p-3 text-zinc-300">{s.data}</td>
                      <td className="p-3 font-medium text-zinc-100">{s.descricao}</td>
                      <td className="p-3">
                        <Badge variant={s.tipo === 'despesa' ? 'orange' : 'purple'} size="sm">
                          {s.tipo === 'despesa' ? 'Despesa' : 'Revenda'}
                        </Badge>
                      </td>
                      <td className="p-3 text-zinc-300">{s.categoria}</td>
                      <td className="p-3 text-zinc-400">{s.fornecedorOuFavorecido || s.fornecedor || '-'}</td>
                      <td className="p-3 uppercase text-[10px] text-zinc-400">{s.formaPagamento}</td>
                      <td className="p-3 text-right font-bold text-rose-400">{formatarMoeda(s.valor)}</td>
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
