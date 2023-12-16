export interface Property {
  __type: string,
  __default?: any,
  __required?: boolean,
  __allowUpdate?: boolean,
}

export interface Properties {
  [key: string]: Property | Properties
}

export default interface Schema {
  name: string,
  type: string,
  extends?: string[],
  core?: boolean,
  properties: Properties
}