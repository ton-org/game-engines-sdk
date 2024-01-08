# phaser-ton

TON bindings and utilities for Phaser.io

## Usage

### Button component

1. Import canvas implementation of `Connect Wallet` button:
```typescript
import { ConnectTelegramWalletButton } from './phaser-ton';
```
2. Create your canvas UI scene and add the connect button:
```typescript
export class UiScene extends Phaser.Scene {
    create() {
        // your UI elements here

        this.button = new ConnectTelegramWalletButton(
            this,
            // x position of the button
            16,
            // y position of the button
            40,
            // button options
            {
                style: 'light',
                manifestUrl: 'your app manifest url here',
            }
        );
    }
}
```
3. After user connected his wallet you can use it across your app by importing `getConnectedWallet` object:
```typescript
import { getConnectedWallet } from './phaser-ton';
const myWallet = getConnectedWallet();
```
Read [Wallet interface documentation](https://ton-connect.github.io/sdk/interfaces/_tonconnect_sdk.Wallet.html) to learn available props and methods.

### Check wallet connection

You can check if user has a connected wallet and use it without rendering the button:
```typescript
import { restoreWalletConnection } from './phaser-ton';
const wallet = await restoreWalletConnection({
    // ton connection options
});
```

## ConnectTelegramWalletButton options

| Option | Description | Default |
| -------- | -------- | -------- |
| tonParams | Check [@tonconnect/sdk](https://ton-connect.github.io/sdk/interfaces/_tonconnect_sdk.TonConnectOptions.html). The most important thing is to setup [app manifest](https://docs.ton.org/develop/dapps/ton-connect/protocol/requests-responses#app-manifest). | `undefined` |
| lang | Language of the button. Languages `en` and `ru` supported so far | `en` |
| style | Button style. Can be `light` or `dark` | `light` |
| onWalletChange | Callback function that will be called when user connects or disconnects his wallet | `undefined` |
| onError | Callback function that will be called when error occurs | `undefined` |


# Usage

1. Create a wallet connector
2. Connect a wallet
    * Manually
        1. subscribe onStatusChange event
        2. Run restoreConnection method
        3. `restoreConnection` will trigger `onStatusChange` with wallet instance or null
        4. If the wallet is null, you can use `connectWallet` method to connect a wallet
    * Automatically
        * call createConnectButton method
        * add the button to your scene
3. Create a GameFi instance