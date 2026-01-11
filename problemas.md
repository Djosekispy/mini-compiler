# Problemas Conhecidos

## Lexer

### Verificação de Palavras Reservadas Incompleta
A verificação de palavras reservadas e identificadores apresenta falhas, especialmente quando identificadores contêm números ou sublinhados.

#### Exemplos
1. `let let`
2. `let let7`
3. `let var_`

Nos exemplos acima, o compilador exibe a mesma mensagem de erro genérica:

```
throw new Error(`Erro sintático: esperado ${type}, encontrado ${this.currentToken.type}`);
Error: Erro sintático: esperado IDENTIFIER, encontrado LET
```

**Análise dos Exemplos:**
- **Exemplo 1 (`let let`):** Está realmente errado, mas a mensagem de erro deveria indicar especificamente que "let" é uma palavra reservada e não pode ser usada como identificador.
- **Exemplo 2 (`let let7`):** Deveria ser válido, pois `let7` é um identificador legítimo em muitas linguagens.

### Causa do Problema
**Arquivo:** `src/lexer/Lexer.ts`

O loop que captura palavras verifica apenas caracteres alfabéticos:

```typescript
while (isWord.test(this.peek())) {
    word += this.peek();
    this.advance();
}
```

**Explicação:**
Este trecho de código verifica apenas se o caractere é alfabético (`isWord`). Se o lexer encontrar números ou símbolos (como `_`) subsequentes, ele para de ler a palavra prematuramente.
- Se a parte lida até ali coincidir com uma palavra reservada (ex: `let` de `let7`), ele identifica incorretamente como a palavra reservada, deixando o resto (`7`) para ser processado separadamente, causando o erro de sintaxe.


### Números Reais
- Ao inserir o número 10,02,43 o sistema mostra NaN
- Ao inserir o número 12, o sistema não mostra o erro

### Variaveis
- Está a ser possível criar começando com números. Ex: 12nome
- Está a ser posível criar paravras reservas com mais dados. Ex: VARx nome

```
