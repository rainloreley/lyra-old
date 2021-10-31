import axios from 'axios';
import dmxDevices from '../devices/devicelist';
import { v4 as uuidv4 } from 'uuid';
import { DeviceDefinition } from '../devices/device_definitions';

const apiErrors = {
	'100': 'missing parameter',
	'101': "Project file doesn't exist",
	'102': 'failed to read data',
	'103': "main database doesn't exist",
	'104': "file name and uid aren't the same",
	'105': 'failed to write data',
};

class ProjectManager {
	domain: string;
	httpProtocol: string;
	currentProject?: DMXProject;

	constructor() {
		this.domain = '127.0.0.1:8080';
		this.httpProtocol = 'http';
	}

	startAutosave() {
		setInterval(() => {
			this.saveCurrentProject();
		}, 20000);
	}

	// fetch all projects from the server
	async fetchProjectList() {
		return new Promise<ProjectListItem[]>((resolve, reject) => {
			axios
				.get<string>(this.httpProtocol + '://' + this.domain + '/projects')
				.then((response) => {
					const _error = this._errorCheck(response.data);
					if (_error != null) {
						reject(_error);
						return;
					}
					try {
						/*console.log(response.data)
                    const json = JSON.parse(response.data);*/
						const json = JSON.parse(JSON.stringify(response.data));
						const projectArray: ProjectListItem[] = json.map((item: any) => {
							var obj: ProjectListItem = {
								name: item.name,
								uid: item.uid,
								last_modified: item.last_modified,
							};
							return obj;
						});
						resolve(projectArray);
					} catch {
						reject('Failed to parse data');
					}
				})
				.catch((err) => {
					reject(err);
				});
		});
	}

	async loadProject(uid: string) {
		return new Promise<DMXProject>((resolve, reject) => {
			axios
				.get<string>(
					this.httpProtocol + '://' + this.domain + '/projects/' + uid
				)
				.then((response) => {
					const _error = this._errorCheck(response.data);
					if (_error != null) {
						reject(_error);
						return;
					}
					try {
						const json = JSON.parse(JSON.stringify(response.data));
						console.log(json);
						this.currentProject = new DMXProject(json);
						resolve(this.currentProject);
					} catch {
						reject('Failed to parse data');
					}
				})
				.catch((err) => {
					reject(err);
				});
		});
	}

	async saveProject(project: DMXProject) {
		project.devices.forEach((device) => {
			if (typeof device.device !== 'string') {
				const devicecopy = { ...device.device };
				device.device = devicecopy.uuid;
			}
		});
		project.last_modified = Date.now();
		return new Promise<string>((resolve, reject) => {
			axios
				.post<string>(
					this.httpProtocol + '://' + this.domain + '/projects/' + project.uid,
					project
				)
				.then((response) => {
					const _error = this._errorCheck(response.data);
					if (_error != null) {
						reject(_error);
						return;
					}
					resolve(response.data);
				})
				.catch((err) => {
					reject(err);
				});
		});
	}

	async saveCurrentProject() {
		return new Promise<string>((resolve, reject) => {
			if (this.currentProject !== undefined) {
				var _projectcopy = new DMXProject(this.currentProject, false);
				this.saveProject(_projectcopy)
					.then((response) => {
						resolve(response);
					})
					.catch((err) => {
						reject(err);
					});
			} else {
				reject('No project loaded');
			}
		});
	}

	createEmptyProject(name: string): DMXProject {
		return new DMXProject({
			uid: uuidv4(),
			name: name,
			last_modified: Date.now(),
			devices: [],
		});
	}

	_errorCheck(response: string): DMXProjectAPIError | null {
		if (apiErrors.hasOwnProperty(response)) {
			return {
				code: response,
				// @ts-ignore
				message: apiErrors[response],
			};
		} else {
			return null;
		}
	}
}

interface DMXProjectAPIError {
	code: string;
	message: string;
}

interface ProjectListItem {
	name: string;
	uid: string;
	last_modified: number;
}

class DMXProject {
	name: string;
	uid: string;
	last_modified: number;
	devices: DMXProjectDevice[];

	constructor(json: any, replaceUUID: boolean = true) {
		this.name = json.name;
		this.uid = json.uid;
		this.last_modified = json.last_modified;
		this.devices = json.devices.map((item: DMXProjectDevice) => {
			console.log(item.device);
			var obj: DMXProjectDevice = {
				id: item.id,
				name: item.name,
				device: replaceUUID
					? dmxDevices.filter((e) => e.uuid === item.device)[0]
					: item.device,
				mode: item.mode,
				start_channel: item.start_channel,
				channel_state: item.channel_state.map(
					(channel: DMXProjectDeviceChannelState) => {
						var obj: DMXProjectDeviceChannelState = {
							channel: channel.channel,
							value: channel.value,
						};
						return obj;
					}
				),
			};
			return obj;
		});
	}
}

interface DMXProjectDevice {
	id: string;
	name: string;
	device: DeviceDefinition | string;
	start_channel: number;
	mode: number;
	channel_state: DMXProjectDeviceChannelState[];
}

interface DMXProjectDeviceChannelState {
	channel: number;
	value: number;
}

export default ProjectManager;
export type {
	DMXProjectAPIError,
	ProjectListItem,
	DMXProjectDevice,
	DMXProjectDeviceChannelState,
};
