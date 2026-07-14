const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vaga = sequelize.define('Vaga', {
  numero: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  tipo: {
    type: DataTypes.ENUM('Comum', 'Premium', 'PCD', 'Idoso'),
    allowNull: false,
    defaultValue: 'Comum',
  },
  status: {
    type: DataTypes.ENUM('Livre', 'Ocupada', 'Reservada'),
    allowNull: false,
    defaultValue: 'Livre',
  },
}, {
  tableName: 'vagas',
  timestamps: true,
});

module.exports = Vaga;
