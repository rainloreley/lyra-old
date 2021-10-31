import Vapor
import SwiftyJSON

// configures your application
public func configure(_ app: Application) throws {
    // uncomment to serve files from /Public folder
    // app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))

    // register routes
	
	let corsConfiguration = CORSMiddleware.Configuration(allowedOrigin: .all, allowedMethods: [.GET], allowedHeaders: [.accept, .authorization, .contentType, .origin, .accessControlAllowOrigin])
	
	let cors = CORSMiddleware(configuration: corsConfiguration)
	
	app.middleware.use(cors, at: .beginning)
    
    // max payload size
    app.routes.defaultMaxBodySize = "50mb"

	let projectDirectory = "\(Bundle.main.resourcePath!)/dmxprojects/"
	
	// create project folder when needed
	if !FileManager.default.fileExists(atPath: projectDirectory) {
		try FileManager.default.createDirectory(atPath: projectDirectory, withIntermediateDirectories: true, attributes: nil)
	}
	
	// check if main project db exists
	if !FileManager.default.fileExists(atPath: "\(projectDirectory)db.json") {
		
		// create new db if needed
		let dbscheme = JSON([])
		let dbString = dbscheme.rawString()!
		try dbString.write(to: URL(string: "file://\(projectDirectory)db.json")!, atomically: true, encoding: .utf8)
		
	}
	
	
	
    try routes(app)
    /*let frontendDirectory = "\(app.directory.workingDirectory)lyra-frontend"
    print(frontendDirectory)
    //app.middleware.use(FileMiddleware(publicDirectory: frontendDirectory))*/
    let filePath = Bundle.main.resourcePath!
    print(filePath)
    app.middleware.use(FileMiddleware(publicDirectory: "\(Bundle.main.resourcePath!)/lyra-frontend"))
    //runClient(app)
}

func runClient(_ app: Application) {
    let lyra_client_repo = "https://github.com/rainloreley/lyra-ui"
    let clientDirectory = "\(app.directory.workingDirectory)lyra_client/"
    do {
        print("Check if client exists")
        if !FileManager.default.fileExists(atPath: clientDirectory) {
            print("Cloning Lyra client...")
            try shell("cd \(app.directory.workingDirectory) && git clone \(lyra_client_repo) lyra_client")
        }
        print("Check if client is compiled")
        if !FileManager.default.fileExists(atPath: "\(clientDirectory)out/") {
            print("Compile client...")
            try shell("cd \(app.directory.workingDirectory)lyra_client && yarn && yarn build && yarn export")
        }
        app.middleware.use(FileMiddleware(publicDirectory: "\(clientDirectory)out"))
    }
    catch {
        return
    }
}


func shell(_ command: String, waitForFinish: Bool = false) throws {
    let task = Process()
        let pipe = Pipe()
        
        task.standardOutput = pipe
        task.standardError = pipe
        task.arguments = ["--login", "-c", command]
        task.executableURL = URL(fileURLWithPath: "/bin/bash") //<--updated

        do {
            try task.run() //<--updated
        }
        catch{
            print(error)
            throw error
        }
    
    let data = pipe.fileHandleForReading.readDataToEndOfFile()
    let output = String(data: data, encoding: .utf8)!
    print(output)
    
    /*if waitForFinish {
        task.waitUntilExit()
        return task.terminationStatus
    }
    else {
        return 0
    }*/
    
    /*let data = pipe.fileHandleForReading.readDataToEndOfFile()
    let output = String(data: data, encoding: .utf8)!
    
    return output*/
}
