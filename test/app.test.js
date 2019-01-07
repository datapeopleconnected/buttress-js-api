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

describe('@app-basics', function() {
  this.timeout(2000);

  before(function(done) {
    done();
  });

  after(function(done) {
    done();
  });

  describe('Basics', function() {
    it('should return the app schema', function(done) {
      Buttress.App
        .getSchema()
        .then(function(schema) {
          schema.length.should.equal(2);
          schema[1].collection.should.equal('services');
          schema[1].name.should.equal('service');
          schema[1].properties.appProp1.__type.should.equal('string');
          schema[1].properties.appProp1.__required.should.equal(true);
          schema[1].properties.appProp1.__allowUpdate.should.equal(true);
          schema[1].properties.appProp5.__default.should.equal('pending');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
