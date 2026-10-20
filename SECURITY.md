# Segurança e contrato de dados do ProFit

## Autenticação

As contas e senhas são gerenciadas pelo Firebase Authentication. O aplicativo não grava senhas no Realtime Database nem aplica hash próprio no navegador. A senha é enviada ao serviço de autenticação através de sua conexão HTTPS; espaços digitados na senha são preservados.

A configuração em `firebase-config.js` identifica publicamente o projeto e não substitui autorização. Nunca inclua credenciais de serviço, chaves privadas ou tokens administrativos no frontend ou no repositório.

## Permissões no Realtime Database

`database.rules.json` define as permissões e validações. As regras precisam ser publicadas no console do Firebase para valerem no ambiente hospedado. A raiz não concede leitura ou escrita genérica.

| Dados | Leitura | Escrita |
| --- | --- | --- |
| `users` | O usuário lê o próprio perfil; empregadores podem ler perfis; usuários autenticados podem consultar individualmente perfis de empresas | O dono cria/atualiza o perfil; UID e papel não podem ser trocados após a criação |
| `jobs` | Usuários autenticados | Empregadores criam vagas e alteram/excluem apenas as próprias |
| `likes` | O candidato lê seus interesses; empregadores podem ler candidaturas | Candidato gerencia o próprio interesse; o empregador responsável pode remover vínculos ao excluir uma vaga |
| `approvals` | Candidato consulta sua aprovação; empregador responsável consulta aprovações da própria vaga | O empregador responsável aprova candidatos interessados; candidato pode retirar a própria aprovação ao remover interesse |
| `matches` legado | Sem leitura pelo aplicativo | Sem criação de novos registros; remoções limitadas aos envolvidos para limpeza de dados antigos |

As regras validam campos obrigatórios, tipos e limites de comprimento. As verificações de interface ajudam na experiência de uso; a autorização é aplicada pelo banco.

## Matches e consistência

O aplicativo calcula os matches usando vagas existentes, `likes` e `approvals`. Um registro antigo em `matches` não confirma uma candidatura. Ao retirar interesse ou aprovação, o match deixa de aparecer. Ao excluir uma vaga, os vínculos correspondentes são removidos pela operação do responsável.

O cadastro aguarda a gravação do perfil antes de carregar o painel. Se uma conta existir no Authentication mas o perfil estiver ausente, a interface permite completá-lo. Listeners e dados em memória são limpos ao sair ou trocar de conta.

## Visibilidade dos contatos

Nome, e-mail, telefone, área e bio fazem parte dos perfis armazenados. As regras permitem aos empregadores consultar perfis de candidatos e candidaturas. Perfis de empresas podem ser consultados individualmente por usuários autenticados para mostrar seus contatos. O produto não restringe todos os dados de contato exclusivamente à existência de um match.

O papel de empregador é escolhido no cadastro; não há verificação empresarial, aprovação manual de empresas ou moderação implementada. Portanto, usuários podem cadastrar esse papel e obter a visibilidade correspondente. Considere esse comportamento ao definir os dados aceitos pelo serviço.

## Interface e limites

Conteúdo de usuários exibido em HTML é escapado. Ações são identificadas por atributos `data-action`, sem inserir identificadores em handlers JavaScript inline. Falhas de conexão e permissão são apresentadas na interface, e botões de envio ficam bloqueados durante a operação.

Não há backend próprio de notificações por e-mail, verificação empresarial, exportação/exclusão de conta pela interface, controle administrativo ou política de retenção implementados. O projeto não declara conformidade regulatória apenas por utilizar Firebase. Requisitos adicionais de operação precisam ser definidos antes de disponibilizar dados pessoais a um público amplo.

## Verificação isolada

```bash
npm ci
npm test
npm run check
npm --prefix tests/rules ci
npm run test:rules
```

Os testes de aplicação usam um Firebase simulado. Os testes de autorização usam o emulador local e o projeto `demo-profit`, com casos de acesso permitido e negado. Os comandos não criam contas no projeto hospedado, não alteram seu banco e não publicam regras. Testes manuais usando `firebase-config.js` consultam o projeto real configurado.
