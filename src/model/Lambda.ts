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

export interface LambdaCronTrigger {
  executionTime: string | Date;
  periodicExecution: string;
  status: 'PENDING' | 'RUNNING' | 'ERROR';
}

export interface LambdaApiEndpointTrigger {
  method: 'GET' | 'POST';
  url: string;
  type?: 'ASYNC' | 'SYNC';
  useCallerToken?: boolean;
  redirect?: boolean;
}

export interface LambdaTrigger {
  type?: 'CRON' | 'PATH_MUTATION' | 'API_ENDPOINT';
  cron?: LambdaCronTrigger;
  apiEndpoint?: LambdaApiEndpointTrigger;
  pathMutation?: {paths: string[]};
}

export interface LambdaGit {
  url: string;
  branch: string;
  hash: string;
  entryFile: string;
  entryPoint: string;
  sharedModules?: {name: string; entryFile: string}[];
}

// The token Buttress makes for the lambda to run with.
export interface LambdaAuth {
  // The domains the lambda's token works from
  domains: string[];
  // Can be given on the lambda instead, Buttress needs it in one of the two.
  policyProperties?: Record<string, unknown>;
  [key: string]: any;
}

export default interface Lambda {
  id?: string;
  name: string;
  type?: 'PRIVATE' | 'PUBLIC';
  executable?: boolean;
  git: LambdaGit;
  trigger: LambdaTrigger[];
  metadata?: {key: string; value: string}[];
  // Buttress copies these onto the auth given to createLambda
  policyProperties?: Record<string, unknown>;
}
