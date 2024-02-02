import {TonClient, getHttpEndpoint, TonClientOptions, TonConnectUI, Address} from './external';
import {WalletConnector, WalletConnectorOptions, Wallet, Account} from './interfaces';
import {TonConnectSender} from './ton-connect-sender';
import {NftCollectionManager} from './nft-collection';
import {NftItemManager, NftTransferRequest} from './nft-item';
import {JettonManager, JettonTransferRequest} from './jetton';
import {PaymentManager, TonTransferRequest} from './payment';

export type NftTransferParams = Omit<NftTransferRequest, 'from'>;
export type SendParams = Omit<TonTransferRequest, 'from'> | Omit<JettonTransferRequest, 'from'>;
export type BuyParams =
  | Omit<TonTransferRequest, 'from' | 'to'>
  | Omit<JettonTransferRequest, 'from' | 'to'>;

export type Network = 'mainnet' | 'testnet';

export interface MerchantInitialization {
  tonAddress: Address | string;
  jettonAddress: Address | string;
}

export interface GameFiInitializationParams {
  network?: Network;
  connector?: WalletConnector | WalletConnectorOptions;
  client?: TonClient | TonClientOptions;
  merchant?: MerchantInitialization;
}

export interface Merchant {
  tonAddress: Address;
  jettonAddress: Address;
}

export interface GameFiConstructorParams {
  walletConnector: WalletConnector;
  tonClient: TonClient;
  merchant?: Merchant;
}

export abstract class GameFiBase {
  public readonly walletConnector: WalletConnector;
  public readonly tonClient: TonClient;
  public readonly merchant?: Merchant;

  private readonly nftCollectionManager: NftCollectionManager;
  private readonly nftItemManager: NftItemManager;
  private readonly jettonManager: JettonManager;
  private readonly paymentManager: PaymentManager;

  constructor(params: GameFiConstructorParams) {
    this.walletConnector = params.walletConnector;
    this.tonClient = params.tonClient;
    if (params.merchant != null) {
      this.merchant = params.merchant;
    }

    const transactionSender = new TonConnectSender(this.walletConnector);
    this.nftCollectionManager = new NftCollectionManager(this.tonClient);
    this.nftItemManager = new NftItemManager(this.tonClient, transactionSender);
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
    return Address.parse(this.wallet.account.address);
  }

  public get merchantAddress(): Address {
    if (this.merchant == null || this.merchant.tonAddress == null) {
      throw new Error(
        'To make payments pass with TON "merchant.tonAddress" parameter to "GameFi.create" method.'
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

  protected static async createDependencies(
    params: GameFiInitializationParams = {}
  ): Promise<GameFiConstructorParams> {
    const {connector, client, network = 'testnet'} = params;

    const walletConnector = GameFiBase.isTonConnectUiInstance(connector)
      ? connector
      : GameFiBase.createConnectUiWorkaround(connector);

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

  public buy(params: BuyParams): Promise<void> {
    return this.paymentManager.transfer({
      ...params,
      from: this.walletAddress,
      to: 'jetton' in params ? this.merchantJettonAddress : this.merchantAddress
    });
  }

  public send(params: SendParams): Promise<void> {
    return this.paymentManager.transfer({...params, from: this.walletAddress});
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

    return this.nftItemManager.getData(nftAddress);
  }

  /** NFT item methods */
  public getNftItem(address: Address | string) {
    return this.nftItemManager.getData(address);
  }

  public transferNftItem(params: NftTransferParams) {
    return this.nftItemManager.transfer({...params, from: this.walletAddress});
  }

  /** Jetton methods */
  public getJetton(address: Address | string) {
    return this.jettonManager.getData(address);
  }

  public async transferJetton(params: Omit<JettonTransferRequest, 'from'>) {
    return this.jettonManager.transfer({...params, from: this.walletAddress});
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
