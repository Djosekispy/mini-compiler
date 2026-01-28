import { spawnSync } from "child_process";

// Força o terminal a usar UTF-8 no Windows para suportar acentos
if (process.platform === "win32") {
  try {
    spawnSync("chcp", ["65001"], { stdio: "inherit" });
  } catch (e) {
    // Silently fail if chcp is not available
  }
}

import fs from "fs";
import path from "path";
import readlineSync from "readline-sync";
import Lexer from "./lexer/Lexer";
import Parser from "./parser/Parser";
import SemanticAnalyzer from "./semantic/Semantic";
import { TokenType } from "./lexer/ILexer";

if (process.platform === "win32") {
  process.stdin.setEncoding("utf-8");
}

/**
 * PONTO de entrada do compilador.
 * O fluxo consiste em:
 * 1. Ler o código-fonte de um arquivo.
 * 2. Realizar a Análise Léxica (transformar string em tokens).
 * 3. Realizar a Análise Sintática (transformar tokens em uma AST).
 * 4. Realizar a Análise Semântica e Execução (percorrer a AST e processar a lógica).
 * Ola Mundo
 */

const isPkg = (process as any).pkg !== undefined;
const inputDir = isPkg
  ? path.join(path.dirname(process.execPath), "examples")
  : path.join(__dirname, "input");
var continuar = true

async function executarMenu() {
  const files = fs.readdirSync(inputDir).filter(file => file.endsWith(".sa"));

  if (files.length === 0) {
    console.log("\x1b[31mNenhum arquivo .sa encontrado na pasta src/input.\x1b[0m");
    return;
  }

  console.log("\x1b[36m\x1b[1m===============================================\x1b[0m");
  console.log("\x1b[36m\x1b[1m        MINI-COMPILER - PANDU-ALI - MENU           \x1b[0m");
  console.log("\x1b[36m\x1b[1m===============================================\x1b[0m");
  console.log("Escolha um programa para executar:");

  files.forEach((file, index) => {
    console.log(`  \x1b[33m${index + 1}\x1b[0m. ${file}`);
  });
  console.log(`  \x1b[33m0\x1b[0m. Sair`);
  console.log("\x1b[36m----------------------------------------\x1b[0m");

  const choice = readlineSync.question("Opção: ");
  const index = parseInt(choice, 10) - 1;

  if (choice === "0") {
    console.log("Saindo...");
    continuar = false

    return;
  }

  if (index >= 0 && index < files.length) {
    const selectedFile = files[index];
    if (selectedFile) {
      await executeFile(selectedFile);
      console.log("\x1b[36m-----------------------------------------------\x1b[0m");
      readlineSync.question("Pressione \x1b[1mEnter\x1b[0m para voltar ao menu...");
    }
  } else {
    console.log("\x1b[31mOpção inválida!\x1b[0m");
    readlineSync.question("Pressione \x1b[1mEnter\x1b[0m para tentar novamente...");
  }
}

async function executeFile(filename: string) {
  const filePath = path.join(inputDir, filename);
  const code = fs.readFileSync(filePath, "utf-8");

  console.clear(); // Limpa a tela antes de executar
  console.log(`\x1b[32mExecutando: ${filename}...\x1b[0m\n`);

  try {
    // 1. Instância do Lexer para pré-análise de erros
    const errorScanner = new Lexer(code, filename);
    let token = errorScanner.getNextToken();
    while (token.type !== TokenType.EOF) {
      token = errorScanner.getNextToken();
    }

    if (errorScanner.errors.length > 0) {
      errorScanner.errors.forEach((err) => console.error(err));
      return;
    }

    // 2. Parser
    const lexer = new Lexer(code, filename);
    const parser = new Parser(lexer);
    const ast = parser.parse();

    // 3. Analisador Semântico e Execução
    const semantic = new SemanticAnalyzer(filename);
    await semantic.execute(ast);

    console.log(`\n\x1b[32mExecução de ${filename} finalizada com sucesso.\x1b[0m`);
  } catch (error: any) {
    console.error(error.message);
  }
}

// do {
console.clear(); // Limpa a tela antes de mostrar o menu
executarMenu();
// } while (continuar)
