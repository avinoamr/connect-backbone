var attach = function( resource ) {
    return {
        to: function( cb ) {
            return resource
                .once( "sync", function() {
                    cb( null, this );
                }).once( "invalid", function( m, err ) {
                    cb( null, err.toString(), 400 );
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
        method( req, function( err, out, code ) {
            if ( !err && out && typeof out != "string" ) {
                try {
                    out = JSON.stringify( out )
                } catch ( e ) {
                    err = e;
                }
            }

            if ( err ) {
                code || ( code = 500 );
                console.error( err );
                res.writeHead( code )
            } else {
                code && res.writeHead( code );
                res.write( out );
            }
            res.end();

        });
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