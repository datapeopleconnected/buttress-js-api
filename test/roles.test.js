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

    role.name = _path.join('.');

    _roles.push(role);
    return _roles;
  }, []);
};

describe('@roles-basics', function() {
  this.timeout(2000);

  const Auth = Buttress.getCollection('auth');
  const Post = Buttress.getCollection('post');

  const TestUsersRoles = _mapUserRoles(TestAppRoles);

  let _testUsers = [];

  before(function(done) {
    // NOTE: Why not use bulk add instead?
    // Setup promise queue for adding test users

    const addUserTasks = TestUsersRoles.map(user => {
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
            domains: ['test.buttressjs.com']
          })
          .then(res => resolve(res));
      });
    });

    Promise.all(addUserTasks)
      .then(res => {
        _testUsers = res;
        done();
      });
  });

  after(function(done) {
    done();
  });

  describe('Role Basics', function() {
    it('should have test users for each role', function(done) {
      _testUsers.length.should.equal(TestUsersRoles.length);
      done();
    });
  });

  describe('Role public', function() {
    let requestOptions = {
      query: {
        token: null
      }
    };

    it('should have a public test user', function(done) {
      let _user = _testUsers.find(u => u.person.name === 'public');
      if (_user) {
        requestOptions.query.token = _user.authToken;
        done();
      } else {
        done(new Error('a user with the role public doesn\'t exist'));
      }
    });

    it('should make get a 200 responce', function(done) {
      Post.getAll({}, requestOptions)
        .then(function(posts) {
          posts.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should make get a 403 responce', function(done) {
      Buttress.Token.removeAllUserTokens({}, requestOptions)
        .then(function(posts) {
          posts.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
      done();
    });

    it('should make get a 400 responce', function(done) {
      done();
    });
  });

  describe('Role user.member', function() {
    it('should make get a 200 responce', function(done) {
      done();
    });

    it('should make get a 403 responce', function(done) {
      done();
    });

    it('should make get a 400 responce', function(done) {
      done();
    });
  });

  describe('Role admin.super', function() {
    it('should make get a 200 responce', function(done) {
      done();
    });

    it('should make get a 403 responce', function(done) {
      done();
    });

    it('should make get a 400 responce', function(done) {
      done();
    });
  });
});
