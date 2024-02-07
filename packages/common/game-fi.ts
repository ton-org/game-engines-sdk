import {TonClient, getHttpEndpoint, TonClientParams, TonConnectUI, Address} from './external';
import {WalletConnector, WalletConnectorParams, Wallet, Account, WalletApp} from './interfaces';
import {TonConnectSender} from './ton-connect-sender';
import {NftCollectionManager} from './nft-collection';
import {
  IpfsGateway,
  ProxyContentResolver,
  ProxyContentResolverParams,
  UrlProxy,
  ContentResolver
} from './content-resolver';
import {AddressUtils} from './utils';
import {NftItemManager, NftTransferRequest} from './nft-item';
import {JettonManager, JettonTransferRequest} from './jetton';
import {PaymentManager, TonTransferRequest} from './payment';

export type NftTransferParams = Omit<NftTransferRequest, 'from'>;
export type SendParams = Omit<TonTransferRequest, 'from'> | Omit<JettonTransferRequest, 'from'>;
export type BuyParams =
  | Omit<TonTransferRequest, 'from' | 'to'>
  | (Omit<JettonTransferRequest, 'from' | 'to' | 'jetton'> & {jetton?: true});

export type Network = 'mainnet' | 'testnet';

export interface MerchantParams {
  tonAddress: Address | string;
  jettonAddress?: Address | string;
}

export interface ContentResolverParams {
  ipfsGateway?: IpfsGateway;
  urlProxy?: UrlProxy | string;
}

export interface GameFiInitializationParams {
  /**
   * @defaultValue testnet
   */
  network?: Network;
  /**
   * Pass TonConnectUI instance to use HTML based flow.
   * Pass connector options to use game engine specific connect button implementation (headless mode),
   * like Phaser `createConnectButton` or draw connect button by yourself.
   * @defaultValue headless mode
   */
  connector?: WalletConnector | WalletConnectorParams;
  /**
   * TonClient instance or only its params.
   */
  client?: TonClient | TonClientParams;
  /**
   * Loading collections, NFTs, etc. information requires requests to external resources.
   * Some of those resources may block direct requests from browsers by CORS policies.
   * Pass function or template string which will be used to generate proxy URL. For example:
   * `http://localhost:3000/cors-passthrough?url=%URL%` - %URL% will be replaced by URL
   * your proxy server should follow.
   */
  contentResolver?: ContentResolverParams;
  /**
   * TON wallet address and jetton wallet address of in-game shop.
   * In-game purchases will be send to those addresses.
   */
  merchant?: MerchantParams;
}

export interface Merchant {
  tonAddress: Address;
  jettonAddress?: Address;
}

export interface GameFiConstructorParams {
  walletConnector: WalletConnector;
  tonClient: TonClient;
  contentResolver: ContentResolver;
  merchant?: Merchant;
}

/**
 * GameFiBase is a parent for every implementation of GameFi.
 * Game engine specific implementations like Phaser only needs to define
 * its own `create` and `createConnectButton` methods.
 */
export abstract class GameFiBase {
  public readonly walletConnector: WalletConnector;
  public readonly tonClient: TonClient;
  public readonly contentResolver: ContentResolver;
  public readonly merchant?: Merchant;

  private readonly nftCollectionManager: NftCollectionManager;
  private readonly nftItemManager: NftItemManager;
  private readonly jettonManager: JettonManager;
  private readonly paymentManager: PaymentManager;

  constructor(params: GameFiConstructorParams) {
    this.walletConnector = params.walletConnector;
    this.tonClient = params.tonClient;
    this.contentResolver = params.contentResolver;
    if (params.merchant != null) {
      this.merchant = params.merchant;
    }

    const transactionSender = new TonConnectSender(this.walletConnector);
    this.nftCollectionManager = new NftCollectionManager(this.tonClient);
    this.nftItemManager = new NftItemManager(
      this.tonClient,
      transactionSender,
      this.contentResolver
    );
    this.jettonManager = new JettonManager(this.tonClient, transactionSender);
    this.paymentManager = new PaymentManager(this.jettonManager, transactionSender);
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

  public get walletAddress(): Address {
    return Address.parseRaw(this.wallet.account.address);
  }

  public get merchantAddress(): Address {
    if (this.merchant == null || this.merchant.tonAddress == null) {
      throw new Error(
        'To make payments with TON pass "merchant.tonAddress" parameter to "GameFi.create" method.'
      );
    }

    return this.merchant.tonAddress;
  }

  public get merchantJettonAddress(): Address {
    if (this.merchant == null || this.merchant.tonAddress == null) {
      throw new Error(
        'To make payments with jetton pass "merchant.jettonAddress" parameter to "GameFi.create" method.'
      );
    }

    return this.merchant.tonAddress;
  }

  /**
   * Prepares dependencies to game engine implementations use it for `create` method.
   * These dependencies will be used to create an GameFi instance further.
   */
  protected static async createDependencies(
    params: GameFiInitializationParams = {}
  ): Promise<GameFiConstructorParams> {
    const {connector, client, network = 'testnet', merchant} = params;

    const walletConnector = GameFiBase.isTonConnectUiInstance(connector)
      ? connector
      : GameFiBase.createConnectUiWorkaround(connector);

    let tonClient: TonClient;
    if (client instanceof TonClient) {
      tonClient = client;
    } else {
      let clientParams: TonClientParams;
      if (client == null) {
        const endpoint = await getHttpEndpoint({
          network
        });
        clientParams = {endpoint};
      } else {
        clientParams = client;
      }
      tonClient = new TonClient(clientParams);
    }

    const contentResolverParams: ProxyContentResolverParams = {};
    if (params.contentResolver != null) {
      const {ipfsGateway, urlProxy} = params.contentResolver;
      if (ipfsGateway != null) {
        contentResolverParams.ipfsGateway = ipfsGateway;
      }
      if (urlProxy != null) {
        if (typeof urlProxy === 'string') {
          contentResolverParams.urlProxy = (url) => {
            return urlProxy.replace(ProxyContentResolver.replaceable, url);
          };
        } else {
          contentResolverParams.urlProxy = urlProxy;
        }
      }
    }
    const contentResolver = new ProxyContentResolver(contentResolverParams);

    const dependencies: GameFiConstructorParams = {walletConnector, tonClient, contentResolver};
    if (merchant != null) {
      dependencies.merchant = {
        tonAddress: AddressUtils.toObject(merchant.tonAddress)
      };

      if (merchant.jettonAddress != null) {
        dependencies.merchant.jettonAddress = AddressUtils.toObject(merchant.jettonAddress);
      }
    }

    return dependencies;
  }

  /**
   * Send TON or jetton to merchant wallet address (game shop).
   * If `jetton` prop passed, it's jetton transfer, otherwise - TON transfer.
   * It's a shorthand for `send` method.
   */
  public buy(params: BuyParams): Promise<void> {
    return this.paymentManager.transfer({
      ...params,
      from: this.walletAddress,
      to: 'jetton' in params ? this.merchantJettonAddress : this.merchantAddress
    });
  }

  /**
   * Send TON or jetton to custom wallet address.
   * If `jetton` prop passed, it's jetton transfer, otherwise - TON transfer.
   */
  public send(params: SendParams): Promise<void> {
    return this.paymentManager.transfer({...params, from: this.walletAddress});
  }

  /**
   * Get data of an NFT collection.
   */
  public getNftCollection(address: Address | string) {
    return this.nftCollectionManager.getData(address);
  }

  /**
   * Get NFT item address from collection using its index.
   */
  public async getNftAddressByIndex(
    collectionAddress: Address | string,
    itemIndex: number | bigint
  ) {
    return this.nftCollectionManager.getNftAddressByIndex(collectionAddress, itemIndex);
  }

  /**
   * Get NFT item from collection using its index.
   */
  public async getNftItemByIndex(collectionAddress: Address | string, itemIndex: number | bigint) {
    const nftAddress = await this.nftCollectionManager.getNftAddressByIndex(
      collectionAddress,
      itemIndex
    );

    return this.nftItemManager.getData(nftAddress);
  }

  /**
   * Get NFT item by address.
   */
  public getNftItem(address: Address | string) {
    return this.nftItemManager.getData(address);
  }

  /**
   * Get NFT item to another wallet address.
   */
  public transferNftItem(params: NftTransferParams) {
    return this.nftItemManager.transfer({...params, from: this.walletAddress});
  }

  /**
   * Get jetton data by address.
   */
  public getJetton(address: Address | string) {
    return this.jettonManager.getData(address);
  }

  /**
   * Transfer some jetton amount to another address.
   */
  public async transferJetton(params: Omit<JettonTransferRequest, 'from'>) {
    return this.jettonManager.transfer({...params, from: this.walletAddress});
  }

  /**
   * Call connectWallet programmatically in case
   * you are not going to use TonConnectUI provided UI or game engine provided button
   * and you draw your own UI.
   */
  public connectWallet(app: WalletApp) {
    return this.walletConnector.openSingleWalletModal(app);
  }

  /**
   * Watch weather wallet was connected or disconnected.
   * Use the method to reflect it on the UI state.
   */
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

  /**
   * Call connectWallet programmatically in case
   * you draw your own UI.
   */
  public disconnectWallet() {
    return this.walletConnector.disconnect();
  }

  protected static isTonConnectUiInstance(instance: unknown): instance is WalletConnector {
    // because TonConnectUI cleared outside of the lib, in a consumer app
    // instance instanceof TonConnectUI returns false
    // so we need implement the check differently
    // todo figure out how to fix
    return typeof instance === 'object' && instance != null && 'openModal' in instance;
  }

  protected static createConnectUiWorkaround(params: WalletConnectorParams = {}): WalletConnector {
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
      ...params,
      buttonRootId: buttonRoot.id,
      widgetRootId: widgetRoot.id
    });
  }
}
