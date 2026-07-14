# ParkFlow API

API desenvolvida para o gerenciamento de estacionamentos. O sistema permite controlar vagas, veículos, usuários e realizar reservas ou registros de entrada e saída.

## Funcionalidades
- Cadastro de Usuários
- Gestão de Veículos
- Controle de Vagas (Comum, Premium, PCD, Idoso)
- Sistema de Reservas
- Registro de Estacionamento (Check-in/Check-out com cálculo de valor)

## Tecnologias
- Node.js
- Express
- Sequelize (ORM)
- MySQL

## Como rodar
1. Clone este repositório.
2. Instale as dependências: `npm install`
3. Configure o arquivo `.env` com suas credenciais do banco de dados.
4. Inicie o servidor: `npm run dev`