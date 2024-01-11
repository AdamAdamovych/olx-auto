import { AppBrowser } from "./app-browser";
import { AppAuth } from "./app-auth";
import { CopartItem } from "./copart-ads";
import * as fs from "fs-extra";
import { By, until } from "selenium-webdriver";
import { AppConfig } from "./app-config";

enum MappingKey {
    fuel = 'FUEL',
    color = 'COLOR',
    drive = 'DRIVE',
    body = 'BODY',
}

export class Ads {
    private readonly olxScriptPath = './olx_script.js';

    private readonly modelSelector = 'div[data-cy="parameters.model"] div[data-testid="dropdown-menu-item"] > a';
    private config: Promise<any>;

    constructor(private browser: AppBrowser, private appAuth: AppAuth) {
        this.config = new AppConfig().config;
    }

    async open() {
        try {
            await this.appAuth.authorize();
            await this.browser.driver.wait(until.elementLocated(By.css('textarea[data-cy="posting-title"]')));
        }
        catch(err) {
            console.error(err);
        }
    }

    async setData(data: CopartItem) {
        const title = data.info.title.length < 16 ? `${data.info.title} ${data.info.color}` : data.info.title;

        await this.browser.driver.findElement(By.css('textarea[data-cy=posting-title]')).sendKeys(title);

        
        for(let i = 0; i < 5; i += 1) {
            await this.browser.driver.wait(async () => !(await this.isHasData()) || (await this.browser.driver.executeScript('return window.olxSubmitClicked')));

            if(!(await this.isHasData())) {
                await this.setAdditionalData(data);
            } else {
                break;
            }

            if(i === 0) {
                await this.uploadImages(data.images);
            }
        }
        
    }

    private async setAdditionalData(data: CopartItem) {
        await this.browser.driver.wait(until.elementLocated(By.css('div[data-cy="parameters.car_state_type"]')));
        await this.injectScript(data);

        await this.tryToSelectModel(data.info.title);

        const promises = [
            this.browser.driver.findElement(By.css('input[data-cy="parameters.motor_year"]')).sendKeys(data.info.year),
        ];

        if(data.autoHelper.avgPrice) {
            promises.push(this.browser.driver.findElement(By.css('input[data-cy=posting-price]')).sendKeys(data.autoHelper.avgPrice));
        }

        if(data.info.odometer) {
            promises.push(this.browser.driver.findElement(By.css('input[data-cy="parameters.motor_mileage_thou"]')).sendKeys(Math.round(data.info.odometer.km / 1000)));
        }
        if(data.info.engine?.liters) {
            promises.push(this.browser.driver.findElement(By.css('input[data-cy="parameters.motor_engine_size_litre"]')).sendKeys(data.info.engine.liters));
        }

        promises.push(this.setDropdownValueByMapping('parameters.car_body', MappingKey.body, data.info.bodyType));
        promises.push(this.setDropdownValueByMapping('parameters.fuel_type', MappingKey.fuel, data.info.fuelType));
        promises.push(this.setDropdownValueByMapping('parameters.drive_type', MappingKey.drive, data.info.drive));
        promises.push(this.setDropdownValueByMapping('parameters.color', MappingKey.color, data.info.color));

        await Promise.all(promises);
    }

    private async uploadImages(images: string[]) {
        for(let image of images) {
            await this.browser.driver.findElement(By.css('input[data-cy=attach-photos-input]')).sendKeys(image);
            await this.browser.driver.sleep(50);
        }
    }

    private async isHasData(): Promise<boolean> {
        await this.browser.driver.wait(until.elementLocated(By.css('div[data-cy="parameters.car_state_type"]')));
        const value = await this.browser.driver.findElement(By.css('input[data-cy="parameters.motor_year"]')).getAttribute('value');
        return value?.length > 0;
    }

    private async injectScript(item: CopartItem) {
        const scriptBuff = await fs.readFile(this.olxScriptPath);

        let priceFormat = item.autoHelper.avgPrice ? new Intl.NumberFormat(['id']).format(item.autoHelper.avgPrice) : null;
        const odoFormat = new Intl.NumberFormat(['id']).format(item.info.odometer?.mi || 0);
        const script = scriptBuff.toString()
            .replace('{{price}}', priceFormat || '')
            .replace('{{miles}}', odoFormat)
            .replace('{{drive}}', item.info.drive || '')
            .replace('{{engine}}', item.info.engine?.liters || item.info.fuelType || '');
        
        await this.browser.driver.executeScript(script);
    }

    private async getMapping(key: MappingKey, value?: string): Promise<number | null> {
        const config = await this.config;
        const mapping = config['MAPS'];
        const defaultValue = typeof mapping[key]['DEFAULT'] === 'number' ? mapping[key]['DEFAULT'] : null;

        if(!value || typeof mapping[key][value] !== 'number') {
            return defaultValue;
        }
        return mapping[key][value];
    }

    private async setDropdownData(dataCy: string, index: number) {
        const selector = `div[data-cy="${dataCy}"] input[data-testid=dropdown-head-input], div[data-cy="${dataCy}"] button[data-testid=dropdown-head-button]`;
        await this.browser.driver.executeScript(`selectDropdown('${selector}', ${index});`);
    }

    private async setDropdownValueByMapping(dataCy: string, mappingKey: MappingKey, rawValue?: string) {
        const value = await this.getMapping(mappingKey, rawValue);
        if(typeof value === 'number') {
            this.setDropdownData(dataCy, value);
        }
    }

    private async tryToSelectModel(carTitle: string) {
        await this.browser.driver.executeScript(`openDropdown('div[data-cy="parameters.model"] input[data-testid="dropdown-head-input"], div[data-cy="parameters.model"] button[data-testid="dropdown-head-button"]')`);
        await this.browser.driver.wait(until.elementLocated(By.css('div[data-cy="parameters.model"] ul[data-testid=dropdown-list]')));

        const modelItems = await this.browser.driver.findElements(By.css(this.modelSelector));
        const models = await Promise.all(modelItems.map(i => i.getText()));
        const title = carTitle.slice(5); // skip year
        const index = models.findIndex(model => title.toUpperCase().includes(model.toUpperCase()));
        if(index >= 0) {
            await this.setDropdownData('parameters.model', index);
            return;
        }
    }
}