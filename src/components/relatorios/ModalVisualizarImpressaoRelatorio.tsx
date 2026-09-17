import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Printer, Download, X } from 'lucide-react';

interface ModalVisualizarImpressaoRelatorioProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  conteudo: React.ReactNode;
}

export const ModalVisualizarImpressaoRelatorio: React.FC<ModalVisualizarImpressaoRelatorioProps> = ({
  isOpen,
  onClose,
  titulo,
  conteudo,
}) => {
  const handleImprimir = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Visualização de Impressão — ${titulo}`}
      subtitle="Documento timbrado oficial Mix Variedades Store pronto para impressão física ou salvar como PDF"
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-zinc-400">
            Dica: Para gerar PDF, selecione a opção <span className="text-white font-medium">"Salvar como PDF"</span> na impressora do navegador.
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
            <Button
              variant="accent"
              icon={<Printer className="w-4 h-4" />}
              onClick={handleImprimir}
            >
              Imprimir / Gerar PDF
            </Button>
          </div>
        </div>
      }
    >
      <div className="max-h-[75vh] overflow-y-auto pr-1">
        <div className="printable-report-sheet shadow-2xl rounded-xl overflow-hidden border border-zinc-300">
          {conteudo}
        </div>
      </div>
    </Modal>
  );
};
