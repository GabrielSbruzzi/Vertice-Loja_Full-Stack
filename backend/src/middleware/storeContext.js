const prisma = require('../prisma');

async function requireStore(req, res, next) {
  try {
    const storeId = Number(req.headers['x-store-id']);

    if (!Number.isInteger(storeId) || storeId <= 0) {
      return res.status(400).json({ message: 'Selecione uma loja para continuar.' });
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, ownerId: Number(req.user.sub) }
    });

    if (!store) {
      return res.status(404).json({ message: 'Loja não encontrada ou sem permissão.' });
    }

    req.storeId = store.id;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireStore };
