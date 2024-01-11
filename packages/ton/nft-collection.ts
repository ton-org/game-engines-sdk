import {Address, Cell} from '@ton/core';
import {TonClient} from '@ton/ton';

export interface NftCollection {
  nextItemIndex: bigint;
  content: Cell;
  owner: Address | null;
}

export class NftCollectionManager {
  constructor(private readonly tonClient: TonClient) {}

  public async getData(address: Address | string): Promise<NftCollection> {
    const {stack} = await this.tonClient.runMethod(
      typeof address === 'string' ? Address.parse(address) : address,
      'get_collection_data'
    );

    return {
      nextItemIndex: stack.readBigNumber(),
      content: stack.readCell(),
      owner: stack.readAddressOpt()
    };
  }

  public async getNftAddressByIndex(collection: Address, itemIndex: bigint): Promise<Address> {
    const result = await this.tonClient.runMethod(collection, 'get_nft_address_by_index', [
      {type: 'int', value: itemIndex}
    ]);

    return result.stack.readAddress();
  }

  public async getNftContent(
    collection: Address,
    itemIndex: bigint,
    itemIndividualContent: Cell
  ): Promise<Cell> {
    const result = await this.tonClient.runMethod(collection, 'get_nft_content', [
      {
        type: 'int',
        value: itemIndex
      },
      {
        type: 'cell',
        cell: itemIndividualContent
      }
    ]);

    return result.stack.readCell();
  }
}
