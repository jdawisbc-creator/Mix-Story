import React from 'react';
import type { TipoPeriodo } from '../../types/relatorios';
import { Calendar, ChevronRight } from 'lucide-react';

interface FiltroPeriodoBarProps {
  periodoAtivo: TipoPeriodo;
  onPeriodoChange: (periodo: TipoPeriodo) => void;
  customInicio: string;
  customFim: string;
  onCustomInicioChange: (data: string) => void;
  onCustomFimChange: (data: string) => void;
  descricaoPeriodo: string;
}

export const FiltroPeriodoBar: React.FC<FiltroPeriodoBarProps> = ({
  periodoAtivo,
  onPeriodoChange,
  customInicio,
  customFim,
  onCustomInicioChange,
  onCustomFimChange,
  descricaoPeriodo,
}) => {
  const opcoes: { id: TipoPeriodo; label: string }[] = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'ontem', label: 'Ontem' },
    { id: 'esta_semana', label: 'Esta semana' },
    { id: 'este_mes', label: 'Este mês' },
    { id: 'mes_anterior', label: 'Mês anterior' },
    { id: 'personalizado', label: 'Período personalizado' },
  ];

  return (
    <div className="bg-[#12121A] border border-[#222230] rounded-xl p-3.5 space-y-3">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-[#7B2CF6]" />
          <span>Filtro de Período</span>
        </div>

        <div className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
          <span className="text-zinc-500">Filtrando:</span>
          <span className="text-zinc-200 font-semibold bg-[#1C1C28] px-2.5 py-1 rounded-md border border-[#2B2B3D]">
            {descricaoPeriodo}
          </span>
        </div>
      </div>

      {/* Botões dos 6 Filtros */}
      <div className="flex flex-wrap items-center gap-1.5">
        {opcoes.map((op) => {
          const isSelected = periodoAtivo === op.id;
          return (
            <button
              key={op.id}
              type="button"
              onClick={() => onPeriodoChange(op.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-[#7B2CF6] text-white shadow-[0_0_12px_rgba(123,44,246,0.35)]'
                  : 'bg-[#181822] text-zinc-400 hover:text-white hover:bg-[#20202E] border border-transparent hover:border-[#2D2D40]'
              }`}
            >
              {op.label}
            </button>
          );
        })}
      </div>

      {/* Input de datas para Período Personalizado */}
      {periodoAtivo === 'personalizado' && (
        <div className="pt-2 border-t border-[#1F1F2C] flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">De:</span>
            <input
              type="date"
              value={customInicio}
              onChange={(e) => onCustomInicioChange(e.target.value)}
              className="bg-[#181822] border border-[#2D2D40] text-zinc-100 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#7B2CF6]"
            />
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-600 hidden sm:inline" />
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">Até:</span>
            <input
              type="date"
              value={customFim}
              onChange={(e) => onCustomFimChange(e.target.value)}
              className="bg-[#181822] border border-[#2D2D40] text-zinc-100 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#7B2CF6]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
