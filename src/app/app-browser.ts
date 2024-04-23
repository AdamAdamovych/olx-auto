import { Browser, Builder, WebDriver, logging } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome";
import os from 'os'
import * as path from 'path';
import { Level } from "selenium-webdriver/lib/logging";

export class AppBrowser {
    private static _driver: WebDriver;
    private static initPromise: Promise<boolean> | null;

    get driver() {
        return AppBrowser._driver;
    }

    constructor() {
        this.open();
    }

    static async prepare() {
        console.log('Preparing browser instance...');
        const options = new Options();

        const tmppath = path.join(os.tmpdir(), 'olx_selenium_data');
        console.log('Created profile in ', tmppath);

        options.addArguments(`user-data-dir=${tmppath}`, '--no-sandbox');

        console.log('Building browser instance...');
        try {
            const builder = new Builder();
            this._driver = await builder
                .setChromeOptions(options)
                .forBrowser(Browser.CHROME, '120.0.6099.199')
                .build();

            console.log('Built is ok');
            return true;
        } catch (err) {
            console.error(err);
        }

        return false;
    }

    open() {
        if (!AppBrowser.initPromise) {
            AppBrowser.initPromise = AppBrowser.prepare();
        }
    }

    async goto(url: string) {
        console.log('Waiting for browser');
        await this.waitUntilInit();

        console.log('Go to link');
        await this.driver.get(url);
    }

    async close() {
        await this.waitUntilInit();
        await this.driver.quit();
        AppBrowser.initPromise = null;
    }

    private async waitUntilInit() {
        return await AppBrowser.initPromise;
    }
}

/*
options = Options()
options.headless = True
options.add_argument("start-maximized")
#options.add_experimental_option("detach", True)
options.add_argument("--no-sandbox")
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option('excludeSwitches', ['enable-logging'])
options.add_experimental_option('useAutomationExtension', False)
options.add_argument('--disable-blink-features=AutomationControlled')
webdriver_service = Service("./chromedriver") #Your chromedriver path
driver = webdriver.Chrome(service=webdriver_service,options=options)
url = 'https://soundcloud.com/daydoseofhouse/snt-whats-wrong/s-jmbaiBDyQ0d?si=233b2f843a2c4a7c8afd6b9161369717&utm%5C_source=clipboard&utm%5C_medium=text&utm%5C_campaign=social%5C_sharing'
driver.get(url)
*/