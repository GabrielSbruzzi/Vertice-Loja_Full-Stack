// Camada de serviço da implementação inicial em memória.
// Mantida apenas como referência acadêmica do padrão Repository/Service.

const repository = require('../repository/produto_repository');

function validar(produto) {
  if (!produto || !produto.nome || !produto.categoria || produto.preco == null) {
    const error = new Error('Produto sem dados corretos');
    error.status = 400;
    throw error;
  }
}

function listar() {
  return repository.listar();
}

function inserir(produto) {
  validar(produto);
  return repository.inserir(produto);
}

function buscarPorId(id) {
  const produto = repository.buscarPorId(id);
  if (!produto) {
    const error = new Error('Produto não encontrado');
    error.status = 404;
    throw error;
  }
  return produto;
}

function atualizar(id, produto) {
  validar(produto);
  const result = repository.atualizar(id, produto);
  if (!result) {
    const error = new Error('Produto não encontrado');
    error.status = 404;
    throw error;
  }
  return result;
}

function deletar(id) {
  const result = repository.deletar(id);
  if (!result) {
    const error = new Error('Produto não encontrado');
    error.status = 404;
    throw error;
  }
  return result;
}

module.exports = {
  listar,
  inserir,
  buscarPorId,
  atualizar,
  deletar
};
