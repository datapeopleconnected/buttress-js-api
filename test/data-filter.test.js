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

describe('@data-filter', function() {
  this.timeout(2000);

  const collection = Buttress.getCollection('board');

  before(function(done) {
    done();
  });

  after(function(done) {
    collection.removeAll()
      .then(() => done()).catch(done);
  });

  // TODO:
  // * Should create some tokens to work with based on app roles
  // * Should create some boards to test against with associated posts.
  // * Should fetch filtered results based on the App role filter:
  //     A token should only receive boards & posts back that its subscribed to.
  //     - user.id (single)  -> board.subscribed (many)
  //     - board.id (single) -> post.boardId (single)

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
