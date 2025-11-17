const express = require('express');
const Entrega = require('../models/Entrega');
const Pedido = require('../models/Pedido');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// GET /api/delivery/:orderId - Buscar informações de entrega de um pedido
router.get('/:orderId', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        // Verificar se o pedido pertence ao usuário
        const pedido = await Pedido.findOne({
            where: { codPedido: orderId, idUsuario: userId }
        });

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        const entrega = await Entrega.findOne({
            where: { idPedido: orderId }
        });

        if (!entrega) {
            return res.status(404).json({ error: 'Informações de entrega não encontradas.' });
        }

        res.json({
            codEntrega: entrega.codEntrega,
            idPedido: entrega.idPedido,
            dataEstimada: entrega.dataEstimada,
            dataEntrega: entrega.dataEntrega,
            codigoRastreio: entrega.codigoRastreio,
            transportadora: entrega.transportadora,
            statusEntrega: entrega.statusEntrega
        });
    } catch (error) {
        console.error('Erro ao buscar entrega:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// PUT /api/delivery/:orderId - Atualizar status da entrega (apenas admin)
router.put('/:orderId', verifyToken, async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.tipo !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem atualizar entregas.' });
        }

        const { orderId } = req.params;
        const { statusEntrega, codigoRastreio, transportadora, dataEstimada } = req.body;

        const entrega = await Entrega.findOne({
            where: { idPedido: orderId }
        });

        if (!entrega) {
            return res.status(404).json({ error: 'Entrega não encontrada.' });
        }

        const statusValidos = ['AGUARDANDO_ENVIO', 'EM_TRANSITO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'EXTRAVIADO', 'DEVOLVIDO'];
        if (statusEntrega && !statusValidos.includes(statusEntrega)) {
            return res.status(400).json({ error: 'Status de entrega inválido.' });
        }

        const updateData = {};
        if (statusEntrega) updateData.statusEntrega = statusEntrega;
        if (codigoRastreio) updateData.codigoRastreio = codigoRastreio;
        if (transportadora) updateData.transportadora = transportadora;
        if (dataEstimada) updateData.dataEstimada = dataEstimada;

        // Se o status for ENTREGUE, definir dataEntrega
        if (statusEntrega === 'ENTREGUE') {
            updateData.dataEntrega = new Date();
        }

        await entrega.update(updateData);

        res.json({
            message: 'Entrega atualizada com sucesso!',
            entrega: {
                idPedido: entrega.idPedido,
                statusEntrega: entrega.statusEntrega,
                codigoRastreio: entrega.codigoRastreio,
                transportadora: entrega.transportadora,
                dataEstimada: entrega.dataEstimada,
                dataEntrega: entrega.dataEntrega
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar entrega:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
