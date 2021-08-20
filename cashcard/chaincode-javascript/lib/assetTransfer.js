/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

	constructor() {
        super();
        this.cardID = 0;
    }

    async InitLedger(ctx) {
        const cards = [
            {
                ID: this.getCardID(),
                Owner: 'Poojith',
                Balance: 300,
            },
            {
                ID: this.getCardID(),
                Owner: 'Abhishek',
                Balance: 400,
            },
            {
                ID: this.getCardID(),
                Owner: 'Abhijith',
                Balance: 500,
            },
            {
                ID: this.getCardID(),
                Owner: 'Sumanth',
                Balance: 600,
            },
            {
                ID: this.getCardID(),
                Owner: 'Ramesh',
                Balance: 700,
            },

        ];	
        for (const card of cards) {
            await ctx.stub.putState(card.ID, Buffer.from(JSON.stringify(card)));
            console.info(`card ${card.ID} initialized`);
        }
    }

    // Createcard issues a new card to the world state with given details.
    async Createcard(ctx, owner, balance) {
	if (ctx.clientIdentity.getMSPID() != 'Org1MSP'){
            throw new Error("This POS cannot issue cards");
        }
	var id = this.getCardID();
        const card = {
            ID: id,
            Owner: owner,
            Balance: balance,
        };
        ctx.stub.putState(id, Buffer.from(JSON.stringify(card)));
        return JSON.stringify(card);
    }

    // Readcard returns the card stored in the world state with given id.
    async Readcard(ctx, id) {
        const cardJSON = await ctx.stub.getState(id); // get the card from chaincode state
        if (!cardJSON || cardJSON.length === 0) {
            throw new Error(`The card ${id} does not exist`);
        }
        return cardJSON.toString();
    }

    // Updatecard updates an existing card in the world state with provided parameters.
    async Updatecard(ctx, id, owner, balance) {
        const exists = await this.cardExists(ctx, id);
        if (!exists) {
            throw new Error(`The card ${id} does not exist`);
        }

        // overwriting original card with new card
        const card = {
            ID: id,
            Owner: owner,
            Balance: balance,
        };

        return ctx.stub.putState(id, Buffer.from(JSON.stringify(card)));
    }

    async Paycard(ctx, id, value) {
	if (ctx.clientIdentity.getMSPID() == 'Org1MSP'){
            throw new Error("This POS is only for issuing and recharging cards");
        }
        const exists = await this.cardExists(ctx, id);
        if (!exists) {
            throw new Error(`The card ${id} does not exist`);
        }
	
	const cardJSON = JSON.parse(await ctx.stub.getState(id));
	console.log(cardJSON);
	console.log(cardJSON.Balance);
	if (parseInt(cardJSON.Balance) < parseInt(value)) {
            throw new Error(`The card ${id} does not have sufficient balance`);
        }
	if (parseInt(value) < 0) {
            throw new Error(`Invalid Transaction. Amount needs to be greater than 0`);
        }
	var balance = (parseInt(cardJSON.Balance) - parseInt(value)).toString();
	
        return await this.Updatecard(ctx, id, cardJSON.Owner, balance);
    }

	async Rechargecard(ctx, id, value) {
	if (ctx.clientIdentity.getMSPID() != 'Org1MSP'){
            throw new Error("This POS does not have access to recharge cards");
        }

        const exists = await this.cardExists(ctx, id);
        if (!exists) {
            throw new Error(`The card ${id} does not exist`);
        }
	
	const cardJSON = JSON.parse(await ctx.stub.getState(id));
	var balance = (parseInt(cardJSON.Balance) + parseInt(value)).toString();
	
        return await this.Updatecard(ctx, id, cardJSON.Owner, balance);
    }

    // Deletecard deletes an given card from the world state.
    async Deletecard(ctx, id) {
	if (ctx.clientIdentity.getMSPID() != 'Org1MSP'){
            throw new Error("This POS does not have access to delete cards");
        }

        const exists = await this.cardExists(ctx, id);
        if (!exists) {
            throw new Error(`The card ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // cardExists returns true when card with given ID exists in world state.
    async cardExists(ctx, id) {
        const cardJSON = await ctx.stub.getState(id);
        return cardJSON && cardJSON.length > 0;
    }

	


    // GetAllcards returns all cards found in the world state.
    async GetAllcards(ctx) {
	if (ctx.clientIdentity.getMSPID() != 'Org1MSP'){
            throw new Error("This user does not have access to search for cards");
        }
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all cards in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: result.value.key, Record: record });
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

	getCardID(){
	this.cardID ++;
	return this.cardID.toString();	
	}

}

module.exports = AssetTransfer;
