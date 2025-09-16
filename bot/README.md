# Zappoint WhatsApp Bot

Bot de WhatsApp utilizando [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) para realizar agendamentos.

## Requisitos
- Node.js 18+
- Dependências definidas em `package.json`
- Backend disponível e acessível via variável de ambiente `API_BASE_URL`

## Configuração
1. Atualize o número autorizado em `config.js` (somente dígitos, formato internacional).
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Defina a URL do backend, se necessário:
   ```bash
   export API_BASE_URL="http://localhost:3000"
   ```
4. Caso o backend exija segmentação por empresa na rota, defina a variável `EMPRESA_ID` com o identificador utilizado na API (por exemplo, o GUID da empresa):
   ```bash
   export EMPRESA_ID="00000000-0000-0000-0000-000000000000"
   ```

## Uso
1. Inicie o bot:
   ```bash
   npm start
   ```
2. Escaneie o QR Code exibido no terminal com o WhatsApp usando o número autorizado.

O bot ignora mensagens de grupos e responde apenas ao número configurado.

O fluxo de conversas cobre cadastro, agendamento, confirmação, cancelamento e listagem de agendamentos.
