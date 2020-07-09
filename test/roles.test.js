"use strict";

/**
 * Buttress API -
 *
 * @file roles.test.js
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

describe('@roles', function() {
  this.timeout(2000);

  const TestUsersRoles = _mapUserRoles(TestAppRoles);

  let _testUsers = [];

  before(function(done) {
    // NOTE: Why not use bulk add instead?
    // Setup promise queue for adding test users
    const addUserTasks = TestUsersRoles.map(user => {
      return new Promise(resolve => {
        const appId = Math.floor(Math.random() * Math.floor(200)) + 1;
        return Buttress.Auth
          .findOrCreateUser({
            app: 'google',
            id: appId,
            name: user.name,
            token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
            email: `test${appId}@example.com`,
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

    const addTestPosts = [1].map(() => {
      return new Promise(resolve => {
        return Buttress.getCollection('posts').save({
          content: "Hello world",
          memberSecretContent: "",
          adminSecretContent: "",
          parentPostId: null,
          userId: null
        })
        .then(res => resolve(res))
        .catch(function(err) {
          throw err;
        });
      });
    });

    Promise.all(addUserTasks)
    .then(res => {
      _testUsers = res;
    })
    .then(() => Promise.all(addTestPosts))
    .then(() => done());
  });

  after(function(done) {
    Buttress.getCollection('posts').removeAll()
      .then(() => done()).catch(done);
  });

  describe('Role basics', function() {
    it('should have test users for each role', function(done) {
      _testUsers.length.should.equal(TestUsersRoles.length);
      done();
    });
  });

  describe('Role public', function() {
    const roleName = 'public';
    let _user = null;
    let requestOptions = {
      params: {
        token: null
      }
    };

    it(`should have a ${roleName} test user`, function(done) {
      _user = _testUsers.find(u => u.tokens.some(t => t.role === roleName));
      if (_user) {
        requestOptions.params.token = _user.tokens.find(t => t.role === roleName).value;
        done();
      } else {
        done(new Error(`a user with the role ${roleName} doesn't exist`));
      }
    });

    it('should make get a 200 responce', function(done) {
      Buttress.getCollection('posts').getAll({}, requestOptions)
        .then(function(posts) {
          posts.should.be.instanceof(Array);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should make get a 403 responce', function(done) {
      // TODO: Remove required non-user fields
      Buttress.getCollection('posts').save({
        content: "Hello world",
        parentPostId: null,
        userId: _user.id
      }, requestOptions)
        .then(function() {
          done(new Error('Should not succeed'));
        })
        .catch(function(err) {
          err.statusCode.should.equal(403);
          done();
        });
    });

    it('should make get a 400 responce', function(done) {
      done();
    });
  });

  describe('Role user.member', function() {
    const roleName = 'user.member';
    let _user = null;
    let requestOptions = {
      params: {
        token: null
      }
    };

    it(`should have a ${roleName} test user`, function(done) {
      _user = _testUsers.find(u => u.tokens.some(t => t.role === roleName));
      if (_user) {
        requestOptions.params.token = _user.tokens.find(t => t.role === roleName).value;
        done();
      } else {
        done(new Error(`a user with the role ${roleName} doesn't exist`));
      }
    });

    it('should successfully post some data', function(done) {
      let _postData = {
        content: "Hello world",
        memberSecretContent: "superMemberSecret",
        adminSecretContent: "test",
        parentPostId: null,
        userId: _user.id
      };

      Buttress.getCollection('posts').save(_postData, requestOptions)
        .then(function(post) {
          post.content.should.equal(_postData.content);
          post.userId.should.equal(_postData.userId);
          post.memberSecretContent.should.equal(_postData.memberSecretContent);

          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should make get a 200 responce', function(done) {
      Buttress.getCollection('posts').getAll({}, requestOptions)
        .then(function(posts) {
          posts.should.be.instanceof(Array);
          const userPosts = posts.filter(p => p.userId === _user.id);
          const userPost = userPosts.pop();

          userPost.memberSecretContent.should.equal("superMemberSecret");

          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });

  describe('Role admin.super', function() {
    const roleName = 'admin.super';
    let _user = null;
    let requestOptions = {
      params: {
        token: null
      }
    };

    it(`should have a ${roleName} test user`, function(done) {
      _user = _testUsers.find(u => u.tokens.some(t => t.role === roleName));
      if (_user) {
        requestOptions.params.token = _user.tokens.find(t => t.role === roleName).value;
        done();
      } else {
        done(new Error(`a user with the role ${roleName} doesn't exist`));
      }
    });

    it('should make get a 200 responce', function(done) {
      Buttress.getCollection('posts').getAll({}, requestOptions)
        .then(function(posts) {
          posts.should.be.instanceof(Array);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
