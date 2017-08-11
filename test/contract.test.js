"use strict";

/**
 * Buttress API -
 *
 * @file contract.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('../lib/buttressjs');
const Config = require('./config');
const Sugar = require('sugar');

Config.init();

describe('@contract-basics', function() {
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
    let _contract = null;
    it('should return no contracts', function(done) {
      Buttress.Contract
        .getAll()
        .then(function(contracts) {
          contracts.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add a contract', function(done) {
      Buttress.Contract
        .create({
          ownerId: _user.id,
          name: 'Letter of Authority',
          contractType: 'authority',
          parties: [{
            partyType: 'client',
            companyId: _companies[0].id
          }]
        })
        .then(function(contract) {
          _contract = contract;
          _contract.ownerId.should.equal(_user.id);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return 1 contract', function(done) {
      Buttress.Contract
        .getAll()
        .then(function(contracts) {
          contracts.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should remove a contract', function(done) {
      if (!_contract) {
        return done(new Error("No Contract!"));
      }
      Buttress.Contract
        .remove(_contract.id)
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

describe('@contract-notes', function() {
  let _contract = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    Config.createUser().then(user => {
      _user = user;
    })
      .then(Config.createCompanies)
      .then(function(companies) {
        _companies = companies;
        Buttress.Contract
          .create({
            ownerId: _user.id,
            name: 'Letter of Authority',
            contractType: 'authority',
            parties: [{
              partyType: 'client',
              companyId: _companies[0].id
            }]
          })
          .then(function(contract) {
            _contract = contract;
            done();
          });
      }).catch(done);
  });

  after(function(done) {
    let tasks = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id),
      Buttress.Contract.remove(_contract.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Notes', function() {
    it('should add a note', function(done) {
      if (!_contract) {
        return done(new Error("No Contract!"));
      }
      Buttress.Contract.update(_contract.id, {
        path: 'notes',
        value: {
          text: 'This is an important note'
        }
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-add');
          updates[0].path.should.equal('notes');
          updates[0].value.text.should.equal('This is an important note');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add a second note', function(done) {
      if (!_contract) {
        return done(new Error("No Contract!"));
      }
      Buttress.Contract.update(_contract.id, {
        path: 'notes',
        value: {
          text: 'This is another important note'
        }
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-add');
          updates[0].path.should.equal('notes');
          updates[0].value.text.should.equal('This is another important note');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the contract with 2 notes', function(done) {
      if (!_contract) {
        return done(new Error("No Contract!"));
      }

      Buttress.Contract
        .load(_contract.id)
        .then(function(contract) {
          contract.notes.should.have.length(2);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a note', function(done) {
      if (!_contract) {
        return done(new Error("No Contract!"));
      }
      Buttress.Contract.update(_contract.id, {
        path: 'notes.0.__remove__',
        value: ''
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-rm');
          updates[0].path.should.equal('notes');
          updates[0].value.index.should.equal('0');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the contract with 1 notes', function(done) {
      if (!_contract) {
        return done(new Error("No Contract!"));
      }

      Buttress.Contract
        .load(_contract.id)
        .then(function(contract) {
          contract.notes.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update the text of a note', function(done) {
      if (!_contract) {
        return done(new Error("No Contract!"));
      }

      Buttress.Contract
        .update(_contract.id, {
          path: 'notes.0.text',
          value: 'This is some updated text'
        })
        .then(function(cr) {
          cr[0].type.should.equal('scalar');
          cr[0].path.should.equal('notes.0.text');
          cr[0].value.should.equal('This is some updated text');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the contract with an updated note', function(done) {
      if (!_contract) {
        return done(new Error("No Contract!"));
      }

      Buttress.Contract
        .load(_contract.id)
        .then(function(contract) {
          contract.notes.should.have.length(1);
          contract.notes[0].text.should.equal('This is some updated text');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

describe('@contract-metadata', function() {
  let _contract = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    Config.createUser().then(user => {
      _user = user;
    })
      .then(Config.createCompanies)
      .then(function(companies) {
        _companies = companies;
        Buttress.Contract
          .create({
            ownerId: _user.id,
            name: 'Letter of Authority',
            contractType: 'authority',
            parties: [{
              partyType: 'client',
              companyId: _companies[0].id
            }]
          })
          .then(function(contract) {
            _contract = contract;
            done();
          });
      }).catch(done);
  });

  after(function(done) {
    let tasks = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id),
      Buttress.Contract.remove(_contract.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Metadata', function() {
    it('should get default metadata', function(done) {
      if (!_contract) {
        return done(new Error("No Contract!"));
      }
      Buttress.Contract.Metadata
        .load(_contract.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add metadata', function(done) {
      if (!_contract) {
        return done(new Error("No Contract!"));
      }
      Buttress.Contract.Metadata
        .save(_contract.id, 'TEST_DATA', {foo: 'bar'})
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get metadata', function(done) {
      if (!_contract) {
        return done(new Error("No Contract!"));
      }
      Buttress.Contract.Metadata
        .load(_contract.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should delete metadata', function(done) {
      if (!_contract) {
        return done(new Error("No Contract!"));
      }
      Buttress.Contract.Metadata
        .remove(_contract.id, 'TEST_DATA')
        .then(function(metadata) {
          metadata.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get default metadata (post-deletion)', function(done) {
      if (!_contract) {
        return done(new Error("No Contract!"));
      }
      Buttress.Contract.Metadata
        .load(_contract.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should fail to delete metadata', function(done) {
      if (!_contract) {
        return done(new Error("No Contract!"));
      }
      Buttress.Contract.Metadata
        .remove(_contract.id, 'TEST_DATA')
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
