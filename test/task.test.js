"use strict";

/**
 * Rhizome API -
 *
 * @file person.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Rhizome = require('../lib/rhizome');
const Config = require('./config');
const Sugar = require('sugar');

Config.init();

/**
 * In all tests that make use of promises, you need to use .catch(err => done(err) pattern.
 * Otherwise the promise consumes the assertion failure and you get a timeout instead of useful info.
 */

let __createCompanies = () => {
  let companies = [
    {
      name: 'Company 1',
      location: {
        name: 'HQ',
        address: '123 Acacia Avenue, Brixton, SW9 4DW',
        phoneNumber: '0205 123123'
      },
      contact: {
        name: 'Bananaman'
      }
    },
    {
      name: 'Company 2',
      location: {
        name: 'HQ',
        address: '123 Acacia Avenue, Brixton, SW9 4DW',
        phoneNumber: '0205 123123'
      },
      contact: {
        name: 'Bananaman'
      }
    },
    {
      name: 'Company 3',
      location: {
        name: 'HQ',
        address: '123 Acacia Avenue, Brixton, SW9 4DW',
        phoneNumber: '0205 123123'
      },
      contact: {
        name: 'Bananaman'
      }
    },
    {
      name: 'Company 4',
      location: {
        name: 'HQ',
        address: '123 Acacia Avenue, Brixton, SW9 4DW',
        phoneNumber: '0205 123123'
      },
      contact: {
        name: 'Bananaman'
      }
    },
    {
      name: 'Company 5',
      location: {
        name: 'HQ',
        address: '123 Acacia Avenue, Brixton, SW9 4DW',
        phoneNumber: '0205 123123'
      },
      contact: {
        name: 'Bananaman'
      }
    }
  ];
  return Rhizome.Company.saveAll({companies: companies})
    .then(companyIds => {
      return Rhizome.Company.bulkLoad(companyIds);
    })
    .catch(err => {
      throw err;
    });
};

let __createUser = () => {
  let userAppAuth = {
    app: 'google',
    id: '12345678987654321',
    name: 'Chris Bates-Keegan',
    token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
    email: 'test@test.com',
    profileUrl: 'http://test.com/thisisatest',
    profileImgUrl: 'http://test.com/thisisatest.png'
  };
  return Rhizome.Auth.findOrCreateUser(userAppAuth)
    .catch(err => {
      throw err;
    });
};

describe('@task-basics', function() {
  this.timeout(2000);
  let _companies = [];
  let _user = null;

  before(function(done) {
    __createUser().then(user => {
      _user = user;
    })
    .then(__createCompanies)
    .then(function(companies) {
      _companies = companies;
    }).then(done);
  });

  after(function(done) {
    let tasks = [
      Rhizome.Company.bulkRemove(_companies.map(c => c.id)),
      Rhizome.User.remove(_user.id),
      Rhizome.Person.remove(_user.person.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Basics', function() {
    let _task = null;
    it('should return no tasks', function(done) {
      Rhizome.Task
        .getAll()
        .then(function(tasks) {
          tasks.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add a Free task', function(done) {
      Rhizome.Task
        .create({
          ownerId: _user.id,
          name: 'Important task!',
          type: Rhizome.Task.Type.FREE,
          dueDate: Sugar.Date.addDays(Sugar.Date.create(), 1)
        })
        .then(function(task) {
          _task = task;
          _task.ownerId.should.equal(_user.id);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return 1 task', function(done) {
      Rhizome.Task
        .getAll()
        .then(function(tasks) {
          tasks.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should remove a task', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }
      Rhizome.Task
        .remove(_task.id)
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

describe('@task-notes', function() {
  let _task = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    __createUser().then(user => {
      _user = user;
    })
      .then(__createCompanies)
      .then(function(companies) {
        _companies = companies;
        Rhizome.Task
          .create({
            ownerId: _user.id,
            name: 'Important task!',
            type: Rhizome.Task.Type.FREE,
            dueDate: Sugar.Date.addDays(Sugar.Date.create(), 1)
          })
          .then(function(task) {
            _task = task;
            done();
          });
      }).catch(done);
  });

  after(function(done) {
    let tasks = [
      Rhizome.Company.bulkRemove(_companies.map(c => c.id)),
      Rhizome.User.remove(_user.id),
      Rhizome.Person.remove(_user.person.id),
      Rhizome.Task.remove(_task.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Notes', function() {
    it('should add a note', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }
      Rhizome.Task.update(_task.id, {
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
      if (!_task) {
        return done(new Error("No Task!"));
      }
      Rhizome.Task.update(_task.id, {
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
    it('should return the task with 2 notes', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }

      Rhizome.Task
        .load(_task.id)
        .then(function(task) {
          task.notes.should.have.length(2);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a note', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }
      Rhizome.Task.update(_task.id, {
        path: 'notes.0',
        value: 'remove'
      })
        .then(function(updates) {
          updates.length.should.equal(1);
          updates[0].type.should.equal('vector-rm');
          updates[0].path.should.equal('notes.0');
          updates[0].value.index.should.equal('0');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return the task with 1 notes', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }

      Rhizome.Task
        .load(_task.id)
        .then(function(task) {
          task.notes.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update the text of a note', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }

      Rhizome.Task
        .update(_task.id, {
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
    it('should return the task with an updated note', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }

      Rhizome.Task
        .load(_task.id)
        .then(function(task) {
          task.notes.should.have.length(1);
          task.notes[0].text.should.equal('This is some updated text');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

describe('@task-metadata', function() {
  let _task = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    __createUser().then(user => {
      _user = user;
    })
      .then(__createCompanies)
      .then(function(companies) {
        _companies = companies;
        Rhizome.Task
          .create({
            ownerId: _user.id,
            name: 'Important task!',
            type: Rhizome.Task.Type.FREE,
            dueDate: Sugar.Date.addDays(Sugar.Date.create(), 1)
          })
          .then(function(task) {
            _task = task;
            done();
          });
      }).catch(done);
  });

  after(function(done) {
    let tasks = [
      Rhizome.Company.bulkRemove(_companies.map(c => c.id)),
      Rhizome.User.remove(_user.id),
      Rhizome.Person.remove(_user.person.id),
      Rhizome.Task.remove(_task.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Metadata', function() {
    it('should get default metadata', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }
      Rhizome.Task.Metadata
        .load(_task.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add metadata', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }
      Rhizome.Task.Metadata
        .save(_task.id, 'TEST_DATA', {foo: 'bar'})
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get metadata', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }
      Rhizome.Task.Metadata
        .load(_task.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should delete metadata', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }
      Rhizome.Task.Metadata
        .remove(_task.id, 'TEST_DATA')
        .then(function(metadata) {
          metadata.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get default metadata (post-deletion)', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }
      Rhizome.Task.Metadata
        .load(_task.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should fail to delete metadata', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }
      Rhizome.Task.Metadata
        .remove(_task.id, 'TEST_DATA')
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
