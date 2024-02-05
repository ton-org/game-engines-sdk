import {ParsedContent} from './content';
import {ParsedNftContent} from './content-nft';
import {TonConnectUiOptionsWithManifest} from '@tonconnect/ui';

export {
  SendTransactionRequest,
  SendTransactionResponse,
  WalletConnectionSource,
  Wallet,
  Account,
  ITonConnect,
  type TonConnectUI as WalletConnector
} from '@tonconnect/ui';

export type WalletConnectorParams = Pick<
  TonConnectUiOptionsWithManifest,
  'manifestUrl' | 'actionsConfiguration'
>;

export {NftContentData} from './content';
export type NftContent = ParsedContent<ParsedNftContent>;
export type WalletApp =
  | 'telegram-wallet'
  | 'tonkeeper'
  | 'mytonwallet'
  | 'openmask'
  | 'tonhub'
  | 'dewallet'
  | 'xtonwallet'
  | 'tonwallet';
