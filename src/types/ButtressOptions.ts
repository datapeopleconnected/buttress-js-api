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

export default interface ButtressOptions {
  buttressUrl: string;
  appToken: string;
  apiPath: string;
  schema?: any[];
  // The API version in the URL, buttress only serves 1. Defaults to 1
  version?: number;
  update?: boolean;
  useLocalSchema?: boolean;
  allowUnauthorized?: boolean;
  // A UUID v4 sent as x-client-session-id, buttress includes it on the socket activity your requests cause
  clientSessionId?: string;
  // How many times a GET or QUERY that never got a response is retried after the first attempt, with backoff.
  // Defaults to 10, 0 fails straight away
  maxRetries?: number;
}
