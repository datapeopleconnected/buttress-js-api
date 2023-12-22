import Schema from "../model/Schema";
import {URL} from 'url';

// URL {
//   href: 'https://www.google.com/',
//   origin: 'https://www.google.com',
//   protocol: 'https:',
//   username: '',
//   password: '',
//   host: 'www.google.com',
//   hostname: 'www.google.com',
//   port: '',
//   pathname: '/',
//   search: '',
//   searchParams: URLSearchParams {},
//   hash: ''
// }

export default interface ButtressOptionsInternal {
  buttressUrl?: string;
  authToken?: string;
  compiledSchema?: Schema[];
  isolated: boolean,
  apiPath: string;
  schema: Schema[];
  version: number;
  update: boolean;
  allowUnauthorized: boolean;
  url?: URL;
  urls?: {
    core: string;
    app: string;
  }
}