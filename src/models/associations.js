const Usuario = require('./Usuario');
const Veiculo = require('./Veiculo');
const Vaga = require('./Vaga');
const Reserva = require('./Reserva');
const Estacionamento = require('./Estacionamento');
const PlanoMensal = require('./PlanoMensal');

Usuario.hasMany(Veiculo, { foreignKey: 'usuario_id' });
Veiculo.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Usuario.hasMany(Reserva, { foreignKey: 'usuario_id' });
Reserva.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Vaga.hasMany(Reserva, { foreignKey: 'vaga_id' });
Reserva.belongsTo(Vaga, { foreignKey: 'vaga_id' });

Veiculo.hasMany(Estacionamento, { foreignKey: 'veiculo_id' });
Estacionamento.belongsTo(Veiculo, { foreignKey: 'veiculo_id' });

Vaga.hasMany(Estacionamento, { foreignKey: 'vaga_id' });
Estacionamento.belongsTo(Vaga, { foreignKey: 'vaga_id' });

Usuario.hasMany(PlanoMensal, { foreignKey: 'usuario_id' });
PlanoMensal.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Veiculo.hasMany(PlanoMensal, { foreignKey: 'veiculo_id' });
PlanoMensal.belongsTo(Veiculo, { foreignKey: 'veiculo_id' });
