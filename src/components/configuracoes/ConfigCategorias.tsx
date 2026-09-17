import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { EstoqueService } from '../../services/estoqueService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { CategoriaProduto } from '../../types';
import {
  Tag,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Package,
  Search,
  AlertCircle,
  Layers,
} from 'lucide-react';

export const ConfigCategorias: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoriaParaEditar, setCategoriaParaEditar] = useState<CategoriaProduto | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregarCategorias = async () => {
    setCarregando(true);
    try {
      const lista = await EstoqueService.getCategoriasDetalhadas();
      setCategorias(lista);
    } catch (err: any) {
      error('Erro', 'Não foi possível carregar as categorias de estoque.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarCategorias();
  }, []);

  const abrirModalCriacao = () => {
    setCategoriaParaEditar(null);
    setNome('');
    setDescricao('');
    setIsModalOpen(true);
  };

  const abrirModalEdicao = (cat: CategoriaProduto) => {
    setCategoriaParaEditar(cat);
    setNome(cat.nome);
    setDescricao(cat.descricao || '');
    setIsModalOpen(true);
  };

  const handleSalvarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      warning('Nome obrigatório', 'Informe o nome da categoria.');
      return;
    }

    if (!user) {
      error('Autenticação necessária', 'Faça login para gerenciar categorias.');
      return;
    }

    setSalvando(true);
    try {
      if (categoriaParaEditar) {
        await EstoqueService.editarCategoria(
          categoriaParaEditar.id,
          nome.trim(),
          descricao.trim()
        );
        success(
          'Categoria Atualizada',
          `"${nome.trim()}" foi atualizada e os produtos vinculados foram sincronizados.`
        );
      } else {
        await EstoqueService.criarCategoria(
          nome.trim(),
          descricao.trim()
        );
        success('Categoria Criada', `A categoria "${nome.trim()}" foi adicionada ao catálogo.`);
      }

      setIsModalOpen(false);
      carregarCategorias();
    } catch (err: any) {
      error('Erro ao salvar', err?.message || 'Falha ao processar categoria.');
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleStatus = async (cat: CategoriaProduto) => {
    if (!user) return;
    try {
      const novoStatus = !cat.ativa;
      const nova = await EstoqueService.toggleCategoriaStatus(cat.id, novoStatus);
      success(
        nova.ativa ? 'Categoria Ativada' : 'Categoria Desativada',
        `A categoria "${nova.nome}" está agora ${nova.ativa ? 'ativa' : 'desativada'}.`
      );
      carregarCategorias();
    } catch (err: any) {
      error('Erro ao alterar status', err?.message);
    }
  };

  const categoriasFiltradas = categorias.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.descricao && c.descricao.toLowerCase().includes(busca.toLowerCase()))
  );

  const totalAtivas = categorias.filter((c) => c.ativa).length;

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#FF8A00]" />
              <span>GERENCIAMENTO DE CATEGORIAS DO ESTOQUE</span>
            </div>
          }
          subtitle="Crie, edite ou desative categorias. Ao renomear, os produtos vinculados são atualizados automaticamente com auditoria."
          action={
            <Button
              variant="accent"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={abrirModalCriacao}
            >
              Nova Categoria
            </Button>
          }
        />
        <CardBody className="space-y-4">
          {/* Barra de Filtro e Métricas */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Buscar categoria..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                icon={<Search className="w-4 h-4 text-zinc-400" />}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Total: <strong className="text-white">{categorias.length}</strong></span>
              <span>•</span>
              <span>Ativas: <strong className="text-emerald-400">{totalAtivas}</strong></span>
              <span>•</span>
              <span>Desativadas: <strong className="text-zinc-400">{categorias.length - totalAtivas}</strong></span>
            </div>
          </div>

          {/* Tabela de Categorias */}
          <div className="overflow-x-auto rounded-xl border border-[#222230]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#181824] border-b border-[#222230] text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Nome da Categoria</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4 text-center">Produtos Vinculados</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F2C]">
                {carregando ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Carregando categorias...
                    </td>
                  </tr>
                ) : categoriasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Nenhuma categoria encontrada.
                    </td>
                  </tr>
                ) : (
                  categoriasFiltradas.map((cat) => (
                    <tr
                      key={cat.id}
                      className={`hover:bg-[#1A1A26]/50 transition-colors ${
                        !cat.ativa ? 'opacity-60 bg-[#12121A]' : ''
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              cat.ativa
                                ? 'bg-[#7B2CF6]/20 text-[#A76BFF] border border-[#7B2CF6]/40'
                                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                            }`}
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm">{cat.nome}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">
                        {cat.descricao || '—'}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141420] border border-[#262638] text-xs font-mono font-bold text-amber-400">
                          <Package className="w-3 h-3 text-amber-400/80" />
                          <span>{cat.totalProdutos ?? 0}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Badge variant={cat.ativa ? 'success' : 'default'} size="sm" dot>
                          {cat.ativa ? 'Ativa' : 'Desativada'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Edit2 className="w-3.5 h-3.5" />}
                            onClick={() => abrirModalEdicao(cat)}
                            title="Editar nome e descrição"
                          >
                            Editar
                          </Button>

                          <Button
                            variant={cat.ativa ? 'secondary' : 'accent'}
                            size="sm"
                            icon={
                              cat.ativa ? (
                                <XCircle className="w-3.5 h-3.5 text-zinc-400" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              )
                            }
                            onClick={() => handleToggleStatus(cat)}
                            title={cat.ativa ? 'Desativar categoria' : 'Ativar categoria'}
                          >
                            {cat.ativa ? 'Desativar' : 'Ativar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-xl bg-[#141420] border border-[#222234] text-xs text-zinc-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#A76BFF] shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-200">Segurança de Dados:</strong> Desativar uma categoria não remove produtos já existentes no estoque. Apenas impede que ela seja selecionada no cadastro de novos produtos, mantendo o histórico de vendas e saídas íntegro.
            </div>
          </div>
        </CardBody>
      </Card>

      {/* MODAL CRIAR / EDITAR CATEGORIA */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={categoriaParaEditar ? `EDITAR CATEGORIA — ${categoriaParaEditar.nome}` : 'NOVA CATEGORIA DE ESTOQUE'}
      >
        <form onSubmit={handleSalvarCategoria} className="space-y-4">
          <Input
            label="Nome da Categoria *"
            placeholder="Ex: Cabos & Conectores, Capinhas, Fones"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Descrição Detalhada (Opcional)"
            placeholder="Finalidade ou tipos de produtos agrupados nesta categoria"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          {categoriaParaEditar && (
            <div className="p-3 rounded-xl bg-[#181826] border border-[#2E2E44] text-xs text-zinc-300">
              <span className="font-semibold text-white block mb-0.5">Sincronização Automática:</span>
              Ao alterar o nome desta categoria, todos os produtos atualmente associados a ela ({categoriaParaEditar.totalProdutos || 0} produtos) serão atualizados automaticamente com o novo nome.
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="accent" disabled={salvando}>
              {salvando ? 'Salvando...' : categoriaParaEditar ? 'Atualizar Categoria' : 'Criar Categoria'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
