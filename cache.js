const fs = require('fs');
const filePath = './db.json';

module.exports = {
    cache: {},
    get: function (key) {
        if ( fs.existsSync( filePath ) ) {
            const jsonData = fs.readFileSync( filePath, {encoding: "utf8"} ); 
            this.cache = JSON.parse( jsonData );
        }
        return this.cache[key]
    },
    set: function (key, val) {
        this.cache[key] = val;
        fs.writeFileSync( filePath, JSON.stringify( this.cache ) );  
    }
}