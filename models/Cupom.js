const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Cupom = db.define('cupom',{
    codCupom: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    codigo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    descricao: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    tipoDesconto: {
        type: DataTypes.ENUM('PERCENTUAL', 'FIXO'),
        allowNull: false
    },
    valorDesconto: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
    },
    valorMaximoDesconto: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: true // Apenas para descontos percentuais
    },
    valorMinimo: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: true // Valor mínimo da compra para aplicar o cupom
    },
    dataExpiracao: {
        type: DataTypes.DATE,
        allowNull: false
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    tipo: {
        type: DataTypes.ENUM('GERAL', 'PRIMEIRO_PEDIDO', 'PROMOCIONAL'),
        allowNull: false,
        defaultValue: 'GERAL'
    },
    usosMaximos: {
        type: DataTypes.INTEGER,
        allowNull: true // null = ilimitado
    },
    usosAtuais: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
},{
    timestamps: true,
    tableName: 'cupons'
})

module.exports = Cupom
