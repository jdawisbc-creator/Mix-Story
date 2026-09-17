import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { TrendingUp, ArrowUpRight, DollarSign } from 'lucide-react';

interface VendaDia {
  dia: string;
  dataCompleta: string;
  valor: number;
}

interface FluxoDia {
  dia: string;
  entradas: number;
  saidas: number;
}

const DADOS_7_DIAS: VendaDia[] = [
  { dia: 'Qui', dataCompleta: '10/09', valor: 1240.0 },
  { dia: 'Sex', dataCompleta: '11/09', valor: 2150.0 },
  { dia: 'Sáb', dataCompleta: '12/09', valor: 2890.0 },
  { dia: 'Dom', dataCompleta: '13/09', valor: 980.0 },
  { dia: 'Seg', dataCompleta: '14/09', valor: 1420.0 },
  { dia: 'Ter', dataCompleta: '15/09', valor: 1680.0 },
  { dia: 'Hoje', dataCompleta: '16/09', valor: 1845.5 },
];

const DADOS_FLUXO: FluxoDia[] = [
  { dia: 'Sex', entradas: 2150.0, saidas: 480.0 },
  { dia: 'Sáb', entradas: 2890.0, saidas: 310.0 },
  { dia: 'Seg', entradas: 1420.0, saidas: 650.0 },
  { dia: 'Ter', entradas: 1680.0, saidas: 190.0 },
  { dia: 'Hoje', entradas: 2095.5, saidas: 120.0 },
];

export const DashboardCharts: React.FC = () => {
  const [hoveredVendaIndex, setHoveredVendaIndex] = useState<number | null>(6);
  const [hoveredFluxoIndex, setHoveredFluxoIndex] = useState<number | null>(4);

  const maxVenda = Math.max(...DADOS_7_DIAS.map((d) => d.valor)) * 1.15;
  const total7Dias = DADOS_7_DIAS.reduce((acc, curr) => acc + curr.valor, 0);

  // Dimensões SVG para Vendas
  const width = 500;
  const height = 180;
  const paddingX = 35;
  const paddingY = 25;

  const getX = (index: number) =>
    paddingX + (index / (DADOS_7_DIAS.length - 1)) * (width - paddingX * 2);

  const getY = (valor: number) =>
    height - paddingY - (valor / maxVenda) * (height - paddingY * 2);

  // Criar o path da linha SVG suave
  const points = DADOS_7_DIAS.map((d, i) => `${getX(i)},${getY(d.valor)}`);
  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${getX(DADOS_7_DIAS.length - 1)},${height - paddingY} L ${getX(0)},${height - paddingY} Z`;

  // Dados para Gráfico de Barras Entradas x Saídas
  const maxFluxo =
    Math.max(
      ...DADOS_FLUXO.map((f) => Math.max(f.entradas, f.saidas))
    ) * 1.15;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* GRÁFICO 1: VENDAS DOS ÚLTIMOS 7 DIAS */}
      <Card>
        <CardHeader
          title="VENDAS DOS ÚLTIMOS 7 DIAS"
          subtitle="Desempenho diário de faturamento na loja"
          action={
            <div className="text-right">
              <span className="text-[11px] font-semibold text-zinc-400 block uppercase">
                Total 7 Dias
              </span>
              <span className="text-base font-black text-white font-mono">
                R$ {total7Dias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          }
        />
        <CardBody className="p-4 pt-0">
          <div className="relative w-full h-[200px] flex items-center justify-center">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="vendasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7B2CF6" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#7B2CF6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#A76BFF" />
                  <stop offset="50%" stopColor="#7B2CF6" />
                  <stop offset="100%" stopColor="#FF8A00" />
                </linearGradient>
              </defs>

              {/* Linhas horizontais de grade sutil */}
              {[0.25, 0.5, 0.75, 1].map((p, idx) => {
                const y = height - paddingY - p * (height - paddingY * 2);
                return (
                  <line
                    key={idx}
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#222232"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Área preenchida */}
              <path d={areaPath} fill="url(#vendasGradient)" />

              {/* Linha principal */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#strokeGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Pontos interativos */}
              {DADOS_7_DIAS.map((d, i) => {
                const cx = getX(i);
                const cy = getY(d.valor);
                const isHovered = hoveredVendaIndex === i;

                return (
                  <g key={i} className="cursor-pointer">
                    {/* Linha vertical indicadora em hover */}
                    {isHovered && (
                      <line
                        x1={cx}
                        y1={paddingY}
                        x2={cx}
                        y2={height - paddingY}
                        stroke="#FF8A00"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Ponto */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? '#FF8A00' : '#7B2CF6'}
                      stroke="#FFFFFF"
                      strokeWidth={isHovered ? 2.5 : 1.5}
                      onMouseEnter={() => setHoveredVendaIndex(i)}
                    />

                    {/* Rótulos dos dias no eixo X */}
                    <text
                      x={cx}
                      y={height - 5}
                      textAnchor="middle"
                      fill={isHovered ? '#FFFFFF' : '#8E8E9E'}
                      fontSize="11"
                      fontWeight={isHovered ? 'bold' : 'normal'}
                      fontFamily="monospace"
                    >
                      {d.dia}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Card Flutuante de Informação do Dia Selecionado */}
          {hoveredVendaIndex !== null && (
            <div className="mt-2 p-2.5 rounded-xl bg-[#171724] border border-[#2B2B3E] flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                Dia <strong className="text-white">{DADOS_7_DIAS[hoveredVendaIndex].dataCompleta}</strong> ({DADOS_7_DIAS[hoveredVendaIndex].dia}):
              </span>
              <span className="font-mono font-black text-[#FF8A00] text-sm">
                R$ {DADOS_7_DIAS[hoveredVendaIndex].valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* GRÁFICO 2: ENTRADAS X SAÍDAS */}
      <Card>
        <CardHeader
          title="ENTRADAS X SAÍDAS"
          subtitle="Comparativo direto do fluxo financeiro recente"
          action={
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Entradas
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Saídas
              </span>
            </div>
          }
        />
        <CardBody className="p-4 pt-0">
          <div className="h-[200px] flex items-end justify-between gap-3 pt-4 px-2">
            {DADOS_FLUXO.map((item, idx) => {
              const alturaEntrada = (item.entradas / maxFluxo) * 140;
              const alturaSaida = (item.saidas / maxFluxo) * 140;
              const isHovered = hoveredFluxoIndex === idx;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                  onMouseEnter={() => setHoveredFluxoIndex(idx)}
                >
                  <div className="w-full flex items-end justify-center gap-1.5 h-[145px] pb-1 border-b border-[#252535]">
                    {/* Barra de Entradas */}
                    <div
                      style={{ height: `${Math.max(alturaEntrada, 6)}px` }}
                      className={`w-4 sm:w-5 rounded-t-md transition-all duration-300 ${
                        isHovered
                          ? 'bg-emerald-400 shadow-lg shadow-emerald-500/30'
                          : 'bg-emerald-500/70'
                      }`}
                      title={`Entradas: R$ ${item.entradas.toFixed(2)}`}
                    />

                    {/* Barra de Saídas */}
                    <div
                      style={{ height: `${Math.max(alturaSaida, 6)}px` }}
                      className={`w-4 sm:w-5 rounded-t-md transition-all duration-300 ${
                        isHovered
                          ? 'bg-rose-400 shadow-lg shadow-rose-500/30'
                          : 'bg-rose-500/70'
                      }`}
                      title={`Saídas: R$ ${item.saidas.toFixed(2)}`}
                    />
                  </div>

                  {/* Dia da Semana */}
                  <span
                    className={`text-[11px] font-mono mt-1 ${
                      isHovered ? 'text-white font-bold' : 'text-zinc-400'
                    }`}
                  >
                    {item.dia}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Detalhe do Dia Selecionado */}
          {hoveredFluxoIndex !== null && (
            <div className="mt-2 p-2.5 rounded-xl bg-[#171724] border border-[#2B2B3E] flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-semibold">
                {DADOS_FLUXO[hoveredFluxoIndex].dia}:
              </span>
              <div className="flex items-center gap-4 font-mono">
                <span className="text-emerald-400">
                  + R$ {DADOS_FLUXO[hoveredFluxoIndex].entradas.toFixed(2)}
                </span>
                <span className="text-rose-400">
                  - R$ {DADOS_FLUXO[hoveredFluxoIndex].saidas.toFixed(2)}
                </span>
                <span className="text-white font-bold pl-2 border-l border-white/10">
                  Saldo: R$ {(DADOS_FLUXO[hoveredFluxoIndex].entradas - DADOS_FLUXO[hoveredFluxoIndex].saidas).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
