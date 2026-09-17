import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ModeloOficialDocumento } from '../ordens/ModeloOficialDocumento';
import type { ConfiguracaoLoja, OrdemServico } from '../../types';
import {
  FileText,
  Save,
  Image,
  Sparkles,
  ShieldCheck,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ConfigOrdemServicoProps {
  config: ConfiguracaoLoja;
  onSalvar: (novaConfig: Partial<ConfiguracaoLoja>, descricaoAuditoria: string) => Promise<void>;
}

// OS de exemplo para o Live Preview sem quebrar o layout oficial
const OS_PREVIEW_EXEMPLO: Partial<OrdemServico> = {
  id: 'os-preview-exemplo',
  numeroOS: 'OS #0042',
  numeroSequencial: 42,
  dataEntrada: '16/09/2026',
  dataEntrega: '18/09/2026',
  clienteNome: 'Carlos Eduardo Mendes',
  clienteTelefone: '(11) 98765-4321',
  status: 'em_producao',
  aprovacaoCliente: 'SIM',
  formasPagamento: ['Pix'],
  valorTotal: 370.0,
  observacoes: 'Garantia legal de 90 dias sobre a peça e o serviço. Aparelho higienizado.',
  itens: [
    {
      item: 1,
      descricao: 'Troca da Tampa Traseira Original Samsung',
      quantidade: 1,
      valorUnitario: 280.0,
      valorTotal: 280.0,
    },
    {
      item: 2,
      descricao: 'Limpeza Interna e Aplicação de Nova Vedação',
      quantidade: 1,
      valorUnitario: 90.0,
      valorTotal: 90.0,
    },
  ],
};

export const ConfigOrdemServico: React.FC<ConfigOrdemServicoProps> = ({ config, onSalvar }) => {
  const osConfig = config.ordemServico || {};

  const [usarLogoPersonalizado, setUsarLogoPersonalizado] = useState(
    osConfig.usarLogoPersonalizado ?? false
  );
  const [logoUrl, setLogoUrl] = useState(osConfig.logoUrl || config.logoUrl || '');
  const [slogan, setSlogan] = useState(
    osConfig.slogan || config.slogan || 'TUDO QUE VOCÊ PRECISA, EM UM SÓ LUGAR!'
  );
  const [mostrarDadosLoja, setMostrarDadosLoja] = useState(osConfig.mostrarDadosLoja ?? true);
  const [textoRodape, setTextoRodape] = useState(
    osConfig.textoRodape || 'TUDO QUE VOCÊ PRECISA, EM UM SÓ LUGAR!'
  );

  const [mostrarPreview, setMostrarPreview] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Configuração combinada para o preview em tempo real
  const configSimulada: ConfiguracaoLoja = {
    ...config,
    ordemServico: {
      usarLogoPersonalizado,
      logoUrl: logoUrl.trim() || undefined,
      slogan: slogan.trim(),
      mostrarDadosLoja,
      textoRodape: textoRodape.trim(),
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await onSalvar(
        {
          ordemServico: {
            usarLogoPersonalizado,
            logoUrl: logoUrl.trim() || undefined,
            slogan: slogan.trim(),
            mostrarDadosLoja,
            textoRodape: textoRodape.trim(),
          },
        },
        'Parâmetros do cabeçalho, logo e rodapé do Modelo Oficial de Ordem de Serviço atualizados.'
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card variant="elevated">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF8A00]" />
              <span>PARÂMETROS DO MODELO OFICIAL DE ORDEM DE SERVIÇO</span>
            </div>
          }
          subtitle="Configure logo, slogan, rodapé e contatos do cabeçalho sem quebrar a estrutura e proporção oficial do documento de 10 linhas."
          action={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Eye className="w-4 h-4" />}
              onClick={() => setMostrarPreview(!mostrarPreview)}
            >
              {mostrarPreview ? 'Ocultar Prévia' : 'Ver Prévia ao Vivo'}
            </Button>
          }
        />
        <CardBody className="space-y-5">
          {/* Banner de Proteção do Layout */}
          <div className="p-4 rounded-xl bg-[#171724] border border-[#2A2A3E] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-300 leading-relaxed">
              <strong className="text-white font-semibold block mb-0.5">
                Blindagem Estrutural do Modelo Oficial:
              </strong>
              O sistema foi construído com proteção contra quebras de layout. Mesmo que o logo tenha dimensões variadas ou o texto seja longo, o documento mantém estritamente o formato de impressão A4 com as 10 linhas exatas na tabela de serviços/peças, moldura cyber e destaques dourados.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slogan do Cabeçalho */}
            <div>
              <Input
                label="Slogan no Cabeçalho da OS"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="TUDO QUE VOCÊ PRECISA, EM UM SÓ LUGAR!"
              />
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Exibido no lado esquerdo do topo do documento oficial.
              </span>
            </div>

            {/* Texto do Rodapé */}
            <div>
              <Input
                label="Texto do Rodapé da OS"
                value={textoRodape}
                onChange={(e) => setTextoRodape(e.target.value)}
                placeholder="TUDO QUE VOCÊ PRECISA, EM UM SÓ LUGAR!"
              />
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Exibido na barra inferior estilizada junto ao nome da loja.
              </span>
            </div>
          </div>

          {/* Opção de Logo */}
          <div className="p-4 rounded-xl bg-[#141420] border border-[#222234] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Image className="w-4 h-4 text-[#A76BFF]" />
                  Logo no Centro do Cabeçalho
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Escolha entre o Logo 3D Metálico Padrão ou a imagem personalizada da sua loja.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">
                  {usarLogoPersonalizado ? 'Logo Personalizado' : 'Logo 3D Oficial'}
                </span>
                <button
                  type="button"
                  onClick={() => setUsarLogoPersonalizado(!usarLogoPersonalizado)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                    usarLogoPersonalizado ? 'bg-[#FF8A00]' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full transition-transform transform ${
                      usarLogoPersonalizado ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {usarLogoPersonalizado && (
              <div className="pt-3 border-t border-[#222234]">
                <Input
                  label="URL da Imagem do Logo para a OS"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://sua-loja.com/logo-os.png"
                />
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  A imagem será ajustada e limitada automaticamente na proporção segura sem esticar o cabeçalho.
                </span>
              </div>
            )}
          </div>

          {/* Toggle Dados de Contato no Cabeçalho */}
          <div className="p-4 rounded-xl bg-[#141420] border border-[#222234] flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-white">
                Exibir Telefone e Endereço no Cabeçalho
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Mostra uma faixa discreta no cabeçalho com telefone, WhatsApp e endereço cadastrados.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMostrarDadosLoja(!mostrarDadosLoja)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                mostrarDadosLoja ? 'bg-[#FF8A00]' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full transition-transform transform ${
                  mostrarDadosLoja ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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
          {salvando ? 'Salvando...' : 'Salvar Configurações da OS'}
        </Button>
      </div>

      {/* LIVE PREVIEW COMPLETO E SEGURO */}
      {mostrarPreview && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              Prévia em Tempo Real — Modelo Oficial Intacto
            </h4>
            <span className="text-[11px] text-zinc-400">
              Visualização idêntica à impressão em folha A4
            </span>
          </div>

          <div className="p-2 sm:p-4 rounded-2xl bg-zinc-950 border border-purple-900/50 shadow-2xl max-w-4xl mx-auto overflow-hidden">
            <ModeloOficialDocumento
              ordem={OS_PREVIEW_EXEMPLO}
              config={configSimulada}
              isEditable={false}
            />
          </div>
        </div>
      )}
    </form>
  );
};
