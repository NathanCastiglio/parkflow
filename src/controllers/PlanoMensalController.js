const { Op } = require('sequelize');
const PlanoMensal = require('../models/PlanoMensal');
const Usuario = require('../models/Usuario');
const Veiculo = require('../models/Veiculo');

function inclusoes() {
  return [
    {
      model: Usuario,
      attributes: ['id', 'nome', 'email', 'tipo'],
    },
    {
      model: Veiculo,
      attributes: ['id', 'placa', 'modelo', 'cor'],
    },
  ];
}

module.exports = {
  async criar(req, res) {
    try {
      const { usuario_id, veiculo_id } = req.body;

      if (!usuario_id || !veiculo_id) {
        return res.status(400).json({
          erro: 'usuario_id e veiculo_id são obrigatórios',
        });
      }

      const [usuario, veiculo] = await Promise.all([
        Usuario.findByPk(usuario_id),
        Veiculo.findByPk(veiculo_id),
      ]);

      if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }
      if (!veiculo) {
        return res.status(404).json({ erro: 'Veículo não encontrado' });
      }
      if (Number(veiculo.usuario_id) !== Number(usuario_id)) {
        return res.status(400).json({
          erro: 'O veículo não pertence ao usuário informado',
        });
      }

      const planoAtivo = await PlanoMensal.findOne({
        where: {
          veiculo_id,
          status: 'ativo',
          data_fim: { [Op.gte]: new Date() },
        },
      });

      if (planoAtivo) {
        return res.status(400).json({
          erro: 'O veículo já possui plano mensal ativo',
        });
      }

      const inicio = new Date();
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + 30);

      const plano = await PlanoMensal.create({
        usuario_id,
        veiculo_id,
        data_inicio: inicio,
        data_fim: fim,
        valor: 300,
        status: 'ativo',
      });

      return res.status(201).json({
        mensagem: 'Plano mensal criado com sucesso',
        plano,
      });
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao criar plano',
        detalhe: erro.message,
      });
    }
  },

  async listar(req, res) {
    try {
      const planos = await PlanoMensal.findAll({ include: inclusoes() });
      return res.json(planos);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao listar planos',
        detalhe: erro.message,
      });
    }
  },

  async buscarPorId(req, res) {
    try {
      const plano = await PlanoMensal.findByPk(req.params.id, {
        include: inclusoes(),
      });

      if (!plano) {
        return res.status(404).json({ erro: 'Plano mensal não encontrado' });
      }

      return res.json(plano);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ erro: 'Erro ao buscar plano mensal' });
    }
  },

  async atualizar(req, res) {
    try {
      const plano = await PlanoMensal.findByPk(req.params.id);
      if (!plano) {
        return res.status(404).json({ erro: 'Plano mensal não encontrado' });
      }

      const { data_fim, valor, status } = req.body;
      const dados = {};

      if (data_fim !== undefined) {
        const fim = new Date(data_fim);
        if (Number.isNaN(fim.getTime()) || fim <= new Date(plano.data_inicio)) {
          return res.status(400).json({ erro: 'data_fim inválida' });
        }
        dados.data_fim = fim;
      }

      if (valor !== undefined) {
        if (Number(valor) < 0) {
          return res.status(400).json({ erro: 'Valor não pode ser negativo' });
        }
        dados.valor = valor;
      }

      if (status !== undefined) {
        if (!['ativo', 'expirado'].includes(status)) {
          return res.status(400).json({ erro: 'Status inválido' });
        }
        dados.status = status;
      }

      if (Object.keys(dados).length === 0) {
        return res.status(400).json({ erro: 'Nenhum campo enviado' });
      }

      await plano.update(dados);
      return res.json(plano);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ erro: 'Erro ao atualizar plano mensal' });
    }
  },

  async deletar(req, res) {
    try {
      const plano = await PlanoMensal.findByPk(req.params.id);
      if (!plano) {
        return res.status(404).json({ erro: 'Plano mensal não encontrado' });
      }

      await plano.destroy();
      return res.json({ mensagem: 'Plano mensal deletado com sucesso' });
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ erro: 'Erro ao deletar plano mensal' });
    }
  },
};
