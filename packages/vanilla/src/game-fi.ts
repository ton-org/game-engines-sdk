import {GameFiBase, GameFiInitializationParams} from '../../common/game-fi';

export class GameFi extends GameFiBase {
  /**
   * Setups and creates GameFi instance.
   * The instance provides all the needed functionality via various methods.
   */
  public static async create(params: GameFiInitializationParams = {}): Promise<GameFi> {
    return new GameFi(await GameFi.createDependencies(params));
  }
}
