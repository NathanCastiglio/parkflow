const express = require('express');
const EstacionamentoController = require('../controllers/EstacionamentoController');
const auth = require('../middlewares/auth');

const routes = express.Router();

routes.get('/estacionamentos', auth, EstacionamentoController.listar);
routes.get('/estacionamentos/:id', auth, EstacionamentoController.buscarPorId);
routes.post('/estacionamentos', auth, EstacionamentoController.criar);
routes.put('/estacionamentos/:id', auth, EstacionamentoController.atualizar);
routes.delete('/estacionamentos/:id', auth, EstacionamentoController.deletar);

module.exports = routes;
