const THEME_STORAGE_KEY = "codex-theme-preference-v1";
const DEFAULT_THEME = "light";
const root = document.documentElement;

const initialTheme = getInitialTheme();
applyTheme(initialTheme);
ensureThemeStored(initialTheme);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThemeControls);
} else {
  initThemeControls();
}

function initThemeControls() {
  const buttons = Array.from(document.querySelectorAll("[data-theme-toggle]"));

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      saveTheme(nextTheme);
    });
  });

  syncThemeButtons();
}

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch {
    // 本地存储不可用时，退回默认浅色。
  }

  return DEFAULT_THEME;
}

function applyTheme(theme) {
  root.dataset.theme = theme;
  syncThemeButtons();
}

function syncThemeButtons() {
  const buttons = Array.from(document.querySelectorAll("[data-theme-toggle]"));
  const isDark = root.dataset.theme === "dark";

  buttons.forEach((button) => {
    button.textContent = isDark ? "浅色模式" : "深色模式";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("title", isDark ? "切换回浅色模式" : "切换到深色模式");
  });
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // 本地存储不可用时，页面仍然保持可切换。
  }
}

function ensureThemeStored(theme) {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme !== "light" && savedTheme !== "dark") {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    // 本地存储不可用时，不阻断页面初始化。
  }
}
