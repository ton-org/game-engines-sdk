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
| [create](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#create) | creates a GameFi instance |

`GameFi` instance methods:

| Method | Description |
| -------- | -------- |
| [createConnectButton](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#createConnectButton) | creates a button to connect a wallet. |
| [connectWallet](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#connectWallet) | connect wallet manually (without build-in UIs) |
| [onWalletChange](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#onWalletChange) | watch weather wallet was connected or disconnected |
| [disconnectWallet](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#disconnectWallet) | disconnect wallet manually (without build-in UIs) |
| [buy](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#buy) | buy from in-game shop with jetton or TON |
| [send](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#send) | transfer jetton or TON to another wallet address |
| [getCollectionData](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#getCollectionData) | get collection data |
| [getNftAddressByIndex](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#getNftAddressByIndex) | get NFT address by its index in a collection |
| [getNftItem](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#getNftItem) | get NFT data by address |
| [getNftItemByIndex](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#getNftItemByIndex) | get NFT data by its index in a collection |
| [transferNftItem](docs/classes/GameFi.html#transferNftItem) | transfer NFT to another wallet address |
| [getJetton](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#getJetton) | get jetton data |
| [transferJetton](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#transferJetton) | transfer jetton to another wallet address |

`GameFi` instance props:

| Prop | Description |
| -------- | -------- |
| [tonClient](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#tonClient) | ton client instance in case you need to use it |
| [walletConnector](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#walletConnector) | wallet connector instance in case you need to use it |
| [wallet](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#wallet) | user's connected wallet |
| [walletAccount](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#walletAccount) | user's connected account |
| [walletAddress](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#walletAddress) | user's connected wallet address |
| [merchantAddress](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#merchantAddress) | in-game shop's address to receive TON |
| [merchantJettonAddress](https://barinbritva.github.io/ton-gamefi/classes/GameFi.html#merchantJettonAddress) | in-game shop's jetton used as in-game currency |

# Use cases
To learn complex use cases read [TON GameFi article](https://gist.github.com/barinbritva/b3db1605f2667b7562b53a23877c0e73) and check out the source code of demo [Flappy Bird game](https://github.com/ton-community/flappy-bird).

# References
The full [typedoc references](https://barinbritva.github.io/ton-gamefi/index.html).
