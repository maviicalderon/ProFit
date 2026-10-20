# Publicar e configurar o ProFit

## 1. Conferir o projeto Firebase

A configuração pública fica em `firebase-config.js`. O projeto existente é `tcc-mavi`; `firebase.json` aponta para `database.rules.json` e `.firebaserc` identifica o projeto padrão.

No console do Firebase, abra o projeto correspondente. Não substitua a configuração por dados de outro projeto sem também atualizar a configuração de implantação.

## 2. Ativar autenticação

Em **Authentication → Sign-in method**, ative **Email/Password**.

Em **Authentication → Settings → Authorized domains**, inclua `maviicalderon.github.io`. Para testar localmente, confira também `localhost`. Se utilizar um domínio próprio, inclua-o nessa lista.

## 3. Publicar as regras do banco

1. Abra **Realtime Database → Rules** no mesmo projeto da URL presente em `firebase-config.js`.
2. Copie o conteúdo completo de `database.rules.json`.
3. Substitua as regras no editor e clique em **Publish**.

Este passo publica permissões; não apaga os registros existentes. Ter o arquivo no GitHub não atualiza as regras do Firebase automaticamente. Uma mudança no frontend sem a correspondente configuração do banco pode causar mensagens de acesso negado.

## 4. Executar e verificar

Na raiz do projeto:

```bash
python3 -m http.server 8080
```

Acesse <http://localhost:8080>. Não abra a página diretamente por `file://`.

Para rodar as verificações sem escrever no banco de produção:

```bash
npm ci
npm test
npm run check
npm --prefix tests/rules ci
npm run test:rules
```

Os três primeiros comandos exigem Node.js/npm. Os testes de regras também exigem Java e usam o emulador Firebase com o projeto `demo-profit`.

## 5. Ativar GitHub Pages

Depois de enviar os arquivos corrigidos ao repositório:

1. Abra **Settings → Pages** no GitHub.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Selecione a branch **main**, pasta **/(root)** e salve.
4. Aguarde a implantação e confira o endereço informado pelo GitHub.

Para `maviicalderon/ProFit`, a URL esperada depois da ativação é <https://maviicalderon.github.io/ProFit/>. Este documento não confirma que o Pages já esteja ativo.

## 6. Conferir os fluxos com contas de teste

Use duas sessões separadas de navegador, uma para cada papel. Ao executar esta conferência no site publicado, as contas e registros são reais no projeto configurado.

1. Cadastre uma empresa, publique uma vaga e confira os dados salvos.
2. Cadastre um candidato na outra sessão, busque a vaga e clique em **Tenho interesse**.
3. Na empresa, confira o candidato e clique em **Aprovar candidato**.
4. Confira o match e os contatos nas duas sessões.
5. Remova o interesse ou a aprovação e confira que o match desaparece em ambas.
6. Edite uma vaga, cancele a edição e confira que os dados não foram alterados.
7. Exclua uma vaga própria e confira que ela desaparece das listas.
8. Troque idioma e tema, teste no celular, saia da conta e entre com outro usuário.
9. Teste a recuperação de senha com uma caixa de e-mail à qual você tenha acesso.

Se uma conta existente não tiver perfil no banco, o aplicativo permite completar o perfil após o login. Não é necessário criar outra conta com o mesmo e-mail.

## Mensagens comuns

| Situação | O que conferir |
| --- | --- |
| Falha ao carregar o site | Conexão e acesso aos módulos Firebase; recarregue a página |
| Cadastro/login indisponível | Email/Password ativado e configuração correta do Firebase |
| Domínio não autorizado | Domínio da hospedagem na lista de Authentication |
| Acesso negado ao banco | Regras publicadas no projeto e banco correspondentes |
| E-mail já cadastrado | Entre na conta existente ou utilize recuperação de senha |
| E-mail de recuperação não chegou | Endereço informado, spam e configurações do Firebase Authentication |
| Match não apareceu | A vaga precisa existir e ter interesse e aprovação para o mesmo candidato |

E-mails de notificação de match não estão implementados; a confirmação aparece em tempo real na interface.
