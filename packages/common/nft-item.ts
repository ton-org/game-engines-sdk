import {ContentResolver, loadFullContent} from './content';
import {parseNftContent} from './content-nft';
import {TonClient, Address, Cell, beginCell, Sender} from './external';
import {NftContent} from './interfaces';
import {DomainNftCollectionManager} from './nft-collection';
import {AddressUtils, Convertor} from './utils';

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

  public createMessagePayload(message: string): Cell {
    return beginCell().storeUint(0, 32).storeStringTail(message).endCell();
  }
}

/** Client specific */

export interface Nft {
  initialized: boolean;
  index: bigint;
  collection: Address | null;
  owner: Address | null;
  content: NftContent | null;
}

export interface NftTransferRequest {
  nft: Address | string;
  from: Address | string;
  to: Address | string;
  queryId?: number | bigint;
  customPayload?: string;
  forwardAmount?: number | bigint;
  forwardPayload?: string;
}

export class NftItemManager {
  private readonly manager: DomainNftItemManager;

  constructor(
    private readonly tonClient: TonClient,
    private readonly sender: Sender,
    private readonly contentResolver: ContentResolver
  ) {
    this.manager = new DomainNftItemManager(this.tonClient);
  }

  public async getData(address: Address | string): Promise<Nft> {
    const domainData = await this.manager.getData(address);

    return {
      initialized: domainData.initialized,
      index: domainData.index,
      collection: domainData.collection,
      owner: domainData.owner,
      content:
        domainData.content == null
          ? null
          : parseNftContent(await loadFullContent(domainData.content, this.contentResolver))
    };
  }

  public transfer({
    nft,
    from,
    to,
    queryId,
    customPayload,
    forwardAmount,
    forwardPayload
  }: NftTransferRequest): Promise<void> {
    const request: DomainNftTransferRequest = {
      to: AddressUtils.toObject(to),
      responseDestination: AddressUtils.toObject(from)
    };
    if (queryId != null) {
      request.queryId = BigInt(queryId);
    }
    if (customPayload != null) {
      request.customPayload = this.manager.createMessagePayload(customPayload);
    }
    if (forwardAmount != null) {
      request.forwardAmount = BigInt(forwardAmount);
    }
    if (forwardPayload != null) {
      request.forwardPayload = this.manager.createMessagePayload(forwardPayload);
    }

    const payload = this.manager.createTransferPayload(request);

    return this.sender.send({
      to: AddressUtils.toObject(nft),
      value: Convertor.toNano(DomainNftItemManager.transferFeePrepay),
      body: payload
    });
  }
}
