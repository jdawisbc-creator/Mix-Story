import React, { useMemo, useState } from 'react';
import type { Produto, MovimentacaoEstoque } from '../../types';
import type { IntervaloDatas } from '../../types/relatorios';
import { isDataNoIntervalo, formatarMoeda, exportarParaCSV } from '../../utils/relatorioUtils';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RelatorioHeaderTimbrado } from './RelatorioHeaderTimbrado';
import {
  Package,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Download,
  Printer,
  Boxes,
  History,
  Search,
} from 'lucide-react';

interface RelatorioEstoqueViewProps {
  produtos: Produto[];
  movimentacoes: MovimentacaoEstoque[];
  intervalo: IntervaloDatas;
  usuarioNome: string;
  onAbrirImpressao: (conteudo: React.ReactNode, titulo: string) => void;
}

export const RelatorioEstoqueView: React.FC<RelatorioEstoqueViewProps> = ({
  produtos,
  movimentacoes,
  intervalo,
  usuarioNome,
  onAbrirImpressao,
}) => {
  const [termoBusca, setTermoBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  // Movimentações no período
  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter((m) => isDataNoIntervalo(m.data, intervalo.inicio, intervalo.fim));
  }, [movimentacoes, intervalo]);

  // Cálculos do inventário
  const totalItensDistintos = produtos.length;
  const totalPecasEstoque = produtos.reduce((acc, p) => acc + (p.quantidade ?? p.estoqueAtual ?? 0), 0);
  const valorTotalCusto = produtos.reduce((acc, p) => {
    const qtd = p.quantidade ?? p.estoqueAtual ?? 0;
    return acc + (qtd * (p.precoCusto || 0));
  }, 0);

  const valorTotalVenda = produtos.reduce((acc, p) => {
    const qtd = p.quantidade ?? p.estoqueAtual ?? 0;
    return acc + (qtd * (p.precoVenda || 0));
  }, 0);

  const lucroPotencialEstoque = valorTotalVenda - valorTotalCusto;
  const margemMediaGlobal = valorTotalCusto > 0 ? (lucroPotencialEstoque / valorTotalCusto) * 100 : 0;

  // Itens com estoque baixo (menor ou igual a 5 peças)
  const itensEstoqueBaixo = useMemo(() => {
    return produtos.filter((p) => {
      const qtd = p.quantidade ?? p.estoqueAtual ?? 0;
      return qtd <= 5;
    });
  }, [produtos]);

  // Categorias disponíveis
  const categorias = useMemo(() => {
    const set = new Set<string>();
    produtos.forEach((p) => {
      if (p.categoria) set.add(p.categoria);
    });
    return Array.from(set);
  }, [produtos]);

  // Produtos filtrados na tabela
  const produtosExibidos = useMemo(() => {
    return produtos.filter((p) => {
      const matchBusca = p.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (p.categoria && p.categoria.toLowerCase().includes(termoBusca.toLowerCase()));
      const matchCat = categoriaFiltro === 'todas' || p.categoria === categoriaFiltro;
      return matchBusca && matchCat;
    });
  }, [produtos, termoBusca, categoriaFiltro]);

  // Exportar CSV
  const handleExportarCSV = () => {
    const headers = [
      'Produto',
      'Categoria',
      'Estoque Atual',
      'Preço Custo (R$)',
      'Preço Venda (R$)',
      'Total em Custo (R$)',
      'Total em Venda (R$)',
      'Status Estoque',
    ];
    const rows = produtos.map((p) => {
      const qtd = p.quantidade ?? p.estoqueAtual ?? 0;
      const totalCusto = qtd * (p.precoCusto || 0);
      const totalVenda = qtd * (p.precoVenda || 0);
      return [
        p.nome,
        p.categoria || 'Outros',
        qtd,
        (p.precoCusto || 0).toFixed(2),
        (p.precoVenda || 0).toFixed(2),
        totalCusto.toFixed(2),
        totalVenda.toFixed(2),
        qtd === 0 ? 'ZERADO' : qtd <= 5 ? 'BAIXO' : 'REGULAR',
      ];
    });
    exportarParaCSV(`relatorio-estoque-mix-${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  // Folha timbrada para impressão / PDF
  const PrintableSheet = () => (
    <div className="bg-white text-zinc-900 p-6 rounded-lg text-xs space-y-5 print:p-0 print:border-none">
      <RelatorioHeaderTimbrado
        nomeRelatorio="Relatório Oficial de Posição de Estoque & Inventário"
        periodo={`Posição Atual • Histórico: ${intervalo.label}`}
        usuarioResponsavel={usuarioNome}
        subtitulo="Mix Variedades Store • Demonstrativo Físico, Valor Imobilizado e Movimentações"
      />

      {/* Resumo do Estoque */}
      <div className="grid grid-cols-4 gap-3 bg-zinc-50 p-4 rounded border border-zinc-200 text-center">
        <div>
          <span className="text-zinc-500 font-medium block">Total de Peças Físicas</span>
          <span className="text-base font-bold text-zinc-900">{totalPecasEstoque} un ({totalItensDistintos} produtos)</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Custo Total Imobilizado</span>
          <span className="text-base font-bold text-zinc-800">{formatarMoeda(valorTotalCusto)}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Valor Potencial de Venda</span>
          <span className="text-base font-bold text-[#7B2CF6]">{formatarMoeda(valorTotalVenda)}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-medium block">Lucro Potencial Total</span>
          <span className="text-base font-bold text-emerald-600">{formatarMoeda(lucroPotencialEstoque)} ({margemMediaGlobal.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Itens em Alerta de Estoque Baixo */}
      {itensEstoqueBaixo.length > 0 && (
        <div className="border border-amber-300 bg-amber-50 p-3 rounded">
          <h4 className="font-bold text-amber-900 text-[11px] mb-1">
            Atenção: {itensEstoqueBaixo.length} produtos com estoque baixo ou zerado (≤ 5 unidades)
          </h4>
          <p className="text-amber-800 text-[11px]">
            {itensEstoqueBaixo.map((p) => `${p.nome} (${p.quantidade ?? p.estoqueAtual ?? 0} un)`).join(', ')}
          </p>
        </div>
      )}

      {/* Tabela do Inventário */}
      <div>
        <h4 className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] mb-2 border-b border-zinc-200 pb-1">
          Inventário de Produtos ({produtos.length})
        </h4>
        <table className="w-full text-left border border-zinc-200">
          <thead className="bg-zinc-100 text-zinc-600 font-semibold border-b border-zinc-200">
            <tr>
              <th className="p-2">Produto</th>
              <th className="p-2">Categoria</th>
              <th className="p-2 text-center">Qtd.</th>
              <th className="p-2 text-right">Preço Custo</th>
              <th className="p-2 text-right">Preço Venda</th>
              <th className="p-2 text-right">Total Custo</th>
              <th className="p-2 text-right">Total Venda</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {produtos.map((p) => {
              const qtd = p.quantidade ?? p.estoqueAtual ?? 0;
              const totalCusto = qtd * (p.precoCusto || 0);
              const totalVenda = qtd * (p.precoVenda || 0);

              return (
                <tr key={p.id}>
                  <td className="p-2 font-medium">{p.nome}</td>
                  <td className="p-2 text-zinc-600">{p.categoria}</td>
                  <td className="p-2 text-center font-bold">
                    <span className={qtd <= 5 ? 'text-amber-600' : 'text-zinc-900'}>{qtd} un</span>
                  </td>
                  <td className="p-2 text-right">{formatarMoeda(p.precoCusto || 0)}</td>
                  <td className="p-2 text-right">{formatarMoeda(p.precoVenda || 0)}</td>
                  <td className="p-2 text-right font-medium">{formatarMoeda(totalCusto)}</td>
                  <td className="p-2 text-right font-semibold text-emerald-600">{formatarMoeda(totalVenda)}</td>
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
            <Package className="w-5 h-5 text-[#7B2CF6]" />
            Relatório de Estoque & Inventário
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Posição quantitativa, capital imobilizado a custo, projeção de venda e auditoria de movimentações.
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
            onClick={() => onAbrirImpressao(<PrintableSheet />, 'Relatório de Estoque')}
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
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Peças em Estoque</span>
              <div className="p-2 rounded-lg bg-[#7B2CF6]/15 text-[#9353FF]">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{totalPecasEstoque} <span className="text-xs font-normal text-zinc-400">unid.</span></p>
            <p className="text-xs text-zinc-500 mt-1">{totalItensDistintos} produtos cadastrados</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Capital Imobilizado</span>
              <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{formatarMoeda(valorTotalCusto)}</p>
            <p className="text-xs text-zinc-500 mt-1">Valor total a preço de custo</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Valor em Venda</span>
              <div className="p-2 rounded-lg bg-[#FF8A00]/15 text-[#FFA633]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#FFA633] mt-2">{formatarMoeda(valorTotalVenda)}</p>
            <p className="text-xs text-zinc-500 mt-1">Faturamento total potencial</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Lucro Potencial</span>
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2">{formatarMoeda(lucroPotencialEstoque)}</p>
            <p className="text-xs text-zinc-500 mt-1">Margem média: {margemMediaGlobal.toFixed(1)}%</p>
          </CardBody>
        </Card>
      </div>

      {/* Alerta de Estoque Baixo se houver */}
      {itensEstoqueBaixo.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-300 block">
              {itensEstoqueBaixo.length} {itensEstoqueBaixo.length === 1 ? 'produto necessita' : 'produtos necessitam'} de reposição urgente
            </span>
            <span className="text-zinc-300 mt-0.5 block">
              Itens com estoque igual ou inferior a 5 unidades: {itensEstoqueBaixo.map((p) => p.nome).join(', ')}.
            </span>
          </div>
        </div>
      )}

      {/* Filtros da Tabela */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por nome ou categoria..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full bg-[#181822] border border-[#2B2B3D] text-white pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#7B2CF6]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-zinc-400">Categoria:</span>
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="bg-[#181822] border border-[#2B2B3D] text-white px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-[#7B2CF6]"
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela do Inventário */}
      <Card variant="elevated">
        <CardHeader
          title="Tabela de Inventário de Produtos"
          action={<span className="text-xs text-zinc-400">{produtosExibidos.length} listados</span>}
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#14141D] text-zinc-400 border-b border-[#232332]">
                <tr>
                  <th className="p-3">Produto</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3 text-center">Estoque</th>
                  <th className="p-3 text-right">Preço Custo</th>
                  <th className="p-3 text-right">Preço Venda</th>
                  <th className="p-3 text-right">Total Custo</th>
                  <th className="p-3 text-right">Total Venda</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20202E]">
                {produtosExibidos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-zinc-500">
                      Nenhum produto encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  produtosExibidos.map((prod) => {
                    const qtd = prod.quantidade ?? prod.estoqueAtual ?? 0;
                    const totalCusto = qtd * (prod.precoCusto || 0);
                    const totalVenda = qtd * (prod.precoVenda || 0);

                    return (
                      <tr key={prod.id} className="hover:bg-[#181824] transition-colors">
                        <td className="p-3 font-semibold text-zinc-100">{prod.nome}</td>
                        <td className="p-3 text-zinc-300">{prod.categoria}</td>
                        <td className="p-3 text-center font-bold text-white">{qtd}</td>
                        <td className="p-3 text-right text-zinc-300">{formatarMoeda(prod.precoCusto || 0)}</td>
                        <td className="p-3 text-right text-zinc-200">{formatarMoeda(prod.precoVenda || 0)}</td>
                        <td className="p-3 text-right font-medium text-rose-400">{formatarMoeda(totalCusto)}</td>
                        <td className="p-3 text-right font-bold text-emerald-400">{formatarMoeda(totalVenda)}</td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={qtd === 0 ? 'red' : qtd <= 5 ? 'orange' : 'green'}
                            size="sm"
                          >
                            {qtd === 0 ? 'ZERADO' : qtd <= 5 ? 'BAIXO' : 'REGULAR'}
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

      {/* Movimentações do Período */}
      <Card variant="elevated">
        <CardHeader
          title={`Movimentações de Estoque no Período (${movimentacoesFiltradas.length})`}
          action={
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <History className="w-3.5 h-3.5" /> Auditoria
            </span>
          }
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#14141D] text-zinc-400 border-b border-[#232332] sticky top-0">
                <tr>
                  <th className="p-3">Data / Hora</th>
                  <th className="p-3">Produto</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3 text-center">Qtd. Alterada</th>
                  <th className="p-3 text-center">Saldo Final</th>
                  <th className="p-3">Motivo</th>
                  <th className="p-3">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20202E]">
                {movimentacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-zinc-500">
                      Nenhuma movimentação de estoque registrada no período selecionado.
                    </td>
                  </tr>
                ) : (
                  movimentacoesFiltradas.map((m) => (
                    <tr key={m.id} className="hover:bg-[#181824] transition-colors">
                      <td className="p-3 text-zinc-400">{m.data} {m.hora ? `às ${m.hora}` : ''}</td>
                      <td className="p-3 font-medium text-zinc-200">{m.produtoNome}</td>
                      <td className="p-3">
                        <Badge
                          variant={m.tipo === 'entrada' ? 'green' : m.tipo === 'venda' ? 'purple' : 'red'}
                          size="sm"
                        >
                          {m.tipo.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3 text-center font-bold">
                        <span className={m.quantidadeAlterada > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {m.quantidadeAlterada > 0 ? `+${m.quantidadeAlterada}` : m.quantidadeAlterada}
                        </span>
                      </td>
                      <td className="p-3 text-center text-zinc-200 font-semibold">{m.quantidadeFinal}</td>
                      <td className="p-3 text-zinc-400">{m.motivo || '-'}</td>
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
