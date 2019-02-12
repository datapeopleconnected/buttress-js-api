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
  const TestUsersRoles = _mapUserRoles(TestAppRoles);

  const _testUsers = [];

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
          })
          .then(res => resolve());
      });
    });

    Promise.all(addUserTasks)
      .then(res => {
        console.log(res);
        done();
      });
  });

  after(function(done) {
    done();
  });

  describe('Role Basics', function() {
    it('should pass', function(done) {
      done();
    });
  });
});
