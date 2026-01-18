import { Token, TokenType } from "../lexer/ILexer";
import Lexer from "../lexer/Lexer";
import ASTNode from "./IParser";

class Parser {
    private lexer: Lexer;
    private currentToken: Token;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.currentToken = this.lexer.getNextToken();
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
            this.currentToken = this.lexer.getNextToken();
        } else {
            let details = `Esperado \x1b[33m${this.translateTokenName(type)}\x1b[0m, encontrado \x1b[33m${this.translateTokenName(this.currentToken.type)}\x1b[0m`;
            if (type === TokenType.PONTO)
                details = "Faltou o ponto final (.) ao terminar a linha.";
            throw new Error(this.formatError("Erro Sintático", details));
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

        if (token.type === TokenType.NAO) {
            this.eat(TokenType.NAO);
            return {
                type: "UnaryExpression",
                operator: "!",
                argument: this.factor(),
                linha: token.linha,
                coluna: token.coluna,
            };
        }

        if (token.type === TokenType.PARENTESE_ESQUERDO)
            return this.parenthesizedExpr();
        if (token.type === TokenType.IDENTIFICADOR) {
            this.eat(TokenType.IDENTIFICADOR);
            return {
                type: "IDENTIFICADOR",
                name: token.value,
                linha: token.linha,
                coluna: token.coluna,
            };
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
            this.currentToken.type === TokenType.DIVISAO
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
    // Expressão de comparação (ex: a + b > c)
    private relationalExpr(): ASTNode {
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

    // Operador lógico E (AND)
    private logicalAnd(): ASTNode {
        let node = this.relationalExpr();
        while (this.currentToken.type === TokenType.E) {
            const operatorToken = this.currentToken;
            this.eat(TokenType.E);
            node = {
                type: "LogicalExpression",
                operator: "E",
                left: node,
                right: this.relationalExpr(),
                linha: operatorToken.linha,
                coluna: operatorToken.coluna,
            };
        }
        return node;
    }

    // Operador lógico OU (OR) - Este é o ponto de entrada para expressões lógicas
    private logicalExpr(): ASTNode {
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

    //   Análise de expressões entre parênteses
    private parenthesizedExpr(): ASTNode {
        this.eat(TokenType.PARENTESE_ESQUERDO);
        const node = this.expr();
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
    private parseVariableDeclaration(): ASTNode {
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
        this.eat(TokenType.PONTO);

        return {
            type: "VariableDeclaration",
            id,
            value, // null se não houver atribuição
            varType: varTypeToken.type,
            linha: varToken.linha,
            coluna: varToken.coluna,
        };
    }

    private parseAssignment(): ASTNode {
        const idToken = this.currentToken;
        const varName = idToken.value;
        this.eat(TokenType.IDENTIFICADOR);

        this.eat(TokenType.ATRIBUICAO); // consome '='
        const value = this.expr(); // avalia expressão do lado direito

        this.eat(TokenType.PONTO); // termina com ponto final

        return {
            type: "Assignment",
            id: varName,
            value,
            linha: idToken.linha,
            coluna: idToken.coluna,
        };
    }

    private parsePrintStatement(): ASTNode {
        const exibirToken = this.currentToken;
        // Consome o 'EXIBIR'
        this.eat(TokenType.EXIBIR);

        // Consome '('
        this.eat(TokenType.PARENTESE_ESQUERDO);

        // Verifica se a expressão foi fechada ')'
        if (this.currentToken.type === TokenType.PARENTESE_DIREITO)
            throw new Error(
                this.formatError("Expressão vazia", "Expressão vazia não é permitida"),
            );

        // Processa a expressão dentro dos parênteses
        const value = this.expr();
        // Consome ')'
        this.eat(TokenType.PARENTESE_DIREITO);
        // Termina a instrução com o ponto final
        this.eat(TokenType.PONTO);

        return {
            type: "PrintStatement",
            value,
            linha: exibirToken.linha,
            coluna: exibirToken.coluna,
        };
    }

    private seStatement(): ASTNode {
        // Consome o 'SE'
        this.eat(TokenType.SE);

        // Consome '(' e processa a condição
        this.eat(TokenType.PARENTESE_ESQUERDO);
        const condition = this.logicalExpr();
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

            if (this.currentToken.type as TokenType !== TokenType.IDENTIFICADOR) {
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

    private statement(): ASTNode {
        switch (this.currentToken.type) {
            case TokenType.VAR:
                return this.parseVariableDeclaration();
            case TokenType.EXIBIR:
                return this.parsePrintStatement();
            case TokenType.SE:
                return this.seStatement();
            case TokenType.IDENTIFICADOR:
                // Se o identificador é seguido de '=', é uma atribuição
                if (this.lexer.peekNextToken().type === TokenType.ATRIBUICAO) {
                    return this.parseAssignment();
                }
                throw new Error(
                    this.formatError(
                        "Comando Inválido",
                        `Esperado '=' após ${this.currentToken.value}`,
                    ),
                );

            case TokenType.INSERIR:
                return this.parseInputStatement();
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

    public parse(): ASTNode[] {
        const statements: ASTNode[] = [];
        while (this.currentToken.type !== TokenType.EOF)
            statements.push(this.statement());
        return statements;
    }
}

export default Parser;
