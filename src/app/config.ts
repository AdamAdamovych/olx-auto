import * as fs from "fs-extra";

export class Config {
    private readonly configPath = './config.json';
    private static configPromise: Promise<any>;
    constructor() {
        if(!Config.configPromise) {
            Config.configPromise = fs.readJSON(this.configPath);
        }
    }

    get config() {
        return Config.configPromise;
    }
}