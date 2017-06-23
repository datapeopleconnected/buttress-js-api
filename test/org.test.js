"use strict";

/**
 * Buttress API -
 *
 * @file org.test.js
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
//     Buttress.Person.removeAll()
//   ]).then(() => done());
// });

describe('@org-basics', function() {
  before(function() {
  });

  describe('Organisation Basics', function() {
    let _org = null;
    it('should return no organisations', function(done) {
      Buttress.Organisation
        .getAll()
        .then(function(orgs) {
          orgs.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add an organisation', function(done) {
      Buttress.Organisation
        .save({
          name: 'Test Org',
          type: Buttress.Organisation.Type.COMPANY,
          website: 'http://www.test.org'
        })
        .then(function(org) {
          _org = org;
          org.name.should.equal('Test Org');
          org.type.should.equal(Buttress.Organisation.Type.COMPANY);
          org.website.should.equal('http://www.test.org');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return 1 organisation', function(done) {
      Buttress.Organisation
        .getAll()
        .then(function(orgs) {
          orgs.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update only an organisation\'s name', function(done) {
      if (!_org) {
        return done(new Error("No Organisation!"));
      }
      Buttress.Organisation
        .update(_org.id, {
          name: 'My Fancy Test Org'
        })
        .then(function(org) {
          org.name.should.equal('My Fancy Test Org');
          org.type.should.equal(Buttress.Organisation.Type.COMPANY);
          org.website.should.equal('http://www.test.org');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update only an organisation\'s type', function(done) {
      if (!_org) {
        return done(new Error("No Organisation!"));
      }
      Buttress.Organisation
        .update(_org.id, {
          type: Buttress.Organisation.Type.CHARITY
        })
        .then(function(org) {
          org.name.should.equal('My Fancy Test Org');
          org.type.should.equal(Buttress.Organisation.Type.CHARITY);
          org.website.should.equal('http://www.test.org');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update only an organisation\'s website', function(done) {
      if (!_org) {
        return done(new Error("No Organisation!"));
      }
      Buttress.Organisation
        .update(_org.id, {
          website: 'http://www.another-test.org'
        })
        .then(function(org) {
          org.name.should.equal('My Fancy Test Org');
          org.type.should.equal(Buttress.Organisation.Type.CHARITY);
          org.website.should.equal('http://www.another-test.org');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a organisation', function(done) {
      if (!_org) {
        return done(new Error("No Organisation!"));
      }
      Buttress.Organisation
        .remove(_org.id)
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

/*
describe('@model', function() {
  var _person = null;
  before(function(done) {
    Buttress.Person
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
    Buttress.Person
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
      Buttress.Person.Metadata
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
      Buttress.Person.Metadata
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
      Buttress.Person.Metadata
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
      Buttress.Person.Metadata
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
      Buttress.Person.Metadata
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
      Buttress.Person.Metadata
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
*/
