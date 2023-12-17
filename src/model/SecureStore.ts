export default interface SecureStore {
  id: string;
  name: string;
  storeData: {
    [key: string]: any;
  }
}