import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { GastoService } from '../../services/gastoService';
import { EstoqueService } from '../../services/estoqueService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { Produto, FormaPagamento, TipoSaida } from '../../types';
import {
  Building2,
  PackagePlus,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface NovaSaidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaidaRegistrada: () => void;
  tipoInicial?: TipoSaida;
}

const CATEGORIAS_DESPESAS = [
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'energia', label: 'Energia Elétrica' },
  { value: 'internet', label: 'Internet / Telefonia' },
  { value: 'agua', label: 'Água e Saneamento' },
  { value: 'manutencao', label: 'Manutenção e Reparos' },
  { value: 'materiais_loja', label: 'Materiais Utilizados pela Loja (Sacolas, Bobinas, etc.)' },
  { value: 'assinaturas', label: 'Assinaturas e Softwares' },
  { value: 'outros', label: 'Outras Despesas Operacionais' },
];

export const NovaSaidaModal: React.FC<NovaSaidaModalProps> = ({
  isOpen,
  onClose,
  onSaidaRegistrada,
  tipoInicial = 'despesa',
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [tipo, setTipo] = useState<TipoSaida>(tipoInicial);
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // Campos Comuns
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');

  // Campos Tipo 1: Despesa Operacional
  const [descricaoDespesa, setDescricaoDespesa] = useState('');
  const [categoriaDespesa, setCategoriaDespesa] = useState('aluguel');
  const [valorDespesa, setValorDespesa] = useState<string>('');
  const [favorecidoDespesa, setFavorecidoDespesa] = useState('');
  const [observacaoDespesa, setObservacaoDespesa] = useState('');

  // Campos Tipo 2: Compra para Revenda
  const [modoProduto, setModoProduto] = useState<'existente' | 'novo'>('existente');
  const [produtoIdSelecionado, setProdutoIdSelecionado] = useState('');
  const [novoProdutoNome, setNovoProdutoNome] = useState('');
  const [categoriaProduto, setCategoriaProduto] = useState('Geral / Variedades');
  const [quantidadeCompra, setQuantidadeCompra] = useState<number>(100);
  const [custoUnitario, setCustoUnitario] = useState<number>(1.0);
  const [precoPrevistoVenda, setPrecoPrevistoVenda] = useState<number>(2.0);
  const [fornecedorCompra, setFornecedorCompra] = useState('');
  const [observacoesCompra, setObservacoesCompra] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTipo(tipoInicial);
      carregarProdutos();
    }
  }, [isOpen, tipoInicial]);

  const carregarProdutos = async () => {
    try {
      const prods = await EstoqueService.getProdutos();
      setProdutos(prods);
      if (prods.length > 0 && !produtoIdSelecionado) {
        // Inicializa com o primeiro produto
        const p0 = prods[0];
        setProdutoIdSelecionado(p0.id);
        setCustoUnitario(p0.precoCusto || 1.0);
        setPrecoPrevistoVenda(p0.precoVenda || 2.0);
        setCategoriaProduto(p0.categoriaNome || 'Geral / Variedades');
      }
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  };

  const handleSelecionarProdutoExistente = (id: string) => {
    setProdutoIdSelecionado(id);
    const prod = produtos.find((p) => p.id === id);
    if (prod) {
      setCustoUnitario(prod.precoCusto);
      setPrecoPrevistoVenda(prod.precoVenda);
      setCategoriaProduto(prod.categoriaNome);
    }
  };

  // Cálculos dinâmicos para Compra de Revenda
  const valorTotalInvestimento = Number((quantidadeCompra * custoUnitario).toFixed(2));
  const receitaPotencialEstimada = Number((quantidadeCompra * precoPrevistoVenda).toFixed(2));
  const lucroProjetado = Number((receitaPotencialEstimada - valorTotalInvestimento).toFixed(2));
  const margemPercentual =
    valorTotalInvestimento > 0
      ? ((lucroProjetado / valorTotalInvestimento) * 100).toFixed(1)
      : '0.0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      error('Autenticação necessária', 'Faça login para registrar saídas.');
      return;
    }

    try {
      setLoading(true);

      if (tipo === 'despesa') {
        const valorNum = Number(valorDespesa);
        if (!descricaoDespesa.trim() || !valorNum || valorNum <= 0) {
          error('Campos obrigatórios', 'Informe a descrição e o valor da despesa.');
          return;
        }

        await GastoService.registrarDespesa({
          descricao: descricaoDespesa.trim(),
          categoria: categoriaDespesa,
          valor: valorNum,
          data,
          formaPagamento,
          observacao: observacaoDespesa.trim(),
          fornecedorOuFavorecido: favorecidoDespesa.trim(),
          usuario: { id: user.id, name: user.name },
          lancarNoCaixaSeDinheiro: true,
        });

        success(
          'Despesa Registrada',
          `"${descricaoDespesa}" (R$ ${valorNum.toFixed(2)}) lançada com sucesso.`
        );
      } else {
        // TIPO 2: COMPRA PARA REVENDA
        if (quantidadeCompra <= 0 || custoUnitario <= 0) {
          error('Valores inválidos', 'Quantidade e custo unitário devem ser maiores que zero.');
          return;
        }

        let nomeDoItem = '';
        let prodId: string | undefined = undefined;

        if (modoProduto === 'existente') {
          const p = produtos.find((item) => item.id === produtoIdSelecionado);
          if (!p) {
            error('Produto não selecionado', 'Selecione um produto do estoque.');
            return;
          }
          nomeDoItem = p.nome;
          prodId = p.id;
        } else {
          if (!novoProdutoNome.trim()) {
            error('Nome do produto obrigatório', 'Informe o nome do novo produto a ser criado.');
            return;
          }
          nomeDoItem = novoProdutoNome.trim();
        }

        await GastoService.registrarCompraRevenda({
          produtoId: prodId,
          produtoNome: nomeDoItem,
          categoria: categoriaProduto,
          quantidade: Number(quantidadeCompra),
          custoUnitario: Number(custoUnitario),
          precoPrevistoVenda: Number(precoPrevistoVenda),
          data,
          formaPagamento,
          fornecedor: fornecedorCompra.trim(),
          observacoes: observacoesCompra.trim(),
          usuario: { id: user.id, name: user.name },
          lancarNoCaixaSeDinheiro: true,
        });

        success(
          'Compra para Revenda Confirmada',
          `Saída de R$ ${valorTotalInvestimento.toFixed(2)} registrada e +${quantidadeCompra} unidades adicionadas ao estoque!`
        );
      }

      onSaidaRegistrada();
      onClose();
    } catch (err: any) {
      error('Erro ao registrar', err?.message || 'Falha ao registrar saída.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="NOVA SAÍDA FINANCEIRA"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* SELETOR DE TIPO COM DESIGN CLARO */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-[#0E0E17] border border-[#242436]">
          <button
            type="button"
            onClick={() => setTipo('despesa')}
            className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
              tipo === 'despesa'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>TIPO 1 — DESPESA (Gasto Real)</span>
          </button>

          <button
            type="button"
            onClick={() => setTipo('compra_revenda')}
            className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
              tipo === 'compra_revenda'
                ? 'bg-[#7B2CF6]/30 text-purple-200 border border-[#7B2CF6]/60 shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            <span>TIPO 2 — COMPRA P/ REVENDA (Estoque)</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TIPO 1: FORMULÁRIO DE DESPESA OPERACIONAL */}
        {/* ======================================================== */}
        {tipo === 'despesa' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-200">
              <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong>Despesa Operacional:</strong> Representa o dinheiro realmente gasto para a manutenção da Mix Variedades Store (aluguel, água, luz, sacolas, manutenção, etc.).
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Descrição da Despesa *"
                  placeholder="Ex: Conta de Energia Elétrica — Enel ou Aluguel do Ponto"
                  value={descricaoDespesa}
                  onChange={(e) => setDescricaoDespesa(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Categoria da Despesa *
                </label>
                <select
                  value={categoriaDespesa}
                  onChange={(e) => setCategoriaDespesa(e.target.value)}
                  className="w-full bg-[#11111B] border border-[#27273A] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-400 cursor-pointer"
                  required
                >
                  {CATEGORIAS_DESPESAS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="Valor da Despesa (R$) *"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={valorDespesa}
                  onChange={(e) => setValorDespesa(e.target.value)}
                  required
                />
              </div>

              <div>
                <Input
                  label="Data do Pagamento *"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Forma de Pagamento *
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                  className="w-full bg-[#11111B] border border-[#27273A] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF8A00] cursor-pointer"
                  required
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro (Gaveta / Caixa)</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="transferencia">Transferência Bancária</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Fornecedor / Favorecido (Opcional)"
                  placeholder="Ex: Enel Distribuição, Imobiliária Central, Gráfica Master"
                  value={favorecidoDespesa}
                  onChange={(e) => setFavorecidoDespesa(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Observações / Detalhes"
                  placeholder="Ex: Referente à fatura com vencimento no dia 25"
                  value={observacaoDespesa}
                  onChange={(e) => setObservacaoDespesa(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TIPO 2: FORMULÁRIO DE COMPRA PARA REVENDA */}
        {/* ======================================================== */}
        {tipo === 'compra_revenda' && (
          <div className="space-y-4">
            {/* Box explicativo prioritário conforme as instruções */}
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3">
              <PackagePlus className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs text-purple-200 leading-relaxed space-y-1">
                <strong className="text-white block font-bold uppercase tracking-wider">
                  Diretriz de Estoque: SAÍDA FINANCEIRA + ENTRADA DE MERCADORIA
                </strong>
                <p>
                  Esta compra <strong>NÃO é tratada como despesa perdida</strong>. Ao confirmar, o valor sairá das finanças e a quantidade especificada será <strong>adicionada automaticamente ao saldo em estoque</strong> do produto.
                </p>
              </div>
            </div>

            {/* Alternar Produto Existente ou Novo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModoProduto('existente')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  modoProduto === 'existente'
                    ? 'bg-white/10 text-white border-purple-400'
                    : 'text-zinc-400 border-[#27273A] hover:text-white'
                }`}
              >
                Selecionar do Estoque Atual
              </button>
              <button
                type="button"
                onClick={() => setModoProduto('novo')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  modoProduto === 'novo'
                    ? 'bg-white/10 text-white border-purple-400'
                    : 'text-zinc-400 border-[#27273A] hover:text-white'
                }`}
              >
                + Cadastrar Novo Produto
              </button>
            </div>

            {modoProduto === 'existente' ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Produto no Estoque *
                </label>
                <select
                  value={produtoIdSelecionado}
                  onChange={(e) => handleSelecionarProdutoExistente(e.target.value)}
                  className="w-full bg-[#11111B] border border-[#27273A] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                  required
                >
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} (Saldo atual: {p.estoqueAtual} un. | Custo: R$ {p.precoCusto.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nome do Novo Produto *"
                  placeholder="Ex: Adesivo Mix Vinil ou Capinha Antishock"
                  value={novoProdutoNome}
                  onChange={(e) => setNovoProdutoNome(e.target.value)}
                  required
                />
                <Input
                  label="Categoria do Produto *"
                  placeholder="Ex: Papelaria, Eletrônicos, Presentes"
                  value={categoriaProduto}
                  onChange={(e) => setCategoriaProduto(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Parâmetros Quantidade, Custo Unitário e Venda Unitária */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Input
                  label="Quantidade Adquirida *"
                  type="number"
                  min="1"
                  step="1"
                  value={quantidadeCompra}
                  onChange={(e) => setQuantidadeCompra(Math.max(1, Number(e.target.value)))}
                  required
                />
              </div>

              <div>
                <Input
                  label="Custo Unitário (R$) *"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={custoUnitario}
                  onChange={(e) => setCustoUnitario(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <Input
                  label="Preço Previsto de Venda (R$) *"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={precoPrevistoVenda}
                  onChange={(e) => setPrecoPrevistoVenda(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* PAINEL DE CÁLCULO FINANCEIRO E POTENCIAL EM TEMPO REAL */}
            <div className="p-4 rounded-xl bg-[#12121C] border border-[#27273A] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300 border-b border-[#222234] pb-2">
                <span>SIMULAÇÃO FINANCEIRA DA COMPRA</span>
                <span className="text-purple-400 font-mono">
                  {quantidadeCompra} unidades
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-zinc-400 text-[11px] block">Investimento (Saída):</span>
                  <span className="text-base font-black text-rose-400 font-mono">
                    R$ {valorTotalInvestimento.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {quantidadeCompra} x R$ {custoUnitario.toFixed(2)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-zinc-400 text-[11px] block">Receita Potencial:</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    R$ {receitaPotencialEstimada.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {quantidadeCompra} x R$ {precoPrevistoVenda.toFixed(2)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-zinc-400 text-[11px] block">Lucro Bruto Projetado:</span>
                  <span className="text-base font-black text-[#FF8A00] font-mono">
                    + R$ {lucroProjetado.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#A76BFF] block font-semibold">
                    Margem estimada: +{margemPercentual}%
                  </span>
                </div>
              </div>
            </div>

            {/* Data, Pagamento, Fornecedor e Observações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Data da Compra *"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Forma de Pagamento *
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                  className="w-full bg-[#11111B] border border-[#27273A] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                  required
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro (Gaveta / Caixa)</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="transferencia">Transferência Bancária</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <Input
                  label="Fornecedor (Opcional)"
                  placeholder="Ex: Distribuidora Tech Brasil, Master Vinil"
                  value={fornecedorCompra}
                  onChange={(e) => setFornecedorCompra(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Observações / Lote"
                  placeholder="Ex: Lote com 100 unidades promocionais"
                  value={observacoesCompra}
                  onChange={(e) => setObservacoesCompra(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* RODAPÉ E IDENTIFICAÇÃO DO USUÁRIO */}
        <div className="pt-3 border-t border-[#222234] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            Responsável pelo lançamento:{' '}
            <strong className="text-white font-bold">{user?.name || 'Jhonatan'}</strong>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={tipo === 'despesa' ? 'danger' : 'accent'}
              disabled={loading}
              icon={
                tipo === 'despesa' ? (
                  <Building2 className="w-4 h-4" />
                ) : (
                  <PackagePlus className="w-4 h-4" />
                )
              }
            >
              {loading
                ? 'Gravando...'
                : tipo === 'despesa'
                ? 'Registrar Despesa Operacional'
                : `Confirmar Compra (+${quantidadeCompra} un. no Estoque)`}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
