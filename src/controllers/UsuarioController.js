const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('../models/Usuario');
const Veiculo = require('../models/Veiculo');
const Reserva = require('../models/Reserva');
const Estacionamento = require('../models/Estacionamento');
const PlanoMensal = require('../models/PlanoMensal');
const Vaga = require('../models/Vaga');

function semSenha(usuario) {
  const dados = usuario.toJSON();
  delete dados.senha;
  return dados;
}

async function recalcularStatusVaga(vagaId, transaction) {
  const estacionamentoAtivo = await Estacionamento.findOne({
    where: { vaga_id: vagaId, status: 'ativo' },
    transaction,
  });

  if (estacionamentoAtivo) {
    await Vaga.update(
      { status: 'Ocupada' },
      { where: { id: vagaId }, transaction }
    );
    return;
  }

  const reservaConfirmada = await Reserva.findOne({
    where: {
      vaga_id: vagaId,
      status: 'confirmada',
      data_fim: { [Op.gt]: new Date() },
    },
    transaction,
  });

  await Vaga.update(
    { status: reservaConfirmada ? 'Reservada' : 'Livre' },
    { where: { id: vagaId }, transaction }
  );
}

module.exports = {
  async listar(req, res) {
    try {
      const usuarios = await Usuario.findAll({
        attributes: { exclude: ['senha'] },
      });
      return res.json(usuarios);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ erro: 'Erro ao listar usuários' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const usuario = await Usuario.findByPk(req.params.id, {
        attributes: { exclude: ['senha'] },
      });

      if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      return res.json(usuario);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ erro: 'Erro ao buscar usuário' });
    }
  },

  async criar(req, res) {
    try {
      const { nome, email, senha, tipo = 'cliente' } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({
          erro: 'Nome, email e senha são obrigatórios',
        });
      }

      if (!['admin', 'cliente'].includes(tipo)) {
        return res.status(400).json({
          erro: 'Tipo deve ser admin ou cliente',
        });
      }

      const emailNormalizado = String(email).trim().toLowerCase();
      const usuarioExistente = await Usuario.findOne({
        where: { email: emailNormalizado },
      });

      if (usuarioExistente) {
        return res.status(400).json({ erro: 'Email já cadastrado' });
      }

      const senhaCriptografada = await bcrypt.hash(String(senha), 10);
      const usuario = await Usuario.create({
        nome: String(nome).trim(),
        email: emailNormalizado,
        senha: senhaCriptografada,
        tipo,
      });

      return res.status(201).json(semSenha(usuario));
    } catch (erro) {
      console.error(erro);

      if (erro.name === 'SequelizeValidationError') {
        return res.status(400).json({
          erro: 'Dados inválidos',
          detalhes: erro.errors.map((item) => item.message),
        });
      }

      return res.status(500).json({ erro: 'Erro ao criar usuário' });
    }
  },

  async atualizar(req, res) {
    try {
      const usuario = await Usuario.findByPk(req.params.id);

      if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      const { nome, email, senha, tipo } = req.body;
      const dados = {};

      if (nome !== undefined) {
        if (!String(nome).trim()) {
          return res.status(400).json({ erro: 'Nome não pode ser vazio' });
        }
        dados.nome = String(nome).trim();
      }

      if (email !== undefined) {
        const emailNormalizado = String(email).trim().toLowerCase();
        const emailEmUso = await Usuario.findOne({
          where: {
            email: emailNormalizado,
            id: { [Op.ne]: usuario.id },
          },
        });

        if (emailEmUso) {
          return res.status(400).json({ erro: 'Email já cadastrado' });
        }
        dados.email = emailNormalizado;
      }

      if (tipo !== undefined) {
        if (!['admin', 'cliente'].includes(tipo)) {
          return res.status(400).json({
            erro: 'Tipo deve ser admin ou cliente',
          });
        }
        dados.tipo = tipo;
      }

      if (senha !== undefined) {
        if (!String(senha)) {
          return res.status(400).json({ erro: 'Senha não pode ser vazia' });
        }
        dados.senha = await bcrypt.hash(String(senha), 10);
      }

      if (Object.keys(dados).length === 0) {
        return res.status(400).json({ erro: 'Nenhum campo enviado' });
      }

      await usuario.update(dados);
      return res.json(semSenha(usuario));
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ erro: 'Erro ao atualizar usuário' });
    }
  },

  async deletar(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const usuario = await Usuario.findByPk(req.params.id, { transaction });

      if (!usuario) {
        await transaction.rollback();
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      const veiculos = await Veiculo.findAll({
        where: { usuario_id: usuario.id },
        attributes: ['id'],
        transaction,
      });
      const veiculoIds = veiculos.map((veiculo) => veiculo.id);

      const reservas = await Reserva.findAll({
        where: { usuario_id: usuario.id },
        attributes: ['vaga_id'],
        transaction,
      });
      const vagaIds = reservas.map((reserva) => reserva.vaga_id);

      if (veiculoIds.length > 0) {
        const estacionamentos = await Estacionamento.findAll({
          where: { veiculo_id: { [Op.in]: veiculoIds } },
          attributes: ['vaga_id'],
          transaction,
        });

        vagaIds.push(...estacionamentos.map((item) => item.vaga_id));

        await Estacionamento.destroy({
          where: { veiculo_id: { [Op.in]: veiculoIds } },
          transaction,
        });

        await PlanoMensal.destroy({
          where: {
            [Op.or]: [
              { usuario_id: usuario.id },
              { veiculo_id: { [Op.in]: veiculoIds } },
            ],
          },
          transaction,
        });

        await Veiculo.destroy({
          where: { id: { [Op.in]: veiculoIds } },
          transaction,
        });
      } else {
        await PlanoMensal.destroy({
          where: { usuario_id: usuario.id },
          transaction,
        });
      }

      await Reserva.destroy({
        where: { usuario_id: usuario.id },
        transaction,
      });

      await usuario.destroy({ transaction });

      for (const vagaId of [...new Set(vagaIds)]) {
        await recalcularStatusVaga(vagaId, transaction);
      }

      await transaction.commit();
      return res.json({
        mensagem: 'Usuário e dados relacionados deletados com sucesso',
      });
    } catch (erro) {
      await transaction.rollback();
      console.error(erro);
      return res.status(500).json({ erro: 'Erro ao deletar usuário' });
    }
  },
};
