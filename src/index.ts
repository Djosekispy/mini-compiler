import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import readlineSync from "readline-sync";

import Lexer from "./lexer/Lexer";
import { TokenType } from "./lexer/ILexer";
import Parser from "./parser/Parser";
import SemanticAnalyzer from "./semantic/Semantic";
import { Preprocessor } from "./Preprocessador/processador";
import { TacGenerator } from "./codigointemerdiario/gerador";
import { TacOptimizer } from "./codigointemerdiario/optimizar";

// -----------------------------------------------------------------------------
// Configuração do terminal (Windows / UTF-8)
// -----------------------------------------------------------------------------
if (process.platform === "win32") {
  try {
    spawnSync("chcp", ["65001"], { stdio: "inherit" });
  } catch (e) {
    // Silently fail if chcp is not available
  }
}

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

// -----------------------------------------------------------------------------
// Configuração de diretório de entrada
// -----------------------------------------------------------------------------
const isPkg = (process as any).pkg !== undefined;

const inputDir = isPkg
  ? path.join(path.dirname(process.execPath), "examples")
  : path.join(__dirname, "input");

const outputDir = isPkg
  ? path.join(path.dirname(process.execPath), "output")
  : path.join(__dirname, "output");

var continuar = true;

// -----------------------------------------------------------------------------
// Menu principal
// -----------------------------------------------------------------------------
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
    continuar = false;
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

// -----------------------------------------------------------------------------
// Execução de ficheiros
// -----------------------------------------------------------------------------
async function executeFile(filename: string) {
  const filePath = path.join(inputDir, filename);

  console.clear();
  console.log(`\x1b[32mExecutando: ${filename}...\x1b[0m\n`);

  try {
    // -------------------------------------------------------------------------
    // 1. Leitura do código-fonte
    // -------------------------------------------------------------------------
    const rawCode = fs.readFileSync(filePath, "utf-8");

    // -------------------------------------------------------------------------
    // 2. Pré-processamento
    // -------------------------------------------------------------------------
    const preprocessor = new Preprocessor([inputDir]);
    const cleanCode = preprocessor.processFile(filePath);

    fs.writeFileSync(
      path.join(outputDir, filename + ".pp"),
      cleanCode
    );

    // -------------------------------------------------------------------------
    // 3. Análise Léxica (verificação de erros)
    // -------------------------------------------------------------------------
    const errorScanner = new Lexer(cleanCode, filename);
    let token = errorScanner.getNextToken();

    while (token.type !== TokenType.EOF) {
      token = errorScanner.getNextToken();
    }

    if (errorScanner.errors.length > 0) {
      errorScanner.errors.forEach(err => console.error(err));
      return;
    }

    // -------------------------------------------------------------------------
    // 4. Análise Sintática (AST)
    // -------------------------------------------------------------------------
    const lexer = new Lexer(cleanCode, filename);
    const parser = new Parser(lexer);
    const ast = parser.parse();

    // -------------------------------------------------------------------------
    // 5. Geração de Código Intermediário (TAC)
    // -------------------------------------------------------------------------
    const generator = new TacGenerator();
    const tacOriginal = generator.generate(ast);


    // -------------------------------------------------------------------------
    // 6. Otimização do TAC
    // -------------------------------------------------------------------------
    const optimizer = new TacOptimizer();
    const tacOptimized = optimizer.optimize(tacOriginal);

    // (Opcional para debug)
   
   console.log("TAC Original:", tacOriginal);
   console.log("TAC Otimizado:", tacOptimized);

    // -------------------------------------------------------------------------
    // 7. Análise Semântica e Execução
    // -------------------------------------------------------------------------
    const semantic = new SemanticAnalyzer(filename);
    await semantic.execute(ast);

    console.log(
      `\n\x1b[32mExecução de ${filename} finalizada com sucesso.\x1b[0m`
    );

  } catch (error: any) {
    console.error("\x1b[31mErro durante a execução:\x1b[0m");
    console.error(error.message);
  }
  
}


executarMenu();
