const express = require('express');
const VagaController = require('../controllers/VagaController');
const auth = require('../middlewares/auth');

const routes = express.Router();

routes.get('/vagas', auth, VagaController.listar);
routes.get('/vagas/:id', auth, VagaController.buscarPorId);
routes.post('/vagas', auth, VagaController.criar);
routes.put('/vagas/:id', auth, VagaController.atualizar);
routes.delete('/vagas/:id', auth, VagaController.deletar);

module.exports = routes;
