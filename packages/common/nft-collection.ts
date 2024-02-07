import {Address, Cell, TonClient} from './external';
import {ContentResolver, loadFullContent} from './content';
import {parseNftContent} from './content-nft';
import {AddressUtils} from './utils';
import {NftContent} from './interfaces';

/** Domain specific */

export interface DomainNftCollection {
  nextItemIndex: bigint;
  content: Cell;
  owner: Address | null;
}

export class DomainNftCollectionManager {
  constructor(private readonly tonClient: TonClient) {}

  public async getData(address: Address): Promise<DomainNftCollection> {
    const {stack} = await this.tonClient.runMethod(address, 'get_collection_data');

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
  address: Address;
  nextItemIndex: bigint;
  content: NftContent;
  owner: Address | null;
}

export class NftCollectionManager {
  private readonly domainManager: DomainNftCollectionManager;

  constructor(
    private readonly tonClient: TonClient,
    private readonly contentResolver: ContentResolver
  ) {
    this.domainManager = new DomainNftCollectionManager(this.tonClient);
  }

  public async getData(address: Address | string): Promise<NftCollection> {
    const addressObject = AddressUtils.toObject(address);
    const domainData = await this.domainManager.getData(addressObject);

    return {
      address: addressObject,
      nextItemIndex: domainData.nextItemIndex,
      content: parseNftContent(await loadFullContent(domainData.content, this.contentResolver)),
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
