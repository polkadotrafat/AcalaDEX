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
  let walletexchange: Signer;
  let DOT: Contract;
  let ACA: Contract;
  let AUSD: Contract;
  let XBTC: Contract;
  let LDOT: Contract;
  let RENBTC: Contract;
  let RTOK: Contract;
  let Exchange: Contract;
  
  before(async () => {
    [wallet1, wallet2, walletexchange] = await getWallets();
    DOT = new ethers.Contract(DOT_ERC20_ADDRESS, IERC20.abi, wallet1);
    ACA = new ethers.Contract(ACA_ERC20_ADDRESS, IERC20.abi, wallet1);
    AUSD = new ethers.Contract(AUSD_ERC20_ADDRESS, IERC20.abi, wallet1);
    XBTC = new ethers.Contract(XBTC_ERC20_ADDRESS, IERC20.abi, wallet1);
    LDOT = new ethers.Contract(LDOT_ERC20_ADDRESS, IERC20.abi, wallet1);
    RENBTC = new ethers.Contract(RENBTC_ERC20_ADDRESS, IERC20.abi, wallet1);
    const supply = BigNumber.from('1000000000000000000000000');
    RTOK = await deployContract(wallet1, RTOKABI, [supply] );
    Exchange = await deplyContract(walletexchange, DEX);
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
    const exchangeAddress = Exchange.address;

    const txAddedACA = await Exchange.addToken(ACA_ERC20_ADDRESS,"ACALA","ACA");
    console.log(txAddedACA);
    const txAddedDOT = await Exchange.addToken(DOT_ERC20_ADDRESS,"Polkadot","DOT");
    console.log(txAddedDOT);
  });
});
