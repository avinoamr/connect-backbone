var url = require( "url" );
module.exports = function ( Collection ) {
    return function( req, res, next ) {
        var path, id, model, collection = new Collection();

        // extract the resource ID from the url
        path = req.path || req.url.split( /\?|\&/ )[ 0 ]; // strip query-string
        path = path.replace( /^\/|\/$/g, "" ); // strip wrapping slashes
        id = path.split( "/" )[ 0 ]; // just take the first part

        if ( id ) {
            model = new collection.model({ id: id })
        } else {
            model = new collection.model();
        }

        var on_error = function( m, err, options ) {
            if ( !options.res ) return;
            var _res = ( options.res === true ) ? res : options.res;
            res.writeHead( 500, "Internal Server Error" );
            res.write( "Internal Server Error" );
            res.end()
        };

        var on_invalid = function( m, err, options ) {
            if ( !options.res ) return;
            var _res = ( options.res === true ) ? res : options.res;
            res.writeHead( 400, "Bad Request" );
            res.write( err.toString() );
            res.end()
        };

        var on_success = function( m, r, options ) {
            if ( !options.res ) return;
            var _res = ( options.res === true ) ? res : options.res;
            res.write( JSON.stringify( m ) );
            res.end()
        }
        
        req.collection = collection.on( "error", on_error )
            .on( "invalid", on_invalid )
            .on( "sync", on_success );

        req.model = model.on( "error", on_error )
            .on( "invalid", on_invalid )
            .on( "sync", on_success );

        next()
    }
};