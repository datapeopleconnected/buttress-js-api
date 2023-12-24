export default interface ButtressOptions {
  buttressUrl: string,
  appToken: string,
  apiPath: string,
  schema?: any[],
  version: number,
  update?: boolean,
  allowUnauthorized?: boolean,
}