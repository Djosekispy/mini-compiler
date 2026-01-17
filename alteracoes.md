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
- MENOS
- LOGICO
- VERDADEIRO
- FALSO
- SE
- SENAO
- Operadores relacionais (>, <, ==, !=, <=, >=)

---

## 2. Lexer

### Alterações
- Reconhecimento dos novos lexemas definidos no ILexer (incluindo TEXTO)
- Suporte aos delimitadores: ponto e parenteses
- Utilização de vírgula para números de ponto flutuante
- Reconhecimento do lexema Menos(-) para numeros negativos definidos no Ilexter
- Reconhecimento do lexema TEXTO para textos defino no ILexer
- Reconhecimento dos lexemas VERDADEIRO, FALSO, LOGICO definidos no ILexer 
- Reconhecimento dos literais condicionais SE e SENAO
- Melhoria no reconhecimento de identificadores (suporte a números e underscores após a primeira letra, ex: `var1`, `minha_variavel`)
- Implementação parsing de Strings (aspas duplas) com tratamento de erro para strings não terminadas
- Formatação de mensagens de erro com cores ANSI e detalhes do arquivo, linha e coluna
- **Relatório de Múltiplos Erros:** O Lexer agora acumula e exibe todos os erros léxicos encontrados de uma vez, em vez de parar no primeiro.
- Exibição do contexto do erro para facilitar o debug
- **Validações de Identificadores:**
    - Erro ao iniciar com números (ex: `12nome`).
    - Erro ao iniciar com palavras reservadas seguidas de outros caracteres (ex: `VARc`, `REALx`).
- **Validação de Números:**
    - Erro caso o número termine com vírgula ou ponto (ex: `12,`).
    - **Atenção:** Uso de ponto (`.`) em números reais agora gera um erro instrutivo solicitando o uso de vírgula (`,`).
    - **Limite de Tamanho:** Implementada validação para números que excedem 15 dígitos.
- **Validação de Strings:**
    - **Limite de Tamanho:** Strings agora possuem limite máximo de 500 caracteres.
- **Comentários de Bloco:**
    - Adicionada detecção de erro para comentários iniciados com `/*` que não foram fechados com `*/`.



## 3. Parser

### Alterações na Sintaxe
- Adicionada validação de tipos de dados no Parser (análise sintática):
    1. **NATURAL** não pode ser negativo (detecta literais com sinal `-`)
    2. **TEXTO** deve receber string entre aspas duplas (`"..."`)
    3. **LOGICO** deve receber apenas `VERDADEIRO` ou `FALSO`


### Implementação de Estruturas Condicionais

Novo suporte para instrução SE (condição) { bloco }
A condição SE deve ser uma expressão lógica que retorna VERDADEIRO ou FALSO
Verificação de tipo: Se a condição não for booleana, o Parser lança erro semântico

### Correção de Precedência de Operadores
- **Problema corrigido:** Expressões como `2 + 3 * 4` eram avaliadas incorretamente como `20` (esquerda para direita)
- **Solução implementada:** Gramática reestruturada em dois níveis:
  - `expr -> term ((+ | -) term)*` - Adição e subtração (menor precedência)
  - `term -> factor ((* | /) factor)*` - Multiplicação e divisão (maior precedência)
- **Resultado:** `2 + 3 * 4` agora retorna corretamente `14`

### Suporte a Parênteses
- Implementado reconhecimento de expressões entre parênteses no método `factor()`
- Gramática estendida: `factor -> ... | (expr)`
- Permite alterar ordem de avaliação: `(2 + 3) * 4` = `20`

### Melhorias de Mensagens de Erro
- **Formatação Rica de Erros:** O Parser agora exibe erros formatados com cores ANSI, incluindo:
  - Arquivo, Linha e Coluna do erro
  - Contexto detalhado com informações sobre o problema
  - Sugestões de valores/tipos válidos
  - Mesma qualidade visual dos erros do Lexer
- **Localização de Nomes Internos:** Nomes de tipos da AST (como `NumberLiteral`) são traduzidos para nomes amigáveis em português (`Numero literal`) nas mensagens de erro.
- **Dicas de Sintaxe Específicas:**
  - Erro customizado para falta de ponto final (`.`) ao fim da linha.
  - Erro customizado para declaração de variável sem tipo ou com tipo inválido.
- **Correção de Terminologia:** Alterado o termo "Factor Inválido" para "Fator Inválido" para manter a padronização no idioma.



### Sintaxe da linguagem:

**Se**:
    SE(condição) {
    comandos;
}



### Semantic

### Exemplos:

Entrada:
```
VAR nome = "Ana Luisa" : TEXTO.
EXIBIR(nome).
```
Sáida do prompt:

```
Ana luisa
```

----------

Entrada:
```
VAR bool = FALSO : LOGICO.
EXIBIR (bool).
```
Sáida do prompt:

```
false
```

Entrada:
```
VAR a = 10 : INTEIRO.
SE (VERDADEIRO) {
    EXIBIR(a).
}
```
Saída:
```
10
```

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