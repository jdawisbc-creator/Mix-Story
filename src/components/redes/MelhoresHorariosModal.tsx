import React, { useState } from 'react';
import type { MelhorHorarioConfig, RedeSocialPlataforma } from '../../types';
import { RedesSociaisService } from '../../services/redesSociaisService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { X, Sparkles, Clock, Calendar, Check, Save } from 'lucide-react';

interface MelhoresHorariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  horarios: MelhorHorarioConfig[];
  onHorariosAtualizados: () => void;
}

export const MelhoresHorariosModal: React.FC<MelhoresHorariosModalProps> = ({
  isOpen,
  onClose,
  horarios,
  onHorariosAtualizados,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [listaHorarios, setListaHorarios] = useState<MelhorHorarioConfig[]>(horarios);
  const [salvando, setSalvando] = useState(false);

  if (!isOpen) return null;

  const handleAlterarHorario = (diaSemana: number, campo: keyof MelhorHorarioConfig, valor: any) => {
    setListaHorarios((prev) =>
      prev.map((item) => (item.diaSemana === diaSemana ? { ...item, [campo]: valor } : item))
    );
  };

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      await RedesSociaisService.salvarMelhoresHorarios(listaHorarios, user?.name || 'Operador');
      success('Melhores Horários Salvos', 'A grade de sugestão de horários foi atualizada.');
      onHorariosAtualizados();
      onClose();
    } catch (err) {
      error('Erro ao Salvar', 'Não foi possível atualizar os melhores horários.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#121217] border border-[#252535] rounded-2xl shadow-2xl p-6 z-10 flex flex-col max-h-[90vh]">
        {/* Topo */}
        <div className="flex items-center justify-between pb-4 border-b border-[#20202E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF8A00] to-[#7B2CF6] flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Configuração de Melhores Horários
              </h3>
              <p className="text-xs text-zinc-400">
                Grade manual de recomendações de postagem para a Mix Variedades
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informação sobre Inteligência de Horários */}
        <div className="my-4 p-3.5 rounded-xl bg-gradient-to-r from-[#FF8A00]/10 via-[#7B2CF6]/10 to-transparent border border-[#FF8A00]/30 text-xs text-zinc-300 leading-relaxed">
          <span className="font-bold text-[#FF8A00]">Dica de Planejamento Mix: </span>
          Defina os horários de pico de engajamento da sua audiência para cada dia da semana. Ao agendar
          uma nova postagem, o sistema sugerirá automaticamente o horário configurado aqui.
        </div>

        {/* Grade dos 7 Dias da Semana */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
          {listaHorarios.map((item) => (
            <div
              key={item.diaSemana}
              className="p-3.5 rounded-xl bg-[#161622] border border-[#242436] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="sm:w-36">
                <div className="text-xs font-bold text-white uppercase tracking-wide">
                  {item.nomeDia}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {item.diaSemana === 2 || item.diaSemana === 4 || item.diaSemana === 5
                    ? '⭐ Pico de Vendas'
                    : 'Padrão Semanal'}
                </div>
              </div>

              {/* Horário Principal */}
              <div className="flex items-center gap-2">
                <div className="text-[11px] text-zinc-400 font-semibold">Horário Principal:</div>
                <input
                  type="time"
                  value={item.horarioPrincipal}
                  onChange={(e) =>
                    handleAlterarHorario(item.diaSemana, 'horarioPrincipal', e.target.value)
                  }
                  className="px-2.5 py-1 bg-[#0E0E14] border border-[#2A2A3E] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#7B2CF6]"
                />
              </div>

              {/* Nível de Engajamento */}
              <div className="flex items-center gap-2">
                <div className="text-[11px] text-zinc-400 font-semibold">Engajamento:</div>
                <select
                  value={item.engajamentoEstimado}
                  onChange={(e) =>
                    handleAlterarHorario(item.diaSemana, 'engajamentoEstimado', e.target.value)
                  }
                  className="px-2 py-1 bg-[#0E0E14] border border-[#2A2A3E] rounded-lg text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="muito_alto">🔥 Muito Alto</option>
                  <option value="alto">⭐ Alto</option>
                  <option value="medio">📊 Médio</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé */}
        <div className="pt-4 mt-4 border-t border-[#20202E] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#262638] text-zinc-400 hover:text-white text-xs font-bold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7B2CF6] to-[#FF8A00] text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {salvando ? 'Salvando...' : 'Salvar Melhores Horários'}
          </button>
        </div>
      </div>
    </div>
  );
};
