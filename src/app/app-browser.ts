import { Builder, WebDriver } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome";
import { AppConfig } from "./app-config";

export class AppBrowser {
    private static _driver: WebDriver;
    private static initPromise: Promise<boolean> | null;
    private config: AppConfig;

    get driver() {
        return AppBrowser._driver;
    }

    constructor() {
        this.config = new AppConfig();
        this.open();
    }

    static async prepare(cfg: any) {
        const options = new Options();

        const path = (await cfg).user_path;
        
        if(process.platform === 'win32') {
            options.addArguments(`user-data-dir=${path || 'C:/selenium'}`);
        } else {
            options.addArguments(`user-data-dir= ${path || '~/Library/Application Support/Google/Chrome/Selenium'}`);
        }
        const version = (await cfg).chrome_version;
        if(version) {
            options.setBrowserVersion(version);
        }
        
        options.addArguments('--no-sandbox');
        this._driver = await new Builder().setChromeOptions(options).forBrowser('chrome').build();
        return true;
    }

    open() {
        if(!AppBrowser.initPromise) {
            AppBrowser.initPromise = this.config.config.then(cfg => AppBrowser.prepare(cfg));
        }
    }

    async goto(url: string) {
        await this.waitUntilInit();
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