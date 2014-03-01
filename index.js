var url = require( "url" );

// IMPORTANT NOTE: This method will give the client unrestricted ability to
// modify the data and query the database - take steps to apply the relevant
// restrictions prior to using this middleware.
module.exports = function ( Collection ) {
    var map = null;
    var is_rest = false;

    // it's advised to use the `connect-callback` package as it supports a wide
    // variety of RESTful error codes and responses
    var callback = function( res, err, out ) {
        if ( map && out ) {
            if ( out.models ) out.models = out.models.map( map );
            else if ( out.attributes ) out = map( out );
        }
        if ( res.callback ) { return res.callback( err, out ); }
        if ( err ) {
            res.writeHead( 500, "Internal Server Error" );
        }
        if ( out ) {
            if ( typeof out != "string" ) {
                out = JSON.stringify( out );
            }
            res.write( out );
        }
        res.end()
    };

    // middleware to extend the request object with a model or collection
    var middleware = function( req, res, next ) {

        // extract the resource ID from the url
        var id = url.parse( req.url ).pathname.replace( /^\/|\/$/g, "" )
                    .split( "/" )[ 0 ]; // just take the first part

        var collection = new Collection()
            .on( "destroy", ( m ) -> callback( req ) )
            .on( "error invalid", ( m, err ) -> callback( req, err ) )

        // create
        if ( !id && req.method == "POST" ) {
            req.model = collection.add( new collection.model() )
            return next()
        }

        var query = id ? { id: id } : req.query;
        collection.fetch({ data: query, success: function( c ) {
            if ( id ) {
                req.model = c.models[ 0 ] || c.add( new c.model( { id: id } ) );
            } else {
                req.collection = c;
            }
            if ( !is_rest ) return next();

            // restful response
            if ( req.model && [ "POST", "PUT", "PATCH" ].indexOf( req.method ) != -1 ) {
                req.model.save( req.body, {
                    success: function( m ) { callback( res, null, m ); }
                });
            } else if ( req.method == "GET" ) {
                callback( res, req.model || req.collection );
            } else if ( req.model && req.method == "DELETE" ) {
                req.model.destroy({
                    success: function( m ) { callback( res, null, m ); }
                })
            } else {
                callback( true, "Unknown request" );
            }

        });
    };

    // middleware to completely handle RESTful requests to modify these
    // resources.
    middleware.rest = function( fn ) {
        if ( fn ) map = fn;
        return middleware;
    };

    return middleware;
};