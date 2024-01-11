import {Address, Cell, TonClient} from '../common/external';

export interface JettonMinterData {
  totalSupply: bigint;
  mintable: boolean;
  adminAddress: Address | null;
  jettonContent: Cell;
  jettonWalletCode: Cell;
}

export class Jetton {
  public static readonly transferOperationCode: number = 0x0f8a7ea5;

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

  /* public async createTransferPayload(request: any) {
    return beginCell()
      .storeUint(Jetton.transferOperationCode, 32)
      .storeUint(request.queryId ?? 0, 64)
      .storeCoins(request.amount)
      .storeAddress(request.to)
      .storeAddress(response)
      .storeMaybeRef(request.customPayload)
      .storeCoins(request.forwardAmount ?? 0)
      .storeMaybeRef(request.forwardPayload)
      .endCell();
  } */

  /* async getWalletAddress(owner: Address) {
    return (
      await this.tonClient.runMethod(owner, 'get_wallet_address', [
        {type: 'slice', cell: beginCell().storeAddress(owner).endCell()}
      ])
    ).stack.readAddress();
  } */
}
