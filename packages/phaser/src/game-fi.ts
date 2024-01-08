import type Phaser from 'phaser';
import {ConnectWalletButton, ConnectWalletParams} from './connect-button/connect-button';
import {GameFi as GameFiBase} from '../../common/game-fi';
import {WalletConnector} from '../../common/interfaces';

export class GameFi extends GameFiBase {
  public static createConnectButton(options: {
    walletConnector: WalletConnector;
    phaserOptions: {
      scene: Phaser.Scene;
      x: number;
      y: number;
    };
    buttonOptions: ConnectWalletParams;
  }) {
    new ConnectWalletButton(
      options.phaserOptions.scene,
      options.phaserOptions.x,
      options.phaserOptions.y,
      options.buttonOptions,
      options.walletConnector
    );
  }
}
