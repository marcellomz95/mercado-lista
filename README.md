# Lista de Compras

Crie um aplicativo web responsivo chamado "Minha Lista de Compras".

Objetivo:

Controlar compras e orçamento de forma simples e intuitiva.

Layout:

No topo da página criar uma barra fixa (dashboard) contendo:

1. Saldo Inicial (valor informado pelo usuário)

2. Valor Total das Compras

3. Saldo Restante

Fórmulas:

- Valor Total das Compras = soma dos valores totais de todos os produtos.

- Saldo Restante = Saldo Inicial - Valor Total das Compras.

Destacar:

- Saldo Restante em verde quando positivo.

- Saldo Restante em vermelho quando negativo.

Funcionalidades:

Cadastro de Produtos:

Campos:

- Nome do Produto

- Quantidade

- Preço Unitário

- Preço Total (calculado automaticamente)

Fórmula:

Preço Total = Quantidade × Preço Unitário

Tabela de Produtos:

Colunas:

- Produto

- Quantidade

- Preço Unitário

- Preço Total

- Editar

- Excluir

Recursos:

- Adicionar produto.

- Editar produto.

- Excluir produto.

- Pesquisar produto.

- Ordenar produtos por nome ou valor.

Resumo Financeiro:

- Quantidade total de itens.

- Valor total acumulado.

- Saldo restante.

Persistência:

- Salvar automaticamente os dados no navegador (Local Storage).

- Ao reabrir o aplicativo os dados devem permanecer salvos.

Design:

- Visual moderno e minimalista.

-

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mercado-lista.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/120b516d-d709-4d23-8895-77d556569760).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
