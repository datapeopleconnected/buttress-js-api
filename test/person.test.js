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

/**
 * In all tests that make use of promises, you need to use .catch(err => done(err) pattern.
 * Otherwise the promise consumes the assertion failure and you get a timeout instead of useful info.
 */

describe('@person-basics', function() {
  before(function() {
  });

  describe('Person Basics', function() {
    let _person = null;
    it('should return no people', function(done) {
      Buttress.Person
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
      Buttress.Person
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
      Buttress.Person
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
      Buttress.Person
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
