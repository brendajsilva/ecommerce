const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Importar conexão com banco
const conn = require('./db/conn');

// Importar rotas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const addressRoutes = require('./routes/addresses');
const deliveryRoutes = require('./routes/delivery');
const couponsRoutes = require('./routes/coupons');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/coupons', couponsRoutes);

// Rota de teste
app.get('/api', (req, res) => {
    res.json({ message: 'API TechStore funcionando!' });
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

// Sincronizar banco e iniciar servidor
conn.sync({ alter: true })
    .then(() => {
        console.log('Banco de dados sincronizado!');
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
            console.log(`API disponível em: http://localhost:${PORT}/api`);
        });
    })
    .catch((err) => {
        console.error('Erro ao sincronizar banco de dados:', err);
    });

module.exports = app;
