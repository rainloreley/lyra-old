//
//  Interface.swift
//  
//
//  Created by Adrian Baumgart on 16.10.21.
//

class Interface {
	var isOpen: Bool = false
	
	func open() {}
	
	func close() {}
	
	func setDMX(address: Int, value: Int) {
		print("Not handled")
	}
	
	func getDMX(address: Int) -> Int {
		print("Not handled")
		return 0
	}
}
