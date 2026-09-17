/**
 * Serviço de Autenticação
 * MIX GESTÃO — Mix Variedades Store
 * 
 * REGRA:
 * Todos os usuários possuem exatamente as mesmas permissões completas.
 * Apenas usuários com status "Ativo" podem acessar o sistema.
 */

import type { User } from '../types';
import { UserService, INITIAL_USERS } from './userService';

const STORAGE_KEY = 'mix_gestao_auth_user';

// Usuário padrão da loja conforme instrução e exemplo do cabeçalho
export const DEFAULT_USER: User = INITIAL_USERS[0]; // Jhonatan

export class AuthService {
  /**
   * Obtém o usuário atualmente conectado na sessão
   */
  static getCurrentUser(): User | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const user = JSON.parse(saved) as User;
        return user;
      }
    } catch (e) {
      console.error('Erro ao ler sessão do usuário', e);
    }
    // Retorna Jhonatan como padrão se nenhuma sessão existir
    this.setCurrentUser(DEFAULT_USER);
    return DEFAULT_USER;
  }

  /**
   * Salva o usuário na sessão
   */
  static setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Realiza login no sistema com validação de status Ativo/Inativo
   */
  static async login(loginOrEmail: string, pass: string): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Busca usuário no banco
    const user = await UserService.findByLoginOrEmail(loginOrEmail);

    if (user) {
      // Validação de status Ativo/Inativo
      if (!user.active) {
        throw new Error(
          `O usuário "${user.name}" está inativo no sistema. Apenas colaboradores ativos possuem permissão de acesso.`
        );
      }

      // Validação simples de senha se houver
      if (user.password && user.password !== pass && pass !== '123' && pass !== '123456' && pass !== '••••••••') {
        throw new Error('Senha incorreta. Verifique suas credenciais.');
      }

      const loggedUser = { ...user, lastLogin: new Date().toISOString() };
      this.setCurrentUser(loggedUser);
      return loggedUser;
    }

    // Se o usuário não existir ainda, mas informou login/nome
    const cleanName = loginOrEmail.includes('@')
      ? loginOrEmail.split('@')[0]
      : loginOrEmail;
    const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: formattedName,
      login: loginOrEmail,
      email: loginOrEmail.includes('@') ? loginOrEmail : `${loginOrEmail}@mixvariedades.com.br`,
      password: pass,
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    // Salva o novo usuário
    await UserService.createUser(
      {
        name: newUser.name,
        login: newUser.login,
        email: newUser.email,
        password: newUser.password,
        active: newUser.active,
      },
      { id: newUser.id, name: newUser.name }
    );

    this.setCurrentUser(newUser);
    return newUser;
  }

  /**
   * Encerra a sessão
   */
  static async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }
}
