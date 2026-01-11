import ASTNode from "../parser/IParser";

interface Symbol {
  name: string;
  value: number | string | boolean;
  type: "INTEIRO" | "REAL" | "NATURAL" | "TEXTO" | "LOGICO" | "any";
  // scope: "global" | "local";
  
}

class Scope{
    private symbols = new Map<string, Symbol> ();
    add(symbol: Symbol): void{
        if(this.symbols.has(symbol.name)){
            throw new Error(`'${symbol.name}' a variável já foi declarada neste escopo`);
        }
        this.symbols.set(symbol.name, symbol);
    }
    lookup(name: string):Symbol | undefined{
        return this.symbols.get(name);
    }
    //Remover escopo ao sair
    remove(name: string): boolean{
        return this.symbols.delete(name);
    }
}

/**
 * O SemanticAnalyzer percorre a AST para validar semântica e executar os comandos.
 * Ele mantém uma tabela de símbolos para armazenar valores e tipos das variáveis.
 */
class SemanticAnalyzer {
  // private simbols: Record<string, Symbol> = {};

  private stackScopes: Scope[] = [];

    //Inicio do escopo global
    constructor(){
        this.stackScopes.push(new Scope());
    }

    private currentEscope(): Scope{
      if(this.stackScopes.length === 0){
        throw new Error('Erro: pilha de escopos vazia.')
      }
      return this.stackScopes[this.stackScopes.length - 1]!;

    }

    //Entrar em um novo escopo
    private enterScope(){
        this.stackScopes.push(new Scope());
    }
    //Sair do escopo actual
    private outEscope(){
        this.stackScopes.pop();
    }

    
    private lookupSymbol(nome: string): Symbol | undefined{
        for(let i = this.stackScopes.length - 1; i >= 0; i--){
          const scope = this.stackScopes[i]!;
            const symbol = scope.lookup(nome);
            if(symbol){
                return symbol;
            }
        }
        throw new Error(`'${nome}' a variável não foi declarada.`);
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

         this.currentEscope().add({
            name: node.id, value, type: node.varType
        });
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

        //Escopo
        case "Block":
            this.enterScope();

            for(const dec of node.declaration){
                this.visit(dec);
            }
            this.outEscope();
            break;

      // Identificador
      case "IDENTIFICADOR":
        const symbol = this.lookupSymbol(node.name);
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
