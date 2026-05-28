# Segurança - Profit

Este documento explica os aspectos de segurança da aplicação Profit.

## Hash de Senhas

### Firebase já cuida disso automaticamente! ✅

Quando você usa o Firebase Authentication com email/password:

1. **Frontend**: A senha é enviada ao Firebase via HTTPS (criptografado)
2. **Firebase**: Aplica **bcrypt** + **salt** automaticamente
3. **Armazenamento**: A senha com hash é armazenada nos servidores do Firebase
4. **Recuperação**: Firebase **nunca** retorna a senha em plain text

**Você não precisa fazer hash no frontend!**

```javascript
// ❌ ERRADO - Não faça isso!
import bcrypt from 'bcrypt';
const hashedPassword = bcrypt.hashSync(password, 10);
await createUserWithEmailAndPassword(auth, email, hashedPassword);

// ✅ CERTO - Firebase faz automaticamente
await createUserWithEmailAndPassword(auth, email, password);
```

## Transmissão de Dados

### HTTPS

- Todos os dados são transmitidos via **HTTPS** (criptografado)
- Firebase garante isso automaticamente
- Em produção, sempre use HTTPS

### Sensibilidade

Dados sensíveis no banco:
- ❌ Senhas (Firebase não as armazena em plain text)
- ✅ Emails (necessário para autenticação)
- ✅ Telefones (necessário para contato)
- ✅ Bio e perfil público (público)

## Autenticação

### Estado de Sessão

```javascript
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Usuário logado
    currentUser = user;
    currentProfile = userProfile;
  } else {
    // Usuário deslogado
    currentUser = null;
    currentProfile = null;
  }
});
```

### Tokens

- Firebase gerencia tokens JWT automaticamente
- Tokens expiram após ~1 hora
- Refresh tokens renovam automaticamente
- Usuário pode estar offline e continuar usando dados em cache

## Autorização (Database Rules)

### Estrutura Recomendada

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || isEmployer",
        ".write": "$uid === auth.uid"
      }
    },
    "jobs": {
      ".read": true,
      "$jobId": {
        ".write": "isOwner"
      }
    }
  }
}
```

### Explicação

- **`.read`**: Quem pode ler dados
- **`.write`**: Quem pode escrever dados
- **`auth.uid`**: ID único do usuário autenticado
- **Validações**: Proteção contra edição não autorizada

## Validações

### No Frontend

Validações para melhor UX:

```javascript
// Email válido
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  showMessage("Email inválido");
}

// Telefone válido
const phoneRegex = /^[\d\s\-\(\)]{10,}$/;
if (!phoneRegex.test(phone)) {
  showMessage("Telefone inválido");
}

// Senha forte
if (password.length < 6) {
  showMessage("Senha muito curta");
}
```

### No Backend (Recomendado)

Para máxima segurança, implemente regras no Firebase:

```json
{
  "users": {
    "$uid": {
      ".validate": "newData.hasChildren(['name', 'email', 'phone', 'type', 'area'])"
    }
  }
}
```

## XSS (Cross-Site Scripting)

### Proteção

O código usa `escapeHTML()` para prevenir injeção de código:

```javascript
function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Uso
const safeName = escapeHTML(user.name);
// Se user.name = "<script>alert('hacked')</script>"
// Resultado: "&lt;script&gt;alert(&#039;hacked&#039;)&lt;/script&gt;"
```

## Senhas Fracas

### Validação Firebase

O Firebase rejeita automaticamente senhas muito fracas:

```javascript
try {
  await createUserWithEmailAndPassword(auth, email, password);
} catch (error) {
  if (error.code === "auth/weak-password") {
    showMessage("Senha deve ter pelo menos 6 caracteres");
  }
}
```

### Requisitos do Firebase

- Mínimo 6 caracteres (recomendado: 8+)
- Sem limitação de caracteres especiais

### Recomendações

Para maior segurança, implemente no frontend:

```javascript
function validatePasswordStrength(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password)
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  return score; // 0-5
}
```

## Rate Limiting

### Para Evitar Brute Force

Implemente no Firebase Functions (não disponível no frontend):

```javascript
// Exemplo: máximo 5 tentativas por hora
const MAX_ATTEMPTS = 5;
const TIME_WINDOW = 3600000; // 1 hora

// Pseudocódigo
if (failedAttempts > MAX_ATTEMPTS && timeSinceFirstAttempt < TIME_WINDOW) {
  throw new Error("Muitas tentativas. Tente novamente em 1 hora.");
}
```

## Dados Públicos vs Privados

### Públicos ✅
- Perfis de usuários
- Títulos e descrições de vagas
- Informações da empresa
- Email (necessário para contato)
- Telefone (necessário para contato)

### Privados ❌
- Senhas
- Tokens de autenticação
- Dados sensíveis não divulgados

## Proteção de Dados

### LGPD / GDPR

A Profit deve respeitar:

1. **Consentimento**: Usuário autoriza coleta de dados
2. **Direito ao esquecimento**: Permitir deletar conta
3. **Portabilidade**: Permitir exportar dados
4. **Transparência**: Avisar sobre coleta de dados

### Implementação

```javascript
// Deletar conta
async function deleteUserAccount() {
  const user = auth.currentUser;
  
  // Deletar dados
  await remove(ref(db, `users/${user.uid}`));
  
  // Deletar autenticação
  await user.delete();
}

// Exportar dados
async function exportUserData(userId) {
  const snapshot = await get(ref(db, `users/${userId}`));
  return JSON.stringify(snapshot.val());
}
```

## Checklist de Segurança

- [x] Senhas com hash (Firebase)
- [x] HTTPS (Firebase)
- [x] Validação XSS (escapeHTML)
- [x] Validação de entrada (email, phone)
- [x] Autenticação via Firebase
- [ ] Rate limiting (implementar)
- [ ] Regras de segurança do banco (adicionar)
- [ ] Backup regular (configurar)
- [ ] Logs de auditoria (implementar)
- [ ] 2FA (multi-factor authentication)
- [ ] Política de privacidade

## Próximos Passos Recomendados

1. **Cloud Functions**: Implementar backend para validações extra
2. **Security Rules**: Adicionar regras mais restritivas
3. **Monitoring**: Usar Firebase Monitoring para alertas
4. **Backup**: Configurar backup automático dos dados
5. **2FA**: Implementar autenticação de dois fatores
6. **Logs**: Registrar atividades sensíveis

## Recursos Adicionais

- [Firebase Security Documentation](https://firebase.google.com/docs/database/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Authentication Best Practices](https://firebase.google.com/docs/auth/best-practices)
