/**
 * app.js
 * Ponto de entrada da aplicação. Inicializa o storage, carrega as tarefas
 * e inicia a camada de interface.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Storage.isAvailable()) {
    const banner = document.getElementById('storage-warning');
    if (banner) banner.hidden = false;
    console.error('LocalStorage indisponível: os dados não serão salvos.');
  }

  Tasks.load();
  UI.init();
});
