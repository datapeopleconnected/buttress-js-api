"use strict";

/**
 * Buttress API -
 *
 * @file service.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('../lib/buttressjs');
const Config = require('./config');
const ObjectId = require('mongodb').ObjectId;
const should = require('should');

Config.init();

describe('@service-basics', function() {
  this.timeout(2000);
  let _services = [];
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
      Buttress.Service.bulkRemove(_services),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Basics', function() {
    const _serviceId = (new ObjectId()).toHexString();
    let _service = null;
    it('should return no services', function(done) {
      Buttress.Service
        .getAll()
        .then(function(services) {
          services.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add a service', function(done) {
      Buttress.Service
        .save({
          id: _serviceId,
          ownerUserId: _user.id,
          companyId: _companies[0].id,
          name: 'Open Source',
          description: 'Open source development consultancy',
          serviceType: 'consultancy',
          appProp1: 'This is required!',
          appProp2: "1234",
          appProp3: new Date('2017-08-15'),
          appProp4: ['hello', 'to', 'me'],
          appProp5: 'pending',
          appProp6: {
            nested: {
              value: 'foobar',
              approverId: _user.id,
              approvals: [
                {
                  approverId: _user.id
                }
              ]
            },
            test: 'hello',
            companyId: _companies[1].id,
            date: new Date()
          },
          appProp7: [
            {
              name: 'name#1',
              isInteresting: false,
              invalidProp: 'hello!',
              nestedInteresting: {
                nestedBool: true
              }
            }
          ]
        })
        .then(function(service) {
          _service = service;
          _service.id.should.equal(_serviceId);
          _service.companyId.should.equal(_companies[0].id);
          _service.name.should.equal('Open Source');
          _service.description.should.equal('Open source development consultancy');
          _service.serviceType.should.equal('consultancy');
          _service.ownerUserId.should.equal(_user.id);
          _service.appProp1.should.equal('This is required!');
          _service.appProp2.should.equal(1234);
          _service.appProp3.should.equal('2017-08-15T00:00:00.000Z');
          _service.appProp4.length.should.equal(3);
          _service.appProp4[0].should.equal('hello');
          _service.appProp5.should.equal('pending');
          _service.appProp6.nested.value.should.equal('foobar');
          _service.appProp6.nested.status.should.equal('pending');
          _service.appProp6.nested.approverId.should.equal(_user.id);
          _service.appProp6.nested.value.should.equal('foobar');
          _service.appProp6.nested.approvals.length.should.equal(1);
          _service.appProp6.nested.approvals[0].approverId.should.equal(_user.id);
          _service.appProp6.nested.approvals[0].status.should.equal('pending');
          _service.appProp6.test.should.equal('hello');
          _service.appProp6.bool.should.equal(false);
          _service.appProp6.companyId.should.equal(_companies[1].id);
          _service.appProp7.length.should.equal(1);
          should.not.exist(_service.appProp7.invalidProp);
          _service.appProp7[0].nestedInteresting.nestedBool.should.equal(true);
          _service.appProp7[0].nestedInteresting.nestedString.should.equal('pending');
          done();
        })
        .catch(function(err) {
          done(new Error(err.message));
        });
    });
    it('should not add a service with invalid properties', function(done) {
      Buttress.Service
        .save({
          ownerUserId: _user.id,
          companyId: _companies[0].id,
          name: 'Open Source (Extended)',
          description: 'Open source development consultancy',
          serviceType: 'consultancy',
          appProp2: "This isn't a number"
        })
        .then(function(service) {
          done(new Error('Should not succeed'));
        })
        .catch(function(err) {
          err.statusCode.should.equal(400);
          done();
        });
    });
    it('should not add a service with missing required properties', function(done) {
      Buttress.Service
        .save({
          ownerUserId: _user.id,
          companyId: _companies[0].id,
          name: 'Open Source (Extended)',
          description: 'Open source development consultancy',
          serviceType: 'consultancy',
          appProp2: 123
        })
        .then(function(service) {
          done(new Error('Should not succeed'));
        })
        .catch(function(err) {
          err.statusCode.should.equal(400);
          done();
        });
    });
    it('should get a specific service', function(done) {
      Buttress.Service
        .load(_serviceId)
        .then(function(service) {
          _service = service;
          _service.id.should.equal(_serviceId);
          _service.companyId.should.equal(_companies[0].id);
          _service.name.should.equal('Open Source');
          _service.description.should.equal('Open source development consultancy');
          _service.serviceType.should.equal('consultancy');
          _service.ownerUserId.should.equal(_user.id);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update an app schema property', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }
      Buttress.Service.update(_service.id, [
        {
          path: 'appProp6.date',
          value: new Date('2017-07-31')
        },
        {
          path: 'appProp4.1',
          value: 'from'
        },
        {
          path: 'appProp7.0.name',
          value: 'name#2'
        },
        {
          path: 'appProp7.0.nestedInteresting.nestedBool',
          value: true
        },
        {
          path: 'appProp7',
          value: {
            name: 'name#inserted',
            isInteresting: false,
            invalidProp: 'hello!',
            nestedInteresting: {
              nestedBool: false
            }
          }
        },
        {
          path: 'appProp6.nested.approvals.0.status',
          value: 'approved'
        }
      ])
      .then(function(updates) {
        updates.length.should.equal(6);
        updates[0].type.should.equal('scalar');
        updates[0].path.should.equal('appProp6.date');
        updates[0].value.should.equal('2017-07-31T00:00:00.000Z');
        updates[1].type.should.equal('scalar');
        updates[1].path.should.equal('appProp4.1');
        updates[1].value.should.equal('from');
        updates[2].type.should.equal('scalar');
        updates[2].path.should.equal('appProp7.0.name');
        updates[2].value.should.equal('name#2');
        updates[3].type.should.equal('scalar');
        updates[3].path.should.equal('appProp7.0.nestedInteresting.nestedBool');
        updates[3].value.should.equal(true);
        updates[3].type.should.equal('scalar');
        updates[4].path.should.equal('appProp7');
        const updated = updates[4].value;
        updated.name.should.equal('name#inserted');
        updated.nestedInteresting.nestedString.should.equal('pending');
        updates[5].type.should.equal('scalar');
        updates[5].path.should.equal('appProp6.nested.approvals.0.status');
        updates[5].value.should.equal('approved');

        done();
      })
      .catch(function(err) {
        done(err);
      });
    });
    it('should not update an app schema property', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }
      Buttress.Service.update(_service.id, {
        path: 'appProp6.test',
        value: 'don\'t change this'
      })
      .then(function(updates) {
        done(new Error('Should not succeed'));
      })
      .catch(function(err) {
        err.statusCode.should.equal(400);
        done();
      });
    });

    it('should return 1 service', function(done) {
      Buttress.Service
        .getAll()
        .then(function(services) {
          services.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a service', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }
      Buttress.Service
        .remove(_service.id)
        .then(function(res) {
          res.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add several services', function(done) {
      const __gen = num => {
        let arr = [];
        for (let x = 0; x < num; x++) {
          arr.push({
            id: (new ObjectId()).toHexString(),
            ownerUserId: _user.id,
            companyId: _companies[0].id,
            name: `Open Source ${x + 1}`,
            description: 'Open source development consultancy',
            serviceType: 'consultancy',
            appProp1: 'Required app property'
          });
        }

        return arr;
      };

      Buttress.Service
        .saveAll({services: __gen(300)})
        .then(function(services) {
          services.length.should.equal(300);
          _services = services;
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

describe('@service-notes', function() {
  let _service = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    Config.createUser().then(user => {
      _user = user;
    })
      .then(Config.createCompanies)
      .then(function(companies) {
        _companies = companies;
        Buttress.Service
          .save({
            ownerUserId: _user.id,
            companyId: _companies[0].id,
            name: 'Open Source',
            description: 'Open source development consultancy',
            serviceType: 'consultancy',
            appProp1: 'Required app property'
          })
          .then(function(service) {
            _service = service;
            done();
          });
      }).catch(done);
  });

  after(function(done) {
    let tasks = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id),
      Buttress.Service.remove(_service.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Notes', function() {
    it('should add a note', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }
      Buttress.Service.update(_service.id, {
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
      if (!_service) {
        return done(new Error("No Service!"));
      }
      Buttress.Service.update(_service.id, {
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
    it('should return the service with 2 notes', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }

      Buttress.Service
        .load(_service.id)
        .then(function(service) {
          service.notes.should.have.length(2);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a note', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }
      Buttress.Service.update(_service.id, {
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
    it('should return the service with 1 notes', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }

      Buttress.Service
        .load(_service.id)
        .then(function(service) {
          service.notes.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update the text of a note', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }

      Buttress.Service
        .update(_service.id, {
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
    it('should return the service with an updated note', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }

      Buttress.Service
        .load(_service.id)
        .then(function(service) {
          service.notes.should.have.length(1);
          service.notes[0].text.should.equal('This is some updated text');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

describe('@service-metadata', function() {
  let _service = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    Config.createUser().then(user => {
      _user = user;
    })
      .then(Config.createCompanies)
      .then(function(companies) {
        _companies = companies;
        Buttress.Service
          .save({
            ownerUserId: _user.id,
            companyId: _companies[0].id,
            name: 'Open Source',
            description: 'Open source development consultancy',
            serviceType: 'consultancy',
            appProp1: 'Required app property'
          })
          .then(function(service) {
            _service = service;
            done();
          });
      }).catch(done);
  });

  after(function(done) {
    let tasks = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id),
      Buttress.Service.remove(_service.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Metadata', function() {
    it('should get default metadata', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }
      Buttress.Service.Metadata
        .load(_service.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add metadata', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }
      Buttress.Service.Metadata
        .save(_service.id, 'TEST_DATA', {foo: 'bar'})
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get metadata', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }
      Buttress.Service.Metadata
        .load(_service.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should delete metadata', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }
      Buttress.Service.Metadata
        .remove(_service.id, 'TEST_DATA')
        .then(function(metadata) {
          metadata.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get default metadata (post-deletion)', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }
      Buttress.Service.Metadata
        .load(_service.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should fail to delete metadata', function(done) {
      if (!_service) {
        return done(new Error("No Service!"));
      }
      Buttress.Service.Metadata
        .remove(_service.id, 'TEST_DATA')
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
