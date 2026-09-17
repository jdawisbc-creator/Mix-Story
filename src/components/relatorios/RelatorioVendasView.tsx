import React, { useMemo } from 'react';
import type { Venda } from '../../types';
import type { IntervaloDatas } from '../../types/relatorios';
import { isDataNoIntervalo, formatarMoeda, exportarParaCSV } from '../../utils/relatorioUtils';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RelatorioHeaderTimbrado } from './RelatorioHeaderTimbrado';
import {
  ShoppingCart,
  DollarSign,
  CreditCard,
  Package,
  Wrench,
  Download,
  Printer,
  FileText,
} from 'lucide-react';

interface RelatorioVendasViewProps {
  vendas: Venda[];
  intervalo: IntervaloDatas;
  usuarioNome: string;
  onAbrirImpressao: (conteudo: React.ReactNode, titulo: string) => void;
}

export const RelatorioVendasView: React.FC<RelatorioVendasViewProps> = ({
  vendas,
  intervalo,
  usuarioNome,
  onAbrirImpressao,
}) => {
  // 1. Filtrar vendas do período (apenas concluidas, desconsiderando canceladas no faturamento)
  const vendasFiltradas = useMemo(() => {
    return vendas.filter((v) => {
      // Prioriza dataHora ISO ou campo data (DD/MM/AAAA)
      const dataRef = v.dataHora || v.data;
      return isDataNoIntervalo(dataRef, intervalo.inicio, intervalo.fim);
    });
  }, [vendas, intervalo]);

  const vendasConcluidas = useMemo(() => {
    return vendasFiltradas.filter((v) => v.status !== 'cancelada');
  }, [vendasFiltradas]);

  // 2. Indicadores
  const qtdVendas = vendasConcluidas.length;
  const faturamentoTotal = vendasConcluidas.reduce((acc, v) => acc + (v.total || 0), 0);
  const ticketMedio = qtdVendas > 0 ? faturamentoTotal / qtdVendas : 0;

  // 3. Formas de pagamento
  const formasPagamentoStats = useMemo(() => {
    const mapa: Record<string, { total: number; qtd: number }> = {
      pix: { total: 0, qtd: 0 },
      dinheiro: { total: 0, qtd: 0 },
      cartao_debito: { total: 0, qtd: 0 },
      cartao_credito: { total: 0, qtd: 0 },
      transferencia: { total: 0, qtd: 0 },
      outros: { total: 0, qtd: 0 },
      misto: { total: 0, qtd: 0 },
    };

    const labelMap: Record<string, string> = {
      pix: 'PIX Instantâneo',
      dinheiro: 'Dinheiro Espécie',
      cartao_debito: 'Cartão de Débito',
      cartao_credito: 'Cartão de Crédito',
      transferencia: 'Transferência / TED',
      outros: 'Outros Meios',
      misto: 'Pagamento Misto',
    };

    vendasConcluidas.forEach((v) => {
      const forma = v.formaPagamento || 'outros';
      if (!mapa[forma]) {
        mapa[forma] = { total: 0, qtd: 0 };
      }
      mapa[forma].total += v.total || 0;
      mapa[forma].qtd += 1;
    });

    return Object.entries(mapa)
      .map(([key, data]) => ({
        key,
        label: labelMap[key] || key.toUpperCase(),
        total: data.total,
        qtd: data.qtd,
        percentual: faturamentoTotal > 0 ? (data.total / faturamentoTotal) * 100 : 0,
      }))
      .filter((item) => item.qtd > 0 || item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [vendasConcluidas, faturamentoTotal]);

  // 4. Produtos vendidos vs Serviços vendidos
  const { produtosVendidos, servicosVendidos, totalQtdProdutos, totalQtdServicos } = useMemo(() => {
    const mapaProdutos: Record<string, { nome: string; quantidade: number; total: number }> = {};
    const mapaServicos: Record<string, { nome: string; quantidade: number; total: number }> = {};

    let qtdProd = 0;
    let qtdServ = 0;

    vendasConcluidas.forEach((v) => {
      (v.itens || []).forEach((it) => {
        const isServico = it.tipoItem === 'servico';
        const mapaAlvo = isServico ? mapaServicos : mapaProdutos;
        const chave = it.produtoId || it.nome;

        if (!mapaAlvo[chave]) {
          mapaAlvo[chave] = { nome: it.nome, quantidade: 0, total: 0 };
        }
        mapaAlvo[chave].quantidade += it.quantidade || 0;
        mapaAlvo[chave].total += it.total || (it.quantidade * it.precoUnitario) || 0;

        if (isServico) {
          qtdServ += it.quantidade || 0;
        } else {
          qtdProd += it.quantidade || 0;
        }
      });
    });

    return {
      produtosVendidos: Object.values(mapaProdutos).sort((a, b) => b.total - a.total),
      servicosVendidos: Object.values(mapaServicos).sort((a, b) => b.total - a.total),
      totalQtdProdutos: qtdProd,
      totalQtdServicos: qtdServ,
    };
  }, [vendasConcluidas]);

  // Exportar CSV
  const handleExportarCSV = () => {
    const headers = ['Venda Nº', 'Data', 'Horário', 'Cliente', 'Itens', 'Forma Pagamento', 'Total (R$)', 'Status'];
    const rows = vendasFiltradas.map((v) => [
      v.numero,
      v.data,
      v.horario || '',
      v.clienteNome || 'Consumidor',
      (v.itens || []).map((i) => `${i.quantidade}x ${i.nome}`).join(' | '),
      v.formaPagamento.toUpperCase(),
      v.total.toFixed(2),
      v.status === 'cancelada' ? 'CANCELADA' : 'CONCLUÍDA',
    ]);
    exportarParaCSV(`relatorio-vendas-${intervalo.inicioFormatado.replace(/\//g, '-')}`, headers, rows);
  };

  // Gerar folha timbrada para impressão / PDF
  const PrintableSheet = () => (
    <div className="bg-white text-zinc-900 p-6 rounded-lg text-xs space-y-5 print:p-0 print:border-none">
      <RelatorioHeaderTimbrado
        nomeRelatorio="Relatório Analítico de Vendas"
        periodo={intervalo.label}
        usuarioResponsavel={usuarioNome}
        subtitulo="Mix Variedades Store • Demonstrativo de Faturamento, Pagamentos, Produtos e Serviços"
      />

      {/* Cards de Resumo no Documento */}
      <div className="grid grid-cols-4 gap-3 bg-zinc-50 p-4 rounded border border-zinc-200 text-center">
        <div>
          <span className="text-zinc-500 font-medium block">Total de Vendas</span>
          <span className="text-base font-bold text-zinc-900">{qtdVendas}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Faturamento Bruto</span>
          <span className="text-base font-bold text-emerald-600">{formatarMoeda(faturamentoTotal)}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Ticket Médio</span>
          <span className="text-base font-bold text-[#7B2CF6]">{formatarMoeda(ticketMedio)}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Itens Vendidos</span>
          <span className="text-base font-bold text-zinc-900">{totalQtdProdutos + totalQtdServicos} unid.</span>
        </div>
      </div>

      {/* Formas de Pagamento no Documento */}
      <div>
        <h4 className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] mb-2 border-b border-zinc-200 pb-1">
          Distribuição por Formas de Pagamento
        </h4>
        <table className="w-full text-left border border-zinc-200 rounded">
          <thead className="bg-zinc-100 text-zinc-600 font-semibold border-b border-zinc-200">
            <tr>
              <th className="p-2">Forma de Pagamento</th>
              <th className="p-2 text-center">Qtd. Transações</th>
              <th className="p-2 text-right">Faturamento Total</th>
              <th className="p-2 text-right">Participação (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {formasPagamentoStats.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-3 text-center text-zinc-400">Nenhum pagamento registrado no período</td>
              </tr>
            ) : (
              formasPagamentoStats.map((f, i) => (
                <tr key={i}>
                  <td className="p-2 font-medium">{f.label}</td>
                  <td className="p-2 text-center">{f.qtd}</td>
                  <td className="p-2 text-right font-semibold">{formatarMoeda(f.total)}</td>
                  <td className="p-2 text-right">{f.percentual.toFixed(1)}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Produtos Vendidos */}
      <div>
        <h4 className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] mb-2 border-b border-zinc-200 pb-1">
          Produtos Físicos Vendidos ({produtosVendidos.length} itens distintos • {totalQtdProdutos} un)
        </h4>
        <table className="w-full text-left border border-zinc-200">
          <thead className="bg-zinc-100 text-zinc-600 font-semibold border-b border-zinc-200">
            <tr>
              <th className="p-2">Produto</th>
              <th className="p-2 text-center">Qtd. Vendida</th>
              <th className="p-2 text-right">Total Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {produtosVendidos.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-3 text-center text-zinc-400">Nenhum produto vendido no período</td>
              </tr>
            ) : (
              produtosVendidos.slice(0, 15).map((p, i) => (
                <tr key={i}>
                  <td className="p-2">{p.nome}</td>
                  <td className="p-2 text-center font-medium">{p.quantidade} un</td>
                  <td className="p-2 text-right font-semibold">{formatarMoeda(p.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Serviços Vendidos */}
      <div>
        <h4 className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] mb-2 border-b border-zinc-200 pb-1">
          Serviços Prestados ({servicosVendidos.length} itens distintos • {totalQtdServicos} un)
        </h4>
        <table className="w-full text-left border border-zinc-200">
          <thead className="bg-zinc-100 text-zinc-600 font-semibold border-b border-zinc-200">
            <tr>
              <th className="p-2">Serviço / Xerox / Impressão / Arte</th>
              <th className="p-2 text-center">Qtd. Realizada</th>
              <th className="p-2 text-right">Total Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {servicosVendidos.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-3 text-center text-zinc-400">Nenhum serviço prestado no período</td>
              </tr>
            ) : (
              servicosVendidos.map((s, i) => (
                <tr key={i}>
                  <td className="p-2">{s.nome}</td>
                  <td className="p-2 text-center font-medium">{s.quantidade} un</td>
                  <td className="p-2 text-right font-semibold">{formatarMoeda(s.total)}</td>
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
      {/* Botões de Ação do Relatório */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#13131B] border border-[#222230] p-4 rounded-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#7B2CF6]" />
            Relatório de Vendas
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Consolidação de faturamento, canais de pagamento, produtos e serviços vendidos.
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
            onClick={() => onAbrirImpressao(<PrintableSheet />, 'Relatório de Vendas')}
          >
            Imprimir / Gerar PDF
          </Button>
        </div>
      </div>

      {/* 5 KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Quantidade Vendas</span>
              <div className="p-2 rounded-lg bg-[#7B2CF6]/15 text-[#9353FF]">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{qtdVendas}</p>
            <p className="text-xs text-zinc-500 mt-1">Vendas concluídas no período</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Faturamento Total</span>
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2">{formatarMoeda(faturamentoTotal)}</p>
            <p className="text-xs text-zinc-500 mt-1">Ticket Médio: {formatarMoeda(ticketMedio)}</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Produtos Vendidos</span>
              <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{totalQtdProdutos} <span className="text-xs font-normal text-zinc-400">unid.</span></p>
            <p className="text-xs text-zinc-500 mt-1">{produtosVendidos.length} produtos físicos distintos</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Serviços Vendidos</span>
              <div className="p-2 rounded-lg bg-[#FF8A00]/15 text-[#FFA633]">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{totalQtdServicos} <span className="text-xs font-normal text-zinc-400">unid.</span></p>
            <p className="text-xs text-zinc-500 mt-1">Xerox, plastificação, impressões</p>
          </CardBody>
        </Card>
      </div>

      {/* Formas de Pagamento e Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formas de Pagamento */}
        <Card variant="elevated" className="lg:col-span-1">
          <CardHeader
            title="Formas de Pagamento"
            action={<Badge variant="purple" size="sm">{formasPagamentoStats.length} métodos</Badge>}
          />
          <CardBody className="space-y-3">
            {formasPagamentoStats.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">Nenhuma venda registrada no período selecionado.</p>
            ) : (
              formasPagamentoStats.map((forma) => (
                <div key={forma.key} className="bg-[#181822] p-3 rounded-xl border border-[#232332] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#7B2CF6]" />
                      {forma.label}
                    </span>
                    <span className="font-bold text-white">{formatarMoeda(forma.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>{forma.qtd} {forma.qtd === 1 ? 'venda' : 'vendas'}</span>
                    <span className="text-[#FF8A00] font-semibold">{forma.percentual.toFixed(1)}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-[#2A2A38] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7B2CF6] to-[#FF8A00] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, forma.percentual))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Produtos e Serviços Vendidos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Produtos Físicos Vendidos */}
          <Card variant="elevated">
            <CardHeader
              title="Produtos Vendidos (Top Faturamento)"
              action={<span className="text-xs text-zinc-400">{produtosVendidos.length} produtos</span>}
            />
            <CardBody className="p-0">
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#14141D] text-zinc-400 border-b border-[#232332] sticky top-0">
                    <tr>
                      <th className="p-3">Produto</th>
                      <th className="p-3 text-center">Qtd</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#20202E]">
                    {produtosVendidos.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-zinc-500">
                          Nenhum produto físico vendido no período.
                        </td>
                      </tr>
                    ) : (
                      produtosVendidos.map((prod, idx) => (
                        <tr key={idx} className="hover:bg-[#181824] transition-colors">
                          <td className="p-3 font-medium text-zinc-200">{prod.nome}</td>
                          <td className="p-3 text-center text-zinc-300 font-semibold">{prod.quantidade}</td>
                          <td className="p-3 text-right font-bold text-emerald-400">{formatarMoeda(prod.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          {/* Serviços Vendidos */}
          <Card variant="elevated">
            <CardHeader
              title="Serviços Vendidos (Xerox, Plastificação, Arte)"
              action={<span className="text-xs text-zinc-400">{servicosVendidos.length} serviços</span>}
            />
            <CardBody className="p-0">
              <div className="overflow-x-auto max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#14141D] text-zinc-400 border-b border-[#232332] sticky top-0">
                    <tr>
                      <th className="p-3">Serviço</th>
                      <th className="p-3 text-center">Qtd</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#20202E]">
                    {servicosVendidos.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-zinc-500">
                          Nenhum serviço vendido no período.
                        </td>
                      </tr>
                    ) : (
                      servicosVendidos.map((srv, idx) => (
                        <tr key={idx} className="hover:bg-[#181824] transition-colors">
                          <td className="p-3 font-medium text-zinc-200">{srv.nome}</td>
                          <td className="p-3 text-center text-zinc-300 font-semibold">{srv.quantidade}</td>
                          <td className="p-3 text-right font-bold text-[#FFA633]">{formatarMoeda(srv.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
