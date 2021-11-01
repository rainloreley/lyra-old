/*
App Control Handler
===================

    This component is below every view. It handles DMX events and other events like the notification center and autosave-timer.
*/

import { NextPage } from 'next';
import {
	createContext,
	Dispatch,
	SetStateAction,
	useEffect,
	useState,
} from 'react';
import InterfaceServer from '../backend/InterfaceServer';
import ProjectManager from '../backend/ProjectManager';
import { v4 as uuidv4 } from 'uuid';
import LoadingSpinner from './loadingSpinner';
import { ipcRenderer } from 'electron';
import { useRouter } from 'next/dist/client/router';
import { DeviceDefinition } from '../devices/device_definitions';

interface NotificationCenterElement {
	uid: string;
	text: string;
	status: NotificationCenterElementStatus;
	dismissAt?: number;
}

enum NotificationCenterElementStatus {
	loading,
	notification,
	error,
	success,
}

type AppControlHandlerProps = {
	GlobalInterfaceServer: InterfaceServer;
	GlobalProjectManager: ProjectManager;
	setGlobalInterfaceServer: Dispatch<SetStateAction<InterfaceServer>>;
	setGlobalProjectManager: Dispatch<SetStateAction<ProjectManager>>;
	sendDMXCommand: (
		startingchannel: number,
		channel: number,
		value: number
	) => void;
	configureWebSocket: () => void;
	initialDMXSetup: () => void;
	app_initialConfigOver: boolean;
	setApp_initialConfigOver: Dispatch<SetStateAction<boolean>>;
};
export const AppControlContext = createContext<AppControlHandlerProps>(null);

const AppControlProvider = ({ children }) => {
	const router = useRouter();

	const [GlobalInterfaceServer, setGlobalInterfaceServer] =
		useState<InterfaceServer>(null);
	const [GlobalProjectManager, setGlobalProjectManager] =
		useState<ProjectManager>(null);

	const [notificationCenter, setnotificationCenter] = useState<
		NotificationCenterElement[]
	>([]);

	const [reloadRequired, setReloadRequired] = useState(false);

	const [app_initialConfigOver, setApp_initialConfigOver] = useState(false);

	var notificationcenterInterval: any;

	useEffect(() => {
		/*clearInterval(autosaveInterval);
		clearInterval(notificationcenterInterval);
		autosaveInterval = setInterval(() => {
			saveProject(GlobalProjectManager);
		}, 20000);*/

		ipcRenderer.on('open-new-device', function (e, f) {
			router.push('/projectmanagement/addDevice');
		});

		clearInterval(notificationcenterInterval);

		notificationcenterInterval = setInterval(() => {
			const newNotificationArray = notificationCenter.filter(
				(e) => e.dismissAt === undefined || e.dismissAt > Date.now()
			);
			setnotificationCenter((e) => [
				...e.filter(
					(f) => f.dismissAt === undefined || f.dismissAt > Date.now()
				),
			]);
		}, 1000);
	}, []);

	useEffect(() => {
		if (GlobalProjectManager !== null) {
			GlobalProjectManager.saveCurrentProjectWithNotification = saveProject;
		}
	}, [GlobalProjectManager]);

	useEffect(() => {
		if (
			GlobalInterfaceServer !== null &&
			GlobalProjectManager !== null &&
			GlobalProjectManager.currentProject !== undefined
		) {
			initialDMXSetup();
		}
	}, [GlobalInterfaceServer, GlobalProjectManager]);

	const webSocketDidClose = () => {
		console.log('WebSocket connection closed');
		setReloadRequired(true);
	};

	const webSocketDidOpen = () => {
		console.log('WebSocket connection opened');
	};

	const saveProject = (projectmanager: ProjectManager) => {
		const notificationElement: NotificationCenterElement = {
			uid: uuidv4(),
			text: 'Saving project',
			status: NotificationCenterElementStatus.loading,
		};
		console.log(projectmanager);
		addElementToNotificationCenter(notificationElement);
		projectmanager
			.saveCurrentProject()
			.then((_) => {
				const newNotificationElement: NotificationCenterElement = {
					uid: notificationElement.uid,
					text: 'Project saved!',
					dismissAt: Date.now() + 3000,
					status: NotificationCenterElementStatus.success,
				};
				updateElementInNotificationCenter(newNotificationElement);
			})
			.catch((err) => {
				const newNotificationElement: NotificationCenterElement = {
					uid: notificationElement.uid,
					text: "The project couldn't be saved",
					dismissAt: Date.now() + 3000,
					status: NotificationCenterElementStatus.error,
				};
				updateElementInNotificationCenter(newNotificationElement);

				const errorNotificationCenterElement: NotificationCenterElement = {
					uid: uuidv4(),
					text: err.toString(),
					dismissAt: Date.now() + 3000,
					status: NotificationCenterElementStatus.error,
				};
				addElementToNotificationCenter(errorNotificationCenterElement);
			});
	};

	function addElementToNotificationCenter(element: NotificationCenterElement) {
		setnotificationCenter((e) => [...e, element]);
	}

	function updateElementInNotificationCenter(
		element: NotificationCenterElement
	) {
		setnotificationCenter((e) => {
			const index = e.findIndex((f) => f.uid === element.uid);
			if (index > -1) e[index] = element;
			return e;
		});
	}

	async function initialDMXSetup() {
		console.log(GlobalProjectManager.currentProject.devices.length);
		for (var device of GlobalProjectManager.currentProject.devices) {
			console.log(device.channel_state);
			for (
				var i = 0;
				i <
				(device.device as DeviceDefinition).modes[device.mode].channel_count;
				i++
			) {
				// @ts-ignore
				GlobalInterfaceServer.sendDMXCommand(
					device.start_channel + i,
					device.channel_state.filter((e) => e.channel == i + 1)[0].value
				);
			}
		}
	}

	/*var GlobalInterfaceServer: InterfaceServer;
	var GlobalProjectManager: ProjectManager;*/
	/*const [GlobalInterfaceServer, setInterfaceServer] = useState<InterfaceServer>(
		new InterfaceServer()
	);
	const [GlobalProjectManager, setProjectManager] = useState<ProjectManager>(
		new ProjectManager()
	);*/

	/*useEffect(() => {
		/*GlobalInterfaceServer = ;
		GlobalProjectManager = ;
		ipcRenderer.on('save-project', function (event, data) {
			saveProject();
		});
	}, []);*/

	const configureWebSocket = async () => {
		if (
			GlobalInterfaceServer !== null &&
			GlobalInterfaceServer.interfaceId !== undefined
		) {
			GlobalInterfaceServer.closeCallback = webSocketDidClose;
			GlobalInterfaceServer.openCallback = webSocketDidOpen;

			await GlobalInterfaceServer.configureWebsocket();
		}
	};

	const sendDMXCommand = (
		startingchannel: number,
		channel: number,
		value: number
	) => {
		GlobalInterfaceServer.sendDMXCommand(startingchannel - 1 + channel, value);
		GlobalProjectManager.currentProject!.devices.find(
			(e) => e.start_channel === startingchannel
		).channel_state.find((e) => e.channel === channel).value = parseInt(
			value.toFixed(0)
		);
	};

	const state: AppControlHandlerProps = {
		GlobalInterfaceServer: GlobalInterfaceServer,
		//setInterfaceServer: setInterfaceServer,
		GlobalProjectManager: GlobalProjectManager,
		setGlobalInterfaceServer: setGlobalInterfaceServer,
		setGlobalProjectManager: setGlobalProjectManager,
		//setProjectManager: setProjectManager,
		sendDMXCommand: sendDMXCommand,
		configureWebSocket: configureWebSocket,
		initialDMXSetup: initialDMXSetup,
		app_initialConfigOver: app_initialConfigOver,
		setApp_initialConfigOver: setApp_initialConfigOver,
	};

	/*return (
		<AppControlContext.Provider value={state}>
			{children}
		</AppControlContext.Provider>
	);*/

	return (
		<div className="overflow-hidden w-screen h-screen">
			{reloadRequired ? (
				<div className="w-screen h-screen bg-transparent z-20 absolute justify-center flex">
					<div className="self-center dark:text-white text-center text-black">
						<p className="text-3xl font-bold">Reload Required</p>
						<p>Something bad happened. Let's try again.</p>
						<button
							className="bg-blue-500 text-white rounded-xl p-2 mt-4 px-6 hover:bg-blue-600"
							onClick={() => {
								setReloadRequired(false);
								router.push('/');
							}}
						>
							Reload
						</button>
					</div>
				</div>
			) : (
				<div></div>
			)}
			<div
				className={`flex flex-col dark:bg-gray-900 bg-gray-100 h-screen w-screen overflow-hidden dark:text-white ${
					reloadRequired ? 'filter blur-md scale-105 transform' : ''
				}`}
			>
				<div className="absolute bottom-6 right-6 flex z-10 text-white flex-col">
					{notificationCenter.map((notification) => (
						<div
							className={`m-4 flex flex-row p-3 rounded-lg w-64 justify-between pl-4 ${
								notification.status === NotificationCenterElementStatus.error
									? 'bg-red-500'
									: `${
											notification.status ===
											NotificationCenterElementStatus.success
												? 'bg-green-400'
												: 'bg-gray-400 dark:bg-gray-600'
									  }`
							}`}
						>
							<p>{notification.text}</p>
							{notification.status ===
							NotificationCenterElementStatus.loading ? (
								<div className="w-5 ml-4 mr-2">
									<LoadingSpinner color="#ffffff" size={'25'} />
								</div>
							) : (
								<div></div>
							)}
						</div>
					))}
				</div>
				<AppControlContext.Provider value={state}>
					{children}
				</AppControlContext.Provider>
			</div>
		</div>
	);
};

export default AppControlProvider;
