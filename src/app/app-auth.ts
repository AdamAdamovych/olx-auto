import { AppBrowser } from "./app-browser";
import { By, until } from 'selenium-webdriver';

export interface AuthData {
    cookies: any[];
    ls: any;
}

export class AppAuth {

    constructor(private browser: AppBrowser) {
    }

    async authorize() {
        await this.browser.goto('https://www.olx.ua/uk/adding/');
        await this.browser.driver.wait(until.elementLocated(By.css('input[name=username],textarea[data-cy="posting-title"]')));
    }
}