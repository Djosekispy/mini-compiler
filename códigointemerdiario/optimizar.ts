

import { TacInstruction, TacProgram } from './tac';

export class TacOptimizer {
  optimize(program: TacProgram): TacProgram {
    let optimized = [...program];  // Cópia

    // Aplicar propagação de constantes
    optimized = this.constantPropagation(optimized);

    // Aplicar eliminação de subexpressões comuns
    optimized = this.commonSubexpressionElimination(optimized);

    // Aplicar eliminação de código morto (deve ser após as outras)
    optimized = this.deadCodeElimination(optimized);

    return optimized;
  }

  private constantPropagation(program: TacProgram): TacProgram {
    const constants: Map<string, string> = new Map();  // var/temp -> valor constante
    const newProgram: TacProgram = [];

    for (const instr of program) {
      let arg1 = instr.arg1 ? this.replaceWithConstant(instr.arg1, constants) : undefined;
      let arg2 = instr.arg2 ? this.replaceWithConstant(instr.arg2, constants) : undefined;

      if (instr.op === '=') {
        if (arg1 && !isNaN(parseFloat(arg1))) {  // Se arg1 é constante
          constants.set(instr.result!, arg1);
        }
        // Push type-safe, definindo só campos presentes
        const updatedInstr: TacInstruction = { op: instr.op, result: instr.result };
        if (arg1 !== undefined) updatedInstr.arg1 = arg1;
        newProgram.push(updatedInstr);
      } else if (['+', '-', '*', '/'].includes(instr.op) && arg1 && arg2 && !isNaN(parseFloat(arg1)) && !isNaN(parseFloat(arg2))) {
        // Avalia se ambos args são constantes (expandido para outros ops)
        let resultValue: number;
        switch (instr.op) {
          case '+': resultValue = parseFloat(arg1) + parseFloat(arg2); break;
          case '-': resultValue = parseFloat(arg1) - parseFloat(arg2); break;
          case '*': resultValue = parseFloat(arg1) * parseFloat(arg2); break;
          case '/': resultValue = parseFloat(arg1) / parseFloat(arg2); break;
          default: resultValue = NaN;
        }
        if (!isNaN(resultValue)) {
          const resultStr = resultValue.toString();
          constants.set(instr.result!, resultStr);

          // Cria nova instrução de forma type-safe, definindo só campos presentes
          const newInstr: TacInstruction = {
            op: '=',
            arg1: resultStr,
            result: instr.result
          };
          newProgram.push(newInstr);
          continue;
        }
      }

      // Fallback para instruções não otimizadas (type-safe)
      const updatedInstr: TacInstruction = { op: instr.op };
      if (arg1 !== undefined) updatedInstr.arg1 = arg1;
      if (arg2 !== undefined) updatedInstr.arg2 = arg2;
      if (instr.result !== undefined) updatedInstr.result = instr.result;
      newProgram.push(updatedInstr);
    }
    return newProgram;
  }

  private replaceWithConstant(varName: string, constants: Map<string, string>): string {
    return constants.has(varName) ? constants.get(varName)! : varName;
  }

  private commonSubexpressionElimination(program: TacProgram): TacProgram {
    const exprToTemp: Map<string, string> = new Map();  // chave: 'op arg1 arg2' -> temp
    const newProgram: TacProgram = [];

    for (const instr of program) {
      if (instr.op !== '=' && instr.op !== 'print' && instr.arg1 && instr.arg2 && instr.result) {  // Para ops como +, -, etc.
        const key = `${instr.op} ${instr.arg1} ${instr.arg2}`;
        if (exprToTemp.has(key)) {
          // Substitui por temp existente (type-safe)
          const newInstr: TacInstruction = {
            op: '=',
            arg1: exprToTemp.get(key)!,
            result: instr.result
          };
          newProgram.push(newInstr);
          continue;
        } else {
          exprToTemp.set(key, instr.result);
        }
      }
      // Push da instrução original ou atualizada (type-safe)
      const updatedInstr: TacInstruction = { op: instr.op };
      if (instr.arg1 !== undefined) updatedInstr.arg1 = instr.arg1;
      if (instr.arg2 !== undefined) updatedInstr.arg2 = instr.arg2;
      if (instr.result !== undefined) updatedInstr.result = instr.result;
      newProgram.push(updatedInstr);
    }
    return newProgram;
  }

  private deadCodeElimination(program: TacProgram): TacProgram {
    const usedVars: Set<string> = new Set();
    // Passo reverso: marca vars usadas (de print e atribuições que levam a usadas)
    for (let i = program.length - 1; i >= 0; i--) {
      const instr = program[i];
      if (!instr) continue;  // Safe-guard para possível undefined, embora o loop deva prevenir
      if (instr.op === 'print' && instr.arg1) {
        usedVars.add(instr.arg1);
      } else if (instr.result && usedVars.has(instr.result)) {
        if (instr.arg1) usedVars.add(instr.arg1);
        if (instr.arg2) usedVars.add(instr.arg2);
      }
    }
    // Filtra instruções onde result é usado ou é print
    return program.filter((instr): instr is TacInstruction => {
      if (!instr) return false;
      return instr.op === 'print' || (instr.result && usedVars.has(instr.result));
    });
  }
}