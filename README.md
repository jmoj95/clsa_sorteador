# CLSA Sorteador

CLSA significa **Clube de Literatura Santo Agostinho**.
O cabeçalho apresenta o monograma de **Ave Maria**, CLSA e uma cruz.

Aplicativo web em React para sortear candidatos a partir de uma lista em um arquivo de texto.

## Funcionalidades

- Lista os candidatos carregados de `input.txt`.
- Atualiza a lista automaticamente quando o arquivo é alterado.
- Permite adicionar e remover candidatos pela interface.
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
- `server.js`: API Express usada pelo frontend.
- `src/main.jsx`: interface React.
- `src/styles.css`: estilos da aplicação.

## Como funciona o sorteio

1. A aplicação lê os nomes de `input.txt`.
2. Os nomes podem ser adicionados ou removidos pela interface.
3. Ao clicar em **Realizar sorteio**, o frontend chama `shuffler.js`.
4. O script embaralha os nomes e grava o resultado em `output.txt`.
5. O frontend lê o resultado e exibe o pódio e as demais posições.

O primeiro nome exibido no resultado é o vencedor, o segundo é o vice-campeão e o terceiro ocupa a terceira colocação.
