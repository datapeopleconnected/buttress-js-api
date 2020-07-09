# buttress-api-js
### Latest: 2.3.2
- ADDED: Allow user to pass allowUnauthorized to bypass invalid cert
### 2.3.1
- FIX: incorrect dependency name Helper -> Helpers
### 2.3.0
- REFACTOR: Removed restler and replaced with axios
- TWEAK: Testing, added bulk companies save
- REFACTOR: Bulk save with return the newly added objects
- REFACTOR: getCollection should reference collection
- ADDED: Block user from calling getCollection before init
### 2.2.1
- FIX: Update outdated npm packages
### 2.2.0
- ADDED: Schema method for creating a object with default values
- ADDED: Helpers for schema handling (flattern, inflate)
- ADDED: data type 'id' now has default 'new' which will generate a new id
### 2.1.4
- FIX: Update package.json engine 'node' version
### 2.1.3
- FIX: Token not passed through from default options to get request
### 2.1.2
- FIX: Removed APIs using load/create -> get/save
### 2.1.1
- ADDED: API under Auth for creating new tokens for a user
### 2.1.0
- ADDED: Apps API's are now prefixed with there own name
### 2.0.1
- ADDED: API for updating a token role
### 2.0.0 :tada:
- ADDED: API support for custom schema. (Core schema are now stripped down).
- ADDED: Ability to pass app roles object to buttress
- REFACTOR: Breaking data changes to all core API's (app, auth, user, token).

**For the v1 change list please see ./changelog.md**

## Installation
`npm install buttress-js-api`

## Usage
First of all you need to initialise Buttress with a valid App Token. App Tokens are created in Buttress by the system administrator.
```javascript
const Buttress = require('buttress-js-api');
Buttress.init({
  buttressUrl: 'http://buttress.url',
  apiPath: 'my-app',
  appToken: 'Get this from the Buttress Admin',
  version: 1
});
```
Once you have initialised Buttress you can use it as follows:

## User Auth
This creates a Buttress user based on OAuth2 user flow authentication leading to a token and tokenSecret. In addition to the basic information Buttress stores these properties:
```javascript
var user = {
  app: 'twitter',
  id: profile.id,
  token: token,
  tokenSecret: tokenSecret,
  name: profile._json.name,
  username: profile.username,
  profileUrl: `https://twitter.com/${profile.username}`,
  profileImgUrl: profile._json.profile_image_url,
  bannerImgUrl: profile._json.profile_banner_url
};
  
Buttress.Auth.findOrCreateUser(user)
  .then(buttressUser => cb(null, buttressUser))
  .catch(Logging.Promise.logError());
```
User data is shared across all Buttress applications based on trusted OAuth application Ids.

## User Metadata
User metadata is silo'ed on a per application basis. Specify the default value for when there is no metadata in the database.
```javascript
buttress.User.loadMetadata(userButtressId, 'KEY_NAME', [])
  .then(data => Logging.log(data))
  .catch(err => Logging.log(err));
```
```
Buttress.User.saveMetadata(userbuttressId, 'KEY_NAME', {foo:true, bar:false})
  .then(data => Logging.log(data))
  .catch(err => Logging.log(err));
```

## User
```javascript
Buttress.User.get(buttressUserId)
  .then(u => {
    var twauth = u.auth.find(a => a.app === 'twitter');
    if (!twauth) {
      return;
    }
    // Do something useful with the user twauth.token && twauth.tokenSecret
```
## App Metadata
Applications have metadata (specify the default value for when there is no metadata in the database):
```javascript
Buttress.App.loadMetadata('KEY_NAME', [])
  .then(data => Logging.log(data))
  .catch(err => Logging.log(err));
```
```
Buttress.User.saveMetadata('KEY_NAME', {foo:true, bar:false})
  .then(data => Logging.log(data))
  .catch(err => Logging.log(err));
```

