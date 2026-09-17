import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { EstoqueService } from '../../services/estoqueService';
import { VendaService, SERVICOS_CATALOGO } from '../../services/vendaService';
import { CaixaService } from '../../services/caixaService';
import { ConfigService } from '../../services/configService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { Produto, ItemVenda, FormaPagamento, PagamentoMistoParcela } from '../../types';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Package,
  Wrench,
  QrCode,
  Banknote,
  CreditCard,
  Send,
  Layers,
  Calculator,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface NovaVendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendaConcluida: () => void;
}

export const NovaVendaModal: React.FC<NovaVendaModalProps> = ({
  isOpen,
  onClose,
  onVendaConcluida,
}) => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [caixaAberto, setCaixaAberto] = useState<boolean>(true);

  // Tipo de item sendo adicionado no momento
  const [tipoItem, setTipoItem] = useState<'produto' | 'servico'>('produto');

  // Seleção de produto físico
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('');

  // Seleção de serviço
  const [servicoSelecionadoId, setServicoSelecionadoId] = useState(SERVICOS_CATALOGO[0].id);
  const [servicoPersonalizadoNome, setServicoPersonalizadoNome] = useState('');

  // Campos do item atual
  const [quantidade, setQuantidade] = useState<number>(1);
  const [precoUnitario, setPrecoUnitario] = useState<number>(0);
  const [descontoItem, setDescontoItem] = useState<number>(0);

  // Carrinho
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);

  // Dados do Cliente
  const [clienteNome, setClienteNome] = useState('');
  const [clienteDocumento, setClienteDocumento] = useState('');

  // Pagamento
  const [formasAtivas, setFormasAtivas] = useState<Record<string, boolean>>({
    pix: true,
    dinheiro: true,
    cartao_debito: true,
    cartao_credito: true,
    transferencia: true,
    outros: true,
  });
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [valorPagoDinheiro, setValorPagoDinheiro] = useState<string>('');

  // Pagamento Misto
  const [pagamentoMisto, setPagamentoMisto] = useState<PagamentoMistoParcela[]>([
    { forma: 'dinheiro', valor: 0 },
    { forma: 'pix', valor: 0 },
  ]);

  // Carregar produtos e validar caixa ativo
  useEffect(() => {
    if (isOpen) {
      EstoqueService.getProdutos().then((prods) => {
        const ativos = prods.filter((p) => p.ativo);
        setProdutos(ativos);
        if (ativos.length > 0 && !produtoSelecionadoId) {
          setProdutoSelecionadoId(ativos[0].id);
          setPrecoUnitario(ativos[0].precoVenda);
        }
      });

      CaixaService.getCaixaHoje().then((cx) => {
        setCaixaAberto(cx.status === 'aberto');
      });

      ConfigService.getConfig().then((cfg) => {
        if (cfg.formasPagamento) {
          setFormasAtivas(cfg.formasPagamento);
          // Se a forma default (pix) estiver desativada, seleciona a primeira ativa
          if (!cfg.formasPagamento.pix) {
            const primeiraAtiva = (Object.keys(cfg.formasPagamento) as (keyof typeof cfg.formasPagamento)[]).find(
              (k) => cfg.formasPagamento[k]
            );
            if (primeiraAtiva) {
              setFormaPagamento(primeiraAtiva as FormaPagamento);
            }
          }
        }
      });

      // Reset
      setCarrinho([]);
      setClienteNome('');
      setClienteDocumento('');
      setValorPagoDinheiro('');
    }
  }, [isOpen]);

  // Atualiza preço ao trocar produto
  const handleSelecionarProduto = (id: string) => {
    setProdutoSelecionadoId(id);
    const prod = produtos.find((p) => p.id === id);
    if (prod) {
      setPrecoUnitario(prod.precoVenda);
    }
  };

  // Atualiza preço ao trocar serviço
  const handleSelecionarServico = (id: string) => {
    setServicoSelecionadoId(id);
    const srv = SERVICOS_CATALOGO.find((s) => s.id === id);
    if (srv) {
      setPrecoUnitario(srv.precoSugerido);
    }
  };

  // Adicionar item ao carrinho
  const handleAdicionarItem = () => {
    if (quantidade <= 0) {
      warning('Quantidade inválida', 'Informe ao menos 1 unidade.');
      return;
    }
    if (precoUnitario <= 0) {
      warning('Preço inválido', 'O preço unitário deve ser maior que zero.');
      return;
    }

    let nomeItem = '';
    let idItem = '';

    if (tipoItem === 'produto') {
      const prod = produtos.find((p) => p.id === produtoSelecionadoId);
      if (!prod) return;

      // Verificação de estoque disponível
      if (prod.estoqueAtual < quantidade) {
        warning(
          'Estoque Insuficiente',
          `Apenas ${prod.estoqueAtual} unidades disponíveis no estoque para "${prod.nome}".`
        );
      }

      nomeItem = prod.nome;
      idItem = prod.id;
    } else {
      if (servicoSelecionadoId === 'outro') {
        if (!servicoPersonalizadoNome.trim()) {
          warning('Nome do serviço', 'Digite o nome do serviço prestado.');
          return;
        }
        nomeItem = servicoPersonalizadoNome.trim();
        idItem = `srv_custom_${Date.now()}`;
      } else {
        const srv = SERVICOS_CATALOGO.find((s) => s.id === servicoSelecionadoId);
        nomeItem = srv?.nome || 'Serviço';
        idItem = srv?.id || `srv_${Date.now()}`;
      }
    }

    const sub = quantidade * precoUnitario;
    const desc = Math.min(sub, Math.max(0, descontoItem));
    const totalItem = Math.max(0, sub - desc);

    const novoItem: ItemVenda = {
      produtoId: idItem,
      nome: nomeItem,
      tipoItem,
      quantidade,
      precoUnitario,
      subtotal: sub,
      desconto: desc,
      total: totalItem,
    };

    setCarrinho([...carrinho, novoItem]);
    setDescontoItem(0);
    setQuantidade(1);
    setServicoPersonalizadoNome('');
  };

  const handleRemoverItem = (index: number) => {
    setCarrinho(carrinho.filter((_, i) => i !== index));
  };

  // Cálculos do Carrinho
  const subtotalTotal = carrinho.reduce((acc, i) => acc + i.subtotal, 0);
  const descontoTotal = carrinho.reduce((acc, i) => acc + i.desconto, 0);
  const totalGeral = Math.max(0, subtotalTotal - descontoTotal);

  // Troco em dinheiro
  const valorPagoNum = Number(valorPagoDinheiro) || 0;
  const trocoCalculado = Math.max(0, valorPagoNum - totalGeral);

  // Finalizar Venda
  const handleFinalizarVenda = async () => {
    if (carrinho.length === 0) {
      warning('Carrinho Vazio', 'Adicione pelo menos um produto ou serviço à venda.');
      return;
    }

    if (!user) {
      error('Autenticação necessária', 'Faça login para registrar vendas.');
      return;
    }

    if (!caixaAberto) {
      warning(
        'Atenção ao Caixa',
        'O caixa de hoje ainda não foi aberto. A venda será registrada e computada no histórico.'
      );
    }

    if (formaPagamento === 'dinheiro' && valorPagoNum < totalGeral) {
      warning(
        'Valor Insuficiente',
        `O valor pago em dinheiro (R$ ${valorPagoNum.toFixed(2)}) é menor que o total da venda (R$ ${totalGeral.toFixed(2)}).`
      );
      return;
    }

    try {
      const novaVenda = await VendaService.registrarVenda(
        {
          clienteNome: clienteNome.trim() || 'Consumidor Final',
          clienteDocumento: clienteDocumento.trim() || undefined,
          itens: carrinho,
          subtotal: subtotalTotal,
          descontoTotal,
          total: totalGeral,
          formaPagamento,
          pagamentoMistoDetalhes: formaPagamento === 'misto' ? pagamentoMisto : undefined,
          valorPago: formaPagamento === 'dinheiro' ? valorPagoNum : undefined,
          trocoDevolvido: formaPagamento === 'dinheiro' ? trocoCalculado : undefined,
        },
        { id: user.id, name: user.name }
      );

      success(
        'Venda Concluída com Sucesso!',
        `Venda #${novaVenda.numero} no valor de R$ ${totalGeral.toFixed(2)} registrada por ${user.name}.`
      );

      onVendaConcluida();
      onClose();
    } catch (err: any) {
      error('Erro ao registrar venda', err?.message || 'Falha na gravação.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="NOVA VENDA — FRENTE DE CAIXA / PDV"
      size="xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUNA ESQUERDA: ADICIONAR ITENS (PRODUTOS E SERVIÇOS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Seletor de Tipo: Produto Físico ou Serviço */}
          <div className="flex rounded-xl bg-[#141420] p-1 border border-[#242436]">
            <button
              type="button"
              onClick={() => {
                setTipoItem('produto');
                const prod = produtos.find((p) => p.id === produtoSelecionadoId);
                if (prod) setPrecoUnitario(prod.precoVenda);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                tipoItem === 'produto'
                  ? 'bg-[#7B2CF6] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              Produto Físico (Baixa Estoque)
            </button>
            <button
              type="button"
              onClick={() => {
                setTipoItem('servico');
                const srv = SERVICOS_CATALOGO.find((s) => s.id === servicoSelecionadoId);
                if (srv) setPrecoUnitario(srv.precoSugerido);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                tipoItem === 'servico'
                  ? 'bg-[#FF8A00] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Serviço (Sem Baixa no Estoque)
            </button>
          </div>

          {/* ÁREA DE SELEÇÃO: PRODUTO */}
          {tipoItem === 'produto' ? (
            <div className="p-4 rounded-xl bg-[#171725] border border-[#27273A] space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                Selecione o Produto *
              </label>
              <select
                value={produtoSelecionadoId}
                onChange={(e) => handleSelecionarProduto(e.target.value)}
                className="w-full bg-[#0E0E17] border border-[#2A2A3E] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#7B2CF6]"
              >
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — R$ {p.precoVenda.toFixed(2)} (Estoque: {p.estoqueAtual} {p.unidade})
                  </option>
                ))}
              </select>

              {/* Informação rápida do estoque selecionado */}
              {(() => {
                const prod = produtos.find((p) => p.id === produtoSelecionadoId);
                if (!prod) return null;
                return (
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                    <span>
                      Categoria: <strong className="text-zinc-200">{prod.categoriaNome}</strong>
                    </span>
                    <span className="font-mono">
                      Estoque disponível:{' '}
                      <strong
                        className={
                          prod.estoqueAtual <= prod.estoqueMinimo
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }
                      >
                        {prod.estoqueAtual} {prod.unidade}
                      </strong>
                    </span>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* ÁREA DE SELEÇÃO: SERVIÇOS */
            <div className="p-4 rounded-xl bg-[#171725] border border-[#27273A] space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                Selecione o Serviço Prestado *
              </label>
              <select
                value={servicoSelecionadoId}
                onChange={(e) => handleSelecionarServico(e.target.value)}
                className="w-full bg-[#0E0E17] border border-[#2A2A3E] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF8A00]"
              >
                {SERVICOS_CATALOGO.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} — R$ {s.precoSugerido.toFixed(2)}
                  </option>
                ))}
                <option value="outro">+ Outro Serviço Personalizado...</option>
              </select>

              {servicoSelecionadoId === 'outro' && (
                <Input
                  label="Nome do Serviço Personalizado"
                  placeholder="Ex: Formatação de Computador / Criação de Banner"
                  value={servicoPersonalizadoNome}
                  onChange={(e) => setServicoPersonalizadoNome(e.target.value)}
                  required
                />
              )}

              <p className="text-[11px] text-zinc-500 italic">
                * Conforme as regras da Mix Variedades, serviços não sofrem redução de estoque.
              </p>
            </div>
          )}

          {/* VALORES DO ITEM: QUANTIDADE, PREÇO UNITÁRIO, DESCONTO */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                Qtd *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
                className="w-full bg-[#0E0E17] border border-[#2A2A3E] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#7B2CF6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                Preço Unit. (R$) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={precoUnitario}
                onChange={(e) => setPrecoUnitario(Number(e.target.value))}
                className="w-full bg-[#0E0E17] border border-[#2A2A3E] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#7B2CF6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                Desconto (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={descontoItem}
                onChange={(e) => setDescontoItem(Number(e.target.value))}
                className="w-full bg-[#0E0E17] border border-[#2A2A3E] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#7B2CF6]"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            className="w-full"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAdicionarItem}
          >
            Adicionar Item à Venda
          </Button>

          {/* DADOS DO CLIENTE (OPCIONAL) */}
          <div className="p-3.5 rounded-xl bg-[#141420] border border-[#202030] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Identificação do Cliente (Opcional)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nome do Cliente"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="w-full bg-[#0E0E17] border border-[#2A2A3E] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="CPF ou Telefone"
                value={clienteDocumento}
                onChange={(e) => setClienteDocumento(e.target.value)}
                className="w-full bg-[#0E0E17] border border-[#2A2A3E] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: CARRINHO, PAGAMENTO, TROCO E FINALIZAÇÃO */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* ITENS DO CARRINHO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Itens no Carrinho ({carrinho.length})
              </span>
              {carrinho.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCarrinho([])}
                  className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Limpar todos
                </button>
              )}
            </div>

            <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {carrinho.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-[#2A2A3E] text-center text-zinc-500 text-xs">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-50" />
                  Nenhum item adicionado ainda.
                </div>
              ) : (
                carrinho.map((item, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded-xl bg-[#141420] border border-[#242436] flex items-center justify-between text-xs gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={item.tipoItem === 'produto' ? 'purple' : 'orange'}
                          size="sm"
                        >
                          {item.tipoItem === 'produto' ? 'PROD' : 'SERV'}
                        </Badge>
                        <p className="font-bold text-white truncate">{item.nome}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                        <span>
                          {item.quantidade}x R$ {item.precoUnitario.toFixed(2)}
                        </span>
                        {item.desconto > 0 && (
                          <span className="text-rose-400 font-mono">
                            -R$ {item.desconto.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        R$ {item.total.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoverItem(index)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* FORMA DE PAGAMENTO */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
              Forma de Pagamento *
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'pix' as FormaPagamento, label: 'PIX', icon: QrCode },
                { id: 'dinheiro' as FormaPagamento, label: 'Dinheiro', icon: Banknote },
                { id: 'cartao_debito' as FormaPagamento, label: 'Débito', icon: CreditCard },
                { id: 'cartao_credito' as FormaPagamento, label: 'Crédito', icon: CreditCard },
                { id: 'transferencia' as FormaPagamento, label: 'Transf.', icon: Send },
                { id: 'outros' as FormaPagamento, label: 'Outros', icon: Layers },
              ]
                .filter((fp) => formasAtivas[fp.id] !== false)
                .map((fp) => {
                const Icon = fp.icon;
                const isSelected = formaPagamento === fp.id;
                return (
                  <button
                    key={fp.id}
                    type="button"
                    onClick={() => setFormaPagamento(fp.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#FF8A00] text-white border-[#FF8A00] shadow-md shadow-[#FF8A00]/20'
                        : 'bg-[#151522] text-zinc-300 border-[#222234] hover:bg-[#1A1A2C]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {fp.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CÁLCULO DE TROCO PARA PAGAMENTO EM DINHEIRO */}
          {formaPagamento === 'dinheiro' && (
            <div className="p-3.5 rounded-xl bg-[#1A162B] border border-[#7B2CF6]/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#A76BFF]">
                <span>PAGAMENTO EM ESPÉCIE / TROCO</span>
                <Calculator className="w-4 h-4" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Valor Pago (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valorPagoDinheiro}
                    onChange={(e) => setValorPagoDinheiro(e.target.value)}
                    className="w-full bg-[#0E0E17] border border-[#2A2A3E] rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-[#FF8A00]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Troco a Devolver</label>
                  <div className="w-full bg-[#0E0E17] border border-[#2A2A3E] rounded-lg px-3 py-1.5 text-sm font-bold font-mono text-emerald-400 flex items-center">
                    R$ {trocoCalculado.toFixed(2)}
                  </div>
                </div>
              </div>

              {valorPagoNum > 0 && valorPagoNum < totalGeral && (
                <p className="text-[11px] text-rose-400 font-medium">
                  * Faltam R$ {(totalGeral - valorPagoNum).toFixed(2)} para completar o pagamento.
                </p>
              )}
            </div>
          )}

          {/* TOTAIS DA VENDA */}
          <div className="p-4 rounded-xl bg-[#14141E] border border-[#242436] space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal dos Itens:</span>
              <span className="font-mono text-white">R$ {subtotalTotal.toFixed(2)}</span>
            </div>
            {descontoTotal > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>Desconto Total:</span>
                <span className="font-mono">- R$ {descontoTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-[#202030] flex justify-between items-center">
              <span className="font-black text-sm uppercase text-white tracking-wide">
                Total da Venda:
              </span>
              <span className="text-2xl font-black font-mono text-[#FF8A00]">
                R$ {totalGeral.toFixed(2)}
              </span>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="button"
              variant="accent"
              className="flex-2 py-3 font-black text-sm shadow-xl shadow-[#FF8A00]/25"
              icon={<CheckCircle2 className="w-5 h-5" />}
              onClick={handleFinalizarVenda}
              disabled={carrinho.length === 0}
            >
              Concluir Venda
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
