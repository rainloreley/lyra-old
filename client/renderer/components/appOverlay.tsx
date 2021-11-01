import { ipcRenderer } from 'electron';
import { useRouter } from 'next/dist/client/router';
import { useContext, useEffect, useState } from 'react';
import { AppControlContext } from './appControlHandler';
import { v4 as uuidv4 } from 'uuid';
import LoadingSpinner from './loadingSpinner';
import ProjectManager from '../backend/ProjectManager';

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

const AppOverlay = ({ children }) => {
	const router = useRouter();

	const {
		GlobalInterfaceServer,
		GlobalProjectManager,
		sendDMXCommand,
		configureWebSocket,
	} = useContext(AppControlContext);

	const [notificationCenter, setnotificationCenter] = useState<
		NotificationCenterElement[]
	>([]);

	const [reloadRequired, setReloadRequired] = useState(false);

	var notificationcenterInterval: any;

	useEffect(() => {
		//ipcRenderer.on('save-project', saveProject.bind(this));
		//});
		//ipcRenderer.on('save-project', (e) => saveProject());
		notificationcenterInterval = setInterval(() => {
			console.log(Date.now());
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
			GlobalInterfaceServer.interfaceId !== undefined
		) {
			GlobalInterfaceServer.closeCallback = webSocketDidClose;
			GlobalInterfaceServer.openCallback = webSocketDidOpen;

			GlobalInterfaceServer.configureWebsocket();
		}
	}, [GlobalInterfaceServer]);

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
				{children}
			</div>
		</div>
	);
};
export default AppOverlay;
