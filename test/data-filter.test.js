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

    role.name = _path.join('.');

    _roles.push(role);
    return _roles;
  }, []);
};

describe('@data-filter', function() {
  this.timeout(2000);

  const Auth = Buttress.getCollection('auth');
  const Post = Buttress.getCollection('post');
  const Board = Buttress.getCollection('board');

  const TestUsersRoles = _mapUserRoles(TestAppRoles);

  let _testUsers = [];
  let _testBoards = [];
  let _testPosts = [];

  before(function(done) {
    const addUserRoles = TestUsersRoles.map(user => {
      return new Promise(resolve => {
        return Buttress.Auth
          .findOrCreateUser({
            app: 'google',
            id: '12345678987654321',
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
          })
          .then(res => resolve(res))
          .catch(function(err) {
            throw err;
          });
      });
    });

    const addPostBoards = () => {
      return _testUsers.map(user => {
        return Board.save({
          name: user.person.name,
          subscribed: [user.id]
        });
      });
    };

    const addTestPosts = () => {
      return _testBoards.reduce((arr, board) => {
        const posts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(() => {
          return Post.save({
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

    Promise.all(addUserRoles)
    .then(res => _testUsers = res) // eslint-disable-line no-return-assign
    .then(() => Promise.all(addPostBoards()))
    .then(res => _testBoards = res) // eslint-disable-line no-return-assign
    .then(() => Promise.all(addTestPosts()))
    .then(res => _testPosts = res) // eslint-disable-line no-return-assign
    .then(() => done());
  });

  after(function(done) {
    Post.removeAll()
      .then(Board.removeAll())
      .then(() => done()).catch(done);
  });

  // TODO:
  // * Should fetch filtered results based on the App role filter:
  //     A token should only receive boards & posts back that its subscribed to.
  //     - user.id (single)  -> board.subscribed (many)
  //     - board.id (single) -> post.boardId (single)

  describe('Post Basics', function() {
    it('should return only public boards', function(done) {
      const publicUser = _testUsers.find(user => user.person.name === 'public');

      Board.getAll({}, {
        query: {
          token: publicUser.authToken
        }
      })
        .then(function(boards) {
          boards.should.be.instanceof(Array);
          boards.should.not.be.empty();

          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
