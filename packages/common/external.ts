export {Cell, beginCell, Address, toNano, fromNano} from '@ton/core';
export {TonClient} from '@ton/ton';
export {TonConnect} from '@tonconnect/sdk';
export {getHttpEndpoint} from '@orbs-network/ton-access';
import {TonConnectUI, TonConnectUiCreateOptions} from '@tonconnect/ui';
import {SendTransactionRequest, SendTransactionResponse, WalletConnector} from './interfaces';

// add export of TonClientParameters to @ton/ton package
export interface TonClientOptions {
  endpoint: string;
  timeout?: number;
  apiKey?: string;
}

// TonConnectUI is incompatible with TonConnect,
// So we need to create an adapter
// todo request TonConnectUI author to make it compatible with TonConnect
export class TonConnectUIAdapter extends TonConnectUI implements WalletConnector {
  constructor(options: TonConnectUiCreateOptions = {}) {
    super({...options, restoreConnection: false});
  }
  connect = this.connector.connect.bind(this.connector);
  restoreConnection = this.connector.restoreConnection.bind(this.connector);
  pauseConnection = this.connector.pauseConnection.bind(this.connector);
  unPauseConnection = this.connector.unPauseConnection.bind(this.connector);
  override sendTransaction: (tx: SendTransactionRequest) => Promise<SendTransactionResponse> =
    super.sendTransaction.bind(this);
}
