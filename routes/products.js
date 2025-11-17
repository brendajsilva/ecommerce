const express = require('express');
const Produto = require('../models/Produto');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// GET /api/products - Listar todos os produtos ativos
router.get('/', async (req, res) => {
    try {
        const produtos = await Produto.findAll({
            where: { ativo: true },
            attributes: ['codProduto', 'nome', 'descricao', 'modelo', 'preco', 'imagem_url'],
            order: [['nome', 'ASC']]
        });

        res.json(produtos);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/products/:id - Buscar produto por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const produto = await Produto.findByPk(id, {
            attributes: ['codProduto', 'nome', 'descricao', 'modelo', 'preco', 'imagem_url']
        });

        if (!produto) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }

        res.json(produto);
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// POST /api/products - Criar novo produto (apenas admin)
router.post('/', verifyToken, async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.tipo !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem criar produtos.' });
        }

        const { nome, descricao, modelo, preco, imagem_url } = req.body;

        if (!nome || !modelo || !preco) {
            return res.status(400).json({ error: 'Nome, modelo e preço são obrigatórios.' });
        }

        const novoProduto = await Produto.create({
            nome,
            descricao,
            modelo,
            preco,
            imagem_url
        });

        res.status(201).json({
            message: 'Produto criado com sucesso!',
            produto: novoProduto
        });
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// PUT /api/products/:id - Atualizar produto (apenas admin)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.tipo !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem atualizar produtos.' });
        }

        const { id } = req.params;
        const { nome, descricao, modelo, preco, imagem_url, ativo } = req.body;

        const produto = await Produto.findByPk(id);
        if (!produto) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }

        await produto.update({
            nome: nome || produto.nome,
            descricao: descricao !== undefined ? descricao : produto.descricao,
            modelo: modelo || produto.modelo,
            preco: preco || produto.preco,
            imagem_url: imagem_url !== undefined ? imagem_url : produto.imagem_url,
            ativo: ativo !== undefined ? ativo : produto.ativo
        });

        res.json({
            message: 'Produto atualizado com sucesso!',
            produto
        });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// DELETE /api/products/:id - Desativar produto (apenas admin)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.tipo !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem desativar produtos.' });
        }

        const { id } = req.params;

        const produto = await Produto.findByPk(id);
        if (!produto) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }

        await produto.update({ ativo: false });

        res.json({ message: 'Produto desativado com sucesso!' });
    } catch (error) {
        console.error('Erro ao desativar produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
