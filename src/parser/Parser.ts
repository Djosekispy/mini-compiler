import { Token, TokenType } from "../lexer/ILexer";
import Lexer from "../lexer/Lexer";
import ASTNode from "./IParser";

/**
 * O Parser é responsável por transformar uma sequência de Tokens em uma Árvore de Sintaxe Abstrata (AST).
 * Utiliza a técnica de Descida Recursiva para processar a gramática.
 */
class Parser {
  private lexer: Lexer;
  private currentToken: Token;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.getNextToken();
  }

  /**
   * Consome o token atual se ele for do tipo esperado, caso contrário, lança um erro.
   */
  private eat(type: TokenType) {
    if (this.currentToken.type === type) {
      this.currentToken = this.lexer.getNextToken();
    } else {
      throw new Error(
        `Erro sintático: esperado ${type}, encontrado ${this.currentToken.type}`
      );
    }
  }

  /**
   * Processa um 'fator', que pode ser um número ou um identificador.
   * Gramática: factor -> inteiro | IDENTIFICADOR
   */
  private factor(): ASTNode {
    const token = this.currentToken;

    // Caso: número negativo
    if (token.type === TokenType.MENOS) {
      this.eat(TokenType.MENOS);
      const node = this.factor(); // aplica o menos no próximo factor
      return {
        type: "UnaryExpression",
        operator: "-",
        argument: node,
      };
    }

    if (token.type === TokenType.INTEIRO || token.type === TokenType.REAL) {
      this.eat(token.type);
      return {
        type: "NumberLiteral",
        value: Number(token.value),
        numberType: token.type,
      };
    }

    if (token.type === TokenType.IDENTIFICADOR) {
      this.eat(TokenType.IDENTIFICADOR);
      return { type: "IDENTIFICADOR", name: token.value };
    }

    throw new Error("Factor inválido");
  }

  /**
   * Processa expressões aritméticas respeitando a precedência e associatividade.
   * Gramática: expr -> factor ((MAIS | MENOS | MULTIPLICACAO | DIVISAO) factor)*
   */
  private expr(): ASTNode {
    var node = this.factor();

    while (this.currentToken.type === TokenType.MAIS) {
      this.eat(TokenType.MAIS);
      node = {
        type: "BinaryExpression",
        operator: "+",
        left: node,
        right: this.factor(),
      };
    }

    while (this.currentToken.type === TokenType.DIVISAO) {
      this.eat(TokenType.DIVISAO);
      node = {
        type: "BinaryExpression",
        operator: "/",
        left: node,
        right: this.factor(),
      };
    }

    while (this.currentToken.type === TokenType.MULTIPLICACAO) {
      this.eat(TokenType.MULTIPLICACAO);
      node = {
        type: "BinaryExpression",
        operator: "*",
        left: node,
        right: this.factor(),
      };
    }

    while (this.currentToken.type === TokenType.MENOS) {
      this.eat(TokenType.MENOS);
      node = {
        type: "BinaryExpression",
        operator: "-",
        left: node,
        right: this.factor(),
      };
    }

    return node;
  }

  /**
   * Processa um comando (statement), como declaração de variável ou comando de impressão.
   * Gramática:
   *  - statement -> VAR IDENTIFICADOR ATRIBUICAO expr SEMICOLON
   *  - statement -> exibir expr SEMICOLON
   */
  private statement(): ASTNode {
    // Caso: var x = expression: TIPO;
    if (this.currentToken.type === TokenType.VAR) {
      this.eat(TokenType.VAR);

      const id = this.currentToken.value;
      this.eat(TokenType.IDENTIFICADOR);
      this.eat(TokenType.ATRIBUICAO);

      const value = this.expr();

      this.eat(TokenType.DOIS_PONTOS);

      const varType = this.currentToken;
      if (
        varType.type === TokenType.INTEIRO ||
        varType.type === TokenType.REAL ||
        varType.type === TokenType.NATURAL
      ) {
        this.eat(varType.type);
      } else {
        throw new Error("Tipo de variável inválido");
      }

      this.eat(TokenType.SEMICOLON);
      return {
        type: "VariableDeclaration",
        id,
        value,
        varType: varType.type,
      };
    }

    // Caso: print expression;
    if (this.currentToken.type === TokenType.EXIBIR) {
      this.eat(TokenType.EXIBIR);
      this.eat(TokenType.PARENTES_ESQUERDO);

      const value = this.expr();
      this.eat(TokenType.PARENTES_DIREITO);
      this.eat(TokenType.SEMICOLON);

      return {
        type: "PrintStatement",
        value,
      };
    }
    throw new Error(`Comando inválido`);
  }

  /**
   * Inicia o processo de análise sintática e retorna a lista de nós da AST.
   */
  public parse(): ASTNode[] {
    const statements: ASTNode[] = [];
    while (this.currentToken.type !== TokenType.EOF) {
      statements.push(this.statement());
    }
    return statements;
  }
}

export default Parser;
