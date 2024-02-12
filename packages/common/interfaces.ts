import {TonConnectUiOptionsWithManifest} from '@tonconnect/ui';
import {Dictionary} from '@ton/core';

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

export type ContentType = 'onchain' | 'offchain' | 'semichain';

export type ParsedContent<T> = T & {
  type: ContentType;
  unknownOnchainFields: Dictionary<bigint, Buffer>;
  unknownOffchainFields: Record<string, any>;
  offchainUrl?: string;
};

export type ParsedNftContent = {
  name?: string;
  description?: string;
  image?: string | Buffer;
};

export interface NftContentData {
  type: 'onchain' | 'offchain' | 'semichain';
  onChainData?: Dictionary<bigint, Buffer>;
  offChainUrl?: string;
}

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
