# Guia de apresentação — Vértice Loja

## Visão geral da arquitetura

O projeto está dividido em duas aplicações que conversam por HTTP:

- **Frontend React:** mostra as telas, coleta os dados dos formulários e faz requisições assíncronas para a API.
- **Backend Express:** recebe as requisições, valida os dados, aplica as regras de negócio e acessa o banco.
- **PostgreSQL/Neon:** armazena usuários, lojas, categorias, produtos, vendas, itens de venda e fornecedores.

## Como explicar o caminho de uma alteração de produto

1. O usuário abre a tela Produtos e clica em Editar.
2. O React preenche o formulário com os dados recebidos da API.
3. Ao salvar, o frontend envia uma requisição `PUT /api/products/:id` com `fetch` e `async/await`.
4. O middleware `auth.js` valida o token JWT.
5. O middleware `storeContext.js` verifica se a loja selecionada pertence ao usuário.
6. O controller `productController.js` valida os campos com Zod.
7. O service `productService.js` aplica as regras de negócio, incluindo validação de categoria e SKU.
8. O repository `productRepository.js` executa a atualização pelo Prisma.
9. A API devolve o produto atualizado e o frontend recarrega a lista.

## Responsabilidade de cada camada

| Camada | Responsabilidade | Exemplo |
|---|---|---|
| Routes | Define método HTTP e caminho | `routes/index.js` |
| Middleware | Verifica autenticação e loja ativa | `middleware/auth.js`, `middleware/storeContext.js` |
| Controller | Trata entrada e saída HTTP | `controllers/productController.js` |
| Service | Executa regras de negócio | `services/productService.js` |
| Repository | Consulta e altera os registros | `repositories/productRepository.js` |
| Prisma | Faz a comunicação com PostgreSQL | `prisma/schema.prisma`, `src/prisma.js` |

## Conceitos para explicar

- **CRUD:** Create (POST), Read (GET), Update (PUT) e Delete (DELETE). A exclusão de produto é lógica: o campo `active` é marcado como `false`, preservando o histórico de vendas.
- **API REST:** o frontend e o backend se comunicam por rotas HTTP que representam recursos do sistema.
- **Requisição assíncrona:** `fetch` com `async/await` permite aguardar a resposta da API sem bloquear a interface.
- **JWT:** depois do login, o servidor entrega um token assinado. O frontend envia esse token no cabeçalho `Authorization` das rotas protegidas.
- **bcrypt:** transforma a senha em hash antes de armazená-la. O sistema não grava a senha original no banco.
- **ORM Prisma:** permite consultar e alterar dados usando modelos JavaScript/TypeScript e mantém o schema do banco descrito no arquivo Prisma.
- **Neon:** hospeda um banco PostgreSQL na nuvem; não é uma linguagem ou um ORM, é o serviço que fornece o banco.
- **Transação de venda:** o registro da venda e a baixa do estoque são executados dentro de uma transação para evitar que apenas parte da operação seja gravada.
- **ViaCEP:** serviço externo consultado pelo backend para preencher dados de endereço a partir do CEP.

## Demonstrações recomendadas

- Faça login com a conta de demonstração.
- Edite um produto e mostre que a lista reflete o novo valor.
- Cadastre um segundo produto e depois desative-o.
- Registre uma venda e confira a redução do estoque.
- Cadastre uma segunda loja, alterne entre as duas e mostre que os produtos e indicadores são separados.
- Cadastre um fornecedor e consulte um CEP válido.
- Abra o endpoint `/api/health` para mostrar a API ativa.

## Pontos que precisam ser concluídos antes da apresentação

- Criar o banco no Neon e configurar a variável `DATABASE_URL`.
- Executar `npx prisma db push` e `npm run prisma:seed` no backend.
- Executar o frontend e testar o fluxo completo com o backend.
- Publicar backend e frontend e testar as URLs públicas.
- Criar o repositório GitHub, enviar o projeto e inserir o link no README.