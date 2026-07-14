require('dotenv').config();

const app = require('./src/app');
const sequelize = require('./src/config/database');

require('./src/models/Usuario');
require('./src/models/Veiculo');
require('./src/models/Vaga');
require('./src/models/Reserva');
require('./src/models/Estacionamento');
require('./src/models/PlanoMensal');

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    console.log('Banco conectado com sucesso!');

    // Cria tabelas ausentes, mas não fica alterando tabelas a cada inicialização.
    await sequelize.sync();
    console.log('Tabelas verificadas no banco de dados!');

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (erro) {
    console.error('Erro ao iniciar a API:', erro);
    process.exit(1);
  }
}

iniciarServidor();
