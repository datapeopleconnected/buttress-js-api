"use strict";

/**
 * Buttress API -
 *
 * @file board.test.js
 * @description
 * @author Lighten
 *
 */

const Buttress = require('../lib/buttressjs');
const Config = require('./config');
const ObjectId = require('mongodb').ObjectId;
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
  let _testPosts = [];

  before(function(done) {
    const addUserRoles = () => {
      return TestUsersRoles.map(user => {
        return Buttress.Auth
          .findOrCreateUser({
            app: 'google',
            id:  `${Math.floor(Math.random() * Math.floor(9999999999))}`,
            name: user.name,
            token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
            email: 'test@test.com',
            profileUrl: 'http://test.com/thisisatest',
            profileImgUrl: 'http://test.com/thisisatest.png'
          }, {
            authLevel: Buttress.Token.AuthLevel.USER,
            permissions: [{
              route: "*",
              permission: "*"
            }],
            role: user.name,
            domains: [Buttress.options.url.host]
          });
      });
    };

    const addPostBoards = () => {
      return _testUsers.map(user => {
        const token = user.tokens[0];
        return Buttress.getCollection('boards').save({
          name: token.role,
          subscribed: [user.id]
        });
      });
    };

    const addTestPosts = () => {
      return _testBoards.reduce((arr, board) => {
        const posts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(() => {
          return Buttress.getCollection('posts').save({
            content: "Hello world",
            memberSecretContent: "",
            adminSecretContent: "",
            boardId: board.id,
            parentPostId: null,
            userId: board.subscribed[0]
          });
        });
        return arr.concat(posts);
      }, []);
    };

    Promise.all(addUserRoles())
      .then(res => _testUsers = res) // eslint-disable-line no-return-assign
      .then(() => Promise.all(addPostBoards()))
      .then(res => _testBoards = res) // eslint-disable-line no-return-assign
      .then(() => Promise.all(addTestPosts()))
      .then(res => _testPosts = res) // eslint-disable-line no-return-assign
      .then(() => done());
  });

  after(function(done) {
    Buttress.User.removeAll()
      .then(() => Buttress.getCollection('posts').removeAll())
      .then(() => Buttress.getCollection('boards').removeAll())
      .then(() => done()).catch(done);
  });

  // TODO:
  // * Should fetch filtered results based on the App role filter:
  //     A token should only receive boards & posts back that its subscribed to.
  //     - user.id (single)  -> board.subscribed (many)
  //     - board.id (single) -> post.boardId (single)

  describe('Boards', function() {
    it('should only return boards user is subscribed to', function(done) {
      const publicUser = _testUsers.find((u) => u.tokens.some(t => t.role === 'public'));
      const token = publicUser.tokens.find(t => t.role === 'public');

      Buttress.getCollection('boards').getAll({}, {
        query: {
          token: token.value
        }
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
      const publicUser = _testUsers.find(u => u.tokens.some(t => t.role === 'public'));
      const token = publicUser.tokens.find(t => t.role === 'public');
      const publicBoard = _testBoards.find(board => board.name === 'public');

      Buttress.getCollection('posts').getAll({}, {
        query: {
          token: token.value
        }
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
  });
});
