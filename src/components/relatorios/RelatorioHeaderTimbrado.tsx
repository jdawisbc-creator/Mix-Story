import React from 'react';
import { MixLogo } from '../brand/MixLogo';

interface RelatorioHeaderTimbradoProps {
  nomeRelatorio: string;
  periodo: string;
  dataGeracao?: string;
  usuarioResponsavel: string;
  subtitulo?: string;
}

export const RelatorioHeaderTimbrado: React.FC<RelatorioHeaderTimbradoProps> = ({
  nomeRelatorio,
  periodo,
  dataGeracao,
  usuarioResponsavel,
  subtitulo,
}) => {
  const dataHoraAtual = dataGeracao || new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="w-full bg-white text-zinc-900 border-b-2 border-[#7B2CF6] pb-4 mb-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Logo Mix oficial em fundo escuro de destaque ou timbrado */}
        <div className="flex items-center gap-3">
          <div className="bg-[#0D0D11] p-2.5 rounded-xl inline-flex items-center justify-center shadow-sm">
            <MixLogo variant="full" size="md" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7B2CF6] block">
              Mix Variedades Store
            </span>
            <span className="text-xs text-zinc-500 block">
              Sistema MIX GESTÃO • Documento Oficial
            </span>
          </div>
        </div>

        {/* Metadados Exigidos: Nome, Período, Data de Geração, Usuário Responsável */}
        <div className="text-left sm:text-right text-xs space-y-1">
          <h2 className="text-base sm:text-lg font-black tracking-tight text-zinc-900 uppercase">
            {nomeRelatorio}
          </h2>
          {subtitulo && (
            <p className="text-[11px] text-zinc-500 font-medium">{subtitulo}</p>
          )}
          <div className="flex flex-wrap items-center sm:justify-end gap-x-3 gap-y-0.5 text-zinc-600 text-[11px] pt-1">
            <span>
              <strong className="text-zinc-800">Período:</strong> {periodo}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              <strong className="text-zinc-800">Emissão:</strong> {dataHoraAtual}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              <strong className="text-zinc-800">Responsável:</strong> {usuarioResponsavel || 'Operador Mix'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
