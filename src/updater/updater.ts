import decompress from "decompress";
import fetch from "node-fetch";
import Downloader from "nodejs-file-downloader";
import * as fs from 'fs-extra';
import * as path from 'path';

const packageUrl = 'https://raw.githubusercontent.com/AdamAdamovych/olx-auto/dev/package.json';
const releaseUrl = 'https://github.com/AdamAdamovych/olx-auto/releases/download/{{version}}/dist.zip';
const appPath = './app';
const tmpPath = './downloads';

const emptyConfig = {
    "MAPS": {
        "FUEL": {
            "DEFAULT": 6
        },
        "COLOR": {
        },
        "DRIVE": {
            "DEFAULT": 0
        },
        "BODY": {
            "DEFAULT": 8
        }
    }
};


(async () => {
    const packageJson = await (await fetch(packageUrl)).json();
    const version = packageJson.version;

    if (fs.existsSync(appPath)) {
        const localPackage = fs.readJSONSync(path.join(appPath, 'package.json'));
        if (localPackage.version === version) {
            console.log('You are up to date');
            return;
        }
    }

    const downloader = new Downloader({
        url: releaseUrl.replace('{{version}}', version),
        directory: tmpPath,
        maxAttempts: 3,
    });

    const report = await downloader.download();

    if (report.filePath) {
        const files = await decompress(report.filePath, tmpPath);

        if (!fs.existsSync(appPath)) {
            fs.ensureDirSync(appPath);
            fs.writeJSONSync(path.join(appPath, 'config.json'), emptyConfig);
        }

        await Promise.all(files.map(file => fs.copyFile(path.join(tmpPath, file.path), path.join(appPath, file.path))));
        fs.removeSync(tmpPath);
        console.log(`Updated to version ${version}`);
    }
})();
