import type Phaser from 'phaser';
import {ConnectWalletButton, ConnectWalletButtonParams} from './connect-button/connect-button';
import {GameFiBase as GameFiBase, GameFiInitializationParams} from '../../common/game-fi';

export interface CreateConnectButtonParams {
  scene: Phaser.Scene;
  positionX?: number;
  positionY?: number;
  buttonOptions?: ConnectWalletButtonParams;
}

export class GameFi extends GameFiBase {
  /**
   * Setups and creates GameFi instance.
   * The instance provides all the needed functionality via various methods.
   */
  public static async create(params: GameFiInitializationParams = {}): Promise<GameFi> {
    return new GameFi(await GameFi.createDependencies(params));
  }

  /**
   * Creates the connect button as `ConnectWalletButton` instance and adds it to the passed scene.
   * `ConnectWalletButton` is child class of `Phaser.GameObjects.Container`.
   * It's possible to interact with the button using Container API, like changing position `setPosition`.
   */
  public createConnectButton(params: CreateConnectButtonParams) {
    return new ConnectWalletButton(
      this.walletConnector,
      params.scene,
      params.positionX ?? 0,
      params.positionY ?? 0,
      params.buttonOptions
    );
  }
}
