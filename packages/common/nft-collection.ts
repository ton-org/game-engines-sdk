import {Address, Cell} from '@ton/core';
import {TonClient} from '@ton/ton';
import {AddressUtils} from './utils';

/** Domain specific */

export interface DomainNftCollection {
  nextItemIndex: bigint;
  content: Cell;
  owner: Address | null;
}

export class DomainNftCollectionManager {
  constructor(private readonly tonClient: TonClient) {}

  public async getData(address: Address | string): Promise<DomainNftCollection> {
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

/** Client specific */

export interface NftCollection {
  nextItemIndex: bigint;
  content: string;
  owner: Address | null;
}

export class NftCollectionManager {
  private readonly domainManager: DomainNftCollectionManager;

  constructor(private readonly tonClient: TonClient) {
    this.domainManager = new DomainNftCollectionManager(this.tonClient);
  }

  public async getData(address: Address | string): Promise<NftCollection> {
    const domainData = await this.domainManager.getData(address);

    return {
      nextItemIndex: domainData.nextItemIndex,
      // todo load
      content: domainData.content.toBoc().toString('base64'),
      owner: domainData.owner
    };
  }

  public async getNftAddressByIndex(
    collection: Address | string,
    itemIndex: number | bigint
  ): Promise<Address> {
    const address = await this.domainManager.getNftAddressByIndex(
      AddressUtils.toObject(collection),
      BigInt(itemIndex)
    );

    return address;
  }
}
