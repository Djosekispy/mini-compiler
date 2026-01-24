## Exemplo de Website Premium em SeteAO

Aqui está um exemplo completo que utiliza variáveis, interpolação e os novos componentes web para criar uma seção de herói (Hero Section) moderna:

```sa
## Configurações de Design ##
VAR nomeUsuario = "Paulino Tyova" : TEXTO.
VAR profissao = "Engenheiro de Software" : TEXTO.
VAR corFundoPrincipal = "preto" : TEXTO.
VAR corDestaque = "laranja" : TEXTO.
VAR corTexto = "branco" : TEXTO.

## Estrutura do Site ##
<bloco propriedades={
    fundo: corFundoPrincipal, 
    padding: "60px 20px", 
    borda: "none"
}>
    <titulo propriedades={cor: corDestaque}>"Olá, eu sou " {nomeUsuario}</titulo>
    
    <bloco propriedades={margem: "10px 0 30px 0"}>
        <titulo propriedades={cor: corTexto}> {profissao} </titulo>
    </bloco>

    <texto propriedades={cor: "cinza", padding: "0 0 40px 0"}>
        "Especialista em criar linguagens de programação e interfaces dinâmicas 
        usando tecnologias de ponta como o compilador SeteAO."
    </texto>

    <bloco>
        <botao propriedades={
            fundo: corDestaque, 
            cor: "preto", 
            padding: "15px 30px", 
            borda: "none"
        }> 
            "Entrar em Contato" 
        </botao>

        <botao propriedades={
            fundo: "rosa", 
            cor: "preto", 
            margem: "0 0 0 20px", 
            padding: "15px 30px",
            borda: "2px solid branco"
        }> 
            "Baixar CV" 
        </botao>
    </bloco>

    <bloco propriedades={margem: "50px 0 0 0", padding: "20px", fundo: "#1e293b"}>
        <texto propriedades={cor: "verde"}> "● Sistema Online e Pronto" </texto>
    </bloco>
</bloco>
```

### O que este código faz?
1. **Variáveis Dinâmicas**: Define cores e textos em variáveis para fácil manutenção.
2. **Interpolação**: Usa `{nomeUsuario}` e `{profissao}` para injetar dados no HTML.
3. **Estilização Real**: Aplica bordas, preenchimentos (padding) e margens para um visual profissional.
4. **Cores Personalizadas**: Utiliza as novas cores `laranja` e `rosa` que você adicionou!
