"use strict";

/**
 * Buttress API -
 *
 * @file user.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('../lib/buttressjs');
const Config = require('./config');

Config.init();

/**
 * In all tests that make use of promises, you need to use .catch(err => done(err) pattern.
 * Otherwise the promise consumes the assertion failure and you get a timeout instead of useful info.
 */

// after(function(done) {
//   Promise.all([
//     Buttress.User.removeAll(),
//     Buttress.Person.removeAll(),
//     Buttress.Token.removeAllUserTokens()
//   ]).then(() => done());
// });

describe('@user-basics', function() {
  before(function() {
  });

  after(function(done) {
    Buttress.User.removeAll()
      .then(() => done()).catch(done);
  });

  describe('User Basics', function() {
    let _users = [null, null];
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

    it('should create a user (without creating an auth token)', function(done) {
      let userAppAuth = {
        app: 'google',
        id: '12345678987654321',
        name: 'Chris Bates-Keegan',
        token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
        email: 'test@test.com',
        profileUrl: 'http://test.com/thisisatest',
        profileImgUrl: 'http://test.com/thisisatest.png'
      };
      Buttress.Auth
        .findOrCreateUser(userAppAuth)
        .then(function(user) {
          user.should.not.equal(false);
          user.person.name.should.equal('Chris Bates-Keegan');
          user.person.forename.should.equal('Chris');
          user.person.surname.should.equal('Bates-Keegan');
          user.auth.length.should.equal(1);
          user.auth[0].appId.should.equal('12345678987654321');
          user.should.not.have.property('token');
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
      let userAppAuth = {
        app: 'google',
        id: '12345678987654321',
        name: 'Chris Bates-Keegan',
        token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
        email: 'test@test.com',
        profileUrl: 'http://test.com/thisisatest',
        profileImgUrl: 'http://test.com/thisisatest.png'
      };
      Buttress.Auth
        .findOrCreateUser(userAppAuth)
        .then(function(user) {
          user.buttressId.should.equal(_userId);
          user.buttressAuthToken.should.equal(false);
          user.person.name.should.equal('Chris Bates-Keegan');
          user.person.forename.should.equal('Chris');
          user.person.surname.should.equal('Bates-Keegan');
          user.auth.length.should.equal(1);
          user.auth[0].appId.should.equal('12345678987654321');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should create a user (with an auth token)', function(done) {
      let userAppAuth = {
        app: 'google',
        id: '98765432109876543210',
        name: 'Chris Bates-Keegan',
        token: 'testisathistestisathistestisathistestisathistestisathis',
        email: 'test@test.com',
        profileUrl: 'http://test.com/thisisatest',
        profileImgUrl: 'http://test.com/thisisatest.png'
      };
      let auth = {
        authLevel: Buttress.Token.AuthLevel.SUPER,
        permissions: [{
          route: "*",
          permission: "*"
        }],
        domains: ['test.buttressjs.com']
      };
      Buttress.Auth
        .findOrCreateUser(userAppAuth, auth)
        .then(function(user) {
          user.should.not.equal(false);
          user.id.should.not.equal(_userId);
          user.person.name.should.equal('Chris Bates-Keegan');
          user.person.forename.should.equal('Chris');
          user.person.surname.should.equal('Bates-Keegan');
          user.auth.length.should.equal(1);
          user.auth[0].appId.should.equal('98765432109876543210');
          user.authToken.should.not.equal(false);
          _users[1] = user;
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should remove a user', function(done) {
      if (!_users[0]) {
        return done(new Error("No User!"));
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

// describe('@model', function() {
//   var _person = null;
//   before(function(done) {
//     Buttress.Person
//       .save({
//         name: 'Mr Chris G Bates-Keegan',
//         email: 'test@email.com'
//       })
//       .then(function(person) {
//         _person = person;
//         done();
//       })
//       .catch(function(err) {
//         done(err);
//       });
//   });

//   after(function(done) {
//     Buttress.Person
//       .remove(_person.id)
//       .then(function() {
//         _person = null;
//         done();
//       })
//       .catch(function(err) {
//         done(err);
//       });
//   });

//   describe('Person Metadata', function() {
//     it('should get default metadata', function(done) {
//       if (!_person) {
//         return done(new Error("No Person!"));
//       }
//       Buttress.Person
//         .loadMetadata(_person.id, 'TEST_DATA', false)
//         .then(function(metadata) {
//           metadata.should.equal(false);
//           done();
//         })
//         .catch(function(err) {
//           done(err);
//         });
//     });
//     it('should add metadata', function(done) {
//       if (!_person) {
//         return done(new Error("No Person!"));
//       }
//       Buttress.Person
//         .saveMetadata(_person.id, 'TEST_DATA', {foo: 'bar'})
//         .then(function(metadata) {
//           metadata.foo.should.equal('bar');
//           done();
//         })
//         .catch(function(err) {
//           done(err);
//         });
//     });
//     it('should get metadata', function(done) {
//       if (!_person) {
//         return done(new Error("No Person!"));
//       }
//       Buttress.Person
//         .loadMetadata(_person.id, 'TEST_DATA', false)
//         .then(function(metadata) {
//           metadata.should.not.equal(false);
//           metadata.foo.should.equal('bar');
//           done();
//         })
//         .catch(function(err) {
//           done(err);
//         });
//     });
//     it('should delete metadata', function(done) {
//       if (!_person) {
//         return done(new Error("No Person!"));
//       }
//       Buttress.Person
//         .removeMetadata(_person.id, 'TEST_DATA')
//         .then(function(result) {
//           result.should.equal(true);
//           done();
//         })
//         .catch(function(err) {
//           done(err);
//         });
//     });
//     it('should get default metadata (post-deletion)', function(done) {
//       if (!_person) {
//         return done(new Error("No Person!"));
//       }
//       Buttress.Person
//         .loadMetadata(_person.id, 'TEST_DATA', false)
//         .then(function(metadata) {
//           metadata.should.equal(false);
//           done();
//         })
//         .catch(function(err) {
//           done(err);
//         });
//     });
//     it('should fail to delete metadata', function(done) {
//       if (!_person) {
//         return done(new Error("No Person!"));
//       }
//       Buttress.Person
//         .removeMetadata(_person.id, 'TEST_DATA')
//         .then(function(metadata) {
//           metadata.should.equal(false);
//           done();
//         })
//         .catch(function(err) {
//           done(err);
//         });
//     });
//   });
// });
