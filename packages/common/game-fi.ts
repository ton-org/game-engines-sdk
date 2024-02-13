import {
  getHttpV4Endpoint,
  TonConnectUI,
  Address,
  AssetsSDK,
  TonClient4,
  TonClient4Parameters,
  Cell,
  beginCell,
  JettonTransferMessage
} from './external';
import {WalletConnector, WalletConnectorParams, Wallet, Account, WalletApp} from './interfaces';
import {TonConnectSender} from './ton-connect-sender';
import {
  IpfsGateway,
  ProxyContentResolver,
  ProxyContentResolverParams,
  UrlProxy
} from './content-resolver';

export interface JettonTransferRequest {
  jetton: Address;
  to: Address;
  amount: bigint;
  customPayload?: string;
  forwardAmount?: bigint;
  forwardPayload?: string;
}

export interface TonTransferRequest {
  to: Address;
  amount: bigint;
  comment?: string;
}

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
  client?: TonClient4 | TonClient4Parameters;
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
  assetsSdk: AssetsSDK;
  merchant?: Merchant;
}

/**
 * GameFiBase is a parent for every implementation of GameFi.
 * Game engine specific implementations like Phaser only needs to define
 * its own `create` and `createConnectButton` methods.
 */
export abstract class GameFiBase {
  public readonly walletConnector: WalletConnector;
  public readonly assetsSdk: AssetsSDK;
  public readonly merchant?: Merchant;

  constructor(params: GameFiConstructorParams) {
    this.walletConnector = params.walletConnector;
    this.assetsSdk = params.assetsSdk;
    if (params.merchant != null) {
      this.merchant = params.merchant;
    }
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
    if (this.merchant == null || this.merchant.jettonAddress == null) {
      throw new Error(
        'To make payments with jetton pass "merchant.jettonAddress" parameter to "GameFi.create" method.'
      );
    }

    return this.merchant.jettonAddress;
  }

  /**
   * Send TON to merchant wallet address (in-game shop).
   */
  public async buyWithTon(params: Omit<TonTransferRequest, 'to'>): Promise<void> {
    this.transferTon({...params, to: this.merchantAddress});
  }

  /**
   * Send TON to other wallet address.
   */
  public async transferTon(params: TonTransferRequest): Promise<void> {
    if (this.assetsSdk.sender == null) {
      throw new Error('Sender is not configured.');
    }

    return this.assetsSdk.sender.send({
      to: params.to,
      value: params.amount,
      body: params.comment ? this.createMessagePayload(params.comment) : null
    });
  }

  /**
   * Send jetton to merchant wallet address (in-game shop).
   */
  public async buyWithJetton(params: Omit<JettonTransferRequest, 'to' | 'jetton'>): Promise<void> {
    this.transferJetton({...params, to: this.merchantAddress});
  }

  /**
   * Send jetton to other wallet address.
   */
  public async transferJetton(params: Omit<JettonTransferRequest, 'jetton'>): Promise<void> {
    const jetton = this.assetsSdk.openJetton(this.merchantJettonAddress);
    const jettonWallet = await jetton.getWallet(this.walletAddress);

    const message: JettonTransferMessage = {
      amount: params.amount,
      to: params.to,
      responseDestination: this.walletAddress
    };
    if (params.customPayload != null) {
      message.customPayload = this.createMessagePayload(params.customPayload);
    }
    if (params.forwardAmount != null) {
      message.forwardAmount = params.forwardAmount;
    }
    if (params.forwardPayload != null) {
      message.forwardPayload = this.createMessagePayload(params.forwardPayload);
    }

    return jettonWallet.sendTransfer(message);
  }

  /**
   * Open NFT collection contract.
   */
  public openNftCollection(address: Address) {
    return this.assetsSdk.openNftCollection(address);
  }

  /**
   * Open NFT sale contract.
   */
  public openNftSale(address: Address) {
    return this.assetsSdk.openNftSale(address);
  }

  /**
   * Open NFT contract.
   */
  public openNftItem(address: Address) {
    return this.assetsSdk.openNftItem(address);
  }

  /**
   * Get NFT item from collection using its index.
   */
  public async openNftItemByIndex(collectionAddress: Address, itemIndex: bigint) {
    const nftAddress = await this.assetsSdk
      .openNftCollection(collectionAddress)
      .getItemAddress(itemIndex);

    return this.assetsSdk.openNftItem(nftAddress);
  }

  /**
   * Open SBT collection contract.
   */
  public openSbtCollection(address: Address) {
    return this.assetsSdk.openSbtCollection(address);
  }

  /**
   * Open Jetton contract.
   */
  public openJetton(address: Address) {
    return this.assetsSdk.openJetton(address);
  }

  /**
   * Open Jetton Wallet contract.
   */
  public openJettonWallet(address: Address) {
    return this.assetsSdk.openJettonWallet(address);
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

  private createMessagePayload(message: string): Cell {
    return beginCell().storeUint(0, 32).storeStringTail(message).endCell();
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

    let tonClient: TonClient4;
    if (client instanceof TonClient4) {
      tonClient = client;
    } else {
      let clientParams: TonClient4Parameters;
      if (client == null) {
        const endpoint = await getHttpV4Endpoint({
          network
        });
        clientParams = {endpoint};
      } else {
        clientParams = client;
      }
      tonClient = new TonClient4(clientParams);
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

    const assetsSdk = AssetsSDK.create({
      api: {
        openExtended: (contract) => {
          return tonClient.openExtended(contract);
        },
        provider: (address, init) => tonClient.provider(address, init)
      },
      contentResolver: contentResolver,
      sender: new TonConnectSender(walletConnector)
    });

    const dependencies: GameFiConstructorParams = {
      walletConnector,
      assetsSdk
    };

    if (merchant != null) {
      dependencies.merchant = {
        tonAddress: GameFiBase.addressToObject(merchant.tonAddress)
      };

      if (merchant.jettonAddress != null) {
        dependencies.merchant.jettonAddress = GameFiBase.addressToObject(merchant.jettonAddress);
      }
    }

    return dependencies;
  }

  protected static addressToObject(address: Address | string): Address {
    if (typeof address === 'string') {
      return Address.parse(address);
    }

    return address;
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
