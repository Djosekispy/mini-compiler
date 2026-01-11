/**
 * Tipos de tokens suportados pela linguagem.
 */
enum TokenType {
    VAR = "VAR", // Palavra-chave 'VAR'
    EXIBIR = "EXIBIR", // Palavra-chave 'EXIBIR'


    // Operadoes aritmeticos
    MENOS = "MENOS", // Operador de subtração '-'
    DIVISAO = "DIVISAO", // Operador de divisão '/'
    MULTIPLICACAO = "MULTIPLICACAO", // Operador de MULTIPLICACAO '*'
    MAIS = "MAIS", // Operador de adição '+'
    IDENTIFICADOR = "IDENTIFICADOR", // Identificadores (nomes de variáveis)
    EOF = "EOF", // Fim do arquivo (End Of File)

    // Variáveis de tipo
    INTEIRO = "INTEIRO", // Tipo de dado inteiro
    NATURAL = "NATURAL", // Tipo de dado natural (não negativo)
    REAL = "REAL", // Tipo de dado real (semicolon flutuante)
    TEXTO = "TEXTO", // Tipo de dado texto (string)
    
    CARACTER = "CARACTER", // Tipo de dado caracter (char)

    // lOGICOS
    LOGICO = "LOGICO", // Tipo de dado lógico (verdadeiro/falso)
    VERDADEIRO = "VERDADEIRO", // Literal lógico verdadeiro
    FALSO = "FALSO", // Literal lógico falso


    // Estruturas de controle
    SE = "SE", // Palavra-chave 'SE'
    SENAO = "SENAO", // Palavra-chave 'SENAO'

    // Delimitadores
    PARENTESE_ESQUERDO = "PARENTES_ESQUERDO", // Parênteses esquerdo '('
    PARENTESE_DIREITO = "PARENTES_DIREITO", // Parênteses direito ')'
    COLCHETE_ESQUERDA = "COLCHETE_ESQUERDO", // Colchete esquerdo '['
    COLCHETE_DIREITA = "COLCHETE_DIREITO", // Colchete direito ']'
    CHAVE_ESQUERDA = "CHAVE_ESQUERDO", // Chave esquerda '{'
    CHAVE_DIREITA = "CHAVE_DIREITO", // Chave direita '}'
    VIRGULA = "VIRGULA", // Vírgula ','
    DOIS_PONTOS = "DOIS_PONTOS", // Dois pontos ':'
    SEMICOLON = "SEMICOLON", // ponto final de cada linha '.'
    PONTO_VIRGUAL = "PONTO_VIRGUAL", // ponto e vírgula ';'

    //   Operadores de comparação
    MAIOR_QUE = "MAIOR_QUE", // Maior que '>'
    MENOR_QUE = "MENOR_QUE", // Menor que '<'
    IGUALDADE = "IGUALDADE", // Igualdade '=='
    DIFERENTE = "DIFERENTE", // Diferente '!='

    //   Operador de atribuição
    ATRIBUICAO = "ATRIBUICAO", // Operador de atribuição '='
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
