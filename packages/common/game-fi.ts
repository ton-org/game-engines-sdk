import {
  TonClient,
  TonConnect,
  getHttpEndpoint,
  TonClientOptions,
  TonConnectUIAdapter
} from './external';
import {NftItemManager} from './nft-item';
import {NftCollectionManager} from './nft-collection';
import {
  WalletConnector,
  WalletConnectorOptions,
  Wallet,
  SendTransactionResponse,
  ITonConnect
} from './interfaces';
import {AddressUtils, Convertor, createTransactionExpiration} from './utils';
import {AmountInTon} from './types';
import {ReturnParams} from '../phaser/src/connect-button/connect-button';
import {JettonManager} from './jetton';

export interface GameFiInitialization {
  network?: 'mainnet' | 'testnet';
  connector?: TonConnectUIAdapter | WalletConnectorOptions;
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
  public readonly nft: {
    collection: NftCollectionManager;
    item: NftItemManager;
  };
  public readonly jetton: JettonManager;

  constructor() {
    const walletConnector = GameFi.getWalletConnector();
    const tonClient = GameFi.getTonClient();

    this.walletConnector = walletConnector;
    this.tonClient = tonClient;

    this.nft = {
      item: new NftItemManager(this.tonClient, this.walletConnector),
      collection: new NftCollectionManager(this.tonClient)
    };
    this.jetton = new JettonManager(this.tonClient, this.walletConnector);
  }

  public get wallet(): Wallet {
    if (this.walletConnector.wallet == null) {
      throw new Error('Connect a wallet before using it.');
    }

    return this.walletConnector.wallet;
  }

  public static async init(options: GameFiInitialization = {}): Promise<void> {
    // avoid secondary initialization
    if (GameFi.walletConnector != null) {
      return;
    }

    GameFi.initOptions = options;
    const {connector, client, network = 'testnet'} = options;

    if (GameFi.isTonConnectUiInstance(connector)) {
      GameFi.walletConnector = connector;
    } else if (GameFi.isTonConnectInstance(connector)) {
      GameFi.walletConnector = GameFi.createConnectUiWorkaround(connector);
    } else {
      GameFi.walletConnector = GameFi.createConnectUiWorkaround(new TonConnect(connector));
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
  }

  public static getInitOptions() {
    if (GameFi.initOptions == null) {
      throw new Error('Run "init" method first.');
    }

    return GameFi.initOptions;
  }

  public static getWalletConnector(): WalletConnector {
    if (GameFi.walletConnector == null) {
      throw new Error('Run "init" method first.');
    }

    return GameFi.walletConnector;
  }

  public static getTonClient(): TonClient {
    if (GameFi.tonClient == null) {
      throw new Error('Run "init" method first.');
    }

    return GameFi.tonClient;
  }

  public async pay({
    to,
    amount
  }: {
    to: string;
    amount: AmountInTon;
  }): Promise<SendTransactionResponse> {
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

  public async restoreWalletConnection(
    ...params: Parameters<WalletConnector['onStatusChange']>
  ): Promise<() => void> {
    const unsubscribe = this.walletConnector.onStatusChange(...params);

    // avoid multiple restores, it causes errors
    // we handle the case to user doesn't think twice
    if (this.walletConnector.connected) {
      params[0](this.walletConnector.wallet);
    } else {
      await this.walletConnector.restoreConnection();
    }

    // native behavior doesn't trigger change if wallet not connected on initial restore
    // we will trigger it manually, to user didn't handle the case
    if (!this.walletConnector.connected) {
      params[0](null);
    }

    return unsubscribe;
  }

  private static isTonConnectUiInstance(instance: unknown): instance is TonConnectUIAdapter {
    // by some reason instanceof TonConnectUI returns false
    // so we need implement the check differently
    return typeof instance === 'object' && instance != null && 'openModal' in instance;
  }

  private static isTonConnectInstance(instance: unknown): instance is WalletConnector {
    return instance instanceof TonConnect;
  }

  private static createConnectUiWorkaround(connector: ITonConnect): WalletConnector {
    // we need to split TonConnectUI to logic and UI parts
    // to reuse logic in any package
    // until then use TonConnectUI under the hood
    // todo remove this workaround
    const buttonRoot = document.createElement('div');
    buttonRoot.id = '__ton-connect-ui--button-root';
    buttonRoot.style.display = 'none';
    document.body.appendChild(buttonRoot);

    const widgetRoot = document.createElement('div');
    widgetRoot.id = '__ton-connect-ui--widget-root';
    widgetRoot.style.display = 'none';
    document.body.appendChild(widgetRoot);

    return new TonConnectUIAdapter({
      connector: connector,
      buttonRootId: buttonRoot.id,
      widgetRootId: widgetRoot.id
    });
  }
}
