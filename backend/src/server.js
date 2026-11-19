require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : 'http://localhost:5173'
}));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300
}));
app.use('/api', routes);

app.use((error, req, res, next) => {
  console.error(error);
  const status = error.status || (error.code === 'P2025' ? 404 : 500);
  res.status(status).json({
    message: error.message || 'Erro interno do servidor.'
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API da loja executando na porta ${port}`);
});
