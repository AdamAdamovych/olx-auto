import { AppBrowser } from "./app-browser";
import { AppAuth } from "./app-auth";
import { CopartAds } from "./copart-ads";
import { Ads } from "./ads";
import pr from "prompt-sync";

const prompt = pr();

export class App {
    private appAuth: AppAuth;
    private browser: AppBrowser;
    private copartAds: CopartAds;
    private ads: Ads;

    constructor() {
        this.browser = new AppBrowser();
        this.appAuth = new AppAuth(this.browser);
        this.copartAds = new CopartAds(this.browser);
        this.ads = new Ads(this.browser, this.appAuth);
    }

    async start() {
        const copartUrl = 'https://www.copart.com/lot/82317623/clean-title-2010-audi-a4-premium-ca-sun-valley'//prompt('Please enter Copart url >> ');
        const copartData = await this.copartAds.getFrom(copartUrl);

        console.log(copartData);
        await this.ads.open();

        /*const testData: Partial<CopartItem> = {
            info: {title: '2018 Audi A4 B9 Premium'} as any,
            images: ['D:\\Dev\\olx_auto\\tmp\\img.jpg', 'D:\\Dev\\olx_auto\\tmp\\img2.jpg']
        }*/
        await this.ads.setData(copartData);

        //this.browser.close();
    }
}