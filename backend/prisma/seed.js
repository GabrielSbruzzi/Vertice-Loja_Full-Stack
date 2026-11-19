require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@loja.com';
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Administrador',
      email,
      passwordHash: await bcrypt.hash('123456', 12),
      role: 'ADMIN'
    }
  });

  let store = await prisma.store.findFirst({
    where: { ownerId: user.id, name: 'Minha Loja' }
  });
  if (!store) {
    store = await prisma.store.create({
      data: { name: 'Minha Loja', ownerId: user.id }
    });
  }

  const categoryNames = ['Alimentos', 'Bebidas', 'Limpeza', 'Eletrônicos', 'Acessórios'];
  const categories = {};
  for (const name of categoryNames) {
    categories[name] = await prisma.category.upsert({
      where: { name_storeId: { name, storeId: store.id } },
      update: {},
      create: { name, storeId: store.id }
    });
  }

  const products = [
    { name: 'Café Tradicional 500g', sku: 'CAF-001', price: 18.9, cost: 12, stock: 32, minStock: 8, categoryId: categories.Alimentos.id },
    { name: 'Arroz Tipo 1 5kg', sku: 'ALI-002', price: 29.9, cost: 22, stock: 18, minStock: 6, categoryId: categories.Alimentos.id },
    { name: 'Suco de Laranja 1L', sku: 'BEB-001', price: 8.5, cost: 5, stock: 4, minStock: 5, categoryId: categories.Bebidas.id },
    { name: 'Detergente Neutro 500ml', sku: 'LIM-001', price: 3.99, cost: 2, stock: 45, minStock: 10, categoryId: categories.Limpeza.id },
    { name: 'Fone Bluetooth', sku: 'ELE-001', price: 89.9, cost: 55, stock: 3, minStock: 5, categoryId: categories.Eletrônicos.id }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku_storeId: { sku: product.sku, storeId: store.id } },
      update: {},
      create: { ...product, storeId: store.id }
    });
  }

  console.log('Seed concluído. Loja de demonstração:', store.name);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
