const jsonServer = require( 'json-server' );
const server = jsonServer.create();
const router = jsonServer.router( './db.json' );
const middlewares = jsonServer.defaults();

server.use( middlewares );
server.use( router );
server.listen( 9993, () => {
  console.log( 'JSON Server is running' );
});

router.render = (req, res) => {
  // add count meta to paginated requests
  if ( req.method === 'GET' && req.originalUrl.indexOf( '_page' ) > -1) {
    res.json({
      data: res.locals.data,
      total: res.get( 'X-Total-Count' ),
    });
  } else {
    res.json( res.locals.data );
  }
};