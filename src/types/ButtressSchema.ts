import type { ButtressSchemaProperties } from './ButtressSchemaProperties';

export type ButtressSchema = {
  name: string,
  type: string,
  core?: boolean,
  properties: ButtressSchemaProperties,
};
export default ButtressSchema;