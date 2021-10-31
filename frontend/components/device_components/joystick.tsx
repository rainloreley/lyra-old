import { FunctionComponent, useEffect, useState } from 'react';
import { DMXProjectDeviceChannelState } from '../../backend/ProjectManager';

import { Joystick } from 'react-joystick-component';
import Draggable from 'react-draggable';
interface Device_Joystick {
	valueupdate: (axis: Device_Joystick_Axis, value: number) => void;
	state: DMXProjectDeviceChannelState[];
	axis: any;
}

enum Device_Joystick_Axis {
	X,
	Y,
}

const DeviceJoystick: FunctionComponent<Device_Joystick> = ({
	valueupdate,
	state,
	axis,
}) => {
	const [xState, setXState] = useState(0);
	const [yState, setYState] = useState(0);
	const [ready, setReady] = useState(false);

	const _coordinateMax = 143;

	useEffect(() => {
		setXState(
			(state.filter((e) => e.channel === axis.x)[0].value / 255) *
				_coordinateMax
		);
		setYState(
			(state.filter((e) => e.channel === axis.y)[0].value / 255) *
				_coordinateMax
		);
		setReady(true);
		console.log(window);
	}, [state]);

	const sendDMXSignal = (x: number, y: number) => {
		let dmxX = (x / _coordinateMax) * 255;
		let dmxY = (y / _coordinateMax) * 255;

		if (dmxX > 255) dmxX = 255;
		if (dmxX < 0) dmxX = 0;

		if (dmxY > 255) dmxY = 255;
		if (dmxY < 0) dmxY = 0;

		valueupdate(Device_Joystick_Axis.X, dmxX);
		valueupdate(Device_Joystick_Axis.Y, dmxY);
	};
	return (
		<div className="w-40 h-40 relative">
			<div className="z-0 absolute w-full h-full">
				<div className="flex w-full h-full">
					{Array.apply(null, Array(18)).map((e, index, arr) => (
						<div
							className="h-full absolute bg-gray-400 dark:bg-gray-300"
							style={{
								left: `${
									100 * (index / (arr.length - 1)) -
									(index === arr.length - 1 ? 0.5 : 0)
								}%`,
								width: '1px',
							}}
						/>
					))}
				</div>
			</div>
			<div className="z-0 absolute w-full h-full">
				<div className="flex w-full h-full">
					{Array.apply(null, Array(18)).map((e, index, arr) => (
						<div
							className="w-full absolute bg-gray-400 dark:bg-gray-300"
							style={{
								top: `${100 * (index / (arr.length - 1))}%`,
								height: '1px',
							}}
						/>
					))}
				</div>
			</div>
			<div className="z-10 absolute w-full h-full">
				<Draggable
					axis="x"
					handle=".handle"
					defaultPosition={{ x: 0, y: 0 }}
					// @ts-ignore
					position={{ x: xState, y: yState }}
					grid={[2, 2]}
					bounds="parent"
					scale={1}
					onStart={(e, data) => {
						console.log(data);
					}}
					onDrag={(e, data) => {
						setXState(data.x);
						setYState(data.y);
						sendDMXSignal(data.x, data.y);
					}}
					onStop={(e, data) => {
						setXState(data.x);
						setYState(data.y);
						sendDMXSignal(data.x, data.y);
					}}
				>
					<div className="w-4 h-4">
						<div className="handle">
							<div className="w-4 h-4 rounded-full bg-red-600"></div>
						</div>
					</div>
				</Draggable>
			</div>
		</div>
	);
};

export default DeviceJoystick;
export { Device_Joystick_Axis };
/** 
 * 
 * 			<ReactNipple
				// supports all nipplejs options
				// see https://github.com/yoannmoinet/nipplejs#options
				options={{ mode: 'static', position: { top: '50%', left: '50%' } }}
				// any unknown props will be passed to the container element, e.g. 'title', 'style' etc
				style={{
					outline: `1px dashed red`,
					width: 150,
					height: 150,
					// if you pass position: 'relative', you don't need to import the stylesheet
				}}
				// all events supported by nipplejs are available as callbacks
				// see https://github.com/yoannmoinet/nipplejs#start
				onMove={(evt: any, data: any) => console.log(evt, data)}
			/>
*/
