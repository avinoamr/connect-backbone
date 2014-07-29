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

    // it( "skips unknown methods", function( done ) {
    //     var req = { url: "", method: "hello" };
    //     connect.backbone( Collection ).rest()( req, {}, function() {
    //         assert( req.collection instanceof Collection )
    //         done();
    //     } )
    // });


    it( "skips invalid uris", function ( done ) {
        var req = { url: "/hello/world/", method: "GET" };
        var res = { write: function() { assert.fail() } };
        connect.backbone( Collection )( req, res, function () {
            assert( req.model instanceof Collection.prototype.model );
            assert.equal( req.model.id, "hello" );
            done();
        })
    });


    it( "strips the query string", function ( done ) {
        var req = { url: "/okay/hello/?foo=bar", method: "GET" };
        connect.backbone( Collection )( req, {}, function() {
            assert.equal( req.model.id, "okay" );
            done();
        } );
    });


    it( "creates a Model with save", function ( done ) {
        var out = "";
        var req = { url: "/", method: "POST", body: { hello: "world" } };
        var res = {
            write: function( s ) { out += s.toString() },
            end: function() {
                out = JSON.parse( out )
                assert.equal( out.hello, "world" );
                assert( out.id );
                var doc = db[ Model.prototype.urlRoot ][ out.id ];
                assert.deepEqual( doc, out );
                done();
            }
        };

        connect.backbone( Collection )( req, res, function () {
            req.model.save( req.body, { res: true } )
        });
    });


    it( "updates a Model with save", function ( done ) {
        var out = "";
        var req = { url: "/cookie", method: "PUT", body: { hello: "world" } };
        var res = {
            write: function( s ) { out += s.toString() },
            end: function() {
                out = JSON.parse( out )
                assert.equal( out.hello, "world" );
                assert.equal( out.id, "cookie" );
                var doc = db[ Model.prototype.urlRoot ][ out.id ];
                assert.deepEqual( doc, out );
                done();
            }
        };
        connect.backbone( Collection )( req, res, function () {
            req.model.save( req.body, { res: true } );
        });
    });

    it( "fails to create an invalid Model", function( done ) {
        var InvalidModel = Model.extend({
            validate: function() {
                return "Invalid";
            }
        });
        var InvalidCollection = Collection.extend({
            model: InvalidModel
        });

        var req = { url: "/cookie", method: "PUT", body: { hello: "world" } };
        var res = {
            writeHead: function( code ) {
                assert.equal( code, 400 ); // Bad Request
                done();
            },
            write: function() {},
            end: function() {}
        };
        connect.backbone( InvalidCollection )( req, res, function () {
            req.model.save( req.body, { res: true } );
        });
    })

    it( "404 when a Model is not found", function( done ) {
        var out = "";
        var req = { url: "/cookie", method: "GET" }
        var res = {
            writeHead: function( code, reason ) {
                assert.equal( code, 404 );
                done()
            },
            write: function() {},
            end: function() {}
        };
        connect.backbone( Collection )( req, res, function () {
            req.model.fetch({ res: true })
        });
    });

});