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
//     Rhizome.User.removeAll(),
//     Rhizome.Person.removeAll()
//   ]).then(() => done());
// });

describe('@person-basics', function() {
  before(function() {
  });

  describe('Person Basics', function() {
    let _person = null;
    it('should return no people', function(done) {
      Rhizome.Person
        .getAll()
        .then(function(people) {
          people.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add a person', function(done) {
      Rhizome.Person
        .save({
          name: 'Mr Chris G Bates-Keegan',
          email: 'test@email.com'
        })
        .then(function(person) {
          _person = person;
          person.title.should.equal('Mr.');
          person.forename.should.equal('Chris');
          person.surname.should.equal('Bates-Keegan');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return 1 person', function(done) {
      Rhizome.Person
        .getAll()
        .then(function(people) {
          people.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a person', function(done) {
      if (!_person) {
        return done(new Error("No Person!"));
      }
      Rhizome.Person
        .remove(_person.id)
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

describe('@person-metadata', function() {
  let _person = null;
  before(function(done) {
    Rhizome.Person
      .save({
        name: 'Mr Chris G Bates-Keegan',
        email: 'test@email.com'
      })
      .then(function(person) {
        _person = person;
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  after(function(done) {
    Rhizome.Person
      .remove(_person.id)
      .then(function() {
        _person = null;
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  describe('Person Metadata', function() {
    it('should get default metadata', function(done) {
      if (!_person) {
        return done(new Error("No Person!"));
      }
      Rhizome.Person.Metadata
        .load(_person.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add metadata', function(done) {
      if (!_person) {
        return done(new Error("No Person!"));
      }
      Rhizome.Person.Metadata
        .save(_person.id, 'TEST_DATA', {foo: 'bar'})
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get metadata', function(done) {
      if (!_person) {
        return done(new Error("No Person!"));
      }
      Rhizome.Person.Metadata
        .load(_person.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.not.equal(false);
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should delete metadata', function(done) {
      if (!_person) {
        return done(new Error("No Person!"));
      }
      Rhizome.Person.Metadata
        .remove(_person.id, 'TEST_DATA')
        .then(function(result) {
          result.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get default metadata (post-deletion)', function(done) {
      if (!_person) {
        return done(new Error("No Person!"));
      }
      Rhizome.Person.Metadata
        .load(_person.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should fail to delete metadata', function(done) {
      if (!_person) {
        return done(new Error("No Person!"));
      }
      Rhizome.Person.Metadata
        .remove(_person.id, 'TEST_DATA')
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
