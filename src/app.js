const express = require('express');
require('./models/associations');

const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const veiculoRoutes = require('./routes/veiculoRoutes');
const vagaRoutes = require('./routes/vagaRoutes');
const estacionamentoRoutes = require('./routes/estacionamentoRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const planoMensalRoutes = require('./routes/planoMensalRoutes');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  return res.json({ mensagem: 'API ParkFlow rodando!' });
});

app.use(authRoutes);
app.use(usuarioRoutes);
app.use(veiculoRoutes);
app.use(vagaRoutes);
app.use(estacionamentoRoutes);
app.use(reservaRoutes);
app.use(planoMensalRoutes);

app.use((req, res) => {
  return res.status(404).json({ erro: 'Rota não encontrada' });
});

module.exports = app;
