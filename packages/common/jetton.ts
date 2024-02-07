import {Address, Cell, Sender, TonClient, beginCell} from './external';
import {AddressUtils, Convertor} from './utils';

/**
 * Domain specific.
 */

export interface DomainJettonMinter {
  totalSupply: bigint;
  mintable: boolean;
  adminAddress: Address | null;
  jettonContent: Cell;
  jettonWalletCode: Cell;
}

export interface DomainJettonTransferRequest {
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

  public createTransferPayload(request: DomainJettonTransferRequest): Cell {
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

  public createMessagePayload(message: string): Cell {
    return beginCell().storeUint(0, 32).storeStringTail(message).endCell();
  }

  public async getWalletAddress(owner: Address, from: Address): Promise<Address> {
    const {stack} = await this.tonClient.runMethod(owner, 'get_wallet_address', [
      {type: 'slice', cell: beginCell().storeAddress(from).endCell()}
    ]);

    return stack.readAddress();
  }
}

/**
 * Client specific.
 */

export interface JettonTransferRequest {
  jetton: Address | string;
  from: Address | string;
  to: Address | string;
  amount: bigint;
  customPayload?: string;
  forwardFee?: bigint;
  forwardMessage?: string;
}

export interface JettonMinter extends DomainJettonMinter {}

export class JettonManager {
  private readonly manager: DomainJettonManager;

  constructor(
    tonClient: TonClient,
    private readonly sender: Sender
  ) {
    this.manager = new DomainJettonManager(tonClient);
  }

  public async getData(address: Address | string): Promise<JettonMinter> {
    return this.manager.getData(AddressUtils.toObject(address));
  }

  public async transfer({
    jetton,
    from,
    to,
    amount,
    customPayload,
    forwardFee,
    forwardMessage
  }: JettonTransferRequest): Promise<void> {
    const payloadData: DomainJettonTransferRequest = {
      to: AddressUtils.toObject(to),
      amount: amount,
      responseDestination: AddressUtils.toObject(from)
    };
    if (customPayload != null) {
      payloadData.customPayload = this.manager.createMessagePayload(customPayload);
    }
    if (forwardFee != null) {
      payloadData.forwardAmount = forwardFee;
    }
    if (forwardMessage != null) {
      payloadData.forwardPayload = this.manager.createMessagePayload(forwardMessage);
    }

    const payload = this.manager.createTransferPayload(payloadData);

    const walletAddress = await this.manager.getWalletAddress(
      AddressUtils.toObject(jetton),
      AddressUtils.toObject(from)
    );

    this.sender.send({
      to: walletAddress,
      value: Convertor.toNano(DomainJettonManager.transferFeePrepay),
      body: payload
    });
  }
}
