const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

module.exports = {
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({
          erro: 'Email e senha são obrigatórios',
        });
      }

      const usuario = await Usuario.findOne({
        where: { email: String(email).trim().toLowerCase() },
      });

      if (!usuario) {
        return res.status(401).json({ erro: 'Email ou senha inválidos' });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha);

      if (!senhaValida) {
        return res.status(401).json({ erro: 'Email ou senha inválidos' });
      }

      const token = jwt.sign(
        { id: usuario.id, tipo: usuario.tipo },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      const usuarioSemSenha = usuario.toJSON();
      delete usuarioSemSenha.senha;

      return res.status(200).json({
        usuario: usuarioSemSenha,
        token,
      });
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  },
};
