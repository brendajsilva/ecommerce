const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const router = express.Router();

// Rota de registro
router.post('/register', async (req, res) => {
    try {
        const { username, nome, email, password, telefone, cpf, identidade } = req.body;

        // Validações básicas - apenas username, nome, email e senha são obrigatórios
        if (!username || !nome || !email || !password) {
            return res.status(400).json({ error: 'Username, nome, email e senha são obrigatórios.' });
        }

        // Campos opcionais podem ser vazios ou não fornecidos
        const telefoneValido = telefone && telefone.trim() !== '' ? telefone.trim() : null;
        const cpfValido = cpf && cpf.trim() !== '' ? cpf.trim() : null;

        // Validação de CPF se fornecido
        if (cpfValido) {
            const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
            if (!cpfRegex.test(cpfValido)) {
                return res.status(400).json({ error: 'CPF inválido. Use o formato XXX.XXX.XXX-XX.' });
            }
        }

        // Verificar se usuário já existe
        const usuarioExistente = await Usuario.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { username: username },
                    { email: email },
                    ...(cpfValido ? [{ cpf: cpfValido }] : [])
                ]
            }
        });

        if (usuarioExistente) {
            return res.status(400).json({ error: 'Usuário, email ou CPF já cadastrado.' });
        }

        // Hash da senha
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Criar usuário
        const novoUsuario = await Usuario.create({
            username: username,
            nome: nome,
            email,
            senha: hashedPassword,
            telefone: telefoneValido,
            cpf: cpfValido,
            identidade: identidade || null,
            tipo_usuario: req.body.tipo_usuario || 'CLIENTE'
        });

        // Gerar token JWT
        const token = jwt.sign(
            { id: novoUsuario.codUsuario, tipo: req.body.tipo_usuario || 'CLIENTE' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Usuário registrado com sucesso!',
            token,
            user: {
                id: novoUsuario.codUsuario,
                username: novoUsuario.username,
                nome: novoUsuario.nome,
                email: novoUsuario.email,
                tipo_usuario: novoUsuario.tipo_usuario
            }
        });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota de login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
        }

        // Buscar usuário por username, nome ou email (case insensitive)
        const usuario = await Usuario.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    require('sequelize').where(
                        require('sequelize').fn('LOWER', require('sequelize').col('username')),
                        require('sequelize').fn('LOWER', username)
                    ),
                    require('sequelize').where(
                        require('sequelize').fn('LOWER', require('sequelize').col('nome')),
                        require('sequelize').fn('LOWER', username)
                    ),
                    require('sequelize').where(
                        require('sequelize').fn('LOWER', require('sequelize').col('email')),
                        require('sequelize').fn('LOWER', username)
                    )
                ]
            }
        });

        if (!usuario) {
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(password, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Senha incorreta.' });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { id: usuario.codUsuario, tipo: usuario.tipo_usuario },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login realizado com sucesso!',
            token,
            user: {
                id: usuario.codUsuario,
                username: usuario.username,
                nome: usuario.nome,
                email: usuario.email,
                tipo_usuario: usuario.tipo_usuario
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para verificar token (middleware já verifica)
router.get('/verify', require('../middleware/auth'), (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

module.exports = router;
