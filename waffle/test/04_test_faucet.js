const _deploy_contracts = require("../migrations/2_deploy_contracts");

var RTOK = artifacts.require("./RTOK.sol");
var STOK = artifacts.require("./STOK.sol");
var TTOK = artifacts.require("./TTOK.sol");
var UTOK = artifacts.require("./UTOK.sol");
var VTOK = artifacts.require("./VTOK.sol");
var faucet = artifacts.require("./faucet.sol");

contract("Faucet Tests", async accounts => {
    it("Create the Faucet and dispense funds", async () => {
        // deploy all 5 tokens
        let rtokinstance = await RTOK.deployed();
        const rtokenAddress = rtokinstance.address;

        let stokinstance = await STOK.deployed();
        const stokenAddress = stokinstance.address;

        // deploy RTOK and STOK
        let ttokinstance = await TTOK.deployed();
        const ttokenAddress = ttokinstance.address;

        let utokinstance = await UTOK.deployed();
        const utokenAddress = utokinstance.address;

        let vtokinstance = await VTOK.deployed();
        const vtokenAddress = vtokinstance.address;

        //create faucet

        let faucetInstance = await faucet.deployed();
        const faucetAddress = faucetInstance.address;

        // Add Tokens to faucet

        let txTokenAdded = await faucetInstance.addToken(rtokenAddress,"RTOKEN","RTOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        txTokenAdded = await faucetInstance.addToken(stokenAddress,"STOKEN","STOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        txTokenAdded = await faucetInstance.addToken(ttokenAddress,"TTOKEN","TTOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        txTokenAdded = await faucetInstance.addToken(utokenAddress,"UTOKEN","UTOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        txTokenAdded = await faucetInstance.addToken(vtokenAddress,"VTOKEN","VTOK", {from: accounts[0]});
        assert.equal(txTokenAdded.logs[0].event,"TokenAdded","TokenAdded Event Emit Failure");

        // Approve and send half of all minted tokens to the faucet

        let tokenAmount = "5000000000000000000000000";

        await rtokinstance.approve(faucetAddress,tokenAmount);
        await stokinstance.approve(faucetAddress,tokenAmount);
        await ttokinstance.approve(faucetAddress,tokenAmount);
        await utokinstance.approve(faucetAddress,tokenAmount);
        await vtokinstance.approve(faucetAddress,tokenAmount);

        let txDeposit = await faucetInstance.depositToken(rtokenAddress,tokenAmount);
        assert.equal(txDeposit.logs[0].event,"TokenDeposited","TokenDeposited Event Emit Failure");

        txDeposit = await faucetInstance.depositToken(stokenAddress,tokenAmount);
        assert.equal(txDeposit.logs[0].event,"TokenDeposited","TokenDeposited Event Emit Failure");

        txDeposit = await faucetInstance.depositToken(ttokenAddress,tokenAmount);
        assert.equal(txDeposit.logs[0].event,"TokenDeposited","TokenDeposited Event Emit Failure");

        txDeposit = await faucetInstance.depositToken(utokenAddress,tokenAmount);
        assert.equal(txDeposit.logs[0].event,"TokenDeposited","TokenDeposited Event Emit Failure");

        txDeposit = await faucetInstance.depositToken(vtokenAddress,tokenAmount);
        assert.equal(txDeposit.logs[0].event,"TokenDeposited","TokenDeposited Event Emit Failure");

        let interimBalance = await faucetInstance.getTokenBalance(rtokenAddress);
        assert.equal("5000000000000000000000000",interimBalance.toString(),"Post Deposit Token Balance should be 5000000000000000000000000");

        interimBalance = await faucetInstance.getTokenBalance(stokenAddress);
        assert.equal("5000000000000000000000000",interimBalance.toString(),"Post Deposit Token Balance should be 5000000000000000000000000");

        interimBalance = await faucetInstance.getTokenBalance(ttokenAddress);
        assert.equal("5000000000000000000000000",interimBalance.toString(),"Post Deposit Token Balance should be 5000000000000000000000000");

        interimBalance = await faucetInstance.getTokenBalance(utokenAddress);
        assert.equal("5000000000000000000000000",interimBalance.toString(),"Post Deposit Token Balance should be 5000000000000000000000000");

        interimBalance = await faucetInstance.getTokenBalance(vtokenAddress);
        assert.equal("5000000000000000000000000",interimBalance.toString(),"Post Deposit Token Balance should be 5000000000000000000000000");

        // Withdraw Tokens

        let txWithdraw = await faucetInstance.withdraw({from: accounts[1]});
        assert.equal(txWithdraw.logs[0].event,"TokenWithdrawn","TokenWithdrawn Event Emit Failure");

        // Check Token Balances

        let finalBalance = await faucetInstance.getTokenBalance(rtokenAddress);
        assert.equal("4999000000000000000000000",finalBalance.toString(),"Post Withdrawal Balance should be 4999000000000000000000000");
        //console.log("Final balance",finalBalance.toString());

        finalBalance = await faucetInstance.getTokenBalance(stokenAddress);
        assert.equal("4999000000000000000000000",finalBalance.toString(),"Post Withdrawal Balance should be 4999000000000000000000000");

        finalBalance = await faucetInstance.getTokenBalance(ttokenAddress);
        assert.equal("4999000000000000000000000",finalBalance.toString(),"Post Withdrawal Balance should be 4999000000000000000000000");

        finalBalance = await faucetInstance.getTokenBalance(utokenAddress);
        assert.equal("4999000000000000000000000",finalBalance.toString(),"Post Withdrawal Balance should be 4999000000000000000000000");

        finalBalance = await faucetInstance.getTokenBalance(vtokenAddress);
        assert.equal("4999000000000000000000000",finalBalance.toString(),"Post Withdrawal Balance should be 4999000000000000000000000");

    });
});