"use strict";

/**
 * Buttress API -
 *
 * @file person.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('../lib/buttressjs');
const Config = require('./config');

Config.init();

describe('@call-basics', function() {
  this.timeout(2000);
  let _companies = [];
  let _user = null;

  before(function(done) {
    Config.createUser().then(user => {
      _user = user;
    })
    .then(Config.createCompanies)
    .then(function(companies) {
      _companies = companies;
    }).then(done);
  });

  after(function(done) {
    let tasks = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Basics', function() {
    let _call = null;
    it('should return no calls', function(done) {
      Buttress.Call
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
      Buttress.Call
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
      Buttress.Call
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
      Buttress.Call
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
    Config.createUser().then(user => {
      _user = user;
    })
      .then(Config.createCompanies)
      .then(function(companies) {
        _companies = companies;
        Buttress.Call
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
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id),
      Buttress.Call.remove(_call.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Metadata', function() {
    it('should get default metadata', function(done) {
      if (!_call) {
        return done(new Error("No Call!"));
      }
      Buttress.Call.Metadata
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
      Buttress.Call.Metadata
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
      Buttress.Call.Metadata
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
      Buttress.Call.Metadata
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
      Buttress.Call.Metadata
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
      Buttress.Call.Metadata
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
