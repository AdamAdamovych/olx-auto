import { By, until, WebElement, WebElementCondition } from "selenium-webdriver";
import { AppBrowser } from "./app-browser";

export class SelectorHelper {
    private labelElements: Record<string, WebElement> | null = null;
    private checkboxElements: Record<string, WebElement> | null = null;
    private buttonElements: Record<string, WebElement> | null = null;

    constructor(private browser: AppBrowser) {}

    async waitForLoading() {
        await this.browser.driver.wait(until.elementLocated(By.css('div[data-testid="description-widget"]')));
        await this.browser.driver.wait(until.elementLocated(By.css('div[data-testid="parameters-field-widget"]')));

        await this.injectScript();

        await this.prepareCheckboxes();
        await this.prepareButtons();
        await this.prepareLabels();
    }

    async selectDropdownValue(label: string, index: number) {
        if(await this.openDropdown(label)) {
            let menuItem: WebElement;
            //dropdown
            if((await this.browser.driver.findElements(By.css(`div[role="menubar"] > div[data-cy="dropdown-menu-item"]`))).length > 0) {
                menuItem = await this.browser.driver.findElement(By.css(`div[role="menubar"] > div[data-cy="dropdown-menu-item"]:nth-child(${index + 1})`));
            } 
            //radio
            else if((await this.browser.driver.findElements(By.css(`div[role="menubar"] div[role="group"]`))).length > 0) {
                menuItem = await this.browser.driver.findElement(By.css(`div[role="menubar"] div[role="radio"]:nth-child(${index + 1})`));
            }

            if(menuItem) {
                await this.browser.driver.executeScript('arguments[0].click()', menuItem);
            } else {
                console.warn(`Dropdown '${label}' is invalid type`);
            }
        }
    }

    async getDropdownValues(label: string) {
        await this.openDropdown(label);

        const menuItems = await this.browser.driver.findElements(By.css(`div[role="menubar"] > div`));

        return Promise.all(menuItems.map(item => item.getText()));
    }

    async selectCheckbox(label: string) {
        if(!this.checkboxElements?.[label]) {
            console.warn(`Element '${label}' is not found`);
            return;
        }

        await this.browser.driver.executeScript('arguments[0].click()', this.checkboxElements[label]);
    }

    async clickButton(label: string) {
        if(!this.buttonElements?.[label]) {
            console.warn(`Element '${label}' is not found`);
            return;
        }

        await this.browser.driver.executeScript('arguments[0].click()', this.buttonElements[label]);
    }

    async setText(label: string, text: string, byScript = false) {
        

        if(!this.labelElements?.[label]) {
            console.warn(`Element '${label}' is not found`);
            return;
        }

        const nextElem = await this.getNextSibling(this.labelElements![label]);
        if(!nextElem) {
            console.warn(`Next element of '${label}' is not found`);
            return;
        }

        const input = await nextElem.findElement(By.css('textarea, input[type="text"]'));
        if(!input) {
            console.warn(`Input in '${label}' is not found`);
            return;
        }

        if(byScript) {
            await this.browser.driver.executeScript('arguments[0].value = arguments[1];', input, text);
        } else {
            await input.sendKeys(text);
        }
    }

    private async openDropdown(rawLabel: string) {
        const label = rawLabel.split(':');

        if(!this.labelElements?.[label[0]]) {
            console.warn(`Element '${label}' is not found`);
            return false;
        }

        const nextElem = await this.getNextSibling(this.labelElements![label[0]]);
        if(!nextElem) {
            console.warn(`Next element of '${label}' is not found`);
            return false;
        }

        const btns = await nextElem.findElements(By.css('input'));
        if(btns.length === 0) {
            console.warn(`Button in '${label}' is not found`);
            return false;
        }


        const index = label[1] ? parseInt(label[1]) : 0;

        await this.browser.driver.executeScript(
            `arguments[0].dispatchEvent(new FocusEvent('focusin', {bubbles: true, cancelable: false, composed: true, detail: 0, relatedTarget: null, view: window}));`, 
            btns[index]);

        await this.browser.driver.wait(until.elementLocated(By.css('div[role="menubar"] > div')));

        return true;
    }

    private async injectScript() {
        await this.browser.driver.wait(until.elementLocated(By.css('button[data-testid=submit-btn]')));
        await this.browser.driver.executeScript(`document.querySelector('button[data-testid=submit-btn]').addEventListener('click', () => window.olxSubmitClicked = true);`);
    }

    private async prepareLabels() {
        if(!this.labelElements) {
            this.labelElements = {};
            const elements = await this.browser.driver.findElements(By.css('label'));
            for(let elem of elements) {
                this.labelElements![await elem.getText()] = elem;
            }
        }
    }

    private async prepareCheckboxes() {
        if(!this.checkboxElements) {
            this.checkboxElements = {};
            const elements = await this.browser.driver.findElements(By.css('div[role="checkbox"]'));
            for(let elem of elements) {
                this.checkboxElements![await elem.getText()] = elem;
            }
        }
    }

    private async prepareButtons() {
        if(!this.buttonElements) {
            this.buttonElements = {};
            const elements = await this.browser.driver.findElements(By.css('button[type="button"]'));
            for(let elem of elements) {
                this.buttonElements![await elem.getText()] = elem;
            }
        }
    }

    private async getNextSibling(element: WebElement) {
        return await this.browser.driver.executeScript("return arguments[0].nextSibling;", element) as WebElement;
    }
}