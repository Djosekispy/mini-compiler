# Lógica dos Componentes Web em Português

Este documento explica como a funcionalidade de criar websites a partir de códigos em Português foi implementada no compilador SeteAO.

## 1. Gramática e Sintaxe
A sintaxe foi inspirada no JSX (React), mas adaptada para o Português e integrada diretamente na linguagem imperativa do compilador.

Exemplo:
```sa
VAR corFundo = "vermelho" : TEXTO.
VAR mensagem = "Olá Mundo" : TEXTO.

<bloco propriedades={
    fundo: corFundo,
    largura: "400px",
    altura: "200px",
    borda: "5px solid preto",
    padding: "20px"
}>
    <titulo propriedades={cor: "branco"}>"Sucesso!"</titulo>
    <texto propriedades={cor: "branco"}>{mensagem}</texto>
    <botao> "Clique em mim" </botao>
</bloco>
```

## 2. Lógica do Lexer (Análise Léxica)
O Lexer identifica os símbolos básicos:
- `<` (`MENOR_QUE`) e `>` (`MAIOR_QUE`): Delimitadores de tags.
- `/` (`BARRA`): Usado para tags de fechamento `</` ou auto-fechamento `/>`.
- `++` e `--`: Operadores de incremento e decremento.
- `+=` e `-=`: Atribuição abreviada.
- `[` e `]`: Delimitadores de listas (Vetores).
- `propriedades`: Uma palavra-chave que indica o início dos atributos do componente.

## 3. Lógica do Parser (Análise Sintática)
O Parser foi estendido com novos métodos:
- `parseTag()`: Identifica o nome da tag, processa o bloco opcional de `propriedades` e percorre recursivamente o conteúdo interno.
- **Interpolação `{ }`**: Dentro de uma tag, se o Parser encontrar `{`, ele ativa o modo de interpolação.
- `parseListLiteral()`: Processa literais de lista como `[1, 2, "texto"]`.
- **Acesso por Índice**: O fator do Parser foi atualizado para reconhecer `id[indice]` de forma recursiva.

As tags são convertidas em um novo tipo de nó na AST: `WebTag`.

## 4. Analisador Semântico e Geração de HTML
No `SemanticAnalyzer.ts`, adicionamos a lógica para converter nós `WebTag` em strings HTML Reais:
- **Mapeamento de Tags**:
    - `bloco` -> `div` (com estilos padrão de bloco).
    - `texto` -> `p`.
    - `botao` -> `button`.
    - `imagem` -> `img`.
    - `titulo` -> `h1`.
- **Mapeamento de Propriedades**:
    - `cor` -> `color`.
    - `fundo` -> `background-color` (com tradução automática de nomes como "vermelho" para "red").
    - `largura`, `altura`, `borda`, `margem`, `padding` -> Mapeados diretamente para estilos CSS.
- **Interpolação**: Como as propriedades aceitam expressões, você pode usar variáveis do seu código SeteAO diretamente nos componentes web.
- **Suporte a Vetores**: O analisador agora suporta a declaração de listas (`VAR v = [1, 2] : LISTA.`), acesso a elementos (`v[0]`) e atribuição a índices específicos (`v[0] = 10.`).

## 5. Interface Gráfica (Electron)
A interface foi atualizada para incluir um terceiro painel chamado **"Visualização Web"**.
- Ao clicar em "Compilar" (F5), o `api.ts` retorna tanto o log do console quanto o HTML gerado.
- O `renderer.js` injeta esse HTML no painel de visualização, permitindo ver o resultado visual instantaneamente.
