#!/usr/bin/env zx

import { exit } from 'process';
import { $, cd, nothrow, os } from 'zx';

const echo = (message) => {
	console.log(message);
};

echo("======");
echo("This script currently doesn't work due to a new Lyra backend. I'll fix it in the future.");
echo("======");
exit(0);
$.verbose = false;

const ls = await $`ls`;

if (!ls.stdout.includes('build_lyra.mjs')) {
	echo('Incorrect folder. Exiting.');
	exit(1);
}

echo(__dirname);
nothrow(await $`rm -rf .build`);
nothrow(await $`rm -rf ./client/backend_bundle`);

await $`mkdir .build`;
await $`mkdir ./client/backend_bundle`;
await $`mkdir .build/lyra`;
cd('backend');
$.verbose = true;
if (os.platform() === 'darwin') {
	await $`swift build -c release`;
} else if (os.platform() === 'linux') {
	await $`swift build --enable-test-discovery -Xlinker -ludev -c release`;
} else {
	await echo('Platform not supported. Exiting.');
	exit(1);
}

await $`cp .build/release/Run ../client/backend_bundle/lyra`;

cd('client');
await $`yarn`;
await $`yarn build`;
/*await $`yarn export`;
await $`mkdir ../.build/lyra/lyra-frontend`;
await $`cp -r out/* ../.build/lyra/lyra-frontend`;
cd('.build');
await $`zip -r lyra-${os.platform()}.zip lyra/`;*/
echo('Done!');
exit(0);
