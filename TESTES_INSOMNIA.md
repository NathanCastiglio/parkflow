# Teste rápido da API ParkFlow

URL base:

```text
http://localhost:3000
```

## 1. Cadastrar usuário

**POST**

```text
/usuarios
```

```json
{
  "nome": "Nathan",
  "email": "nathan@gmail.com",
  "senha": "123456",
  "tipo": "cliente"
}
```

Guarde o `id` retornado.

---

## 2. Fazer login

**POST**

```text
/login
```

```json
{
  "email": "nathan@gmail.com",
  "senha": "123456"
}
```

Copie o token retornado.

Nas próximas requisições:

```text
Auth → Bearer Token
```

Cole somente o token.

---

# 3. Vagas

## Tipos de vaga permitidos

```text
Comum
Premium
PCD
Idoso
```

## Status permitidos

```text
Livre
Ocupada
Reservada
```

### Significado dos status

- `Livre`: disponível para uso.
- `Reservada`: possui uma reserva confirmada.
- `Ocupada`: existe um veículo estacionado nela.

Os valores devem ser escritos exatamente dessa forma, respeitando letras maiúsculas.

---

## Criar vaga comum

**POST**

```text
/vagas
```

```json
{
  "numero": "A01",
  "tipo": "Comum",
  "status": "Livre"
}
```

## Criar vaga premium

```json
{
  "numero": "P01",
  "tipo": "Premium",
  "status": "Livre"
}
```

## Criar vaga PCD

```json
{
  "numero": "PCD01",
  "tipo": "PCD",
  "status": "Livre"
}
```

## Criar vaga para idoso

```json
{
  "numero": "I01",
  "tipo": "Idoso",
  "status": "Livre"
}
```

O campo `numero` não pode ser repetido.

---

# 4. Criar veículo

**POST**

```text
/veiculos
```

```json
{
  "placa": "DEF4G56",
  "modelo": "Onix",
  "cor": "Branco",
  "usuario_id": 1
}
```

Troque `usuario_id` pelo ID retornado no cadastro.

A placa também não pode ser repetida.

---

# 5. Criar reserva

**POST**

```text
/reservas
```

```json
{
  "usuario_id": 1,
  "vaga_id": 1,
  "data_inicio": "2026-07-15T10:00:00-03:00",
  "data_fim": "2026-07-15T12:00:00-03:00",
  "status": "confirmada",
  "valor_pago": 20
}
```

Quando a reserva é confirmada, a vaga passa de:

```text
Livre → Reservada
```

Troque `usuario_id` e `vaga_id` pelos IDs reais.

---

# 6. Registrar estacionamento horista

O cliente paga conforme o número de horas.

Valor configurado:

```text
R$ 5 por hora
```

## Registrar entrada

**POST**

```text
/estacionamentos
```

```json
{
  "veiculo_id": 1,
  "vaga_id": 1,
  "data_entrada": "2026-07-15T10:00:00-03:00",
  "tipo_tarifa": "horista"
}
```

Na entrada:

```text
status do estacionamento: ativo
valor_total: 0
status da vaga: Ocupada
```

## Registrar saída

**PUT**

```text
/estacionamentos/1
```

```json
{
  "data_saida": "2026-07-15T12:00:00-03:00"
}
```

Exemplo do cálculo:

```text
2 horas × R$ 5 = R$ 10
```

Depois da saída:

```text
status do estacionamento: finalizado
status da vaga: Livre
```

---

# 7. Registrar estacionamento diarista

O cliente paga por dia.

Valor configurado:

```text
R$ 50 por dia
```

## Entrada de diarista

**POST**

```text
/estacionamentos
```

```json
{
  "veiculo_id": 1,
  "vaga_id": 1,
  "data_entrada": "2026-07-15T08:00:00-03:00",
  "tipo_tarifa": "diarista"
}
```

## Saída de diarista

**PUT**

```text
/estacionamentos/1
```

```json
{
  "data_saida": "2026-07-15T18:00:00-03:00"
}
```

Exemplo:

```text
1 diária = R$ 50
```

Caso o veículo permaneça por mais de um dia, o sistema calcula a quantidade de diárias conforme a lógica configurada no controller.

---

# 8. Registrar estacionamento mensalista

O mensalista já possui um plano mensal, por isso a saída não gera cobrança adicional.

## Entrada de mensalista

**POST**

```text
/estacionamentos
```

```json
{
  "veiculo_id": 1,
  "vaga_id": 1,
  "data_entrada": "2026-07-15T08:00:00-03:00",
  "tipo_tarifa": "mensalista"
}
```

## Saída de mensalista

**PUT**

```text
/estacionamentos/1
```

```json
{
  "data_saida": "2026-07-15T18:00:00-03:00"
}
```

Resultado esperado:

```text
valor_total: 0
```

Isso acontece porque o pagamento é feito por meio do plano mensal, e não em cada saída.

---

# 9. Resumo das tarifas

| Tipo de tarifa | Cobrança |
|---|---:|
| `horista` | R$ 5 por hora |
| `diarista` | R$ 50 por dia |
| `mensalista` | R$ 0 na saída |

Os valores devem ser enviados em letras minúsculas:

```text
horista
diarista
mensalista
```

---

# 10. Resumo dos tipos de vaga

| Tipo | Utilização |
|---|---|
| `Comum` | Vaga padrão |
| `Premium` | Vaga diferenciada ou reservada para clientes premium |
| `PCD` | Pessoa com deficiência |
| `Idoso` | Pessoa idosa |

---

# 11. Resumo dos status da vaga

| Status | Significado |
|---|---|
| `Livre` | Pode receber veículo ou reserva |
| `Reservada` | Existe uma reserva confirmada |
| `Ocupada` | Existe um veículo estacionado |

Fluxo normal:

```text
Livre → Reservada → Ocupada → Livre
```

Também pode acontecer:

```text
Livre → Ocupada → Livre
```

quando não existe reserva prévia.

---

# 12. Exemplos de GET

```text
GET /usuarios
GET /veiculos
GET /vagas
GET /reservas
GET /estacionamentos
```

Buscar um registro específico:

```text
GET /usuarios/1
GET /veiculos/1
GET /vagas/1
GET /reservas/1
GET /estacionamentos/1
```

---

# 13. Exemplo de atualização de veículo

**PUT**

```text
/veiculos/1
```

```json
{
  "modelo": "Onix Plus",
  "cor": "Preto"
}
```

---

# 14. Exemplo de exclusão

**DELETE**

```text
/vagas/2
```

Resposta esperada:

```json
{
  "mensagem": "Vaga deletada com sucesso"
}
```

Registros vinculados a outros dados podem não ser excluídos por causa das chaves estrangeiras.

---

# 15. Testes de segurança e validação

## Acesso sem token

Faça:

```text
GET /veiculos
```

sem Bearer Token.

Resposta esperada:

```json
{
  "erro": "Token não informado"
}
```

## Placa duplicada

Tente cadastrar novamente uma placa existente.

Resposta esperada:

```json
{
  "erro": "Já existe um veículo cadastrado com essa placa."
}
```

## Número de vaga duplicado

Tente cadastrar novamente uma vaga como `A01`.

A API deve impedir porque o número da vaga é único.

---

# Roteiro curto para falar na apresentação

> Primeiro realizo o cadastro do usuário. A senha é criptografada com bcrypt. Depois faço o login, que gera um token JWT. Esse token é utilizado nas rotas protegidas. Em seguida, cadastro uma vaga e um veículo. A vaga pode ser Comum, Premium, PCD ou Idoso e pode estar Livre, Reservada ou Ocupada. Depois realizo uma reserva, que altera a vaga para Reservada. Ao registrar a entrada do veículo, a vaga fica Ocupada. Na saída, o sistema calcula o valor conforme a tarifa horista, diarista ou mensalista e libera novamente a vaga.