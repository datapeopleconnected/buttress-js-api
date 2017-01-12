"use strict";

/**
 * Rhizome API -
 *
 * @file person.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const path = require('path');
const Rhizome = require('../lib/rhizome');
const Config = require('./config');

Config.init();

/**
 * In all tests that make use of promises, you need to use .catch(err => done(err) pattern.
 * Otherwise the promise consumes the assertion failure and you get a timeout instead of useful info.
 */

// after(function(done) {
//   Promise.all([
//     Rhizome.Campaign.removeAll()
//   ]).then(() => done());
// });

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

describe('@campaign-basics', function() {
  this.timeout(2000);
  let _companies = [];

  before(function(done) {
    __createCompanies().then(companies => {
      _companies = companies;
    }).then(done);
  });

  after(function(done) {
    let ids = _companies.map(c => c.id);
    Rhizome.Company.bulkRemove(ids).then(() => done()).catch(done);
  });

  describe('Basics', function() {
    let _campaign = null;
    it('should return no campaigns', function(done) {
      Rhizome.Campaign
        .getAll()
        .then(function(campaigns) {
          campaigns.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add a campaign', function(done) {
      Rhizome.Campaign
        .create({
          name: "test",
          type: Rhizome.Campaign.Type.EMAIL,
          description: "Test campaign for testing.",
          legals: "Copyright Coders for Labour",
          filters: [{type: 'location', value: 'Leeds'}],
          companies: [_companies[0].id]
        })
        .then(function(campaign) {
          _campaign = campaign;
          campaign.name.should.equal('test');
          campaign.description.should.equal('Test campaign for testing.');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should return 1 campaign', function(done) {
      Rhizome.Campaign
        .getAll()
        .then(function(campaigns) {
          campaigns.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should remove a campaign', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Rhizome.Campaign
        .remove(_campaign.id)
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

describe('@campaign-contactlists', function() {
  let _campaign = null;
  let _companies = [];
  let _user = null;
  let _contactListId = '';

  before(function(done) {
    __createUser().then(user => {
      _user = user;
    })
    .then(__createCompanies)
    .then(function(companies) {
      _companies = companies;
      Rhizome.Campaign
      .create({
        name: "test",
        type: Rhizome.Campaign.Type.PHONE,
        description: "Test campaign for testing.",
        legals: "Copyright Coders for Labour",
        filters: [{type: 'location', value: 'Leeds'}],
        companies: _companies.map(c => c.id)
      })
      .then(function(campaign) {
        _campaign = campaign;
        done();
      });
    }).catch(done);
  });

  after(function(done) {
    if (!_campaign) {
      return done(new Error("No Campaign!"));
    }

    let tasks = [
      Rhizome.Campaign.remove(_campaign.id),
      Rhizome.Company.bulkRemove(_companies.map(c => c.id)),
      Rhizome.User.remove(_user.id),
      Rhizome.Person.remove(_user.person.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Contactlists', function() {
    it('should get 5 companies', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Rhizome.Campaign
        .load(_campaign.id)
        .then(function(campaign) {
          campaign.companies.length.should.equal(5);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should create a contact list', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Rhizome.Contactlist
        .create({
          campaignId: _campaign.id,
          name: 'test list',
          companyIds: _campaign.companies,
          userId: _user.id
        })
        .then(function(contactList) {
          contactList.name.should.equal('test list');
          _contactListId = contactList.id;
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should get all contact lists', function(done) {
      Rhizome.Contactlist
        .getAll()
        .then(function(contactLists) {
          contactLists.length.should.equal(1);
          // contactList.name.should.equal('test list');
          // contactList.companyIds.length.should.equal(5);
          // contactList.userId.should.equal(_user.id);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should get a contact list', function(done) {
      Rhizome.Contactlist
        .load(_contactListId)
        .then(function(contactList) {
          contactList.name.should.equal('test list');
          contactList.campaignId.should.equal(_campaign.id);
          contactList.companyIds.length.should.equal(5);
          contactList.userId.should.equal(_user.id);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should remove a contact list', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Rhizome.Campaign
        .removeContactList(_campaign.id, _contactListId)
        .then(function(success) {
          success.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

describe('@campaign-metadata', function() {
  let _campaign = null;
  let _companies = [];
  before(function(done) {
    __createCompanies().then(function(companies) {
      _companies = companies;
      Rhizome.Campaign
        .create({
          name: "test",
          type: Rhizome.Campaign.Type.PHONE,
          description: "Test campaign for testing.",
          legals: "Copyright Coders for Labour",
          filters: [{type: 'location', value: 'Leeds'}],
          companies: _companies.map(c => c.id)
        })
        .then(function(campaign) {
          _campaign = campaign;
          done();
        });
    }).catch(done);
  });

  after(function(done) {
    if (!_campaign) {
      return done(new Error("No Campaign!"));
    }

    Rhizome.Campaign
      .remove(_campaign.id)
      .then(function() {
        _campaign = null;
        let ids = _companies.map(c => c.id);
        Rhizome.Company.bulkRemove(ids).then(() => done()).catch(done);
      })
      .catch(done);
  });

  describe('Metadata', function() {
    it('should get default metadata', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Rhizome.Campaign.Metadata
        .load(_campaign.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add metadata', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Rhizome.Campaign.Metadata
        .save(_campaign.id, 'TEST_DATA', {foo: 'bar'})
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get metadata', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Rhizome.Campaign.Metadata
        .load(_campaign.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.foo.should.equal('bar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should delete metadata', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Rhizome.Campaign.Metadata
        .remove(_campaign.id, 'TEST_DATA')
        .then(function(metadata) {
          metadata.should.equal(true);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should get default metadata (post-deletion)', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Rhizome.Campaign.Metadata
        .load(_campaign.id, 'TEST_DATA', false)
        .then(function(metadata) {
          metadata.should.equal(false);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should fail to delete metadata', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Rhizome.Campaign.Metadata
        .remove(_campaign.id, 'TEST_DATA')
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

describe('@campaign-assets', function() {
  let _campaign = null;
  let _companies = null;
  before(function(done) {
    __createCompanies().then(function(companies) {
      _companies = companies;
      Rhizome.Campaign
        .create({
          name: "test",
          type: Rhizome.Campaign.Type.PHONE,
          description: "Test campaign for testing.",
          legals: "Copyright Coders for Labour",
          filters: [{type: 'location', value: 'Leeds'}],
          companies: _companies.map(c => c.id)
        })
        .then(function(campaign) {
          _campaign = campaign;
          done();
        });
    }).catch(done);
  });

  after(function(done) {
    Rhizome.Campaign
      .remove(_campaign.id)
      .then(function() {
        _campaign = null;
        let ids = _companies.map(c => c.id);
        Rhizome.Company.bulkRemove(ids).then(() => done()).catch(done);
      })
      .catch(done);
  });

  describe('Assets', function() {
    it('should add a template', function(done) {
      this.timeout(5000);
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Rhizome.Campaign
        .addEmailTemplate(_campaign.id, {
          label: 'welcome-email',
          templatePathName: path.join(__dirname, 'assets/welcome-email.pug')
        })
        .then(function(res) {
          res.label.should.equal('welcome-email');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should add an image', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Rhizome.Campaign
        .addImage(_campaign.id, {
          label: 'avatar',
          imagePathName: path.join(__dirname, 'assets/avatar.png'),
          format: 'png'
        })
        .then(function(res) {
          res.label.should.equal('avatar');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
