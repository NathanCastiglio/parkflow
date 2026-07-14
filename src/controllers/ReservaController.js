const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Reserva = require('../models/Reserva');
const Usuario = require('../models/Usuario');
const Vaga = require('../models/Vaga');
const Estacionamento = require('../models/Estacionamento');

const STATUS_VALIDOS = ['pendente', 'confirmada', 'cancelada', 'finalizada'];

async function liberarVagaSeDisponivel(vagaId, transaction) {
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

  const outraReserva = await Reserva.findOne({
    where: {
      vaga_id: vagaId,
      status: 'confirmada',
      data_fim: { [Op.gt]: new Date() },
    },
    transaction,
  });

  await Vaga.update(
    { status: outraReserva ? 'Reservada' : 'Livre' },
    { where: { id: vagaId }, transaction }
  );
}

module.exports = {
  async listar(req, res) {
    try {
      const reservas = await Reserva.findAll({
        include: [
          {
            model: Usuario,
            attributes: ['id', 'nome', 'email', 'tipo'],
          },
          {
            model: Vaga,
            attributes: ['id', 'numero', 'tipo', 'status'],
          },
        ],
      });
      return res.json(reservas);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao listar reservas',
        detalhe: erro.message,
      });
    }
  },

  async buscarPorId(req, res) {
    try {
      const reserva = await Reserva.findByPk(req.params.id, {
        include: [
          {
            model: Usuario,
            attributes: ['id', 'nome', 'email', 'tipo'],
          },
          {
            model: Vaga,
            attributes: ['id', 'numero', 'tipo', 'status'],
          },
        ],
      });

      if (!reserva) {
        return res.status(404).json({ erro: 'Reserva não encontrada' });
      }

      return res.json(reserva);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao buscar reserva',
        detalhe: erro.message,
      });
    }
  },

  async criar(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const {
        usuario_id,
        vaga_id,
        data_inicio,
        data_fim,
        status = 'pendente',
        valor_pago = 0,
      } = req.body;

      if (!usuario_id || !vaga_id || !data_inicio || !data_fim) {
        await transaction.rollback();
        return res.status(400).json({
          erro: 'usuario_id, vaga_id, data_inicio e data_fim são obrigatórios',
        });
      }

      if (!STATUS_VALIDOS.includes(status)) {
        await transaction.rollback();
        return res.status(400).json({ erro: 'Status da reserva inválido' });
      }

      const inicio = new Date(data_inicio);
      const fim = new Date(data_fim);

      if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
        await transaction.rollback();
        return res.status(400).json({ erro: 'Data inválida' });
      }

      if (fim <= inicio) {
        await transaction.rollback();
        return res.status(400).json({
          erro: 'A data final deve ser maior que a data inicial',
        });
      }

      const [usuario, vaga] = await Promise.all([
        Usuario.findByPk(usuario_id, { transaction }),
        Vaga.findByPk(vaga_id, { transaction }),
      ]);

      if (!usuario) {
        await transaction.rollback();
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      if (!vaga) {
        await transaction.rollback();
        return res.status(404).json({ erro: 'Vaga não encontrada' });
      }

      if (vaga.status === 'Ocupada') {
        await transaction.rollback();
        return res.status(400).json({ erro: 'A vaga está ocupada' });
      }

      const conflito = await Reserva.findOne({
        where: {
          vaga_id,
          status: { [Op.notIn]: ['cancelada', 'finalizada'] },
          data_inicio: { [Op.lt]: fim },
          data_fim: { [Op.gt]: inicio },
        },
        transaction,
      });

      if (conflito) {
        await transaction.rollback();
        return res.status(400).json({
          erro: 'A vaga já possui reserva nesse período',
        });
      }

      const reserva = await Reserva.create({
        usuario_id,
        vaga_id,
        data_inicio: inicio,
        data_fim: fim,
        status,
        valor_pago,
      }, { transaction });

      if (status === 'confirmada') {
        await vaga.update({ status: 'Reservada' }, { transaction });
      }

      await transaction.commit();
      return res.status(201).json(reserva);
    } catch (erro) {
      await transaction.rollback();
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao criar reserva',
        detalhe: erro.message,
      });
    }
  },

  async atualizar(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const reserva = await Reserva.findByPk(req.params.id, { transaction });
      if (!reserva) {
        await transaction.rollback();
        return res.status(404).json({ erro: 'Reserva não encontrada' });
      }

      const dados = {};
      const usuarioId = req.body.usuario_id ?? reserva.usuario_id;
      const vagaId = req.body.vaga_id ?? reserva.vaga_id;
      const inicio = new Date(req.body.data_inicio ?? reserva.data_inicio);
      const fim = new Date(req.body.data_fim ?? reserva.data_fim);
      const status = req.body.status ?? reserva.status;

      if (!STATUS_VALIDOS.includes(status)) {
        await transaction.rollback();
        return res.status(400).json({ erro: 'Status da reserva inválido' });
      }

      if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim <= inicio) {
        await transaction.rollback();
        return res.status(400).json({
          erro: 'Datas inválidas: data_fim deve ser maior que data_inicio',
        });
      }

      const [usuario, vaga] = await Promise.all([
        Usuario.findByPk(usuarioId, { transaction }),
        Vaga.findByPk(vagaId, { transaction }),
      ]);

      if (!usuario) {
        await transaction.rollback();
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }
      if (!vaga) {
        await transaction.rollback();
        return res.status(404).json({ erro: 'Vaga não encontrada' });
      }

      const conflito = await Reserva.findOne({
        where: {
          id: { [Op.ne]: reserva.id },
          vaga_id: vagaId,
          status: { [Op.notIn]: ['cancelada', 'finalizada'] },
          data_inicio: { [Op.lt]: fim },
          data_fim: { [Op.gt]: inicio },
        },
        transaction,
      });

      if (conflito) {
        await transaction.rollback();
        return res.status(400).json({
          erro: 'A vaga já possui reserva nesse período',
        });
      }

      dados.usuario_id = usuarioId;
      dados.vaga_id = vagaId;
      dados.data_inicio = inicio;
      dados.data_fim = fim;
      dados.status = status;

      if (req.body.valor_pago !== undefined) {
        dados.valor_pago = req.body.valor_pago;
      }

      const vagaAnteriorId = reserva.vaga_id;
      await reserva.update(dados, { transaction });

      if (status === 'confirmada') {
        if (vaga.status === 'Ocupada') {
          await transaction.rollback();
          return res.status(400).json({ erro: 'A vaga está ocupada' });
        }
        await vaga.update({ status: 'Reservada' }, { transaction });
      } else {
        await liberarVagaSeDisponivel(vagaId, transaction);
      }

      if (vagaAnteriorId !== vagaId) {
        await liberarVagaSeDisponivel(vagaAnteriorId, transaction);
      }

      await transaction.commit();
      return res.json(reserva);
    } catch (erro) {
      await transaction.rollback();
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao atualizar reserva',
        detalhe: erro.message,
      });
    }
  },

  async deletar(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const reserva = await Reserva.findByPk(req.params.id, { transaction });
      if (!reserva) {
        await transaction.rollback();
        return res.status(404).json({ erro: 'Reserva não encontrada' });
      }

      const vagaId = reserva.vaga_id;
      await reserva.destroy({ transaction });
      await liberarVagaSeDisponivel(vagaId, transaction);

      await transaction.commit();
      return res.json({ mensagem: 'Reserva deletada com sucesso' });
    } catch (erro) {
      await transaction.rollback();
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao deletar reserva',
        detalhe: erro.message,
      });
    }
  },
};
