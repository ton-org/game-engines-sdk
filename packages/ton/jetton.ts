import {Address, Cell, TonClient, beginCell} from '../common/external';

export interface JettonMinterData {
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

export class JettonManager {
  public static readonly transferOperationCode: number = 0x0f8a7ea5;
  public static transferFeePrepay: number = 0.05;

  constructor(private readonly tonClient: TonClient) {}

  public async getData(address: Address): Promise<JettonMinterData> {
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
      .storeUint(JettonManager.transferOperationCode, 32)
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
