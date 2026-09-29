/**
 * Buttress API - The federated real-time open data platform
 * Copyright (C) 2016-2024 Data People Connected LTD.
 * <https://www.dpc-ltd.com/>
 *
 * This file is part of Buttress.
 * Buttress is free software: you can redistribute it and/or modify it under the
 * terms of the GNU Affero General Public Licence as published by the Free Software
 * Foundation, either version 3 of the Licence, or (at your option) any later version.
 * Buttress is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public Licence for more details.
 * You should have received a copy of the GNU Affero General Public Licence along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {Entity} from './Entity';

type Primitive = string | number | boolean | bigint | symbol | null | undefined | Date;

// Operators compare an array's elements one at a time.
type Operand<V> = V extends readonly (infer E)[] ? E : V;

type ElementQuery<V> = unknown extends V
  ? LooseQuery
  : NonNullable<Operand<V>> extends object
    ? Query<NonNullable<Operand<V>> & object>
    : never;

export type DateOperand = string | Date | null;

// Only the operators crag can also run in the browser. Buttress accepts more, such as `gt` without the `$`.
export interface QueryOperators<V = unknown> {
  $eq?: Operand<V>;
  $not?: Operand<V>;
  $gt?: Operand<V>;
  $gte?: Operand<V>;
  $lt?: Operand<V>;
  $lte?: Operand<V>;
  $in?: Operand<V>[];
  $nin?: Operand<V>[];
  $exists?: boolean;
  $rex?: string;
  $rexi?: string;
  $inProp?: string;
  $gtDate?: DateOperand;
  $gteDate?: DateOperand;
  $ltDate?: DateOperand;
  $lteDate?: DateOperand;
  $elMatch?: ElementQuery<V>;
}

export interface LooseQuery {
  $and?: LooseQuery[];
  $or?: LooseQuery[];
  [path: string]: QueryOperators | LooseQuery[] | undefined;
}

// Properties a dotted path can reach into.
type NestedKey<T> = {[K in keyof T & string]: NonNullable<T[K]> extends Primitive ? never : K}[keyof T & string];

export type TypedQuery<T extends object> = {
  [K in keyof T & string]?: QueryOperators<T[K]>;
} & {
  [P in `${NestedKey<T>}.${string}`]?: QueryOperators;
} & {
  $and?: TypedQuery<T>[];
  $or?: TypedQuery<T>[];
};

// A type with an index signature, such as Entity, can't list its paths, so it takes any path.
export type Query<T extends object = Entity> = string extends keyof T ? LooseQuery : TypedQuery<T>;

export type Sort = Record<string, 1 | -1>;

export type Projection = Record<string, 1 | -1>;
