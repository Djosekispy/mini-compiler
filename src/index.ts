import fs from "fs";
import path from "path";
import readlineSync from "readline-sync";
import Lexer from "./lexer/Lexer";
import Parser from "./parser/Parser";
import SemanticAnalyzer from "./semantic/Semantic";
import { TokenType } from "./lexer/ILexer";

/**
 * PONTO de entrada do compilador.
 * O fluxo consiste em:
 * 1. Ler o código-fonte de um arquivo.
 * 2. Realizar a Análise Léxica (transformar string em tokens).
 * 3. Realizar a Análise Sintática (transformar tokens em uma AST).
 * 4. Realizar a Análise Semântica e Execução (percorrer a AST e processar a lógica).
 * Ola Mundo
 */

const inputDir = path.join(__dirname, "input");

function runMenu() {
  const files = fs.readdirSync(inputDir).filter(file => file.endsWith(".sa"));

  if (files.length === 0) {
    console.log("\x1b[31mNenhum arquivo .sa encontrado na pasta src/input.\x1b[0m");
    return;
  }

  console.log("\x1b[36m\x1b[1m========================================\x1b[0m");
  console.log("\x1b[36m\x1b[1m        MINI-COMPILER - MENU           \x1b[0m");
  console.log("\x1b[36m\x1b[1m========================================\x1b[0m");
  console.log("Escolha um programa para executar:");

  files.forEach((file, index) => {
    console.log(`  \x1b[33m${index + 1}\x1b[0m. ${file}`);
  });
  console.log(`  \x1b[33m0\x1b[0m. Sair`);
  console.log("\x1b[36m----------------------------------------\x1b[0m");

  const choice = readlineSync.question("Opcao: ");
  const index = parseInt(choice, 10) - 1;

  if (choice === "0") {
    console.log("Saindo...");
    return;
  }

  if (index >= 0 && index < files.length) {
    const selectedFile = files[index];
    if (selectedFile) {
      executeFile(selectedFile);
    }
  } else {
    console.log("\x1b[31mOpcao invalida!\x1b[0m");
    runMenu();
  }
}

function executeFile(filename: string) {
  const filePath = path.join(inputDir, filename);
  const code = fs.readFileSync(filePath, "utf-8");

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
    semantic.execute(ast);

    console.log(`\n\x1b[32mExecução de ${filename} finalizada com sucesso.\x1b[0m`);
  } catch (error: any) {
    console.error(error.message);
  }
}

runMenu();
