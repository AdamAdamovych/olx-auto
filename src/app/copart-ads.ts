import { By, until } from "selenium-webdriver";
import { AppBrowser } from "./app-browser";
import Downloader from "nodejs-file-downloader";
import * as fs from 'fs-extra';
import { Autohelper, AutohelperData } from "./autohelper";
import { capitalizeText, extractNumber } from "./utils";
import * as path from 'path';

export interface CopartInfo {
    lotNum: string;
    title: string;
    odometer?: {
        km: number,
        mi: number,
    };
    color?: string;
    fuelType?: string;
    engine?: {
        liters: string | null;
        raw: string;
    },
    drive?: string;
    bodyType?: string;
    year: number;
}

export interface CopartItem {
    images: string[];
    info: CopartInfo;
    autoHelper: AutohelperData;
}


export class CopartAds {
    readonly tmpPath = './tmp';

    private readonly viewAllTxt = '.viewalltxt';
    private readonly imgSelector = '.viewAllPhotosRelative img';

    private readonly allDownloadedFiles: string[] = [];
    private readonly autoHelper: Autohelper = new Autohelper();

    constructor(private appBrowser: AppBrowser) {
        this.prepareFolder();
    }

    async getFrom(url: string): Promise<CopartItem> {
        await this.appBrowser.goto(url);
        await this.appBrowser.driver.wait(until.elementLocated(By.css('.download-image > a')));

        const result = await Promise.all([
            this.scanInfo(),
            this.autoHelper.getData(this.appBrowser),
            this.downloadImages(),
        ]);
        const info = result[0];
        const autoHelperData = result[1];
        const images = result[2];

        return {
            info,
            autoHelper: autoHelperData,
            images: images,
        };
    }

    async deleteTemp() {
        await Promise.all(this.allDownloadedFiles.map(path => fs.remove(path)));
    }

    private async scanInfo(): Promise<CopartInfo> {
        const result = await Promise.all([
            this.appBrowser.driver.findElement(By.id('LotNumber')).getText(),
            this.appBrowser.driver.findElement(By.css('h1.title')).getText(),
            this.getTextFrom('.odometer-value > span > span'),
            this.getTextFrom('span[data-uname=DriverValue]'),
            this.getTextFrom('span[data-uname=lotdetailFuelvalue]'),
            this.getTextFrom('span[data-uname=lotdetailEnginetype]'),
            this.getTextFrom('span[data-uname=lotdetailColorvalue]'),
            this.getTextFrom('span[data-uname=lotdetailBodystylevalue]'),
        ]);
        const lotNum = result[0];
        const title = result[1] ;
        const odo = result[2] ;
        const drive = result[3] ;
        const fuelType = result[4] ;
        const engineType = result[5] ;
        const color = result[6] ;
        const bodyType = result[7] ;

        return { 
            lotNum, 
            title: capitalizeText(title.toLowerCase()), 
            odometer: this.normalizeOdo(odo) || undefined,
            drive: drive?.toUpperCase(), 
            fuelType: fuelType?.toUpperCase(), 
            engine: this.normalizeEngine(engineType) || undefined, 
            color: color?.toUpperCase(), 
            bodyType: bodyType?.toUpperCase(),
            year: parseInt(title.slice(0, 4)),
        };
    }

    private async downloadImages() {
        await this.appBrowser.driver.findElement(By.css(this.viewAllTxt)).click();

        const imgElements = await this.appBrowser.driver.findElements(By.css(this.imgSelector));

        const files = imgElements.slice(0, imgElements.length - 2).map(async img => {
            const href = await img.getAttribute('src');
            console.log('Download img: ', href);
            const downloader = new Downloader({
                url: href,
                directory: this.tmpPath,
                maxAttempts: 3,
            });
    
            return await downloader.download();
        });
        const fileReports = await Promise.all(files);

        fileReports.forEach(r => r.filePath && this.allDownloadedFiles.push(r.filePath));

        return this.allDownloadedFiles.map(p => path.resolve(p));
    }

    private normalizeOdo(odo?: string | null): {km: number, mi: number} | null {
        if(!odo) return null;

        const mi = extractNumber(odo);
        return {km: Math.round(mi * 1.60934), mi};
    }

    private normalizeEngine(engine?: string | null): {liters: string | null, raw: string} | null {
        if(!engine) return null;

        const result: {liters: string | null, raw: string} = {
            liters: null,
            raw: engine,
        };
        const m = engine.match(/[0-9]+.[0-9]+/);
        if(m?.length) {
            result.liters = m[0];
        }
        return result;
    }

    private async prepareFolder() {
        if(await fs.exists(this.tmpPath)) {
            await fs.remove(this.tmpPath);
        }
    }

    private async getTextFrom(selector: string): Promise<string | null> {
        const elements = await this.appBrowser.driver.findElements(By.css(selector));
        if(elements.length > 0) return await elements[0].getText();

        return null;
    }
}