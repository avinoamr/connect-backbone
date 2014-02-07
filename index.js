module.exports = function( Collection ) {
    var Model = new Collection().model;

    var uri = function( uri ) {
        return uri.replace( /^\/|\/$/g, "" );
    };

    var post = function( req, res ) {
        if ( !uri( req.url ) ) {
            res.writeHead( 400 );
            return res.end();
        }

        new Collection()
            .create( req.body )
            .on( "sync", function() {
                res.end( JSON.stringify( this ) );
            });
    };

    var get = function( req, res ) {
        if ( req.url == "/" ) {
            new Collection()
                .on( "sync", function() {
                    res.end( JSON.stringify( this ) );
                } ).fetch({ data: req.query });
        } else {
            var m = new Model({ id: uri( req.url ) });
            new Collection().add( m );
            m.on( "sync", function() {
                res.end( JSON.stringify( this ) );
            }).fetch();
        }
    };

    var put = function( req, res ) {
        if ( req.url == "/" ) {
            return post( req, res ); // PUT can be used for creation as well
        }
        var m = new Model({ id: uri( req.url ) });
        new Collection().add( m );
        m.on( "sync", function() {
            res.end( JSON.stringify( this ) );
        }).save( req.body );
    };

    var remove = function( req, res ) {
        if ( req.url == "/" ) {
            return post( req, res ); // PUT can be used for creation as well
        }
        var m = new Model({ id: uri( req.url ) });
        new Collection().add( m );
        m.on( "sync", function() {
            res.end( JSON.stringify( this ) );
        }).destroy();
    };

    return function( req, res, next ) {
        return {
            "POST": post,
            "PUT": put,
            "GET": get,
            "DELETE": remove
        }[ req.method ]( req, res );
    }
};