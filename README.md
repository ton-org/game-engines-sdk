# game-engines-sdk

TON blockchain bindings and utilities for game engines:
* [Phaser](https://phaser.io)
* [Cocos](https://www.cocos.com/en)
* Vanilla JavaScript

# Getting started
Installation:
```sh
# for Phaser
npm install --save @ton/phaser-sdk@beta

# for Cocos
npm install --save @ton/cocos-sdk@beta

# for Cocos
npm install --save @ton/vanilla-sdk@beta
```

Creating GameFi instance:
```typescript
// creation options described in the related section
const gameFi = await GameFi.create()
```

Connecting wallet:
```typescript
// create the UI scene
class UiScene extends Phaser.Scene {}
const uiScene = new UiScene();

// add the connect button to the scene
// all options described in the related section
const button: Container = gameFi.createConnectButton({
    scene: uiScene
})
```

Watching wallet connection:
```typescript
gameFi.onWalletChange((wallet: Wallet | null) => {
    // do the logic depending weather wallet is null or not
})
```
This can be used for:
* Watch the wallet state and reflect it on the game UI
* Restore connection with previously connected user wallet after app reloads

# What SDK should I use?

Engine specific features can be included to related SDKs. For example, `phaser-sdk` has build-it UI for connecting wallet. There is almost no differences between SDKs features right now.

Start with SDK of related engine if you use one. Use `@ton/vanilla-sdk` otherwise.

# GameFi methods & props
`GameFi` static methods:

| Method | Description |
| -------- | -------- |
| [create](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#create) | creates a GameFi instance |

`GameFi` instance methods:

| Method | Description |
| -------- | -------- |
| [createConnectButton](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#createConnectButton) | creates a button to connect a wallet. |
| [connectWallet](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#connectWallet) | connect wallet manually (without build-in UIs) |
| [onWalletChange](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#onWalletChange) | watch weather wallet was connected or disconnected |
| [disconnectWallet](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#disconnectWallet) | disconnect wallet manually (without build-in UIs) |
| [buyWithTon](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#buyWithTon) | buy from in-game shop with TON |
| [buyWithJetton](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#buyWithJetton) | buy from in-game shop with jetton |
| [transferTon](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#transferTon) | transfer TON to another wallet address |
| [transferJetton](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#transferJetton) | transfer jetton to another wallet address |
| [openNftCollection](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#openNftCollection) | open NFT collection contract |
| [openNftSale](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#openNftSale) | open NFT collection contract |
| [openNftItem](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#openNftItem) | open NFT item contract |
| [openNftItemByIndex](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#openNftItemByIndex) | open NFT item contract using its index |
| [openSbtCollection](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#openSbtCollection) | open SBT collection contract |
| [openJetton](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#openJetton) | Open Jetton contract |
| [openJettonWallet](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#openJettonWallet) | Open Jetton Wallet contract |

`GameFi` instance props:

| Prop | Description |
| -------- | -------- |
| [assetsSdk](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#assetsSdk) | [asset-sdk](https://github.com/ton-community/assets-sdk) instance in case you need to use it directly |
| [walletConnector](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#walletConnector) | wallet connector instance in case you need to use it directly |
| [wallet](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#wallet) | user's connected wallet |
| [walletAccount](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#walletAccount) | user's connected account |
| [walletAddress](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#walletAddress) | user's connected wallet address |
| [merchantAddress](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#merchantAddress) | in-game shop's address to receive TON |
| [merchantJettonAddress](https://ton-org.github.io/game-engines-sdk/classes/GameFi.html#merchantJettonAddress) | in-game shop's jetton used as in-game currency |

# Use cases
To learn complex use cases:
- read [TON GameFi article](https://gist.github.com/barinbritva/b3db1605f2667b7562b53a23877c0e73)
- check out the source code of [Flappy Bird](https://github.com/ton-community/flappy-bird) demo for Phaser
- check out the example of [Flappy Bird](https://github.com/CocosTechLabs/flappy-bird) for Cocos

# References
The full [typedoc references](https://ton-org.github.io/game-engines-sdk/index.html).
