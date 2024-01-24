import {Address, Cell, TonClient, beginCell} from './external';
import {SendTransactionResponse, WalletConnector} from './interfaces';
import {AddressUtils, Convertor, createTransactionExpiration} from './utils';

/**
 * Domain specific.
 */

export interface TransferParams {
  jetton: Address | string;
  from: Address | string;
  to: Address | string;
  amount: number;
}

export interface DomainJettonMinter {
  totalSupply: bigint;
  mintable: boolean;
  adminAddress: Address | null;
  jettonContent: Cell;
  jettonWalletCode: Cell;
}

export interface JettonRequestCommon {
  to: Address;
  amount: bigint;
  queryId?: bigint;
  responseDestination?: Address;
  customPayload?: Cell;
  forwardAmount?: bigint;
  forwardPayload?: Cell;
}

export class DomainJettonManager {
  public static readonly transferOperationCode: number = 0x0f8a7ea5;
  public static transferFeePrepay: number = 0.05;

  constructor(protected readonly tonClient: TonClient) {}

  public async getData(address: Address): Promise<DomainJettonMinter> {
    const {stack} = await this.tonClient.runMethod(address, 'get_jetton_data');

    return {
      totalSupply: stack.readBigNumber(),
      mintable: stack.readBigNumber() !== BigInt(0),
      adminAddress: stack.readAddressOpt(),
      jettonContent: stack.readCell(),
      jettonWalletCode: stack.readCell()
    };
  }

  public createTransferPayload(request: JettonRequestCommon): Cell {
    return beginCell()
      .storeUint(DomainJettonManager.transferOperationCode, 32)
      .storeUint(request.queryId ?? 0, 64)
      .storeCoins(request.amount)
      .storeAddress(request.to)
      .storeAddress(request.responseDestination)
      .storeMaybeRef(request.customPayload)
      .storeCoins(request.forwardAmount ?? 0)
      .storeMaybeRef(request.forwardPayload)
      .endCell();
  }

  public async getWalletAddress(owner: Address): Promise<Address> {
    const {stack} = await this.tonClient.runMethod(owner, 'get_wallet_address', [
      {type: 'slice', cell: beginCell().storeAddress(owner).endCell()}
    ]);

    return stack.readAddress();
  }
}

/**
 * Client specific.
 */
export class ClientJettonManager extends DomainJettonManager {
  constructor(
    tonClient: TonClient,
    protected readonly walletConnector: WalletConnector
  ) {
    super(tonClient);
  }

  public async transfer({
    jetton,
    from,
    to,
    amount
  }: TransferParams): Promise<SendTransactionResponse> {
    const payload = this.createTransferPayload({
      to: AddressUtils.toObject(to),
      amount: Convertor.toNano(amount),
      responseDestination: AddressUtils.toObject(from)
    });

    const walletAddress = await this.getWalletAddress(AddressUtils.toObject(jetton));

    return this.walletConnector.sendTransaction({
      validUntil: createTransactionExpiration(),
      messages: [
        {
          address: AddressUtils.toString(walletAddress),
          amount: Convertor.toNano(ClientJettonManager.transferFeePrepay).toString(),
          payload: payload.toBoc().toString('base64')
        }
      ]
    });
  }
}

/** GameFi specific */

export interface JettonMinter {
  totalSupply: number;
  mintable: boolean;
  adminAddress: string;
  jettonContent: Cell;
  jettonWalletCode: Cell;
}

export class JettonManager {
  private readonly manager: ClientJettonManager;

  constructor(
    tonClient: TonClient,
    protected readonly walletConnector: WalletConnector
  ) {
    this.manager = new ClientJettonManager(tonClient, walletConnector);
  }

  public async getData(address: Address | string): Promise<JettonMinter> {
    const data = await this.manager.getData(AddressUtils.toObject(address));

    return {
      totalSupply: Number(data.totalSupply),
      mintable: data.mintable,
      adminAddress: data.adminAddress == null ? '' : AddressUtils.toString(data.adminAddress),
      // todo parse content
      jettonContent: data.jettonContent,
      jettonWalletCode: data.jettonWalletCode
    };
  }
}
