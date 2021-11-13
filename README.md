# Lyra

Open-Source DMX control software running in the browser.

**This software is in development and probably won't work properly yet**

## Installation

<span style="color:red">🚨 **The build script currently doesn't work due to a new Lyra backend.** 🚨</span>

Currently, you need to compile the project by yourself. In the future, a ready-to-use zip file will be available.
Supported operating systems: macOS, Linux

Dependencies:

- Swift 5.3+
- Node 16.x.x
- NPM

### Installation steps:

1. Install Yarn (if not already installed):
   `npm i -g yarn`

2. Install Google zx in the projects' root directory
   `npm i zx`

3. Run the install script
   `chmod +x build_lyra.mjs && ./build_lyra.mjs`

4. Copy the .zip file inside `.build` to another location

5. Unzip the file

6. Run `lyra`

## Currently supported devices

1. The project uses the FX5 DMX interface library and therefore requires a FX5 DMX interface.

2. There are not many DMX lights available yet. More will be added in the future.

## License

The project is licensed under the [MIT license](LICENSE)
