const THEME_STORAGE_KEY = 'dfs-theme';

export function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function setTheme(theme, themeToggleBtn) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  const isDark = theme === 'dark';
  themeToggleBtn.textContent = isDark ? '☀️ ライトモード' : '🌙 ダークモード';
  themeToggleBtn.setAttribute('aria-pressed', String(isDark));
}

export function toggleTheme(themeToggleBtn) {
  const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  setTheme(current === 'dark' ? 'light' : 'dark', themeToggleBtn);
}
