import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { VendaService } from '../../services/vendaService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { Venda } from '../../types';
import { AlertTriangle, XCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface CancelarVendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  venda: Venda | null;
  onVendaCancelada: () => void;
}

export const CancelarVendaModal: React.FC<CancelarVendaModalProps> = ({
  isOpen,
  onClose,
  venda,
  onVendaCancelada,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  if (!venda) return null;

  const handleConfirmarCancelamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      error('Motivo obrigatório', 'Informe o motivo do cancelamento da venda.');
      return;
    }

    if (!user) {
      error('Autenticação necessária', 'Faça login para cancelar vendas.');
      return;
    }

    try {
      setLoading(true);
      await VendaService.cancelarVenda(
        venda.id,
        motivo.trim(),
        { id: user.id, name: user.name }
      );

      success(
        'Venda Cancelada',
        `Venda #${venda.numero} cancelada com sucesso. Produtos devolvidos ao estoque.`
      );
      setMotivo('');
      onVendaCancelada();
      onClose();
    } catch (err: any) {
      error('Erro ao cancelar', err?.message || 'Não foi possível cancelar a venda.');
    } finally {
      setLoading(false);
    }
  };

  const temProdutosFisicos = venda.itens.some((i) => i.tipoItem === 'produto');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`CANCELAR VENDA #${venda.numero}`}
    >
      <form onSubmit={handleConfirmarCancelamento} className="space-y-4">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-200 space-y-1">
            <p className="font-bold uppercase tracking-wider text-rose-300">
              Atenção às regras de cancelamento:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
              <li>A situação da venda passará permanentemente para <strong>CANCELADA</strong>.</li>
              {temProdutosFisicos ? (
                <li>
                  <strong className="text-emerald-400">Estoque Integrado:</strong> A quantidade dos produtos físicos vendidos retornará imediatamente ao estoque da loja.
                </li>
              ) : (
                <li>Esta venda contém apenas serviços (não afeta o estoque).</li>
              )}
              <li>
                <strong className="text-amber-400">Caixa Integrado:</strong> Será lançado um estorno no caixa ativo do turno.
              </li>
              <li>
                <strong className="text-white">Auditoria:</strong> A ação será gravada no histórico imutável sob a responsabilidade de <strong>{user?.name}</strong>.
              </li>
            </ul>
          </div>
        </div>

        {/* Resumo da Venda */}
        <div className="p-3.5 rounded-xl bg-[#141420] border border-[#242436] text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-zinc-400">Venda:</span>
            <span className="font-mono font-bold text-white">#{venda.numero}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Cliente:</span>
            <span className="text-zinc-200">{venda.clienteNome || 'Consumidor Final'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Valor Total:</span>
            <span className="font-mono font-bold text-emerald-400">R$ {venda.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Forma de Pagamento:</span>
            <span className="font-mono uppercase text-zinc-300">{venda.formaPagamento}</span>
          </div>
        </div>

        <Input
          label="Motivo do Cancelamento *"
          placeholder="Ex: Desistência do cliente / Erro na quantidade / Troca de mercadoria"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          required
          autoFocus
        />

        <div className="pt-2 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Voltar
          </Button>
          <Button
            type="submit"
            variant="danger"
            icon={<RotateCcw className="w-4 h-4" />}
            disabled={loading}
          >
            {loading ? 'Cancelando...' : 'Confirmar Cancelamento e Estorno'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
