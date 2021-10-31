//
//  FX5.swift
//  
//
//  Created by Adrian Baumgart on 16.10.21.
//

import Foundation
import usbdmx

class FX5: Interface {
	var serial: FX5_Serial
	var dmx_in: UnsafeMutablePointer<FX5_TDMXArray>!
	var dmx_out: UnsafeMutablePointer<FX5_TDMXArray>!
	
	init(serial: FX5_Serial) {
		self.serial = serial
	}
	
	override func open() {
		let bufferOut: UnsafeMutablePointer<FX5_TDMXArray>!
		bufferOut = UnsafeMutablePointer<FX5_TDMXArray>.allocate(capacity: 512)
		let bufferIn: UnsafeMutablePointer<FX5_TDMXArray>!
		bufferIn = UnsafeMutablePointer<FX5_TDMXArray>.allocate(capacity: 512)
		self.dmx_in = bufferOut
		self.dmx_out = bufferIn
		if FX5_OpenLink(serialToTSerial(self.serial), self.dmx_out, self.dmx_in) != 0 {
			isOpen = true
			FX5_SetInterfaceMode(serialToTSerial(self.serial), UInt8(6))
		}
		else {
			print("Error")
		}
	}
	
	override func close() {
		if FX5_CloseLink(serialToTSerial(self.serial)) != 0 {
			isOpen = false
		}
		else {
			print("Close failed")
		}
	}
	
	override func setDMX(address: Int, value: Int) {
		if address >= 0 && address <= 511 && value >= 0 && value <= 255 {
			FX5_SetDMX(dmx_out, Int32(address), Int32(value))
		}
		else {
			print("Error sending DMX command")
		}
	}
	
	override func getDMX(address: Int) -> Int {
		let val = FX5_GetDMX(dmx_in, Int32(address))
		return Int(val)
	}
	
	func serialToTSerial(_ serial: FX5_Serial) -> UnsafeMutablePointer<FX5_TSERIAL> {
		var pointer = UnsafeMutablePointer<FX5_TSERIAL>.allocate(capacity: 16)
		pointer.pointee = (Int8(serial.address[0]), Int8(serial.address[1]), Int8(serial.address[2]), Int8(serial.address[3]), Int8(serial.address[4]), Int8(serial.address[5]), Int8(serial.address[6]), Int8(serial.address[7]), Int8(serial.address[8]), Int8(serial.address[9]), Int8(serial.address[10]), Int8(serial.address[11]), Int8(serial.address[12]), Int8(serial.address[13]), Int8(serial.address[14]), Int8(serial.address[15]))
		return pointer
	}
}


struct FX5_SerialList {
	var serials: [FX5_Serial]
	
	init (_ serials: [FX5_Serial]) {
		if serials.count == 32 {
			self.serials = serials
		}
		else {
			self.serials = [FX5_Serial](repeating: FX5_Serial.empty, count: 32)
		}
	}
	
	init(_ pointer: UnsafeMutablePointer<FX5_TSERIALLIST>) {
		self.serials = [FX5_Serial(pointer[0].0), FX5_Serial(pointer[0].1), FX5_Serial(pointer[0].2), FX5_Serial(pointer[0].3), FX5_Serial(pointer[0].4), FX5_Serial(pointer[0].5), FX5_Serial(pointer[0].6), FX5_Serial(pointer[0].7), FX5_Serial(pointer[0].8), FX5_Serial(pointer[0].9), FX5_Serial(pointer[0].10), FX5_Serial(pointer[0].11), FX5_Serial(pointer[0].12), FX5_Serial(pointer[0].13), FX5_Serial(pointer[0].14), FX5_Serial(pointer[0].15), FX5_Serial(pointer[0].16), FX5_Serial(pointer[0].17), FX5_Serial(pointer[0].18), FX5_Serial(pointer[0].19), FX5_Serial(pointer[0].20), FX5_Serial(pointer[0].21), FX5_Serial(pointer[0].22), FX5_Serial(pointer[0].23), FX5_Serial(pointer[0].24), FX5_Serial(pointer[0].25), FX5_Serial(pointer[0].26), FX5_Serial(pointer[0].27), FX5_Serial(pointer[0].28), FX5_Serial(pointer[0].29), FX5_Serial(pointer[0].30), FX5_Serial(pointer[0].31)]
	}
	
	func pointerToList(_ pointer: UnsafeMutablePointer<FX5_TSERIALLIST>) -> [FX5_Serial] {
		return [FX5_Serial(pointer[0].0), FX5_Serial(pointer[0].1), FX5_Serial(pointer[0].2), FX5_Serial(pointer[0].3), FX5_Serial(pointer[0].4), FX5_Serial(pointer[0].5), FX5_Serial(pointer[0].6), FX5_Serial(pointer[0].7), FX5_Serial(pointer[0].8), FX5_Serial(pointer[0].9), FX5_Serial(pointer[0].10), FX5_Serial(pointer[0].11), FX5_Serial(pointer[0].12), FX5_Serial(pointer[0].13), FX5_Serial(pointer[0].14), FX5_Serial(pointer[0].15), FX5_Serial(pointer[0].16), FX5_Serial(pointer[0].17), FX5_Serial(pointer[0].18), FX5_Serial(pointer[0].19), FX5_Serial(pointer[0].20), FX5_Serial(pointer[0].21), FX5_Serial(pointer[0].22), FX5_Serial(pointer[0].23), FX5_Serial(pointer[0].24), FX5_Serial(pointer[0].25), FX5_Serial(pointer[0].26), FX5_Serial(pointer[0].27), FX5_Serial(pointer[0].28), FX5_Serial(pointer[0].29), FX5_Serial(pointer[0].30), FX5_Serial(pointer[0].31)]
	}
}
struct FX5_Serial {
	var address: [Int]
	
	init(_ address: [Int]) {
		if address.count == 16 {
			self.address = address
		}
		else {
			self.address = [Int](repeating: 0, count: 16)
		}
	}
	
	init(_ serial: FX5_TSERIAL) {
		self.address = [Int(serial.0) - 48, Int(serial.1) - 48, Int(serial.2) - 48, Int(serial.3) - 48, Int(serial.4) - 48, Int(serial.5) - 48, Int(serial.6) - 48, Int(serial.7) - 48, Int(serial.8) - 48, Int(serial.9) - 48, Int(serial.10) - 48, Int(serial.11) - 48, Int(serial.12) - 48, Int(serial.13) - 48, Int(serial.14) - 48, Int(serial.15) - 48]
	}
	
	 static var empty = FX5_Serial([Int](repeating: 0, count: 16))
	
	mutating func tSerialToSerial(_ serial: FX5_TSERIAL) -> [Int] {
		return [Int(serial.0) - 48, Int(serial.1) - 48, Int(serial.2) - 48, Int(serial.3) - 48, Int(serial.4) - 48, Int(serial.5) - 48, Int(serial.6) - 48, Int(serial.7) - 48, Int(serial.8) - 48, Int(serial.9) - 48, Int(serial.10) - 48, Int(serial.11) - 48, Int(serial.12) - 48, Int(serial.13) - 48, Int(serial.14) - 48, Int(serial.15) - 48]
	}
	
	func addressToString() -> String {
		var string = ""
		for i in self.address {
			string += String(i)
		}
		return string
	}
}
