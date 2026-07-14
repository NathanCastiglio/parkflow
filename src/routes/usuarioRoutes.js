const express = require('express');
const UsuarioController = require('../controllers/UsuarioController');
const auth = require('../middlewares/auth');

const routes = express.Router();

routes.post('/usuarios', UsuarioController.criar);
routes.get('/usuarios', auth, UsuarioController.listar);
routes.get('/usuarios/:id', auth, UsuarioController.buscarPorId);
routes.put('/usuarios/:id', auth, UsuarioController.atualizar);
routes.delete('/usuarios/:id', auth, UsuarioController.deletar);

module.exports = routes;
