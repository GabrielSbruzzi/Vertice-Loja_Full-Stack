const repo = require('../repositories/productRepository');
const prisma = require('../prisma');

async function list(filters) {
  return repo.list(filters);
}

async function get(id, storeId) {
  const product = await repo.findById(id, storeId);
  if (!product || !product.active) {
    const error = new Error('Produto não encontrado nesta loja.');
    error.status = 404;
    throw error;
  }
  return product;
}

async function create(data) {
  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, storeId: data.storeId }
  });
  if (!category) {
    const error = new Error('A categoria selecionada não pertence a esta loja.');
    error.status = 400;
    throw error;
  }

  if (data.sku) {
    const existing = await prisma.product.findFirst({
      where: { sku: data.sku, storeId: data.storeId }
    });
    if (existing) {
      const error = new Error('Já existe um produto com este SKU nesta loja.');
      error.status = 409;
      throw error;
    }
  }
  return repo.create(data);
}

async function update(id, storeId, data) {
  await get(id, storeId);

  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, storeId }
  });
  if (!category) {
    const error = new Error('A categoria selecionada não pertence a esta loja.');
    error.status = 400;
    throw error;
  }

  if (data.sku) {
    const existing = await prisma.product.findFirst({
      where: { sku: data.sku, storeId, NOT: { id: Number(id) } }
    });
    if (existing) {
      const error = new Error('Já existe outro produto com este SKU nesta loja.');
      error.status = 409;
      throw error;
    }
  }
  return repo.update(id, storeId, data);
}

async function remove(id, storeId) {
  await get(id, storeId);
  return repo.remove(id);
}

module.exports = { list, get, create, update, remove };
