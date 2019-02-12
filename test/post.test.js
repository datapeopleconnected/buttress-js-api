"use strict";

/**
 * Buttress API -
 *
 * @file post.test.js
 * @description
 * @author Lighten
 *
 */

const Buttress = require('../lib/buttressjs');
const Config = require('./config');

Config.init();

describe('@post-basics', function() {
  this.timeout(2000);

  before(function(done) {
    done();
  });

  after(function(done) {
    Buttress.schema('post').removeAll()
      .then(() => done()).catch(done);
  });

  describe('Post Basics', function() {
    it('should return no posts', function(done) {
      done();
    });
  });
});
