# Mini-Compiler – Registro de Alterações

## Versão 0.2.0 – 2026-01-11

### Motivação
Reestruturar a sintaxe da linguagem para melhorar legibilidade,
aproximar de linguagens modernas e preparar o compilador para
 verificação de tipos.

---

## 0. Input
- Mudamos o nome do arquivo de entrada de .nt para .sa

## 1. ILexer

### Alterações
- Tradução dos lexemas para português
- Alteração da tabela de símbolos
- Adição de delimitadores
- Inclusão de tipos de variáveis
- Inclusão de operadores de comparação

### Novos Tokens
- VAR
- DOIS_PONTOS (:)
- NATURAL
- INTEIRO
- REAL
-MENOS
- Operadores relacionais (>, <, ==, !=, <=, >=)

---

## 2. Lexer

### Alterações
- Reconhecimento dos novos lexemas definidos no ILexer (incluindo TEXTO)
- Suporte aos delimitadores: ponto e parenteses
- Utilização de vírgula para números de ponto flutuante
- Reconhecimento do lexema Menos(-) para numeros negativos definidos no Ilexter
- Melhoria no reconhecimento de identificadores (suporte a números e underscores após a primeira letra, ex: `var1`, `minha_variavel`)
- Implementação parsing de Strings (aspas duplas) com tratamento de erro para strings não terminadas
- Formatação de mensagens de erro com cores ANSI e detalhes do arquivo, linha e coluna
- Exibição do contexto do erro para facilitar o debug
- **Validações de Identificadores:**
    - Erro ao iniciar com números (ex: `12nome`).
    - Erro ao iniciar com palavras reservadas seguidas de outros caracteres (ex: `VARc`, `REALx`).
- **Validação de Números:**
    - Erro caso o número termine com vírgula ou ponto (ex: `12,`).



## 3. Parser

### Alterações na Sintaxe

#### Antes:

```
LET IDENTIFICADOR = expr TIPO ;
```

```
EXIBIR IDENTIFICADOR.

```

#### Depois:

```
VAR IDENTIFICADOR = expr : TIPO .
```
```
EXIBIR(IDENTIFICADOR).
```
---