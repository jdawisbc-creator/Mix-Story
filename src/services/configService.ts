/**
 * Serviço de Configurações da Loja
 * Mix Variedades Store
 */

import { DatabaseService } from './databaseService';
import type { ConfiguracaoLoja } from '../types';

const CONFIG_DOC_ID = 'config_geral';
const CONFIG_COLLECTION = 'loja_configuracoes';

const DEFAULT_CONFIG: ConfiguracaoLoja = {
  id: CONFIG_DOC_ID,
  nomeFantasia: 'Mix Variedades Store',
  razaoSocial: 'Mix Variedades Comércio Varejista Ltda',
  cnpj: '00.000.000/0001-00',
  telefone: '(11) 98765-4321',
  whatsapp: '(11) 98765-4321',
  instagram: '@mixvariedadesstore',
  endereco: 'Rua do Comércio, 120 — Centro',
  slogan: 'Tudo que você precisa, em um só lugar!',
  cidade: 'São Paulo',
  estado: 'SP',
  logoUrl: '',
  valorPadraoTroco: 200.0, // R$ 200,00 padrão
  alertaEstoqueMinimo: false,
  diasRetencaoLogs: 365,
  mensagemCabecalhoCupom: 'Mix Variedades — O melhor para você!',
  formasPagamento: {
    pix: true,
    dinheiro: true,
    cartao_debito: true,
    cartao_credito: true,
    transferencia: true,
    outros: true,
  },
  ordemServico: {
    usarLogoPersonalizado: false,
    logoUrl: '',
    slogan: 'TUDO QUE VOCÊ PRECISA, EM UM SÓ LUGAR!',
    textoRodape: 'MIX VARIEDADES STORE • TUDO QUE VOCÊ PRECISA, EM UM SÓ LUGAR!',
    mostrarDadosLoja: true,
    telefone: '(11) 98765-4321',
    whatsapp: '(11) 98765-4321',
    endereco: 'Rua do Comércio, 120 — Centro',
  },
};

export class ConfigService {
  static async getConfig(): Promise<ConfiguracaoLoja> {
    const config = await DatabaseService.getDocument<ConfiguracaoLoja>(CONFIG_COLLECTION, CONFIG_DOC_ID);
    if (!config) {
      await DatabaseService.setDocument(CONFIG_COLLECTION, CONFIG_DOC_ID, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }

    // Merge defensivo para garantir integridade com versões anteriores
    const configMesclada: ConfiguracaoLoja = {
      ...DEFAULT_CONFIG,
      ...config,
      formasPagamento: {
        ...DEFAULT_CONFIG.formasPagamento,
        ...(config.formasPagamento || {}),
      },
      ordemServico: {
        ...DEFAULT_CONFIG.ordemServico,
        ...(config.ordemServico || {}),
      },
    };

    // Garante que valorPadraoTroco exista mesmo em dados legados
    if (configMesclada.valorPadraoTroco === undefined || configMesclada.valorPadraoTroco === null) {
      configMesclada.valorPadraoTroco = 200.0;
    }

    return configMesclada;
  }

  static async salvarConfig(novaConfig: Partial<ConfiguracaoLoja>): Promise<ConfiguracaoLoja> {
    const configAtual = await this.getConfig();
    const configCompleta: ConfiguracaoLoja = {
      ...configAtual,
      ...novaConfig,
      id: CONFIG_DOC_ID,
      formasPagamento: {
        ...configAtual.formasPagamento,
        ...(novaConfig.formasPagamento || {}),
      },
      ordemServico: {
        ...configAtual.ordemServico,
        ...(novaConfig.ordemServico || {}),
      },
    };
    await DatabaseService.setDocument(CONFIG_COLLECTION, CONFIG_DOC_ID, configCompleta);
    return configCompleta;
  }

  static async getValorPadraoTroco(): Promise<number> {
    const config = await this.getConfig();
    return config.valorPadraoTroco || 200.0;
  }

  static async getFormasPagamento(): Promise<ConfiguracaoLoja['formasPagamento']> {
    const config = await this.getConfig();
    return config.formasPagamento;
  }

  static async isFormaPagamentoAtiva(forma: keyof ConfiguracaoLoja['formasPagamento']): Promise<boolean> {
    const config = await this.getConfig();
    return Boolean(config.formasPagamento?.[forma] ?? true);
  }
}
