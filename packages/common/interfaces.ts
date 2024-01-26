import {ParsedContent} from './content';
import {ParsedNftContent} from './content-nft';

export {
  SendTransactionRequest,
  SendTransactionResponse,
  ITonConnect as WalletConnector,
  TonConnectOptions as WalletConnectorOptions,
  WalletConnectionSource,
  Wallet,
  Account,
  ITonConnect
} from '@tonconnect/sdk';

export {NftContentData} from './content';
export type NftContent = ParsedContent<ParsedNftContent>;
