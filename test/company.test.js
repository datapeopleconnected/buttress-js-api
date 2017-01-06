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
    let ids = _companies.map(c => c.id);
    Rhizome.Company.bulkRemove(ids)
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
            address: "124 Bonsall Street, Mill Hill, Blackburn, BB2 5DS",
            phoneNumber: "01254 123123"
          },
          contact: {
            name: "Robert McBobson"
          }
        })
        .then(function(company) {
          _company = company;
          company.name.should.equal('Blackburn Widget Company');
          company.locations.length.should.equal(1);
          company.primaryLocation.address.postcode.should.equal('BB2 5DS');
          company.primaryLocation.phoneNumber.should.equal('01254 123123');
          company.primaryContact.name.full.should.equal('Robert McBobson');
          company.primaryContact.name.forename.should.equal('Robert');
          company.primaryContact.name.surname.should.equal('McBobson');
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
              address: "124 Bonsall Street, Mill Hill, Blackburn, BB2 5DS",
              phoneNumber: "01254 123123"
            },
            contact: {
              name: "Robert McBobson"
            }
          });
        }

        return arr;
      };

      Rhizome.Company
        .saveAll({companies: __gen(100)})
        .then(function(companies) {
          companies.length.should.equal(100);
          _companies = companies;
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
          address: "124 Bonsall Street, Mill Hill, Blackburn, BB2 5DS",
          phoneNumber: "01254 123123"
        },
        contact: {
          name: "Robert McBobson"
        }
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
    // it('should get default metadata (post-deletion)', function(done) {
    //   if (!_company) {
    //     return done(new Error("No Company!"));
    //   }
    //   Rhizome.Company.Metadata
    //     .load(_company.id, 'TEST_DATA', false)
    //     .then(function(metadata) {
    //       metadata.should.equal(false);
    //       done();
    //     })
    //     .catch(function(err) {
    //       done(err);
    //     });
    // });
    // it('should fail to delete metadata', function(done) {
    //   if (!_company) {
    //     return done(new Error("No Company!"));
    //   }
    //   Rhizome.Company.Metadata
    //     .remove(_company.id, 'TEST_DATA')
    //     .then(function(metadata) {
    //       metadata.should.equal(false);
    //       done();
    //     })
    //     .catch(function(err) {
    //       done(err);
    //     });
    // });
  });
});
