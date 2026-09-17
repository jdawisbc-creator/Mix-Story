import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { OrdemServicoService } from '../../services/ordemServicoService';
import type { OrdemServico, ItemOrdemServico, StatusOSMix, AprovacaoClienteOS } from '../../types';
import {
  Plus,
  Trash2,
  Printer,
  Save,
  User,
  Phone,
  Calendar,
  Settings,
  CreditCard,
  ShieldCheck,
  FileText,
  DollarSign,
  AlertCircle,
  Hash,
} from 'lucide-react';

interface FormularioOrdemModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordemParaEditar: OrdemServico | null;
  onOrdemSalva: (ordem: OrdemServico, imprimirAposSalvar: boolean) => void;
}

const OPCOES_PAGAMENTO = [
  'Pix',
  'Cartão de Crédito',
  'Dinheiro',
  'Transferência',
  'Cartão de Débito',
  'Outros',
];

const OPCOES_APROVACAO: AprovacaoClienteOS[] = ['SIM', 'NÃO', 'SEM APROVAÇÃO'];

const STATUS_ORDEM: { id: StatusOSMix; label: string; cor: string }[] = [
  { id: 'aguardando_aprovacao', label: 'Aguardando aprovação', cor: 'text-amber-500' },
  { id: 'aprovada', label: 'Aprovada', cor: 'text-blue-500' },
  { id: 'em_producao', label: 'Em produção', cor: 'text-purple-500' },
  { id: 'pronta', label: 'Pronta', cor: 'text-emerald-500' },
  { id: 'entregue', label: 'Entregue', cor: 'text-teal-500' },
  { id: 'cancelada', label: 'Cancelada', cor: 'text-rose-500' },
];

export const FormularioOrdemModal: React.FC<FormularioOrdemModalProps> = ({
  isOpen,
  onClose,
  ordemParaEditar,
  onOrdemSalva,
}) => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [numeroOSPreview, setNumeroOSPreview] = useState('OS #....');
  const [salvando, setSalvando] = useState(false);

  // Campos do formulário
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [dataEntrada, setDataEntrada] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [itens, setItens] = useState<ItemOrdemServico[]>([
    { item: 1, descricao: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 },
  ]);
  const [formasPagamento, setFormasPagamento] = useState<string[]>(['Pix']);
  const [outrosPagamento, setOutrosPagamento] = useState('');
  const [aprovacaoCliente, setAprovacaoCliente] = useState<AprovacaoClienteOS>('SIM');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<StatusOSMix>('aguardando_aprovacao');

  // Inicializar estado ao abrir
  useEffect(() => {
    if (!isOpen) return;

    if (ordemParaEditar) {
      setNumeroOSPreview(ordemParaEditar.numeroOS);
      setClienteNome(ordemParaEditar.clienteNome);
      setClienteTelefone(ordemParaEditar.clienteTelefone);
      setDataEntrada(ordemParaEditar.dataEntrada);
      setDataEntrega(ordemParaEditar.dataEntrega);
      setItens(
        ordemParaEditar.itens?.length > 0
          ? ordemParaEditar.itens
          : [{ item: 1, descricao: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]
      );
      setFormasPagamento(ordemParaEditar.formasPagamento || ['Pix']);
      setOutrosPagamento(ordemParaEditar.outrosPagamento || '');
      setAprovacaoCliente(ordemParaEditar.aprovacaoCliente || 'SIM');
      setObservacoes(ordemParaEditar.observacoes || '');
      setStatus(ordemParaEditar.status || 'aguardando_aprovacao');
    } else {
      // Criação nova: obter próximo número
      const hoje = new Date().toISOString().split('T')[0];
      const em2Dias = new Date();
      em2Dias.setDate(em2Dias.getDate() + 2);
      const entregaPadrao = em2Dias.toISOString().split('T')[0];

      setDataEntrada(hoje);
      setDataEntrega(entregaPadrao);
      setClienteNome('');
      setClienteTelefone('');
      setItens([{ item: 1, descricao: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]);
      setFormasPagamento(['Pix']);
      setOutrosPagamento('');
      setAprovacaoCliente('SIM');
      setObservacoes('');
      setStatus('aguardando_aprovacao');

      OrdemServicoService.getProximoNumero().then((info) => {
        setNumeroOSPreview(info.numeroOS);
      });
    }
  }, [isOpen, ordemParaEditar]);

  // Gestão de Itens da Tabela Dinâmica
  const handleItemChange = (
    index: number,
    field: 'descricao' | 'quantidade' | 'valorUnitario',
    val: string
  ) => {
    setItens((prev) => {
      const novos = [...prev];
      const it = { ...novos[index] };

      if (field === 'descricao') {
        it.descricao = val;
      } else if (field === 'quantidade') {
        const q = parseFloat(val) || 0;
        it.quantidade = q;
        it.valorTotal = q * (it.valorUnitario || 0);
      } else if (field === 'valorUnitario') {
        const v = parseFloat(val.replace(',', '.')) || 0;
        it.valorUnitario = v;
        it.valorTotal = (it.quantidade || 1) * v;
      }

      novos[index] = it;
      return novos;
    });
  };

  const handleAdicionarItem = () => {
    setItens((prev) => [
      ...prev,
      {
        item: prev.length + 1,
        descricao: '',
        quantidade: 1,
        valorUnitario: 0,
        valorTotal: 0,
      },
    ]);
  };

  const handleRemoverItem = (index: number) => {
    if (itens.length <= 1) {
      setItens([{ item: 1, descricao: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]);
      return;
    }
    setItens((prev) => {
      const filtrados = prev.filter((_, i) => i !== index);
      return filtrados.map((item, idx) => ({
        ...item,
        item: idx + 1,
      }));
    });
  };

  // Alternar Forma de Pagamento
  const toggleFormaPagamento = (forma: string) => {
    setFormasPagamento((prev) => {
      if (prev.includes(forma)) {
        return prev.length > 1 ? prev.filter((f) => f !== forma) : prev;
      } else {
        return [...prev, forma];
      }
    });
  };

  // Cálculo total geral da OS
  const valorTotalGeral = itens.reduce(
    (acc, it) => acc + (it.quantidade || 0) * (it.valorUnitario || 0),
    0
  );

  // Salvar Ordem (Normal ou Salvar e Imprimir)
  const handleSalvar = async (imprimirAposSalvar: boolean = false) => {
    if (!clienteNome.trim()) {
      error('Nome obrigatório', 'Informe o nome do cliente.');
      return;
    }

    const itensValidos = itens.filter((it) => it.descricao.trim().length > 0);
    if (itensValidos.length === 0) {
      error('Itens obrigatórios', 'Adicione pelo menos 1 serviço com descrição.');
      return;
    }

    try {
      setSalvando(true);
      const salva = await OrdemServicoService.salvarOrdem(
        {
          id: ordemParaEditar?.id,
          clienteNome: clienteNome.trim(),
          clienteTelefone: clienteTelefone.trim(),
          dataEntrada,
          dataEntrega,
          itens: itensValidos,
          formasPagamento,
          outrosPagamento: formasPagamento.includes('Outros') ? outrosPagamento.trim() : '',
          aprovacaoCliente,
          observacoes: observacoes.trim(),
          status,
        },
        user?.name || 'Jhonatan',
        user?.id
      );

      success(
        ordemParaEditar ? 'Ordem atualizada' : 'Ordem de Serviço criada',
        `${salva.numeroOS} registrada com sucesso.`
      );

      onOrdemSalva(salva, imprimirAposSalvar);
      onClose();
    } catch (err: any) {
      error('Erro ao salvar', err.message || 'Falha ao processar ordem de serviço.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ordemParaEditar ? `Editar ${ordemParaEditar.numeroOS}` : 'Nova Ordem de Serviço'}
      size="xl"
    >
      <div className="space-y-5 text-slate-800 dark:text-slate-100 max-h-[78vh] overflow-y-auto pr-1">
        {/* Banner do Número Sequencial Oficial */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950 via-black to-purple-950 border border-purple-600/70 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/60 flex items-center justify-center text-purple-300">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                Mix Variedades Store • Modelo Oficial
              </div>
              <div className="text-xs text-slate-400">
                {ordemParaEditar
                  ? 'Editando dados da ordem'
                  : 'Número automático sequencial exclusivo (nunca se repete)'}
              </div>
            </div>
          </div>

          <div className="px-3.5 py-1 rounded-lg bg-black border border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)] text-right">
            <span className="font-mono font-black text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
              {numeroOSPreview}
            </span>
          </div>
        </div>

        {/* 1. Dados do Cliente e Datas */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Dados do Cliente */}
          <div className="md:col-span-7 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
              <User className="w-4 h-4" />
              <span>Dados do Cliente</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do cliente *
              </label>
              <Input
                id="input-cliente-nome"
                type="text"
                placeholder="Ex: Mariana Silveira"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Telefone (WhatsApp) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  id="input-cliente-telefone"
                  type="text"
                  placeholder="(11) 98452-1100"
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Datas da Ordem */}
          <div className="md:col-span-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
              <Calendar className="w-4 h-4" />
              <span>Datas</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data de entrada *
              </label>
              <Input
                id="input-data-entrada"
                type="date"
                value={dataEntrada}
                onChange={(e) => setDataEntrada(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data de entrega do pedido *
              </label>
              <Input
                id="input-data-entrega"
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* 2. Serviços / Itens (Tabela Dinâmica) */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
              <Settings className="w-4 h-4" />
              <span>Serviços / Itens da Ordem</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdicionarItem}
              id="btn-adicionar-item-os"
              className="text-xs border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Adicionar Item
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-purple-950 text-white font-semibold">
                <tr>
                  <th className="py-2 px-2 text-center w-12">Item</th>
                  <th className="py-2 px-3">Descrição do serviço *</th>
                  <th className="py-2 px-2 text-center w-20">Qtd.</th>
                  <th className="py-2 px-2 text-right w-28">Valor Unit. (R$)</th>
                  <th className="py-2 px-3 text-right w-28">Valor Total</th>
                  <th className="py-2 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950/60">
                {itens.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-500">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        placeholder="Ex: Impressão A4 colorida, Brinde 3D..."
                        value={it.descricao}
                        onChange={(e) => handleItemChange(idx, 'descricao', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium focus:ring-1 focus:ring-purple-500 outline-none"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={it.quantidade}
                        onChange={(e) => handleItemChange(idx, 'quantidade', e.target.value)}
                        className="w-full px-2 py-1 text-center font-mono text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-purple-500 outline-none"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.valorUnitario || ''}
                        onChange={(e) => handleItemChange(idx, 'valorUnitario', e.target.value)}
                        placeholder="0,00"
                        className="w-full px-2 py-1 text-right font-mono text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-purple-500 outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      R$ {((it.quantidade || 0) * (it.valorUnitario || 0)).toFixed(2)}
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoverItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Destaque do Cálculo Automático */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-900/10 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
              Cálculo Automático dos Serviços
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase">
                VALOR TOTAL DA ORDEM DE SERVIÇO:
              </span>
              <span className="px-3 py-1 rounded bg-black text-amber-300 font-mono font-black text-base border border-amber-500/50 shadow-sm">
                R$ {valorTotalGeral.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Formas de Pagamento e Aprovação */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Formas de Pagamento */}
          <div className="md:col-span-7 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
              <CreditCard className="w-4 h-4" />
              <span>Formas de Pagamento (Multi-seleção)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {OPCOES_PAGAMENTO.map((forma) => {
                const isSelected = formasPagamento.includes(forma);
                return (
                  <label
                    key={forma}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFormaPagamento(forma)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                    />
                    <span>{forma}</span>
                  </label>
                );
              })}
            </div>

            {formasPagamento.includes('Outros') && (
              <div className="pt-1">
                <Input
                  type="text"
                  placeholder="Especifique a outra forma de pagamento..."
                  value={outrosPagamento}
                  onChange={(e) => setOutrosPagamento(e.target.value)}
                  className="text-xs"
                />
              </div>
            )}
          </div>

          {/* Aprovação do Cliente */}
          <div className="md:col-span-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              <span>Aprovação do Cliente (Seleção Única)</span>
            </div>

            <div className="space-y-1.5">
              {OPCOES_APROVACAO.map((opcao) => (
                <label
                  key={opcao}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                    aprovacaoCliente === opcao
                      ? opcao === 'SIM'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold'
                        : opcao === 'NÃO'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 font-bold'
                        : 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="aprovacaoCliente"
                    value={opcao}
                    checked={aprovacaoCliente === opcao}
                    onChange={() => setAprovacaoCliente(opcao)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>{opcao}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Observações e Status Interno */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Observações */}
          <div className="md:col-span-8 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
              <FileText className="w-4 h-4" />
              <span>Observações da Ordem</span>
            </div>
            <textarea
              id="textarea-observacoes-os"
              rows={3}
              placeholder="Instruções de acabamento, detalhes da arte, especificações do cliente..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none leading-relaxed"
            />
          </div>

          {/* Status Interno da Ordem */}
          <div className="md:col-span-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
              <AlertCircle className="w-4 h-4" />
              <span>Status Interno da Ordem</span>
            </div>

            <select
              id="select-status-os"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusOSMix)}
              className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              {STATUS_ORDEM.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>

            <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
              O status controla o fluxo operacional no painel da Mix Variedades.
            </span>
          </div>
        </div>

        {/* Botões de Ação Exigidos: [SALVAR ORDEM] [SALVAR E IMPRIMIR] */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleSalvar(false)}
            disabled={salvando}
            id="btn-salvar-ordem"
            className="border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {salvando ? 'Salvando...' : 'Salvar Ordem'}
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => handleSalvar(true)}
            disabled={salvando}
            id="btn-salvar-e-imprimir"
            className="bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-800 hover:to-fuchsia-700 text-white font-bold shadow-md shadow-purple-900/30"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Salvar e Imprimir
          </Button>
        </div>
      </div>
    </Modal>
  );
};
