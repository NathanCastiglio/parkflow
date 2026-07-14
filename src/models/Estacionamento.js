const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Estacionamento = sequelize.define('Estacionamento', {
  veiculo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  vaga_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  data_entrada: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  data_saida: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  valor_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  tipo_tarifa: {
    type: DataTypes.ENUM('horista', 'diarista', 'mensalista'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('ativo', 'finalizado'),
    allowNull: false,
    defaultValue: 'ativo',
  },
}, {
  tableName: 'estacionamentos',
  timestamps: false,
});

module.exports = Estacionamento;
