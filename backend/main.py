import engineio
import usbdmx
from flask import Flask, jsonify, request
import os
import json
import logging
from pathlib import Path
from websocket_server import WebsocketServer
#from flask_cors import CORS, cross_origin
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import atexit

app = Flask(__name__)
#app.config["SECRET_KEY"] = "secret!"
logging.getLogger('flask_cors').level = logging.DEBUG
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

#interfaces: list[usbdmx.FX5Interface] = []
#opened_interface: usbdmx.FX5Interface


class DMXWSHandler():
    def __init__(self):
        self.opened_interface: usbdmx.FX5Interface = None
        self.interfaces = usbdmx.scan()

    def on_connection(self):
        print('client connected connected')

    def on_open_interface(self, message):
        interface_id = message["interface"]
        index = [ x.serial.decode("utf-8") for x in self.interfaces ].index(interface_id)
        print(index)
        if index != -1:
            self.opened_interface: usbdmx.FX5Interface = interfaces[index]
            self.opened_interface.open()
            self.opened_interface.mode(6)

    def on_interface_message(self, message):
        address = message["address"]
        value = message["value"]
        print(value)
        self.opened_interface.set_dmx(value, address)


@app.route("/interfaces/find")
def findInterfaces():
    global interfaces
    interfaces = usbdmx.scan()
    interfaceIds = list(map(_getInterfaceId, interfaces))
    filteredIds = list(filter(("0000000000000000").__ne__, interfaceIds))
    response = jsonify({"interfaces": filteredIds})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route("/projects")
def getAllProjects():
    projects = []
    try:
        with open("%s/dmxprojects/db.json" % os.getcwd(), "r") as maindb:
            maindb_data = json.load(maindb)
            for project_id in maindb_data:
                try:
                    with open(f"{os.getcwd()}/dmxprojects/{project_id}.json", "r") as project_file:
                        project_data = json.load(project_file)
                        project_name: str = project_data["name"]
                        project_uid: str = project_data["uid"]
                        project_last_modified: int = project_data["last_modified"]
                        if not project_name.count == 0 and not project_uid.count == 0 and not project_last_modified == 0 and project_uid == project_id:
                            projects.append({
                                "name": project_name,
                                "uid": project_id,
                                "last_modified": project_last_modified
                            })
                except:
                    break
    except:
        response = jsonify({"code": "103"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    response = jsonify({"projects": projects})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route("/projects/<string:project_id>", methods=["GET"])
def getProject(project_id):
    try:
        with open(f"{os.getcwd()}/dmxprojects/{project_id}.json", "r") as project_file:
            project_data = json.load(project_file)
            response = jsonify(project_data)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
    except:
        response = jsonify({"code": "101"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

@app.route("/projects/<string:project_id>", methods=["POST"])
def updateProject(project_id):
    if not request.json:
        response = jsonify({"code": "100"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    with open(f"{os.getcwd()}/dmxprojects/db.json", "r") as maindb:
        maindb_data: list[str] = json.load(maindb)
        if project_id not in maindb_data:
            maindb_data.append(project_id)
            with open(f"{os.getcwd()}/dmxprojects/db.json", "w") as outfile:
                json.dump(maindb_data, outfile)
        with open(f"{os.getcwd()}/dmxprojects/{project_id}.json", "w") as outfile:
            json.dump(request.json, outfile)
            response = jsonify({"code": "200"})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response

def _init_API():
    # check if project folder exists
    dmx_dir = Path("%s/dmxprojects/" % os.getcwd())
    if not dmx_dir.exists():
        os.mkdir("%s/dmxprojects" % os.getcwd())
    # check if main db exists
    main_db_path = Path("%s/dmxprojects/db.json" % os.getcwd())
    if not main_db_path.exists():
        # create main db
        with open("%s/dmxprojects/db.json" % os.getcwd(), "w") as outfile:
            json.dump([], outfile)

def _getInterfaceId(interface: usbdmx.FX5Interface) -> str:
    return interface.serial.decode("utf-8")

@socketio.on('connect')
def on_connection():
    print('client connected connected')

#@socketio.on("open_interface")
#def ws_open_interface(message):
 #   interface_id = message["interface"]
 #   global interfaces
 #   index = [ x.serial.decode("utf-8") for x in interfaces ].index(interface_id)
 #   print(index)
 #   if index != -1:
 #       global opened_interface
 #       opened_interface = interfaces[index]
#        opened_interface.open()
#        opened_interface.mode(6)
        


#@socketio.on("interface_message")
#def ws_event(message):
#    address = message["address"]
#    value = message["value"]
#    print(value)
#    global opened_interface
#    opened_interface.open()
#    opened_interface.mode(6)
#    opened_interface.set_dmx(value, address)

def main_http():
    _init_API()
    app.run(debug=True, port=3832)


#def close_interface():
    #global opened_interface
    #opened_interface.close()


if __name__ == "__main__":
    #atexit.register(close_interface)
    dmxWSHandler = DMXWSHandler()
    
    socketio.on("connect")(dmxWSHandler.on_connection)
    socketio.on("open_interface")(dmxWSHandler.on_open_interface)
    socketio.on("interface_message")(dmxWSHandler.on_interface_message)
    socketio.run(app, port="3832", debug=True)