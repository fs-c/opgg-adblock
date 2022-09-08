#!/usr/bin/env node

import path from 'node:path';
import * as asar from 'asar';
import * as fs from 'node:fs/promises';

const searchOpgg = async () => {
    const usersPath = 'C:\\Users\\';
    const usersContent = await fs.readdir(usersPath);

    for (const userFolder of usersContent) {
        const opggPath = path.join(usersPath, userFolder, 'AppData\\Local\\Programs\\OP.GG\\');

        try {
            await fs.stat(opggPath);

            return opggPath
        } catch (_) {}
    }
};

const patch = async (unpackedPath) => {
    const reactPath = path.join(unpackedPath, '\\assets\\react\\');

    const rendererFile = (await fs.readdir(reactPath))
        .filter((e) => e.startsWith('renderer') && e.endsWith('.js'))[0];
    const rendererPath = path.join(reactPath, rendererFile);

    let renderer = await fs.readFile(rendererPath, { encoding: 'utf8' });

    renderer = renderer.replace(/Terms of Use/g, 'T3rms 0f Us3'); // :)

    // these are the strings used in renderer/utils/ads*.js
    // a more robust solution would be to look for the exports themselves and replace those
    renderer = renderer.replace(/\["NA","KR"\]/g, '[]');
    renderer = renderer.replace(/\["NA"\]/g, '[]');
    renderer = renderer.replace(/\["KR"\]/g, '[]');
    renderer = renderer.replace(/\["EUW","BR","LAN","LA1","LAS","LA2","EUNE","JP","OCE","OC1","TR","RU","TENCENT","TW","VN","SG","PH","TH","ID"\]/g, "[]");

    await fs.writeFile(rendererPath, renderer);
};

const opggPath = process.argv[3] || await searchOpgg();
const asarPath = path.join(opggPath, 'resources\\app.asar');
console.log('found asar "%s"', asarPath);

const extractionPath = await fs.mkdtemp('opggadblock-');

await asar.extractAll(asarPath, extractionPath);
await patch(extractionPath);
await asar.createPackage(extractionPath, asarPath);

console.log('patched');

await fs.rm(extractionPath, { recursive: true });

console.log('done');
