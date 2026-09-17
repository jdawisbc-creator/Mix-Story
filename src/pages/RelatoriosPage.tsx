import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import type { TipoRelatorio, TipoPeriodo, IntervaloDatas } from '../types/relatorios';
import { calcularIntervaloPeriodo } from '../utils/relatorioUtils';

// Componentes do módulo de Relatórios
import { FiltroPeriodoBar } from '../components/relatorios/FiltroPeriodoBar';
import { ModalVisualizarImpressaoRelatorio } from '../components/relatorios/ModalVisualizarImpressaoRelatorio';
import { RelatorioVendasView } from '../components/relatorios/RelatorioVendasView';
import { RelatorioCaixaView } from '../components/relatorios/RelatorioCaixaView';
import { RelatorioEntradasView } from '../components/relatorios/RelatorioEntradasView';
import { RelatorioSaidasView } from '../components/relatorios/RelatorioSaidasView';
import { RelatorioComprasRevendaView } from '../components/relatorios/RelatorioComprasRevendaView';
import { RelatorioEstoqueView } from '../components/relatorios/RelatorioEstoqueView';
import { RelatorioPromocoesView } from '../components/relatorios/RelatorioPromocoesView';
import { RelatorioOrdensServicoView } from '../components/relatorios/RelatorioOrdensServicoView';

// Serviços para carregamento dos dados reais
import { VendaService } from '../services/vendaService';
import { CaixaService } from '../services/caixaService';
import { GastoService } from '../services/gastoService';
import { EstoqueService } from '../services/estoqueService';
import { PromocaoService } from '../services/promocaoService';
import { OrdemServicoService } from '../services/ordemServicoService';

// Tipos
import type {
  Venda,
  Caixa,
  MovimentoCaixa,
  SaidaGasto,
  Produto,
  MovimentacaoEstoque,
  Promocao,
  OrdemServico,
} from '../types';

import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Package,
  Tag,
  Wrench,
  Printer,
  RefreshCw,
} from 'lucide-react';

const RELATORIOS_MENU: { id: TipoRelatorio; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'vendas', label: 'Vendas', icon: TrendingUp },
  { id: 'caixa', label: 'Caixa', icon: Wallet },
  { id: 'entradas', label: 'Entradas', icon: ArrowUpRight },
  { id: 'saidas', label: 'Saídas', icon: ArrowDownRight },
  { id: 'compras_revenda', label: 'Compras p/ Revenda', icon: ShoppingBag },
  { id: 'estoque', label: 'Estoque', icon: Package },
  { id: 'promocoes', label: 'Promoções', icon: Tag },
  { id: 'ordens_servico', label: 'Ordens de Serviço', icon: Wrench },
];

export const RelatoriosPage: React.FC = () => {
  const { user } = useAuth();
  const { info, error } = useToast();

  // Estados de navegação e filtros
  const [relatorioAtivo, setRelatorioAtivo] = useState<TipoRelatorio>('vendas');
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>('este_mes');
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState('');
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState('');
  const [intervalo, setIntervalo] = useState<IntervaloDatas>(() =>
    calcularIntervaloPeriodo('este_mes')
  );

  // Estados de dados dos módulos
  const [loading, setLoading] = useState(true);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [movimentosCaixa, setMovimentosCaixa] = useState<MovimentoCaixa[]>([]);
  const [saidas, setSaidas] = useState<SaidaGasto[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoesEstoque, setMovimentacoesEstoque] = useState<MovimentacaoEstoque[]>([]);
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);

  // Modal de Impressão
  const [modalImpressaoAberto, setModalImpressaoAberto] = useState(false);
  const [conteudoImpressao, setConteudoImpressao] = useState<React.ReactNode | null>(null);
  const [tituloImpressao, setTituloImpressao] = useState('');

  // Nome do operador responsável
  const usuarioNome = user?.name || 'Administrador Mix';

  // Atualizar intervalo quando o período ou as datas personalizadas mudam
  useEffect(() => {
    if (tipoPeriodo === 'personalizado') {
      if (dataInicioPersonalizada && dataFimPersonalizada) {
        setIntervalo(calcularIntervaloPeriodo('personalizado', dataInicioPersonalizada, dataFimPersonalizada));
      }
    } else {
      setIntervalo(calcularIntervaloPeriodo(tipoPeriodo));
    }
  }, [tipoPeriodo, dataInicioPersonalizada, dataFimPersonalizada]);

  // Carregar dados de todos os serviços
  const carregarDados = async () => {
    try {
      setLoading(true);
      const [
        resVendas,
        resCaixas,
        resMovimentos,
        resSaidas,
        resProdutos,
        resMovEstoque,
        resPromocoes,
        resOrdens,
      ] = await Promise.all([
        VendaService.getVendas(),
        CaixaService.getHistoricoCaixas(),
        CaixaService.getMovimentosHoje(),
        GastoService.getSaidas(),
        EstoqueService.getProdutos(),
        EstoqueService.getMovimentacoes(),
        PromocaoService.getPromocoes(),
        OrdemServicoService.getOrdens(),
      ]);

      setVendas(resVendas);
      setCaixas(resCaixas);
      setMovimentosCaixa(resMovimentos);
      setSaidas(resSaidas);
      setProdutos(resProdutos);
      setMovimentacoesEstoque(resMovEstoque);
      setPromocoes(resPromocoes);
      setOrdensServico(resOrdens);
    } catch (err) {
      console.error('Erro ao carregar dados para relatórios:', err);
      error('Erro ao Carregar', 'Não foi possível carregar os dados dos relatórios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const abrirImpressao = (conteudo: React.ReactNode, titulo: string) => {
    setConteudoImpressao(conteudo);
    setTituloImpressao(titulo);
    setModalImpressaoAberto(true);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <PageHeader
        title="RELATÓRIOS GERENCIAIS"
        description="Relatórios simples, objetivos e práticos para controle de vendas, caixa, estoque e serviços da Mix Variedades Store."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={carregarDados}
            >
              Atualizar Dados
            </Button>
          </div>
        }
      />

      {/* Seletor dos 8 Relatórios Exigidos */}
      <div className="bg-[#13131B] border border-[#222230] p-1.5 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {RELATORIOS_MENU.map((item) => {
            const Icon = item.icon;
            const isAtivo = relatorioAtivo === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRelatorioAtivo(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isAtivo
                    ? 'bg-[#7B2CF6] text-white shadow-lg shadow-[#7B2CF6]/20'
                    : 'text-zinc-400 hover:text-white hover:bg-[#1C1C28]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isAtivo ? 'text-white' : 'text-zinc-500'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra Unificada de Filtro por Período */}
      <FiltroPeriodoBar
        periodoAtivo={tipoPeriodo}
        dataInicioPersonalizada={dataInicioPersonalizada}
        dataFimPersonalizada={dataFimPersonalizada}
        onSelecionarPeriodo={setTipoPeriodo}
        onChangeDataInicio={setDataInicioPersonalizada}
        onChangeDataFim={setDataFimPersonalizada}
      />

      {/* Estado de Carregamento */}
      {loading ? (
        <Card variant="elevated">
          <CardBody className="py-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-[#7B2CF6] animate-spin" />
            <p className="text-sm">Carregando e consolidando métricas da Mix Variedades...</p>
          </CardBody>
        </Card>
      ) : (
        /* Renderização Dinâmica do Relatório Selecionado */
        <div>
          {relatorioAtivo === 'vendas' && (
            <RelatorioVendasView
              vendas={vendas}
              intervalo={intervalo}
              usuarioNome={usuarioNome}
              onAbrirImpressao={abrirImpressao}
            />
          )}

          {relatorioAtivo === 'caixa' && (
            <RelatorioCaixaView
              caixas={caixas}
              movimentos={movimentosCaixa}
              intervalo={intervalo}
              usuarioNome={usuarioNome}
              onAbrirImpressao={abrirImpressao}
            />
          )}

          {relatorioAtivo === 'entradas' && (
            <RelatorioEntradasView
              vendas={vendas}
              movimentos={movimentosCaixa}
              movimentacoesEstoque={movimentacoesEstoque}
              intervalo={intervalo}
              usuarioNome={usuarioNome}
              onAbrirImpressao={abrirImpressao}
            />
          )}

          {relatorioAtivo === 'saidas' && (
            <RelatorioSaidasView
              saidas={saidas}
              movimentos={movimentosCaixa}
              intervalo={intervalo}
              usuarioNome={usuarioNome}
              onAbrirImpressao={abrirImpressao}
            />
          )}

          {relatorioAtivo === 'compras_revenda' && (
            <RelatorioComprasRevendaView
              saidas={saidas}
              intervalo={intervalo}
              usuarioNome={usuarioNome}
              onAbrirImpressao={abrirImpressao}
            />
          )}

          {relatorioAtivo === 'estoque' && (
            <RelatorioEstoqueView
              produtos={produtos}
              movimentacoes={movimentacoesEstoque}
              intervalo={intervalo}
              usuarioNome={usuarioNome}
              onAbrirImpressao={abrirImpressao}
            />
          )}

          {relatorioAtivo === 'promocoes' && (
            <RelatorioPromocoesView
              promocoes={promocoes}
              intervalo={intervalo}
              usuarioNome={usuarioNome}
              onAbrirImpressao={abrirImpressao}
            />
          )}

          {relatorioAtivo === 'ordens_servico' && (
            <RelatorioOrdensServicoView
              ordens={ordensServico}
              intervalo={intervalo}
              usuarioNome={usuarioNome}
              onAbrirImpressao={abrirImpressao}
            />
          )}
        </div>
      )}

      {/* Modal Unificado de Impressão e PDF com Cabeçalho Timbrado */}
      <ModalVisualizarImpressaoRelatorio
        isOpen={modalImpressaoAberto}
        onClose={() => setModalImpressaoAberto(false)}
        titulo={tituloImpressao}
        conteudo={conteudoImpressao}
      />
    </div>
  );
};
