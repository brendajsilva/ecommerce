const express = require('express');
const Pedido = require('../models/Pedido');
const ItemPedido = require('../models/ItemPedido');
const Produto = require('../models/Produto');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// POST /api/orders - Criar novo pedido
router.post('/', verifyToken, async (req, res) => {
    try {
        const { items, metodoPagamento, idEndereco, cupomCodigo } = req.body;
        const userId = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'O pedido deve conter pelo menos um item.' });
        }

        if (!metodoPagamento) {
            return res.status(400).json({ error: 'Método de pagamento é obrigatório.' });
        }

        if (!idEndereco) {
            return res.status(400).json({ error: 'Endereço de entrega é obrigatório.' });
        }

        // Calcular totais
        let valorSubtotal = 0;
        const itensComPreco = [];

        for (const item of items) {
            const produto = await Produto.findByPk(item.product_id || item.idProduto);
            if (!produto) {
                return res.status(404).json({ error: `Produto ${item.product_id || item.idProduto} não encontrado.` });
            }

            if (!produto.ativo) {
                return res.status(400).json({ error: `Produto ${produto.nome} não está disponível.` });
            }

            const quantidade = item.quantity || item.quantidade || 1;
            const precoUnitario = parseFloat(produto.preco);
            const valorTotalItem = quantidade * precoUnitario;

            valorSubtotal += valorTotalItem;

            itensComPreco.push({
                idProduto: produto.codProduto,
                quantidade,
                precoUnitario,
                valorTotalItem
            });
        }

        // Calcular frete
        const valorFrete = valorSubtotal > 299 ? 0 : 15.90;

        // Aplicar cupom se fornecido
        let valorDesconto = 0;
        let cupomAplicado = null;

        if (cupomCodigo) {
            const Cupom = require('../models/Cupom');
            const cupom = await Cupom.findOne({
                where: {
                    codigo: cupomCodigo.toUpperCase(),
                    ativo: true,
                    dataExpiracao: {
                        [require('sequelize').Op.gte]: new Date()
                    }
                }
            });

            if (cupom) {
                // Verificar valor mínimo
                if (cupom.valorMinimo && valorSubtotal < cupom.valorMinimo) {
                    return res.status(400).json({
                        error: `Este cupom requer um valor mínimo de compra de R$ ${cupom.valorMinimo.toFixed(2)}.`
                    });
                }

                // Calcular desconto
                if (cupom.tipoDesconto === 'PERCENTUAL') {
                    valorDesconto = (valorSubtotal * cupom.valorDesconto) / 100;
                    if (cupom.valorMaximoDesconto && valorDesconto > cupom.valorMaximoDesconto) {
                        valorDesconto = cupom.valorMaximoDesconto;
                    }
                } else if (cupom.tipoDesconto === 'FIXO') {
                    valorDesconto = cupom.valorDesconto;
                }

                cupomAplicado = cupom.codCupom;
            } else {
                return res.status(400).json({ error: 'Cupom inválido ou expirado.' });
            }
        }

        const valorTotal = valorSubtotal + valorFrete - valorDesconto;

        // Criar pedido
        const novoPedido = await Pedido.create({
            idUsuario: userId,
            idEndereco: idEndereco,
            idCupom: cupomAplicado,
            status: 'PENDENTE_PAGAMENTO',
            valorSubtotal,
            valorFrete,
            valorDesconto,
            valorTotal,
            metodoPagamento
        });

        // Criar itens do pedido
        for (const item of itensComPreco) {
            await ItemPedido.create({
                idPedido: novoPedido.codPedido,
                ...item
            });
        }

        // Criar informações de entrega
        const Entrega = require('../models/Entrega');
        const dataEstimada = new Date();
        dataEstimada.setDate(dataEstimada.getDate() + 7); // 7 dias para entrega

        await Entrega.create({
            idPedido: novoPedido.codPedido,
            dataEstimada,
            statusEntrega: 'AGUARDANDO_ENVIO',
            transportadora: 'TechStore Express'
        });

        res.status(201).json({
            message: 'Pedido criado com sucesso!',
            pedido: {
                id: novoPedido.codPedido,
                status: novoPedido.status,
                valorSubtotal: novoPedido.valorSubtotal,
                valorFrete: novoPedido.valorFrete,
                valorDesconto: novoPedido.valorDesconto,
                valorTotal: novoPedido.valorTotal,
                metodoPagamento: novoPedido.metodoPagamento,
                items: itensComPreco.length,
                entregaEstimada: dataEstimada
            }
        });

    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/orders - Listar pedidos do usuário
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const pedidos = await Pedido.findAll({
            where: { idUsuario: userId },
            include: [{
                model: ItemPedido,
                as: 'itens',
                include: [{
                    model: Produto,
                    as: 'produto',
                    attributes: ['nome', 'modelo', 'imagem_url']
                }]
            }],
            order: [['dataPedido', 'DESC']]
        });

        res.json(pedidos);
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/orders/:id - Buscar pedido específico
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const pedido = await Pedido.findOne({
            where: { codPedido: id, idUsuario: userId },
            include: [{
                model: ItemPedido,
                as: 'itens',
                include: [{
                    model: Produto,
                    as: 'produto',
                    attributes: ['nome', 'modelo', 'imagem_url']
                }]
            }]
        });

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        res.json(pedido);
    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// PUT /api/orders/:id/status - Atualizar status do pedido (apenas admin)
router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.tipo !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem alterar status de pedidos.' });
        }

        const { id } = req.params;
        const { status } = req.body;

        const pedido = await Pedido.findByPk(id);
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        const statusValidos = ['PENDENTE_PAGAMENTO', 'PROCESSANDO_PAGAMENTO', 'PAGO', 'SEPARACAO_ESTOQUE', 'ENVIADO', 'ENTREGUE', 'CANCELADO'];
        if (!statusValidos.includes(status)) {
            return res.status(400).json({ error: 'Status inválido.' });
        }

        await pedido.update({ status });

        res.json({
            message: 'Status do pedido atualizado com sucesso!',
            pedido: {
                id: pedido.codPedido,
                status: pedido.status
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar status do pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/orders/admin/all - Listar todos os pedidos (apenas admin)
router.get('/admin/all', verifyToken, async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.tipo !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem visualizar todos os pedidos.' });
        }

        const pedidos = await Pedido.findAll({
            include: [{
                model: ItemPedido,
                as: 'itens',
                include: [{
                    model: Produto,
                    as: 'produto',
                    attributes: ['nome', 'modelo']
                }]
            }],
            order: [['dataPedido', 'DESC']]
        });

        res.json(pedidos);
    } catch (error) {
        console.error('Erro ao buscar todos os pedidos:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
