import {NftItemManager as DomainNftItemManager, NftItem as DomainNftItem} from '../ton/nft-item';
import {TonClient, Address} from './external';
import {SendTransactionResponse, WalletConnector} from './interfaces';
import {AddressUtils, Convertor, createTransactionExpiration} from './utils';

export interface NftItem {
  readonly initialized: boolean;
  readonly index: number;
  readonly collection: string;
  readonly owner: string;
  readonly content: string | null;
  readonly raw: DomainNftItem;
}

// todo handle queryId,customPayload, forwardAmount, forwardPayload params
export interface NftTransferParams {
  nft: Address | string;
  from: Address | string;
  to: Address | string;
}

export class NftItemManager {
  private readonly domainManager: DomainNftItemManager;

  constructor(
    private readonly tonClient: TonClient,
    private readonly walletConnector: WalletConnector
  ) {
    this.domainManager = new DomainNftItemManager(this.tonClient);
  }

  public async getData(address: Address | string): Promise<NftItem> {
    const domainData = await this.domainManager.getData(address);

    return {
      initialized: domainData.initialized,
      index: Number(domainData.index),
      collection: domainData.collection ? AddressUtils.toString(domainData.collection) : '',
      owner: domainData.owner ? AddressUtils.toString(domainData.owner) : '',
      // todo handle meta loading
      content:
        domainData.individualContent == null
          ? null
          : domainData.individualContent.toBoc().toString('base64'),
      raw: domainData
    };
  }

  public transfer({nft, from, to}: NftTransferParams): Promise<SendTransactionResponse> {
    const payload = this.domainManager.createTransferPayload({
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
