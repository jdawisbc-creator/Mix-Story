import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EstoqueService } from '../services/estoqueService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { AuditService } from '../services/auditService';
import type { Produto } from '../types';

import { NovoProdutoModal } from '../components/estoque/NovoProdutoModal';
import { EditarProdutoModal } from '../components/estoque/EditarProdutoModal';
import { EntradaEstoqueModal } from '../components/estoque/EntradaEstoqueModal';
import { SaidaEstoqueModal } from '../components/estoque/SaidaEstoqueModal';
import { NovaCategoriaModal } from '../components/estoque/NovaCategoriaModal';
import { HistoricoMovimentacoesModal } from '../components/estoque/HistoricoMovimentacoesModal';

import {
  Plus,
  Search,
  Filter,
  Edit3,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Package,
  History,
  Tag,
  Sparkles,
  Calendar,
} from 'lucide-react';

export const EstoquePage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');

  // Modais
  const [isNovoProdutoOpen, setIsNovoProdutoOpen] = useState(false);
  const [isNovaCategoriaOpen, setIsNovaCategoriaOpen] = useState(false);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);

  const [produtoParaEditar, setProdutoParaEditar] = useState<Produto | null>(null);
  const [produtoParaEntrada, setProdutoParaEntrada] = useState<Produto | null>(null);
  const [produtoParaSaida, setProdutoParaSaida] = useState<Produto | null>(null);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [listaProdutos, listaCategorias] = await Promise.all([
        EstoqueService.getProdutos(),
        EstoqueService.getCategorias(),
      ]);
      setProdutos(listaProdutos);
      setCategorias(listaCategorias);
    } catch (err) {
      console.error('Erro ao carregar dados do estoque:', err);
      error('Erro', 'Não foi possível carregar o catálogo de estoque.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Filtro de pesquisa e categoria
  const produtosFiltrados = produtos.filter((p) => {
    const cat = p.categoria || p.categoriaNome || 'Outros';
    if (categoriaFiltro !== 'todas' && cat !== categoriaFiltro) {
      return false;
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      const matchNome = p.nome.toLowerCase().includes(q);
      const matchObs = (p.observacoes || '').toLowerCase().includes(q);
      if (!matchNome && !matchObs) return false;
    }
    return true;
  });

  // Confirmação de Exclusão
  const handleConfirmarExclusao = async () => {
    if (!produtoParaExcluir) return;

    try {
      setExcluindo(true);
      await EstoqueService.excluirProduto(produtoParaExcluir.id);

      if (user) {
        await AuditService.registrar({
          usuario: user.name,
          usuarioId: user.id,
          modulo: 'Estoque',
          tipoAcao: 'Exclusão',
          registroAfetado: produtoParaExcluir.nome,
          informacaoAnterior: `Qtd: ${produtoParaExcluir.quantidade} | Custo: R$ ${produtoParaExcluir.precoCusto.toFixed(2)} | Venda: R$ ${produtoParaExcluir.precoVenda.toFixed(2)}`,
          informacaoNova: 'Produto Excluído',
          descricao: `Exclusão permanente do produto "${produtoParaExcluir.nome}" do estoque.`,
        });
      }

      success('Produto excluído', `"${produtoParaExcluir.nome}" foi removido do estoque.`);
      setProdutoParaExcluir(null);
      await carregarDados();
    } catch (err: any) {
      error('Erro ao excluir', err.message || 'Falha ao excluir o produto.');
    } finally {
      setExcluindo(false);
    }
  };

  const formatarData = (dataStr?: string) => {
    if (!dataStr) return '-';
    const partes = dataStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <PageHeader
        title="Estoque"
        subtitle="Catálogo simples de produtos, controle de quantidades e movimentações."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsHistoricoOpen(true)}
              id="btn-historico-movimentacoes"
              className="border-slate-300 dark:border-slate-700"
            >
              <History className="w-4 h-4 mr-1.5 text-slate-500" />
              Histórico de Movimentações
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsNovaCategoriaOpen(true)}
              id="btn-nova-categoria"
              className="border-slate-300 dark:border-slate-700"
            >
              <Tag className="w-4 h-4 mr-1.5 text-slate-500" />
              Nova Categoria
            </Button>

            <Button
              variant="primary"
              onClick={() => setIsNovoProdutoOpen(true)}
              id="btn-novo-produto"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Novo Produto
            </Button>
          </div>
        }
      />

      {/* Barra de Pesquisa e Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Pesquisa por nome */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            id="input-pesquisa-estoque"
            type="text"
            placeholder="Pesquisar produto pelo nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtro por Categoria */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            id="select-filtro-categoria"
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
          >
            <option value="todas">Todas as Categorias ({produtos.length})</option>
            {categorias.map((cat) => {
              const contagem = produtos.filter(
                (p) => (p.categoria || p.categoriaNome) === cat
              ).length;
              return (
                <option key={cat} value={cat}>
                  {cat} ({contagem})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Tabela Limpa de Produtos */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {carregando ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            Carregando estoque da Mix...
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto stroke-1" />
            <div className="text-slate-700 dark:text-slate-300 font-semibold">
              Nenhum produto encontrado
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Tente alterar os termos da busca ou adicione um novo produto ao catálogo.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBusca('');
                setCategoriaFiltro('todas');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-center">Quantidade</th>
                  <th className="py-3 px-4 text-right">Custo</th>
                  <th className="py-3 px-4 text-right">Venda</th>
                  <th className="py-3 px-4">Entrada</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {produtosFiltrados.map((p) => {
                  const qtd = p.quantidade ?? p.estoqueAtual ?? 0;
                  const cat = p.categoria || p.categoriaNome || 'Outros';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Coluna 1: Produto (com foto opcional) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.foto ? (
                            <img
                              src={p.foto}
                              alt={p.nome}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                              {p.nome}
                            </div>
                            {p.observacoes && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                {p.observacoes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Coluna 2: Categoria */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {cat}
                        </span>
                      </td>

                      {/* Coluna 3: Quantidade */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                            qtd > 5
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                              : qtd > 0
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                          }`}
                        >
                          {qtd} un
                        </span>
                      </td>

                      {/* Coluna 4: Custo */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                        R$ {p.precoCusto.toFixed(2)}
                      </td>

                      {/* Coluna 5: Venda */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            R$ {p.precoVenda.toFixed(2)}
                          </span>
                          {p.emPromocao && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold inline-flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> Promoção
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Coluna 6: Entrada */}
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatarData(p.dataEntrada)}
                        </div>
                      </td>

                      {/* Coluna 7: Ações (Editar, Entrada, Saída, Excluir) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Entrada rápida */}
                          <button
                            type="button"
                            onClick={() => setProdutoParaEntrada(p)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title="Entrada de estoque"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>

                          {/* Saída rápida */}
                          <button
                            type="button"
                            onClick={() => setProdutoParaSaida(p)}
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                            title="Saída manual"
                          >
                            <ArrowDownRight className="w-4 h-4" />
                          </button>

                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => setProdutoParaEditar(p)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar produto"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Excluir */}
                          <button
                            type="button"
                            onClick={() => setProdutoParaExcluir(p)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Excluir produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé da tabela com totais informativos limpos */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Mostrando <strong>{produtosFiltrados.length}</strong> de{' '}
            <strong>{produtos.length}</strong> produtos cadastrados
          </div>
          <div>
            Estoque total físico:{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {produtosFiltrados.reduce((acc, p) => acc + (p.quantidade ?? p.estoqueAtual ?? 0), 0)}{' '}
              unidades
            </strong>
          </div>
        </div>
      </div>

      {/* Modais de Operação */}
      <NovoProdutoModal
        isOpen={isNovoProdutoOpen}
        onClose={() => setIsNovoProdutoOpen(false)}
        categorias={categorias}
        onProdutoCadastrado={carregarDados}
        onAbrirNovaCategoria={() => setIsNovaCategoriaOpen(true)}
      />

      <EditarProdutoModal
        isOpen={Boolean(produtoParaEditar)}
        onClose={() => setProdutoParaEditar(null)}
        produto={produtoParaEditar}
        categorias={categorias}
        onProdutoAtualizado={carregarDados}
      />

      <EntradaEstoqueModal
        isOpen={Boolean(produtoParaEntrada)}
        onClose={() => setProdutoParaEntrada(null)}
        produto={produtoParaEntrada}
        onEntradaConcluida={carregarDados}
      />

      <SaidaEstoqueModal
        isOpen={Boolean(produtoParaSaida)}
        onClose={() => setProdutoParaSaida(null)}
        produto={produtoParaSaida}
        onSaidaConcluida={carregarDados}
      />

      <NovaCategoriaModal
        isOpen={isNovaCategoriaOpen}
        onClose={() => setIsNovaCategoriaOpen(false)}
        onCategoriaCriada={async (novaCat) => {
          await carregarDados();
          setCategoriaFiltro(novaCat);
        }}
      />

      <HistoricoMovimentacoesModal
        isOpen={isHistoricoOpen}
        onClose={() => setIsHistoricoOpen(false)}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={Boolean(produtoParaExcluir)}
        onClose={() => setProdutoParaExcluir(null)}
        onConfirm={handleConfirmarExclusao}
        title="Excluir Produto do Estoque"
        message={`Tem certeza que deseja excluir o produto "${produtoParaExcluir?.nome}"? Esta ação removerá o produto do catálogo e não poderá ser desfeita.`}
        confirmText={excluindo ? 'Excluindo...' : 'Sim, Excluir Produto'}
        variant="danger"
      />
    </div>
  );
};
