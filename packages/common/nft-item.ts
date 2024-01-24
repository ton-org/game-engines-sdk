import {
  DefaultContentResolver,
  NftContentData,
  decodeContentData,
  loadFullContent
} from './content';
import {parseNftContent} from './content-nft';
import {TonClient, Address, Cell, beginCell} from './external';
import {NftContent, SendTransactionResponse, WalletConnector} from './interfaces';
import {DomainNftCollectionManager} from './nft-collection';
import {AddressUtils, Convertor, createTransactionExpiration} from './utils';

/** Domain specific */

export interface DomainNftTransferRequest {
  queryId?: bigint;
  to: Address;
  responseDestination?: Address;
  customPayload?: Cell;
  forwardAmount?: bigint;
  forwardPayload?: Cell;
  value?: bigint;
}

export interface DomainNftItem {
  initialized: boolean;
  index: bigint;
  collection: Address | null;
  owner: Address | null;
  individualContent: Cell | null;
  content: Cell | null;
}

export class DomainNftItemManager {
  public static readonly transferOperationCode: number = 0x5fcc3d14;
  public static transferFeePrepay: number = 0.05;
  public static transferNotificationFee: number = 0.000000001;
  private readonly collectionManager: DomainNftCollectionManager;

  constructor(protected readonly tonClient: TonClient) {
    this.collectionManager = new DomainNftCollectionManager(this.tonClient);
  }

  public async getData(address: Address | string): Promise<DomainNftItem> {
    const {stack} = await this.tonClient.runMethod(
      typeof address === 'string' ? Address.parse(address) : address,
      'get_nft_data'
    );

    const data: DomainNftItem = {
      initialized: stack.readBoolean(),
      index: stack.readBigNumber(),
      collection: stack.readAddressOpt(),
      owner: stack.readAddressOpt(),
      individualContent: stack.readCellOpt(),
      content: null
    };

    if (data.collection != null && data.individualContent != null) {
      data.content = await this.collectionManager.getNftContent(
        data.collection,
        data.index,
        data.individualContent
      );
    } else {
      data.content = data.individualContent;
    }

    return data;
  }

  public createTransferPayload(request: DomainNftTransferRequest): Cell {
    return beginCell()
      .storeUint(DomainNftItemManager.transferOperationCode, 32)
      .storeUint(request.queryId ?? 0, 64)
      .storeAddress(request.to)
      .storeAddress(request.responseDestination)
      .storeMaybeRef(request.customPayload)
      .storeCoins(request.forwardAmount ?? 0)
      .storeMaybeRef(request.forwardPayload)
      .endCell();
  }
}

/** Client specific */

export class ClientNftItemManager extends DomainNftItemManager {
  private readonly manager: DomainNftItemManager;

  constructor(
    tonClient: TonClient,
    private readonly walletConnector: WalletConnector
  ) {
    super(tonClient);
    this.manager = new DomainNftItemManager(this.tonClient);
  }

  public transfer({nft, from, to}: NftTransferParams): Promise<SendTransactionResponse> {
    const payload = this.manager.createTransferPayload({
      to: AddressUtils.toObject(to),
      responseDestination: AddressUtils.toObject(from)
    });

    return this.walletConnector.sendTransaction({
      validUntil: createTransactionExpiration(),
      messages: [
        {
          address: AddressUtils.toString(nft),
          amount: Convertor.toNano(DomainNftItemManager.transferFeePrepay).toString(),
          payload: payload.toBoc().toString('base64')
        }
      ]
    });
  }
}

/** GameFi specific */

export interface NftItem {
  readonly initialized: boolean;
  readonly index: number;
  readonly collection: string;
  readonly owner: string;
  readonly content: NftContentData | null;
  readonly raw: DomainNftItem;
}

export interface Nft {
  readonly initialized: boolean;
  readonly index: number;
  readonly collection: string;
  readonly owner: string;
  readonly content: NftContent | null;
  readonly raw: DomainNftItem;
}

// todo handle queryId,customPayload, forwardAmount, forwardPayload params
export interface NftTransferParams {
  nft: Address | string;
  from: Address | string;
  to: Address | string;
}

export class NftItemManager {
  private readonly manager: ClientNftItemManager;

  constructor(
    private readonly tonClient: TonClient,
    private readonly walletConnector: WalletConnector
  ) {
    this.manager = new ClientNftItemManager(this.tonClient, this.walletConnector);
  }

  public async getData(address: Address | string): Promise<NftItem> {
    const domainData = await this.manager.getData(address);

    return {
      initialized: domainData.initialized,
      index: Number(domainData.index),
      collection: domainData.collection ? AddressUtils.toString(domainData.collection) : '',
      owner: domainData.owner ? AddressUtils.toString(domainData.owner) : '',
      content: domainData.content == null ? null : decodeContentData(domainData.content),
      raw: domainData
    };
  }

  public transfer({nft, from, to}: NftTransferParams): Promise<SendTransactionResponse> {
    const payload = this.manager.createTransferPayload({
      to: AddressUtils.toObject(to),
      responseDestination: AddressUtils.toObject(from)
    });

    return this.walletConnector.sendTransaction({
      validUntil: createTransactionExpiration(),
      messages: [
        {
          address: AddressUtils.toString(nft),
          amount: Convertor.toNano(DomainNftItemManager.transferFeePrepay).toString(),
          payload: payload.toBoc().toString('base64')
        }
      ]
    });
  }

  public async get(address: Address | string): Promise<Nft> {
    const data = await this.getData(address);
    if (data.raw.content != null) {
      // todo instead of loadFullContent we should only fetch and parse (content already contains the link)
      const content = parseNftContent(
        await loadFullContent(data.raw.content, new DefaultContentResolver())
      );

      return {
        ...data,
        content
      };
    } else {
      return {
        ...data,
        content: null
      };
    }
  }
}
