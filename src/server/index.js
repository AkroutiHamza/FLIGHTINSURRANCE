
import http from 'http'
import app from './server'

/*const server = http.createServer(app)
let currentApp = app
server.listen(3000)

if (module.hot) {
    module.hot.accept('./server', () => {
        server.removeListener('request', currentApp)
        server.on('request', app)
        currentApp = app
    })
}*/

const server = app;
let currentApp = app.app;
server.app.listen(3000);
console.log("Server listening at http://localhost:3000");

if (module.hot) {
 module.hot.accept('./server', () => {
  server.removeListener('request', currentApp);
  server.on('request', app);
  currentApp = app;
 })
}
