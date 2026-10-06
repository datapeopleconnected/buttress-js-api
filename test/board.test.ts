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

import Buttress from '../dist/index';
import Config from './config';

import Schemas from './data/schema';

Config.init();

describe('@boards', function () {
  this.timeout(2000);

  before(async function () {
    Config.configureTest();
    await Buttress.setSchema(Schemas);
  });

  after(function (done) {
    Buttress.getCollection('board')
      .removeAll()
      .then(() => done())
      .catch(done);
  });

  describe('Post Basics', function () {
    it('should return no boards', function (done) {
      Config.retryUnrouted(() => Buttress.getCollection('board').getAll())
        .then(function (boards) {
          boards.length.should.equal(0);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  });
});
