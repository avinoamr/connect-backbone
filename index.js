var url = require( "url" );
module.exports = function ( Collection ) {
    return function( req, res, next ) {

        // extract the resource ID from the url
        var path = req.path || req.url.split( /\?|\&/ )[ 0 ]; // strip query-string
        path = path.replace( /^\/|\/$/g, "" ).split( "/" ); // strip wrapping slashes
        var id = path[ 0 ]; // just take the first part
        var collection = new Collection();

        if ( !id && req.method == "POST" ) {
            req.model = new collection.model()
        } else if ( id ) {
            req.model = new collection.model( { id: id } );
        } else {
            req.collection = collection
        }
        next()
    }
};