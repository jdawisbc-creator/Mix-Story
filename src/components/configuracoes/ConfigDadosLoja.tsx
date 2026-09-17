import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Store, Banknote, Save, Image, Phone, MapPin, Sparkles, Instagram } from 'lucide-react';
import type { ConfiguracaoLoja } from '../../types';

interface ConfigDadosLojaProps {
  config: ConfiguracaoLoja;
  onSalvar: (novaConfig: Partial<ConfiguracaoLoja>, descricaoAuditoria: string) => Promise<void>;
}

export const ConfigDadosLoja: React.FC<ConfigDadosLojaProps> = ({ config, onSalvar }) => {
  const [nomeFantasia, setNomeFantasia] = useState(config.nomeFantasia || 'Mix Variedades Store');
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  const [telefone, setTelefone] = useState(config.telefone || '');
  const [whatsapp, setWhatsapp] = useState(config.whatsapp || '');
  const [instagram, setInstagram] = useState(config.instagram || '@mixvariedadesstore');
  const [endereco, setEndereco] = useState(config.endereco || '');
  const [slogan, setSlogan] = useState(config.slogan || 'Tudo que você precisa, em um só lugar!');
  const [valorPadraoTroco, setValorPadraoTroco] = useState<number>(config.valorPadraoTroco || 200.0);
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await onSalvar(
        {
          nomeFantasia: nomeFantasia.trim(),
          logoUrl: logoUrl.trim(),
          telefone: telefone.trim(),
          whatsapp: whatsapp.trim(),
          instagram: instagram.trim(),
          endereco: endereco.trim(),
          slogan: slogan.trim(),
          valorPadraoTroco: Number(valorPadraoTroco) || 200.0,
        },
        `Dados da loja e valor padrão de troco (R$ ${(Number(valorPadraoTroco) || 200).toFixed(2)}) atualizados.`
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. DADOS DA LOJA */}
      <Card variant="elevated">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#FF8A00]" />
              <span>DADOS DA LOJA</span>
            </div>
          }
          subtitle="Identidade visual, contatos e endereço da Mix Variedades Store."
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome da Loja *"
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              placeholder="Mix Variedades Store"
              required
            />
            <Input
              label="Slogan da Loja"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Tudo que você precisa, em um só lugar!"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Telefone Comercial"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 98765-4321"
            />
            <Input
              label="WhatsApp da Loja"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 98765-4321"
            />
            <Input
              label="Instagram (@loja)"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@mixvariedadesstore"
            />
          </div>

          <Input
            label="Endereço Completo da Loja"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Rua do Comércio, 120 — Centro, São Paulo - SP"
          />

          {/* Logo da Loja */}
          <div className="p-4 rounded-xl bg-[#141420] border border-[#222234] space-y-3">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-[#A76BFF]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Logo da Loja
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8">
                <Input
                  label="URL da Imagem do Logo"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://exemplo.com/logo-mix.png"
                />
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Recomendado: imagem transparente PNG ou SVG horizontal (altura máx. 80px).
                </span>
              </div>

              <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl bg-[#0F0F1A] border border-[#2A2A3E]">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                  Prévia do Logo
                </span>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo Prévia"
                    className="max-h-12 max-w-[160px] object-contain rounded"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-[11px] text-zinc-500 italic py-2">
                    Logo padrão 3D metálico ativo
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 2. PARÂMETROS DO CAIXA */}
      <Card variant="elevated">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-400" />
              <span>PARÂMETROS DO CAIXA</span>
            </div>
          }
          subtitle="Defina o valor sugerido para abertura e troco da gaveta diária."
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <Input
                label="Valor Padrão para Troco (R$) *"
                type="number"
                step="0.01"
                min="0"
                value={valorPadraoTroco}
                onChange={(e) => setValorPadraoTroco(Number(e.target.value))}
                required
              />
              <span className="text-[11px] text-zinc-400 mt-1 block leading-relaxed">
                Ao abrir o caixa do dia, este valor será sugerido automaticamente na tela de abertura, agilizando a rotina do operador.
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              <span className="font-bold block text-emerald-200 mb-1">
                Troco Padrão Vigente:
              </span>
              R$ {(Number(valorPadraoTroco) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <p className="text-[11px] text-zinc-400 mt-1">
                Este valor não impede que o colaborador digite outro valor no momento da abertura caso o troco real seja diferente.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* BOTÃO SALVAR */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="accent"
          size="lg"
          icon={<Save className="w-4 h-4" />}
          disabled={salvando}
        >
          {salvando ? 'Salvando...' : 'Salvar Dados da Loja & Caixa'}
        </Button>
      </div>
    </form>
  );
};
