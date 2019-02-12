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
const ObjectId = require('mongodb').ObjectId;

Config.init();

describe('@post-basics', function() {
  this.timeout(2000);

  const collection = Buttress.getCollection('post');

  before(function(done) {
    done();
  });

  after(function(done) {
    collection.removeAll()
      .then(() => done()).catch(done);
  });

  describe('Post Basics', function() {
    const _savePostData = {
      id: (new ObjectId()).toHexString(),
      content: "Hello world",
      memberSecretContent: "Secret Hello world",
      adminSecretContent: "Secret Admin Hello world",
      parentPostId: (new ObjectId()).toHexString(),
      userId: (new ObjectId()).toHexString()
    };

    it('should return no posts', function(done) {
      collection.getAll()
        .then(function(posts) {
          posts.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should add a post', function(done) {
      collection.save(_savePostData)
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
      collection.getAll()
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
      collection.update(_savePostData.id, {
        path: 'kudos',
        value: "EDITED: Hello world"
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
      collection.update(_savePostData.id, {
        path: 'kudos',
        value: 1
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

    it('should remove the post', function(done) {
      collection.remove(_savePostData.id)
        .then(function(res) {
          res.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should add several posts', function(done) {
      const __gen = num => {
        let arr = [];
        for (let x = 0; x < num; x++) {
          arr.push({
            content: `Hello ${x}`,
            memberSecretContent: "Secret Hello world",
            adminSecretContent: "Secret Admin Hello world",
            kudos: x,
            parentPostId: (new ObjectId()).toHexString(),
            userId: (new ObjectId()).toHexString()
          });
        }

        return arr;
      };

      const _posts = __gen(1000);

      collection
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
