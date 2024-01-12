import {DefaultContentResolver, loadFullContent} from '../ton/content';
import {parseNftContent} from '../ton/content-nft';
import {TonClient, TonConnect, Address, Cell, getHttpEndpoint, TonClientOptions} from './external';
import {NftItemManager, NftTransferParams} from './nft-item';
import {NftCollectionManager} from './nft-collection';
import {JettonManager} from './jetton';
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
    return this.manager.transfer({...params, from: this.account.address});
  }

  // todo describe return type
  public async get(address: Address | string) {
    const data = await this.manager.getData(address);
    // todo how about individualContent?
    if (data.raw.content != null) {
      // todo instead of loadFullContent we should only fetch and parse (content already contains the link)
      const content = parseNftContent(
        await loadFullContent(data.raw.content, new DefaultContentResolver())
      );

      return {
        ...data,
        content
      };
    }

    return null;
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

  public async getNftAddressByIndex(collection: Address | string, itemIndex: number | bigint) {
    return this.manager.getNftAddressByIndex(collection, itemIndex);
  }

  // todo I think we don't need this method for the client code
  public async getNftContent(
    collection: Address | string,
    itemIndex: number | bigint,
    itemIndividualContent: Cell
  ) {
    return this.manager.getNftContent(collection, itemIndex, itemIndividualContent);
  }
}

export interface GameFiInitialization {
  connector?: TonConnect | WalletConnectorOptions;
  client?: TonClient | TonClientOptions;
}

export abstract class GameFi {
  private static walletConnector: WalletConnector | null = null;
  private static tonClient: TonClient | null = null;
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
      item: new Nft(this.tonClient, this.walletConnector, this.account),
      collection: new NftCollection(this.tonClient)
    };
    this.jetton = new JettonManager(this.tonClient, this.walletConnector);
  }

  public static async init(options: GameFiInitialization = {}) {
    const {connector, client} = options;

    if (connector instanceof TonConnect) {
      GameFi.walletConnector = connector;
    } else {
      GameFi.walletConnector = new TonConnect(connector);
    }

    if (client instanceof TonClient) {
      GameFi.tonClient = client;
    } else {
      let clientOptions: TonClientOptions;
      if (client == null) {
        const endpoint = await getHttpEndpoint();
        clientOptions = {endpoint};
      } else {
        clientOptions = client;
      }
      GameFi.tonClient = new TonClient(clientOptions);
    }

    return {connector: GameFi.walletConnector, client: GameFi.tonClient};
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
}
