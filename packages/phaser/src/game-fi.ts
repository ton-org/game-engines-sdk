import type Phaser from 'phaser';
import {ConnectWalletButton, ConnectWalletParams} from './connect-button/connect-button';
import {GameFi as GameFiBase, GameFiInitializationParams} from '../../common/game-fi';

export class GameFi extends GameFiBase {
  public static async create(params: GameFiInitializationParams = {}): Promise<GameFi> {
    return new GameFi(await GameFi.createDependencies(params));
  }

  public createConnectButton(options: {
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
      this.walletConnector
    );
  }
}
