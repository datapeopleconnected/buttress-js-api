'use strict';

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
const TestAppRoles = require('./data/appRoles.json');

Config.init();

// Used to map test role data to a array flat array.
const _mapUserRoles = (data, path) => {
  if (!path) path = [];

  return data.roles.reduce((_roles, role) => {
    const _path = path.concat(`${role.name}`);
    if (role.roles && role.roles.length > 0) {
      return _roles.concat(_mapUserRoles(role, _path));
    }

    const flatRole = Object.assign({}, role);
    flatRole.name = _path.join('.');
    _roles.push(flatRole);
    return _roles;
  }, []);
};

describe('@data-filter', function() {
  const TestUsersRoles = _mapUserRoles(TestAppRoles);

  let _testUsers = [];
  let _testBoards = [];

  before(function(done) {
    const addUserRoles = () => {
      return TestUsersRoles.map((user) => {
        return Buttress.Auth
          .findOrCreateUser({
            app: 'google',
            id: `${Math.floor(Math.random() * Math.floor(9999999999))}`,
            name: user.name,
            token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
            email: 'test@test.com',
            profileUrl: 'http://test.com/thisisatest',
            profileImgUrl: 'http://test.com/thisisatest.png',
          }, {
            domains: [Buttress.options.url.host],
          });
      });
    };

    const addPostBoards = () => {
      return _testUsers.map((user) => {
        const token = user.token;
        return Buttress.getCollection('boards').save({
          name: token.role,
          subscribed: [user.id],
        });
      });
    };

    const addTestPosts = () => {
      return _testBoards.reduce((arr, board) => {
        const posts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
          return Buttress.getCollection('posts').save({
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

    Promise.all(addUserRoles())
      .then((res) => _testUsers = res) // eslint-disable-line no-return-assign
      .then(() => Promise.all(addPostBoards()))
      .then((res) => _testBoards = res) // eslint-disable-line no-return-assign
      .then(() => Promise.all(addTestPosts()))
      .then(() => done())
      .catch(done);
  });

  after(function(done) {
    Buttress.User.removeAll()
      .then(() => Buttress.getCollection('posts').removeAll())
      .then(() => Buttress.getCollection('boards').removeAll())
      .then(() => done())
      .catch(done);
  });

  // TODO:
  // * Should fetch filtered results based on the App role filter:
  //     A token should only receive boards & posts back that its subscribed to.
  //     - user.id (single)  -> board.subscribed (many)
  //     - board.id (single) -> post.boardId (single)

  describe('Token', function() {
    it('should respond 401 with invalid_token', function(done) {
      Buttress.getCollection('boards').getAll({
        params: {
          token: `RANDOMTOKEN`,
        },
      })
        .catch(function(err) {
          err.statusCode.should.equal(401);
          err.message.should.equal('invalid_token');
          done();
        });
    });
  });

  describe('Boards', function() {
    it('should only return boards user is subscribed to', function(done) {
      const publicUser = _testUsers.find((u) => u.tokens.some((t) => t.role === 'public'));
      const token = publicUser.tokens.find((t) => t.role === 'public');

      Buttress.getCollection('boards').getAll({
        params: {
          token: token.value,
        },
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
      const publicUser = _testUsers.find((u) => u.tokens.some((t) => t.role === 'public'));
      const token = publicUser.tokens.find((t) => t.role === 'public');
      const publicBoard = _testBoards.find((board) => board.name === 'public');

      Buttress.getCollection('posts').getAll({
        params: {
          token: token.value,
        },
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
      const publicUser = _testUsers.find((u) => u.tokens.some((t) => t.role === 'public'));
      const token = publicUser.tokens.find((t) => t.role === 'public');

      Buttress.getCollection('posts').search({
        kudos: {
          gt: 5,
        },
      }, 0, 0, null, {
        params: {
          token: token.value,
        },
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
      const publicUser = _testUsers.find((u) => u.tokens.some((t) => t.role === 'public'));
      const token = publicUser.tokens.find((t) => t.role === 'public');

      Buttress.getCollection('posts').search({
        kudos: {
          gt: 5,
        },
      }, 0, 0, null, {
        project: {content: 1},
        params: {
          token: token.value,
        },
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
      Buttress.getCollection('posts').count()
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
      const publicUser = _testUsers.find((u) => u.tokens.some((t) => t.role === 'public'));
      const token = publicUser.tokens.find((t) => t.role === 'public');

      Buttress.getCollection('posts').count({}, null, {
        params: {
          token: token.value,
        },
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
      const publicUser = _testUsers.find((u) => u.tokens.some((t) => t.role === 'public'));
      const token = publicUser.tokens.find((t) => t.role === 'public');

      Buttress.getCollection('posts').count({
        kudos: {
          gt: 5,
        },
      }, null, {
        params: {
          token: token.value,
        },
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
