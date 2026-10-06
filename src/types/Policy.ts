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

// Policies are written with @-prefixed operators, e.g. {role: {'@eq': 'admin'}}, and can refer to env values.
export interface PolicyConfig {
  verbs: string[];
  schema: string[];
  endpoints?: string[];
  env?: Record<string, unknown>;
  condition?: Record<string, unknown>;
  projection?: {keys: string[]};
  query?: Record<string, unknown>;
}

export interface Policy {
  id?: string;
  name: string;
  // Buttress refuses a policy without one, with invalid_policy_no_version
  version: string;
  selection: Record<string, unknown>;
  config: PolicyConfig[];
  priority?: number;
  merge?: boolean;
  env?: Record<string, unknown>;
  limit?: string | Date | null;
  // When a transient policy's limit passes, Buttress also takes the policy property named after it off the tokens it
  // selected. createUserTransientPolicy sets it.
  transient?: boolean;
}
