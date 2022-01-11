require('dotenv').config()
const config = require('./config');

const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const { ethers } = require('ethers');
const tweet = require('./tweet');
const cache = require('./cache');

main();

async function main() {
    try {
        while( true ) {
            await getEvents();
            await sleep( 60000 );
        }
    }
    catch( e ) {
        console.error( e )
    }
}  

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Format tweet text
function formatTweet( event ) {
    console.log( 'formatTweet' );
    //console.log( event );

    // Handle both individual items + bundle sales
    const assetName = _.get(event, ['asset', 'name'], _.get(event, ['asset_bundle', 'name']));
    const openseaLink = _.get(event, ['asset', 'permalink'], _.get(event, ['asset_bundle', 'permalink']));

    const totalPrice = _.get(event, 'total_price');

    const tokenDecimals = _.get(event, ['payment_token', 'decimals']);
    const tokenUsdPrice = _.get(event, ['payment_token', 'usd_price']);
    const tokenEthPrice = _.get(event, ['payment_token', 'eth_price']);

    //if ( !totalPrice || !tokenDecimals ) {
    //    throw `totalPrice or tokenDecimals are null or undefined for event ${event}`;
    //}
    //console.log( totalPrice, tokenDecimals );
    
    const formattedUnits = ethers.utils.formatUnits(totalPrice, tokenDecimals);
    const formattedEthPrice = formattedUnits * tokenEthPrice;
    const formattedUsdPrice = formattedUnits * tokenUsdPrice;

    const tweetText = `${assetName} bought for ${formattedEthPrice}${ethers.constants.EtherSymbol} ($${Number(formattedUsdPrice).toFixed(2)}) #NFT ${openseaLink}`;

    //console.log(tweetText);

    return tweetText;
}

function sendTweet( tweetText ) {
    
    console.log(tweetText);

    // OPTIONAL PREFERENCE - don't tweet out sales below X ETH (default is 1 ETH - change to what you prefer)
    // if (Number(formattedEthPrice) < 1) {
    //     console.log(`${assetName} sold below tweet price (${formattedEthPrice} ETH).`);
    //     return;
    // }

    // OPTIONAL PREFERENCE - if you want the tweet to include an attached image instead of just text
    // const imageUrl = _.get(event, ['asset', 'image_url']);
    // return tweet.tweetWithImage(tweetText, imageUrl);

    return tweet.tweet(tweetText);
}

// Poll OpenSea every 60 seconds & retrieve all sales for a given collection in either the time since the last sale OR in the last minute
//setInterval(() => {

async function getEvents() {
    console.log( 'getEvents' );

    try {
        const lastSaleTime = cache.get( 'lastSaleTime' ) || moment().startOf('minute').subtract(60, "minutes").unix();

        console.log(`Last sale (in seconds since Unix epoch): ${lastSaleTime}`);

        const response = await axios.get('https://api.opensea.io/api/v1/events', {
            headers: {
                'X-API-KEY': process.env.OPENSEA_API_KEY
            },
            params: {
                asset_contract_address: config.opensea.collection_address,
                //collection_slug: process.env.OPENSEA_COLLECTION_SLUG,
                event_type: 'successful',
                occurred_after: lastSaleTime,
                only_opensea: 'false',
                offset: 0, // max: 10000
                limit: '300' // max: 300
            }
        });
    
        const events = await _.get( response, ['data', 'asset_events'] );

        const sortedEvents = _.sortBy( events, function( event ) {
            const created = _.get( event, 'created_date' ); // created_date
            console.log( created, moment( created ).unix() );
            return new Date( created );
        })

        console.log(`${events.length} sales since the last one: ${lastSaleTime}`);

        for( var i=0; i<sortedEvents.length; i++ ) {
        //_.each( sortedEvents, ( event ) => {

            var event = sortedEvents[i];

            const created = _.get( event, 'created_date' ); // created_date
            const createdUnix = moment( created ).unix();
   
            console.log( createdUnix, lastSaleTime )

            if ( createdUnix > lastSaleTime ) {
                var tweetText = formatTweet( event );
                console.log( tweetText )
                sendTweet( tweetText );
            }
            else {
                console.log( 'old event, discarded', formatTweet( event ) );
            }

            cache.set( 'lastSaleTime', createdUnix );

        //});

        }
    }
    catch( e ) {
        console.error( e );
    };

    console.log( 'getEvents END' )
}
//}, 60000);
