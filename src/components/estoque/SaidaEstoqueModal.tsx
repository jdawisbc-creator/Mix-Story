import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { EstoqueService } from '../../services/estoqueService';
import { AuditService } from '../../services/auditService';
import type { Produto } from '../../types';
import { ArrowDownRight, Package, AlertTriangle } from 'lucide-react';

interface SaidaEstoqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  onSaidaConcluida: () => void;
}

export const SaidaEstoqueModal: React.FC<SaidaEstoqueModalProps> = ({
  isOpen,
  onClose,
  produto,
  onSaidaConcluida,
}) => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [quantidade, setQuantidade] = useState('1');
  const [motivo, setMotivo] = useState('Uso interno / loja');
  const [salvando, setSalvando] = useState(false);

  if (!produto) return null;

  const qtdAtual = produto.quantidade ?? produto.estoqueAtual ?? 0;
  const qtdRemover = Math.max(0, parseInt(quantidade, 10) || 0);
  const qtdFinal = Math.max(0, qtdAtual - qtdRemover);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (qtdRemover <= 0) {
      error('Quantidade inválida', 'Informe uma quantidade maior que zero para a saída.');
      return;
    }

    if (qtdRemover > qtdAtual) {
      error(
        'Estoque insuficiente',
        `Você tentou retirar ${qtdRemover} un, mas o estoque atual tem apenas ${qtdAtual} un.`
      );
      return;
    }

    if (!motivo.trim()) {
      warning('Motivo obrigatório', 'Informe o motivo da saída manual.');
      return;
    }

    try {
      setSalvando(true);
      const resultado = await EstoqueService.saidaManualEstoque(
        produto.id,
        qtdRemover,
        user?.name || 'Jhonatan',
        motivo.trim()
      );

      if (user) {
        await AuditService.registrar({
          usuario: user.name,
          usuarioId: user.id,
          modulo: 'Estoque',
          tipoAcao: 'Saída Manual',
          registroAfetado: produto.nome,
          informacaoAnterior: `${resultado.estoqueAnterior} un`,
          informacaoNova: `${resultado.novoEstoque} un`,
          descricao: `Saída manual de ${qtdRemover} un de "${produto.nome}". Motivo: ${motivo.trim()}.`,
        });
      }

      success(
        'Saída registrada',
        `-${qtdRemover} un retiradas. Novo estoque: ${resultado.novoEstoque} un.`
      );

      setQuantidade('1');
      setMotivo('Uso interno / loja');
      onSaidaConcluida();
      onClose();
    } catch (err: any) {
      error('Erro ao registrar saída', err.message || 'Falha ao deduzir do estoque.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Saída Manual de Estoque" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Resumo do Produto */}
        <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
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

          <div className="mt-3 pt-2.5 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Estoque Atual Disponível:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {qtdAtual} un.
            </span>
          </div>
        </div>

        {/* Quantidade a retirar */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Quantidade a Retirar *
          </label>
          <div className="relative">
            <ArrowDownRight className="w-4 h-4 absolute left-3 top-3 text-rose-500" />
            <Input
              id="input-quantidade-saida"
              type="number"
              min="1"
              max={qtdAtual}
              step="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="pl-9 text-base font-bold text-rose-600 dark:text-rose-400"
              autoFocus
              required
            />
          </div>
        </div>

        {/* Projeção do Novo Estoque */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">Novo Estoque Final:</span>
          <span className="text-base font-bold text-slate-800 dark:text-slate-100">
            {qtdFinal} un.
          </span>
        </div>

        {/* Motivo da saída manual */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Motivo da Saída Manual *
          </label>
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
          >
            <option value="Uso interno / loja">Uso interno / materiais da loja</option>
            <option value="Avaria / Quebra">Avaria / Quebra / Produto danificado</option>
            <option value="Defeito de fábrica">Defeito de fábrica / Devolução fornecedor</option>
            <option value="Brinde / Amostra">Brinde / Cortesia ao cliente</option>
            <option value="Outro">Outro motivo específico</option>
          </select>
          <Input
            id="input-motivo-saida-detalhe"
            type="text"
            placeholder="Detalhe adicional (opcional)"
            value={motivo === 'Outro' ? '' : motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={salvando || qtdAtual <= 0}
            id="btn-confirmar-saida"
          >
            <ArrowDownRight className="w-4 h-4 mr-1.5" />
            {salvando ? 'Salvando...' : 'Confirmar Saída'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
