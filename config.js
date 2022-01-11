var config = {};

config.twitter = {};
//config.redis = {};
//config.web = {};
config.opensea = {};

config.opensea.collection_slug = '';
config.opensea.collection_address = '0xC8BcbE0E8ae36D8f9238cd320ef6dE88784B1734';

config.default_stuff =  ['red','green','blue','apple','yellow','orange','politics'];
config.twitter.user_name = process.env.TWITTER_USER || 'username';
config.twitter.password=  process.env.TWITTER_PASSWORD || 'password';

/*
config.redis.uri = process.env.DUOSTACK_DB_REDIS;
config.redis.host = 'hostname';
config.redis.port = 6379;
config.web.port = process.env.WEB_PORT || 9980;
*/

module.exports = config;