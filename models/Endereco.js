const { DataTypes } = require('sequelize')
const db = require('../db/conn') 

const Endereco = db.define('endereco',{
    codEndereco: {
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
    // Campos do ViaCEP:
    cep: { // Ex: '88300-000'
        type: DataTypes.STRING(9), 
        allowNull: false
    },
    logradouro: { // Equivalente a'rua'
        type: DataTypes.STRING(70),
        allowNull: false
    },
    complemento: {
        type: DataTypes.STRING(100),
        allowNull: true 
    },
    bairro: {
        type: DataTypes.STRING(70),
        allowNull: false
    },
    localidade: { // Equivalente a 'cidade'
        type: DataTypes.STRING(70),
        allowNull: false
    },
    uf: { // Equivalente a 'estado'
        type: DataTypes.STRING(2), 
        allowNull: false
    },
    numero: { // Sempre preenchido pelo usuário
        type: DataTypes.STRING(12),
        allowNull: false
    },
    apelido: { // Preenchido pelo usuário (Ex: "Casa", "Trabalho")
        type: DataTypes.STRING(50),
        allowNull: true 
    },
    is_principal: { // Para identificar se este é o endereço padrão de entrega
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
},{
    timestamps: true,
    tableName: 'enderecos'
})

module.exports = Endereco