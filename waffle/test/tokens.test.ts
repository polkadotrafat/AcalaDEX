import { expect, use } from "chai";
import { ethers, Contract, BigNumber } from "ethers";
import { deployContract, solidity } from "ethereum-waffle";
import { evmChai } from "@acala-network/bodhi/evmChai";
import { TestAccountSigningKey, Provider, Signer } from "@acala-network/bodhi";
import { WsProvider } from "@polkadot/api";
import { createTestPairs } from "@polkadot/keyring/testingPairs";
import IERC20 from "../build/IERC20.json";
import DEX from "../build/Dex.json";

use(evmChai);

const DOT_ERC20_ADDRESS = '0x0000000000000000000000000000000000000802';

const ACA_ERC20_ADDRESS = '0x0000000000000000000000000000000000000800';

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
  let wallet: Signer;
  let walletTo: Signer;
  let DOT: Contract;
  
  before(async () => {
    [wallet, walletTo] = await getWallets();
    console.log(wallet);
    console.log(DEX);
    console.log(IERC20);
    DOT = new ethers.Contract(DOT_ERC20_ADDRESS, IERC20, wallet);
  });
  
  after(async () => {
    provider.api.disconnect();
  });
  
  it("Assigns initial balance", async () => {
    //expect(await token.balanceOf(await wallet.getAddress())).to.equal(1000);
    const wAddress = await wallet.getAddress();
    console.log(wAddress);
    const balance = await DOT.balanceOf(wAddress);
    console.log(balance);
  });
});
