# Validações do Mini-Compilador

Este documento lista todas as validações de erro implementadas no sistema, divididas por módulo (Lexer, Parser, Semantic Analyzer).

## 1. Analisador Léxico (Lexer)
Responsável por transformar o código em tokens. Verifica a validade dos caracteres e formação de palavras.

| Erro | Descrição | Exemplo |
|---|---|---|
| **Caractere inválido** | Ocorre quando um caractere não reconhecido é encontrado. | `@` |
| **Número real inválido** | 1. Ocorre quando um número real tem múltiplas vírgulas.<br>2. Ocorre quando um número termina com vírgula ou ponto. | `12.3.4`<br>`12.` |
| **Identificador inválido** | Ocorre quando um identificador começa com um número. | `12nome` |
| **Palavra reservada inválida** | Ocorre quando um identificador começa com uma palavra reservada (ex: typos). | `VARc`, `REALx` |
| **String não terminada** | Ocorre quando uma string abre aspas mas não fecha antes do fim da linha ou arquivo. | `"Ola mundo` |

> **Nota:** Todos os erros do Lexer exibem o arquivo, linha, coluna e o contexto do erro com formatação colorida.

---

## 2. Analisador Sintático (Parser)
Responsável por verificar a estrutura gramatical do código.

| Erro | Descrição | Exemplo |
|---|---|---|
| **Erro sintático** | Ocorre quando um token inesperado é encontrado (esperava X, recebeu Y). | `esperado :, encontrado ;` |
| **Factor inválido** | Ocorre quando uma expressão contém um elemento que não é número, identificador ou operador unário. | `VAR x = * 2` |
| **Tipo de variável inválido** | Ocorre na declaração de variáveis, se o tipo não for `INTEIRO`, `REAL` ou `NATURAL`. | `VAR x = 1 : TEXTO.` (se TEXTO não for suportado no parser) |
| **Comando inválido** | Ocorre se uma instrução não começar com palavras-chave válidas (`VAR`, `EXIBIR`). | `x = 10` (atribuição sem VAR) |

---

## 3. Analisador Semântico (Semantic)
Responsável por verificar a lógica e tipos durante a execução.

| Erro | Descrição | Exemplo |
|---|---|---|
| **Erro semântico (INTEIRO)** | Ocorre ao tentar atribuir um valor decimal a uma variável `INTEIRO`. | `VAR x = 3.5 : INTEIRO.` |
| **Erro semântico (NATURAL)** | Ocorre ao tentar atribuir um valor decimal ou negativo a uma variável `NATURAL`. | `VAR x = -1 : NATURAL.` |
| **Variável não declarada** | Ocorre ao tentar usar uma variável que não foi definida anteriormente. | `EXIBIR(y).` (sem declarar y) |
| **Divisão por zero** | Ocorre em operações de divisão onde o divisor é 0. | `10 / 0` |
| **Operador desconhecido** | Erro interno caso um operador não mapeado apareça na AST. | - |
