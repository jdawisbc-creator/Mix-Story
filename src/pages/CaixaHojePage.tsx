import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, Column } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Input } from '../components/ui/Input';
import { CaixaService } from '../services/caixaService';
import { ConfigService } from '../services/configService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { AuditService } from '../services/auditService';
import { FechamentoCupomModal } from '../components/caixa/FechamentoCupomModal';
import type { Caixa, MovimentoCaixa } from '../types';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PlusCircle,
  MinusCircle,
  Lock,
  Unlock,
  Receipt,
  Printer,
  CreditCard,
  QrCode,
  Banknote,
  Send,
  Layers,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const CaixaHojePage: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();
  const [caixa, setCaixa] = useState<Caixa | null>(null);
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [valorPadraoConfig, setValorPadraoConfig] = useState<number>(200.0);

  // Modais
  const [isMovModalOpen, setIsMovModalOpen] = useState(false);
  const [isAberturaModalOpen, setIsAberturaModalOpen] = useState(false);
  const [isFechamentoModalOpen, setIsFechamentoModalOpen] = useState(false);
  const [isCupomModalOpen, setIsCupomModalOpen] = useState(false);
  const [selectedMovToCancel, setSelectedMovToCancel] = useState<MovimentoCaixa | null>(null);

  // Estados dos Formulários
  const [movTipo, setMovTipo] = useState<'suprimento' | 'sangria'>('suprimento');
  const [movValor, setMovValor] = useState('');
  const [movDescricao, setMovDescricao] = useState('');

  // Formulário Abertura
  const [valorAbertura, setValorAbertura] = useState('200.00');
  const [obsAbertura, setObsAbertura] = useState('');

  // Formulário Fechamento
  const [valorContadoInput, setValorContadoInput] = useState('');
  const [valorPermaneceraTroco, setValorPermaneceraTroco] = useState('200.00');
  const [obsFechamento, setObsFechamento] = useState('');

  const carregarDados = async () => {
    const cx = await CaixaService.getCaixaHoje();
    const movs = await CaixaService.getMovimentosHoje();
    const padrao = await ConfigService.getValorPadraoTroco();

    setCaixa(cx);
    setMovimentos(movs);
    setValorPadraoConfig(padrao);
    setValorAbertura(padrao.toFixed(2));
    setValorPermaneceraTroco(padrao.toFixed(2));
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // 1. ABERTURA DE CAIXA COM VALIDAÇÃO DE DUPLICIDADE
  const handleAbrirModalAbertura = () => {
    if (caixa && caixa.status === 'aberto') {
      warning(
        'Caixa já aberto',
        `O caixa de hoje já está aberto pelo operador ${caixa.operadorNome}. Não é permitido duas aberturas simultâneas.`
      );
      return;
    }
    setValorAbertura(valorPadraoConfig.toFixed(2));
    setIsAberturaModalOpen(true);
  };

  const handleConfirmarAbertura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      error('Autenticação necessária', 'Faça login para abrir o caixa.');
      return;
    }

    const valor = Number(valorAbertura);
    if (isNaN(valor) || valor < 0) {
      error('Valor inválido', 'Informe um valor de troco válido.');
      return;
    }

    try {
      const cxAberto = await CaixaService.abrirCaixa(
        {
          valorTroco: valor,
          observacoes: obsAbertura.trim(),
        },
        { id: user.id, name: user.name }
      );

      setCaixa(cxAberto);
      success(
        'Caixa Aberto!',
        `Turno iniciado com troco inicial padrão de R$ ${valor.toFixed(2)} por ${user.name}.`
      );
      setIsAberturaModalOpen(false);
      setObsAbertura('');
      carregarDados();
    } catch (err: any) {
      error('Abertura não permitida', err?.message || 'Erro ao abrir o caixa.');
    }
  };

  // 2. ENTRADA E SAÍDA (Suprimento / Sangria)
  const handleSalvarMovimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movValor || Number(movValor) <= 0) {
      error('Valor inválido', 'Informe um valor maior que zero.');
      return;
    }

    const valorNum = Number(movValor);
    const isEntrada = movTipo === 'suprimento';

    const novoMov: MovimentoCaixa = {
      id: `mov_${Date.now()}`,
      caixaId: caixa?.id || 'caixa_atual',
      tipo: movTipo,
      valor: valorNum,
      descricao:
        movDescricao.trim() ||
        (isEntrada ? 'Suprimento / Entrada avulsa de troco' : 'Sangria / Retirada de segurança'),
      formaPagamento: 'dinheiro',
      usuarioId: user?.id || 'usr_01',
      usuarioNome: user?.name || 'Jhonatan',
      timestamp: new Date().toISOString(),
    };

    await CaixaService.adicionarMovimento(novoMov);

    if (caixa) {
      const atualizado: Caixa = {
        ...caixa,
        totalEntradas: isEntrada ? caixa.totalEntradas + valorNum : caixa.totalEntradas,
        totalSaidas: !isEntrada ? caixa.totalSaidas + valorNum : caixa.totalSaidas,
        saldoFinalCalculado: isEntrada
          ? caixa.saldoFinalCalculado + valorNum
          : caixa.saldoFinalCalculado - valorNum,
        entradasAdicionais: isEntrada
          ? (caixa.entradasAdicionais || 0) + valorNum
          : caixa.entradasAdicionais,
        saidasTotal: !isEntrada ? (caixa.saidasTotal || 0) + valorNum : caixa.saidasTotal,
      };
      await CaixaService.salvarCaixa(atualizado);
    }

    if (user) {
      await AuditService.registrar({
        usuario: user.name,
        usuarioId: user.id,
        modulo: 'Caixa',
        tipoAcao: isEntrada ? 'Entrada' : 'Saída',
        registroAfetado: `Caixa (${caixa?.data})`,
        informacaoAnterior: `Saldo anterior: R$ ${caixa?.saldoFinalCalculado.toFixed(2)}`,
        informacaoNova: `Valor: R$ ${valorNum.toFixed(2)} (${isEntrada ? '+' : '-'})`,
        descricao: `${isEntrada ? 'Entrada' : 'Saída'} no caixa: ${novoMov.descricao}.`,
      });
    }

    success(
      isEntrada ? 'Entrada Registrada' : 'Saída Registrada',
      `R$ ${valorNum.toFixed(2)} registrado com sucesso.`
    );
    setIsMovModalOpen(false);
    setMovValor('');
    setMovDescricao('');
    carregarDados();
  };

  // 3. ABRIR MODAL DE FECHAMENTO PREPARADO COM CÁLCULOS
  const handleAbrirModalFechamento = () => {
    // Sugerir o valor esperado calculado da gaveta no input de contagem
    const troco = caixa?.saldoInicial || 0;
    const vendasDinheiro = caixa?.vendasDinheiro || 0;
    const suprimentos = caixa?.entradasAdicionais || 0;
    const sangrias = caixa?.totalSaidas || 0;
    const esperado = troco + vendasDinheiro + suprimentos - sangrias;

    setValorContadoInput(esperado.toFixed(2));
    setValorPermaneceraTroco(valorPadraoConfig.toFixed(2));
    setIsFechamentoModalOpen(true);
  };

  // CÁLCULO DINÂMICO DA DIFERENÇA EM TEMPO REAL NO MODAL
  const valorEsperadoCalculado = () => {
    const troco = caixa?.saldoInicial || 0;
    const vendasDinheiro = caixa?.vendasDinheiro || 0;
    const suprimentos = caixa?.entradasAdicionais || 0;
    const sangrias = caixa?.totalSaidas || 0;
    return troco + vendasDinheiro + suprimentos - sangrias;
  };

  const diferencaCalculada = () => {
    const contado = Number(valorContadoInput) || 0;
    const esperado = valorEsperadoCalculado();
    return Number((contado - esperado).toFixed(2));
  };

  // 4. CONFIRMAR FECHAMENTO DE CAIXA
  const handleConfirmarFechamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixa || !user) return;

    const contado = Number(valorContadoInput);
    if (isNaN(contado) || contado < 0) {
      error('Valor inválido', 'Informe o valor contado na gaveta.');
      return;
    }

    const trocoRetido = Number(valorPermaneceraTroco) || 0;

    try {
      const caixaFechado = await CaixaService.fecharCaixa(
        {
          valorContado: contado,
          valorPermaneceraTroco: trocoRetido,
          observacoes: obsFechamento.trim(),
        },
        { id: user.id, name: user.name }
      );

      setCaixa(caixaFechado);
      success('Caixa Fechado com Sucesso', 'Turno finalizado e registrado na auditoria.');
      setIsFechamentoModalOpen(false);
      setIsCupomModalOpen(true); // Abre o comprovante imprimível automaticamente
      carregarDados();
    } catch (err: any) {
      error('Erro ao fechar caixa', err?.message);
    }
  };

  // 5. CANCELAMENTO DE MOVIMENTO
  const handleConfirmarCancelamento = async () => {
    if (!selectedMovToCancel || !user) return;

    await CaixaService.excluirMovimento(selectedMovToCancel.id);

    await AuditService.registrar({
      usuario: user.name,
      usuarioId: user.id,
      modulo: 'Caixa',
      tipoAcao: 'Cancelamento',
      registroAfetado: `Movimento #${selectedMovToCancel.id}`,
      informacaoAnterior: `${selectedMovToCancel.tipo.toUpperCase()}: R$ ${selectedMovToCancel.valor.toFixed(2)}`,
      informacaoNova: 'Cancelado pelo operador',
      descricao: `Cancelamento de ${selectedMovToCancel.tipo}: ${selectedMovToCancel.descricao}.`,
    });

    success('Movimento Cancelado', 'A movimentação foi cancelada e auditada.');
    setSelectedMovToCancel(null);
    carregarDados();
  };

  const isCaixaAberto = caixa?.status === 'aberto';

  const columns: Column<MovimentoCaixa>[] = [
    {
      header: 'Horário',
      cell: (row) => (
        <span className="text-xs text-zinc-400 font-mono">
          {new Date(row.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Tipo',
      cell: (row) => {
        const config = {
          abertura: { variant: 'purple' as const, label: 'Abertura' },
          venda: { variant: 'success' as const, label: 'Venda' },
          suprimento: { variant: 'orange' as const, label: 'Entrada (Suprimento)' },
          sangria: { variant: 'danger' as const, label: 'Saída (Sangria)' },
          fechamento: { variant: 'neutral' as const, label: 'Fechamento' },
          estorno: { variant: 'warning' as const, label: 'Estorno' },
        }[row.tipo] || { variant: 'neutral' as const, label: row.tipo };

        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      },
    },
    {
      header: 'Descrição',
      accessorKey: 'descricao',
    },
    {
      header: 'Operador',
      accessorKey: 'usuarioNome',
      cell: (row) => <span className="text-xs text-zinc-300 font-medium">{row.usuarioNome}</span>,
    },
    {
      header: 'Valor',
      align: 'right',
      cell: (row) => {
        const isNegative = row.tipo === 'sangria' || row.tipo === 'estorno';
        return (
          <span
            className={`font-mono font-bold ${
              isNegative ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {isNegative ? '-' : '+'} R$ {row.valor.toFixed(2)}
          </span>
        );
      },
    },
    {
      header: 'Ação',
      align: 'right',
      cell: (row) =>
        row.tipo !== 'abertura' &&
        row.tipo !== 'fechamento' && (
          <button
            onClick={() => setSelectedMovToCancel(row)}
            className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Cancelar Movimento"
          >
            <XCircle className="w-4 h-4" />
          </button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="CONTROLE DE CAIXA"
        description="Gestão de aberturas diárias, sangrias, suprimentos e fechamento cego com conferência detalhada e comprovante oficial."
        actions={
          <div className="flex items-center gap-2.5">
            {isCaixaAberto ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlusCircle className="w-4 h-4" />}
                  onClick={() => {
                    setMovTipo('suprimento');
                    setIsMovModalOpen(true);
                  }}
                >
                  + Entrada (Suprimento)
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<MinusCircle className="w-4 h-4" />}
                  onClick={() => {
                    setMovTipo('sangria');
                    setIsMovModalOpen(true);
                  }}
                >
                  - Saída (Sangria)
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Lock className="w-4 h-4" />}
                  onClick={handleAbrirModalFechamento}
                >
                  Fechar Caixa
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="accent"
                  icon={<Unlock className="w-4 h-4" />}
                  onClick={handleAbrirModalAbertura}
                  className="font-bold shadow-lg shadow-[#FF8A00]/25"
                >
                  Abrir Caixa do Turno
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => setIsCupomModalOpen(true)}
                >
                  Ver Resumo de Fechamento
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Cartões Informativos de Saldo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status */}
        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Status do Caixa
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isCaixaAberto ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`}
                />
                <span className="text-lg font-black text-white">
                  {isCaixaAberto ? 'Aberto / Ativo' : 'Fechado'}
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 mt-0.5 block">
                Operador: {caixa?.operadorNome || 'Nenhum'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#7B2CF6]/15 border border-[#7B2CF6]/30 flex items-center justify-center text-[#A76BFF]">
              <Wallet className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        {/* Fundo Inicial */}
        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Troco Inicial
              </p>
              <p className="text-2xl font-black text-white font-mono mt-1">
                R$ {(caixa?.saldoInicial || 0).toFixed(2)}
              </p>
              <span className="text-[11px] text-zinc-500 mt-0.5 block">
                Padrão: R$ {valorPadraoConfig.toFixed(2)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        {/* Total Vendido */}
        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total Vendido Hoje
              </p>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
                R$ {(caixa?.totalVendido || 0).toFixed(2)}
              </p>
              <span className="text-[11px] text-zinc-500 mt-0.5 block">
                Todas as formas de pagamento
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        {/* Saldo Esperado em Gaveta */}
        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Saldo Físico (Dinheiro)
              </p>
              <p className="text-2xl font-black text-[#FF8A00] font-mono mt-1">
                R$ {(caixa?.saldoFinalCalculado || 0).toFixed(2)}
              </p>
              <span className="text-[11px] text-zinc-500 mt-0.5 block">
                Troco + Vendas Dinheiro - Sangrias
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FF8A00]/10 border border-[#FF8A00]/20 flex items-center justify-center text-[#FF8A00]">
              <Receipt className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* DISCRIMINAÇÃO POR FORMA DE PAGAMENTO DO TURNO */}
      <Card>
        <CardHeader
          title="Faturamento por Forma de Pagamento no Caixa"
          subtitle="Valores atualizados em tempo real conforme cada venda é concluída no PDV"
        />
        <CardBody className="p-4 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-[#151522] border border-[#222232]">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                <Banknote className="w-3.5 h-3.5" /> Dinheiro
              </div>
              <p className="text-lg font-bold text-white font-mono">
                R$ {(caixa?.vendasDinheiro || 0).toFixed(2)}
              </p>
              <span className="text-[10px] text-zinc-500">Gaveta física</span>
            </div>

            <div className="p-3 rounded-xl bg-[#151522] border border-[#222232]">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                <QrCode className="w-3.5 h-3.5" /> PIX
              </div>
              <p className="text-lg font-bold text-emerald-400 font-mono">
                R$ {(caixa?.vendasPix || 0).toFixed(2)}
              </p>
              <span className="text-[10px] text-zinc-500">Instantâneo</span>
            </div>

            <div className="p-3 rounded-xl bg-[#151522] border border-[#222232]">
              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold mb-1">
                <CreditCard className="w-3.5 h-3.5" /> Cartão Débito
              </div>
              <p className="text-lg font-bold text-white font-mono">
                R$ {(caixa?.vendasDebito || 0).toFixed(2)}
              </p>
              <span className="text-[10px] text-zinc-500">POS / Maquininha</span>
            </div>

            <div className="p-3 rounded-xl bg-[#151522] border border-[#222232]">
              <div className="flex items-center gap-1.5 text-xs text-[#A76BFF] font-semibold mb-1">
                <CreditCard className="w-3.5 h-3.5" /> Cartão Crédito
              </div>
              <p className="text-lg font-bold text-white font-mono">
                R$ {(caixa?.vendasCredito || 0).toFixed(2)}
              </p>
              <span className="text-[10px] text-zinc-500">POS / Maquininha</span>
            </div>

            <div className="p-3 rounded-xl bg-[#151522] border border-[#222232]">
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold mb-1">
                <Send className="w-3.5 h-3.5" /> Transferência
              </div>
              <p className="text-lg font-bold text-white font-mono">
                R$ {(caixa?.vendasTransferencia || 0).toFixed(2)}
              </p>
              <span className="text-[10px] text-zinc-500">TED / DOC</span>
            </div>

            <div className="p-3 rounded-xl bg-[#151522] border border-[#222232]">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold mb-1">
                <Layers className="w-3.5 h-3.5" /> Outros / Misto
              </div>
              <p className="text-lg font-bold text-white font-mono">
                R$ {(caixa?.vendasOutros || 0).toFixed(2)}
              </p>
              <span className="text-[10px] text-zinc-500">Convênio / Misto</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabela de Movimentações */}
      <Card>
        <CardHeader
          title="Extrato de Movimentações do Dia"
          action={
            <span className="text-xs text-zinc-400 font-mono">
              {movimentos.length} lançamentos registrados
            </span>
          }
        />
        <Table
          columns={columns}
          data={movimentos}
          keyExtractor={(m) => m.id}
          emptyMessage="Nenhuma movimentação registrada no caixa hoje."
        />
      </Card>

      {/* ==================================================
          MODAL ABERTURA DE CAIXA
          ================================================== */}
      <Modal
        isOpen={isAberturaModalOpen}
        onClose={() => setIsAberturaModalOpen(false)}
        title="ABERTURA DE CAIXA — TURNO DA LOJA"
      >
        <form onSubmit={handleConfirmarAbertura} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[#171724] border border-[#2A2A3E] space-y-1 text-xs text-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-400">Data do Caixa:</span>
              <strong className="text-white font-mono">{new Date().toLocaleDateString('pt-BR')}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Usuário Responsável:</span>
              <strong className="text-[#FF8A00]">{user?.name || 'Jhonatan'}</strong>
            </div>
            <p className="text-[11px] text-zinc-500 pt-1">
              O valor padrão configurado nas preferências da loja é de <strong>R$ {valorPadraoConfig.toFixed(2)}</strong>.
            </p>
          </div>

          <Input
            label="Valor Inicial para Troco (R$) *"
            type="number"
            step="0.01"
            value={valorAbertura}
            onChange={(e) => setValorAbertura(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Observações da Abertura"
            placeholder="Ex: Turno matutino iniciado com notas miúdas e moedas conferidas."
            value={obsAbertura}
            onChange={(e) => setObsAbertura(e.target.value)}
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAberturaModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="accent">
              Confirmar Abertura do Caixa
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==================================================
          MODAL FECHAMENTO DO CAIXA
          ================================================== */}
      <Modal
        isOpen={isFechamentoModalOpen}
        onClose={() => setIsFechamentoModalOpen(false)}
        title="FECHAMENTO DE CAIXA — CONFERÊNCIA DE VALORES"
        size="lg"
      >
        <form onSubmit={handleConfirmarFechamento} className="space-y-4">
          {/* Resumo dos Valores Calculados */}
          <div className="p-4 rounded-xl bg-[#14141E] border border-[#242436] space-y-2 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
              Resumo do Turno
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-zinc-500 block text-[10px]">Troco Inicial:</span>
                <span className="font-mono font-bold text-white">
                  R$ {(caixa?.saldoInicial || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Vendas em Dinheiro:</span>
                <span className="font-mono font-bold text-amber-400">
                  R$ {(caixa?.vendasDinheiro || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">PIX:</span>
                <span className="font-mono font-bold text-emerald-400">
                  R$ {(caixa?.vendasPix || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Débito:</span>
                <span className="font-mono font-bold text-blue-400">
                  R$ {(caixa?.vendasDebito || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Crédito:</span>
                <span className="font-mono font-bold text-[#A76BFF]">
                  R$ {(caixa?.vendasCredito || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Transferência / Outros:</span>
                <span className="font-mono font-bold text-cyan-400">
                  R$ {((caixa?.vendasTransferencia || 0) + (caixa?.vendasOutros || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#202030] flex justify-between font-bold text-sm">
              <span className="text-zinc-300">TOTAL VENDIDO NO TURNO:</span>
              <span className="text-white font-mono">
                R$ {(caixa?.totalVendido || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-xs text-zinc-400">
              <span>Entradas Adicionais (Suprimentos): + R$ {(caixa?.entradasAdicionais || 0).toFixed(2)}</span>
              <span>Saídas (Sangrias): - R$ {(caixa?.totalSaidas || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Valor Esperado vs Valor Contado */}
          <div className="p-4 rounded-xl bg-[#1A162B] border border-[#7B2CF6]/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[#A76BFF]">
                Valor Esperado em Caixa (Dinheiro Físico):
              </span>
              <span className="font-mono font-black text-lg text-white">
                R$ {valorEsperadoCalculado().toFixed(2)}
              </span>
            </div>

            <Input
              label="Valor Contado Manualmente na Gaveta (R$) *"
              type="number"
              step="0.01"
              value={valorContadoInput}
              onChange={(e) => setValorContadoInput(e.target.value)}
              placeholder="0,00"
              required
              autoFocus
            />

            {/* DIFERENÇA CALCULADA EM TEMPO REAL */}
            {(() => {
              const diff = diferencaCalculada();
              const isExato = diff === 0;
              const isFalta = diff < 0;
              const isSobra = diff > 0;

              return (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    isExato
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : isFalta
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isExato && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isFalta && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                    {isSobra && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                    <span>
                      {isExato && 'Diferença: R$ 0,00 (Conferência Perfeita)'}
                      {isFalta && `Falta no Caixa: R$ ${Math.abs(diff).toFixed(2)}`}
                      {isSobra && `Sobra no Caixa: R$ ${Math.abs(diff).toFixed(2)}`}
                    </span>
                  </div>
                  <span className="font-mono text-sm">
                    {isFalta ? '-' : isSobra ? '+' : ''} R$ {Math.abs(diff).toFixed(2)}
                  </span>
                </div>
              );
            })()}

            <Input
              label="Valor que Permanecerá para Troco no Próximo Turno (R$) *"
              type="number"
              step="0.01"
              value={valorPermaneceraTroco}
              onChange={(e) => setValorPermaneceraTroco(e.target.value)}
              required
            />
          </div>

          <Input
            label="Observações do Fechamento"
            placeholder="Ex: Todas as notas e moedas conferidas. Valor restante transferido para cofre."
            value={obsFechamento}
            onChange={(e) => setObsFechamento(e.target.value)}
          />

          <div className="pt-3 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFechamentoModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="danger" icon={<Lock className="w-4 h-4" />}>
              Concluir e Emitir Fechamento
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==================================================
          MODAL ENTRADA / SAÍDA (SUPRIMENTO / SANGRIA)
          ================================================== */}
      <Modal
        isOpen={isMovModalOpen}
        onClose={() => setIsMovModalOpen(false)}
        title={movTipo === 'suprimento' ? 'REGISTRAR ENTRADA (SUPRIMENTO)' : 'REGISTRAR SAÍDA (SANGRIA)'}
      >
        <form onSubmit={handleSalvarMovimento} className="space-y-4">
          <Input
            label="Valor (R$) *"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={movValor}
            onChange={(e) => setMovValor(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Descrição / Motivo *"
            placeholder={
              movTipo === 'suprimento'
                ? 'Ex: Fundo extra para troco de moedas'
                : 'Ex: Sangria para malote ou despesa emergencial'
            }
            value={movDescricao}
            onChange={(e) => setMovDescricao(e.target.value)}
            required
          />

          <div className="p-3 rounded-xl bg-[#171724] border border-[#2B2B3E] text-xs text-zinc-300">
            Ação executada pelo operador <strong className="text-white">{user?.name}</strong>. Esta movimentação será gravada permanentemente no histórico de auditoria.
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsMovModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={movTipo === 'suprimento' ? 'primary' : 'danger'}
            >
              Confirmar {movTipo === 'suprimento' ? 'Entrada' : 'Saída'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL COMPROVANTE IMPRIMÍVEL DO FECHAMENTO */}
      <FechamentoCupomModal
        isOpen={isCupomModalOpen}
        onClose={() => setIsCupomModalOpen(false)}
        caixa={caixa}
      />

      {/* MODAL CONFIRMAÇÃO CANCELAMENTO */}
      <ConfirmModal
        isOpen={!!selectedMovToCancel}
        onClose={() => setSelectedMovToCancel(null)}
        onConfirm={handleConfirmarCancelamento}
        title="Cancelar Movimento de Caixa"
        message={`Deseja cancelar o lançamento de R$ ${selectedMovToCancel?.valor.toFixed(2)} (${selectedMovToCancel?.descricao})? O cancelamento será registrado na auditoria com seu usuário.`}
        confirmText="Sim, Cancelar Lançamento"
        cancelText="Voltar"
        variant="danger"
      />
    </div>
  );
};
