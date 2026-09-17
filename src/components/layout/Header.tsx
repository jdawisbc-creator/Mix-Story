import React, { useState, useEffect } from 'react';
import { Menu, LogOut, User as UserIcon, Users, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../ui/ConfirmModal';
import { UserService } from '../../services/userService';
import type { User } from '../../types';

interface HeaderProps {
  pageTitle: string;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ pageTitle, onOpenMobileMenu }) => {
  const { user, logout, switchUser } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Formatação de data em Português
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const capitalizedDate =
    todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  useEffect(() => {
    UserService.getUsers().then((list) => {
      // Todos os usuários ativos têm permissão completa
      setAvailableUsers(list.filter((u) => u.active));
    });
  }, [isSwitchUserOpen]);

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
  };

  const handleSwitchUser = async (targetUser: User) => {
    await switchUser(targetUser);
    setIsSwitchUserOpen(false);
  };

  return (
    <header className="h-20 bg-[#0F0F14]/90 backdrop-blur-md border-b border-[#20202B] px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Esquerda: Mobile Menu Toggle + Título da Página Atual */}
      <div className="flex items-center gap-3 md:gap-5">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Abrir Menu Lateral"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <h2
              className="text-xl md:text-2xl font-black uppercase tracking-wider text-white"
              style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
            >
              {pageTitle}
            </h2>
          </div>
          {/* Data no cabeçalho */}
          <span className="hidden sm:inline-block text-xs font-medium text-zinc-400">
            {capitalizedDate}
          </span>
        </div>
      </div>

      {/* Direita: Usuário Conectado + Botão de Sair */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Status do Sistema */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161620] border border-[#262636] text-xs text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-zinc-300">Auditoria Ativa</span>
        </div>

        {/* IDENTIFICAÇÃO DO USUÁRIO ATUAL (Especificação Mix Variedades) */}
        <div className="relative flex items-center gap-3 pl-3 border-l border-[#22222E]">
          <button
            onClick={() => setIsSwitchUserOpen(!isSwitchUserOpen)}
            className="flex items-center gap-2.5 p-1.5 md:pr-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-[#2B2B3D] transition-all text-left cursor-pointer group"
            title="Clique para alternar o usuário atual da sessão"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-[#7B2CF6]/20 border border-[#7B2CF6]/40 flex items-center justify-center text-[#A76BFF] font-bold">
                <UserIcon className="w-4 h-4" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0F0F14]" />
            </div>

            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-1 leading-tight">
                <span className="text-[11px] font-medium text-zinc-400">Usuário atual:</span>
                <span className="text-sm font-bold text-white tracking-wide">
                  {user?.name || 'Jhonatan'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-transform ml-0.5" />
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                ID: {user?.id || 'usr_jhonatan_01'}
              </span>
            </div>
          </button>

          {/* Menu Dropdown para Alternar Usuário Ativo */}
          {isSwitchUserOpen && (
            <div className="absolute right-14 top-16 z-50 w-64 bg-[#14141D] border border-[#2B2B3E] rounded-2xl shadow-2xl p-2 text-xs backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-[#222230] mb-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#FF8A00]" />
                  Identificação do Operador
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Todos possuem permissão total. A seleção identifica quem registra cada ação.
                </p>
              </div>

              <div className="space-y-1 my-1">
                {availableUsers.map((u) => {
                  const isCurrent = user?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSwitchUser(u)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#7B2CF6]/20 border border-[#7B2CF6]/40 text-white font-bold'
                          : 'hover:bg-white/5 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#222230] flex items-center justify-center text-zinc-200 text-xs font-bold">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="leading-none text-xs">{u.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{u.login}</p>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-[#A76BFF]" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#222230] px-2 text-[10px] text-zinc-400 text-center">
                Gerencie novos usuários na aba Configurações
              </div>
            </div>
          )}

          {/* Botão Sair */}
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-[#181822] hover:bg-red-500/20 border border-[#2A2A3A] hover:border-red-500/40 transition-all cursor-pointer"
            title="Encerrar Sessão"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Saída */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Encerrar Sessão"
        message="Deseja realmente encerrar sua sessão? Essa ação será registrada na auditoria do sistema."
        confirmText="Sim, Sair"
        cancelText="Permanecer Conectado"
        variant="warning"
      />
    </header>
  );
};
