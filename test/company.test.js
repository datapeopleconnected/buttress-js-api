'use strict';

/**
 * Buttress API -
 *
 * @file company.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const {default: Buttress} = require('../dist/index');
const Config = require('./config');
const should = require('should');
const ObjectId = require('bson-objectid');

Config.init();

/**
 * In all tests that make use of promises, you need to use .catch(err => done(err) pattern.
 * Otherwise the promise consumes the assertion failure and you get a timeout instead of useful info.
 */
describe('@company-basics', function() {
  before(function(done) {
    Buttress.getCollection('company').removeAll()
      .then(() => done()).catch(done);
  });

  after(function(done) {
    done();
    // Buttress.getCollection('company').removeAll()
    //   .then(() => done()).catch(done);
  });

  describe('Company Basics', function() {
    let _company = null;
    const _companyId = (new ObjectId()).toHexString();
    const _locationId = (new ObjectId()).toHexString();
    const _contactId = (new ObjectId()).toHexString();

    it('should return no companies', function(done) {
      Buttress.getCollection('company')
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
      Buttress.getCollection('company')
        .save({
          id: _companyId,
          name: 'Blackburn Widget Company',
          companyType: 'prospect',
          primaryLocation: _locationId,
          primaryContact: _contactId,
          locations: [{
            id: _locationId,
            name: 'Headquarters',
            address: '124 Bonsall Street, Mill Hill',
            city: 'Blackburn',
            postCode: 'BB2 5DS',
            phoneNumber: '01254 123123',
          }],
          contacts: [{
            id: _contactId,
            name: 'Robert McBobson',
            role: 'Managing Director',
          }],
        })
        .then(function(company) {
          company.id.should.equal(_companyId);
          return company;
        })
        .then(function(company) {
          _company = company;
          company.id.should.equal(_companyId);
          company.name.should.equal('Blackburn Widget Company');
          company.companyType.should.equal('prospect');
          company.locations.length.should.equal(1);
          company.locations[0].id.should.equal(_locationId);
          company.contacts[0].id.should.equal(_contactId);
          company.primaryLocation.should.equal(_locationId);
          company.primaryContact.should.equal(_contactId);

          const location = company.locations.find((l) => l.id === company.primaryLocation);
          location.address.should.equal('124 Bonsall Street, Mill Hill');
          location.city.should.equal('Blackburn');
          location.postCode.should.equal('BB2 5DS');
          location.phoneNumber.should.equal('01254 123123');

          const contact = company.contacts.find((c) => c.id === company.primaryContact);
          contact.name.should.equal('Robert McBobson');
          contact.role.should.equal('Managing Director');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return 1 company', function(done) {
      Buttress.getCollection('company')
        .getAll()
        .then(function(companies) {
          companies.should.have.length(1);
          should.exist(companies[0].locations[0].id);
          companies[0].locations[0].id.should.equal(_locationId);

          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should reject string update to none string property', async function() {
      try {
        await Buttress.getCollection('company').update(_company.id, {
          path: 'siccode',
          value: 'Not a String',
        });
      } catch (err) {
        err.statusCode.should.equal(400);
      }
    });
    it('should update the company property', function(done) {
      Buttress.getCollection('company')
        .update(_company.id, {
          path: 'siccode',
          value: 123456,
        })
        .then(function(results) {
          results.length.should.equal(1);
          done();
        })
        .catch(done);
    });
    it('should remove a company', function(done) {
      if (!_company) {
        return done(new Error('No Company!'));
      }
      Buttress.getCollection('company')
        .remove(_company.id)
        .then(function(res) {
          res.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add a company with no locations', function(done) {
      const _companyId = (new ObjectId()).toHexString();
      const _contactId = (new ObjectId()).toHexString();

      Buttress.getCollection('company')
        .save({
          id: _companyId,
          name: 'Blackburn Widget Company',
          companyType: 'prospect',
          contacts: [{
            id: _contactId,
            name: 'Robert McBobson',
            role: 'Managing Director',
          }],
        })
        .then(function(company) {
          // console.log(companyId === _companyId);
          company.id.should.equal(_companyId);
          company.locations.length.should.equal(0);
          done();
        });
    });

    it('should add several companies (bulk)', function(done) {
      const __gen = (num) => {
        const arr = [];
        for (let x = 0; x < num; x++) {
          const company = Buttress.getCollection('company').createObject();
          company.name = `Blackburn Widget Company ${x + 1}`;
          company.companyType = 'prospect';

          const location = Buttress.getCollection('company').createObject('locations');
          location.name = 'Headquarters';
          location.address = '124 Bonsall Street, Mill Hill';
          location.city = 'Blackburn';
          location.postCode = 'BB2 5DS';
          location.phoneNumber = '01254 123123';

          const contact = Buttress.getCollection('company').createObject('contacts');
          contact.name = 'Robert McBobson';
          contact.role = 'Managing Director';

          arr.push(company);
        }

        return arr;
      };

      Buttress.getCollection('company')
        .bulkSave(__gen(1000))
        .then(function(companies) {
          companies.length.should.equal(1000);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should add several companies (per company)', function(done) {
      const __gen = (num) => {
        const arr = [];
        for (let x = 0; x < num; x++) {
          const company = Buttress.getCollection('company').createObject();
          company.name = `Blackburn Widget Company ${x + 1}`;
          company.companyType = 'prospect';

          const location = Buttress.getCollection('company').createObject('locations');
          location.name = 'Headquarters';
          location.address = '124 Bonsall Street, Mill Hill';
          location.city = 'Blackburn';
          location.postCode = 'BB2 5DS';
          location.phoneNumber = '01254 123123';

          const contact = Buttress.getCollection('company').createObject('contacts');
          contact.name = 'Robert McBobson';
          contact.role = 'Managing Director';

          arr.push(company);
        }

        return arr;
      };

      const companies = __gen(1000);
      companies.reduce((prev, company) => {
        return prev
          .then((arr) => {
            return Buttress.getCollection('company').save(company)
              .then((res) => arr.push(res))
              .then(() => arr);
          });
      }, Promise.resolve([]))
        .then(function(companies) {
          companies.length.should.equal(1000);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    }).timeout(20000);
  });
});

describe('@company-contacts', function() {
  let _companyId = '';

  before(function(done) {
    Buttress.getCollection('company')
      .save({
        name: 'Blackburn Widget Company',
        companyType: 'prospect',
        locations: [{
          id: (new ObjectId()).toHexString(),
          name: 'Headquarters',
          address: '124 Bonsall Street, Mill Hill',
          city: 'Blackburn',
          postCode: 'BB2 5DS',
          phoneNumber: '01254 123123',
        }],
        contacts: [{
          id: (new ObjectId()).toHexString(),
          name: 'Robert McBobson',
          role: 'Managing Director',
        }],
      })
      .then(function(company) {
        _companyId = company.id;
        done();
      })
      .catch(done);
  });

  after(function(done) {
    Promise.all([
      Buttress.getCollection('company').remove(_companyId),
    ]).then(() => done()).catch(done);
  });

  describe('Contacts', function() {
    it('should add a contact', function(done) {
      if (!_companyId) {
        return done(new Error('No Company!'));
      }
      Buttress.getCollection('company').update(_companyId, {
        path: 'contacts',
        value: {
          id: new ObjectId(),
          name: 'Han Solo',
          role: 'Sales Director',
        },
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
        return done(new Error('No Company!'));
      }

      Buttress.getCollection('company')
        .get(_companyId)
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
        return done(new Error('No Company!'));
      }

      Buttress.getCollection('company')
        .update(_companyId, {
          path: 'contacts.1.email',
          value: 'han.solo@starwars.com',
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
        return done(new Error('No Company!'));
      }

      Buttress.getCollection('company')
        .get(_companyId)
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
        return done(new Error('No Company!'));
      }
      Buttress.getCollection('company').update(_companyId, {
        path: 'contacts.1.__remove__',
        value: '',
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
        return done(new Error('No Company!'));
      }

      Buttress.getCollection('company')
        .get(_companyId)
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
  const _locationIds = [
    (new ObjectId()).toHexString(),
    (new ObjectId()).toHexString(),
  ];

  before(function(done) {
    Buttress.getCollection('company')
      .save({
        name: 'Blackburn Widget Company',
        companyType: 'prospect',
        locations: [{
          id: _locationIds[0],
          name: 'Headquarters',
          address: '124 Bonsall Street, Mill Hill',
          city: 'Blackburn',
          postCode: 'BB2 5DS',
          phoneNumber: '01254 123123',
        }],
        contacts: [{
          id: (new ObjectId()).toHexString(),
          name: 'Robert McBobson',
          role: 'Managing Director',
        }],
      })
      .then(function(company) {
        _companyId = company.id;
        company.locations[0].id.should.equal(_locationIds[0]);
        done();
      })
      .catch(done);
  });

  after(function(done) {
    Promise.all([
      Buttress.getCollection('company').remove(_companyId),
    ]).then(() => done()).catch(done);
  });

  describe('Locations', function() {
    it('should add a location', function(done) {
      if (!_companyId) {
        return done(new Error('No Company!'));
      }
      Buttress.getCollection('company').update(_companyId, {
        path: 'locations',
        value: {
          id: _locationIds[1],
          name: 'Distribution Depot',
          address: '25 East Street, Feniscowles',
          city: 'Blackburn',
          postCode: 'BB1 5ET',
          phoneNumber: '01254 654321',
        },
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-add');
          updates[0].path.should.equal('locations');
          should.not.exist(updates[0].value._id);
          should.exist(updates[0].value.id);
          updates[0].value.id.should.equal(_locationIds[1]);
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
        return done(new Error('No Company!'));
      }

      Buttress.getCollection('company')
        .get(_companyId)
        .then(function(company) {
          // console.log(company);
          company.locations.should.have.length(2);
          company.locations[1].id.should.equal(_locationIds[1]);

          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update the phoneNumber of a location', function(done) {
      if (!_companyId) {
        return done(new Error('No Company!'));
      }

      Buttress.getCollection('company')
        .update(_companyId, {
          path: 'locations.1.phoneNumber',
          value: '01772 123456',
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
        return done(new Error('No Company!'));
      }

      Buttress.getCollection('company')
        .get(_companyId)
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
        return done(new Error('No Company!'));
      }

      Buttress.getCollection('company')
        .update(_companyId, {
          path: 'locations.1',
          value: {
            name: 'Distribution Depot',
            address: '24 East Street, Feniscowles',
            city: 'Whiteburn',
            postCode: 'BB1 5ET',
            phoneNumber: '01254 654321',
          },
        })
        .then(function(cr) {
          cr[0].type.should.equal('scalar');
          cr[0].path.should.equal('locations.1');
          cr[0].value.name.should.equal('Distribution Depot');
          cr[0].value.phoneNumber.should.equal('01254 654321');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the company with a further updated location', function(done) {
      if (!_companyId) {
        return done(new Error('No Company!'));
      }

      Buttress.getCollection('company')
        .get(_companyId)
        .then(function(company) {
          company.locations.should.have.length(2);
          company.locations[1].name.should.equal('Distribution Depot');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a location', function(done) {
      if (!_companyId) {
        return done(new Error('No Company!'));
      }
      Buttress.getCollection('company').update(_companyId, {
        path: 'locations.1.__remove__',
        value: '',
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
        return done(new Error('No Company!'));
      }

      Buttress.getCollection('company')
        .get(_companyId)
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
    Buttress.getCollection('company')
      .save({
        name: 'Blackburn Widget Company',
        companyType: 'prospect',
        locations: [{
          id: (new ObjectId()).toHexString(),
          name: 'Headquarters',
          address: '124 Bonsall Street, Mill Hill, Blackburn, BB2 5DS',
          city: 'Blackburn',
          postCode: 'BB2 5DS',
          phoneNumber: '01254 123123',
        }],
        contacts: [{
          id: (new ObjectId()).toHexString(),
          name: 'Robert McBobson',
          role: 'Managing Director',
        }],
      })
      .then(function(company) {
        _companyId = company.id;
        done();
      })
      .catch(done);
  });

  after(function(done) {
    Promise.all([
      Buttress.getCollection('company').remove(_companyId),
    ]).then(() => done()).catch(done);
  });

  describe('Notes', function() {
    it('should add a note', function(done) {
      if (!_companyId) {
        return done(new Error('No Company!'));
      }
      Buttress.getCollection('company').update(_companyId, {
        path: 'notes',
        value: {
          id: (new ObjectId()).toHexString(),
          text: 'This is an important note',
        },
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
        return done(new Error('No Company!'));
      }
      Buttress.getCollection('company').update(_companyId, {
        path: 'notes',
        value: {
          id: (new ObjectId()).toHexString(),
          text: 'This is another important note',
        },
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
        return done(new Error('No Company!'));
      }

      Buttress.getCollection('company')
        .get(_companyId)
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
        return done(new Error('No Company!'));
      }
      Buttress.getCollection('company').update(_companyId, {
        path: 'notes.0.__remove__',
        value: '',
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
        return done(new Error('No Company!'));
      }

      Buttress.getCollection('company')
        .get(_companyId)
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
        return done(new Error('No Company!'));
      }

      Buttress.getCollection('company')
        .update(_companyId, {
          path: 'notes.0.text',
          value: 'This is some updated text',
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
        return done(new Error('No Company!'));
      }

      Buttress.getCollection('company')
        .get(_companyId)
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
