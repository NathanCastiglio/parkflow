const express = require('express');
const ReservaController = require('../controllers/ReservaController');
const auth = require('../middlewares/auth');

const routes = express.Router();

routes.get('/reservas', auth, ReservaController.listar);
routes.get('/reservas/:id', auth, ReservaController.buscarPorId);
routes.post('/reservas', auth, ReservaController.criar);
routes.put('/reservas/:id', auth, ReservaController.atualizar);
routes.delete('/reservas/:id', auth, ReservaController.deletar);

module.exports = routes;
