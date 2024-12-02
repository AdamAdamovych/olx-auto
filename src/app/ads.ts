import { AppBrowser } from "./app-browser";
import { AppAuth } from "./app-auth";
import { CopartItem } from "./copart-ads";
import { By, until } from "selenium-webdriver";
import { AppConfig, AppConfigDef } from "./app-config";
import { SelectorHelper } from "./selector-helper";

enum MappingKey {
    fuel = 'fuel',
    color = 'color',
    drive = 'drive',
    body = 'body',
}

export class Ads {
    
    private labels = {
        model: 'Модель',
        year: 'Рік випуску',
        price: 'Ціна',
        odometer: 'Пробіг',
        engine_liters: `Об'єм двигуна`,
        body_type: 'Тип кузова',
        fuel_type: 'Вид палива',
        drive_type: 'Тип приводу',
        color: 'Kолір',
    }


    private waitElements = [
        'input[data-testid="attach-photos-input"]',
        'div[data-cy="parameters.model"]',
        'input[data-testid="parameters.motor_year"]',
        'input[data-testid="price-input"]',
        'input[data-testid="parameters.motor_mileage_thou"]',
        'input[data-testid="parameters.motor_engine_size_litre"]',
        'div[data-cy="parameters.car_body"]',
        'div[data-cy="parameters.fuel_type"]',
        'div[data-cy="parameters.drive_type"]',
        'div[data-cy="parameters.color"]'
    ]

    private config: Promise<AppConfigDef>;

    private selectorHelper:SelectorHelper;

    constructor(private browser: AppBrowser, private appAuth: AppAuth) {
        this.config = new AppConfig().config;
        this.selectorHelper = new SelectorHelper(browser);
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
        
        for(let selector of this.waitElements) {
            await this.browser.driver.wait(until.elementLocated(By.css(selector)));
        }

        await this.selectorHelper.waitForLoading();

        for(let i = 0; i < 5; i += 1) {
            const hasData = await this.isHasData();
            if(hasData) {
                console.log('Done!');
            }

            await this.browser.driver.wait(async () => !(await this.isHasData()) || (await this.browser.driver.executeScript('return window.olxSubmitClicked')));

            if(!hasData) {
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
        const config = await this.config;

        await this.browser.driver.wait(until.elementLocated(By.css('div[data-cy="parameters.car_state_type"]')));

        await this.tryToSelectModel(data.info.title);


        await this.setDropdownValueByMapping(this.labels.body_type, MappingKey.body, data.info.bodyType);
        await this.setDropdownValueByMapping(this.labels.fuel_type, MappingKey.fuel, data.info.fuelType);
        await this.setDropdownValueByMapping(this.labels.drive_type, MappingKey.drive, data.info.drive);
        await this.setDropdownValueByMapping(this.labels.color, MappingKey.color, data.info.color);

        for(let tb of config.dataset.dropdownValues) {
            await this.selectorHelper.selectDropdownValue(tb.selector, tb.value);
        }

        for(let btn of config.dataset.buttonClicks) {
            await this.selectorHelper.clickButton(btn)
        }

        for(let ch of config.dataset.checkboxValues) {
            await this.selectorHelper.selectCheckbox(ch)
        }


        await this.selectorHelper.setText(this.labels.year, data.info.year.toString());
        if(data.autoHelper.avgPrice) {
            await this.selectorHelper.setText(this.labels.price, data.autoHelper.avgPrice.toString());
        }
        if(data.info.odometer) {
            await this.selectorHelper.setText(this.labels.odometer, Math.round(data.info.odometer.km / 1000).toString());
        }
        if(data.info.engine?.liters) {
            await this.selectorHelper.setText(this.labels.engine_liters, data.info.engine.liters);
        }

        for(let tb of config.dataset.textValues) {
            const text = tb.value
                .replace('{{miles}}', data.info.odometer?.km?.toString() || '0')
                .replace('{{price}}', data.autoHelper.avgPrice?.toString() || '0')
                .replace('{{drive}}', data.info.drive || '')
                .replace('{{engine}}', data.info.engine?.liters || '');


            await this.selectorHelper.setText(tb.selector, text, true);
        }
    }

    private async uploadImages(images: string[]) {
        await this.browser.driver.sleep(100);
        for(let image of images) {
            await this.browser.driver.findElement(By.css('input[data-testid="attach-photos-input"]')).sendKeys(image);
            await this.browser.driver.sleep(50);
        }
    }

    private async isHasData(): Promise<boolean> {
        await this.browser.driver.wait(until.elementLocated(By.css('div[data-cy="parameters.car_state_type"]')));
        const value = await this.browser.driver.findElement(By.css('input[data-cy="parameters.motor_year"]')).getAttribute('value');
        return value?.length > 0;
    }

    

    private async getMapping(key: MappingKey, value?: string): Promise<number | null> {
        const config = await this.config;
        const mapping = config['maps'];
        const defaultValue = typeof mapping[key]['DEFAULT'] === 'number' ? mapping[key]['DEFAULT'] : null;

        if(!value || typeof mapping[key][value] !== 'number') {
            return defaultValue;
        }
        return mapping[key][value];
    }

    private async setDropdownValueByMapping(label: string, mappingKey: MappingKey, rawValue?: string) {
        const value = await this.getMapping(mappingKey, rawValue);
        if(typeof value === 'number') {
            await this.selectorHelper.selectDropdownValue(label, value)
        }
    }

    private async tryToSelectModel(carTitle: string) {
        const models = await this.selectorHelper.getDropdownValues(this.labels.model);
        const title = carTitle.slice(5); // skip year
        const index = models.findIndex(model => title.toUpperCase().includes(model.toUpperCase()));
        if(index >= 0) {
            await this.selectorHelper.selectDropdownValue(this.labels.model, index);
            return;
        }
    }
}