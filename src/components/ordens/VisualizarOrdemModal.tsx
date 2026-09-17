import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ModeloOficialOrdemServico } from './ModeloOficialOrdemServico';
import { ReceberPagamentoOSModal } from './ReceberPagamentoOSModal';
import type { OrdemServico, StatusOSMix } from '../../types';
import { Printer, FileDown, Edit3, X, CheckCircle2, DollarSign, Coins } from 'lucide-react';
import { OrdemServicoService } from '../../services/ordemServicoService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface VisualizarOrdemModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordem: OrdemServico | null;
  onEditar: (ordem: OrdemServico) => void;
  onStatusAlterado: (ordem: OrdemServico) => void;
}

const STATUS_OPCOES: { id: StatusOSMix; label: string }[] = [
  { id: 'aguardando_aprovacao', label: 'Aguardando aprovação' },
  { id: 'aprovada', label: 'Aprovada' },
  { id: 'em_producao', label: 'Em produção' },
  { id: 'pronta', label: 'Pronta' },
  { id: 'entregue', label: 'Entregue' },
  { id: 'cancelada', label: 'Cancelada' },
];

export const VisualizarOrdemModal: React.FC<VisualizarOrdemModalProps> = ({
  isOpen,
  onClose,
  ordem,
  onEditar,
  onStatusAlterado,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);
  const [isReceberModalOpen, setIsReceberModalOpen] = useState(false);

  if (!ordem) return null;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${ordem.numeroOS} - ${ordem.clienteNome} - Mix Variedades`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleGerarPDF = () => {
    handlePrint();
  };

  const handleAlterarStatus = async (novoStatus: StatusOSMix) => {
    try {
      setAtualizandoStatus(true);
      const atualizada = await OrdemServicoService.atualizarStatus(
        ordem.id,
        novoStatus,
        user?.name || 'Jhonatan',
        user?.id
      );
      success('Status atualizado', `A ordem ${ordem.numeroOS} agora está "${novoStatus}".`);
      onStatusAlterado(atualizada);
    } catch (e: any) {
      error('Erro ao atualizar status', e.message);
    } finally {
      setAtualizandoStatus(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${ordem.numeroOS} — Modelo Oficial Mix Variedades`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Barra Superior de Ações e Controle de Status */}
          <div className="no-print p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Status:
                </span>
                <select
                  value={ordem.status}
                  disabled={atualizandoStatus}
                  onChange={(e) => handleAlterarStatus(e.target.value as StatusOSMix)}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-purple-400 bg-white dark:bg-slate-950 text-purple-700 dark:text-purple-300 outline-none cursor-pointer"
                >
                  {STATUS_OPCOES.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status de Pagamento */}
              {ordem.pago ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    PAGO (R$ {(ordem.valorTotal || 0).toFixed(2)} - {ordem.formaPagamentoRecebida?.toUpperCase() || 'PIX'})
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsReceberModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold transition-all shadow-sm"
                  title="Receber valor e alimentar o caixa"
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Receber Pagamento no Caixa (R$ {(ordem.valorTotal || 0).toFixed(2)})</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEditar(ordem);
                }}
                id="btn-modal-editar-os"
                className="text-xs"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Editar
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGerarPDF}
                id="btn-modal-gerar-pdf"
                className="text-xs border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300"
              >
                <FileDown className="w-3.5 h-3.5 mr-1" />
                Gerar PDF
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handlePrint}
                id="btn-modal-imprimir-os"
                className="text-xs bg-purple-700 hover:bg-purple-800 text-white font-bold"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Imprimir
              </Button>
            </div>
          </div>

          {/* Modelo Oficial Renderizado */}
          <div className="max-h-[75vh] overflow-y-auto p-1 bg-slate-950/40 rounded-xl border border-slate-800">
            <ModeloOficialOrdemServico ordem={ordem} />
          </div>
        </div>
      </Modal>

      {/* Modal de Pagamento & Entrada no Caixa */}
      <ReceberPagamentoOSModal
        isOpen={isReceberModalOpen}
        onClose={() => setIsReceberModalOpen(false)}
        ordem={ordem}
        onPagamentoRegistrado={(atualizada) => {
          onStatusAlterado(atualizada);
        }}
      />
    </>
  );
};
