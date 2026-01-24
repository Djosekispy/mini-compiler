## Exemplo de Vetores (LISTA) em SeteAO

Este exemplo demonstra como criar listas, acessar elementos e modificar valores usando índices:

```sa
## Declarando uma lista de frutas ##
VAR frutas = ["Maçã", "Banana", "Laranja"] : LISTA.

EXIBIR("Minha lista: ", frutas).
EXIBIR("A primeira fruta é: ", frutas[0]).

## Modificando um elemento ##
frutas[1] = "Morango".
EXIBIR("Lista atualizada: ", frutas).

## Lista de números com cálculos ##
VAR precos = [10.5, 20.0, 5.75] : LISTA.
VAR total = precos[0] + precos[1] + precos[2].
EXIBIR("O total dos preços é: ", total).

## Usando em loops ##
PARA (VAR i = 0 : INTEIRO; i < 3; i++) {
    EXIBIR("Fruta ", i, ": ", frutas[i]).
}

## Vetores em Componentes Web ##
VAR cores = ["vermelho", "azul", "verde"] : LISTA.

<bloco propriedades={fundo: cores[1], padding: "20px"}>
    <texto propriedades={cor: "branco"}>"Este bloco usa a cor do vetor: " + {cores[1]}</texto>
</bloco>
```
