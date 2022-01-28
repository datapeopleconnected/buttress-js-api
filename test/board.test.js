'use strict';

/**
 * Buttress API -
 *
 * @file board.test.js
 * @description
 * @author Lighten
 *
 */

const Buttress = require('../lib/buttressjs');
const Config = require('./config');

Config.init();

describe('@boards', function() {
  this.timeout(2000);

  before(function(done) {
    done();
  });

  after(function(done) {
    Buttress.getCollection('boards').removeAll()
      .then(() => done()).catch(done);
  });

  describe('Post Basics', function() {
    it('should return no boards', function(done) {
      Buttress.getCollection('boards').getAll()
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
