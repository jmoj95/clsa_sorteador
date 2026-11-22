# CLSA Sorteador

CLSA significa **Clube de Literatura Santo Agostinho**.
O cabeçalho apresenta o monograma de **Ave Maria**, CLSA e uma cruz.

Aplicativo web em React para sortear candidatos a partir de uma lista em um arquivo de texto.

## Funcionalidades

- Lista os candidatos carregados de `input.txt`.
- Atualiza a lista automaticamente quando o arquivo é alterado.
- Permite adicionar e remover candidatos pela interface.
- Permite limpar toda a lista de candidatos para iniciar um novo sorteio.
- Executa `shuffler.js` para embaralhar os candidatos.
- Exibe o vencedor, o segundo e o terceiro lugares.
- Lista os demais candidatos na ordem sorteada.
- Apresenta uma animação de sorteio antes da revelação dos resultados.

## Tecnologias

- React
- Vite
- Express
- Node.js

## Como executar

Pré-requisitos:

- Node.js instalado

Instale as dependências:

```bash
npm install
```

Inicie o aplicativo:

```bash
npm run dev
```

Abra no navegador:

```text
http://localhost:5173
```

## Arquivos principais

- `input.txt`: lista de candidatos, um nome por linha. É criada automaticamente se não existir.
- `output.txt`: resultado embaralhado produzido pelo sorteio. É criado automaticamente.
- `input.example.txt`: exemplo da lista de candidatos para novos ambientes.
- `shuffler.js`: script Node.js responsável por embaralhar a lista.
- `server.js`: inicialização do servidor Express.
- `server/fileStore.js`: leitura e escrita dos arquivos de candidatos.
- `server/routes/`: rotas da API de candidatos e sorteio.
- `src/App.jsx`: composição principal da interface React.
- `src/components/`: componentes visuais da aplicação.
- `src/hooks/`: estado de candidatos e animação do sorteio.
- `src/services/`: comunicação do frontend com a API.
- `test/`: testes automatizados da lógica de sorteio.
- `src/styles.css`: estilos da aplicação.

## Login e convites

Configure emails autorizados pelo ambiente:

```text
ADMIN_EMAILS=admin@example.com,owner@example.com
```

Os usuários fazem login por magic link enviado ao email. Para SMTP real, configure:

```text
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario
SMTP_PASS=senha
SMTP_FROM=CLSA Sorteador <usuario@exemplo.com>
APP_URL=https://seu-dominio.exemplo
```

Sem configuração SMTP, o ambiente local retorna um link de desenvolvimento diretamente na resposta da API.

### Gmail OAuth2

Também é possível enviar magic links pelo Gmail sem senha SMTP:

1. Configure `GOOGLE_CLIENT_SECRET_FILE` apontando para o JSON OAuth do Google.
2. Configure `GMAIL_USER` e `GMAIL_FROM`.
3. Adicione `http://localhost:5173/api/auth/gmail/callback` como URI autorizada no cliente OAuth durante o desenvolvimento.
4. Entre com um criador autorizado e use **Conectar Gmail** no modal da conta.
5. Autorize a conta; o refresh token será salvo em `data/gmail-token.json`, que é ignorado pelo Git.

Antes de publicar em produção, crie as variáveis SMTP e `APP_URL` no provedor de hospedagem. Use [`.env.example`](/D:/Projects/clsa_sorteador/.env.example) como referência e não envie credenciais ao repositório.

## Testes

Execute os testes do embaralhamento com:

```bash
npm test
```

## Como funciona o sorteio

1. A aplicação lê os nomes de `input.txt`.
2. Os nomes podem ser adicionados ou removidos pela interface.
3. Ao clicar em **Realizar sorteio**, o frontend chama `shuffler.js`.
4. O script embaralha os nomes e grava o resultado em `output.txt`.
5. O frontend lê o resultado e exibe o pódio e as demais posições.

O primeiro nome exibido no resultado é o vencedor, o segundo é o vice-campeão e o terceiro ocupa a terceira colocação.
