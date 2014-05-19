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
            if ( [ "NotFoundError", "NotFound" ].indexOf( err.name ) == -1 ) {
                _res.writeHead( 500, "Internal Server Error" );
                _res.write( "Internal Server Error" );
            } else {
                _res.writeHead( 404, "Not Found" );
                _res.write( "Not Found" );
            }
            
            _res.end()
        };

        var on_invalid = function( m, err, options ) {
            if ( !options.res ) return;
            var _res = ( options.res === true ) ? res : options.res;
            _res.writeHead( 400, "Bad Request" );
            _res.write( err.toString() );
            _res.end()
        };

        var on_success = function( m, r, options ) {
            if ( !options.res ) return;
            var _res = ( options.res === true ) ? res : options.res;
            _res.write( JSON.stringify( m ) );
            _res.end()
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