var attach = function( resource ) {
    return {
        to: function( cb ) {
            return resource
                .once( "sync", function() {
                    cb( null, this );
                }).once( "invalid error", function( m, err ) {
                    cb( err );
                }).once( "error", function( m, err ) {
                    if ( [ "NotFound", "NotFoundError" ].indexOf( err.name ) != -1 ) {
                        cb( null, err.toString(), 404 );
                    } else {
                        cb( err );
                    }
                });
        }
    };
};

var uri = function( url ) {
    return url.replace( /^\/|\/$/g, "" );
};

module.exports = function( Model, Collection ) {
    var fn = function( req, res, next ) {
        req.uri = uri( req.url );
        if ( req.uri.indexOf( "/" ) != -1 ) return next(); // not a valid id
        var method = {
            "POST": fn.update,
            "PUT": fn.update,
            "GET": ( req.uri ) ? fn.read: fn.search,
            "DELETE": fn.delete,
            "PATCH": fn.patch,
        }[ req.method ];

        if ( !method ) return next();
        method( req, module.exports.to_res( res ) );
    };

    fn.update = function( req, cb ) {
        var spec = ( req.uri ) ? { id: req.uri } : null;
        attach( new Model( spec ) ).to( cb ).save( req.body );
    };

    fn.read = function( req, cb ) {
        attach( new Model( { id: req.uri } ) ).to( cb ).fetch();
    };

    fn.delete = function( req, cb ) {
        attach( new Model( { id: req.uri } ) ).to( cb ).destroy();
    };

    fn.search = function( req, cb ) {
        attach( new Collection() ).to( cb ).fetch( { data: req.query } );
    };

    fn.patch = function( req, cb ) {
        attach( new Model({ id: req.uri }) ).to( cb ).save( req.body, { patch: true } );
    };

    return fn;
};

module.exports.to_res = function( res ) {
    return function ( err, out ) {
        var code;
        if ( !err && out && typeof out != "string" ) {
            try {
                out = JSON.stringify( out )
            } catch ( e ) {
                code = 500;
                out = null;
            }
        } else if ( err ) {
            if ( typeof err == "string" ) {
                err = new Error( err );
                err.name = "Invalid"
            }

            out = err.toString();
            if ( [ "NotFound", "NotFoundError" ].indexOf( err.name ) != -1 ) {
                code = 404;
            } else if ( [ "ValidationError", "Invalid" ].indexOf( err.name ) != -1 ) {
                code = 400;
            } else {
                code = 500;
                out = null;
            }
        }

        code && res.writeHead( code );
        out && res.write( out );
        res.end();
    }
};