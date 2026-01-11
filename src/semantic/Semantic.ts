import ASTNode from "../parser/IParser";

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
      case "VariableDeclaration":
        const value = this.visit(node.value);

        // Validação de tipo
        switch (node.varType) {
          case "INTEIRO":
            if (!Number.isInteger(value)) {
              throw new Error(
                `Erro semântico: valor ${value} não é compatível com tipo INTEIRO`
              );
            }
            break;
          case "REAL":
            if (typeof value !== "number") {
              throw new Error(
                `Erro semântico: valor ${value} não é compatível com tipo REAL`
              );
            }
            break;
          case "NATURAL":
            if (!Number.isInteger(value) || value < 0) {
              throw new Error(
                `Erro semântico: valor ${value} não é compatível com tipo NATURAL`
              );
            }
            break;
          case "TEXTO":
            if (typeof value !== "string") {
              throw new Error(
                `Erro semântico: valor ${value} não é compatível com tipo TEXTO`
              );
            }
            break;
          case "LOGICO":
            if (typeof value !== "boolean") {
              throw new Error(
                `Erro semântico: valor ${value} não é compatível com tipo LOGICO`
              );
            }
            break;
        }

        this.simbols[node.id] = { value, type: node.varType };
        break;
      // Comando print
      case "PrintStatement":
        console.log(this.visit(node.value));
        break;

      // Valor literal
      case "NumberLiteral":
        return node.value;

      // Expressao unária
      case "UnaryExpression":
        const val = this.visit(node.argument);
        switch (node.operator) {
          case "-":
            return -val;
          default:
            throw new Error(`Operador unário desconhecido: ${node.operator}`);
        }

      // Texto literal
      case "StringLiteral":
        return node.value;

      // Valor lógico
      case "BooleanLiteral":
        return node.value;

      // Identificador
      case "IDENTIFICADOR":
        const symbol = this.simbols[node.name];
        if (!symbol) {
          throw new Error(
            `Erro semântico: variavel ${node.name} não foi declarada`
          );
        }
        return symbol.value;

      // Expressão binária
      case "BinaryExpression":
        const left = this.visit(node.left);
        const right = this.visit(node.right);

        // Validação de tipos: ambos devem ser números
        if (typeof left !== "number" || typeof right !== "number") {
          throw new Error(
            `Erro semântico: operação '${
              node.operator
            }' inválida entre tipos ${typeof left} e ${typeof right}`
          );
        }
        // Checar divisão por zero
        if (node.operator === "/" && right === 0) {
          throw new Error(
            `Expressão mal definida: ${left} / ${right} . Não é possível dividir por zero`
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
}

export default SemanticAnalyzer;
