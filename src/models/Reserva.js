const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reserva = sequelize.define('Reserva', {
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  vaga_id: {
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
  status: {
    type: DataTypes.ENUM('pendente', 'confirmada', 'cancelada', 'finalizada'),
    allowNull: false,
    defaultValue: 'pendente',
  },
  valor_pago: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
}, {
  tableName: 'reservas',
  timestamps: false,
});

module.exports = Reserva;
