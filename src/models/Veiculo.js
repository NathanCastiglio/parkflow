const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Veiculo = sequelize.define('Veiculo', {
  placa: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  modelo: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  cor: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'veiculos',
  timestamps: false,
});

module.exports = Veiculo;
