import {ParsedContent} from './content';
import {TonConnectUiOptionsWithManifest} from '@tonconnect/ui';

export type ParsedNftContent = {
  name?: string;
  description?: string;
  image?: string | Buffer;
};

export {
  SendTransactionRequest,
  SendTransactionResponse,
  WalletConnectionSource,
  Wallet,
  Account,
  ITonConnect,
  type TonConnectUI as WalletConnector
} from '@tonconnect/ui';

export type WalletConnectorOptions = Pick<
  TonConnectUiOptionsWithManifest,
  'manifestUrl' | 'actionsConfiguration'
>;

export {NftContentData} from './content';
export type NftContent = ParsedContent<ParsedNftContent>;
