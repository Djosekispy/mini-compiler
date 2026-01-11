import { Token, TokenType } from "./ILexer";

/**
 * O Lexer é responsável por transformar o código-fonte (string) em uma sequência de Tokens.
 */
class Lexer {
    private text: string;
    private position: number = 0;
    private linha: number = 1;
    private coluna: number = 1;
    private filename: string;

    constructor(text: string, filename: string = "unknown") {
        this.text = text;
        this.filename = filename;
    }

    /**
     * Retorna o caractere na posição atual sem avançar o ponteiro.
     */
    private peek(): string {
        return this.text[this.position] || "";
    }

    /**
     * Avança a posição do ponteiro no texto.
     */
    private advance() {
        this.position++;
        this.coluna++;
    }

    private avancaLinha() {
        this.position++;
        this.linha++;
        this.coluna = 1;
    }

    /**
     * Analisa o texto e retorna o próximo token encontrado.
     */
    public getNextToken(): Token {
        while (this.position < this.text.length) {
            const char = this.peek();

            // Definição de padrões (espaços, números, varras)
            const isBlankSpace = /\s/;
            const isNumber = /[0-9]/;
            const isWord = /[a-zA-Z]/;

            // Ignorar espaços em branco
            if (isBlankSpace.test(char)) {
                if (char === "\n") {
                    this.avancaLinha();
                } else {
                    this.advance();
                }
                continue;
            }

            const tokenInicioLinha = this.linha;
            const tokenInicioColuna = this.coluna;

            // Mapeamento de caracteres indivuduais para seus respectivos tokens
            if (char === "+") {
                this.advance();
                return { type: TokenType.MAIS, value: "+", linha: tokenInicioLinha, coluna: tokenInicioColuna };
            }
            if (char === "/") {
                this.advance();
                return { type: TokenType.DIVISAO, value: "/", linha: tokenInicioLinha, coluna: tokenInicioColuna };
            }

            if (char === "*") {
                this.advance();
                return { type: TokenType.MULTIPLICACAO, value: "*", linha: tokenInicioLinha, coluna: tokenInicioColuna };
            }

            if (char === "-") {
                this.advance();
                return { type: TokenType.MENOS, value: "-", linha: tokenInicioLinha, coluna: tokenInicioColuna };
            }

            if (char === "=") {
                this.advance();
                return { type: TokenType.ATRIBUICAO, value: "=", linha: tokenInicioLinha, coluna: tokenInicioColuna };
            }

            if (char === ".") {
                this.advance();
                return { type: TokenType.SEMICOLON, value: ";", linha: tokenInicioLinha, coluna: tokenInicioColuna };
            }

            if (char === ":") {
                this.advance();
                return { type: TokenType.DOIS_PONTOS, value: ":", linha: tokenInicioLinha, coluna: tokenInicioColuna };
            }

            if (char === "(") {
                this.advance();
                return { type: TokenType.PARENTES_ESQUERDO, value: ":", linha: tokenInicioLinha, coluna: tokenInicioColuna };
            }
            if (char === ")") {
                this.advance();
                return { type: TokenType.PARENTES_DIREITO, value: ":", linha: tokenInicioLinha, coluna: tokenInicioColuna };
            }

            if (char === '"') {
                this.advance(); // Consome aspas iniciais
                let str = "";
                const startLine = this.linha;
                const startColumn = this.coluna;

                while (this.peek() !== '"' && this.position < this.text.length) {
                    if (this.peek() === '\n') {
                        this.avancaLinha();
                    } else {
                        str += this.peek();
                        this.advance();
                    }
                }

                if (this.peek() === '"') {
                    this.advance(); // Consome aspas finais
                    return { type: TokenType.TEXTO, value: str, linha: startLine, coluna: startColumn };
                } else {
                    throw new Error(
                        `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] String não terminada\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mArquivo:\x1b[0m \x1b[33m${this.filename}\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${startLine}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${startColumn}\x1b[0m`
                    );
                }
            }

            // Capturar números inteiros ou reais(sequência de dígitos)
            if (isNumber.test(char)) {
                let num = "";
                let isReal = false;

                while (isNumber.test(this.peek()) || this.peek() === ",") {
                    if (this.peek() === ",") {
                        if (isReal) {
                            throw new Error(
                                `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] Número real inválido\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mArquivo:\x1b[0m \x1b[33m${this.filename}\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${this.linha}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${this.coluna}\x1b[0m
  - \x1b[36mContexto:\x1b[0m Próximo do identificador '\x1b[33m${num}\x1b[0m'`
                            );
                        }
                        isReal = true;
                        num += ".";
                        this.advance();
                        continue;
                    }
                    num += this.peek();
                    this.advance();
                }

                if (num.endsWith(".")) {
                    throw new Error(
                        `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] Número real inválido\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mArquivo:\x1b[0m \x1b[33m${this.filename}\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${this.linha}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${this.coluna}\x1b[0m
  - \x1b[36mContexto:\x1b[0m O número '\x1b[33m${num.replace('.', ',')}\x1b[0m' não pode terminar com vírgula.`
                    );
                }

                if (/[a-zA-Z]/.test(this.peek())) {
                    throw new Error(
                        `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] Identificador inválido\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mArquivo:\x1b[0m \x1b[33m${this.filename}\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${this.linha}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${this.coluna}\x1b[0m
  - \x1b[36mContexto:\x1b[0m Identificadores não podem começar com números: '\x1b[33m${num}${this.peek()}\x1b[0m...'`
                    );
                }

                return {
                    type: isReal ? TokenType.REAL : TokenType.INTEIRO,
                    value: num,
                    linha: tokenInicioLinha,
                    coluna: tokenInicioColuna
                };
            }

            // Capturar palavras (identificadores ou palavras reservadas)
            if (isWord.test(char)) {
                var word = "";
                // Permite letras, números e underscore após o primeiro caractere
                while (/[a-zA-Z0-9_]/.test(this.peek())) {
                    word += this.peek();
                    this.advance();
                }

                // Verificar se a palavra é uma palavra-chave reservada
                if (word === "VAR") return { type: TokenType.VAR, value: word, linha: tokenInicioLinha, coluna: tokenInicioColuna };
                if (word === "EXIBIR") return { type: TokenType.EXIBIR, value: word, linha: tokenInicioLinha, coluna: tokenInicioColuna };
                if (word === "INTEIRO") return { type: TokenType.INTEIRO, value: word, linha: tokenInicioLinha, coluna: tokenInicioColuna };
                if (word === "REAL") return { type: TokenType.REAL, value: word, linha: tokenInicioLinha, coluna: tokenInicioColuna };
                if (word === "NATURAL") return { type: TokenType.NATURAL, value: word, linha: tokenInicioLinha, coluna: tokenInicioColuna };
                if (word === "TEXTO") return { type: TokenType.TEXTO, value: word, linha: tokenInicioLinha, coluna: tokenInicioColuna };

                // Se não for palavra-chave, é um identificador (nome de variável)
                return { type: TokenType.IDENTIFICADOR, value: word, linha: tokenInicioLinha, coluna: tokenInicioColuna };
            }
            throw new Error(
                `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] Caractere inválido\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mArquivo:\x1b[0m \x1b[33m${this.filename}\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${this.linha}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${this.coluna}\x1b[0m
  - \x1b[36mCaractere:\x1b[0m '\x1b[33m${char}\x1b[0m'`
            );
        }

        // Fim do arquivo atingido
        return { type: TokenType.EOF, value: "", linha: this.linha, coluna: this.coluna };
    }
}

export default Lexer;
