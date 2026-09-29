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

// Compiled by `npm run test:types`, never run. Each @ts-expect-error fails the check if its line starts compiling.
import type {Readable} from 'stream';

import Buttress, {BaseSchema} from '../../src/index';

interface Post {
  id: string;
  content: string;
  kudos: number;
  tags: string[];
  someArray: {id: string; name: string}[];
  someObject: {someProperty: string};
  archivedAt?: string | null;
}

export async function untypedCollection() {
  const posts = Buttress.getCollection('post');

  await posts.search({kudos: {$gt: 5}});
  await posts.search({$or: [{kudos: {$gt: 5}}, {'someObject.someProperty': {$rexi: 'x'}}]});
  await posts.search({kudos: {$gt: 5}}, 0, 0, null, {token: 'x'});
  await posts.search({kudos: {$gt: 5}}, 0, 0, 0, {project: {content: 1}});
  // @ts-expect-error operators need the $ prefix
  await posts.search({kudos: {gt: 5}});
  // @ts-expect-error Buttress takes $ne, but crag can't run it locally
  await posts.search({kudos: {$ne: 5}});
  // @ts-expect-error project is a projection, not a string
  await posts.search({}, 0, 0, null, {project: 'content'});

  const post = await posts.get('id');
  post.anyProperty.isReadable();

  const count: number = await posts.count();
  return count;
}

export async function typedCollection() {
  const posts = Buttress.getCollection<BaseSchema<Post>>('post');

  const results: Post[] = await posts.search({kudos: {$gte: 1}, tags: {$in: ['a']}});
  await posts.search({someArray: {$elMatch: {name: {$eq: 'x'}}}});
  await posts.search({'someObject.someProperty': {$eq: 'x'}, archivedAt: {$eq: null}});
  // @ts-expect-error the operand has the property's type
  await posts.search({kudos: {$gt: 'five'}});
  // @ts-expect-error unknown property
  await posts.search({kudoz: {$gt: 5}});
  // @ts-expect-error operators need the $ prefix
  await posts.search({kudos: {gt: 5}});
  // @ts-expect-error a bare value isn't an operator, use $eq
  await posts.search({content: 'hello'});

  const all: Post[] = await posts.getAll();
  const stream: Readable = await posts.getAll({stream: true});
  const searchStream: Readable = await posts.search({}, 0, 0, null, {stream: true});

  const saved: Post = await posts.save({content: 'x'});
  const [result] = await posts.update(saved.id, {path: 'kudos', value: 1});
  // @ts-expect-error update takes {path, value} updates
  await posts.update(saved.id, {kudos: 1});

  const [bulkResult] = await posts.bulkUpdate([{id: 'a', body: [{path: 'kudos', value: 1}]}]);
  const removed: boolean = await posts.bulkRemove(['a']);

  return {results, all, stream, searchStream, result, bulkResult, removed};
}
