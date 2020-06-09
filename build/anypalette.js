(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AnyPalette = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
BinaryReader

Modified by Isaiah Odhner
@TODO: use jDataView + jBinary instead

Refactored by Vjeux <vjeuxx@gmail.com>
http://blog.vjeux.com/2010/javascript/javascript-binary-reader.html

Original
+ Jonas Raoni Soares Silva
@ http://jsfromhell.com/classes/binary-parser [rev. #1]
*/
var BinaryReader;

module.exports = BinaryReader = (function() {
  class BinaryReader {
    constructor(data) {
      this._buffer = data;
      this._pos = 0;
    }

    // Public (custom)
    readByte() {
      var ch;
      this._checkSize(8);
      ch = this._buffer.charCodeAt(this._pos) & 0xff;
      this._pos += 1;
      return ch & 0xff;
    }

    readUnicodeString() {
      var i, j, length, ref, str;
      length = this.readUInt16();
      // console.log {length}
      this._checkSize(length * 16);
      str = "";
      for (i = j = 0, ref = length; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
        str += String.fromCharCode(this._buffer.substr(this._pos, 1) | (this._buffer.substr(this._pos + 1, 1) << 8));
        this._pos += 2;
      }
      return str;
    }

    
      // Public
    readInt8() {
      return this._decodeInt(8, true);
    }

    readUInt8() {
      return this._decodeInt(8, false);
    }

    readInt16() {
      return this._decodeInt(16, true);
    }

    readUInt16() {
      return this._decodeInt(16, false);
    }

    readInt32() {
      return this._decodeInt(32, true);
    }

    readUInt32() {
      return this._decodeInt(32, false);
    }

    readFloat() {
      return this._decodeFloat(23, 8);
    }

    readDouble() {
      return this._decodeFloat(52, 11);
    }

    readChar() {
      return this.readString(1);
    }

    readString(length) {
      var result;
      this._checkSize(length * 8);
      result = this._buffer.substr(this._pos, length);
      this._pos += length;
      return result;
    }

    seek(pos) {
      this._pos = pos;
      return this._checkSize(0);
    }

    getPosition() {
      return this._pos;
    }

    getSize() {
      return this._buffer.length;
    }

    _checkSize(neededBits) {
      if (this._pos + Math.ceil(neededBits / 8) > this._buffer.length) {
        throw new Error("Index out of bound");
      }
    }

  };

  
  // Private
  BinaryReader.prototype._decodeFloat = function(precisionBits, exponentBits){
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
	};

  BinaryReader.prototype._decodeInt = function(bits, signed){
		var x = this._readBits(0, bits, bits / 8), max = Math.pow(2, bits);
		var result = signed && x >= max / 2 ? x - max : x;

		this._pos += bits / 8;
		return result;
	};

  //shl fix: Henri Torgemane ~1996 (compressed by Jonas Raoni)
  BinaryReader.prototype._shl = function (a, b){
		for (++b; --b; a = ((a %= 0x7fffffff + 1) & 0x40000000) == 0x40000000 ? a * 2 : (a - 0x40000000) * 2 + 0x7fffffff + 1);
		return a;
	};

  BinaryReader.prototype._readByte = function (i, size) {
		return this._buffer.charCodeAt(this._pos + size - i - 1) & 0xff;
	};

  BinaryReader.prototype._readBits = function (start, length, size) {
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
	};

  return BinaryReader;

}).call(this);


},{}],2:[function(require,module,exports){
// color value ranges:
// a: 0 to 1
// r/g/b: 0 to 255
// h: 0 to 360
// s/l: 0 to 100
// c/m/y/k: 0 to 100
var Color;

module.exports = Color = class Color {
  constructor(options) {
    var _, c, e, i, j, k, len, len1, m, powed, ref, ref1, rgb, white, xyz, y;
    // @TODO: don't assign all of {@r, @g, @b, @h, @s, @v, @l} right away
    // only assign the properties that are used
    // also maybe always have @r @g @b (or @red @green @blue) but still stringify to hsl() if hsl or hsv given
    // TODO: expect numbers or convert to numbers
    ({r: this.r, g: this.g, b: this.b, h: this.h, s: this.s, v: this.v, l: this.l, c, m, y, k, name: this.name} = options);
    if ((this.r != null) && (this.g != null) && (this.b != null)) {

    // Red Green Blue
    // (no conversions needed here)
    } else if ((this.h != null) && (this.s != null)) {
      // Cylindrical Color Space
      if (this.v != null) {
        // Hue Saturation Value
        this.l = (2 - this.s / 100) * this.v / 2;
        this.s = this.s * this.v / (this.l < 50 ? this.l * 2 : 200 - this.l * 2);
        if (isNaN(this.s)) {
          this.s = 0;
        }
      } else if (this.l != null) {

      } else {
        // TODO: improve error message (especially if @b given)
        // Hue Saturation Lightness
        // (no conversions needed here)
        throw new Error("Hue, saturation, and...? (either lightness or value)");
      }
    // TODO: maybe convert to @r @g @b here
    } else if ((c != null) && (m != null) && (y != null) && (k != null)) {
      // Cyan Magenta Yellow blacK
      // UNTESTED
      c /= 100;
      m /= 100;
      y /= 100;
      k /= 100;
      this.r = 255 * (1 - Math.min(1, c * (1 - k) + k));
      this.g = 255 * (1 - Math.min(1, m * (1 - k) + k));
      this.b = 255 * (1 - Math.min(1, y * (1 - k) + k));
    } else {
      // UNTESTED UNTESTED UNTESTED UNTESTED UNTESTED UNTESTED
      if ((this.l != null) && (this.a != null) && (this.b != null)) {
        white = {
          x: 95.047,
          y: 100.000,
          z: 108.883
        };
        xyz = {
          y: (raw.l + 16) / 116,
          x: raw.a / 500 + xyz.y,
          z: xyz.y - raw.b / 200
        };
        ref = "xyz";
        for (i = 0, len = ref.length; i < len; i++) {
          _ = ref[i];
          powed = Math.pow(xyz[_], 3);
          if (powed > 0.008856) {
            xyz[_] = powed;
          } else {
            xyz[_] = (xyz[_] - 16 / 116) / 7.787;
          }
        }
      }
      
      //xyz[_] = _round(xyz[_] * white[_])

      // UNTESTED UNTESTED UNTESTED UNTESTED
      if ((this.x != null) && (this.y != null) && (this.z != null)) {
        xyz = {
          x: raw.x / 100,
          y: raw.y / 100,
          z: raw.z / 100
        };
        rgb = {
          r: xyz.x * 3.2406 + xyz.y * -1.5372 + xyz.z * -0.4986,
          g: xyz.x * -0.9689 + xyz.y * 1.8758 + xyz.z * 0.0415,
          b: xyz.x * 0.0557 + xyz.y * -0.2040 + xyz.z * 1.0570
        };
        ref1 = "rgb";
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          _ = ref1[j];
          //rgb[_] = _round(rgb[_])
          if (rgb[_] < 0) {
            rgb[_] = 0;
          }
          if (rgb[_] > 0.0031308) {
            rgb[_] = 1.055 * Math.pow(rgb[_], 1 / 2.4) - 0.055;
          } else {
            rgb[_] *= 12.92;
          }
        }
      } else {
        
        //rgb[_] = Math.round(rgb[_] * 255)
        throw new Error(`Color constructor must be called with {r,g,b} or {h,s,v} or {h,s,l} or {c,m,y,k} or {x,y,z} or {l,a,b}, ${(function() {
          try {
            return `got ${JSON.stringify(options)}`;
          } catch (error) {
            e = error;
            return "got something that couldn't be displayed with JSON.stringify for this error message";
          }
        })()}`);
      }
    }
  }

  toString() {
    if (this.r != null) {
      // Red Green Blue
      if (this.a != null) {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
      } else {
        return `rgb(${this.r}, ${this.g}, ${this.b})`; // Alpha
      }
    } else if (this.h != null) {
      // Hue Saturation Lightness
      // (Assume h:0-360, s:0-100, l:0-100)
      if (this.a != null) {
        return `hsla(${this.h}, ${this.s}%, ${this.l}%, ${this.a})`;
      } else {
        return `hsl(${this.h}, ${this.s}%, ${this.l}%)`; // Alpha
      }
    }
  }

  is(color) {
    // compare as strings
    return `${this}` === `${color}`;
  }

};


},{}],3:[function(require,module,exports){
var Color, Palette;

Color = require("./Color");

module.exports = Palette = class Palette extends Array {
  constructor(...args) {
    super(...args);
  }

  add(o) {
    var new_color;
    new_color = new Color(o);
    return this.push(new_color);
  }

  finalize() {
    var i, i_color, j, j_color, k, ref, results;
    // TODO: get this working properly and enable
    // if not @numberOfColumns
    // 	@guess_dimensions()
    if (!this.parentPaletteWithoutDuplicates) {
      this.withDuplicates = new Palette();
      this.withDuplicates.parentPaletteWithoutDuplicates = this;
      for (i = k = 0, ref = this.length; (0 <= ref ? k < ref : k > ref); i = 0 <= ref ? ++k : --k) {
        this.withDuplicates[i] = this[i];
      }
      this.withDuplicates.numberOfColumns = this.numberOfColumns;
      this.withDuplicates.geometrySpecifiedByFile = this.geometrySpecifiedByFile;
      this.withDuplicates.finalize();
      // in-place uniquify
      i = 0;
      results = [];
      while (i < this.length) {
        i_color = this[i];
        j = i + 1;
        while (j < this.length) {
          j_color = this[j];
          if (i_color.is(j_color)) {
            this.splice(j, 1);
            j -= 1;
          }
          j += 1;
        }
        results.push(i += 1);
      }
      return results;
    }
  }

};

/*
guess_dimensions: ->
 * TODO: get this working properly and enable

	len = @length
	candidate_dimensions = []
	for numberOfColumns in [0..len]
		n_rows = len / numberOfColumns
		if n_rows is Math.round n_rows
			candidate_dimensions.push [n_rows, numberOfColumns]

	squarest = [0, 3495093]
	for cd in candidate_dimensions
		if Math.abs(cd[0] - cd[1]) < Math.abs(squarest[0] - squarest[1])
			squarest = cd

	@numberOfColumns = squarest[1]
 */


},{"./Color":2}],4:[function(require,module,exports){
// Load a ColorSchemer palette
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data}) {
  var br, i, length, palette, version;
  palette = new Palette();
  br = new BinaryReader(data);
  version = br.readUInt16(); // or something
  length = br.readUInt16();
  i = 0;
  while (i < length) {
    br.seek(8 + i * 26);
    palette.add({
      r: br.readByte(),
      g: br.readByte(),
      b: br.readByte()
    });
    i += 1;
  }
  return palette;
};


},{"../BinaryReader":1,"../Palette":3}],5:[function(require,module,exports){
// Load a GIMP palette
var Palette;

Palette = require("../Palette");

module.exports = function({data}) {
  var i, line, lines, m, palette, r_g_b_name;
  lines = data.split(/[\n\r]+/m);
  if (lines[0] !== "GIMP Palette") {
    throw new Error("Not a GIMP Palette");
  }
  palette = new Palette();
  i = 1;
  while ((i += 1) < lines.length) {
    line = lines[i];
    if (line[0] === "#" || line === "") {
      continue;
    }
    // TODO: handle non-start-of-line comments? where's the spec?
    m = line.match(/Name:\s*(.*)/);
    if (m) {
      palette.name = m[1];
      continue;
    }
    m = line.match(/Columns:\s*(.*)/);
    if (m) {
      palette.numberOfColumns = Number(m[1]);
      // TODO: handle 0 as not specified? where's the spec at, yo?
      palette.geometrySpecifiedByFile = true;
      continue;
    }
    
    // TODO: replace \s with [\ \t] (spaces or tabs)
    // it can't match \n because it's already split on that, but still
    // TODO: handle line with no name but space on the end
    r_g_b_name = line.match(/^\s*([0-9]+)\s+([0-9]+)\s+([0-9]+)(?:\s+(.*))?$/); // "at the beginning of the line,"
    // "give or take some spaces,"
    // match 3 groups of numbers separated by spaces
    // red
    // green
    // blue
    // optionally a name
    // "and that should be the end of the line"
    if (!r_g_b_name) {
      throw new Error(`Line ${i} doesn't match pattern ${r_g_b_name}`);
    }
    palette.add({
      r: r_g_b_name[1],
      g: r_g_b_name[2],
      b: r_g_b_name[3],
      name: r_g_b_name[4]
    });
  }
  return palette;
};


},{"../Palette":3}],6:[function(require,module,exports){
// Detect CSS colors (except named colors)
var Palette;

Palette = require("../Palette");

module.exports = function({data}) {
  var hex, i, len, most_colors, n, palette, palette_hsl, palette_hsla, palette_rgb, palette_rgba, palette_xRGB, palette_xRRGGBB, palettes;
  palettes = [palette_xRRGGBB = new Palette(), palette_xRGB = new Palette(), palette_rgb = new Palette(), palette_hsl = new Palette(), palette_hsla = new Palette(), palette_rgba = new Palette()];
  hex = function(x) {
    return parseInt(x, 16);
  };
  
  // TODO: support 0xFFF style, but deprioritize it if CSS-style colors are present
  // ...but what order of components should be assumed there? maybe just keep to CSS
  data.replace(/\#([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{4}|[0-9A-F]{8})(?![0-9A-F])/gim, function(m, $1) { // hashtag # #/
    // three hex-digits (#A0C)
    // six hex-digits (#AA00CC)
    // with alpha, four hex-digits (#A0CF)
    // with alpha, eight hex-digits (#AA00CCFF)
    // (and no more!)
    if ($1.length > 4) {
      return palette_xRRGGBB.add({
        r: hex($1[0] + $1[1]),
        g: hex($1[2] + $1[3]),
        b: hex($1[4] + $1[5]),
        a: $1.length === 8 ? hex($1[6] + $1[7]) : 1
      });
    } else {
      return palette_xRGB.add({
        r: hex($1[0] + $1[0]),
        g: hex($1[1] + $1[1]),
        b: hex($1[2] + $1[2]),
        a: $1.length === 4 ? hex($1[3] + $1[3]) : 1
      });
    }
  });
  data.replace(/rgb\(\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*\)/gim, function(_m, r_val, r_unit, g_val, g_unit, b_val, b_unit) { // red
    // green
    // blue
    return palette_rgb.add({
      r: Number(r_val) * (r_unit === "%" ? 255 / 100 : 1),
      g: Number(g_val) * (g_unit === "%" ? 255 / 100 : 1),
      b: Number(b_val) * (b_unit === "%" ? 255 / 100 : 1)
    });
  });
  data.replace(/rgba?\(\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\/)\s*([0-9]*\.?[0-9]+)(%?)\s*\)/gim, function(_m, r_val, r_unit, g_val, g_unit, b_val, b_unit, a_val, a_unit) { // red
    // green
    // blue
    // alpha
    return palette_rgba.add({
      r: Number(r_val) * (r_unit === "%" ? 255 / 100 : 1),
      g: Number(g_val) * (g_unit === "%" ? 255 / 100 : 1),
      b: Number(b_val) * (b_unit === "%" ? 255 / 100 : 1),
      a: Number(a_val) * (a_unit === "%" ? 1 / 100 : 1)
    });
  });
  data.replace(/hsl\(\s*([0-9]*\.?[0-9]+)(deg|rad|turn|)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*\)/gim, function(_m, h_val, h_unit, s_val, s_unit, l_val, l_unit) { // hue
    // saturation
    // value
    return palette_hsl.add({
      h: Number(h_val) * (h_unit === "rad" ? 180 / Math.PI : h_unit === "turn" ? 360 : 1),
      s: Number(s_val) * (s_unit === "%" ? 1 : 100),
      l: Number(l_val) * (l_unit === "%" ? 1 : 100)
    });
  });
  data.replace(/hsla?\(\s*([0-9]*\.?[0-9]+)(deg|rad|turn|)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\/)\s*([0-9]*\.?[0-9]+)(%?)\s*\)/gim, function(_m, h_val, h_unit, s_val, s_unit, l_val, l_unit, a_val, a_unit) { // hue
    // saturation
    // value
    // alpha
    return palette_hsla.add({
      h: Number(h_val) * (h_unit === "rad" ? 180 / Math.PI : h_unit === "turn" ? 360 : 1),
      s: Number(s_val) * (s_unit === "%" ? 1 : 100),
      l: Number(l_val) * (l_unit === "%" ? 1 : 100),
      a: Number(a_val) * (a_unit === "%" ? 1 / 100 : 1)
    });
  });
  most_colors = [];
  for (i = 0, len = palettes.length; i < len; i++) {
    palette = palettes[i];
    if (palette.length >= most_colors.length) {
      most_colors = palette;
    }
  }
  n = most_colors.length;
  if (n < 4) {
    throw new Error(["No colors found", "Only one color found", "Only a couple colors found", "Only a few colors found"][n] + ` (${n})`);
  }
  return most_colors;
};


},{"../Palette":3}],7:[function(require,module,exports){
// What does HPL stand for?
// Howdy, Palette Lovers!
var Palette;

Palette = require("../Palette");

module.exports = function({data}) {
  var i, j, len, line, lines, palette, rgb;
  lines = data.split(/[\n\r]+/m);
  if (lines[0] !== "Palette") {
    throw new Error("Not an HPL palette");
  }
  if (!lines[1].match(/Version [34]\.0/)) {
    throw new Error("Unsupported HPL version");
  }
  palette = new Palette();
  for (i = j = 0, len = lines.length; j < len; i = ++j) {
    line = lines[i];
    if (line.match(/.+ .* .+/)) {
      rgb = line.split(" ");
      palette.add({
        r: rgb[0],
        g: rgb[1],
        b: rgb[2]
      });
    }
  }
  return palette;
};


},{"../Palette":3}],8:[function(require,module,exports){
// Load a Paint.NET palette file
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data}) {
  var hex, i, len, line, m, palette, ref;
  palette = new Palette();
  hex = function(x) {
    return parseInt(x, 16);
  };
  ref = data.split(/[\n\r]+/m);
  for (i = 0, len = ref.length; i < len; i++) {
    line = ref[i];
    m = line.match(/^([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i);
    if (m) {
      palette.add({
        a: hex(m[1]),
        r: hex(m[2]),
        g: hex(m[3]),
        b: hex(m[4])
      });
    }
  }
  return palette;
};


},{"../BinaryReader":1,"../Palette":3}],9:[function(require,module,exports){
// Load a JASC PAL file (Paint Shop Pro palette file)
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data}) {
  var i, j, len, line, lines, palette, rgb;
  lines = data.split(/[\n\r]+/m);
  if (lines[0] !== "JASC-PAL") {
    throw new Error("Not a JASC-PAL");
  }
  if (lines[1] !== "0100") {
    throw new Error("Unknown JASC-PAL version");
  }
  if (lines[2] !== "256") {
    "that's ok";
  }
  palette = new Palette();
//n_colors = Number(lines[2])
  for (i = j = 0, len = lines.length; j < len; i = ++j) {
    line = lines[i];
    if (line !== "" && i > 2) {
      rgb = line.split(" ");
      palette.add({
        r: rgb[0],
        g: rgb[1],
        b: rgb[2]
      });
    }
  }
  return palette;
};


},{"../BinaryReader":1,"../Palette":3}],10:[function(require,module,exports){
// Load a Resource Interchange File Format PAL file

// ported from C# code at https://worms2d.info/Palette_file
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data}) {
  var br, chunkSize, chunkType, dataSize, i, palNumEntries, palVersion, palette, riff, type;
  br = new BinaryReader(data);
  
  // RIFF header
  riff = br.readString(4); // "RIFF"
  dataSize = br.readUInt32();
  type = br.readString(4); // "PAL "
  if (riff !== "RIFF") {
    throw new Error("RIFF header not found; not a RIFF PAL file");
  }
  if (type !== "PAL ") {
    throw new Error(`RIFF header says this isn't a PAL file,
more of a sort of ${(type + "").trim()} file`);
  }
  
  // Data chunk
  chunkType = br.readString(4); // "data"
  chunkSize = br.readUInt32();
  palVersion = br.readUInt16(); // 0x0300
  palNumEntries = br.readUInt16();
  if (chunkType !== "data") {
    throw new Error(`Data chunk not found (...'${chunkType}'?)`);
  }
  if (palVersion !== 0x0300) {
    throw new Error(`Unsupported PAL file format version: 0x${palVersion.toString(16)}`);
  }
  
  // Colors
  palette = new Palette();
  i = 0;
  while ((i += 1) < palNumEntries - 1) {
    palette.add({
      r: br.readByte(),
      g: br.readByte(),
      b: br.readByte(),
      _: br.readByte() // "flags", always 0x00
    });
  }
  return palette;
};


},{"../BinaryReader":1,"../Palette":3}],11:[function(require,module,exports){
// PAL (StarCraft raw palette)
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data}) {
  var br, i, j, palette;
  palette = new Palette();
  br = new BinaryReader(data);
  for (i = j = 0; j < 255; i = ++j) {
    palette.add({
      r: br.readByte(),
      g: br.readByte(),
      b: br.readByte()
    });
  }
  //: no padding

  //? palette.numberOfColumns = 16
  return palette;
};


},{"../BinaryReader":1,"../Palette":3}],12:[function(require,module,exports){
// WPE (StarCraft padded raw palette)
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data}) {
  var br, i, j, palette;
  palette = new Palette();
  br = new BinaryReader(data);
  for (i = j = 0; j < 255; i = ++j) {
    palette.add({
      r: br.readByte(),
      g: br.readByte(),
      b: br.readByte(),
      _: br.readByte() // padding
    });
  }
  palette.numberOfColumns = 16;
  return palette;
};


},{"../BinaryReader":1,"../Palette":3}],13:[function(require,module,exports){
var AnyPalette, Color, LoadingErrors, Palette, RandomColor, RandomPalette, load_palette, normalize_options;

Palette = require("./Palette");

Color = require("./Color");

RandomColor = class RandomColor extends Color {
  constructor() {
    super();
    this.randomize();
  }

  randomize() {
    this.h = Math.random() * 360;
    this.s = Math.random() * 100;
    return this.l = Math.random() * 100;
  }

  toString() {
    this.randomize();
    return `hsl(${this.h}, ${this.s}%, ${this.l}%)`;
  }

  is() {
    return false;
  }

};

RandomPalette = class RandomPalette extends Palette {
  constructor() {
    var i, j, ref;
    super();
    this.loader = {
      name: "Completely Random Colors™",
      fileExtensions: [],
      fileExtensionsPretty: "(.crc sjf(Df09sjdfksdlfmnm ';';"
    };
    this.matchedLoaderFileExtensions = false;
    this.confidence = 0;
    this.finalize();
    for (i = j = 0, ref = Math.random() * 15 + 5; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
      this.push(new RandomColor());
    }
  }

};

LoadingErrors = class LoadingErrors extends Error {
  constructor(errors1) {
    var error;
    super();
    this.errors = errors1;
    this.message = "Some errors were encountered when loading:" + (function() {
      var j, len, ref, results;
      ref = this.errors;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        error = ref[j];
        results.push("\n\t" + error.message);
      }
      return results;
    }).call(this);
  }

};

load_palette = function(o, callback) {
  var e, err, errors, exts_pretty, j, k, len, len1, msg, palette, palette_loaders, pl;
  palette_loaders = [
    {
      name: "Paint Shop Pro palette",
      exts: ["pal",
    "psppalette"],
      load: require("./loaders/PaintShopPro")
    },
    {
      name: "RIFF PAL",
      exts: ["pal"],
      load: require("./loaders/RIFF")
    },
    {
      name: "ColorSchemer palette",
      exts: ["cs"],
      load: require("./loaders/ColorSchemer")
    },
    {
      name: "Paint.NET palette",
      exts: ["txt"],
      load: require("./loaders/Paint.NET")
    },
    {
      name: "GIMP palette",
      exts: ["gpl",
    "gimp",
    "colors"],
      load: require("./loaders/GIMP")
    },
    {
      name: "CSS-style colors",
      exts: ["css",
    "scss",
    "sass",
    "less",
    "styl",
    "html",
    "htm",
    "svg",
    "js",
    "ts",
    "xml",
    "txt"],
      load: require("./loaders/Generic")
    },
    {
      // {
      // 	name: "Adobe Color Swatch"
      // 	exts: ["aco"]
      // 	load: require "./loaders/AdobeColorSwatch"
      // }
      // {
      // 	name: "Adobe Color Table"
      // 	exts: ["act"]
      // 	load: require "./loaders/AdobeColorTable"
      // }
      // {
      // 	name: "Adobe Swatch Exchange"
      // 	exts: ["ase"]
      // 	load: require "./loaders/AdobeSwatchExchange"
      // }
      // {
      // 	name: "Adobe Color Book"
      // 	exts: ["acb"]
      // 	load: require "./loaders/AdobeColorBook"
      // }
      name: "HPL palette",
      exts: ["hpl"],
      load: require("./loaders/HPL")
    },
    {
      name: "StarCraft palette",
      exts: ["pal"],
      load: require("./loaders/StarCraft")
    },
    {
      name: "StarCraft terrain palette",
      exts: ["wpe"],
      load: require("./loaders/StarCraftPadded")
    }
  ];

  // find palette loaders that use this file extension

  // {
// 	name: "AutoCAD Color Book"
// 	exts: ["acb"]
// 	load: require "./loaders/AutoCADColorBook"
// }

  // {
// 	# (same as Paint Shop Pro palette?)
// 	name: "CorelDRAW palette"
// 	exts: ["pal", "cpl"]
// 	load: require "./loaders/CorelDRAW"
// }
  for (j = 0, len = palette_loaders.length; j < len; j++) {
    pl = palette_loaders[j];
    pl.matches_ext = pl.exts.indexOf(o.fileExt) !== -1;
  }
  
  // move palette loaders to the beginning that use this file extension
  palette_loaders.sort(function(pl1, pl2) {
    return pl2.matches_ext - pl1.matches_ext;
  });
  
  // try loading stuff
  errors = [];
  for (k = 0, len1 = palette_loaders.length; k < len1; k++) {
    pl = palette_loaders[k];
    try {
      palette = pl.load(o);
      if (palette.length === 0) {
        palette = null;
        throw new Error("no colors returned");
      }
    } catch (error1) {
      e = error1;
      msg = `failed to load ${o.fileName} as ${pl.name}: ${e.message}`;
      // if pl.matches_ext and not e.message.match(/not a/i)
      // 	console?.error? msg
      // else
      // 	console?.warn? msg

      // TODO: maybe this shouldn't be an Error object, just a {message, error} object
      // or {friendlyMessage, error}
      err = new Error(msg);
      err.error = e;
      errors.push(err);
    }
    if (palette) {
      // console?.info? "loaded #{o.fileName} as #{pl.name}"
      palette.confidence = pl.matches_ext ? 0.9 : 0.01;
      exts_pretty = `.${pl.exts.join(", .")}`;
      
      // TODO: probably rename loader -> format when 2-way data flow (read/write) is supported
      // TODO: maybe make this a 3rd (and fourth?) argument to the callback
      palette.loader = {
        name: pl.name,
        fileExtensions: pl.exts,
        fileExtensionsPretty: exts_pretty
      };
      palette.matchedLoaderFileExtensions = pl.matches_ext;
      palette.finalize();
      callback(null, palette);
      return;
    }
  }
  callback(new LoadingErrors(errors));
};

normalize_options = function(o = {}) {
  var ref, ref1;
  if (typeof o === "string" || o instanceof String) {
    o = {
      filePath: o
    };
  }
  if ((typeof File !== "undefined" && File !== null) && o instanceof File) {
    o = {
      file: o
    };
  }
  
  // o.minColors ?= 2
  // o.maxColors ?= 256
  if (o.fileName == null) {
    o.fileName = (ref = (ref1 = o.file) != null ? ref1.name : void 0) != null ? ref : (o.filePath ? require("path").basename(o.filePath) : void 0);
  }
  if (o.fileExt == null) {
    o.fileExt = `${o.fileName}`.split(".").pop();
  }
  o.fileExt = `${o.fileExt}`.toLowerCase();
  return o;
};

AnyPalette = {Color, Palette, RandomColor, RandomPalette};

// Get palette from a file
// LoadingErrors
AnyPalette.loadPalette = function(o, callback) {
  var fr, fs;
  if (!o) {
    throw new Error("Parameters required: AnyPalette.loadPalette(options, function callback(err, palette){})");
  }
  if (!callback) {
    throw new Error("Callback required: AnyPalette.loadPalette(options, function callback(err, palette){})");
  }
  o = normalize_options(o);
  if (o.data) {
    return load_palette(o, callback);
  } else if ((typeof File !== "undefined" && File !== null) && o.file instanceof File) {
    fr = new FileReader();
    fr.onload = function() {
      o.data = fr.result;
      return load_palette(o, callback);
    };
    return fr.readAsBinaryString(o.file);
  } else if (o.filePath != null) {
    fs = require("fs");
    return fs.readFile(o.filePath, function(err, data) {
      if (err) {
        return callback(err);
      } else {
        o.data = data.toString("binary");
        return load_palette(o, callback);
      }
    });
  } else {
    return callback(new Error("Could not load. The File API may not be supported.")); // um...
  }
};

// the File API would be supported if you've passed a File
// TODO: a better error message, about options (not) passed

// Get a palette from a file or by any means necessary
// (as in fall back to completely random data)
AnyPalette.gimmeAPalette = function(o, callback) {
  o = normalize_options(o);
  return AnyPalette.loadPalette(o, function(err, palette) {
    return callback(null, palette != null ? palette : new RandomPalette());
  });
};

// Exports
module.exports = AnyPalette;


},{"./Color":2,"./Palette":3,"./loaders/ColorSchemer":4,"./loaders/GIMP":5,"./loaders/Generic":6,"./loaders/HPL":7,"./loaders/Paint.NET":8,"./loaders/PaintShopPro":9,"./loaders/RIFF":10,"./loaders/StarCraft":11,"./loaders/StarCraftPadded":12,"fs":"fs","path":"path"}]},{},[13])(13)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQmluYXJ5UmVhZGVyLmNvZmZlZSIsInNyYy9Db2xvci5jb2ZmZWUiLCJzcmMvUGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbG9hZGVycy9Db2xvclNjaGVtZXIuY29mZmVlIiwic3JjL2xvYWRlcnMvR0lNUC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9HZW5lcmljLmNvZmZlZSIsInNyYy9sb2FkZXJzL0hQTC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9QYWludC5ORVQuY29mZmVlIiwic3JjL2xvYWRlcnMvUGFpbnRTaG9wUHJvLmNvZmZlZSIsInNyYy9sb2FkZXJzL1JJRkYuY29mZmVlIiwic3JjL2xvYWRlcnMvU3RhckNyYWZ0LmNvZmZlZSIsInNyYy9sb2FkZXJzL1N0YXJDcmFmdFBhZGRlZC5jb2ZmZWUiLCJzcmMvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNhSTs7Ozs7Ozs7Ozs7OztBQUFBLElBQUE7O0FBRUYsTUFBTSxDQUFDLE9BQVAsR0FDTTtFQUFOLE1BQUEsYUFBQTtJQUNBLFdBQWEsQ0FBQyxJQUFELENBQUE7TUFDWixJQUFDLENBQUEsT0FBRCxHQUFXO01BQ1gsSUFBQyxDQUFBLElBQUQsR0FBUTtJQUZJLENBQWQ7OztJQU1DLFFBQVUsQ0FBQSxDQUFBO0FBQ1gsVUFBQTtNQUFFLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBWjtNQUNBLEVBQUEsR0FBSyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQWIsQ0FBd0IsSUFBQyxDQUFBLElBQXpCLENBQUEsR0FBaUM7TUFDdEMsSUFBQyxDQUFBLElBQUQsSUFBUzthQUNULEVBQUEsR0FBSztJQUpJOztJQU1WLGlCQUFtQixDQUFBLENBQUE7QUFDcEIsVUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUE7TUFBRSxNQUFBLEdBQVMsSUFBQyxDQUFBLFVBQUQsQ0FBQSxFQUFYOztN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LElBQUcsR0FBSDtlQUNDLFFBQUEsQ0FBUyxHQUFULEVBREQ7T0FBQSxNQUFBO1FBR0MsQ0FBQyxDQUFDLElBQUYsR0FBUyxJQUFJLENBQUMsUUFBTCxDQUFjLFFBQWQ7ZUFDVCxZQUFBLENBQWEsQ0FBYixFQUFnQixRQUFoQixFQUpEOztJQUR1QixDQUF4QixFQUZJO0dBQUEsTUFBQTtXQVNKLFFBQUEsQ0FBUyxJQUFJLEtBQUosQ0FBVSxvREFBVixDQUFULEVBVEk7O0FBaEJvQixFQWxNMUI7Ozs7Ozs7QUFrT0MsVUFBVSxDQUFDLGFBQVgsR0FBMkIsUUFBQSxDQUFDLENBQUQsRUFBSSxRQUFKLENBQUE7RUFDM0IsQ0FBQSxHQUFJLGlCQUFBLENBQWtCLENBQWxCO1NBRUosVUFBVSxDQUFDLFdBQVgsQ0FBdUIsQ0FBdkIsRUFBMEIsUUFBQSxDQUFDLEdBQUQsRUFBTSxPQUFOLENBQUE7V0FDekIsUUFBQSxDQUFTLElBQVQsb0JBQWUsVUFBVSxJQUFJLGFBQUosQ0FBQSxDQUF6QjtFQUR5QixDQUExQjtBQUgyQixFQWxPNUI7OztBQXlPQyxNQUFNLENBQUMsT0FBUCxHQUFpQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlxyXG4jIyNcclxuQmluYXJ5UmVhZGVyXHJcblxyXG5Nb2RpZmllZCBieSBJc2FpYWggT2RobmVyXHJcbkBUT0RPOiB1c2UgakRhdGFWaWV3ICsgakJpbmFyeSBpbnN0ZWFkXHJcblxyXG5SZWZhY3RvcmVkIGJ5IFZqZXV4IDx2amV1eHhAZ21haWwuY29tPlxyXG5odHRwOi8vYmxvZy52amV1eC5jb20vMjAxMC9qYXZhc2NyaXB0L2phdmFzY3JpcHQtYmluYXJ5LXJlYWRlci5odG1sXHJcblxyXG5PcmlnaW5hbFxyXG4rIEpvbmFzIFJhb25pIFNvYXJlcyBTaWx2YVxyXG5AIGh0dHA6Ly9qc2Zyb21oZWxsLmNvbS9jbGFzc2VzL2JpbmFyeS1wYXJzZXIgW3Jldi4gIzFdXHJcbiMjI1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG5jbGFzcyBCaW5hcnlSZWFkZXJcclxuXHRjb25zdHJ1Y3RvcjogKGRhdGEpLT5cclxuXHRcdEBfYnVmZmVyID0gZGF0YVxyXG5cdFx0QF9wb3MgPSAwXHJcblxyXG5cdCMgUHVibGljIChjdXN0b20pXHJcblx0XHJcblx0cmVhZEJ5dGU6IC0+XHJcblx0XHRAX2NoZWNrU2l6ZSg4KVxyXG5cdFx0Y2ggPSB0aGlzLl9idWZmZXIuY2hhckNvZGVBdChAX3BvcykgJiAweGZmXHJcblx0XHRAX3BvcyArPSAxXHJcblx0XHRjaCAmIDB4ZmZcclxuXHRcclxuXHRyZWFkVW5pY29kZVN0cmluZzogLT5cclxuXHRcdGxlbmd0aCA9IEByZWFkVUludDE2KClcclxuXHRcdCMgY29uc29sZS5sb2cge2xlbmd0aH1cclxuXHRcdEBfY2hlY2tTaXplKGxlbmd0aCAqIDE2KVxyXG5cdFx0c3RyID0gXCJcIlxyXG5cdFx0Zm9yIGkgaW4gWzAuLmxlbmd0aF1cclxuXHRcdFx0c3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoQF9idWZmZXIuc3Vic3RyKEBfcG9zLCAxKSB8IChAX2J1ZmZlci5zdWJzdHIoQF9wb3MrMSwgMSkgPDwgOCkpXHJcblx0XHRcdEBfcG9zICs9IDJcclxuXHRcdHN0clxyXG5cdFxyXG5cdCMgUHVibGljXHJcblx0XHJcblx0cmVhZEludDg6IC0+IEBfZGVjb2RlSW50KDgsIHRydWUpXHJcblx0cmVhZFVJbnQ4OiAtPiBAX2RlY29kZUludCg4LCBmYWxzZSlcclxuXHRyZWFkSW50MTY6IC0+IEBfZGVjb2RlSW50KDE2LCB0cnVlKVxyXG5cdHJlYWRVSW50MTY6IC0+IEBfZGVjb2RlSW50KDE2LCBmYWxzZSlcclxuXHRyZWFkSW50MzI6IC0+IEBfZGVjb2RlSW50KDMyLCB0cnVlKVxyXG5cdHJlYWRVSW50MzI6IC0+IEBfZGVjb2RlSW50KDMyLCBmYWxzZSlcclxuXHJcblx0cmVhZEZsb2F0OiAtPiBAX2RlY29kZUZsb2F0KDIzLCA4KVxyXG5cdHJlYWREb3VibGU6IC0+IEBfZGVjb2RlRmxvYXQoNTIsIDExKVxyXG5cdFxyXG5cdHJlYWRDaGFyOiAtPiBAcmVhZFN0cmluZygxKVxyXG5cdHJlYWRTdHJpbmc6IChsZW5ndGgpLT5cclxuXHRcdEBfY2hlY2tTaXplKGxlbmd0aCAqIDgpXHJcblx0XHRyZXN1bHQgPSBAX2J1ZmZlci5zdWJzdHIoQF9wb3MsIGxlbmd0aClcclxuXHRcdEBfcG9zICs9IGxlbmd0aFxyXG5cdFx0cmVzdWx0XHJcblxyXG5cdHNlZWs6IChwb3MpLT5cclxuXHRcdEBfcG9zID0gcG9zXHJcblx0XHRAX2NoZWNrU2l6ZSgwKVxyXG5cdFxyXG5cdGdldFBvc2l0aW9uOiAtPiBAX3Bvc1xyXG5cdFxyXG5cdGdldFNpemU6IC0+IEBfYnVmZmVyLmxlbmd0aFxyXG5cdFxyXG5cclxuXHJcblx0IyBQcml2YXRlXHJcblx0XHJcblx0X2RlY29kZUZsb2F0OiBgZnVuY3Rpb24ocHJlY2lzaW9uQml0cywgZXhwb25lbnRCaXRzKXtcclxuXHRcdHZhciBsZW5ndGggPSBwcmVjaXNpb25CaXRzICsgZXhwb25lbnRCaXRzICsgMTtcclxuXHRcdHZhciBzaXplID0gbGVuZ3RoID4+IDM7XHJcblx0XHR0aGlzLl9jaGVja1NpemUobGVuZ3RoKTtcclxuXHJcblx0XHR2YXIgYmlhcyA9IE1hdGgucG93KDIsIGV4cG9uZW50Qml0cyAtIDEpIC0gMTtcclxuXHRcdHZhciBzaWduYWwgPSB0aGlzLl9yZWFkQml0cyhwcmVjaXNpb25CaXRzICsgZXhwb25lbnRCaXRzLCAxLCBzaXplKTtcclxuXHRcdHZhciBleHBvbmVudCA9IHRoaXMuX3JlYWRCaXRzKHByZWNpc2lvbkJpdHMsIGV4cG9uZW50Qml0cywgc2l6ZSk7XHJcblx0XHR2YXIgc2lnbmlmaWNhbmQgPSAwO1xyXG5cdFx0dmFyIGRpdmlzb3IgPSAyO1xyXG5cdFx0dmFyIGN1ckJ5dGUgPSAwOyAvL2xlbmd0aCArICgtcHJlY2lzaW9uQml0cyA+PiAzKSAtIDE7XHJcblx0XHRkbyB7XHJcblx0XHRcdHZhciBieXRlVmFsdWUgPSB0aGlzLl9yZWFkQnl0ZSgrK2N1ckJ5dGUsIHNpemUpO1xyXG5cdFx0XHR2YXIgc3RhcnRCaXQgPSBwcmVjaXNpb25CaXRzICUgOCB8fCA4O1xyXG5cdFx0XHR2YXIgbWFzayA9IDEgPDwgc3RhcnRCaXQ7XHJcblx0XHRcdHdoaWxlIChtYXNrID4+PSAxKSB7XHJcblx0XHRcdFx0aWYgKGJ5dGVWYWx1ZSAmIG1hc2spIHtcclxuXHRcdFx0XHRcdHNpZ25pZmljYW5kICs9IDEgLyBkaXZpc29yO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkaXZpc29yICo9IDI7XHJcblx0XHRcdH1cclxuXHRcdH0gd2hpbGUgKHByZWNpc2lvbkJpdHMgLT0gc3RhcnRCaXQpO1xyXG5cclxuXHRcdHRoaXMuX3BvcyArPSBzaXplO1xyXG5cclxuXHRcdHJldHVybiBleHBvbmVudCA9PSAoYmlhcyA8PCAxKSArIDEgPyBzaWduaWZpY2FuZCA/IE5hTiA6IHNpZ25hbCA/IC1JbmZpbml0eSA6ICtJbmZpbml0eVxyXG5cdFx0XHQ6ICgxICsgc2lnbmFsICogLTIpICogKGV4cG9uZW50IHx8IHNpZ25pZmljYW5kID8gIWV4cG9uZW50ID8gTWF0aC5wb3coMiwgLWJpYXMgKyAxKSAqIHNpZ25pZmljYW5kXHJcblx0XHRcdDogTWF0aC5wb3coMiwgZXhwb25lbnQgLSBiaWFzKSAqICgxICsgc2lnbmlmaWNhbmQpIDogMCk7XHJcblx0fWBcclxuXHJcblx0X2RlY29kZUludDogYGZ1bmN0aW9uKGJpdHMsIHNpZ25lZCl7XHJcblx0XHR2YXIgeCA9IHRoaXMuX3JlYWRCaXRzKDAsIGJpdHMsIGJpdHMgLyA4KSwgbWF4ID0gTWF0aC5wb3coMiwgYml0cyk7XHJcblx0XHR2YXIgcmVzdWx0ID0gc2lnbmVkICYmIHggPj0gbWF4IC8gMiA/IHggLSBtYXggOiB4O1xyXG5cclxuXHRcdHRoaXMuX3BvcyArPSBiaXRzIC8gODtcclxuXHRcdHJldHVybiByZXN1bHQ7XHJcblx0fWBcclxuXHJcblx0I3NobCBmaXg6IEhlbnJpIFRvcmdlbWFuZSB+MTk5NiAoY29tcHJlc3NlZCBieSBKb25hcyBSYW9uaSlcclxuXHRfc2hsOiBgZnVuY3Rpb24gKGEsIGIpe1xyXG5cdFx0Zm9yICgrK2I7IC0tYjsgYSA9ICgoYSAlPSAweDdmZmZmZmZmICsgMSkgJiAweDQwMDAwMDAwKSA9PSAweDQwMDAwMDAwID8gYSAqIDIgOiAoYSAtIDB4NDAwMDAwMDApICogMiArIDB4N2ZmZmZmZmYgKyAxKTtcclxuXHRcdHJldHVybiBhO1xyXG5cdH1gXHJcblx0XHJcblx0X3JlYWRCeXRlOiBgZnVuY3Rpb24gKGksIHNpemUpIHtcclxuXHRcdHJldHVybiB0aGlzLl9idWZmZXIuY2hhckNvZGVBdCh0aGlzLl9wb3MgKyBzaXplIC0gaSAtIDEpICYgMHhmZjtcclxuXHR9YFxyXG5cclxuXHRfcmVhZEJpdHM6IGBmdW5jdGlvbiAoc3RhcnQsIGxlbmd0aCwgc2l6ZSkge1xyXG5cdFx0dmFyIG9mZnNldExlZnQgPSAoc3RhcnQgKyBsZW5ndGgpICUgODtcclxuXHRcdHZhciBvZmZzZXRSaWdodCA9IHN0YXJ0ICUgODtcclxuXHRcdHZhciBjdXJCeXRlID0gc2l6ZSAtIChzdGFydCA+PiAzKSAtIDE7XHJcblx0XHR2YXIgbGFzdEJ5dGUgPSBzaXplICsgKC0oc3RhcnQgKyBsZW5ndGgpID4+IDMpO1xyXG5cdFx0dmFyIGRpZmYgPSBjdXJCeXRlIC0gbGFzdEJ5dGU7XHJcblxyXG5cdFx0dmFyIHN1bSA9ICh0aGlzLl9yZWFkQnl0ZShjdXJCeXRlLCBzaXplKSA+PiBvZmZzZXRSaWdodCkgJiAoKDEgPDwgKGRpZmYgPyA4IC0gb2Zmc2V0UmlnaHQgOiBsZW5ndGgpKSAtIDEpO1xyXG5cclxuXHRcdGlmIChkaWZmICYmIG9mZnNldExlZnQpIHtcclxuXHRcdFx0c3VtICs9ICh0aGlzLl9yZWFkQnl0ZShsYXN0Qnl0ZSsrLCBzaXplKSAmICgoMSA8PCBvZmZzZXRMZWZ0KSAtIDEpKSA8PCAoZGlmZi0tIDw8IDMpIC0gb2Zmc2V0UmlnaHQ7IFxyXG5cdFx0fVxyXG5cclxuXHRcdHdoaWxlIChkaWZmKSB7XHJcblx0XHRcdHN1bSArPSB0aGlzLl9zaGwodGhpcy5fcmVhZEJ5dGUobGFzdEJ5dGUrKywgc2l6ZSksIChkaWZmLS0gPDwgMykgLSBvZmZzZXRSaWdodCk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHN1bTtcclxuXHR9YFxyXG5cclxuXHRfY2hlY2tTaXplOiAobmVlZGVkQml0cyktPlxyXG5cdFx0aWYgQF9wb3MgKyBNYXRoLmNlaWwobmVlZGVkQml0cyAvIDgpID4gQF9idWZmZXIubGVuZ3RoXHJcblx0XHRcdHRocm93IG5ldyBFcnJvciBcIkluZGV4IG91dCBvZiBib3VuZFwiXHJcblxyXG4iLCJcclxuIyBjb2xvciB2YWx1ZSByYW5nZXM6XHJcbiMgYTogMCB0byAxXHJcbiMgci9nL2I6IDAgdG8gMjU1XHJcbiMgaDogMCB0byAzNjBcclxuIyBzL2w6IDAgdG8gMTAwXHJcbiMgYy9tL3kvazogMCB0byAxMDBcclxuXHJcbm1vZHVsZS5leHBvcnRzID1cclxuY2xhc3MgQ29sb3JcclxuXHRjb25zdHJ1Y3RvcjogKG9wdGlvbnMpLT5cclxuXHRcdCMgQFRPRE86IGRvbid0IGFzc2lnbiBhbGwgb2Yge0ByLCBAZywgQGIsIEBoLCBAcywgQHYsIEBsfSByaWdodCBhd2F5XHJcblx0XHQjIG9ubHkgYXNzaWduIHRoZSBwcm9wZXJ0aWVzIHRoYXQgYXJlIHVzZWRcclxuXHRcdCMgYWxzbyBtYXliZSBhbHdheXMgaGF2ZSBAciBAZyBAYiAob3IgQHJlZCBAZ3JlZW4gQGJsdWUpIGJ1dCBzdGlsbCBzdHJpbmdpZnkgdG8gaHNsKCkgaWYgaHNsIG9yIGhzdiBnaXZlblxyXG5cdFx0IyBUT0RPOiBleHBlY3QgbnVtYmVycyBvciBjb252ZXJ0IHRvIG51bWJlcnNcclxuXHRcdHtcclxuXHRcdFx0QHIsIEBnLCBAYixcclxuXHRcdFx0QGgsIEBzLCBAdiwgQGwsXHJcblx0XHRcdGMsIG0sIHksIGssXHJcblx0XHRcdEBuYW1lXHJcblx0XHR9ID0gb3B0aW9uc1xyXG5cclxuXHRcdGlmIEByPyBhbmQgQGc/IGFuZCBAYj9cclxuXHRcdFx0IyBSZWQgR3JlZW4gQmx1ZVxyXG5cdFx0XHQjIChubyBjb252ZXJzaW9ucyBuZWVkZWQgaGVyZSlcclxuXHRcdGVsc2UgaWYgQGg/IGFuZCBAcz9cclxuXHRcdFx0IyBDeWxpbmRyaWNhbCBDb2xvciBTcGFjZVxyXG5cdFx0XHRpZiBAdj9cclxuXHRcdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIFZhbHVlXHJcblx0XHRcdFx0QGwgPSAoMiAtIEBzIC8gMTAwKSAqIEB2IC8gMlxyXG5cdFx0XHRcdEBzID0gQHMgKiBAdiAvIChpZiBAbCA8IDUwIHRoZW4gQGwgKiAyIGVsc2UgMjAwIC0gQGwgKiAyKVxyXG5cdFx0XHRcdEBzID0gMCBpZiBpc05hTiBAc1xyXG5cdFx0XHRlbHNlIGlmIEBsP1xyXG5cdFx0XHRcdCMgSHVlIFNhdHVyYXRpb24gTGlnaHRuZXNzXHJcblx0XHRcdFx0IyAobm8gY29udmVyc2lvbnMgbmVlZGVkIGhlcmUpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHQjIFRPRE86IGltcHJvdmUgZXJyb3IgbWVzc2FnZSAoZXNwZWNpYWxseSBpZiBAYiBnaXZlbilcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJIdWUsIHNhdHVyYXRpb24sIGFuZC4uLj8gKGVpdGhlciBsaWdodG5lc3Mgb3IgdmFsdWUpXCJcclxuXHRcdFx0IyBUT0RPOiBtYXliZSBjb252ZXJ0IHRvIEByIEBnIEBiIGhlcmVcclxuXHRcdGVsc2UgaWYgYz8gYW5kIG0/IGFuZCB5PyBhbmQgaz9cclxuXHRcdFx0IyBDeWFuIE1hZ2VudGEgWWVsbG93IGJsYWNLXHJcblx0XHRcdCMgVU5URVNURURcclxuXHRcdFx0YyAvPSAxMDBcclxuXHRcdFx0bSAvPSAxMDBcclxuXHRcdFx0eSAvPSAxMDBcclxuXHRcdFx0ayAvPSAxMDBcclxuXHRcdFx0XHJcblx0XHRcdEByID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCBjICogKDEgLSBrKSArIGspKVxyXG5cdFx0XHRAZyA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgbSAqICgxIC0gaykgKyBrKSlcclxuXHRcdFx0QGIgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIHkgKiAoMSAtIGspICsgaykpXHJcblx0XHRlbHNlXHJcblx0XHRcdCMgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURURcclxuXHRcdFx0aWYgQGw/IGFuZCBAYT8gYW5kIEBiP1xyXG5cdFx0XHRcdHdoaXRlID1cclxuXHRcdFx0XHRcdHg6IDk1LjA0N1xyXG5cdFx0XHRcdFx0eTogMTAwLjAwMFxyXG5cdFx0XHRcdFx0ejogMTA4Ljg4M1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHh5eiA9IFxyXG5cdFx0XHRcdFx0eTogKHJhdy5sICsgMTYpIC8gMTE2XHJcblx0XHRcdFx0XHR4OiByYXcuYSAvIDUwMCArIHh5ei55XHJcblx0XHRcdFx0XHR6OiB4eXoueSAtIHJhdy5iIC8gMjAwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Zm9yIF8gaW4gXCJ4eXpcIlxyXG5cdFx0XHRcdFx0cG93ZWQgPSBNYXRoLnBvdyh4eXpbX10sIDMpXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHBvd2VkID4gMC4wMDg4NTZcclxuXHRcdFx0XHRcdFx0eHl6W19dID0gcG93ZWRcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0eHl6W19dID0gKHh5eltfXSAtIDE2IC8gMTE2KSAvIDcuNzg3XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdCN4eXpbX10gPSBfcm91bmQoeHl6W19dICogd2hpdGVbX10pXHJcblx0XHRcdFx0XHJcblx0XHRcdCMgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURURcclxuXHRcdFx0aWYgQHg/IGFuZCBAeT8gYW5kIEB6P1xyXG5cdFx0XHRcdHh5eiA9XHJcblx0XHRcdFx0XHR4OiByYXcueCAvIDEwMFxyXG5cdFx0XHRcdFx0eTogcmF3LnkgLyAxMDBcclxuXHRcdFx0XHRcdHo6IHJhdy56IC8gMTAwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0cmdiID1cclxuXHRcdFx0XHRcdHI6IHh5ei54ICogMy4yNDA2ICsgeHl6LnkgKiAtMS41MzcyICsgeHl6LnogKiAtMC40OTg2XHJcblx0XHRcdFx0XHRnOiB4eXoueCAqIC0wLjk2ODkgKyB4eXoueSAqIDEuODc1OCArIHh5ei56ICogMC4wNDE1XHJcblx0XHRcdFx0XHRiOiB4eXoueCAqIDAuMDU1NyArIHh5ei55ICogLTAuMjA0MCArIHh5ei56ICogMS4wNTcwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Zm9yIF8gaW4gXCJyZ2JcIlxyXG5cdFx0XHRcdFx0I3JnYltfXSA9IF9yb3VuZChyZ2JbX10pXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHJnYltfXSA8IDBcclxuXHRcdFx0XHRcdFx0cmdiW19dID0gMFxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiByZ2JbX10gPiAwLjAwMzEzMDhcclxuXHRcdFx0XHRcdFx0cmdiW19dID0gMS4wNTUgKiBNYXRoLnBvdyhyZ2JbX10sICgxIC8gMi40KSkgLSAwLjA1NVxyXG5cdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gKj0gMTIuOTJcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHQjcmdiW19dID0gTWF0aC5yb3VuZChyZ2JbX10gKiAyNTUpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJDb2xvciBjb25zdHJ1Y3RvciBtdXN0IGJlIGNhbGxlZCB3aXRoIHtyLGcsYn0gb3Ige2gscyx2fSBvciB7aCxzLGx9IG9yIHtjLG0seSxrfSBvciB7eCx5LHp9IG9yIHtsLGEsYn0sXHJcblx0XHRcdFx0XHQje1xyXG5cdFx0XHRcdFx0XHR0cnlcclxuXHRcdFx0XHRcdFx0XHRcImdvdCAje0pTT04uc3RyaW5naWZ5KG9wdGlvbnMpfVwiXHJcblx0XHRcdFx0XHRcdGNhdGNoIGVcclxuXHRcdFx0XHRcdFx0XHRcImdvdCBzb21ldGhpbmcgdGhhdCBjb3VsZG4ndCBiZSBkaXNwbGF5ZWQgd2l0aCBKU09OLnN0cmluZ2lmeSBmb3IgdGhpcyBlcnJvciBtZXNzYWdlXCJcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcIlxyXG5cdFx0XHJcblx0XHJcblx0dG9TdHJpbmc6IC0+XHJcblx0XHRpZiBAcj9cclxuXHRcdFx0IyBSZWQgR3JlZW4gQmx1ZVxyXG5cdFx0XHRpZiBAYT8gIyBBbHBoYVxyXG5cdFx0XHRcdFwicmdiYSgje0ByfSwgI3tAZ30sICN7QGJ9LCAje0BhfSlcIlxyXG5cdFx0XHRlbHNlICMgT3BhcXVlXHJcblx0XHRcdFx0XCJyZ2IoI3tAcn0sICN7QGd9LCAje0BifSlcIlxyXG5cdFx0ZWxzZSBpZiBAaD9cclxuXHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBMaWdodG5lc3NcclxuXHRcdFx0IyAoQXNzdW1lIGg6MC0zNjAsIHM6MC0xMDAsIGw6MC0xMDApXHJcblx0XHRcdGlmIEBhPyAjIEFscGhhXHJcblx0XHRcdFx0XCJoc2xhKCN7QGh9LCAje0BzfSUsICN7QGx9JSwgI3tAYX0pXCJcclxuXHRcdFx0ZWxzZSAjIE9wYXF1ZVxyXG5cdFx0XHRcdFwiaHNsKCN7QGh9LCAje0BzfSUsICN7QGx9JSlcIlxyXG5cdFxyXG5cdGlzOiAoY29sb3IpLT5cclxuXHRcdCMgY29tcGFyZSBhcyBzdHJpbmdzXHJcblx0XHRcIiN7QH1cIiBpcyBcIiN7Y29sb3J9XCJcclxuIiwiXHJcbkNvbG9yID0gcmVxdWlyZSBcIi4vQ29sb3JcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG5jbGFzcyBQYWxldHRlIGV4dGVuZHMgQXJyYXlcclxuXHRcclxuXHRjb25zdHJ1Y3RvcjogKGFyZ3MuLi4pLT5cclxuXHRcdHN1cGVyKGFyZ3MuLi4pXHJcblx0XHJcblx0YWRkOiAobyktPlxyXG5cdFx0bmV3X2NvbG9yID0gbmV3IENvbG9yKG8pXHJcblx0XHRAcHVzaCBuZXdfY29sb3JcclxuXHRcclxuXHRmaW5hbGl6ZTogLT5cclxuXHRcdCMgVE9ETzogZ2V0IHRoaXMgd29ya2luZyBwcm9wZXJseSBhbmQgZW5hYmxlXHJcblx0XHQjIGlmIG5vdCBAbnVtYmVyT2ZDb2x1bW5zXHJcblx0XHQjIFx0QGd1ZXNzX2RpbWVuc2lvbnMoKVxyXG5cdFx0dW5sZXNzIEBwYXJlbnRQYWxldHRlV2l0aG91dER1cGxpY2F0ZXNcclxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzID0gbmV3IFBhbGV0dGVcclxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzLnBhcmVudFBhbGV0dGVXaXRob3V0RHVwbGljYXRlcyA9IEBcclxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzW2ldID0gQFtpXSBmb3IgaSBpbiBbMC4uLkBsZW5ndGhdXHJcblx0XHRcdEB3aXRoRHVwbGljYXRlcy5udW1iZXJPZkNvbHVtbnMgPSBAbnVtYmVyT2ZDb2x1bW5zXHJcblx0XHRcdEB3aXRoRHVwbGljYXRlcy5nZW9tZXRyeVNwZWNpZmllZEJ5RmlsZSA9IEBnZW9tZXRyeVNwZWNpZmllZEJ5RmlsZVxyXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXMuZmluYWxpemUoKVxyXG5cclxuXHRcdFx0IyBpbi1wbGFjZSB1bmlxdWlmeVxyXG5cdFx0XHRpID0gMFxyXG5cdFx0XHR3aGlsZSBpIDwgQGxlbmd0aFxyXG5cdFx0XHRcdGlfY29sb3IgPSBAW2ldXHJcblx0XHRcdFx0aiA9IGkgKyAxXHJcblx0XHRcdFx0d2hpbGUgaiA8IEBsZW5ndGhcclxuXHRcdFx0XHRcdGpfY29sb3IgPSBAW2pdXHJcblx0XHRcdFx0XHRpZiBpX2NvbG9yLmlzIGpfY29sb3JcclxuXHRcdFx0XHRcdFx0QC5zcGxpY2UoaiwgMSlcclxuXHRcdFx0XHRcdFx0aiAtPSAxXHJcblx0XHRcdFx0XHRqICs9IDFcclxuXHRcdFx0XHRpICs9IDFcclxuXHJcblx0IyMjXHJcblx0Z3Vlc3NfZGltZW5zaW9uczogLT5cclxuXHRcdCMgVE9ETzogZ2V0IHRoaXMgd29ya2luZyBwcm9wZXJseSBhbmQgZW5hYmxlXHJcblxyXG5cdFx0bGVuID0gQGxlbmd0aFxyXG5cdFx0Y2FuZGlkYXRlX2RpbWVuc2lvbnMgPSBbXVxyXG5cdFx0Zm9yIG51bWJlck9mQ29sdW1ucyBpbiBbMC4ubGVuXVxyXG5cdFx0XHRuX3Jvd3MgPSBsZW4gLyBudW1iZXJPZkNvbHVtbnNcclxuXHRcdFx0aWYgbl9yb3dzIGlzIE1hdGgucm91bmQgbl9yb3dzXHJcblx0XHRcdFx0Y2FuZGlkYXRlX2RpbWVuc2lvbnMucHVzaCBbbl9yb3dzLCBudW1iZXJPZkNvbHVtbnNdXHJcblx0XHRcclxuXHRcdHNxdWFyZXN0ID0gWzAsIDM0OTUwOTNdXHJcblx0XHRmb3IgY2QgaW4gY2FuZGlkYXRlX2RpbWVuc2lvbnNcclxuXHRcdFx0aWYgTWF0aC5hYnMoY2RbMF0gLSBjZFsxXSkgPCBNYXRoLmFicyhzcXVhcmVzdFswXSAtIHNxdWFyZXN0WzFdKVxyXG5cdFx0XHRcdHNxdWFyZXN0ID0gY2RcclxuXHRcdFxyXG5cdFx0QG51bWJlck9mQ29sdW1ucyA9IHNxdWFyZXN0WzFdXHJcblx0IyMjXHJcbiIsIlxyXG4jIExvYWQgYSBDb2xvclNjaGVtZXIgcGFsZXR0ZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdHZlcnNpb24gPSBici5yZWFkVUludDE2KCkgIyBvciBzb21ldGhpbmdcclxuXHRsZW5ndGggPSBici5yZWFkVUludDE2KClcclxuXHRpID0gMFxyXG5cdHdoaWxlIGkgPCBsZW5ndGhcclxuXHRcdGJyLnNlZWsoOCArIGkgKiAyNilcclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRpICs9IDFcclxuXHJcblx0cGFsZXR0ZVxyXG5cclxuIiwiXHJcbiMgTG9hZCBhIEdJTVAgcGFsZXR0ZVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBcIkdJTVAgUGFsZXR0ZVwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYSBHSU1QIFBhbGV0dGVcIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0aSA9IDFcclxuXHR3aGlsZSAoaSArPSAxKSA8IGxpbmVzLmxlbmd0aFxyXG5cdFx0bGluZSA9IGxpbmVzW2ldXHJcblx0XHRcclxuXHRcdGlmIGxpbmVbMF0gaXMgXCIjXCIgb3IgbGluZSBpcyBcIlwiIHRoZW4gY29udGludWVcclxuXHRcdCMgVE9ETzogaGFuZGxlIG5vbi1zdGFydC1vZi1saW5lIGNvbW1lbnRzPyB3aGVyZSdzIHRoZSBzcGVjP1xyXG5cdFx0XHJcblx0XHRtID0gbGluZS5tYXRjaCgvTmFtZTpcXHMqKC4qKS8pXHJcblx0XHRpZiBtXHJcblx0XHRcdHBhbGV0dGUubmFtZSA9IG1bMV1cclxuXHRcdFx0Y29udGludWVcclxuXHRcdG0gPSBsaW5lLm1hdGNoKC9Db2x1bW5zOlxccyooLiopLylcclxuXHRcdGlmIG1cclxuXHRcdFx0cGFsZXR0ZS5udW1iZXJPZkNvbHVtbnMgPSBOdW1iZXIobVsxXSlcclxuXHRcdFx0IyBUT0RPOiBoYW5kbGUgMCBhcyBub3Qgc3BlY2lmaWVkPyB3aGVyZSdzIHRoZSBzcGVjIGF0LCB5bz9cclxuXHRcdFx0cGFsZXR0ZS5nZW9tZXRyeVNwZWNpZmllZEJ5RmlsZSA9IHllc1xyXG5cdFx0XHRjb250aW51ZVxyXG5cdFx0XHJcblx0XHQjIFRPRE86IHJlcGxhY2UgXFxzIHdpdGggW1xcIFxcdF0gKHNwYWNlcyBvciB0YWJzKVxyXG5cdFx0IyBpdCBjYW4ndCBtYXRjaCBcXG4gYmVjYXVzZSBpdCdzIGFscmVhZHkgc3BsaXQgb24gdGhhdCwgYnV0IHN0aWxsXHJcblx0XHQjIFRPRE86IGhhbmRsZSBsaW5lIHdpdGggbm8gbmFtZSBidXQgc3BhY2Ugb24gdGhlIGVuZFxyXG5cdFx0cl9nX2JfbmFtZSA9IGxpbmUubWF0Y2goLy8vXHJcblx0XHRcdF4gIyBcImF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpbmUsXCJcclxuXHRcdFx0XFxzKiAjIFwiZ2l2ZSBvciB0YWtlIHNvbWUgc3BhY2VzLFwiXHJcblx0XHRcdCMgbWF0Y2ggMyBncm91cHMgb2YgbnVtYmVycyBzZXBhcmF0ZWQgYnkgc3BhY2VzXHJcblx0XHRcdChbMC05XSspICMgcmVkXHJcblx0XHRcdFxccytcclxuXHRcdFx0KFswLTldKykgIyBncmVlblxyXG5cdFx0XHRcXHMrXHJcblx0XHRcdChbMC05XSspICMgYmx1ZVxyXG5cdFx0XHQoPzpcclxuXHRcdFx0XHRcXHMrXHJcblx0XHRcdFx0KC4qKSAjIG9wdGlvbmFsbHkgYSBuYW1lXHJcblx0XHRcdCk/XHJcblx0XHRcdCQgIyBcImFuZCB0aGF0IHNob3VsZCBiZSB0aGUgZW5kIG9mIHRoZSBsaW5lXCJcclxuXHRcdC8vLylcclxuXHRcdGlmIG5vdCByX2dfYl9uYW1lXHJcblx0XHRcdHRocm93IG5ldyBFcnJvciBcIkxpbmUgI3tpfSBkb2Vzbid0IG1hdGNoIHBhdHRlcm4gI3tyX2dfYl9uYW1lfVwiICMgVE9ETzogYmV0dGVyIG1lc3NhZ2U/XHJcblx0XHRcclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IHJfZ19iX25hbWVbMV1cclxuXHRcdFx0Zzogcl9nX2JfbmFtZVsyXVxyXG5cdFx0XHRiOiByX2dfYl9uYW1lWzNdXHJcblx0XHRcdG5hbWU6IHJfZ19iX25hbWVbNF1cclxuXHRcdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgRGV0ZWN0IENTUyBjb2xvcnMgKGV4Y2VwdCBuYW1lZCBjb2xvcnMpXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZXMgPSBbXHJcblx0XHRwYWxldHRlX3hSUkdHQkIgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX3hSR0IgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX3JnYiA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfaHNsID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9oc2xhID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9yZ2JhID0gbmV3IFBhbGV0dGUoKVxyXG5cdF1cclxuXHRcclxuXHRoZXggPSAoeCktPiBwYXJzZUludCh4LCAxNilcclxuXHRcclxuXHQjIFRPRE86IHN1cHBvcnQgMHhGRkYgc3R5bGUsIGJ1dCBkZXByaW9yaXRpemUgaXQgaWYgQ1NTLXN0eWxlIGNvbG9ycyBhcmUgcHJlc2VudFxyXG5cdCMgLi4uYnV0IHdoYXQgb3JkZXIgb2YgY29tcG9uZW50cyBzaG91bGQgYmUgYXNzdW1lZCB0aGVyZT8gbWF5YmUganVzdCBrZWVwIHRvIENTU1xyXG5cclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRcXCMgIyBoYXNodGFnICMgIy9cclxuXHRcdChcclxuXHRcdFx0WzAtOUEtRl17M30gIyB0aHJlZSBoZXgtZGlnaXRzICgjQTBDKVxyXG5cdFx0XHR8XHJcblx0XHRcdFswLTlBLUZdezZ9ICMgc2l4IGhleC1kaWdpdHMgKCNBQTAwQ0MpXHJcblx0XHRcdHxcclxuXHRcdFx0WzAtOUEtRl17NH0gIyB3aXRoIGFscGhhLCBmb3VyIGhleC1kaWdpdHMgKCNBMENGKVxyXG5cdFx0XHR8XHJcblx0XHRcdFswLTlBLUZdezh9ICMgd2l0aCBhbHBoYSwgZWlnaHQgaGV4LWRpZ2l0cyAoI0FBMDBDQ0ZGKVxyXG5cdFx0KVxyXG5cdFx0KD8hWzAtOUEtRl0pICMgKGFuZCBubyBtb3JlISlcclxuXHQvLy9naW0sIChtLCAkMSktPlxyXG5cdFx0aWYgJDEubGVuZ3RoID4gNFxyXG5cdFx0XHRwYWxldHRlX3hSUkdHQkIuYWRkXHJcblx0XHRcdFx0cjogaGV4ICQxWzBdICsgJDFbMV1cclxuXHRcdFx0XHRnOiBoZXggJDFbMl0gKyAkMVszXVxyXG5cdFx0XHRcdGI6IGhleCAkMVs0XSArICQxWzVdXHJcblx0XHRcdFx0YTogaWYgJDEubGVuZ3RoIGlzIDggdGhlbiBoZXggJDFbNl0gKyAkMVs3XSBlbHNlIDFcclxuXHRcdGVsc2VcclxuXHRcdFx0cGFsZXR0ZV94UkdCLmFkZFxyXG5cdFx0XHRcdHI6IGhleCAkMVswXSArICQxWzBdXHJcblx0XHRcdFx0ZzogaGV4ICQxWzFdICsgJDFbMV1cclxuXHRcdFx0XHRiOiBoZXggJDFbMl0gKyAkMVsyXVxyXG5cdFx0XHRcdGE6IGlmICQxLmxlbmd0aCBpcyA0IHRoZW4gaGV4ICQxWzNdICsgJDFbM10gZWxzZSAxXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0cmdiXFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgcmVkXHJcblx0XHRcdCglPylcclxuXHRcdFxccyooPzosfFxccylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGdyZWVuXHJcblx0XHRcdCglPylcclxuXHRcdFxccyooPzosfFxccylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGJsdWVcclxuXHRcdFx0KCU/KVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChfbSwgcl92YWwsIHJfdW5pdCwgZ192YWwsIGdfdW5pdCwgYl92YWwsIGJfdW5pdCktPlxyXG5cdFx0cGFsZXR0ZV9yZ2IuYWRkXHJcblx0XHRcdHI6IE51bWJlcihyX3ZhbCkgKiAoaWYgcl91bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXHJcblx0XHRcdGc6IE51bWJlcihnX3ZhbCkgKiAoaWYgZ191bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXHJcblx0XHRcdGI6IE51bWJlcihiX3ZhbCkgKiAoaWYgYl91bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0cmdiYT9cXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyByZWRcclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgZ3JlZW5cclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgYmx1ZVxyXG5cdFx0XHQoJT8pXHJcblx0XHRcXHMqKD86LHwvKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgYWxwaGFcclxuXHRcdFx0KCU/KVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChfbSwgcl92YWwsIHJfdW5pdCwgZ192YWwsIGdfdW5pdCwgYl92YWwsIGJfdW5pdCwgYV92YWwsIGFfdW5pdCktPlxyXG5cdFx0cGFsZXR0ZV9yZ2JhLmFkZFxyXG5cdFx0XHRyOiBOdW1iZXIocl92YWwpICogKGlmIHJfdW5pdCBpcyBcIiVcIiB0aGVuIDI1NS8xMDAgZWxzZSAxKVxyXG5cdFx0XHRnOiBOdW1iZXIoZ192YWwpICogKGlmIGdfdW5pdCBpcyBcIiVcIiB0aGVuIDI1NS8xMDAgZWxzZSAxKVxyXG5cdFx0XHRiOiBOdW1iZXIoYl92YWwpICogKGlmIGJfdW5pdCBpcyBcIiVcIiB0aGVuIDI1NS8xMDAgZWxzZSAxKVxyXG5cdFx0XHRhOiBOdW1iZXIoYV92YWwpICogKGlmIGFfdW5pdCBpcyBcIiVcIiB0aGVuIDEvMTAwIGVsc2UgMSlcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRoc2xcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBodWVcclxuXHRcdFx0KGRlZ3xyYWR8dHVybnwpXHJcblx0XHRcXHMqKD86LHxcXHMpXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBzYXR1cmF0aW9uXHJcblx0XHRcdCglPylcclxuXHRcdFxccyooPzosfFxccylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHZhbHVlXHJcblx0XHRcdCglPylcclxuXHRcdFx0XFxzKlxyXG5cdFx0XFwpXHJcblx0Ly8vZ2ltLCAoX20sIGhfdmFsLCBoX3VuaXQsIHNfdmFsLCBzX3VuaXQsIGxfdmFsLCBsX3VuaXQpLT5cclxuXHRcdHBhbGV0dGVfaHNsLmFkZFxyXG5cdFx0XHRoOiBOdW1iZXIoaF92YWwpICogKGlmIGhfdW5pdCBpcyBcInJhZFwiIHRoZW4gMTgwL01hdGguUEkgZWxzZSBpZiBoX3VuaXQgaXMgXCJ0dXJuXCIgdGhlbiAzNjAgZWxzZSAxKVxyXG5cdFx0XHRzOiBOdW1iZXIoc192YWwpICogKGlmIHNfdW5pdCBpcyBcIiVcIiB0aGVuIDEgZWxzZSAxMDApXHJcblx0XHRcdGw6IE51bWJlcihsX3ZhbCkgKiAoaWYgbF91bml0IGlzIFwiJVwiIHRoZW4gMSBlbHNlIDEwMClcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRoc2xhP1xcKFxyXG5cdFx0XHRcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGh1ZVxyXG5cdFx0XHQoZGVnfHJhZHx0dXJufClcclxuXHRcdFxccyooPzosfFxccylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHNhdHVyYXRpb25cclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgdmFsdWVcclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8LylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGFscGhhXHJcblx0XHRcdCglPylcclxuXHRcdFx0XFxzKlxyXG5cdFx0XFwpXHJcblx0Ly8vZ2ltLCAoX20sIGhfdmFsLCBoX3VuaXQsIHNfdmFsLCBzX3VuaXQsIGxfdmFsLCBsX3VuaXQsIGFfdmFsLCBhX3VuaXQpLT5cclxuXHRcdHBhbGV0dGVfaHNsYS5hZGRcclxuXHRcdFx0aDogTnVtYmVyKGhfdmFsKSAqIChpZiBoX3VuaXQgaXMgXCJyYWRcIiB0aGVuIDE4MC9NYXRoLlBJIGVsc2UgaWYgaF91bml0IGlzIFwidHVyblwiIHRoZW4gMzYwIGVsc2UgMSlcclxuXHRcdFx0czogTnVtYmVyKHNfdmFsKSAqIChpZiBzX3VuaXQgaXMgXCIlXCIgdGhlbiAxIGVsc2UgMTAwKVxyXG5cdFx0XHRsOiBOdW1iZXIobF92YWwpICogKGlmIGxfdW5pdCBpcyBcIiVcIiB0aGVuIDEgZWxzZSAxMDApXHJcblx0XHRcdGE6IE51bWJlcihhX3ZhbCkgKiAoaWYgYV91bml0IGlzIFwiJVwiIHRoZW4gMS8xMDAgZWxzZSAxKVxyXG5cdFxyXG5cdG1vc3RfY29sb3JzID0gW11cclxuXHRmb3IgcGFsZXR0ZSBpbiBwYWxldHRlc1xyXG5cdFx0aWYgcGFsZXR0ZS5sZW5ndGggPj0gbW9zdF9jb2xvcnMubGVuZ3RoXHJcblx0XHRcdG1vc3RfY29sb3JzID0gcGFsZXR0ZVxyXG5cdFxyXG5cdG4gPSBtb3N0X2NvbG9ycy5sZW5ndGhcclxuXHRpZiBuIDwgNFxyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFtcclxuXHRcdFx0XCJObyBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgb25lIGNvbG9yIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IGEgY291cGxlIGNvbG9ycyBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBhIGZldyBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XVtuXSArIFwiICgje259KVwiKVxyXG5cdFxyXG5cdG1vc3RfY29sb3JzXHJcbiIsIlxyXG4jIFdoYXQgZG9lcyBIUEwgc3RhbmQgZm9yP1xyXG4jIEhvd2R5LCBQYWxldHRlIExvdmVycyFcclxuXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdGlmIGxpbmVzWzBdIGlzbnQgXCJQYWxldHRlXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhbiBIUEwgcGFsZXR0ZVwiXHJcblx0aWYgbm90IGxpbmVzWzFdLm1hdGNoIC9WZXJzaW9uIFszNF1cXC4wL1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiVW5zdXBwb3J0ZWQgSFBMIHZlcnNpb25cIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHJcblx0Zm9yIGxpbmUsIGkgaW4gbGluZXNcclxuXHRcdGlmIGxpbmUubWF0Y2ggLy4rIC4qIC4rL1xyXG5cdFx0XHRyZ2IgPSBsaW5lLnNwbGl0KFwiIFwiKVxyXG5cdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdHI6IHJnYlswXVxyXG5cdFx0XHRcdGc6IHJnYlsxXVxyXG5cdFx0XHRcdGI6IHJnYlsyXVxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIFBhaW50Lk5FVCBwYWxldHRlIGZpbGVcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRcclxuXHRoZXggPSAoeCktPiBwYXJzZUludCh4LCAxNilcclxuXHRcclxuXHRmb3IgbGluZSBpbiBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRcdG0gPSBsaW5lLm1hdGNoKC9eKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KSQvaSlcclxuXHRcdGlmIG0gdGhlbiBwYWxldHRlLmFkZFxyXG5cdFx0XHRhOiBoZXggbVsxXVxyXG5cdFx0XHRyOiBoZXggbVsyXVxyXG5cdFx0XHRnOiBoZXggbVszXVxyXG5cdFx0XHRiOiBoZXggbVs0XVxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIEpBU0MgUEFMIGZpbGUgKFBhaW50IFNob3AgUHJvIHBhbGV0dGUgZmlsZSlcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IFwiSkFTQy1QQUxcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiTm90IGEgSkFTQy1QQUxcIlxyXG5cdGlmIGxpbmVzWzFdIGlzbnQgXCIwMTAwXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVua25vd24gSkFTQy1QQUwgdmVyc2lvblwiXHJcblx0aWYgbGluZXNbMl0gaXNudCBcIjI1NlwiXHJcblx0XHRcInRoYXQncyBva1wiXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHQjbl9jb2xvcnMgPSBOdW1iZXIobGluZXNbMl0pXHJcblx0XHJcblx0Zm9yIGxpbmUsIGkgaW4gbGluZXNcclxuXHRcdGlmIGxpbmUgaXNudCBcIlwiIGFuZCBpID4gMlxyXG5cdFx0XHRyZ2IgPSBsaW5lLnNwbGl0KFwiIFwiKVxyXG5cdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdHI6IHJnYlswXVxyXG5cdFx0XHRcdGc6IHJnYlsxXVxyXG5cdFx0XHRcdGI6IHJnYlsyXVxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIFJlc291cmNlIEludGVyY2hhbmdlIEZpbGUgRm9ybWF0IFBBTCBmaWxlXHJcblxyXG4jIHBvcnRlZCBmcm9tIEMjIGNvZGUgYXQgaHR0cHM6Ly93b3JtczJkLmluZm8vUGFsZXR0ZV9maWxlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdCMgUklGRiBoZWFkZXJcclxuXHRyaWZmID0gYnIucmVhZFN0cmluZyg0KSAjIFwiUklGRlwiXHJcblx0ZGF0YVNpemUgPSBici5yZWFkVUludDMyKClcclxuXHR0eXBlID0gYnIucmVhZFN0cmluZyg0KSAjIFwiUEFMIFwiXHJcblx0XHJcblx0aWYgcmlmZiBpc250IFwiUklGRlwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJSSUZGIGhlYWRlciBub3QgZm91bmQ7IG5vdCBhIFJJRkYgUEFMIGZpbGVcIlxyXG5cdFxyXG5cdGlmIHR5cGUgaXNudCBcIlBBTCBcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiXCJcIlxyXG5cdFx0XHRSSUZGIGhlYWRlciBzYXlzIHRoaXMgaXNuJ3QgYSBQQUwgZmlsZSxcclxuXHRcdFx0bW9yZSBvZiBhIHNvcnQgb2YgI3soKHR5cGUrXCJcIikudHJpbSgpKX0gZmlsZVxyXG5cdFx0XCJcIlwiXHJcblx0XHJcblx0IyBEYXRhIGNodW5rXHJcblx0Y2h1bmtUeXBlID0gYnIucmVhZFN0cmluZyg0KSAjIFwiZGF0YVwiXHJcblx0Y2h1bmtTaXplID0gYnIucmVhZFVJbnQzMigpXHJcblx0cGFsVmVyc2lvbiA9IGJyLnJlYWRVSW50MTYoKSAjIDB4MDMwMFxyXG5cdHBhbE51bUVudHJpZXMgPSBici5yZWFkVUludDE2KClcclxuXHRcclxuXHRcclxuXHRpZiBjaHVua1R5cGUgaXNudCBcImRhdGFcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiRGF0YSBjaHVuayBub3QgZm91bmQgKC4uLicje2NodW5rVHlwZX0nPylcIlxyXG5cdFxyXG5cdGlmIHBhbFZlcnNpb24gaXNudCAweDAzMDBcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVuc3VwcG9ydGVkIFBBTCBmaWxlIGZvcm1hdCB2ZXJzaW9uOiAweCN7cGFsVmVyc2lvbi50b1N0cmluZygxNil9XCJcclxuXHRcclxuXHQjIENvbG9yc1xyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0aSA9IDBcclxuXHR3aGlsZSAoaSArPSAxKSA8IHBhbE51bUVudHJpZXMgLSAxXHJcblx0XHRcclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdF86IGJyLnJlYWRCeXRlKCkgIyBcImZsYWdzXCIsIGFsd2F5cyAweDAwXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBQQUwgKFN0YXJDcmFmdCByYXcgcGFsZXR0ZSlcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHRmb3IgaSBpbiBbMC4uLjI1NV1cclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdCM6IG5vIHBhZGRpbmdcclxuXHRcclxuXHQjPyBwYWxldHRlLm51bWJlck9mQ29sdW1ucyA9IDE2XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBXUEUgKFN0YXJDcmFmdCBwYWRkZWQgcmF3IHBhbGV0dGUpXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0Zm9yIGkgaW4gWzAuLi4yNTVdXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRfOiBici5yZWFkQnl0ZSgpICMgcGFkZGluZ1xyXG5cdFxyXG5cdHBhbGV0dGUubnVtYmVyT2ZDb2x1bW5zID0gMTZcclxuXHRwYWxldHRlXHJcbiIsIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4vUGFsZXR0ZVwiXHJcbkNvbG9yID0gcmVxdWlyZSBcIi4vQ29sb3JcIlxyXG5cclxuY2xhc3MgUmFuZG9tQ29sb3IgZXh0ZW5kcyBDb2xvclxyXG5cdGNvbnN0cnVjdG9yOiAtPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QHJhbmRvbWl6ZSgpXHJcblx0XHJcblx0cmFuZG9taXplOiAtPlxyXG5cdFx0QGggPSBNYXRoLnJhbmRvbSgpICogMzYwXHJcblx0XHRAcyA9IE1hdGgucmFuZG9tKCkgKiAxMDBcclxuXHRcdEBsID0gTWF0aC5yYW5kb20oKSAqIDEwMFxyXG5cdFxyXG5cdHRvU3RyaW5nOiAtPlxyXG5cdFx0QHJhbmRvbWl6ZSgpXHJcblx0XHRcImhzbCgje0BofSwgI3tAc30lLCAje0BsfSUpXCJcclxuXHRcclxuXHRpczogLT4gbm9cclxuXHJcbmNsYXNzIFJhbmRvbVBhbGV0dGUgZXh0ZW5kcyBQYWxldHRlXHJcblx0Y29uc3RydWN0b3I6IC0+XHJcblx0XHRzdXBlcigpXHJcblx0XHRAbG9hZGVyID1cclxuXHRcdFx0bmFtZTogXCJDb21wbGV0ZWx5IFJhbmRvbSBDb2xvcnPihKJcIlxyXG5cdFx0XHRmaWxlRXh0ZW5zaW9uczogW11cclxuXHRcdFx0ZmlsZUV4dGVuc2lvbnNQcmV0dHk6IFwiKC5jcmMgc2pmKERmMDlzamRma3NkbGZtbm0gJzsnO1wiXHJcblx0XHRAbWF0Y2hlZExvYWRlckZpbGVFeHRlbnNpb25zID0gbm9cclxuXHRcdEBjb25maWRlbmNlID0gMFxyXG5cdFx0QGZpbmFsaXplKClcclxuXHRcdGZvciBpIGluIFswLi5NYXRoLnJhbmRvbSgpKjE1KzVdXHJcblx0XHRcdEBwdXNoIG5ldyBSYW5kb21Db2xvcigpXHJcblxyXG5jbGFzcyBMb2FkaW5nRXJyb3JzIGV4dGVuZHMgRXJyb3JcclxuXHRjb25zdHJ1Y3RvcjogKEBlcnJvcnMpLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEBtZXNzYWdlID0gXCJTb21lIGVycm9ycyB3ZXJlIGVuY291bnRlcmVkIHdoZW4gbG9hZGluZzpcIiArXHJcblx0XHRcdGZvciBlcnJvciBpbiBAZXJyb3JzXHJcblx0XHRcdFx0XCJcXG5cXHRcIiArIGVycm9yLm1lc3NhZ2VcclxuXHJcbmxvYWRfcGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxyXG5cdFxyXG5cdHBhbGV0dGVfbG9hZGVycyA9IFtcclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJQYWludCBTaG9wIFBybyBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wicGFsXCIsIFwicHNwcGFsZXR0ZVwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50U2hvcFByb1wiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUklGRiBQQUxcIlxyXG5cdFx0XHRleHRzOiBbXCJwYWxcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9SSUZGXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJDb2xvclNjaGVtZXIgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImNzXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQ29sb3JTY2hlbWVyXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJQYWludC5ORVQgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInR4dFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50Lk5FVFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiR0lNUCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiZ3BsXCIsIFwiZ2ltcFwiLCBcImNvbG9yc1wiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0dJTVBcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkNTUy1zdHlsZSBjb2xvcnNcIlxyXG5cdFx0XHRleHRzOiBbXCJjc3NcIiwgXCJzY3NzXCIsIFwic2Fzc1wiLCBcImxlc3NcIiwgXCJzdHlsXCIsIFwiaHRtbFwiLCBcImh0bVwiLCBcInN2Z1wiLCBcImpzXCIsIFwidHNcIiwgXCJ4bWxcIiwgXCJ0eHRcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9HZW5lcmljXCJcclxuXHRcdH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgU3dhdGNoXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY29cIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JTd2F0Y2hcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIFRhYmxlXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY3RcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JUYWJsZVwiXHJcblx0XHQjIH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgU3dhdGNoIEV4Y2hhbmdlXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhc2VcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlU3dhdGNoRXhjaGFuZ2VcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIEJvb2tcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjYlwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvckJvb2tcIlxyXG5cdFx0IyB9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiSFBMIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJocGxcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9IUExcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlN0YXJDcmFmdCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wicGFsXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvU3RhckNyYWZ0XCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJTdGFyQ3JhZnQgdGVycmFpbiBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wid3BlXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvU3RhckNyYWZ0UGFkZGVkXCJcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBdXRvQ0FEIENvbG9yIEJvb2tcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjYlwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQXV0b0NBRENvbG9yQm9va1wiXHJcblx0XHQjIH1cclxuXHRcdFxyXG5cdFx0IyB7XHJcblx0XHQjIFx0IyAoc2FtZSBhcyBQYWludCBTaG9wIFBybyBwYWxldHRlPylcclxuXHRcdCMgXHRuYW1lOiBcIkNvcmVsRFJBVyBwYWxldHRlXCJcclxuXHRcdCMgXHRleHRzOiBbXCJwYWxcIiwgXCJjcGxcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0NvcmVsRFJBV1wiXHJcblx0XHQjIH1cclxuXHRdXHJcblx0XHJcblx0IyBmaW5kIHBhbGV0dGUgbG9hZGVycyB0aGF0IHVzZSB0aGlzIGZpbGUgZXh0ZW5zaW9uXHJcblx0Zm9yIHBsIGluIHBhbGV0dGVfbG9hZGVyc1xyXG5cdFx0cGwubWF0Y2hlc19leHQgPSBwbC5leHRzLmluZGV4T2Yoby5maWxlRXh0KSBpc250IC0xXHJcblx0XHJcblx0IyBtb3ZlIHBhbGV0dGUgbG9hZGVycyB0byB0aGUgYmVnaW5uaW5nIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cclxuXHRwYWxldHRlX2xvYWRlcnMuc29ydCAocGwxLCBwbDIpLT5cclxuXHRcdHBsMi5tYXRjaGVzX2V4dCAtIHBsMS5tYXRjaGVzX2V4dFxyXG5cdFxyXG5cdCMgdHJ5IGxvYWRpbmcgc3R1ZmZcclxuXHRlcnJvcnMgPSBbXVxyXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcclxuXHRcdFxyXG5cdFx0dHJ5XHJcblx0XHRcdHBhbGV0dGUgPSBwbC5sb2FkKG8pXHJcblx0XHRcdGlmIHBhbGV0dGUubGVuZ3RoIGlzIDBcclxuXHRcdFx0XHRwYWxldHRlID0gbnVsbFxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIm5vIGNvbG9ycyByZXR1cm5lZFwiXHJcblx0XHRjYXRjaCBlXHJcblx0XHRcdG1zZyA9IFwiZmFpbGVkIHRvIGxvYWQgI3tvLmZpbGVOYW1lfSBhcyAje3BsLm5hbWV9OiAje2UubWVzc2FnZX1cIlxyXG5cdFx0XHQjIGlmIHBsLm1hdGNoZXNfZXh0IGFuZCBub3QgZS5tZXNzYWdlLm1hdGNoKC9ub3QgYS9pKVxyXG5cdFx0XHQjIFx0Y29uc29sZT8uZXJyb3I/IG1zZ1xyXG5cdFx0XHQjIGVsc2VcclxuXHRcdFx0IyBcdGNvbnNvbGU/Lndhcm4/IG1zZ1xyXG5cdFx0XHRcclxuXHRcdFx0IyBUT0RPOiBtYXliZSB0aGlzIHNob3VsZG4ndCBiZSBhbiBFcnJvciBvYmplY3QsIGp1c3QgYSB7bWVzc2FnZSwgZXJyb3J9IG9iamVjdFxyXG5cdFx0XHQjIG9yIHtmcmllbmRseU1lc3NhZ2UsIGVycm9yfVxyXG5cdFx0XHRlcnIgPSBuZXcgRXJyb3IgbXNnXHJcblx0XHRcdGVyci5lcnJvciA9IGVcclxuXHRcdFx0ZXJyb3JzLnB1c2ggZXJyXHJcblx0XHRcclxuXHRcdGlmIHBhbGV0dGVcclxuXHRcdFx0IyBjb25zb2xlPy5pbmZvPyBcImxvYWRlZCAje28uZmlsZU5hbWV9IGFzICN7cGwubmFtZX1cIlxyXG5cdFx0XHRwYWxldHRlLmNvbmZpZGVuY2UgPSBpZiBwbC5tYXRjaGVzX2V4dCB0aGVuIDAuOSBlbHNlIDAuMDFcclxuXHRcdFx0ZXh0c19wcmV0dHkgPSBcIi4je3BsLmV4dHMuam9pbihcIiwgLlwiKX1cIlxyXG5cdFx0XHRcclxuXHRcdFx0IyBUT0RPOiBwcm9iYWJseSByZW5hbWUgbG9hZGVyIC0+IGZvcm1hdCB3aGVuIDItd2F5IGRhdGEgZmxvdyAocmVhZC93cml0ZSkgaXMgc3VwcG9ydGVkXHJcblx0XHRcdCMgVE9ETzogbWF5YmUgbWFrZSB0aGlzIGEgM3JkIChhbmQgZm91cnRoPykgYXJndW1lbnQgdG8gdGhlIGNhbGxiYWNrXHJcblx0XHRcdHBhbGV0dGUubG9hZGVyID1cclxuXHRcdFx0XHRuYW1lOiBwbC5uYW1lXHJcblx0XHRcdFx0ZmlsZUV4dGVuc2lvbnM6IHBsLmV4dHNcclxuXHRcdFx0XHRmaWxlRXh0ZW5zaW9uc1ByZXR0eTogZXh0c19wcmV0dHlcclxuXHRcdFx0cGFsZXR0ZS5tYXRjaGVkTG9hZGVyRmlsZUV4dGVuc2lvbnMgPSBwbC5tYXRjaGVzX2V4dFxyXG5cdFx0XHRcclxuXHRcdFx0cGFsZXR0ZS5maW5hbGl6ZSgpXHJcblx0XHRcdGNhbGxiYWNrKG51bGwsIHBhbGV0dGUpXHJcblx0XHRcdHJldHVyblxyXG5cdFxyXG5cdGNhbGxiYWNrKG5ldyBMb2FkaW5nRXJyb3JzKGVycm9ycykpXHJcblx0cmV0dXJuXHJcblxyXG5ub3JtYWxpemVfb3B0aW9ucyA9IChvID0ge30pLT5cclxuXHRpZiB0eXBlb2YgbyBpcyBcInN0cmluZ1wiIG9yIG8gaW5zdGFuY2VvZiBTdHJpbmdcclxuXHRcdG8gPSBmaWxlUGF0aDogb1xyXG5cdGlmIEZpbGU/IGFuZCBvIGluc3RhbmNlb2YgRmlsZVxyXG5cdFx0byA9IGZpbGU6IG9cclxuXHRcclxuXHQjIG8ubWluQ29sb3JzID89IDJcclxuXHQjIG8ubWF4Q29sb3JzID89IDI1NlxyXG5cdG8uZmlsZU5hbWUgPz0gby5maWxlPy5uYW1lID8gKGlmIG8uZmlsZVBhdGggdGhlbiByZXF1aXJlKFwicGF0aFwiKS5iYXNlbmFtZShvLmZpbGVQYXRoKSlcclxuXHRvLmZpbGVFeHQgPz0gXCIje28uZmlsZU5hbWV9XCIuc3BsaXQoXCIuXCIpLnBvcCgpXHJcblx0by5maWxlRXh0ID0gXCIje28uZmlsZUV4dH1cIi50b0xvd2VyQ2FzZSgpXHJcblx0b1xyXG5cclxuQW55UGFsZXR0ZSA9IHtcclxuXHRDb2xvclxyXG5cdFBhbGV0dGVcclxuXHRSYW5kb21Db2xvclxyXG5cdFJhbmRvbVBhbGV0dGVcclxuXHQjIExvYWRpbmdFcnJvcnNcclxufVxyXG5cclxuIyBHZXQgcGFsZXR0ZSBmcm9tIGEgZmlsZVxyXG5BbnlQYWxldHRlLmxvYWRQYWxldHRlID0gKG8sIGNhbGxiYWNrKS0+XHJcblx0aWYgbm90IG9cclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlBhcmFtZXRlcnMgcmVxdWlyZWQ6IEFueVBhbGV0dGUubG9hZFBhbGV0dGUob3B0aW9ucywgZnVuY3Rpb24gY2FsbGJhY2soZXJyLCBwYWxldHRlKXt9KVwiXHJcblx0aWYgbm90IGNhbGxiYWNrXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJDYWxsYmFjayByZXF1aXJlZDogQW55UGFsZXR0ZS5sb2FkUGFsZXR0ZShvcHRpb25zLCBmdW5jdGlvbiBjYWxsYmFjayhlcnIsIHBhbGV0dGUpe30pXCJcclxuXHRcclxuXHRvID0gbm9ybWFsaXplX29wdGlvbnMgb1xyXG5cdFxyXG5cdGlmIG8uZGF0YVxyXG5cdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdGVsc2UgaWYgRmlsZT8gYW5kIG8uZmlsZSBpbnN0YW5jZW9mIEZpbGVcclxuXHRcdGZyID0gbmV3IEZpbGVSZWFkZXJcclxuXHRcdGZyLm9ubG9hZCA9IC0+XHJcblx0XHRcdG8uZGF0YSA9IGZyLnJlc3VsdFxyXG5cdFx0XHRsb2FkX3BhbGV0dGUobywgY2FsbGJhY2spXHJcblx0XHRmci5yZWFkQXNCaW5hcnlTdHJpbmcgby5maWxlXHJcblx0ZWxzZSBpZiBvLmZpbGVQYXRoP1xyXG5cdFx0ZnMgPSByZXF1aXJlIFwiZnNcIlxyXG5cdFx0ZnMucmVhZEZpbGUgby5maWxlUGF0aCwgKGVyciwgZGF0YSktPlxyXG5cdFx0XHRpZiBlcnJcclxuXHRcdFx0XHRjYWxsYmFjayhlcnIpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRvLmRhdGEgPSBkYXRhLnRvU3RyaW5nKFwiYmluYXJ5XCIpXHJcblx0XHRcdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdGVsc2VcclxuXHRcdGNhbGxiYWNrKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkLiBUaGUgRmlsZSBBUEkgbWF5IG5vdCBiZSBzdXBwb3J0ZWQuXCIpKSAjIHVtLi4uXHJcblx0XHQjIHRoZSBGaWxlIEFQSSB3b3VsZCBiZSBzdXBwb3J0ZWQgaWYgeW91J3ZlIHBhc3NlZCBhIEZpbGVcclxuXHRcdCMgVE9ETzogYSBiZXR0ZXIgZXJyb3IgbWVzc2FnZSwgYWJvdXQgb3B0aW9ucyAobm90KSBwYXNzZWRcclxuXHJcblxyXG4jIEdldCBhIHBhbGV0dGUgZnJvbSBhIGZpbGUgb3IgYnkgYW55IG1lYW5zIG5lY2Vzc2FyeVxyXG4jIChhcyBpbiBmYWxsIGJhY2sgdG8gY29tcGxldGVseSByYW5kb20gZGF0YSlcclxuQW55UGFsZXR0ZS5naW1tZUFQYWxldHRlID0gKG8sIGNhbGxiYWNrKS0+XHJcblx0byA9IG5vcm1hbGl6ZV9vcHRpb25zIG9cclxuXHRcclxuXHRBbnlQYWxldHRlLmxvYWRQYWxldHRlIG8sIChlcnIsIHBhbGV0dGUpLT5cclxuXHRcdGNhbGxiYWNrKG51bGwsIHBhbGV0dGUgPyBuZXcgUmFuZG9tUGFsZXR0ZSlcclxuXHJcbiMgRXhwb3J0c1xyXG5tb2R1bGUuZXhwb3J0cyA9IEFueVBhbGV0dGVcclxuIl19
