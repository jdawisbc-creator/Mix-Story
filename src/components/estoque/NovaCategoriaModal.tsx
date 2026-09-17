import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';
import { EstoqueService } from '../../services/estoqueService';
import { Tag, Plus } from 'lucide-react';

interface NovaCategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriaCriada: (novaCategoria: string) => void;
}

export const NovaCategoriaModal: React.FC<NovaCategoriaModalProps> = ({
  isOpen,
  onClose,
  onCategoriaCriada,
}) => {
  const { success, error } = useToast();
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      error('Nome obrigatório', 'Digite o nome da nova categoria.');
      return;
    }

    try {
      setSalvando(true);
      const categoriaAdicionada = await EstoqueService.adicionarCategoria(nomeLimpo);
      success('Categoria criada', `Categoria "${categoriaAdicionada}" adicionada com sucesso.`);
      setNome('');
      onCategoriaCriada(categoriaAdicionada);
      onClose();
    } catch (err: any) {
      error('Erro ao criar categoria', err.message || 'Não foi possível salvar a categoria.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Categoria de Produto" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Crie uma nova categoria para organizar os produtos no estoque da Mix.
        </p>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Nome da Categoria *
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              id="input-nome-categoria"
              type="text"
              placeholder="Ex: Utilidades, Acessórios..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="pl-9"
              autoFocus
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={salvando} id="btn-salvar-categoria">
            <Plus className="w-4 h-4 mr-1.5" />
            {salvando ? 'Salvando...' : 'Salvar Categoria'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
