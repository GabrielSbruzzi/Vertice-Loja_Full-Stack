const prisma = require('../prisma');

function list({ search, categoryId, page = 1, limit = 100, storeId }) {
  const where = { active: true, storeId };
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (categoryId) where.categoryId = Number(categoryId);

  return prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit)
  });
}

function findById(id, storeId) {
  return prisma.product.findFirst({
    where: { id: Number(id), storeId },
    include: { category: true }
  });
}

function create(data) {
  return prisma.product.create({ data, include: { category: true } });
}

async function update(id, storeId, data) {
  await prisma.product.updateMany({
    where: { id: Number(id), storeId },
    data
  });

  return findById(id, storeId);
}

function remove(id) {
  return prisma.product.update({
    where: { id: Number(id) },
    data: { active: false }
  });
}

module.exports = { list, findById, create, update, remove };
