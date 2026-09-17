import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { CaixaService } from '../services/caixaService';
import type { Caixa } from '../types';
import { Calendar, Download, Eye, FileText, Filter } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const CaixaHistoricoPage: React.FC = () => {
  const { info } = useToast();
  const [caixas, setCaixas] = useState<Caixa[]>([]);

  useEffect(() => {
    const carregar = async () => {
      const data = await CaixaService.getHistoricoCaixas();
      setCaixas(data);
    };
    carregar();
  }, []);

  const columns: Column<Caixa>[] = [
    {
      header: 'Data do Caixa',
      accessorKey: 'data',
      cell: (row) => (
        <span className="font-semibold text-white">
          {new Date(row.data + 'T12:00:00Z').toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      header: 'Operador Responsável',
      accessorKey: 'operadorNome',
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'aberto' ? 'success' : 'neutral'} size="sm" dot>
          {row.status === 'aberto' ? 'Turno Aberto' : 'Fechado e Conferido'}
        </Badge>
      ),
    },
    {
      header: 'Saldo Inicial',
      cell: (row) => <span className="font-mono text-zinc-400">R$ {row.saldoInicial.toFixed(2)}</span>,
    },
    {
      header: 'Total Entradas',
      cell: (row) => <span className="font-mono text-emerald-400 font-bold">+ R$ {row.totalEntradas.toFixed(2)}</span>,
    },
    {
      header: 'Saldo Fechamento',
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-bold text-[#FF8A00]">
          R$ {row.saldoFinalCalculado.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Ações',
      align: 'right',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<Eye className="w-3.5 h-3.5" />}
          onClick={() => info('Visualização de Caixa', `Detalhes do caixa de ${row.data} serão exibidos na etapa do módulo de Caixa.`)}
        >
          Detalhes
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="HISTÓRICO DE CAIXAS"
        description="Consulte todos os turnos anteriores, relatórios de fechamento e divergências de caixa."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Filter className="w-4 h-4" />}
              onClick={() => info('Filtro por Período', 'Seleção de data inicial e final.')}
            >
              Filtrar Período
            </Button>
            <Button
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
              onClick={() => info('Exportar', 'Exportação de livro caixa em Excel / PDF disponível na próxima etapa.')}
            >
              Exportar Livro Caixa
            </Button>
          </>
        }
      />

      <Table
        columns={columns}
        data={caixas}
        keyExtractor={(c) => c.id}
        emptyMessage="Nenhum fechamento de caixa registrado no período selecionado."
      />
    </div>
  );
};
