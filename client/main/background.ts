import { app, Menu } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';

const isProd: boolean = process.env.NODE_ENV === 'production';

if (isProd) {
	serve({ directory: 'app' });
} else {
	app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
	await app.whenReady();

	const mainWindow = createWindow('main', {
		width: 1000,
		height: 600,
	});

	const appMenu: Menu = Menu.buildFromTemplate([
		{
			role: 'appMenu',
		},
		{
			label: 'Project',
			submenu: [
				{
					label: 'Save',
					accelerator: 'Cmd+S',
					click: () => {
						mainWindow.webContents.send('save-project');
					},
				},
				{
					label: 'Add device',
					accelerator: 'Cmd+Shift+N',
					click: () => {
						mainWindow.webContents.send('open-new-device');
					},
				},
			],
		},
		{
			label: 'Edit',
			submenu: [
				{
					role: 'undo',
				},
				{
					role: 'redo',
				},
				{
					type: 'separator',
				},
				{
					role: 'cut',
				},
				{
					role: 'copy',
				},
				{
					role: 'paste',
				},
			],
		},

		{
			label: 'View',
			submenu: [
				{
					role: 'reload',
				},
				{
					role: 'toggleDevTools',
				},
				{
					type: 'separator',
				},
				{
					role: 'resetZoom',
				},
				{
					role: 'zoomIn',
				},
				{
					role: 'zoomOut',
				},
				{
					type: 'separator',
				},
				{
					role: 'togglefullscreen',
				},
			],
		},

		{
			role: 'window',
			submenu: [
				{
					role: 'minimize',
				},
				{
					role: 'close',
				},
			],
		},

		{
			role: 'help',
			submenu: [
				{
					label: 'Learn More',
				},
			],
		},
	]);

	//console.log(Menu.getApplicationMenu());

	Menu.setApplicationMenu(appMenu);

	//mainWindow.setMenu(appMenu);

	if (isProd) {
		await mainWindow.loadURL('app://./home.html');
	} else {
		const port = process.argv[2];
		await mainWindow.loadURL(`http://localhost:${port}/`);
		mainWindow.webContents.openDevTools();
	}
})();

app.on('window-all-closed', () => {
	app.quit();
});
