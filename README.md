# ZappointBot

## Executando a API com Docker

1. Acesse o diretório `ZapAgenda-api-aspnet-main`.
2. Execute `docker compose up -d` para iniciar a API e o banco MySQL.
3. A API estará disponível em `http://localhost:8080`.

O serviço de banco de dados é inicializado antes da API, evitando erros de conexão.
