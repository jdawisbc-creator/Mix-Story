import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, Column } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { VendaService } from '../services/vendaService';
import { CaixaService } from '../services/caixaService';
import { NovaVendaModal } from '../components/vendas/NovaVendaModal';
import { VendaDetalhesModal } from '../components/vendas/VendaDetalhesModal';
import { CancelarVendaModal } from '../components/vendas/CancelarVendaModal';
import type { Venda } from '../types';
import {
  ShoppingCart,
  Plus,
  Filter,
  QrCode,
  CreditCard,
  Banknote,
  Send,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  RotateCcw,
  TrendingUp,
  Receipt,
} from 'lucide-react';

export const VendasPage: React.FC = () => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'concluida' | 'cancelada'>('todas');
  const [filtroForma, setFiltroForma] = useState<string>('todas');

  // Modais
  const [isNovaVendaOpen, setIsNovaVendaOpen] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
  const [vendaParaCancelar, setVendaParaCancelar] = useState<Venda | null>(null);

  const carregarVendas = async () => {
    try {
      setLoading(true);
      const lista = await VendaService.getVendas();
      setVendas(lista);
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarVendas();
  }, []);

  // Filtros aplicados
  const vendasFiltradas = vendas.filter((v) => {
    const matchStatus = filtroStatus === 'todas' || v.status === filtroStatus;
    const matchForma = filtroForma === 'todas' || v.formaPagamento === filtroForma;
    const matchBusca =
      busca.trim() === '' ||
      String(v.numero).includes(busca) ||
      (v.clienteNome && v.clienteNome.toLowerCase().includes(busca.toLowerCase())) ||
      (v.usuario && v.usuario.toLowerCase().includes(busca.toLowerCase())) ||
      v.itens.some((i) => i.nome.toLowerCase().includes(busca.toLowerCase()));

    return matchStatus && matchForma && matchBusca;
  });

  // Métricas do dia
  const vendasConcluidas = vendas.filter((v) => v.status === 'concluida');
  const faturamentoTotal = vendasConcluidas.reduce((acc, v) => acc + v.total, 0);
  const totalCanceladas = vendas.filter((v) => v.status === 'cancelada').length;
  const ticketMedio =
    vendasConcluidas.length > 0 ? faturamentoTotal / vendasConcluidas.length : 0;

  const getPagamentoBadge = (forma: string) => {
    switch (forma) {
      case 'pix':
        return { label: 'PIX', icon: QrCode, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'dinheiro':
        return { label: 'Dinheiro', icon: Banknote, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'cartao_credito':
        return { label: 'Crédito', icon: CreditCard, color: 'text-[#A76BFF] bg-[#7B2CF6]/15 border-[#7B2CF6]/30' };
      case 'cartao_debito':
        return { label: 'Débito', icon: CreditCard, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
      case 'transferencia':
        return { label: 'Transf.', icon: Send, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
      case 'misto':
        return { label: 'Misto', icon: Layers, color: 'text-purple-300 bg-purple-500/10 border-purple-500/20' };
      default:
        return { label: 'Outros', icon: Layers, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' };
    }
  };

  const columns: Column<Venda>[] = [
    {
      header: 'Venda #',
      cell: (row) => (
        <span className="font-mono font-black text-white text-sm">
          #{row.numero}
        </span>
      ),
    },
    {
      header: 'Data / Horário',
      cell: (row) => (
        <div className="text-xs font-mono">
          <span className="text-zinc-200 block">
            {row.data || new Date(row.dataHora).toLocaleDateString('pt-BR')}
          </span>
          <span className="text-zinc-500 text-[11px]">
            {row.horario || new Date(row.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      header: 'Operador',
      cell: (row) => (
        <div className="text-xs">
          <span className="font-medium text-[#FF8A00] block">
            {row.usuario || row.vendedorNome || 'Jhonatan'}
          </span>
          <span className="text-[10px] text-zinc-500 truncate max-w-[120px] block">
            {row.clienteNome || 'Consumidor Final'}
          </span>
        </div>
      ),
    },
    {
      header: 'Itens Vendidos',
      cell: (row) => (
        <div className="text-xs">
          <div className="font-medium text-zinc-200 truncate max-w-[200px]" title={row.itens.map(i => `${i.quantidade}x ${i.nome}`).join(', ')}>
            {row.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(', ')}
          </div>
          <span className="text-[10px] text-zinc-500">
            {row.itens.length} {row.itens.length === 1 ? 'item' : 'itens'} no total
          </span>
        </div>
      ),
    },
    {
      header: 'Forma Pagamento',
      cell: (row) => {
        const pag = getPagamentoBadge(row.formaPagamento);
        const Icon = pag.icon;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${pag.color}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {pag.label}
          </span>
        );
      },
    },
    {
      header: 'Total',
      align: 'right',
      cell: (row) => (
        <div className="text-right">
          <span
            className={`font-mono font-bold text-sm ${
              row.status === 'cancelada' ? 'line-through text-zinc-500' : 'text-emerald-400'
            }`}
          >
            R$ {row.total.toFixed(2)}
          </span>
          {row.descontoTotal > 0 && (
            <span className="block text-[10px] text-rose-400 font-mono">
              Desc: -R$ {row.descontoTotal.toFixed(2)}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Situação',
      cell: (row) => {
        if (row.status === 'cancelada') {
          return (
            <Badge variant="danger" size="sm" icon={<XCircle className="w-3 h-3" />}>
              CANCELADA
            </Badge>
          );
        }
        return (
          <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
            CONCLUÍDA
          </Badge>
        );
      },
    },
    {
      header: 'Ações',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setVendaSelecionada(row)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Ver Cupom / Detalhes"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status !== 'cancelada' && (
            <button
              onClick={() => setVendaParaCancelar(row)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Cancelar Venda"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="MÓDULO DE VENDAS & PDV"
        description="Frente de caixa integrada em tempo real com estoque de produtos, serviços avulsos, auditoria por usuário e controle de troco."
        actions={
          <Button
            variant="accent"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNovaVendaOpen(true)}
            className="font-bold shadow-lg shadow-[#FF8A00]/25"
          >
            + Nova Venda (PDV)
          </Button>
        }
      />

      {/* Cards de Desempenho */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Vendas Concluídas
              </p>
              <p className="text-2xl font-black text-white font-mono mt-1">
                {vendasConcluidas.length}
              </p>
              <span className="text-[11px] text-emerald-400 mt-0.5 block">
                {totalCanceladas > 0 ? `${totalCanceladas} cancelada(s)` : 'Sem cancelamentos'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Faturamento Total
              </p>
              <p className="text-2xl font-black text-[#FF8A00] font-mono mt-1">
                R$ {faturamentoTotal.toFixed(2)}
              </p>
              <span className="text-[11px] text-zinc-500 mt-0.5 block">
                Vendas ativas e integradas
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FF8A00]/10 border border-[#FF8A00]/20 flex items-center justify-center text-[#FF8A00]">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Ticket Médio
              </p>
              <p className="text-2xl font-black text-white font-mono mt-1">
                R$ {ticketMedio.toFixed(2)}
              </p>
              <span className="text-[11px] text-zinc-500 mt-0.5 block">
                Por transação concluída
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#7B2CF6]/15 border border-[#7B2CF6]/30 flex items-center justify-center text-[#A76BFF]">
              <Receipt className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Estoque & Serviços
              </p>
              <p className="text-lg font-bold text-white mt-1">
                Baixa Automática
              </p>
              <span className="text-[11px] text-zinc-500 mt-0.5 block">
                Serviços isentos de baixa
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card>
        <CardBody className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por número, cliente, operador, produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#0E0E17] border border-[#27273A] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF8A00]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filtro Situação */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as any)}
              className="bg-[#0E0E17] border border-[#27273A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas as Situações</option>
              <option value="concluida">Somente Concluídas</option>
              <option value="cancelada">Somente Canceladas</option>
            </select>

            {/* Filtro Pagamento */}
            <select
              value={filtroForma}
              onChange={(e) => setFiltroForma(e.target.value)}
              className="bg-[#0E0E17] border border-[#27273A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas as Formas</option>
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao_debito">Cartão Débito</option>
              <option value="cartao_credito">Cartão Crédito</option>
              <option value="transferencia">Transferência</option>
              <option value="outros">Outros</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Histórico Completo de Vendas */}
      <Card>
        <CardHeader
          title="Histórico de Vendas Registradas"
          action={
            <span className="text-xs text-zinc-400 font-mono">
              {vendasFiltradas.length} vendas exibidas
            </span>
          }
        />
        <Table
          columns={columns}
          data={vendasFiltradas}
          keyExtractor={(v) => v.id}
          emptyMessage="Nenhuma venda encontrada com os filtros selecionados."
        />
      </Card>

      {/* Modal Nova Venda (PDV) */}
      <NovaVendaModal
        isOpen={isNovaVendaOpen}
        onClose={() => setIsNovaVendaOpen(false)}
        onVendaConcluida={carregarVendas}
      />

      {/* Modal Detalhes / Comprovante da Venda */}
      <VendaDetalhesModal
        isOpen={!!vendaSelecionada}
        onClose={() => setVendaSelecionada(null)}
        venda={vendaSelecionada}
        onSolicitarCancelamento={(v) => {
          setVendaSelecionada(null);
          setVendaParaCancelar(v);
        }}
      />

      {/* Modal Cancelamento de Venda */}
      <CancelarVendaModal
        isOpen={!!vendaParaCancelar}
        onClose={() => setVendaParaCancelar(null)}
        venda={vendaParaCancelar}
        onVendaCancelada={carregarVendas}
      />
    </div>
  );
};
