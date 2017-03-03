"use strict";

/**
 * Buttress API -
 *
 * @file notification.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('../lib/buttressjs');
const Config = require('./config');
const Sugar = require('sugar');

Config.init();

/**
 * In all tests that make use of promises, you need to use .catch(err => done(err) pattern.
 * Otherwise the promise consumes the assertion failure and you get a timeout instead of useful info.
 */

describe('@appointment-basics', function() {
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
    let appointments = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id)
    ];

    Promise.all(appointments).then(() => done()).catch(done);
  });

  describe('Basics', function() {
    let _appointment = null;
    it('should return no appointments', function(done) {
      Buttress.Appointment
        .getAll()
        .then(function(appointments) {
          appointments.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add an appointment', function(done) {
      Buttress.Appointment
        .create({
          name: 'Important Appointment',
          date: Sugar.Date.create('2017-02-11 10:00:00'),
          ownerId: _user.id,
          assignedToId: _user.id,
          companyId: _companies[0].id,
          contactId: _companies[0].contacts[0].id
        })
        .then(function(appointment) {
          _appointment = appointment;
          _appointment.name.should.equal('Important Appointment');
          _appointment.ownerId.should.equal(_user.id);
          _appointment.assignedToId.should.equal(_user.id);
          _appointment.companyId.should.equal(_companies[0].id);
          _appointment.contactId.should.equal(_companies[0].contacts[0].id);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return 1 appointment', function(done) {
      Buttress.Appointment
        .getAll()
        .then(function(appointments) {
          appointments.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update a appointment outcome', function(done) {
      Buttress.Appointment
        .update(_appointment.id, {
          path: 'outcome',
          value: Buttress.Appointment.Outcome.SUCCESS
        })
        .then(function(res) {
          res.length.should.equal(1);
          res[0].type.should.equal('scalar');
          res[0].path.should.equal('outcome');
          res[0].value.should.equal('success');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should fail to update a appointment', function(done) {
      Buttress.Appointment
        .update(_appointment.id, {
          path: 'blarg',
          value: true
        })
        .then(function(data) {
          data.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('appointment.outcome should equal \'success\'', function(done) {
      Buttress.Appointment
        .load(_appointment.id)
        .then(function(appointment) {
          appointment.outcome.should.equal(Buttress.Appointment.Outcome.SUCCESS);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a appointment', function(done) {
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }
      Buttress.Appointment
        .remove(_appointment.id)
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

describe('@appointment-notes', function() {
  let _appointment = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    Config.createUser().then(user => {
      _user = user;
    })
      .then(Config.createCompanies)
      .then(function(companies) {
        _companies = companies;
        Buttress.Appointment
          .create({
            name: 'Important Appointment',
            date: Sugar.Date.create('2017-02-11 10:00:00'),
            ownerId: _user.id,
            assignedToId: _user.id,
            companyId: _companies[0].id,
            contactId: _companies[0].contacts[0].id
          })
          .then(function(appointment) {
            _appointment = appointment;
            done();
          });
      }).catch(done);
  });

  after(function(done) {
    let appointments = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id),
      Buttress.Appointment.remove(_appointment.id)
    ];

    Promise.all(appointments).then(() => done()).catch(done);
  });

  describe('Notes', function() {
    it('should add a note', function(done) {
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }
      Buttress.Appointment.update(_appointment.id, {
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
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }
      Buttress.Appointment.update(_appointment.id, {
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
    it('should return the appointment with 2 notes', function(done) {
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }

      Buttress.Appointment
        .load(_appointment.id)
        .then(function(appointment) {
          appointment.notes.should.have.length(2);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a note', function(done) {
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }
      Buttress.Appointment.update(_appointment.id, {
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
    it('should return the appointment with 1 notes', function(done) {
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }

      Buttress.Appointment
        .load(_appointment.id)
        .then(function(appointment) {
          appointment.notes.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update the text of a note', function(done) {
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }

      Buttress.Appointment
        .update(_appointment.id, {
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
    it('should return the appointment with an updated note', function(done) {
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }

      Buttress.Appointment
        .load(_appointment.id)
        .then(function(appointment) {
          appointment.notes.should.have.length(1);
          appointment.notes[0].text.should.equal('This is some updated text');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

describe('@appointment-metadata', function() {
  let _appointment = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    Config.createUser()
    .then(user => {
      _user = user;
    })
    .then(Config.createCompanies)
    .then(function(companies) {
      _companies = companies;
      return Buttress.Appointment
        .create({
          name: 'Important Appointment',
          date: Sugar.Date.create('2017-02-11 11:00:00'),
          ownerId: _user.id,
          assignedToId: _user.id,
          companyId: _companies[0].id,
          contactId: _companies[0].contacts[0].id
        });
    })
    .then(appointment => {
      _appointment = appointment;
    })
    .then(done);
  });

  after(function(done) {
    let cleanup = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id)
    ];

    Promise.all(cleanup).then(() => done()).catch(done);
  });

  describe('Appointment Metadata', function() {
    it('should get default metadata', function(done) {
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }
      Buttress.Appointment.Metadata
        .load(_appointment.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(done);
    });

    it('should add metadata', function(done) {
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }
      Buttress.Appointment.Metadata
        .save(_appointment.id, 'TEST_DATA', {foo: 'bar'})
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(done);
    });

    it('should get metadata', function(done) {
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }
      Buttress.Appointment.Metadata
        .load(_appointment.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.not.equal(false);
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(done);
    });

    it('should get all metadata', function(done) {
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }
      Buttress.Appointment.Metadata
        .loadAll(_appointment.id)
        .then(function(metadata) {
          metadata.should.not.equal(false);
          metadata.TEST_DATA.foo.should.equal('bar');
          done();
        })
        .catch(done);
    });

    it('should delete metadata', function(done) {
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }
      Buttress.Appointment.Metadata
        .remove(_appointment.id, 'TEST_DATA')
        .then(function(result) {
          result.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get default metadata (post-deletion)', function(done) {
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }
      Buttress.Appointment.Metadata
        .load(_appointment.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should fail to delete metadata', function(done) {
      if (!_appointment) {
        return done(new Error("No Appointment!"));
      }
      Buttress.Appointment.Metadata
        .remove(_appointment.id, 'TEST_DATA')
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

