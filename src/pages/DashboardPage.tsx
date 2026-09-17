import React, { useState, useEffect } from 'react';
import type { RouteId, LogAuditoria, Caixa } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { MixLogo } from '../components/brand/MixLogo';
import { DashboardCharts } from '../components/dashboard/DashboardCharts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuditService } from '../services/auditService';
import { CaixaService } from '../services/caixaService';
import {
  Wallet,
  ShoppingCart,
  ArrowDownCircle,
  ArrowUpCircle,
  Wrench,
  Tag,
  Package,
  Clock,
  CheckCircle2,
  Calendar,
  Share2,
  Lock,
  Unlock,
  ChevronRight,
  Eye,
  Instagram,
  Sparkles,
  ExternalLink,
  Layers,
  ShoppingBag,
} from 'lucide-react';

interface DashboardPageProps {
  onRouteChange: (route: RouteId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onRouteChange }) => {
  const { user } = useAuth();
  const { success } = useToast();

  // Estado do Caixa
  const [caixaStatus, setCaixaStatus] = useState<'aberto' | 'fechado'>('aberto');
  const [trocoInicial, setTrocoInicial] = useState<number>(250.0);
  const [totalVendido, setTotalVendido] = useState<number>(1845.5);
  const [totalEntradas, setTotalEntradas] = useState<number>(2095.5);
  const [totalSaidas, setTotalSaidas] = useState<number>(120.0);
  const [saldoAtual, setSaldoAtual] = useState<number>(1975.5);

  // Modal para Abrir Caixa rápido caso esteja fechado
  const [isAbrirCaixaModalOpen, setIsAbrirCaixaModalOpen] = useState(false);
  const [inputTroco, setInputTroco] = useState('250.00');

  // Logs de Auditoria para "ATIVIDADES RECENTES"
  const [recentLogs, setRecentLogs] = useState<LogAuditoria[]>([]);

  // Carregar dados reais do caixa e da auditoria
  const carregarDados = async () => {
    try {
      const caixa = await CaixaService.getCaixaHoje();
      if (caixa) {
        setCaixaStatus(caixa.status);
        setTrocoInicial(caixa.saldoInicial);
        setTotalVendido(caixa.totalEntradas - caixa.saldoInicial > 0 ? caixa.totalEntradas - caixa.saldoInicial : 1845.5);
        setTotalEntradas(caixa.totalEntradas);
        setTotalSaidas(caixa.totalSaidas);
        setSaldoAtual(caixa.saldoFinalCalculado);
      }
    } catch {
      // Usar defaults
    }

    try {
      const logs = await AuditService.getLogs();
      setRecentLogs(logs.slice(0, 7));
    } catch {
      // Usar defaults
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Handler para Abrir Caixa
  const handleConfirmarAberturaCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorTroco = Number(inputTroco) || 250;

    const caixaAtualizado: Caixa = {
      id: `caixa_${new Date().toISOString().split('T')[0]}`,
      data: new Date().toISOString().split('T')[0],
      status: 'aberto',
      saldoInicial: valorTroco,
      totalEntradas: valorTroco + totalVendido,
      totalSaidas: totalSaidas,
      saldoFinalCalculado: valorTroco + totalVendido - totalSaidas,
      operadorId: user?.id || 'usr_01',
      operadorNome: user?.name || 'Jhonatan',
      abertoEm: new Date().toISOString(),
      observacoes: 'Abertura rápida efetuada via Dashboard principal.',
    };

    await CaixaService.salvarCaixa(caixaAtualizado);
    setCaixaStatus('aberto');
    setTrocoInicial(valorTroco);
    setTotalEntradas(caixaAtualizado.totalEntradas);
    setSaldoAtual(caixaAtualizado.saldoFinalCalculado);

    // Auditoria Obrigatória
    if (user) {
      await AuditService.registrar({
        usuario: user.name,
        usuarioId: user.id,
        modulo: 'Caixa',
        tipoAcao: 'Abertura',
        registroAfetado: 'Caixa do Dia',
        informacaoAnterior: 'Caixa Fechado',
        informacaoNova: `Aberto com Troco Inicial de R$ ${valorTroco.toFixed(2)}`,
        descricao: `Abertura de caixa realizada pelo operador ${user.name} via Dashboard.`,
      });
    }

    success('Caixa Aberto!', `Turno iniciado com troco inicial de R$ ${valorTroco.toFixed(2)}.`);
    setIsAbrirCaixaModalOpen(false);
    carregarDados();
  };

  // Alternador de estado para demonstração rápida do Caixa (ABERTO <-> FECHADO)
  const handleToggleCaixaState = async () => {
    if (caixaStatus === 'aberto') {
      const fechado: Caixa = {
        id: `caixa_${new Date().toISOString().split('T')[0]}`,
        data: new Date().toISOString().split('T')[0],
        status: 'fechado',
        saldoInicial: trocoInicial,
        totalEntradas,
        totalSaidas,
        saldoFinalCalculado: saldoAtual,
        operadorId: user?.id || 'usr_01',
        operadorNome: user?.name || 'Jhonatan',
        abertoEm: new Date().toISOString(),
        fechadoEm: new Date().toISOString(),
      };
      await CaixaService.salvarCaixa(fechado);
      setCaixaStatus('fechado');
      success('Caixa Fechado', 'Status alternado para fechado.');
    } else {
      setIsAbrirCaixaModalOpen(true);
    }
  };

  // Formatar texto de resumo de atividade recente exatamente como no exemplo:
  // "21:04 — Jhonatan alterou OS #0045"
  const formatarLinhaAtividade = (log: LogAuditoria) => {
    const horario = log.horario || '12:00';
    const usuario = log.usuario || 'Operador';
    
    // Simplificar ação para visualização rápida no card
    let acaoSimplificada = log.descricao;
    if (log.modulo === 'Ordens de Serviço') {
      acaoSimplificada = `atualizou ${log.registroAfetado.split('—')[0].trim()}`;
    } else if (log.modulo === 'Vendas' || (log.modulo === 'Caixa' && log.tipoAcao === 'Entrada')) {
      acaoSimplificada = 'registrou uma venda';
    } else if (log.modulo === 'Estoque' && (log.tipoAcao === 'Criação' || log.tipoAcao === 'Entrada de Estoque')) {
      acaoSimplificada = `adicionou "${log.registroAfetado}" ao estoque`;
    } else if (log.modulo === 'Estoque' && log.tipoAcao === 'Alteração de Preço') {
      acaoSimplificada = `ajustou preço de "${log.registroAfetado}"`;
    } else if (log.modulo === 'Caixa' && log.tipoAcao === 'Abertura') {
      acaoSimplificada = 'abriu o caixa da loja';
    } else if (log.modulo === 'Gastos') {
      acaoSimplificada = `lançou despesa (${log.registroAfetado})`;
    } else if (log.modulo === 'Promoções') {
      acaoSimplificada = `atualizou promoção "${log.registroAfetado}"`;
    } else if (log.modulo === 'Postagens') {
      acaoSimplificada = `agendou postagem: ${log.registroAfetado}`;
    }

    return (
      <span className="text-zinc-200">
        <strong className="font-mono text-[#FF8A00] font-semibold">{horario}</strong>
        <span className="text-zinc-500 mx-1.5">—</span>
        <strong className="text-white font-medium">{usuario}</strong>
        <span className="text-zinc-300 ml-1">{acaoSimplificada}</span>
      </span>
    );
  };

  // Dados das Últimas Ordens de Serviço
  const ultimasOrdens = [
    {
      id: 'os_108',
      numeroOS: '108',
      cliente: 'Mariana Silveira',
      aparelho: 'Moto G54 5G',
      valor: 150.0,
      status: 'Pronta',
      badgeVariant: 'success' as const,
    },
    {
      id: 'os_107',
      numeroOS: '107',
      cliente: 'Carlos Eduardo Ramos',
      aparelho: 'Caixa de Som JBL Flip 6',
      valor: 190.0,
      status: 'Em Produção',
      badgeVariant: 'purple' as const,
    },
    {
      id: 'os_106',
      numeroOS: '106',
      cliente: 'Fernanda Lima',
      aparelho: 'Tablet Samsung Tab A8',
      valor: 240.0,
      status: 'Em Produção',
      badgeVariant: 'purple' as const,
    },
    {
      id: 'os_105',
      numeroOS: '105',
      cliente: 'Ricardo Mendonça',
      aparelho: 'Controle PS5 DualSense',
      valor: 85.0,
      status: 'Aguardando Aprovação',
      badgeVariant: 'warning' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL COM IDENTIDADE MIX GESTÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[#1F1F2C]">
        <div>
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl sm:text-3xl font-black tracking-wider text-white"
              style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
            >
              DASHBOARD PRINCIPAL
            </h1>
            <Badge variant="purple" size="sm" dot>
              Ao Vivo
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Mix Variedades Store — Central de Operações da Loja
          </p>
        </div>

        {/* Atalhos Rápidos */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="accent"
            size="sm"
            icon={<ShoppingCart className="w-4 h-4" />}
            onClick={() => onRouteChange('vendas')}
          >
            Nova Venda (PDV)
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Wallet className="w-4 h-4" />}
            onClick={() => onRouteChange('caixa-hoje')}
          >
            Ir para o Caixa
          </Button>
        </div>
      </div>

      {/* ==================================================
          1. RESUMO DO DIA (6 CARDS SOLICITADOS)
          ================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2"
            style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
          >
            <span className="w-2 h-2 rounded-full bg-[#FF8A00]" />
            RESUMO DO DIA
          </h2>
          <span className="text-[11px] text-zinc-500 font-mono">
            Atualizado em tempo real
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Vendas de hoje */}
          <Card
            variant="interactive"
            className="p-4 flex flex-col justify-between"
            onClick={() => onRouteChange('vendas')}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Vendas de Hoje
                </span>
                <div className="p-1.5 rounded-lg bg-[#FF8A00]/15 text-[#FF8A00]">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
              </div>
              <p
                className="text-xl sm:text-2xl font-black text-white"
                style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
              >
                R$ {totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2 font-mono">28 transações</p>
          </Card>

          {/* 2. Entradas */}
          <Card
            variant="interactive"
            className="p-4 flex flex-col justify-between"
            onClick={() => onRouteChange('caixa-hoje')}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Entradas
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                  <ArrowUpCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <p
                className="text-xl sm:text-2xl font-black text-emerald-400"
                style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
              >
                R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2 font-mono">Vendas + Suprimentos</p>
          </Card>

          {/* 3. Saídas */}
          <Card
            variant="interactive"
            className="p-4 flex flex-col justify-between"
            onClick={() => onRouteChange('gastos')}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Saídas
                </span>
                <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400">
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <p
                className="text-xl sm:text-2xl font-black text-rose-400"
                style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
              >
                R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2 font-mono">Sangrias e Despesas</p>
          </Card>

          {/* 4. Saldo do dia */}
          <Card
            variant="interactive"
            className="p-4 flex flex-col justify-between border-[#7B2CF6]/40 bg-gradient-to-br from-[#191526] to-[#12121A]"
            onClick={() => onRouteChange('caixa-hoje')}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[#A76BFF] uppercase tracking-wider">
                  Saldo do Dia
                </span>
                <div className="p-1.5 rounded-lg bg-[#7B2CF6]/20 text-[#A76BFF]">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
              </div>
              <p
                className="text-xl sm:text-2xl font-black text-[#FF8A00]"
                style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
              >
                R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 font-mono">Em caixa agora</p>
          </Card>

          {/* 5. Ordens de Serviço abertas */}
          <Card
            variant="interactive"
            className="p-4 flex flex-col justify-between"
            onClick={() => onRouteChange('ordens-servico')}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  O.S. Abertas
                </span>
                <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
              </div>
              <p
                className="text-xl sm:text-2xl font-black text-white"
                style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
              >
                4
              </p>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2 font-mono">Na bancada técnica</p>
          </Card>

          {/* 6. Promoções ativas */}
          <Card
            variant="interactive"
            className="p-4 flex flex-col justify-between"
            onClick={() => onRouteChange('promocoes')}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Promoções
                </span>
                <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400">
                  <Tag className="w-3.5 h-3.5" />
                </div>
              </div>
              <p
                className="text-xl sm:text-2xl font-black text-white"
                style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
              >
                2
              </p>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2 font-mono">Ativas no PDV</p>
          </Card>
        </div>
      </div>

      {/* ==================================================
          2. CAIXA (DETALHE & BOTÃO ABRIR CAIXA)
          ================================================== */}
      <Card variant="elevated">
        <CardHeader
          title={
            <div className="flex items-center gap-2.5">
              <Wallet className="w-5 h-5 text-[#FF8A00]" />
              <span>SITUAÇÃO DO CAIXA</span>
              <Badge
                variant={caixaStatus === 'aberto' ? 'success' : 'danger'}
                size="md"
                dot
              >
                {caixaStatus === 'aberto' ? 'CAIXA ABERTO' : 'CAIXA FECHADO'}
              </Badge>
            </div>
          }
          subtitle="Visão instantânea do fluxo e valores em dinheiro e pagamentos eletrônicos"
          action={
            <div className="flex items-center gap-2">
              {caixaStatus === 'fechado' ? (
                /* BOTÃO DESTACADO: [ABRIR CAIXA] */
                <Button
                  variant="accent"
                  icon={<Unlock className="w-4 h-4" />}
                  onClick={() => setIsAbrirCaixaModalOpen(true)}
                  className="animate-pulse shadow-lg shadow-[#FF8A00]/30 font-bold"
                >
                  ABRIR CAIXA
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleCaixaState}
                    title="Alternar para status Fechado (para teste do botão)"
                  >
                    Simular Fechado
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                    onClick={() => onRouteChange('caixa-hoje')}
                  >
                    Gerenciar Caixa
                  </Button>
                </div>
              )}
            </div>
          }
        />
        <CardBody className="p-5 pt-1">
          {caixaStatus === 'fechado' ? (
            /* Alerta e Botão Destacado quando Caixa Fechado */
            <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-[#18121E] to-[#161622] border border-rose-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Lock className="w-5 h-5 text-rose-400" />
                  <h4 className="text-base font-bold text-white uppercase tracking-wider">
                    O Caixa ainda não foi aberto hoje
                  </h4>
                </div>
                <p className="text-xs text-zinc-300 max-w-lg">
                  Inicie o turno de atendimento informando o fundo de troco inicial para habilitar registros de vendas e operações.
                </p>
              </div>

              {/* Botão em Evidência Total */}
              <Button
                variant="accent"
                size="lg"
                icon={<Unlock className="w-5 h-5" />}
                onClick={() => setIsAbrirCaixaModalOpen(true)}
                className="px-8 py-3 text-sm font-black shadow-xl shadow-[#FF8A00]/40"
              >
                ABRIR CAIXA AGORA
              </Button>
            </div>
          ) : (
            /* Grid de Detalhes do Caixa Aberto */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-[#14141E] border border-[#222232]">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Troco Inicial
                </span>
                <p className="text-lg font-bold text-white font-mono mt-1">
                  R$ {trocoInicial.toFixed(2)}
                </p>
                <span className="text-[10px] text-zinc-500">Fundo de abertura</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#14141E] border border-[#222232]">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Total Vendido
                </span>
                <p className="text-lg font-bold text-emerald-400 font-mono mt-1">
                  R$ {totalVendido.toFixed(2)}
                </p>
                <span className="text-[10px] text-zinc-500">28 vendas concluídas</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#14141E] border border-[#222232]">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Entradas
                </span>
                <p className="text-lg font-bold text-emerald-400 font-mono mt-1">
                  R$ {totalEntradas.toFixed(2)}
                </p>
                <span className="text-[10px] text-zinc-500">Vendas + Troco</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#14141E] border border-[#222232]">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Saídas
                </span>
                <p className="text-lg font-bold text-rose-400 font-mono mt-1">
                  - R$ {totalSaidas.toFixed(2)}
                </p>
                <span className="text-[10px] text-zinc-500">Sangrias realizadas</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1A162B] border border-[#7B2CF6]/40 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-[#A76BFF] uppercase tracking-wider block">
                  Saldo Atual
                </span>
                <p className="text-xl font-black text-[#FF8A00] font-mono mt-1">
                  R$ {saldoAtual.toFixed(2)}
                </p>
                <span className="text-[10px] text-zinc-400">Total físico + digital</span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ==================================================
          GRÁFICOS: VENDAS 7 DIAS + ENTRADAS X SAÍDAS
          ================================================== */}
      <DashboardCharts />

      {/* ==================================================
          3. ORDENS DE SERVIÇO (RESUMO + ÚLTIMAS CRIADAS)
          ================================================== */}
      <Card variant="elevated">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-cyan-400" />
              <span>ORDENS DE SERVIÇO</span>
            </div>
          }
          subtitle="Situação das assistências técnicas e consertos na bancada"
          action={
            <button
              onClick={() => onRouteChange('ordens-servico')}
              className="text-xs text-[#FF8A00] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Ver Todas <ChevronRight className="w-3.5 h-3.5" />
            </button>
          }
        />
        <CardBody className="p-5 pt-0 space-y-4">
          {/* Resumo de Status Solicitado */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#161622] border border-[#252535]">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase block">
                Aguardando Aprovação
              </span>
              <p className="text-2xl font-bold text-amber-400 font-mono mt-1">1</p>
              <span className="text-[10px] text-zinc-500">Orçamento enviado</span>
            </div>

            <div className="p-3 rounded-xl bg-[#161622] border border-[#252535]">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase block">
                Em Produção
              </span>
              <p className="text-2xl font-bold text-[#A76BFF] font-mono mt-1">2</p>
              <span className="text-[10px] text-zinc-500">Na bancada técnica</span>
            </div>

            <div className="p-3 rounded-xl bg-[#161622] border border-[#252535]">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase block">
                Prontas
              </span>
              <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">1</p>
              <span className="text-[10px] text-zinc-500">Pronto para entrega</span>
            </div>

            <div className="p-3 rounded-xl bg-[#161622] border border-[#252535]">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase block">
                Entregues Hoje
              </span>
              <p className="text-2xl font-bold text-white font-mono mt-1">3</p>
              <span className="text-[10px] text-zinc-500">Retiradas e quitadas</span>
            </div>
          </div>

          {/* Lista das Últimas Ordens Criadas */}
          <div>
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">
              Últimas Ordens Criadas
            </span>
            <div className="overflow-x-auto rounded-xl border border-[#222230]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#181824] border-b border-[#222230] text-[11px] font-bold text-zinc-400 uppercase">
                    <th className="py-2.5 px-3">O.S. #</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Aparelho</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F2C]">
                  {ultimasOrdens.map((os) => (
                    <tr
                      key={os.id}
                      onClick={() => onRouteChange('ordens-servico')}
                      className="hover:bg-[#1A1A26] transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-white">
                        #{os.numeroOS}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-200 font-medium">
                        {os.cliente}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">
                        {os.aparelho}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={os.badgeVariant} size="sm" dot>
                          {os.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#FF8A00]">
                        R$ {os.valor.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ==================================================
          4. ESTOQUE (POR CATEGORIA - SEM ALERTA MÍNIMO)
          ================================================== */}
      <Card variant="elevated">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#FF8A00]" />
              <span>ESTOQUE POR CATEGORIA</span>
            </div>
          }
          subtitle="Quantidade de itens inventariados por seção da Mix Variedades"
          action={
            <button
              onClick={() => onRouteChange('estoque')}
              className="text-xs text-[#FF8A00] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Ver Estoque Completo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          }
        />
        <CardBody className="p-5 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Perfumes */}
            <div className="p-4 rounded-xl bg-[#151522] border border-[#252535] text-center">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Perfumes
              </span>
              <p
                className="text-2xl font-black text-white mt-1"
                style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
              >
                48
              </p>
              <span className="text-[10px] text-zinc-500">itens em loja</span>
            </div>

            {/* Remédios */}
            <div className="p-4 rounded-xl bg-[#151522] border border-[#252535] text-center">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Remédios
              </span>
              <p
                className="text-2xl font-black text-white mt-1"
                style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
              >
                94
              </p>
              <span className="text-[10px] text-zinc-500">itens em loja</span>
            </div>

            {/* Papelaria */}
            <div className="p-4 rounded-xl bg-[#151522] border border-[#252535] text-center">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Papelaria
              </span>
              <p
                className="text-2xl font-black text-white mt-1"
                style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
              >
                162
              </p>
              <span className="text-[10px] text-zinc-500">itens em loja</span>
            </div>

            {/* Brinquedos */}
            <div className="p-4 rounded-xl bg-[#151522] border border-[#252535] text-center">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Brinquedos
              </span>
              <p
                className="text-2xl font-black text-white mt-1"
                style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
              >
                85
              </p>
              <span className="text-[10px] text-zinc-500">itens em loja</span>
            </div>

            {/* 3D */}
            <div className="p-4 rounded-xl bg-[#151522] border border-[#252535] text-center">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                3D
              </span>
              <p
                className="text-2xl font-black text-[#FF8A00] mt-1"
                style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
              >
                38
              </p>
              <span className="text-[10px] text-zinc-500">impressões e peças</span>
            </div>

            {/* Outros */}
            <div className="p-4 rounded-xl bg-[#151522] border border-[#252535] text-center">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Outros
              </span>
              <p
                className="text-2xl font-black text-white mt-1"
                style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
              >
                115
              </p>
              <span className="text-[10px] text-zinc-500">utilidades gerais</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ==================================================
          5. PROMOÇÕES & 6. POSTAGENS (GRID 2 COLUNAS)
          ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PROMOÇÕES */}
        <Card variant="elevated">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#A76BFF]" />
                <span>PROMOÇÕES DA LOJA</span>
              </div>
            }
            subtitle="Campanhas com desconto aplicadas no caixa e ofertas sazonais"
            action={
              <button
                onClick={() => onRouteChange('promocoes')}
                className="text-xs text-[#FF8A00] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                Ver Promoções <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <CardBody className="p-5 pt-0 space-y-3">
            {/* Promoções Ativas */}
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Promoções Ativas
              </span>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[#161622] border border-[#242434] flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">Semana do Cliente — 15% OFF em Eletrônicos</p>
                      <Badge variant="success" size="sm" dot>Ativa</Badge>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Fones, cabos e carregadores homologados</p>
                  </div>
                  <span className="font-mono font-bold text-[#FF8A00] text-sm whitespace-nowrap">
                    15% OFF
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#161622] border border-[#242434] flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">Combo Gamer Mix — Teclado + Mousepad</p>
                      <Badge variant="success" size="sm" dot>Ativa</Badge>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">50% de desconto no mousepad na compra do teclado</p>
                  </div>
                  <span className="font-mono font-bold text-[#A76BFF] text-sm whitespace-nowrap">
                    Combo
                  </span>
                </div>
              </div>
            </div>

            {/* Promoções Agendadas */}
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Promoções Agendadas
              </span>
              <div className="p-2.5 rounded-xl bg-[#14141E] border border-[#20202E] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-zinc-200">Esquenta Dia das Crianças (20% Brinquedos)</span>
                </div>
                <span className="text-[11px] text-cyan-400 font-mono">Início: 01/10</span>
              </div>
            </div>

            {/* Promoções Encerrando em Breve */}
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Encerrando em Breve
              </span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                <span className="text-amber-300 font-medium">Liquidação de Capinhas e Películas</span>
                <span className="text-[11px] text-amber-400 font-mono font-bold">Encerra em 48h</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* POSTAGENS (REDES SOCIAIS) */}
        <Card variant="elevated">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#FF8A00]" />
                <span>POSTAGENS & MARKETING</span>
              </div>
            }
            subtitle="Cronograma de publicações nas redes da loja"
            action={
              <button
                onClick={() => onRouteChange('redes-calendario')}
                className="text-xs text-[#FF8A00] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                Abrir Calendário <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <CardBody className="p-5 pt-0">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Próxima Publicação Agendada
            </span>

            {/* Card com a Próxima Publicação Agendada conforme solicitado */}
            <div className="p-4 rounded-2xl bg-[#161622] border border-[#28283C] space-y-3.5">
              <div className="flex items-start gap-4">
                {/* Imagem / Thumbnail da Postagem */}
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#111116] border border-[#303045] shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80"
                    alt="Fone Bluetooth Mix"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-bold text-[#FF8A00]">
                    MIX
                  </div>
                </div>

                {/* Detalhes da Postagem */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A76BFF]">
                      <Instagram className="w-3.5 h-3.5" /> Instagram Reels & TikTok
                    </span>
                    <Badge variant="purple" size="sm" dot>Pronto</Badge>
                  </div>

                  <h4 className="text-sm font-bold text-white line-clamp-1">
                    Reels: Chegaram Novidades em Fones Bluetooth!
                  </h4>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    Demonstração dos fones com cancelamento de ruído e preços exclusivos na Mix Variedades.
                  </p>

                  <div className="pt-1 flex items-center gap-3 text-xs font-mono text-zinc-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#FF8A00]" /> 18/09/2026
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#FF8A00]" /> 18:00
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ==================================================
          7. ATIVIDADES RECENTES (DIRETO DA AUDITORIA)
          ================================================== */}
      <Card variant="elevated">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#FF8A00]" />
              <span>ATIVIDADES RECENTES</span>
            </div>
          }
          subtitle="Feed em tempo real alimentado diretamente pelo histórico de auditoria imutável"
          action={
            <button
              onClick={() => onRouteChange('historico')}
              className="text-xs text-[#FF8A00] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Histórico Completo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          }
        />
        <CardBody className="p-5 pt-0">
          <div className="divide-y divide-[#20202E]">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3 text-center">
                Nenhuma atividade recente registrada.
              </p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7B2CF6] shrink-0" />
                    {formatarLinhaAtividade(log)}
                  </div>
                  <Badge variant="neutral" size="sm">
                    {log.modulo}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      {/* MODAL PARA ABRIR CAIXA RÁPIDO NO DASHBOARD */}
      <Modal
        isOpen={isAbrirCaixaModalOpen}
        onClose={() => setIsAbrirCaixaModalOpen(false)}
        title="ABERTURA DE CAIXA — TURNO DA LOJA"
      >
        <form onSubmit={handleConfirmarAberturaCaixa} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[#171724] border border-[#2A2A3E] text-xs text-zinc-300">
            Operador responsável: <strong className="text-white">{user?.name || 'Jhonatan'}</strong>.
            Esta abertura será registrada automaticamente no histórico de auditoria.
          </div>

          <Input
            label="Troco Inicial / Fundo de Caixa (R$) *"
            type="number"
            step="0.01"
            value={inputTroco}
            onChange={(e) => setInputTroco(e.target.value)}
            placeholder="250,00"
            required
            autoFocus
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAbrirCaixaModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="accent">
              Confirmar Abertura do Caixa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
