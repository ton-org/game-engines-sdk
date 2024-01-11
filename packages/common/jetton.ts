import {JettonManager as DomainJetton} from '../ton/jetton';
import {Address, Cell, TonClient} from './external';
import {SendTransactionResponse, WalletConnector} from './interfaces';
import {AddressUtils, Convertor, createTransactionExpiration} from './utils';

export interface JettonMinterData {
  totalSupply: number;
  mintable: boolean;
  adminAddress: string;
  jettonContent: Cell;
  jettonWalletCode: Cell;
}

export interface TransferParams {
  jetton: Address | string;
  from: Address | string;
  to: Address | string;
  amount: number;
}

export class JettonManager {
  private readonly domainManager: DomainJetton;

  constructor(
    private readonly tonClient: TonClient,
    private readonly walletConnector: WalletConnector
  ) {
    this.domainManager = new DomainJetton(this.tonClient);
  }

  public async getData(address: Address | string): Promise<JettonMinterData> {
    const data = await this.domainManager.getData(AddressUtils.toObject(address));

    return {
      totalSupply: Number(data.totalSupply),
      mintable: data.mintable,
      adminAddress: data.adminAddress == null ? '' : AddressUtils.toString(data.adminAddress),
      // todo parse content
      jettonContent: data.jettonContent,
      jettonWalletCode: data.jettonWalletCode
    };
  }

  public async transfer({
    jetton,
    from,
    to,
    amount
  }: TransferParams): Promise<SendTransactionResponse> {
    const payload = this.domainManager.createTransferPayload({
      to: AddressUtils.toObject(to),
      amount: Convertor.toNano(amount),
      responseDestination: AddressUtils.toObject(from)
    });

    const walletAddress = await this.domainManager.getWalletAddress(AddressUtils.toObject(jetton));

    return this.walletConnector.sendTransaction({
      validUntil: createTransactionExpiration(),
      messages: [
        {
          address: AddressUtils.toString(walletAddress),
          amount: Convertor.toNano(DomainJetton.transferFeePrepay).toString(),
          payload: payload.toBoc().toString('base64')
        }
      ]
    });
  }
}
