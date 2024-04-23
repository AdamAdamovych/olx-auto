//version 1.0.0

import { App } from "./app";

(async () => {
    console.log('Starting app...')
    const app = new App();
    await app.start();
})();