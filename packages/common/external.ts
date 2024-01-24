export {Cell, beginCell, Address, toNano, fromNano} from '@ton/core';
export {TonClient} from '@ton/ton';
export {TonConnect} from '@tonconnect/sdk';
export {getHttpEndpoint} from '@orbs-network/ton-access';
export {TonConnectUI} from '@tonconnect/ui';

// add export of TonClientParameters to @ton/ton package
export interface TonClientOptions {
  endpoint: string;
  timeout?: number;
  apiKey?: string;
}
