export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Jarvis 2.0";

export const APP_LOGO = "https://img.icons8.com/fluency/96/artificial-intelligence.png";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // Para o MVP v0.1 no S3, vamos desabilitar o redirecionamento externo que causa o erro "project not found"
  // No futuro, aqui serÃ¡ o link para a tela de login do Cognito ou seu portal personalizado.
  return "/login"; 
};
