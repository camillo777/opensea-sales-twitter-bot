const fs = require('fs');
const moment = require('moment');

class Cache {

    constructor( cacheName ) {
        this.cacheName = cacheName;
        this.dir = './cache';
        this.filePath = `${this.dir}/${this.cacheName}.json`;
        this.cache = {};
        
        if ( !fs.existsSync( this.dir ) ){
            fs.mkdirSync( this.dir );
        }
    }

    async get( key ) {
        console.log( 'Cache', 'get', this.cacheName );
        if ( !fs.existsSync( this.filePath ) ) {
            //return null;
            await this.set( key, moment().startOf('minute').subtract(60, "minutes").unix() );
        }
        const jsonData = fs.readFileSync( this.filePath, { encoding: "utf8" } ); 
        this.cache = JSON.parse( jsonData );
        return this.cache[key]
    }

    async set( key, val ) {
        console.log( 'Cache', 'set', this.cacheName, val );
        this.cache[key] = val;
        fs.writeFileSync( this.filePath, JSON.stringify( this.cache ) );  
    }
}

module.exports = { Cache }