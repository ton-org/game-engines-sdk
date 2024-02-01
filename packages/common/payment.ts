import {Address, Cell, Sender, SenderArguments, beginCell} from './external';
import {JettonManager, JettonTransferRequest} from './jetton';
import {AddressUtils} from './utils';

export interface TonTransferRequest {
  from: Address | string;
  to: Address | string;
  amount: number | bigint;
  comment?: string;
}

export type PaymentRequest = TonTransferRequest | JettonTransferRequest;

export class PaymentManager {
  constructor(
    private jettonManager: JettonManager,
    private readonly sender: Sender
  ) {}

  public transfer(params: PaymentRequest) {
    if (this.isJettonTransfer(params)) {
      return this.jettonManager.transfer(params);
    } else {
      return this.transferTon(params);
    }
  }

  public createMessagePayload(message: string): Cell {
    return beginCell().storeUint(0, 32).storeStringTail(message).endCell();
  }

  public isJettonTransfer(params: PaymentRequest): params is JettonTransferRequest {
    return 'jetton' in params;
  }

  private transferTon(params: TonTransferRequest) {
    const request: SenderArguments = {
      to: AddressUtils.toObject(params.to),
      value: BigInt(params.amount)
    };
    if (params.comment != null) {
      request.body = this.createMessagePayload(params.comment);
    }

    return this.sender.send(request);
  }
}
