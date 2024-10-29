import { AppBrowser } from "./app-browser";
import { AppAuth } from "./app-auth";
import { CopartAds } from "./copart-ads";
import { Ads } from "./ads";
import readline from "node:readline/promises";

const { stdin: input, stdout: output } = require('node:process');
const rl = readline.createInterface({ input, output });

export class App {
    private appAuth: AppAuth;
    private browser: AppBrowser;
    private copartAds: CopartAds;
    private ads: Ads;

    constructor() {
        try {
            this.browser = new AppBrowser();
            this.appAuth = new AppAuth(this.browser);
            this.copartAds = new CopartAds(this.browser);
            this.ads = new Ads(this.browser, this.appAuth);
        } catch(err) {
            console.error('Error starting app. ', err);
        }
    }

    async start() {
        try {
            const copartUrl = await rl.question('Please enter Copart url >> ');
            //const copartUrl = 'https://www.copart.com/lot/69827324/clean-title-2016-audi-a4-premium-s-line-tx-dallas-south';

            console.log('Openning -> ', copartUrl);
            this.browser.open();
            const copartData = await this.copartAds.getFrom(copartUrl);

            console.log(copartData);
            await this.ads.open();

            /*const testData: Partial<CopartItem> = {
                info: {title: '2018 Audi A4 B9 Premium'} as any,
                images: ['D:\\Dev\\olx_auto\\tmp\\img.jpg', 'D:\\Dev\\olx_auto\\tmp\\img2.jpg']
            }*/
            await this.ads.setData(copartData);

            //this.browser.close();
        } catch(err) {
            console.error(err);
        }
    }
}