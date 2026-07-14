const Vaga = require('../models/Vaga');
const Reserva = require('../models/Reserva');
const Estacionamento = require('../models/Estacionamento');

const TIPOS = ['Comum', 'Premium', 'PCD', 'Idoso'];
const STATUS = ['Livre', 'Ocupada', 'Reservada'];

module.exports = {
  async listar(req, res) {
    try {
      const vagas = await Vaga.findAll();
      return res.json(vagas);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ erro: 'Erro ao listar vagas' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const vaga = await Vaga.findByPk(req.params.id);
      if (!vaga) {
        return res.status(404).json({ erro: 'Vaga não encontrada' });
      }
      return res.json(vaga);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ erro: 'Erro ao buscar vaga' });
    }
  },

  async criar(req, res) {
    try {
      const { numero, tipo = 'Comum', status = 'Livre' } = req.body;

      if (!numero) {
        return res.status(400).json({ erro: 'Número da vaga é obrigatório' });
      }
      if (!TIPOS.includes(tipo)) {
        return res.status(400).json({ erro: 'Tipo de vaga inválido' });
      }
      if (!STATUS.includes(status)) {
        return res.status(400).json({ erro: 'Status da vaga inválido' });
      }

      const vaga = await Vaga.create({
        numero: String(numero).trim().toUpperCase(),
        tipo,
        status,
      });

      return res.status(201).json(vaga);
    } catch (erro) {
      console.error(erro);

      if (erro.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          erro: 'Já existe uma vaga com esse número',
        });
      }

      return res.status(500).json({
        erro: 'Erro ao criar vaga',
        detalhe: erro.message,
      });
    }
  },

  async atualizar(req, res) {
    try {
      const vaga = await Vaga.findByPk(req.params.id);
      if (!vaga) {
        return res.status(404).json({ erro: 'Vaga não encontrada' });
      }

      const { numero, tipo, status } = req.body;
      const dados = {};

      if (numero !== undefined) dados.numero = String(numero).trim().toUpperCase();
      if (tipo !== undefined) {
        if (!TIPOS.includes(tipo)) {
          return res.status(400).json({ erro: 'Tipo de vaga inválido' });
        }
        dados.tipo = tipo;
      }
      if (status !== undefined) {
        if (!STATUS.includes(status)) {
          return res.status(400).json({ erro: 'Status da vaga inválido' });
        }
        dados.status = status;
      }

      if (Object.keys(dados).length === 0) {
        return res.status(400).json({ erro: 'Nenhum campo enviado' });
      }

      await vaga.update(dados);
      return res.json(vaga);
    } catch (erro) {
      console.error(erro);

      if (erro.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          erro: 'Já existe uma vaga com esse número',
        });
      }

      return res.status(500).json({ erro: 'Erro ao atualizar vaga' });
    }
  },

  async deletar(req, res) {
    try {
      const vaga = await Vaga.findByPk(req.params.id);
      if (!vaga) {
        return res.status(404).json({ erro: 'Vaga não encontrada' });
      }

      const reservaVinculada = await Reserva.findOne({
        where: { vaga_id: vaga.id },
      });
      const estacionamentoVinculado = await Estacionamento.findOne({
        where: { vaga_id: vaga.id },
      });

      if (reservaVinculada || estacionamentoVinculado) {
        return res.status(400).json({
          erro: 'Não é possível excluir a vaga porque ela possui registros vinculados',
        });
      }

      await vaga.destroy();
      return res.json({ mensagem: 'Vaga deletada com sucesso' });
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ erro: 'Erro ao deletar vaga' });
    }
  },
};
