# Vértice Loja — Sistema Full Stack de Gestão Comercial

Aplicação web acadêmica para gerenciamento de lojas. O sistema permite controlar produtos, categorias, fornecedores e vendas, além de acompanhar indicadores em um painel administrativo. Um usuário pode cadastrar e alternar entre diferentes lojas; os dados operacionais são separados por loja.

## 1. Funcionalidades

- Login com autenticação JWT e senhas protegidas com bcrypt.
- Cadastro de novas lojas e alternância entre lojas pelo seletor lateral.
- Separação de produtos, categorias, fornecedores, vendas e indicadores por loja.
- Dashboard com quantidade de produtos, vendas, faturamento e estoque baixo.
- Atualização manual dos indicadores pelo botão **Atualizar dados**.
- CRUD de produtos: cadastrar, consultar, editar e deletar (desativar).
- Cadastro e consulta de categorias.
- Cadastro e consulta de fornecedores.
- Registro de vendas com validação de estoque e baixa automática em transação.
- Histórico das vendas.
- Consulta de endereço por CEP usando a API externa ViaCEP.

## 2. Tecnologias utilizadas

### Frontend
- React 18 (biblioteca utilizada para criar as telas e a interface do sistema)
- Vite (ferramenta que inicia e compila o frontend)
- React Router DOM (gerencia a navegação entre as páginas)
- Lucide React (biblioteca de ícones)
- CSS responsivo com fontes DM Sans e Manrope (Google Fonts) (estilização e adaptação do sistema para diferentes telas)
- Fetch API (realiza requisições para buscar e enviar dados ao backend)

### Backend
- Node.js (executa o código JavaScript no servidor)
- Express (facilita a criação do servidor e das rotas)
- API REST (forma de comunicação entre frontend e backend)
- Zod (valida os dados recebidos)
- JSON Web Token (JWT) (identifica o usuário autenticado)
- bcryptjs (protege as senhas usando criptografia em hash)
- Helmet, CORS e express-rate-limit (ajudam na segurança e proteção das requisições)

### Banco de dados e ORM
- PostgreSQL (banco de dados que armazena as informações do sistema)
- Neon (serviço de banco de dados PostgreSQL hospedado na nuvem)
- Prisma ORM (facilita a comunicação entre o código e o banco de dados)

### Integração externa
- ViaCEP: https://viacep.com.br/ — consulta de endereço a partir do CEP.

## 3. Organização das pastas

```text
LojaFullStack/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modelagem das tabelas e relacionamentos
│   │   └── seed.js             # Dados iniciais para demonstração
│   ├── src/
│   │   ├── controllers/        # Recebem requisições e retornam respostas
│   │   ├── middleware/         # Autenticação e seleção/autorização da loja
│   │   ├── repositories/      # Acesso aos dados com Prisma
│   │   ├── services/           # Regras de negócio
│   │   ├── routes/             # Endpoints da API REST
│   │   ├── prisma.js           # Instância do Prisma Client
│   │   └── server.js           # Inicialização do Express
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── services/api.js     # Comunicação HTTP com o backend
│   │   ├── App.jsx             # Rotas, autenticação e telas
│   │   ├── main.jsx            # Inicialização do React
│   │   └── styles.css          # Estilos da aplicação
│   ├── .env.example
│   └── package.json
├── legacy/                     # Exemplo anterior de Repository/Service
└── README.md
```

## 4. Como executar localmente

### Pré-requisitos

- Node.js 20 ou superior.
- npm.
- Banco PostgreSQL no Neon ou instalação local.

### 4.1 Configurar o banco no Neon

1. Crie uma conta em https://neon.tech/ e crie um projeto PostgreSQL.
2. No painel do projeto, copie a connection string.
3. No backend, crie o arquivo `.env`.
4. Substitua `DATABASE_URL` pela connection string do Neon e defina um `JWT_SECRET` forte.

Exemplo de `.env` do backend:

```env
DATABASE_URL="postgresql://USUARIO:SENHA@HOST/neondb?sslmode=require"
JWT_SECRET="gere-uma-chave-aleatoria-longa-e-segura"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

### 4.2 Instalar e iniciar o backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

A API ficará disponível em `http://localhost:3001/api`.
O endpoint `http://localhost:3001/api/health` verifica se a API está ativa.

> `prisma db push` sincroniza o schema com um banco novo. Se você já possui dados de uma versão anterior, faça backup antes de aplicar alterações na estrutura.

### 4.3 Instalar e iniciar o frontend

Em outro terminal:

```bash
cd frontend
npm install
```

Crie o arquivo `.env` a partir de `.env.example`:

```env
VITE_API_URL="http://localhost:3001/api"
```

Inicie o frontend:

```bash
npm run dev
```

Acesse `http://localhost:5173`.

### Usuário de demonstração

- E-mail: `admin@loja.com`
- Senha: `123456`

A conta e os dados iniciais são criados pelo seed. Altere a senha antes de utilizar o sistema em um ambiente real.

## 5. Principais endpoints

As rotas de autenticação e health check não exigem token. As demais rotas exigem `Authorization: Bearer <token>`. As rotas de dados da loja também exigem o cabeçalho `X-Store-Id`.

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/api/health` | Verificar disponibilidade da API |
| POST | `/api/auth/register` | Cadastrar usuário e primeira loja |
| POST | `/api/auth/login` | Autenticar usuário |
| GET | `/api/stores` | Listar lojas do usuário |
| POST | `/api/stores` | Cadastrar nova loja |
| GET | `/api/dashboard` | Consultar indicadores da loja selecionada |
| GET | `/api/products` | Consultar produtos |
| GET | `/api/products/:id` | Consultar um produto |
| POST | `/api/products` | Cadastrar produto |
| PUT | `/api/products/:id` | Atualizar produto |
| DELETE | `/api/products/:id` | Desativar produto |
| GET | `/api/categories` | Consultar categorias |
| POST | `/api/categories` | Cadastrar categoria |
| GET | `/api/suppliers` | Consultar fornecedores |
| POST | `/api/suppliers` | Cadastrar fornecedor |
| GET | `/api/sales` | Consultar vendas |
| POST | `/api/sales` | Registrar venda e atualizar estoque |
| GET | `/api/cep/:cep` | Consultar endereço no ViaCEP |

## 6. Como funciona a troca de lojas

1. Depois do login, o frontend consulta `GET /api/stores`.
2. A loja selecionada fica registrada no navegador.
3. As requisições de dados enviam o identificador no cabeçalho `X-Store-Id`.
4. O middleware `storeContext.js` verifica se a loja pertence ao usuário autenticado.
5. Os controllers e repositories consultam os registros vinculados à loja selecionada.

A seleção não é apenas visual: os dados de cada loja são separados no banco por meio dos relacionamentos `storeId`.

## 7. Integração com API externa

Na tela de fornecedores, o usuário informa um CEP e aciona **Buscar**. O frontend chama a rota `/api/cep/:cep` do backend. O backend consulta o ViaCEP e devolve os dados de endereço para preencher rua, bairro, cidade e estado.

### Backend no Render

- Root Directory: `backend`
- Build Command: `npm install && npx prisma generate`
- Start Command: `npx prisma db push && npm start`
- Variáveis: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`

### Frontend na CloudFlare

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Variável: `VITE_API_URL` com a URL pública do backend seguida de `/api`.

Após publicar, atualize `FRONTEND_URL` no backend com a URL pública do frontend e teste login, CRUD, troca de loja e consulta ViaCEP. **O deploy ainda precisa ser realizado e os links públicos precisam ser adicionados aqui.**

## 8. Observações importantes

- A conta de demonstração usa uma senha simples e deve ser tratada apenas como dado acadêmico.
- O sistema atualiza os indicadores quando a página é carregada ou quando o usuário clica em **Atualizar dados**.
- A pasta `legacy/` preserva um exemplo inicial de Repository/Service e não é utilizada pelo fluxo principal da aplicação.

## 9. Arquivos importantes e o que comprovam

| Arquivo | O que comprova |
|---|---|
| `frontend/src/App.jsx` | Telas e fluxo principal da interface React. |
| `frontend/src/services/api.js` | Requisições assíncronas e envio de token/cabeçalho da loja. |
| `backend/src/server.js` | Inicialização do servidor Express. |
| `backend/src/routes/index.js` | Definição das rotas da API REST. |
| `backend/src/controllers/productController.js` | Recebimento e tratamento das operações de produto. |
| `backend/src/services/productService.js` | Regras de negócio dos produtos. |
| `backend/src/repositories/productRepository.js` | Acesso aos dados usando Prisma. |
| `backend/src/services/authService.js` | Login, bcrypt e emissão de JWT. |
| `backend/src/middleware/auth.js` | Validação do token JWT. |
| `backend/src/middleware/storeContext.js` | Validação da loja selecionada para o usuário. |
| `backend/prisma/schema.prisma` | Modelos, tabelas e relacionamentos do PostgreSQL. |
| `README.md` | Descrição, tecnologias, instruções, endpoints e situação do deploy. |
