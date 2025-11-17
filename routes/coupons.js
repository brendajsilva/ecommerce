const express = require('express');
const Cupom = require('../models/Cupom');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// GET /api/coupons - Listar cupons disponíveis para o usuário
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const cupons = await Cupom.findAll({
            where: {
                ativo: true,
                dataExpiracao: {
                    [require('sequelize').Op.gte]: new Date()
                }
            },
            order: [['dataExpiracao', 'ASC']]
        });

        // Filtrar cupons por regras específicas se necessário
        const cuponsDisponiveis = cupons.filter(cupom => {
            // Exemplo: cupons de primeiro pedido apenas para usuários sem pedidos
            if (cupom.tipo === 'PRIMEIRO_PEDIDO') {
                // Verificar se usuário já fez pedidos (implementar lógica)
                return true; // Simplificado
            }
            return true;
        });

        res.json(cuponsDisponiveis.map(cupom => ({
            codCupom: cupom.codCupom,
            codigo: cupom.codigo,
            descricao: cupom.descricao,
            tipoDesconto: cupom.tipoDesconto,
            valorDesconto: cupom.valorDesconto,
            valorMinimo: cupom.valorMinimo,
            dataExpiracao: cupom.dataExpiracao
        })));
    } catch (error) {
        console.error('Erro ao buscar cupons:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// POST /api/coupons/validate - Validar cupom
router.post('/validate', verifyToken, async (req, res) => {
    try {
        const { codigo, valorCompra } = req.body;

        if (!codigo) {
            return res.status(400).json({ error: 'Código do cupom é obrigatório.' });
        }

        const cupom = await Cupom.findOne({
            where: {
                codigo: codigo.toUpperCase(),
                ativo: true,
                dataExpiracao: {
                    [require('sequelize').Op.gte]: new Date()
                }
            }
        });

        if (!cupom) {
            return res.status(404).json({ error: 'Cupom inválido ou expirado.' });
        }

        // Verificar valor mínimo
        if (cupom.valorMinimo && valorCompra < cupom.valorMinimo) {
            return res.status(400).json({
                error: `Este cupom requer um valor mínimo de compra de R$ ${cupom.valorMinimo.toFixed(2)}.`
            });
        }

        // Calcular desconto
        let valorDesconto = 0;
        if (cupom.tipoDesconto === 'PERCENTUAL') {
            valorDesconto = (valorCompra * cupom.valorDesconto) / 100;
            if (cupom.valorMaximoDesconto && valorDesconto > cupom.valorMaximoDesconto) {
                valorDesconto = cupom.valorMaximoDesconto;
            }
        } else if (cupom.tipoDesconto === 'FIXO') {
            valorDesconto = cupom.valorDesconto;
        }

        res.json({
            valido: true,
            cupom: {
                codCupom: cupom.codCupom,
                codigo: cupom.codigo,
                descricao: cupom.descricao,
                tipoDesconto: cupom.tipoDesconto,
                valorDesconto: cupom.valorDesconto,
                valorMaximoDesconto: cupom.valorMaximoDesconto,
                valorMinimo: cupom.valorMinimo
            },
            descontoAplicado: valorDesconto,
            valorFinal: valorCompra - valorDesconto
        });
    } catch (error) {
        console.error('Erro ao validar cupom:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
