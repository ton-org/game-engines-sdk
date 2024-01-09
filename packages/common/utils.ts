import {Address, toNano, fromNano} from './external';

export abstract class AddressUtils {
  public static toObject(address: Address | string): Address {
    if (typeof address === 'string') {
      return Address.parse(address);
    }

    return address;
  }

  public static toString(address: Address | string): string {
    if (typeof address === 'string') {
      return address;
    }

    return address.toString();
  }
}

export abstract class Convertor {
  public static toNano = toNano;

  public static fromNano = fromNano;

  public static toNanoString(src: number | string | bigint): string {
    return toNano(src).toString();
  }
}

export function createTransactionExpiration(seconds: number = 3600): number {
  return Math.floor(Date.now() / 1000) + seconds;
}
