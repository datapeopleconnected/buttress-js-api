# rhizome-api-js
### version: 1.0.0-3
Node.js API for [Rhizome](https://github.com/coders-for-corbyn/rhizome).

## Installation
`npm install rhizome-js-api`

## Usage
First of all you need to initialise Rhizome with a valid App Token. App Tokens are created in Rhizome by the system administrator.
```javascript
const Rhizome = require('rhizome-api-js');
Rhizome.init({
  rhizomeUrl: 'http://rhizome.url' [DEFAULT: http://rhizome.codersforcorbyn.com],
  appToken: 'Get this from the Rhizome Admin' [REQUIRED]
});
```
Once you have initialised Rhizome you can use it as follows:

## User Auth
This creates a Rhizome user based on OAuth2 user flow authentication leading to a token and tokenSecret. In addition to the basic information Rhizome stores these properties:
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
  
Rhizome.Auth.findOrCreateUser(user)
  .then(rhizomeUser => cb(null, rhizomeUser))
  .catch(Logging.Promise.logError());
```
User data is shared across all Rhizome applications based on trusted OAuth application Ids.

## User Metadata
User metadata is silo'ed on a per application basis. Specify the default value for when there is no metadata in the database.
```javascript
Rhizome.User.loadMetadata(userRhizomeId, 'KEY_NAME', [])
  .then(data => Logging.log(data))
  .catch(err => Logging.log(err));
```
```
Rhizome.User.saveMetadata(userRhizomeId, 'KEY_NAME', {foo:true, bar:false})
  .then(data => Logging.log(data))
  .catch(err => Logging.log(err));
```

## User
```javascript
Rhizome.User.load(rhizomeUserId)
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
Rhizome.App.loadMetadata('KEY_NAME', [])
  .then(data => Logging.log(data))
  .catch(err => Logging.log(err));
```
```
Rhizome.User.saveMetadata('KEY_NAME', {foo:true, bar:false})
  .then(data => Logging.log(data))
  .catch(err => Logging.log(err));
```

