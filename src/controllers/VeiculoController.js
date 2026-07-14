const { Op } = require('sequelize');
const Veiculo = require('../models/Veiculo');
const Usuario = require('../models/Usuario');
const Estacionamento = require('../models/Estacionamento');
const PlanoMensal = require('../models/PlanoMensal');

function normalizarPlaca(placa) {
  return String(placa).trim().toUpperCase().replace(/\s/g, '');
}

module.exports = {
  async listar(req, res) {
    try {
      const veiculos = await Veiculo.findAll({
        include: [{
          model: Usuario,
          attributes: ['id', 'nome', 'email', 'tipo'],
        }],
      });

      return res.json(veiculos);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao listar veículos',
        detalhe: erro.message,
      });
    }
  },

  async buscarPorId(req, res) {
    try {
      const veiculo = await Veiculo.findByPk(req.params.id, {
        include: [{
          model: Usuario,
          attributes: ['id', 'nome', 'email', 'tipo'],
        }],
      });

      if (!veiculo) {
        return res.status(404).json({ erro: 'Veículo não encontrado' });
      }

      return res.json(veiculo);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao buscar veículo',
        detalhe: erro.message,
      });
    }
  },

  async criar(req, res) {
    try {
      const { placa, modelo, cor, usuario_id } = req.body;

      if (!placa || !modelo || !cor || !usuario_id) {
        return res.status(400).json({
          erro: 'Placa, modelo, cor e usuario_id são obrigatórios',
        });
      }

      const usuario = await Usuario.findByPk(usuario_id);
      if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      const placaNormalizada = normalizarPlaca(placa);
      const placaExistente = await Veiculo.findOne({
        where: { placa: placaNormalizada },
      });

      if (placaExistente) {
        return res.status(400).json({
          erro: 'Já existe um veículo cadastrado com essa placa',
        });
      }

      const veiculo = await Veiculo.create({
        placa: placaNormalizada,
        modelo: String(modelo).trim(),
        cor: String(cor).trim(),
        usuario_id,
      });

      return res.status(201).json(veiculo);
    } catch (erro) {
      console.error(erro);

      if (erro.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          erro: 'Já existe um veículo cadastrado com essa placa',
        });
      }

      if (erro.name === 'SequelizeValidationError') {
        return res.status(400).json({
          erro: 'Erro de validação',
          detalhes: erro.errors.map((item) => ({
            campo: item.path,
            mensagem: item.message,
          })),
        });
      }

      return res.status(500).json({
        erro: 'Erro ao criar veículo',
        detalhe: erro.message,
      });
    }
  },

  async atualizar(req, res) {
    try {
      const veiculo = await Veiculo.findByPk(req.params.id);
      if (!veiculo) {
        return res.status(404).json({ erro: 'Veículo não encontrado' });
      }

      const { placa, modelo, cor, usuario_id } = req.body;
      const dados = {};

      if (placa !== undefined) {
        const placaNormalizada = normalizarPlaca(placa);
        const placaEmUso = await Veiculo.findOne({
          where: {
            placa: placaNormalizada,
            id: { [Op.ne]: veiculo.id },
          },
        });

        if (placaEmUso) {
          return res.status(400).json({
            erro: 'Já existe um veículo com essa placa',
          });
        }
        dados.placa = placaNormalizada;
      }

      if (modelo !== undefined) dados.modelo = String(modelo).trim();
      if (cor !== undefined) dados.cor = String(cor).trim();

      if (usuario_id !== undefined) {
        const usuario = await Usuario.findByPk(usuario_id);
        if (!usuario) {
          return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        dados.usuario_id = usuario_id;
      }

      if (Object.keys(dados).length === 0) {
        return res.status(400).json({ erro: 'Nenhum campo enviado' });
      }

      await veiculo.update(dados);
      return res.json(veiculo);
    } catch (erro) {
      console.error(erro);

      if (erro.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          erro: 'Já existe um veículo com essa placa',
        });
      }

      return res.status(500).json({
        erro: 'Erro ao atualizar veículo',
        detalhe: erro.message,
      });
    }
  },

  async deletar(req, res) {
    try {
      const veiculo = await Veiculo.findByPk(req.params.id);
      if (!veiculo) {
        return res.status(404).json({ erro: 'Veículo não encontrado' });
      }

      const estacionamentoVinculado = await Estacionamento.findOne({
        where: { veiculo_id: veiculo.id },
      });
      const planoVinculado = await PlanoMensal.findOne({
        where: { veiculo_id: veiculo.id },
      });

      if (estacionamentoVinculado || planoVinculado) {
        return res.status(400).json({
          erro: 'Não é possível excluir o veículo porque ele possui estacionamento ou plano mensal vinculado',
        });
      }

      await veiculo.destroy();
      return res.json({ mensagem: 'Veículo deletado com sucesso' });
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ erro: 'Erro ao deletar veículo' });
    }
  },
};
