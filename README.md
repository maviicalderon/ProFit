# ProFit

Rede social de vagas para conectar candidatos e empresas. O site utiliza HTML, CSS e JavaScript com Firebase Authentication e Realtime Database; pode ser hospedado no GitHub Pages sem servidor de aplicação próprio.

## O que funciona

- Cadastro e login com e-mail e senha, recuperação de senha e exibição opcional da senha.
- Perfis de candidato e empregador, com telefone, área de atuação e bio.
- Publicação, edição, cancelamento de edição e exclusão das próprias vagas.
- Busca de vagas, manifestação de interesse e aprovação de candidatos.
- Matches em tempo real e contatos das duas partes.
- Idiomas português/inglês, temas claro/escuro e layout adaptado ao celular.

O match é calculado a partir de uma candidatura em `likes` e uma aprovação em `approvals` para a mesma vaga e candidato. Remover qualquer um desses vínculos desfaz o match. Registros antigos em `matches` não são usados como fonte de verdade; o aplicativo não grava novos matches nesse caminho.

## Correções incluídas

Foram corrigidos o erro de JavaScript que impedia a inicialização, a tradução que apagava campos do formulário, a disputa entre o cadastro e o carregamento do perfil, os listeners que permaneciam após a saída e os matches que continuavam aparecendo sem interesse ou aprovação. As ações exibem erros de conexão/permissão e evitam envios duplicados. Também foram corrigidos contraste do tema escuro, acessibilidade dos controles e conteúdo longo em telas pequenas.

As regras do banco validam os dados e restringem alterações ao dono do perfil, ao candidato e ao empregador responsável pela vaga. O arquivo `database.rules.json` é a fonte das regras; publique-o no Firebase para que as permissões passem a valer no banco hospedado.

## Executar localmente

Na raiz do projeto:

```bash
python3 -m http.server 8080
```

Abra <http://localhost:8080>. Utilize HTTP/HTTPS; abrir `index.html` diretamente como arquivo não é um modo suportado para os módulos JavaScript.

A aplicação local utiliza o Firebase definido em `firebase-config.js`. Confira a configuração do projeto antes de testar manualmente com contas e dados reais.

## Verificações automatizadas

Com Node.js e npm instalados:

```bash
npm ci
npm test
npm run check
```

A suíte de aplicação usa DOM e Firebase simulados, sem criar contas nem alterar dados de produção. O comando `check` verifica a sintaxe dos módulos.

Para verificar as regras, instale também Java compatível com o emulador do Firebase e execute:

```bash
npm --prefix tests/rules ci
npm run test:rules
```

Esses testes usam o emulador local com o projeto isolado `demo-profit`; não publicam regras nem escrevem no Firebase de produção.

## Publicação e configuração

Consulte [QUICK_START.md](QUICK_START.md) para ativar Authentication, publicar as regras e configurar o GitHub Pages. A inclusão das regras no repositório, por si só, não altera o banco hospedado.

Depois de ativado o Pages deste repositório, a URL esperada é <https://maviicalderon.github.io/ProFit/>. A disponibilidade dessa publicação precisa ser confirmada na página de implantação do GitHub.

## Arquivos principais

| Arquivo | Função |
| --- | --- |
| `index.html`, `style.css` | Interface, responsividade e temas |
| `bootstrap.js` | Inicialização e mensagem de falha no carregamento |
| `app.js` | Autenticação, perfis, vagas, interesse, aprovação e matches |
| `i18n.js` | Textos em português e inglês |
| `firebase-config.js` | Configuração pública do projeto Firebase |
| `database.rules.json` | Permissões e validações do Realtime Database |
| `firebase.json`, `.firebaserc` | Configuração do Firebase e emuladores |
| `tests/` | Testes isolados de aplicação e regras |

## E-mail e limites

A recuperação de senha usa o serviço de e-mail do Firebase Authentication. Matches são exibidos no site; não há envio automático de e-mail de match implementado. Os antigos exemplos com credenciais fictícias do EmailJS foram removidos. Veja [EMAIL_SETUP.md](EMAIL_SETUP.md) e [SECURITY.md](SECURITY.md) para o comportamento e os limites atuais.
