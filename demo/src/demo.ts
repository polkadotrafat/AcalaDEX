import { TestAccountSigningKey, Provider, Signer } from "@acala-network/bodhi";
import { WsProvider, Keyring } from "@polkadot/api";
import { createTestPairs } from "@polkadot/keyring/testingPairs";
import { KeyringPair } from "@polkadot/keyring/types";
import { Contract, ContractFactory, BigNumber } from "ethers";
import IERC20 from "../artifacts/IERC20.json";
import DEX from "../artifacts/Dex.json";

const WS_URL = process.env.WS_URL || 'ws://127.0.0.1:9944';

const ACA_ERC20_ADDRESS = '0x0000000000000000000000000000000000000800';
const DOT_ERC20_ADDRESS = '0x0000000000000000000000000000000000000802';
const UNIT = BigNumber.from('1000000000000000000');

const provider = new Provider({
    provider: new WsProvider(WS_URL),
})

const getWallets = async () => {
    const testPairs = createTestPairs();
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
}

const main = async () => {
    let wallet1: Signer;
    let wallet2: Signer;

    [wallet1, wallet2] = await getWallets();

    const address1 = wallet1.getAddress();
    const address2 = wallet2.getAddress();

    //Deploy Contracts

    const ACA = new Contract(ACA_ERC20_ADDRESS, IERC20.abi, wallet1);
    const DOT = new Contract(DOT_ERC20_ADDRESS, IERC20.abi, wallet1);
    const DOT2 = new Contract(DOT_ERC20_ADDRESS, IERC20.abi, wallet2);
    const ACA2 = new Contract(ACA_ERC20_ADDRESS, IERC20.abi, wallet2);
    const Exchange = await ContractFactory.fromSolidity(DEX).connect(wallet1).deploy(address1);

    const exchangeAddress = Exchange.address;

    console.log("Initial Balances of First Account : ",address1);
    let dotBalance = await DOT.balanceOf(address1);
    let acaBalance = await ACA.balanceOf(address1);
    console.log("DOT: ",dotBalance.div(UNIT).toNumber()," ACA: ",acaBalance.div(UNIT).toNumber());
    
    console.log("Initial Balances of Address: ",address2);
    let dotBalance2 = await DOT.balanceOf(address2);
    let acaBalance2 = await ACA.balanceOf(address2);
    console.log("DOT: ",dotBalance2.div(UNIT).toNumber()," ACA: ",acaBalance2.div(UNIT).toNumber());
    
    // Add Tokens to the Exchange and create Token Pair
    
    console.log("===Add ACA and DOT Tokens to the exchange and Create ACA/DOT Trading Pair");
    
    const txAddedACA = await Exchange.addToken(ACA_ERC20_ADDRESS,"ACALA","ACA");
    
    const txAddedDOT = await Exchange.addToken(DOT_ERC20_ADDRESS,"POLKADOT","DOT");
    
    await Exchange.createTokenPair(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);
    
    let rsCheck = await Exchange.pairList(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);
    
    console.log("Verify if the ACA/DOT Token Pair is now on the exchange :: ",rsCheck);
    
    let sellAmount = "300000000000000000000";
    
    console.log("=== First Account Approves ",BigNumber.from(sellAmount).div(UNIT).toNumber(), " ACA tokens to be sold in exchange for DOT Tokens");
    
    await ACA.approve(exchangeAddress,sellAmount);
    console.log("=== First Account Creates 3 ACA/DOT Orders");
    
    console.log("Order1 ::: 100 ACA For 150 DOT");
    let sellAmount1 = "100000000000000000000";
    let buyAmount1 = "150000000000000000000";

    let txTrade1 = await Exchange.tradeOffer(ACA_ERC20_ADDRESS,sellAmount1,DOT_ERC20_ADDRESS,buyAmount1);
    
	console.log("Order2 ::: 100 ACA For 200 DOT");
    let sellAmount2 = "100000000000000000000";
    let buyAmount2 = "200000000000000000000";

    txTrade1 = await Exchange.tradeOffer(ACA_ERC20_ADDRESS,sellAmount2,DOT_ERC20_ADDRESS,buyAmount2);
	
	console.log("Order3 ::: 100 ACA For 250 DOT");
    let sellAmount3 = "100000000000000000000";
    let buyAmount3 = "250000000000000000000";

    txTrade1 = await Exchange.tradeOffer(ACA_ERC20_ADDRESS,sellAmount3,DOT_ERC20_ADDRESS,buyAmount3);
    
    let offerSize = await Exchange.getOfferSize(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);

    let offerId = await Exchange.getBestOffer(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);
    
    let offers;

    if (parseInt(offerSize.toString()) > 0) {
        console.log("=== ACA/DOT Order Book");
        offers = await Exchange.getOfferPerId(offerId);
        console.log(offerId.toString(),offers[0],offers[1].div(UNIT).toNumber(),offers[2],offers[3].div(UNIT).toNumber());

        for(let i = 1; i < parseInt(offerSize.toString()); ++i) {
            offerId = await Exchange.getPrevOffer(offerId);
            offers = await Exchange.getOfferPerId(offerId);
            console.log(offerId.toString(),offers[0],offers[1].div(UNIT).toNumber(),offers[2],offers[3].div(UNIT).toNumber());
        }
    }
    
    let Exchange2 = Exchange.connect(wallet2);
    
    sellAmount = "585000000000000000000";
    
    console.log("=== Second Account Approves ",BigNumber.from(sellAmount).div(UNIT).toNumber(), " DOT tokens to be sold in exchange for ACA Tokens");
    
    await DOT2.approve(exchangeAddress,sellAmount);
    
    console.log("=== Second Account Creates 3 DOT/ACA Orders");
    
    console.log("Order1 ::: 300 DOT For 150 ACA");

    sellAmount1 = "300000000000000000000";
    buyAmount1 = "150000000000000000000";

    let txTrade2 = await Exchange2.tradeOffer(DOT_ERC20_ADDRESS,sellAmount1,ACA_ERC20_ADDRESS,buyAmount1);
    
    console.log("Order2 ::: 160 DOT For 80 ACA");

    sellAmount2 = "160000000000000000000";
    buyAmount2 = "80000000000000000000";

    txTrade2 = await Exchange2.tradeOffer(DOT_ERC20_ADDRESS,sellAmount2,ACA_ERC20_ADDRESS,buyAmount2);
    
    console.log("Order3 ::: 125 DOT For 50 ACA");
    
    sellAmount3 = "125000000000000000000";
    buyAmount3 = "50000000000000000000";

    txTrade2 = await Exchange2.tradeOffer(DOT_ERC20_ADDRESS,sellAmount3,ACA_ERC20_ADDRESS,buyAmount3);
    
    // Post-Trade Order Books

    offerSize = await Exchange.getOfferSize(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);

    offerId = await Exchange.getBestOffer(ACA_ERC20_ADDRESS,DOT_ERC20_ADDRESS);


    if (parseInt(offerSize.toString()) > 0) {
      console.log("=== Post-Trade ACA/DOT Order Book");
      offers = await Exchange.getOfferPerId(offerId);
      console.log(offerId.toString(),offers[0],offers[1].div(UNIT).toNumber(),offers[2],offers[3].div(UNIT).toNumber());

      for(let i = 1; i < parseInt(offerSize.toString()); ++i) {
          offerId = await Exchange.getPrevOffer(offerId);
          offers = await Exchange.getOfferPerId(offerId);
          console.log(offerId.toString(),offers[0],offers[1].div(UNIT).toNumber(),offers[2],offers[3].div(UNIT).toNumber());
      }
    }
    
    offerSize = await Exchange2.getOfferSize(DOT_ERC20_ADDRESS,ACA_ERC20_ADDRESS);

    offerId = await Exchange2.getBestOffer(DOT_ERC20_ADDRESS,ACA_ERC20_ADDRESS);


    if (parseInt(offerSize.toString()) > 0) {
      console.log("=== Post-Trade DOT/ACA Order Book");
      offers = await Exchange2.getOfferPerId(offerId);
      console.log(offerId.toString(),offers[0],offers[1].div(UNIT).toNumber(),offers[2],offers[3].div(UNIT).toNumber());

      for(let i = 1; i < parseInt(offerSize.toString()); ++i) {
          offerId = await Exchange2.getPrevOffer(offerId);
          offers = await Exchange2.getOfferPerId(offerId);
          console.log(offerId.toString(),offers[0],offers[1].div(UNIT).toNumber(),offers[2],offers[3].div(UNIT).toNumber());
      }
    }
    console.log("===Trade Offer ID 1 and 2 were completely fulfilled.");
    console.log("===Trade Offer ID 3 was half fulfilled and is still on the order book.");
    console.log("===Account 2's offer for 2 DOT: 1 ACA was partially fulfilled and the leftover is added as offer ID 4");
    console.log("==== CTRL+C To Exit ====");
}

main();
