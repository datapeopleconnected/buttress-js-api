"use strict";

/**
 * Rhizome API -
 *
 * @file company.test.js
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

describe('@company-basics', function() {
  let _companies = [];
  before(function() {
  });

  after(function(done) {
    // let ids = _companies.map(c => c.id);
    Rhizome.Company.bulkRemove(_companies)
    .then(() => done()).catch(done);
  });

  describe('Company Basics', function() {
    let _company = null;
    it('should return no companies', function(done) {
      Rhizome.Company
        .getAll()
        .then(function(companies) {
          companies.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add a company', function(done) {
      Rhizome.Company
        .save({
          name: 'Blackburn Widget Company',
          location: {
            name: "Headquarters",
            address: "124 Bonsall Street, Mill Hill",
            city: "Blackburn",
            postCode: "BB2 5DS",
            phoneNumber: "01254 123123"
          },
          contact: {
            name: 'Robert McBobson',
            role: 'Managing Director'
          }
        })
        .then(function(companyId) {
          return Rhizome.Company.load(companyId);
        })
        .then(function(company) {
          _company = company;
          company.name.should.equal('Blackburn Widget Company');
          company.locations.length.should.equal(1);
          company.primaryLocation.should.equal(0);
          company.primaryContact.should.equal(0);

          const location = company.locations[company.primaryLocation];
          location.address.should.equal('124 Bonsall Street, Mill Hill');
          location.city.should.equal('Blackburn');
          location.postCode.should.equal('BB2 5DS');
          location.phoneNumber.should.equal('01254 123123');

          const contact = company.contacts[company.primaryContact];
          contact.name.should.equal('Robert McBobson');
          contact.role.should.equal('Managing Director');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return 1 company', function(done) {
      Rhizome.Company
        .getAll()
        .then(function(companies) {
          companies.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a company', function(done) {
      if (!_company) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company
        .remove(_company.id)
        .then(function(res) {
          res.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add several companies', function(done) {
      const __gen = num => {
        let arr = [];
        for (let x = 0; x < num; x++) {
          arr.push({
            name: `Blackburn Widget Company ${x + 1}`,
            location: {
              name: "Headquarters",
              address: "124 Bonsall Street, Mill Hill",
              city: "Blackburn",
              postCode: "BB2 5DS",
              phoneNumber: "01254 123123"
            },
            contact: {
              name: "Robert McBobson",
              role: 'Managing Director'
            }
          });
        }

        return arr;
      };

      Rhizome.Company
        .saveAll({companies: __gen(300)})
        .then(function(companies) {
          companies.length.should.equal(300);
          _companies = companies;
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

describe('@company-contacts', function() {
  let _companyId = '';

  before(function(done) {
    Rhizome.Company
      .save({
        name: 'Blackburn Widget Company',
        location: {
          name: "Headquarters",
          address: "124 Bonsall Street, Mill Hill",
          city: "Blackburn",
          postCode: "BB2 5DS",
          phoneNumber: "01254 123123"
        },
        contact: {
          name: "Robert McBobson",
          role: 'Managing Director'
        }
      })
      .then(function(companyId) {
        _companyId = companyId;
        done();
      })
      .catch(done);
  });

  after(function(done) {
    let companies = [
      Rhizome.Company.remove(_companyId)
    ];

    Promise.all(companies).then(() => done()).catch(done);
  });

  describe('Contacts', function() {
    it('should add a contact', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company.update(_companyId, {
        path: 'contacts',
        value: {
          name: 'Han Solo',
          role: 'Sales Director'
        }
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-add');
          updates[0].path.should.equal('contacts');
          updates[0].value.name.should.equal('Han Solo');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the company with 2 contacts', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }

      Rhizome.Company
        .load(_companyId)
        .then(function(company) {
          company.contacts.should.have.length(2);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update the email address of a contact', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }

      Rhizome.Company
        .update(_companyId, {
          path: 'contacts.1.email',
          value: 'han.solo@starwars.com'
        })
        .then(function(cr) {
          cr[0].type.should.equal('scalar');
          cr[0].path.should.equal('contacts.1.email');
          cr[0].value.should.equal('han.solo@starwars.com');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the company with an updated contact', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }

      Rhizome.Company
        .load(_companyId)
        .then(function(company) {
          company.contacts.should.have.length(2);
          company.contacts[1].email.should.equal('han.solo@starwars.com');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a contact', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company.update(_companyId, {
        path: 'contacts.1.__remove__',
        value: ''
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-rm');
          updates[0].path.should.equal('contacts');
          updates[0].value.index.should.equal('1');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the company with 1 contact', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }

      Rhizome.Company
        .load(_companyId)
        .then(function(company) {
          company.contacts.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

describe('@company-locations', function() {
  let _companyId = '';

  before(function(done) {
    Rhizome.Company
      .save({
        name: 'Blackburn Widget Company',
        location: {
          name: "Headquarters",
          address: "124 Bonsall Street, Mill Hill",
          city: "Blackburn",
          postCode: "BB2 5DS",
          phoneNumber: "01254 123123"
        },
        contact: {
          name: "Robert McBobson",
          role: 'Managing Director'
        }
      })
      .then(function(companyId) {
        _companyId = companyId;
        done();
      })
      .catch(done);
  });

  after(function(done) {
    let companies = [
      Rhizome.Company.remove(_companyId)
    ];

    Promise.all(companies).then(() => done()).catch(done);
  });

  describe('Locations', function() {
    it('should add a location', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company.update(_companyId, {
        path: 'locations',
        value: {
          name: 'Distribution Depot',
          address: '25 East Street, Feniscowles',
          city: "Blackburn",
          postCode: "BB1 5ET",
          phoneNumber: '01254 654321'
        }
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-add');
          updates[0].path.should.equal('locations');
          updates[0].value.name.should.equal('Distribution Depot');
          updates[0].value.address.should.equal('25 East Street, Feniscowles');
          updates[0].value.city.should.equal('Blackburn');
          updates[0].value.postCode.should.equal('BB1 5ET');
          updates[0].value.phoneNumber.should.equal('01254 654321');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the company with 2 locations', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }

      Rhizome.Company
        .load(_companyId)
        .then(function(company) {
          company.locations.should.have.length(2);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update the phoneNumber of a location', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }

      Rhizome.Company
        .update(_companyId, {
          path: 'locations.1.phoneNumber',
          value: '01772 123456'
        })
        .then(function(cr) {
          cr[0].type.should.equal('scalar');
          cr[0].path.should.equal('locations.1.phoneNumber');
          cr[0].value.should.equal('01772 123456');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the company with an updated location', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }

      Rhizome.Company
        .load(_companyId)
        .then(function(company) {
          company.locations.should.have.length(2);
          company.locations[1].phoneNumber.should.equal('01772 123456');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update a location with an object', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }

      Rhizome.Company
        .update(_companyId, {
          path: 'locations.1',
          value: {
            name: 'Distribution Despot',
            address: '24 East Street, Feniscowles',
            city: "Whiteburn",
            postCode: "BB1 5ET",
            phoneNumber: '01254 654321'
          }
        })
        .then(function(cr) {
          cr[0].type.should.equal('scalar');
          cr[0].path.should.equal('locations.1');
          cr[0].value.name.should.equal('Distribution Despot');
          cr[0].value.phoneNumber.should.equal('01254 654321');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the company with a further updated location', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }

      Rhizome.Company
        .load(_companyId)
        .then(function(company) {
          company.locations.should.have.length(2);
          company.locations[1].name.should.equal('Distribution Despot');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a location', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company.update(_companyId, {
        path: 'locations.1.__remove__',
        value: ''
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-rm');
          updates[0].path.should.equal('locations');
          updates[0].value.index.should.equal('1');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the company with 1 location', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }

      Rhizome.Company
        .load(_companyId)
        .then(function(company) {
          company.locations.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

  });
});

describe('@company-notes', function() {
  let _companyId = '';

  before(function(done) {
    Rhizome.Company
      .save({
        name: 'Blackburn Widget Company',
        location: {
          name: "Headquarters",
          address: "124 Bonsall Street, Mill Hill, Blackburn, BB2 5DS",
          city: "Blackburn",
          postCode: "BB2 5DS",
          phoneNumber: "01254 123123"
        },
        contact: {
          name: "Robert McBobson",
          role: 'Managing Director'
        }
      })
      .then(function(companyId) {
        _companyId = companyId;
        done();
      })
      .catch(done);
  });

  after(function(done) {
    let companies = [
      Rhizome.Company.remove(_companyId)
    ];

    Promise.all(companies).then(() => done()).catch(done);
  });

  describe('Notes', function() {
    it('should add a note', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company.update(_companyId, {
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
      if (!_companyId) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company.update(_companyId, {
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
    it('should return the company with 2 notes', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }

      Rhizome.Company
        .load(_companyId)
        .then(function(company) {
          company.notes.should.have.length(2);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a note', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company.update(_companyId, {
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
    it('should return the company with 1 notes', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }

      Rhizome.Company
        .load(_companyId)
        .then(function(company) {
          company.notes.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update the text of a note', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }

      Rhizome.Company
        .update(_companyId, {
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
    it('should return the company with an updated note', function(done) {
      if (!_companyId) {
        return done(new Error("No Company!"));
      }

      Rhizome.Company
        .load(_companyId)
        .then(function(company) {
          company.notes.should.have.length(1);
          company.notes[0].text.should.equal('This is some updated text');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

describe('@company-metadata', function() {
  let _company = null;
  before(function(done) {
    Rhizome.Company
      .save({
        name: 'Blackburn Widget Company',
        location: {
          name: "Headquarters",
          address: "124 Bonsall Street, Mill Hill",
          city: "Blackburn",
          postCode: "BB2 5DS",
          phoneNumber: "01254 123123"
        },
        contact: {
          name: "Robert McBobson",
          role: 'Managing Director'
        }
      })
      .then(function(companyId) {
        return Rhizome.Company.load(companyId);
      })
      .then(function(company) {
        _company = company;
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  after(function(done) {
    Rhizome.Company
      .remove(_company.id)
      .then(function() {
        _company = null;
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  describe('Company Metadata', function() {
    it('should get default metadata', function(done) {
      if (!_company) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company.Metadata
        .load(_company.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add metadata', function(done) {
      if (!_company) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company.Metadata
        .save(_company.id, 'TEST_DATA', {foo: 'bar'})
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get metadata', function(done) {
      if (!_company) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company.Metadata
        .load(_company.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.not.equal(false);
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get all metadata', function(done) {
      if (!_company) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company.Metadata
        .loadAll(_company.id)
        .then(function(metadata) {
          metadata.should.not.equal(false);
          metadata.TEST_DATA.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should delete metadata', function(done) {
      if (!_company) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company.Metadata
        .remove(_company.id, 'TEST_DATA')
        .then(function(result) {
          result.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get default metadata (post-deletion)', function(done) {
      if (!_company) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company.Metadata
        .load(_company.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should fail to delete metadata', function(done) {
      if (!_company) {
        return done(new Error("No Company!"));
      }
      Rhizome.Company.Metadata
        .remove(_company.id, 'TEST_DATA')
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
