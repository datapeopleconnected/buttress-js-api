"use strict";

/**
 * Buttress API -
 *
 * @file person.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const path = require('path');
const Buttress = require('../lib/buttressjs');
const Config = require('./config');

Config.init();

describe('@campaign-basics', function() {
  this.timeout(2000);
  let _companies = [];

  before(function(done) {
    Config.createCompanies().then(companies => {
      _companies = companies;
    }).then(done);
  });

  after(function(done) {
    let ids = _companies.map(c => c.id);
    Buttress.Company.bulkRemove(ids).then(() => done()).catch(done);
  });

  describe('Basics', function() {
    let _campaign = null;
    it('should return no campaigns', function(done) {
      Buttress.Campaign
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
      Buttress.Campaign
        .create({
          name: "test",
          type: Buttress.Campaign.Type.EMAIL,
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
      Buttress.Campaign
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
      Buttress.Campaign
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

describe('@campaign-notes', function() {
  let _campaign = null;
  let _companies = [];
  let _user = null;

  before(function(done) {
    Config.createUser().then(user => {
      _user = user;
    })
      .then(Config.createCompanies)
      .then(function(companies) {
        _companies = companies;
        Buttress.Campaign
          .create({
            name: "test",
            type: Buttress.Campaign.Type.EMAIL,
            description: "Test campaign for testing.",
            legals: "Copyright Coders for Labour",
            filters: [{type: 'location', value: 'Leeds'}],
            companies: [_companies[0].id]
          })
          .then(function(campaign) {
            _campaign = campaign;
            done();
          });
      }).catch(done);
  });

  after(function(done) {
    let campaigns = [
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id),
      Buttress.Campaign.remove(_campaign.id)
    ];

    Promise.all(campaigns).then(() => done()).catch(done);
  });

  describe('Notes', function() {
    it('should add a note', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Buttress.Campaign.update(_campaign.id, {
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
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Buttress.Campaign.update(_campaign.id, {
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
    it('should return the campaign with 2 notes', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }

      Buttress.Campaign
        .load(_campaign.id)
        .then(function(campaign) {
          campaign.notes.should.have.length(2);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should remove a note', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Buttress.Campaign.update(_campaign.id, {
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
    it('should return the campaign with 1 notes', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }

      Buttress.Campaign
        .load(_campaign.id)
        .then(function(campaign) {
          campaign.notes.should.have.length(1);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
    it('should update the text of a note', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }

      Buttress.Campaign
        .update(_campaign.id, {
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
    it('should return the campaign with an updated note', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }

      Buttress.Campaign
        .load(_campaign.id)
        .then(function(campaign) {
          campaign.notes.should.have.length(1);
          campaign.notes[0].text.should.equal('This is some updated text');
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
    Config.createUser().then(user => {
      _user = user;
    })
    .then(Config.createCompanies)
    .then(function(companies) {
      _companies = companies;
      Buttress.Campaign
      .create({
        name: "test",
        type: Buttress.Campaign.Type.PHONE,
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
      Buttress.Campaign.remove(_campaign.id),
      Buttress.Company.bulkRemove(_companies.map(c => c.id)),
      Buttress.User.remove(_user.id),
      Buttress.Person.remove(_user.person.id)
    ];

    Promise.all(tasks).then(() => done()).catch(done);
  });

  describe('Contactlists', function() {
    it('should get 5 companies', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Buttress.Campaign
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
      Buttress.Contactlist
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
      Buttress.Contactlist
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
      Buttress.Contactlist
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
      Buttress.Campaign
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
    Config.createCompanies().then(function(companies) {
      _companies = companies;
      Buttress.Campaign
        .create({
          name: "test",
          type: Buttress.Campaign.Type.PHONE,
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

    Buttress.Campaign
      .remove(_campaign.id)
      .then(function() {
        _campaign = null;
        let ids = _companies.map(c => c.id);
        Buttress.Company.bulkRemove(ids).then(() => done()).catch(done);
      })
      .catch(done);
  });

  describe('Metadata', function() {
    it('should get default metadata', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Buttress.Campaign.Metadata
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
      Buttress.Campaign.Metadata
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
      Buttress.Campaign.Metadata
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
      Buttress.Campaign.Metadata
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
      Buttress.Campaign.Metadata
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
      Buttress.Campaign.Metadata
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
    Config.createCompanies().then(function(companies) {
      _companies = companies;
      Buttress.Campaign
        .create({
          name: "test",
          type: Buttress.Campaign.Type.PHONE,
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
    Buttress.Campaign
      .remove(_campaign.id)
      .then(function() {
        _campaign = null;
        let ids = _companies.map(c => c.id);
        Buttress.Company.bulkRemove(ids).then(() => done()).catch(done);
      })
      .catch(done);
  });

  describe('Assets', function() {
    it('should add a template', function(done) {
      this.timeout(5000);
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Buttress.Campaign
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
      Buttress.Campaign
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
