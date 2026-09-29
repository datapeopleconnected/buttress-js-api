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

// The other properties depend on the schema. They're `any` rather than `unknown` so untyped callers can still read them.
export interface Entity {
  id: string;
  [key: string]: any;
}

export interface UpdateOperation {
  path: string;
  value: unknown;
}

export interface UpdateResult {
  type: 'scalar' | 'scalar-increment' | 'vector-add' | 'vector-rm';
  path: string;
  value: unknown;
}

export interface BulkUpdateItem {
  id: string;
  sourceId?: string;
  body: UpdateOperation | UpdateOperation[];
}

// A refused item has null results, and validation says why.
export interface BulkUpdateResult {
  id: string;
  sourceId?: string;
  results: UpdateResult[] | null;
  validation?: {code: number; message: string};
}
