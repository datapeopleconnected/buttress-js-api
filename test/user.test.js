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

Config.init();

/**
 * In all tests that make use of promises, you need to use .catch(err => done(err) pattern.
 * Otherwise the promise consumes the assertion failure and you get a timeout instead of useful info.
 */

// after(function(done) {
//   Promise.all([
//     Buttress.User.removeAll(),
//     Buttress.Token.removeAllUserTokens()
//   ]).then(() => done());
// });

const USERS = [{
  app: 'google',
  id: '12345678987654321',
  name: 'Chris Bates-Keegan',
  token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
  email: 'test@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
}, {
  app: 'google',
  id: '98765432109876543210',
  name: 'Chris Bates-Keegan',
  token: 'testisathistestisathistestisathistestisathistestisathis',
  email: 'test@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
}];

describe('@users', function() {
  before(function(done) {
    Promise.all([
      Buttress.User.removeAll(),
      Buttress.Token.removeAllUserTokens(),
    ])
      .then(() => done());
  });

  after(function(done) {
    done();
  });

  describe('User Basics', function() {
    const _users = [null, null];
    let _userId = false;

    it('should return no users', function(done) {
      Buttress.User
        .getAll()
        .then(function(users) {
          users.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should create a user', function(done) {
      Buttress.Auth
        .findOrCreateUser(USERS[0], {
          domains: [Buttress.options.url.host],
        })
        .then(function(user) {
          user.should.not.equal(false);
          user.auth.length.should.equal(1);
          user.auth[0].appId.should.equal('12345678987654321');
          user.should.not.have.property('token');

          const hasPublicToken = user.tokens.some((t) => t.role === 'public');
          hasPublicToken.should.equal(true);

          _users[0] = user;
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return 1 user', function(done) {
      Buttress.User
        .getAll()
        .then(function(users) {
          users.should.have.length(1);
          _userId = users[0].id;
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should find an existing user', function(done) {
      Buttress.Auth
        .findOrCreateUser(USERS[0], {
          domains: [Buttress.options.url.host],
        })
        .then(function(user) {
          user.should.not.equal(false);
          user.id.should.equal(_userId);
          user.auth.length.should.equal(1);
          user.auth[0].appId.should.equal('12345678987654321');

          const hasPublicToken = user.tokens.some((t) => t.role === 'public');
          hasPublicToken.should.equal(true);

          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should create a another user (default role)', function(done) {
      Buttress.Auth
        .findOrCreateUser(USERS[1], {
          domains: [Buttress.options.url.host],
        })
        .then(function(user) {
          user.should.not.equal(false);
          user.id.should.not.equal(_userId);
          user.auth.length.should.equal(1);
          user.auth[0].appId.should.equal('98765432109876543210');

          const hasPublicToken = user.tokens.some((t) => t.role === 'user.member');
          hasPublicToken.should.equal(true);

          _users[1] = user;
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should create a user token', function(done) {
      const user = _users[0];

      Buttress.Auth
        .createToken(user.id, {
          domains: [Buttress.options.url.host],
        })
        .then(function(token) {
          token.should.not.equal(false);
          token.role.should.equal('user.member');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should have multiple tokens', function(done) {
      const userData = USERS[0];

      Buttress.User
        .findUser(userData.app, userData.id)
        .then((u) => {
          u.tokens.should.have.length(2);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should remove a user', function(done) {
      if (!_users[0]) {
        return done(new Error('No User!'));
      }
      Buttress.User
        .remove(_users[0].id)
        .then(function(res) {
          res.should.equal(true);
          _users[0] = null;
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
