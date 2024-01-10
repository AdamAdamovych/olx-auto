import * as fs from "fs-extra";

export class AppConfig {
    private readonly configPath = './config.json';
    private static configPromise: Promise<any>;
    constructor() {
        if(!AppConfig.configPromise) {
            AppConfig.configPromise = fs.readJSON(this.configPath);
        }
    }

    get config() {
        return AppConfig.configPromise;
    }
}