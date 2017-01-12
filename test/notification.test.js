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

describe('@notification-basics', function() {
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
