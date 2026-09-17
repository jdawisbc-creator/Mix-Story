import React, { useMemo } from 'react';
import type { SaidaGasto } from '../../types';
import type { IntervaloDatas } from '../../types/relatorios';
import { isDataNoIntervalo, formatarMoeda, exportarParaCSV } from '../../utils/relatorioUtils';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RelatorioHeaderTimbrado } from './RelatorioHeaderTimbrado';
import {
  ShoppingBag,
  TrendingUp,
  DollarSign,
  PackageCheck,
  Download,
  Printer,
  Boxes,
} from 'lucide-react';

interface RelatorioComprasRevendaViewProps {
  saidas: SaidaGasto[];
  intervalo: IntervaloDatas;
  usuarioNome: string;
  onAbrirImpressao: (conteudo: React.ReactNode, titulo: string) => void;
}

export const RelatorioComprasRevendaView: React.FC<RelatorioComprasRevendaViewProps> = ({
  saidas,
  intervalo,
  usuarioNome,
  onAbrirImpressao,
}) => {
  // Filtrar apenas tipo 'compra_revenda' no período
  const comprasRevendaFiltradas = useMemo(() => {
    return saidas.filter((s) => {
      return s.tipo === 'compra_revenda' && isDataNoIntervalo(s.data, intervalo.inicio, intervalo.fim);
    });
  }, [saidas, intervalo]);

  // Cálculos consolidados
  const totalInvestido = useMemo(() => {
    return comprasRevendaFiltradas.reduce((acc, c) => acc + (c.valor || c.valorTotalCompra || 0), 0);
  }, [comprasRevendaFiltradas]);

  const totalPecas = useMemo(() => {
    return comprasRevendaFiltradas.reduce((acc, c) => acc + (c.quantidade || 0), 0);
  }, [comprasRevendaFiltradas]);

  const totalReceitaPotencial = useMemo(() => {
    return comprasRevendaFiltradas.reduce((acc, c) => {
      const rec = c.receitaPotencial || ((c.quantidade || 0) * (c.precoPrevistoVenda || 0));
      return acc + rec;
    }, 0);
  }, [comprasRevendaFiltradas]);

  const totalLucroProjetado = useMemo(() => {
    return comprasRevendaFiltradas.reduce((acc, c) => {
      if (typeof c.lucroProjetado === 'number') return acc + c.lucroProjetado;
      const rec = c.receitaPotencial || ((c.quantidade || 0) * (c.precoPrevistoVenda || 0));
      const custo = c.valor || c.valorTotalCompra || 0;
      return acc + (rec - custo);
    }, 0);
  }, [comprasRevendaFiltradas]);

  const margemMediaLucro = totalInvestido > 0 ? (totalLucroProjetado / totalInvestido) * 100 : 0;

  // Exportar CSV
  const handleExportarCSV = () => {
    const headers = [
      'Data',
      'Produto',
      'Fornecedor',
      'Qtd',
      'Custo Unit. (R$)',
      'Total Investido (R$)',
      'Preço Venda Previsto (R$)',
      'Receita Potencial (R$)',
      'Lucro Projetado (R$)',
    ];
    const rows = comprasRevendaFiltradas.map((c) => {
      const custoUnit = c.custoUnitario || (c.quantidade ? c.valor / c.quantidade : 0);
      const precoVenda = c.precoPrevistoVenda || 0;
      const rec = c.receitaPotencial || ((c.quantidade || 0) * precoVenda);
      const lucro = c.lucroProjetado || (rec - c.valor);
      return [
        c.data,
        c.produtoNome || c.descricao,
        c.fornecedor || c.fornecedorOuFavorecido || '-',
        c.quantidade || 1,
        custoUnit.toFixed(2),
        c.valor.toFixed(2),
        precoVenda.toFixed(2),
        rec.toFixed(2),
        lucro.toFixed(2),
      ];
    });
    exportarParaCSV(`relatorio-compras-revenda-${intervalo.inicioFormatado.replace(/\//g, '-')}`, headers, rows);
  };

  // Gerar folha timbrada para impressão
  const PrintableSheet = () => (
    <div className="bg-white text-zinc-900 p-6 rounded-lg text-xs space-y-5 print:p-0 print:border-none">
      <RelatorioHeaderTimbrado
        nomeRelatorio="Relatório de Compras para Revenda & Lucro Projetado"
        periodo={intervalo.label}
        usuarioResponsavel={usuarioNome}
        subtitulo="Mix Variedades Store • Demonstrativo de Aquisição de Mercadorias e Rentabilidade Estimada"
      />

      {/* Cards de Resumo no Documento */}
      <div className="grid grid-cols-4 gap-3 bg-zinc-50 p-4 rounded border border-zinc-200 text-center">
        <div>
          <span className="text-zinc-500 font-medium block">Total Investido (Custo)</span>
          <span className="text-base font-bold text-zinc-900">{formatarMoeda(totalInvestido)}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Unidades Adquiridas</span>
          <span className="text-base font-bold text-[#7B2CF6]">{totalPecas} peças</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Receita Potencial</span>
          <span className="text-base font-bold text-blue-600">{formatarMoeda(totalReceitaPotencial)}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Lucro Projetado (Markup)</span>
          <span className="text-base font-bold text-emerald-600">{formatarMoeda(totalLucroProjetado)} ({margemMediaLucro.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Tabela de Lotes Comprados */}
      <div>
        <h4 className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] mb-2 border-b border-zinc-200 pb-1">
          Relação de Compras para Revenda ({comprasRevendaFiltradas.length} aquisições)
        </h4>
        <table className="w-full text-left border border-zinc-200">
          <thead className="bg-zinc-100 text-zinc-600 font-semibold border-b border-zinc-200">
            <tr>
              <th className="p-2">Data</th>
              <th className="p-2">Produto</th>
              <th className="p-2">Fornecedor</th>
              <th className="p-2 text-center">Qtd</th>
              <th className="p-2 text-right">Custo Unit.</th>
              <th className="p-2 text-right">Total Compra</th>
              <th className="p-2 text-right">Preço Venda</th>
              <th className="p-2 text-right">Lucro Projetado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {comprasRevendaFiltradas.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-3 text-center text-zinc-400">Nenhuma compra para revenda registrada no período</td>
              </tr>
            ) : (
              comprasRevendaFiltradas.map((c) => {
                const custoUnit = c.custoUnitario || (c.quantidade ? c.valor / c.quantidade : 0);
                const precoVenda = c.precoPrevistoVenda || 0;
                const rec = c.receitaPotencial || ((c.quantidade || 0) * precoVenda);
                const lucro = c.lucroProjetado || (rec - c.valor);

                return (
                  <tr key={c.id}>
                    <td className="p-2">{c.data}</td>
                    <td className="p-2 font-medium">{c.produtoNome || c.descricao}</td>
                    <td className="p-2 text-zinc-600">{c.fornecedor || c.fornecedorOuFavorecido || '-'}</td>
                    <td className="p-2 text-center font-semibold">{c.quantidade || 1} un</td>
                    <td className="p-2 text-right">{formatarMoeda(custoUnit)}</td>
                    <td className="p-2 text-right font-semibold">{formatarMoeda(c.valor)}</td>
                    <td className="p-2 text-right text-blue-600">{formatarMoeda(precoVenda)}</td>
                    <td className="p-2 text-right font-bold text-emerald-600">+{formatarMoeda(lucro)}</td>
                  </tr>
                );
              })
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
            <ShoppingBag className="w-5 h-5 text-[#7B2CF6]" />
            Relatório de Compras para Revenda
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Demonstrativo de reposição de estoque, investimento em mercadorias e margem projetada.
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
            onClick={() => onAbrirImpressao(<PrintableSheet />, 'Relatório de Compras para Revenda')}
          >
            Imprimir / Gerar PDF
          </Button>
        </div>
      </div>

      {/* 4 Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Investido</span>
              <div className="p-2 rounded-lg bg-[#7B2CF6]/15 text-[#9353FF]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{formatarMoeda(totalInvestido)}</p>
            <p className="text-xs text-zinc-500 mt-1">{comprasRevendaFiltradas.length} compras de lotes</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Peças Adquiridas</span>
              <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{totalPecas} <span className="text-xs font-normal text-zinc-400">unid.</span></p>
            <p className="text-xs text-zinc-500 mt-1">Itens físicos somados</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Receita Potencial</span>
              <div className="p-2 rounded-lg bg-[#FF8A00]/15 text-[#FFA633]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{formatarMoeda(totalReceitaPotencial)}</p>
            <p className="text-xs text-zinc-500 mt-1">Preço de venda estimado</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Lucro Projetado</span>
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2">{formatarMoeda(totalLucroProjetado)}</p>
            <p className="text-xs text-zinc-500 mt-1">Margem média: {margemMediaLucro.toFixed(1)}%</p>
          </CardBody>
        </Card>
      </div>

      {/* Tabela de Compras para Revenda */}
      <Card variant="elevated">
        <CardHeader
          title="Extrato de Compras para Revenda"
          action={<span className="text-xs text-zinc-400">{comprasRevendaFiltradas.length} registros</span>}
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#14141D] text-zinc-400 border-b border-[#232332]">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Produto</th>
                  <th className="p-3">Fornecedor</th>
                  <th className="p-3 text-center">Quantidade</th>
                  <th className="p-3 text-right">Custo Unit.</th>
                  <th className="p-3 text-right">Total Compra</th>
                  <th className="p-3 text-right">Preço Venda</th>
                  <th className="p-3 text-right">Lucro Previsto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20202E]">
                {comprasRevendaFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-zinc-500">
                      Nenhuma compra para revenda registrada no período selecionado.
                    </td>
                  </tr>
                ) : (
                  comprasRevendaFiltradas.map((c) => {
                    const custoUnit = c.custoUnitario || (c.quantidade ? c.valor / c.quantidade : 0);
                    const precoVenda = c.precoPrevistoVenda || 0;
                    const rec = c.receitaPotencial || ((c.quantidade || 0) * precoVenda);
                    const lucro = c.lucroProjetado || (rec - c.valor);

                    return (
                      <tr key={c.id} className="hover:bg-[#181824] transition-colors">
                        <td className="p-3 text-zinc-300">{c.data}</td>
                        <td className="p-3 font-semibold text-zinc-100">{c.produtoNome || c.descricao}</td>
                        <td className="p-3 text-zinc-400">{c.fornecedor || c.fornecedorOuFavorecido || '-'}</td>
                        <td className="p-3 text-center font-bold text-white">{c.quantidade || 1}</td>
                        <td className="p-3 text-right text-zinc-300">{formatarMoeda(custoUnit)}</td>
                        <td className="p-3 text-right font-medium text-rose-400">{formatarMoeda(c.valor)}</td>
                        <td className="p-3 text-right text-[#FFA633]">{formatarMoeda(precoVenda)}</td>
                        <td className="p-3 text-right font-bold text-emerald-400">+{formatarMoeda(lucro)}</td>
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
