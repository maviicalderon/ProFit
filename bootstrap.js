// O carregamento dinâmico permite mostrar falhas de rede/importação na página.
import("./app.js").catch((error) => {
  console.error("Não foi possível iniciar o ProFit:", error);
  const message = document.getElementById("bootMessage");
  message.className = "message error";
  message.setAttribute("role", "alert");
  message.textContent = "Não foi possível carregar o site. Verifique sua conexão e recarregue a página. Se o erro persistir, confira a configuração do Firebase.";
});
