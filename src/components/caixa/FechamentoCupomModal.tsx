import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MixLogo } from '../brand/MixLogo';
import type { Caixa } from '../../types';
import { Printer, CheckCircle2, AlertTriangle, XCircle, Clock, User, Calendar } from 'lucide-react';

interface FechamentoCupomModalProps {
  isOpen: boolean;
  onClose: () => void;
  caixa: Caixa | null;
}

export const FechamentoCupomModal: React.FC<FechamentoCupomModalProps> = ({
  isOpen,
  onClose,
  caixa,
}) => {
  if (!caixa) return null;

  const handlePrint = () => {
    window.print();
  };

  const diferenca = caixa.diferenca || 0;
  const tipoDiferenca = caixa.tipoDiferenca || 'exato';

  const dataAbertura = caixa.abertoEm
    ? new Date(caixa.abertoEm).toLocaleDateString('pt-BR')
    : caixa.data;
  const horaAbertura = caixa.abertoEm
    ? new Date(caixa.abertoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const dataFechamento = caixa.fechadoEm
    ? new Date(caixa.fechadoEm).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  const horaFechamento = caixa.fechadoEm
    ? new Date(caixa.fechadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="RESUMO DE FECHAMENTO DE CAIXA (IMPRIMÍVEL)"
      size="lg"
    >
      <div className="space-y-5">
        {/* ÁREA IMPRIMÍVEL COM ESTILIZAÇÃO DE CUPOM / RELATÓRIO OFICIAL */}
        <div
          id="area-fechamento-imprimivel"
          className="p-6 rounded-2xl bg-white text-zinc-900 shadow-2xl border border-zinc-200 font-sans print:p-0 print:border-0 print:shadow-none print:m-0"
        >
          {/* Cabeçalho do Fechamento */}
          <div className="text-center pb-4 border-b-2 border-dashed border-zinc-300">
            <div className="flex justify-center mb-2">
              <MixLogo variant="full" size="md" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-700">
              MIX VARIEDADES STORE
            </p>
            <p className="text-[11px] text-zinc-500">
              CNPJ: 00.000.000/0001-00 — MIX GESTÃO
            </p>
            <h3 className="text-base font-black uppercase text-zinc-900 mt-2 tracking-wide">
              COMPROVANTE OFICIAL DE FECHAMENTO DE CAIXA
            </h3>
          </div>

          {/* Dados do Turno e Operador */}
          <div className="grid grid-cols-2 gap-2 py-3 border-b border-dashed border-zinc-300 text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Data do Caixa:</span>
              <strong className="text-zinc-800 font-mono text-xs">{caixa.data}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Operador Responsável:</span>
              <strong className="text-zinc-800 font-mono text-xs">{caixa.operadorNome}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Abertura:</span>
              <span className="text-zinc-700 font-mono text-xs">{dataAbertura} às {horaAbertura}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Fechamento:</span>
              <span className="text-zinc-700 font-mono text-xs">{dataFechamento} às {horaFechamento}</span>
            </div>
          </div>

          {/* Discriminação por Forma de Pagamento */}
          <div className="py-3 border-b border-dashed border-zinc-300 space-y-1.5 text-xs">
            <p className="text-[11px] font-black uppercase tracking-wider text-zinc-800 mb-2">
              1. RESUMO DE VENDAS POR FORMA DE PAGAMENTO
            </p>

            <div className="flex justify-between py-0.5">
              <span className="text-zinc-600">Vendas em Dinheiro:</span>
              <span className="font-mono font-bold text-zinc-900">
                R$ {(caixa.vendasDinheiro || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-0.5">
              <span className="text-zinc-600">Vendas em PIX:</span>
              <span className="font-mono font-bold text-zinc-900">
                R$ {(caixa.vendasPix || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-0.5">
              <span className="text-zinc-600">Vendas em Débito:</span>
              <span className="font-mono font-bold text-zinc-900">
                R$ {(caixa.vendasDebito || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-0.5">
              <span className="text-zinc-600">Vendas em Crédito:</span>
              <span className="font-mono font-bold text-zinc-900">
                R$ {(caixa.vendasCredito || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-0.5">
              <span className="text-zinc-600">Transferência Bancária:</span>
              <span className="font-mono font-bold text-zinc-900">
                R$ {(caixa.vendasTransferencia || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-0.5">
              <span className="text-zinc-600">Outros / Convênio:</span>
              <span className="font-mono font-bold text-zinc-900">
                R$ {(caixa.vendasOutros || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between pt-1.5 mt-1 border-t border-zinc-200 font-bold text-sm text-zinc-900">
              <span>TOTAL VENDIDO NO TURNO:</span>
              <span className="font-mono">R$ {(caixa.totalVendido || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Balanço Físico da Gaveta (Dinheiro) */}
          <div className="py-3 border-b border-dashed border-zinc-300 space-y-1.5 text-xs">
            <p className="text-[11px] font-black uppercase tracking-wider text-zinc-800 mb-2">
              2. CONFERÊNCIA FÍSICA DA GAVETA (ESPÉCIE)
            </p>

            <div className="flex justify-between py-0.5">
              <span className="text-zinc-600">(+) Troco Inicial de Abertura:</span>
              <span className="font-mono font-bold text-zinc-800">
                R$ {(caixa.saldoInicial || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-0.5">
              <span className="text-zinc-600">(+) Vendas em Dinheiro:</span>
              <span className="font-mono font-bold text-zinc-800">
                R$ {(caixa.vendasDinheiro || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-0.5">
              <span className="text-zinc-600">(+) Entradas Adicionais (Suprimentos):</span>
              <span className="font-mono font-bold text-zinc-800">
                R$ {(caixa.entradasAdicionais || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-0.5">
              <span className="text-zinc-600">(-) Saídas e Despesas (Sangrias):</span>
              <span className="font-mono font-bold text-rose-700">
                - R$ {(caixa.totalSaidas || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-1 px-2 rounded bg-zinc-100 font-bold text-xs mt-1">
              <span className="text-zinc-800">VALOR ESPERADO EM CAIXA:</span>
              <span className="font-mono text-zinc-900">
                R$ {(caixa.valorEsperadoCaixa || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-1 px-2 rounded bg-zinc-100 font-bold text-xs">
              <span className="text-zinc-800">VALOR CONTADO MANUALMENTE:</span>
              <span className="font-mono text-zinc-900">
                R$ {(caixa.valorContado ?? caixa.saldoFinalInformado ?? 0).toFixed(2)}
              </span>
            </div>

            {/* DIFERENÇA DESTACADA */}
            <div
              className={`flex justify-between py-2 px-3 rounded-lg font-black text-sm mt-2 border ${
                tipoDiferenca === 'exato'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : tipoDiferenca === 'falta'
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <span>
                {tipoDiferenca === 'exato' && 'DIFERENÇA: R$ 0,00 (CONFERÊNCIA EXATA)'}
                {tipoDiferenca === 'falta' && `FALTA: R$ ${diferenca.toFixed(2)}`}
                {tipoDiferenca === 'sobra' && `SOBRA: R$ ${diferenca.toFixed(2)}`}
              </span>
              <span className="font-mono">
                {tipoDiferenca === 'falta' ? '-' : tipoDiferenca === 'sobra' ? '+' : ''} R${' '}
                {diferenca.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Troco Retido e Observações */}
          <div className="py-3 border-b border-dashed border-zinc-300 space-y-1 text-xs">
            <div className="flex justify-between font-bold">
              <span className="text-zinc-700">Valor que permanecerá para troco:</span>
              <span className="font-mono text-zinc-900">
                R$ {(caixa.valorPermaneceraTroco || 0).toFixed(2)}
              </span>
            </div>

            {caixa.observacoes && (
              <p className="text-[11px] text-zinc-600 italic pt-1">
                <strong>Observações:</strong> {caixa.observacoes}
              </p>
            )}
          </div>

          {/* Campo de Assinatura */}
          <div className="pt-6 pb-2 text-center text-xs text-zinc-600">
            <div className="w-56 mx-auto border-b border-zinc-400 mb-1" />
            <p className="font-bold text-zinc-800">{caixa.operadorNome}</p>
            <p className="text-[10px] text-zinc-500">Operador / Conferente — Mix Variedades</p>
            <p className="text-[9px] text-zinc-400 mt-2">
              Registro autenticado e imutável pelo sistema de auditoria MIX GESTÃO
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-zinc-400">
            O fechamento foi gravado permanentemente na auditoria do sistema.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Fechar Janela
            </Button>
            <Button
              variant="accent"
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Imprimir Resumo
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
