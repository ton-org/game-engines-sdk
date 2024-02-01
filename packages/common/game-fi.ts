import {TonClient, getHttpEndpoint, TonClientOptions, TonConnectUI, Address} from './external';
import {
  WalletConnector,
  WalletConnectorOptions,
  Wallet,
  SendTransactionResponse,
  Account
} from './interfaces';
import {Convertor, createTransactionExpiration} from './utils';
import {NftCollectionManager} from './nft-collection';
import {NftItemManager} from './nft-item';
import {JettonManager} from './jetton';

export interface GameFiInitialization {
  network?: 'mainnet' | 'testnet';
  connector?: WalletConnector | WalletConnectorOptions;
  client?: TonClient | TonClientOptions;
}

// todo handle queryId,customPayload, forwardAmount, forwardPayload params
export interface NftTransferParams {
  nft: Address | string;
  from: Address | string;
  to: Address | string;
}

export interface JettonTransferRequest {
  jetton: Address | string;
  from: Address | string;
  to: Address | string;
  amount: number;
  forward?: {
    fee: number;
    message: string;
  };
  customPayload?: string;
}

export interface GameFiConstructorParams {
  walletConnector: WalletConnector;
  tonClient: TonClient;
}

export abstract class GameFi {
  public readonly walletConnector: WalletConnector;
  public readonly tonClient: TonClient;

  private readonly nftCollectionManager: NftCollectionManager;
  private readonly nftItemManager: NftItemManager;
  private readonly jettonManager: JettonManager;

  constructor(params: GameFiConstructorParams) {
    this.walletConnector = params.walletConnector;
    this.tonClient = params.tonClient;

    this.nftCollectionManager = new NftCollectionManager(this.tonClient);
    this.nftItemManager = new NftItemManager(this.tonClient, this.walletConnector);
    this.jettonManager = new JettonManager(this.tonClient, this.walletConnector);
  }

  public get wallet(): Wallet {
    if (this.walletConnector.wallet == null) {
      throw new Error('Connect a wallet before using it.');
    }

    return this.walletConnector.wallet;
  }

  public get walletAccount(): Account {
    return this.wallet.account;
  }

  public get walletAddress(): string {
    return this.wallet.account.address;
  }

  protected static async createDependencies(
    params: GameFiInitialization = {}
  ): Promise<GameFiConstructorParams> {
    const {connector, client, network = 'testnet'} = params;

    const walletConnector = GameFi.isTonConnectUiInstance(connector)
      ? connector
      : GameFi.createConnectUiWorkaround(connector);

    let tonClient: TonClient;
    if (client instanceof TonClient) {
      tonClient = client;
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
      tonClient = new TonClient(clientOptions);
    }

    return {walletConnector, tonClient};
  }

  public async pay({to, amount}: {to: string; amount: number}): Promise<SendTransactionResponse> {
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

  /** NFT collection methods */
  public getCollectionData(address: Address | string) {
    return this.nftCollectionManager.getData(address);
  }

  public async getNftAddressByIndex(
    collectionAddress: Address | string,
    itemIndex: number | bigint
  ) {
    return this.nftCollectionManager.getNftAddressByIndex(collectionAddress, itemIndex);
  }

  public async getNftItemByIndex(collectionAddress: Address | string, itemIndex: number | bigint) {
    const nftAddress = await this.nftCollectionManager.getNftAddressByIndex(
      collectionAddress,
      itemIndex
    );

    return this.nftItemManager.get(nftAddress);
  }

  /** NFT item methods */
  public getNftItem(address: Address | string) {
    return this.nftItemManager.get(address);
  }

  public transferNftItem(params: NftTransferParams) {
    return this.nftItemManager.transfer(params);
  }

  /** Jetton methods */
  public getJetton(address: Address | string) {
    return this.jettonManager.getData(address);
  }

  public async transferJetton(params: JettonTransferRequest) {
    return this.jettonManager.transfer(params);
  }

  public onWalletChange(...params: Parameters<WalletConnector['onStatusChange']>): () => void {
    const unsubscribe = this.walletConnector.onStatusChange(...params);

    // by default onStatusChange doesn't trigger when no wallet to restore
    // do manually trigger to user doesn't need to handle the case by himself
    this.walletConnector.connectionRestored.then((connected) => {
      if (!connected) {
        params[0](null);
      }
    });

    return unsubscribe;
  }

  protected static isTonConnectUiInstance(instance: unknown): instance is WalletConnector {
    // because TonConnectUI cleared outside of the lib, in a consumer app
    // instance instanceof TonConnectUI returns false
    // so we need implement the check differently
    // todo figure out how to fix
    return typeof instance === 'object' && instance != null && 'openModal' in instance;
  }

  protected static createConnectUiWorkaround(
    options: WalletConnectorOptions = {}
  ): WalletConnector {
    // we need 100% TonConnectUI functionality, but without visual parts
    // to reuse the logic, but not to implement fork, use the workaround
    // todo remove this workaround
    const hide = (element: HTMLElement) => {
      element.style.overflow = 'hidden';
      element.style.display = 'none';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
    };

    const buttonRoot = document.createElement('div');
    buttonRoot.id = '__ton-connect-ui--button-root';
    hide(buttonRoot);
    document.body.appendChild(buttonRoot);

    const widgetRoot = document.createElement('div');
    widgetRoot.id = '__ton-connect-ui--widget-root';
    hide(widgetRoot);
    document.body.appendChild(widgetRoot);

    return new TonConnectUI({
      ...options,
      buttonRootId: buttonRoot.id,
      widgetRootId: widgetRoot.id
    });
  }
}
