import React, { useEffect, useState } from 'react';
import type { OrdemServico, ItemOrdemServico, AprovacaoClienteOS, ConfiguracaoLoja } from '../../types';
import { ConfigService } from '../../services/configService';
import {
  User,
  Calendar,
  Settings,
  CreditCard,
  ShieldCheck,
  FileText,
  PenTool,
  ShoppingCart,
  Handshake,
  Star,
  Check,
  Phone,
  MapPin,
} from 'lucide-react';

interface ModeloOficialDocumentoProps {
  ordem: Partial<OrdemServico>;
  onChange?: (campo: keyof OrdemServico, valor: any) => void;
  onItemChange?: (index: number, campo: keyof ItemOrdemServico, valor: any) => void;
  isEditable?: boolean;
  isPrintOnly?: boolean;
  config?: ConfiguracaoLoja;
}

export const ModeloOficialDocumento: React.FC<ModeloOficialDocumentoProps> = ({
  ordem,
  onChange,
  onItemChange,
  isEditable = false,
  isPrintOnly = false,
  config: configProp,
}) => {
  const [lojaConfig, setLojaConfig] = useState<ConfiguracaoLoja | null>(configProp || null);

  useEffect(() => {
    if (configProp) {
      setLojaConfig(configProp);
      return;
    }
    ConfigService.getConfig().then((cfg) => {
      setLojaConfig(cfg);
    }).catch(() => {});
  }, [configProp]);

  // Garante exatamente 10 linhas na tabela como no modelo oficial da imagem
  const itens = Array.from({ length: 10 }, (_, index) => {
    const itemExistente = ordem.itens?.[index];
    return (
      itemExistente || {
        item: index + 1,
        descricao: '',
        quantidade: 0,
        valorUnitario: 0,
        valorTotal: 0,
      }
    );
  });

  const formasPagamento = ordem.formasPagamento || [];
  const isFormaAtiva = (forma: string) => formasPagamento.includes(forma);

  const toggleForma = (forma: string) => {
    if (!isEditable || !onChange) return;
    if (isFormaAtiva(forma)) {
      onChange('formasPagamento', formasPagamento.filter((f) => f !== forma));
    } else {
      onChange('formasPagamento', [...formasPagamento, forma]);
    }
  };

  const setAprovacao = (valor: AprovacaoClienteOS) => {
    if (!isEditable || !onChange) return;
    onChange('aprovacaoCliente', valor);
  };

  const totalCalculado = itens.reduce((acc, it) => {
    const q = Number(it.quantidade) || 0;
    const v = Number(it.valorUnitario) || 0;
    return acc + q * v;
  }, 0);

  return (
    <div
      className={`modelo-oficial-os w-full mx-auto select-none bg-black text-slate-900 overflow-hidden relative ${
        isPrintOnly
          ? 'printable-os-sheet max-w-[210mm]'
          : 'max-w-[840px] rounded-2xl border-2 border-purple-600/80 shadow-[0_0_40px_rgba(147,51,234,0.3)] my-2'
      }`}
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      {/* Moldura Cyber Externa com Degradê Preto/Roxo Profundo */}
      <div className="p-3 sm:p-5 bg-gradient-to-b from-[#090314] via-[#05010b] to-[#0c0419] relative">
        {/* =========================================================================
            1. CABEÇALHO OFICIAL: FRASE + LOGO 3D MIX VARIEDADES STORE + 4 DESTAQUES
        ========================================================================= */}
        <div className="relative rounded-2xl p-3 sm:p-4 mb-3 border-2 border-purple-600/70 bg-gradient-to-r from-[#120526] via-[#080214] to-[#120526] overflow-hidden shadow-2xl">
          {/* Luzes Cyberpunk */}
          <div className="absolute -top-10 left-1/3 w-64 h-32 bg-purple-600/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 right-1/4 w-64 h-32 bg-amber-500/20 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-12 gap-2 items-center relative z-10">
            {/* Esquerda: Slogan Oficial Parametrizável */}
            <div className="col-span-3 text-left pl-1 sm:pl-2">
              <div
                className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-100 leading-tight line-clamp-3 overflow-hidden"
                title={lojaConfig?.ordemServico?.slogan || lojaConfig?.slogan || 'TUDO QUE VOCÊ PRECISA, EM UM SÓ LUGAR!'}
              >
                {lojaConfig?.ordemServico?.slogan || lojaConfig?.slogan || (
                  <>
                    TUDO QUE
                    <br />
                    <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]">
                      VOCÊ PRECISA,
                    </span>
                    <br />
                    <span className="text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
                      EM UM SÓ LUGAR!
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Centro: Logo Oficial Metalizado ou Logo Personalizado Seguro */}
            <div className="col-span-6 flex flex-col items-center justify-center text-center">
              {lojaConfig?.ordemServico?.usarLogoPersonalizado && (lojaConfig?.ordemServico?.logoUrl || lojaConfig?.logoUrl) ? (
                <div className="flex flex-col items-center justify-center py-1">
                  <img
                    src={lojaConfig.ordemServico.logoUrl || lojaConfig.logoUrl}
                    alt="Logo da Loja"
                    referrerPolicy="no-referrer"
                    className="max-h-12 max-w-[170px] object-contain rounded drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]"
                  />
                  <span className="text-[10px] sm:text-[11px] font-black tracking-wider text-amber-400 mt-1 uppercase truncate max-w-[180px]">
                    {lojaConfig.nomeFantasia || 'MIX VARIEDADES STORE'}
                  </span>
                </div>
              ) : (
                <>
                  {/* Sacola Dourada com Carrinho Neon */}
                  <div className="relative -mb-1">
                    <div className="w-12 h-10 sm:w-14 sm:h-11 bg-gradient-to-b from-amber-400 via-yellow-400 to-amber-600 rounded-t-lg rounded-b-md shadow-[0_0_18px_rgba(245,158,11,0.6)] flex items-center justify-center border-2 border-yellow-200">
                      <div className="w-5 h-5 rounded-full border-2 border-black/80 flex items-center justify-center">
                        <ShoppingCart className="w-3 h-3 text-black stroke-[3]" />
                      </div>
                    </div>
                  </div>

                  {/* MIX Tipografia Metálica */}
                  <div className="relative leading-none">
                    <span
                      className="text-4xl sm:text-6xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-200 to-cyan-300 drop-shadow-[0_4px_14px_rgba(168,85,247,0.8)]"
                      style={{ fontFamily: "'Bebas Neue', 'Montserrat', sans-serif" }}
                    >
                      {lojaConfig?.nomeFantasia?.toUpperCase().includes('MIX') ? 'MIX' : (lojaConfig?.nomeFantasia?.slice(0, 4) || 'MIX')}
                    </span>
                  </div>

                  {/* Badge VARIEDADES */}
                  <div className="-mt-1 px-4 py-0.5 rounded-full bg-black border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                    <span className="text-[11px] sm:text-xs font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 uppercase">
                      {lojaConfig?.nomeFantasia?.toUpperCase().includes('VARIEDADES') ? 'VARIEDADES' : (lojaConfig?.nomeFantasia?.slice(4, 14) || 'VARIEDADES')}
                    </span>
                  </div>

                  {/* STORE */}
                  <div className="text-[9px] sm:text-[11px] font-black tracking-[0.3em] text-amber-400 mt-0.5 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                    STORE
                  </div>
                </>
              )}
            </div>

            {/* Direita: 4 Destaques com Ícones Dourados */}
            <div className="col-span-3 text-right pr-1 sm:pr-2 space-y-1 sm:space-y-1.5">
              <div className="flex items-center justify-end gap-1.5 text-[9px] sm:text-[11px] font-black tracking-wider text-amber-400">
                <span>VARIEDADE</span>
                <ShoppingCart className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </div>
              <div className="flex items-center justify-end gap-1.5 text-[9px] sm:text-[11px] font-black tracking-wider text-amber-400">
                <span>QUALIDADE</span>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </div>
              <div className="flex items-center justify-end gap-1.5 text-[9px] sm:text-[11px] font-black tracking-wider text-amber-400">
                <span>CONFIANÇA</span>
                <Handshake className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </div>
              <div className="flex items-center justify-end gap-1.5 text-[9px] sm:text-[11px] font-black tracking-wider text-amber-400">
                <span>SEMPRE COM VOCÊ</span>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              </div>
            </div>
          </div>

          {/* Faixa Roxa: PRODUTOS • SERVIÇOS • SOLUÇÕES */}
          <div className="mt-2.5 py-1 px-4 rounded-md bg-gradient-to-r from-purple-800 via-fuchsia-600 to-purple-800 text-center border-t border-b border-purple-400/50 shadow-[0_0_15px_rgba(147,51,234,0.6)]">
            <span className="text-[10px] sm:text-xs font-black tracking-[0.25em] text-white uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              PRODUTOS • SERVIÇOS • SOLUÇÕES
            </span>
          </div>

          {/* Dados da Loja Parametrizáveis no Cabeçalho (Sem estourar layout) */}
          {lojaConfig?.ordemServico?.mostrarDadosLoja !== false && (lojaConfig?.telefone || lojaConfig?.endereco) && (
            <div className="mt-1.5 pt-1 border-t border-purple-500/30 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[9px] text-purple-200/90 font-medium overflow-hidden">
              {lojaConfig.telefone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span>{lojaConfig.telefone}</span>
                </span>
              )}
              {lojaConfig.whatsapp && lojaConfig.whatsapp !== lojaConfig.telefone && (
                <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                  <span>Whats: {lojaConfig.whatsapp}</span>
                </span>
              )}
              {lojaConfig.endereco && (
                <span className="flex items-center gap-1 truncate max-w-[280px]">
                  <MapPin className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span className="truncate">{lojaConfig.endereco}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* =========================================================================
            2. TÍTULO: ORDEM DE SERVIÇO & Nº DA OS
        ========================================================================= */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Caixa Título */}
          <div className="flex-1 py-1.5 px-4 sm:px-6 rounded-2xl bg-black border-[3px] border-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.5)] flex items-center">
            <span
              className="text-lg sm:text-3xl font-black tracking-wider text-white mr-2"
              style={{ fontFamily: "'Bebas Neue', 'Montserrat', sans-serif" }}
            >
              ORDEM DE
            </span>
            <span
              className="text-lg sm:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]"
              style={{ fontFamily: "'Bebas Neue', 'Montserrat', sans-serif" }}
            >
              SERVIÇO
            </span>
          </div>

          {/* Caixa Nº DA OS */}
          <div className="py-1.5 px-3 sm:px-4 rounded-2xl bg-black border-[3px] border-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.5)] flex items-center gap-2">
            <span className="text-[11px] sm:text-xs font-black text-white whitespace-nowrap tracking-wider">
              Nº DA OS:
            </span>
            <div className="bg-white px-3 py-1 rounded-xl border border-slate-300 min-w-[95px] sm:min-w-[125px] text-center shadow-inner">
              <span className="font-mono font-black text-xs sm:text-sm text-slate-950 tracking-wider">
                {ordem.numeroOS || 'OS #0001'}
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. DADOS DO CLIENTE & DATAS (2 COLUNAS)
        ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
          {/* DADOS DO CLIENTE */}
          <div className="md:col-span-7 bg-white rounded-2xl border-2 border-purple-700 shadow-md overflow-hidden flex flex-col">
            {/* Header Roxo Metálico */}
            <div className="py-1.5 px-3 bg-gradient-to-r from-purple-900 via-purple-800 to-fuchsia-950 flex items-center gap-2 border-b-2 border-purple-500">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-black text-white tracking-wider uppercase">
                DADOS DO CLIENTE
              </span>
            </div>

            {/* Campos Estilo Pílula Branca da Imagem */}
            <div className="p-3 space-y-2 flex-1 flex flex-col justify-center text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 whitespace-nowrap w-28">
                  Nome do cliente:
                </span>
                {isEditable ? (
                  <input
                    type="text"
                    value={ordem.clienteNome || ''}
                    onChange={(e) => onChange && onChange('clienteNome', e.target.value)}
                    placeholder="Nome completo do cliente..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 text-xs shadow-inner outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500"
                  />
                ) : (
                  <div className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 text-xs shadow-inner min-h-[32px] flex items-center">
                    {ordem.clienteNome || ''}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 whitespace-nowrap w-28">
                  Telefone:
                </span>
                {isEditable ? (
                  <input
                    type="text"
                    value={ordem.clienteTelefone || ''}
                    onChange={(e) => onChange && onChange('clienteTelefone', e.target.value)}
                    placeholder="(11) 98452-1100"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-mono font-semibold text-slate-900 text-xs shadow-inner outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500"
                  />
                ) : (
                  <div className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-mono font-semibold text-slate-900 text-xs shadow-inner min-h-[32px] flex items-center">
                    {ordem.clienteTelefone || ''}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DATAS */}
          <div className="md:col-span-5 bg-white rounded-2xl border-2 border-purple-700 shadow-md overflow-hidden flex flex-col">
            {/* Header Roxo Metálico */}
            <div className="py-1.5 px-3 bg-gradient-to-r from-purple-900 via-purple-800 to-fuchsia-950 flex items-center gap-2 border-b-2 border-purple-500">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
                <Calendar className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-black text-white tracking-wider uppercase">
                DATAS
              </span>
            </div>

            {/* Campos de Datas com Barras / / */}
            <div className="p-3 space-y-2 flex-1 flex flex-col justify-center text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800 whitespace-nowrap">
                  Data de entrada:
                </span>
                {isEditable ? (
                  <input
                    type="date"
                    value={ordem.dataEntrada || ''}
                    onChange={(e) => onChange && onChange('dataEntrada', e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 text-xs text-center min-w-[130px] shadow-inner outline-none focus:border-purple-600"
                  />
                ) : (
                  <div className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 text-xs text-center min-w-[130px] shadow-inner">
                    {ordem.dataEntrada
                      ? ordem.dataEntrada.includes('-')
                        ? `${ordem.dataEntrada.split('-')[2]} / ${ordem.dataEntrada.split('-')[1]} / ${ordem.dataEntrada.split('-')[0]}`
                        : ordem.dataEntrada
                      : '/   /'}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800 whitespace-nowrap">
                  Data de entrega do pedido:
                </span>
                {isEditable ? (
                  <input
                    type="date"
                    value={ordem.dataEntrega || ''}
                    onChange={(e) => onChange && onChange('dataEntrega', e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 text-xs text-center min-w-[130px] shadow-inner outline-none focus:border-purple-600"
                  />
                ) : (
                  <div className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 text-xs text-center min-w-[130px] shadow-inner">
                    {ordem.dataEntrega
                      ? ordem.dataEntrega.includes('-')
                        ? `${ordem.dataEntrega.split('-')[2]} / ${ordem.dataEntrega.split('-')[1]} / ${ordem.dataEntrega.split('-')[0]}`
                        : ordem.dataEntrega
                      : '/   /'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. SERVIÇOS / ITENS (EXATAMENTE 10 LINHAS NUMERADAS 01 A 10)
        ========================================================================= */}
        <div className="bg-white rounded-2xl border-2 border-purple-700 shadow-md overflow-hidden mb-3">
          {/* Header Roxo Metálico com Engrenagem */}
          <div className="py-1.5 px-3 bg-gradient-to-r from-purple-900 via-purple-800 to-fuchsia-950 flex items-center gap-2 border-b-2 border-purple-500">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Settings className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-black text-white tracking-wider uppercase">
              SERVIÇOS / ITENS
            </span>
          </div>

          {/* Tabela de 10 Linhas Oficiais */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-purple-950 text-white font-bold text-[11px] border-b border-purple-900">
                  <th className="py-1.5 px-2 text-center w-12 border-r border-purple-900">
                    Item
                  </th>
                  <th className="py-1.5 px-3 border-r border-purple-900">
                    Descrição do serviço
                  </th>
                  <th className="py-1.5 px-2 text-center w-14 border-r border-purple-900">
                    Qtd.
                  </th>
                  <th className="py-1.5 px-3 text-right w-28 border-r border-purple-900">
                    Valor unitário
                  </th>
                  <th className="py-1.5 px-3 text-right w-28">
                    Valor total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {itens.map((it, idx) => {
                  const numeroFormatado = String(idx + 1).padStart(2, '0');
                  const linhaTotal = (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0);

                  return (
                    <tr key={idx} className="h-7 hover:bg-slate-50 transition-colors">
                      {/* 01, 02, 03... */}
                      <td className="py-1 px-2 text-center font-mono font-bold text-slate-800 border-r border-slate-300 bg-slate-50/50">
                        {numeroFormatado}
                      </td>

                      {/* Descrição */}
                      <td className="py-0.5 px-2 border-r border-slate-300">
                        {isEditable ? (
                          <input
                            type="text"
                            value={it.descricao || ''}
                            onChange={(e) =>
                              onItemChange && onItemChange(idx, 'descricao', e.target.value)
                            }
                            placeholder={`Serviço ${numeroFormatado}...`}
                            className="w-full px-2 py-0.5 text-xs text-slate-900 font-medium outline-none bg-transparent focus:bg-purple-50 rounded"
                          />
                        ) : (
                          <span className="text-slate-900 font-medium truncate block">
                            {it.descricao || ''}
                          </span>
                        )}
                      </td>

                      {/* Quantidade */}
                      <td className="py-0.5 px-1 text-center font-mono border-r border-slate-300">
                        {isEditable ? (
                          <input
                            type="number"
                            min="0"
                            value={it.quantidade || ''}
                            onChange={(e) =>
                              onItemChange &&
                              onItemChange(idx, 'quantidade', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-center font-mono text-xs text-slate-800 outline-none bg-transparent focus:bg-purple-50 rounded"
                          />
                        ) : (
                          <span className="text-slate-800 font-semibold">
                            {it.quantidade ? it.quantidade : ''}
                          </span>
                        )}
                      </td>

                      {/* Valor Unitário */}
                      <td className="py-0.5 px-2 text-right font-mono border-r border-slate-300">
                        {isEditable ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.valorUnitario || ''}
                            onChange={(e) =>
                              onItemChange &&
                              onItemChange(idx, 'valorUnitario', parseFloat(e.target.value) || 0)
                            }
                            placeholder="0,00"
                            className="w-full text-right font-mono text-xs text-slate-800 outline-none bg-transparent focus:bg-purple-50 rounded"
                          />
                        ) : (
                          <span className="text-slate-800">
                            {it.valorUnitario ? `R$ ${Number(it.valorUnitario).toFixed(2)}` : ''}
                          </span>
                        )}
                      </td>

                      {/* Valor Total da Linha */}
                      <td className="py-1 px-3 text-right font-mono font-bold text-slate-900">
                        {linhaTotal > 0 ? `R$ ${linhaTotal.toFixed(2)}` : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Barra de Valor Total Conectada */}
          <div className="p-2 bg-slate-100 border-t-2 border-slate-300 flex items-center justify-end">
            <div className="flex items-center gap-0 shadow-md">
              <div className="px-4 py-1.5 bg-black border-2 border-r-0 border-purple-600 rounded-l-xl flex items-center">
                <span className="text-xs font-black tracking-wider text-white uppercase">
                  VALOR TOTAL DA ORDEM DE SERVIÇO
                </span>
              </div>
              <div className="px-5 py-1 bg-[#edf2f7] border-2 border-purple-600 rounded-r-xl flex items-center min-w-[140px] justify-between">
                <span className="text-xs font-black text-slate-700 mr-1">R$</span>
                <span className="text-base font-mono font-black text-slate-950">
                  {totalCalculado.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            5. FORMAS DE PAGAMENTO & APROVAÇÃO DO CLIENTE (2 COLS)
        ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
          {/* FORMAS DE PAGAMENTO */}
          <div className="md:col-span-7 bg-white rounded-2xl border-2 border-purple-700 shadow-md overflow-hidden flex flex-col">
            <div className="py-1.5 px-3 bg-gradient-to-r from-purple-900 via-purple-800 to-fuchsia-950 flex items-center gap-2 border-b-2 border-purple-500">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
                <CreditCard className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-black text-white tracking-wider uppercase">
                FORMAS DE PAGAMENTO
              </span>
            </div>

            <div className="p-3 text-xs flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {/* Pix */}
                <div
                  onClick={() => toggleForma('Pix')}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isEditable ? 'hover:opacity-80' : ''
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      isFormaAtiva('Pix')
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-slate-700 bg-white'
                    }`}
                  >
                    {isFormaAtiva('Pix') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="font-bold text-slate-800">Pix</span>
                </div>

                {/* Cartão de Crédito */}
                <div
                  onClick={() => toggleForma('Cartão de Crédito')}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isEditable ? 'hover:opacity-80' : ''
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      isFormaAtiva('Cartão de Crédito')
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-slate-700 bg-white'
                    }`}
                  >
                    {isFormaAtiva('Cartão de Crédito') && (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </div>
                  <span className="font-bold text-slate-800">Cartão de Crédito</span>
                </div>

                {/* Dinheiro */}
                <div
                  onClick={() => toggleForma('Dinheiro')}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isEditable ? 'hover:opacity-80' : ''
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      isFormaAtiva('Dinheiro')
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-slate-700 bg-white'
                    }`}
                  >
                    {isFormaAtiva('Dinheiro') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="font-bold text-slate-800">Dinheiro</span>
                </div>

                {/* Transferência */}
                <div
                  onClick={() => toggleForma('Transferência')}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isEditable ? 'hover:opacity-80' : ''
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      isFormaAtiva('Transferência')
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-slate-700 bg-white'
                    }`}
                  >
                    {isFormaAtiva('Transferência') && (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </div>
                  <span className="font-bold text-slate-800">Transferência</span>
                </div>

                {/* Cartão de Débito */}
                <div
                  onClick={() => toggleForma('Cartão de Débito')}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isEditable ? 'hover:opacity-80' : ''
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      isFormaAtiva('Cartão de Débito')
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-slate-700 bg-white'
                    }`}
                  >
                    {isFormaAtiva('Cartão de Débito') && (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </div>
                  <span className="font-bold text-slate-800">Cartão de Débito</span>
                </div>

                {/* Outros com linha de preenchimento */}
                <div className="flex items-center gap-1.5">
                  <div
                    onClick={() => toggleForma('Outros')}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer ${
                      isFormaAtiva('Outros')
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-slate-700 bg-white'
                    }`}
                  >
                    {isFormaAtiva('Outros') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span
                    onClick={() => toggleForma('Outros')}
                    className="font-bold text-slate-800 shrink-0 cursor-pointer"
                  >
                    Outros
                  </span>
                  {isEditable ? (
                    <input
                      type="text"
                      value={ordem.outrosPagamento || ''}
                      onChange={(e) => onChange && onChange('outrosPagamento', e.target.value)}
                      placeholder="Especifique..."
                      className="border-b border-slate-500 flex-1 min-w-[70px] text-xs text-slate-800 px-1 outline-none bg-transparent"
                    />
                  ) : (
                    <div className="border-b border-slate-500 flex-1 min-w-[70px] text-[11px] text-slate-800 pl-1 font-semibold truncate">
                      {ordem.outrosPagamento || ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* APROVAÇÃO DO CLIENTE */}
          <div className="md:col-span-5 bg-white rounded-2xl border-2 border-purple-700 shadow-md overflow-hidden flex flex-col">
            <div className="py-1.5 px-3 bg-gradient-to-r from-purple-900 via-purple-800 to-fuchsia-950 flex items-center gap-2 border-b-2 border-purple-500">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-black text-white tracking-wider uppercase">
                APROVAÇÃO DO CLIENTE
              </span>
            </div>

            <div className="p-3 text-xs flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-around gap-2">
                {/* Sim */}
                <div
                  onClick={() => setAprovacao('SIM')}
                  className={`flex items-center gap-1.5 cursor-pointer ${
                    isEditable ? 'hover:opacity-80' : ''
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      ordem.aprovacaoCliente === 'SIM'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-700 bg-white'
                    }`}
                  >
                    {ordem.aprovacaoCliente === 'SIM' && (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </div>
                  <span className="font-bold text-slate-800">Sim</span>
                </div>

                {/* Não */}
                <div
                  onClick={() => setAprovacao('NÃO')}
                  className={`flex items-center gap-1.5 cursor-pointer ${
                    isEditable ? 'hover:opacity-80' : ''
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      ordem.aprovacaoCliente === 'NÃO'
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : 'border-slate-700 bg-white'
                    }`}
                  >
                    {ordem.aprovacaoCliente === 'NÃO' && (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </div>
                  <span className="font-bold text-slate-800">Não</span>
                </div>

                {/* Sem aprovação */}
                <div
                  onClick={() => setAprovacao('SEM APROVAÇÃO')}
                  className={`flex items-center gap-1.5 cursor-pointer ${
                    isEditable ? 'hover:opacity-80' : ''
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      ordem.aprovacaoCliente === 'SEM APROVAÇÃO'
                        ? 'border-amber-600 bg-amber-600 text-white'
                        : 'border-slate-700 bg-white'
                    }`}
                  >
                    {ordem.aprovacaoCliente === 'SEM APROVAÇÃO' && (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </div>
                  <span className="font-bold text-slate-800">Sem aprovação</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            6. OBSERVAÇÕES (COM LINHAS PAUTADAS IGUAL À IMAGEM)
        ========================================================================= */}
        <div className="bg-white rounded-2xl border-2 border-purple-700 shadow-md overflow-hidden mb-3">
          <div className="py-1.5 px-3 bg-gradient-to-r from-purple-900 via-purple-800 to-fuchsia-950 flex items-center gap-2 border-b-2 border-purple-500">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-black text-white tracking-wider uppercase">
              OBSERVAÇÕES
            </span>
          </div>

          <div className="p-3 text-xs bg-white min-h-[75px] relative">
            {isEditable ? (
              <textarea
                rows={3}
                value={ordem.observacoes || ''}
                onChange={(e) => onChange && onChange('observacoes', e.target.value)}
                placeholder="Digite aqui as observações da ordem de serviço..."
                className="w-full text-xs text-slate-900 font-medium bg-transparent outline-none leading-loose z-10 relative resize-none"
              />
            ) : (
              <p className="text-slate-900 font-medium leading-loose z-10 relative">
                {ordem.observacoes || ''}
              </p>
            )}

            {/* Linhas pautadas elegantes como na folha impressa */}
            <div className="absolute inset-0 p-3 pt-7 space-y-5 pointer-events-none opacity-30">
              <div className="border-b border-slate-600" />
              <div className="border-b border-slate-600" />
              <div className="border-b border-slate-600" />
            </div>
          </div>
        </div>

        {/* =========================================================================
            7. ASSINATURA DO CLIENTE
        ========================================================================= */}
        <div className="bg-white rounded-2xl border-2 border-purple-700 shadow-md p-3 mb-3 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 flex-1 w-full">
            <PenTool className="w-4 h-4 text-slate-800 shrink-0" />
            <span className="font-bold text-slate-900 whitespace-nowrap">
              ASSINATURA DO CLIENTE
            </span>
            <div className="border-b-2 border-slate-500 flex-1 h-4" />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="font-bold text-slate-900">Data:</span>
            <span className="font-mono text-slate-800 tracking-wider">
              ____ / ____ / ________
            </span>
          </div>
        </div>

        {/* =========================================================================
            8. RODAPÉ CYBERPUNK MIX VARIEDADES STORE
        ========================================================================= */}
        <div className="relative rounded-2xl py-2.5 px-4 bg-gradient-to-r from-[#120526] via-[#05010b] to-[#120526] border-2 border-purple-800 shadow-xl flex items-center justify-between">
          <div className="w-8 sm:w-12 h-1 bg-gradient-to-r from-amber-400 to-transparent rounded-full shrink-0" />
          <div className="text-center px-2 overflow-hidden max-w-[550px]">
            <div className="text-xs sm:text-sm font-black tracking-[0.25em] text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] truncate">
              {lojaConfig?.nomeFantasia || 'MIX VARIEDADES STORE'}
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold tracking-wider text-amber-400 uppercase mt-0.5 truncate">
              {lojaConfig?.ordemServico?.textoRodape || lojaConfig?.ordemServico?.slogan || lojaConfig?.slogan || 'TUDO QUE VOCÊ PRECISA, EM UM SÓ LUGAR!'}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 shrink-0">
            <ShoppingCart className="w-4 h-4 text-amber-400" />
            <div className="w-4 sm:w-6 h-1 bg-amber-400 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
