import {Address} from '../../../common/external';

export function hexToNumber(hex: string) {
  return parseInt(hex.replace('#', '0x'), 16);
}

export function rawAddressToFriendly(address: string, shorten = false) {
  const result = Address.parseRaw(address).toString();
  if (!shorten) {
    return result;
  }

  return result.substring(0, 4) + '...' + result.substring(result.length - 4);
}

export function smoothScale(
  manager: Phaser.Tweens.TweenManager,
  obj: object | object[],
  scaleValue: number,
  duration: number
) {
  manager.add({
    targets: obj,
    scaleX: scaleValue,
    scaleY: scaleValue,
    duration: duration
  });
}
