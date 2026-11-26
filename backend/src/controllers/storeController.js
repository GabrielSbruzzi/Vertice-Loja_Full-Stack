
const prisma = require('../prisma');

async function listStores(req, res, next) {
  try {
    const stores = await prisma.store.findMany({
      where: { ownerId: Number(req.user.sub) },
      orderBy: { createdAt: 'asc' }
    });

    res.json(stores);
  } catch (error) {
    next(error);
  }
}

async function createStore(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();

    if (name.length < 2) {
      return res.status(400).json({
        message: 'O nome da loja deve ter pelo menos 2 caracteres.'
      });
    }

    const store = await prisma.store.create({
      data: {
        name,
        ownerId: Number(req.user.sub)
      }
    });

    res.status(201).json(store);
  } catch (error) {
    next(error);
  }
}

// EDITAR LOJA
async function updateStore(req, res, next) {
  try {
    const storeId = Number(req.params.id);
    const name = String(req.body.name || '').trim();

    if (!Number.isInteger(storeId) || storeId <= 0) {
      return res.status(400).json({
        message: 'ID da loja inválido.'
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        message: 'O nome da loja deve ter pelo menos 2 caracteres.'
      });
    }

    const existingStore = await prisma.store.findFirst({
      where: {
        id: storeId,
        ownerId: Number(req.user.sub)
      }
    });

    if (!existingStore) {
      return res.status(404).json({
        message: 'Loja não encontrada.'
      });
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { name }
    });

    res.json(updatedStore);
  } catch (error) {
    next(error);
  }
}

// EXCLUIR LOJA
async function deleteStore(req, res, next) {
  try {
    const storeId = Number(req.params.id);

    if (!Number.isInteger(storeId) || storeId <= 0) {
      return res.status(400).json({
        message: 'ID da loja inválido.'
      });
    }

    const existingStore = await prisma.store.findFirst({
      where: {
        id: storeId,
        ownerId: Number(req.user.sub)
      }
    });

    if (!existingStore) {
      return res.status(404).json({
        message: 'Loja não encontrada.'
      });
    }

    // Verifica se a loja possui dados cadastrados
    const [products, categories, sales, suppliers] = await Promise.all([
      prisma.product.count({ where: { storeId } }),
      prisma.category.count({ where: { storeId } }),
      prisma.sale.count({ where: { storeId } }),
      prisma.supplier.count({ where: { storeId } })
    ]);

    const hasData = products + categories + sales + suppliers > 0;

    if (hasData) {
      return res.status(409).json({
        message: 'Não é possível excluir esta loja porque ela possui produtos, categorias, vendas ou fornecedores cadastrados. Remova os dados vinculados antes de excluir.'
      });
    }

    await prisma.store.delete({
      where: { id: storeId }
    });

    res.json({
      message: 'Loja excluída com sucesso.'
    });
  } catch (error) {
    next(error);
  }
}

async function categories(req, res, next) {
  try {
    const result = await prisma.category.findMany({
      where: { storeId: req.storeId },
      orderBy: { name: 'asc' }
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();

    if (name.length < 2) {
      return res.status(400).json({
        message: 'Informe um nome válido.'
      });
    }

    const category = await prisma.category.create({
      data: { name, storeId: req.storeId }
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === 'P2002') error.status = 409;
    next(error);
  }
}

async function dashboard(req, res, next) {
  try {
    const where = { storeId: req.storeId };

    const [products, lowStock, sales, revenue, recentSales] =
      await Promise.all([
        prisma.product.count({
          where: { ...where, active: true }
        }),
        prisma.product.count({
          where: { ...where, active: true, stock: { lte: 5 } }
        }),
        prisma.sale.count({ where }),
        prisma.sale.aggregate({
          where,
          _sum: { total: true }
        }),
        prisma.sale.findMany({
          where,
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            user: { select: { name: true } }
          }
        })
      ]);

    res.json({
      products,
      lowStock,
      sales,
      revenue: Number(revenue._sum.total || 0),
      recentSales
    });
  } catch (error) {
    next(error);
  }
}

async function createSale(req, res, next) {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (!items.length) {
      return res.status(400).json({
        message: 'Adicione ao menos um item à venda.'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      let total = 0;
      const prepared = [];

      for (const item of items) {
        const product = await tx.product.findFirst({
          where: {
            id: Number(item.productId),
            storeId: req.storeId,
            active: true
          }
        });

        const quantity = Number(item.quantity);

        if (!product) {
          const error = new Error('Produto não encontrado nesta loja.');
          error.status = 404;
          throw error;
        }

        if (
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          product.stock < quantity
        ) {
          const error = new Error(`Estoque insuficiente para ${product.name}.`);
          error.status = 400;
          throw error;
        }

        const unitPrice = Number(product.price);
        total += unitPrice * quantity;
        prepared.push({ product, quantity, unitPrice });
      }

      const sale = await tx.sale.create({
        data: {
          total,
          customer: req.body.customer || null,
          userId: Number(req.user.sub),
          storeId: req.storeId,
          items: {
            create: prepared.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            }))
          }
        },
        include: {
          items: { include: { product: true } },
          user: { select: { name: true } }
        }
      });

      for (const item of prepared) {
        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return sale;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function listSales(req, res, next) {
  try {
    const sales = await prisma.sale.findMany({
      where: { storeId: req.storeId },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
        user: { select: { name: true } }
      }
    });

    res.json(sales);
  } catch (error) {
    next(error);
  }
}

async function suppliers(req, res, next) {
  try {
    const result = await prisma.supplier.findMany({
      where: { storeId: req.storeId },
      orderBy: { name: 'asc' }
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function createSupplier(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();

    if (name.length < 2) {
      return res.status(400).json({
        message: 'Informe o nome do fornecedor.'
      });
    }

    const data = { storeId: req.storeId, name };

    for (const key of [
      'document', 'email', 'phone', 'cep', 'street',
      'number', 'district', 'city', 'state'
    ]) {
      data[key] = req.body[key]
        ? String(req.body[key]).trim()
        : null;
    }

    res.status(201).json(await prisma.supplier.create({ data }));
  } catch (error) {
    next(error);
  }
}

async function cep(req, res, next) {
  try {
    const cepValue = String(req.params.cep).replace(/\D/g, '');

    if (cepValue.length !== 8) {
      return res.status(400).json({
        message: 'CEP deve conter 8 números.'
      });
    }

    const response = await fetch(
      `https://viacep.com.br/ws/${cepValue}/json/`
    );

    if (!response.ok) {
      return res.status(502).json({
        message: 'Não foi possível consultar o ViaCEP.'
      });
    }

    const data = await response.json();

    if (data.erro) {
      return res.status(404).json({
        message: 'CEP não encontrado.'
      });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listStores,
  createStore,
  updateStore,
  deleteStore,
  categories,
  createCategory,
  dashboard,
  createSale,
  listSales,
  suppliers,
  createSupplier,
  cep
};
