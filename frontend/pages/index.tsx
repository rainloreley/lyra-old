import type { NextPage } from 'next';
import { useRouter } from 'next/dist/client/router';
import { useEffect, useState } from 'react';
import InterfaceServer from '../backend/InterfaceServer';
import {
	set as setCookie,
	get as getCookie,
	remove as removeCookie,
} from 'es-cookie';
import ProjectManager, {
	DMXProjectAPIError,
	ProjectListItem,
} from '../backend/ProjectManager';
import moment from 'moment';

var GlobalInterfaceServer: InterfaceServer | null = null;
var GlobalProjectManager: ProjectManager | null = null;

const Home: NextPage = () => {
	const router = useRouter();
	const [availableInterfaces, setAvailableInterfaces] = useState<
		string[] | null
	>(null);
	const [availableProjects, setAvailableProjects] = useState<
		ProjectListItem[] | null
	>(null);

	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!router.isReady) return;
		initLoading();
	}, [router.isReady]);

	async function initLoading() {
		await loadProjects();
	}

	async function loadProjects() {
		GlobalProjectManager = new ProjectManager();
		const savedProject = getCookie('project_id');
		if (savedProject !== undefined) {
			GlobalProjectManager.loadProject(savedProject)
				.then((_) => {
					loadInterfaces();
				})
				.catch(async (err) => {
					console.log(typeof err.code);
					if (err.code === 101) {
						// project doesn't exist
						removeCookie('project_id');
						await fetchProjectList();
						return;
					} else {
						setError(err.message || err.toString());
						return;
					}
				});
		} else {
			await fetchProjectList();
			return;
		}
	}

	async function fetchProjectList() {
		GlobalProjectManager?.fetchProjectList()
			.then((response) => {
				setAvailableProjects(response);
			})
			.catch((err) => {
				setError(err.message || err.toString());
			});
	}

	async function loadInterfaces() {
		GlobalInterfaceServer = new InterfaceServer();
		GlobalInterfaceServer.getAvailableInterfaces()
			.then((response: string[]) => {
				if (GlobalInterfaceServer?.interfaceId !== undefined) {
					const returnto = router.query.returnto;
					if (typeof returnto === 'string') {
						router.push(returnto);
					} else {
						router.push('/dashboard');
					}
				} else {
					setAvailableInterfaces(response);
				}
			})
			.catch((err) => {
				setError(err.message || err.toString());
			});
	}

	return (
		<div className="flex justify-center bg-gray-100 dark:bg-gray-900 h-screen w-screen overflow-hidden dark:text-white">
			{error !== null ? (
				<div className="w-screen h-screen bg-transparent z-20 absolute justify-center flex">
					<div className="self-center dark:text-white text-center">
						<p className="text-3xl font-bold">An error occurred.</p>
						<p>Something bad happened. I'm sure we can fix that though!</p>
						<p className="italic text-red-500">{error}</p>
						<button
							className="bg-blue-500 rounded-xl p-2 mt-4 px-6 text-white hover:bg-blue-600"
							onClick={() => {
								router.reload();
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
				className={`flex ${
					error !== null ? 'filter blur scale-105 transform' : ''
				}`}
			>
				{availableInterfaces === null &&
				availableProjects === null &&
				error === null ? (
					<p className="align-middle self-center text-3xl font-bold">
						Loading...
					</p>
				) : (
					<div className="self-center align-middle">
						{availableProjects !== null ? (
							<div className="self-center align-middle">
								{availableProjects.length > 0 ? (
									<div className="self-center align-middle">
										<h1 className="text-2xl font-bold my-2">
											Please select a project
										</h1>
										<ul className="flex flex-col">
											{availableProjects.map((project) => (
												<button
													key={project.uid}
													className="rounded-lg text-white bg-blue-500 p-2 m-2"
													onClick={async (_) => {
														setCookie('project_id', project.uid, {
															sameSite: 'strict',
															expires: 365,
														});
														setAvailableProjects(null);
														await GlobalProjectManager?.loadProject(
															project.uid
														);
														loadInterfaces();
													}}
												>
													<div>
														<p className="text-xl font-bold">{project.name}</p>
														<p>
															{moment(project.last_modified).format(
																'DD.MM.YYYY HH:mm'
															)}
														</p>
													</div>
												</button>
											))}
										</ul>
										<button
											className="m-4 p-2 px-4 text-white bg-blue-500 rounded-xl hover:bg-blue-400"
											onClick={() => {
												router.push('/projectmanagement/new');
											}}
										>
											Create new project
										</button>
									</div>
								) : (
									// TODO add a button to create a new project
									<div className=" text-center justify-center">
										<p>No projects found.</p>
										<button
											className="m-4 p-2 px-4 text-white bg-blue-500 rounded-xl hover:bg-blue-400"
											onClick={() => {
												router.push('/projectmanagement/new');
											}}
										>
											Create new project
										</button>
									</div>
								)}
							</div>
						) : (
							<div></div>
						)}
						{availableInterfaces != null ? (
							<div className="self-center align-middle">
								{availableInterfaces.length > 0 ? (
									<div className="self-center align-middle">
										<h1 className="text-2xl font-bold my-2">
											Please select an interface
										</h1>
										<ul>
											{availableInterfaces.map((e) => (
												<button
													key={e}
													className="rounded-lg bg-blue-500 p-2 m-2"
													onClick={(_) => {
														GlobalInterfaceServer?.setInterfaceId(e);
														GlobalInterfaceServer?.configureWebsocket();
														router.push('/dashboard');
													}}
												>
													{e}
												</button>
											))}
										</ul>
									</div>
								) : (
									<p>
										No available interface found. Please make sure an interface
										is connected to {GlobalInterfaceServer?.domain}
									</p>
								)}
							</div>
						) : (
							<div></div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export { GlobalInterfaceServer, GlobalProjectManager };
export default Home;
