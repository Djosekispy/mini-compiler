// src/ir/tac.ts

export interface TacInstruction {
  op: string;  // Operador: '=', '+', 'print', etc.
  arg1?: string;  // Operando 1 (ex: variável ou temp)
  arg2?: string;  // Operando 2
  result?: string;  // Resultado (ex: temp ou variável)
}

export type TacProgram = TacInstruction[];