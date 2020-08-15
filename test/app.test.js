"use strict";

/**
 * Buttress API -
 *
 * @file app.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('../lib/buttressjs');
const Config = require('./config');
const TestSchema = require('./data/schema');
const Schemas = require('./data/schema');

Config.init();

describe('@app-basics', function() {
  this.timeout(2000);

  before(function(done) {
    done();
  });

  after(function(done) {
    Buttress.options.schema = TestSchema;
    Buttress.initSchema()
      .then(() => done())
      .catch(function(err) {
        done(err);
      });
  });

  describe('Schema', function() {
    it('should return the app schema', function(done) {
      Buttress.App
        .getSchema()
        .then(function(schema) {
          schema.length.should.equal(Schemas.length);
          schema[3].collection.should.equal('services');
          schema[3].name.should.equal('service');
          schema[3].properties.appProp1.__type.should.equal('string');
          schema[3].properties.appProp1.__required.should.equal(true);
          schema[3].properties.appProp1.__allowUpdate.should.equal(true);
          schema[3].properties.appProp5.__default.should.equal('pending');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it(`should fail when trying to interact with 'test' schema`, function(done) {
      try {
        Buttress.getCollection('tests');
      } catch (err) {
        if (err instanceof Buttress.Errors.SchemaNotFound) {
          return done();
        }
        done(err);
      }
    });

    it(`should update the app schema with 'test'`, function(done) {
      Buttress.options.schema = [{
        "name": "test",
        "type": "collection",
        "collection": "tests",
        "properties": {
          "name": {
            "__type": "string",
            "__default": null,
            "__required": true,
            "__allowUpdate": true
          }
        }
      }];

      Buttress.initSchema()
        .then(() => {
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it(`should be able to interact with 'test' schema`, function(done) {
      try {
        const tests = Buttress.getCollection('tests');
      } catch (err) {
        return done(err);
      }

      Buttress.getCollection('tests')
        .getAll()
        .then((tests) => {
          tests.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });


  });
});
