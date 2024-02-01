import {Address, toNano, fromNano} from './external';

export abstract class AddressUtils {
  // todo would be nice to have the method in Address
  public static toObject(address: Address | string): Address {
    if (typeof address === 'string') {
      return Address.parse(address);
    }

    return address;
  }
}

export abstract class Convertor {
  public static toNano = toNano;

  public static fromNano = fromNano;
}

/**
 * @deprecated
 */
export function createTransactionExpiration(seconds: number = 3600): number {
  return Math.floor(Date.now() / 1000) + seconds;
}
