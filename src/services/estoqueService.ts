/**
 * Serviço de Gestão de Estoque Simples
 * Mix Variedades Store
 *
 * Princípio: Estoque Simples, sem complexidade de ERP.
 * Apenas: Nome, Foto (opcional), Categoria, Quantidade, Custo, Venda, Data de entrada e Observações.
 * Histórico de movimentações: Entrada, Venda, Saída manual, Correção.
 */

import { DatabaseService } from './databaseService';
import type {
  Produto,
  CategoriaProduto,
  MovimentacaoEstoque,
  TipoMovimentacaoEstoque,
} from '../types';

const PRODUCTS_COLLECTION = 'estoque_produtos';
const CATEGORIES_COLLECTION = 'estoque_categorias';
const MOVIMENTACOES_COLLECTION = 'estoque_movimentacoes';

export const CATEGORIAS_INICIAIS: string[] = [
  'Perfumes',
  'Remédios',
  'Papelaria',
  'Brinquedos',
  '3D',
  'Outros',
];

const INITIAL_PRODUCTS: Produto[] = [
  {
    id: 'prod_perfume_01',
    nome: 'Perfume Floratta Gold Desodorante Colônia 75ml',
    foto: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80',
    categoria: 'Perfumes',
    categoriaNome: 'Perfumes',
    quantidade: 12,
    estoqueAtual: 12,
    precoCusto: 65.0,
    precoVenda: 119.9,
    dataEntrada: '2026-09-01',
    observacoes: 'Fragrância floral marcante, produto lacrado original.',
    ativo: true,
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 'prod_remedio_01',
    nome: 'Dipirona Monoidratada 500mg/ml Gotas 20ml',
    foto: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    categoria: 'Remédios',
    categoriaNome: 'Remédios',
    quantidade: 40,
    estoqueAtual: 40,
    precoCusto: 3.2,
    precoVenda: 9.5,
    dataEntrada: '2026-09-05',
    observacoes: 'Analgésico e antitérmico para primeiros socorros.',
    ativo: true,
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 'prod_papelaria_01',
    nome: 'Caderno Universitário Mix 10 Matérias Espiral 200 Fls',
    foto: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    categoria: 'Papelaria',
    categoriaNome: 'Papelaria',
    quantidade: 25,
    estoqueAtual: 25,
    precoCusto: 12.0,
    precoVenda: 26.9,
    dataEntrada: '2026-09-10',
    observacoes: 'Capa dura sortida, folhas pautadas brancas.',
    ativo: true,
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 'prod_brinquedo_01',
    nome: 'Boneco Articulado Super Herói 25cm com Acessórios',
    foto: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=400&q=80',
    categoria: 'Brinquedos',
    categoriaNome: 'Brinquedos',
    quantidade: 15,
    estoqueAtual: 15,
    precoCusto: 22.5,
    precoVenda: 49.9,
    dataEntrada: '2026-09-08',
    observacoes: 'Plástico reforçado atóxico, selo Inmetro.',
    ativo: true,
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 'prod_3d_01',
    nome: 'Suporte Articulado para Celular & Tablet Impressão 3D',
    foto: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
    categoria: '3D',
    categoriaNome: '3D',
    quantidade: 20,
    estoqueAtual: 20,
    precoCusto: 6.0,
    precoVenda: 25.0,
    dataEntrada: '2026-09-12',
    observacoes: 'Fabricação própria em filamento PLA Premium reforçado.',
    ativo: true,
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 'prod_outros_01',
    nome: 'Lanterna Tática LED Cob Recarregável USB',
    foto: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
    categoria: 'Outros',
    categoriaNome: 'Outros',
    quantidade: 8,
    estoqueAtual: 8,
    precoCusto: 18.0,
    precoVenda: 39.9,
    dataEntrada: '2026-09-11',
    observacoes: 'Corpo em alumínio anodizado, acompanha cabo micro USB.',
    ativo: true,
    atualizadoEm: new Date().toISOString(),
  },
];

const INITIAL_MOVIMENTACOES: MovimentacaoEstoque[] = [
  {
    id: 'mov_01',
    produtoId: 'prod_perfume_01',
    produtoNome: 'Perfume Floratta Gold Desodorante Colônia 75ml',
    tipo: 'entrada',
    quantidadeAnterior: 0,
    quantidadeAlterada: 12,
    quantidadeFinal: 12,
    usuario: 'Jhonatan',
    data: '2026-09-01',
    hora: '09:30:00',
    motivo: 'Cadastro inicial de lote',
    criadoEm: '2026-09-01T09:30:00.000Z',
  },
  {
    id: 'mov_02',
    produtoId: 'prod_remedio_01',
    produtoNome: 'Dipirona Monoidratada 500mg/ml Gotas 20ml',
    tipo: 'entrada',
    quantidadeAnterior: 0,
    quantidadeAlterada: 40,
    quantidadeFinal: 40,
    usuario: 'Jhonatan',
    data: '2026-09-05',
    hora: '10:15:00',
    motivo: 'Chegada de pedido fornecedor',
    criadoEm: '2026-09-05T10:15:00.000Z',
  },
  {
    id: 'mov_03',
    produtoId: 'prod_papelaria_01',
    produtoNome: 'Caderno Universitário Mix 10 Matérias Espiral 200 Fls',
    tipo: 'entrada',
    quantidadeAnterior: 0,
    quantidadeAlterada: 25,
    quantidadeFinal: 25,
    usuario: 'Jhonatan',
    data: '2026-09-10',
    hora: '14:00:00',
    motivo: 'Entrada de material escolar',
    criadoEm: '2026-09-10T14:00:00.000Z',
  },
  {
    id: 'mov_04',
    produtoId: 'prod_3d_01',
    produtoNome: 'Suporte Articulado para Celular & Tablet Impressão 3D',
    tipo: 'entrada',
    quantidadeAnterior: 0,
    quantidadeAlterada: 20,
    quantidadeFinal: 20,
    usuario: 'Jhonatan',
    data: '2026-09-12',
    hora: '16:20:00',
    motivo: 'Lote produzido na impressora 3D da loja',
    criadoEm: '2026-09-12T16:20:00.000Z',
  },
];

export class EstoqueService {
  /**
   * Obtém todos os produtos cadastrados
   */
  static async getProdutos(): Promise<Produto[]> {
    const prods = await DatabaseService.getCollection<Produto>(PRODUCTS_COLLECTION);
    if (prods.length === 0) {
      for (const p of INITIAL_PRODUCTS) {
        await DatabaseService.setDocument(PRODUCTS_COLLECTION, p.id, p);
      }
      return INITIAL_PRODUCTS;
    }
    // Normaliza campos para consistência simples
    return prods.map((p) => ({
      ...p,
      categoria: p.categoria || p.categoriaNome || 'Outros',
      categoriaNome: p.categoria || p.categoriaNome || 'Outros',
      quantidade: typeof p.quantidade === 'number' ? p.quantidade : (p.estoqueAtual ?? 0),
      estoqueAtual: typeof p.quantidade === 'number' ? p.quantidade : (p.estoqueAtual ?? 0),
    }));
  }

  /**
   * Obtém todas as categorias detalhadas com contador de produtos
   */
  static async getCategoriasDetalhadas(): Promise<CategoriaProduto[]> {
    let cats = await DatabaseService.getCollection<CategoriaProduto>(CATEGORIES_COLLECTION);
    if (cats.length === 0) {
      const criadas: CategoriaProduto[] = [];
      for (const nome of CATEGORIAS_INICIAIS) {
        const id = `cat_${nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const novaCat: CategoriaProduto = {
          id,
          nome,
          ativa: true,
          descricao: `Categoria padrão ${nome}`,
          criadaEm: new Date().toISOString(),
        };
        await DatabaseService.setDocument(CATEGORIES_COLLECTION, id, novaCat);
        criadas.push(novaCat);
      }
      cats = criadas;
    } else {
      // Garante que todas as categorias tenham campo ativa definido
      let alterado = false;
      cats = cats.map((c) => {
        if (c.ativa === undefined) {
          alterado = true;
          return { ...c, ativa: true };
        }
        return c;
      });
      if (alterado) {
        for (const c of cats) {
          await DatabaseService.setDocument(CATEGORIES_COLLECTION, c.id, c);
        }
      }
    }

    // Calcula quantidade de produtos por categoria
    const produtos = await this.getProdutos();
    const contagem: Record<string, number> = {};
    for (const p of produtos) {
      const cat = (p.categoria || p.categoriaNome || '').trim().toLowerCase();
      if (cat) {
        contagem[cat] = (contagem[cat] || 0) + 1;
      }
    }

    return cats.map((c) => ({
      ...c,
      totalProdutos: contagem[c.nome.trim().toLowerCase()] || 0,
    })).sort((a, b) => a.nome.localeCompare(b.nome));
  }

  /**
   * Obtém a lista de nomes de categorias (por padrão apenas ativas)
   */
  static async getCategorias(apenasAtivas = true): Promise<string[]> {
    const cats = await this.getCategoriasDetalhadas();
    const filtradas = apenasAtivas ? cats.filter((c) => c.ativa !== false) : cats;
    return filtradas.map((c) => c.nome.trim());
  }

  /**
   * Cria uma nova categoria
   */
  static async criarCategoria(nome: string, descricao?: string): Promise<CategoriaProduto> {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      throw new Error('O nome da categoria não pode ser vazio.');
    }
    const cats = await this.getCategoriasDetalhadas();
    const jaExiste = cats.find((c) => c.nome.toLowerCase() === nomeLimpo.toLowerCase());
    if (jaExiste) {
      if (!jaExiste.ativa) {
        // Reativa a categoria se estava desativada
        return await this.toggleCategoriaStatus(jaExiste.id, true);
      }
      throw new Error(`A categoria "${nomeLimpo}" já existe no cadastro.`);
    }

    const id = `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const nova: CategoriaProduto = {
      id,
      nome: nomeLimpo,
      descricao: descricao?.trim() || '',
      ativa: true,
      criadaEm: new Date().toISOString(),
      totalProdutos: 0,
    };

    await DatabaseService.setDocument(CATEGORIES_COLLECTION, id, nova);
    return nova;
  }

  /**
   * Edita uma categoria existente (Nome e Descrição)
   * Se o nome for alterado, atualiza também os produtos associados
   */
  static async editarCategoria(id: string, novoNome: string, descricao?: string): Promise<CategoriaProduto> {
    const nomeLimpo = novoNome.trim();
    if (!nomeLimpo) {
      throw new Error('O nome da categoria não pode ser vazio.');
    }

    const catAtual = await DatabaseService.getDocument<CategoriaProduto>(CATEGORIES_COLLECTION, id);
    if (!catAtual) {
      throw new Error('Categoria não encontrada.');
    }

    const nomeAntigo = catAtual.nome;
    const atualizada: CategoriaProduto = {
      ...catAtual,
      nome: nomeLimpo,
      descricao: descricao !== undefined ? descricao.trim() : catAtual.descricao,
    };

    await DatabaseService.setDocument(CATEGORIES_COLLECTION, id, atualizada);

    // Se o nome mudou, atualizar produtos que tinham essa categoria
    if (nomeAntigo.toLowerCase() !== nomeLimpo.toLowerCase()) {
      const produtos = await this.getProdutos();
      for (const prod of produtos) {
        if (prod.categoria?.toLowerCase() === nomeAntigo.toLowerCase() || prod.categoriaNome?.toLowerCase() === nomeAntigo.toLowerCase()) {
          const prodAtualizado = {
            ...prod,
            categoria: nomeLimpo,
            categoriaNome: nomeLimpo,
            atualizadoEm: new Date().toISOString(),
          };
          await DatabaseService.setDocument(PRODUCTS_COLLECTION, prod.id, prodAtualizado);
        }
      }
    }

    return atualizada;
  }

  /**
   * Ativa ou desativa uma categoria
   */
  static async toggleCategoriaStatus(id: string, ativa: boolean): Promise<CategoriaProduto> {
    const catAtual = await DatabaseService.getDocument<CategoriaProduto>(CATEGORIES_COLLECTION, id);
    if (!catAtual) {
      throw new Error('Categoria não encontrada.');
    }

    const atualizada: CategoriaProduto = {
      ...catAtual,
      ativa,
    };

    await DatabaseService.setDocument(CATEGORIES_COLLECTION, id, atualizada);
    return atualizada;
  }

  /**
   * Adiciona uma nova categoria criada pelo usuário (atalho compatível)
   */
  static async adicionarCategoria(nome: string): Promise<string> {
    const cat = await this.criarCategoria(nome);
    return cat.nome;
  }

  /**
   * Salva ou atualiza um produto no estoque
   */
  static async salvarProduto(prod: Produto): Promise<void> {
    const quantidadeNormalizada =
      typeof prod.quantidade === 'number' ? prod.quantidade : (prod.estoqueAtual ?? 0);

    const produtoNormalizado: Produto = {
      ...prod,
      categoria: prod.categoria || prod.categoriaNome || 'Outros',
      categoriaNome: prod.categoria || prod.categoriaNome || 'Outros',
      quantidade: quantidadeNormalizada,
      estoqueAtual: quantidadeNormalizada,
      atualizadoEm: new Date().toISOString(),
    };

    await DatabaseService.setDocument(PRODUCTS_COLLECTION, prod.id, produtoNormalizado);
  }

  /**
   * Cadastra um novo produto no estoque simples
   */
  static async cadastrarProduto(
    dados: {
      nome: string;
      foto?: string;
      categoria: string;
      quantidade: number;
      precoCusto: number;
      precoVenda: number;
      dataEntrada: string;
      observacoes?: string;
    },
    usuarioNome = 'Jhonatan'
  ): Promise<Produto> {
    const id = `prod_${Date.now()}`;
    const novoProduto: Produto = {
      id,
      nome: dados.nome.trim(),
      foto: dados.foto?.trim() || undefined,
      categoria: dados.categoria.trim() || 'Outros',
      categoriaNome: dados.categoria.trim() || 'Outros',
      quantidade: Number(dados.quantidade) || 0,
      estoqueAtual: Number(dados.quantidade) || 0,
      precoCusto: Number(dados.precoCusto) || 0,
      precoVenda: Number(dados.precoVenda) || 0,
      dataEntrada: dados.dataEntrada || new Date().toISOString().split('T')[0],
      observacoes: dados.observacoes?.trim() || undefined,
      ativo: true,
      atualizadoEm: new Date().toISOString(),
    };

    await this.salvarProduto(novoProduto);

    // Registra movimentação de entrada inicial se houver quantidade
    if (novoProduto.quantidade > 0) {
      await this.registrarMovimentacao({
        produtoId: novoProduto.id,
        produtoNome: novoProduto.nome,
        tipo: 'entrada',
        quantidadeAnterior: 0,
        quantidadeAlterada: novoProduto.quantidade,
        quantidadeFinal: novoProduto.quantidade,
        usuario: usuarioNome,
        motivo: 'Cadastro inicial de produto no estoque',
      });
    }

    return novoProduto;
  }

  /**
   * Exclui um produto do estoque
   */
  static async excluirProduto(id: string): Promise<void> {
    await DatabaseService.deleteDocument(PRODUCTS_COLLECTION, id);
  }

  /**
   * Obtém todo o histórico interno de movimentações de estoque
   */
  static async getMovimentacoes(): Promise<MovimentacaoEstoque[]> {
    const list = await DatabaseService.getCollection<MovimentacaoEstoque>(MOVIMENTACOES_COLLECTION);
    if (list.length === 0) {
      for (const m of INITIAL_MOVIMENTACOES) {
        await DatabaseService.setDocument(MOVIMENTACOES_COLLECTION, m.id, m);
      }
      return INITIAL_MOVIMENTACOES;
    }
    return list.sort(
      (a, b) => new Date(`${b.data}T${b.hora || '00:00:00'}`).getTime() - new Date(`${a.data}T${a.hora || '00:00:00'}`).getTime()
    );
  }

  /**
   * Registra uma movimentação interna no histórico de estoque
   * Sempre grava: quantidade anterior, quantidade alterada, quantidade final, usuário, data e hora.
   */
  static async registrarMovimentacao(params: {
    produtoId: string;
    produtoNome: string;
    tipo: TipoMovimentacaoEstoque;
    quantidadeAnterior: number;
    quantidadeAlterada: number;
    quantidadeFinal: number;
    usuario: string;
    motivo?: string;
  }): Promise<MovimentacaoEstoque> {
    const agora = new Date();
    const data = agora.toISOString().split('T')[0];
    const hora = agora.toTimeString().split(' ')[0]; // HH:mm:ss

    const movimentacao: MovimentacaoEstoque = {
      id: `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      produtoId: params.produtoId,
      produtoNome: params.produtoNome,
      tipo: params.tipo,
      quantidadeAnterior: params.quantidadeAnterior,
      quantidadeAlterada: params.quantidadeAlterada,
      quantidadeFinal: params.quantidadeFinal,
      usuario: params.usuario || 'Jhonatan',
      data,
      hora,
      motivo: params.motivo,
      criadoEm: agora.toISOString(),
    };

    await DatabaseService.setDocument(MOVIMENTACOES_COLLECTION, movimentacao.id, movimentacao);
    return movimentacao;
  }

  /**
   * AÇÃO: ENTRADA DE ESTOQUE
   * Adiciona quantidade e registra movimentação do tipo 'entrada'
   */
  static async adicionarEstoque(
    produtoId: string,
    quantidade: number,
    usuario = 'Jhonatan',
    motivo = 'Entrada de mercadoria',
    novoPrecoCusto?: number,
    novoPrecoVenda?: number
  ): Promise<{ sucesso: boolean; estoqueAnterior: number; novoEstoque: number; produto: Produto }> {
    const produtos = await this.getProdutos();
    const produto = produtos.find((p) => p.id === produtoId);

    if (!produto) {
      throw new Error(`Produto não encontrado no estoque.`);
    }

    const qtdAtual = produto.quantidade ?? produto.estoqueAtual ?? 0;
    const qtdAdicionada = Math.max(0, Number(quantidade));
    const novoEstoque = qtdAtual + qtdAdicionada;

    const atualizado: Produto = {
      ...produto,
      quantidade: novoEstoque,
      estoqueAtual: novoEstoque,
      precoCusto: novoPrecoCusto !== undefined && novoPrecoCusto > 0 ? novoPrecoCusto : produto.precoCusto,
      precoVenda: novoPrecoVenda !== undefined && novoPrecoVenda > 0 ? novoPrecoVenda : produto.precoVenda,
      atualizadoEm: new Date().toISOString(),
    };

    await this.salvarProduto(atualizado);

    // Registra movimentação de entrada
    await this.registrarMovimentacao({
      produtoId: produto.id,
      produtoNome: produto.nome,
      tipo: 'entrada',
      quantidadeAnterior: qtdAtual,
      quantidadeAlterada: qtdAdicionada,
      quantidadeFinal: novoEstoque,
      usuario,
      motivo,
    });

    return {
      sucesso: true,
      estoqueAnterior: qtdAtual,
      novoEstoque,
      produto: atualizado,
    };
  }

  /**
   * AÇÃO: SAÍDA MANUAL DE ESTOQUE
   * Subtrai quantidade por motivo de uso interno, quebra, avaria, etc.
   */
  static async saidaManualEstoque(
    produtoId: string,
    quantidade: number,
    usuario = 'Jhonatan',
    motivo = 'Saída manual'
  ): Promise<{ sucesso: boolean; estoqueAnterior: number; novoEstoque: number; produto: Produto }> {
    const produtos = await this.getProdutos();
    const produto = produtos.find((p) => p.id === produtoId);

    if (!produto) {
      throw new Error(`Produto não encontrado no estoque.`);
    }

    const qtdAtual = produto.quantidade ?? produto.estoqueAtual ?? 0;
    const qtdRemovida = Math.min(qtdAtual, Math.max(0, Number(quantidade)));
    const novoEstoque = Math.max(0, qtdAtual - qtdRemovida);

    const atualizado: Produto = {
      ...produto,
      quantidade: novoEstoque,
      estoqueAtual: novoEstoque,
      atualizadoEm: new Date().toISOString(),
    };

    await this.salvarProduto(atualizado);

    // Registra movimentação de saída manual
    await this.registrarMovimentacao({
      produtoId: produto.id,
      produtoNome: produto.nome,
      tipo: 'saida_manual',
      quantidadeAnterior: qtdAtual,
      quantidadeAlterada: -qtdRemovida,
      quantidadeFinal: novoEstoque,
      usuario,
      motivo,
    });

    return {
      sucesso: true,
      estoqueAnterior: qtdAtual,
      novoEstoque,
      produto: atualizado,
    };
  }

  /**
   * AÇÃO: CORREÇÃO DE ESTOQUE (Inventário / Ajuste)
   */
  static async correcaoEstoque(
    produtoId: string,
    novaQuantidade: number,
    usuario = 'Jhonatan',
    motivo = 'Ajuste de inventário'
  ): Promise<{ sucesso: boolean; estoqueAnterior: number; novoEstoque: number; produto: Produto }> {
    const produtos = await this.getProdutos();
    const produto = produtos.find((p) => p.id === produtoId);

    if (!produto) {
      throw new Error(`Produto não encontrado no estoque.`);
    }

    const qtdAtual = produto.quantidade ?? produto.estoqueAtual ?? 0;
    const qtdNova = Math.max(0, Number(novaQuantidade));
    const diferenca = qtdNova - qtdAtual;

    const atualizado: Produto = {
      ...produto,
      quantidade: qtdNova,
      estoqueAtual: qtdNova,
      atualizadoEm: new Date().toISOString(),
    };

    await this.salvarProduto(atualizado);

    await this.registrarMovimentacao({
      produtoId: produto.id,
      produtoNome: produto.nome,
      tipo: 'correcao',
      quantidadeAnterior: qtdAtual,
      quantidadeAlterada: diferenca,
      quantidadeFinal: qtdNova,
      usuario,
      motivo,
    });

    return {
      sucesso: true,
      estoqueAnterior: qtdAtual,
      novoEstoque: qtdNova,
      produto: atualizado,
    };
  }

  /**
   * Baixa por VENDA
   * Chamado automaticamente pelo módulo de Vendas
   */
  static async diminuirEstoque(
    produtoId: string,
    quantidade: number,
    usuario = 'Vendedor',
    motivo = 'Venda no PDV'
  ): Promise<{ sucesso: boolean; estoqueAnterior: number; novoEstoque: number; produtoNome: string }> {
    const produtos = await this.getProdutos();
    const produto = produtos.find((p) => p.id === produtoId);

    if (!produto) {
      return { sucesso: false, estoqueAnterior: 0, novoEstoque: 0, produtoNome: 'Produto não encontrado' };
    }

    const qtdAtual = produto.quantidade ?? produto.estoqueAtual ?? 0;
    const qtdVendida = Math.max(0, Number(quantidade));
    const novoEstoque = Math.max(0, qtdAtual - qtdVendida);

    const atualizado: Produto = {
      ...produto,
      quantidade: novoEstoque,
      estoqueAtual: novoEstoque,
      atualizadoEm: new Date().toISOString(),
    };

    await this.salvarProduto(atualizado);

    // Registra movimentação do tipo 'venda'
    await this.registrarMovimentacao({
      produtoId: produto.id,
      produtoNome: produto.nome,
      tipo: 'venda',
      quantidadeAnterior: qtdAtual,
      quantidadeAlterada: -qtdVendida,
      quantidadeFinal: novoEstoque,
      usuario,
      motivo,
    });

    return {
      sucesso: true,
      estoqueAnterior: qtdAtual,
      novoEstoque,
      produtoNome: produto.nome,
    };
  }

  /**
   * Devolução ao estoque por CANCELAMENTO DE VENDA
   */
  static async devolverEstoque(
    produtoId: string,
    quantidade: number,
    usuario = 'Vendedor',
    motivo = 'Cancelamento de venda'
  ): Promise<{ sucesso: boolean; estoqueAnterior: number; novoEstoque: number; produtoNome: string }> {
    const produtos = await this.getProdutos();
    const produto = produtos.find((p) => p.id === produtoId);

    if (!produto) {
      return { sucesso: false, estoqueAnterior: 0, novoEstoque: 0, produtoNome: 'Produto não encontrado' };
    }

    const qtdAtual = produto.quantidade ?? produto.estoqueAtual ?? 0;
    const qtdDevolvida = Math.max(0, Number(quantidade));
    const novoEstoque = qtdAtual + qtdDevolvida;

    const atualizado: Produto = {
      ...produto,
      quantidade: novoEstoque,
      estoqueAtual: novoEstoque,
      atualizadoEm: new Date().toISOString(),
    };

    await this.salvarProduto(atualizado);

    // Registra movimentação de entrada por devolução
    await this.registrarMovimentacao({
      produtoId: produto.id,
      produtoNome: produto.nome,
      tipo: 'entrada',
      quantidadeAnterior: qtdAtual,
      quantidadeAlterada: qtdDevolvida,
      quantidadeFinal: novoEstoque,
      usuario,
      motivo,
    });

    return {
      sucesso: true,
      estoqueAnterior: qtdAtual,
      novoEstoque,
      produtoNome: produto.nome,
    };
  }

  /**
   * Cadastro com estoque vindo do módulo de compras para revenda
   */
  static async cadastrarProdutoComEstoque(dados: {
    nome: string;
    categoriaId?: string;
    categoriaNome: string;
    quantidade: number;
    precoCusto: number;
    precoVenda: number;
    unidade?: string;
    fornecedor?: string;
  }): Promise<Produto> {
    return this.cadastrarProduto({
      nome: dados.nome,
      categoria: dados.categoriaNome || 'Outros',
      quantidade: dados.quantidade,
      precoCusto: dados.precoCusto,
      precoVenda: dados.precoVenda,
      dataEntrada: new Date().toISOString().split('T')[0],
      observacoes: dados.fornecedor ? `Fornecedor: ${dados.fornecedor}` : undefined,
    });
  }
}
