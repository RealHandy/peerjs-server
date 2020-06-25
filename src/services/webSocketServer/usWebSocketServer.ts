import { IWebSocketServer, WebSocketServer } from "./index";
import { MyWebSocket } from "./webSocket";
import { IncomingMessage } from "http";

export class UsWebSocketServer extends WebSocketServer implements IWebSocketServer {

  protected _onSocketConnection(socket: MyWebSocket, req: IncomingMessage): void {
    console.log( "in _onSocketConnection" );
    super._onSocketConnection( socket, req );
  }

}
