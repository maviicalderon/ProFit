import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  getDatabase, ref, set, push, update, onValue, get, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";
import { translations } from "./i18n.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const $ = (id) => document.getElementById(id);
const elements = Object.fromEntries([
  "authSection", "appSection", "btnLogout", "tabLogin", "tabRegister", "tabReset",
  "loginForm", "registerForm", "resetForm", "loginMessage", "registerMessage",
  "resetMessage", "profileTypeBadge", "profileName", "profileDetails", "statJobs",
  "statMatches", "employerPanel", "employeePanel", "myJobsSection", "jobForm",
  "jobMessage", "jobsFeed", "applicantsList", "matchesList", "myJobsList", "searchJobs",
  "appMessage", "bootMessage", "jobFormTitle", "cancelJobEdit"
].map((id) => [id, $(id)]));

const preferences = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, String(value)); } catch { /* Storage may be blocked. */ } }
};
let currentLanguage = preferences.get("profit_language") === "en" ? "en" : "pt";
let currentUser = null;
let currentProfile = null;
let allUsers = {};
let allJobs = {};
let allLikes = {};
let allApprovals = {};
let jobsLoaded = false;
let usersLoaded = false;
let likesLoaded = false;
let authEpoch = 0;
let registrationGate = null;
let renderQueued = false;
const subscriptions = [];
const approvalSubscriptions = new Map();
const contactSubscriptions = new Map();
const pendingActions = new Set();

function t(key) { return translations[currentLanguage][key] ?? translations.pt[key] ?? key; }
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}
function isRecord(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function records(value) { return isRecord(value) ? value : {}; }
function showMessage(element, key = "", type = "success") {
  if (!element) return;
  element.dataset.messageKey = key;
  element.textContent = key ? t(key) : "";
  element.className = `message ${key ? type : ""}`.trim();
  element.setAttribute("role", type === "error" ? "alert" : "status");
}
function clearMessages() {
  [elements.loginMessage, elements.registerMessage, elements.resetMessage, elements.jobMessage, elements.appMessage]
    .forEach((element) => showMessage(element));
}
function errorKey(error) {
  const code = String(error?.code ?? "").toLowerCase();
  if (code.includes("permission_denied") || code.includes("permission-denied")) return "errors.permission";
  return ({
    "auth/email-already-in-use": "errors.email.exists", "auth/invalid-email": "errors.email.invalid",
    "auth/weak-password": "errors.password.weak", "auth/missing-password": "errors.password.weak",
    "auth/user-not-found": "errors.invalid.credential", "auth/wrong-password": "errors.invalid.credential",
    "auth/invalid-credential": "errors.invalid.credential", "auth/network-request-failed": "errors.network",
    "auth/too-many-requests": "errors.too.many", "auth/user-disabled": "errors.user.disabled",
    "auth/operation-not-allowed": "errors.auth.disabled", "auth/unauthorized-domain": "errors.domain",
    "auth/invalid-api-key": "errors.config", "auth/configuration-not-found": "errors.config"
  })[code] || "errors.generic";
}
function setBusy(form, busy) {
  form.setAttribute("aria-busy", String(busy));
  form.querySelectorAll("button[type='submit']").forEach((button) => { button.disabled = busy; });
}
function setAuthTab(tab) {
  clearMessages();
  for (const name of ["login", "register", "reset"]) {
    const selected = tab === name;
    elements[`${name}Form`].classList.toggle("hidden", !selected);
    const button = elements[`tab${name[0].toUpperCase()}${name.slice(1)}`];
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
  elements.tabReset.classList.toggle("hidden", tab !== "reset");
}
function updateAllText() {
  document.documentElement.lang = currentLanguage === "pt" ? "pt-BR" : "en";
  document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = t(element.dataset.i18n); });
  for (const [data, attribute] of [["i18nPlaceholder", "placeholder"], ["i18nAriaLabel", "aria-label"], ["i18nTitle", "title"]]) {
    document.querySelectorAll(`[data-${data.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}]`).forEach((element) => {
      element.setAttribute(attribute, t(element.dataset[data]));
    });
  }
  document.querySelectorAll("[data-message-key]").forEach((element) => {
    element.textContent = element.dataset.messageKey ? t(element.dataset.messageKey) : "";
  });
  $("langText").textContent = currentLanguage === "pt" ? "EN" : "PT";
  document.querySelectorAll("[data-action='toggle-password']").forEach(updatePasswordButton);
  renderProfile();
  updateEditTitle();
  renderAll();
}
function setLanguage(lang) {
  currentLanguage = lang;
  preferences.set("profit_language", lang);
  updateAllText();
}
function updateThemeButton() {
  const dark = document.documentElement.classList.contains("dark-mode");
  $("btnDarkMode").setAttribute("aria-pressed", String(dark));
  const icon = $("btnDarkMode").querySelector("[aria-hidden]");
  if (icon) icon.textContent = dark ? "☀" : "☾";
}
function updatePasswordButton(button) {
  const visible = $(button.dataset.field)?.type === "text";
  button.setAttribute("aria-pressed", String(visible));
  button.setAttribute("aria-label", t(visible ? "auth.password.hide" : "auth.password.show"));
  button.classList.toggle("active", visible);
}
function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  queueMicrotask(() => { renderQueued = false; renderAll(); });
}
function watch(path, callback, onError) {
  const epoch = authEpoch;
  let active = true;
  const unsubscribe = onValue(ref(db, path), (snapshot) => {
    if (active && epoch === authEpoch && currentUser) callback(snapshot);
  }, (error) => {
    if (!active || epoch !== authEpoch || !currentUser) return;
    console.error(`Falha na leitura de ${path}:`, error.code);
    onError?.();
    showMessage(elements.appMessage, errorKey(error), "error");
  });
  return () => { active = false; unsubscribe(); };
}
function stopSession() {
  subscriptions.splice(0).forEach((unsubscribe) => unsubscribe());
  for (const unsubscribe of approvalSubscriptions.values()) unsubscribe();
  for (const unsubscribe of contactSubscriptions.values()) unsubscribe();
  approvalSubscriptions.clear();
  contactSubscriptions.clear();
  currentProfile = null;
  allUsers = {}; allJobs = {}; allLikes = {}; allApprovals = {};
  jobsLoaded = false; likesLoaded = false; usersLoaded = false;
  pendingActions.clear();
  [elements.jobsFeed, elements.myJobsList, elements.applicantsList, elements.matchesList].forEach((element) => { element.replaceChildren(); });
  elements.statJobs.textContent = "0";
  elements.statMatches.textContent = "0";
  elements.profileName.textContent = "";
  elements.profileDetails.textContent = "";
  elements.searchJobs.value = "";
  setBusy(elements.jobForm, false);
  resetJobForm();
  elements.appSection.classList.add("hidden");
  elements.employerPanel.classList.add("hidden");
  elements.employeePanel.classList.add("hidden");
  elements.myJobsSection.classList.add("hidden");
  clearMessages();
}
function configureProfileRecovery(recovering) {
  $("registerEmail").readOnly = recovering;
  const password = $("registerPassword");
  password.disabled = recovering;
  password.required = !recovering;
  password.closest("label").classList.toggle("hidden", recovering);
  elements.tabLogin.classList.toggle("hidden", recovering);
  if (recovering) {
    $("registerEmail").value = currentUser.email || "";
    setAuthTab("register");
    showMessage(elements.registerMessage, "errors.profile.missing", "error");
  }
}
async function handleAuthState(user) {
  const epoch = ++authEpoch;
  stopSession();
  currentUser = user;
  elements.btnLogout.classList.toggle("hidden", !user);
  elements.authSection.classList.toggle("hidden", Boolean(user));
  if (!user) {
    [elements.loginForm, elements.registerForm, elements.resetForm].forEach((form) => form.reset());
    for (const id of ["loginPassword", "registerPassword"]) $(id).type = "password";
    document.querySelectorAll("[data-action='toggle-password']").forEach(updatePasswordButton);
    configureProfileRecovery(false);
    showMessage(elements.bootMessage);
    setAuthTab("login");
    return;
  }
  showMessage(elements.bootMessage, "boot.loading");
  try {
    // createUser signs in before its promise returns. Wait for the profile write.
    if (registrationGate) await registrationGate;
    if (epoch !== authEpoch || auth.currentUser?.uid !== user.uid) return;
    const snapshot = await get(ref(db, `users/${user.uid}`));
    if (epoch !== authEpoch) return;
    if (!snapshot.exists()) {
      elements.authSection.classList.remove("hidden");
      configureProfileRecovery(true);
      return;
    }
    currentProfile = snapshot.val();
    if (!["employee", "employer"].includes(currentProfile.type)) throw new Error("Invalid profile role");
    configureProfileRecovery(false);
    elements.authSection.classList.add("hidden");
    elements.appSection.classList.remove("hidden");
    renderProfile();
    startRealtimeListeners();
  } catch (error) {
    if (epoch !== authEpoch) return;
    elements.authSection.classList.remove("hidden");
    setAuthTab("login");
    showMessage(elements.loginMessage, errorKey(error), "error");
  } finally {
    if (epoch === authEpoch) showMessage(elements.bootMessage);
  }
}
function startRealtimeListeners() {
  const uid = currentUser.uid;
  if (currentProfile.type === "employer") {
    subscriptions.push(watch("users", (snapshot) => { allUsers = records(snapshot.val()); usersLoaded = true; queueRender(); }));
    subscriptions.push(watch("likes", (snapshot) => { allLikes = records(snapshot.val()); likesLoaded = true; queueRender(); }));
  } else {
    allUsers = { [uid]: currentProfile }; usersLoaded = true;
    subscriptions.push(watch(`likes/${uid}`, (snapshot) => { allLikes = { [uid]: records(snapshot.val()) }; likesLoaded = true; queueRender(); }));
  }
  subscriptions.push(watch("jobs", (snapshot) => {
    allJobs = Object.fromEntries(Object.entries(records(snapshot.val()))
      .filter(([, job]) => isRecord(job) && typeof job.ownerId === "string")
      .map(([id, job]) => [id, { ...job, id }]));
    jobsLoaded = true;
    syncApprovalSubscriptions();
    queueRender();
  }));
}
function syncApprovalSubscriptions() {
  const employer = currentProfile.type === "employer";
  const ids = new Set(Object.values(allJobs).filter((job) => employer ? job.ownerId === currentUser.uid : job.active !== false).map((job) => job.id));
  for (const [id, unsubscribe] of approvalSubscriptions) {
    if (!ids.has(id)) { unsubscribe(); approvalSubscriptions.delete(id); delete allApprovals[id]; }
  }
  for (const id of ids) {
    if (approvalSubscriptions.has(id)) continue;
    const path = employer ? `approvals/${id}` : `approvals/${id}/${currentUser.uid}`;
    const unsubscribe = watch(path, (snapshot) => {
      allApprovals[id] = employer ? records(snapshot.val()) : { [currentUser.uid]: snapshot.val() };
      queueRender();
    }, () => { delete allApprovals[id]; queueRender(); });
    approvalSubscriptions.set(id, unsubscribe);
  }
}
function syncContactSubscriptions(matches) {
  if (currentProfile.type !== "employee") return;
  const owners = new Set(matches.map((match) => match.employerId));
  for (const [uid, unsubscribe] of contactSubscriptions) {
    if (!owners.has(uid)) { unsubscribe(); contactSubscriptions.delete(uid); delete allUsers[uid]; }
  }
  for (const uid of owners) {
    if (contactSubscriptions.has(uid)) continue;
    const unsubscribe = watch(`users/${uid}`, (snapshot) => { allUsers[uid] = snapshot.val(); queueRender(); });
    contactSubscriptions.set(uid, unsubscribe);
  }
}
function renderProfile() {
  if (!currentUser || !currentProfile) return;
  const employer = currentProfile.type === "employer";
  elements.profileTypeBadge.textContent = t(employer ? "profile.employer" : "profile.employee");
  elements.profileName.textContent = currentProfile.name || "";
  elements.profileDetails.textContent = [currentProfile.email, currentProfile.phone, currentProfile.area].filter(Boolean).join(" • ");
  elements.employerPanel.classList.toggle("hidden", !employer);
  elements.myJobsSection.classList.toggle("hidden", !employer);
  elements.employeePanel.classList.toggle("hidden", employer);
}
function getMyMatches() {
  if (!currentUser || !currentProfile) return [];
  const matches = [];
  for (const job of Object.values(allJobs)) {
    if (job.active === false) continue;
    if (currentProfile.type === "employer" && job.ownerId !== currentUser.uid) continue;
    for (const [employeeId, approval] of Object.entries(records(allApprovals[job.id]))) {
      if (!approval || !allLikes[employeeId]?.[job.id]) continue;
      if (currentProfile.type === "employee" && employeeId !== currentUser.uid) continue;
      const employee = allUsers[employeeId];
      if (!employee || employee.type !== "employee") continue;
      matches.push({ jobId: job.id, employeeId, employerId: job.ownerId, jobTitle: job.title,
        company: job.company, employee, employer: allUsers[job.ownerId],
        createdAt: Math.max(Number(approval.createdAt) || 0, Number(allLikes[employeeId][job.id]?.createdAt) || 0) });
    }
  }
  return matches.sort((a, b) => b.createdAt - a.createdAt);
}
function empty(key) { return `<div class="empty">${escapeHTML(t(key))}</div>`; }
function actionKey(action, jobId, employeeId = "") { return `${action}:${jobId}:${employeeId}`; }
function actionButton(action, jobId, label, style, employeeId = "") {
  const busy = pendingActions.has(actionKey(action, jobId, employeeId));
  return `<button type="button" class="btn ${style}" data-action="${action}" data-job-id="${escapeHTML(jobId)}" data-employee-id="${escapeHTML(employeeId)}" ${busy ? "disabled aria-busy='true'" : ""}>${escapeHTML(t(label))}</button>`;
}
function jobMeta(job) {
  return `<div class="meta">${[job.company, job.area, job.location, job.salary || t("jobs.salary.missing")].map((item) => `<span>${escapeHTML(item)}</span>`).join("")}</div>`;
}
function renderAll() {
  if (!currentUser || !currentProfile) return;
  const matches = getMyMatches();
  syncContactSubscriptions(matches);
  elements.statJobs.textContent = String(Object.values(allJobs).filter((job) => currentProfile.type === "employer"
    ? job.ownerId === currentUser.uid : Boolean(allLikes[currentUser.uid]?.[job.id]) && job.active !== false).length);
  elements.statMatches.textContent = String(matches.length);
  renderJobsFeed(); renderMyJobs(); renderApplicants(); renderMatches(matches);
}
function renderJobsFeed() {
  if (currentProfile?.type !== "employee") return;
  const normalize = (value) => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const search = normalize(elements.searchJobs.value.trim());
  const jobs = Object.values(allJobs).filter((job) => job.active !== false)
    .filter((job) => normalize([job.title, job.company, job.area, job.location].join(" ")).includes(search))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  elements.jobsFeed.innerHTML = !jobsLoaded ? empty("data.loading") : !jobs.length ? empty("jobs.not.found") : jobs.map((job) => {
    const liked = Boolean(allLikes[currentUser.uid]?.[job.id]);
    const approved = Boolean(allApprovals[job.id]?.[currentUser.uid]);
    return `<article class="job-card"><h3>${escapeHTML(job.title)}</h3><p class="description">${escapeHTML(job.description)}</p>${jobMeta(job)}
      <div class="card-actions">${likesLoaded ? actionButton("interest", job.id, liked ? "jobs.remove.interested" : "jobs.interested", liked ? "btn-warning" : "btn-primary") : escapeHTML(t("data.loading"))}
      ${liked && approved ? `<span class="badge">${escapeHTML(t("jobs.matched"))}</span>` : ""}</div></article>`;
  }).join("");
}
function renderMyJobs() {
  if (currentProfile?.type !== "employer") return;
  const jobs = Object.values(allJobs).filter((job) => job.ownerId === currentUser.uid).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  elements.myJobsList.innerHTML = !jobsLoaded ? empty("data.loading") : !jobs.length ? empty("jobs.no.published") : jobs.map((job) => `
    <article class="job-card"><h3>${escapeHTML(job.title)}</h3><p class="description">${escapeHTML(job.description)}</p>${jobMeta(job)}
    <div class="card-actions">${actionButton("edit-job", job.id, "profile.edit", "btn-warning")}${actionButton("delete-job", job.id, "profile.delete", "btn-danger")}</div></article>`).join("");
}
function renderApplicants() {
  if (currentProfile?.type !== "employer") return;
  const cards = [];
  for (const job of Object.values(allJobs).filter((item) => item.ownerId === currentUser.uid && item.active !== false)) {
    for (const [employeeId, likedJobs] of Object.entries(allLikes)) {
      if (!likedJobs?.[job.id]) continue;
      const employee = allUsers[employeeId];
      if (!employee || employee.type !== "employee") continue;
      const approved = Boolean(allApprovals[job.id]?.[employeeId]);
      cards.push(`<article class="applicant-card"><h3>${escapeHTML(employee.name)}</h3>
        <p class="description">${escapeHTML(employee.bio || t("profile.bio.missing"))}</p>
        <div class="meta">${[job.title, employee.area, employee.email, employee.phone].filter(Boolean).map((item) => `<span>${escapeHTML(item)}</span>`).join("")}</div>
        <div class="card-actions">${actionButton("approval", job.id, approved ? "applicants.remove" : "applicants.approve", approved ? "btn-warning" : "btn-success", employeeId)}
        ${approved ? `<span class="badge">${escapeHTML(t("jobs.matched"))}</span>` : ""}</div></article>`);
    }
  }
  elements.applicantsList.innerHTML = !jobsLoaded || !likesLoaded || !usersLoaded ? empty("data.loading") : cards.join("") || empty("applicants.no");
}
function renderMatches(matches) {
  elements.matchesList.innerHTML = !jobsLoaded || !likesLoaded || !usersLoaded ? empty("data.loading") : !matches.length ? empty("matches.no") : matches.map((match) => {
    const contact = currentProfile.type === "employee" ? match.employer : match.employee;
    const email = String(contact?.email || "");
    const phone = String(contact?.phone || "");
    const digits = phone.replace(/\D/g, "");
    const brazilian = !phone.trim().startsWith("+") && (digits.length === 10 || digits.length === 11) ? `55${digits}` : digits;
    return `<article class="match-card"><h3>🎉 ${escapeHTML(match.jobTitle)}</h3>
      <p class="description">${escapeHTML(match.employee.name)} · ${escapeHTML(match.company)}</p>
      <div class="meta">${[email, phone].filter(Boolean).map((value) => `<span>${escapeHTML(value)}</span>`).join("")}</div>
      <div class="card-actions">${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `<a class="btn btn-outline" href="mailto:${escapeHTML(encodeURIComponent(email))}">${escapeHTML(t("auth.email"))}</a>` : ""}
      ${/^\d{10,15}$/.test(brazilian) ? `<a class="btn btn-success" href="https://wa.me/${brazilian}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ""}</div></article>`;
  }).join("");
}
function updateEditTitle() {
  if (elements.jobFormTitle) elements.jobFormTitle.textContent = t($("jobId").value ? "jobs.edit" : "jobs.publish");
  elements.cancelJobEdit?.classList.toggle("hidden", !$("jobId").value);
}
function resetJobForm() {
  elements.jobForm.reset();
  $("jobId").value = "";
  updateEditTitle();
}
function editJob(jobId) {
  const job = allJobs[jobId];
  if (!currentUser || currentProfile?.type !== "employer" || job?.ownerId !== currentUser.uid) return;
  for (const name of ["id", "title", "company", "area", "location", "salary", "description"]) {
    $(`job${name[0].toUpperCase()}${name.slice(1)}`).value = job[name] || "";
  }
  showMessage(elements.jobMessage);
  updateEditTitle();
  elements.jobForm.scrollIntoView?.({ behavior: "smooth", block: "start" });
  $("jobTitle").focus();
}
async function runAction(action, jobId, employeeId) {
  if (!currentUser || !currentProfile) return;
  const job = allJobs[jobId];
  if (!job) return;
  const uid = currentUser.uid;
  const epoch = authEpoch;
  const key = actionKey(action, jobId, employeeId);
  if (pendingActions.has(key)) return;
  pendingActions.add(key);
  renderAll();
  try {
    if (action === "interest" && currentProfile.type === "employee" && job.active !== false) {
      const path = `likes/${uid}/${jobId}`;
      if (allLikes[uid]?.[jobId]) {
        // Remove approval too so a later application requires a fresh decision.
        await update(ref(db), { [path]: null, [`approvals/${jobId}/${uid}`]: null, [`matches/${jobId}/${uid}`]: null });
        if (epoch !== authEpoch) return;
        showMessage(elements.appMessage, "jobs.interest.removed");
      } else {
        await set(ref(db, path), { jobId, employeeId: uid, employeeName: currentProfile.name, createdAt: serverTimestamp() });
        if (epoch !== authEpoch) return;
        showMessage(elements.appMessage, "jobs.interest.saved");
      }
    } else if (action === "approval" && currentProfile.type === "employer" && job.ownerId === uid && job.active !== false) {
      if (!allLikes[employeeId]?.[jobId]) return;
      const path = `approvals/${jobId}/${employeeId}`;
      if (allApprovals[jobId]?.[employeeId]) {
        await update(ref(db), { [path]: null, [`matches/${jobId}/${employeeId}`]: null });
        if (epoch !== authEpoch) return;
        showMessage(elements.appMessage, "applicants.removed");
      } else {
        await set(ref(db, path), { jobId, employeeId, employerId: uid, createdAt: serverTimestamp() });
        if (epoch !== authEpoch) return;
        showMessage(elements.appMessage, "applicants.approved");
      }
    } else if (action === "delete-job" && currentProfile.type === "employer" && job.ownerId === uid) {
      if (!confirm(t("confirm.delete"))) return;
      if (!likesLoaded) throw new Error("Applications not loaded");
      const updates = { [`jobs/${jobId}`]: null, [`approvals/${jobId}`]: null, [`matches/${jobId}`]: null };
      for (const [candidateId, likedJobs] of Object.entries(allLikes)) {
        if (likedJobs?.[jobId]) updates[`likes/${candidateId}/${jobId}`] = null;
      }
      await update(ref(db), updates);
      if (epoch !== authEpoch) return;
      if ($("jobId").value === jobId) resetJobForm();
      showMessage(elements.appMessage, "jobs.deleted");
    }
  } catch (error) {
    if (epoch === authEpoch) showMessage(elements.appMessage, errorKey(error), "error");
  } finally {
    if (epoch === authEpoch) { pendingActions.delete(key); renderAll(); }
  }
}

elements.tabLogin.addEventListener("click", () => setAuthTab("login"));
elements.tabRegister.addEventListener("click", () => setAuthTab("register"));
elements.tabReset.addEventListener("click", () => setAuthTab("reset"));
$("btnLanguage").addEventListener("click", () => setLanguage(currentLanguage === "pt" ? "en" : "pt"));
$("btnDarkMode").addEventListener("click", () => {
  preferences.set("profit_dark_mode", document.documentElement.classList.toggle("dark-mode"));
  updateThemeButton();
});
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || button.disabled) return;
  const { action, jobId, employeeId = "" } = button.dataset;
  if (action === "toggle-password") {
    const field = $(button.dataset.field);
    if (!field) return;
    field.type = field.type === "password" ? "text" : "password";
    updatePasswordButton(button);
  } else if (action === "forgot-password") {
    setAuthTab("reset"); $("resetEmail").value = $("loginEmail").value.trim(); $("resetEmail").focus();
  } else if (action === "back-login") setAuthTab("login");
  else if (action === "cancel-edit") { resetJobForm(); showMessage(elements.jobMessage); }
  else if (action === "edit-job") editJob(jobId);
  else if (["interest", "approval", "delete-job"].includes(action)) void runAction(action, jobId, employeeId);
});
elements.searchJobs.addEventListener("input", renderJobsFeed);

elements.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (elements.registerForm.getAttribute("aria-busy") === "true") return;
  clearMessages();
  const name = $("registerName").value.trim();
  const email = $("registerEmail").value.trim();
  const phone = $("registerPhone").value.trim();
  const password = $("registerPassword").value; // Password whitespace is meaningful.
  const type = $("registerType").value;
  const area = $("registerArea").value.trim();
  const bio = $("registerBio").value.trim();
  const recovering = Boolean(currentUser && !currentProfile);
  if (!name || !email || !phone || !area || !["employee", "employer"].includes(type)) {
    showMessage(elements.registerMessage, "errors.filled", "error"); return;
  }
  const digits = phone.replace(/\D/g, "");
  if (!/^\+?[\d\s().-]+$/.test(phone) || !/^\d{10,15}$/.test(digits)) {
    showMessage(elements.registerMessage, "errors.invalid.phone", "error"); return;
  }
  if (!recovering && password.length < 6) { showMessage(elements.registerMessage, "errors.password.weak", "error"); return; }
  let release;
  registrationGate = new Promise((resolve) => { release = resolve; });
  setBusy(elements.registerForm, true);
  let success = false;
  try {
    const user = recovering ? currentUser : (await createUserWithEmailAndPassword(auth, email, password)).user;
    await set(ref(db, `users/${user.uid}`), { uid: user.uid, name, email: user.email || email, phone, type, area, bio, createdAt: serverTimestamp() });
    success = true;
    elements.registerForm.reset();
    $("registerPassword").type = "password";
  } catch (error) {
    showMessage(elements.registerMessage, errorKey(error), "error");
  } finally {
    registrationGate = null; release();
    setBusy(elements.registerForm, false);
  }
  if (recovering && success) await handleAuthState(auth.currentUser);
});
elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (elements.loginForm.getAttribute("aria-busy") === "true") return;
  clearMessages(); setBusy(elements.loginForm, true);
  try {
    await signInWithEmailAndPassword(auth, $("loginEmail").value.trim(), $("loginPassword").value);
    elements.loginForm.reset(); $("loginPassword").type = "password";
    // Also retries a profile load after a transient database read failure.
    if (currentUser && !currentProfile) await handleAuthState(auth.currentUser);
  } catch (error) { showMessage(elements.loginMessage, errorKey(error), "error"); }
  finally { setBusy(elements.loginForm, false); }
});
elements.resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (elements.resetForm.getAttribute("aria-busy") === "true") return;
  clearMessages(); setBusy(elements.resetForm, true);
  try {
    await sendPasswordResetEmail(auth, $("resetEmail").value.trim());
    showMessage(elements.resetMessage, "success.password.reset");
  } catch (error) { showMessage(elements.resetMessage, errorKey(error), "error"); }
  finally { setBusy(elements.resetForm, false); }
});
elements.btnLogout.addEventListener("click", async () => {
  elements.btnLogout.disabled = true;
  try { await signOut(auth); }
  catch (error) { showMessage(elements.appMessage, errorKey(error), "error"); showMessage(elements.loginMessage, errorKey(error), "error"); }
  finally { elements.btnLogout.disabled = false; }
});
elements.jobForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (elements.jobForm.getAttribute("aria-busy") === "true") return;
  if (!currentUser || currentProfile?.type !== "employer") {
    showMessage(elements.jobMessage, "errors.only.employer", "error"); return;
  }
  const payload = Object.fromEntries(["title", "company", "area", "location", "salary", "description"].map((name) => [name, $(`job${name[0].toUpperCase()}${name.slice(1)}`).value.trim()]));
  if (["title", "company", "area", "location", "description"].some((name) => !payload[name])) {
    showMessage(elements.jobMessage, "jobs.required", "error"); return;
  }
  const id = $("jobId").value;
  const epoch = authEpoch;
  if (id && allJobs[id]?.ownerId !== currentUser.uid) { showMessage(elements.jobMessage, "errors.only.yours", "error"); return; }
  setBusy(elements.jobForm, true);
  try {
    if (id) await update(ref(db, `jobs/${id}`), { ...payload, updatedAt: serverTimestamp() });
    else {
      const jobRef = push(ref(db, "jobs"));
      await set(jobRef, { ...payload, id: jobRef.key, ownerId: currentUser.uid, ownerName: currentProfile.name, active: true, createdAt: serverTimestamp() });
    }
    if (epoch !== authEpoch) return;
    resetJobForm(); showMessage(elements.jobMessage, id ? "jobs.saved" : "jobs.published");
  } catch (error) { if (epoch === authEpoch) showMessage(elements.jobMessage, errorKey(error), "error"); }
  finally { if (epoch === authEpoch) setBusy(elements.jobForm, false); }
});

document.documentElement.classList.toggle("dark-mode", preferences.get("profit_dark_mode") === "true");
updateThemeButton();
updateAllText();
onAuthStateChanged(auth, (user) => { void handleAuthState(user); }, (error) => {
  showMessage(elements.bootMessage, errorKey(error), "error");
});
