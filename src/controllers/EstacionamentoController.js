const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Estacionamento = require('../models/Estacionamento');
const Vaga = require('../models/Vaga');
const Veiculo = require('../models/Veiculo');
const Usuario = require('../models/Usuario');
const PlanoMensal = require('../models/PlanoMensal');
const Reserva = require('../models/Reserva');

const TARIFAS = ['horista', 'diarista', 'mensalista'];

function inclusoes() {
  return [
    {
      model: Veiculo,
      attributes: ['id', 'placa', 'modelo', 'cor'],
      include: [{
        model: Usuario,
        attributes: ['id', 'nome', 'email', 'tipo'],
      }],
    },
    {
      model: Vaga,
      attributes: ['id', 'numero', 'tipo', 'status'],
    },
  ];
}

async function definirStatusVagaDepoisDaSaida(vagaId, transaction) {
  const reservaFutura = await Reserva.findOne({
    where: {
      vaga_id: vagaId,
      status: 'confirmada',
      data_fim: { [Op.gt]: new Date() },
    },
    transaction,
  });

  await Vaga.update(
    { status: reservaFutura ? 'Reservada' : 'Livre' },
    { where: { id: vagaId }, transaction }
  );
}

module.exports = {
  async listar(req, res) {
    try {
      const estacionamentos = await Estacionamento.findAll({
        include: inclusoes(),
      });
      return res.json(estacionamentos);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao listar estacionamentos',
        detalhe: erro.message,
      });
    }
  },

  async buscarPorId(req, res) {
    try {
      const estacionamento = await Estacionamento.findByPk(req.params.id, {
        include: inclusoes(),
      });

      if (!estacionamento) {
        return res.status(404).json({
          erro: 'Estacionamento não encontrado',
        });
      }

      return res.json(estacionamento);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao buscar estacionamento',
        detalhe: erro.message,
      });
    }
  },

  async criar(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { veiculo_id, vaga_id, data_entrada, tipo_tarifa } = req.body;

      if (!veiculo_id || !vaga_id || !data_entrada || !tipo_tarifa) {
        await transaction.rollback();
        return res.status(400).json({
          erro: 'veiculo_id, vaga_id, data_entrada e tipo_tarifa são obrigatórios',
        });
      }

      if (!TARIFAS.includes(tipo_tarifa)) {
        await transaction.rollback();
        return res.status(400).json({ erro: 'Tipo de tarifa inválido' });
      }

      const entrada = new Date(data_entrada);
      if (Number.isNaN(entrada.getTime())) {
        await transaction.rollback();
        return res.status(400).json({ erro: 'Data de entrada inválida' });
      }

      const [veiculo, vaga] = await Promise.all([
        Veiculo.findByPk(veiculo_id, { transaction }),
        Vaga.findByPk(vaga_id, { transaction }),
      ]);

      if (!veiculo) {
        await transaction.rollback();
        return res.status(404).json({ erro: 'Veículo não encontrado' });
      }
      if (!vaga) {
        await transaction.rollback();
        return res.status(404).json({ erro: 'Vaga não encontrada' });
      }

      const estacionamentoDoVeiculo = await Estacionamento.findOne({
        where: { veiculo_id, status: 'ativo' },
        transaction,
      });

      if (estacionamentoDoVeiculo) {
        await transaction.rollback();
        return res.status(400).json({
          erro: 'Esse veículo já possui um estacionamento ativo',
        });
      }

      if (vaga.status === 'Ocupada') {
        await transaction.rollback();
        return res.status(400).json({ erro: 'Essa vaga já está ocupada' });
      }

      let reservaUtilizada = null;
      if (vaga.status === 'Reservada') {
        reservaUtilizada = await Reserva.findOne({
          where: {
            usuario_id: veiculo.usuario_id,
            vaga_id,
            status: 'confirmada',
            data_inicio: { [Op.lte]: entrada },
            data_fim: { [Op.gte]: entrada },
          },
          transaction,
        });

        if (!reservaUtilizada) {
          await transaction.rollback();
          return res.status(400).json({
            erro: 'A vaga está reservada para outro usuário ou período',
          });
        }
      }

      if (tipo_tarifa === 'mensalista') {
        const plano = await PlanoMensal.findOne({
          where: {
            veiculo_id,
            status: 'ativo',
            data_inicio: { [Op.lte]: entrada },
            data_fim: { [Op.gte]: entrada },
          },
          transaction,
        });

        if (!plano) {
          await transaction.rollback();
          return res.status(400).json({
            erro: 'Veículo não possui plano mensal ativo nessa data',
          });
        }
      }

      const estacionamento = await Estacionamento.create({
        veiculo_id,
        vaga_id,
        data_entrada: entrada,
        tipo_tarifa,
        status: 'ativo',
        valor_total: 0,
      }, { transaction });

      await vaga.update({ status: 'Ocupada' }, { transaction });

      if (reservaUtilizada) {
        await reservaUtilizada.update({ status: 'finalizada' }, { transaction });
      }

      await transaction.commit();
      return res.status(201).json({
        mensagem: 'Entrada registrada com sucesso',
        estacionamento,
      });
    } catch (erro) {
      await transaction.rollback();
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao criar estacionamento',
        detalhe: erro.message,
      });
    }
  },

  async atualizar(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const estacionamento = await Estacionamento.findByPk(req.params.id, {
        transaction,
      });

      if (!estacionamento) {
        await transaction.rollback();
        return res.status(404).json({
          erro: 'Estacionamento não encontrado',
        });
      }

      if (!req.body.data_saida) {
        await transaction.rollback();
        return res.status(400).json({
          erro: 'Informe data_saida para finalizar o estacionamento',
        });
      }

      if (estacionamento.status === 'finalizado') {
        await transaction.rollback();
        return res.status(400).json({
          erro: 'Esse estacionamento já foi finalizado',
        });
      }

      const entrada = new Date(estacionamento.data_entrada);
      const saida = new Date(req.body.data_saida);

      if (Number.isNaN(saida.getTime()) || saida <= entrada) {
        await transaction.rollback();
        return res.status(400).json({
          erro: 'data_saida deve ser válida e posterior à data_entrada',
        });
      }

      const milissegundos = saida - entrada;
      let valorTotal = 0;

      if (estacionamento.tipo_tarifa === 'horista') {
        const horas = Math.max(1, Math.ceil(milissegundos / (1000 * 60 * 60)));
        valorTotal = horas * 5;
      } else if (estacionamento.tipo_tarifa === 'diarista') {
        const dias = Math.max(1, Math.ceil(milissegundos / (1000 * 60 * 60 * 24)));
        valorTotal = dias * 50;
      }

      await estacionamento.update({
        data_saida: saida,
        valor_total: valorTotal,
        status: 'finalizado',
      }, { transaction });

      await definirStatusVagaDepoisDaSaida(
        estacionamento.vaga_id,
        transaction
      );

      await transaction.commit();
      return res.json({
        mensagem: 'Saída registrada com sucesso',
        estacionamento,
      });
    } catch (erro) {
      await transaction.rollback();
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao atualizar estacionamento',
        detalhe: erro.message,
      });
    }
  },

  async deletar(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const estacionamento = await Estacionamento.findByPk(req.params.id, {
        transaction,
      });

      if (!estacionamento) {
        await transaction.rollback();
        return res.status(404).json({
          erro: 'Estacionamento não encontrado',
        });
      }

      const vagaId = estacionamento.vaga_id;
      await estacionamento.destroy({ transaction });
      await definirStatusVagaDepoisDaSaida(vagaId, transaction);

      await transaction.commit();
      return res.json({
        mensagem: 'Estacionamento deletado e vaga atualizada',
      });
    } catch (erro) {
      await transaction.rollback();
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao deletar estacionamento',
        detalhe: erro.message,
      });
    }
  },
};
