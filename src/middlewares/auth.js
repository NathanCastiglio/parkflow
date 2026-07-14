const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não informado' });
  }

  const [tipo, token] = authHeader.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({
      erro: 'Formato do token inválido. Use Bearer Token.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.usuarioId = decoded.id;
    req.tipo = decoded.tipo;

    return next();
  } catch (erro) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
};
