/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';


var argv = require('minimist')(process.argv.slice(2));

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet,buildCCPOrg2 } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'cashcard';

var walletPath;

var org1UserId;
var mspOrg1 ;
var ccp ;
var caClient ;
var wallet;	


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


async function issueCard(contract, owner,amount){
	try {
	console.log('\n--> Submit Transaction: CreateCard, issues card with ID, owner, and balance');
	let result = await contract.submitTransaction('Createcard', owner, amount);
	console.log(`*** Result committed: ${prettyJSONString(result.toString())}`);		
	}
	catch (error) {
	console.log(`*** Successfully caught the error: \n    ${error}`);
	}
}


async function getAllCards(contract, owner,amount){
	try {
	console.log('\n--> Evaluate Transaction: GetAllCards, function returns all the current issued cards in the ledger');
	let result = await contract.evaluateTransaction('GetAllcards');
	console.log(`*** Result: ${prettyJSONString(result.toString())}`);		
	}
	catch (error) {
	console.log(`*** Successfully caught the error: \n    ${error}`);
	}
}

async function readCard(contract, id){
	try {
	console.log('\n--> Evaluate Transaction: ReadCard, gets owner and balance given card ID');
	let result = await contract.evaluateTransaction('Readcard', id);
	console.log(`*** Result: ${prettyJSONString(result.toString())}`);		
	}
	catch (error) {
	console.log(`*** Successfully caught the error: \n    ${error}`);
	}
}

async function payCard(contract, id,amount){
	try {
	console.log('\n--> Submit Transaction: PayCard, pay using card');
	let result = await contract.submitTransaction('Paycard', id, amount);		
	}
	catch (error) {
	console.log(`*** Successfully caught the error: \n    ${error}`);
	}
}

async function rechargeCard(contract, id,amount){
	try {
	console.log('\n--> Submit Transaction: RechargeCard, recharge the card');
	let result = await contract.submitTransaction('Rechargecard', id, amount);		
	}
	catch (error) {
	console.log(`*** Successfully caught the error: \n    ${error}`);
	}
}

async function main() {
	if (argv.h) {
		console.log("POS terminal usage");
		console.log("node eventChain.js --POS [cash|retail] --transaction [issue|recharge|pay|balance] --user [name] --amount [value] --id [id]");
		console.log("argument \t requirement");		
		console.log("POS \t\t necessary");
		console.log("transaction \t necessary");
		console.log("user \t\t optional");
		console.log("amount \t\t optional");
		console.log("id \t\t optional");
		console.log("Examples");
		console.log("1. Issue card - Cards can only be issued in cash POS. To issue a card in the name of Poojith for an initial balance of 1000 the command would be: ");
		console.log("node eventChain.js --POS cash --transaction issue --user Poojith --amount 1000");
		console.log("");
		console.log("2. Recharge card - Cards can only be recharged in cash POS. To recharge a card with ID 4 for 1000 the command would be:");
		console.log("node eventChain.js --POS cash --transaction recharge --id 4 --amount 1000");
		console.log("");
		console.log("3. Pay - Cards can only be used in Retail POS. To pay 500 using card with ID 4, the command would be");
		console.log("node eventChain.js --POS retail --transaction pay --id 4 --amount 500");
		console.log("");
		console.log("4. Balance - To check balance of card with ID 4");
		console.log("node eventChain.js --POS cash --transaction balance --id 4");
		
	}

	else {
		try {

		if (argv.POS == 'cash'){
			org1UserId = 'cashPOS1';
			mspOrg1 = 'Org1MSP';
			// build an in memory object with the network configuration (also known as a connection profile)
			ccp = buildCCPOrg1();
			// build an instance of the fabric ca services client based on
			// the information in the network configuration
			caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
			// setup the wallet to hold the credentials of the application user
			walletPath = path.join(__dirname, 'wallet_cash');
			wallet = await buildWallet(Wallets, walletPath);
			await enrollAdmin(caClient, wallet, mspOrg1);
			await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');			
			
		}
		else if (argv.POS == 'retail'){
			org1UserId = 'retailPOS1';
			mspOrg1 = 'Org2MSP';
			ccp = buildCCPOrg2();
			walletPath = path.join(__dirname, 'wallet_retail');
			caClient = buildCAClient(FabricCAServices, ccp, 'ca.org2.example.com');
			wallet = await buildWallet(Wallets, walletPath);
			await enrollAdmin(caClient, wallet, mspOrg1);
			await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org2.department1');
		}
		else {
			throw new Error("This POS is not in our blockchain - To access our blockchain visit retailPOS by '--POS retail' or cashPOS by '--POS cash'");
		}		
				

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			const contract = network.getContract(chaincodeName);
			switch (argv.transaction){
			case "issue":{
				if(!argv.user){
					throw new Error("Please enter your name by --user [name]");
				}
				if(!argv.amount){
					throw new Error("Please enter the amount by --amount [amount]");
				}
				await issueCard(contract,argv.user,argv.amount);
				break;	 
			}
			case "recharge":{
				if(!argv.id){
					throw new Error("Please enter your card id by --id [id]");
				}
				if(!argv.amount){
					throw new Error("Please enter the amount by --amount [amount]");
				}
				await rechargeCard(contract,argv.id,argv.amount);
				break;	 
			}
			case "pay":{
				if(!argv.id){
					throw new Error("Please enter your card id by --id [id]");
				}
				if(!argv.amount){
					throw new Error("Please enter the amount by --amount [amount]");
				}
				await payCard(contract,argv.id,argv.amount);
				break;	 
			}	
			case "balance":{
				if(!argv.id){
					throw new Error("Please enter your card id by --id [id]");
				}
				await readCard(contract,argv.id);
				break;	 
			}
			default :{
				throw new Error("Please request a valid transaction. Refer help by running 'node eventChain.js -h'");
			}	
}
			


		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
	}
}

main();
