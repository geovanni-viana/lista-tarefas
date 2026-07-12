/**
 * ui.js
 * Responsabilidade única: renderizar o DOM e capturar eventos da interface.
 * Toda regra de negócio é delegada ao módulo Tasks. Nunca usa innerHTML
 * com conteúdo digitado pelo usuário — sempre textContent / createElement.
 */

const UI = (() => {
  let els = {};
  let currentFilter = 'all';
  let currentSearch = '';
  let pendingDeleteId = null;
  let toastTimer = null;

  function cacheElements() {
    els = {
      form: document.getElementById('task-form'),
      input: document.getElementById('task-input'),
      list: document.getElementById('task-list'),
      emptyState: document.getElementById('empty-state'),
      search: document.getElementById('search-input'),
      filterButtons: Array.from(document.querySelectorAll('[data-filter]')),
      countTotal: document.getElementById('count-total'),
      countPending: document.getElementById('count-pending'),
      countCompleted: document.getElementById('count-completed'),
      themeToggle: document.getElementById('theme-toggle'),
      toast: document.getElementById('toast'),
      confirmDialog: document.getElementById('confirm-dialog'),
      confirmCancel: document.getElementById('confirm-cancel'),
      confirmDelete: document.getElementById('confirm-delete'),
      fieldError: document.getElementById('field-error'),
    };
  }

  // ---------- Toast ----------
  function showToast(message) {
    if (!els.toast) return;
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove('is-visible');
    }, 2800);
  }

  // ---------- Contadores ----------
  function renderCounts() {
    const { total, pending, done } = Tasks.counts();
    els.countTotal.textContent = String(total);
    els.countPending.textContent = String(pending);
    els.countCompleted.textContent = String(done);
  }

  // ---------- Formatação de data ----------
  function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ---------- Construção de um item de tarefa ----------
  function buildTaskItem(task, position) {
    const li = document.createElement('li');
    li.className = 'task';
    li.dataset.id = task.id;
    if (task.done) li.classList.add('task--done');

    // Número de controle (estilo canhoto de bilhete)
    const indexEl = document.createElement('span');
    indexEl.className = 'task__index';
    indexEl.setAttribute('aria-hidden', 'true');
    indexEl.textContent = String(position).padStart(3, '0');

    // Carimbo de concluído
    const stampEl = document.createElement('span');
    stampEl.className = 'task__stamp';
    stampEl.setAttribute('aria-hidden', 'true');
    stampEl.textContent = '✓ concluído';

    // Checkbox
    const checkboxWrap = document.createElement('button');
    checkboxWrap.type = 'button';
    checkboxWrap.className = 'task__check';
    checkboxWrap.setAttribute('role', 'checkbox');
    checkboxWrap.setAttribute('aria-checked', String(task.done));
    checkboxWrap.setAttribute(
      'aria-label',
      task.done ? 'Marcar tarefa como pendente' : 'Marcar tarefa como concluída'
    );
    checkboxWrap.addEventListener('click', () => handleToggle(task.id));

    // Corpo (texto + meta)
    const body = document.createElement('div');
    body.className = 'task__body';

    const textEl = document.createElement('p');
    textEl.className = 'task__text';
    textEl.textContent = task.text;

    const metaEl = document.createElement('p');
    metaEl.className = 'task__meta';
    const metaLabel = task.updatedAt !== task.createdAt ? 'editado em' : 'criado em';
    metaEl.textContent = `${metaLabel} ${formatDate(task.updatedAt)}`;

    body.appendChild(textEl);
    body.appendChild(metaEl);
    body.appendChild(stampEl);

    // Ações
    const actions = document.createElement('div');
    actions.className = 'task__actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'task__action-btn';
    editBtn.setAttribute('aria-label', 'Editar tarefa');
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', () => startEdit(li, task));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'task__action-btn task__action-btn--danger';
    deleteBtn.setAttribute('aria-label', 'Excluir tarefa');
    deleteBtn.textContent = 'Excluir';
    deleteBtn.addEventListener('click', () => requestDelete(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(indexEl);
    li.appendChild(checkboxWrap);
    li.appendChild(body);
    li.appendChild(actions);

    return li;
  }

  // ---------- Edição inline ----------
  function startEdit(li, task) {
    const body = li.querySelector('.task__body');
    body.replaceChildren();

    const editForm = document.createElement('form');
    editForm.className = 'task__edit-form';
    editForm.setAttribute('aria-label', 'Editar tarefa');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task__edit-input';
    input.value = task.text;
    input.setAttribute('aria-label', 'Texto da tarefa');
    input.maxLength = 200;

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'task__action-btn';
    saveBtn.textContent = 'Salvar';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'task__action-btn';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', renderAll);

    editForm.appendChild(input);
    editForm.appendChild(saveBtn);
    editForm.appendChild(cancelBtn);
    body.appendChild(editForm);

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    editForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const result = Tasks.edit(task.id, input.value);
      if (!result.ok) {
        showToast(result.error);
        return;
      }
      showToast('Tarefa editada.');
      renderAll();
    });
  }

  // ---------- Excluir com confirmação ----------
  function requestDelete(id) {
    pendingDeleteId = id;
    if (typeof els.confirmDialog.showModal === 'function') {
      els.confirmDialog.showModal();
    } else {
      // Fallback para navegadores sem suporte a <dialog>
      if (window.confirm('Excluir esta tarefa permanentemente?')) {
        confirmDelete();
      }
    }
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;
    Tasks.remove(pendingDeleteId);
    showToast('Tarefa removida.');
    pendingDeleteId = null;
    els.confirmDialog.close?.();
    renderAll();
  }

  function cancelDelete() {
    pendingDeleteId = null;
    els.confirmDialog.close?.();
  }

  // ---------- Concluir / desmarcar ----------
  function handleToggle(id) {
    const result = Tasks.toggleDone(id);
    if (!result.ok) return;
    showToast(result.task.done ? 'Tarefa concluída.' : 'Tarefa restaurada.');
    renderAll();
  }

  // ---------- Lista + estado vazio ----------
  function renderList() {
    const tasks = Tasks.query({ filter: currentFilter, search: currentSearch });
    els.list.replaceChildren();

    if (tasks.length === 0) {
      els.emptyState.hidden = false;
      els.emptyState.textContent = currentSearch
        ? 'Nenhuma tarefa encontrada para essa pesquisa.'
        : 'Nenhuma tarefa por aqui ainda. Adicione a primeira acima.';
    } else {
      els.emptyState.hidden = true;
      const fragment = document.createDocumentFragment();
      tasks.forEach((task, i) => fragment.appendChild(buildTaskItem(task, i + 1)));
      els.list.appendChild(fragment);
    }
  }

  function renderAll() {
    renderList();
    renderCounts();
  }

  // ---------- Filtros ----------
  function setFilter(filter) {
    currentFilter = filter;
    Storage.saveFilter(filter);
    els.filterButtons.forEach((btn) => {
      const isActive = btn.dataset.filter === filter;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
    renderList();
  }

  // ---------- Tema ----------
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    els.themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    els.themeToggle.textContent = theme === 'dark' ? '☀️ Modo claro' : '🌙 Modo escuro';
  }

  function initTheme() {
    const saved = Storage.getTheme();
    const preferred = window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const theme = saved || preferred;
    applyTheme(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    Storage.saveTheme(next);
  }

  // ---------- Envio do formulário principal ----------
  function handleSubmit(event) {
    event.preventDefault();
    const result = Tasks.add(els.input.value);
    els.fieldError.textContent = '';

    if (!result.ok) {
      els.fieldError.textContent = result.error;
      return;
    }

    els.input.value = '';
    els.input.focus();
    showToast('Tarefa criada.');
    renderAll();
  }

  // ---------- Pesquisa ----------
  function handleSearch(event) {
    currentSearch = event.target.value;
    renderList();
  }

  function bindEvents() {
    els.form.addEventListener('submit', handleSubmit);
    els.search.addEventListener('input', handleSearch);
    els.themeToggle.addEventListener('click', toggleTheme);
    els.confirmCancel.addEventListener('click', cancelDelete);
    els.confirmDelete.addEventListener('click', confirmDelete);
    els.confirmDialog.addEventListener('cancel', () => {
      pendingDeleteId = null;
    });
    els.filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
  }

  function init() {
    cacheElements();
    bindEvents();
    initTheme();
    currentFilter = Storage.getFilter();
    setFilter(currentFilter);
    renderAll();
  }

  return { init, renderAll };
})();
