import {Locale} from './interfaces';

export const LIGHT_DIAMOND = 'diamond-light';
export const DARK_DIAMOND = 'diamond-dark';
export const LIGHT_COPY = 'copy-light';
export const DARK_COPY = 'copy-dark';
export const LIGHT_DISCONNECT = 'disconnect-light';
export const DARK_DISCONNECT = 'disconnect-dark';

export const buttonDesign = {
  horizontalPadding: 16,
  verticalPadding: 11,
  borderRadius: 20,
  borderWidth: 1,
  fontFamily: 'Segoe UI, San Francisco, Roboto, sans-serif',
  fontSize: 15,
  default: {
    borderColor: '#0098EA',
    backgroundColor: '#0098EA',
    backgroundColorHover: '#0098EA',
    fontColor: '#FFFFFF',
    icons: {
      diamond: DARK_DIAMOND,
      copy: DARK_COPY,
      disconnect: DARK_DISCONNECT
    }
  },
  light: {
    borderColor: '#E9EEF1',
    backgroundColor: '#FFFFFF',
    backgroundColorHover: '#F7F9FB',
    fontColor: '#0F0F0F',
    icons: {
      diamond: LIGHT_DIAMOND,
      copy: LIGHT_COPY,
      disconnect: LIGHT_DISCONNECT
    }
  },
  dark: {
    borderColor: '#303035',
    backgroundColor: '#121214',
    backgroundColorHover: '#2D2D32',
    fontColor: '#E5E5EA',
    icons: {
      diamond: DARK_DIAMOND,
      copy: DARK_COPY,
      disconnect: DARK_DISCONNECT
    }
  },
  icon: {
    horizontalPadding: 4,
    width: 24,
    height: 24
  },
  dropDown: {
    topMargin: 12,
    horizontalPadding: 8,
    verticalPadding: 8,
    width: 256,
    borderRadius: 16
  },
  dropDownItem: {
    horizontalPadding: 12,
    verticalPadding: 11
  }
};

export interface LocalesDictionary {
  en: Locale;
  ru: Locale;
  [k: string]: Locale;
}

export const locales: LocalesDictionary = {
  en: {
    connectWallet: 'Connect Wallet',
    disconnectWallet: 'Disconnect',
    copyAddress: 'Copy address',
    addressCopied: 'Address copied!'
  },
  ru: {
    connectWallet: 'Подключить кошелёк',
    disconnectWallet: 'Отключить',
    copyAddress: 'Скопировать адрес',
    addressCopied: 'Адрес скопирован!'
  }
};
