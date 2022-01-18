require('dotenv').config()
const config = require('./config');

const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const { ethers } = require('ethers');
const tweet2 = require('./tweet2');
const cache = require('./cache');

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: config.mail.smtp,
    port: config.mail.port,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
});
transporter.verify().then( console.log ).catch( console.error );

const nl = '\r\n';

var startTimes = {};
var caches = {};

main();

async function main() {
    try {

        for(let j=0; j<config.opensea.collections.length; j++) {

            var collection = config.opensea.collections[j];

            startTimes[ collection.ref ] = Date.now();
            caches[ collection.ref ] = new cache.Cache( collection.ref );

        }

        //var startTime = Date.now();
        //console.log( `startTime: ${startTime}` )

        while( true ) {

            for(var j=0; j<config.opensea.collections.length; j++) {

                var collection = config.opensea.collections[j];

                console.log( `>---- ${ collection.name } CHECK START`);
                
                await getEvents( collection );

                await sleep( 1000 * config.sleep_secs_btw_collections );

                if ( Date.now() - startTimes[ collection.ref ] > collection.stats_msecs ) {
                    await getStats( collection );
                    startTimes[ collection.ref ] = Date.now();
                }

                console.log( `----< ${ collection.name } CHECK END`);
            
            }

            await sleep( config.sleep_time_msecs );

        }
    }
    catch( e ) {
        console.error( e )
    }
}  

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getStats( collection ) {
    console.log( 'getStats' );

    const stats = await getOpenSeaStats( collection.slug );

    if (stats) {
        /*
{
    "one_day_volume": 8.170528,
    "one_day_change": -0.37962947214966875,
    "one_day_sales": 37,
    "one_day_average_price": 0.22082508108108106,
    "seven_day_volume": 432.96651892149106,
    "seven_day_change": 3.630326157606298,
    "seven_day_sales": 1621,
    "seven_day_average_price": 0.26709840772454724,
    "thirty_day_volume": 588.57962882049,
    "thirty_day_change": 1.0718825057706534,
    "thirty_day_sales": 2756,
    "thirty_day_average_price": 0.21356300029771047,
    "total_volume": 8779.201743490707,
    "total_sales": 21564,
    "total_supply": 10000,
    "count": 10000,
    "num_owners": 4804,
    "average_price": 0.4071230636009417,
    "num_reports": 7,
    "market_cap": 2670.9840772454722,
    "floor_price": 0.151
  }
        */

        const floorPrice = _.get( stats, ['floor_price'] );
        const numOwners = _.get( stats, ['num_owners'] );
        const totalVolume = _.get( stats, ['total_volume'] );
        const totalSales = _.get( stats, ['total_sales'] );
        const oneDayVolumeChange = _.get( stats, ['one_day_change'] );
        const oneDaySales = _.get( stats, ['one_day_sales'] );

        var statsText = `${ collection.name } collection stats:`+nl+nl
        statsText += `Floor: ${floorPrice}${ethers.constants.EtherSymbol}`+nl;
        statsText += `Total Owners: ${numOwners}`+nl;
        statsText += `Total Volume: ${getNumberUnit( Math.floor(totalVolume) )}${ethers.constants.EtherSymbol}`+nl;
        statsText += `Total Sales: ${totalSales}`+nl;
        statsText += `24h Volume change: ${oneDayVolumeChange.toFixed(2)}%`+nl;
        statsText += `24h Sales: ${oneDaySales}`+nl+nl;

        statsText += `${ collection.opensea_url }` +nl+nl;
        statsText += config.tags.reduce((pv,cv)=>pv +=`#${cv} `, '')

        await sendTweet( statsText );
    }
}

function formatTraits( asset ) {
    console.log( 'formatTraits' );
    const traits = _.get( asset, ['traits'])

    var text = '';

    if (traits.length > 0) {
    
        const tier = _.find( traits, ( o ) => o.trait_type == 'Tier' ).value;
        const neck = _.find( traits, ( o ) => o.trait_type == 'Neck Accessory' ).value;
        const face = _.find( traits, ( o ) => o.trait_type == 'Face Accessory' ).value;
        const expression = _.find( traits, ( o ) => o.trait_type == 'Expression' ).value;
        const hat = _.find( traits, ( o ) => o.trait_type == 'Hat' ).value;
        const body = _.find( traits, ( o ) => o.trait_type == 'Body' ).value;

        text += `Tier: ${ tier }` + nl;
        text += `Neck: ${ neck }` + nl;
        text += `Face: ${ face }` + nl;
        text += `Expression: ${ expression }` + nl;
        text += `Hat: ${ hat }` + nl;
        text += `Body: ${ body }`;

    }
    else {
        console.log( `-------> No traits found for asset` )
    }

    return text;
}

function formatEventName( event ) {
    console.log( 'formatEventName' );

    const assetName = _.get(event, ['asset', 'name'], _.get(event, ['asset_bundle', 'name']));
    
    const totalPrice = _.get(event, 'total_price');

    const tokenDecimals = _.get(event, ['payment_token', 'decimals']);
    const tokenUsdPrice = _.get(event, ['payment_token', 'usd_price']);
    const tokenEthPrice = _.get(event, ['payment_token', 'eth_price']);

    const formattedUnits = ethers.utils.formatUnits(totalPrice, tokenDecimals);
    const formattedEthPrice = formattedUnits * tokenEthPrice;
    const formattedUsdPrice = formattedUnits * tokenUsdPrice;

    var text = `${assetName} bought for ${formattedEthPrice}${ethers.constants.EtherSymbol} ($${Number(formattedUsdPrice).toFixed(2)})`;
    
    return text;
}

// Format tweet text
function formatTweetEvent( event, asset ) {
    console.log( 'formatTweetEvent' );
    //console.log( event );
/*
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

    //var tweetText = `${assetName} bought for ${formattedEthPrice}${ethers.constants.EtherSymbol} ($${Number(formattedUsdPrice).toFixed(2)}) #NFT ${openseaLink}`;

    var tweetText = `${assetName} bought for ${formattedEthPrice}${ethers.constants.EtherSymbol} ($${Number(formattedUsdPrice).toFixed(2)})`+nl;
*/
    var tweetText = formatEventName( event ) + nl + nl;

    if ( asset ) {
        var traits = formatTraits( asset );
        if ( traits != '' ) tweetText += traits + nl + nl;
    }
    else {
        console.log( '-------> Asset not defined' )
    }

    const openseaLink = _.get(event, ['asset', 'permalink'], _.get(event, ['asset_bundle', 'permalink']));
    tweetText += `${openseaLink}`+nl+nl;

    tweetText += config.tags.reduce((pv,cv)=>pv +=`#${cv} `, '')

    //console.log(tweetText);

    return tweetText;
}

async function getEvents( collection ) {
    console.log( 'getEvents', collection.name );

    try {
        //const lastSaleTime = ( await caches[ collection.ref ].get( 'lastSaleTime' ) ) || 
        //    moment().startOf('minute').subtract(60, "minutes").unix();

        const lastSaleTime = await caches[ collection.ref ].get( 'lastSaleTime' );
        console.log(`Last sale (in seconds since Unix epoch): ${lastSaleTime}`);

        const events = await getOpenSeaEvents( collection, lastSaleTime );

        const sortedEvents = _.sortBy( events, function( event ) {
            const created = _.get( event, 'created_date' ); // created_date
            //console.log( created, moment( created ).unix() );
            return new Date( created );
        })

        console.log(`${events.length} sales since the last one: ${lastSaleTime}`);

        for( var i=0; i<sortedEvents.length; i++ ) {
        //_.each( sortedEvents, ( event ) => {

            var event = sortedEvents[i];

            const created = _.get( event, 'created_date' );
            const createdUnix = moment( created ).unix();
            const assetName = _.get(event, ['asset', 'name'], _.get(event, ['asset_bundle', 'name']));

            console.log( `Event created: ${createdUnix}, last sale time: ${lastSaleTime}, name: ${ assetName }` );

            const checkAsset = _.get( event, 'asset' );
            console.log( 'checkAsset', checkAsset ) 
            if ( !checkAsset ) {
                // bundle
                console.error( '--------> !!! Problematic event, skip', event )
                //continue;
            }
            else {
                //console.log( 'event', event );
                
                if ( createdUnix > lastSaleTime ) {
                    const tokenID = _.get( event, ['asset', 'token_id'] );
                    console.log( `tokenID: ${ tokenID }` );
        
                    var asset;
                    
                    if ( tokenID ) {
                        asset = await getOpenSeaAsset( collection.address, tokenID );
                    }
                    else {
                        console.error( `Token ID not found for event: ${ event }` ); 
                    }

                    var tweetText = formatTweetEvent( event, asset );

                    console.log( 'tweetText', tweetText )
                    //await sendMail( 'New Tweet', tweetText );
                    await sendTweet( tweetText );
                }
                else {
                    console.log( `old event, discarded --> ${ formatEventName( event ) }` );
                }

            }

            await caches[ collection.ref ].set( 'lastSaleTime', createdUnix );

            await sleep( 1000 * config.sleep_secs_btw_posts );

        //});

        }
    }
    catch( e ) {
        console.error( e );
    };

    console.log( 'getEvents END' )
}

async function sendTweet( tweetText ) {
    
    console.log( `sendTweet: ${tweetText}` );

    // OPTIONAL PREFERENCE - don't tweet out sales below X ETH (default is 1 ETH - change to what you prefer)
    // if (Number(formattedEthPrice) < 1) {
    //     console.log(`${assetName} sold below tweet price (${formattedEthPrice} ETH).`);
    //     return;
    // }

    // OPTIONAL PREFERENCE - if you want the tweet to include an attached image instead of just text
    // const imageUrl = _.get(event, ['asset', 'image_url']);
    // return tweet.tweetWithImage(tweetText, imageUrl);

    try {
        if ( config.twitter.send ) {
            await tweet2.tweet( tweetText );
        }
        else {
            console.log( '--------> !!! Send to Twitter is OFF' );
        }
    }
    catch( e ) {
        await sendMail( 'WinterBears Sales - Tweet Error', `${ JSON.stringify( e ) }` );
        console.error( e );
    }
}

//// OPENSEA

async function getOpenSeaEvents( collection, lastSaleTime ) {
    console.log( 'getOpenSeaEvents', collection.name );

    var events = [];

    try {
        const response = await axios.get('https://api.opensea.io/api/v1/events', {
                headers: {
                    'X-API-KEY': process.env.OPENSEA_API_KEY
                },
                params: {
                    asset_contract_address: collection.address, // config.opensea.collection_address,
                    //collection_slug: process.env.OPENSEA_COLLECTION_SLUG,
                    event_type: 'successful',
                    occurred_after: lastSaleTime,
                    only_opensea: 'false',
                    offset: 0, // max: 10000
                    limit: '300' // max: 300
                }
            });
    
        events = await _.get( response, ['data', 'asset_events'] );
    }
    catch( e ) {
        console.error( e )
    }

    return events;
}

// winterbears
async function getOpenSeaStats( slug ) {
    console.log( 'getOpenSeaStats' );

    const response = await axios.get( `https://api.opensea.io/api/v1/collection/${slug}/stats`, {
            headers: {
                'X-API-KEY': process.env.OPENSEA_API_KEY
            },
            params: {}
        });
    
    const stats = await _.get( response, ['data', 'stats'] );
    return stats;
}

async function getOpenSeaAsset( address, tokenID ) {
    console.log( 'getOpenSeaAsset', address, tokenID );

    const response = await axios.get( `https://api.opensea.io/api/v1/assets`, {
            headers: {
                'X-API-KEY': process.env.OPENSEA_API_KEY
            },
            params: {
                asset_contract_address: address,
                token_ids: tokenID,
                offset: 0,
                limit: 1
            }
        });
    
    const assets = await _.get( response, ['data', 'assets'] );
    console.log ( assets[0] );
    return assets[0];
}


//// UTILS 
function getNumberUnit( num ) {
    if (num < 1000) return num;
    // Nine Zeroes for Billions
    return Math.abs(Number(num)) >= 1.0e+9

    ? (Math.abs(Number(num)) / 1.0e+9).toFixed(2) + "B"
    // Six Zeroes for Millions 
    : Math.abs(Number(num)) >= 1.0e+6

    ? (Math.abs(Number(num)) / 1.0e+6).toFixed(2) + "M"
    // Three Zeroes for Thousands
    : Math.abs(Number(num)) >= 1.0e+3

    ? (Math.abs(Number(num)) / 1.0e+3).toFixed(2) + "K"

    : Math.abs(Number(num));
}


//// MAIL

async function sendMail( subject, body ) {
    console.log( 'sendMail' );
    try {
        var info = await transporter.sendMail({
            //from: '"Your Name" <youremail@gmail.com>', // sender address
            to: config.mail.to, //"receiverone@gmail.com, receivertwo@outlook.com", // list of receivers
            subject: subject, // Subject line
            text: body, // plain text body
            //html: "<b>There is a new article. It's about sending emails, check it out!</b>", // html body
        });
    }
    catch( e ) {
        console.error( e );
    }
    console.log( info ); 
}

/*

--------> !!! Problematic event, skip {
  approved_account: null,
  asset: null,
  asset_bundle: {
    maker: {
      user: [Object],
      profile_img_url: 'https://storage.googleapis.com/opensea-static/opensea-profile/4.png',
      address: '0x92374325e2c251710a621a8423dacc907ad29234',
      config: ''
    },
    slug: 'bear-pair-tbv',
    assets: [ [Object], [Object] ],
    name: 'Bear Pair',
    description: 'Grab two, save gas',
    external_link: null,
    asset_contract: {
      collection: [Object],
      address: '0xe5ba25f22a20a22fb47dadf137f33fe2e9ab22ac',
      asset_contract_type: 'non-fungible',
      created_date: '2021-12-26T09:30:27.200771',
      name: 'SummerBears',
      nft_version: '3.0',
      opensea_version: null,
      owner: 80834775,
      schema_name: 'ERC721',
      symbol: 'SB',
      total_supply: '10000',
      description: 'Summer Bears are a collection of 10,000 NFTs that were airdropped to the Winter Bears community. Join the community today: https://discord.gg/F68xh5ZtzG  \n' +
        'Winter Bears collection: https://opensea.io/collection/winterbears  \n' +
        '3D Bears collection: https://opensea.io/collection/3dbears',
      external_link: 'http://winterbearsnft.com',
      image_url: 'https://lh3.googleusercontent.com/Esy5bNtF2hYrW8VRpW8BJDffx2CIerCic3CiMk-_jTiZflBrq6-_ayurWteJRkJ9Xi0wjuR1QhhK90usJucEfXjANpwbI-EADe1jHf0=s120',
      default_to_fiat: false,
      dev_buyer_fee_basis_points: 0,
      dev_seller_fee_basis_points: 400,
      only_proxied_transfers: false,
      opensea_buyer_fee_basis_points: 0,
      opensea_seller_fee_basis_points: 250,
      buyer_fee_basis_points: 0,
      seller_fee_basis_points: 650,
      payout_address: '0x3dab914dedd7d0e58ab0dfc2e4f9bd7867b2dfa3'
    },
    permalink: 'https://opensea.io/bundles/bear-pair-tbv',
    sell_orders: null
  },
  auction_type: null,
  bid_amount: null,
  collection_slug: 'summerbears',
  contract_address: '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b',
  created_date: '2022-01-18T11:26:20.844040',
  custom_event_name: null,
  dev_fee_payment_event: null,
  dev_seller_fee_basis_points: 400,
  duration: null,
  ending_price: null,
  event_type: 'successful',
  from_account: null,
  id: 2951609146,
  is_private: false,
  owner_account: null,
  payment_token: {
    id: 1,
    symbol: 'ETH',
    address: '0x0000000000000000000000000000000000000000',
    image_url: 'https://storage.opensea.io/files/6f8e2979d428180222796ff4a33ab929.svg',
    name: 'Ether',
    decimals: 18,
    eth_price: '1.000000000000000',
    usd_price: '3174.300000000000182000'
  },
  quantity: '2',
  seller: {
    user: { username: 'Arctic_Fox' },
    profile_img_url: 'https://storage.googleapis.com/opensea-static/opensea-profile/4.png',
    address: '0x92374325e2c251710a621a8423dacc907ad29234',
    config: ''
  },
  starting_price: null,
  to_account: null,
  total_price: '79000000000000000',
  transaction: {
    block_hash: '0xdf8db9c31096c2017c774dace28f401568e672ac4f92f3e36a3b773819b6fc80',
    block_number: '14029206',
    from_account: {
      user: [Object],
      profile_img_url: 'https://storage.googleapis.com/opensea-static/opensea-profile/15.png',
      address: '0x36ba357c27c999fc0a686a6b5b553f134c770a9d',
      config: ''
    },
    id: 251408854,
    timestamp: '2022-01-18T11:25:54',
    to_account: {
      user: [Object],
      profile_img_url: 'https://storage.googleapis.com/opensea-static/opensea-profile/22.png',
      address: '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b',
      config: 'verified'
    },
    transaction_hash: '0x56e38e87d9d4f720e8ee2057721f17511b4c47290dd9083349462416de36d1ab',
    transaction_index: '163'
  },
  winner_account: {
    user: { username: null },
    profile_img_url: 'https://storage.googleapis.com/opensea-static/opensea-profile/15.png',
    address: '0x36ba357c27c999fc0a686a6b5b553f134c770a9d',
    config: ''
  },
  listing_time: '2022-01-18T01:33:14'
}

*/