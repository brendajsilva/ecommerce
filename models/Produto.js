const { DataTypes } = require('sequelize')
const db = require('../db/conn') 

const Produto = db.define('produto',{
    codProduto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: true // Pode ser preenchida posteriormente
    },
    modelo: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    preco: {
        type: DataTypes.DECIMAL(10,2), // Preço de venda
        allowNull: false
    },
    imagem_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true // Por padrão, o produto está visível para venda
    }
},{
    timestamps: true,
    tableName: 'produtos'
})

module.exports = Produto