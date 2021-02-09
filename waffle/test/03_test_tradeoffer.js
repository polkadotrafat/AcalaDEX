var RTOK = artifacts.require("./RTOK.sol");
var STOK = artifacts.require("./STOK.sol");
var DEX = artifacts.require("./DEX.sol");

contract("Trade Offers", async accounts => {
    it("Create and print out order book", async () => {
        // deploy RTOK and STOK
        let rtokinstance = await RTOK.deployed();
        const rtokenAddress = rtokinstance.address;

        let stokinstance = await STOK.deployed();
        const stokenAddress = stokinstance.address;

        // Create exchange

        let exchange = await DEX.deployed();
        const exchangeAddress = exchange.address;

        // Add Token to exchange

        let txTokenAdded = await exchange.addToken(rtokenAddress,"RTOKEN","RTOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        txTokenAdded = await exchange.addToken(stokenAddress,"STOKEN","STOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        //Create Token Pair

        await exchange.createTokenPair(rtokenAddress,stokenAddress);

        // Transfer RTOK from account 0 to 1

        let txamount = "1000000000000000000000";

        await rtokinstance.transfer(accounts[1],txamount, {from: accounts[0]});

        // Transfer STOK from account 0 to 2

        await stokinstance.transfer(accounts[2],txamount, {from: accounts[0]});

        //console.log(tokenAddress);

        let sellAmount = "100000000000000000000";
        let buyAmount = "200000000000000000000";

        // Account 1 approves sellAmount of RTK and creates a tradeoffer 

        await rtokinstance.approve(exchangeAddress,sellAmount,{from: accounts[1]});

        let txTrade1 = await exchange.tradeOffer(rtokenAddress,sellAmount,stokenAddress,buyAmount,{from: accounts[1]});

        assert.equal(txTrade1.logs[0].event,"OrderAddedToMarketEscrow","OrderAddedToMarketEscrow Event Emit Failure");
        
        let offers = await exchange.getOfferPerId(1);
        //console.log(offers[0],offers[1].toString(),offers[2],offers[3].toString());
        assert.equal(offers[0],rtokenAddress,"RTOKEN Address doesn't match");
        assert.equal(offers[2],stokenAddress,"STOKEN Address doesn't match");
        assert.equal(offers[1].toString(),sellAmount,"Sell Amount doesn't match");
        assert.equal(offers[3].toString(),buyAmount,"Buy Amount doesn't match");

        // Account 2 approves sellAmount of STK and creates a tradeoffer 

        sellAmount = "300000000000000000000";
        buyAmount = "250000000000000000000";

        await stokinstance.approve(exchangeAddress,sellAmount,{from: accounts[2]});

        let txTrade2 = await exchange.tradeOffer(stokenAddress,sellAmount,rtokenAddress,buyAmount,{from: accounts[2]});

        assert.equal(txTrade2.logs[0].event,"OrderAddedToMarketEscrow","OrderAddedToMarketEscrow Event Emit Failure");

        offerId = await exchange.getOfferSize(rtokenAddress,stokenAddress);

        //console.log(offerId.toString().toNumber());
        
        offers = await exchange.getOfferPerId(2);
        //console.log(offers[0],offers[1].toString(),offers[2],offers[3].toString());
        assert.equal(offers[0],stokenAddress,"STOKEN Address doesn't match");
        assert.equal(offers[2],rtokenAddress,"RTOKEN Address doesn't match");
        assert.equal(offers[1].toString(),sellAmount,"Sell Amount doesn't match");
        assert.equal(offers[3].toString(),buyAmount,"Buy Amount doesn't match");
    });
})