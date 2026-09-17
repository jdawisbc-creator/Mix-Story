import React, { useState } from 'react';
import type { ContaRedeSocial } from '../../types';
import { RedesSociaisService } from '../../services/redesSociaisService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Instagram,
  Facebook,
  Share2,
  CheckCircle2,
  AlertCircle,
  Link2,
  Unlink,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface ContasConexaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contas: ContaRedeSocial[];
  onContasAtualizadas: () => void;
}

export const ContasConexaoModal: React.FC<ContasConexaoModalProps> = ({
  isOpen,
  onClose,
  contas,
  onContasAtualizadas,
}) => {
  const { user } = useAuth();
  const { success, info } = useToast();
  const [carregandoId, setCarregandoId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleConexao = async (id: string, nome: string, conectadoAtual: boolean) => {
    try {
      setCarregandoId(id);
      await RedesSociaisService.alternarConexaoConta(id, user?.name || 'Operador');
      if (!conectadoAtual) {
        success('Conta Conectada', `Integração com ${nome} autorizada via Meta Graph API.`);
      } else {
        info('Conta Desconectada', `A sincronização com ${nome} foi pausada.`);
      }
      onContasAtualizadas();
    } finally {
      setCarregandoId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[#121217] border border-[#252535] rounded-2xl shadow-2xl p-6 z-10 space-y-5">
        {/* Topo */}
        <div className="flex items-center justify-between pb-4 border-b border-[#20202E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#1877F2] flex items-center justify-center text-white shadow-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Conexões com Redes Sociais
              </h3>
              <p className="text-xs text-zinc-400">
                Status oficial de APIs e credenciais para agendamento automático
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nota de Arquitetura e Transparência */}
        <div className="p-3.5 rounded-xl bg-[#161622] border border-[#262638] text-xs text-zinc-300 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Transparência de Agendamento Oficial
          </div>
          <p className="text-zinc-400 text-[11px]">
            O sistema respeita rigorosamente as diretrizes da Meta e redes parceiras. Publicações só são
            disparadas automaticamente quando a conta estiver com status <strong>Conectado</strong>. Sem conexão ativa, as postagens permanecem protegidas no cronograma interno da loja.
          </p>
        </div>

        {/* Lista de Contas */}
        <div className="space-y-3">
          {contas.map((conta) => (
            <div
              key={conta.id}
              className="p-4 rounded-xl bg-[#161622] border border-[#252538] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                {conta.plataforma === 'instagram' ? (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#fd1d1d] to-[#833ab4] flex items-center justify-center text-white shrink-0">
                    <Instagram className="w-5 h-5" />
                  </div>
                ) : conta.plataforma === 'facebook' ? (
                  <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center text-white shrink-0">
                    <Facebook className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#20202E] flex items-center justify-center text-zinc-300 shrink-0">
                    <Share2 className="w-5 h-5" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{conta.nomeExibicao}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        conta.conectado
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {conta.conectado ? 'Conectado' : 'Não conectado'}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {conta.usuarioOuPagina}
                  </div>
                  {conta.detalhes && (
                    <div className="text-[10px] text-zinc-500 mt-1 max-w-sm">{conta.detalhes}</div>
                  )}
                </div>
              </div>

              {/* Botão de Alternar Conexão */}
              <button
                type="button"
                disabled={carregandoId === conta.id}
                onClick={() => handleToggleConexao(conta.id, conta.nomeExibicao, conta.conectado)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                  conta.conectado
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20'
                    : 'bg-[#7B2CF6]/20 hover:bg-[#7B2CF6]/30 text-[#A78BFA] border border-[#7B2CF6]/30'
                }`}
              >
                {conta.conectado ? (
                  <>
                    <Unlink className="w-3.5 h-3.5" />
                    Desconectar
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    Conectar Conta
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Rodapé */}
        <div className="pt-3 border-t border-[#20202E] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1E1E2A] hover:bg-[#282838] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
