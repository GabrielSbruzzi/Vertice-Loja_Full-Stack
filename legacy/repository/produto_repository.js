// Implementação em memória preservada como referência do CRUD inicial.
// A aplicação principal utiliza PostgreSQL por meio do Prisma ORM.

let listaProdutos = [];
let idGerador = 1;

function listar() {
  return [...listaProdutos];
}

function inserir(produto) {
  if (!produto || !produto.nome || !produto.categoria || produto.preco == null) {
    return;
  }

  const novoProduto = {
    ...produto,
    id: idGerador++
  };

  listaProdutos.push(novoProduto);
  return novoProduto;
}

function buscarPorId(id) {
  return listaProdutos.find((produto) => produto.id === Number(id));
}

function atualizar(id, produto) {
  if (!produto || !produto.nome || !produto.categoria || produto.preco == null) {
    return;
  }

  const index = listaProdutos.findIndex((item) => item.id === Number(id));
  if (index === -1) return;

  listaProdutos[index] = {
    ...produto,
    id: Number(id)
  };

  return listaProdutos[index];
}

function deletar(id) {
  const index = listaProdutos.findIndex((produto) => produto.id === Number(id));
  if (index === -1) return;
  return listaProdutos.splice(index, 1)[0];
}

function pesquisarPorCategoria(categoria) {
  return listaProdutos.filter((produto) => produto.categoria === categoria);
}

function pesquisarPorNomeLike(nome) {
  const search = String(nome).toUpperCase();
  return listaProdutos.filter((produto) => produto.nome.toUpperCase().includes(search));
}

module.exports = {
  listar,
  inserir,
  buscarPorId,
  atualizar,
  deletar,
  pesquisarPorCategoria,
  pesquisarPorNomeLike
};
