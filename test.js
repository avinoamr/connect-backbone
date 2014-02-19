var assert = require( "assert" );
var backbone = require( "backbone" );

var db = {};
backbone.sync = require( "backsync" ).memory( db );

var connect = {};
connect.backbone = require( "./index" );

var Model = backbone.Model.extend({
    urlRoot: "/test",
});

var Collection = backbone.Collection.extend({
    model: Model,
    url: "/test"
});

describe( "connect-backbone", function() {

    beforeEach(function() {
        for ( var n in db ) {
            if ( db.hasOwnProperty( n ) ) {
                delete db[ n ];
            }
        }
    });

    it( "skips unknown methods", function( done ) {
        connect.backbone()({
            url: "", method: "hello"
        }, null, done )
    });


    it( "skips invalid uris", function( done ) {
        connect.backbone()({
            url: "/hello/world/", method: "GET"
        }, null, done );
    });


    it( "extends the request with the URI", function( done ) {
        var req = { url: "/okay/hello/", method: "GET" };
        connect.backbone()( req, null, function() {
            assert.equal( req.uri, "okay/hello" );
            done();
        } );
    });


    it( "creates a Model with POST", function( done ) {
        var out = "";
        connect.backbone( Model, Collection )(
            { url: "/", method: "POST", body: { hello: "world" } },
            {
                write: function( s ) { out += s.toString() },
                end: function() {
                    out = JSON.parse( out )
                    assert.equal( out.hello, "world" );
                    assert( out.id );
                    var doc = db[ Model.prototype.urlRoot ][ out.id ];
                    assert.deepEqual( doc, out );
                    done();
                }
            }
        );
    });


    it( "creates a Model with PUT", function( done ) {
        var out = "";
        connect.backbone( Model, Collection )(
            { url: "/cookie", method: "PUT", body: { hello: "world" } },
            {
                write: function( s ) { out += s.toString() },
                end: function() {
                    out = JSON.parse( out )
                    assert.equal( out.hello, "world" );
                    assert.equal( out.id, "cookie" );
                    var doc = db[ Model.prototype.urlRoot ][ out.id ];
                    assert.deepEqual( doc, out );
                    done();
                }
            }
        );
    });

    it( "fails to create an invalid Model", function( done ) {
        var InvalidModel = Model.extend({
            validate: function() {
                return "Invalid";
            }
        });
        connect.backbone( InvalidModel, Collection )(
            { url: "/cookie", method: "PUT", body: { hello: "world" } },
            {
                writeHead: function( code ) {
                    assert.equal( code, 400 ); // Bad Request
                    done();
                },
                write: function() {},
                end: function() {}
            }
        );
    })


    it( "updates a Model with PUT", function( done ) {
        new Model({ id: "cookie" }).save({ foo: "bar" }, {
            success: function() {
                var out = "";
                connect.backbone( Model, Collection )(
                    { url: "/cookie", method: "PUT", body: { hello: "world" } },
                    {
                        write: function( s ) { out += s.toString() },
                        end: function() {
                            out = JSON.parse( out )
                            assert.equal( out.hello, "world" );
                            assert.equal( out.id, "cookie" );
                            var doc = db[ Model.prototype.urlRoot ][ out.id ];
                            assert.deepEqual( doc, out );
                            assert( !out.foo ); // overridden
                            done();
                        }
                    }
                );
            }
        });
    });


    it( "extends a Model with PATCH", function( done ) {
        new Model({ id: "cookie" }).save({ foo: "bar" }, {
            success: function() {
                var out = "";
                connect.backbone( Model, Collection )(
                    { url: "/cookie", method: "PATCH", body: { hello: "world" } },
                    {
                        write: function( s ) { out += s.toString() },
                        end: function() {
                            out = JSON.parse( out )
                            assert.equal( out.hello, "world" );
                            assert.equal( out.foo, "bar" );
                            assert.equal( out.id, "cookie" );
                            var doc = db[ Model.prototype.urlRoot ][ out.id ];
                            assert.deepEqual( doc, out );
                            done();
                        }
                    }
                );
            }
        });
    });


    it( "deletes a Model with DELETE", function( done ) {
        new Model({ id: "cookie" }).save({ foo: "bar" }, {
            success: function() {
                var out = "";
                connect.backbone( Model, Collection )(
                    { url: "/cookie", method: "DELETE" },
                    {
                        write: function( s ) { out += s.toString() },
                        end: function() {
                            out = JSON.parse( out )
                            assert.equal( out.id, "cookie" );
                            var doc = db[ Model.prototype.urlRoot ][ out.id ];
                            assert( !doc );
                            done();
                        }
                    }
                );
            }
        });
    });


    it( "reads a Model with GET", function( done ) {
        new Model({ id: "cookie" }).save({ foo: "bar" }, {
            success: function() {
                var out = "";
                connect.backbone( Model, Collection )(
                    { url: "/cookie", method: "GET" },
                    {
                        write: function( s ) { out += s.toString() },
                        end: function() {
                            out = JSON.parse( out )
                            assert.equal( out.id, "cookie" );
                            assert.equal( out.foo, "bar" );
                            var doc = db[ Model.prototype.urlRoot ][ out.id ];
                            assert.deepEqual( doc, out );
                            done();
                        }
                    }
                );
            }
        });
    });

    it( "404 when a Model is not found with GET", function( done ) {
        var out = "";
        connect.backbone( Model, Collection )(
            { url: "/cookie", method: "GET" },
            {
                writeHead: function( code, reason ) {
                    assert.equal( code, 404 );
                    done()
                },
                write: function() {},
                end: function() {}
            }
        );
    });


    it( "searches a Collection with GET", function( done ) {
        new Model({ id: "cookie" }).save({ foo: "bar" }, {
            success: function() {
                var out = "";
                connect.backbone( Model, Collection )(
                    { url: "/", method: "GET" },
                    {
                        write: function( s ) { out += s.toString() },
                        end: function() {
                            out = JSON.parse( out )
                            assert.equal( out.length, 1 );
                            out = out[ 0 ];
                            assert.equal( out.foo, "bar" );
                            var doc = db[ Model.prototype.urlRoot ][ out.id ];
                            assert.deepEqual( doc, out );
                            done();
                        }
                    }
                );
            }
        });
    });


});