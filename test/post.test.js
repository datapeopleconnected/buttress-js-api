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
const Sugar = require('sugar');

Config.init();

describe('@post-basics', function() {
  this.timeout(2000);
  let _companies = [];
  let _user = null;

  before(function(done) {
    Config.createUser().then(user => {
      _user = user;
    })
    .then(Config.createCompanies)
    .then(function(companies) {
      _companies = companies;
    }).then(done);
  });

  after(function(done) {
    let posts = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id)
    ];

    Promise.all(posts).then(() => done()).catch(done);
  });

  describe('Basics', function() {
    let _post = null;
    it('should return no posts', function(done) {
      Buttress.Post
        .getAll()
        .then(function(posts) {
          posts.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add a Free post', function(done) {
      Buttress.Post
        .create({
          ownerId: _user.id,
          text: 'Important post with important information about everything.',
          type: Buttress.Post.Type.FREE
        })
        .then(function(post) {
          _post = post;
          _post.ownerId.should.equal(_user.id);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return 1 post', function(done) {
      Buttress.Post
        .getAll()
        .then(function(posts) {
          posts.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a post', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }
      Buttress.Post
        .remove(_post.id)
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

describe('@post-likes', function() {
  let _post = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    Config.createUser().then(user => {
      _user = user;
    })
      .then(Config.createCompanies)
      .then(function(companies) {
        _companies = companies;
        Buttress.Post
          .create({
            ownerId: _user.id,
            text: 'Important post with important information about everything.',
            type: Buttress.Post.Type.FREE,
          })
          .then(function(post) {
            _post = post;
            done();
          });
      }).catch(done);
  });

  after(function(done) {
    let posts = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id),
      Buttress.Post.remove(_post.id)
    ];

    Promise.all(posts).then(() => done()).catch(done);
  });

  describe('Likes', function() {
    it('should add a like', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }
      Buttress.Post.update(_post.id, {
        path: 'likeUserIds',
        value: _user.id
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-add');
          updates[0].path.should.equal('likeUserIds');
          updates[0].value.should.equal(_user.id);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the post with 1 likes', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }

      Buttress.Post
        .load(_post.id)
        .then(function(post) {
          post.likeUserIds.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a like', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }
      Buttress.Post.update(_post.id, {
        path: 'likeUserIds.0.__remove__',
        value: ''
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-rm');
          updates[0].path.should.equal('likeUserIds');
          updates[0].value.index.should.equal('0');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the post with 0 likes', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }

      Buttress.Post
        .load(_post.id)
        .then(function(post) {
          post.likeUserIds.should.have.length(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

describe('@post-notes', function() {
  let _post = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    Config.createUser().then(user => {
      _user = user;
    })
      .then(Config.createCompanies)
      .then(function(companies) {
        _companies = companies;
        Buttress.Post
          .create({
            ownerId: _user.id,
            text: 'Important post with important information about everything.',
            type: Buttress.Post.Type.FREE,
          })
          .then(function(post) {
            _post = post;
            done();
          });
      }).catch(done);
  });

  after(function(done) {
    let posts = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id),
      Buttress.Post.remove(_post.id)
    ];

    Promise.all(posts).then(() => done()).catch(done);
  });

  describe('Notes', function() {
    it('should add a note', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }
      Buttress.Post.update(_post.id, {
        path: 'notes',
        value: {
          text: 'This is an important note',
          userId: _user.id
        }
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-add');
          updates[0].path.should.equal('notes');
          updates[0].value.text.should.equal('This is an important note');
          updates[0].value.userId.should.equal(_user.id);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add a second note', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }
      Buttress.Post.update(_post.id, {
        path: 'notes',
        value: {
          text: 'This is another important note'
        }
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-add');
          updates[0].path.should.equal('notes');
          updates[0].value.text.should.equal('This is another important note');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the post with 2 notes', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }

      Buttress.Post
        .load(_post.id)
        .then(function(post) {
          post.notes.should.have.length(2);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a note', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }
      Buttress.Post.update(_post.id, {
        path: 'notes.0.__remove__',
        value: ''
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-rm');
          updates[0].path.should.equal('notes');
          updates[0].value.index.should.equal('0');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the post with 1 notes', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }

      Buttress.Post
        .load(_post.id)
        .then(function(post) {
          post.notes.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update the text of a note', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }

      Buttress.Post
        .update(_post.id, {
          path: 'notes.0.text',
          value: 'This is some updated text'
        })
        .then(function(cr) {
          cr[0].type.should.equal('scalar');
          cr[0].path.should.equal('notes.0.text');
          cr[0].value.should.equal('This is some updated text');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the post with an updated note', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }

      Buttress.Post
        .load(_post.id)
        .then(function(post) {
          post.notes.should.have.length(1);
          post.notes[0].text.should.equal('This is some updated text');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

describe('@post-metadata', function() {
  let _post = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    Config.createUser().then(user => {
      _user = user;
    })
      .then(Config.createCompanies)
      .then(function(companies) {
        _companies = companies;
        Buttress.Post
          .create({
            ownerId: _user.id,
            text: 'Important post with important information about everything.',
            type: Buttress.Post.Type.FREE
          })
          .then(function(post) {
            _post = post;
            done();
          });
      }).catch(done);
  });

  after(function(done) {
    let posts = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id),
      Buttress.Post.remove(_post.id)
    ];

    Promise.all(posts).then(() => done()).catch(done);
  });

  describe('Metadata', function() {
    it('should get default metadata', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }
      Buttress.Post.Metadata
        .load(_post.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add metadata', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }
      Buttress.Post.Metadata
        .save(_post.id, 'TEST_DATA', {foo: 'bar'})
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get metadata', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }
      Buttress.Post.Metadata
        .load(_post.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should delete metadata', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }
      Buttress.Post.Metadata
        .remove(_post.id, 'TEST_DATA')
        .then(function(metadata) {
          metadata.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get default metadata (post-deletion)', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }
      Buttress.Post.Metadata
        .load(_post.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should fail to delete metadata', function(done) {
      if (!_post) {
        return done(new Error("No Post!"));
      }
      Buttress.Post.Metadata
        .remove(_post.id, 'TEST_DATA')
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
