import React, { useMemo } from 'react';
import type { Venda, MovimentoCaixa, MovimentacaoEstoque } from '../../types';
import type { IntervaloDatas } from '../../types/relatorios';
import { isDataNoIntervalo, formatarMoeda, exportarParaCSV } from '../../utils/relatorioUtils';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RelatorioHeaderTimbrado } from './RelatorioHeaderTimbrado';
import {
  ArrowUpRight,
  TrendingUp,
  PackagePlus,
  DollarSign,
  Download,
  Printer,
  Calendar,
} from 'lucide-react';

interface RelatorioEntradasViewProps {
  vendas: Venda[];
  movimentos: MovimentoCaixa[];
  movimentacoesEstoque: MovimentacaoEstoque[];
  intervalo: IntervaloDatas;
  usuarioNome: string;
  onAbrirImpressao: (conteudo: React.ReactNode, titulo: string) => void;
}

export const RelatorioEntradasView: React.FC<RelatorioEntradasViewProps> = ({
  vendas,
  movimentos,
  movimentacoesEstoque,
  intervalo,
  usuarioNome,
  onAbrirImpressao,
}) => {
  // 1. Entradas Financeiras (Vendas concluidas + Suprimentos / Entradas de Caixa)
  const vendasNoPeriodo = useMemo(() => {
    return vendas.filter((v) => {
      const dataRef = v.dataHora || v.data;
      return v.status !== 'cancelada' && isDataNoIntervalo(dataRef, intervalo.inicio, intervalo.fim);
    });
  }, [vendas, intervalo]);

  const suprimentosNoPeriodo = useMemo(() => {
    return movimentos.filter((m) => {
      const dataRef = m.timestamp ? m.timestamp.split('T')[0] : '';
      return m.tipo === 'suprimento' && isDataNoIntervalo(dataRef, intervalo.inicio, intervalo.fim);
    });
  }, [movimentos, intervalo]);

  const totalVendasFinanceiro = useMemo(() => {
    return vendasNoPeriodo.reduce((acc, v) => acc + (v.total || 0), 0);
  }, [vendasNoPeriodo]);

  const totalSuprimentosFinanceiro = useMemo(() => {
    return suprimentosNoPeriodo.reduce((acc, m) => acc + (m.valor || 0), 0);
  }, [suprimentosNoPeriodo]);

  const totalEntradasFinanceiras = totalVendasFinanceiro + totalSuprimentosFinanceiro;

  // 2. Entradas de Mercadorias / Estoque
  const entradasEstoqueNoPeriodo = useMemo(() => {
    return movimentacoesEstoque.filter((m) => {
      return m.tipo === 'entrada' && isDataNoIntervalo(m.data, intervalo.inicio, intervalo.fim);
    });
  }, [movimentacoesEstoque, intervalo]);

  const totalUnidadesEntradaEstoque = useMemo(() => {
    return entradasEstoqueNoPeriodo.reduce((acc, m) => acc + (m.quantidadeAlterada || 0), 0);
  }, [entradasEstoqueNoPeriodo]);

  // Exportar CSV
  const handleExportarCSV = () => {
    const headers = ['Tipo Entrada', 'Origem/Item', 'Data', 'Quantidade', 'Valor (R$)', 'Responsável'];
    const rows = [
      ...vendasNoPeriodo.map((v) => [
        'Receita de Venda',
        `Venda #${v.numero} (${v.clienteNome || 'Consumidor'})`,
        v.data,
        v.itens?.reduce((s, i) => s + i.quantidade, 0) || 1,
        v.total.toFixed(2),
        v.usuario || 'Operador',
      ]),
      ...suprimentosNoPeriodo.map((s) => [
        'Suprimento de Caixa',
        s.descricao,
        s.timestamp ? s.timestamp.split('T')[0] : '',
        '-',
        s.valor.toFixed(2),
        s.usuarioNome || 'Operador',
      ]),
      ...entradasEstoqueNoPeriodo.map((e) => [
        'Entrada de Mercadoria',
        e.produtoNome,
        e.data,
        e.quantidadeAlterada,
        '-',
        e.usuario || 'Estoquista',
      ]),
    ];
    exportarParaCSV(`relatorio-entradas-${intervalo.inicioFormatado.replace(/\//g, '-')}`, headers, rows);
  };

  // Gerar folha timbrada
  const PrintableSheet = () => (
    <div className="bg-white text-zinc-900 p-6 rounded-lg text-xs space-y-5 print:p-0 print:border-none">
      <RelatorioHeaderTimbrado
        nomeRelatorio="Relatório Consolidado de Entradas"
        periodo={intervalo.label}
        usuarioResponsavel={usuarioNome}
        subtitulo="Mix Variedades Store • Demonstrativo Geral de Entradas Financeiras e Mercadorias no Estoque"
      />

      <div className="grid grid-cols-3 gap-3 bg-zinc-50 p-4 rounded border border-zinc-200 text-center">
        <div>
          <span className="text-zinc-500 font-medium block">Total de Entradas Financeiras</span>
          <span className="text-base font-bold text-emerald-600">{formatarMoeda(totalEntradasFinanceiras)}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Receitas de Vendas ({vendasNoPeriodo.length} vendas)</span>
          <span className="text-base font-bold text-zinc-900">{formatarMoeda(totalVendasFinanceiro)}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Mercadorias Recebidas no Estoque</span>
          <span className="text-base font-bold text-[#7B2CF6]">{totalUnidadesEntradaEstoque} unidades</span>
        </div>
      </div>

      {/* Tabela de Entradas de Mercadorias no Estoque */}
      <div>
        <h4 className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] mb-2 border-b border-zinc-200 pb-1">
          Entradas Físicas no Estoque ({entradasEstoqueNoPeriodo.length} movimentações)
        </h4>
        <table className="w-full text-left border border-zinc-200">
          <thead className="bg-zinc-100 text-zinc-600 font-semibold border-b border-zinc-200">
            <tr>
              <th className="p-2">Data</th>
              <th className="p-2">Produto</th>
              <th className="p-2 text-center">Qtd. Adicionada</th>
              <th className="p-2 text-center">Estoque Resultante</th>
              <th className="p-2">Motivo / Origem</th>
              <th className="p-2">Responsável</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {entradasEstoqueNoPeriodo.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-3 text-center text-zinc-400">
                  Nenhuma entrada de estoque registrada no período
                </td>
              </tr>
            ) : (
              entradasEstoqueNoPeriodo.map((m) => (
                <tr key={m.id}>
                  <td className="p-2">{m.data}</td>
                  <td className="p-2 font-medium">{m.produtoNome}</td>
                  <td className="p-2 text-center text-emerald-600 font-bold">+{m.quantidadeAlterada} un</td>
                  <td className="p-2 text-center">{m.quantidadeFinal} un</td>
                  <td className="p-2 text-zinc-500">{m.motivo || 'Lote de reposição'}</td>
                  <td className="p-2">{m.usuario}</td>
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
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            Relatório de Entradas
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Fluxo consolidado de entradas financeiras (receitas/suprimentos) e entradas físicas de mercadorias.
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
            onClick={() => onAbrirImpressao(<PrintableSheet />, 'Relatório de Entradas')}
          >
            Imprimir / Gerar PDF
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Entradas Fin.</span>
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2">{formatarMoeda(totalEntradasFinanceiras)}</p>
            <p className="text-xs text-zinc-500 mt-1">Vendas + Aportes de Troco</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Receitas de Vendas</span>
              <div className="p-2 rounded-lg bg-[#7B2CF6]/15 text-[#9353FF]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{formatarMoeda(totalVendasFinanceiro)}</p>
            <p className="text-xs text-zinc-500 mt-1">{vendasNoPeriodo.length} vendas registradas</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Entradas de Estoque</span>
              <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400">
                <PackagePlus className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{totalUnidadesEntradaEstoque} <span className="text-xs font-normal text-zinc-400">unid.</span></p>
            <p className="text-xs text-zinc-500 mt-1">{entradasEstoqueNoPeriodo.length} lotes recebidos</p>
          </CardBody>
        </Card>
      </div>

      {/* Tabela de Entradas Físicas de Estoque */}
      <Card variant="elevated">
        <CardHeader
          title="Entradas de Mercadorias no Estoque"
          action={<span className="text-xs text-zinc-400">{entradasEstoqueNoPeriodo.length} entradas</span>}
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#14141D] text-zinc-400 border-b border-[#232332]">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Produto</th>
                  <th className="p-3 text-center">Quantidade</th>
                  <th className="p-3 text-center">Estoque Final</th>
                  <th className="p-3">Motivo</th>
                  <th className="p-3">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20202E]">
                {entradasEstoqueNoPeriodo.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-zinc-500">
                      Nenhuma entrada de mercadoria registrada no período selecionado.
                    </td>
                  </tr>
                ) : (
                  entradasEstoqueNoPeriodo.map((m) => (
                    <tr key={m.id} className="hover:bg-[#181824] transition-colors">
                      <td className="p-3 text-zinc-300">{m.data}</td>
                      <td className="p-3 font-semibold text-zinc-100">{m.produtoNome}</td>
                      <td className="p-3 text-center font-bold text-emerald-400">+{m.quantidadeAlterada}</td>
                      <td className="p-3 text-center text-zinc-300 font-medium">{m.quantidadeFinal}</td>
                      <td className="p-3 text-zinc-400">{m.motivo || 'Entrada padrão'}</td>
                      <td className="p-3 text-zinc-300">{m.usuario}</td>
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
