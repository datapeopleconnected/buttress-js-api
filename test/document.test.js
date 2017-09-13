"use strict";

/**
 * Buttress API -
 *
 * @file document.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('../lib/buttressjs');
const Config = require('./config');
const Sugar = require('sugar');

Config.init();

describe('@document-basics', function() {
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
    let tasks = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Basics', function() {
    let _document = null;
    it('should return no documents', function(done) {
      Buttress.Document
        .getAll()
        .then(function(documents) {
          documents.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add a document', function(done) {
      Buttress.Document
        .create({
          ownerId: _user.id,
          name: 'Letter of Authority',
          companyId: _companies[0].id,
          documentMetadata: {
            id: '1234567890'
          }
        })
        .then(function(document) {
          _document = document;
          _document.ownerId.should.equal(_user.id);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return 1 document', function(done) {
      Buttress.Document
        .getAll()
        .then(function(documents) {
          documents.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should remove a document', function(done) {
      if (!_document) {
        return done(new Error("No Document!"));
      }
      Buttress.Document
        .remove(_document.id)
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

describe('@document-notes', function() {
  let _document = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    Config.createUser().then(user => {
      _user = user;
    })
      .then(Config.createCompanies)
      .then(function(companies) {
        _companies = companies;
        Buttress.Document
          .create({
            ownerId: _user.id,
            name: 'Letter of Authority',
            companyId: _companies[0].id,
            documentMetadata: {
              id: '1234567890'
            }
          })
          .then(function(document) {
            _document = document;
            done();
          });
      }).catch(done);
  });

  after(function(done) {
    let tasks = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id),
      Buttress.Document.remove(_document.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Notes', function() {
    it('should add a note', function(done) {
      if (!_document) {
        return done(new Error("No Document!"));
      }
      Buttress.Document.update(_document.id, {
        path: 'notes',
        value: {
          text: 'This is an important note'
        }
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-add');
          updates[0].path.should.equal('notes');
          updates[0].value.text.should.equal('This is an important note');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add a second note', function(done) {
      if (!_document) {
        return done(new Error("No Document!"));
      }
      Buttress.Document.update(_document.id, {
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
    it('should return the document with 2 notes', function(done) {
      if (!_document) {
        return done(new Error("No Document!"));
      }

      Buttress.Document
        .load(_document.id)
        .then(function(document) {
          document.notes.should.have.length(2);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a note', function(done) {
      if (!_document) {
        return done(new Error("No Document!"));
      }
      Buttress.Document.update(_document.id, {
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
    it('should return the document with 1 notes', function(done) {
      if (!_document) {
        return done(new Error("No Document!"));
      }

      Buttress.Document
        .load(_document.id)
        .then(function(document) {
          document.notes.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update the text of a note', function(done) {
      if (!_document) {
        return done(new Error("No Document!"));
      }

      Buttress.Document
        .update(_document.id, {
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
    it('should return the document with an updated note', function(done) {
      if (!_document) {
        return done(new Error("No Document!"));
      }

      Buttress.Document
        .load(_document.id)
        .then(function(document) {
          document.notes.should.have.length(1);
          document.notes[0].text.should.equal('This is some updated text');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

describe('@document-metadata', function() {
  let _document = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    Config.createUser().then(user => {
      _user = user;
    })
      .then(Config.createCompanies)
      .then(function(companies) {
        _companies = companies;
        Buttress.Document
          .create({
            ownerId: _user.id,
            name: 'Letter of Authority',
            companyId: _companies[0].id,
            documentMetadata: {
              id: '1234567890'
            }
          })
          .then(function(document) {
            _document = document;
            done();
          });
      }).catch(done);
  });

  after(function(done) {
    let tasks = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id),
      Buttress.Document.remove(_document.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Metadata', function() {
    it('should get default metadata', function(done) {
      if (!_document) {
        return done(new Error("No Document!"));
      }
      Buttress.Document.Metadata
        .load(_document.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add metadata', function(done) {
      if (!_document) {
        return done(new Error("No Document!"));
      }
      Buttress.Document.Metadata
        .save(_document.id, 'TEST_DATA', {foo: 'bar'})
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get metadata', function(done) {
      if (!_document) {
        return done(new Error("No Document!"));
      }
      Buttress.Document.Metadata
        .load(_document.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should delete metadata', function(done) {
      if (!_document) {
        return done(new Error("No Document!"));
      }
      Buttress.Document.Metadata
        .remove(_document.id, 'TEST_DATA')
        .then(function(metadata) {
          metadata.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get default metadata (post-deletion)', function(done) {
      if (!_document) {
        return done(new Error("No Document!"));
      }
      Buttress.Document.Metadata
        .load(_document.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should fail to delete metadata', function(done) {
      if (!_document) {
        return done(new Error("No Document!"));
      }
      Buttress.Document.Metadata
        .remove(_document.id, 'TEST_DATA')
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
