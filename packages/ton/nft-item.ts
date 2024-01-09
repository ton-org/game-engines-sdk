import {Address, Cell, beginCell} from '@ton/core';
import {TonClient} from '@ton/ton';
import {NftCollectionManager} from './nft-collection';

export interface NftTransferRequest {
  queryId?: bigint;
  to: Address;
  responseDestination?: Address;
  customPayload?: Cell;
  forwardAmount?: bigint;
  forwardPayload?: Cell;
  value?: bigint;
}

export interface NftItem {
  initialized: boolean;
  index: bigint;
  collection: Address | null;
  owner: Address | null;
  individualContent: Cell | null;
}

export class NftItemManager {
  public static readonly transferOperationCode: number = 0x5fcc3d14;
  public static transferFeePrepay: number = 0.05;
  public static transferNotificationFee: number = 0.000000001;
  private readonly collectionManager: NftCollectionManager;

  constructor(private readonly tonClient: TonClient) {
    this.collectionManager = new NftCollectionManager(this.tonClient);
  }

  public async getData(address: Address | string): Promise<NftItem> {
    const {stack} = await this.tonClient.runMethod(
      typeof address === 'string' ? Address.parse(address) : address,
      'get_nft_data'
    );

    const data = {
      initialized: stack.readBoolean(),
      index: stack.readBigNumber(),
      collection: stack.readAddressOpt(),
      owner: stack.readAddressOpt(),
      individualContent: stack.readCellOpt()
    };

    if (data.collection != null && data.individualContent != null) {
      data.individualContent = await this.collectionManager.getNftContent(
        data.collection,
        data.index,
        data.individualContent
      );
    }

    return data;
  }

  public async createTransferPayload(request: NftTransferRequest) {
    return beginCell()
      .storeUint(NftItemManager.transferOperationCode, 32)
      .storeUint(request.queryId ?? 0, 64)
      .storeAddress(request.to)
      .storeAddress(request.responseDestination)
      .storeMaybeRef(request.customPayload)
      .storeCoins(request.forwardAmount ?? 0)
      .storeMaybeRef(request.forwardPayload)
      .endCell();
  }
}
