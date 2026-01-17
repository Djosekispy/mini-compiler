# 🧠 Mini Compilador em Node.js + TypeScript

Este projecto consiste no desenvolvimento de um **mini compilador**, implementado em **Node.js utilizando TypeScript**, com o objectivo de demonstrar, de forma prática e didáctica, os principais conceitos envolvidos no processo de compilação de uma linguagem de programação.

O compilador foi concebido de forma **modular**, sendo divisaoido em **três módulos fundamentais**:

- **Analisador Léxico**
- **Analisador Sintático**
- **Analisador Semântico**

Cada módulo desempenha um papel específico no processo de análise e execução do código-fonte, seguindo a arquitectura clássica de compiladores.

---

## 🎯 Objectivos do Projecto

- Compreender o funcionamento interno de um compilador
- Implementar um analisador léxico para geração de tokens
- Implementar um analisador sintático baseado em gramática simples
- Realizar análise semântica com verificação de regras e execução
- Aplicar conceitos de árvores sintáticas (AST)
- Utilizar Node.js e TypeScript em um projecto estruturado

---

## 🧩 Estrutura do Compilador

O mini compilador segue o seguinte fluxo de funcionamento:

1. **Análise Léxica**
   O código-fonte é lido caractere por caractere e transformado em uma sequência de tokens.

2. **Análise Sintática**
   Os tokens são analisados de acordo com regras gramaticais, gerando uma **Árvore Sintática Abstrata (AST)**.

3. **Análise Semântica**
   A AST é percorrida para verificar regras semânticas, como declaração de variáveis, e para executar o programa.

---

## 🛠️ Tecnologias Utilizadas

- **Node.js** – Ambiente de execução
- **TypeScript** – Linguagem principal do projecto
- **Programação Orientada a Objectos**
- **Arquitectura Modular**

---

## 📂 Estrutura do Projecto

```
mini-compiler/
│── src/
|   ├── input/        # código fonte a ser lido
│   ├── lexer/        # Analisador Léxico
│   ├── parser/       # Analisador Sintático
│   ├── semantic/     # Analisador Semântico
│   └── index.ts      # PONTO de entrada
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📚 Linguagem Suportada (Simplificada)

A linguagem implementada no projecto suporta:

- Declaração de variáveis
- Atribuição de valores
- Operações aritméticas simples
- Comando de saída (`EXIBIR`)

### Exemplo de código:

```
VAR x = 3: INTEIRO.
VAR y = x / 1: INTEIRO.
EXIBIR y.
```

---

## 🧪 Finalidade Académica

Este mini compilador **tem como objectivo** :

- Facilitar a compreensão dos conceitos teóricos
- Demonstrar a aplicação prática dos módulos de um compilador
- Servir como base para extensões futuras, como:

  - Condicionais (`if`)
  - Laços (`while`)
  - Tipos de dados
  - Geração de código intermediário

---

## 🚀 Possíveis Evoluções

- Implementação de uma gramática mais compvara
- Separação entre análise semântica e execução
- Geração de bytecode ou código intermediário
- Interface gráfica ou Web
- Integração com testes automatizados

---

## 👨‍💻 Público-Alvo

- Estudantes de Engenharia Informática

---
