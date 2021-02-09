var RTOK = artifacts.require("./RTOK.sol");
var STOK = artifacts.require("./STOK.sol");
var TTOK = artifacts.require("./TTOK.sol");
var UTOK = artifacts.require("./UTOK.sol");
var VTOK = artifacts.require("./VTOK.sol");
var DEX = artifacts.require("./DEX.sol");

contract("Trades", async accounts => {
    it("Trading Test", async () => {
        // deploy RTOK, sTOK, TTOK, UTOK and VTOK
        let rtokinstance = await RTOK.deployed();
        const rtokenAddress = rtokinstance.address;

        let stokinstance = await STOK.deployed();
        const stokenAddress = stokinstance.address;

        let ttokinstance = await TTOK.deployed();
        const ttokenAddress = ttokinstance.address;

        let utokinstance = await UTOK.deployed();
        const utokenAddress = utokinstance.address;

        let vtokinstance = await VTOK.deployed();
        const vtokenAddress = vtokinstance.address;

        // Create exchange

        let exchange = await DEX.deployed();
        const exchangeAddress = exchange.address;

        // Add Tokens to exchange

        let txTokenAdded = await exchange.addToken(rtokenAddress,"RTOKEN","RTOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        txTokenAdded = await exchange.addToken(stokenAddress,"STOKEN","STOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        txTokenAdded = await exchange.addToken(ttokenAddress,"TTOKEN","TTOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        txTokenAdded = await exchange.addToken(utokenAddress,"UTOKEN","UTOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        txTokenAdded = await exchange.addToken(vtokenAddress,"VTOKEN","VTOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        // Create 3 Token Pairs

        await exchange.createTokenPair(rtokenAddress,stokenAddress);
        await exchange.createTokenPair(rtokenAddress,ttokenAddress);
        await exchange.createTokenPair(stokenAddress,ttokenAddress);

        // Check if the 3 pairs exist and a 4th one that shouldn't exist

        let rscheck = await exchange.pairList(rtokenAddress,stokenAddress);
        assert.equal(rscheck,true,"Pair should exist");

        rscheck = await exchange.pairList(rtokenAddress,ttokenAddress);
        assert.equal(rscheck,true,"Pair should exist");

        rscheck = await exchange.pairList(stokenAddress,ttokenAddress);
        assert.equal(rscheck,true,"Pair should exist");

        rscheck = await exchange.pairList(utokenAddress,stokenAddress);
        assert.equal(rscheck,false,"Pair shouldn't exist");

        // Transfer RTOK from account 0 to 1

        let txamount = "1000000000000000000000";

        await rtokinstance.transfer(accounts[1],txamount, {from: accounts[0]});

        // Transfer STOK from account 0 to 2

        txamount = "1000000000000000000000";

        await stokinstance.transfer(accounts[2],txamount, {from: accounts[0]});

        // Transfer TTOK from account 0 to 3

        txamount = "1000000000000000000000";

        await ttokinstance.transfer(accounts[3],txamount, {from: accounts[0]});

        // Transfer UTOK from account 0 to 4

        txamount = "1000000000000000000000";

        await utokinstance.transfer(accounts[4],txamount, {from: accounts[0]});

        // Transfer VTOK from account 0 to 5

        txamount = "1000000000000000000000";

        await vtokinstance.transfer(accounts[5],txamount, {from: accounts[0]});

        // Initial Balances of Account 1

        let balance = await rtokinstance.balanceOf(accounts[1]);
        assert.equal(balance.toString(),"1000000000000000000000","Balance should be equal to initial amount");

        balance = await stokinstance.balanceOf(accounts[1]);
        assert.equal(balance.toString(),"0","Balance should be equal to zero");

        balance = await rtokinstance.balanceOf(accounts[2]);
        assert.equal(balance.toString(),"0","Balance should be equal to zero");

        balance = await stokinstance.balanceOf(accounts[2]);
        assert.equal(balance.toString(),"1000000000000000000000","Balance should be equal to initial amount");

        // Account 1 creates an order of 1/2 RTOK/STOK with 100 RTOK
        
        let sellAmount = "300000000000000000000";

        await rtokinstance.approve(exchangeAddress,sellAmount,{from: accounts[1]});

        let sellAmount1 = "100000000000000000000";
        let buyAmount1 = "150000000000000000000";

        let txTrade1 = await exchange.tradeOffer(rtokenAddress,sellAmount1,stokenAddress,buyAmount1,{from: accounts[1]});

        let sellAmount2 = "100000000000000000000";
        let buyAmount2 = "200000000000000000000";

        txTrade1 = await exchange.tradeOffer(rtokenAddress,sellAmount2,stokenAddress,buyAmount2,{from: accounts[1]});

        let sellAmount3 = "100000000000000000000";
        let buyAmount3 = "250000000000000000000";

        txTrade1 = await exchange.tradeOffer(rtokenAddress,sellAmount3,stokenAddress,buyAmount3,{from: accounts[1]});

        let offerSize = await exchange.getOfferSize(rtokenAddress,stokenAddress);

        let offerId = await exchange.getBestOffer(rtokenAddress,stokenAddress);
        assert.equal(offerSize.toNumber(),3,"Offer size should be 3");
        assert.equal(offerId.toNumber(),1,"Offer size should be 1");

        let offers;

        if (offerSize.toNumber() > 0) {
            //console.log("Order Book");
            offers = await exchange.getOfferPerId(offerId.toNumber());
            //console.log(offerId.toNumber(),offers[0],offers[1].toString(),offers[2],offers[3].toString());

            for(let i = 1; i < offerSize.toNumber(); ++i) {
                offerId = await exchange.getPrevOffer(offerId.toNumber());
                offers = await exchange.getOfferPerId(offerId.toNumber());
                //console.log(offerId.toNumber(),offers[0],offers[1].toString(),offers[2],offers[3].toString());
            }
        }

        
        //console.log(offers[0],offers[1].toString(),offers[2],offers[3].toString());

        //console.log(txTrade1);

        // Account 2 creates an order of 1/2 RTOK/STOK with 100 STOK

        sellAmount = "585000000000000000000";

        await stokinstance.approve(exchangeAddress,sellAmount,{from: accounts[2]});

        sellAmount1 = "300000000000000000000";
        buyAmount1 = "150000000000000000000";

        let txTrade2 = await exchange.tradeOffer(stokenAddress,sellAmount1,rtokenAddress,buyAmount1,{from: accounts[2]});

        sellAmount2 = "160000000000000000000";
        buyAmount2 = "80000000000000000000";

        txTrade2 = await exchange.tradeOffer(stokenAddress,sellAmount2,rtokenAddress,buyAmount2,{from: accounts[2]});

        sellAmount3 = "125000000000000000000";
        buyAmount3 = "50000000000000000000";

        txTrade2 = await exchange.tradeOffer(stokenAddress,sellAmount3,rtokenAddress,buyAmount3,{from: accounts[2]});


        //offerId = await exchange.getOfferSize(stokenAddress,rtokenAddress);

        //offers = await exchange.getOfferPerId(offerId.toNumber());
        //console.log(offers[0],offers[1].toString(),offers[2],offers[3].toString());

        //console.log(txTrade2);

        offerSize = await exchange.getOfferSize(rtokenAddress,stokenAddress);

        offerId = await exchange.getBestOffer(rtokenAddress,stokenAddress);

        assert.equal(offerSize.toNumber(),1,"Offer size should be 1");
        assert.equal(offerId.toNumber(),3,"Offer size should be 3");

        if (offerSize.toNumber() > 0) {
            //console.log("Post-Trade Order Book");
            offers = await exchange.getOfferPerId(offerId.toNumber());
            //console.log(offerId.toNumber(),offers[0],offers[1].toString(),offers[2],offers[3].toString());

            for(let i = 1; i < offerSize.toNumber(); ++i) {
                offerId = await exchange.getPrevOffer(offerId.toNumber());
                offers = await exchange.getOfferPerId(offerId.toNumber());
                //console.log(offerId.toNumber(),offers[0],offers[1].toString(),offers[2],offers[3].toString());
            }
        }

        offerSize = await exchange.getOfferSize(stokenAddress,rtokenAddress);

        offerId = await exchange.getBestOffer(stokenAddress,rtokenAddress);

        assert.equal(offerSize.toNumber(),1,"Offer size should be 1");
        assert.equal(offerId.toNumber(),4,"Offer size should be 4");

        if (offerSize.toNumber() > 0) {
            //console.log("Post-Trade Order Book");
            offers = await exchange.getOfferPerId(offerId.toNumber());
            //console.log(offerId.toNumber(),offers[0],offers[1].toString(),offers[2],offers[3].toString());

            for(let i = 1; i < offerSize.toNumber(); ++i) {
                offerId = await exchange.getPrevOffer(offerId.toNumber());
                offers = await exchange.getOfferPerId(offerId.toNumber());
                //console.log(offerId.toNumber(),offers[0],offers[1].toString(),offers[2],offers[3].toString());
            }
        }

        // Final Balances of Account 1

        balance = await rtokinstance.balanceOf(accounts[1]);
        assert.equal(balance.toString(),"700000000000000000000","Balance should be equal to 700000000000000000000");

        balance = await stokinstance.balanceOf(accounts[1]);
        assert.equal(balance.toString(),"475000000000000000000","Balance should be equal to 475000000000000000000");

        balance = await rtokinstance.balanceOf(accounts[2]);
        assert.equal(balance.toString(),"250000000000000000000","Balance should be equal to 250000000000000000000");

        balance = await stokinstance.balanceOf(accounts[2]);
        assert.equal(balance.toString(),"465000000000000000000","Balance should be equal to 465000000000000000000");

        //Cancel All the outstanding trades

        //RTOK-STOK trades

        offerSize = await exchange.getOfferSize(rtokenAddress,stokenAddress);

        if (offerSize.toNumber() > 0) {
            offerId = await exchange.getBestOffer(rtokenAddress,stokenAddress);
            let success = await exchange.cancelOffer(offerId.toNumber(),{from: accounts[1]});
            //console.log(success.logs[0].event);
            for(let i = 1; i < offerSize.toNumber(); ++i) {
                offerId = await exchange.getPrevOffer(offerId.toNumber());
                success = await exchange.cancelOffer(offerId.toNumber(),{from: accounts[1]});
            }
        }

        //STOK-RTOK trades

        offerSize = await exchange.getOfferSize(stokenAddress,rtokenAddress);

        if (offerSize.toNumber() > 0) {
            offerId = await exchange.getBestOffer(stokenAddress,rtokenAddress);
            let success = await exchange.cancelOffer(offerId.toNumber(),{from: accounts[2]});
            //console.log(success.logs[0].event);
            for(let i = 1; i < offerSize.toNumber(); ++i) {
                offerId = await exchange.getPrevOffer(offerId.toNumber());
                success = await exchange.cancelOffer(offerId.toNumber(),{from: accounts[2]});
                //console.log(success);
            }
        }

        offerSize = await exchange.getOfferSize(rtokenAddress,stokenAddress);

        offerId = await exchange.getBestOffer(rtokenAddress,stokenAddress);

        assert.equal(offerSize.toNumber(),0,"Offer size should be 0");
        assert.equal(offerId.toNumber(),0,"Offer size should be 0");

        offerSize = await exchange.getOfferSize(stokenAddress,rtokenAddress);

        offerId = await exchange.getBestOffer(stokenAddress,rtokenAddress);

        assert.equal(offerSize.toNumber(),0,"Offer size should be 0");
        assert.equal(offerId.toNumber(),0,"Offer size should be 0");

        // Final Balances of Account 1

        balance = await rtokinstance.balanceOf(accounts[1]);
        assert.equal(balance.toString(),"750000000000000000000","Balance should be equal to 750000000000000000000");

        balance = await stokinstance.balanceOf(accounts[1]);
        assert.equal(balance.toString(),"475000000000000000000","Balance should be equal to 475000000000000000000");

        balance = await rtokinstance.balanceOf(accounts[2]);
        assert.equal(balance.toString(),"250000000000000000000","Balance should be equal to 250000000000000000000");

        balance = await stokinstance.balanceOf(accounts[2]);
        assert.equal(balance.toString(),"525000000000000000000","Balance should be equal to 525000000000000000000");
    });
})