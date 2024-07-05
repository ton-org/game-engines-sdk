import {GameFiBase, GameFiInitializationParams} from '../../common/game-fi';
export {GameFiInitializationParams} from '../../common/game-fi';
export class CocosGameFi extends GameFiBase {
  public static async create(params: GameFiInitializationParams = {}): Promise<CocosGameFi> {
    return new CocosGameFi(await CocosGameFi.createDependencies(params));
  }
}
