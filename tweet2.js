require('dotenv').config()
const axios = require('axios');
//const twit = require('twit');
const twitterApi = require('twitter-api-v2');

/*
const twitterConfig = {
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
};
*/

const twitterConfig = {
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN_KEY,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
};

const client = new twitterApi.TwitterApi( twitterConfig );
//const twitterClient = new twit( twitterConfig );

// Tweet a text-based status
async function tweet( tweetText ) {
    /*const tweet = {
        status: tweetText,
    };*/

    await client.v2.tweet( tweetText );

    /*twitterClient.post('statuses/update', tweet, (error, tweet, response) => {
        if (!error) {
            console.log(`Successfully tweeted: ${tweetText}`);
        } else {
            console.error(error);
        }
    });*/
}

async function tweetWithImage( tweetText, imageUrl ) {
    /*
    // First, post all your images to Twitter
    const mediaIds = await Promise.all([
    // file path
    client.v1.uploadMedia('./my-image.jpg'),
    // from a buffer, for example obtained with an image modifier package
    client.v1.uploadMedia(Buffer.from(rotatedImage), { type: 'png' }),
    ]);

    // mediaIds is a string[], can be given to .tweet
    await client.v1.tweet('My tweet text with two images!', { media_ids: mediaIds });
    */

    //const mediaId = await client.v1.uploadMedia( Buffer.from(rotatedImage), { type: 'png' } );
    const mediaId = await client.v1.uploadMedia( getImage( imageUrl ), { type: 'jpg' } );
    await client.v1.tweet( tweetText, { media_ids: [ mediaId ] } );
}

/*
// OPTIONAL - use this method if you want the tweet to include the full image file of the OpenSea item in the tweet.
async function tweetWithImage(tweetText, imageUrl) {
    // Format our image to base64
    const processedImage = await getBase64(imageUrl);

    // Upload the item's image from OpenSea to Twitter & retrieve a reference to it
    twitterClient.post('media/upload', { media_data: processedImage }, (error, media, response) => {
        if (!error) {
            const tweet = {
                status: tweetText,
                media_ids: [media.media_id_string]
            };

            twitterClient.post('statuses/update', tweet, (error, tweet, response) => {
                if (!error) {
                    console.log(`Successfully tweeted: ${tweetText}`);
                } else {
                    console.error(error);
                }
            });
        } else {
            console.error(error);
        }
    });
}
*/

// Format a provided URL into it's base64 representation
// function getBase64( url ) {
//     return axios.get( url, { responseType: 'arraybuffer'} )
//         .then( response => Buffer.from(response.data, 'binary').toString('base64') )
// }
async function getImage( url ) {
    const response = await axios.get( url, { responseType: 'arraybuffer'} );
    return Buffer.from( response.data, 'binary' ); //.toString( 'base64' );
}

module.exports = {
    tweet: tweet,
    tweetWithImage: tweetWithImage
};