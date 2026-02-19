import ASTNode from "../parser/IParser";
import { TacProgram } from "./tac";

export class TacGenerator {
  private program: TacProgram = [];
  private tempCounter = 0;
  private labelCounter = 0; // Contador para labels únicas (L1, L2, etc)

  private newTemp(): string {
    return `t${++this.tempCounter}`;
  }

  private newLabel(): string {
    return `L${++this.labelCounter}`;
  }

  generate(ast: ASTNode[]): TacProgram {
    this.program = [];
    this.tempCounter = 0;
    this.labelCounter = 0;

    for (const node of ast) {
      if (node) this.visit(node);
    }

    return this.program;
  }

  // Função auxiliar para processar blocos (arrays de nós)
  private visitBlock(nodes: ASTNode | ASTNode[] | null) {
    if (!nodes) return;
    if (Array.isArray(nodes)) {
      for (const node of nodes) {
        this.visit(node);
      }
    } else {
      this.visit(nodes);
    }
  }

  private visit(node: ASTNode | any): string {
    if (!node) return "";

    switch (node.type) {
      case "VariableDeclaration": {
        let valueStr = "0";
        if (node.value) {
          valueStr = this.visit(node.value);
        }
        this.program.push({ op: "=", arg1: valueStr, result: node.id });
        return node.id;
      }

      case "Assignment": {
        const value = this.visit(node.value);
        const targetName = node.target.name || node.target.id || "unknown";
        this.program.push({ op: "=", arg1: value, result: targetName });
        return targetName;
      }

      case "BinaryExpression": {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        const temp = this.newTemp();
        this.program.push({ op: node.operator, arg1: left, arg2: right, result: temp });
        return temp;
      }

      case "LogicalExpression": {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        const temp = this.newTemp();
        this.program.push({ op: node.operator, arg1: left, arg2: right, result: temp });
        return temp;
      }

      case "PrintStatement": {
        if (Array.isArray(node.arguments)) {
          for (const argNode of node.arguments) {
            const arg = this.visit(argNode);
            this.program.push({ op: "print", arg1: arg });
          }
        }
        return "";
      }

      /* ============================
       * Lógica de IF (SE)
       * ============================ */
      case "IfStatement": {
        const labelElse = this.newLabel();
        const labelEnd = this.newLabel();
        
        // 1. Avalia a condição
        const conditionTemp = this.visit(node.condition);
        
        // 2. Se a condição for falsa, pula para o Else (ou End)
        this.program.push({ op: "ifFalse", arg1: conditionTemp, result: labelElse });
        
        // 3. Processa o bloco verdadeiro
        this.visitBlock(node.trueBranch);
        
        // 4. Se houver um else, após o bloco true temos que pular para o fim
        this.program.push({ op: "goto", result: labelEnd });
        
        // 5. Marca o início do Else
        this.program.push({ op: "label", result: labelElse });
        
        // 6. Processa o bloco falso (pode ser outro IfStatement no caso de "senao se")
        if (node.falseBranch) {
          this.visitBlock(node.falseBranch);
        }
        
        // 7. Marca o fim do If
        this.program.push({ op: "label", result: labelEnd });
        
        return "";
      }

      /* ============================
       * Lógica de WHILE (ENQUANTO)
       * ============================ */
      case "WhileStatement": {
        const labelStart = this.newLabel();
        const labelEnd = this.newLabel();
        
        // 1. Marca o início do loop (para voltar)
        this.program.push({ op: "label", result: labelStart });
        
        // 2. Avalia a condição
        const conditionTemp = this.visit(node.condition);
        
        // 3. Se falsa, sai do loop
        this.program.push({ op: "ifFalse", arg1: conditionTemp, result: labelEnd });
        
        // 4. Processa o corpo do loop
        this.visitBlock(node.body);
        
        // 5. Volta para o teste da condição
        this.program.push({ op: "goto", result: labelStart });
        
        // 6. Marca o fim do loop
        this.program.push({ op: "label", result: labelEnd });
        
        return "";
      }

      case "NumberLiteral":
      case "StringLiteral":
      case "BooleanLiteral":
        return node.value.toString();

      case "IDENTIFICADOR":
        return node.name;

      default:
        console.warn(`Tipo de nó [${node.type}] ainda não mapeado.`);
        return "";
    }
  }
}