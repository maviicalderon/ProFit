# Configuração do EmailJS para Profit

Este documento fornece um guia passo a passo para configurar as notificações de email quando um match é confirmado.

## Por que usar EmailJS?

EmailJS permite enviar emails diretamente do frontend sem a necessidade de um servidor backend. É gratuito até 200 emails/mês.

## Passo 1: Criar Conta no EmailJS

1. Acesse [emailjs.com](https://www.emailjs.com)
2. Clique em "Sign Up"
3. Crie uma conta com seu email
4. Confirme seu email

## Passo 2: Conectar um Serviço de Email

1. No dashboard do EmailJS, acesse "Email Services"
2. Clique em "Add Service"
3. Escolha seu provedor (Gmail recomendado):
   - **Gmail**: Selecione "Gmail", clique em "Connect with Gmail"
   - Autorize o acesso
4. Teste a conexão clicando em "Send Test Email"
5. Anote o **Service ID** (ex: `service_xxxxx`)

## Passo 3: Criar um Template de Email

1. Acesse "Email Templates"
2. Clique em "Create New Template"
3. Adicione este template:

```
Subject: 🎉 Novo Match - Profit!

Olá {{employer_name}},

Você tem um novo match! Um candidato se interessou na sua vaga.

📋 INFORMAÇÕES DA VAGA
Título: {{job_title}}
Empresa: {{company_name}}
Área: {{job_area}}

👤 INFORMAÇÕES DO CANDIDATO
Nome: {{employee_name}}
Email: {{employee_email}}
Telefone: {{employee_phone}}
Bio: {{employee_bio}}

Entre em contato com o candidato para prosseguir com o processo seletivo.

Atenciosamente,
Profit - Rede Social de Empregos
```

4. Clique em "Save"
5. Anote o **Template ID** (ex: `template_xxxxx`)

## Passo 4: Obter Public Key

1. Acesse "Account" no menu
2. Copie sua **Public Key**

## Passo 5: Configurar no app.js

Abra `app.js` e localize estas linhas:

```javascript
const EMAILJS_SERVICE_ID = "service_profit";
const EMAILJS_TEMPLATE_ID = "template_match_notification";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY_HERE";
```

Substitua pelos seus valores:

```javascript
const EMAILJS_SERVICE_ID = "service_xxxxx";  // Copie do paso 2
const EMAILJS_TEMPLATE_ID = "template_xxxxx"; // Copie do paso 3
const EMAILJS_PUBLIC_KEY = "abc123xyz"; // Copie do paso 4
```

Também descomente esta linha:

```javascript
emailjs.init("abc123xyz"); // Sua public key
```

## Passo 6: Testar

1. Crie uma conta como empregador
2. Publique uma vaga
3. Crie outra conta como candidato
4. Clique em "Tenho interesse"
5. Volte para a conta do empregador
6. Clique em "Aprovar candidato"
7. Verifique sua caixa de email

Se tudo estiver funcionando, você receberá um email com os dados do candidato!

## Troubleshooting

### "Email não está sendo enviado"

1. Verifique se o **Service ID** está correto
2. Verifique se o **Template ID** está correto
3. Verifique se a **Public Key** está correta
4. Verifique se a linha `emailjs.init()` não está comentada
5. Abra o console (F12) e procure por erros

### "Erro ao enviar email"

- Verifique se sua conta do EmailJS tem créditos (200 emails/mês são gratuitos)
- Verifique se o Gmail permitiu acesso ao EmailJS

### "Funcionalidade de email é opcional"

Se não deseja configurar EmailJS:
- Deixe os valores como estão
- O sistema continuará funcionando normalmente
- Apenas não enviará emails automáticos

## Email Adicional para Candidato

Se desejar também enviar um email para o candidato quando há match:

1. Crie um novo template no EmailJS
2. Crie uma nova função `sendEmployeeMatchEmail()` no app.js
3. Chame-a após `sendMatchNotificationEmail()`

Exemplo de template para candidato:

```
Subject: 🎉 Match Confirmado - Profit!

Olá {{employee_name}},

Parabéns! Você tem um novo match!

A empresa {{company_name}} aprovou sua candidatura para a vaga de {{job_title}}.

Entre em contato com a empresa para próximas etapas.

Atenciosamente,
Profit - Rede Social de Empregos
```

## Segurança

⚠️ **Importante**: Sua Public Key é pública (não confidencial). É seguro adicionar ao frontend.
- Nunca exponha sua **Private Key**
- Use apenas a **Public Key** no código

## Suporte

Para mais informações, visite a documentação do EmailJS:
https://www.emailjs.com/docs/
