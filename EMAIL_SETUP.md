# E-mails no ProFit

## Recuperação de senha

O botão **Esqueci minha senha** utiliza `sendPasswordResetEmail` do Firebase Authentication. Não depende de EmailJS nem de um servidor de e-mail no frontend.

Para configurar:

1. Ative **Email/Password** no Firebase Authentication do projeto definido em `firebase-config.js`.
2. Confira o domínio da hospedagem em **Authentication → Settings → Authorized domains**.
3. Em **Authentication → Templates**, confira o modelo de recuperação de senha e os dados de remetente disponíveis para o projeto.
4. Solicite a recuperação com um endereço de uma conta de teste à qual você tenha acesso e confira também a pasta de spam.

O link recebido é processado pelo serviço de autenticação. A interface não lê nem revela a senha existente.

## Notificações de match

Os matches aparecem em tempo real na interface das duas partes. O projeto atual **não envia e-mails automáticos de match**. As credenciais fictícias e a dependência do EmailJS foram removidas para não sugerir um envio que não estava configurado.

Para acrescentar esse recurso, será necessário implementar um backend, por exemplo uma função que processe a confirmação do match, confira os destinatários autorizados e envie a notificação com deduplicação. Credenciais privadas de envio devem permanecer no backend. Essa infraestrutura e seu provedor de e-mail não fazem parte da versão atual.
