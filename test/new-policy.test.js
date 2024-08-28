'use strict';

/**
 * Buttress API -
 *
 * @file advanced-policy.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('../lib/buttressjs');
const Config = require('./config');

Config.init();

const sleep = (time) => new Promise((r) => setTimeout(r, time));

const policies = require('./test_data/new-policy/policies.json');

const users = [{
  policyProperties: {
    role: 'DIRECTOR',
  },
  app: 'google',
  appId: '123',
  username: 'Director',
  token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
  email: 'user@wearelighten.co.uk',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
}];

const authentication = {
  domains: [Config.endpoint],
  role: 'public',
  permissions: [
    {route: '*', permission: '*'},
  ],
};

const companies = [{
  name: 'A company',
  industry: 'Construction',
}, {
  name: 'B company',
  industry: 'Health',
}, {
  name: 'C company',
  industry: 'Automotive',
}, {
  name: 'Apple',
  industry: 'Software',
}];

describe('@new-policy', function() {
  this.timeout(90000);

  const testPolicies = [];
  const testUsers = [];
  let testApp = null;

  const schemas = [{
    'name': 'company',
    'type': 'collection',
    'properties': {
      'name': {
        '__type': 'string',
        '__default': null,
        '__required': true,
        '__allowUpdate': true,
      },
      'industry': {
        '__type': 'string',
        '__default': null,
        '__required': true,
        '__allowUpdate': true,
      },
    },
  }, {
    "name": "invitation",
    "type": "collection",
    "extends": [
      "timestamps"
    ],
    "properties": {
      "status": {
        "__type": "string",
        "__default": "PENDING",
        "__enum": [
          "PENDING",
          "IN_PROGRESS",
          "ACCEPTED"
        ],
        "__required": true,
        "__allowUpdate": true
      },
      "type": {
        "__type": "string",
        "__default": "COMPANY",
        "__enum": [
          "COMPANY",
          "CONNECT_SUPPLIER"
        ],
        "__required": true,
        "__allowUpdate": true
      },
      "invitationToken": {
        "__type": "string",
        "__default": "randomString",
        "__required": true,
        "__allowUpdate": false
      },
      "inviter": {
        "email": {
          "__type": "string",
          "__default": null,
          "__required": true,
          "__allowUpdate": true
        },
        "companyId": {
          "__type": "id",
          "__default": null,
          "__required": true,
          "__allowUpdate": false
        }
      },
      "invitee": {
        "name": {
          "__type": "string",
          "__default": null,
          "__required": true,
          "__allowUpdate": true
        },
        "role": {
          "__type": "string",
          "__default": null,
          "__required": true,
          "__allowUpdate": true
        },
        "email": {
          "__type": "string",
          "__default": null,
          "__required": true,
          "__allowUpdate": true
        },
        "company": {
          "name": {
            "__type": "string",
            "__default": null,
            "__required": true,
            "__allowUpdate": true
          },
          "id": {
            "__type": "id",
            "__default": null,
            "__required": false,
            "__allowUpdate": false
          }
        },
        "isDirector": {
          "__type": "boolean",
          "__default": false,
          "__required": true,
          "__allowUpdate": true
        },
        "isTreasurer": {
          "__type": "boolean",
          "__default": false,
          "__required": true,
          "__allowUpdate": true
        }
      },
      "stageNumber": {
        "__type": "number",
        "__default": 0,
        "__required": true,
        "__allowUpdate": true
      },
      "expiryDate": {
        "__type": "date",
        "__default": null,
        "__required": true,
        "__allowUpdate": true
      }
    }
  }, {
    "name": "event",
    "type": "collection",
    "collection": "event",
    "extends": [
      "timestamps"
    ],
    "properties": {
      "id": {
        "__type": "id",
        "__default": "new",
        "__required": true,
        "__allowUpdate": false
      },
      "entityId": {
        "__type": "id",
        "__default": null,
        "__required": true,
        "__allowUpdate": false
      },
      "tag": {
        "__type": "string",
        "__default": "",
        "__required": false,
        "__allowUpdate": true
      },
      "type": {
        "__type": "string",
        "__required": true,
        "__allowUpdate": true,
        "__enum": [
          "NOTE",
          "CUSTOMER_NOTE",
          "STAFF_NOTE",
          "STATUS"
        ]
      },
      "text": {
        "__type": "string",
        "__default": "",
        "__required": true
      },
      "personId": {
        "__type": "id",
        "__default": null,
        "__allowUpdate": true
      },
      "oldCreationDate": {
        "__type": "date",
        "__default": null,
        "__required": true,
        "__allowUpdate": true
      },
      "metadata": {
        "__type": "array",
        "__allowUpdate": true,
        "__schema": {
          "key": {
            "__type": "string",
            "__default": null,
            "__required": true,
            "__allowUpdate": true
          },
          "value": {
            "__type": "string",
            "__default": null,
            "__required": true,
            "__allowUpdate": true
          }
        }
      }
    }
  }];

  before(async function() {
    Buttress.setAuthToken(Config.token);

    const existingApps = await Buttress.getCollection('app').getAll();
    testApp = existingApps.find((a) => a.name === 'Test App');
    if (!testApp) {
      testApp = await Buttress.getCollection('app').save({
        name: 'Test App',
        type: 'app',
        apiPath: 'test-app',
      });
    } else {
      // Fetch token and attach
      const tokens = await Buttress.getCollection('token').getAll();
      const appToken = tokens.find((t) => t.type === 'app' && t._appId === testApp.id);
      if (!appToken) throw new Error('Found app but unable to find app token');
      testApp.token = appToken.value;
    }

    Buttress.setAuthToken(testApp.token);
    Buttress.setAPIPath('test-app');

    await Buttress.setSchema(schemas);

    await sleep(1000);

    const policyList = [
      'DIRECTOR',
      'INVITER',
      'INVITEE',
      'FIRST_PROJECTED_INVITATION',
      'SECOND_PROJECTED_INVITATION',
      'THIRD_PROJECTED_INVITATION',
    ];
    await Buttress.getCollection('app').setPolicyPropertyList({role: policyList});

    for await (const company of companies) {
      await Buttress.getCollection('company').save(company);
    }

    // Create 100 invitations
    let count = 100;
    const invitations = [];
    while (count <= 100 && count > 0) {
      const inviterEmail = (count <= 100 && count >= 76) ? 'user@wearelighten.co.uk' : 'user@example.com';
      const inviteeEmail = (count <= 100 && count >= 76) ? 'user@example.com' : (count <= 75 && count >= 51) ? 'user@wearelighten.co.uk' : 'test@example.com';
      const inviteeName = (count <= 100 && count >= 76) ? 'userExample' : (count <= 75 && count >= 51) ? 'user' : 'test'
      invitations.push({
        "status" : "ACCEPTED",
        "type" : "COMPANY",
        "invitationToken" : "o0hAsswRZt9tR8ZUUMcFRlpBlppExt9gEx1B",
        "inviter" : {
            "email" : inviterEmail,
            "companyId" : "667ad582a038f1769c0540b3"
        },
        "invitee" : {
            "name" : inviteeName,
            "role" : "Tester",
            "email" : inviteeEmail,
            "company" : {
                "name" : "Invited Test Company",
                "id" : null
            },
            "isDirector" : true,
            "isTreasurer" : true
        },
        "stageNumber" : 6,
        "expiryDate" : "2025-06-25T14:34:42.161Z",
        "sourceId" : null,
      });
      count--;
    }
    await Buttress.getCollection('invitation').bulkSave(invitations);

    for await (const userObj of users) {
      authentication.policyProperties = userObj.policyProperties;
      const user = await Buttress.getCollection('auth').findOrCreateUser(userObj, authentication);
      testUsers.push(user);
    }
  });

  after(async function() {
    Buttress.setAuthToken(Config.token);

    for await (const policy of testPolicies) {
      await Buttress.getCollection('policy').remove(policy.id);
    }

    await Buttress.getCollection('user').removeAll();
    await Buttress.getCollection('invitation').removeAll();
    await Buttress.getCollection('company').removeAll();
    await Buttress.getCollection('token').removeAllUserTokens();
  });

  describe('Basic', function() {
    it('Should create policies on the app', async function() {
      for await (const policy of policies) {
        testPolicies.push(await Buttress.getCollection('policy').createPolicy(policy));
      }

      testPolicies.length.should.equal(8);
    });

    // it ('Using full access invitation policy returns all results', async function() {
    //   // update user policy proerty to change the user's policy
    //   const testUserToken = testUsers[0].tokens[0];
    //   Buttress.setAuthToken(testUserToken.value);

    //   const allInvitations = await Buttress.getCollection('invitation').search({});
    //   allInvitations.length.should.equal(100);

    //   const weAreLightenInviterInivtations = await Buttress.getCollection('invitation').search({"inviter.email":{"$eq":"user@wearelighten.co.uk"}});
    //   weAreLightenInviterInivtations.length.should.equal(25);

    //   const weAreLightenInviteeInivtations = await Buttress.getCollection('invitation').search({"invitee.email":{"$eq":"user@wearelighten.co.uk"}});
    //   weAreLightenInviteeInivtations.length.should.equal(25);

    //   const weAreLightenInvitations = await Buttress.getCollection('invitation').search({
    //     "$or": [{
    //       "inviter.email":{
    //         "$eq":"user@wearelighten.co.uk"
    //       },
    //     }, {
    //       "invitee.email":{
    //         "$eq":"user@wearelighten.co.uk"
    //       },
    //     }]
    //   });
    //   weAreLightenInvitations.length.should.equal(50);

    //   const invitations = await Buttress.getCollection('invitation').search({
    //     "inviter.email":{
    //       "$eq":"user@wearelighten.co.uk"
    //     },
    //     "invitee.email":{
    //       "$eq":"user@wearelighten.co.uk"
    //     }
    //   });
    //   invitations.length.should.equal(0);
    // });

    // it ('Update user policy selections to INVITER and INVITEE', async function() {
    //   // update user policy proerty to change the user's policy
    //   Buttress.setAuthToken(testApp.token);
    //   await Buttress.User.setPolicyProperty(testUsers[0].id, {
    //     role: ['inviter', 'invitee'],
    //   });
    //   Buttress.setAuthToken(testUsers[0].tokens[0].value);

    //   const allInvitations = await Buttress.getCollection('invitation').search({});
    //   allInvitations.length.should.equal(50);

    //   const weAreLightenInviterInivtations = await Buttress.getCollection('invitation').search({"inviter.email":{"$eq":"user@wearelighten.co.uk"}});
    //   weAreLightenInviterInivtations.length.should.equal(25);

    //   const weAreLightenInviteeInivtations = await Buttress.getCollection('invitation').search({"invitee.email":{"$eq":"user@wearelighten.co.uk"}});
    //   weAreLightenInviteeInivtations.length.should.equal(25);

    //   const weAreLightenInvitations = await Buttress.getCollection('invitation').search({
    //     "$or": [{
    //       "inviter.email":{
    //         "$eq":"user@wearelighten.co.uk"
    //       },
    //     }, {
    //       "invitee.email":{
    //         "$eq":"user@wearelighten.co.uk"
    //       },
    //     }]
    //   });
    //   // It only returns the invitations with inviter.email user@wearelighten.co.uk
    //   weAreLightenInvitations.length.should.equal(50);

    //   const invitations = await Buttress.getCollection('invitation').search({
    //     "inviter.email":{
    //       "$eq":"user@wearelighten.co.uk"
    //     },
    //     "invitee.email":{
    //       "$eq":"user@wearelighten.co.uk"
    //     }
    //   });
    //   invitations.length.should.equal(0);
    // });

    // it ('Update user policy selections to INVITER and FIRST_PROJECTED_INVITATION', async function() {
    //   // update user policy proerty to change the user's policy
    //   Buttress.setAuthToken(testApp.token);
    //   await Buttress.User.setPolicyProperty(testUsers[0].id, {
    //     role: ['INVITER', 'FIRST_PROJECTED_INVITATION'],
    //   });
    //   Buttress.setAuthToken(testUsers[0].tokens[0].value);

    //   const allInvitations = await Buttress.getCollection('invitation').search({});
    //   const invitationsTokens = allInvitations.map((invitation) => invitation.invitationToken).filter((v) => v);
    //   invitationsTokens.length.should.equal(50);
    //   const invitationStatuses = allInvitations.map((invitation) => invitation.status).filter((v) => v);
    //   invitationStatuses.length.should.equal(25);
    // });

    // it ('Update user policy selections to INVITER, INVITEE and FIRST_PROJECTED_INVITATION', async function() {
    //   // update user policy proerty to change the user's policy
    //   Buttress.setAuthToken(testApp.token);
    //   await Buttress.User.setPolicyProperty(testUsers[0].id, {
    //     role: ['INVITER', 'INVITEE', 'FIRST_PROJECTED_INVITATION'],
    //   });
    //   Buttress.setAuthToken(testUsers[0].tokens[0].value);

    //   const allInvitations = await Buttress.getCollection('invitation').search({});
    //   const invitationsTokens = allInvitations.map((invitation) => invitation.invitationToken).filter((v) => v);
    //   invitationsTokens.length.should.equal(50);
    //   const invitationStatuses = allInvitations.map((invitation) => invitation.status).filter((v) => v);
    //   invitationStatuses.length.should.equal(50);
    // });

    // it ('Update user policy selections to INVITER, INVITEE and FIRST_PROJECTED_INVITATION', async function() {
    //   // update user policy proerty to change the user's policy
    //   Buttress.setAuthToken(testApp.token);
    //   await Buttress.User.setPolicyProperty(testUsers[0].id, {
    //     role: ['INVITER', 'INVITEE', 'FIRST_PROJECTED_INVITATION'],
    //   });
    //   Buttress.setAuthToken(testUsers[0].tokens[0].value);

    //   const allInvitations = await Buttress.getCollection('invitation').search({});
    //   const invitationsTokens = allInvitations.map((invitation) => invitation.invitationToken).filter((v) => v);
    //   invitationsTokens.length.should.equal(50);
    //   const invitationStatuses = allInvitations.map((invitation) => invitation.status).filter((v) => v);
    //   invitationStatuses.length.should.equal(50);
    // });

    // it ('Update user policy selections to INVITER, INVITEE, FIRST_PROJECTED_INVITATION, SECOND_PROJECTED_INVITATION', async function() {
    //   // update user policy proerty to change the user's policy
    //   Buttress.setAuthToken(testApp.token);
    //   await Buttress.User.setPolicyProperty(testUsers[0].id, {
    //     role: ['INVITER', 'INVITEE', 'FIRST_PROJECTED_INVITATION', 'SECOND_PROJECTED_INVITATION'],
    //   });
    //   Buttress.setAuthToken(testUsers[0].tokens[0].value);

    //   const allInvitations = await Buttress.getCollection('invitation').search({});
    //   const invitationsTokens = allInvitations.map((invitation) => invitation.invitationToken).filter((v) => v);
    //   invitationsTokens.length.should.equal(50);
    //   const invitationStatuses = allInvitations.map((invitation) => invitation.status).filter((v) => v);
    //   invitationStatuses.length.should.equal(50);
    //   const invitationTypes = allInvitations.map((invitation) => invitation.type).filter((v) => v);
    //   invitationTypes.length.should.equal(100);
    // });

    it ('Update user policy selections to FIRST_PROJECTED_INVITATION and THIRD_PROJECTED_INVITATION', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);
      await Buttress.User.setPolicyProperty(testUsers[0].id, {
        role: ['FIRST_PROJECTED_INVITATION', 'THIRD_PROJECTED_INVITATION'],
      });
      Buttress.setAuthToken(testUsers[0].tokens[0].value);

      // TODO need to fix the merge the properties for the projection
      const allInvitations = await Buttress.getCollection('invitation').search({});
      const invitationsTokens = allInvitations.map((invitation) => invitation.invitationToken).filter((v) => v);
      invitationsTokens.length.should.equal(25);
      const invitationsType = allInvitations.map((invitation) => invitation.type).filter((v) => v);
      invitationsType.length.should.equal(25);
    });
  });
});