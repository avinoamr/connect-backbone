connect-backbone
================

A middleware for creating RESTful APIs in Connect and Express applications that uses Backbone Models

# Usage

```javascript
var connect = require("connect");
var backbone = require("backbone");
var connect_backbone = require("connect-backbone");

var MyModel = backbone.Model.extend({ ... });
var MyCollection = backbone.Collection.extend({
    model: MyModel
});

connect()
    .use( "/my", connect_backbone( MyCollection ) )
    .listen( 8000 );
```