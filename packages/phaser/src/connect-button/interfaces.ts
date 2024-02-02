export interface Locale {
  connectWallet: string;
  disconnectWallet: string;
  copyAddress: string;
  addressCopied: string;
}

export interface LocalesDictionary {
  en: Locale;
  ru: Locale;
  [k: string]: Locale;
}
