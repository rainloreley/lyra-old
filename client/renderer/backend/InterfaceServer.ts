import axios from 'axios';
import {
	set as setCookie,
	get as getCookie,
	remove as removeCookie,
} from 'es-cookie';
import { w3cwebsocket } from 'websocket';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';

class InterfaceServer {
	domain: string;
	availableInterfaces: string[];
	connected: boolean;
	interfaceId?: string;
	_httpProtocol: string;
	uid: string;
	_httpPort: string;
	_wsPort: string;

	openCallback: () => void;
	closeCallback: () => void;

	websocket?: any;

	constructor() {
		this.uid = uuidv4();
		this._httpPort = '3832';
		this._wsPort = '3832';
		this.domain = '127.0.0.1';
		this.availableInterfaces = [];
		this.connected = false;
		this._httpProtocol = 'http';
		this.openCallback = function () {};
		this.closeCallback = function () {};
	}

	setInterfaceId(id: string) {
		setCookie('interface_id', id, { sameSite: 'strict', expires: 365 });
		this.interfaceId = id;
	}

	async configureWebsocket() {
		this.websocket = io(`ws://${this.domain}:${this._wsPort}`);

		this.websocket.on('connect', () => {
			this.websocket!.emit('open_interface', { interface: this.interfaceId! });
			this.openCallback();
		});
		this.websocket.on('disconnect', this.closeCallback);

		this.websocket.on('interface_message', function (data) {
			console.log(data);
		});

		/*this.websocket = new w3cwebsocket(
			`ws://${this.domain}:${this._wsPort}/interface`
			//'echo-protocol'
		);
		this.websocket.onopen = this.openCallback;
		this.websocket.onerror = function (err) {
			console.log(err);
		};
		this.websocket.onclose = this.closeCallback;
		this.websocket.onmessage = function (message) {
			console.log(message);
		};*/
	}

	async sendDMXCommand(address: number, value: number) {
		return new Promise((accept, reject) => {
			const data = {
				address: address,
				value: parseInt(value.toFixed(0)),
				interface: this.interfaceId!,
			};
			if (this.websocket !== undefined) {
				//this.websocket?.send(JSON.stringify(data));
				this.websocket.emit('interface_message', data);
				accept('');
			} else {
				reject('');
			}
		});
	}

	async getAvailableInterfaces() {
		return new Promise<string[]>((accept, reject) => {
			axios
				.get<string[]>(
					`${this._httpProtocol}://${this.domain}:${this._httpPort}/interfaces/find`
				)
				.then((response) => {
					let savedInterface = getCookie('interface_id') ?? '';
					const data: string[] = response.data['interfaces'];
					if (data.includes(savedInterface)) {
						this.interfaceId = savedInterface;
					} else {
						removeCookie('interface_id');
					}
					accept(data);
				})
				.catch((err) => {
					reject(err);
				});
		});
	}
}

export default InterfaceServer;
