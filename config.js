var config = {};

config.twitter = {};
//config.redis = {};
//config.web = {};
config.opensea = {};

config.opensea.collection_slug = '';
config.opensea.collection_address = '0xC8BcbE0E8ae36D8f9238cd320ef6dE88784B1734';

config.sleep_time_msecs = 60000
config.stats_elapsed_msecs = 1000*60*60*6; //1000*60*60*24;
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