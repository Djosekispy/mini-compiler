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

---

## 2. Analisador Sintático (Parser)
*Erros na estrutura e gramática das frases.*

*   **Erro Sintático**
    *   **Descrição:** A ordem dos tokens está incorreta (ex: esperava dois pontos, veio um ponto e vírgula).
    *   **Exemplo:** `esperado :, encontrado ;`

*   **Comando Inválido**
    *   **Descrição:** Uma instrução começou com um token inesperado. O erro agora exibe qual token causou o problema.
    *   **Exemplo:** `Comando inválido: 10`

*   **Tipo de Variável Inválido**
    *   **Descrição:** Declaração de variável com um tipo desconhecido ou mal formatado. O erro especifica o tipo inválido encontrado.
    *   **Exemplo:** `Tipo de variável inválido: COISA`
    *   **Tipos Válidos:** `INTEIRO`, `REAL`, `NATURAL`, `TEXTO`

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
