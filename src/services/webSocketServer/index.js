const WSS = require('ws').Server;
const url = require('url');
const EventEmitter = require('events');
const { MessageType, Errors } = require('../../enums');
const Client = require('../../models/client');

let admin = require("firebase-admin");

//var serviceAccount = require("path/to/serviceAccountKey.json");
let serviceAccountJsonContents = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

admin.initializeApp({
  credential: admin.credential.cert({
  "type": "service_account",
  "project_id": "usnotifications",
  "private_key_id": "5c9894d80953f752a96bd20a75c3ce67bd53a026",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCNS3kUrkxVgjCC\nlnEOavgT0eONN4AqkK8H5oAbGmLviJ2O3KTagXyy3JrTYPxLKeOOo59yXkHS3m7b\nLuHFTm/lCs7SfbBi0uDSXtqjqfJJunh81srUCeMKLDOOVxtxEr30LzJura8ayxwj\nZMN19dETno+O8gBOmoxEQKEyhB5AOL4oGWTE88A37S4VTgVkYDRS9NyGZT+2bs1x\nGZJnxj1g8BCCmITv5g6N/7allx6Gw5MIvpk2d09rJMTmfNREyIdNGR9LO3zN4bAH\nFNchz30obzv//qdKwioEEQhcmefVk3g+k/R/Ce2AI2rF+7ju1DOFNMdha25MybhR\ncJAB7RwfAgMBAAECggEAORBWIkgShCZEOTlRB6Wj8z09TXcwyAAO8H3jFw8dDeh6\n2Yu6+JR7LDF0RhJRUnnkcWMbrjDrHKLA2rygafM3taUbyl8AsajBK7UrUBX+yFAL\nAUAuQlyL2Tvoxn/fkVckaE33bEOxCH0nLBQx7J4OhoHvMKgD/7rjE12WvLQnE4A9\nbB2dDAb4EkceZf5Lm/Ea7vBekNnWLeTHQF1S+G4u+LKV6+4LNeFvXR8KN5XvClau\nqUg+kSRNfmH42XRVZFY9YS1H4ge29+FSPqXI409jzYXRrLgv29mAuFJV/2uN13gH\n+Q5IZif6jvH7pbgMCpdLsGxCB4zvfWguujjuzOv9gQKBgQDGG/tIOy38S9TwlRyP\nayVxR4D29NgOYIyfV031Ou9JQtDgjYfCPaaOH5p9W1OvFC8+Oi4dPzJ2GFh4XYlt\nx7Wjr2KHwnRjzxOyCssLFzGgzg02htZq7oyrHMJuhcAGKSs0ejbcY3Z+6F8TdsgM\n9PMil75M7OiFFVgD1F8VD65DbwKBgQC2lVqltfROaf53o2506Eb1pgTY1A1+BKX4\nWg0KzPWF592pr0+ZOSXM+HNQDVP379+5lw6vy3I0aIHeyDHQzB4NrQIP+jcq81mi\n1hpK2dP+gYUKv77EHehiczZ5ydY7jkBEOIXHtZcP0SzQGM8kirITmYxt9e75/A+X\nI72OO9eaUQKBgQCHj2wiIAS2iHlcatxRMyM64Y/Y7O/O3rg67HW24a4NdoARuCb2\nflMzG2MOdmjL+8bcENmvP6ha8QvQyUiZ6zdam0+T0DbueStkAEix/RwDihu2fQvJ\nvhRZnmNZV4JvdMpQrXRO2GykKIOugPAhFZgtyqH4Z4AwWMuSS0cI1WMMVwKBgHws\nSTDn9VYa+ggtqyJxEklgdm1skhyBVsr3m2UcDWLbVUJgyza+yfmDgxEPb2rwxWv3\n0vI1397KsIBuEIsbNtlAL2XkWv6n7+8xw0HisS2msm+kBj5kxLWn+4WKgluQnB6J\nflpbIniMXvjL1pzYgtGXnQzvtG5pQcUddn40LqZxAoGBAL60YFBbmJ+2yB0Y/uVl\nV8uGlCZWrSZ3iT9e+kSqkz99i4xkwDwnMk2C2umVeaM/3Y1nWmGeJh+aNzumgKlU\nfBAq6FhQm0nxnkGazgyT3PU5ylWVk/XE1peg9bRo0hstsOf0nb/tzQU7xD1jJ7Fy\n+aaX8DUvn48SkNjjxiIzJIWd\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-ff2g2@usnotifications.iam.gserviceaccount.com",
  "client_id": "108154149951709894147",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-ff2g2%40usnotifications.iam.gserviceaccount.com"
}
),
  databaseURL: "https://usnotifications.firebaseio.com"
});

class WebSocketServer extends EventEmitter {
  constructor({ server, realm, config }) {
    super();
    this.setMaxListeners(0);
    this.realm = realm;
    this.config = config;

    let path = this.config.path;
    path = path + (path[path.length - 1] !== '/' ? '/' : '') + 'peerjs';

    this._wss = new WSS({ path, server });

    this._wss.on('connection', (socket, req) => this._onSocketConnection(socket, req));
    this._wss.on('error', (error) => this._onSocketError(error));
  }

  _onSocketConnection(socket, req) {
    const { query = {} } = url.parse(req.url, true);
    console.log("connection url is " + req.url)

    const { id, token, key } = query;

    if (!id || !token || !key) {
      return this._sendErrorAndClose(socket, Errors.INVALID_WS_PARAMETERS);
    }

    const peerSecret = "djefwaaesaFLSSVIVjgsafoiealj"
    if ( (id !== `andy${peerSecret}`) && (id !== `ash${peerSecret}`) ) {
      console.log("Bad id " + id)
      return this._sendErrorAndClose(socket, "Nope. You don't belong here.");
    }

    if (key !== this.config.key) {
      return this._sendErrorAndClose(socket, Errors.INVALID_KEY);
    }

    const client = this.realm.getClientById(id);

    if (client) {
      if (token !== client.getToken()) {
        // ID-taken, invalid token
        socket.send(JSON.stringify({
          type: MessageType.ID_TAKEN,
          payload: { msg: 'ID is taken' }
        }));

        return socket.close();
      }

      return this._configureWS(socket, client);
    }

    this._registerClient({ socket, id, token });
  }

  _onSocketError(error) {
    // handle error
    this.emit('error', error);
  }

  _registerClient({ socket, id, token }) {
    // Check concurrent limit
    const clientsCount = this.realm.getClientsIds().length;

    if (clientsCount >= this.config.concurrent_limit) {
      return this._sendErrorAndClose(socket, Errors.CONNECTION_LIMIT_EXCEED);
    }

    const newClient = new Client({ id, token });
    this.realm.setClient(newClient, id);
    socket.send(JSON.stringify({ type: MessageType.OPEN }));

    this._configureWS(socket, newClient);
  }

  _configureWS(socket, client) {
    client.setSocket(socket);

    // Send a push notification to notify the other person that you're connecting.
    let message = {
      "message":{
        "token":targetDeviceToken,
        "notification":{
          "title":"It's me!",
          "body":"I want to see you and talk to you!"
        }
      }
    }
    admin.messaging().send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });

    // Cleanup after a socket closes.
    socket.on('close', () => {
      if (client.socket === socket) {
        this.realm.removeClientById(client.getId());
        this.emit('close', client);
      }
    });

    // Handle messages from peers.
    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        message.src = client.getId();

        this.emit('message', client, message);
      } catch (e) {
        this.emit('error', e);
      }
    });

    this.emit('connection', client);
  }

  _sendErrorAndClose(socket, msg) {
    socket.send(
      JSON.stringify({
        type: MessageType.ERROR,
        payload: { msg }
      })
    );

    socket.close();
  }
}

module.exports = WebSocketServer;
