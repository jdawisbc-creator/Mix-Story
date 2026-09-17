import React, { useState } from 'react';
import type { RouteId } from '../../types';
import { MixLogo } from '../brand/MixLogo';
import {
  LayoutDashboard,
  Wallet,
  ShoppingCart,
  ArrowDownCircle,
  Package,
  Tag,
  Wrench,
  Share2,
  BarChart3,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  Store,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentRoute: RouteId;
  onRouteChange: (route: RouteId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: RouteId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: 'orange' | 'purple';
  subItems?: { id: RouteId; label: string }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
  isOpenMobile,
  onCloseMobile,
}) => {
  // Estado para submenus abertos
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    caixa: currentRoute.startsWith('caixa-'),
    redes: currentRoute.startsWith('redes-'),
  });

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const menuItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'caixa-hoje',
      label: 'Caixa',
      icon: Wallet,
      subItems: [
        { id: 'caixa-hoje', label: 'Caixa de hoje' },
        { id: 'caixa-historico', label: 'Histórico de caixas' },
      ],
    },
    {
      id: 'vendas',
      label: 'Vendas',
      icon: ShoppingCart,
      badge: 'PDV',
      badgeColor: 'orange',
    },
    {
      id: 'gastos',
      label: 'Saídas / Gastos',
      icon: ArrowDownCircle,
    },
    {
      id: 'estoque',
      label: 'Estoque',
      icon: Package,
      badge: 'Ativo',
      badgeColor: 'purple',
    },
    {
      id: 'promocoes',
      label: 'Promoções',
      icon: Tag,
    },
    {
      id: 'ordens-servico',
      label: 'Ordens de Serviço',
      icon: Wrench,
    },
    {
      id: 'redes-calendario',
      label: 'Conteúdo e Redes',
      icon: Share2,
      subItems: [
        { id: 'redes-calendario', label: 'Calendário' },
        { id: 'redes-postagens', label: 'Postagens' },
        { id: 'redes-biblioteca', label: 'Biblioteca' },
      ],
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: BarChart3,
    },
    {
      id: 'historico',
      label: 'Histórico de Alterações',
      icon: History,
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
    },
  ];

  const handleNavClick = (id: RouteId) => {
    onRouteChange(id);
    onCloseMobile();
  };

  const isSubActive = (subItems?: { id: RouteId; label: string }[]) => {
    return subItems?.some((sub) => sub.id === currentRoute);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#101015] border-r border-[#20202B] text-zinc-300">
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-[#20202B] bg-[#0D0D11]">
        <MixLogo variant="full" size="md" />
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Store Quick Status Badge */}
      <div className="px-5 py-3 border-b border-[#1A1A24] bg-[#14141C]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-zinc-200">Loja Operando</span>
          </div>
          <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            v1.0.0
          </span>
        </div>
      </div>

      {/* Navigation Links with custom scroll */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasSub = !!item.subItems;
          const subKey = item.label.toLowerCase().includes('caixa') ? 'caixa' : 'redes';
          const isSubOpen = !!openSubmenus[subKey];
          const active = currentRoute === item.id || isSubActive(item.subItems);

          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => {
                  if (hasSub) {
                    toggleSubmenu(subKey);
                  } else {
                    handleNavClick(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  active
                    ? 'bg-[#7B2CF6]/15 text-white border border-[#7B2CF6]/40 shadow-sm shadow-[#7B2CF6]/10'
                    : 'text-zinc-400 hover:text-white hover:bg-[#181822]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      active ? 'text-[#FF8A00]' : 'text-zinc-400 group-hover:text-white'
                    }`}
                  />
                  <span className="font-semibold tracking-wide">{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        item.badgeColor === 'orange'
                          ? 'bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/30'
                          : 'bg-[#7B2CF6]/20 text-[#A76BFF] border border-[#7B2CF6]/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {hasSub && (
                    <span className="text-zinc-500">
                      {isSubOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </span>
                  )}
                </div>
              </button>

              {/* Subitems Menu */}
              {hasSub && isSubOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 border-l-2 border-[#262636] ml-5">
                  {item.subItems!.map((sub) => {
                    const isSubCurrent = currentRoute === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleNavClick(sub.id)}
                        className={`w-full flex items-center justify-between py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSubCurrent
                            ? 'text-[#FF8A00] bg-[#FF8A00]/10 font-bold'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>{sub.label}</span>
                        {isSubCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A00]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Store Location Footer */}
      <div className="p-4 border-t border-[#20202B] bg-[#0E0E14] text-xs text-zinc-400">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#181822] text-[#FF8A00] border border-[#2B2B38]">
            <Store className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-zinc-200">Mix Variedades</p>
            <p className="text-[11px] text-zinc-400">Terminal Principal</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Fixo */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
