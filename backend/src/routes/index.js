
const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireStore } = require('../middleware/storeContext');
const authController = require('../controllers/authController');
const product = require('../controllers/productController');
const store = require('../controllers/storeController');

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'loja-api' });
});

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

router.use(auth.authenticate);

router.get('/stores', store.listStores);
router.post('/stores', store.createStore);
router.put('/stores/:id', store.updateStore);
router.delete('/stores/:id', store.deleteStore);

router.use(requireStore);

router.get('/products', product.list);
router.get('/products/:id', product.get);
router.post('/products', product.create);
router.put('/products/:id', product.update);
router.delete('/products/:id', product.remove);

router.get('/categories', store.categories);
router.post('/categories', store.createCategory);
router.get('/dashboard', store.dashboard);
router.get('/sales', store.listSales);
router.post('/sales', store.createSale);
router.get('/suppliers', store.suppliers);
router.post('/suppliers', store.createSupplier);
router.get('/cep/:cep', store.cep);

module.exports = router;
