const express = require('express');
const VeiculoController = require('../controllers/VeiculoController');
const auth = require('../middlewares/auth');

const routes = express.Router();

routes.get('/veiculos', auth, VeiculoController.listar);
routes.get('/veiculos/:id', auth, VeiculoController.buscarPorId);
routes.post('/veiculos', auth, VeiculoController.criar);
routes.put('/veiculos/:id', auth, VeiculoController.atualizar);
routes.delete('/veiculos/:id', auth, VeiculoController.deletar);

module.exports = routes;
