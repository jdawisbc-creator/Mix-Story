import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { EstoqueService } from '../../services/estoqueService';
import { AuditService } from '../../services/auditService';
import type { Produto } from '../../types';
import { ArrowUpRight, Plus, Package } from 'lucide-react';

interface EntradaEstoqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  onEntradaConcluida: () => void;
}

export const EntradaEstoqueModal: React.FC<EntradaEstoqueModalProps> = ({
  isOpen,
  onClose,
  produto,
  onEntradaConcluida,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [quantidade, setQuantidade] = useState('1');
  const [motivo, setMotivo] = useState('Entrada de mercadoria / reposição');
  const [salvando, setSalvando] = useState(false);

  if (!produto) return null;

  const qtdAtual = produto.quantidade ?? produto.estoqueAtual ?? 0;
  const qtdAdicionar = Math.max(0, parseInt(quantidade, 10) || 0);
  const qtdFinal = qtdAtual + qtdAdicionar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (qtdAdicionar <= 0) {
      error('Quantidade inválida', 'Informe uma quantidade maior que zero para entrada.');
      return;
    }

    try {
      setSalvando(true);
      const resultado = await EstoqueService.adicionarEstoque(
        produto.id,
        qtdAdicionar,
        user?.name || 'Jhonatan',
        motivo.trim() || 'Entrada manual'
      );

      if (user) {
        await AuditService.registrar({
          usuario: user.name,
          usuarioId: user.id,
          modulo: 'Estoque',
          tipoAcao: 'Entrada de Estoque',
          registroAfetado: produto.nome,
          informacaoAnterior: `${resultado.estoqueAnterior} un`,
          informacaoNova: `${resultado.novoEstoque} un`,
          descricao: `Entrada de ${qtdAdicionar} un para o produto "${produto.nome}". Motivo: ${motivo.trim() || 'Entrada manual'}.`,
        });
      }

      success(
        'Entrada registrada',
        `+${qtdAdicionar} un adicionadas. Novo estoque: ${resultado.novoEstoque} un.`
      );

      setQuantidade('1');
      setMotivo('Entrada de mercadoria / reposição');
      onEntradaConcluida();
      onClose();
    } catch (err: any) {
      error('Erro ao registrar entrada', err.message || 'Falha ao somar estoque.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Entrada de Mercadoria" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Resumo do Produto */}
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {produto.nome}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Categoria: <span className="font-medium">{produto.categoria}</span>
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Estoque Atual:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {qtdAtual} un.
            </span>
          </div>
        </div>

        {/* Quantidade a adicionar */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Quantidade a Adicionar *
          </label>
          <div className="relative">
            <ArrowUpRight className="w-4 h-4 absolute left-3 top-3 text-emerald-500" />
            <Input
              id="input-quantidade-entrada"
              type="number"
              min="1"
              step="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="pl-9 text-base font-bold text-emerald-600 dark:text-emerald-400"
              autoFocus
              required
            />
          </div>
        </div>

        {/* Projeção do Novo Estoque */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">Novo Estoque Final:</span>
          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
            {qtdFinal} un.
          </span>
        </div>

        {/* Motivo da entrada */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Motivo / Observação da Entrada (Opcional)
          </label>
          <Input
            id="input-motivo-entrada"
            type="text"
            placeholder="Ex: Compra fornecedor, devolução, reposição..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={salvando} id="btn-confirmar-entrada">
            <Plus className="w-4 h-4 mr-1.5" />
            {salvando ? 'Salvando...' : 'Confirmar Entrada'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
