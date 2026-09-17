import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { GastoService } from '../services/gastoService';
import { UserService } from '../services/userService';
import { NovaSaidaModal } from '../components/gastos/NovaSaidaModal';
import { SaidaDetalhesModal } from '../components/gastos/SaidaDetalhesModal';
import type { SaidaGasto, TipoSaida, User } from '../types';
import {
  Plus,
  Building2,
  PackagePlus,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Search,
  Filter,
  Calendar,
  Layers,
  Eye,
  Trash2,
  CheckCircle2,
  Sparkles,
  QrCode,
  CreditCard,
  Banknote,
  Send,
} from 'lucide-react';

export const GastosPage: React.FC = () => {
  const [saidas, setSaidas] = useState<SaidaGasto[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'personalizado'>('mes');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'despesa' | 'compra_revenda'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroUsuario, setFiltroUsuario] = useState<string>('todos');
  const [busca, setBusca] = useState('');

  // Modais
  const [isNovaSaidaOpen, setIsNovaSaidaOpen] = useState(false);
  const [tipoModalInicial, setTipoModalInicial] = useState<TipoSaida>('despesa');
  const [saidaSelecionada, setSaidaSelecionada] = useState<SaidaGasto | null>(null);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [listaSaidas, listaUsers] = await Promise.all([
        GastoService.getSaidas(),
        UserService.getUsers(),
      ]);
      setSaidas(listaSaidas);
      setUsuarios(listaUsers);
    } catch (err) {
      console.error('Erro ao carregar dados de saídas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Lógica de Período
  const agora = new Date();
  const hojeStr = agora.toISOString().split('T')[0];

  const getInicioSemana = () => {
    const d = new Date(agora);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  const getInicioMes = () => {
    const y = agora.getFullYear();
    const m = String(agora.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  };

  // Filtragem dos dados
  const saidasFiltradas = saidas.filter((s) => {
    // 1. Filtro Tipo
    if (filtroTipo !== 'todos' && s.tipo !== filtroTipo) {
      return false;
    }

    // 2. Filtro Categoria
    if (filtroCategoria !== 'todas' && s.categoria !== filtroCategoria) {
      return false;
    }

    // 3. Filtro Usuário
    if (filtroUsuario !== 'todos' && s.usuarioNome !== filtroUsuario && s.usuarioId !== filtroUsuario) {
      return false;
    }

    // 4. Filtro Período
    if (filtroPeriodo === 'hoje') {
      if (s.data !== hojeStr) return false;
    } else if (filtroPeriodo === 'semana') {
      const inicioSemana = getInicioSemana();
      if (s.data < inicioSemana || s.data > hojeStr) return false;
    } else if (filtroPeriodo === 'mes') {
      const inicioMes = getInicioMes();
      if (s.data < inicioMes) return false;
    } else if (filtroPeriodo === 'personalizado') {
      if (dataInicio && s.data < dataInicio) return false;
      if (dataFim && s.data > dataFim) return false;
    }

    // 5. Busca textual
    if (busca.trim() !== '') {
      const termo = busca.toLowerCase();
      const matchDescricao = s.descricao.toLowerCase().includes(termo);
      const matchProduto = s.produtoNome && s.produtoNome.toLowerCase().includes(termo);
      const matchFornecedor = s.fornecedorOuFavorecido && s.fornecedorOuFavorecido.toLowerCase().includes(termo);
      const matchObs = s.observacao && s.observacao.toLowerCase().includes(termo);
      const matchUser = s.usuarioNome.toLowerCase().includes(termo);
      if (!matchDescricao && !matchProduto && !matchFornecedor && !matchObs && !matchUser) {
        return false;
      }
    }

    return true;
  });

  // Categorias únicas para o select
  const categoriasDisponiveis = Array.from(new Set(saidas.map((s) => s.categoria))).filter(Boolean);

  // Cálculos Financeiros com Separação Rigorosa
  const totalDespesas = saidasFiltradas
    .filter((s) => s.tipo === 'despesa')
    .reduce((acc, s) => acc + s.valor, 0);

  const totalComprasRevenda = saidasFiltradas
    .filter((s) => s.tipo === 'compra_revenda')
    .reduce((acc, s) => acc + s.valor, 0);

  const receitaPotencialTotal = saidasFiltradas
    .filter((s) => s.tipo === 'compra_revenda')
    .reduce((acc, s) => acc + (s.receitaPotencial || 0), 0);

  const lucroProjetadoTotal = saidasFiltradas
    .filter((s) => s.tipo === 'compra_revenda')
    .reduce((acc, s) => acc + (s.lucroProjetado || 0), 0);

  const totalGeralSaidas = totalDespesas + totalComprasRevenda;

  const columns: Column<SaidaGasto>[] = [
    {
      header: 'Data',
      cell: (row) => (
        <span className="font-mono text-xs text-zinc-300">
          {new Date(row.data + 'T12:00:00Z').toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      header: 'Tipo de Saída',
      cell: (row) => {
        if (row.tipo === 'compra_revenda') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#7B2CF6]/20 text-purple-200 border border-[#7B2CF6]/40">
              <PackagePlus className="w-3.5 h-3.5 text-purple-400" />
              Compra p/ Revenda
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <Building2 className="w-3.5 h-3.5 text-rose-400" />
            Despesa Operacional
          </span>
        );
      },
    },
    {
      header: 'Descrição / Detalhes',
      cell: (row) => (
        <div>
          <p className="font-bold text-white text-xs">{row.descricao}</p>
          {row.tipo === 'compra_revenda' ? (
            <p className="text-[11px] text-purple-300 font-mono">
              + {row.quantidade} un. no estoque • Potencial: R$ {row.receitaPotencial?.toFixed(2)}
            </p>
          ) : (
            row.fornecedorOuFavorecido && (
              <p className="text-[11px] text-zinc-400">Favorecido: {row.fornecedorOuFavorecido}</p>
            )
          )}
        </div>
      ),
    },
    {
      header: 'Categoria',
      cell: (row) => (
        <Badge variant="neutral" size="sm">
          {row.categoria}
        </Badge>
      ),
    },
    {
      header: 'Pagamento',
      cell: (row) => (
        <span className="font-mono text-xs uppercase text-zinc-400">
          {row.formaPagamento}
        </span>
      ),
    },
    {
      header: 'Usuário',
      cell: (row) => (
        <span className="text-xs font-semibold text-[#FF8A00]">
          {row.usuarioNome}
        </span>
      ),
    },
    {
      header: 'Valor',
      align: 'right',
      cell: (row) => (
        <div className="text-right">
          <span
            className={`font-mono font-bold text-sm ${
              row.tipo === 'compra_revenda' ? 'text-purple-300' : 'text-rose-400'
            }`}
          >
            - R$ {row.valor.toFixed(2)}
          </span>
          {row.tipo === 'compra_revenda' && row.lucroProjetado && row.lucroProjetado > 0 && (
            <span className="block text-[10px] text-emerald-400 font-mono">
              Lucro prev: +R$ {row.lucroProjetado.toFixed(2)}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Ações',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setSaidaSelecionada(row)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Ver Detalhes / Comprovante"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="SAÍDAS & GASTOS"
        description="Separação rigorosa entre Despesas Operacionais (gasto real da loja) e Compra para Revenda (investimento financeiro com entrada automática no estoque)."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              icon={<Building2 className="w-4 h-4 text-rose-400" />}
              onClick={() => {
                setTipoModalInicial('despesa');
                setIsNovaSaidaOpen(true);
              }}
              className="text-xs"
            >
              + Despesa Operacional
            </Button>
            <Button
              variant="accent"
              icon={<PackagePlus className="w-4 h-4" />}
              onClick={() => {
                setTipoModalInicial('compra_revenda');
                setIsNovaSaidaOpen(true);
              }}
              className="text-xs font-bold shadow-lg shadow-[#FF8A00]/20"
            >
              + Compra p/ Revenda (Estoque)
            </Button>
          </div>
        }
      />

      {/* CARDS COM SEPARAÇÃO ESTRITA DE DINHEIRO GASTO VS COMPRA DE ESTOQUE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Despesas Operacionais (Gasto Real) */}
        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                Despesas Operacionais
              </p>
              <p className="text-2xl font-black text-rose-400 font-mono mt-1">
                R$ {totalDespesas.toFixed(2)}
              </p>
              <span className="text-[11px] text-zinc-400 mt-0.5 block">
                Dinheiro realmente gasto (consumo)
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Building2 className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        {/* Card 2: Compra para Revenda (Investimento) */}
        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                Compra para Revenda
              </p>
              <p className="text-2xl font-black text-purple-300 font-mono mt-1">
                R$ {totalComprasRevenda.toFixed(2)}
              </p>
              <span className="text-[11px] text-emerald-400 mt-0.5 block">
                Virou mercadoria no estoque
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#7B2CF6]/20 border border-[#7B2CF6]/40 flex items-center justify-center text-[#A76BFF]">
              <PackagePlus className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        {/* Card 3: Receita Potencial das Compras */}
        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Receita Potencial
              </p>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
                R$ {receitaPotencialTotal.toFixed(2)}
              </p>
              <span className="text-[11px] text-[#FF8A00] font-semibold mt-0.5 block">
                Lucro estimado: +R$ {lucroProjetadoTotal.toFixed(2)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        {/* Card 4: Total de Saídas Financeiras */}
        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Total Saídas Financeiras
              </p>
              <p className="text-2xl font-black text-white font-mono mt-1">
                R$ {totalGeralSaidas.toFixed(2)}
              </p>
              <span className="text-[11px] text-zinc-500 mt-0.5 block">
                Despesas + Compras de Estoque
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
              <DollarSign className="w-6 h-6 text-zinc-400" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* BARRA DE FILTROS COMPLETOS: HOJE, SEMANA, MÊS, PERSONALIZADO, CATEGORIA, TIPO, USUÁRIO */}
      <Card>
        <CardBody className="p-4 space-y-3">
          {/* Linha 1: Período e Tipo */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Seletor de Período (Hoje, Semana, Mês, Personalizado) */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0E0E17] border border-[#27273A]">
              <button
                type="button"
                onClick={() => setFiltroPeriodo('hoje')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filtroPeriodo === 'hoje'
                    ? 'bg-[#FF8A00] text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setFiltroPeriodo('semana')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filtroPeriodo === 'semana'
                    ? 'bg-[#FF8A00] text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Esta Semana
              </button>
              <button
                type="button"
                onClick={() => setFiltroPeriodo('mes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filtroPeriodo === 'mes'
                    ? 'bg-[#FF8A00] text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Este Mês
              </button>
              <button
                type="button"
                onClick={() => setFiltroPeriodo('personalizado')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filtroPeriodo === 'personalizado'
                    ? 'bg-[#FF8A00] text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Personalizado
              </button>
            </div>

            {/* Seletor de Tipo (Todos, Despesas, Compra para Revenda) */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0E0E17] border border-[#27273A]">
              <button
                type="button"
                onClick={() => setFiltroTipo('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filtroTipo === 'todos'
                    ? 'bg-white/15 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todos os Tipos
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('despesa')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filtroTipo === 'despesa'
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Despesas (Gasto Real)
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('compra_revenda')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filtroTipo === 'compra_revenda'
                    ? 'bg-[#7B2CF6]/30 text-purple-200 border border-[#7B2CF6]/50'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Compra p/ Revenda (Estoque)
              </button>
            </div>
          </div>

          {/* Se Período Personalizado: exibe inputs de data */}
          {filtroPeriodo === 'personalizado' && (
            <div className="p-3 rounded-xl bg-[#0E0E17] border border-[#27273A] flex flex-wrap items-center gap-3 text-xs">
              <span className="text-zinc-400 font-semibold">Intervalo de Datas:</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-xs">De:</span>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="bg-[#141420] border border-[#2B2B3E] rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-xs">Até:</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="bg-[#141420] border border-[#2B2B3E] rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* Linha 2: Busca Textual, Filtro de Categoria e Filtro de Usuário */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por descrição, produto, fornecedor ou observação..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-[#0E0E17] border border-[#27273A] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF8A00]"
              />
            </div>

            {/* Categoria */}
            <div>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full bg-[#0E0E17] border border-[#27273A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="todas">Todas as Categorias</option>
                {categoriasDisponiveis.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Usuário Responsável */}
            <div>
              <select
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
                className="w-full bg-[#0E0E17] border border-[#27273A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos os Usuários</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* TABELA DE SAÍDAS */}
      <Card>
        <CardHeader
          title="Extrato de Saídas Financeiras"
          subtitle="Histórico auditado com controle de estoque e fornecedores"
          action={
            <span className="text-xs text-zinc-400 font-mono">
              {saidasFiltradas.length} registro(s) exibido(s)
            </span>
          }
        />
        <Table
          columns={columns}
          data={saidasFiltradas}
          keyExtractor={(s) => s.id}
          emptyMessage="Nenhuma saída encontrada com os filtros selecionados."
        />
      </Card>

      {/* MODAL DE NOVA SAÍDA (TIPO 1 OU TIPO 2) */}
      <NovaSaidaModal
        isOpen={isNovaSaidaOpen}
        onClose={() => setIsNovaSaidaOpen(false)}
        onSaidaRegistrada={carregarDados}
        tipoInicial={tipoModalInicial}
      />

      {/* MODAL DE DETALHES E COMPROVANTE */}
      <SaidaDetalhesModal
        isOpen={!!saidaSelecionada}
        onClose={() => setSaidaSelecionada(null)}
        saida={saidaSelecionada}
        onSaidaExcluida={carregarDados}
      />
    </div>
  );
};
