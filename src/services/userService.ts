/**
 * Serviço de Gerenciamento de Usuários
 * Mix Variedades Store
 * 
 * REGRA CENTRAL:
 * Na Mix Variedades Store NÃO existem funcionários com diferentes níveis hierárquicos de acesso.
 * Todos os usuários cadastrados têm exatamente as mesmas permissões completas.
 * A finalidade dos usuários é identificar QUEM realizou cada ação no sistema.
 */

import { DatabaseService } from './databaseService';
import { AuditService } from './auditService';
import type { User } from '../types';

const COLLECTION_NAME = 'usuarios_mix';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_jhonatan_01',
    name: 'Jhonatan',
    login: 'jhonatan@mixvariedades.com.br',
    email: 'jhonatan@mixvariedades.com.br',
    password: '123',
    active: true,
    createdAt: '2026-01-10T09:00:00.000Z',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_carla_02',
    name: 'Carla Santos',
    login: 'carla@mixvariedades.com.br',
    email: 'carla@mixvariedades.com.br',
    password: '123',
    active: true,
    createdAt: '2026-02-15T14:30:00.000Z',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_lucas_03',
    name: 'Lucas Oliveira',
    login: 'lucas@mixvariedades.com.br',
    email: 'lucas@mixvariedades.com.br',
    password: '123',
    active: true,
    createdAt: '2026-03-01T08:45:00.000Z',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_mariana_04',
    name: 'Mariana Lima',
    login: 'mariana@mixvariedades.com.br',
    email: 'mariana@mixvariedades.com.br',
    password: '123',
    active: false, // Usuário inativo para validação do bloqueio de acesso
    createdAt: '2026-04-10T11:20:00.000Z',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  },
];

export class UserService {
  /**
   * Obtém todos os usuários cadastrados
   */
  static async getUsers(): Promise<User[]> {
    const list = await DatabaseService.getCollection<User>(COLLECTION_NAME);
    if (list.length === 0) {
      for (const u of INITIAL_USERS) {
        await DatabaseService.setDocument<User>(COLLECTION_NAME, u.id, u);
      }
      return INITIAL_USERS;
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Obtém um usuário por ID
   */
  static async getUserById(id: string): Promise<User | null> {
    return await DatabaseService.getDocument<User>(COLLECTION_NAME, id);
  }

  /**
   * Busca usuário por login ou e-mail
   */
  static async findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    const users = await this.getUsers();
    const clean = loginOrEmail.trim().toLowerCase();
    return (
      users.find(
        (u) =>
          u.login.toLowerCase() === clean ||
          (u.email && u.email.toLowerCase() === clean) ||
          u.name.toLowerCase() === clean
      ) || null
    );
  }

  /**
   * Cadastra um novo usuário no sistema
   * Registra auditoria automática
   */
  static async createUser(
    novo: Omit<User, 'id' | 'createdAt'>,
    autor: { id: string; name: string }
  ): Promise<User> {
    const user: User = {
      ...novo,
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      active: novo.active ?? true,
    };

    await DatabaseService.setDocument<User>(COLLECTION_NAME, user.id, user);

    // Auditoria automática
    await AuditService.registrar({
      usuario: autor.name,
      usuarioId: autor.id,
      modulo: 'Usuários',
      tipoAcao: 'Criação',
      registroAfetado: `Usuário ${user.name}`,
      informacaoAnterior: 'Não existia no sistema',
      informacaoNova: `Login: ${user.login} | Status: ${user.active ? 'Ativo' : 'Inativo'}`,
      descricao: `Novo usuário ${user.name} cadastrado com permissões de acesso completas.`,
    });

    return user;
  }

  /**
   * Edita dados de um usuário existente (Nome, Login, E-mail, Senha opcional)
   * Registra auditoria automática
   */
  static async updateUser(
    userId: string,
    dados: {
      name: string;
      login: string;
      email?: string;
      password?: string;
      active?: boolean;
    },
    autor: { id: string; name: string }
  ): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('Usuário não encontrado');

    const anterior = `Nome: ${user.name} | Login: ${user.login} | Status: ${user.active ? 'Ativo' : 'Inativo'}`;
    const updated: User = {
      ...user,
      name: dados.name.trim(),
      login: dados.login.trim(),
      email: dados.email?.trim() || user.email,
      active: dados.active !== undefined ? dados.active : user.active,
      password: dados.password?.trim() ? dados.password.trim() : user.password,
    };

    await DatabaseService.setDocument<User>(COLLECTION_NAME, user.id, updated);

    const novo = `Nome: ${updated.name} | Login: ${updated.login} | Status: ${updated.active ? 'Ativo' : 'Inativo'}`;

    await AuditService.registrar({
      usuario: autor.name,
      usuarioId: autor.id,
      modulo: 'Usuários',
      tipoAcao: 'Edição de Usuário',
      registroAfetado: `Usuário ${updated.name}`,
      informacaoAnterior: anterior,
      informacaoNova: novo,
      descricao: `Dados cadastrais do usuário ${updated.name} alterados por ${autor.name}.`,
    });

    return updated;
  }

  /**
   * Altera status (Ativar / Inativar) de um usuário
   * Registra auditoria automática
   */
  static async toggleStatus(
    userId: string,
    novoStatus: boolean,
    autor: { id: string; name: string }
  ): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('Usuário não encontrado');

    const statusAnterior = user.active ? 'Ativo' : 'Inativo';
    const statusNovo = novoStatus ? 'Ativo' : 'Inativo';

    const updated: User = { ...user, active: novoStatus };
    await DatabaseService.setDocument<User>(COLLECTION_NAME, user.id, updated);

    // Auditoria automática
    await AuditService.registrar({
      usuario: autor.name,
      usuarioId: autor.id,
      modulo: 'Usuários',
      tipoAcao: novoStatus ? 'Ativação de Usuário' : 'Desativação de Usuário',
      registroAfetado: `Usuário ${user.name}`,
      informacaoAnterior: `Status: ${statusAnterior}`,
      informacaoNova: `Status: ${statusNovo}`,
      descricao: `Status do usuário ${user.name} alterado de ${statusAnterior} para ${statusNovo}.`,
    });

    return updated;
  }

  /**
   * Redefine senha do usuário
   * Registra auditoria automática
   */
  static async updatePassword(
    userId: string,
    novaSenha: string,
    autor: { id: string; name: string }
  ): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('Usuário não encontrado');

    const updated: User = { ...user, password: novaSenha };
    await DatabaseService.setDocument<User>(COLLECTION_NAME, user.id, updated);

    // Auditoria automática
    await AuditService.registrar({
      usuario: autor.name,
      usuarioId: autor.id,
      modulo: 'Usuários',
      tipoAcao: 'Alteração de Senha',
      registroAfetado: `Usuário ${user.name}`,
      informacaoAnterior: 'Credencial anterior ativa',
      informacaoNova: 'Nova credencial redefinida com sucesso',
      descricao: `Senha de acesso do usuário ${user.name} foi redefinida.`,
    });
  }
}
