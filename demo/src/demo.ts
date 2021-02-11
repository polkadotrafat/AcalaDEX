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

    const tokenACA = new Contract(ACA_ERC20_ADDRESS, IERC20.abi, wallet1);
    const tokenDOT = new Contract(DOT_ERC20_ADDRESS, IERC20.abi, wallet1);
    const Exchange = await ContractFactory.fromSolidity(DEX).connect(wallet1).deploy(address1);

    const exchangeAddress = Exchange.address;

    console.log(address1);
    console.log(address2);
    
    
}

main();