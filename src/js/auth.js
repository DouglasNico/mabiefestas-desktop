/**
 * auth.js - Módulo de Autenticação Firebase do Aplicativo Desktop Mabie Festas
 */

import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "./firebase-config.js";
import { FirebaseSync } from "./firebase-sync.js";

const AuthModule = {
  usuarioAtual: null,

  init() {
    this.bindEvents();
    this.monitorarEstadoAuth();
  },

  bindEvents() {
    const formLogin = document.getElementById("form-login-desktop");
    if (formLogin) {
      formLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        this.fazerLogin();
      });
    }

    const btnLogout = document.getElementById("btn-header-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        this.fazerLogout();
      });
    }
  },

  monitorarEstadoAuth() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.usuarioAtual = user;
        this.exibirAppPrincipal(user);
        // Iniciar sincronização com Firestore após login
        FirebaseSync.init();
      } else {
        this.usuarioAtual = null;
        this.exibirTelaLogin();
      }
    });
  },

  async fazerLogin() {
    const inputEmail = document.getElementById("login-email");
    const inputSenha = document.getElementById("login-senha");
    const btnEntrar = document.getElementById("btn-login-submit");
    const btnTexto = document.getElementById("btn-login-texto");
    const spinner = document.getElementById("btn-login-spinner");
    const msgErro = document.getElementById("login-error-msg");

    const email = inputEmail ? inputEmail.value.trim() : "";
    const senha = inputSenha ? inputSenha.value : "";

    if (!email || !senha) {
      this.mostrarErro("Por favor, preencha o e-mail e a senha.");
      return;
    }

    if (msgErro) msgErro.style.display = "none";
    if (btnEntrar) btnEntrar.disabled = true;
    if (btnTexto) btnTexto.textContent = "Validando acesso...";
    if (spinner) spinner.style.display = "inline-block";

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      this.usuarioAtual = userCredential.user;
      if (window.App) {
        window.App.showToast(`Bem-vindo(a), ${userCredential.user.email}!`, "success");
      }
    } catch (error) {
      console.error("Erro ao autenticar no Firebase:", error);
      let mensagem = "E-mail ou senha incorretos. Verifique suas credenciais.";
      if (error.code === "auth/too-many-requests") {
        mensagem = "Muitas tentativas sem sucesso. Aguarde alguns instantes.";
      } else if (error.code === "auth/network-request-failed") {
        mensagem = "Falha de conexão com a internet.";
      }
      this.mostrarErro(mensagem);
    } finally {
      if (btnEntrar) btnEntrar.disabled = false;
      if (btnTexto) btnTexto.textContent = "🔒 Entrar no Sistema";
      if (spinner) spinner.style.display = "none";
    }
  },

  async fazerLogout() {
    if (confirm("Deseja realmente sair do sistema?")) {
      try {
        await signOut(auth);
        this.exibirTelaLogin();
        if (window.App) {
          window.App.showToast("Sessão encerrada com sucesso.", "info");
        }
      } catch (error) {
        console.error("Erro ao sair:", error);
      }
    }
  },

  mostrarErro(texto) {
    const msgErro = document.getElementById("login-error-msg");
    if (msgErro) {
      msgErro.textContent = texto;
      msgErro.style.display = "block";
    } else {
      alert(texto);
    }
  },

  exibirAppPrincipal(user) {
    const screenLogin = document.getElementById("screen-login");
    const appLayout = document.getElementById("app-main-layout");
    const userEmailBadge = document.getElementById("header-user-email");

    if (screenLogin) screenLogin.style.display = "none";
    if (appLayout) appLayout.style.display = "flex";
    if (userEmailBadge) userEmailBadge.textContent = user.email || "Administrador";

    // Atualizar dashboard e abas
    if (window.App) {
      window.App.atualizarStatsDashboard();
    }
  },

  exibirTelaLogin() {
    const screenLogin = document.getElementById("screen-login");
    const appLayout = document.getElementById("app-main-layout");
    const inputSenha = document.getElementById("login-senha");

    if (screenLogin) screenLogin.style.display = "flex";
    if (appLayout) appLayout.style.display = "none";
    if (inputSenha) inputSenha.value = "";
  }
};

window.AuthModule = AuthModule;
export { AuthModule };
