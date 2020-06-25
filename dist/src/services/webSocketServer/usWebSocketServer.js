"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
class UsWebSocketServer extends index_1.WebSocketServer {
    _onSocketConnection(socket, req) {
        console.log("in _onSocketConnection");
        super._onSocketConnection(socket, req);
    }
}
exports.UsWebSocketServer = UsWebSocketServer;
