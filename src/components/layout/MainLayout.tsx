import React, { useState } from 'react';
import type { RouteId } from '../../types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  currentRoute: RouteId;
  onRouteChange: (route: RouteId) => void;
  pageTitle: string;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentRoute,
  onRouteChange,
  pageTitle,
  children,
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex bg-mix-pattern">
      {/* Sidebar (Fixo desktop / Drawer mobile) */}
      <Sidebar
        currentRoute={currentRoute}
        onRouteChange={onRouteChange}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Conteúdo Principal com Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          pageTitle={pageTitle}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {children}
        </main>
      </div>
    </div>
  );
};
