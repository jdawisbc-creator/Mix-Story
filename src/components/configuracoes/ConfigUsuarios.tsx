import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { UserService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { User } from '../../types';
import {
  Users,
  UserPlus,
  Edit2,
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Lock,
} from 'lucide-react';

export const ConfigUsuarios: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error, warning } = useToast();

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  // Modal Criar
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoLogin, setNovoLogin] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('123');
  const [novoStatus, setNovoStatus] = useState(true);

  // Modal Editar
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<User | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editLogin, setEditLogin] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSenha, setEditSenha] = useState('');

  // Modal Alterar Senha
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [usuarioParaSenha, setUsuarioParaSenha] = useState<User | null>(null);
  const [novaSenhaDireta, setNovaSenhaDireta] = useState('');

  const [salvando, setSalvando] = useState(false);

  const carregarUsuarios = async () => {
    setCarregando(true);
    try {
      const lista = await UserService.getUsers();
      setUsuarios(lista);
    } catch (err: any) {
      error('Erro', 'Não foi possível carregar os usuários.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  // 1. Criar Usuário
  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novoLogin.trim()) {
      warning('Campos incompletos', 'Informe o nome e o login do usuário.');
      return;
    }

    if (!currentUser) return;

    setSalvando(true);
    try {
      await UserService.createUser(
        {
          name: novoNome.trim(),
          login: novoLogin.trim(),
          email: novoEmail.trim() || `${novoLogin.trim().toLowerCase()}@mixvariedades.com.br`,
          password: novaSenha.trim() || '123',
          active: novoStatus,
        },
        { id: currentUser.id, name: currentUser.name }
      );

      success('Usuário Cadastrado', `"${novoNome.trim()}" foi cadastrado com acesso ao sistema.`);
      setIsCreateModalOpen(false);
      limparFormCriacao();
      carregarUsuarios();
    } catch (err: any) {
      error('Erro ao cadastrar', err?.message || 'Falha ao salvar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  // 2. Editar Usuário
  const abrirModalEdicao = (u: User) => {
    setUsuarioEditando(u);
    setEditNome(u.name);
    setEditLogin(u.login || u.email.split('@')[0]);
    setEditEmail(u.email);
    setEditSenha('');
    setIsEditModalOpen(true);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando || !currentUser) return;
    if (!editNome.trim() || !editLogin.trim()) {
      warning('Campos obrigatórios', 'Preencha o nome e o login.');
      return;
    }

    setSalvando(true);
    try {
      await UserService.updateUser(
        usuarioEditando.id,
        {
          name: editNome.trim(),
          login: editLogin.trim(),
          email: editEmail.trim() || `${editLogin.trim().toLowerCase()}@mixvariedades.com.br`,
          password: editSenha.trim() ? editSenha.trim() : undefined,
        },
        { id: currentUser.id, name: currentUser.name }
      );

      success('Usuário Atualizado', `Os dados de "${editNome.trim()}" foram atualizados com auditoria.`);
      setIsEditModalOpen(false);
      carregarUsuarios();
    } catch (err: any) {
      error('Erro ao atualizar', err?.message);
    } finally {
      setSalvando(false);
    }
  };

  // 3. Ativar / Desativar Status
  const handleToggleStatus = async (u: User) => {
    if (!currentUser) return;
    const novoStatus = !u.active;

    try {
      await UserService.toggleStatus(u.id, novoStatus, {
        id: currentUser.id,
        name: currentUser.name,
      });

      success(
        novoStatus ? 'Usuário Ativado' : 'Usuário Desativado',
        `O colaborador "${u.name}" está agora ${novoStatus ? 'ativo' : 'desativado'}.`
      );
      carregarUsuarios();
    } catch (err: any) {
      error('Erro ao alterar status', err?.message);
    }
  };

  // 4. Alterar Senha
  const abrirModalSenha = (u: User) => {
    setUsuarioParaSenha(u);
    setNovaSenhaDireta('');
    setIsPasswordModalOpen(true);
  };

  const handleSalvarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioParaSenha || !currentUser || !novaSenhaDireta.trim()) return;

    setSalvando(true);
    try {
      await UserService.updatePassword(usuarioParaSenha.id, novaSenhaDireta.trim(), {
        id: currentUser.id,
        name: currentUser.name,
      });

      success('Senha Redefinida', `Nova senha configurada com sucesso para "${usuarioParaSenha.name}".`);
      setIsPasswordModalOpen(false);
      carregarUsuarios();
    } catch (err: any) {
      error('Erro ao alterar senha', err?.message);
    } finally {
      setSalvando(false);
    }
  };

  const limparFormCriacao = () => {
    setNovoNome('');
    setNovoLogin('');
    setNovoEmail('');
    setNovaSenha('123');
    setNovoStatus(true);
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.name.toLowerCase().includes(busca.toLowerCase()) ||
      (u.login && u.login.toLowerCase().includes(busca.toLowerCase())) ||
      u.email.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF8A00]" />
              <span>COLABORADORES & USUÁRIOS DO SISTEMA</span>
            </div>
          }
          subtitle="Gerencie o acesso dos colaboradores. Crie, edite, ative ou desative usuários."
          action={
            <Button
              variant="accent"
              size="sm"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => {
                limparFormCriacao();
                setIsCreateModalOpen(true);
              }}
            >
              Novo Colaborador
            </Button>
          }
        />
        <CardBody className="space-y-4">
          {/* Banner de Diretriz Oficial */}
          <div className="p-4 rounded-xl bg-[#171724] border border-[#2A2A3E] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#A76BFF] shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-300 leading-relaxed">
              <strong className="text-white font-semibold block mb-0.5">
                Regra de Nível de Acesso da Mix Variedades Store:
              </strong>
              Todos os colaboradores continuam com o mesmo nível de acesso irrestrito a todos os módulos (Vendas, Caixa, Estoque, Gastos e Relatórios). A gestão de usuários tem a finalidade essencial de identificar com precisão <em>QUEM</em> executa cada operação no Livro de Auditoria do sistema.
            </div>
          </div>

          {/* Filtro de Busca */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Buscar por nome ou login..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                icon={<Search className="w-4 h-4 text-zinc-400" />}
              />
            </div>
            <div className="text-xs text-zinc-400">
              Total de colaboradores: <strong className="text-white">{usuarios.length}</strong> (
              <span className="text-emerald-400 font-bold">{usuarios.filter((u) => u.active).length} ativos</span>
              )
            </div>
          </div>

          {/* Listagem em Tabela */}
          <div className="overflow-x-auto rounded-xl border border-[#222230]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#181824] border-b border-[#222230] text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Login</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F2C]">
                {carregando ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Carregando colaboradores...
                    </td>
                  </tr>
                ) : usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Nenhum colaborador encontrado.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((u) => (
                    <tr
                      key={u.id}
                      className={`hover:bg-[#1A1A26]/50 transition-colors ${
                        !u.active ? 'opacity-60 bg-[#111118]' : ''
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              u.active
                                ? 'bg-[#7B2CF6]/20 text-[#A76BFF] border border-[#7B2CF6]/40'
                                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                            }`}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{u.name}</p>
                            <span className="text-[10px] text-zinc-500 font-mono">ID: {u.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-zinc-300">
                        {u.login || u.email.split('@')[0]}
                      </td>

                      <td className="py-3 px-4 text-zinc-400 truncate max-w-xs">
                        {u.email}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Badge variant={u.active ? 'success' : 'default'} size="sm" dot>
                          {u.active ? 'Ativo' : 'Desativado'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Edit2 className="w-3.5 h-3.5" />}
                            onClick={() => abrirModalEdicao(u)}
                            title="Editar dados cadastrais"
                          >
                            Editar
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Key className="w-3.5 h-3.5 text-amber-400" />}
                            onClick={() => abrirModalSenha(u)}
                            title="Redefinir senha"
                          >
                            Senha
                          </Button>

                          <Button
                            variant={u.active ? 'secondary' : 'accent'}
                            size="sm"
                            icon={
                              u.active ? (
                                <XCircle className="w-3.5 h-3.5 text-zinc-400" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              )
                            }
                            onClick={() => handleToggleStatus(u)}
                            title={u.active ? 'Desativar acesso' : 'Ativar acesso'}
                          >
                            {u.active ? 'Desativar' : 'Ativar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* MODAL 1: CRIAR USUÁRIO */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="CADASTRAR NOVO COLABORADOR"
      >
        <form onSubmit={handleCriarUsuario} className="space-y-4">
          <Input
            label="Nome Completo *"
            placeholder="Ex: Jhonatan Silva, Carla Santos"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Login de Acesso *"
              placeholder="Ex: jhonatan ou carla"
              value={novoLogin}
              onChange={(e) => setNovoLogin(e.target.value)}
              required
            />
            <Input
              label="Senha Inicial *"
              type="password"
              placeholder="••••••••"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
            />
          </div>

          <Input
            label="E-mail de Contato (Opcional)"
            placeholder="colaborador@mixvariedades.com.br"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
          />

          <div className="p-3 rounded-xl bg-[#171724] border border-[#2A2A3E] text-xs text-zinc-300">
            <span className="text-white font-semibold block mb-0.5">Nível de Acesso:</span>
            Acesso irrestrito a todos os módulos com identificação de autoria nas operações.
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="accent" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Cadastrar Colaborador'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EDITAR USUÁRIO */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`EDITAR COLABORADOR — ${usuarioEditando?.name || ''}`}
      >
        <form onSubmit={handleSalvarEdicao} className="space-y-4">
          <Input
            label="Nome Completo *"
            value={editNome}
            onChange={(e) => setEditNome(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Login de Acesso *"
              value={editLogin}
              onChange={(e) => setEditLogin(e.target.value)}
              required
            />
            <Input
              label="Nova Senha (deixe vazio para manter)"
              type="password"
              placeholder="Opcional"
              value={editSenha}
              onChange={(e) => setEditSenha(e.target.value)}
            />
          </div>

          <Input
            label="E-mail *"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            required
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="accent" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: REDEFINIR SENHA */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`REDEFINIR SENHA — ${usuarioParaSenha?.name || ''}`}
      >
        <form onSubmit={handleSalvarSenha} className="space-y-4">
          <Input
            label="Nova Senha *"
            type="password"
            placeholder="Digite a nova senha de acesso..."
            value={novaSenhaDireta}
            onChange={(e) => setNovaSenhaDireta(e.target.value)}
            required
            autoFocus
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="accent" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Nova Senha'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
