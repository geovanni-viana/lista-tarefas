# Lista de Tarefas

Aplicação To-Do List em HTML5, CSS3 e JavaScript (sem frameworks, sem bibliotecas
externas, sem backend). Toda a persistência é feita via `LocalStorage`.

## Estrutura

```
/
├── index.html
├── manifest.json         # deixa o projeto pronto para virar PWA (instalável)
├── css/
│   └── style.css
├── js/
│   ├── storage.js        # única camada que toca o LocalStorage
│   ├── tasks.js           # regras de negócio (CRUD, validação, ordenação, pesquisa)
│   ├── ui.js               # renderização do DOM e eventos
│   └── app.js              # ponto de entrada, une os módulos
├── icons/
│   └── icon.svg
└── README.md
```

## Como usar

Abra `index.html` diretamente no navegador (duplo clique) — não precisa de servidor.

> Atenção: como o CSS e o JS estão em arquivos separados, alguns visualizadores de
> preview embutidos em chats/editores não carregam esses arquivos irmãos e o app pode
> aparecer sem estilo ou sem funcionar. Isso não acontece ao abrir o arquivo direto no
> navegador nem ao publicar no GitHub Pages — só em certas pré-visualizações internas.

Para publicar no GitHub Pages (mesmo padrão dos seus outros projetos):

1. Suba a pasta para um repositório no GitHub.
2. Em *Settings → Pages*, aponte para a branch `main` (pasta raiz).
3. O app ficará em `https://<usuario>.github.io/<repositorio>/`.

## Design

Visual clean e colorido: cantos arredondados, sombras suaves (sem bordas grossas ou
blocos duros), fundo em gradiente pastel, e cada tarefa recebe uma cor de destaque
(faixa esquerda + número de controle) que percorre uma paleta de 6 cores — dá
identidade visual sem pesar a interface. Tarefas concluídas ganham um selinho
"✓ concluído" discreto ao lado da data.

## Funcionalidades

- Criar, editar, excluir e concluir/desmarcar tarefas.
- Validação: bloqueia tarefas vazias, só com espaços, ou duplicadas (ignora
  maiúsculas/minúsculas e espaços extras).
- Confirmação antes de excluir (via `<dialog>` nativo, com fallback para `confirm()`).
- Pesquisa em tempo real, ignorando acentos e caixa.
- Filtros: Todas / Pendentes / Concluídas, cada um com sua cor, sem recarregar a página.
- Contadores de total, pendentes e concluídas, sempre atualizados.
- Tema claro/escuro, com preferência salva no `LocalStorage`.
- Notificações (toasts) para criar, editar, excluir, concluir e restaurar tarefas.
- Acessibilidade: labels em todos os campos, navegação por teclado, foco visível,
  `aria-live` nos contadores e nas notificações, `role="checkbox"` no botão de concluir.
- Segurança: nenhum conteúdo do usuário é inserido via `innerHTML` — tudo passa por
  `textContent`/`createElement`.
- Responsivo, sem rolagem horizontal, do celular ao desktop.

## Arquitetura

- **`storage.js`** é a única parte do código que chama `window.localStorage`. Se um dia
  você quiser migrar para Firebase, basta reescrever essas seis funções mantendo a
  mesma assinatura — `tasks.js` e `ui.js` não mudam.
- **`tasks.js`** não toca no DOM: só recebe/retorna dados.
- **`ui.js`** não tem regra de negócio: só desenha a tela e delega tudo para `tasks.js`.
- **`app.js`** apenas conecta as três peças na inicialização.
