var RTOK = artifacts.require("./RTOK.sol");
var STOK = artifacts.require("./STOK.sol");
var TTOK = artifacts.require("./TTOK.sol");
var DEX = artifacts.require("./DEX.sol");

const BN = web3.utils.BN;

contract("Create Pairs",async accounts => {
    it("Create three pairs", async () => {
        // deploy RTOK, TTOK and STOK
        let rtokinstance = await RTOK.deployed();
        const rtokenAddress = rtokinstance.address;

        let stokinstance = await STOK.deployed();
        const stokenAddress = stokinstance.address;

        let ttokinstance = await TTOK.deployed();
        const ttokenAddress = ttokinstance.address;

        // Create exchange

        let exchange = await DEX.deployed();
        const exchangeAddress = exchange.address;

        // Add Token to exchange

        let txTokenAdded = await exchange.addToken(rtokenAddress,"RTOKEN","RTOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        txTokenAdded = await exchange.addToken(stokenAddress,"STOKEN","STOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        txTokenAdded = await exchange.addToken(ttokenAddress,"TTOKEN","TTOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        //Create First Token Pair

        await exchange.createTokenPair(rtokenAddress,stokenAddress);

        // Check if the pair exists

        let rscheck = await exchange.pairList(rtokenAddress,stokenAddress);
        assert.equal(rscheck,true,"Pair should exist");
        //console.log(rscheck);

        let rtcheck = await exchange.pairList(rtokenAddress,ttokenAddress);
        assert.equal(rtcheck,false,"Pair shouldn't exist");
        //console.log(rtcheck);

        // Create two more token pairs

        await exchange.createTokenPair(rtokenAddress,ttokenAddress);
        await exchange.createTokenPair(stokenAddress,ttokenAddress);

        let numTokens = await  exchange.getTotalTokens();
        assert.equal(numTokens.toNumber(),3,"Should Equal 3");

        let numPairs = await  exchange.getTotalPairs();
        assert.equal(numPairs.toNumber(),3,"Should Equal 3");

        for(let i = 1; i <= numPairs.toNumber(); ++i) {
            let pairInfo = await exchange.getPairInfo(i);
            //console.log(pairInfo[0],pairInfo[1],pairInfo[2],pairInfo[3]);
        }
    });
})