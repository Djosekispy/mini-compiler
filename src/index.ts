import Lexer from "./lexer/Lexer";
import Parser from "./parser/Parser";
import SemanticAnalyzer from "./semantic/Semantic";
import fs from "fs";
import path from "path";

/**
 * Ponto de entrada do compilador.
 * O fluxo consiste em:
 * 1. Ler o código-fonte de um arquivo.
 * 2. Realizar a Análise Léxica (transformar string em tokens).
 * 3. Realizar a Análise Sintática (transformar tokens em uma AST).
 * 4. Realizar a Análise Semântica e Execução (percorrer a AST e processar a lógica).
 * Ola Mundo
 */

// Caminho do arquivo de entrada (.nt)
const filePath = path.join(__dirname, "input", "code.nt");
const code = fs.readFileSync(filePath, "utf-8");

// 1. Instância do Lexer com o código bruto
const lexer = new Lexer(code);

// 2. Instância do Parser que consome o Lexer para gerar a AST
const parser = new Parser(lexer);
const ast = parser.parse();

// 3. Instância do Analisador Semântico que executa a AST gerada
const semantic = new SemanticAnalyzer();
semantic.execute(ast);