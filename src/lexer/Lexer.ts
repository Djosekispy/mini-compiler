import { Token, TokenType } from "./ILexer";

/**
 * O Lexer é responsável por transformar o código-fonte (string) em uma sequência de Tokens.
 */
class Lexer {
  private text: string;
  private position: number = 0;
  private linha: number = 1;
  private coluna: number = 1;
  public errors: string[] = [];

  constructor(
    text: string,
    public readonly filename: string = "unknown",
  ) {
    this.text = text;
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

  private addError(message: string) {
    this.errors.push(message);
  }

  private peekNext(): string {
    return this.text[this.position + 1] || "";
  }

  /**
   * Retorna o próximo token sem consumir.
   */
  public peekNextToken(): Token {
    // Salva o estado atual
    const savedPosition = this.position;
    const savedLinha = this.linha;
    const savedColuna = this.coluna;

    const token = this.getNextToken(); // pega o próximo token "real"

    // Restaura o estado
    this.position = savedPosition;
    this.linha = savedLinha;
    this.coluna = savedColuna;

    return token;
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

      // Mapeamento de caracteres individuais para seus respectivos tokens
      if (char === "+") {
        this.advance();
        return {
          type: TokenType.MAIS,
          value: "+",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      // Comentários de bloco e divisão
      if (char === "/") {
        // Verifica se é um comentário de bloco /* ... */
        if (this.peekNext() === "*") {
          const commentStartLine = this.linha;
          const commentStartColumn = this.coluna;

          this.advance(); // Consome '/'
          this.advance(); // Consome '*'

          let closed = false;
          // Procura pelo fechamento */
          while (this.position < this.text.length) {
            if (this.peek() === "*" && this.peekNext() === "/") {
              this.advance(); // Consome '*'
              this.advance(); // Consome '/'
              closed = true;
              break; // Sai do loop de comentário
            }

            if (this.peek() === "\n") {
              this.avancaLinha();
            } else {
              this.advance();
            }
          }

          // Se chegou aqui e o comentário não foi fechado (EOF), adiciona erro
          if (!closed) {
            this.addError(
              `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] Comentário em bloco não fechado\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mArquivo:\x1b[0m \x1b[33m${this.filename}\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${commentStartLine}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${commentStartColumn}\x1b[0m
  - \x1b[36mContexto:\x1b[0m Comentário iniciado com /* mas não terminado com */`,
            );
          }
          continue; // Ignora o comentário e continua a procurar o próximo token
        }

        // Se não for comentário, é operador de divisão
        this.advance();
        return {
          type: TokenType.DIVISAO,
          value: "/",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      if (char === "*") {
        this.advance();
        return {
          type: TokenType.MULTIPLICACAO,
          value: "*",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      if (char === "-") {
        this.advance();
        return {
          type: TokenType.MENOS,
          value: "-",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      if (char === "=" && this.peekNext() !== "=") {
        this.advance();
        return {
          type: TokenType.ATRIBUICAO,
          value: "=",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      if (char === ".") {
        this.advance();
        return {
          type: TokenType.PONTO,
          value: ".",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      if (char === ",") {
        this.advance();
        return {
          type: TokenType.VIRGULA,
          value: ",",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      if (char === ":") {
        this.advance();
        return {
          type: TokenType.DOIS_PONTOS,
          value: ":",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      if (char === "(") {
        this.advance();
        return {
          type: TokenType.PARENTESE_ESQUERDO,
          value: "(",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }
      if (char === ")") {
        this.advance();
        return {
          type: TokenType.PARENTESE_DIREITO,
          value: ")",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }
      if (char === "{") {
        this.advance();
        return {
          type: TokenType.CHAVE_ESQUERDA,
          value: "{",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      if (char === "}") {
        this.advance();
        return {
          type: TokenType.CHAVE_DIREITA,
          value: "}",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      // Operadores de comparação

      if (char === "=" && this.peekNext() === "=") {
        this.advance();
        this.advance();
        return {
          type: TokenType.IGUALDADE,
          value: "==",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      if (char === "!" && this.peekNext() === "=") {
        this.advance();
        this.advance();
        return {
          type: TokenType.DIFERENTE_DE,
          value: "!=",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      if (char === ">" && this.peekNext() === "=") {
        this.advance();
        this.advance();
        return {
          type: TokenType.MAIOR_OU_IGUAL,
          value: ">=",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      if (char === "<" && this.peekNext() === "=") {
        this.advance();
        this.advance();
        return {
          type: TokenType.MENOR_OU_IGUAL,
          value: "<=",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      if (char === "<") {
        this.advance();
        return {
          type: TokenType.MENOR_QUE,
          value: "<",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      if (char === ">") {
        this.advance();
        return {
          type: TokenType.MAIOR_QUE,
          value: ">",
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }

      // Capturar textos entre aspas duplas

      if (char === '"') {
        this.advance(); // Consome aspas iniciais
        let str = "";
        const startLine = this.linha;
        const startColumn = this.coluna;
        const MAX_STRING_LENGTH = 500; // Limite de caracteres para strings

        while (this.peek() !== '"' && this.position < this.text.length) {
          if (this.peek() === "\n") {
            this.avancaLinha();
          } else {
            // Validação: string muito grande
            if (str.length >= MAX_STRING_LENGTH) {
              this.addError(
                `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] String muito grande\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mArquivo:\x1b[0m \x1b[33m${this.filename}\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${startLine}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${startColumn}\x1b[0m
  - \x1b[36mContexto:\x1b[0m A string excede o limite de ${MAX_STRING_LENGTH} caracteres.`,
              );
              // Consome o restante da string até as aspas finais ou EOF
              while (this.peek() !== '"' && this.position < this.text.length) {
                if (this.peek() === "\n") {
                  this.avancaLinha();
                } else {
                  this.advance();
                }
              }
              break;
            }

            str += this.peek();
            this.advance();
          }
        }

        if (this.peek() === '"') {
          this.advance(); // Consome aspas finais
          return {
            type: TokenType.TEXTO,
            value: str,
            linha: startLine,
            coluna: startColumn,
          };
        } else {
          this.addError(
            `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] String não terminada\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mArquivo:\x1b[0m \x1b[33m${this.filename}\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${startLine}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${startColumn}\x1b[0m`,
          );
          return {
            type: TokenType.TEXTO,
            value: str,
            linha: startLine,
            coluna: startColumn,
          };
        }
      }

      // Capturar números inteiros ou reais(sequência de dígitos)
if (isNumber.test(char)) {
    let num = "";
    let isReal = false;
    const MAX_NUMBER_LENGTH = 15; // Limite de dígitos para números
    const startLine = tokenInicioLinha;
    const startCol = tokenInicioColuna;

    while (isNumber.test(this.peek()) || this.peek() === ",") {
        // Vírgula como separador decimal
        if (this.peek() === ",") {
            if (isReal) {
                this.addError(
                    `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] Número real inválido\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${this.linha}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${this.coluna}\x1b[0m
  - \x1b[36mContexto:\x1b[0m Próximo do identificador '\x1b[33m${num}\x1b[0m'`,
                );
            }
            isReal = true;
            num += ","; // No Parser vamos trocar por .
            this.advance();
            continue;
        }

        // Validação: número muito grande
        if (num.length >= MAX_NUMBER_LENGTH) {
            this.addError(
                `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] Número muito grande\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mArquivo:\x1b[0m \x1b[33m${this.filename}\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${startLine}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${startCol}\x1b[0m
  - \x1b[36mContexto:\x1b[0m O número '\x1b[33m${num}\x1b[0m' excede o limite de ${MAX_NUMBER_LENGTH} dígitos.`,
            );
            // Consome o restante do número
            while (isNumber.test(this.peek()) || this.peek() === ",") {
                this.advance();
            }
            break;
        }

        num += this.peek();
        this.advance();
    }

    if (num.endsWith(",")) {
        this.addError(
            `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] Número real inválido\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${this.linha}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${this.coluna}\x1b[0m
  - \x1b[36mContexto:\x1b[0m O número '\x1b[33m${num}\x1b[0m' não pode terminar com vírgula.`,
        );
    }

    if (/[a-zA-Z]/.test(this.peek())) {
        this.addError(
            `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] Identificador inválido\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${this.linha}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${this.coluna}\x1b[0m
  - \x1b[36mContexto:\x1b[0m Identificadores não podem começar com números: '\x1b[33m${num}${this.peek()}\x1b[0m...'`,
        );
    }

    return {
        type: isReal ? TokenType.REAL : TokenType.INTEIRO,
        value: num,
        linha: startLine,
        coluna: startCol,
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
        if (word === "VAR")
          return {
            type: TokenType.VAR,
            value: word,
            linha: tokenInicioLinha,
            coluna: tokenInicioColuna,
          };
        if (word === "EXIBIR")
          return {
            type: TokenType.EXIBIR,
            value: word,
            linha: tokenInicioLinha,
            coluna: tokenInicioColuna,
          };

          if(word === "INSERIR"){
            return {
              type: TokenType.INSERIR,
              value: word,
              linha: tokenInicioLinha,
              coluna: tokenInicioColuna,
            };


          }
        if (word === "INTEIRO")
          return {
            type: TokenType.INTEIRO,
            value: word,
            linha: tokenInicioLinha,
            coluna: tokenInicioColuna,
          };
        if (word === "REAL")
          return {
            type: TokenType.REAL,
            value: word,
            linha: tokenInicioLinha,
            coluna: tokenInicioColuna,
          };
        if (word === "NATURAL")
          return {
            type: TokenType.NATURAL,
            value: word,
            linha: tokenInicioLinha,
            coluna: tokenInicioColuna,
          };
        if (word === "TEXTO")
          return {
            type: TokenType.TEXTO,
            value: word,
            linha: tokenInicioLinha,
            coluna: tokenInicioColuna,
          };
        if (word === "LOGICO")
          return {
            type: TokenType.LOGICO,
            value: word,
            linha: tokenInicioLinha,
            coluna: tokenInicioColuna,
          };

        if (word === "VERDADEIRO") {
          return {
            type: TokenType.VERDADEIRO,
            value: word,
            linha: tokenInicioLinha,
            coluna: tokenInicioColuna,
          };
        }
        if (word === "FALSO") {
          return {
            type: TokenType.FALSO,
            value: word,
            linha: tokenInicioLinha,
            coluna: tokenInicioColuna,
          };
        }

        if (word === "SE") {
          return {
            type: TokenType.SE,
            value: word,
            linha: tokenInicioLinha,
            coluna: tokenInicioColuna,
          };
        }

        if (word === "SENAO") {
          return {
            type: TokenType.SENAO,
            value: word,
            linha: tokenInicioLinha,
            coluna: tokenInicioColuna,
          };
        }

        // Operadores lógicos
        if (word === "E") {
          return {
            type: TokenType.E,
            value: word,
            linha: tokenInicioLinha,
            coluna: tokenInicioColuna,
          };
        }

        if (word === "OU") {
          return {
            type: TokenType.OU,
            value: word,
            linha: tokenInicioLinha,
            coluna: tokenInicioColuna,
          };
        }

        if (word === "NAO") {
          return {
            type: TokenType.NAO,
            value: word,
            linha: tokenInicioLinha,
            coluna: tokenInicioColuna,
          };
        }

        // Validação de palavras reservadas "erradas" (ex: VARc, REALx)
        const keywords = [
          "VAR",
          "EXIBIR",
          "INSERIR",
          "INTEIRO",
          "REAL",
          "NATURAL",
          "TEXTO",
          "LOGICO",
          "VERDADEIRO",
          "FALSO",
          "SE",
          "SENAO",
          "E",
          "OU",
          "NAO",
        ];
        for (const kw of keywords) {
          if (word.startsWith(kw) && word !== kw) {
            this.addError(
              `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] Palavra reservada inválida\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mArquivo:\x1b[0m \x1b[33m${this.filename}\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${tokenInicioLinha}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${tokenInicioColuna}\x1b[0m
  - \x1b[36mContexto:\x1b[0m A palavra '\x1b[33m${word}\x1b[0m' parece uma palavra reservada mal formada.`,
            );
          }
        }

        // Se não for palavra-chave, é um identificador (nome de variável)
        return {
          type: TokenType.IDENTIFICADOR,
          value: word,
          linha: tokenInicioLinha,
          coluna: tokenInicioColuna,
        };
      }
      this.addError(
        `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] Caractere inválido\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${this.linha}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${this.coluna}\x1b[0m
  - \x1b[36mCaractere:\x1b[0m '\x1b[33m${char}\x1b[0m'`,
      );
      this.advance(); // Recuperação
    }

    // Fim do arquivo atingido
    return {
      type: TokenType.EOF,
      value: "",
      linha: this.linha,
      coluna: this.coluna,
    };
  }
}

export default Lexer;
