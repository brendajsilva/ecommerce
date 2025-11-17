const conn = require('./db/conn') 

const { 
    Usuario, 
    Pedido, 
    Produto, 
    ItemPedido, 
    Entrega, 
    Endereco, 
    Estoque 
} = require('./models/rel') 

async function syncDataBase(){
    try{
        // Usando { alter: true } para fazer alterações no banco sem perder dados
        await conn.sync({ alter: true }) 
        
        console.log('-----------------------------')
        console.log('Banco de Dados sincronizado !')
        console.log('-----------------------------')

    }catch(err){
        console.error(' ERRO: Não foi possível sincronizar o banco de dados!', err)
    } finally {
        await conn.close()
        console.log('Conexão com o banco de dados fechada.')
    }
}

// Chamar a função para sincronizar o banco de dados
syncDataBase()