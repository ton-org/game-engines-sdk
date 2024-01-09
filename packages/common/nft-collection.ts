import {
  NftCollectionManager as DomainNftCollectionManager,
  NftCollection as DomainNftCollection
} from '../ton/nft-collection';
import {TonClient, Address, Cell} from './external';
import {AddressUtils} from './utils';

export interface NftCollection {
  nextItemIndex: number;
  content: string;
  owner: string;
  raw: DomainNftCollection;
}

export class NftCollectionManager {
  private readonly domainManager: DomainNftCollectionManager;

  constructor(private readonly tonClient: TonClient) {
    this.domainManager = new DomainNftCollectionManager(this.tonClient);
  }

  public async getData(address: Address | string): Promise<NftCollection> {
    const domainData = await this.domainManager.getData(address);

    return {
      nextItemIndex: Number(domainData.nextItemIndex),
      content: domainData.content.toBoc().toString('base64'),
      owner: domainData.owner ? AddressUtils.toString(domainData.owner) : '',
      raw: domainData
    };
  }

  public async getNftAddress(
    collection: Address | string,
    itemIndex: number | bigint
  ): Promise<string> {
    const address = await this.domainManager.getNftAddress(
      AddressUtils.toObject(collection),
      BigInt(itemIndex)
    );

    return AddressUtils.toString(address);
  }

  public async getNftContent(
    collection: Address | string,
    itemIndex: number | bigint,
    // todo load and return meta data instead
    itemIndividualContent: Cell
  ) {
    return this.domainManager.getNftContent(
      AddressUtils.toObject(collection),
      BigInt(itemIndex),
      itemIndividualContent
    );
  }
}
