const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlanoMensal = sequelize.define('PlanoMensal', {
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  veiculo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  data_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  data_fim: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 300,
  },
  status: {
    type: DataTypes.ENUM('ativo', 'expirado'),
    allowNull: false,
    defaultValue: 'ativo',
  },
}, {
  tableName: 'planos_mensais',
  timestamps: true,
});

module.exports = PlanoMensal;
