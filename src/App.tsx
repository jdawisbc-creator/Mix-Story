import React, { useState } from 'react';
import type { RouteId } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { CaixaHojePage } from './pages/CaixaHojePage';
import { CaixaHistoricoPage } from './pages/CaixaHistoricoPage';
import { VendasPage } from './pages/VendasPage';
import { GastosPage } from './pages/GastosPage';
import { EstoquePage } from './pages/EstoquePage';
import { PromocoesPage } from './pages/PromocoesPage';
import { OrdensServicoPage } from './pages/OrdensServicoPage';
import { RedesSociaisPage } from './pages/RedesSociaisPage';
import { RelatoriosPage } from './pages/RelatoriosPage';
import { HistoricoPage } from './pages/HistoricoPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<RouteId>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#7B2CF6] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Carregando MIX GESTÃO...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const routeTitleMap: Record<RouteId, string> = {
    dashboard: 'Dashboard',
    'caixa-hoje': 'Caixa de Hoje',
    'caixa-historico': 'Histórico de Caixas',
    vendas: 'Vendas',
    gastos: 'Saídas / Gastos',
    estoque: 'Estoque',
    promocoes: 'Promoções',
    'ordens-servico': 'Ordens de Serviço',
    'redes-calendario': 'Conteúdo e Redes Sociais',
    'redes-postagens': 'Conteúdo e Redes Sociais',
    'redes-biblioteca': 'Conteúdo e Redes Sociais',
    relatorios: 'Relatórios',
    historico: 'Histórico de Alterações',
    configuracoes: 'Configurações',
  };

  const renderActiveRoute = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardPage onRouteChange={setCurrentRoute} />;
      case 'caixa-hoje':
        return <CaixaHojePage />;
      case 'caixa-historico':
        return <CaixaHistoricoPage />;
      case 'vendas':
        return <VendasPage />;
      case 'gastos':
        return <GastosPage />;
      case 'estoque':
        return <EstoquePage />;
      case 'promocoes':
        return <PromocoesPage />;
      case 'ordens-servico':
        return <OrdensServicoPage />;
      case 'redes-calendario':
      case 'redes-postagens':
      case 'redes-biblioteca':
        return (
          <RedesSociaisPage
            currentTab={currentRoute}
            onTabChange={setCurrentRoute}
          />
        );
      case 'relatorios':
        return <RelatoriosPage />;
      case 'historico':
        return <HistoricoPage />;
      case 'configuracoes':
        return <ConfiguracoesPage />;
      default:
        return <DashboardPage onRouteChange={setCurrentRoute} />;
    }
  };

  return (
    <MainLayout
      currentRoute={currentRoute}
      onRouteChange={setCurrentRoute}
      pageTitle={routeTitleMap[currentRoute] || 'Mix Gestão'}
    >
      {renderActiveRoute()}
    </MainLayout>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
