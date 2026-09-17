import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { EstoqueService } from '../../services/estoqueService';
import type { MovimentacaoEstoque, TipoMovimentacaoEstoque } from '../../types';
import {
  History,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Sliders,
  Calendar,
  Clock,
  User,
} from 'lucide-react';

interface HistoricoMovimentacoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  filtroProdutoId?: string;
  filtroProdutoNome?: string;
}

export const HistoricoMovimentacoesModal: React.FC<HistoricoMovimentacoesModalProps> = ({
  isOpen,
  onClose,
  filtroProdutoId,
  filtroProdutoNome,
}) => {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [busca, setBusca] = useState(filtroProdutoNome || '');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCarregando(true);
      EstoqueService.getMovimentacoes()
        .then((list) => {
          setMovimentacoes(list);
        })
        .finally(() => setCarregando(false));
      if (filtroProdutoNome) {
        setBusca(filtroProdutoNome);
      }
    }
  }, [isOpen, filtroProdutoNome]);

  const filtradas = movimentacoes.filter((m) => {
    if (filtroProdutoId && m.produtoId !== filtroProdutoId) {
      return false;
    }
    if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) {
      return false;
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      const matchNome = m.produtoNome.toLowerCase().includes(q);
      const matchUser = m.usuario.toLowerCase().includes(q);
      const matchMotivo = (m.motivo || '').toLowerCase().includes(q);
      if (!matchNome && !matchUser && !matchMotivo) return false;
    }
    return true;
  });

  const getTipoBadge = (tipo: TipoMovimentacaoEstoque) => {
    switch (tipo) {
      case 'entrada':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <ArrowUpRight className="w-3 h-3" /> Entrada
          </span>
        );
      case 'venda':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <ShoppingCart className="w-3 h-3" /> Venda
          </span>
        );
      case 'saida_manual':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <ArrowDownRight className="w-3 h-3" /> Saída manual
          </span>
        );
      case 'correcao':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Sliders className="w-3 h-3" /> Correção
          </span>
        );
    }
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '-';
    const partes = dataStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Histórico de Movimentações de Estoque"
      size="xl"
    >
      <div className="space-y-4">
        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              id="input-busca-movimentacoes"
              type="text"
              placeholder="Buscar por produto, usuário ou motivo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              id="select-filtro-tipo-movimento"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="todos">Todos os tipos de movimento</option>
              <option value="entrada">Entrada</option>
              <option value="venda">Venda</option>
              <option value="saida_manual">Saída manual</option>
              <option value="correcao">Correção</option>
            </select>
          </div>
        </div>

        {/* Tabela de Movimentações */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-[460px] overflow-y-auto">
          {filtradas.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              Nenhuma movimentação registrada com os filtros selecionados.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3 text-right">Qtd Anterior</th>
                  <th className="py-2.5 px-3 text-right">Alteração</th>
                  <th className="py-2.5 px-3 text-right">Qtd Final</th>
                  <th className="py-2.5 px-3">Usuário</th>
                  <th className="py-2.5 px-3">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtradas.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-mono">
                      <div>{formatarData(m.data)}</div>
                      <div className="text-[11px] text-slate-400">{m.hora || '-'}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{getTipoBadge(m.tipo)}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100 max-w-[200px] truncate">
                      {m.produtoNome}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                      {m.quantidadeAnterior} un
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span
                        className={
                          m.quantidadeAlterada > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : m.quantidadeAlterada < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-500'
                        }
                      >
                        {m.quantidadeAlterada > 0 ? `+${m.quantidadeAlterada}` : m.quantidadeAlterada} un
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {m.quantidadeFinal} un
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        {m.usuario}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-500 dark:text-slate-400 max-w-[180px] truncate">
                      {m.motivo || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
          <span>
            Total de registros:{' '}
            <strong className="text-slate-800 dark:text-slate-200">{filtradas.length}</strong>
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
