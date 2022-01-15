var config = {};

config.twitter = {};
//config.redis = {};
//config.web = {};
config.opensea = {};

config.opensea.collection_slug = '';
config.opensea.collections = [
    {
        // Winter Bears
        address: '0xC8BcbE0E8ae36D8f9238cd320ef6dE88784B1734',
        url: 'https://www.winterbearsnft.com',
        opensea_url: 'https://opensea.io/collection/winterbears',
        name: 'Winter Bears',
        slug: 'winterbears',
        ref: 'winterbears',
        stats_msecs: 1000*60*60*8 // 8h
    },
    {
        // Summer Bears
        address: '0xE5Ba25f22A20a22fb47DADF137f33fE2E9AB22AC',
        url: 'https://www.winterbearsnft.com',
        opensea_url: 'https://opensea.io/collection/summerbears',
        name: 'Summer Bears',
        slug: 'summerbears',
        ref: 'summerbears',
        stats_msecs: 1000*60*60*24 // 24h
    },
    {
        // 3D Bears
        address: '0xf1ee7548c02f6F53b41c3397Bd052131A3472CC7',
        url: 'https://www.3dbears.xyz',
        opensea_url: 'https://opensea.io/collection/3dbears',
        name: '3D Bears',
        slug: '3dbears',
        ref: '3dbears',
        stats_msecs: 1000*60*60*11 // 10h
    }
];

config.sleep_time_msecs = 60000
config.sleep_secs_btw_posts = 10
config.sleep_secs_btw_collections = 10

config.mail = {}
config.mail.to = 'camillo777@gmail.com'
config.mail.smtp = 'smtp.gmail.com'
config.mail.port = 587

//config.stats_elapsed_msecs = 1000*60*5; //1000*60*60*24;
config.tags = ['NFT','NFTCollection','NFTCommunity'];

//config.default_stuff =  ['red','green','blue','apple','yellow','orange','politics'];
//config.twitter.user_name = process.env.TWITTER_USER || 'username';
//config.twitter.password=  process.env.TWITTER_PASSWORD || 'password';

/*
config.redis.uri = process.env.DUOSTACK_DB_REDIS;
config.redis.host = 'hostname';
config.redis.port = 6379;
config.web.port = process.env.WEB_PORT || 9980;
*/

module.exports = config;