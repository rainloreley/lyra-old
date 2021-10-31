interface DeviceDefinition {
	vendor: string;
	device_name: string;
	author: string;
	manual: string;
	uuid: string;
	modes: DeviceDefinitionMode[];
}

interface DeviceDefinitionMode {
	id: number;
	name: string;
	channel_count: number;
	channels: DeviceDefinitionModeChannel[];
	ui_channels: DeviceDefinitionModeUIChannel[];
}

interface DeviceDefinitionModeChannel {
	channel: number;
	name: string;
}

interface DeviceDefinitionModeUIChannel {
	channel: string;
	name: string;
	type: DeviceDefinitionModeUIChannelType;
	config: DeviceDefinitionModeUIChannelConfig;
}

interface DeviceDefinitionModeUIChannelConfig {
	joystick_axis?: DDMUICCJoystickAxis;
	colorwheel_subsets?: DDMUICCColorWheelSubset[];
	slider_settings?: DDMUICCSliderSettings;
	dropdown_options?: DDMUICCDropdownOption[];
	button_settings?: DDMUICCButtonSettings;
}

interface DDMUICCJoystickAxis {
	x: number;
	y: number;
}

interface DDMUICCColorWheelSubset {
	value: string;
	name: string;
	display_hex: string[];
	type: DDMUICCColorWheelSubsetType;
	slider_settings?: DDMUICCSliderSettings;
}

enum DDMUICCColorWheelSubsetType {
	static,
	slider,
}

interface DDMUICCSliderSettings {
	name?: string;
	start: number;
	end: number;
}

interface DDMUICCButtonSettings {
	text: string;
	is_dangerous: boolean;
	send_value: number;
	reset_value?: number;
	special_function?: DDMUICCButtonSettingsSpecialFunction;
}

enum DDMUICCButtonSettingsSpecialFunction {
	reset_all_values,
}

enum DeviceDefinitionModeUIChannelType {
	joystick = 'joystick',
	colorwheel = 'color-wheel',
	dropdown = 'dropdown',
	slider = 'slider',
	button = 'button',
}

interface DDMUICCDropdownOption {
	value: string;
	name: string;
	type: DDMUICCDropdownOptionType;
	slider_settings?: DDMUICCSliderSettings;
}

enum DDMUICCDropdownOptionType {
	static,
	slider,
}

export type {
	DeviceDefinition,
	DeviceDefinitionMode,
	DeviceDefinitionModeChannel,
	DeviceDefinitionModeUIChannel,
	DeviceDefinitionModeUIChannelConfig,
	DDMUICCJoystickAxis,
	DDMUICCColorWheelSubset,
	DDMUICCSliderSettings,
	DDMUICCDropdownOption,
	DDMUICCButtonSettings,
};

export {
	DDMUICCColorWheelSubsetType,
	DeviceDefinitionModeUIChannelType,
	DDMUICCDropdownOptionType,
	DDMUICCButtonSettingsSpecialFunction,
};
