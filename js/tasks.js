/**
 * tasks.js
 * Responsabilidade única: regras de negócio das tarefas
 * (criar, editar, excluir, concluir, validar, ordenar, pesquisar).
 * Não manipula o DOM. Depende apenas de storage.js.
 */

const Tasks = (() => {
  let state = [];

  function generateId() {
    return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /** Remove acentos e normaliza espaços/caixa para comparação. */
  function normalize(text) {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  function load() {
    state = Storage.getTasks();
    return state;
  }

  function persist() {
    return Storage.saveTasks(state);
  }

  function getAll() {
    return [...state];
  }

  /**
   * Valida o texto de uma nova tarefa (ou edição).
   * @param {string} text
   * @param {string|null} ignoreId - id da tarefa a ignorar na checagem de duplicidade (uso em edição)
   * @returns {{ ok: boolean, error?: string }}
   */
  function validate(text, ignoreId = null) {
    if (typeof text !== 'string' || text.trim().length === 0) {
      return { ok: false, error: 'A tarefa não pode ficar vazia.' };
    }
    const normalized = normalize(text);
    if (normalized.length === 0) {
      return { ok: false, error: 'A tarefa não pode conter apenas espaços.' };
    }
    const isDuplicate = state.some(
      (task) => task.id !== ignoreId && normalize(task.text) === normalized
    );
    if (isDuplicate) {
      return { ok: false, error: 'Essa tarefa já existe na sua lista.' };
    }
    return { ok: true };
  }

  function add(text) {
    const validation = validate(text);
    if (!validation.ok) return { ok: false, error: validation.error };

    const now = new Date().toISOString();
    const task = {
      id: generateId(),
      text: text.trim(),
      done: false,
      createdAt: now,
      updatedAt: now,
    };
    state.unshift(task);
    persist();
    return { ok: true, task };
  }

  function edit(id, newText) {
    const task = state.find((t) => t.id === id);
    if (!task) return { ok: false, error: 'Tarefa não encontrada.' };

    const validation = validate(newText, id);
    if (!validation.ok) return { ok: false, error: validation.error };

    task.text = newText.trim();
    task.updatedAt = new Date().toISOString();
    persist();
    return { ok: true, task };
  }

  function remove(id) {
    const before = state.length;
    state = state.filter((t) => t.id !== id);
    persist();
    return state.length < before;
  }

  function toggleDone(id) {
    const task = state.find((t) => t.id === id);
    if (!task) return { ok: false, error: 'Tarefa não encontrada.' };
    task.done = !task.done;
    task.updatedAt = new Date().toISOString();
    persist();
    return { ok: true, task };
  }

  function getById(id) {
    return state.find((t) => t.id === id) || null;
  }

  function counts() {
    const total = state.length;
    const done = state.filter((t) => t.done).length;
    return { total, done, pending: total - done };
  }

  /**
   * Retorna tarefas filtradas por status e/ou termo de pesquisa,
   * ordenadas: pendentes antes de concluídas, mais recentes primeiro dentro do grupo.
   */
  function query({ filter = 'all', search = '' } = {}) {
    const term = normalize(search);

    let result = state.filter((task) => {
      if (filter === 'pending' && task.done) return false;
      if (filter === 'completed' && !task.done) return false;
      if (term && !normalize(task.text).includes(term)) return false;
      return true;
    });

    result.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
  }

  return {
    load,
    getAll,
    add,
    edit,
    remove,
    toggleDone,
    getById,
    counts,
    query,
    validate,
  };
})();
