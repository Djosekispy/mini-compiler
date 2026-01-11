# Problemas Conhecidos

Atualmente não há problemas conhecidos em aberto. Todos os problemas listados anteriormente foram resolvidos.

## Resolvidos (Versão 0.2.0)

### Lexer
- [x] **Verificação de Palavras Reservadas:** Corrigido o loop para identificar corretamente identificadores com números (`var1`) e bloquear os que começam com números (`12nome`).
- [x] **Palavras Reservadas "Erradas":** Implementada validação para bloquear `VARx`, `REALx`, etc.
- [x] **Números Reais:** Implementada validação para impedir múltiplos pontos/vírgulas e terminação com separador (`12.`).
- [x] **Strings:** Implementado suporte a strings e erro para strings não terminadas.
- [x] **Relatório de Múltiplos Erros:** Lexer agora acumula e exibe todos os erros de uma vez.
- [ ] **Mensagem de erro ao inserir ponto no numero real** Mostrar um erro quando o usuario mete o ponto no numero real.

- [ ] **Validação ara números ou string muito grandes** Mostrar uma mensagem quando o número ou string é muito grande

- [ ] **Quando o comentario em bloco não é fechado** Mostrar uma mensagem


### Parser
- [x] **Validações de Tipo:** Implementadas verificações sintáticas para TEXTO, LOGICO e NATURAL.

- [x] **Formatação de Erros:** Mensagens de erro agora incluem cores ANSI, arquivo, linha, coluna e contexto detalhado.

- [x] **Precedência de Operadores:** Corrigida a ordem de avaliação (`*` e `/` antes de `+` e `-`).

- [x] **Suporte a Parênteses:** Implementado reconhecimento de expressões entre parênteses para controle de precedência.

- [ ] **Number Literal:** Mudar a mensagem de Number literal para Numero literal ao mostrar o erro.

- [ ] **Ponto no final da linha:** Deve se formatar uma mensagem específica para informar que faltou o ponto final da linha, quando necessario.

- [ ] **Tipo de variavel não declarado:** Mostrar uma mensagem específica para informar que o tipo de variavel não foi declarado.

- [ ] **Possiblidade de meter varios códigos:** Adicionar varios códigos fonte na pasta input para poder executar, principalmente em testes

- [ ] **Operador sem operando:** VAR x = 10 + ; [ERRO] Operador '+' sem operando à direita

- [ ] **Expressão vazia:** EXIBIR();
 ; [ERRO] Expressão vazia não é permitida

- [ ] **Declaração incompleta**VAR = 10 : INTEIRO;
 ; [ERRO] Identificador esperado após VAR

- [ ] **Uso de palavra reservada como identificador**VAR VAR = 10 : INTEIRO;
 ; [ERRO] Palavra reservada não pode ser usada como identificador

- [ ] **EXIBIR sem parênteses**EXIBIR 10;
 ; [ERRO] Esperado '(' após EXIBIR

- [ ] **Tipo incompatível em expressão aritmética** VAR x = "abc" + 10 : TEXTO
 ; [ERRO] Operador '+' não é válido entre TEXTO e INTEIRO



```
