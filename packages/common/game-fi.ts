import {TonClient, TonConnect, getHttpEndpoint, TonClientOptions, TonConnectUI} from './external';
import {NftItemManager} from './nft-item';
import {NftCollectionManager} from './nft-collection';
import {
  WalletConnector,
  WalletConnectorOptions,
  Wallet,
  Account,
  SendTransactionResponse
} from './interfaces';
import {AddressUtils, Convertor, createTransactionExpiration} from './utils';
import {AmountInTon} from './types';
import {ReturnParams} from '../phaser/src/connect-button/connect-button';
import {JettonManager} from './jetton';

export interface GameFiInitialization {
  network?: 'mainnet' | 'testnet';
  connector?: TonConnectUI | WalletConnector | WalletConnectorOptions;
  client?: TonClient | TonClientOptions;
  returnStrategy?: ReturnParams;
}

export abstract class GameFi {
  private static walletConnector: WalletConnector | null = null;
  private static walletConnectorUi: TonConnectUI | null = null;
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

  public static async init(options: GameFiInitialization = {}): Promise<void> {
    // avoid secondary initialization
    if (GameFi.walletConnector != null) {
      return;
    }

    GameFi.initOptions = options;
    const {connector, client, network = 'testnet'} = options;

    if (GameFi.isTonConnectUiInstance(connector)) {
      GameFi.walletConnector = connector.connector;
      GameFi.walletConnectorUi = connector;
    } else if (GameFi.isTonConnectInstance(connector)) {
      GameFi.walletConnector = connector;
      GameFi.walletConnectorUi = GameFi.createConnectUiWorkaround();
    } else {
      GameFi.walletConnector = new TonConnect(connector);
      GameFi.walletConnectorUi = GameFi.createConnectUiWorkaround();
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
      throw new Error('Run "init" method before.');
    }

    return GameFi.initOptions;
  }

  public static getWalletConnector(): WalletConnector {
    if (GameFi.walletConnector == null) {
      throw new Error('Create the connector via "createWalletConnector" method first.');
    }

    return GameFi.walletConnector;
  }

  public static getWalletConnectorUi(): TonConnectUI {
    if (GameFi.walletConnectorUi == null) {
      throw new Error('Create the connector via "createWalletConnector" method first.');
    }

    return GameFi.walletConnectorUi;
  }

  public static getTonClient(): TonClient {
    if (GameFi.tonClient == null) {
      throw new Error('Create the TonClient via "createTonClient" method first.');
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
    const connectorUi = GameFi.getWalletConnectorUi();

    return connectorUi.sendTransaction({
      validUntil: createTransactionExpiration(),
      messages: [
        {
          address: to,
          amount: Convertor.toNano(amount).toString()
        }
      ]
    });
  }

  private static isTonConnectUiInstance(instance: unknown): instance is TonConnectUI {
    // by some reason instanceof TonConnectUI returns false
    // so we need implement the check differently
    return typeof instance === 'object' && instance != null && 'openModal' in instance;
  }

  private static isTonConnectInstance(instance: unknown): instance is WalletConnector {
    return instance instanceof TonConnect;
  }

  private static createConnectUiWorkaround(): TonConnectUI {
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

    return new TonConnectUI({
      connector: GameFi.getWalletConnector(),
      restoreConnection: false,
      buttonRootId: buttonRoot.id,
      widgetRootId: widgetRoot.id
    });
  }
}
