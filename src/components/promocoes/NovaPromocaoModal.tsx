import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { EstoqueService } from '../../services/estoqueService';
import { PromocaoService } from '../../services/promocaoService';
import { AuditService } from '../../services/auditService';
import type { Produto, TipoPromocao } from '../../types';
import {
  Tag,
  Calendar,
  DollarSign,
  Package,
  Plus,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';

interface NovaPromocaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromocaoCriada: () => void;
}

export const NovaPromocaoModal: React.FC<NovaPromocaoModalProps> = ({
  isOpen,
  onClose,
  onPromocaoCriada,
}) => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('');
  const [tipoPromocao, setTipoPromocao] = useState<TipoPromocao>('preco_direto');

  // Campos Solicitados
  const hoje = new Date().toISOString().split('T')[0];
  const [precoPromocional, setPrecoPromocional] = useState('');
  const [dataInicial, setDataInicial] = useState(hoje);
  const [dataFinal, setDataFinal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      EstoqueService.getProdutos().then((prods) => {
        setProdutos(prods);
        if (prods.length > 0 && !produtoSelecionadoId) {
          setProdutoSelecionadoId(prods[0].id);
        }
      });
      // Data final padrão: 7 dias a partir de hoje
      const em7Dias = new Date();
      em7Dias.setDate(em7Dias.getDate() + 7);
      setDataFinal(em7Dias.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const produtoSelecionado = produtos.find((p) => p.id === produtoSelecionadoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!produtoSelecionado) {
      error('Selecione um produto', 'Escolha o produto que receberá o preço promocional.');
      return;
    }

    const valorPromo = Number(precoPromocional.replace(',', '.'));
    if (isNaN(valorPromo) || valorPromo <= 0) {
      error('Preço promocional inválido', 'Informe um valor promocional maior que zero.');
      return;
    }

    if (valorPromo >= produtoSelecionado.precoVenda) {
      warning(
        'Atenção ao preço',
        `O preço promocional (R$ ${valorPromo.toFixed(2)}) deve ser menor que o preço normal (R$ ${produtoSelecionado.precoVenda.toFixed(2)}).`
      );
    }

    if (!dataInicial || !dataFinal) {
      error('Datas obrigatórias', 'Informe a data inicial e final da promoção.');
      return;
    }

    if (dataFinal < dataInicial) {
      error('Datas inconsistentes', 'A data final não pode ser anterior à data inicial.');
      return;
    }

    try {
      setSalvando(true);
      const novaPromo = await PromocaoService.criarPromocao(
        {
          produtoId: produtoSelecionado.id,
          produtoNome: produtoSelecionado.nome,
          valorCusto: produtoSelecionado.precoCusto,
          precoNormal: produtoSelecionado.precoVenda,
          precoPromocional: valorPromo,
          dataInicial,
          dataFinal,
          descricao: descricao.trim() || `Promoção especial de ${produtoSelecionado.nome}`,
          tipoPromocao: 'preco_direto',
        },
        user?.name || 'Jhonatan'
      );

      if (user) {
        await AuditService.registrar({
          usuario: user.name,
          usuarioId: user.id,
          modulo: 'Promoções',
          tipoAcao: 'Criação',
          registroAfetado: produtoSelecionado.nome,
          informacaoAnterior: `Normal: R$ ${produtoSelecionado.precoVenda.toFixed(2)}`,
          informacaoNova: `Promocional: R$ ${valorPromo.toFixed(2)} | Vigência: ${dataInicial} a ${dataFinal}`,
          descricao: `Promoção criada para "${produtoSelecionado.nome}". Status inicial: ${novaPromo.status.toUpperCase()}.`,
        });
      }

      success(
        'Promoção criada',
        `Promoção para "${produtoSelecionado.nome}" registrada (${novaPromo.status === 'ativa' ? 'Ativada no estoque' : 'Agendada'}).`
      );

      setPrecoPromocional('');
      setDescricao('');
      onPromocaoCriada();
      onClose();
    } catch (err: any) {
      error('Erro ao salvar', err.message || 'Falha ao registrar a promoção.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Promoção Integrada ao Estoque" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Seletor de Tipo de Promoção (Preparado para Tipos Futuros) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Tipo de Promoção
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setTipoPromocao('preco_direto')}
              className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                tipoPromocao === 'preco_direto'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-800 dark:text-primary-300 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                Preço Direto
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Versão Atual</div>
            </button>

            <button
              type="button"
              disabled
              className="p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-left text-xs opacity-60 cursor-not-allowed"
            >
              <div className="font-semibold text-slate-600 dark:text-slate-400">Desconto %</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Em breve</div>
            </button>

            <button
              type="button"
              disabled
              className="p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-left text-xs opacity-60 cursor-not-allowed"
            >
              <div className="font-semibold text-slate-600 dark:text-slate-400">Combo</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Em breve</div>
            </button>

            <button
              type="button"
              disabled
              className="p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-left text-xs opacity-60 cursor-not-allowed"
            >
              <div className="font-semibold text-slate-600 dark:text-slate-400">Leve X por Y</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Em breve</div>
            </button>
          </div>
        </div>

        {/* Seleção de Produto */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Produto do Estoque *
          </label>
          <div className="relative">
            <Package className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <select
              id="select-produto-promocao"
              value={produtoSelecionadoId}
              onChange={(e) => setProdutoSelecionadoId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              required
            >
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — [{p.categoria}] (Preço Normal: R$ {p.precoVenda.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumo Integrado: Custo, Preço Normal e Preço Promocional */}
        {produtoSelecionado && (
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Valor de Custo (Estoque):
              </span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                R$ {produtoSelecionado.precoCusto.toFixed(2)}
              </span>
            </div>

            <div>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Preço Normal de Venda:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                R$ {produtoSelecionado.precoVenda.toFixed(2)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                Preço Promocional Direto (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-emerald-500">R$</span>
                <Input
                  id="input-preco-promocional"
                  type="text"
                  placeholder="0,00"
                  value={precoPromocional}
                  onChange={(e) => setPrecoPromocional(e.target.value)}
                  className="pl-9 font-bold text-emerald-600 dark:text-emerald-400"
                  autoFocus
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Período de Vigência: Data Inicial e Data Final */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Data Inicial da Promoção *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="input-data-inicial"
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                className="pl-9"
                required
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Ao chegar nesta data, o preço promocional será ativado automaticamente.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Data Final da Promoção *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="input-data-final"
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                className="pl-9"
                required
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Ao passar desta data, o preço normal será restaurado automaticamente.
            </span>
          </div>
        </div>

        {/* Descrição da Promoção */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Descrição da Promoção *
          </label>
          <textarea
            id="textarea-descricao-promocao"
            rows={2}
            placeholder="Ex: Oferta da semana, queima de estoque ou campanha de primavera..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        {/* Aviso de Automação */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          <span>
            <strong>Automação Inteligente:</strong> Se a data inicial for hoje ({hoje}), a promoção
            será marcada como <strong>Ativa</strong> e o preço de venda no estoque será atualizado
            imediatamente. Se for uma data futura, ela ficará <strong>Agendada</strong> até o dia de
            início.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={salvando} id="btn-salvar-promocao">
            <Plus className="w-4 h-4 mr-1.5" />
            {salvando ? 'Salvando...' : 'Salvar Promoção'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
