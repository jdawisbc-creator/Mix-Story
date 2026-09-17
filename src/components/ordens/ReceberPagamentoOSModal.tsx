import React, { useState, useId } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { OrdemServicoService } from '../../services/ordemServicoService';
import type { OrdemServico, FormaPagamento } from '../../types';
import {
  DollarSign,
  QrCode,
  CreditCard,
  Building2,
  CheckCircle2,
  Coins,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

interface ReceberPagamentoOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordem: OrdemServico | null;
  onPagamentoRegistrado: (ordemAtualizada: OrdemServico) => void;
}

export const ReceberPagamentoOSModal: React.FC<ReceberPagamentoOSModalProps> = ({
  isOpen,
  onClose,
  ordem,
  onPagamentoRegistrado,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const valorRecebidoInputId = useId();

  const [formaSelecionada, setFormaSelecionada] = useState<FormaPagamento>('pix');
  const [valorRecebidoDinheiro, setValorRecebidoDinheiro] = useState<string>('');
  const [marcarComoEntregue, setMarcarComoEntregue] = useState(true);
  const [processando, setProcessando] = useState(false);

  if (!ordem) return null;

  const total = Number(ordem.valorTotal) || 0;
  const recebidoNum = formaSelecionada === 'dinheiro' 
    ? (parseFloat(valorRecebidoDinheiro.replace(',', '.')) || total)
    : total;
  const troco = Math.max(0, recebidoNum - total);
  const trocoInsuficiente = formaSelecionada === 'dinheiro' && recebidoNum < total;

  const handleConfirmar = async () => {
    if (!user) {
      error('Autenticação necessária', 'Você precisa estar logado para registrar pagamento.');
      return;
    }

    if (formaSelecionada === 'dinheiro' && recebidoNum < total) {
      error('Valor insuficiente', 'O valor entregue em dinheiro é menor que o total da ordem.');
      return;
    }

    try {
      setProcessando(true);
      const atualizada = await OrdemServicoService.registrarPagamento(
        ordem.id,
        formaSelecionada,
        total,
        { id: user.id, name: user.name },
        marcarComoEntregue,
        formaSelecionada === 'dinheiro' ? troco : 0
      );

      success(
        'Pagamento Confirmado',
        `Recebimento de R$ ${total.toFixed(2)} registrado e lançado no Caixa com sucesso!`
      );
      onPagamentoRegistrado(atualizada);
      onClose();
    } catch (e: any) {
      error('Falha ao processar pagamento', e.message || 'Erro inesperado.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receber Pagamento — ${ordem.numeroOS}`}
      size="md"
    >
      <div className="space-y-5">
        {/* Resumo da Ordem */}
        <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between">
          <div>
            <div className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
              Cliente
            </div>
            <div className="text-base font-bold text-white mt-0.5">
              {ordem.clienteNome}
            </div>
            <div className="text-xs text-slate-400">
              {ordem.itens?.filter((i) => i.descricao).length || 0} itens discriminados
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
              Total a Receber
            </div>
            <div className="text-2xl font-mono font-black text-emerald-400">
              R$ {total.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Escolha da Forma de Pagamento */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Forma de Pagamento
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFormaSelecionada('pix')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                formaSelecionada === 'pix'
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-md ring-2 ring-purple-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <QrCode className="w-5 h-5 text-emerald-400" />
              <span>PIX</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormaSelecionada('dinheiro');
                if (!valorRecebidoDinheiro) setValorRecebidoDinheiro(total.toFixed(2));
              }}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                formaSelecionada === 'dinheiro'
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-md ring-2 ring-purple-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Coins className="w-5 h-5 text-amber-400" />
              <span>Dinheiro</span>
            </button>

            <button
              type="button"
              onClick={() => setFormaSelecionada('cartao_debito')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                formaSelecionada === 'cartao_debito'
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-md ring-2 ring-purple-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <CreditCard className="w-5 h-5 text-cyan-400" />
              <span>Cartão Débito</span>
            </button>

            <button
              type="button"
              onClick={() => setFormaSelecionada('cartao_credito')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                formaSelecionada === 'cartao_credito'
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-md ring-2 ring-purple-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <span>Cartão Crédito</span>
            </button>

            <button
              type="button"
              onClick={() => setFormaSelecionada('transferencia')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                formaSelecionada === 'transferencia'
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-md ring-2 ring-purple-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Building2 className="w-5 h-5 text-blue-400" />
              <span>Transferência</span>
            </button>
          </div>
        </div>

        {/* Cálculo de Troco se for Dinheiro */}
        {formaSelecionada === 'dinheiro' && (
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div>
              <label htmlFor={valorRecebidoInputId} className="text-xs font-bold text-slate-300 block mb-1">
                Valor Entregue pelo Cliente (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">R$</span>
                <input
                  id={valorRecebidoInputId}
                  type="text"
                  value={valorRecebidoDinheiro}
                  onChange={(e) => setValorRecebidoDinheiro(e.target.value)}
                  placeholder={total.toFixed(2)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold rounded-lg bg-black border border-slate-700 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Sugestões rápidas de cédulas */}
            <div className="flex flex-wrap gap-1.5">
              {[total, Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, 50, 100, 200]
                .filter((v, idx, arr) => v >= total && arr.indexOf(v) === idx)
                .slice(0, 4)
                .map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setValorRecebidoDinheiro(v.toFixed(2))}
                    className="px-2 py-1 text-[11px] font-mono font-bold rounded bg-slate-800 hover:bg-purple-900 text-slate-300 border border-slate-700"
                  >
                    R$ {v.toFixed(2)}
                  </button>
                ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Troco a devolver:</span>
              <span
                className={`text-lg font-mono font-black ${
                  trocoInsuficiente ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {trocoInsuficiente
                  ? 'Falta: R$ ' + Math.abs(recebidoNum - total).toFixed(2)
                  : 'R$ ' + troco.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Checkbox de Entrega */}
        <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={marcarComoEntregue}
            onChange={(e) => setMarcarComoEntregue(e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-950"
          />
          <div>
            <div className="text-xs font-bold text-white">
              Marcar status da OS como Entregue
            </div>
            <div className="text-[11px] text-slate-400">
              Atualiza o ciclo de vida da OS para status final de entrega
            </div>
          </div>
        </label>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={processando}
            id="btn-cancelar-recebimento-os"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleConfirmar}
            disabled={processando || trocoInsuficiente}
            id="btn-confirmar-recebimento-os"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {processando ? 'Registrando...' : 'Confirmar e Lançar no Caixa'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
