export default interface AppDataSharing {
  id?: string
  name: string
  remoteApp: {
    endpoint: string
    apiPath: string
    token: string
  }
  policy: any[],
  _appId?: string
}