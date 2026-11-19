const { z } = require('zod');
const service = require('../services/productService');

const productSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().nullable(),
  sku: z.string().max(40).optional().nullable(),
  price: z.coerce.number().positive(),
  cost: z.preprocess(
    (value) => value === '' || value == null ? null : Number(value),
    z.number().nonnegative().nullable()
  ).optional(),
  stock: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0).default(5),
  categoryId: z.coerce.number().int().positive()
});

function clean(data, storeId) {
  return {
    ...data,
    storeId,
    cost: data.cost ?? null,
    sku: data.sku || null,
    description: data.description || null
  };
}

async function list(req, res, next) {
  try {
    const products = await service.list({
      search: req.query.search,
      categoryId: req.query.categoryId,
      page: req.query.page,
      limit: req.query.limit,
      storeId: req.storeId
    });
    res.json(products);
  } catch (error) {
    next(error);
  }
}

async function get(req, res, next) {
  try {
    res.json(await service.get(req.params.id, req.storeId));
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = productSchema.parse(req.body);
    res.status(201).json(await service.create(clean(data, req.storeId)));
  } catch (error) {
    if (error.name === 'ZodError') error.status = 400;
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = productSchema.parse(req.body);
    res.json(await service.update(req.params.id, req.storeId, clean(data, req.storeId)));
  } catch (error) {
    if (error.name === 'ZodError') error.status = 400;
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.params.id, req.storeId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { list, get, create, update, remove };
