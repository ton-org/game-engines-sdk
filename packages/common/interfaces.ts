import {ParsedContent} from './content';
import {ParsedNftContent} from './content-nft';
import {TonConnectUiOptionsWithManifest} from '@tonconnect/ui';

export {
  SendTransactionRequest,
  SendTransactionResponse,
  ITonConnect as WalletConnector,
  WalletConnectionSource,
  Wallet,
  Account,
  ITonConnect
} from '@tonconnect/sdk';

export type WalletConnectorOptions = Pick<
  TonConnectUiOptionsWithManifest,
  'manifestUrl' | 'actionsConfiguration'
>;

export {NftContentData} from './content';
export type NftContent = ParsedContent<ParsedNftContent>;
