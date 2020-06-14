
###
BinaryReader

Modified by Isaiah Odhner
@TODO: use jDataView + jBinary instead

Refactored by Vjeux <vjeuxx@gmail.com>
http://blog.vjeux.com/2010/javascript/javascript-binary-reader.html

Original
+ Jonas Raoni Soares Silva
@ http://jsfromhell.com/classes/binary-parser [rev. #1]
###

class BinaryReader
	constructor: (data)->
		@_buffer = data
		@_pos = 0

	# Public (custom)
	
	readByte: ->
		@_checkSize(8)
		ch = this._buffer.charCodeAt(@_pos) & 0xff
		@_pos += 1
		ch & 0xff
	
	readUnicodeString: ->
		length = @readUInt16()
		# console.log {length}
		@_checkSize(length * 16)
		str = ""
		for i in [0..length]
			str += String.fromCharCode(@_buffer.substr(@_pos, 1) | (@_buffer.substr(@_pos+1, 1) << 8))
			@_pos += 2
		str
	
	skip: (n_bytes)->
		@seek(@_pos + n_bytes)

	# Public
	
	readInt8: -> @_decodeInt(8, true)
	readUInt8: -> @_decodeInt(8, false)
	readInt16: -> @_decodeInt(16, true)
	readUInt16: -> @_decodeInt(16, false)
	readInt32: -> @_decodeInt(32, true)
	readUInt32: -> @_decodeInt(32, false)

	readFloat: -> @_decodeFloat(23, 8)
	readDouble: -> @_decodeFloat(52, 11)
	
	readChar: -> @readString(1)
	readString: (length)->
		@_checkSize(length * 8)
		result = @_buffer.substr(@_pos, length)
		@_pos += length
		result

	seek: (pos)->
		@_pos = pos
		@_checkSize(0)
	
	getPosition: -> @_pos
	
	getSize: -> @_buffer.length
	


	# Private
	
	_decodeFloat: `function(precisionBits, exponentBits){
		var length = precisionBits + exponentBits + 1;
		var size = length >> 3;
		this._checkSize(length);

		var bias = Math.pow(2, exponentBits - 1) - 1;
		var signal = this._readBits(precisionBits + exponentBits, 1, size);
		var exponent = this._readBits(precisionBits, exponentBits, size);
		var significand = 0;
		var divisor = 2;
		var curByte = 0; //length + (-precisionBits >> 3) - 1;
		do {
			var byteValue = this._readByte(++curByte, size);
			var startBit = precisionBits % 8 || 8;
			var mask = 1 << startBit;
			while (mask >>= 1) {
				if (byteValue & mask) {
					significand += 1 / divisor;
				}
				divisor *= 2;
			}
		} while (precisionBits -= startBit);

		this._pos += size;

		return exponent == (bias << 1) + 1 ? significand ? NaN : signal ? -Infinity : +Infinity
			: (1 + signal * -2) * (exponent || significand ? !exponent ? Math.pow(2, -bias + 1) * significand
			: Math.pow(2, exponent - bias) * (1 + significand) : 0);
	}`

	_decodeInt: `function(bits, signed){
		var x = this._readBits(0, bits, bits / 8), max = Math.pow(2, bits);
		var result = signed && x >= max / 2 ? x - max : x;

		this._pos += bits / 8;
		return result;
	}`

	#shl fix: Henri Torgemane ~1996 (compressed by Jonas Raoni)
	_shl: `function (a, b){
		for (++b; --b; a = ((a %= 0x7fffffff + 1) & 0x40000000) == 0x40000000 ? a * 2 : (a - 0x40000000) * 2 + 0x7fffffff + 1);
		return a;
	}`
	
	_readByte: `function (i, size) {
		return this._buffer.charCodeAt(this._pos + size - i - 1) & 0xff;
	}`

	_readBits: `function (start, length, size) {
		var offsetLeft = (start + length) % 8;
		var offsetRight = start % 8;
		var curByte = size - (start >> 3) - 1;
		var lastByte = size + (-(start + length) >> 3);
		var diff = curByte - lastByte;

		var sum = (this._readByte(curByte, size) >> offsetRight) & ((1 << (diff ? 8 - offsetRight : length)) - 1);

		if (diff && offsetLeft) {
			sum += (this._readByte(lastByte++, size) & ((1 << offsetLeft) - 1)) << (diff-- << 3) - offsetRight; 
		}

		while (diff) {
			sum += this._shl(this._readByte(lastByte++, size), (diff-- << 3) - offsetRight);
		}

		return sum;
	}`

	_checkSize: (neededBits)->
		if @_pos + Math.ceil(neededBits / 8) > @_buffer.length
			throw new Error "Index out of bound"

module.exports = (...args)->
	if localStorage?.debug_binary == "true"
		debug_container = document.createElement("div")
		debug_container.style.position = "fixed"
		debug_container.style.left = "0"
		debug_container.style.top = "0"
		debug_container.style.right = "0"
		debug_container.style.bottom = "0"
		debug_container.classList.add("anypalette-debug-container")
		document.body.appendChild debug_container
		render_debug = =>
			debug_container.textContent = @_pos
		return new Proxy(
			new BinaryReader(...args),
			set: (target, key, value)->
				target[key] = value
				if key is "_pos"
					render_debug()
				return true
		)
	else
		return new BinaryReader(...args)