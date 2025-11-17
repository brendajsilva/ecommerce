const Usuario = require('./Usuario')
const Pedido = require('./Pedido')
const Produto = require('./Produto')
const ItemPedido = require('./ItemPedido')
const Entrega = require('./Entrega')
const Endereco = require('./Endereco')
const Estoque = require('./Estoque')
const Cupom = require('./Cupom')

// -------------------------------------------------------------------------
// 1. RELACIONAMENTOS USUÁRIO (codUsuario)
// -------------------------------------------------------------------------

// USUÁRIO <-> PEDIDO (1:N)
Usuario.hasMany(Pedido, {
    foreignKey: 'idUsuario',
    as: 'pedidosUsuario',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

Pedido.belongsTo(Usuario, {
    foreignKey: 'idUsuario',
    as: 'usuarioPedido'
})

// USUÁRIO <-> ENDEREÇO (1:N)
Usuario.hasMany(Endereco, {
    foreignKey: 'idUsuario',
    as: 'enderecosUsuario',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

Endereco.belongsTo(Usuario, {
    foreignKey: 'idUsuario',
    as: 'usuarioEndereco'
})


// -------------------------------------------------------------------------
// 2. RELACIONAMENTOS PEDIDO (codPedido) - SET NULL para endereço é NECESSÁRIO
// -------------------------------------------------------------------------

// PEDIDO <-> ENDEREÇO (N:1)
Endereco.hasMany(Pedido, {
    foreignKey: 'idEndereco',
    as: 'pedidosNoEndereco',
    onDelete: 'SET NULL', // Ação reflexa do belongsTo (garante que Endereco.js não impeça o SET NULL)
    onUpdate: 'CASCADE'
})

Pedido.belongsTo(Endereco, {
    foreignKey: 'idEndereco',
    as: 'enderecoEntrega',
    onDelete: 'SET NULL', // Se o Endereço for deletado, o Pedido o perde, mas não é deletado.
    onUpdate: 'CASCADE'
})

// PEDIDO <-> ITEM_PEDIDO (1:N)
Pedido.hasMany(ItemPedido, {
    foreignKey: 'idPedido',
    as: 'itensPedido',
    onDelete: 'CASCADE', 
    onUpdate: 'CASCADE'
})

ItemPedido.belongsTo(Pedido, {
    foreignKey: 'idPedido',
    as: 'pedidoItem'
})

// PEDIDO <-> ENTREGA (1:1)
Pedido.hasOne(Entrega, {
    foreignKey: 'idPedido',
    as: 'entregaPedido',
    onDelete: 'CASCADE', 
    onUpdate: 'CASCADE'
})

Entrega.belongsTo(Pedido, {
    foreignKey: 'idPedido',
    as: 'pedidoEntrega'
})

// -------------------------------------------------------------------------
// 3. RELACIONAMENTOS PRODUTO (codProduto) - RESTRICT para vendas é CRÍTICO
// -------------------------------------------------------------------------

// PRODUTO <-> ITEM_PEDIDO (1:N)
Produto.hasMany(ItemPedido, {
    foreignKey: 'idProduto',
    as: 'itensProduto',
    onDelete: 'RESTRICT', // IMPEDE a exclusão do Produto se houver histórico de vendas!
    onUpdate: 'CASCADE'
})

ItemPedido.belongsTo(Produto, {
    foreignKey: 'idProduto',
    as: 'produtoItem'
})

// PRODUTO <-> ESTOQUE (1:1)
Produto.hasOne(Estoque, {
    foreignKey: 'idProduto',
    as: 'estoqueProduto',
    onDelete: 'CASCADE', 
    onUpdate: 'CASCADE'
})

Estoque.belongsTo(Produto, {
    foreignKey: 'idProduto',
    as: 'produtoEstoque'
})


module.exports = {
    Usuario,
    Pedido,
    Produto,
    ItemPedido,
    Entrega,
    Endereco,
    Estoque,
    Cupom
}

/* Explicações de:

onDelete: 'SET NULL' => “Se o registro pai for deletado, o campo FK no filho vira NULL (não apaga o filho).”

Se o endereço for apagado (usuário mudou de casa, por exemplo), o pedido não é apagado — apenas o campo 
idEndereco dentro de Pedido fica NULL. Isso faz sentido porque o pedido é histórico (já aconteceu), e 
você não quer perder o registro da venda só porque o endereço foi removido.

onDelete: 'RESTRICT' => “Bloqueie a exclusão do registro pai se ele tiver filhos.”

Se um produto já foi vendido (tem registros em ItemPedido), você não pode 
simplesmente apagá-lo, porque quebraria o histórico de vendas. Ideal para 
auditoria e consistência comercial — você pode desativar o produto (campo ativo: false), 
mas não deletar fisicamente.

*/