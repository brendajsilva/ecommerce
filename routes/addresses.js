const express = require('express');
const axios = require('axios');
const Endereco = require('../models/Endereco');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// GET /api/addresses/viacep/:cep - Buscar endereço via ViaCEP
router.get('/viacep/:cep', async (req, res) => {
    try {
        const { cep } = req.params;

        // Validar formato do CEP
        const cepRegex = /^\d{5}-?\d{3}$/;
        if (!cepRegex.test(cep)) {
            return res.status(400).json({ error: 'CEP inválido. Use o formato 00000-000 ou 00000000.' });
        }

        // Remover hífen se existir
        const cepLimpo = cep.replace('-', '');

        // Consultar ViaCEP
        const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);

        if (response.data.erro) {
            return res.status(404).json({ error: 'CEP não encontrado.' });
        }

        res.json({
            cep: response.data.cep,
            logradouro: response.data.logradouro,
            complemento: response.data.complemento,
            bairro: response.data.bairro,
            localidade: response.data.localidade,
            uf: response.data.uf
        });

    } catch (error) {
        console.error('Erro ao consultar ViaCEP:', error);
        res.status(500).json({ error: 'Erro ao consultar CEP.' });
    }
});

// POST /api/addresses - Criar novo endereço
router.post('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { cep, logradouro, complemento, bairro, localidade, uf, numero, apelido, is_principal } = req.body;

        // Validações
        if (!cep || !logradouro || !bairro || !localidade || !uf || !numero) {
            return res.status(400).json({ error: 'CEP, logradouro, bairro, cidade, UF e número são obrigatórios.' });
        }

        // Se for endereço principal, desmarcar outros
        if (is_principal) {
            await Endereco.update(
                { is_principal: false },
                { where: { idUsuario: userId } }
            );
        }

        const novoEndereco = await Endereco.create({
            idUsuario: userId,
            cep,
            logradouro,
            complemento: complemento || null,
            bairro,
            localidade,
            uf,
            numero,
            apelido: apelido || null,
            is_principal: is_principal || false
        });

        res.status(201).json({
            message: 'Endereço criado com sucesso!',
            endereco: novoEndereco
        });

    } catch (error) {
        console.error('Erro ao criar endereço:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/addresses - Listar endereços do usuário
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const enderecos = await Endereco.findAll({
            where: { idUsuario: userId },
            order: [['is_principal', 'DESC'], ['createdAt', 'DESC']]
        });

        res.json(enderecos);
    } catch (error) {
        console.error('Erro ao buscar endereços:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/addresses/:id - Buscar endereço específico
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const endereco = await Endereco.findOne({
            where: { codEndereco: id, idUsuario: userId }
        });

        if (!endereco) {
            return res.status(404).json({ error: 'Endereço não encontrado.' });
        }

        res.json(endereco);
    } catch (error) {
        console.error('Erro ao buscar endereço:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// PUT /api/addresses/:id - Atualizar endereço
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { cep, logradouro, complemento, bairro, localidade, uf, numero, apelido, is_principal } = req.body;

        const endereco = await Endereco.findOne({
            where: { codEndereco: id, idUsuario: userId }
        });

        if (!endereco) {
            return res.status(404).json({ error: 'Endereço não encontrado.' });
        }

        // Se for endereço principal, desmarcar outros
        if (is_principal) {
            await Endereco.update(
                { is_principal: false },
                { where: { idUsuario: userId, codEndereco: { [require('sequelize').Op.ne]: id } } }
            );
        }

        await endereco.update({
            cep: cep || endereco.cep,
            logradouro: logradouro || endereco.logradouro,
            complemento: complemento !== undefined ? complemento : endereco.complemento,
            bairro: bairro || endereco.bairro,
            localidade: localidade || endereco.localidade,
            uf: uf || endereco.uf,
            numero: numero || endereco.numero,
            apelido: apelido !== undefined ? apelido : endereco.apelido,
            is_principal: is_principal !== undefined ? is_principal : endereco.is_principal
        });

        res.json({
            message: 'Endereço atualizado com sucesso!',
            endereco
        });

    } catch (error) {
        console.error('Erro ao atualizar endereço:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// DELETE /api/addresses/:id - Deletar endereço
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const endereco = await Endereco.findOne({
            where: { codEndereco: id, idUsuario: userId }
        });

        if (!endereco) {
            return res.status(404).json({ error: 'Endereço não encontrado.' });
        }

        await endereco.destroy();

        res.json({ message: 'Endereço deletado com sucesso!' });

    } catch (error) {
        console.error('Erro ao deletar endereço:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
