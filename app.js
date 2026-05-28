
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  push,
  update,
  remove,
  onValue,
  get,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBOervBrr9U6id1e3SvQCp5WFmtYRftJ6A",
  authDomain: "tcc-mavi.firebaseapp.com",
  databaseURL: "https://tcc-mavi-default-rtdb.firebaseio.com",
  projectId: "tcc-mavi",
  storageBucket: "tcc-mavi.firebasestorage.app",
  messagingSenderId: "758013937555",
  appId: "1:758013937555:web:62f8eac4f1b6545dbf4a66"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Inicializar EmailJS (configure com seus dados no console do EmailJS)
// emailjs.init("YOUR_PUBLIC_KEY");
const EMAILJS_SERVICE_ID = "service_profit";
const EMAILJS_TEMPLATE_ID = "template_match_notification";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY_HERE";

const $ = (id) => document.getElementById(id);

// Sistema de Tradução
const translations = {
  pt: {
    // Auth
    "auth.enter": "Entrar",
    "auth.register": "Cadastrar",
    "auth.reset": "Recuperar Senha",
    "auth.email": "E-mail",
    "auth.password": "Senha",
    "auth.phone": "Telefone / WhatsApp",
    "auth.submit.login": "Entrar",
    "auth.submit.register": "Cadastrar",
    "auth.submit.reset": "Enviar link",
    "auth.forgot": "Esqueci minha senha",
    "auth.back": "Voltar",
    "auth.name": "Nome completo / empresa",
    "auth.password.hint": "Mínimo 6 caracteres",
    "auth.type": "Tipo de usuário",
    "auth.type.employee": "Empregado / candidato",
    "auth.type.employer": "Empregador / empresa",
    "auth.area": "Área de interesse ou atuação",
    "auth.bio": "Mini bio",
    "auth.recover.hint": "Insira seu e-mail para receber um link de recuperação de senha.",
    "profile.edit": "Editar",
    "profile.delete": "Excluir",
    "profile.jobs": "Vagas",
    "profile.matches": "Matches",
    "jobs.publish": "Publicar vaga",
    "jobs.title": "Título da vaga",
    "jobs.company": "Empresa",
    "jobs.area": "Área",
    "jobs.location": "Cidade / Modelo",
    "jobs.salary": "Salário",
    "jobs.description": "Descrição",
    "jobs.save": "Salvar vaga",
    "jobs.search": "Buscar por cargo, área ou empresa...",
    "jobs.interested": "Tenho interesse",
    "jobs.remove.interested": "Remover interesse",
    "jobs.approved": "Empresa aprovou você",
    "jobs.matched": "🎉 Match confirmado",
    "jobs.my": "Minhas vagas publicadas",
    "jobs.manage": "Gerencie as vagas que você criou.",
    "jobs.no.published": "Você ainda não publicou vagas.",
    "jobs.available": "Vagas disponíveis",
    "jobs.available.hint": "Clique em 'Tenho interesse' para tentar um match com o empregador.",
    "jobs.not.found": "Nenhuma vaga encontrada.",
    "jobs.only.employer": "Somente empregadores podem publicar vagas.",
    "jobs.required": "Preencha os campos obrigatórios da vaga.",
    "jobs.saved": "Vaga atualizada com sucesso!",
    "jobs.published": "Vaga publicada com sucesso!",
    "jobs.error": "Erro ao salvar vaga.",
    "applicants.title": "Interessados nas suas vagas",
    "applicants.hint": "Aprove candidatos para gerar match.",
    "applicants.no": "Ainda não há interessados nas suas vagas.",
    "applicants.approve": "Aprovar candidato",
    "applicants.remove": "Remover aprovação",
    "matches.title": "Matches confirmados",
    "matches.hint": "Quando empregado e empregador demonstram interesse, o match aparece aqui.",
    "matches.no": "Nenhum match confirmado ainda.",
    "matches.candidate": "Candidato",
    "matches.company": "Empresa",
    "matches.contact": "Entre em contato",
    "logout": "Sair",
    "errors.filled": "Preencha todos os campos obrigatórios.",
    "errors.invalid.phone": "Telefone inválido. Use formato: (11) 99999-9999",
    "errors.email.exists": "Este e-mail já está cadastrado.",
    "errors.email.invalid": "E-mail inválido.",
    "errors.password.weak": "A senha deve ter pelo menos 6 caracteres.",
    "errors.user.not.found": "Usuário não encontrado.",
    "errors.password.wrong": "Senha incorreta.",
    "errors.invalid.credential": "E-mail ou senha incorretos.",
    "errors.network": "Falha de conexão. Verifique sua internet.",
    "errors.too.many": "Muitas tentativas. Tente novamente mais tarde.",
    "errors.only.employer": "Apenas empregadores podem aprovar candidatos.",
    "errors.only.yours": "Você só pode aprovar candidatos das suas próprias vagas.",
    "success.account.created": "Conta criada com sucesso!",
    "success.password.reset": "E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.",
    "success.vaga.published": "Vaga publicada com sucesso!",
    "success.vaga.updated": "Vaga atualizada com sucesso!",
    "confirm.delete": "Tem certeza que deseja excluir esta vaga?"
  },
  en: {
    // Auth
    "auth.enter": "Sign In",
    "auth.register": "Sign Up",
    "auth.reset": "Reset Password",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.phone": "Phone / WhatsApp",
    "auth.submit.login": "Sign In",
    "auth.submit.register": "Sign Up",
    "auth.submit.reset": "Send Link",
    "auth.forgot": "Forgot my password",
    "auth.back": "Back",
    "auth.name": "Full name / company",
    "auth.password.hint": "Minimum 6 characters",
    "auth.type": "User type",
    "auth.type.employee": "Employee / candidate",
    "auth.type.employer": "Employer / company",
    "auth.area": "Area of interest",
    "auth.bio": "Mini bio",
    "auth.recover.hint": "Enter your email to receive a password recovery link.",
    "profile.edit": "Edit",
    "profile.delete": "Delete",
    "profile.jobs": "Jobs",
    "profile.matches": "Matches",
    "jobs.publish": "Post a Job",
    "jobs.title": "Job Title",
    "jobs.company": "Company",
    "jobs.area": "Area",
    "jobs.location": "City / Model",
    "jobs.salary": "Salary",
    "jobs.description": "Description",
    "jobs.save": "Save Job",
    "jobs.search": "Search by job, area or company...",
    "jobs.interested": "I'm Interested",
    "jobs.remove.interested": "Remove Interest",
    "jobs.approved": "Company approved you",
    "jobs.matched": "🎉 Match confirmed",
    "jobs.my": "My Posted Jobs",
    "jobs.manage": "Manage the jobs you created.",
    "jobs.no.published": "You haven't posted any jobs yet.",
    "jobs.available": "Available Jobs",
    "jobs.available.hint": "Click 'I'm Interested' to try a match with the employer.",
    "jobs.not.found": "No jobs found.",
    "jobs.only.employer": "Only employers can post jobs.",
    "jobs.required": "Fill in the required job fields.",
    "jobs.saved": "Job updated successfully!",
    "jobs.published": "Job posted successfully!",
    "jobs.error": "Error saving job.",
    "applicants.title": "Interested in Your Jobs",
    "applicants.hint": "Approve candidates to generate a match.",
    "applicants.no": "No interested candidates yet.",
    "applicants.approve": "Approve Candidate",
    "applicants.remove": "Remove Approval",
    "matches.title": "Confirmed Matches",
    "matches.hint": "When employee and employer show interest, the match appears here.",
    "matches.no": "No confirmed matches yet.",
    "matches.candidate": "Candidate",
    "matches.company": "Company",
    "matches.contact": "Contact",
    "logout": "Sign Out",
    "errors.filled": "Fill in all required fields.",
    "errors.invalid.phone": "Invalid phone. Use format: (11) 99999-9999",
    "errors.email.exists": "This email is already registered.",
    "errors.email.invalid": "Invalid email.",
    "errors.password.weak": "Password must be at least 6 characters.",
    "errors.user.not.found": "User not found.",
    "errors.password.wrong": "Wrong password.",
    "errors.invalid.credential": "Invalid email or password.",
    "errors.network": "Connection failed. Check your internet.",
    "errors.too.many": "Too many attempts. Try again later.",
    "errors.only.employer": "Only employers can approve candidates.",
    "errors.only.yours": "You can only approve candidates from your own jobs.",
    "success.account.created": "Account created successfully!",
    "success.password.reset": "Recovery email sent successfully! Check your inbox.",
    "success.vaga.published": "Job posted successfully!",
    "success.vaga.updated": "Job updated successfully!",
    "confirm.delete": "Are you sure you want to delete this job?"
  }
};

let currentLanguage = localStorage.getItem("profit_language") || "pt";

function t(key) {
  return translations[currentLanguage][key] || key;
}

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem("profit_language", lang);
  document.documentElement.lang = lang;
  document.getElementById("langText").textContent = lang.toUpperCase();
  updateAllText();
}

function loadPreferences() {
  const isDarkMode = localStorage.getItem("profit_dark_mode") === "true";
  if (isDarkMode) {
    document.documentElement.classList.add("dark-mode");
  }
}

window.toggleDarkMode = () => {
  const isDark = document.documentElement.classList.toggle("dark-mode");
  localStorage.setItem("profit_dark_mode", isDark);
};

const $ = (id) => document.getElementById(id);

const elements = {
  authSection: $("authSection"),
  appSection: $("appSection"),
  btnLogout: $("btnLogout"),

  tabLogin: $("tabLogin"),
  tabRegister: $("tabRegister"),
  tabReset: $("tabReset"),
  loginForm: $("loginForm"),
  registerForm: $("registerForm"),
  resetForm: $("resetForm"),
  loginMessage: $("loginMessage"),
  registerMessage: $("registerMessage"),
  resetMessage: $("resetMessage"),

  profileTypeBadge: $("profileTypeBadge"),
  profileName: $("profileName"),
  profileDetails: $("profileDetails"),
  statJobs: $("statJobs"),
  statMatches: $("statMatches"),

  employerPanel: $("employerPanel"),
  employeePanel: $("employeePanel"),
  myJobsSection: $("myJobsSection"),

  jobForm: $("jobForm"),
  jobMessage: $("jobMessage"),
  jobsFeed: $("jobsFeed"),
  applicantsList: $("applicantsList"),
  matchesList: $("matchesList"),
  myJobsList: $("myJobsList"),
  searchJobs: $("searchJobs")
};

let currentUser = null;
let currentProfile = null;
let allUsers = {};
let allJobs = {};
let allLikes = {};
let allApprovals = {};
let allMatches = {};

function showMessage(element, text, type = "success") {
  // Traduzir a mensagem se for uma chave de tradução
  const translatedText = translations[currentLanguage][text] || text;
  element.textContent = translatedText;
  element.className = `message ${type}`;
}

function clearMessages() {
  showMessage(elements.loginMessage, "", "success");
  showMessage(elements.registerMessage, "", "success");
  showMessage(elements.jobMessage, "", "success");
  showMessage(elements.resetMessage, "", "success");
}

function setAuthTab(tab) {
  clearMessages();

  if (tab === "login") {
    elements.tabLogin.classList.add("active");
    elements.tabRegister.classList.remove("active");
    elements.tabReset.classList.add("hidden");
    elements.loginForm.classList.remove("hidden");
    elements.registerForm.classList.add("hidden");
    elements.resetForm.classList.add("hidden");
  } else if (tab === "register") {
    elements.tabRegister.classList.add("active");
    elements.tabLogin.classList.remove("active");
    elements.tabReset.classList.add("hidden");
    elements.registerForm.classList.remove("hidden");
    elements.loginForm.classList.add("hidden");
    elements.resetForm.classList.add("hidden");
  } else if (tab === "reset") {
    elements.tabReset.classList.add("active");
    elements.tabLogin.classList.remove("active");
    elements.tabRegister.classList.remove("active");
    elements.tabReset.classList.remove("hidden");
    elements.resetForm.classList.remove("hidden");
    elements.loginForm.classList.add("hidden");
    elements.registerForm.classList.add("hidden");
  }
}

window.togglePasswordVisibility = (fieldId) => {
  const field = document.getElementById(fieldId);
  const btn = event.target.closest(".toggle-password");
  
  if (field.type === "password") {
    field.type = "text";
    btn.classList.add("active");
  } else {
    field.type = "password";
    btn.classList.remove("active");
  }
};

window.showForgotPassword = () => {
  setAuthTab("reset");
};

window.backToLogin = () => {
  setAuthTab("login");
};

// Validar email em tempo real
async function validateEmailExists(email) {
  try {
    const snapshot = await get(ref(db, "users"));
    const users = snapshot.val() || {};
    
    for (const userId in users) {
      if (users[userId].email === email) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Erro ao validar email:", error);
    return false;
  }
}

elements.tabLogin.addEventListener("click", () => setAuthTab("login"));
elements.tabRegister.addEventListener("click", () => setAuthTab("register"));
elements.tabReset.addEventListener("click", () => setAuthTab("reset"));

function updateAllText() {
  // Tabs
  elements.tabLogin.textContent = t("auth.enter");
  elements.tabRegister.textContent = t("auth.register");
  elements.tabReset.textContent = t("auth.reset");
  
  // Login form
  document.querySelector("form#loginForm h2").textContent = t("auth.enter");
  document.querySelectorAll("form#loginForm label")[0].textContent = t("auth.email");
  document.querySelectorAll("form#loginForm label")[1].textContent = t("auth.password");
  document.querySelector("form#loginForm button[type='submit']").textContent = t("auth.submit.login");
  
  // Register form
  document.querySelector("form#registerForm h2").textContent = t("auth.register");
  document.querySelectorAll("form#registerForm label")[0].textContent = t("auth.name");
  document.querySelectorAll("form#registerForm label")[1].textContent = t("auth.email");
  document.querySelectorAll("form#registerForm label")[2].textContent = t("auth.phone");
  document.querySelectorAll("form#registerForm label")[3].textContent = t("auth.password");
  document.querySelectorAll("form#registerForm label")[4].textContent = t("auth.type");
  document.querySelectorAll("form#registerForm label")[5].textContent = t("auth.area");
  document.querySelectorAll("form#registerForm label")[6].textContent = t("auth.bio");
  document.querySelector("form#registerForm button[type='submit']").textContent = t("auth.submit.register");
  
  // Reset form
  document.querySelector("form#resetForm h2").textContent = t("auth.reset");
  document.querySelector("form#resetForm .muted").textContent = t("auth.recover.hint");
  document.querySelectorAll("form#resetForm label")[0].textContent = t("auth.email");
  document.querySelectorAll("form#resetForm button[type='submit']")[0].textContent = t("auth.submit.reset");
  
  // Logout button
  elements.btnLogout.textContent = t("logout");
  
  // Render all UI if logged in
  if (currentUser && currentProfile) {
    renderProfile();
    renderAll();
  }
}

// Carregar preferências ao iniciar
loadPreferences();

$("btnDarkMode").addEventListener("click", window.toggleDarkMode);
$("btnLanguage").addEventListener("click", () => {
  const newLang = currentLanguage === "pt" ? "en" : "pt";
  setLanguage(newLang);
});elements.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();

  const name = $("registerName").value.trim();
  const email = $("registerEmail").value.trim();
  const phone = $("registerPhone").value.trim();
  const password = $("registerPassword").value.trim();
  const type = $("registerType").value;
  const area = $("registerArea").value.trim();
  const bio = $("registerBio").value.trim();

  if (!name || !email || !phone || !password || !type || !area) {
    showMessage(elements.registerMessage, "errors.filled", "error");
    return;
  }

  // Validar formato do telefone
  const phoneRegex = /^[\d\s\-\(\)]{10,}$/;
  if (!phoneRegex.test(phone)) {
    showMessage(elements.registerMessage, "errors.invalid.phone", "error");
    return;
  }

  // Validar se email já existe
  const emailExists = await validateEmailExists(email);
  if (emailExists) {
    showMessage(elements.registerMessage, "errors.email.exists", "error");
    return;
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    await set(ref(db, `users/${credential.user.uid}`), {
      uid: credential.user.uid,
      name,
      email,
      phone,
      type,
      area,
      bio,
      createdAt: Date.now()
    });

    showMessage(elements.registerMessage, "success.account.created");
    elements.registerForm.reset();
    
    // Limpar os campos de entrada
    setTimeout(() => setAuthTab("login"), 1500);
  } catch (error) {
    const errorKey = getErrorMessageKey(error.code);
    showMessage(elements.registerMessage, errorKey, "error");
  }
});

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, password);
    elements.loginForm.reset();
  } catch (error) {
    showMessage(elements.loginMessage, translateFirebaseError(error.code), "error");
  }
});

elements.resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();

  const email = $("resetEmail").value.trim();

  if (!email) {
    showMessage(elements.resetMessage, "Insira seu e-mail.", "error");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showMessage(elements.resetMessage, "E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.");
    elements.resetForm.reset();
    
    setTimeout(() => setAuthTab("login"), 3000);
  } catch (error) {
    showMessage(elements.resetMessage, translateFirebaseError(error.code), "error");
  }
});

elements.btnLogout.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!user) {
    currentProfile = null;
    elements.authSection.classList.remove("hidden");
    elements.appSection.classList.add("hidden");
    elements.btnLogout.classList.add("hidden");
    return;
  }

  const profileSnapshot = await get(ref(db, `users/${user.uid}`));

  if (!profileSnapshot.exists()) {
    alert("Perfil não encontrado. Faça cadastro novamente.");
    await signOut(auth);
    return;
  }

  currentProfile = profileSnapshot.val();

  elements.authSection.classList.add("hidden");
  elements.appSection.classList.remove("hidden");
  elements.btnLogout.classList.remove("hidden");

  renderProfile();
  startRealtimeListeners();
});

function renderProfile() {
  const typeText = currentProfile.type === "employer" ? "Empregador" : "Empregado";

  elements.profileTypeBadge.textContent = typeText;
  elements.profileName.textContent = currentProfile.name;
  elements.profileDetails.textContent = `${currentProfile.email} • ${currentProfile.phone} • ${currentProfile.area}`;

  if (currentProfile.type === "employer") {
    elements.employerPanel.classList.remove("hidden");
    elements.myJobsSection.classList.remove("hidden");
    elements.employeePanel.classList.add("hidden");
  } else {
    elements.employeePanel.classList.remove("hidden");
    elements.employerPanel.classList.add("hidden");
    elements.myJobsSection.classList.add("hidden");
  }
}

function startRealtimeListeners() {
  onValue(ref(db, "users"), (snapshot) => {
    allUsers = snapshot.val() || {};
    renderAll();
  });

  onValue(ref(db, "jobs"), (snapshot) => {
    allJobs = snapshot.val() || {};
    renderAll();
  });

  onValue(ref(db, "likes"), (snapshot) => {
    allLikes = snapshot.val() || {};
    renderAll();
  });

  onValue(ref(db, "approvals"), (snapshot) => {
    allApprovals = snapshot.val() || {};
    renderAll();
  });

  onValue(ref(db, "matches"), (snapshot) => {
    allMatches = snapshot.val() || {};
    renderAll();
  });
}

function renderAll() {
  if (!currentUser || !currentProfile) return;

  renderStats();
  renderJobsFeed();
  renderMyJobs();
  renderApplicants();
  renderMatches();
}

function renderStats() {
  const myJobs = Object.values(allJobs).filter(job => job.ownerId === currentUser.uid);
  const myMatches = getMyMatches();

  elements.statJobs.textContent = currentProfile.type === "employer" ? myJobs.length : Object.keys(allLikes[currentUser.uid] || {}).length;
  elements.statMatches.textContent = myMatches.length;
}

elements.jobForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser || currentProfile.type !== "employer") {
    showMessage(elements.jobMessage, "Apenas empregadores podem publicar vagas.", "error");
    return;
  }

  const title = $("jobTitle").value.trim();
  const company = $("jobCompany").value.trim();
  const area = $("jobArea").value.trim();
  const location = $("jobLocation").value.trim();
  const salary = $("jobSalary").value.trim();
  const description = $("jobDescription").value.trim();
  const jobId = $("jobId").value;

  if (!title || !company || !area || !location || !description) {
    showMessage(elements.jobMessage, "Preencha os campos obrigatórios da vaga.", "error");
    return;
  }

  try {
    if (jobId) {
      await update(ref(db, `jobs/${jobId}`), {
        title,
        company,
        area,
        location,
        salary,
        description,
        updatedAt: Date.now()
      });
      showMessage(elements.jobMessage, "Vaga atualizada com sucesso!");
    } else {
      const newJobRef = push(ref(db, "jobs"));

      await set(newJobRef, {
        id: newJobRef.key,
        ownerId: currentUser.uid,
        ownerName: currentProfile.name,
        title,
        company,
        area,
        location,
        salary,
        description,
        active: true,
        createdAt: Date.now()
      });

      showMessage(elements.jobMessage, "Vaga publicada com sucesso!");
    }

    elements.jobForm.reset();
    $("jobId").value = "";
  } catch (error) {
    showMessage(elements.jobMessage, "Erro ao salvar vaga.", "error");
  }
});

elements.searchJobs.addEventListener("input", renderJobsFeed);

function renderJobsFeed() {
  if (!currentProfile || currentProfile.type !== "employee") return;

  const search = elements.searchJobs.value.toLowerCase().trim();

  const jobs = Object.values(allJobs)
    .filter(job => job.active !== false)
    .filter(job => {
      const text = `${job.title} ${job.company} ${job.area} ${job.location}`.toLowerCase();
      return text.includes(search);
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (jobs.length === 0) {
    elements.jobsFeed.innerHTML = `<div class="empty">Nenhuma vaga encontrada.</div>`;
    return;
  }

  elements.jobsFeed.innerHTML = jobs.map(job => {
    const liked = Boolean(allLikes[currentUser.uid]?.[job.id]);
    const approved = Boolean(allApprovals[job.id]?.[currentUser.uid]);
    const matched = Boolean(allMatches[job.id]?.[currentUser.uid]);

    return `
      <article class="job-card">
        <div>
          <h3>${escapeHTML(job.title)}</h3>
          <p class="description">${escapeHTML(job.description)}</p>
        </div>

        <div class="meta">
          <span>${escapeHTML(job.company)}</span>
          <span>${escapeHTML(job.area)}</span>
          <span>${escapeHTML(job.location)}</span>
          <span>${escapeHTML(job.salary || "Salário não informado")}</span>
        </div>

        <div class="card-actions">
          <button class="btn ${liked ? "btn-warning" : "btn-primary"}" onclick="window.toggleInterest('${job.id}')">
            ${liked ? "Remover interesse" : "Tenho interesse"}
          </button>

          ${approved ? `<span class="badge">Empresa aprovou você</span>` : ""}
          ${matched ? `<span class="badge">🎉 Match confirmado</span>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

window.toggleInterest = async (jobId) => {
  if (!currentUser || currentProfile.type !== "employee") return;

  const likeRef = ref(db, `likes/${currentUser.uid}/${jobId}`);
  const alreadyLiked = Boolean(allLikes[currentUser.uid]?.[jobId]);

  if (alreadyLiked) {
    await remove(likeRef);
    return;
  }

  await set(likeRef, {
    jobId,
    employeeId: currentUser.uid,
    employeeName: currentProfile.name,
    createdAt: Date.now()
  });

  await verifyMatch(jobId, currentUser.uid);
};

function renderApplicants() {
  if (!currentProfile || currentProfile.type !== "employer") return;

  const myJobs = Object.values(allJobs).filter(job => job.ownerId === currentUser.uid);
  const cards = [];

  myJobs.forEach(job => {
    Object.entries(allLikes).forEach(([employeeId, likedJobs]) => {
      if (likedJobs && likedJobs[job.id]) {
        const employee = allUsers[employeeId];
        const approved = Boolean(allApprovals[job.id]?.[employeeId]);
        const matched = Boolean(allMatches[job.id]?.[employeeId]);

        if (!employee) return;

        cards.push(`
          <article class="applicant-card">
            <div>
              <h3>${escapeHTML(employee.name)}</h3>
              <p class="description">${escapeHTML(employee.bio || "Sem bio cadastrada")}</p>
            </div>

            <div class="meta">
              <span>Vaga: ${escapeHTML(job.title)}</span>
              <span>Área: ${escapeHTML(employee.area || "Não informada")}</span>
              <span>${escapeHTML(employee.email)}</span>
              <span>📱 ${escapeHTML(employee.phone || "Sem telefone")}</span>
            </div>

            <div class="card-actions">
              <button class="btn ${approved ? "btn-warning" : "btn-success"}" onclick="window.toggleApproval('${job.id}', '${employeeId}')">
                ${approved ? "Remover aprovação" : "Aprovar candidato"}
              </button>

              ${matched ? `<span class="badge">🎉 Match confirmado</span>` : ""}
            </div>
          </article>
        `);
      }
    });
  });

  elements.applicantsList.innerHTML = cards.length ? cards.join("") : `<div class="empty">Ainda não há interessados nas suas vagas.</div>`;
}

window.toggleApproval = async (jobId, employeeId) => {
  if (!currentUser || currentProfile.type !== "employer") return;

  const job = allJobs[jobId];

  if (!job || job.ownerId !== currentUser.uid) {
    alert("Você só pode aprovar candidatos das suas próprias vagas.");
    return;
  }

  const approvalRef = ref(db, `approvals/${jobId}/${employeeId}`);
  const alreadyApproved = Boolean(allApprovals[jobId]?.[employeeId]);

  if (alreadyApproved) {
    await remove(approvalRef);
    await remove(ref(db, `matches/${jobId}/${employeeId}`));
    return;
  }

  await set(approvalRef, {
    jobId,
    employeeId,
    employerId: currentUser.uid,
    createdAt: Date.now()
  });

  await verifyMatch(jobId, employeeId);
};

async function verifyMatch(jobId, employeeId) {
  const likeSnapshot = await get(ref(db, `likes/${employeeId}/${jobId}`));
  const approvalSnapshot = await get(ref(db, `approvals/${jobId}/${employeeId}`));

  if (likeSnapshot.exists() && approvalSnapshot.exists()) {
    const job = allJobs[jobId] || (await get(ref(db, `jobs/${jobId}`))).val();
    const employee = allUsers[employeeId] || (await get(ref(db, `users/${employeeId}`))).val();
    const employer = allUsers[job.ownerId] || (await get(ref(db, `users/${job.ownerId}`))).val();

    await set(ref(db, `matches/${jobId}/${employeeId}`), {
      jobId,
      employeeId,
      employerId: job.ownerId,
      jobTitle: job.title,
      company: job.company,
      employeeName: employee.name,
      employeeEmail: employee.email,
      employeePhone: employee.phone,
      createdAt: Date.now()
    });

    // Enviar notificação por email
    await sendMatchNotificationEmail(employer, employee, job);
  }
}

async function sendMatchNotificationEmail(employer, employee, job) {
  try {
    // Verificar se EmailJS está inicializado
    if (typeof emailjs === "undefined" || !EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY.includes("YOUR_")) {
      console.log("EmailJS não configurado. Pule este passo ou configure em emailjs.com");
      return;
    }

    const templateParams = {
      employer_name: employer.name,
      employer_email: employer.email,
      employee_name: employee.name,
      employee_email: employee.email,
      employee_phone: employee.phone,
      job_title: job.title,
      company_name: job.company,
      job_area: job.area,
      employee_bio: employee.bio || "Sem bio cadastrada"
    };

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log("Email de match enviado com sucesso!");
  } catch (error) {
    console.log("Erro ao enviar email (funcionalidade opcional):", error);
  }
}

function renderMatches() {
  const matches = getMyMatches();

  if (matches.length === 0) {
    elements.matchesList.innerHTML = `<div class="empty">Nenhum match confirmado ainda.</div>`;
    return;
  }

  elements.matchesList.innerHTML = matches.map(match => `
    <article class="match-card">
      <h3>🎉 ${escapeHTML(match.jobTitle)}</h3>
      <p class="description">
        Match entre <strong>${escapeHTML(match.employeeName)}</strong> e
        <strong>${escapeHTML(match.company)}</strong>.
      </p>
      <div class="meta">
        <span>Candidato: ${escapeHTML(match.employeeEmail)}</span>
        <span>Telefone: ${escapeHTML(match.employeePhone || "Não informado")}</span>
        <span>Empresa: ${escapeHTML(match.company)}</span>
      </div>
    </article>
  `).join("");
}

function getMyMatches() {
  const result = [];

  Object.values(allMatches).forEach(jobMatches => {
    if (!jobMatches) return;

    Object.values(jobMatches).forEach(match => {
      if (currentProfile.type === "employee" && match.employeeId === currentUser.uid) {
        result.push(match);
      }

      if (currentProfile.type === "employer" && match.employerId === currentUser.uid) {
        result.push(match);
      }
    });
  });

  return result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function renderMyJobs() {
  if (!currentProfile || currentProfile.type !== "employer") return;

  const myJobs = Object.values(allJobs)
    .filter(job => job.ownerId === currentUser.uid)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (myJobs.length === 0) {
    elements.myJobsList.innerHTML = `<div class="empty">Você ainda não publicou vagas.</div>`;
    return;
  }

  elements.myJobsList.innerHTML = myJobs.map(job => `
    <article class="job-card">
      <h3>${escapeHTML(job.title)}</h3>
      <p class="description">${escapeHTML(job.description)}</p>

      <div class="meta">
        <span>${escapeHTML(job.company)}</span>
        <span>${escapeHTML(job.area)}</span>
        <span>${escapeHTML(job.location)}</span>
        <span>${escapeHTML(job.salary || "Salário não informado")}</span>
      </div>

      <div class="card-actions">
        <button class="btn btn-warning" onclick="window.editJob('${job.id}')">Editar</button>
        <button class="btn btn-danger" onclick="window.deleteJob('${job.id}')">Excluir</button>
      </div>
    </article>
  `).join("");
}

window.editJob = (jobId) => {
  const job = allJobs[jobId];
  if (!job) return;

  $("jobId").value = job.id;
  $("jobTitle").value = job.title;
  $("jobCompany").value = job.company;
  $("jobArea").value = job.area;
  $("jobLocation").value = job.location;
  $("jobSalary").value = job.salary || "";
  $("jobDescription").value = job.description;

  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.deleteJob = async (jobId) => {
  const confirmDelete = confirm("Tem certeza que deseja excluir esta vaga?");
  if (!confirmDelete) return;

  await remove(ref(db, `jobs/${jobId}`));
  await remove(ref(db, `approvals/${jobId}`));
  await remove(ref(db, `matches/${jobId}`));
};

function translateFirebaseError(code) {
  const errors = {
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
    "auth/operation-not-allowed": "Operação não permitida.",
    "auth/account-exists-with-different-credential": "Esta conta já existe com outro método de autenticação."
  };

  return errors[code] || `Erro: ${code}`;
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
