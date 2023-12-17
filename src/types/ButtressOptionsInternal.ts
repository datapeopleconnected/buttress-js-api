import Schema from "../model/Schema";

import URLParse from "url-parse";

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
  url?: URLParse<string>;
  urls?: {
    core: string;
    app: string;
  }
}