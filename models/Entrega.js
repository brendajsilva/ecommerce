const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Entrega = db.define('entrega',{
    codEntrega: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idPedido: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Garante o relacionamento 1:1 com Pedido
        references: {
            model: 'pedidos', 
            key: 'codPedido'  
        }
    },
    dataEstimada: {
        type: DataTypes.DATEONLY, // Apenas a data, sem o horário
        allowNull: true
    },
    dataEntrega: {
        type: DataTypes.DATE, // Data real da entrega finalizada
        allowNull: true
    },
    codigoRastreio: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true // Cada código de rastreio deve ser único
    },
    transportadora: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    statusEntrega: {
        type: DataTypes.ENUM(
            'AGUARDANDO_ENVIO', 
            'EM_TRANSITO', 
            'SAIU_PARA_ENTREGA', 
            'ENTREGUE', 
            'EXTRAVIADO',
            'DEVOLVIDO'
        ),
        allowNull: false,
        defaultValue: 'AGUARDANDO_ENVIO'
    }
},{
    timestamps: true,
    tableName: 'entregas'
})

module.exports = Entrega