import {TonClient, Address} from '@ton/ton';
import {Cell, beginCell} from '@ton/core';
import {GameFi} from './game-fi';
import {AmountInTon} from './types';

export interface NftItemData {
  initialized: boolean;
  index: bigint;
  collection: Address | null;
  owner: Address | null;
  individualContent: Cell | null;
}

export interface NftTransferRequest {
  queryId?: bigint;
  to: Address;
  responseDestination?: Address;
  customPayload?: Cell;
  forwardAmount?: bigint;
  forwardPayload?: Cell;
  value?: bigint;
}

export class NftItem {
  public static readonly transferOperationCode = 0x5fcc3d14;
  public static transferFeePrepay: AmountInTon = 0.05;
  public static transferNotificationFee: AmountInTon = 0.000000001;

  constructor(private readonly tonClient: TonClient) {}

  async getData(address: Address | string): Promise<NftItemData> {
    const {stack} = await this.tonClient.runMethod(
      GameFi.addressStringToAddress(address),
      'get_nft_data'
    );

    return {
      initialized: stack.readBoolean(),
      index: stack.readBigNumber(),
      collection: stack.readAddressOpt(),
      owner: stack.readAddressOpt(),
      individualContent: stack.readCellOpt()
    };
  }

  async createTransferPayload(request: NftTransferRequest) {
    return beginCell()
      .storeUint(NftItem.transferOperationCode, 32)
      .storeUint(request.queryId ?? 0, 64)
      .storeAddress(request.to)
      .storeAddress(request.responseDestination)
      .storeMaybeRef(request.customPayload)
      .storeCoins(request.forwardAmount ?? 0)
      .storeMaybeRef(request.forwardPayload)
      .endCell();
  }

  async transfer() {
    throw new Error('Not implemented.');
  }
}
