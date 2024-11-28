import * as fs from 'fs-extra';

export interface AppConfigDef {
    chrome_version?: string;
    maps: {
        fuel: Record<string, number>,
        color: Record<string, number>,
        drive: Record<string, number>,
        body: Record<string, number>,
    },
    dataset: {
        textValues: {selector: string, value: string}[],
        checkboxValues: string[],
        dropdownValues: {selector: string, value: number}[],
        buttonClicks: string[],
    }
}

export class AppConfig {
    private readonly filename = __dirname + '/config.js';

    private static configPromise: Promise<any>;
    constructor() {
        if(!AppConfig.configPromise) {
            if(fs.existsSync(this.filename)) {
                console.log('Reading config...');
                AppConfig.configPromise = import(this.filename).then(m => m.default.default);
            } else {
                console.log('Creating config...');
                AppConfig.configPromise = this.createDefault().then(() => import(this.filename)).then(m => m.default.default);
            }
        }
    }

    get config(): Promise<AppConfigDef> {
        return AppConfig.configPromise;
    }

    private async createDefault() {
        const data = `exports.default = {
    maps:{
       fuel:{
          "HYBRID ENGINE":5,
          "DEFAULT":6
       },
       color:{
          "PURPLE":22
       },
       drive:{
          "ALL-WHEEL DRIVE":0,
          "DEFAULT":0
       },
       body:{
          "CARGO VAN":9,
          "DEFAULT":8
       }
    },
    dataset: {
      textValues: [
         {selector: 'Опис', value: \`Опис оголошення\`},
      ],

      checkboxValues: [                    
         'Звичайний продаж',
      ],
      dropdownValues: [
         {selector: 'Ціна:1',                value: 1}, 
         {selector: 'Тип автомобіля',        value: 2},
      ],
      buttonClicks: [
         'Бізнес'
      ],
    }
 };`;


        await fs.createFile(this.filename);
        await fs.writeFile(this.filename, data);
    }
}