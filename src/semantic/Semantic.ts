import ASTNode from "../parser/IParser";

interface Symbol {
  value: number;
  type: "INTEIRO" | "REAL" | "NATURAL";
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
        if (node.varType === "INTEIRO" && !Number.isInteger(value)) {
          
          throw new Error(
            `Erro semântico: valor ${value} não é compatível com tipo INTEIRO da variável ${node.id}`
          );
        }

        if (
          node.varType === "NATURAL" &&
          (!Number.isInteger(value) || value < 0)
        ) {
          throw new Error(
            `Erro semântico: valor ${value} não é compatível com tipo NATURAL da variável ${node.id}`
          );
        }

        // REAL aceita qualquer número
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
