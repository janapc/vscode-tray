const { resolve, basename } = require('path');
const {
  app, Menu, Tray, dialog,
} = require('electron');
const Store = require('electron-store');
const fixPath = require('fix-path');
const { spawn } = require('child_process');

fixPath();
const schema = {
  projects: {
    type: 'string',
  },
};

const store = new Store({ schema });
let mainTray = {};
if (app.dock) app.dock.hide();

function render(tray = mainTray) {
  const storedProjects = store.get('projects');
  const projects = storedProjects ? JSON.parse(storedProjects) : [];

  const items = projects.map(({ name, path }) => ({
    label: name,
    submenu: [
      {
        label: 'open vscode',
        click: () => {
          spawn('code', [path], { shell: true });
        },
      },
      {
        label: 'remove project',
        click: () => {
          store.set(
            'projects',
            JSON.stringify(projects.filter((item) => item.path !== path)),
          );
          render();
        },
      },
    ],
  }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'add new project',
      click: () => {
        const result = dialog.showOpenDialogSync({
          properties: ['openDirectory'],
        });

        if (!result) return;

        const [path] = result;
        const name = basename(path);

        store.set(
          'projects',
          JSON.stringify([
            ...projects,
            {
              path,
              name,
            },
          ]),
        );

        render();
      },
    },
    {
      type: 'separator',
    },
    ...items,
    {
      type: 'separator',
    },
    {
      type: 'normal',
      label: 'close',
      role: 'quit',
      enabled: true,
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', tray.popUpContextMenu);
}


app.on('ready', () => {
  mainTray = new Tray(resolve(__dirname, 'assets', 'iconTemplate.png'));

  render(mainTray);
});
