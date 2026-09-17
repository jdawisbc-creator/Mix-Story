import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { AuthService, DEFAULT_USER } from '../services/authService';
import { AuditService } from '../services/auditService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginOrEmail: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inicializa a sessão com usuário padrão ou existente
    const current = AuthService.getCurrentUser();
    setUser(current || DEFAULT_USER);
    setIsLoading(false);
  }, []);

  const login = async (loginOrEmail: string, pass: string) => {
    setIsLoading(true);
    try {
      const loggedUser = await AuthService.login(loginOrEmail, pass);
      setUser(loggedUser);

      // Auditoria automática de login
      await AuditService.registrar({
        usuario: loggedUser.name,
        usuarioId: loggedUser.id,
        modulo: 'Autenticação',
        tipoAcao: 'Login',
        registroAfetado: 'Sessão do Usuário',
        informacaoAnterior: 'Desconectado',
        informacaoNova: `Conectado como ${loggedUser.name}`,
        descricao: `Usuário ${loggedUser.name} efetuou login no sistema.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (user) {
      await AuditService.registrar({
        usuario: user.name,
        usuarioId: user.id,
        modulo: 'Autenticação',
        tipoAcao: 'Logout',
        registroAfetado: 'Sessão do Usuário',
        informacaoAnterior: `Conectado como ${user.name}`,
        informacaoNova: 'Sessão finalizada',
        descricao: `Usuário ${user.name} encerrou a sessão no sistema.`,
      });
    }
    await AuthService.logout();
    setUser(null);
  };

  const switchUser = async (targetUser: User) => {
    if (!targetUser.active) {
      throw new Error(`O usuário ${targetUser.name} está inativo.`);
    }

    const previousName = user?.name || 'Desconectado';
    AuthService.setCurrentUser(targetUser);
    setUser(targetUser);

    // Auditoria da troca de identificação de usuário
    await AuditService.registrar({
      usuario: targetUser.name,
      usuarioId: targetUser.id,
      modulo: 'Autenticação',
      tipoAcao: 'Login',
      registroAfetado: 'Sessão do Usuário',
      informacaoAnterior: `Usuário anterior: ${previousName}`,
      informacaoNova: `Usuário atual: ${targetUser.name}`,
      descricao: `Troca rápida de operador ativo para ${targetUser.name}.`,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
};
