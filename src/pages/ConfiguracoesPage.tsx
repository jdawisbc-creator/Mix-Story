import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ConfigService } from '../services/configService';
import { AuditService } from '../services/auditService';
import type { ConfiguracaoLoja, FormasPagamentoConfig } from '../types';

import { ConfigDadosLoja } from '../components/configuracoes/ConfigDadosLoja';
import { ConfigFormasPagamento } from '../components/configuracoes/ConfigFormasPagamento';
import { ConfigCategorias } from '../components/configuracoes/ConfigCategorias';
import { ConfigUsuarios } from '../components/configuracoes/ConfigUsuarios';
import { ConfigOrdemServico } from '../components/configuracoes/ConfigOrdemServico';
import { ConfigBackup } from '../components/configuracoes/ConfigBackup';

import {
  Store,
  CreditCard,
  Tag,
  Users,
  FileText,
  Database,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

type TabConfig = 'loja_caixa' | 'formas_pagamento' | 'categorias' | 'usuarios' | 'ordem_servico' | 'backup';

export const ConfiguracoesPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<TabConfig>('loja_caixa');
  const [config, setConfig] = useState<ConfiguracaoLoja | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregarConfiguracoes = async () => {
    try {
      const dados = await ConfigService.getConfig();
      setConfig(dados);
    } catch (err: any) {
      error('Erro', 'Não foi possível carregar as configurações do sistema.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  // Salvar alterações genéricas de configuração com auditoria
  const handleSalvarConfigGenerica = async (
    updates: Partial<ConfiguracaoLoja>,
    descricaoAuditoria: string
  ) => {
    if (!config) return;

    try {
      const nova = await ConfigService.salvarConfig({
        ...config,
        ...updates,
      });
      setConfig(nova);

      if (user) {
        await AuditService.registrar({
          usuario: user.name,
          usuarioId: user.id,
          modulo: 'Configurações',
          tipoAcao: 'Alteração de Configuração',
          registroAfetado: 'Parâmetros Gerais do Sistema',
          informacaoAnterior: JSON.stringify(config).slice(0, 120),
          informacaoNova: JSON.stringify(nova).slice(0, 120),
          descricao: `${descricaoAuditoria} Realizado por ${user.name}.`,
        });
      }

      success('Configurações Salvas', 'As alterações foram gravadas e registradas na auditoria.');
    } catch (err: any) {
      error('Erro ao salvar', err?.message || 'Falha ao gravar configurações.');
      throw err;
    }
  };

  // Salvar alterações de formas de pagamento com auditoria
  const handleSalvarFormasPagamento = async (novasFormas: FormasPagamentoConfig) => {
    if (!config) return;

    try {
      const nova = await ConfigService.salvarConfig({
        ...config,
        formasPagamento: novasFormas,
      });
      setConfig(nova);

      if (user) {
        await AuditService.registrar({
          usuario: user.name,
          usuarioId: user.id,
          modulo: 'Configurações',
          tipoAcao: 'Alteração de Configuração',
          registroAfetado: 'Formas de Pagamento Aceitas',
          informacaoAnterior: JSON.stringify(config.formasPagamento),
          informacaoNova: JSON.stringify(novasFormas),
          descricao: `Opções de formas de pagamento ativas atualizadas por ${user.name}.`,
        });
      }

      success('Formas de Pagamento Salvas', 'As opções de recebimento no PDV foram atualizadas.');
    } catch (err: any) {
      error('Erro ao salvar', err?.message || 'Falha ao salvar formas de pagamento.');
      throw err;
    }
  };

  const abas = [
    { id: 'loja_caixa' as TabConfig, label: 'Dados da Loja & Caixa', icon: Store },
    { id: 'formas_pagamento' as TabConfig, label: 'Formas de Pagamento', icon: CreditCard },
    { id: 'categorias' as TabConfig, label: 'Categorias do Estoque', icon: Tag },
    { id: 'usuarios' as TabConfig, label: 'Colaboradores / Usuários', icon: Users },
    { id: 'ordem_servico' as TabConfig, label: 'Ordem de Serviço (Oficial)', icon: FileText },
    { id: 'backup' as TabConfig, label: 'Backup & Restauração', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="CONFIGURAÇÕES DO SISTEMA"
        description="Parâmetros gerais da Mix Variedades Store, frente de caixa, formas de pagamento, categorias, colaboradores, layout de OS e backup."
      />

      {/* NAVEGAÇÃO POR ABAS ELEGANTE */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#141420] border border-[#222234]">
        {abas.map((aba) => {
          const Icon = aba.icon;
          const isActive = activeTab === aba.id;

          return (
            <button
              key={aba.id}
              type="button"
              onClick={() => setActiveTab(aba.id)}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#FF8A00] to-[#E07A00] text-white shadow-md shadow-[#FF8A00]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1C1C2C]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{aba.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DA ABA ATIVA */}
      {carregando || !config ? (
        <div className="p-12 text-center text-zinc-500 text-xs">
          Carregando configurações...
        </div>
      ) : (
        <div>
          {activeTab === 'loja_caixa' && (
            <ConfigDadosLoja config={config} onSalvar={handleSalvarConfigGenerica} />
          )}

          {activeTab === 'formas_pagamento' && (
            <ConfigFormasPagamento
              formas={config.formasPagamento || {
                pix: true,
                dinheiro: true,
                cartao_debito: true,
                cartao_credito: true,
                transferencia: true,
                outros: true,
              }}
              onSalvar={handleSalvarFormasPagamento}
            />
          )}

          {activeTab === 'categorias' && <ConfigCategorias />}

          {activeTab === 'usuarios' && <ConfigUsuarios />}

          {activeTab === 'ordem_servico' && (
            <ConfigOrdemServico config={config} onSalvar={handleSalvarConfigGenerica} />
          )}

          {activeTab === 'backup' && (
            <ConfigBackup onRestauracaoConcluida={carregarConfiguracoes} />
          )}
        </div>
      )}
    </div>
  );
};
