// todo import / export from https://github.com/ton-community/assets-sdk/blob/ada116fa51861c2a137eecc119955bcab1c82c3d/src/content.ts

export interface ContentResolver {
  resolve(url: string): Promise<Buffer>;
}

export interface IpfsGateway {
  (id: string): string;
}

export interface UrlProxy {
  (url: string): string;
}

export interface ProxyContentResolverParams {
  ipfsGateway?: IpfsGateway;
  urlProxy?: UrlProxy;
}

export class DefaultContentResolver implements ContentResolver {
  readonly ipfsGateway: (id: string) => string;

  constructor(ipfsGateway?: (id: string) => string) {
    this.ipfsGateway = ipfsGateway ?? ((id: string) => `https://ipfs.io/ipfs/${id}`);
  }

  async resolve(url: string): Promise<Buffer> {
    if (url.startsWith('ipfs://')) {
      url = this.ipfsGateway(url.slice(7));
    }

    if (!(url.startsWith('https://') || url.startsWith('http://'))) {
      throw new Error('Unknown URL: ' + url);
    }

    return Buffer.from(await (await fetch(url)).arrayBuffer());
  }
}

export class ProxyContentResolver extends DefaultContentResolver {
  readonly urlProxy: UrlProxy;
  public static readonly replaceable: string = '%URL%';

  constructor({ipfsGateway, urlProxy}: ProxyContentResolverParams = {}) {
    super(ipfsGateway);
    this.urlProxy = urlProxy == null ? (url) => url : urlProxy;
  }

  public override resolve(url: string): Promise<Buffer> {
    return super.resolve(this.urlProxy(url));
  }
}
