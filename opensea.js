

class ServiceOpensea {

    async getOpenseaEvents(  ) {
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
        return events;
    }

    // winterbears
    async getOpenseaStats( slug ) {
        const response = await axios.get( `https://api.opensea.io/api/v1/collection/${slug}/stats`, {
                headers: {
                    'X-API-KEY': process.env.OPENSEA_API_KEY
                },
                params: {}
            });
        
        const stats = await _.get( response, ['data', 'stats'] );
        return stats;
    }

    async getOpenseaEventsV2(  ) {
        const response = await axios.get('https://api.opensea.io/api/v1/events', {
                headers: {
                    'X-API-KEY': process.env.OPENSEA_API_KEY
                },
                params: {
                    asset_contract_address: config.opensea.collection_address,
                    //collection_slug: process.env.OPENSEA_COLLECTION_SLUG,
                    event_type: 'successful',
                    occurred_after: lastSaleTime,
                    only_opensea: 'false'
                    //offset: 0, // max: 10000
                    //limit: '300' // max: 300
                }
            });
        
            const events = await _.get( response, ['data', 'asset_events'] );
            return events;
        }

}