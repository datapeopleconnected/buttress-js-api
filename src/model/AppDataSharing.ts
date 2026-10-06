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

import {PolicyConfig} from '../types/Policy';

export default interface AppDataSharing {
  id?: string;
  name: string;
  remoteApp: {
    endpoint: string;
    ws?: string | null;
    apiPath: string;
    // Leave it null to be given a registrationToken to hand to the other app, or pass that app's to join it.
    token: string | null;
    // The other app's id, which Buttress records when the two pair, null until then. A create naming it as its sourceId
    // goes to that app.
    appId?: string | null;
  };
  // What the other app is allowed to do with this one's data, Buttress refuses a data share without it.
  policyConfig: PolicyConfig[];
  _appId?: string;
}
