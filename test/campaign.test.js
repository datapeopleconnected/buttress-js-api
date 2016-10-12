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

/**
 * In all tests that make use of promises, you need to use .catch(err => done(err) pattern.
 * Otherwise the promise consumes the assertion failure and you get a timeout instead of useful info.
 */

after(function(done) {
  Rhizome.Campaign
    .removeAll()
    .then(function() {
      done();
    });
});

describe('@model', function() {
  before(function() {
  });

  describe('Campaign Basics', function() {
    var _campaign = null;
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
          description: "Test campaign for testing.",
          legals: "Copyright Coders for Labour"
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

describe('@model', function() {
  var _campaign = null;
  before(function(done) {
    Rhizome.Campaign
      .create({
        name: "test",
        description: "Test campaign for testing.",
        legals: "Copyright Coders for Labour"
      })
      .then(function(campaign) {
        _campaign = campaign;
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  after(function(done) {
    Rhizome.Campaign
      .remove(_campaign.id)
      .then(function() {
        _campaign = null;
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  describe('Campaign Metadata', function() {
    it('should get default metadata', function(done) {
      if (!_campaign) {
        return done(new Error("No Campaign!"));
      }
      Rhizome.Campaign
        .loadMetadata(_campaign.id, 'TEST_DATA', false)
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
      Rhizome.Campaign
        .saveMetadata(_campaign.id, 'TEST_DATA', {foo: 'bar'})
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
      Rhizome.Campaign
        .loadMetadata(_campaign.id, 'TEST_DATA', false)
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
      Rhizome.Campaign
        .removeMetadata(_campaign.id, 'TEST_DATA')
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
      Rhizome.Campaign
        .loadMetadata(_campaign.id, 'TEST_DATA', false)
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
      Rhizome.Campaign
        .removeMetadata(_campaign.id, 'TEST_DATA')
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

describe('@model', function() {
  var _campaign = null;
  before(function(done) {
    Rhizome.Campaign
      .create({
        name: "test",
        description: "Test campaign for testing.",
        legals: "Copyright Coders for Labour"
      })
      .then(function(campaign) {
        _campaign = campaign;
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  after(function(done) {
    Rhizome.Campaign
      .remove(_campaign.id)
      .then(function() {
        _campaign = null;
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  describe('Campaign Assets', function() {
    it('should add a template', function(done) {
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
