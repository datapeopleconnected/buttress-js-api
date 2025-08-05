'use strict';

const { Test } = require('mocha');
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

const {default: Buttress} = require('../dist/index');
const Config = require('./config');
const polices = require('./data/policy/index.js');

const TestAppRoles = {
  'public': polices['data-filter-public'],
  'user.member': polices['data-filter-admin'],
  'admin.super': polices['data-filter-user'],
};

Config.init();

describe('@data-filter', function() {
  const TestUsersRoles = Object.keys(TestAppRoles);

  let _testUsers = [];
  let _testBoards = [];

  before(async function() {
    Config.configureTest();

    const addUserRoles = () => {
      return TestUsersRoles.map((key) => {
        const policy = TestAppRoles[key];
        const role = policy.selection.role['@eq'];
        const id = `dft-${Math.floor(Math.random() * Math.floor(9999999999))}`;
        return Buttress.Auth
          .findOrCreateUser({
            app: 'data-filter-test',
            appId: id,
            name: key,
            token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
            email: `${id}@example.com`,
            profileUrl: 'http://test.com/thisisatest',
            profileImgUrl: 'http://test.com/thisisatest.png',
          }, {
            domains: [Buttress.options.url.host],
            policyProperties: {
              role,
            },
          });
      });
    };

    const addPostBoards = () => {
      return _testUsers.map((user) => {
        const [token] = user.tokens;
        return Buttress.getCollection('board').save({
          name: token.policyProperties.role,
          subscribed: [user.id],
        });
      });
    };

    const addTestPosts = () => {
      return _testBoards.reduce((arr, board) => {
        const posts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
          return Buttress.getCollection('post').save({
            content: 'Hello world',
            memberSecretContent: '',
            adminSecretContent: '',
            boardId: board.id,
            parentPostId: null,
            kudos: i,
            userId: board.subscribed[0],
          });
        });
        return arr.concat(posts);
      }, []);
    };

    _testUsers = await Promise.all(addUserRoles());
    _testBoards = await Promise.all(addPostBoards());
    await Promise.all(addTestPosts());
  });

  after(async function() {
    Config.configureTest();

    await Buttress.getCollection('post').removeAll();
  });

  // TODO:
  // * Should fetch filtered results based on the App role filter:
  //     A token should only receive boards & posts back that its subscribed to.
  //     - user.id (single)  -> board.subscribed (many)
  //     - board.id (single) -> post.boardId (single)

  describe('Token', function() {
    it('should respond 401 with invalid_token', async function() {
      try {
        await Buttress.getCollection('board').getAll({
          token: `RANDOMTOKEN`,
        })
        throw new Error('Request should not have succeeded');
      } catch (err) {
        err.message.should.not.be.equal('Request should not have succeeded');

        err.statusCode.should.equal(401);
        err.message.should.equal('Unauthorized');
      }
    });
  });

  describe('Boards', function() {
    it('should only return boards user is subscribed to', function(done) {
      const publicUser = _testUsers.find((u) => u.tokens.some((t) => t.policyProperties.role === 'public'));
      const token = publicUser.tokens.find((t) => t.policyProperties.role === 'public');

      Buttress.getCollection('board').getAll({
        token: token.value,
      })
        .then(function(boards) {
          boards.should.be.instanceof(Array);
          boards.should.not.be.empty();
          boards.should.be.lengthOf(1);
          boards[0].name.should.be.equal('public');

          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });

  describe('Posts', function() {
    it('should return posts that are part of the public board', function(done) {
      const publicUser = _testUsers.find((u) => u.tokens.some((t) => t.policyProperties.role === 'public'));
      const token = publicUser.tokens.find((t) => t.policyProperties.role === 'public');
      const publicBoard = _testBoards.find((board) => board.name === 'public');

      Buttress.getCollection('post').getAll({
        token: token.value,
      })
        .then(function(posts) {
          posts.should.be.instanceof(Array);
          posts.should.not.be.empty();

          for (const idx in posts) {
            if (!posts.hasOwnProperty(idx)) continue;
            posts[idx].boardId.should.equal(publicBoard.id);
          }

          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return posts that are part of the public board with more than 5 kudos', function(done) {
      const publicUser = _testUsers.find((u) => u.tokens.some((t) => t.policyProperties.role === 'public'));
      const token = publicUser.tokens.find((t) => t.policyProperties.role === 'public');

      Buttress.getCollection('post').search({
        kudos: {
          gt: 5,
        },
      }, 0, 0, null, {
        token: token.value,
      })
        .then(function(posts) {
          posts.should.be.instanceof(Array);
          posts.should.not.be.empty();
          posts.should.be.lengthOf(5);

          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return posts ids that are part of the public board with more than 5 kudos', function(done) {
      const publicUser = _testUsers.find((u) => u.tokens.some((t) => t.policyProperties.role === 'public'));
      const token = publicUser.tokens.find((t) => t.policyProperties.role === 'public');

      Buttress.getCollection('post').search({
        kudos: {
          gt: 5,
        },
      }, 0, 0, null, {
        project: {content: 1},
        token: token.value,
      })
        .then(function(posts) {
          posts.should.be.instanceof(Array);
          posts.should.not.be.empty();
          posts.should.be.lengthOf(5);

          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return a total count of posts', function(done) {
      Buttress.getCollection('post').count()
        .then((count) => {
          count.should.be.instanceof(Number);
          count.should.equal(30);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return a count of posts that are part of the public board', function(done) {
      const publicUser = _testUsers.find((u) => u.tokens.some((t) => t.policyProperties.role === 'public'));
      const token = publicUser.tokens.find((t) => t.policyProperties.role === 'public');

      Buttress.getCollection('post').count({}, null, {
        token: token.value,
      })
        .then((count) => {
          count.should.be.instanceof(Number);
          count.should.equal(10);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return a count of posts that are part of the public board with more than 5 kudos', function(done) {
      const publicUser = _testUsers.find((u) => u.tokens.some((t) => t.policyProperties.role === 'public'));
      const token = publicUser.tokens.find((t) => t.policyProperties.role === 'public');

      Buttress.getCollection('post').count({
        kudos: {
          gt: 5,
        },
      }, null, {
        token: token.value,
      })
        .then((count) => {
          count.should.be.instanceof(Number);
          count.should.equal(5);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
