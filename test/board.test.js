'use strict';

/**
 * Buttress API -
 *
 * @file board.test.js
 * @description
 * @author Lighten
 *
 */

const {default: Buttress} = require('../dist/index');
const Config = require('./config');

const Schemas = require('./data/schema');

Config.init();

describe('@boards', function() {
  this.timeout(2000);

  before(async function() {
    Buttress.setAuthToken(Config.token);
    Buttress.setAPIPath('bjs');
    await Buttress.setSchema(Schemas);
  });

  after(function(done) {
    Buttress.getCollection('board').removeAll()
      .then(() => done()).catch(done);
  });

  describe('Post Basics', function() {
    it('should return no boards', function(done) {
      Buttress.getCollection('board').getAll()
        .then(function(boards) {
          boards.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
