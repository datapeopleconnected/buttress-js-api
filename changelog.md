### Latest: 2.3.0
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
- FIX: Replaced APIs using load/create -> get/save for consistency
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

### 1.5.15
- ADDED: API Support for location schema

### 1.5.14
- FIX: Schema API _checkOptions not being passed options

### 1.5.13
- TWEAK: Added Add/Update/Remove to generic schema api

### 1.5.12
- ADDED: support for bulk adding (campaigns, contact lists & appointments)

### 1.5.6
- TWEAK: Version bump to match buttress

### 1.5.1
- ADDED: new service Model & API
- ADDED: new schema API
- ADDED: bulk add for documents
- REFACTOR: Bulk delete api now uses POST and accepts id's via the post body
- FIXED, ADDED and IMPROVED tests throughout
- Various Fixes

### 1.0.0
Node.js API for [Buttress](https://github.com/wearelighten/buttress-js).