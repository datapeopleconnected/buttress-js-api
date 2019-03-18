"use strict";

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
// const ObjectId = require('mongodb').ObjectId;

Config.init();

describe('@boards', function() {
  this.timeout(2000);

  const collection = Buttress.getCollection('board');

  before(function(done) {
    done();
  });

  after(function(done) {
    collection.removeAll()
      .then(() => done()).catch(done);
  });

  describe('Post Basics', function() {
    it('should return no boards', function(done) {
      collection.getAll()
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
