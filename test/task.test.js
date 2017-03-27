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

describe('@task-basics', function() {
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
    let _task = null;
    it('should return no tasks', function(done) {
      Buttress.Task
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
      Buttress.Task
        .create({
          ownerId: _user.id,
          assignedToId: _user.id,
          name: 'Important task!',
          type: Buttress.Task.Type.FREE,
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
      Buttress.Task
        .getAll()
        .then(function(tasks) {
          tasks.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return 1 task reminder', function(done) {
      Buttress.Task
        .getAllReminders()
        .then(function(tasks) {
          tasks.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should mark task reminder as done', function(done) {
      Buttress.Task
        .update(_task.id, {
          path: 'reminder.status',
          value: 'done'
        })
        .then(function(res) {
          res.length.should.equal(1);
          res[0].type.should.equal('scalar');
          res[0].path.should.equal('reminder.status');
          res[0].value.should.equal('done');
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
      Buttress.Task
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
    Config.createUser().then(user => {
      _user = user;
    })
      .then(Config.createCompanies)
      .then(function(companies) {
        _companies = companies;
        Buttress.Task
          .create({
            ownerId: _user.id,
            assignedToId: _user.id,
            name: 'Important task!',
            type: Buttress.Task.Type.FREE,
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
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id),
      Buttress.Task.remove(_task.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Notes', function() {
    it('should add a note', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }
      Buttress.Task.update(_task.id, {
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
      Buttress.Task.update(_task.id, {
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

      Buttress.Task
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
      Buttress.Task.update(_task.id, {
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
    it('should return the task with 1 notes', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }

      Buttress.Task
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

      Buttress.Task
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

      Buttress.Task
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
    Config.createUser().then(user => {
      _user = user;
    })
      .then(Config.createCompanies)
      .then(function(companies) {
        _companies = companies;
        Buttress.Task
          .create({
            ownerId: _user.id,
            assignedToId: _user.id,
            name: 'Important task!',
            type: Buttress.Task.Type.FREE,
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
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id),
      Buttress.Task.remove(_task.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Metadata', function() {
    it('should get default metadata', function(done) {
      if (!_task) {
        return done(new Error("No Task!"));
      }
      Buttress.Task.Metadata
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
      Buttress.Task.Metadata
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
      Buttress.Task.Metadata
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
      Buttress.Task.Metadata
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
      Buttress.Task.Metadata
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
      Buttress.Task.Metadata
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
