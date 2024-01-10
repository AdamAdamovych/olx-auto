import { By, WebElement, until } from "selenium-webdriver";
import { AppBrowser } from "./app-browser";
import { extractNumber } from "./utils";

export interface AutohelperData {
    avgPrice: number | null;
}
export class Autohelper {
    private readonly extSrc = `https://autohelperbot.com/js/copart_extension.js`
    private readonly avgLabel = 'Average price:';

    async getData(browser: AppBrowser): Promise<AutohelperData> {
        await browser.driver.executeScript(`const script = document.createElement('script');
        script.setAttribute('src', '${this.extSrc}');
        script.setAttribute('type', 'text/javascript');
        document.head.appendChild(script);`);

        await browser.driver.wait(until.elementLocated(By.css('#autohelperbot_details .ahb_data .roll')));

        const infoElements = await browser.driver.findElements(By.css('#autohelperbot_details .ahb_data .roll > div'));

        let priceElem: WebElement | null = null;
        for(let elem of infoElements) {
            const elemText = await elem.getText();
            if(elemText.includes(this.avgLabel)) {
                priceElem = elem;
                break;
            }
        }

        const priceText = await priceElem?.findElement(By.css('div.right_box')).getText();
        if(priceText) {
            return {avgPrice: extractNumber(priceText)};
        }
        return {avgPrice: null};
    }
}