import { useRouter } from 'next/dist/client/router';
import { FunctionComponent } from 'react';
import {
	DMXProjectDevice,
	DMXProjectDeviceChannelState,
} from '../backend/ProjectManager';
import {
	DDMUICCButtonSettingsSpecialFunction,
	DeviceDefinition,
	DeviceDefinitionMode,
	DeviceDefinitionModeUIChannel,
} from '../devices/device_definitions';
import { GlobalProjectManager } from '../pages';
import DeviceButton from './device_components/button';
import DeviceColorWheel from './device_components/colorwheel';
import DeviceDropdown from './device_components/dropdown';
import DeviceJoystick, {
	Device_Joystick_Axis,
} from './device_components/joystick';
import DeviceSlider from './device_components/slider';
import SettingsIcon from './icons/settings';

interface Dashboard_Sidebar {
	selectedDevice: DMXProjectDevice;
	setSelectedDevice: (device: DMXProjectDevice | null) => void;
	sendDMXCommand: (channel: string, value: number) => void;
}

const DashboardSidebar: FunctionComponent<Dashboard_Sidebar> = ({
	selectedDevice,
	setSelectedDevice,
	sendDMXCommand,
}) => {
	const router = useRouter();

	return (
		<div className="pb-4 left-4 absolute bottom-4 top-4 flex">
			<div className="dark:bg-gray-800 bg-gray-200 p-4 shadow-2xl rounded-2xl flex flex-col w-80 bottom-4">
				<div className="flex justify-between">
					<div className="flex">
						<h1 className="font-bold dark:text-white text-xl">
							{selectedDevice.name}
						</h1>
						<button
							className="w-4 ml-2 flex"
							onClick={(e) => {
								router.push(`/projectmanagement/device/${selectedDevice.id}`);
							}}
						>
							<SettingsIcon />
						</button>
					</div>

					<button
						className="dark:bg-gray-400 bg-gray-300 rounded-full w-6 h-6"
						onClick={() => {
							setSelectedDevice(null);
						}}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-6 flex-no-shrink fill-current"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="gray"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>
				<p className="dark:text-gray-400 text-gray-500 text-sm mb-2">
					{
						(selectedDevice.device as DeviceDefinition).modes.filter(
							(e: any) => e.id == selectedDevice.mode
						)[0].name
					}{' '}
					|| Channel {selectedDevice.start_channel}
				</p>

				<ul className="overflow-y-scroll noscrollbar h-full">
					{(selectedDevice.device as DeviceDefinition).modes
						.filter((e: any) => e.id == selectedDevice.mode)[0]
						.ui_channels.map((channel: DeviceDefinitionModeUIChannel) => (
							<div key={channel.channel} className="mt-2">
								<h2 className="text-lg font-semibold">{channel.name}</h2>
								<div className="mt-2">
									{
										// @ts-ignore
										{
											dropdown: (
												<DeviceDropdown
													options={channel.config.dropdown_options}
													valueupdate={(value: number) => {
														sendDMXCommand(channel.channel, value);
													}}
													state={
														selectedDevice.channel_state.filter(
															(e: DMXProjectDeviceChannelState) =>
																e.channel == parseInt(channel.channel)
														)[0].value
													}
												/>
											),

											slider: (
												<DeviceSlider
													slider_settings={channel.config.slider_settings!}
													valueupdate={(value: number) => {
														sendDMXCommand(channel.channel, value);
													}}
													state={
														selectedDevice.channel_state.filter(
															(e: DMXProjectDeviceChannelState) =>
																e.channel == parseInt(channel.channel)
														)[0].value
													}
												/>
											),
											'color-wheel': (
												<DeviceColorWheel
													subsets={channel.config.colorwheel_subsets!}
													valueupdate={(value: number) => {
														sendDMXCommand(channel.channel, value);
													}}
													state={
														selectedDevice.channel_state.filter(
															(e: DMXProjectDeviceChannelState) =>
																e.channel == parseInt(channel.channel)
														)[0].value
													}
												/>
											),
											joystick: (
												<div>
													<DeviceJoystick
														valueupdate={(
															axis: Device_Joystick_Axis,
															value: number
														) => {
															const dmxChannelX: number =
																channel.config.joystick_axis!.x;
															const dmxChannelY: number =
																channel.config.joystick_axis!.y;

															sendDMXCommand(
																axis == Device_Joystick_Axis.X
																	? dmxChannelX.toString()
																	: dmxChannelY.toString(),
																value
															);
														}}
														state={selectedDevice.channel_state}
														axis={channel.config.joystick_axis!}
													/>
												</div>
											),
											button: (
												<DeviceButton
													button_settings={channel.config.button_settings!}
													valueupdate={(value: number) => {
														sendDMXCommand(channel.channel, value);
													}}
													post_function={() => {
														switch (
															channel.config.button_settings!.special_function
														) {
															case DDMUICCButtonSettingsSpecialFunction.reset_all_values:
																(
																	(
																		selectedDevice.device as DeviceDefinition
																	).modes.filter(
																		(e: any) => e.id == selectedDevice.mode
																	)[0] as DeviceDefinitionMode
																).channels.forEach((e) => {
																	sendDMXCommand(e.channel.toString(), 0);
																});
																GlobalProjectManager?.currentProject?.devices
																	.find(
																		(e) =>
																			e.start_channel ===
																			selectedDevice.start_channel
																	)
																	?.channel_state.forEach((e) => {
																		e.value = 0;
																	});
														}
													}}
												/>
											),
										}[channel.type] || <div>{channel.type}</div>
									}
								</div>
							</div>
						))}
				</ul>
			</div>
		</div>
	);
};

export default DashboardSidebar;
