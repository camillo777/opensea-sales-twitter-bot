require('dotenv').config()
const config = require('./config/config.js.default');

const axios = require('axios');
const _ = require('lodash');

const fs = require('fs');

var dir = './cache'

main();

async function main() {

    var collection = config.opensea.collections[0];

    var url = 'https://api.opensea.io/api/v1/assets?asset_contract_address=0xC8BcbE0E8ae36D8f9238cd320ef6dE88784B1734&order_direction=desc&offset=0&limit=20';

    var assets = await getOpenSeaAssetsLoop( collection );

    console.log( `Returned ${ assets.length } assets`);

    var filePath = `${ dir }/assets_${ collection.ref }.json`;

    if ( !fs.existsSync( dir ) ){
        fs.mkdirSync( dir );
    }

    fs.writeFileSync( filePath, JSON.stringify( assets ) ); 

}


async function getOpenSeaAssets( collection, offset = 0, limit = 50 ) {
    console.log( 'getOpenSeaEvents', collection.name );

    var assets = [];

    try {
        const response = await axios.get('https://api.opensea.io/api/v1/assets', {
                headers: {
                    'X-API-KEY': process.env.OPENSEA_API_KEY
                },
                params: {
                    asset_contract_address: collection.address,
                    offset: offset, // max: 10000
                    limit: `${ limit }` // max: 50
                }
            });
    
        assets = await _.get( response, ['data', 'assets'] );
    }
    catch( e ) {
        console.error( e )
    }

    return assets;
}

async function getOpenSeaAssetsLoop( collection ) {
    console.log( 'getOpenSeaAssetsLoop', collection.name );

    var assets = [];
    var offset = 0;
    var limit = 20;

    try {
        respAssets = await getOpenSeaAssets( collection, offset, limit );

        while( respAssets.length > 0 ) {
            assets.push( ...respAssets );

            await sleep( 1000*1 );

            offset += limit;
            console.log( offset );
            respAssets = await getOpenSeaAssets( collection, offset, limit );
        }
    }
    catch( e ) {
        console.error( e )
    }

    return assets;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}