# Profit - Rede Social de Vagas com Firebase

Projeto Profit feito com:

- HTML
- CSS
- JavaScript
- Firebase Authentication
- Firebase Realtime Database
- Bootstrap Icons
- EmailJS (para notificações de match)

## Ideia do projeto

O sistema funciona como uma rede social de empregos.

Existem dois tipos de usuários:

1. Empregado / candidato
2. Empregador / empresa

O empregador publica vagas.  
O empregado visualiza as vagas e clica em "Tenho interesse".  
O empregador visualiza os interessados e clica em "Aprovar candidato".  
Quando os dois lados demonstram interesse, o sistema cria um match.

## Novos Recursos

- ✅ Campo de telefone/WhatsApp obrigatório no cadastro
- ✅ Toggle para mostrar/esconder senha com animação Bootstrap Icons
- ✅ Recuperação de senha (Esqueci minha senha)
- ✅ Validação de email em tempo real (verifica se já existe)
- ✅ Mensagens de erro com design melhorado e animações
- ✅ Telefone exibido no perfil e informações de match
- ✅ Notificações de email quando match é confirmado (opcional via EmailJS)

## Estrutura do banco

```txt
users/
  uid/
    name
    email
    phone
    type
    area
    bio
    createdAt

jobs/
  jobId/
    id
    ownerId
    ownerName
    title
    company
    area
    location
    salary
    description
    active
    createdAt
    updatedAt

likes/
  employeeUid/
    jobId/
      jobId
      employeeId
      employeeName
      createdAt

approvals/
  jobId/
    employeeUid/
      jobId
      employeeId
      employerId
      createdAt

matches/
  jobId/
    employeeUid/
      jobId
      employeeId
      employerId
      jobTitle
      company
      employeeName
      employeeEmail
      employeePhone
      createdAt
```

## Configuração Inicial

### 1. Firebase Setup

- Crie um projeto em [Firebase Console](https://console.firebase.google.com)
- Copie suas credenciais e substitua em `app.js`
- Ative Authentication (Email/Password)
- Configure o Realtime Database com regras apropriadas

### 2. EmailJS (Opcional - para notificações de match)

Se deseja receber emails quando um match for confirmado:

1. Crie uma conta em [EmailJS](https://www.emailjs.com)
2. Crie um serviço de email (Gmail, etc)
3. Crie um template de email com essas variáveis:
   - `employer_name` - Nome do empregador
   - `employer_email` - Email do empregador
   - `employee_name` - Nome do candidato
   - `employee_email` - Email do candidato
   - `employee_phone` - Telefone do candidato
   - `job_title` - Título da vaga
   - `company_name` - Nome da empresa
   - `job_area` - Área de atuação
   - `employee_bio` - Bio do candidato

4. No `app.js`, substitua:
   ```javascript
   const EMAILJS_SERVICE_ID = "seu_service_id";
   const EMAILJS_TEMPLATE_ID = "seu_template_id";
   const EMAILJS_PUBLIC_KEY = "sua_public_key";
   ```

5. Descomente a linha de inicialização do EmailJS:
   ```javascript
   emailjs.init("YOUR_PUBLIC_KEY");
   ```

### 3. Segurança

#### Sobre Hash de Senhas

O Firebase Authentication **já realiza hash automático** de todas as senhas usando bcrypt. Você **não precisa** fazer hash no frontend. O Firebase armazena as senhas de forma segura nos seus servidores.

#### Boas Práticas

- Use HTTPS em produção
- Configure regras de segurança do Firebaseconf Database
- Valide dados no backend quando possível
- Implementar rate limiting para tentativas de login
- Usar variáveis de ambiente para credenciais sensíveis

## Regras de Segurança Recomendadas para Firebaseconf

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('type').val() === 'employer'",
        ".write": "$uid === auth.uid"
      }
    },
    "jobs": {
      ".read": true,
      "$jobId": {
        ".write": "root.child('jobs').child($jobId).child('ownerId').val() === auth.uid"
      }
    },
    "likes": {
      "$employeeId": {
        ".read": true,
        ".write": "$employeeId === auth.uid"
      }
    },
    "approvals": {
      ".read": true,
      "$jobId": {
        ".write": "root.child('jobs').child($jobId).child('ownerId').val() === auth.uid"
      }
    },
    "matches": {
      ".read": true
    }
  }
}
```

## Como Usar

1. Clone o repositório
2. Abra `index.html` no navegador
3. Crie uma conta como Empregado ou Empregador
4. Insira seu telefone no formato: (11) 99999-9999
5. Crie/candidata-se a vagas
6. Quando houver match, você verá nos "Matches confirmados"

## Funcionalidades Detalhadas

### Recuperação de Senha

- Clique em "Esqueci minha senha" na tela de login
- Insira seu e-mail cadastrado
- Receberá um link de recuperação pelo Firebase
- O link te redirecionará para redefinir a senha

### Toggle de Senha

- Ao cadastrar ou fazer login, você pode clicar no ícone 👁️ para visualizar a senha
- A animação é smooth e intuitiva

### Validação de Email

- O sistema verifica se o email já existe antes de criar conta
- Se for duplicado, você receberá uma mensagem de erro clara

### Notificações

Quando um match é confirmado:
- Ambas as partes veem "🎉 Match confirmado"
- Se EmailJS estiver configurado, o empregador recebe email com dados do candidato
- Dados como telefone e bio aparecem no match
      employeeName

approvals/
  jobId/
    employeeUid/
      employerId
      employeeId

matches/
  jobId/
    employeeUid/
      jobId
      employeeId
      employerId
      jobTitle
      company
      employeeName
      employeeEmail
```

## Como rodar

1. Abra a pasta no VS Code.
2. Instale a extensão **Live Server**.
3. Clique com o botão direito no `index.html`.
4. Selecione **Open with Live Server**.

## Configuração no Firebase

No Firebase Console:

1. Vá em **Authentication**.
2. Clique em **Sign-in method**.
3. Ative **Email/Password**.
4. Vá em **Realtime Database**.
5. Crie o banco.
6. Em **Rules**, cole o conteúdo do arquivo `database.rules.json`.

## Observação importante

As regras incluídas são didáticas e simples para projeto acadêmico.  
Para produção real, o ideal é endurecer as permissões, validando melhor se apenas o dono da vaga pode aprovar candidatos e editar/excluir suas vagas.
