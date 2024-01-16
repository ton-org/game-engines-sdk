import type Phaser from 'phaser';
import {ConnectWalletButton, ConnectWalletParams} from './connect-button/connect-button';
import {GameFi as GameFiBase} from '../../common/game-fi';

export class GameFi extends GameFiBase {
  public static createConnectButton(options: {
    phaserOptions: {
      scene: Phaser.Scene;
      x: number;
      y: number;
    };
    buttonOptions: ConnectWalletParams;
  }) {
    return new ConnectWalletButton(
      options.phaserOptions.scene,
      options.phaserOptions.x,
      options.phaserOptions.y,
      options.buttonOptions,
      GameFi.getWalletConnector(),
      GameFi.getInitOptions().returnStrategy
    );
  }
}
