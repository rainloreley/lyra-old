import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Dashboard.module.css';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/dist/client/router';
import ProjectManager, {
	DMXProjectDevice,
	DMXProjectDeviceChannelState,
} from '../backend/ProjectManager';
import DashboardSidebar from '../components/dashboard_sidebar';
import { DeviceDefinition } from '../devices/device_definitions';
import { AppControlContext } from '../components/appControlHandler';
import {ipcRenderer} from "electron";
import SceneListSidebar from "../components/sceneList_sidebar";

const Dashboard: NextPage = () => {
	const router = useRouter();

	const [selectedDevice, setSelectedDevice] = useState<DMXProjectDevice | null>(
		null
	);
	const [showSceneList, setShowSceneList] = useState(false);

	const [reloadRequired, setReloadRequired] = useState(false);


	const [devices, setDevices] = useState<DMXProjectDevice[]>([]);

	const {
		GlobalInterfaceServer,
		GlobalProjectManager,
		initialDMXSetup,
		app_initialConfigOver,
		setApp_initialConfigOver,
	} = useContext(AppControlContext);

	useEffect(() => {
		if (
			GlobalInterfaceServer === null ||
			GlobalInterfaceServer.interfaceId === undefined ||
			GlobalProjectManager === null ||
			GlobalProjectManager.currentProject === undefined
		) {
			//router.push('/');
			return;
		}
		setDevices(GlobalProjectManager.currentProject.devices);
		ipcRenderer.on('dashboard-show-scene-list', function (e, f) {
			setShowSceneList(true);
		});
	}, []);

	useEffect(() => {
		if (
			GlobalInterfaceServer !== null &&
			GlobalInterfaceServer.websocket !== undefined &&
			GlobalInterfaceServer.websocket.readyState === 1 &&
			!app_initialConfigOver
		) {
			initialDMXSetup();
			setApp_initialConfigOver(true);
		}
	}, [GlobalInterfaceServer?.websocket]);

	function saveProject() {}
	return (
		<div className="overflow-hidden w-screen text-black h-screen">
			<Head>
				<title>Dashboard • Lyra</title>
			</Head>
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
			<div />
			<div
				className={`flex flex-col dark:bg-gray-900 bg-gray-100 h-screen w-screen overflow-hidden dark:text-white ${
					reloadRequired ? 'filter blur-md scale-105 transform' : ''
				}`}
			>
				<div className="flex dark:bg-gray-800 bg-gray-200 h-16  border-b-2 border-gray-300 dark:border-gray-800 justify-between shadow-lg rounded-xl m-2">
					<h1 className="self-center dark:text-white ml-4 text-2xl font-bold">
						{GlobalProjectManager?.currentProject?.name || 'DMX'}
					</h1>
				</div>
				<div id="canvas" className="flex flex-row w-full h-full relative">
					{selectedDevice != null ? (
						<DashboardSidebar
							selectedDevice={selectedDevice}
							setSelectedDevice={setSelectedDevice}
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
					{showSceneList ? (
						<SceneListSidebar hideView={() => {
							setShowSceneList(false);
						}} />
					) : (
						<div />
					)}
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
