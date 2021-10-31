import { NextPage } from 'next';
import { useRouter } from 'next/dist/client/router';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GlobalProjectManager } from '..';
import {
	set as setCookie,
	get as getCookie,
	remove as removeCookie,
} from 'es-cookie';

const ProjectManagementNewPage: NextPage = () => {
	const router = useRouter();

	const [projectName, setProjectName] = useState('');
	const [error, setError] = useState('');
	const randomPlaceholders = [
		'Cool light stuff',
		'test1234',
		'pleasework',
		'copy of a copy of a copy',
		'the real project',
	];

	useEffect(() => {
		if (GlobalProjectManager === null) {
			router.push('/');
			router.reload();
		}
	}, []);

	const createProject = async () => {
		setError('');
		if (projectName.length < 1) {
			setError('Project name is required');
		}
		const newProject = GlobalProjectManager!.createEmptyProject(projectName);
		GlobalProjectManager!.currentProject = newProject;
		setCookie('project_id', newProject.uid, {
			sameSite: 'strict',
			expires: 365,
		});
		GlobalProjectManager!.saveCurrentProject().then(() => {
			router.push(
				'/projectmanagement/addDevice?skipAllowed=true&hideBackButton=true'
			);
			/*// TODO: push to device setup
			//router.push("/projectmanagement/devicesetup")
			router.push('/');*/
		});
	};

	return (
		<div className="flex justify-center dark:bg-gray-900 bg-gray-100 h-screen w-screen overflow-hidden text-center dark:text-white">
			<div className="self-center">
				<h1 className="text-3xl font-semibold">New Project</h1>
				<p className="my-1">Please enter a project name</p>
				<div>
					<input
						className="rounded-xl border-gray-300 border p-2 dark:text-white dark:bg-gray-700 dark:border-gray-600"
						placeholder={
							randomPlaceholders[
								Math.floor(Math.random() * randomPlaceholders.length)
							]
						}
						value={projectName}
						onChange={(e) => setProjectName(e.target.value)}
					/>
				</div>
				<button
					className="my-4 bg-blue-500 p-2 px-4 rounded-xl text-white"
					onClick={createProject}
				>
					Continue
				</button>
				{error !== '' ? <p className="text-red-500">{error}</p> : <div />}
			</div>
		</div>
	);
};

export default ProjectManagementNewPage;
