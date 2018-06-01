# buttress-api-js
### version: 1.5.11
- Added support for bulk adding (campaigns, contact lists & appointments)

### version: 1.5.6
- Version bump to match buttress.

### version: 1.5.1
- Added new service Model & API
- Added new schema API
- Added bulk add for documents
- Refactor Bulk delete api now uses POST and accepts id's via the post body
- Fixed, Added and Improved tests throughout
- Various Fixes

### 1.0.0
Node.js API for [Buttress](https://github.com/wearelighten/buttress-js).

## Installation
`npm install buttress-js-api`

## Usage
First of all you need to initialise Buttress with a valid App Token. App Tokens are created in Buttress by the system administrator.
```javascript
const Buttress = require('buttress-js-api');
Buttress.init({
  buttressUrl: 'http://buttress.url',
  appToken: 'Get this from the Buttress Admin' [REQUIRED]
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

