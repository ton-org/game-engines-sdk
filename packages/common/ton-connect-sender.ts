import {
  type TonConnectUI,
  Address,
  beginCell,
  Sender,
  SenderArguments,
  SendMode,
  storeStateInit
} from './external';
import {SendTransactionRequest} from './interfaces';

export class TonConnectSender implements Sender {
  private readonly provider: TonConnectUI;
  public readonly address?: Address;

  constructor(provider: TonConnectUI) {
    this.provider = provider;
    if (provider.wallet) {
      this.address = Address.parse(provider.wallet?.account.address);
    }
  }

  async send(args: SenderArguments): Promise<void> {
    if (!(args.sendMode === undefined || args.sendMode == SendMode.PAY_GAS_SEPARATELY)) {
      throw new Error(
        'Deployer sender does not support `sendMode` other than `PAY_GAS_SEPARATELY`.'
      );
    }

    const message: SendTransactionRequest['messages'][0] = {
      address: args.to.toString(),
      amount: args.value.toString()
    };
    if (args.body != null) {
      message.payload = args.body?.toBoc().toString('base64');
    }
    if (args.init != null) {
      message.stateInit = beginCell()
        .storeWritable(storeStateInit(args.init))
        .endCell()
        .toBoc()
        .toString('base64');
    }

    await this.provider.sendTransaction({
      validUntil: Date.now() + 5 * 60 * 1000,
      messages: [message]
    });
  }
}
