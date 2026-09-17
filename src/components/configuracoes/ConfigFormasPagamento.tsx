import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  CreditCard,
  QrCode,
  Banknote,
  Send,
  Layers,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import type { FormasPagamentoConfig } from '../../types';

interface ConfigFormasPagamentoProps {
  formas: FormasPagamentoConfig;
  onSalvar: (novasFormas: FormasPagamentoConfig) => Promise<void>;
}

interface ItemFormaDef {
  key: keyof FormasPagamentoConfig;
  nome: string;
  descricao: string;
  icon: React.ComponentType<{ className?: string }>;
  cor: string;
}

const FORMAS_CATALOGO: ItemFormaDef[] = [
  {
    key: 'pix',
    nome: 'Pix',
    descricao: 'Pagamento instantâneo via QR Code ou chave Pix (Banco / Fintech)',
    icon: QrCode,
    cor: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
  },
  {
    key: 'dinheiro',
    nome: 'Dinheiro',
    descricao: 'Cédulas e moedas com cálculo de troco automático na gaveta',
    icon: Banknote,
    cor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  {
    key: 'cartao_debito',
    nome: 'Débito',
    descricao: 'Cartão de débito em maquininha de cartão de crédito/débito',
    icon: CreditCard,
    cor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  },
  {
    key: 'cartao_credito',
    nome: 'Crédito',
    descricao: 'Cartão de crédito à vista ou parcelado nas maquininhas',
    icon: CreditCard,
    cor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
  {
    key: 'transferencia',
    nome: 'Transferência',
    descricao: 'TED / DOC / Transferência entre contas bancárias',
    icon: Send,
    cor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  {
    key: 'outros',
    nome: 'Outros',
    descricao: 'Vales, convênios, ordens especiais ou formas customizadas',
    icon: Layers,
    cor: 'text-zinc-300 bg-zinc-700/20 border-zinc-600/30',
  },
];

export const ConfigFormasPagamento: React.FC<ConfigFormasPagamentoProps> = ({
  formas: formasIniciais,
  onSalvar,
}) => {
  const [formas, setFormas] = useState<FormasPagamentoConfig>(formasIniciais);
  const [salvando, setSalvando] = useState(false);

  const handleToggle = (key: keyof FormasPagamentoConfig) => {
    // Garante que pelo menos uma forma permaneça ativa
    const totalAtivas = Object.values(formas).filter(Boolean).length;
    if (formas[key] && totalAtivas <= 1) {
      return;
    }
    setFormas((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      await onSalvar(formas);
    } finally {
      setSalvando(false);
    }
  };

  const totalAtivas = Object.values(formas).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#FF8A00]" />
              <span>FORMAS DE PAGAMENTO ACEITAS</span>
            </div>
          }
          subtitle="Ative ou desative as opções de recebimento que serão exibidas no PDV e na Frente de Caixa."
          action={
            <Badge variant="accent" size="sm">
              {totalAtivas} de 6 ativas
            </Badge>
          }
        />
        <CardBody className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[#171724] border border-[#2A2A3E] text-xs text-zinc-300 leading-relaxed">
            Formas desativadas não aparecerão nas telas de Nova Venda e Registro de Pagamentos, mantendo a tela do operador enxuta e livre de erros. O histórico de vendas anteriores que utilizaram a forma desativada permanece 100% preservado.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {FORMAS_CATALOGO.map((item) => {
              const Icon = item.icon;
              const ativa = Boolean(formas[item.key]);

              return (
                <div
                  key={item.key}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    ativa
                      ? 'bg-[#151522] border-[#2E2E42] shadow-sm'
                      : 'bg-[#111119] border-[#1C1C28] opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.cor}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{item.nome}</h4>
                        <Badge variant={ativa ? 'success' : 'default'} size="sm">
                          {ativa ? 'Ativo' : 'Desativado'}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {item.descricao}
                      </p>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggle(item.key)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 ${
                      ativa ? 'bg-[#FF8A00]' : 'bg-zinc-700'
                    }`}
                    title={ativa ? 'Clique para desativar' : 'Clique para ativar'}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full transition-transform transform ${
                        ativa ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          {totalAtivas <= 1 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Pelo menos uma forma de pagamento deve permanecer ativa para permitir o fechamento de vendas.
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="accent"
          size="lg"
          icon={<Save className="w-4 h-4" />}
          onClick={handleSalvar}
          disabled={salvando}
        >
          {salvando ? 'Salvando...' : 'Salvar Formas de Pagamento'}
        </Button>
      </div>
    </div>
  );
};
