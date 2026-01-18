import ASTNode from "../parser/IParser";
import readlineSync from "readline-sync";

interface Symbol {
  value: number | string | boolean;
  type: "INTEIRO" | "REAL" | "NATURAL" | "TEXTO" | "LOGICO";
}

/**
 * O SemanticAnalyzer percorre a AST para validar semântica e executar os comandos.
 * Ele mantém uma tabela de símbolos para armazenar valores e tipos das variáveis.
 */
class SemanticAnalyzer {
  private simbols: Record<string, Symbol> = {};
  private filename: string;

  constructor(filename: string = "code.sa") {
    this.filename = filename;
  }

  /**
   * Formata uma mensagem de erro com cores ANSI e informações detalhadas.
   */
  private formatError(
    errorType: string,
    details: string,
    node: ASTNode,
  ): string {
    return `\x1b[31m========================================\x1b[0m
\x1b[31m[ERRO] ${errorType}\x1b[0m
\x1b[31m========================================\x1b[0m
\x1b[1mDetalhes:\x1b[0m
  - \x1b[36mArquivo:\x1b[0m \x1b[33m${this.filename}\x1b[0m
  - \x1b[36mLinha:\x1b[0m \x1b[33m${node.linha || "?"}\x1b[0m
  - \x1b[36mColuna:\x1b[0m \x1b[33m${node.coluna || "?"}\x1b[0m
  - \x1b[36mContexto:\x1b[0m ${details}`;
  }

  /**
   * Executa a lista de comandos representada pela AST.
   */
  public execute(ast: ASTNode[]) {
    for (const node of ast) {
      this.visit(node);
    }
  }

  /**
   * Função recursiva que visita cada nó da AST e executa a lógica correspondente.
   */
  private visit(node: ASTNode): any {
    switch (node.type) {
      // Declaração de variável
      case "VariableDeclaration": {
        let value: any = null;

        if (node.value) {
          value = this.visit(node.value);
        }

        // Valores padrão
        if (value === null) {
          switch (node.varType) {
            case "INTEIRO":
            case "REAL":
            case "NATURAL":
              value = 0;
              break;
            case "TEXTO":
              value = "";
              break;
            case "LOGICO":
              value = false;
              break;
          }
        }

        // Validação de tipo
        switch (node.varType) {
          case "INTEIRO":
            if (!Number.isInteger(value))
              throw new Error(
                this.formatError(
                  "Tipo Incompatível",
                  `Valor ${value} não é compatível com INTEIRO`,
                  node,
                ),
              );
            break;

          case "REAL":
            if (typeof value !== "number")
              throw new Error(
                this.formatError(
                  "Tipo Incompatível",
                  `Valor ${value} não é compatível com REAL`,
                  node,
                ),
              );
            break;

          case "NATURAL":
            if (!Number.isInteger(value) || value < 0)
              throw new Error(
                this.formatError(
                  "Tipo Incompatível",
                  `Valor ${value} não é compatível com NATURAL`,
                  node,
                ),
              );
            break;

          case "TEXTO":
            if (typeof value !== "string")
              throw new Error(
                this.formatError(
                  "Tipo Incompatível",
                  `Valor ${value} não é compatível com TEXTO`,
                  node,
                ),
              );
            break;

          case "LOGICO":
            if (typeof value !== "boolean")
              throw new Error(
                this.formatError(
                  "Tipo Incompatível",
                  `Valor ${value} não é compatível com LOGICO`,
                  node,
                ),
              );
            break;
        }

        this.simbols[node.id] = {
          value,
          type: node.varType,
        };

        break;
      }

      case "Assignment": {
        const symbol = this.simbols[node.id];

        if (!symbol) {
          throw new Error(
            this.formatError(
              "Variável Não Declarada",
              `Variável '${node.id}' não foi declarada`,
              node,
            ),
          );
        }

        const newValue = this.visit(node.value);

        // Validação de tipo
        switch (symbol.type) {
          case "INTEIRO":
            if (!Number.isInteger(newValue))
              throw new Error(
                this.formatError(
                  "Tipo Incompatível",
                  `Variável '${node.id}' espera INTEIRO`,
                  node,
                ),
              );
            break;

          case "REAL":
            if (typeof newValue !== "number")
              throw new Error(
                this.formatError(
                  "Tipo Incompatível",
                  `Variável '${node.id}' espera REAL`,
                  node,
                ),
              );
            break;

          case "NATURAL":
            if (!Number.isInteger(newValue) || newValue < 0)
              throw new Error(
                this.formatError(
                  "Tipo Incompatível",
                  `Variável '${node.id}' espera NATURAL`,
                  node,
                ),
              );
            break;

          case "TEXTO":
            if (typeof newValue !== "string")
              throw new Error(
                this.formatError(
                  "Tipo Incompatível",
                  `Variável '${node.id}' espera TEXTO`,
                  node,
                ),
              );
            break;

          case "LOGICO":
            if (typeof newValue !== "boolean")
              throw new Error(
                this.formatError(
                  "Tipo Incompatível",
                  `Variável '${node.id}' espera LOGICO`,
                  node,
                ),
              );
            break;
        }

        // Atribuição segura
        symbol.value = newValue;
        break;
      }

      // Comando print para saida de
      case "PrintStatement":
        console.log(this.visit(node.value));
        break;

      case "InputStatement": {
        const symbol = this.simbols[node.id];

        if (!symbol) {
          throw new Error(
            this.formatError(
              "Variável Não Declarada",
              `Variável '${node.id}' não foi declarada`,
              node,
            ),
          );
        }

        const msg = node.promptMessage ?? "";
        const input = readlineSync.question(msg + " ");

        switch (symbol.type) {
          case "INTEIRO": {
            const v = parseInt(input, 10);
            if (Number.isNaN(v)) {
              throw new Error(
                this.formatError(
                  "Entrada inválida",
                  `Esperado INTEIRO, recebido '${input}'`,
                  node,
                ),
              );
            }
            symbol.value = v;
            break;
          }

          case "REAL": {
            const v = parseFloat(input.replace(",", "."));
            if (Number.isNaN(v)) {
              throw new Error(
                this.formatError(
                  "Entrada inválida",
                  `Esperado REAL (use vírgula), recebido '${input}'`,
                  node,
                ),
              );
            }
            symbol.value = v;
            break;
          }

          case "TEXTO":
            symbol.value = input;
            break;

          case "LOGICO":
            symbol.value = input === "VERDADEIRO";
            break;
        }

        break;
      }

      // Valor literal
      case "NumberLiteral":
        return node.value;

      // Expressao unária
      case "UnaryExpression":
        const val = this.visit(node.argument);
        switch (node.operator) {
          case "-":
            return -val;
          case "!":
            return !val;
          default:
            throw new Error(`Operador unário desconhecido: ${node.operator}`);
        }

      // Texto literal
      case "StringLiteral":
        return node.value;

      // Valor lógico
      case "BooleanLiteral":
        return node.value;

      //

      case "IfStatement": {
        const cond = this.visit(node.condition);

        if (typeof cond !== "boolean") {
          throw new Error(
            this.formatError(
              "Erro de Tipo",
              "Condição do SE deve ser lógica",
              node,
            ),
          );
        }

        if (cond) {
          // SE verdadeiro
          node.trueBranch.forEach((stmt: ASTNode) => this.visit(stmt));
        } else if (node.falseBranch) {
          // Se Falso
          if (Array.isArray(node.falseBranch)) {
            node.falseBranch.forEach((stmt: ASTNode) => this.visit(stmt));
          } else {
            // recursivamente visita o IfStatement (SENAO SE)
            this.visit(node.falseBranch as ASTNode);
          }
        }

        break;
      }

      case "LogicalExpression":
        const l = this.visit(node.left);
        const r = this.visit(node.right);

        switch (node.operator) {
          case "==":
            return l === r;
          case "!=":
            return l !== r;
          case ">":
            return l > r;
          case "<":
            return l < r;
          case ">=":
            return l >= r;
          case "<=":
            return l <= r;
          case "E":
            return l && r;
          case "OU":
            return l || r;
        }

      // Identificador
      case "IDENTIFICADOR":
        const symbol = this.simbols[node.name];
        if (!symbol) {
          throw new Error(
            this.formatError(
              "Variável Não Declarada",
              `Variável \x1b[33m${node.name}\x1b[0m não foi declarada`,
              node,
            ),
          );
        }
        return symbol.value;

      // Expressão binária
      case "BinaryExpression":
        const left = this.visit(node.left);
        const right = this.visit(node.right);

        // Validação de tipos: ambos devem ser números
        if (typeof left !== "number" || typeof right !== "number") {
          const type1 = this.getUserFriendlyType(left);
          const type2 = this.getUserFriendlyType(right);
          throw new Error(
            this.formatError(
              "Tipo incompatível em expressão aritmética",
              `Operador '${node.operator}' não é válido entre ${type1} e ${type2}`,
              node,
            ),
          );
        }
        // Checar divisão por zero
        if (node.operator === "/" && right === 0) {
          throw new Error(
            this.formatError(
              "Expressão mal definida",
              `Não é possível dividir \x1b[33m${left}\x1b[0m por \x1b[33m${right}\x1b[0m (divisão por zero)`,
              node,
            ),
          );
        }

        switch (node.operator) {
          case "+":
            return left + right;
          case "-":
            return left - right;
          case "*":
            return left * right;
          case "/":
            return left / right;
          default:
            throw new Error(`Operador desconhecido: ${node.operator}`);
        }

      default:
        throw new Error(`Nó AST desconhecido: ${node.type}`);
    }
  }

  private getUserFriendlyType(value: any): string {
    if (typeof value === "number") return "INTEIRO"; // simplifies for now, maybe distinguish later if needed
    if (typeof value === "string") return "TEXTO";
    if (typeof value === "boolean") return "LOGICO";
    return typeof value;
  }
}

export default SemanticAnalyzer;
