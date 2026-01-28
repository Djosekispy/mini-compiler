import ASTNode from "../parser/IParser";
import readlineSync from "readline-sync";
import { execSync } from "child_process";
import { error } from "console";

interface Symbol {
  name: string;
  value: number | string | boolean | ASTNode | null;
  type: "INTEIRO" | "REAL" | "NATURAL" | "TEXTO" | "LOGICO" | "FUNCAO";
}

interface FunctionNode extends ASTNode {
  type: "FunctionDeclaration";
  name: string;
  returnType: "INTEIRO" | "REAL" | "NATURAL" | "LOGICO" | "TEXTO" | "NULO";
  parameters: { name: string; type: string }[];
  body: ASTNode[];
  linha: number;
  coluna: number;
}

class Scope {
  private symbols = new Map<string, Symbol>();
  add(symbol: Symbol): void {
    if (this.symbols.has(symbol.name)) {
      throw new Error(
        `'${symbol.name}' a variável já foi declarada neste escopo`,
      );
    }
    this.symbols.set(symbol.name, symbol);
  }
  lookup(name: string): Symbol | undefined {
    return this.symbols.get(name);
  }
  //Remover o escopo ao sair
  remove(name: string): boolean {
    return this.symbols.delete(name);
  }
}
/**
 * O SemanticAnalyzer percorre a AST para validar semântica e executar os comandos.
 * Ele mantém uma tabela de símbolos para armazenar valores e tipos das variáveis.
 */

class BreakSignal { }
class ContinueSignal { }
class ReturnSignal {
  constructor(public value: any) { }
}
class errorSemantic extends Error {
  constructor(
    public typeError: string,
    public details: string,
    public node: ASTNode,
  ) {
    super(details);
  }
}

class SemanticAnalyzer {
  private filename: string;
  private printCallback: (message: string) => void;
  private inputCallback: (prompt: string) => Promise<string>;

  private globalScope: Scope = new Scope();
  private stackScopes: Scope[] = [];
  private classeRecente?: string;
  private recenteParentClasse?: string;
  private symbolDeclared = new Set<string>();
  private webOutput: string = "";
  private currentFunction?: { name: string; returnType: string } | undefined;

  public getWebOutput(): string {
    return this.webOutput;
  }

  // Valida se o tipo do valor é compatível com o tipo esperado
  private inferType(node: ASTNode): string {
    switch (node.type) {
      case "NumberLiteral":
        return node.numberType;
      case "StringLiteral":
        return "TEXTO";
      case "BooleanLiteral":
        return "LOGICO";
      case "IDENTIFICADOR": {
        const sym = this.currentScope().lookup(node.name);
        if (!sym) throw new Error(`Variável não declarada: ${node.name}`);
        return sym.type;
      }
      case "BinaryExpression": {
        const left = this.inferType(node.left);
        const right = this.inferType(node.right);
        if (left !== right)
          throw new Error(`Tipos incompatíveis em ${node.operator}`);
        return left;
      }
      case "LogicalExpression":
        return "LOGICO";
      default:
        throw new Error(`Não sei inferir tipo de ${node.type}`);
    }
  }

  //Entrar em um novo escopo
  private enterScope() {
    this.stackScopes.push(new Scope());
  }
  //Sair do escopo actual
  private outScope() {
    this.stackScopes.pop();
  }

  private currentScope(): Scope {
    return this.stackScopes[this.stackScopes.length - 1]!;
  }

  private symbolExistOutScope(name: string): boolean {
    for (let i = this.stackScopes.length - 2; i >= 0; i--) {
      if (this.stackScopes[i]!.lookup(name)) {
        return true;
      }
    }
    return false;
  }

  private lookupSymbol(name: string, node: ASTNode): Symbol {
    for (let i = this.stackScopes.length - 1; i >= 0; i--) {
      const symbol = this.stackScopes[i]!.lookup(name);
      if (symbol) return symbol;
    }
    if (this.symbolDeclared.has(name)) {
      throw new errorSemantic(
        "A váriavel está fora do escopo!",
        `A váriavel '${name}' foi declarada, mas não é global e sim local.`,
        node,
      );
    }
    throw new errorSemantic(
      "A variável não foi declarada!",
      `A variável '${name}' não foi declarada.`,
      node,
    );
  }

  constructor(
    filename: string = "code.sa",
    printCallback: (message: string) => void = console.log,
    inputCallback?: (prompt: string) => Promise<string>,
  ) {
    this.filename = filename;
    this.printCallback = printCallback;

    if (inputCallback) {
      this.inputCallback = inputCallback;
    } else {
      // Estratégia padrão para CLI (Terminal)
      this.inputCallback = async (prompt: string) => {
        if (process.platform === "win32") {
          try {
            process.stdout.write(prompt);
            const command = `powershell -NoProfile -Command "[Console]::InputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; [Console]::In.ReadLine()"`;
            return execSync(command, {
              encoding: "utf8",
              stdio: ["inherit", "pipe", "inherit"],
            }).trim();
          } catch (e) {
            return readlineSync.question(prompt);
          }
        }
        return readlineSync.question(prompt);
      };
    }
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
  public async execute(ast: ASTNode[]) {
    // Always start with the global scope
    this.stackScopes = [this.globalScope];
    this.webOutput = "";
    try {
      for (const node of ast) {
        const result = await this.visit(node);
        if (node.type === "WebTag" && typeof result === "string") {
          this.webOutput += result;
        }
      }
    } catch (er) {
      if (er instanceof errorSemantic) {
        const formattedError = this.formatError(er.typeError, er.details, er.node);
        throw new Error(formattedError);
      } else {
        throw er;
      }
    } finally {
      // Do not pop the global scope
      this.stackScopes = [this.globalScope];
    }
  }

  private enterFunctionScope(params: { name: string; type: string }[]) {
    // Cria um escopo novo, isolado do global
    const newScope = new Scope();

    // Adiciona parâmetros da função
    for (const param of params) {
      if (newScope.lookup(param.name)) {
        throw new Error(`Parâmetro '${param.name}' já declarado na função`);
      }
      newScope.add({ name: param.name, type: param.type as any, value: null });
    }

    this.stackScopes.push(newScope);
  }

  private exitFunctionScope() {
    this.stackScopes.pop();
  }

  // Verifica se a instrução de retorno está correta dentro do contexto da função
  private checkReturnStatement(node: ASTNode) {
    if (!this.currentFunction)
      throw new Error(`RETORNAR fora de função (linha ${node.linha})`);

    if (node.expression) {
      const exprType = this.inferType(node.expression);
      if (exprType !== this.currentFunction.returnType) {
        throw new Error(
          `Tipo de retorno inválido: esperado ${this.currentFunction.returnType}, encontrado ${exprType}`,
        );
      }
    }
  }

  /**
   * A função recursiva que visita cada nó da AST e executa a lógica correspondente.
   */
  private async visit(node: ASTNode): Promise<any> {
    switch (node.type) {
      // ==================== BLOCO DE INSTRUÇÕES ====================
      case "BlockStatement":
        return await this.executeBlock(node.body);

      // ==================== DECLARAÇÃO DE VARIÁVEL ====================
      case "VariableDeclaration": {
        let value: any = null;

        if (node.value) {
          value = await this.visit(node.value);
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

        this.validateTypeCompatibility(node.varType, value, node.id, node);

        this.currentScope().add({
          name: node.id,
          type: node.varType,
          value,
        });

        this.symbolDeclared.add(node.id);
        break;
      }

      // ==================== ATRIBUIÇÃO ====================
      case "Assignment": {
        const target = node.target;
        const newValue = await this.visit(node.value);

        if (target.type === "IDENTIFICADOR" || target.type === "VAR") {
          const id = target.type === "IDENTIFICADOR" ? target.name : target.id;
          const symbol = this.lookupSymbol(id, node);
          this.validateTypeCompatibility(symbol.type, newValue, id, node);
          symbol.value = newValue;
        } else if (target.type === "IndexAccess") {
          await this.assignToIndex(target, newValue);
        } else {
          throw new Error(`Alvo de atribuição inválido: ${target.type}`);
        }
        break;
      }

      // ==================== UPDATE (++, --, +=, -=) ====================
      case "UpdateStatement": {
        const target = node.target;
        let oldValue: number;
        let symbol: any = null;
        let indexAccess: any = null;

        if (target.type === "IDENTIFICADOR") {
          symbol = this.lookupSymbol(target.name, node);
          oldValue = symbol.value as number;
          if (!["INTEIRO", "REAL", "NATURAL"].includes(symbol.type)) {
            throw new Error(
              this.formatError(
                "Erro de Tipo",
                `Operador '${node.operator}' só pode ser usado em tipos numéricos`,
                node,
              ),
            );
          }
        } else if (target.type === "IndexAccess") {
          indexAccess = await this.resolveIndexAccess(target);
          oldValue = indexAccess.value;
          if (typeof oldValue !== "number") {
            throw new Error(
              this.formatError(
                "Erro de Tipo",
                `Operador '${node.operator}' só pode ser usado em valores numéricos`,
                node,
              ),
            );
          }
        } else {
          throw new Error(`Alvo de atualização inválido: ${target.type}`);
        }

        let newValue: number;
        switch (node.operator) {
          case "++":
            newValue = oldValue + 1;
            break;
          case "--":
            newValue = oldValue - 1;
            break;
          case "+=":
            newValue = oldValue + (await this.visit(node.value));
            break;
          case "-=":
            newValue = oldValue - (await this.visit(node.value));
            break;
          default:
            throw new Error(`Operador desconhecido: ${node.operator}`);
        }

        if (symbol) {
          if (symbol.type === "NATURAL" && newValue < 0) {
            throw new Error(
              this.formatError(
                "Erro de Tipo (NATURAL)",
                "Não pode ser negativo",
                node,
              ),
            );
          }
          symbol.value = newValue;
        } else {
          indexAccess.object[indexAccess.index] = newValue;
        }
        break;
      }

      // ==================== LISTAS ====================
      case "ListLiteral": {
        const elements = [];
        for (const element of node.elements) {
          elements.push(await this.visit(element));
        }
        return elements;
      }

      case "IndexAccess":
        const resolved = await this.resolveIndexAccess(node);
        return resolved.value;

      // ==================== PRINT ====================
      case "PrintStatement": {
        let output = "";
        for (const arg of node.arguments) {
          const value = await this.visit(arg);

          if (!["string", "number", "boolean"].includes(typeof value)) {
            throw new Error(
              this.formatError(
                "Erro de Tipo",
                "EXIBIR aceita apenas TEXTO, NUMERO ou LOGICO",
                node,
              ),
            );
          }

          output +=
            typeof value === "number" && !Number.isInteger(value)
              ? value.toString().replace(".", ",")
              : value.toString();
        }
        this.printCallback(output);
        break;
      }

      // ==================== INPUT ====================
      case "InputStatement": {
        const symbol = this.lookupSymbol(node.id, node);
        const msg = node.promptMessage ?? "";
        const input = await this.inputCallback(msg + " ");

        switch (symbol.type) {
          case "INTEIRO":
            symbol.value = parseInt(input, 10);
            break;
          case "REAL":
            symbol.value = parseFloat(input.replace(",", "."));
            break;
          case "TEXTO":
            symbol.value = input;
            break;
          case "LOGICO":
            symbol.value = input === "VERDADEIRO";
            break;
        }
        break;
      }

      // ==================== BLOCO CONDICIONAL ====================
      case "IfStatement": {
        const cond = await this.visit(node.condition);
        if (typeof cond !== "boolean")
          throw new Error(
            this.formatError(
              "Erro de Tipo",
              "Condição do SE deve ser lógica",
              node,
            ),
          );

        if (cond) await this.executeBlock(node.trueBranch);
        else if (node.falseBranch)
          await this.executeBlock(
            Array.isArray(node.falseBranch)
              ? node.falseBranch
              : [node.falseBranch],
          );
        break;
      }

      // ==================== LOOPS ====================
      case "WhileStatement":
      case "DoWhileStatement":
      case "ForStatement": {
        let iterations = 0;
        const MAX_ITERATIONS = 10000;

        this.enterScope();
        try {
          if (node.type === "ForStatement") await this.visit(node.init);

          do {
            try {
              await this.executeBlock(node.body);
            } catch (signal) {
              if (signal instanceof BreakSignal) break;
              if (signal instanceof ContinueSignal) {
                if (node.type === "ForStatement")
                  await this.visit(node.increment);
                continue;
              }
              throw signal;
            }

            if (node.type === "ForStatement") await this.visit(node.increment);

            if (
              node.type === "WhileStatement" ||
              node.type === "DoWhileStatement"
            ) {
              if (!(await this.visit(node.condition))) break;
            }

            iterations++;
            if (iterations > MAX_ITERATIONS)
              throw new Error(`Loop ${node.type} excedeu 10000 iterações.`);
          } while (node.type !== "ForStatement");
        } finally {
          this.outScope();
        }
        break;
      }

      // ==================== BREAK / CONTINUE ====================
      case "BreakStatement":
        throw new BreakSignal();
      case "ContinueStatement":
        throw new ContinueSignal();

      // ==================== RETORNAR ====================
      case "ReturnStatement": {
        if (!this.currentFunction)
          throw new Error(`RETORNAR fora de função (linha ${node.linha})`);
        const value = node.expression
          ? await this.visit(node.expression)
          : null;

        if (this.currentFunction.returnType !== "NULO") {
          const exprType =
            value !== null ? this.getUserFriendlyType(value) : "NULO";
          if (exprType !== this.currentFunction.returnType)
            throw new Error(
              `Tipo de retorno inválido: esperado ${this.currentFunction.returnType}, encontrado ${exprType} (linha ${node.linha})`,
            );
        } else if (value !== null) {
          throw new Error(
            `Função '${this.currentFunction.name}' não deve retornar valor, mas RETORNAR encontrou ${value} (linha ${node.linha})`,
          );
        }

        throw new ReturnSignal(value);
      }

      // ==================== FUNÇÕES ====================
      case "FunctionDeclaration": {
        this.globalScope.add({ name: node.name, type: "FUNCAO", value: node });
        break;
      }

      case "CallExpression": {
        // Buscar a função no escopo
        const funcSymbol = this.lookupSymbol(node.callee, node);
        if (!funcSymbol || funcSymbol.type !== "FUNCAO")
          throw new Error(`Função '${node.callee}' não declarada`);

        const funcNode = funcSymbol.value as FunctionNode;

        // Verificar quantidade de argumentos
        if (funcNode.parameters.length !== node.arguments.length)
          throw new Error(
            `Função '${node.callee}' espera ${funcNode.parameters.length} argumentos, recebeu ${node.arguments.length}`,
          );

        // Definir função atual
        this.currentFunction = {
          name: funcNode.name,
          returnType: funcNode.returnType,
        };

        // Criar escopo da função com os parâmetros
        this.enterFunctionScope(funcNode.parameters);

        // Atribuir valores passados nos argumentos aos parâmetros
        for (let i = 0; i < node.arguments.length; i++) {
          const param = funcNode.parameters[i];
          if (!param) {
            throw new Error(
              `Parâmetro na posição ${i} é indefinido na função '${funcNode.name}'`,
            );
          }
          const argValue = await this.visit(node.arguments[i]);

          // Pegar o símbolo do parâmetro
          const sym = this.currentScope().lookup(param.name)!;
          sym.value = argValue;
        }

        let returnValue: any = null;
        try {
          for (const stmt of funcNode.body) {
            try {
              await this.visit(stmt);
            } catch (signal) {
              if (signal instanceof ReturnSignal) {
                returnValue = signal.value;
                break;
              } else {
                throw signal;
              }
            }
          }
        } finally {
          this.exitFunctionScope();
          this.currentFunction = undefined;
        }

        return returnValue;
      }

      // ==================== ESCOLHA / SWITCH ====================
      case "SwitchStatement": {
        const controlValue = await this.visit(node.control);

        let executing = false; // sinaliza se algum case começou a executar (fallthrough)

        for (const caseNode of node.cases) {
          let conditionResult = false;

          // Se for literal, compara diretamente com o valor do switch
          if (
            caseNode.condition.type === "NumberLiteral" ||
            caseNode.condition.type === "StringLiteral" ||
            caseNode.condition.type === "BooleanLiteral"
          ) {
            conditionResult = controlValue === caseNode.condition.value;
          } else {
            // Avalia a expressão lógica do case
            conditionResult = await this.visit(caseNode.condition);
            if (typeof conditionResult !== "boolean") {
              throw new Error(
                this.formatError(
                  "Erro de Tipo",
                  "Expressão do CASO deve resultar em LOGICO",
                  caseNode.condition,
                ),
              );
            }
          }

          // Ativa execução se a expressão for verdadeira ou se já estamos em "fallthrough"
          if (conditionResult || executing) {
            executing = true; // mantém execução em casos seguintes (se tiver fallthrough)
            try {
              await this.executeBlock(caseNode.body);
            } catch (signal) {
              if (signal instanceof BreakSignal) {
                return; // interrompe o switch
              }
              throw signal; // repassa outros sinais
            }
          }
        }

        // Executa PADRAO apenas se nenhum CASO foi executado
        if (!executing && node.defaultCase) {
          try {
            await this.executeBlock(node.defaultCase);
          } catch (signal) {
            if (signal instanceof BreakSignal) {
              return;
            }
            throw signal;
          }
        }

        return;
      }

      // ==================== EXPRESSÕES ====================
      case "BinaryExpression": {
        const left = await this.visit(node.left);
        const right = await this.visit(node.right);

        if (
          node.operator === "+" &&
          (typeof left === "string" || typeof right === "string")
        )
          return String(left) + String(right);

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

        if (node.operator === "/" && right === 0)
          throw new Error(
            this.formatError(
              "Expressão mal definida",
              `Não é possível dividir ${left} por ${right} (divisão por zero)`,
              node,
            ),
          );

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
      }

      case "UnaryLogicalExpression": {
        const value = await this.visit(node.argument);
        if (typeof value !== "boolean")
          throw new Error(
            this.formatError(
              "Erro de Tipo",
              "Operador NAO só pode ser aplicado a expressões lógicas",
              node,
            ),
          );
        return !value;
      }

      case "LogicalExpression": {
        const left = await this.visit(node.left);
        const right = await this.visit(node.right);
        const op = node.operator;

        if (["E", "OU"].includes(op)) {
          if (typeof left !== "boolean")
            throw new Error(
              this.formatError(
                "Erro de Tipo",
                `Operador ${op} requer valores lógicos`,
                node,
              ),
            );
          if (op === "E" && !left) return false;
          if (op === "OU" && left) return true;
          if (typeof right !== "boolean")
            throw new Error(
              this.formatError(
                "Erro de Tipo",
                `Operador ${op} requer valores lógicos`,
                node,
              ),
            );
          return op === "E" ? left && right : left || right;
        }

        if (typeof left !== typeof right)
          throw new Error(
            this.formatError(
              "Erro de Tipo",
              "Comparação entre tipos incompatíveis",
              node,
            ),
          );
        switch (op) {
          case "==":
            return left === right;
          case "!=":
            return left !== right;
          case ">":
            return left > right;
          case "<":
            return left < right;
          case ">=":
            return left >= right;
          case "<=":
            return left <= right;
        }
        throw new Error("Operador lógico desconhecido");
      }

      case "IDENTIFICADOR":
        return this.lookupSymbol(node.name, node).value;

      case "NumberLiteral":
        return node.value;
      case "StringLiteral":
        return node.value;
      case "BooleanLiteral":
        return node.value;

      case "ListLiteral": {
        const elements = [];
        for (const el of node.elements) elements.push(await this.visit(el));
        return elements;
      }

      case "ObjectLiteral":
        return await this.visitObjectLiteral(node);
      case "WebTag":
        return await this.visitWebTag(node);
      case "CalcStatement": {
        const arg1 = await this.visit(node.arguments[0]);
        const arg2 = await this.visit(node.arguments[1]);
        switch (node.operation) {
          case "RAIZ":
            return Math.pow(arg1, 1 / arg2);
          case "EXPOENTE":
            return Math.pow(arg1, arg2);
          default:
            throw new Error(`Operação desconhecida: ${node.operation}`);
        }
      }

      default:
        return undefined;
    }
  }

  // ==================== EXECUTAR BLOCO ====================
  private async executeBlock(statements: ASTNode[]) {
    this.enterScope();
    try {
      for (const stmt of statements) await this.visit(stmt);
    } finally {
      this.outScope();
    }
  }

  private async visitObjectLiteral(node: ASTNode): Promise<any> {
    const obj: { [key: string]: any } = {};
    for (const key in node.properties) {
      obj[key] = await this.visit(node.properties[key]);
    }
    return obj;
  }

  private async visitWebTag(node: ASTNode): Promise<string> {
    const tagName = this.mapTagName(node.tagName);
    const props = node.properties ? await this.visit(node.properties) : {};

    let style = "";
    if (props.fundo)
      style += `background-color: ${this.cssColor(props.fundo)}; `;
    if (props.cor) style += `color: ${this.cssColor(props.cor)}; `;
    if (props.largura) style += `width: ${props.largura}; `;
    if (props.altura) style += `height: ${props.altura}; `;
    if (props.borda) style += `border: ${props.borda}; `;
    if (props.margem) style += `margin: ${props.margem}; `;
    if (props.espacamento_interno)
      style += `padding: ${props.espacamento_interno}; `;
    if (props.mostrar) style += `display: ${props.mostrar}; `;
    if (props.direcao_flex) style += `flex-direction: ${props.direcao_flex}; `;
    if (props.justificar) style += `justify-content: ${props.justificar}; `;
    if (props.alinhar) style += `align-items: ${props.alinhar}; `;
    if (props.estilo_lista) style += `list-style: ${props.estilo_lista};`;

    if (node.tagName === "bloco") {
      style += "display: block; ";
      if (!props.largura) style += "width: 100%; ";
    }

    let htmlProps = "";
    if (style) htmlProps += ` style="${style.trim()}"`;

    let childrenHtml = "";
    for (const child of node.children) {
      const childResult = await this.visit(child);
      if (childResult !== undefined) {
        childrenHtml += childResult.toString();
      }
    }

    return `<${tagName}${htmlProps}>${childrenHtml}</${tagName}>`;
  }

  private mapTagName(name: string): string {
    const mapping: { [key: string]: string } = {
      bloco: "div",
      texto: "p",
      botao: "button",
      imagem: "img",
      titulo: "h1",
      subtitulo: "h2",
      lista_ordenada: "ol",
      lista_desordenada: "ul",
      item_lista: "li",
    };
    return mapping[name] || name;
  }

  private cssColor(color: string): string {
    const colors: { [key: string]: string } = {
      vermelho: "red",
      azul: "#2196F3",
      verde: "#4CAF50",
      amarelo: "yellow",
      preto: "black",
      branco: "white",
      cinza: "gray",
      rosa: "pink",
      laranja: "orange",
      rosa_claro: "#F8BBD0",
      vermelho_escuro: "#B71C1C",
      rosa_escuro: "#C51162",
      roxo_claro: "#CE93D8",
      roxo: "#9C27B0",
      roxo_escuro: "#6A1B9A",
      azul_claro: "#90CAF9",
      azul_escuro: "#0D47A1",
      verde_claro: "#81C784",
      verde_escuro: "#1B5E20",
      lima: "#CDDC39",
      amarelo_claro: "#FFF59D",
      amarelo_escuro: "#F9A825",
      laranja_claro: "#FFE0B2",
      laranja_escuro: "#E65100",
      marrom: "#795548",
      marrom_claro: "#A1887F",
      marrom_escuro: "#3E2723",
      azul_acizentado: "#607D8B",
      azul_acizentado_claro: "#B0BEC5",
      azul_acizentado_escuro: "#263238",
      cinza_claro: "#BDBDBD",
      cinza_escuro: "#212121",
      amarelo_dourado: "#FFD700",
      rosa_choque: "#FF69b4",
      azul_marinho: "#000080",
      verde_marinho: "#2e8b57",
      violeta: "#ee82ee",
      orquidia: "#DA70D6",
      coral: "#FF7F50",
      salmao: "#FA8072",
      bege: "#F5F5DC",
      marfim: "#FFFFF0",
      lavanda: "#E6E6FA",
      turquesa: "#40E0D0",
      ciano: "#00FFFF",
      bordo: "#B03060",
      magenta: "#FF00FF",
      neve: "#FFFAFA",
      caqui: "#F0E68C",
      verde_menta: "#3EB489",
      azul_royal: "	#4169E1",
    };
    return colors[color] || color;
  }

  // Converte o tipo do valor para o formato amigável do SeteAo
  private getUserFriendlyType(value: any): string {
    if (Array.isArray(value)) return "LISTA";
    if (typeof value === "number") {
      return Number.isInteger(value) ? "INTEIRO" : "REAL";
    }
    if (typeof value === "string") return "TEXTO";
    if (typeof value === "boolean") return "LOGICO";
    if (value === null) return "NULO";
    return "DESCONHECIDO";
  }

  private validateTypeCompatibility(
    type: string,
    value: any,
    id: string,
    node: ASTNode,
  ) {
    switch (type) {
      case "INTEIRO":
        if (!Number.isInteger(value))
          throw new Error(
            this.formatError(
              "Tipo Incompatível",
              `Variável '${id}' espera INTEIRO`,
              node,
            ),
          );
        break;
      case "REAL":
        if (typeof value !== "number")
          throw new Error(
            this.formatError(
              "Tipo Incompatível",
              `Variável '${id}' espera REAL`,
              node,
            ),
          );
        break;
      case "NATURAL":
        if (!Number.isInteger(value) || value < 0)
          throw new Error(
            this.formatError(
              "Tipo Incompatível",
              `Variável '${id}' espera NATURAL`,
              node,
            ),
          );
        break;
      case "TEXTO":
        if (typeof value !== "string")
          throw new Error(
            this.formatError(
              "Tipo Incompatível",
              `Variável '${id}' espera TEXTO`,
              node,
            ),
          );
        break;
      case "LOGICO":
        if (typeof value !== "boolean")
          throw new Error(
            this.formatError(
              "Tipo Incompatível",
              `Variável '${id}' espera LOGICO`,
              node,
            ),
          );
        break;
      case "LISTA":
        if (!Array.isArray(value))
          throw new Error(
            this.formatError(
              "Tipo Incompatível",
              `Variável '${id}' espera LISTA`,
              node,
            ),
          );
        break;
    }
  }

  private async resolveIndexAccess(
    node: ASTNode,
  ): Promise<{ object: any; index: number; value: any }> {
    const object = await this.visit(node.object);
    const index = await this.visit(node.index);

    if (!Array.isArray(object)) {
      throw new Error(
        this.formatError(
          "Erro de Tipo",
          "Tentativa de acessar índice em algo que não é uma LISTA",
          node,
        ),
      );
    }

    if (!Number.isInteger(index)) {
      throw new Error(
        this.formatError(
          "Erro de Índice",
          "Índice deve ser um número INTEIRO",
          node,
        ),
      );
    }

    if (index < 0 || index >= object.length) {
      throw new Error(
        this.formatError(
          "Erro de Índice",
          `Índice ${index} fora dos limites da lista (tamanho ${object.length})`,
          node,
        ),
      );
    }

    return { object, index, value: object[index] };
  }

  private async assignToIndex(node: ASTNode, value: any) {
    const resolved = await this.resolveIndexAccess(node);
    resolved.object[resolved.index] = value;
  }
}

export default SemanticAnalyzer;
