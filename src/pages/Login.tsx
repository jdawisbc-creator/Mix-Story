import React, { useState, useEffect } from 'react';
import { MixLogo } from '../components/brand/MixLogo';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserService } from '../services/userService';
import type { User } from '../types';
import { Lock, User as UserIcon, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { success, error, warning } = useToast();
  const [loginInput, setLoginInput] = useState('jhonatan');
  const [password, setPassword] = useState('123');
  const [isLoading, setIsLoading] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);

  useEffect(() => {
    UserService.getUsers().then((users) => setUsersList(users));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      warning('Campo obrigatório', 'Informe o seu nome de usuário ou e-mail de acesso');
      return;
    }
    setIsLoading(true);
    try {
      await login(loginInput, password);
      success('Acesso Concedido', `Bem-vindo à Mix Variedades Store.`);
    } catch (err: any) {
      error('Acesso Negado', err?.message || 'Verifique suas credenciais e tente novamente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (u: User) => {
    setLoginInput(u.login);
    setPassword(u.password || '123');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0E] flex flex-col items-center justify-center p-4 relative overflow-hidden bg-mix-grid">
      {/* Luz ambiente roxa e dourada da Mix */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-[#7B2CF6]/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#FF8A00]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Container Principal do Card de Login */}
      <div className="w-full max-w-md bg-[#13131A] border border-[#262635] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative z-10">
        {/* Header com Logo Oficial */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3.5 rounded-2xl bg-[#181822] border border-[#2F2F42] shadow-lg shadow-[#7B2CF6]/10 mb-3">
            <MixLogo variant="full" size="lg" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E1E2C] border border-[#313146] text-[11px] font-semibold text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF8A00]" />
            <span>Sistema Central de Autenticação & Auditoria</span>
          </div>
        </div>

        {/* Aviso de Regra de Acesso Igualitário */}
        <div className="mb-5 p-3 rounded-xl bg-[#181824] border border-[#2B2B3E] text-xs text-zinc-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#A76BFF] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white font-semibold">Acesso Igualitário:</strong> Todos os usuários ativos têm permissões completas. A identificação serve para registrar a autoria de cada ação na auditoria.
          </p>
        </div>

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Usuário ou E-mail"
            type="text"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            placeholder="Ex: jhonatan ou carla"
            icon={<UserIcon className="w-4 h-4" />}
            required
          />

          <Input
            label="Senha de Acesso"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Entrar no Sistema
          </Button>
        </form>

        {/* Seleção Rápida de Usuários Cadastrados para Teste de Auditoria */}
        <div className="mt-6 pt-5 border-t border-[#222230]">
          <p className="text-[11px] font-bold text-zinc-400 mb-2.5 text-center uppercase tracking-wider">
            Usuários Cadastrados na Loja:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {usersList.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickSelect(u)}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  loginInput.toLowerCase() === u.login.toLowerCase()
                    ? 'bg-[#7B2CF6]/20 border-[#7B2CF6] text-white'
                    : 'bg-[#181822] hover:bg-[#20202E] border-[#2B2B3D] text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">{u.name}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      u.active ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                    title={u.active ? 'Status: Ativo' : 'Status: Inativo'}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                  <span>{u.login}</span>
                  <span className={u.active ? 'text-emerald-400' : 'text-rose-400 font-semibold'}>
                    {u.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 text-center mt-2.5">
            Clique em qualquer usuário acima para preencher login rapidamente.
          </p>
        </div>
      </div>
    </div>
  );
};
