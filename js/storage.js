/**
 * storage.js
 * Responsabilidade única: ler e gravar dados no LocalStorage.
 * Nenhuma outra parte da aplicação deve tocar em `window.localStorage` diretamente.
 * Isso mantém uma camada de abstração fácil de trocar por Firebase/API no futuro.
 */

const Storage = (() => {
  const KEYS = {
    TASKS: 'todo:tasks',
    THEME: 'todo:theme',
    FILTER: 'todo:filter',
  };

  /**
   * Lê e faz parse de um valor JSON do LocalStorage.
   * Retorna `fallback` em caso de ausência ou erro de parse.
   */
  function readJSON(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.error(`Storage: falha ao ler "${key}"`, err);
      return fallback;
    }
  }

  /**
   * Grava um valor serializado em JSON no LocalStorage.
   * Retorna `true` em caso de sucesso, `false` em caso de erro.
   */
  function writeJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`Storage: falha ao gravar "${key}"`, err);
      return false;
    }
  }

  function getTasks() {
    return readJSON(KEYS.TASKS, []);
  }

  function saveTasks(tasks) {
    return writeJSON(KEYS.TASKS, tasks);
  }

  function getTheme() {
    return readJSON(KEYS.THEME, null);
  }

  function saveTheme(theme) {
    return writeJSON(KEYS.THEME, theme);
  }

  function getFilter() {
    return readJSON(KEYS.FILTER, 'all');
  }

  function saveFilter(filter) {
    return writeJSON(KEYS.FILTER, filter);
  }

  function isAvailable() {
    try {
      const testKey = '__todo_storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (err) {
      return false;
    }
  }

  return {
    getTasks,
    saveTasks,
    getTheme,
    saveTheme,
    getFilter,
    saveFilter,
    isAvailable,
  };
})();
