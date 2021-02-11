import { TestAccountSigningKey, Provider, Signer } from "@acala-network/bodhi";
import { WsProvider, Keyring } from "@polkadot/api";
import { createTestPairs } from "@polkadot/keyring/testingPairs";
import { KeyringPair } from "@polkadot/keyring/types";

const WS_URL = process.env.WS_URL || 'ws://127.0.0.1:9944';

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
    console.log(wallet1);
    console.log(wallet2);
}

main();