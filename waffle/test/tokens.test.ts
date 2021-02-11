import { expect, use } from "chai";
import { ethers, Contract, BigNumber } from "ethers";
import { deployContract, solidity } from "ethereum-waffle";
import { evmChai } from "@acala-network/bodhi/evmChai";
import { TestAccountSigningKey, Provider, Signer } from "@acala-network/bodhi";
import { WsProvider } from "@polkadot/api";
import { createTestPairs } from "@polkadot/keyring/testingPairs";
import IERC20 from "../build/IERC20.json";
import RTOKABI from "../build/RTOK.json";
import DEX from "../build/Dex.json";

use(solidity);
use(evmChai);

const ACA_ERC20_ADDRESS = '0x0000000000000000000000000000000000000800';
const AUSD_ERC20_ADDRESS = '0x0000000000000000000000000000000000000801';
const DOT_ERC20_ADDRESS = '0x0000000000000000000000000000000000000802';
const XBTC_ERC20_ADDRESS = '0x0000000000000000000000000000000000000803';
const LDOT_ERC20_ADDRESS = '0x0000000000000000000000000000000000000804';
const RENBTC_ERC20_ADDRESS = '0x0000000000000000000000000000000000000805';

const provider = new Provider({
  provider: new WsProvider("ws://127.0.0.1:9944"),
});

const testPairs = createTestPairs();

const getWallets = async () => {
  const pairs = [
    testPairs.alice,
    testPairs.alice_stash,
    testPairs.bob,
    testPairs.bob_stash,
  ];
  const signingKey = new TestAccountSigningKey(provider.api.registry);

  signingKey.addKeyringPair(Object.values(testPairs));

  await provider.api.isReady;

  let wallets: Signer[] = [];

  for (const pair of pairs) {
    const wallet = new Signer(provider, pair.address, signingKey);

    const isClaimed = await wallet.isClaimed();

    if (!isClaimed) {
      await wallet.claimDefaultAccount();
    }

    wallets.push(wallet);
  }

  return wallets;
};

describe("Tokens", () => {
  let wallet1: Signer;
  let wallet2: Signer;
  let wallet3: Signer;
  let DOT: Contract;
  let ACA: Contract;
  let AUSD: Contract;
  let XBTC: Contract;
  let LDOT: Contract;
  let RENBTC: Contract;
  let RTOK: Contract;
  let Exchange: Contract;
  let DOT2: Contract;
  let ACA2: Contract;
  
  before(async () => {
    [wallet1, wallet2, wallet3] = await getWallets();
    DOT = new ethers.Contract(DOT_ERC20_ADDRESS, IERC20.abi, wallet1);
    ACA = new ethers.Contract(ACA_ERC20_ADDRESS, IERC20.abi, wallet1);
    AUSD = new ethers.Contract(AUSD_ERC20_ADDRESS, IERC20.abi, wallet1);
    XBTC = new ethers.Contract(XBTC_ERC20_ADDRESS, IERC20.abi, wallet1);
    LDOT = new ethers.Contract(LDOT_ERC20_ADDRESS, IERC20.abi, wallet1);
    RENBTC = new ethers.Contract(RENBTC_ERC20_ADDRESS, IERC20.abi, wallet1);
    const supply = BigNumber.from('1000000000000000000000000');
    RTOK = await deployContract(wallet1, RTOKABI, [supply] );
    Exchange = await deployContract(wallet1, DEX, [], {gasLimit: 40000000});
    DOT2 = new ethers.Contract(DOT_ERC20_ADDRESS, IERC20.abi, wallet2);
    ACA2 = new ethers.Contract(ACA_ERC20_ADDRESS, IERC20.abi, wallet2);
  });
  
  after(async () => {
    provider.api.disconnect();
  });
  
  it("Initial balances", async () => {
    
    const wAddress1 = await wallet1.getAddress();
    console.log(wAddress1);
    const dotBalance = await DOT.balanceOf(wAddress1);
    const acaBalance = await ACA.balanceOf(wAddress1);
    const ausdBalance = await AUSD.balanceOf(wAddress1);
    const xbtcBalance = await XBTC.balanceOf(wAddress1);
    const ldotBalance = await LDOT.balanceOf(wAddress1);
    const renbtcBalance = await RENBTC.balanceOf(wAddress1);
    console.log("DOT: ",dotBalance.toString()," ACA: ",acaBalance.toString());
    console.log("AUSD: ",ausdBalance.toString()," XBTC: ",xbtcBalance.toString());
    console.log("LDOT: ",ldotBalance.toString()," RENBTC: ",renbtcBalance.toString());
    
    const wAddress2 = await wallet2.getAddress();
    console.log(wAddress2);
    const dotBalance2 = await DOT.balanceOf(wAddress2);
    const acaBalance2 = await ACA.balanceOf(wAddress2);
    const ausdBalance2 = await AUSD.balanceOf(wAddress2);
    const xbtcBalance2 = await XBTC.balanceOf(wAddress2);
    const ldotBalance2 = await LDOT.balanceOf(wAddress2);
    const renbtcBalance2 = await RENBTC.balanceOf(wAddress2);
    console.log("DOT: ",dotBalance2.toString()," ACA: ",acaBalance2.toString());
    console.log("AUSD: ",ausdBalance2.toString()," XBTC: ",xbtcBalance2.toString());
    console.log("LDOT: ",ldotBalance2.toString()," RENBTC: ",renbtcBalance2.toString());
    
    const wAddress3 = await wallet3.getAddress();
    console.log(wAddress3);
    const dotBalance3 = await DOT.balanceOf(wAddress3);
    const acaBalance3 = await ACA.balanceOf(wAddress3);
    const ausdBalance3 = await AUSD.balanceOf(wAddress3);
    const xbtcBalance3 = await XBTC.balanceOf(wAddress3);
    const ldotBalance3 = await LDOT.balanceOf(wAddress3);
    const renbtcBalance3 = await RENBTC.balanceOf(wAddress3);
    console.log("DOT: ",dotBalance3.toString()," ACA: ",acaBalance3.toString());
    console.log("AUSD: ",ausdBalance3.toString()," XBTC: ",xbtcBalance3.toString());
    console.log("LDOT: ",ldotBalance3.toString()," RENBTC: ",renbtcBalance3.toString());
  });

  it("Custom Token RTOK", async () => {
    const wAddress1 = await wallet1.getAddress();
    let rtokBalance = await RTOK.balanceOf(wAddress1);
    expect(rtokBalance.toString()).to.equal('1000000000000000000000000');
    const rtokAddress = RTOK.address;
    const totalSupply = await RTOK.totalSupply();
    expect(totalSupply.toString()).to.equal('1000000000000000000000000');
    
    const amount = BigNumber.from('1000000000000000000000');
    
    const wAddress2 = await wallet2.getAddress();
    
    const tx = await RTOK.transfer(wAddress2,amount);
    
    rtokBalance = await RTOK.balanceOf(wAddress1);
    expect(rtokBalance.toString()).to.equal('999000000000000000000000');
    rtokBalance = await RTOK.balanceOf(wAddress2);
    expect(rtokBalance.toString()).to.equal('1000000000000000000000');
    
  });

  it("Pair Tests", async () => {
    let exchangeAddress = Exchange.address;

    const txAddedACA = await Exchange.addToken(ACA_ERC20_ADDRESS,"ACALA","ACA");
    
    const txAddedDOT = await Exchange.addToken(DOT_ERC20_ADDRESS,"POLKADOT","DOT");
    
    await Exchange.createTokenPair(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);
    
    let rsCheck = await Exchange.pairList(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);
    expect(rsCheck).to.be.true;
    
    let rtCheck = await Exchange.pairList(ACA_ERC20_ADDRESS,AUSD_ERC20_ADDRESS);
    expect(rtCheck).to.be.false;
    
    // Add a third Token and create a second pair
    
    const txAddedRTOK = await Exchange.addToken(RTOK.address,"RTOKEN","RTOK");
    
    await Exchange.createTokenPair(ACA_ERC20_ADDRESS,RTOK.address);
    
    // Check Total Number of Tokens in the exchange (3)
    
    let numTokens = await Exchange.getTotalTokens();
    expect(numTokens.toString()).to.equal('3');
    
    // Check Total Number of Trading Pairs in the exchange (2)
    
    let numPairs = await Exchange.getTotalPairs();
    expect(numPairs.toString()).to.equal('2');
  });
  
  it("Trading Test", async () => {

    // Check Initial Balances
    const wAddress1 = await wallet1.getAddress();
    console.log("Initial Balance of Address : ",wAddress1);
    let dotBalance = await DOT.balanceOf(wAddress1);
    let acaBalance = await ACA.balanceOf(wAddress1);
    console.log("DOT: ",dotBalance.toString()," ACA: ",acaBalance.toString());

    const wAddress2 = await wallet2.getAddress();
    console.log("Initial Balance of Address : ",wAddress2);
    let dotBalance2 = await DOT.balanceOf(wAddress2);
    let acaBalance2 = await ACA.balanceOf(wAddress2);
    console.log("DOT: ",dotBalance2.toString()," ACA: ",acaBalance2.toString());

    let sellAmount = "300000000000000000000";
    let exchangeAddress = Exchange.address;

    // Account 1 creates multiple orders of  ACA/DOT transactions

    await ACA.approve(exchangeAddress,sellAmount);

    let sellAmount1 = "100000000000000000000";
    let buyAmount1 = "150000000000000000000";

    let txTrade1 = await Exchange.tradeOffer(ACA_ERC20_ADDRESS,sellAmount1,DOT_ERC20_ADDRESS,buyAmount1);

    let sellAmount2 = "100000000000000000000";
    let buyAmount2 = "200000000000000000000";

    txTrade1 = await Exchange.tradeOffer(ACA_ERC20_ADDRESS,sellAmount2,DOT_ERC20_ADDRESS,buyAmount2);

    let sellAmount3 = "100000000000000000000";
    let buyAmount3 = "250000000000000000000";

    txTrade1 = await Exchange.tradeOffer(ACA_ERC20_ADDRESS,sellAmount3,DOT_ERC20_ADDRESS,buyAmount3);

    let offerSize = await Exchange.getOfferSize(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);

    let offerId = await Exchange.getBestOffer(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);

    expect(offerSize.toString()).to.equal('3');
    expect(offerId.toString()).to.equal('1');

    let offers;

    if (parseInt(offerSize.toString()) > 0) {
        console.log("ACA/DOT Order Book");
        offers = await Exchange.getOfferPerId(offerId);
        console.log(offerId.toString(),offers[0],offers[1].toString(),offers[2],offers[3].toString());

        for(let i = 1; i < parseInt(offerSize.toString()); ++i) {
            offerId = await Exchange.getPrevOffer(offerId);
            offers = await Exchange.getOfferPerId(offerId);
            console.log(offerId.toString(),offers[0],offers[1].toString(),offers[2],offers[3].toString());
        }
    }

    // Account 2 creates multiple DOT/ACA orders 

    let Exchange2 = Exchange.connect(wallet2);

    sellAmount = "585000000000000000000";

    await DOT2.approve(exchangeAddress,sellAmount);

    sellAmount1 = "300000000000000000000";
    buyAmount1 = "150000000000000000000";

    let txTrade2 = await Exchange2.tradeOffer(DOT_ERC20_ADDRESS,sellAmount1,ACA_ERC20_ADDRESS,buyAmount1);

    sellAmount2 = "160000000000000000000";
    buyAmount2 = "80000000000000000000";

    txTrade2 = await Exchange2.tradeOffer(DOT_ERC20_ADDRESS,sellAmount2,ACA_ERC20_ADDRESS,buyAmount2);
    
    sellAmount3 = "125000000000000000000";
    buyAmount3 = "50000000000000000000";

    txTrade2 = await Exchange2.tradeOffer(DOT_ERC20_ADDRESS,sellAmount3,ACA_ERC20_ADDRESS,buyAmount3);

    // Post-Trade Order Books

    offerSize = await Exchange.getOfferSize(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);

    offerId = await Exchange.getBestOffer(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);

    expect(offerSize.toString()).to.equal('1');
    expect(offerId.toString()).to.equal('3');

    if (parseInt(offerSize.toString()) > 0) {
      console.log("Post-Trade ACA/DOT Order Book");
      offers = await Exchange.getOfferPerId(offerId);
      console.log(offerId.toString(),offers[0],offers[1].toString(),offers[2],offers[3].toString());

      for(let i = 1; i < parseInt(offerSize.toString()); ++i) {
          offerId = await Exchange.getPrevOffer(offerId);
          offers = await Exchange.getOfferPerId(offerId);
          console.log(offerId.toString(),offers[0],offers[1].toString(),offers[2],offers[3].toString());
      }
    }

    offerSize = await Exchange2.getOfferSize(DOT_ERC20_ADDRESS,ACA_ERC20_ADDRESS);

    offerId = await Exchange2.getBestOffer(DOT_ERC20_ADDRESS,ACA_ERC20_ADDRESS);

    expect(offerSize.toString()).to.equal('1');
    expect(offerId.toString()).to.equal('4');

    if (parseInt(offerSize.toString()) > 0) {
      console.log("Post-Trade DOT/ACA Order Book");
      offers = await Exchange2.getOfferPerId(offerId);
      console.log(offerId.toString(),offers[0],offers[1].toString(),offers[2],offers[3].toString());

      for(let i = 1; i < parseInt(offerSize.toString()); ++i) {
          offerId = await Exchange2.getPrevOffer(offerId);
          offers = await Exchange2.getOfferPerId(offerId);
          console.log(offerId.toString(),offers[0],offers[1].toString(),offers[2],offers[3].toString());
      }
    }

    // Manually Cancel all the outstanding orders

    //ACA-DOT Trade

    offerSize = await Exchange.getOfferSize(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);

    if (parseInt(offerSize.toString()) > 0) {
      offerId = await Exchange.getBestOffer(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);
      let success = await Exchange.cancelOffer(offerId);
      for(let i = 1; i < parseInt(offerSize.toString()); ++i) {
        offerId = await Exchange.getPrevOffer(offerId);
        success = await Exchange.cancelOffer(offerId);
      }
    }

    offerSize = await Exchange2.getOfferSize(DOT_ERC20_ADDRESS,ACA_ERC20_ADDRESS);

    if (parseInt(offerSize.toString()) > 0) {
      offerId = await Exchange2.getBestOffer(DOT_ERC20_ADDRESS,ACA_ERC20_ADDRESS);
      let success = await Exchange2.cancelOffer(offerId);
      for(let i = 1; i < parseInt(offerSize.toString()); ++i) {
        offerId = await Exchange2.getPrevOffer(offerId);
        success = await Exchange2.cancelOffer(offerId);
      }
    }

    //Check that all orders are cancelled

    offerSize = await Exchange.getOfferSize(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);

    offerId = await Exchange.getBestOffer(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);

    expect(offerSize.toString()).to.equal('0');
    expect(offerId.toString()).to.equal('0');

    offerSize = await Exchange2.getOfferSize(DOT_ERC20_ADDRESS,ACA_ERC20_ADDRESS);

    offerId = await Exchange2.getBestOffer(DOT_ERC20_ADDRESS,ACA_ERC20_ADDRESS);

    expect(offerSize.toString()).to.equal('0');
    expect(offerId.toString()).to.equal('0');

    // Check Final Balances

    console.log("Final Balance of Address : ",wAddress1);
    dotBalance = await DOT.balanceOf(wAddress1);
    acaBalance = await ACA.balanceOf(wAddress1);
    console.log("DOT: ",dotBalance.toString()," ACA: ",acaBalance.toString());

    console.log("Final Balance of Address : ",wAddress2);
    dotBalance2 = await DOT.balanceOf(wAddress2);
    acaBalance2 = await ACA.balanceOf(wAddress2);
    console.log("DOT: ",dotBalance2.toString()," ACA: ",acaBalance2.toString());

  });

  it("Place and Cancel Orders Test", async () => {
    let sellAmount = "300000000000000000000";
    let exchangeAddress = Exchange.address;
    // Account 1 creates multiple orders of  ACA/DOT transactions

    await ACA.approve(exchangeAddress,sellAmount);

    let sellAmount1 = "100000000000000000000";
    let buyAmount1 = "150000000000000000000";

    let txTrade1 = await Exchange.tradeOffer(ACA_ERC20_ADDRESS,sellAmount1,DOT_ERC20_ADDRESS,buyAmount1);

    let sellAmount2 = "100000000000000000000";
    let buyAmount2 = "200000000000000000000";

    txTrade1 = await Exchange.tradeOffer(ACA_ERC20_ADDRESS,sellAmount2,DOT_ERC20_ADDRESS,buyAmount2);

    let sellAmount3 = "100000000000000000000";
    let buyAmount3 = "250000000000000000000";

    txTrade1 = await Exchange.tradeOffer(ACA_ERC20_ADDRESS,sellAmount3,DOT_ERC20_ADDRESS,buyAmount3);

    let offerSize = await Exchange.getOfferSize(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);

    let offerId = await Exchange.getBestOffer(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);

    expect(offerSize.toString()).to.equal('3');
    expect(offerId.toString()).to.equal('1');

    // Account 1 checks th available orders and cancels them all

    offerSize = await Exchange.getOfferSize(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);

    if (parseInt(offerSize.toString()) > 0) {
      offerId = await Exchange.getBestOffer(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);
      let success = await Exchange.cancelOffer(offerId);
      for(let i = 1; i < parseInt(offerSize.toString()); ++i) {
        offerId = await Exchange.getPrevOffer(offerId);
        success = await Exchange.cancelOffer(offerId);
      }
    }

    offerSize = await Exchange.getOfferSize(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);

    offerId = await Exchange.getBestOffer(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);

    expect(offerSize.toString()).to.equal('0');
    expect(offerId.toString()).to.equal('0');
  })
});
