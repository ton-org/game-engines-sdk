# gamefi-sdk

TON bindings and utilities for game engines:
* Phaser.io
* Cocos2d (coming soon)

# Getting started
Installation:
```sh
npm install --save @ton-community/gamefi-phaser
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

# GameFi methods & props
`GameFi` static methods:

| Method | Description |
| -------- | -------- |
| [create](/docs/classes/GameFi.html#create) | creates a GameFi instance |

`GameFi` instance methods:

| Method | Description |
| -------- | -------- |
| [createConnectButton](/docs/classes/GameFi.html#createConnectButton) | creates a button to connect a wallet. |
| [connectWallet](/docs/classes/GameFi.html#connectWallet) | connect wallet manually (without build-in UIs) |
| [onWalletChange](/docs/classes/GameFi.html#onWalletChange) | watch weather wallet was connected or disconnected |
| [disconnectWallet](/docs/classes/GameFi.html#disconnectWallet) | disconnect wallet manually (without build-in UIs) |
| [buy](/docs/classes/GameFi.html#buy) | buy from in-game shop with jetton or TON |
| [send](/docs/classes/GameFi.html#send) | transfer jetton or TON to another wallet address |
| [getCollectionData](/docs/classes/GameFi.html#getCollectionData) | get collection data |
| [getNftAddressByIndex](/docs/classes/GameFi.html#getNftAddressByIndex) | get NFT address by its index in a collection |
| [getNftItem](/docs/classes/GameFi.html#getNftItem) | get NFT data by address |
| [getNftItemByIndex](/docs/classes/GameFi.html#getNftItemByIndex) | get NFT data by its index in a collection |
| [transferNftItem](docs/classes/GameFi.html#transferNftItem) | transfer NFT to another wallet address |
| [getJetton](/docs/classes/GameFi.html#getJetton) | get jetton data |
| [transferJetton](/docs/classes/GameFi.html#transferJetton) | transfer jetton to another wallet address |

`GameFi` instance props:

| Prop | Description |
| -------- | -------- |
| [tonClient](/docs/classes/GameFi.html#tonClient) | ton client instance in case you need to use it |
| [walletConnector](/docs/classes/GameFi.html#walletConnector) | wallet connector instance in case you need to use it |
| [wallet](/docs/classes/GameFi.html#wallet) | user's connected wallet |
| [walletAccount](/docs/classes/GameFi.html#walletAccount) | user's connected account |
| [walletAddress](/docs/classes/GameFi.html#walletAddress) | user's connected wallet address |
| [merchantAddress](/docs/classes/GameFi.html#merchantAddress) | in-game shop's address to receive TON |
| [merchantJettonAddress](/docs/classes/GameFi.html#merchantJettonAddress) | in-game shop's jetton used as in-game currency |

# References
The full [typedoc references](/docs/index.html).
