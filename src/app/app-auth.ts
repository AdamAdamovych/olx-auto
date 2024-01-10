import { AppBrowser } from "./app-browser";
import { By, IWebDriverCookie, until } from 'selenium-webdriver';
import { Config } from './config';

export interface AuthData {
    cookies: IWebDriverCookie[];
    ls: any;
}

export class AppAuth {
    private config: Promise<any>

    constructor(private browser: AppBrowser) {
        this.config = new Config().config;
    }

    async authorize() {
        await this.browser.goto('https://www.olx.ua/uk/adding/');
        await this.browser.driver.wait(until.elementLocated(By.css('input[name=username],textarea[data-cy="posting-title"]')));
    }
}