## Exemplo de Atalhos Matemáticos

Estes novos operadores facilitam a manipulação de contadores e o controle de loops:

```sa
VAR contador = 1 : INTEIRO.
EXIBIR("Início: ", contador).

contador++.
EXIBIR("Depois de ++: ", contador).

contador += 10.
EXIBIR("Depois de += 10: ", contador).

contador--.
EXIBIR("Depois de --: ", contador).

contador -= 5.
EXIBIR("Depois de -= 5: ", contador).

## Usando no loop PARA ##
PARA (VAR i = 0 : INTEIRO; i < 5; i++) {
    EXIBIR("Loop: ", i).
}
```
