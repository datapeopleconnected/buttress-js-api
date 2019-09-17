# buttress-api-js
### Latest: 2.0.1
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
Buttress.User.load(buttressUserId)
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

