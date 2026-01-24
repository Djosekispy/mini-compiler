/**
 * Tipos de tokens suportados pela linguagem.
 */
enum TokenType {
  VAR = "VAR", // Palavra-chave 'VAR'

  // Comando de exibição de dados
  EXIBIR = "EXIBIR", // Palavra-chave 'EXIBIR'

  // Comando de inserção de dados
  INSERIR = "INSERIR", // Palavra-chave 'INSERIR'

  // Operadoes aritmeticos
  MENOS = "MENOS", // Operador de subtração '-'
  DIVISAO = "DIVISAO", // Operador de divisão '/'
  MULTIPLICACAO = "MULTIPLICACAO", // Operador de MULTIPLICACAO '*'
  MAIS = "MAIS", // Operador de adição '+'
  BARRA = "BARRA", // Barra '/'
  IDENTIFICADOR = "IDENTIFICADOR", // Identificadores (nomes de variáveis)
  EOF = "EOF", // Fim do arquivo (End Of File)

  // Variáveis de tipo
  INTEIRO = "INTEIRO", // Tipo de dado inteiro
  NATURAL = "NATURAL", // Tipo de dado natural (não negativo)
  REAL = "REAL", // Tipo de dado real (PONTO flutuante)
  TEXTO = "TEXTO", // Tipo de dado texto (string)
  LISTA = "LISTA", // Tipo de dado lista (array)
  CARACTER = "CARACTER", // Tipo de dado caracter (char)

  // lOGICOS
  LOGICO = "LOGICO", // Tipo de dado lógico (verdadeiro/falso)
  VERDADEIRO = "VERDADEIRO", // Literal lógico verdadeiro
  FALSO = "FALSO", // Literal lógico falso

  // Estruturas de controle
  SE = "SE", // Palavra-chave 'SE'
  SENAO = "SENAO", // Palavra-chave 'SENAO'


  // Estrutura de repetição
  ENQUANTO = "ENQUANTO", // Palavra-chave 'ENQUANTO'
  FACA = "FACA", // Palavra-chave 'FACA'
  PARA = "PARA", // Palavra-chave 'PARA'


  // Delimitadores
  PARENTESE_ESQUERDO = "PARENTE_ESQUERDO", // Parênteses esquerdo '('
  PARENTESE_DIREITO = "PARENTE_DIREITO", // Parênteses direito ')'
  COLCHETE_ESQUERDO = "COLCHETE_ESQUERDO", // Colchete esquerdo '['
  COLCHETE_DIREITO = "COLCHETE_DIREITO", // Colchete direito ']'
  CHAVE_ESQUERDA = "CHAVE_ESQUERDA", // Chave esquerda '{'
  CHAVE_DIREITA = "CHAVE_DIREITA", // Chave direita '}'
  VIRGULA = "VIRGULA", // Vírgula ','
  DOIS_PONTOS = "DOIS_PONTOS", // Dois pontos ':'
  PONTO_E_VIRGULA = "PONTO_E_VIRGULA", // Ponto e vírgula ';'
  PONTO = "PONTO", // ponto final de cada linha '.'

  //   Operadores de comparação
  MAIOR_QUE = "MAIOR_QUE", // Maior que '>'
  MENOR_QUE = "MENOR_QUE", // Menor que '<'
  MAIOR_OU_IGUAL = "MAIOR_OU_IGUAL", // Maior ou igual '>='
  MENOR_OU_IGUAL = "MENOR_OU_IGUAL", // Menor ou igual '<='
  IGUALDADE = "IGUALDADE", // Igualdade '=='
  DIFERENTE_DE = "DIFERENTE", // Diferente '!='

  //  Operadores lógicos
  E = "E", // Operador lógico E
  OU = "OU", // Operador lógico OU
  NAO = "NAO", // Operador lógico NÃO

  //   Operador de atribuição
  ATRIBUICAO = "ATRIBUICAO", // Operador de atribuição '='
  MAIS_IGUAL = "MAIS_IGUAL", // '+='
  MENOS_IGUAL = "MENOS_IGUAL", // '-='
  INCREMENTO = "INCREMENTO", // '++'
  DECREMENTO = "DECREMENTO", // '--'


  // Novos operadores matemáticos
  RAIZ = "RAIZ", // Operador raiz quadrada '√'
  EXPOENTE = "EXPOENTE", // Operador de exponenciação '^'


  // Comandos de controle de fluxo
  CONTINUAR = "CONTINUAR", // Palavra-chave 'CONTINUAR'
  PARAR = "PARAR", // Palavra-chave 'PARAR'

  //POO
  PUBLICO = "PUBLICO",
  PRIVADO = "PRIVADO",
  PROTEGIDO = "PROTEGIDO",
}



/**
 * Estrutura de um Token.
 */
interface Token {
  type: TokenType; // O tipo do token
  value: string; // O valor textual do token
  linha: number; // A linha do token
  coluna: number; // A coluna do token
}

export { Token, TokenType };
