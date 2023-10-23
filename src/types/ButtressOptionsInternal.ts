export default interface ButtressOptionsInternal {
  buttressUrl?: string;
  authToken?: string;
  compiledSchema?: ButtressSchema[];
  isolated: boolean,
  apiPath: string;
  schema: ButtressSchema[];
  version: number;
  update: boolean;
  allowUnauthorized: boolean;
  url?: URLParse<string>;
  urls?: {
    core: string;
    app: string;
  }
}