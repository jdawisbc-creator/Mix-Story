import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { MixLogo } from '../brand/MixLogo';
import { GastoService } from '../../services/gastoService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { SaidaGasto } from '../../types';
import {
  Printer,
  Trash2,
  Building2,
  PackagePlus,
  AlertTriangle,
  Calendar,
  DollarSign,
  User,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface SaidaDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  saida: SaidaGasto | null;
  onSaidaExcluida: () => void;
}

export const SaidaDetalhesModal: React.FC<SaidaDetalhesModalProps> = ({
  isOpen,
  onClose,
  saida,
  onSaidaExcluida,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [modoExclusao, setModoExclusao] = useState(false);
  const [motivoExclusao, setMotivoExclusao] = useState('');
  const [loading, setLoading] = useState(false);

  if (!saida) return null;

  const isCompraRevenda = saida.tipo === 'compra_revenda';

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmarExclusao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoExclusao.trim()) {
      error('Motivo obrigatório', 'Informe a justificativa para excluir este registro.');
      return;
    }

    if (!user) return;

    try {
      setLoading(true);
      await GastoService.excluirSaida(
        saida,
        { id: user.id, name: user.name },
        motivoExclusao.trim()
      );

      success('Saída Excluída', `O lançamento "${saida.descricao}" foi removido e auditado.`);
      setModoExclusao(false);
      setMotivoExclusao('');
      onSaidaExcluida();
      onClose();
    } catch (err: any) {
      error('Erro ao excluir', err?.message || 'Falha ao excluir registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setModoExclusao(false);
        onClose();
      }}
      title={
        isCompraRevenda
          ? 'DETALHES DA COMPRA PARA REVENDA'
          : 'DETALHES DA DESPESA OPERACIONAL'
      }
      size="md"
    >
      <div className="space-y-4">
        {/* COMPROVANTE IMPRIMÍVEL */}
        <div className="p-5 rounded-2xl bg-white text-zinc-900 border border-zinc-200 shadow-xl text-xs space-y-3 font-sans print:p-0 print:border-0 print:shadow-none">
          {/* Cabeçalho */}
          <div className="text-center pb-3 border-b-2 border-dashed border-zinc-300">
            <div className="flex justify-center mb-1">
              <MixLogo variant="full" size="sm" />
            </div>
            <p className="font-bold uppercase tracking-wider text-zinc-800">
              MIX VARIEDADES STORE
            </p>
            <p className="text-[10px] text-zinc-500">
              Controle Financeiro & Gestão de Estoque
            </p>
            <div className="mt-2 inline-block px-3 py-1 rounded bg-zinc-100 font-mono font-black text-zinc-900 text-xs">
              {isCompraRevenda ? 'COMPRA PARA REVENDA / ENTRADA ESTOQUE' : 'COMPROVANTE DE DESPESA'}
            </div>
          </div>

          {/* Dados Gerais */}
          <div className="space-y-1.5 py-1 text-[11px] border-b border-dashed border-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-500">Tipo:</span>
              <span className="font-bold uppercase text-zinc-800">
                {isCompraRevenda ? 'Compra para Revenda' : 'Despesa Operacional'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Data do Lançamento:</span>
              <span className="font-mono font-bold text-zinc-800">
                {new Date(saida.data + 'T12:00:00Z').toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Responsável:</span>
              <span className="font-bold text-zinc-800">{saida.usuarioNome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Forma de Pagamento:</span>
              <span className="font-mono uppercase font-bold text-zinc-800">
                {saida.formaPagamento}
              </span>
            </div>
            {saida.fornecedorOuFavorecido && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Fornecedor / Favorecido:</span>
                <span className="font-bold text-zinc-800">{saida.fornecedorOuFavorecido}</span>
              </div>
            )}
          </div>

          {/* Se Compra para Revenda: Detalhamento do Estoque e Projeção */}
          {isCompraRevenda ? (
            <div className="py-2 border-b border-dashed border-zinc-300 space-y-2">
              <p className="font-black text-[11px] uppercase tracking-wider text-purple-950">
                VÍNCULO COM O ESTOQUE & MERCADORIA
              </p>
              <div className="p-2.5 rounded bg-purple-50 border border-purple-200 text-purple-900 space-y-1">
                <div className="flex justify-between">
                  <span>Produto:</span>
                  <span className="font-bold">{saida.produtoNome}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantidade Adicionada:</span>
                  <span className="font-mono font-bold">{saida.quantidade} unidades</span>
                </div>
                <div className="flex justify-between">
                  <span>Custo Unitário:</span>
                  <span className="font-mono font-bold">
                    R$ {saida.custoUnitario?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Preço Previsto de Venda:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    R$ {saida.precoPrevistoVenda?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-purple-200">
                  <span>Receita Potencial Estimada:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    R$ {saida.receitaPotencial?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lucro Bruto Projetado:</span>
                  <span className="font-mono font-bold text-purple-700">
                    + R$ {saida.lucroProjetado?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2 border-b border-dashed border-zinc-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Descrição:</span>
                <span className="font-bold text-zinc-800">{saida.descricao}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Categoria:</span>
                <span className="font-bold uppercase text-zinc-800">{saida.categoria}</span>
              </div>
            </div>
          )}

          {/* Total Financeiro Saído */}
          <div className="py-2 border-b border-dashed border-zinc-300 flex justify-between items-center text-sm font-black">
            <span className="text-zinc-800">TOTAL DA SAÍDA FINANCEIRA:</span>
            <span className="font-mono text-base text-rose-700">
              - R$ {saida.valor.toFixed(2)}
            </span>
          </div>

          {saida.observacao && (
            <div className="text-[11px] text-zinc-600 italic">
              Obs: {saida.observacao}
            </div>
          )}

          <div className="text-center pt-2 text-[10px] text-zinc-400">
            Registro ID: {saida.id} • Mix Variedades Store
          </div>
        </div>

        {/* MODO EXCLUSÃO COM AUDITORIA */}
        {modoExclusao ? (
          <form onSubmit={handleConfirmarExclusao} className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold uppercase text-rose-300">
                  Atenção ao excluir saída financeira:
                </strong>
                {isCompraRevenda && (
                  <p className="mt-0.5">
                    As {saida.quantidade} unidades adicionadas ao produto <strong>{saida.produtoNome}</strong> serão estornadas do estoque.
                  </p>
                )}
                A exclusão será registrada na auditoria sob o nome de <strong>{user?.name}</strong>.
              </div>
            </div>

            <Input
              label="Justificativa / Motivo da Exclusão *"
              placeholder="Ex: Lançamento duplicado ou erro de digitação de valores"
              value={motivoExclusao}
              onChange={(e) => setMotivoExclusao(e.target.value)}
              required
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setModoExclusao(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                disabled={loading}
              >
                {loading ? 'Excluindo...' : 'Confirmar Exclusão e Estorno'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => setModoExclusao(true)}
            >
              Excluir Saída
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onClose}>
                Fechar
              </Button>
              <Button
                variant="accent"
                icon={<Printer className="w-4 h-4" />}
                onClick={handlePrint}
              >
                Imprimir Comprovante
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
