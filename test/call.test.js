"use strict";

/**
 * Rhizome API -
 *
 * @file person.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Rhizome = require('../lib/rhizome');
const Config = require('./config');

Config.init();

/**
 * In all tests that make use of promises, you need to use .catch(err => done(err) pattern.
 * Otherwise the promise consumes the assertion failure and you get a timeout instead of useful info.
 */

// after(function(done) {
//   Promise.all([
//     Rhizome.Call.removeAll()
//   ]).then(() => done());
// });

let __createCompanies = () => {
  let companies = [
    {
      name: 'Company 1',
      location: {
        name: 'HQ',
        address: '123 Acacia Avenue, Brixton, SW9 4DW',
        phoneNumber: '0205 123123'
      },
      contact: {
        name: 'Bananaman'
      }
    },
    {
      name: 'Company 2',
      location: {
        name: 'HQ',
        address: '123 Acacia Avenue, Brixton, SW9 4DW',
        phoneNumber: '0205 123123'
      },
      contact: {
        name: 'Bananaman'
      }
    },
    {
      name: 'Company 3',
      location: {
        name: 'HQ',
        address: '123 Acacia Avenue, Brixton, SW9 4DW',
        phoneNumber: '0205 123123'
      },
      contact: {
        name: 'Bananaman'
      }
    },
    {
      name: 'Company 4',
      location: {
        name: 'HQ',
        address: '123 Acacia Avenue, Brixton, SW9 4DW',
        phoneNumber: '0205 123123'
      },
      contact: {
        name: 'Bananaman'
      }
    },
    {
      name: 'Company 5',
      location: {
        name: 'HQ',
        address: '123 Acacia Avenue, Brixton, SW9 4DW',
        phoneNumber: '0205 123123'
      },
      contact: {
        name: 'Bananaman'
      }
    }
  ];
  return Rhizome.Company.saveAll({companies: companies})
    .then(companyIds => {
      return Rhizome.Company.bulkLoad(companyIds);
    })
    .catch(err => {
      throw err;
    });
};

let __createUser = () => {
  let userAppAuth = {
    app: 'google',
    id: '12345678987654321',
    name: 'Chris Bates-Keegan',
    token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
    email: 'test@test.com',
    profileUrl: 'http://test.com/thisisatest',
    profileImgUrl: 'http://test.com/thisisatest.png'
  };
  return Rhizome.Auth.findOrCreateUser(userAppAuth)
    .catch(err => {
      throw err;
    });
};

describe('@call-basics', function() {
  this.timeout(2000);
  let _companies = [];
  let _user = null;

  before(function(done) {
    __createUser().then(user => {
      _user = user;
    })
    .then(__createCompanies)
    .then(function(companies) {
      _companies = companies;
    }).then(done);
  });

  after(function(done) {
    let tasks = [
      Rhizome.Company.bulkRemove(_companies.map(c => c.id)),
      Rhizome.User.remove(_user.id),
      Rhizome.Person.remove(_user.person.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Basics', function() {
    let _call = null;
    it('should return no calls', function(done) {
      Rhizome.Call
        .getAll()
        .then(function(calls) {
          calls.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add a call', function(done) {
      Rhizome.Call
        .create({
          companyId: _companies[0].id,
          ownerId: _user.id
        })
        .then(function(call) {
          _call = call;
          _call.companyId.should.equal(_companies[0].id);
          _call.ownerId.should.equal(_user.id);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return 1 call', function(done) {
      Rhizome.Call
        .getAll()
        .then(function(calls) {
          calls.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should remove a call', function(done) {
      if (!_call) {
        return done(new Error("No Call!"));
      }
      Rhizome.Call
        .remove(_call.id)
        .then(function(res) {
          res.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

describe('@call-metadata', function() {
  let _call = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    __createUser().then(user => {
      _user = user;
    })
      .then(__createCompanies)
      .then(function(companies) {
        _companies = companies;
        Rhizome.Call
          .create({
            companyId: _companies[0].id,
            ownerId: _user.id
          })
          .then(function(call) {
            _call = call;
            done();
          });
      }).catch(done);
  });

  after(function(done) {
    let tasks = [
      Rhizome.Company.bulkRemove(_companies.map(c => c.id)),
      Rhizome.User.remove(_user.id),
      Rhizome.Person.remove(_user.person.id),
      Rhizome.Call.remove(_call.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Metadata', function() {
    it('should get default metadata', function(done) {
      if (!_call) {
        return done(new Error("No Call!"));
      }
      Rhizome.Call.Metadata
        .load(_call.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add metadata', function(done) {
      if (!_call) {
        return done(new Error("No Call!"));
      }
      Rhizome.Call.Metadata
        .save(_call.id, 'TEST_DATA', {foo: 'bar'})
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get metadata', function(done) {
      if (!_call) {
        return done(new Error("No Call!"));
      }
      Rhizome.Call.Metadata
        .load(_call.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should delete metadata', function(done) {
      if (!_call) {
        return done(new Error("No Call!"));
      }
      Rhizome.Call.Metadata
        .remove(_call.id, 'TEST_DATA')
        .then(function(metadata) {
          metadata.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get default metadata (post-deletion)', function(done) {
      if (!_call) {
        return done(new Error("No Call!"));
      }
      Rhizome.Call.Metadata
        .load(_call.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should fail to delete metadata', function(done) {
      if (!_call) {
        return done(new Error("No Call!"));
      }
      Rhizome.Call.Metadata
        .remove(_call.id, 'TEST_DATA')
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
