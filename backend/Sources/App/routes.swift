import Vapor
import usbdmx
import SwiftyJSON

/*
 API string return codes:
 
 // API
 100: missing parameter
 101: project file doesn't exist
 102: failed to read data
 103: main database doesn't exist
 104: file name and uid aren't the same
 105: failed to write data
 
 200: OK
 
 // WebSocket
 300: interface connection established
 301: interface opened
 302: interface not found
 303: invalid command format
 304: error while parsing command
 305: command executed
 
 */

func routes(_ app: Application) throws {
	
	var mountedInterface: FX5?
	var connectedInterfaces = [FX5]()
	
    app.get { req in
        req.redirect(to: "/index.html")
    }

	
	app.get("projects", ":uid") { req -> String in
		let projectUid = req.parameters.get("uid") ?? ""
		if projectUid == "" {
			return "100"
		}
		
		let projectDirectory = "\(Bundle.main.resourcePath!)/dmxprojects/"
		if FileManager.default.fileExists(atPath: "\(projectDirectory)\(projectUid).json") {
			do {
				let content = try String(contentsOf: URL(string: "file://\(projectDirectory)\(projectUid).json")!, encoding: .utf8)
				return content
			}
			catch {
				return "102"
			}
		}
		else {
			return "101"
		}
	}
    
	
	app.get("projects") { req -> String in
		var jsonArray = JSON([])
		
		let projectDirectory = "\(Bundle.main.resourcePath!)/dmxprojects/"
		// check if main db exists
		if FileManager.default.fileExists(atPath: "\(projectDirectory)db.json") {
			do {
				// try to get contents of main db
				let content = try String(contentsOf: URL(string: "file://\(projectDirectory)db.json")!, encoding: .utf8)
				let projectsArray = try JSON(data: content.data(using: .utf8)!).arrayValue
				// run through all entries in main db
				for project in projectsArray {
					let filename = "\(project.stringValue)"
					// check if project with uid exists
					if FileManager.default.fileExists(atPath: "\(projectDirectory)\(filename).json") {
						do {
							
							// try to get project content
							let projectcontent = try String(contentsOf: URL(string: "file://\(projectDirectory)\(filename).json")!, encoding: .utf8)
							let projectJSON = try JSON(data: projectcontent.data(using: .utf8)!)
							
							// check if main headers exist and if the uid is equal to the file name
							if projectJSON["name"].exists() && projectJSON["uid"].exists(), projectJSON["uid"].stringValue == filename {
								// add project to array
								var arrayCopy = jsonArray.arrayValue
								arrayCopy.append([
									"name": projectJSON["name"].stringValue,
									"uid": projectJSON["uid"].stringValue,
									"last_modified": projectJSON["last_modified"].intValue
								])
								jsonArray = JSON(arrayCopy)

							}
						}
						catch {
						}
					}
					else {
						print("project \(filename) doesn't exist")
					}
				}
				return jsonArray.rawString()!
			}
			catch {
				return "102"
			}
		}
		else {
			return "103"
		}
	}
	
	app.post("projects", ":uid") { req -> String in
		let projectUid = req.parameters.get("uid") ?? ""
		if projectUid == "" {
			return "100"
		}
		let body = req.body.string
		do {
			if let data = body?.data(using: .utf8) {
				let projectjson = try JSON(data: data)
				let projectDirectory = "\(Bundle.main.resourcePath!)/dmxprojects/"
				if projectUid == projectjson["uid"].stringValue {
					// check if main db exists
					if FileManager.default.fileExists(atPath: "\(projectDirectory)db.json") {
						
						// get contents of main db
						do {
							let dbcontent = try String(contentsOf: URL(string: "file://\(projectDirectory)db.json")!, encoding: .utf8)
							var projectsArray: [JSON] = try JSON(data: dbcontent.data(using: .utf8)!).arrayValue
							let projectsStringArray = projectsArray.map { $0.stringValue }
							if !projectsStringArray.contains(projectUid) {
								projectsArray.append(JSON(projectUid))
								let newProjectsJSON = JSON(projectsArray)
								do {
									try newProjectsJSON.rawString()!.write(to: URL(string: "file://\(projectDirectory)db.json")!, atomically: true, encoding: .utf8)
								}
								catch {
									return "105"
								}
							}
							let projectjsonString = projectjson.rawString()!
							do {
								try projectjsonString.write(to: URL(string: "file://\(projectDirectory)\(projectUid).json")!, atomically: true, encoding: .utf8)
								return "200"
							}
							catch {
								return "105"
							}
						}
						catch {
							return "102"
						}
					}
					else {
						return "103"
					}
				}
				else {
					return "104"
				}
				
			}
			else {
				return "102"
			}
		}
		catch {
			return "102"
		}
		
	}
	
	app.get("interfaces", "find") { req -> [String] in
		// create addess buffer
		let buffer: UnsafeMutablePointer<FX5_TSERIALLIST>?
		// allocate space to buffer
		buffer = UnsafeMutablePointer<FX5_TSERIALLIST>.allocate(capacity: 512)
		
		// search interfaces and fill buffer
		FX5_GetAllConnectedInterfaces(buffer!)
		let serialList = FX5_SerialList(buffer!)
		connectedInterfaces.removeAll()
		for device in serialList.serials {
			let address = device.addressToString()
			if address != "0000000000000000" && connectedInterfaces.first(where: { $0.serial.addressToString() == address }) == nil {
				connectedInterfaces.append(FX5(serial: device))
			}
			else {
				break
			}
		}
		return connectedInterfaces.map { $0.serial.addressToString()}
	}
	
	app.webSocket("interface", ":id") { req, ws in
		
		let requestedInterfaceId = req.parameters.get("id") ?? "__"
		if requestedInterfaceId == "__" {
			ws.send("100")
			ws.close()
			return
		}
		
		if let _interface = mountedInterface, (_interface.serial.addressToString() == requestedInterfaceId || _interface.isOpen) {
			if (!_interface.isOpen) {
				_interface.open()
			}
			ws.send("300")

		}
		else {
			if let _interface = mountedInterface {
				_interface.close()
			}
			// connected to WebSocket, search for interface
			
			let buffer: UnsafeMutablePointer<FX5_TSERIALLIST>?
			buffer = UnsafeMutablePointer<FX5_TSERIALLIST>.allocate(capacity: 512)
			
			// search interfaces and fill buffer
			FX5_GetAllConnectedInterfaces(buffer!)
			let serialList = FX5_SerialList(buffer!)
			let requestedInterface = serialList.serials.first(where: { $0.addressToString() ==  requestedInterfaceId})
			
			if (requestedInterface == nil) {
				ws.send("302")
				ws.close()
				return
			}
			
			
			
			mountedInterface = FX5(serial: requestedInterface!)
			mountedInterface?.open()
			ws.send("301")
		}
		
		ws.onClose.whenComplete { result in
            print("WebSocket connection closed")
			if let interface = mountedInterface {
                if interface.isOpen {
                    interface.close()
                }
			}
		}
		
		ws.onText { _ws, command in
			let data = command.data(using: .utf8)!
			do {
				if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
					if let address = json["address"] as? Int, let value = json["value"] as? Int {
						mountedInterface?.setDMX(address: address, value: value)
						_ws.send("305")
					}
					else {
						_ws.send("303")
					}
				}
				else {
					_ws.send("304")
				}
			}
			catch {
				_ws.send("304")
			}
		}
		
	}
	
}

struct WebSocket_DMX_Command: Codable {
	let address: String
	let value: String
}
