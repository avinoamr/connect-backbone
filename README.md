connect-backbone
================

A middleware for creating RESTful APIs in Connect and Express applications that uses Backbone Models

# Usage

```javascript
var connect = require("connect");
var backbone = require("backbone");
var MyModel = backbone.Model.extend({ ... });
var MyCollection = backbone.Collection.extend({});

connect()
    .use( "/my", require("connect-backbone")( MyModel, MyCollection ) )
    .listen( 8000 );
```