const express = require('express');
const PlanoMensalController = require('../controllers/PlanoMensalController');
const auth = require('../middlewares/auth');

const routes = express.Router();

routes.get('/planos-mensais', auth, PlanoMensalController.listar);
routes.get('/planos-mensais/:id', auth, PlanoMensalController.buscarPorId);
routes.post('/planos-mensais', auth, PlanoMensalController.criar);
routes.put('/planos-mensais/:id', auth, PlanoMensalController.atualizar);
routes.delete('/planos-mensais/:id', auth, PlanoMensalController.deletar);

module.exports = routes;
