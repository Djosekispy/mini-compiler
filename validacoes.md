# Validações do Mini-Compilador

Abaixo estão listadas as validações de erro do sistema, organizadas por etapa de compilação.

## 1. Analisador Léxico (Lexer)
*Erros encontrados durante a leitura dos caracteres e formação das palavras.*

*   **Caractere Inválido**
    *   **Descrição:** O compilador encontrou um símbolo que não pertence à linguagem.
    *   **Exemplo:** `@`, `#`

*   **Número Real Inválido**
    *   **Descrição:** Números com erros de formatação, como múltiplas vírgulas/pontos ou terminando com separador decimal.
    *   **Exemplo:** `10.5.2` ou `12.`

*   **Identificador Inválido**
    *   **Descrição:** Nomes de variáveis que começam com números.
    *   **Exemplo:** `12nome`

*   **Palavra Reservada Inválida**
    *   **Descrição:** Tentativa de criar um identificador que começa com uma palavra reservada (provável erro de digitação).
    *   **Exemplo:** `VARc`, `REALx`

*   **String Não Terminada**
    *   **Descrição:** Uma string foi aberta com aspas `"` mas a linha ou arquivo terminou antes de fechar.
    *   **Exemplo:** `"Texto sem fim`

*   **Limite de Tamanho Excedido**
    *   **Descrição:** Números (máximo 15 dígitos) ou Strings (máximo 500 caracteres) excederam o limite permitido.
    *   **Exemplo:** `1234567890123456` ou uma string com mais de 500 letras.

*   **Comentário em Bloco Não Fechado**
    *   **Descrição:** Um comentário iniciado com `/*` não foi encerrado com `*/`.
    *   **Exemplo:** `/* Comentário esquecido...`

---

## 2. Analisador Sintático (Parser)
*Erros na estrutura e gramática das frases.*

*   **Erro Sintático (Faltou Ponto Final)**
    *   **Descrição:** O compilador detectou que uma linha de comando não terminou com o ponto final (`.`).
    *   **Exemplo:** `VAR x = 10 : INTEIRO` (sem o ponto no final).

*   **Tipo de Variável Não Declarado / Inválido**
    *   **Descrição:** Declaração de variável sem especificar o tipo após os dois pontos (`:`) ou com um tipo desconhecido.
    *   **Exemplo:** `VAR x = 10 : .` ou `VAR x = 10 : COISA.`

*   **Erro de Tipo (TEXTO)**
    *   **Descrição:** Tentativa de atribuir valor não-string a variável do tipo TEXTO.
    *   **Exemplo:** `VAR x = 10 : TEXTO.` → Variável do tipo TEXTO deve receber uma string entre aspas.

*   **Erro de Tipo (LOGICO)**
    *   **Descrição:** Tentativa de atribuir valor não-booleano a variável do tipo LOGICO.
    *   **Exemplo:** `VAR x = "ola" : LOGICO.` → Variável do tipo LOGICO deve receber VERDADEIRO ou FALSO.

*   **Erro de Tipo (NATURAL)**
    *   **Descrição:** Tentativa de atribuir número negativo a variável do tipo NATURAL (verificação sintática).
    *   **Exemplo:** `VAR x = -5 : NATURAL.` → Variável do tipo NATURAL não pode receber número negativo.

*   **Fator Inválido**
    *   **Descrição:** Token inesperado em uma expressão aritmética ou lógica. Antigamente chamado de "Factor Inválido".
    *   **Exemplo:** `VAR x = 10 + * 5 : INTEIRO.`

---

## 3. Analisador Semântico (Semantic)
*Erros de lógica e tipos durante a execução.*

*   **Incompatibilidade de Tipo (INTEIRO)**
    *   **Descrição:** Tentar colocar um número decimal em uma variável `INTEIRO`.
    *   **Exemplo:** `VAR x = 3.5 : INTEIRO.`

*   **Incompatibilidade de Tipo (NATURAL)**
    *   **Descrição:** Tentar colocar número negativo ou decimal em variável `NATURAL`.
    *   **Exemplo:** `VAR x = -5 : NATURAL.`

*   **Variável Não Declarada**
    *   **Descrição:** Tentar usar ou exibir uma variável que não existe.
    *   **Exemplo:** `EXIBIR(y).` (sem `VAR y` antes)

*   **Divisão por Zero**
    *   **Descrição:** Operação matemática proibida.
    *   **Exemplo:** `10 / 0`
