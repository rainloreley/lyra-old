import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Dashboard.module.css';
import { useState, useEffect } from 'react';
import dmxDevices from '../devices/devicelist';
import DeviceDropdown from '../components/device_components/dropdown';
import { GlobalInterfaceServer, GlobalProjectManager } from './index';
import { useRouter } from 'next/dist/client/router';
import { getRouteRegex } from 'next/dist/shared/lib/router/utils';
import DeviceSlider from '../components/device_components/slider';
import DeviceColorWheel from '../components/device_components/colorwheel';
import {
	DMXProjectDevice,
	DMXProjectDeviceChannelState,
} from '../backend/ProjectManager';
import { v4 as uuidv4 } from 'uuid';
import DashboardSidebar from '../components/dashboard_sidebar';
import { DeviceDefinition } from '../devices/device_definitions';
import LoadingSpinner from '../components/loadingSpinner';
import SaveDiskIcon from '../components/icons/save-disk';

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

const Dashboard: NextPage = () => {
	const router = useRouter();

	const [selectedDevice, setSelectedDevice] = useState<DMXProjectDevice | null>(
		null
	);
	const [reloadRequired, setReloadRequired] = useState(false);
	const [notificationCenter, setnotificationCenter] = useState<
		NotificationCenterElement[]
	>([]);

	const [devices, setDevices] = useState<DMXProjectDevice[]>([]);
	var autosaveInterval: any;
	var notificationcenterInterval: any;

	useEffect(() => {
		if (
			GlobalInterfaceServer === null ||
			GlobalInterfaceServer.interfaceId === undefined ||
			GlobalProjectManager === null ||
			GlobalProjectManager.currentProject === undefined
		) {
			router.push('/');
			return;
		}
		setDevices(GlobalProjectManager.currentProject.devices);
		GlobalInterfaceServer.closeCallback = webSocketDidClose;
		if (GlobalInterfaceServer.websocket === undefined) {
			GlobalInterfaceServer.openCallback = function () {
				initialDMXSetup();
			};
			GlobalInterfaceServer.configureWebsocket();
		} else {
			if (
				GlobalInterfaceServer.websocket.readyState ==
				GlobalInterfaceServer.websocket.OPEN
			) {
				initialDMXSetup();
			}
		}

		clearInterval(autosaveInterval);
		clearInterval(notificationcenterInterval);

		autosaveInterval = setInterval(() => {
			saveProject();
		}, 20000);

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

	function webSocketDidClose() {
		console.log('connection closed');
		setReloadRequired(true);
	}

	function initialDMXSetup() {
		console.log(GlobalProjectManager!.currentProject!.devices);
		for (var device of GlobalProjectManager!.currentProject!.devices) {
			console.log(device.channel_state);
			for (
				var i = 0;
				i <
				(device.device as DeviceDefinition).modes[device.mode].channel_count;
				i++
			) {
				// @ts-ignore
				GlobalInterfaceServer.sendDMXCommand(
					(device.start_channel + i).toString(),
					device.channel_state
						.filter((e) => e.channel == i + 1)[0]
						.value.toString()
				);
			}
		}
	}

	function sendDMXCommand(channel: string, value: number) {
		GlobalInterfaceServer?.sendDMXCommand(
			(selectedDevice!.start_channel - 1 + parseInt(channel)).toString(),
			value.toString()
		);

		const _selectedDevice = { ...selectedDevice };
		_selectedDevice!.channel_state!.filter(
			(e) => e.channel == parseInt(channel)
		)[0].value = value;

		//GlobalProjectManager!.currentProject!.devices.filter((e) => e.start_channel == selectedDevice?.start_channel)[0].channel_state.filter((e) => e.channel == parseInt(channel))[0].value = value;
		// @ts-ignore
		GlobalProjectManager!.currentProject!.devices.filter(
			(e) => e.start_channel == selectedDevice?.start_channel
		)[0] = _selectedDevice;

		// @ts-ignore
		setSelectedDevice(_selectedDevice);
	}

	function saveProject() {
		const notificationElement: NotificationCenterElement = {
			uid: uuidv4(),
			text: 'Saving project',
			status: NotificationCenterElementStatus.loading,
		};
		addElementToNotificationCenter(notificationElement);
		GlobalProjectManager?.saveCurrentProject()
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
	}
	return (
		<div className="overflow-hidden w-screen h-screen">
			{reloadRequired ? (
				<div className="w-screen h-screen bg-transparent z-20 absolute justify-center flex">
					<div className="self-center dark:text-white text-center">
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
						{notification.status === NotificationCenterElementStatus.loading ? (
							<div className="w-5 ml-4 mr-2">
								<LoadingSpinner color="#ffffff" size={'25'} />
							</div>
						) : (
							<div></div>
						)}
					</div>
				))}
			</div>
			<div
				className={`flex flex-col dark:bg-gray-900 bg-gray-100 h-screen w-screen overflow-hidden dark:text-white ${
					reloadRequired ? 'filter blur-md scale-105 transform' : ''
				}`}
			>
				<div className="flex dark:bg-gray-800 bg-gray-200 h-16  border-b-2 border-gray-300 dark:border-gray-800 justify-between shadow-lg rounded-xl m-2">
					<h1 className="self-center dark:text-white ml-4 text-2xl font-bold">
						{GlobalProjectManager?.currentProject?.name || 'DMX'}
					</h1>
					<div className="self-center mr-8 mt-1">
						<button
							onClick={() => {
								router.push('/projectmanagement/addDevice');
							}}
						>
							Add device
						</button>
						<button
							className="self-center transform scale-125"
							onClick={(_) => {
								saveProject();
							}}
						>
							<SaveDiskIcon />
						</button>
					</div>
				</div>
				<div id="canvas" className="flex flex-row w-full h-full relative">
					{selectedDevice != null ? (
						<DashboardSidebar
							selectedDevice={selectedDevice}
							setSelectedDevice={setSelectedDevice}
							sendDMXCommand={sendDMXCommand}
						/>
					) : (
						<div></div>
					)}
					<div id="device-canvas" className={styles.devicegrid}>
						{devices.map((e) => (
							<button
								key={e.start_channel}
								className="dark:text-white justify-self-center self-center"
								onClick={() => {
									setSelectedDevice(e);
								}}
							>
								<div>
									<p className="font-bold text-lg">{e.name}</p>
									<p className="text-gray-400 text-sm">
										({(e.device as DeviceDefinition).device_name})
									</p>
								</div>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
