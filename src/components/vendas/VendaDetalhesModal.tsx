import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MixLogo } from '../brand/MixLogo';
import type { Venda } from '../../types';
import { Printer, XCircle, CheckCircle2, User, Clock, Calendar, QrCode, Banknote, CreditCard, Send, Layers } from 'lucide-react';

interface VendaDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  venda: Venda | null;
  onSolicitarCancelamento?: (venda: Venda) => void;
}

export const VendaDetalhesModal: React.FC<VendaDetalhesModalProps> = ({
  isOpen,
  onClose,
  venda,
  onSolicitarCancelamento,
}) => {
  if (!venda) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCancelada = venda.status === 'cancelada';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`DETALHES DA VENDA #${venda.numero}`}
      size="md"
    >
      <div className="space-y-4">
        {/* CUPOM TÉRMICO NÃO FISCAL / RESUMO IMPRIMÍVEL */}
        <div
          id="area-cupom-venda"
          className="p-5 rounded-2xl bg-white text-zinc-900 border border-zinc-200 shadow-xl font-sans text-xs space-y-3 print:p-0 print:border-0 print:shadow-none print:m-0"
        >
          {/* Cabeçalho */}
          <div className="text-center pb-3 border-b-2 border-dashed border-zinc-300">
            <div className="flex justify-center mb-1.5">
              <MixLogo variant="full" size="sm" />
            </div>
            <p className="font-bold uppercase tracking-wider text-zinc-800">
              MIX VARIEDADES STORE
            </p>
            <p className="text-[10px] text-zinc-500">
              Comércio e Prestação de Serviços — MIX GESTÃO
            </p>
            <div className="mt-2 inline-block px-3 py-1 rounded bg-zinc-100 font-mono font-black text-zinc-900 text-sm">
              CUPOM DE VENDA #{venda.numero}
            </div>

            {isCancelada && (
              <div className="mt-2 py-1 px-3 rounded bg-rose-100 text-rose-800 font-bold uppercase text-[11px] border border-rose-300">
                VENDA CANCELADA
              </div>
            )}
          </div>

          {/* Dados Gerais da Venda */}
          <div className="grid grid-cols-2 gap-1.5 py-1 text-[11px] border-b border-dashed border-zinc-300">
            <div>
              <span className="text-zinc-500 block">Data / Hora:</span>
              <span className="font-bold text-zinc-800">
                {venda.data || new Date(venda.dataHora).toLocaleDateString('pt-BR')} às{' '}
                {venda.horario || new Date(venda.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Operador / Vendedor:</span>
              <span className="font-bold text-zinc-800">{venda.usuario || venda.vendedorNome || 'Jhonatan'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-zinc-500 block">Cliente:</span>
              <span className="font-bold text-zinc-800">{venda.clienteNome || 'Consumidor Final'}</span>
              {venda.clienteDocumento && (
                <span className="text-zinc-500 text-[10px]"> (Doc: {venda.clienteDocumento})</span>
              )}
            </div>
          </div>

          {/* Lista de Itens */}
          <div className="py-2 border-b border-dashed border-zinc-300 space-y-1.5">
            <p className="font-black text-[11px] uppercase tracking-wider text-zinc-700">
              ITENS DA VENDA
            </p>
            {venda.itens.map((item, idx) => (
              <div key={idx} className="flex justify-between py-0.5 text-xs">
                <div className="flex-1 pr-2">
                  <span className="font-bold text-zinc-800">
                    {item.quantidade}x {item.nome}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    (Unit: R$ {item.precoUnitario.toFixed(2)}
                    {item.tipoItem === 'servico' ? ' • Serviço' : ' • Produto'}
                    {item.desconto > 0 ? ` • Desc: R$ ${item.desconto.toFixed(2)}` : ''})
                  </span>
                </div>
                <span className="font-mono font-bold text-zinc-900">
                  R$ {item.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Totais e Pagamento */}
          <div className="py-2 border-b border-dashed border-zinc-300 space-y-1">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal:</span>
              <span className="font-mono">R$ {venda.subtotal.toFixed(2)}</span>
            </div>

            {venda.descontoTotal > 0 && (
              <div className="flex justify-between text-rose-700 font-bold">
                <span>Desconto Aplicado:</span>
                <span className="font-mono">- R$ {venda.descontoTotal.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-black text-sm text-zinc-900 pt-1 border-t border-zinc-200">
              <span>VALOR TOTAL:</span>
              <span className="font-mono text-base">R$ {venda.total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-[11px] text-zinc-700 pt-1">
              <span>Forma de Pagamento:</span>
              <span className="font-bold uppercase font-mono">
                {venda.formaPagamento.replace('_', ' ')}
              </span>
            </div>

            {venda.valorPago && (
              <div className="flex justify-between text-[11px] text-zinc-600">
                <span>Valor Recebido:</span>
                <span className="font-mono">R$ {venda.valorPago.toFixed(2)}</span>
              </div>
            )}

            {venda.trocoDevolvido !== undefined && venda.trocoDevolvido > 0 && (
              <div className="flex justify-between text-[11px] font-bold text-emerald-700">
                <span>Troco Devolvido:</span>
                <span className="font-mono">R$ {venda.trocoDevolvido.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Se Cancelada: Detalhes do Cancelamento */}
          {isCancelada && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-900 text-[11px] space-y-0.5">
              <p className="font-bold uppercase">Registro de Cancelamento:</p>
              <p>Cancelado por: <strong>{venda.canceladaPor || 'Operador'}</strong></p>
              {venda.canceladaEm && (
                <p>Data: <strong>{new Date(venda.canceladaEm).toLocaleString('pt-BR')}</strong></p>
              )}
              <p>Motivo: <em>{venda.motivoCancelamento || 'Não informado'}</em></p>
              <p className="text-[10px] text-rose-700 italic">
                * Produtos devolvidos ao estoque e caixa estornado automaticamente.
              </p>
            </div>
          )}

          {/* Rodapé */}
          <div className="text-center pt-2 text-[10px] text-zinc-500">
            <p>Obrigado pela preferência!</p>
            <p className="font-mono text-[9px] text-zinc-400 mt-1">
              ID da Transação: {venda.id}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {!isCancelada && onSolicitarCancelamento ? (
            <Button
              variant="danger"
              size="sm"
              icon={<XCircle className="w-4 h-4" />}
              onClick={() => onSolicitarCancelamento(venda)}
            >
              Cancelar Esta Venda
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Fechar
            </Button>
            <Button
              variant="accent"
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Imprimir Cupom
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
