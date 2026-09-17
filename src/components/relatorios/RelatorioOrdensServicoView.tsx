import React, { useMemo } from 'react';
import type { OrdemServico } from '../../types';
import type { IntervaloDatas } from '../../types/relatorios';
import { isDataNoIntervalo, formatarMoeda, exportarParaCSV } from '../../utils/relatorioUtils';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RelatorioHeaderTimbrado } from './RelatorioHeaderTimbrado';
import {
  Wrench,
  CheckCircle2,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  DollarSign,
  Download,
  Printer,
  FileCheck,
} from 'lucide-react';

interface RelatorioOrdensServicoViewProps {
  ordens: OrdemServico[];
  intervalo: IntervaloDatas;
  usuarioNome: string;
  onAbrirImpressao: (conteudo: React.ReactNode, titulo: string) => void;
}

export const RelatorioOrdensServicoView: React.FC<RelatorioOrdensServicoViewProps> = ({
  ordens,
  intervalo,
  usuarioNome,
  onAbrirImpressao,
}) => {
  // Filtrar Ordens de Serviço criadas no período
  const ordensFiltradas = useMemo(() => {
    return ordens.filter((o) => {
      const dataRef = o.dataEntrada || (o.criadoEm ? o.criadoEm.split('T')[0] : '');
      return isDataNoIntervalo(dataRef, intervalo.inicio, intervalo.fim);
    });
  }, [ordens, intervalo]);

  // Contagem estrita dos 6 status exigidos pelo usuário + Valor Total
  const criadas = ordensFiltradas.length;
  const aprovadas = ordensFiltradas.filter((o) => o.status === 'aprovada').length;
  const emProducao = ordensFiltradas.filter((o) => o.status === 'em_producao').length;
  const prontas = ordensFiltradas.filter((o) => o.status === 'pronta').length;
  const entregues = ordensFiltradas.filter((o) => o.status === 'entregue').length;
  const canceladas = ordensFiltradas.filter((o) => o.status === 'cancelada').length;

  // Valor total de todas as O.S. ativas/válidas no período
  const valorTotalGeral = useMemo(() => {
    return ordensFiltradas.reduce((acc, o) => acc + (o.valorTotal || 0), 0);
  }, [ordensFiltradas]);

  const valorTotalNaoCanceladas = useMemo(() => {
    return ordensFiltradas
      .filter((o) => o.status !== 'cancelada')
      .reduce((acc, o) => acc + (o.valorTotal || 0), 0);
  }, [ordensFiltradas]);

  // Exportar CSV
  const handleExportarCSV = () => {
    const headers = [
      'Nº O.S.',
      'Cliente',
      'Telefone',
      'Data Entrada',
      'Data Entrega',
      'Status',
      'Aprovação',
      'Valor Total (R$)',
      'Itens / Serviços',
    ];
    const rows = ordensFiltradas.map((o) => [
      o.numeroOS,
      o.clienteNome,
      o.clienteTelefone || '-',
      o.dataEntrada,
      o.dataEntrega,
      o.status.toUpperCase(),
      o.aprovacaoCliente || 'SIM',
      (o.valorTotal || 0).toFixed(2),
      (o.itens || []).map((i) => `${i.quantidade}x ${i.descricao}`).join(' | '),
    ]);
    exportarParaCSV(`relatorio-ordens-servico-${intervalo.inicioFormatado.replace(/\//g, '-')}`, headers, rows);
  };

  // Status visual label & color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovada':
        return <Badge variant="green" size="sm">APROVADA</Badge>;
      case 'em_producao':
        return <Badge variant="orange" size="sm">EM PRODUÇÃO</Badge>;
      case 'pronta':
        return <Badge variant="purple" size="sm">PRONTA</Badge>;
      case 'entregue':
        return <Badge variant="green" size="sm">ENTREGUE</Badge>;
      case 'cancelada':
        return <Badge variant="red" size="sm">CANCELADA</Badge>;
      default:
        return <Badge variant="purple" size="sm">AGUARDANDO</Badge>;
    }
  };

  // Folha timbrada para impressão
  const PrintableSheet = () => (
    <div className="bg-white text-zinc-900 p-6 rounded-lg text-xs space-y-5 print:p-0 print:border-none">
      <RelatorioHeaderTimbrado
        nomeRelatorio="Relatório Oficial de Ordens de Serviço"
        periodo={intervalo.label}
        usuarioResponsavel={usuarioNome}
        subtitulo="Mix Variedades Store • Acompanhamento de Produção, Entregas e Faturamento de O.S."
      />

      {/* Os 7 Indicadores Exigidos: Criadas, Aprovadas, Em produção, Prontas, Entregues, Canceladas, Valor total */}
      <div className="grid grid-cols-7 gap-2 bg-zinc-50 p-3 rounded border border-zinc-200 text-center">
        <div>
          <span className="text-zinc-500 text-[11px] block font-medium">Criadas</span>
          <span className="text-base font-bold text-zinc-900">{criadas}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[11px] block font-medium">Aprovadas</span>
          <span className="text-base font-bold text-emerald-600">{aprovadas}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[11px] block font-medium">Em Produção</span>
          <span className="text-base font-bold text-[#FF8A00]">{emProducao}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[11px] block font-medium">Prontas</span>
          <span className="text-base font-bold text-[#7B2CF6]">{prontas}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[11px] block font-medium">Entregues</span>
          <span className="text-base font-bold text-emerald-700">{entregues}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[11px] block font-medium">Canceladas</span>
          <span className="text-base font-bold text-rose-600">{canceladas}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[11px] block font-medium">Valor Total</span>
          <span className="text-sm font-bold text-emerald-600">{formatarMoeda(valorTotalNaoCanceladas)}</span>
        </div>
      </div>

      {/* Tabela de O.S. no Documento */}
      <div>
        <h4 className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] mb-2 border-b border-zinc-200 pb-1">
          Relação de Ordens de Serviço ({ordensFiltradas.length})
        </h4>
        <table className="w-full text-left border border-zinc-200">
          <thead className="bg-zinc-100 text-zinc-600 font-semibold border-b border-zinc-200">
            <tr>
              <th className="p-2">Nº O.S.</th>
              <th className="p-2">Cliente</th>
              <th className="p-2">Entrada</th>
              <th className="p-2">Previsão Entrega</th>
              <th className="p-2 text-center">Status</th>
              <th className="p-2 text-right">Valor Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {ordensFiltradas.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-3 text-center text-zinc-400">Nenhuma Ordem de Serviço encontrada no período</td>
              </tr>
            ) : (
              ordensFiltradas.map((o) => (
                <tr key={o.id}>
                  <td className="p-2 font-bold text-[#7B2CF6]">{o.numeroOS}</td>
                  <td className="p-2 font-medium">{o.clienteNome}</td>
                  <td className="p-2">{o.dataEntrada}</td>
                  <td className="p-2">{o.dataEntrega}</td>
                  <td className="p-2 text-center font-semibold uppercase text-[10px]">{o.status.replace('_', ' ')}</td>
                  <td className="p-2 text-right font-bold text-zinc-900">{formatarMoeda(o.valorTotal)}</td>
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
            <Wrench className="w-5 h-5 text-[#7B2CF6]" />
            Relatório de Ordens de Serviço
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Acompanhamento de O.S. criadas, aprovadas, em produção, prontas, entregues e canceladas.
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
            onClick={() => onAbrirImpressao(<PrintableSheet />, 'Relatório de Ordens de Serviço')}
          >
            Imprimir / Gerar PDF
          </Button>
        </div>
      </div>

      {/* 7 Indicadores Solicitados: Criadas, Aprovadas, Em produção, Prontas, Entregues, Canceladas, Valor total */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card variant="elevated">
          <CardBody className="p-3">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Criadas</span>
            <p className="text-xl font-black text-white mt-1">{criadas}</p>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Total no período</span>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-3">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Aprovadas</span>
            <p className="text-xl font-black text-emerald-400 mt-1">{aprovadas}</p>
            <span className="text-[10px] text-emerald-500/70 block mt-0.5">Aguardando início</span>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-3">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Em Produção</span>
            <p className="text-xl font-black text-[#FFA633] mt-1">{emProducao}</p>
            <span className="text-[10px] text-amber-500/70 block mt-0.5">Na bancada / máquina</span>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-3">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Prontas</span>
            <p className="text-xl font-black text-[#9353FF] mt-1">{prontas}</p>
            <span className="text-[10px] text-purple-400/70 block mt-0.5">Aguardando retirada</span>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-3">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Entregues</span>
            <p className="text-xl font-black text-emerald-400 mt-1">{entregues}</p>
            <span className="text-[10px] text-emerald-500/70 block mt-0.5">Finalizadas com sucesso</span>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-3">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Canceladas</span>
            <p className="text-xl font-black text-rose-400 mt-1">{canceladas}</p>
            <span className="text-[10px] text-rose-500/70 block mt-0.5">Canceladas / Recusadas</span>
          </CardBody>
        </Card>

        <Card variant="elevated" className="col-span-2 sm:col-span-1 lg:col-span-1">
          <CardBody className="p-3">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Valor Total</span>
            <p className="text-lg font-black text-emerald-400 mt-1">{formatarMoeda(valorTotalNaoCanceladas)}</p>
            <span className="text-[10px] text-zinc-500 block mt-0.5">O.S. ativas</span>
          </CardBody>
        </Card>
      </div>

      {/* Tabela de O.S. */}
      <Card variant="elevated">
        <CardHeader
          title="Relação de Ordens de Serviço do Período"
          action={<span className="text-xs text-zinc-400">{ordensFiltradas.length} ordens</span>}
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#14141D] text-zinc-400 border-b border-[#232332]">
                <tr>
                  <th className="p-3">Nº O.S.</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3">Data Entrada</th>
                  <th className="p-3">Data Entrega</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20202E]">
                {ordensFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-zinc-500">
                      Nenhuma Ordem de Serviço cadastrada no período selecionado.
                    </td>
                  </tr>
                ) : (
                  ordensFiltradas.map((os) => (
                    <tr key={os.id} className="hover:bg-[#181824] transition-colors">
                      <td className="p-3 font-bold text-[#9353FF]">{os.numeroOS}</td>
                      <td className="p-3 font-semibold text-zinc-100">{os.clienteNome}</td>
                      <td className="p-3 text-zinc-400">{os.clienteTelefone || '-'}</td>
                      <td className="p-3 text-zinc-300">{os.dataEntrada}</td>
                      <td className="p-3 text-zinc-300">{os.dataEntrega}</td>
                      <td className="p-3 text-center">
                        {getStatusBadge(os.status)}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        {formatarMoeda(os.valorTotal)}
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
