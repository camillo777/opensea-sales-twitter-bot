//import { ethers } from 'ethers'
import knex from 'knex';

export default class SellsDB {

    tag = 'SellsDB'

    constructor() {
        this.db = knex({
            client: 'sqlite3',
            connection: {
                filename: "./mydb.sqlite"
            }
        });
    }

    async init( address ) {
        console.log( this.tag, 'init' );

        const tableName = `sells_${address}`;

        if (! await this.db.schema.hasTable( tableName ) ) {
            console.log( this.tag, `create table ${tableName}` );
            await this.db.schema.createTable( tableName, function (table) {
                table.uuid('id')
                table.primary('id')
                table.string('name')
                table.string('address')
                table.integer('nonce')
                table.string('amount')
            });

        }
/*
        if (! await this.db.schema.hasTable('rooms') ) {
            console.log( this.tag, 'create table rooms' );
            await this.db.schema.createTable('rooms', function (table) {
                table.uuid('id');
                table.primary('id')
                table.string('name');
                table.jsonb('state')
                table.integer('maxUsers')
            });
        }

        if (! await this.db.schema.hasTable('rooms_users') ) {
            console.log( this.tag, 'create table rooms_users' );
            await this.db.schema.createTable('rooms_users', function (table) {
                
                table.uuid('id_user');
                table.foreign('id_user').references('id').inTable('users')

                table.uuid('id_room');
                table.foreign('id_room').references('id').inTable('rooms')

                table.primary( 'id_user', 'id_room' )
            });
        }

        if (! await this.db.schema.hasTable('app_config') ) {
            console.log( this.tag, 'create table app_config' );
            await this.db.schema.createTable('app_config', function (table) {
                table.string('id');
                table.primary('id')

                table.integer('val_int')
            });
            await this.db( 'app_config' ).insert( { 
                id: 'last_block_number',
                val_int: 0
            })
        }
*/

    }

    async getLastBlockNumber() {
        console.log( this.tag, 'getLastBlockNumber' )
        let result = await this.db( 'app_config' )
            .where( 'id', 'last_block_number' )
        if (!result || result.length==0) throw 'Field last_block_number not found in DB'
        console.log( this.tag, result )
        return result[0].val_int
    }
    async setLastBlockNumber( lastBlockNumber ) {
        console.log( this.tag, 'setLastBlockNumber', lastBlockNumber)
        await this.db( 'app_config' )
            .where( 'id', 'last_block_number' )
            .update( 'val_int', lastBlockNumber );
    }

    async getUsers() {
        console.log( this.tag, 'getUsers' );
        let users = await this.db('users');
        return users.map( (user) => User.fromJSON( user ) );
    }

    async getUser( userID ) {
        console.log( this.tag, 'getUser', userID );
        let users = await this.db('users').where('id', userID );
        if (!users || users.length==0) return null;
        return User.fromJSON( users[0] );
    }
    async getUserByAddress( userAddress ) {
        console.log( this.tag, 'getUserByAddress', userAddress );
        let users = await this.db( 'users' ).where( 'address', userAddress );
        console.log( this.tag, 'Users', users )
        if (!users || users.length==0) return null;
        return User.fromJSON( users[0] );
    }

    async userExists( userID ) {
        console.log( this.tag, 'userExists', userID );
        let user = await this.db('users').where('id', userID );
        return user.length > 0;
    }
    async userExistsByAddress( userAddress ) {
        console.log( this.tag, 'userExistsByAddress', userAddress );
        let user = await this.db('users').where('address', userAddress );
        console.log( this.tag, user )
        return user.length > 0;
    }

    async getCount() {
        console.log( this.tag, 'getCount' )
        let result = await this.db( 'users' ).count( 'id', {as: 'count'} );
        console.log( this.tag, result ); // [ { count: 0 } ]
        return result[0].count;
    }

    async add( userAddress ) {
        console.log( this.tag, 'add', userAddress );
        //let user = await this.userExistsByAddress( userAddress )
        //if ( !user ) {
        console.log( this.tag, `adding user ${userAddress}` )
        await this.db('users').insert({
            id: userAddress,
            address: userAddress,
            nonce: this.generateNonce(),
            amount: ethers.BigNumber.from(0)
        }); //, ['id'])
        //}
        //console.log( result )
        //return result.id;
    }

    generateNonce() { 
        console.log( this.tag, 'generateNonce' );
        return Math.floor(Math.random() * 1000000); 
    }

    async updateUserNonce( userID ) {
        console.log( this.tag, 'updateUserNonce' );
        await this.db( 'users' )
            .where({ id: userID })
            .update( 'nonce', this.generateNonce() );
    }

    async getUserAmount( userID ) {
        console.log( this.tag, 'getUserAmount', userID );
        let user = await this.getUser( userID );
        return user.amount;
    }

    async addUserAmount( userID, amount ) {
        console.log( this.tag, 'addUserAmount', userID, amount );
        assert( ethers.BigNumber.isBigNumber( amount ) );
        let userAmount = await this.getUserAmount( userID );
        assert( ethers.BigNumber.isBigNumber( userAmount ) );
        let newAmount = userAmount.add( amount )
        await this.db('users')
            .where('id', userID)
            .update('amount', newAmount)
    }

    async removeUserAmount( userID, amount ) {
        console.log( this.tag, 'removeUserAmount', userID, amount );
        assert( ethers.BigNumber.isBigNumber( amount ) );
        let userAmount = await this.getUserAmount( userID );
        assert( ethers.BigNumber.isBigNumber( userAmount ) );
        let newAmount = userAmount.sub( amount )
        await this.db('users')
            .where('id', userID)
            .update('amount', newAmount)
    }

/*
    async joinRoom( userID, roomID ) {
        console.log( this.tag, 'joinRoom', userID, roomID );
        var user = await this.getUser( userID );
        await user.joinRoom( roomID );
        await this.db.write();
    }

    async getUserRooms( userID ) {
        console.log( this.tag, 'getUserRooms', userID );
        var user = await this.getUser( userID );
        return user.rooms;
    }

    
*/
}