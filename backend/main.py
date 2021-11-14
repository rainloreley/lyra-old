import appdirs
from usbdmx import usbdmx
from flask import Flask, jsonify, request
import json
import logging
from pathlib import Path
from flask_cors import CORS
from flask_socketio import SocketIO
from appdirs import *

# get AppData directory based on OS
appdata = appdirs.user_data_dir("lyra", "Loreley")

# setup Flask server
app = Flask(__name__)
logging.getLogger('flask_cors').level = logging.DEBUG
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# WebSocket handler class
# Handles incoming websocket connections and redirects them to the connected DMX interface
class DMXWSHandler():
    def __init__(self):
        self.opened_interface: usbdmx.FX5Interface = None
        self.interfaces = usbdmx.scan()

    def on_connection(self):
        print('client connected connected')

    def on_open_interface(self, message):
        interface_id = message["interface"]
        index = [ x.serial.decode("utf-8") for x in self.interfaces ].index(interface_id)
        if index != -1:
            self.opened_interface: usbdmx.FX5Interface = interfaces[index]
            self.opened_interface.open()
            self.opened_interface.mode(6)

    def on_interface_message(self, message):
        address = message["address"]
        value = message["value"]
        self.opened_interface.set_dmx(value, address)

# returns a list of connected DMX interfaces
@app.route("/interfaces/find")
def findInterfaces():
    global interfaces
    interfaces = usbdmx.scan()
    interfaceIds = list(map(_getInterfaceId, interfaces))
    filteredIds = list(filter(("0000000000000000").__ne__, interfaceIds))
    response = jsonify({"interfaces": filteredIds})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

# fetches the content of the db.json file and returns the project data
@app.route("/projects")
def getAllProjects():
    projects = []
    try:
        with open("%s/dmxprojects/db.json" % appdata, "r") as maindb:
            maindb_data = json.load(maindb)
            for project_id in maindb_data:
                try:
                    with open(f"{appdata}/dmxprojects/{project_id}.json", "r") as project_file:
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

# get a specific project
@app.route("/projects/<string:project_id>", methods=["GET"])
def getProject(project_id):
    try:
        with open(f"{appdata}/dmxprojects/{project_id}.json", "r") as project_file:
            project_data = json.load(project_file)
            response = jsonify(project_data)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
    except:
        response = jsonify({"code": "101"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

# update a project
@app.route("/projects/<string:project_id>", methods=["POST"])
def updateProject(project_id):
    if not request.json:
        response = jsonify({"code": "100"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    with open(f"{appdata}/dmxprojects/db.json", "r") as maindb:
        maindb_data: list[str] = json.load(maindb)
        if project_id not in maindb_data:
            maindb_data.append(project_id)
            with open(f"{appdata}/dmxprojects/db.json", "w") as outfile:
                json.dump(maindb_data, outfile)
        with open(f"{appdata}/dmxprojects/{project_id}.json", "w") as outfile:
            json.dump(request.json, outfile)
            response = jsonify({"code": "200"})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response

# initialize API
def _init_API():
    # check if appdir folder exists
    appdir_dir = Path("%s" % appdata)
    if not appdir_dir.exists():
        os.mkdir("%s" % appdata)
    # check if project folder exists
    dmx_dir = Path("%s/dmxprojects/" % appdata)
    if not dmx_dir.exists():
        os.mkdir("%s/dmxprojects" % appdata)
    # check if main db exists
    main_db_path = Path("%s/dmxprojects/db.json" % appdata)
    if not main_db_path.exists():
        # create main db
        with open("%s/dmxprojects/db.json" % appdata, "w") as outfile:
            json.dump([], outfile)

def _getInterfaceId(interface: usbdmx.FX5Interface) -> str:
    return interface.serial.decode("utf-8")

@socketio.on('connect')
def on_connection():
    print('client connected connected')

def main_http():
    _init_API()
    app.run(debug=True, port=3832)


if __name__ == "__main__":
    _init_API()
    dmxWSHandler = DMXWSHandler()
    
    socketio.on("connect")(dmxWSHandler.on_connection)
    socketio.on("open_interface")(dmxWSHandler.on_open_interface)
    socketio.on("interface_message")(dmxWSHandler.on_interface_message)
    socketio.run(app, port="3832", debug=True)