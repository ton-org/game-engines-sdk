/*
Content of this file is copied from
https://github.com/ton-connect/sdk/blob/47383e374dea1b066f01d42a8f5a51c3fd505af9/packages/ui/src/app/utils/tma-api.ts
https://github.com/ton-connect/sdk/blob/f61090617439e80f29b688647f752cd760b84f66/packages/ui/src/app/utils/web-api.ts
to keep all the logic from Connect UI lib

Copied from tag 3.0.0

// todo remove it after SKD update
*/

import {TonConnectError, encodeTelegramUrlParameters, isTelegramUrl} from '@tonconnect/sdk';
import {UAParser} from 'ua-parser-js';

type TelegramWebviewProxy = {
  postEvent(eventType: string, eventData: string): void;
};

type ReturnStrategy = 'back' | 'none' | `${string}://${string}`;
type TmaPlatform = 'android' | 'ios' | 'macos' | 'tdesktop' | 'weba' | 'web' | 'unknown';

function convertToTGDirectLink(universalLink: string): string {
  const url = new URL(universalLink);

  if (url.searchParams.has('attach')) {
    url.searchParams.delete('attach');
    url.pathname += '/start';
  }

  return url.toString();
}

function convertToTGDeepLink(directLink: string): string {
  const parsed = new URL(directLink);
  const [, domain, appname] = parsed.pathname.split('/');
  const startapp = parsed.searchParams.get('startapp');
  return `tg://resolve?domain=${domain}&appname=${appname}&startapp=${startapp}`;
}

function urlSafeDecode(urlencoded: string): string {
  try {
    urlencoded = urlencoded.replace(/\+/g, '%20');
    return decodeURIComponent(urlencoded);
  } catch (e) {
    return urlencoded;
  }
}

function urlParseQueryString(queryString: string): Record<string, string | null> {
  let params: Record<string, string | null> = {};
  if (!queryString.length) {
    return params;
  }
  let queryStringParams = queryString.split('&');
  let i, param, paramName, paramValue;
  for (i = 0; i < queryStringParams.length; i++) {
    param = queryStringParams[i]!.split('=');
    paramName = urlSafeDecode(param[0]!);
    paramValue = param[1] == null ? null : urlSafeDecode(param[1]);
    params[paramName] = paramValue;
  }
  return params;
}

function urlParseHashParams(locationHash: string): Record<string, string> {
  locationHash = locationHash.replace(/^#/, '');
  let params: Record<string, string> = {};
  if (!locationHash.length) {
    return params;
  }
  if (locationHash.indexOf('=') < 0 && locationHash.indexOf('?') < 0) {
    params['_path'] = urlSafeDecode(locationHash);
    return params;
  }
  let qIndex = locationHash.indexOf('?');
  if (qIndex >= 0) {
    let pathParam = locationHash.substr(0, qIndex);
    params['_path'] = urlSafeDecode(pathParam);
    locationHash = locationHash.substr(qIndex + 1);
  }
  let query_params = urlParseQueryString(locationHash);
  for (let k in query_params) {
    params[k] = query_params[k]!;
  }
  return params;
}

let initParams: Record<string, string> = {};
try {
  let locationHash = location.hash.toString();
  initParams = urlParseHashParams(locationHash);
} catch (e) {}

let tmaPlatform: TmaPlatform = 'unknown';
// @ts-ignore
if (initParams?.tgWebAppPlatform) {
  // @ts-ignore
  tmaPlatform = (initParams.tgWebAppPlatform as TmaPlatform) ?? 'unknown';
}
if (tmaPlatform === 'unknown') {
  const window = getWindow();
  // @ts-ignore
  tmaPlatform = window?.Telegram?.WebApp?.platform ?? 'unknown';
}

let webAppVersion = '6.0';
// @ts-ignore
if (initParams?.tgWebAppVersion) {
  // @ts-ignore
  webAppVersion = initParams.tgWebAppVersion;
}
if (!webAppVersion) {
  const window = getWindow();
  // @ts-ignore
  webAppVersion = window?.Telegram?.WebApp?.version ?? '6.0';
}

function getWindow(): Window | undefined {
  if (typeof window !== 'undefined') {
    return window;
  }

  return undefined;
}

function isInTMA(): boolean {
  return (
    tmaPlatform !== 'unknown' ||
    !!(getWindow() as {TelegramWebviewProxy: unknown} | undefined)?.TelegramWebviewProxy
  );
}

function isTmaPlatform(...platforms: TmaPlatform[]): boolean {
  return platforms.includes(tmaPlatform);
}

function addQueryParameter(url: string, key: string, value: string): string {
  const parsed = new URL(url);
  parsed.searchParams.append(key, value);
  return parsed.toString();
}

function addReturnStrategy(
  url: string,
  strategy:
    | ReturnStrategy
    | {
        returnStrategy: ReturnStrategy;
        twaReturnUrl: `${string}://${string}` | undefined;
      }
): string {
  let returnStrategy;
  if (typeof strategy === 'string') {
    returnStrategy = strategy;
  } else {
    returnStrategy = isInTMA() ? strategy.twaReturnUrl || strategy.returnStrategy : 'none';
  }
  const newUrl = addQueryParameter(url, 'ret', returnStrategy);

  if (!isTelegramUrl(url)) {
    return newUrl;
  }

  const lastParam = newUrl.slice(newUrl.lastIndexOf('&') + 1);
  return newUrl.slice(0, newUrl.lastIndexOf('&')) + '-' + encodeTelegramUrlParameters(lastParam);
}

const TonConnectUIError = TonConnectError;

function isIframe(): boolean {
  try {
    const window = getWindow();
    if (!window) {
      return false;
    }
    return window.parent != null && window !== window.parent;
  } catch (e) {
    return false;
  }
}

function versionCompare(v1: string | undefined, v2: string | undefined): 0 | 1 | -1 {
  if (typeof v1 !== 'string') v1 = '';
  if (typeof v2 !== 'string') v2 = '';
  let v1List = v1.replace(/^\s+|\s+$/g, '').split('.');
  let v2List = v2.replace(/^\s+|\s+$/g, '').split('.');
  let a: number, i, p1, p2;
  a = Math.max(v1List.length, v2List.length);
  for (i = 0; i < a; i++) {
    p1 = parseInt(v1List[i]!) || 0;
    p2 = parseInt(v2List[i]!) || 0;
    if (p1 === p2) continue;
    if (p1 > p2) return 1;
    return -1;
  }
  return 0;
}

function versionAtLeast(ver: string): boolean {
  return versionCompare(webAppVersion, ver) >= 0;
}

declare global {
  interface External {
    notify: (message: string) => void;
  }

  interface Window {
    TelegramWebviewProxy?: TelegramWebviewProxy;
  }
}

function postEvent(eventType: 'web_app_open_tg_link', eventData: {path_full: string}): void;
function postEvent(eventType: 'web_app_expand', eventData: {}): void;
function postEvent(eventType: string, eventData: object): void {
  try {
    const window = getWindow();
    if (!window) {
      throw new TonConnectUIError(`Can't post event to parent window: window is not defined`);
    }

    if (window.TelegramWebviewProxy !== undefined) {
      window.TelegramWebviewProxy.postEvent(eventType, JSON.stringify(eventData));
    } else if (window.external && 'notify' in window.external) {
      window.external.notify(JSON.stringify({eventType: eventType, eventData: eventData}));
    } else if (isIframe()) {
      const trustedTarget = '*';
      const message = JSON.stringify({eventType: eventType, eventData: eventData});
      window.parent.postMessage(message, trustedTarget);
    } else {
      throw new TonConnectUIError(`Can't post event to TMA`);
    }
  } catch (e) {
    console.log(`Can't post event to parent window: ${e}`);
  }
}

function sendOpenTelegramLink(link: string): void {
  const url = new URL(link);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TonConnectUIError(`Url protocol is not supported: ${url}`);
  }
  if (url.hostname !== 't.me') {
    throw new TonConnectUIError(`Url host is not supported: ${url}`);
  }

  const pathFull = url.pathname + url.search;

  if (isIframe() || versionAtLeast('6.1')) {
    postEvent('web_app_open_tg_link', {path_full: pathFull});
  } else {
    openLinkBlank('https://t.me' + pathFull);
  }
}

function openLink(href: string, target = '_self'): void {
  window.open(href, target, 'noopener noreferrer');
}

function openLinkBlank(href: string): void {
  openLink(href, '_blank');
}

interface UserAgent {
  os: 'ios' | 'android' | 'macos' | 'windows' | 'linux' | undefined;
  browser: 'chrome' | 'firefox' | 'safari' | undefined;
}

export function getUserAgent(): UserAgent {
  const results = new UAParser().getResult();
  const osName = results.os.name?.toLowerCase();
  let os: UserAgent['os'];
  switch (true) {
    case osName === 'ios':
      os = 'ios';
      break;
    case osName === 'android':
      os = 'android';
      break;
    case osName === 'mac os':
      os = 'macos';
      break;
    case osName === 'linux':
      os = 'linux';
      break;
    case osName?.includes('windows'):
      os = 'windows';
      break;
  }

  const browserName = results.browser.name?.toLowerCase();
  let browser: UserAgent['browser'] | undefined;
  switch (true) {
    case browserName === 'chrome':
      browser = 'chrome';
      break;
    case browserName === 'firefox':
      browser = 'firefox';
      break;
    case browserName?.includes('safari'):
      browser = 'safari';
      break;
  }

  return {
    os,
    browser
  };
}

function isOS(...os: UserAgent['os'][]): boolean {
  return os.includes(getUserAgent().os);
}

function openDeeplinkWithFallback(href: string, fallback: () => void): void {
  const doFallback = (): void => {
    if (isBrowser('safari')) {
      // Safari does not support fallback to direct link.
      return;
    }

    fallback();
  };
  const fallbackTimeout = setTimeout(() => doFallback(), 200);
  window.addEventListener('blur', () => clearTimeout(fallbackTimeout), {once: true});

  openLink(href, '_self');
}

export function isBrowser(...browser: UserAgent['browser'][]): boolean {
  return browser.includes(getUserAgent().browser);
}

export function redirectToTelegram(
  universalLink: string,
  options: {
    returnStrategy: ReturnStrategy;
    twaReturnUrl: `${string}://${string}` | undefined;
    forceRedirect: boolean;
  }
): void {
  options = {...options};
  // TODO: Remove this line after all dApps and the wallets-list.json have been updated
  const directLink = convertToTGDirectLink(universalLink);
  const directLinkUrl = new URL(directLink);

  if (!directLinkUrl.searchParams.has('startapp')) {
    directLinkUrl.searchParams.append('startapp', 'tonconnect');
  }

  if (isInTMA()) {
    if (isTmaPlatform('ios', 'android')) {
      // Use the `none` strategy, the current TMA instance will keep open.
      // TON Space should automatically open in stack and should close
      // itself after the user action.

      options.returnStrategy = 'back';
      options.twaReturnUrl = undefined;

      sendOpenTelegramLink(addReturnStrategy(directLinkUrl.toString(), options));
    } else if (isTmaPlatform('macos', 'tdesktop')) {
      // Use a strategy involving a direct link to return to the app.
      // The current TMA instance will close, and TON Space should
      // automatically open, and reopen the application once the user
      // action is completed.

      sendOpenTelegramLink(addReturnStrategy(directLinkUrl.toString(), options));
    } else if (isTmaPlatform('weba')) {
      // Similar to macos/tdesktop strategy, but opening another TMA occurs
      // through sending `web_app_open_tg_link` event to `parent`.

      sendOpenTelegramLink(addReturnStrategy(directLinkUrl.toString(), options));
    } else if (isTmaPlatform('web')) {
      // Similar to iOS/Android strategy, but opening another TMA occurs
      // through sending `web_app_open_tg_link` event to `parent`.

      options.returnStrategy = 'back';
      options.twaReturnUrl = undefined;

      sendOpenTelegramLink(addReturnStrategy(directLinkUrl.toString(), options));
    } else {
      // Fallback for unknown platforms. Should use desktop strategy.

      openLinkBlank(addReturnStrategy(directLinkUrl.toString(), options));
    }
  } else {
    // For browser
    if (isOS('ios', 'android')) {
      // Use the `none` strategy. TON Space should do nothing after the user action.

      options.returnStrategy = 'none';

      openLinkBlank(addReturnStrategy(directLinkUrl.toString(), options.returnStrategy));
    } else if (isOS('macos', 'windows', 'linux')) {
      // Use the `none` strategy. TON Space should do nothing after the user action.

      options.returnStrategy = 'none';
      options.twaReturnUrl = undefined;

      if (options.forceRedirect) {
        openLinkBlank(addReturnStrategy(directLinkUrl.toString(), options));
      } else {
        const link = addReturnStrategy(directLinkUrl.toString(), options);
        const deepLink = convertToTGDeepLink(link);

        openDeeplinkWithFallback(deepLink, () => openLinkBlank(link));
      }
    } else {
      // Fallback for unknown platforms. Should use desktop strategy.

      openLinkBlank(addReturnStrategy(directLinkUrl.toString(), options));
    }
  }
}
