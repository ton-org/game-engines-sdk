import {TonClient, Address} from '@ton/ton';
import {Cell} from '@ton/core';
import {GameFi} from './game-fi';

export interface NftCollectionData {
  nextItemIndex: bigint;
  content: Cell;
  owner: Address | null;
}

export class NftCollection {
  constructor(private readonly tonClient: TonClient) {}

  async getData(address: Address | string): Promise<NftCollectionData> {
    const {stack} = await this.tonClient.runMethod(
      GameFi.addressStringToAddress(address),
      'get_collection_data'
    );

    return {
      nextItemIndex: stack.readBigNumber(),
      content: stack.readCell(),
      owner: stack.readAddressOpt()
    };
  }

  async getNftContent() {
    throw new Error('Not implemented.');
  }

  async getNftAddress() {
    throw new Error('Not implemented.');
  }
}
