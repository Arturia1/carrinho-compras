import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Limpando dados antigos...');
  await prisma.itemCarrinho.deleteMany();
  await prisma.carrinho.deleteMany();
  await prisma.cupom.deleteMany();
  await prisma.produto.deleteMany();

  console.log('Iniciando o povoamento com os dados oficiais do teste...');

  // 10 Produtos solicitados no documento
  await prisma.produto.createMany({
    data: [
      { id: 1, descricaoProduto: 'Teclado Mecânico', precoLiquido: 350.00, quantidadeEstoque: 15 },
      { id: 2, descricaoProduto: 'Mouse Ultra Leve', precoLiquido: 220.50, quantidadeEstoque: 30 },
      { id: 3, descricaoProduto: 'Monitor IPS 24"', precoLiquido: 890.00, quantidadeEstoque: 10 },
      { id: 4, descricaoProduto: 'Mousepad Gigante', precoLiquido: 89.90, quantidadeEstoque: 50 },
      { id: 5, descricaoProduto: 'Headset Gamer 7.1', precoLiquido: 450.00, quantidadeEstoque: 20 },
      { id: 6, descricaoProduto: 'Cadeira Ergonômica', precoLiquido: 1200.00, quantidadeEstoque: 5 },
      { id: 7, descricaoProduto: 'Webcam Full HD', precoLiquido: 299.00, quantidadeEstoque: 25 },
      { id: 8, descricaoProduto: 'Microfone Condensador', precoLiquido: 550.00, quantidadeEstoque: 12 },
      { id: 9, descricaoProduto: 'Suporte Articulado Monitor', precoLiquido: 180.00, quantidadeEstoque: 40 },
      { id: 10, descricaoProduto: 'Gabinete Mid Tower', precoLiquido: 320.00, quantidadeEstoque: 8 }
    ]
  });

  // Cupons exatos solicitados no documento
  await prisma.cupom.createMany({
    data: [
      { codigoCupom: '10OFF', percentualDesconto: 10.00 },
      { codigoCupom: '15OFF', percentualDesconto: 15.00 }
    ]
  });

  console.log('Seed executado com sucesso! Dados padronizados criados.');
}

main()
  .catch((e) => {
    console.error('Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });