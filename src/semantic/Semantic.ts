import ASTNode from "../parser/IParser";
import readlineSync from "readline-sync";
import { execSync } from "child_process";
import { error } from "console";

interface Symbol {
  name: string,
  value: number | string | boolean;
  type: "INTEIRO" | "REAL" | "NATURAL" | "TEXTO" | "LOGICO";
}


class Scope {
  private symbols = new Map<string, Symbol>();
  add(symbol: Symbol): void {
    if (this.symbols.has(symbol.name)) {
      throw new Error(`'${symbol.name}' a variável já foi declarada neste escopo`);
    }
    this.symbols.set(symbol.name, symbol);
  }
  lookup(name: string): Symbol | undefined {
    return this.symbols.get(name);
  }
  //Remover escopo ao sair
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
class errorSemantic extends Error {
  constructor(
    public typeError: string,
    public details: string,
    public node: ASTNode
  ) {
    super(details);
  }
}

class SemanticAnalyzer {
  // private simbols: Record<string, Symbol> = {};
  private filename: string;
  private printCallback: (message: string) => void;
  private inputCallback: (prompt: string) => Promise<string>;

  private stackScopes: Scope[] = [];
  private classeRecente?: string;
  private recenteParentClasse?: string;
  private symbolDeclared = new Set<string>();
  private webOutput: string = "";

  public getWebOutput(): string {
    return this.webOutput;
  }

  private currentScope(): Scope {
    if (this.stackScopes.length === 0) {
      throw new Error('Erro: pilha de escopos vazia.')
    }
    return this.stackScopes[this.stackScopes.length - 1]!;

  }

  //Entrar em um novo escopo
  private enterScope() {
    this.stackScopes.push(new Scope());
  }
  //Sair do escopo actual
  private outScope() {
    this.stackScopes.pop();
  }

  // private symbolExistOutScope(name:string): boolean{
  //   return this.stackScopes.some(scope => scope.lookup(name) !== undefined);
  // }
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
      throw new errorSemantic("A váriavel está fora do escopo!", `A váriavel '${name}' foi declarada, mas não é global e sim local.`, node);
    }
    throw new errorSemantic("A variável não foi declarada!", `A variável '${name}' não foi declarada.`, node);
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
    this.enterScope();
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
        console.error(
          this.formatError(er.typeError, er.details, er.node)
        );
      } else {
        throw er;
      }
    } finally {
      this.outScope();
    }
  }

  /**
   * Função recursiva que visita cada nó da AST e executa a lógica correspondente.
   */
  private async visit(node: ASTNode): Promise<any> {
    switch (node.type) {
      // Declaração de variável
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

        // this.simbols[node.id] = {
        //   value,
        //   type: node.varType,
        // };
        this.currentScope().add({
          name: node.id, value, type: node.varType,
        });

        this.symbolDeclared.add(node.id);
        break;
      }

      // Atribuição de valor a variável ou índice
      case "Assignment": {
        const target = node.target;
        const newValue = await this.visit(node.value);

        if (target.type === "IDENTIFICADOR" || target.type === "VAR") {
          const id = target.type === "IDENTIFICADOR" ? target.name : target.id;
          const symbol = this.lookupSymbol(id, node);

          if (!symbol) {
            throw new Error(this.formatError("Variável Não Declarada", `Variável '${id}' não foi declarada`, node));
          }

          // Validação de tipo
          this.validateTypeCompatibility(symbol.type, newValue, id, node);

          symbol.value = newValue;
        } else if (target.type === "IndexAccess") {
          await this.assignToIndex(target, newValue);
        } else {
          throw new Error(`Alvo de atribuição inválido: ${target.type}`);
        }
        break;
      }

      case "UpdateStatement": {
        const target = node.target;

        let oldValue: number;
        let symbol: any = null;
        let indexAccess: any = null;

        if (target.type === "IDENTIFICADOR") {
          symbol = this.lookupSymbol(target.name, node);
          if (!symbol) {
            throw new Error(this.formatError("Variável Não Declarada", `Variável '${target.name}' não foi declarada`, node));
          }
          if (symbol.type !== "INTEIRO" && symbol.type !== "REAL" && symbol.type !== "NATURAL") {
            throw new Error(this.formatError("Erro de Tipo", `Operador '${node.operator}' só pode ser usado em tipos numéricos`, node));
          }
          oldValue = symbol.value as number;
        } else if (target.type === "IndexAccess") {
          indexAccess = await this.resolveIndexAccess(target);
          if (typeof indexAccess.value !== "number") {
            throw new Error(this.formatError("Erro de Tipo", `Operador '${node.operator}' só pode ser usado em valores numéricos`, node));
          }
          oldValue = indexAccess.value;
        } else {
          throw new Error(`Alvo de atualização inválido: ${target.type}`);
        }

        let newValue: number;
        switch (node.operator) {
          case "++": newValue = oldValue + 1; break;
          case "--": newValue = oldValue - 1; break;
          case "+=": newValue = oldValue + (await this.visit(node.value)); break;
          case "-=": newValue = oldValue - (await this.visit(node.value)); break;
          default: throw new Error(`Operador desconhecido: ${node.operator}`);
        }

        if (symbol) {
          if (symbol.type === "NATURAL" && newValue < 0) throw new Error(this.formatError("Erro de Tipo (NATURAL)", "Não pode ser negativo", node));
          symbol.value = newValue;
        } else {
          indexAccess.object[indexAccess.index] = newValue;
        }
        break;
      }

      case "ListLiteral": {
        const elements = [];
        for (const element of node.elements) {
          elements.push(await this.visit(element));
        }
        return elements;
      }

      case "IndexAccess": {
        const resolved = await this.resolveIndexAccess(node);
        return resolved.value;
      }

      // Comando print para saida de dados
      case "PrintStatement": {
        let output = "";

        for (const arg of node.arguments) {
          const value = await this.visit(arg);

          if (
            typeof value !== "string" &&
            typeof value !== "number" &&
            typeof value !== "boolean"
          ) {
            throw new Error(
              this.formatError(
                "Erro de Tipo",
                "EXIBIR aceita apenas TEXTO, NUMERO ou LOGICO",
                node,
              ),
            );
          }

          // Formatação: REAL com vírgula
          if (typeof value === "number" && !Number.isInteger(value)) {
            output += value.toString().replace(".", ",");
          } else {
            output += value.toString();
          }
        }

        this.printCallback(output);
        break;
      }

      // Comando EXIBIR para entrada de dados
      case "InputStatement": {
        const symbol = this.lookupSymbol(node.id, node);

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

        let input = "";
        input = await this.inputCallback(msg + " ");

        switch (symbol.type) {
          case "INTEIRO": {
            if (!/^-?\d+$/.test(input)) {
              throw new Error(
                this.formatError(
                  "Entrada inválida",
                  `Esperado INTEIRO (apenas números), recebido '${input}'`,
                  node,
                ),
              );
            }
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
            if (!/^-?\d+(,\d+)?$/.test(input)) {
              throw new Error(
                this.formatError(
                  "Entrada inválida",
                  `Esperado REAL (use vírgula, ex: 10,5), recebido '${input}'`,
                  node,
                ),
              );
            }
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

      // Comando Para repetição
      case "WhileStatement": {
        let iterations = 0;
        const MAX_ITERATIONS = 10000;

        while (await this.visit(node.condition)) {
          this.enterScope();
          let shouldContinue = false;

          try {
            for (const stmt of node.body) {
              await this.visit(stmt);
            }
          } catch (signal) {
            if (signal instanceof BreakSignal) {
              break;
            }

            if (signal instanceof ContinueSignal) {
              shouldContinue = true;
            } else {
              throw signal;
            }
          }
          finally {
            this.outScope();
          }

          iterations++;
          if (iterations > MAX_ITERATIONS) {
            throw new Error("Loop ENQUANTO excedeu 10000 iterações.");
          }

          if (shouldContinue) {
            continue;
          }
        }

        break;
      }

      case "ForStatement": {
        let iterations = 0;
        const MAX_ITERATIONS = 10000;

        this.enterScope();

        // Inicialização
        await this.visit(node.init);
        try {

          while (true) {
            // Condição
            const cond = await this.visit(node.condition);
            if (!cond) break;
            this.enterScope();

            // let shouldContinue = false;

            try {
              for (const stmt of node.body) {
                await this.visit(stmt);
              }
            } catch (signal) {
              if (signal instanceof BreakSignal) {
                break;
              }

              if (signal instanceof ContinueSignal) {
                // shouldContinue = true;
              } else {
                throw signal;
              }
            }
            finally {
              this.outScope();
            }

            // Incremento (SEMPRE EXECUTA)
            await this.visit(node.increment);

            iterations++;
            if (iterations > MAX_ITERATIONS) {
              throw new Error("Loop PARA excedeu 10000 iterações.");
            }

            // if (shouldContinue) {
            //   continue;
            // }
          }
        } finally {
          this.outScope();
        }

        break;
      }

      case "DoWhileStatement": {
        let iterations = 0;
        const MAX_ITERATIONS = 10000;

        do {
          this.enterScope();
          let shouldContinue = false;

          try {
            for (const stmt of node.body) {
              await this.visit(stmt);
            }
          } catch (signal) {
            if (signal instanceof BreakSignal) {
              break;
            }

            if (signal instanceof ContinueSignal) {
              shouldContinue = true;
            } else {
              throw signal;
            }
          } finally {
            this.outScope();
          }

          iterations++;
          if (iterations > MAX_ITERATIONS) {
            throw new Error("Loop FACA...ENQUANTO excedeu 10000 iterações.");
          }

          // continue no do...while cai aqui
          if (shouldContinue) {
            // não faz nada, apenas deixa cair para a condição
          }
        } while (await this.visit(node.condition));

        break;
      }

      // Controle de fluxo - PARAR
      case "BreakStatement": {
        throw new BreakSignal();
      }

      // Controle de fluxo - CONTINUAR
      case "ContinueStatement": {
        throw new ContinueSignal();
      }

      // Operações matemáticas especiais
      case "CalcStatement": {
        const operation = node.operation; // "RAIZ" ou "EXPOENTE"
        const args = node.arguments;

        if (args.length !== 2) {
          throw new Error(
            `CalcStatement precisa de 2 argumentos, encontrou ${args.length}`,
          );
        }

        // Avalia os dois argumentos
        const arg1 = await this.visit(args[0]); // pode ser qualquer expressão
        const arg2 = await this.visit(args[1]); // idem

        let result: number;

        switch (operation) {
          case "RAIZ":
            if (arg2 === 0)
              throw new Error("Não é possível calcular raiz de índice zero.");
            result = Math.pow(arg1, 1 / arg2);
            break;

          case "EXPOENTE":
            result = Math.pow(arg1, arg2);
            break;

          default:
            throw new Error(`Operação desconhecida: ${operation}`);
        }
        break;
      }

      case "WebTag":
        return await this.visitWebTag(node);

      case "ObjectLiteral":
        return await this.visitObjectLiteral(node);

      // Valor literal
      case "NumberLiteral":
        return node.value;

      // Expressao unária
      case "UnaryExpression":
        const val = await this.visit(node.argument);
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
        const cond = await this.visit(node.condition);

        if (typeof cond !== "boolean") {
          throw new Error(
            this.formatError(
              "Erro de Tipo",
              "Condição do SE deve ser lógica",
              node,
            ),
          );
        }

        // if (cond) {
        //   // SE verdadeiro
        //   for (const stmt of node.trueBranch) {
        //     await this.visit(stmt);
        //   }
        // } else if (node.falseBranch) {
        //   // Se Falso
        //   if (Array.isArray(node.falseBranch)) {
        //     for (const stmt of node.falseBranch) {
        //       await this.visit(stmt);
        //     }
        //   } else {
        //     // recursivamente visita o IfStatement (SENAO SE)
        //     await this.visit(node.falseBranch as ASTNode);
        //   }
        // }
        if (cond) {
          this.enterScope();          // inicia o escopo local

          for (const stmt of node.trueBranch) {
            await this.visit(stmt);
          }

          this.outScope();            //fecha o escopo
        }
        else if (node.falseBranch) {
          this.enterScope();

          if (Array.isArray(node.falseBranch)) {
            for (const stmt of node.falseBranch) {
              await this.visit(stmt);
            }
          } else {
            await this.visit(node.falseBranch);
          }

          this.outScope();
        }

        break;
      }

      case "LogicalExpression":
        const l = await this.visit(node.left);
        const r = await this.visit(node.right);

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
        const symbol = this.lookupSymbol(node.name, node);
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
        const left = await this.visit(node.left);
        const right = await this.visit(node.right);

        // Suporte para concatenação de strings com o operador '+'
        if (node.operator === "+") {
          if (typeof left === "string" || typeof right === "string") {
            return String(left) + String(right);
          }
        }

        // Validação de tipos: ambos devem ser números para outras operações aritméticas
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
        return undefined;
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
    if (props.fundo) style += `background-color: ${this.cssColor(props.fundo)}; `;
    if (props.cor) style += `color: ${this.cssColor(props.cor)}; `;
    if (props.largura) style += `width: ${props.largura}; `;
    if (props.altura) style += `height: ${props.altura}; `;
    if (props.borda) style += `border: ${props.borda}; `;
    if (props.margem) style += `margin: ${props.margem}; `;
    if (props.padding) style += `padding: ${props.padding}; `;

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
      caixa: "div",
      titulo: "h1",
    };
    return mapping[name] || name;
  }

  private cssColor(color: string): string {
    const colors: { [key: string]: string } = {
      vermelho: "red",
      azul: "blue",
      verde: "green",
      amarelo: "yellow",
      preto: "black",
      branco: "white",
      cinza: "gray",
      rosa: "pink",
      laranja: "orange",
    };
    return colors[color] || color;
  }

  private getUserFriendlyType(value: any): string {
    if (Array.isArray(value)) return "LISTA";
    if (typeof value === "number") return "NUMERO";
    if (typeof value === "string") return "TEXTO";
    if (typeof value === "boolean") return "LOGICO";
    if (value === null) return "NULO";
    return typeof value;
  }

  private validateTypeCompatibility(type: string, value: any, id: string, node: ASTNode) {
    switch (type) {
      case "INTEIRO":
        if (!Number.isInteger(value)) throw new Error(this.formatError("Tipo Incompatível", `Variável '${id}' espera INTEIRO`, node));
        break;
      case "REAL":
        if (typeof value !== "number") throw new Error(this.formatError("Tipo Incompatível", `Variável '${id}' espera REAL`, node));
        break;
      case "NATURAL":
        if (!Number.isInteger(value) || value < 0) throw new Error(this.formatError("Tipo Incompatível", `Variável '${id}' espera NATURAL`, node));
        break;
      case "TEXTO":
        if (typeof value !== "string") throw new Error(this.formatError("Tipo Incompatível", `Variável '${id}' espera TEXTO`, node));
        break;
      case "LOGICO":
        if (typeof value !== "boolean") throw new Error(this.formatError("Tipo Incompatível", `Variável '${id}' espera LOGICO`, node));
        break;
      case "LISTA":
        if (!Array.isArray(value)) throw new Error(this.formatError("Tipo Incompatível", `Variável '${id}' espera LISTA`, node));
        break;
    }
  }

  private async resolveIndexAccess(node: ASTNode): Promise<{ object: any, index: number, value: any }> {
    const object = await this.visit(node.object);
    const index = await this.visit(node.index);

    if (!Array.isArray(object)) {
      throw new Error(this.formatError("Erro de Tipo", "Tentativa de acessar índice em algo que não é uma LISTA", node));
    }

    if (!Number.isInteger(index)) {
      throw new Error(this.formatError("Erro de Índice", "Índice deve ser um número INTEIRO", node));
    }

    if (index < 0 || index >= object.length) {
      throw new Error(this.formatError("Erro de Índice", `Índice ${index} fora dos limites da lista (tamanho ${object.length})`, node));
    }

    return { object, index, value: object[index] };
  }

  private async assignToIndex(node: ASTNode, value: any) {
    const resolved = await this.resolveIndexAccess(node);
    resolved.object[resolved.index] = value;
  }
}

export default SemanticAnalyzer;
