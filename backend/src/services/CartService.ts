import prisma from '../../prisma/prisma'; 

export class CartService {
  
  // FUNÇÃO DE VALIDAÇÃO: Bloqueia alterações em carrinhos finalizados
  private async _verificarCarrinhoAberto(cartId: number) {
    const carrinho = await prisma.carrinho.findUnique({ where: { id: cartId } });
    if (!carrinho) throw new Error('Carrinho não encontrado');
    if (carrinho.status === 'FINALIZADO') {
      throw new Error('Este carrinho já foi finalizado e não pode ser alterado.');
    }
  }

  // 1. Busca e calcula totais
  async getCart(cartId: number) {
    const carrinho = await prisma.carrinho.findUnique({
      where: { id: cartId },
      include: {
        itens: { include: { produto: true } },
        cupom: true
      }
    });

    if (!carrinho) throw new Error('Carrinho não encontrado');

    let subtotal = 0;
    const itensCalculados = carrinho.itens.map(item => {
      const precoLiquido = Number(item.produto.precoLiquido);
      const precoTotalItem = precoLiquido * item.quantidade;
      subtotal += precoTotalItem;
      return { ...item, precoTotalItem };
    });

    let desconto = 0;
    if (carrinho.cupom) {
      const percentual = Number(carrinho.cupom.percentualDesconto);
      desconto = subtotal * (percentual / 100);
    }

    const total = subtotal - desconto;

    return {
      ...carrinho,
      itens: itensCalculados,
      resumo: {
        subtotal: subtotal.toFixed(2),
        desconto: desconto.toFixed(2),
        total: total.toFixed(2)
      }
    };
  }

  // 2. Adiciona item
  async addItem(cartId: number, produtoId: number, quantidade: number) {
    await this._verificarCarrinhoAberto(cartId); // Trava do PDF
    if (quantidade <= 0) throw new Error('A quantidade deve ser maior que zero.'); // Trava do PDF

    const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
    if (!produto) throw new Error('Produto não encontrado');

    const itemExistente = await prisma.itemCarrinho.findFirst({
      where: { carrinhoId: cartId, produtoId: produtoId }
    });

    const quantidadeDesejada = itemExistente ? itemExistente.quantidade + quantidade : quantidade;
    
    if (quantidadeDesejada > produto.quantidadeEstoque) {
      throw new Error(`Estoque insuficiente. Disponível: ${produto.quantidadeEstoque}`);
    }

    if (itemExistente) {
      await prisma.itemCarrinho.update({
        where: { id: itemExistente.id },
        data: { quantidade: quantidadeDesejada }
      });
    } else {
      await prisma.itemCarrinho.create({
        data: { carrinhoId: cartId, produtoId, quantidade }
      });
    }
    return this.getCart(cartId);
  }

  // 3. Atualiza quantidade exata
  async updateItemQuantity(cartId: number, produtoId: number, quantidade: number) {
    await this._verificarCarrinhoAberto(cartId); // Trava do PDF
    if (quantidade <= 0) throw new Error('A quantidade deve ser maior que zero.'); // Trava do PDF

    const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
    if (!produto) throw new Error('Produto não encontrado');

    if (quantidade > produto.quantidadeEstoque) {
      throw new Error(`Estoque insuficiente. Disponível: ${produto.quantidadeEstoque}`);
    }

    const itemExistente = await prisma.itemCarrinho.findFirst({
      where: { carrinhoId: cartId, produtoId: produtoId }
    });

    if (!itemExistente) throw new Error('O produto não está no carrinho');

    await prisma.itemCarrinho.update({
      where: { id: itemExistente.id },
      data: { quantidade }
    });
    return this.getCart(cartId);
  }

  // 4. Remove item
  async removeItem(cartId: number, produtoId: number) {
    await this._verificarCarrinhoAberto(cartId); // Trava do PDF

    const itemExistente = await prisma.itemCarrinho.findFirst({
      where: { carrinhoId: cartId, produtoId: produtoId }
    });

    if (!itemExistente) throw new Error('Produto não encontrado no carrinho para remoção'); // Trava do PDF

    await prisma.itemCarrinho.delete({ where: { id: itemExistente.id } });
    return this.getCart(cartId);
  }

  // 5. Aplica cupom
  async applyCoupon(cartId: number, codigoCupom: string) {
    await this._verificarCarrinhoAberto(cartId); // Trava do PDF

    const cupom = await prisma.cupom.findUnique({ where: { codigoCupom } });
    if (!cupom) throw new Error('Cupom inválido'); // Trava do PDF

    await prisma.carrinho.update({
      where: { id: cartId },
      data: { cupomId: cupom.id }
    });
    return this.getCart(cartId);
  }

  // 6. NOVO: Remove cupom
  async removeCoupon(cartId: number) {
    await this._verificarCarrinhoAberto(cartId); // Trava do PDF

    await prisma.carrinho.update({
      where: { id: cartId },
      data: { cupomId: null } // Retira o cupom
    });
    return this.getCart(cartId);
  }

  // 7. Finaliza a compra e dá baixa no estoque (Transação Atômica)
  async checkout(cartId: number) {
    const carrinho = await prisma.carrinho.findUnique({
      where: { id: cartId },
      include: { itens: { include: { produto: true } } }
    });

    if (!carrinho) throw new Error('Carrinho não encontrado');
    if (carrinho.status === 'FINALIZADO') throw new Error('Este carrinho já foi finalizado.');
    if (carrinho.itens.length === 0) throw new Error('O carrinho está vazio.');

    // Inicia uma transação: ou tudo dá certo, ou nada é salvo no banco
    await prisma.$transaction(async (tx) => {
      // 1. Verifica e deduz o estoque de cada item
      for (const item of carrinho.itens) {
        // Busca o estoque atualizado em tempo real dentro da transação
        const produto = await tx.produto.findUnique({ where: { id: item.produtoId } });
        
        if (!produto) throw new Error(`Produto ${item.produto.descricaoProduto} não encontrado.`);
        if (produto.quantidadeEstoque < item.quantidade) {
          throw new Error(`Estoque insuficiente para: ${produto.descricaoProduto}. Disponível: ${produto.quantidadeEstoque}`);
        }

        // Dá a baixa no estoque
        await tx.produto.update({
          where: { id: produto.id },
          data: { quantidadeEstoque: produto.quantidadeEstoque - item.quantidade }
        });
      }

      // 2. Muda o status do carrinho para FINALIZADO
      await tx.carrinho.update({
        where: { id: cartId },
        data: { status: 'FINALIZADO' }
      });
    });

    return { message: 'Compra finalizada com sucesso! Estoque atualizado.' };
  }
}