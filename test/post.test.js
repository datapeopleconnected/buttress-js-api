'use strict';

/**
 * Buttress API - The federated real-time open data platform
 * Copyright (C) 2016-2024 Data People Connected LTD.
 * <https://www.dpc-ltd.com/>
 *
 * This file is part of Buttress.
 * Buttress is free software: you can redistribute it and/or modify it under the
 * terms of the GNU Affero General Public Licence as published by the Free Software
 * Foundation, either version 3 of the Licence, or (at your option) any later version.
 * Buttress is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public Licence for more details.
 * You should have received a copy of the GNU Affero General Public Licence along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */

const {default: Buttress} = require('../dist/index');
const Config = require('./config');
const ObjectId = require('bson-objectid');

Config.init();

describe('@posts', function() {
  this.timeout(2000);

  before(function(done) {
    Buttress.getCollection('posts').removeAll()
      .then(() => done()).catch(done);
  });

  after(function(done) {
    Buttress.getCollection('posts').removeAll()
      .then(() => done()).catch(done);
  });

  describe('Post Basics', function() {
    const _savePostData = {
      id: (new ObjectId()).toHexString(),
      content: 'Hello world',
      memberSecretContent: 'Secret Hello world',
      adminSecretContent: 'Secret Admin Hello world',
      parentPostId: (new ObjectId()).toHexString(),
      userId: (new ObjectId()).toHexString(),
    };

    it('should return no posts', function(done) {
      Buttress.getCollection('posts').getAll()
        .then(function(posts) {
          posts.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should add a post', function(done) {
      Buttress.getCollection('posts').save(_savePostData)
        .then(function(post) {
          post.id.should.equal(_savePostData.id);
          return post;
        })
        .then(function(post) {
          post.content.should.equal(_savePostData.content);
          post.memberSecretContent.should.equal(_savePostData.memberSecretContent);
          post.adminSecretContent.should.equal(_savePostData.adminSecretContent);
          post.parentPostId.should.equal(_savePostData.parentPostId);
          post.userId.should.equal(_savePostData.userId);
          post.createdAt.should.not.be.null();
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return 1 post', function(done) {
      Buttress.getCollection('posts').getAll()
        .then(function(posts) {
          posts.should.have.length(1);
          posts[0].id.should.equal(_savePostData.id);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should not accept invalid value', function(done) {
      Buttress.getCollection('posts').update(_savePostData.id, {
        path: 'kudos',
        value: 'EDITED: Hello world',
      })
        .then(function(results) {
          done(new Error('Should not succeed'));
        })
        .catch(function(err) {
          err.statusCode.should.equal(400);
          done();
        });
    });

    it('should update the post', function(done) {
      Buttress.getCollection('posts').update(_savePostData.id, {
        path: 'kudos',
        value: 1,
      })
        .then(function(results) {
          results.length.should.equal(2);
          results[0].path.should.equal('kudos');
          results[0].value.should.equal(1);
          results[1].path.should.equal('updatedAt');
          done();
        })
        .catch(done);
    });

    it('should increment the view count by 12', function(done) {
      const increment = 12;
      let startCount = null;

      Buttress.getCollection('posts').get(_savePostData.id)
        .then((post) => startCount = post.views)
        .then(() => Buttress.getCollection('posts').update(_savePostData.id, {path: 'views.__increment__', value: increment}))
        .then((results) => {
          results[0].path.should.equal('views.__increment__');
          results[0].value.should.equal(increment);
        })
        .then(() => Buttress.getCollection('posts').get(_savePostData.id))
        .then((post) => {
          post.views.should.equal(startCount + increment);
          done();
        })
        .catch(done);
    });

    it('should increment the view count by 5', function(done) {
      const increment = 5;
      let startCount = null;

      Buttress.getCollection('posts').get(_savePostData.id)
        .then((post) => startCount = post.views)
        .then(() => Buttress.getCollection('posts').update(_savePostData.id, {path: 'views.__increment__', value: increment}))
        .then((results) => {
          results[0].path.should.equal('views.__increment__');
          results[0].value.should.equal(increment);
        })
        .then(() => Buttress.getCollection('posts').get(_savePostData.id))
        .then((post) => {
          post.views.should.equal(startCount + increment);
          done();
        })
        .catch(done);
    });

    it('should decrement the view count by 2', function(done) {
      const increment = -2;
      let startCount = null;

      Buttress.getCollection('posts').get(_savePostData.id)
        .then((post) => startCount = post.views)
        .then(() => Buttress.getCollection('posts').update(_savePostData.id, {path: 'views.__increment__', value: increment}))
        .then((results) => {
          results[0].path.should.equal('views.__increment__');
          results[0].value.should.equal(increment);
        })
        .then(() => Buttress.getCollection('posts').get(_savePostData.id))
        .then((post) => {
          post.views.should.equal(startCount + increment);
          done();
        })
        .catch(done);
    });

    it('should respond 400 when incrementing a stirng', function(done) {
      const increment = 2;

      Buttress.getCollection('posts').update(_savePostData.id, {path: 'content.__increment__', value: increment})
        .catch((err) => {
          err.statusCode.should.be.equal(400);
          done();
        });
    });

    it('should respond 400 passing a string', function(done) {
      const increment = 'string';

      Buttress.getCollection('posts').update(_savePostData.id, {path: 'views.__increment__', value: increment})
        .catch((err) => {
          err.statusCode.should.be.equal(400);
          done();
        });
    });

    it('should remove the post', function(done) {
      Buttress.getCollection('posts').remove(_savePostData.id)
        .then(function(res) {
          res.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should add several posts', function(done) {
      const __gen = (num) => {
        const arr = [];
        for (let x = 0; x < num; x++) {
          arr.push({
            content: `Hello ${x}`,
            memberSecretContent: 'Secret Hello world',
            adminSecretContent: 'Secret Admin Hello world',
            kudos: x,
            parentPostId: (new ObjectId()).toHexString(),
            userId: (new ObjectId()).toHexString(),
          });
        }

        return arr;
      };

      const _posts = __gen(1000);

      Buttress.getCollection('posts')
        .bulkSave(_posts)
        .then(function(posts) {
          posts.length.should.equal(1000);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
