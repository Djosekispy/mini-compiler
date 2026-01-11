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
     * Formata uma mensagem de erro com cores ANSI e informações detalhadas.
     */
    private formatError(errorType: string, details: string, token?: Token): string {
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

    /**
     * Consome o token atual se ele for do tipo esperado, caso contrário, lança um erro.
     */
    private eat(type: TokenType) {
        if (this.currentToken.type === type) {
            this.currentToken = this.lexer.getNextToken();
        } else {
            throw new Error(
                this.formatError(
                    "Erro Sintático",
                    `Esperado \x1b[33m${type}\x1b[0m, encontrado \x1b[33m${this.currentToken.type}\x1b[0m`
                )
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

        if (token.type === TokenType.TEXTO) {
            this.eat(TokenType.TEXTO);
            return {
                type: "StringLiteral",
                value: token.value,
            };
        }


        // Valores lógicos
        //  if (token.type === TokenType.LOGICO) {
        //   this.eat(TokenType.LOGICO);
        //   return {
        //     type: "StringLiteral",
        //     value: token.value,
        //   };
        // }


        // Valores booleanos
        if (token.type === TokenType.VERDADEIRO || token.type === TokenType.FALSO) {
            this.eat(token.type);
            return {
                type: "BooleanLiteral",
                value: token.type === TokenType.VERDADEIRO, // true se VERDADEIRO, false se FALSO
            };
        }

        // Caso: expressão entre parênteses
        if (token.type === TokenType.PARENTES_ESQUERDO) {
            this.eat(TokenType.PARENTES_ESQUERDO);
            const node = this.expr(); // avalia a expressão interna
            this.eat(TokenType.PARENTES_DIREITO);
            return node;
        }

        if (token.type === TokenType.IDENTIFICADOR) {
            this.eat(TokenType.IDENTIFICADOR);
            return { type: "IDENTIFICADOR", name: token.value };
        }

        throw new Error(
            this.formatError(
                "Factor Inválido",
                `Token inesperado: \x1b[33m${token.type}\x1b[0m`
            )
        );
    }

    /**
     * Processa termos (multiplicação e divisão).
     * Gramática: term -> factor ((MULTIPLICACAO | DIVISAO) factor)*
     */
    private term(): ASTNode {
        var node = this.factor();

        while (
            this.currentToken.type === TokenType.MULTIPLICACAO ||
            this.currentToken.type === TokenType.DIVISAO
        ) {
            const operator = this.currentToken.type;
            this.eat(operator);

            node = {
                type: "BinaryExpression",
                operator: operator === TokenType.MULTIPLICACAO ? "*" : "/",
                left: node,
                right: this.factor(),
            };
        }

        return node;
    }

    /**
     * Processa expressões aritméticas respeitando a precedência e associatividade.
     * Gramática: expr -> term ((MAIS | MENOS) term)*
     */
    private expr(): ASTNode {
        var node = this.term();

        while (
            this.currentToken.type === TokenType.MAIS ||
            this.currentToken.type === TokenType.MENOS
        ) {
            const operator = this.currentToken.type;
            this.eat(operator);

            node = {
                type: "BinaryExpression",
                operator: operator === TokenType.MAIS ? "+" : "-",
                left: node,
                right: this.term(),
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
                varType.type === TokenType.NATURAL ||
                varType.type === TokenType.TEXTO ||
                varType.type === TokenType.LOGICO
            ) {
                // Validação de Tipos no Parser (Sintaxe Estendida)
                if (varType.type === TokenType.TEXTO && value.type !== "StringLiteral") {
                    throw new Error(
                        this.formatError(
                            "Erro de Tipo (TEXTO)",
                            `Variável do tipo \x1b[33mTEXTO\x1b[0m deve receber uma string entre aspas. Encontrado: \x1b[33m${value.type}\x1b[0m`,
                            varType
                        )
                    );
                }

                if (varType.type === TokenType.LOGICO && value.type !== "BooleanLiteral") {
                    throw new Error(
                        this.formatError(
                            "Erro de Tipo (LOGICO)",
                            `Variável do tipo \x1b[33mLOGICO\x1b[0m deve receber \x1b[33mVERDADEIRO\x1b[0m ou \x1b[33mFALSO\x1b[0m. Encontrado: \x1b[33m${value.type}\x1b[0m`,
                            varType
                        )
                    );
                }

                if (varType.type === TokenType.NATURAL) {
                    // Checa se é um literal numérico negativo (UnaryExpression com operador -)
                    if (value.type === "UnaryExpression" && value.operator === "-") {
                        throw new Error(
                            this.formatError(
                                "Erro de Tipo (NATURAL)",
                                `Variável do tipo \x1b[33mNATURAL\x1b[0m não pode receber número negativo.`,
                                varType
                            )
                        );
                    }
                }

                this.eat(varType.type);
            } else {
                throw new Error(
                    this.formatError(
                        "Tipo de Variável Inválido",
                        `Tipo \x1b[33m${varType.value}\x1b[0m não é reconhecido. Tipos válidos: \x1b[33mINTEIRO\x1b[0m, \x1b[33mREAL\x1b[0m, \x1b[33mNATURAL\x1b[0m, \x1b[33mTEXTO\x1b[0m, \x1b[33mLOGICO\x1b[0m`,
                        varType
                    )
                );
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
            this.eat(TokenType.PARENTESE_ESQUERDO);

            const value = this.expr();
            this.eat(TokenType.PARENTESE_DIREITO);
            this.eat(TokenType.SEMICOLON);

            return {
                type: "PrintStatement",
                value,
            };
        }
        throw new Error(
            this.formatError(
                "Comando Inválido",
                `Token \x1b[33m${this.currentToken.value}\x1b[0m não pode iniciar um comando. Comandos válidos: \x1b[33mVAR\x1b[0m, \x1b[33mEXIBIR\x1b[0m`
            )
        );
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
