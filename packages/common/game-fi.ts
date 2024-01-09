import {TonClient, TonConnect, Address, Cell} from './external';
import {NftItemManager, NftTransferParams} from './nft-item';
import {NftCollectionManager} from './nft-collection';
import {WalletConnector, WalletConnectorOptions, Wallet, Account} from './interfaces';
import {AddressUtils, Convertor, createTransactionExpiration} from './utils';
import {AmountInTon} from './types';

class Nft {
  private readonly manager: NftItemManager;

  constructor(
    private readonly tonClient: TonClient,
    public readonly walletConnector: WalletConnector,
    public readonly account: Account
  ) {
    this.manager = new NftItemManager(this.tonClient, this.walletConnector);
  }

  public async getData(address: Address | string) {
    return this.manager.getData(address);
  }

  public async transfer(params: Omit<NftTransferParams, 'from'>) {
    this.manager.transfer({...params, from: this.account.address});
  }
}

class NftCollection {
  private readonly manager: NftCollectionManager;

  constructor(private readonly tonClient: TonClient) {
    this.manager = new NftCollectionManager(this.tonClient);
  }

  public async getData(address: Address | string) {
    return this.manager.getData(address);
  }

  public async getNftAddress(collection: Address | string, itemIndex: number | bigint) {
    return this.manager.getNftAddress(collection, itemIndex);
  }

  public async getNftContent(
    collection: Address | string,
    itemIndex: number | bigint,
    itemIndividualContent: Cell
  ) {
    return this.manager.getNftContent(collection, itemIndex, itemIndividualContent);
  }
}

export abstract class GameFi {
  private static walletConnector: WalletConnector | null = null;
  private readonly tonClient: TonClient;

  public static readonly utils = {
    address: AddressUtils,
    convertor: Convertor
  };
  public readonly walletConnector: WalletConnector;
  public readonly wallet: Wallet;
  public readonly account: Account;
  public readonly nft: {
    collection: NftCollection;
    item: Nft;
  };

  constructor() {
    const walletConnector = GameFi.getWalletConnector();
    if (walletConnector.wallet == null) {
      throw new Error('Connect a wallet before using GameFi.');
    }

    this.walletConnector = walletConnector;
    this.wallet = walletConnector.wallet;
    this.account = walletConnector.wallet.account;

    // use https://github.com/orbs-network/ton-access
    this.tonClient = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
      apiKey: '19841bdee86b16f94d6c1edd73596daf9624e20de9422799e36b3bd537148a8b'
    });

    this.nft = {
      item: new Nft(this.tonClient, this.walletConnector, this.account),
      collection: new NftCollection(this.tonClient)
    };
  }

  public static createWalletConnector(options?: WalletConnectorOptions): WalletConnector {
    GameFi.walletConnector = new TonConnect(options);
    return GameFi.walletConnector;
  }

  public static getWalletConnector() {
    if (GameFi.walletConnector == null) {
      throw new Error('Create the connector via "createWalletConnector" method first.');
    }

    return GameFi.walletConnector;
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
}
