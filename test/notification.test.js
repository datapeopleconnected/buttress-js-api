"use strict";

/**
 * Rhizome API -
 *
 * @file notification.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Rhizome = require('../lib/rhizome');
const Config = require('./config');
require('sugar');

Config.init();

describe('@notification-basics', function() {
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
    let notifications = [
      Rhizome.Company.bulkRemove(_companies.map(c => c.id)),
      Rhizome.User.remove(_user.id),
      Rhizome.Person.remove(_user.person.id)
    ];

    Promise.all(notifications).then(() => done()).catch(done);
  });

  describe('Basics', function() {
    let _notification = null;
    it('should return no notifications', function(done) {
      Rhizome.Notification
        .getAll()
        .then(function(notifications) {
          notifications.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add a Free notification', function(done) {
      Rhizome.Notification
        .create({
          userId: _user.id,
          name: 'Important notification!',
          type: Rhizome.Notification.Type.CHAT
        })
        .then(function(notification) {
          _notification = notification;
          _notification.userId.should.equal(_user.id);
          _notification.name.should.equal('Important notification!');
          _notification.type.should.equal(Rhizome.Notification.Type.CHAT);
          _notification.type.should.equal('chat');
          _notification.read.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return 1 notification', function(done) {
      Rhizome.Notification
        .getAll()
        .then(function(notifications) {
          notifications.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update a notification', function(done) {
      Rhizome.Notification
        .update(_notification.id, {
          path: 'read',
          value: true
        })
        .then(function(res) {
          res.length.should.equal(1);
          res[0].type.should.equal('scalar');
          res[0].path.should.equal('read');
          res[0].value.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should fail to update a notification', function(done) {
      Rhizome.Notification
        .update(_notification.id, {
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
    it('notification.read should be true', function(done) {
      Rhizome.Notification
        .load(_notification.id)
        .then(function(notification) {
          notification.read.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a notification', function(done) {
      if (!_notification) {
        return done(new Error("No Notification!"));
      }
      Rhizome.Notification
        .remove(_notification.id)
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
