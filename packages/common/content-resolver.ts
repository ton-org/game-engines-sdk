import {DefaultContentResolver, ContentResolver} from './content';

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

export {ContentResolver};
