const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Pedido = db.define('pedido',{
    codPedido: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'codUsuario'
        }
    },
    idEndereco: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'enderecos',
            key: 'codEndereco'
        }
    },
    idCupom: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'cupons',
            key: 'codCupom'
        }
    },
    dataPedido: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM(
            'PENDENTE_PAGAMENTO',
            'PROCESSANDO_PAGAMENTO',
            'PAGO',
            'SEPARACAO_ESTOQUE',
            'ENVIADO',
            'ENTREGUE',
            'CANCELADO'
        ),
        allowNull: false,
        defaultValue: 'PENDENTE_PAGAMENTO'
    },
    valorSubtotal: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        defaultValue: 0.00
    },
    valorFrete: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        defaultValue: 0.00
    },
    valorDesconto: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        defaultValue: 0.00
    },
    valorTotal: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        defaultValue: 0.00
    },
    metodoPagamento: {
    type: DataTypes.ENUM(
        'CARTAO_CREDITO',
        'PIX',
        'BOLETO',
        'DEBITO_ONLINE',
        'CARTEIRA_DIGITAL' // Opcional para cobrir PayPal/Mercado Pago, etc.
    ),
    allowNull: false,
    defaultValue: 'CARTAO_CREDITO'
}
},{
    timestamps: true,
    tableName: 'pedidos'
})

module.exports = Pedido
