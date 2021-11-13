//import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { app, Menu } from 'electron';
import serve from 'electron-serve';
//import path from 'path';
import { createWindow } from './helpers';

const isProd: boolean = process.env.NODE_ENV === 'production';

if (isProd) {
	serve({ directory: 'app' });
} else {
	app.setPath('userData', `${app.getPath('userData')} (development)`);
}

//var backend_exec: ChildProcessWithoutNullStreams;

(async () => {
	await app.whenReady();

	/*if (isProd) {
		let backend_bundle_url_path = path.join(
			process.resourcesPath,
			'/backend_bundle/'
		);
		console.log(backend_bundle_url_path);

		try {
			let kill_8080_exec = spawn('kill', ['-9', '$(lsof -t -i:8080)']);
			kill_8080_exec.stdout.on('data', (data) => {
				console.log(`stdout: ${data}`);
			});
			kill_8080_exec.stderr.on('data', (data) => {
				console.log(`stderr: ${data}`);
			});
		} catch {
			// do absolutely nothing
		}

		backend_exec = spawn(`${backend_bundle_url_path}lyra`);

		backend_exec.stdout.on('data', (data) => {
			console.log(`stdout: ${data}`);
		});
		backend_exec.stderr.on('data', (data) => {
			console.log(`stderr: ${data}`);
		});
		backend_exec.on('close', (code) => {
			console.log(`child process exited with code ${code}`);
		});
	}*/

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
					label: 'Show scene list',
					click: () => {
						mainWindow.webContents.send('dashboard-show-scene-list');
					},
				},
				{
					type: "separator"
				},
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
	/*if (isProd) {
		backend_exec.kill();
	}*/
	app.quit();
});
