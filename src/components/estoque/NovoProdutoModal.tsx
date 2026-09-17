import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { EstoqueService } from '../../services/estoqueService';
import { AuditService } from '../../services/auditService';
import {
  Package,
  Camera,
  Upload,
  X,
  Plus,
  Calendar,
  DollarSign,
  Tag,
  FileText,
} from 'lucide-react';

interface NovoProdutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: string[];
  onProdutoCadastrado: () => void;
  onAbrirNovaCategoria: () => void;
}

export const NovoProdutoModal: React.FC<NovoProdutoModalProps> = ({
  isOpen,
  onClose,
  categorias,
  onProdutoCadastrado,
  onAbrirNovaCategoria,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const hoje = new Date().toISOString().split('T')[0];

  // Campos EXCLUSIVOS solicitados pelo usuário
  const [nome, setNome] = useState('');
  const [foto, setFoto] = useState('');
  const [categoria, setCategoria] = useState(categorias[0] || 'Outros');
  const [quantidade, setQuantidade] = useState('1');
  const [precoCusto, setPrecoCusto] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [dataEntrada, setDataEntrada] = useState(hoje);
  const [observacoes, setObservacoes] = useState('');

  const [salvando, setSalvando] = useState(false);

  // Manipulador de imagem por arquivo
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        error('Arquivo grande', 'A foto deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      error('Campo obrigatório', 'Informe o nome do produto.');
      return;
    }

    const valorVenda = Number(precoVenda.replace(',', '.'));
    if (isNaN(valorVenda) || valorVenda <= 0) {
      error('Preço inválido', 'Informe um valor normal de venda válido.');
      return;
    }

    const valorCusto = Number(precoCusto.replace(',', '.')) || 0;
    const qtd = Math.max(0, parseInt(quantidade, 10) || 0);

    try {
      setSalvando(true);
      const novoProduto = await EstoqueService.cadastrarProduto(
        {
          nome: nome.trim(),
          foto: foto.trim() || undefined,
          categoria,
          quantidade: qtd,
          precoCusto: valorCusto,
          precoVenda: valorVenda,
          dataEntrada: dataEntrada || hoje,
          observacoes: observacoes.trim() || undefined,
        },
        user?.name || 'Jhonatan'
      );

      // Auditoria
      if (user) {
        await AuditService.registrar({
          usuario: user.name,
          usuarioId: user.id,
          modulo: 'Estoque',
          tipoAcao: 'Criação',
          registroAfetado: novoProduto.nome,
          informacaoAnterior: 'Inexistente no estoque',
          informacaoNova: `${novoProduto.quantidade} un | Custo: R$ ${novoProduto.precoCusto.toFixed(2)} | Venda: R$ ${novoProduto.precoVenda.toFixed(2)}`,
          descricao: `Produto "${novoProduto.nome}" cadastrado com estoque inicial de ${novoProduto.quantidade} un.`,
        });
      }

      success('Produto cadastrado', `"${novoProduto.nome}" foi adicionado ao estoque.`);
      
      // Limpa formulário
      setNome('');
      setFoto('');
      setQuantidade('1');
      setPrecoCusto('');
      setPrecoVenda('');
      setDataEntrada(hoje);
      setObservacoes('');

      onProdutoCadastrado();
      onClose();
    } catch (err: any) {
      error('Erro ao cadastrar', err.message || 'Ocorreu um erro ao salvar o produto.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Produto no Estoque" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome do Produto */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Nome do Produto *
          </label>
          <div className="relative">
            <Package className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              id="input-nome-produto"
              type="text"
              placeholder="Ex: Perfume Floratta Gold 75ml"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="pl-9"
              autoFocus
              required
            />
          </div>
        </div>

        {/* Foto Opcional */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Foto do Produto (Opcional)
          </label>
          <div className="flex items-center gap-3">
            {foto ? (
              <div className="relative w-16 h-16 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                <img src={foto} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFoto('')}
                  className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded-full hover:bg-rose-700"
                  title="Remover foto"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0 bg-slate-50 dark:bg-slate-900/50">
                <Camera className="w-6 h-6 stroke-1" />
              </div>
            )}

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Carregar do Computador
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-400">ou cole uma URL:</span>
              </div>
              <Input
                type="url"
                placeholder="https://exemplo.com/foto.jpg"
                value={foto}
                onChange={(e) => setFoto(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* Categoria e Criação de Nova Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Categoria *
              </label>
              <button
                type="button"
                onClick={onAbrirNovaCategoria}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Nova Categoria
              </button>
            </div>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                id="select-categoria-produto"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantidade Inicial */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Quantidade Inicial *
            </label>
            <Input
              id="input-quantidade-produto"
              type="number"
              min="0"
              step="1"
              placeholder="Ex: 10"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Valores e Data de Entrada */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Valor de Custo Unitário (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">R$</span>
              <Input
                id="input-custo-produto"
                type="text"
                placeholder="0,00"
                value={precoCusto}
                onChange={(e) => setPrecoCusto(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Valor Normal de Venda (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-emerald-500 font-semibold">R$</span>
              <Input
                id="input-venda-produto"
                type="text"
                placeholder="0,00"
                value={precoVenda}
                onChange={(e) => setPrecoVenda(e.target.value)}
                className="pl-9 font-medium text-emerald-600 dark:text-emerald-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Data de Entrada *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="input-data-entrada"
                type="date"
                value={dataEntrada}
                onChange={(e) => setDataEntrada(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Observações (Opcional)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <textarea
              id="textarea-observacoes-produto"
              rows={2}
              placeholder="Detalhes adicionais, fornecedor, características..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={salvando} id="btn-cadastrar-produto">
            <Plus className="w-4 h-4 mr-1.5" />
            {salvando ? 'Salvando...' : 'Cadastrar Produto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
