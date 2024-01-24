import {TonClient, TonConnect, getHttpEndpoint, TonClientOptions} from './external';
import {NftItemManager} from './nft-item';
import {NftCollectionManager} from './nft-collection';
import {WalletConnector, WalletConnectorOptions, Wallet, Account} from './interfaces';
import {AddressUtils, Convertor, createTransactionExpiration} from './utils';
import {AmountInTon} from './types';
import {ReturnParams} from '../phaser/src/connect-button/connect-button';
import {JettonManager} from './jetton';

export interface GameFiInitialization {
  network?: 'mainnet' | 'testnet';
  connector?: WalletConnector | WalletConnectorOptions;
  client?: TonClient | TonClientOptions;
  returnStrategy?: ReturnParams;
}

export abstract class GameFi {
  private static walletConnector: WalletConnector | null = null;
  private static tonClient: TonClient | null = null;
  private static initOptions: GameFiInitialization | null = null;
  private readonly tonClient: TonClient;

  public static readonly utils = {
    address: AddressUtils,
    convertor: Convertor
  };
  public readonly walletConnector: WalletConnector;
  public readonly wallet: Wallet;
  public readonly account: Account;
  public readonly nft: {
    collection: NftCollectionManager;
    item: NftItemManager;
  };
  public readonly jetton: JettonManager;

  constructor() {
    const walletConnector = GameFi.getWalletConnector();
    if (walletConnector.wallet == null) {
      throw new Error('Connect a wallet before using GameFi.');
    }

    const tonClient = GameFi.getTonClient();
    if (tonClient == null) {
      throw new Error('Create TonClient before using GameFi.');
    }

    this.walletConnector = walletConnector;
    this.wallet = walletConnector.wallet;
    this.account = walletConnector.wallet.account;

    this.tonClient = tonClient;

    this.nft = {
      item: new NftItemManager(this.tonClient, this.walletConnector),
      collection: new NftCollectionManager(this.tonClient)
    };
    this.jetton = new JettonManager(this.tonClient, this.walletConnector);
  }

  public static async init(options: GameFiInitialization = {}) {
    GameFi.initOptions = options;
    const {connector, client, network = 'testnet'} = options;

    if (GameFi.isTonConnectInstance(connector)) {
      GameFi.walletConnector = connector;
    } else {
      GameFi.walletConnector = new TonConnect(connector);
    }

    if (client instanceof TonClient) {
      GameFi.tonClient = client;
    } else {
      let clientOptions: TonClientOptions;
      if (client == null) {
        const endpoint = await getHttpEndpoint({
          network
        });
        clientOptions = {endpoint};
      } else {
        clientOptions = client;
      }
      GameFi.tonClient = new TonClient(clientOptions);
    }

    return {connector: GameFi.walletConnector, client: GameFi.tonClient};
  }

  public static getInitOptions() {
    if (GameFi.initOptions == null) {
      throw new Error('Run "init" method before.');
    }

    return GameFi.initOptions;
  }

  public static getWalletConnector() {
    if (GameFi.walletConnector == null) {
      throw new Error('Create the connector via "createWalletConnector" method first.');
    }

    return GameFi.walletConnector;
  }

  public static getTonClient() {
    if (GameFi.tonClient == null) {
      throw new Error('Create the TonClient via "createTonClient" method first.');
    }

    return GameFi.tonClient;
  }

  public async pay({to, amount}: {to: string; amount: AmountInTon}) {
    return this.walletConnector.sendTransaction({
      validUntil: createTransactionExpiration(),
      messages: [
        {
          address: to,
          amount: Convertor.toNano(amount).toString()
        }
      ]
    });
  }

  private static isTonConnectInstance(instance: unknown): instance is WalletConnector {
    return instance instanceof TonConnect;
  }
}
