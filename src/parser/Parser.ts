import { Token, TokenType } from "../lexer/ILexer";
import Lexer from "../lexer/Lexer";
import ASTNode from "./IParser";

interface SwitchNode extends ASTNode {
  type: "SwitchStatement";
  controlVar: string;
  cases: { value: any; body: ASTNode[] }[];
  defaultBody?: ASTNode[];
}

class Parser {
  private lexer: Lexer;
  private currentToken: Token;
  private previousToken: Token; // Rastreia o token anterior para erros de "faltou algo"
  public errors: string[] = [];
  private functionTable: {
    [key: string]: {
      returnType: TokenType;
      parameters: { name: string; type: string }[];
    };
  } = {};

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.getNextToken();
    this.previousToken = this.currentToken;
  }

  /* ==================== UTILITÁRIOS ==================== */

  private formatError(
    errorType: string,
    details: string,
    token?: Token,
  ): string {
    const t = token || this.currentToken;
    return `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] ${errorType}\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mArquivo:\x1b[0m \x1b[33m${this.lexer.filename}\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${t.linha}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${t.coluna}\x1b[0m
  - \x1b[36mContexto:\x1b[0m ${details}`;
  }

  private translateTypeName(type: string): string {
    const translations: { [key: string]: string } = {
      NumberLiteral: "Numero literal",
      StringLiteral: "Texto literal",
      BooleanLiteral: "Valor logico literal",
      BinaryExpression: "Expressao binaria",
      UnaryExpression: "Expressao unaria",
      IDENTIFICADOR: "Identificador",
    };
    return translations[type] || type;
  }

  private translateTokenName(type: TokenType): string {
    const translations: { [key in TokenType]?: string } = {
      [TokenType.PONTO]: "ponto final (.)",
      [TokenType.DOIS_PONTOS]: "dois pontos (:)",
      [TokenType.ATRIBUICAO]: "igual (=)",
      [TokenType.PARENTESE_ESQUERDO]: "parentese esquerdo '('",
      [TokenType.PARENTESE_DIREITO]: "parentese direito ')'",
      [TokenType.CHAVE_ESQUERDA]: "chave esquerda '{'",
      [TokenType.CHAVE_DIREITA]: "chave direita '}'",
    };
    return translations[type] || type;
  }

  private eat(type: TokenType) {
    if (this.currentToken.type === type) {
      this.previousToken = this.currentToken;
      this.currentToken = this.lexer.getNextToken();
    } else {
      let tokenParaErro = this.currentToken;
      let details = `Esperado \x1b[33m${this.translateTokenName(type)}\x1b[0m, encontrado \x1b[33m${this.translateTokenName(this.currentToken.type)}\x1b[0m`;

      if (type === TokenType.PONTO) {
        details = "Faltou o ponto final (.) ao terminar a linha.";
        // Se faltou o ponto, o erro provavelmente é na linha do token anterior
        tokenParaErro = this.previousToken;
      }

      throw new Error(this.formatError("Erro Sintático", details, tokenParaErro));
    }
  }

  //   Verifica se o identificador é válido
  private checkValidIdentifier(token: Token) {
    const reservedKeywords = [
      TokenType.VAR,
      TokenType.EXIBIR,
      TokenType.INTEIRO,
      TokenType.REAL,
      TokenType.NATURAL,
      TokenType.TEXTO,
      TokenType.LOGICO,
      TokenType.SE,
      TokenType.SENAO,
      TokenType.VERDADEIRO,
      TokenType.FALSO,
      TokenType.ENQUANTO,
      TokenType.FACA,
      TokenType.PARA,
      TokenType.INSERIR,
      TokenType.RAIZ,
      TokenType.EXPOENTE,
      TokenType.CONTINUAR,
      TokenType.PARAR,
      TokenType.E,
      TokenType.OU,
      TokenType.NAO,
    ];
    if (token.type !== TokenType.IDENTIFICADOR) {
      const errorMsg = reservedKeywords.includes(token.type)
        ? "Palavra reservada não pode ser usada como identificador"
        : "Identificador esperado após VAR";
      throw new Error(this.formatError("Declaração incompleta", errorMsg));
    }
  }

  //   Verifica se o tipo da variável é compatível com o valor atribuído
  private validateVariableType(varTypeToken: Token, value: ASTNode) {
    // Valor é uma chamada de função
    if (value.type === "CallExpression") {
      const func = this.functionTable[value.callee]; // busca a função declarada
      if (!func) {
        throw new Error(
          this.formatError(
            "Erro de Tipo",
            `Função '${value.callee}' não declarada.`,
            varTypeToken,
          ),
        );
      }
      if (func.returnType !== varTypeToken.type) {
        throw new Error(
          this.formatError(
            "Erro de Tipo",
            `Variável do tipo ${varTypeToken.type} não pode receber retorno da função '${value.callee}' do tipo ${func.returnType}`,
            varTypeToken,
          ),
        );
      }
      return; // tudo certo
    }

    // Valor literal existente
    if (
      varTypeToken.type === TokenType.LOGICO &&
      value.type !== "BooleanLiteral"
    ) {
      throw new Error(
        this.formatError(
          "Erro de Tipo (LOGICO)",
          `Variável do tipo LOGICO deve receber VERDADEIRO ou FALSO. Encontrado: ${this.translateTypeName(value.type)}`,
          varTypeToken,
        ),
      );
    }

    if (
      varTypeToken.type === TokenType.NATURAL &&
      value.type === "UnaryExpression" &&
      value.operator === "-"
    ) {
      throw new Error(
        this.formatError(
          "Erro de Tipo (NATURAL)",
          "Variável do tipo NATURAL não pode receber número negativo.",
          varTypeToken,
        ),
      );
    }
  }

  /* ==================== EXPRESSÕES ==================== */

  //   Análise de fatores, termos e expressões
  private factor(): ASTNode {
    const token = this.currentToken;

    if (token.type === TokenType.MENOS) {
      this.eat(TokenType.MENOS);
      return {
        type: "UnaryExpression",
        operator: "-",
        argument: this.factor(),
        linha: token.linha,
        coluna: token.coluna,
      };
    }
    // Operador de negação lógica
    if (token.type === TokenType.NAO) {
      this.eat(TokenType.NAO);
      return {
        type: "UnaryLogicalExpression",
        operator: "NAO",
        argument: this.factor(),
        linha: token.linha,
        coluna: token.coluna,
      };
    }

    if (token.type === TokenType.INTEIRO || token.type === TokenType.REAL) {
      this.eat(token.type);
      return {
        type: "NumberLiteral",
        value: Number(token.value.replace(",", ".")),
        numberType: token.type,
        linha: token.linha,
        coluna: token.coluna,
      };
    }

    if (token.type === TokenType.TEXTO) {
      this.eat(TokenType.TEXTO);
      return {
        type: "StringLiteral",
        value: token.value,
        linha: token.linha,
        coluna: token.coluna,
      };
    }

    if (token.type === TokenType.VERDADEIRO || token.type === TokenType.FALSO) {
      this.eat(token.type);
      return {
        type: "BooleanLiteral",
        value: token.type === TokenType.VERDADEIRO,
        linha: token.linha,
        coluna: token.coluna,
      };
    }

    if (token.type === TokenType.PARENTESE_ESQUERDO)
      return this.parenthesizedExpr();
    if (token.type === TokenType.IDENTIFICADOR) {
      const nextToken = this.lexer.peekNextToken(); // olhar o próximo token
      if (nextToken.type === TokenType.PARENTESE_ESQUERDO) {
        return this.parseCallExpression(); // chama função
      }

      this.eat(TokenType.IDENTIFICADOR);
      let node: ASTNode = {
        type: "IDENTIFICADOR",
        name: token.value,
        linha: token.linha,
        coluna: token.coluna,
      };

      while (this.currentToken.type === TokenType.COLCHETE_ESQUERDO) {
        this.eat(TokenType.COLCHETE_ESQUERDO);
        const index = this.expr();
        this.eat(TokenType.COLCHETE_DIREITO);
        node = {
          type: "IndexAccess",
          object: node,
          index,
          linha: token.linha,
          coluna: token.coluna,
        };
      }

      return node;
    }

    if (token.type === TokenType.COLCHETE_ESQUERDO) {
      return this.parseListLiteral();
    }

    if (token.type === TokenType.RAIZ || token.type === TokenType.EXPOENTE) {
      return this.CalcStatement();
    }

    if (token.type === TokenType.EOF)
      throw new Error(
        this.formatError(
          "Operador sem operando",
          "Operador sem operando à direita",
        ),
      );

    throw new Error(
      this.formatError(
        "Fator Inválido",
        `Token inesperado: ${this.translateTokenName(token.type)}`,
      ),
    );
  }

  private term(): ASTNode {
    let node = this.factor();
    while (
      this.currentToken.type === TokenType.MULTIPLICACAO ||
      this.currentToken.type === TokenType.BARRA
    ) {
      const operatorToken = this.currentToken;
      const operator = operatorToken.type;
      this.eat(operator);
      node = {
        type: "BinaryExpression",
        operator: operator === TokenType.MULTIPLICACAO ? "*" : "/",
        left: node,
        right: this.factor(),
        linha: operatorToken.linha,
        coluna: operatorToken.coluna,
      };
    }
    return node;
  }

  private expr(): ASTNode {
    let node = this.term();
    while (
      this.currentToken.type === TokenType.MAIS ||
      this.currentToken.type === TokenType.MENOS
    ) {
      const operatorToken = this.currentToken;
      const operator = operatorToken.type;
      this.eat(operator);
      node = {
        type: "BinaryExpression",
        operator: operator === TokenType.MAIS ? "+" : "-",
        left: node,
        right: this.term(),
        linha: operatorToken.linha,
        coluna: operatorToken.coluna,
      };
    }
    return node;
  }
  // Expressão lógica
  private logicalExpr(): ASTNode {
    let left = this.expr();

    if (
      [
        TokenType.IGUALDADE,
        TokenType.DIFERENTE_DE,
        TokenType.MAIOR_QUE,
        TokenType.MENOR_QUE,
        TokenType.MAIOR_OU_IGUAL,
        TokenType.MENOR_OU_IGUAL,
      ].includes(this.currentToken.type)
    ) {
      const operatorToken = this.currentToken;
      this.eat(operatorToken.type);
      const right = this.expr();

      return {
        type: "LogicalExpression",
        operator: operatorToken.value,
        left,
        right,
        linha: operatorToken.linha,
        coluna: operatorToken.coluna,
      };
    }

    return left;
  }

  private logicalAnd(): ASTNode {
    let node = this.logicalExpr();

    while (this.currentToken.type === TokenType.E) {
      const operatorToken = this.currentToken;
      this.eat(TokenType.E);

      node = {
        type: "LogicalExpression",
        operator: "E",
        left: node,
        right: this.logicalExpr(),
        linha: operatorToken.linha,
        coluna: operatorToken.coluna,
      };
    }

    return node;
  }

  private logicalOr(): ASTNode {
    let node = this.logicalAnd();

    while (this.currentToken.type === TokenType.OU) {
      const operatorToken = this.currentToken;
      this.eat(TokenType.OU);

      node = {
        type: "LogicalExpression",
        operator: "OU",
        left: node,
        right: this.logicalAnd(),
        linha: operatorToken.linha,
        coluna: operatorToken.coluna,
      };
    }

    return node;
  }

  // Retornar um valor
  private parseReturnStatement(): ASTNode {
    const token = this.currentToken;
    this.eat(TokenType.RETORNAR);
    let expression = null;
    if (this.currentToken.type !== TokenType.PONTO) {
      // expression = this.expr();
      expression = this.logicalOr();
    }
    if (expression) {
      this.validateVariableType(token, expression);
    }
    this.eat(TokenType.PONTO);

    return {
      type: "ReturnStatement",
      expression,
      linha: token.linha,
      coluna: token.coluna,
    };
  }
  // Funcao

  private parseFunctionParameters(): { name: string; type: string }[] {
    const params: { name: string; type: string }[] = [];

    if (this.currentToken.type !== TokenType.PARENTESE_DIREITO) {
      while (true) {
        // 1. Tipo do parâmetro
        const typeToken = this.currentToken;
        const validTypes = [
          TokenType.INTEIRO,
          TokenType.REAL,
          TokenType.NATURAL,
          TokenType.TEXTO,
          TokenType.LOGICO,
          TokenType.VECTOR,
        ];
        if (!validTypes.includes(typeToken.type)) {
          throw new Error(
            this.formatError(
              "Tipo de Parâmetro Inválido",
              `Tipo '${typeToken.value}' não é permitido como parâmetro.`,
              typeToken,
            ),
          );
        }
        this.eat(typeToken.type);

        this.eat(TokenType.DOIS_PONTOS);
        const nameToken = this.currentToken;
        this.eat(TokenType.IDENTIFICADOR);
        params.push({
          name: nameToken.value,
          type: typeToken.type,
        });
        if (this.currentToken.type === TokenType.VIRGULA) {
          this.eat(TokenType.VIRGULA);
        } else {
          break;
        }
      }
    }

    return params;
  }

  private parseFunctionStatement(): ASTNode {
    this.eat(TokenType.FUNCAO);

    // Tipo de retorno da função
    const typeToken = this.currentToken;
    const validTypes = [
      TokenType.INTEIRO,
      TokenType.REAL,
      TokenType.NATURAL,
      TokenType.TEXTO,
      TokenType.LOGICO,
      TokenType.VAZIA, // para funções sem retorno
    ];

    if (!validTypes.includes(typeToken.type)) {
      throw new Error(
        this.formatError(
          "Tipo de Retorno Inválido",
          `Tipo '${typeToken.value}' não é permitido como retorno de função.`,
          typeToken,
        ),
      );
    }

    const returnType = typeToken.type; // guarda o tipo de retorno
    this.eat(typeToken.type); // consome o token do tipo

    // Nome da função
    const nameToken = this.currentToken;
    this.eat(TokenType.IDENTIFICADOR);

    // Parâmetros
    this.eat(TokenType.PARENTESE_ESQUERDO);
    const params = this.parseFunctionParameters();
    this.eat(TokenType.PARENTESE_DIREITO);

    // Corpo da função
    this.eat(TokenType.CHAVE_ESQUERDA);
    const body = this.parseBlock(TokenType.CHAVE_DIREITA);
    this.eat(TokenType.CHAVE_DIREITA);

    // Armazena a função na tabela de símbolos
    this.functionTable[nameToken.value] = {
      returnType,
      parameters: params,
    };

    return {
      type: "FunctionDeclaration",
      name: nameToken.value,
      parameters: params,
      returnType,
      body,
      linha: nameToken.linha,
      coluna: nameToken.coluna,
    };
  }

  // Detecta se é uma chamada de função
  private parseCallExpression(): ASTNode {
    const calleeToken = this.currentToken;
    this.eat(TokenType.IDENTIFICADOR);

    this.eat(TokenType.PARENTESE_ESQUERDO);
    const args: ASTNode[] = [];

    if (this.currentToken.type !== TokenType.PARENTESE_DIREITO) {
      args.push(this.expr());
      while (this.currentToken.type === TokenType.VIRGULA) {
        this.eat(TokenType.VIRGULA);
        args.push(this.expr());
      }
    }

    this.eat(TokenType.PARENTESE_DIREITO);

    // Validação de argumentos
    const func = this.functionTable[calleeToken.value];
    if (!func) {
      throw new Error(
        this.formatError(
          "Erro de Tipo",
          `Função '${calleeToken.value}' não declarada`,
          calleeToken,
        ),
      );
    }

    if (args.length !== func.parameters.length) {
      throw new Error(
        this.formatError(
          "Erro de Tipo",
          `Função '${calleeToken.value}' espera ${func.parameters.length} argumentos, recebidos ${args.length}`,
          calleeToken,
        ),
      );
    }

    // Checagem de tipo de cada argumento
    for (let i = 0; i < args.length; i++) {
      const parameter = func.parameters[i];
      if (!parameter) {
        throw new Error(
          this.formatError(
            "Erro de Tipo",
            `Função '${calleeToken.value}' não possui parâmetro no índice ${i}`,
            calleeToken,
          ),
        );
      }
      const expectedType = parameter.type as TokenType;
      const arg = args[i];
      if (!arg) {
        throw new Error(
          this.formatError(
            "Erro de Tipo",
            `Função '${calleeToken.value}', argumento '${parameter.name}' ausente`,
            calleeToken,
          ),
        );
      }
      try {
        this.validateVariableType(
          {
            type: expectedType,
            linha: calleeToken.linha,
            coluna: calleeToken.coluna,
          } as Token,
          arg,
        );
      } catch (err) {
        throw new Error(
          this.formatError(
            "Erro de Tipo",
            `Função '${calleeToken.value}', argumento '${parameter.name}' inválido: ${err instanceof Error ? err.message : String(err)}`,
            calleeToken,
          ),
        );
      }
    }

    return {
      type: "CallExpression",
      callee: calleeToken.value,
      arguments: args,
      linha: calleeToken.linha,
      coluna: calleeToken.coluna,
    };
  }

  // selecçao multipla
  private parseSwitchStatement(): ASTNode {
    this.eat(TokenType.ESCOLHA);
    this.eat(TokenType.PARENTESE_ESQUERDO);

    const control = this.expr(); // valor base do switch, usado se você quiser casos literais simples
    this.eat(TokenType.PARENTESE_DIREITO);
    this.eat(TokenType.CHAVE_ESQUERDA);

    const cases: { condition: ASTNode; body: ASTNode[] }[] = [];
    let defaultCase: ASTNode[] | undefined;
    const caseValues = new Set<any>();
    let defaultFound = false;

    while (this.currentToken.type !== TokenType.CHAVE_DIREITA) {
      if (this.currentToken.type === TokenType.CASO) {
        cases.push(this.parseCaseStatement(caseValues));
      } else if (this.currentToken.type === TokenType.PADRAO) {
        if (defaultFound)
          throw new Error(
            this.formatError(
              "Erro de Switch",
              "PADRAO só pode ser declarado uma vez",
            ),
          );
        defaultFound = true;
        defaultCase = this.parseDefaultStatement();
      } else {
        throw new Error(
          this.formatError("Erro de Switch", "Esperado CASO ou PADRAO"),
        );
      }
    }

    this.eat(TokenType.CHAVE_DIREITA);

    return {
      type: "SwitchStatement",
      control,
      cases,
      defaultCase,
    };
  }

  // Análise de casos dentro do switch
  private parseCaseStatement(existingValues: Set<any>): {
    condition: ASTNode;
    body: ASTNode[];
  } {
    this.eat(TokenType.CASO);

    // PARA QUALQUER EXPRESSAO LOGICA
    const exprNode = this.logicalOr();

    // Se for literal, salvamos o valor para evitar valores duplicados
    if (
      exprNode.type === "NumberLiteral" ||
      exprNode.type === "StringLiteral" ||
      exprNode.type === "BooleanLiteral"
    ) {
      const literalValue = exprNode.value;
      if (existingValues.has(literalValue))
        throw new Error(`Case '${literalValue}' duplicado`);
      existingValues.add(literalValue);
    }

    this.eat(TokenType.DOIS_PONTOS);

    const body: ASTNode[] = [];
    while (
      ![TokenType.CASO, TokenType.PADRAO, TokenType.CHAVE_DIREITA].includes(
        this.currentToken.type,
      )
    ) {
      body.push(this.statement());
    }

    return { condition: exprNode, body };
  }

  // Análise do caso padrão dentro do switch
  private parseDefaultStatement(): ASTNode[] {
    this.eat(TokenType.PADRAO);
    this.eat(TokenType.DOIS_PONTOS);

    const body: ASTNode[] = [];
    while (this.currentToken.type !== TokenType.CHAVE_DIREITA) {
      body.push(this.statement());
    }

    return body;
  }

  //   Análise de expressões entre parênteses
  private parenthesizedExpr(): ASTNode {
    this.eat(TokenType.PARENTESE_ESQUERDO);
    // const node = this.expr();
    const node = this.logicalOr();
    this.eat(TokenType.PARENTESE_DIREITO);
    return node;
  }

  /* ==================== BLOCOS E COMANDOS ==================== */

  //   Análise de blocos de código ()
  private parseBlock(endToken: TokenType): ASTNode[] {
    const nodes: ASTNode[] = [];
    // Verifica se o bloco está vazio
    while (this.currentToken.type !== endToken) nodes.push(this.statement());
    return nodes;
  }

  //   Declaração de variáveis
  private parseVariableDeclaration(expectDot: boolean = true): ASTNode {
    const varToken = this.currentToken;
    this.eat(TokenType.VAR);

    const idToken = this.currentToken;
    this.checkValidIdentifier(idToken);
    const id = idToken.value;
    this.eat(TokenType.IDENTIFICADOR);

    let value: ASTNode | null = null;

    // Se houver '=' para atribuição, processa a expressão
    if (this.currentToken.type === TokenType.ATRIBUICAO) {
      this.eat(TokenType.ATRIBUICAO);
      value = this.expr();
    }

    // Consome ':' e verifica o tipo da variável
    this.eat(TokenType.DOIS_PONTOS);
    const varTypeToken = this.currentToken;
    const validTypes = [
      TokenType.INTEIRO,
      TokenType.REAL,
      TokenType.NATURAL,
      TokenType.TEXTO,
      TokenType.LOGICO,
      TokenType.VECTOR,
    ];

    if (!validTypes.includes(varTypeToken.type)) {
      throw new Error(
        this.formatError(
          "Tipo de Variável Não Declarado",
          `Tipo da variável ${id} inválido`,
          varTypeToken,
        ),
      );
    }

    // Se houver valor atribuído, valida compatibilidade
    if (value) {
      this.validateVariableType(varTypeToken, value);
    }

    this.eat(varTypeToken.type);
    if (expectDot) {
      this.eat(TokenType.PONTO); // consome o ponto final se necessário
    }

    return {
      type: "VariableDeclaration",
      id,
      value, // null se não houver atribuição
      varType: varTypeToken.type,
      linha: varToken.linha,
      coluna: varToken.coluna,
    };
  }

  private parseAssignment(
    expectDot: boolean = true,
    targetNode?: ASTNode,
  ): ASTNode {
    const idToken = targetNode
      ? {
        linha: targetNode.linha,
        coluna: targetNode.coluna,
        value: (targetNode as any).id || (targetNode as any).name,
      }
      : this.currentToken;

    let target: ASTNode;
    if (targetNode) {
      target = targetNode;
    } else {
      const name = idToken.value;
      this.eat(TokenType.IDENTIFICADOR);
      target = { type: "IDENTIFICADOR", name };
      if (idToken.linha) target.linha = idToken.linha;
      if (idToken.coluna) target.coluna = idToken.coluna;
    }

    const operatorToken = this.currentToken;
    const operator = operatorToken.type;

    let node: ASTNode;

    if (
      operator === TokenType.INCREMENTO ||
      operator === TokenType.DECREMENTO
    ) {
      this.eat(operator);
      node = {
        type: "UpdateStatement",
        target,
        operator: operator === TokenType.INCREMENTO ? "++" : "--",
      };
      if (idToken.linha) node.linha = idToken.linha;
      if (idToken.coluna) node.coluna = idToken.coluna;
    } else if (
      operator === TokenType.MAIS_IGUAL ||
      operator === TokenType.MENOS_IGUAL
    ) {
      this.eat(operator);
      const value = this.expr();
      node = {
        type: "UpdateStatement",
        target,
        operator: operator === TokenType.MAIS_IGUAL ? "+=" : "-=",
        value,
      };
      if (idToken.linha) node.linha = idToken.linha;
      if (idToken.coluna) node.coluna = idToken.coluna;
    } else {
      this.eat(TokenType.ATRIBUICAO);
      const value = this.expr();
      node = {
        type: "Assignment",
        target,
        value,
      };
      if (idToken.linha) node.linha = idToken.linha;
      if (idToken.coluna) node.coluna = idToken.coluna;
    }

    if (expectDot) {
      this.eat(TokenType.PONTO); // só consome ponto se necessário
    }

    return node;
  }

  private parsePrintStatement(): ASTNode {
    const exibirToken = this.currentToken;
    this.eat(TokenType.EXIBIR);
    this.eat(TokenType.PARENTESE_ESQUERDO);

    const args: ASTNode[] = [];

    // Pelo menos um argumento
    args.push(this.parsePrintArgument());

    // Zero ou mais , argumento
    while (this.currentToken.type === TokenType.VIRGULA) {
      this.eat(TokenType.VIRGULA);
      args.push(this.parsePrintArgument());
    }

    this.eat(TokenType.PARENTESE_DIREITO);
    this.eat(TokenType.PONTO);

    return {
      type: "PrintStatement",
      arguments: args,
      linha: exibirToken.linha,
      coluna: exibirToken.coluna,
    };
  }
  private parsePrintArgument(): ASTNode {
    // Se for texto literal, mantém
    if (this.currentToken.type === TokenType.TEXTO) {
      const value = this.currentToken.value;
      this.eat(TokenType.TEXTO);
      return { type: "StringLiteral", value };
    }

    // Caso seja um identificador, pode ser variável ou função
    if (this.currentToken.type === TokenType.IDENTIFICADOR) {
      const nextToken = this.lexer.peekNextToken();
      if (nextToken.type === TokenType.PARENTESE_ESQUERDO) {
        return this.parseCallExpression(); // reconhece chamada de função
      } else {
        const nameToken = this.currentToken;
        this.eat(TokenType.IDENTIFICADOR);
        return {
          type: "IDENTIFICADOR",
          name: nameToken.value,
          linha: nameToken.linha,
          coluna: nameToken.coluna,
        };
      }
    }

    // Qualquer outra expressão (operações, números, etc.)
    return this.expr();
  }

  private parseListLiteral(): ASTNode {
    const startToken = this.currentToken;
    this.eat(TokenType.COLCHETE_ESQUERDO);
    const elements: ASTNode[] = [];

    if (this.currentToken.type !== TokenType.COLCHETE_DIREITO) {
      elements.push(this.expr());
      while (this.currentToken.type === TokenType.VIRGULA) {
        this.eat(TokenType.VIRGULA);
        elements.push(this.expr());
      }
    }

    this.eat(TokenType.COLCHETE_DIREITO);

    return {
      type: "ListLiteral",
      elements,
      linha: startToken.linha,
      coluna: startToken.coluna,
    };
  }

  /* ==================== WEB COMPONENTS ==================== */

  private parseObjectLiteral(): ASTNode {
    const obj: { [key: string]: ASTNode } = {};
    while (
      this.currentToken.type !== TokenType.CHAVE_DIREITA &&
      this.currentToken.type !== TokenType.EOF
    ) {
      const keyToken = this.currentToken;
      const key = keyToken.value;
      this.eat(TokenType.IDENTIFICADOR);
      this.eat(TokenType.DOIS_PONTOS);
      const value = this.expr();
      obj[key] = value;
      if (this.currentToken.type === TokenType.VIRGULA) {
        this.eat(TokenType.VIRGULA);
      }
    }
    return {
      type: "ObjectLiteral",
      properties: obj,
    };
  }

  private parseTag(): ASTNode {
    const startToken = this.currentToken;
    this.eat(TokenType.MENOR_QUE);

    const tagName = this.currentToken.value;
    this.eat(TokenType.IDENTIFICADOR);

    let properties: ASTNode | null = null;
    // Se o próximo token for 'propriedades' ou se parecer com um atributo
    if (this.currentToken.value === "propriedades") {
      this.eat(TokenType.IDENTIFICADOR);
      this.eat(TokenType.ATRIBUICAO);
      this.eat(TokenType.CHAVE_ESQUERDA);
      properties = this.parseObjectLiteral();
      this.eat(TokenType.CHAVE_DIREITA);
    }

    // Tag auto-fechada: <tag />
    if (this.currentToken.type === TokenType.BARRA) {
      this.eat(TokenType.BARRA);
      this.eat(TokenType.MAIOR_QUE);
      return {
        type: "WebTag",
        tagName,
        properties,
        children: [],
        linha: startToken.linha,
        coluna: startToken.coluna,
      };
    }

    this.eat(TokenType.MAIOR_QUE);

    const children: ASTNode[] = [];
    // Enquanto não encontrar </
    while (
      this.currentToken.type !== TokenType.EOF &&
      !(
        this.currentToken.type === TokenType.MENOR_QUE &&
        this.lexer.peekNextToken().type === TokenType.BARRA
      )
    ) {
      if (this.currentToken.type === TokenType.TEXTO) {
        const textToken = this.currentToken;
        children.push({
          type: "StringLiteral",
          value: textToken.value,
          linha: textToken.linha,
          coluna: textToken.coluna,
        });
        this.eat(TokenType.TEXTO);
      } else if (this.currentToken.type === TokenType.CHAVE_ESQUERDA) {
        this.eat(TokenType.CHAVE_ESQUERDA);
        children.push(this.expr());
        this.eat(TokenType.CHAVE_DIREITA);
      } else {
        children.push(this.statement());
      }
    }

    this.eat(TokenType.MENOR_QUE);
    this.eat(TokenType.BARRA);
    const endTagName = this.currentToken.value;
    if (endTagName !== tagName) {
      throw new Error(
        this.formatError(
          "Erro Sintático",
          `Tag de fechamento esperada </${tagName}>, encontrada </${endTagName}>`,
        ),
      );
    }
    this.eat(TokenType.IDENTIFICADOR);
    this.eat(TokenType.MAIOR_QUE);

    return {
      type: "WebTag",
      tagName,
      properties,
      children,
      linha: startToken.linha,
      coluna: startToken.coluna,
    };
  }

  // Comandos de controle de fluxo
  // Comando PARAR
  private BreakStatement(): ASTNode {
    const breakToken = this.currentToken;
    this.eat(TokenType.PARAR);
    this.eat(TokenType.PONTO);

    return {
      type: "BreakStatement",
      linha: breakToken.linha,
      coluna: breakToken.coluna,
    };
  }
  // Comando CONTINUAR
  private parseContinueStatement(): ASTNode {
    const token = this.currentToken;
    this.eat(TokenType.CONTINUAR);
    this.eat(TokenType.PONTO);

    return {
      type: "ContinueStatement",
      linha: token.linha,
      coluna: token.coluna,
    };
  }

  private seStatement(): ASTNode {
    // Consome o 'SE'
    this.eat(TokenType.SE);

    // Consome '(' e processa a condição
    this.eat(TokenType.PARENTESE_ESQUERDO);
    const condition = this.logicalOr();
    this.eat(TokenType.PARENTESE_DIREITO);

    // Consome '{' e processa o bloco verdadeiro
    this.eat(TokenType.CHAVE_ESQUERDA);
    const trueBranch = this.parseBlock(TokenType.CHAVE_DIREITA);
    this.eat(TokenType.CHAVE_DIREITA);

    let falseBranch: ASTNode | ASTNode[] | null = null;

    // Verifica se existe 'SENAO' após o bloco verdadeiro
    if (this.currentToken.type === TokenType.SENAO) {
      this.eat(TokenType.SENAO);

      if ((this.currentToken.type as TokenType) === TokenType.SE) {
        // Caso "SENAO SE": chama recursivamente seStatement
        falseBranch = this.seStatement();
      } else if (
        (this.currentToken.type as TokenType) === TokenType.CHAVE_ESQUERDA
      ) {
        // Caso "SENAO { ... }": consome o bloco do SENAO
        this.eat(TokenType.CHAVE_ESQUERDA);
        falseBranch = this.parseBlock(TokenType.CHAVE_DIREITA);
        this.eat(TokenType.CHAVE_DIREITA);
      } else {
        // Senão válido: erro de sintaxe
        throw new Error(
          this.formatError("Erro Sintático", "Esperado SE ou '{' após SENAO"),
        );
      }
    }

    return {
      type: "IfStatement",
      condition,
      trueBranch,
      falseBranch,
    };
  }

  private parseInputStatement(): ASTNode {
    const inserirToken = this.currentToken;

    // INSERIR
    this.eat(TokenType.INSERIR);

    // (
    this.eat(TokenType.PARENTESE_ESQUERDO);

    let promptMessage: string | null = null;
    let id: string;

    // CASO 1: INSERIR("texto", id)
    if (this.currentToken.type === TokenType.TEXTO) {
      promptMessage = this.currentToken.value;
      this.eat(TokenType.TEXTO);

      this.eat(TokenType.VIRGULA);

      if ((this.currentToken.type as TokenType) !== TokenType.IDENTIFICADOR) {
        throw new Error(
          this.formatError(
            "Erro Sintático",
            "Esperado um identificador após a vírgula em INSERIR",
          ),
        );
      }

      id = this.currentToken.value;
      this.eat(TokenType.IDENTIFICADOR);
    }

    // CASO 2: INSERIR(id)
    else if (this.currentToken.type === TokenType.IDENTIFICADOR) {
      id = this.currentToken.value;
      this.eat(TokenType.IDENTIFICADOR);
    }

    // ERRO
    else {
      throw new Error(
        this.formatError(
          "Erro Sintático",
          "Esperado IDENTIFICADOR ou TEXTO em INSERIR(...)",
        ),
      );
    }

    // )
    this.eat(TokenType.PARENTESE_DIREITO);

    // .
    this.eat(TokenType.PONTO);

    return {
      type: "InputStatement",
      id,
      promptMessage,
      linha: inserirToken.linha,
      coluna: inserirToken.coluna,
    };
  }

  // Estrutura de repetição ENQUANTO
  private parseWhileStatement(): ASTNode {
    const enquantoToken = this.currentToken;
    this.eat(TokenType.ENQUANTO);
    this.eat(TokenType.PARENTESE_ESQUERDO);
    const condition = this.logicalOr();

    this.eat(TokenType.PARENTESE_DIREITO);
    this.eat(TokenType.CHAVE_ESQUERDA);
    const body = this.parseBlock(TokenType.CHAVE_DIREITA);
    this.eat(TokenType.CHAVE_DIREITA);

    return {
      type: "WhileStatement",
      condition,
      body,
      linha: enquantoToken.linha,
      coluna: enquantoToken.coluna,
    };
  }
  // Estrutura de repetição PARA
  private parseForStatement(): ASTNode {
    const paraToken = this.currentToken;
    this.eat(TokenType.PARA);
    this.eat(TokenType.PARENTESE_ESQUERDO);

    // Inicialização (VAR ... ou atribuição)
    let init: ASTNode;
    if (this.currentToken.type === TokenType.VAR) {
      // Se declarar uma variável com VAR, consome o ponto final normalmente
      init = this.parseVariableDeclaration(false);
    } else if (this.currentToken.type === TokenType.IDENTIFICADOR) {
      // Se for só atribuição dentro do FOR, não consome ponto
      init = this.parseAssignment(false);
    } else {
      throw new Error(
        this.formatError("Erro Sintático", "Esperado inicialização do FOR"),
      );
    }

    // Condição
    this.eat(TokenType.PONTO_E_VIRGULA); // separador
    const condition = this.logicalOr();

    // Incremento
    this.eat(TokenType.PONTO_E_VIRGULA); // separador
    let increment: ASTNode;
    if (this.currentToken.type === TokenType.IDENTIFICADOR) {
      // Também não consome ponto no incremento
      increment = this.parseAssignment(false);
    } else {
      throw new Error(
        this.formatError("Erro Sintático", "Esperado incremento do FOR"),
      );
    }

    this.eat(TokenType.PARENTESE_DIREITO);

    // Corpo do loop
    this.eat(TokenType.CHAVE_ESQUERDA);
    const body = this.parseBlock(TokenType.CHAVE_DIREITA);
    this.eat(TokenType.CHAVE_DIREITA);

    return {
      type: "ForStatement",
      init,
      condition,
      increment,
      body,
      linha: paraToken.linha,
      coluna: paraToken.coluna,
    };
  }

  // Estrutura de repetição FACA...ENQUANTO (a implementar)
  private parseDoWhileStatement(): ASTNode {
    const facaToken = this.currentToken;
    this.eat(TokenType.FACA);

    // Bloco do FACA
    this.eat(TokenType.CHAVE_ESQUERDA);
    const body = this.parseBlock(TokenType.CHAVE_DIREITA);
    this.eat(TokenType.CHAVE_DIREITA); // consome o '}'

    // Após o bloco, o próximo token deve ser ENQUANTO
    if (this.currentToken.type !== TokenType.ENQUANTO) {
      throw new Error(
        this.formatError(
          "Erro Sintático",
          "Esperado ENQUANTO após o bloco de FACA",
        ),
      );
    }
    this.eat(TokenType.ENQUANTO);

    this.eat(TokenType.PARENTESE_ESQUERDO);
    const condition = this.logicalExpr();
    this.eat(TokenType.PARENTESE_DIREITO);
    this.eat(TokenType.PONTO);

    return {
      type: "DoWhileStatement",
      body,
      condition,
      linha: facaToken.linha,
      coluna: facaToken.coluna,
    };
  }

  private CalcStatement(): ASTNode {
    const calcToken = this.currentToken;
    const args: ASTNode[] = [];

    if (this.currentToken.type === TokenType.RAIZ) {
      this.eat(TokenType.RAIZ);
      this.eat(TokenType.PARENTESE_ESQUERDO);

      // Primeiro argumento: pode ser uma expressão
      args.push(this.expr());

      this.eat(TokenType.VIRGULA);

      // Segundo argumento: pode ser uma expressão
      args.push(this.expr());

      this.eat(TokenType.PARENTESE_DIREITO);
    } else if (this.currentToken.type === TokenType.EXPOENTE) {
      this.eat(TokenType.EXPOENTE);
      this.eat(TokenType.PARENTESE_ESQUERDO);

      // Primeiro argumento: pode ser uma expressão
      args.push(this.expr());

      this.eat(TokenType.VIRGULA);

      // Segundo argumento: pode ser uma expressão
      args.push(this.expr());

      this.eat(TokenType.PARENTESE_DIREITO);
      // this.eat(TokenType.PONTO);
    } else {
      throw new Error(
        this.formatError("Erro Sintático", "Esperado RAIZ ou EXPOENTE"),
      );
    }

    return {
      type: "CalcStatement",
      operation: calcToken.type, // RAIZ ou EXPOENTE
      arguments: args, // lista de expressões
      linha: calcToken.linha,
      coluna: calcToken.coluna,
    };
  }

  private statement(): ASTNode {
    switch (this.currentToken.type) {
      case TokenType.VAR:
        return this.parseVariableDeclaration();
      case TokenType.MENOR_QUE:
        return this.parseTag();
      case TokenType.EXIBIR:
        return this.parsePrintStatement();
      case TokenType.SE:
        return this.seStatement();
      case TokenType.IDENTIFICADOR:
        const factorNode = this.factor();
        const nextType = this.currentToken.type;

        if (
          [
            TokenType.ATRIBUICAO,
            TokenType.INCREMENTO,
            TokenType.DECREMENTO,
            TokenType.MAIS_IGUAL,
            TokenType.MENOS_IGUAL,
          ].includes(nextType)
        ) {
          return this.parseAssignment(true, factorNode);
        }

        if (factorNode.type === "CallExpression") {
          this.eat(TokenType.PONTO);
          return factorNode;
        }

        throw new Error(
          this.formatError(
            "Comando Inválido",
            `Esperado operador de atribuição ou atualização após expressão`,
          ),
        );

      case TokenType.INSERIR:
        return this.parseInputStatement();

      case TokenType.ENQUANTO:
        return this.parseWhileStatement();

      case TokenType.PARA:
        return this.parseForStatement();
      case TokenType.FACA:
        return this.parseDoWhileStatement();

      case TokenType.PARAR:
        return this.BreakStatement();

      case TokenType.CONTINUAR:
        return this.parseContinueStatement();

      case TokenType.RETORNAR:
        return this.parseReturnStatement();
      case TokenType.RAIZ:
      case TokenType.EXPOENTE:
        return this.CalcStatement();

      case TokenType.FUNCAO:
        return this.parseFunctionStatement();

      case TokenType.ESCOLHA:
        return this.parseSwitchStatement();
      default:
        throw new Error(
          this.formatError(
            "Comando Inválido",
            `Token '${this.currentToken.value}' não pode iniciar um comando. Comandos válidos: VAR, EXIBIR, SE, ATRIBUICAO`,
          ),
        );
    }
  }

  /* ==================== PARSER PRINCIPAL ==================== */
  private synchronize() {
    this.currentToken = this.lexer.getNextToken();

    while (this.currentToken.type !== TokenType.EOF) {
      if (this.currentToken.type === TokenType.PONTO) {
        this.currentToken = this.lexer.getNextToken();
        return;
      }

      switch (this.currentToken.type) {
        case TokenType.VAR:
        case TokenType.EXIBIR:
        case TokenType.SE:
        case TokenType.PARA:
        case TokenType.ENQUANTO:
        case TokenType.FACA:
        case TokenType.FUNCAO:
        case TokenType.RETORNAR:
        case TokenType.INSERIR:
        case TokenType.ESCOLHA:
          return;
      }

      this.currentToken = this.lexer.getNextToken();
    }
  }

  public parse(): ASTNode[] {
    const statements: ASTNode[] = [];
    while (this.currentToken.type !== TokenType.EOF) {
      try {
        statements.push(this.statement());
      } catch (e: any) {
        this.errors.push(e.message);
        this.synchronize();
      }
    }
    return statements;
  }
}

export default Parser;
