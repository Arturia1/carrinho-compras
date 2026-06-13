import { Router } from 'express';
import prisma from '../prisma/prisma'; 
import { CartService } from './services/CartService';

const routes = Router();
const cartService = new CartService();

// 1. Catálogo de Produtos
routes.get('/produtos', async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({ orderBy: { id: 'asc' } });
    res.json(produtos);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// 2. RADAR DE SESSÃO: Descobre qual é o carrinho ABERTO mais recente
routes.get('/sessao/carrinho-ativo', async (req, res) => {
  try {
    let carrinhoAberto = await prisma.carrinho.findFirst({
      where: { status: 'ABERTO' },
      orderBy: { id: 'desc' } 
    });

    if (!carrinhoAberto) {
      carrinhoAberto = await prisma.carrinho.create({ data: { status: 'ABERTO' } });
    }

    res.json({ cartId: carrinhoAberto.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Busca o carrinho pelo ID
routes.get('/carrinho/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    const carrinhoBasico = await prisma.carrinho.findUnique({ where: { id } });
    if (!carrinhoBasico) {
      await prisma.carrinho.create({ data: { id, status: 'ABERTO' } });
    }
    
    const cart = await cartService.getCart(id);
    res.json(cart);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Adiciona um item ao carrinho
routes.post('/carrinho/:id/item', async (req, res) => {
  try {
    const { produtoId, quantidade } = req.body;
    const cart = await cartService.addItem(Number(req.params.id), Number(produtoId), Number(quantidade));
    res.json(cart);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 5. Atualiza a quantidade de um item
routes.put('/carrinho/:id/item', async (req, res) => {
  try {
    const { produtoId, quantidade } = req.body;
    const cart = await cartService.updateItemQuantity(Number(req.params.id), Number(produtoId), Number(quantidade));
    res.json(cart);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 6. Remove um item do carrinho
routes.delete('/carrinho/:id/item/:produtoId', async (req, res) => {
  try {
    const cart = await cartService.removeItem(Number(req.params.id), Number(req.params.produtoId));
    res.json(cart);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 7. Aplica um cupom
routes.post('/carrinho/:id/cupom', async (req, res) => {
  try {
    const { codigoCupom } = req.body;
    const cart = await cartService.applyCoupon(Number(req.params.id), String(codigoCupom));
    res.json(cart);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 8. Remove o cupom
routes.delete('/carrinho/:id/cupom', async (req, res) => {
  try {
    const cart = await cartService.removeCoupon(Number(req.params.id));
    res.json(cart);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 9. Finaliza a compra e dá baixa no estoque 
routes.post('/carrinho/:id/checkout', async (req, res) => {
  try {
    const cartId = Number(req.params.id);
    // Toda a validação de carrinho e estoque acontece aqui dentro agora:
    const resultado = await cartService.checkout(cartId); 
    res.json(resultado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default routes;