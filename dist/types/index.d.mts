export default class Cache {
    constructor(cacheDirectory: any, options: any);
    cacheDirectory: any;
    options: any;
    get(endpoint: any, options: any, callback: any): any;
    getSync(endpoint: any, _options: any): any;
    clear(callback: any): any;
}
