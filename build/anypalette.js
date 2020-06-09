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
  data.replace(/\#([0-9A-F]{2})?([0-9A-F]{3})([0-9A-F]{3})?(?![0-9A-F])/gim, function(m, $0, $1, $2) { // hashtag # #/
    // alpha
    // three digits (#A0C)
    // six digits (#AA00CC)
    // (and no more!)
    var alpha, xRGB;
    alpha = hex($0);
    if ($2) {
      xRGB = $1 + $2;
      return palette_xRRGGBB.add({
        r: hex(xRGB[0] + xRGB[1]),
        g: hex(xRGB[2] + xRGB[3]),
        b: hex(xRGB[4] + xRGB[5]),
        a: alpha
      });
    } else {
      xRGB = $1;
      return palette_xRGB.add({
        r: hex(xRGB[0] + xRGB[0]),
        g: hex(xRGB[1] + xRGB[1]),
        b: hex(xRGB[2] + xRGB[2]),
        a: alpha
      });
    }
  });
  data.replace(/rgb\(\s*([0-9]{1,3}),\s*([0-9]{1,3}),\s*([0-9]{1,3})\s*\)/gim, function(m) { // red
    // green
    // blue
    return palette_rgb.add({
      r: Number(m[1]),
      g: Number(m[2]),
      b: Number(m[3])
    });
  });
  data.replace(/rgba\(\s*([0-9]{1,3}),\s*([0-9]{1,3}),\s*([0-9]{1,3}),\s*([0-9]{1,3}|0\.[0-9]+)\s*\)/gim, function(m) { // red
    // green
    // blue
    // alpha
    return palette_rgb.add({
      r: Number(m[1]),
      g: Number(m[2]),
      b: Number(m[3]),
      a: Number(m[4])
    });
  });
  data.replace(/hsl\(\s*([0-9]{1,3}),\s*([0-9]{1,3}),\s*([0-9]{1,3})\s*\)/gim, function(m) { // hue
    // saturation
    // value
    return palette_rgb.add({
      h: Number(m[1]),
      s: Number(m[2]),
      l: Number(m[3])
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQmluYXJ5UmVhZGVyLmNvZmZlZSIsInNyYy9Db2xvci5jb2ZmZWUiLCJzcmMvUGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbG9hZGVycy9Db2xvclNjaGVtZXIuY29mZmVlIiwic3JjL2xvYWRlcnMvR0lNUC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9HZW5lcmljLmNvZmZlZSIsInNyYy9sb2FkZXJzL0hQTC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9QYWludC5ORVQuY29mZmVlIiwic3JjL2xvYWRlcnMvUGFpbnRTaG9wUHJvLmNvZmZlZSIsInNyYy9sb2FkZXJzL1JJRkYuY29mZmVlIiwic3JjL2xvYWRlcnMvU3RhckNyYWZ0LmNvZmZlZSIsInNyYy9sb2FkZXJzL1N0YXJDcmFmdFBhZGRlZC5jb2ZmZWUiLCJzcmMvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNhSTs7Ozs7Ozs7Ozs7OztBQUFBLElBQUE7O0FBRUYsTUFBTSxDQUFDLE9BQVAsR0FDTTtFQUFOLE1BQUEsYUFBQTtJQUNBLFdBQWEsQ0FBQyxJQUFELENBQUE7TUFDWixJQUFDLENBQUEsT0FBRCxHQUFXO01BQ1gsSUFBQyxDQUFBLElBQUQsR0FBUTtJQUZJLENBQWQ7OztJQU1DLFFBQVUsQ0FBQSxDQUFBO0FBQ1gsVUFBQTtNQUFFLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBWjtNQUNBLEVBQUEsR0FBSyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQWIsQ0FBd0IsSUFBQyxDQUFBLElBQXpCLENBQUEsR0FBaUM7TUFDdEMsSUFBQyxDQUFBLElBQUQsSUFBUzthQUNULEVBQUEsR0FBSztJQUpJOztJQU1WLGlCQUFtQixDQUFBLENBQUE7QUFDcEIsVUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUE7TUFBRSxNQUFBLEdBQVMsSUFBQyxDQUFBLFVBQUQsQ0FBQSxFQUFYOztN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RUFBRSxDQUFDLE1BQUgsR0FBWSxRQUFBLENBQUEsQ0FBQTtNQUNYLENBQUMsQ0FBQyxJQUFGLEdBQVMsRUFBRSxDQUFDO2FBQ1osWUFBQSxDQUFhLENBQWIsRUFBZ0IsUUFBaEI7SUFGVztXQUdaLEVBQUUsQ0FBQyxrQkFBSCxDQUFzQixDQUFDLENBQUMsSUFBeEIsRUFMSTtHQUFBLE1BTUEsSUFBRyxrQkFBSDtJQUNKLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjtXQUNMLEVBQUUsQ0FBQyxRQUFILENBQVksQ0FBQyxDQUFDLFFBQWQsRUFBd0IsUUFBQSxDQUFDLEdBQUQsRUFBTSxJQUFOLENBQUE7TUFDdkIsSUFBRyxHQUFIO2VBQ0MsUUFBQSxDQUFTLEdBQVQsRUFERDtPQUFBLE1BQUE7UUFHQyxDQUFDLENBQUMsSUFBRixHQUFTLElBQUksQ0FBQyxRQUFMLENBQWMsUUFBZDtlQUNULFlBQUEsQ0FBYSxDQUFiLEVBQWdCLFFBQWhCLEVBSkQ7O0lBRHVCLENBQXhCLEVBRkk7R0FBQSxNQUFBO1dBU0osUUFBQSxDQUFTLElBQUksS0FBSixDQUFVLG9EQUFWLENBQVQsRUFUSTs7QUFoQm9CLEVBbE0xQjs7Ozs7OztBQWtPQyxVQUFVLENBQUMsYUFBWCxHQUEyQixRQUFBLENBQUMsQ0FBRCxFQUFJLFFBQUosQ0FBQTtFQUMzQixDQUFBLEdBQUksaUJBQUEsQ0FBa0IsQ0FBbEI7U0FFSixVQUFVLENBQUMsV0FBWCxDQUF1QixDQUF2QixFQUEwQixRQUFBLENBQUMsR0FBRCxFQUFNLE9BQU4sQ0FBQTtXQUN6QixRQUFBLENBQVMsSUFBVCxvQkFBZSxVQUFVLElBQUksYUFBSixDQUFBLENBQXpCO0VBRHlCLENBQTFCO0FBSDJCLEVBbE81Qjs7O0FBeU9DLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXHJcbiMjI1xyXG5CaW5hcnlSZWFkZXJcclxuXHJcbk1vZGlmaWVkIGJ5IElzYWlhaCBPZGhuZXJcclxuQFRPRE86IHVzZSBqRGF0YVZpZXcgKyBqQmluYXJ5IGluc3RlYWRcclxuXHJcblJlZmFjdG9yZWQgYnkgVmpldXggPHZqZXV4eEBnbWFpbC5jb20+XHJcbmh0dHA6Ly9ibG9nLnZqZXV4LmNvbS8yMDEwL2phdmFzY3JpcHQvamF2YXNjcmlwdC1iaW5hcnktcmVhZGVyLmh0bWxcclxuXHJcbk9yaWdpbmFsXHJcbisgSm9uYXMgUmFvbmkgU29hcmVzIFNpbHZhXHJcbkAgaHR0cDovL2pzZnJvbWhlbGwuY29tL2NsYXNzZXMvYmluYXJ5LXBhcnNlciBbcmV2LiAjMV1cclxuIyMjXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIEJpbmFyeVJlYWRlclxyXG5cdGNvbnN0cnVjdG9yOiAoZGF0YSktPlxyXG5cdFx0QF9idWZmZXIgPSBkYXRhXHJcblx0XHRAX3BvcyA9IDBcclxuXHJcblx0IyBQdWJsaWMgKGN1c3RvbSlcclxuXHRcclxuXHRyZWFkQnl0ZTogLT5cclxuXHRcdEBfY2hlY2tTaXplKDgpXHJcblx0XHRjaCA9IHRoaXMuX2J1ZmZlci5jaGFyQ29kZUF0KEBfcG9zKSAmIDB4ZmZcclxuXHRcdEBfcG9zICs9IDFcclxuXHRcdGNoICYgMHhmZlxyXG5cdFxyXG5cdHJlYWRVbmljb2RlU3RyaW5nOiAtPlxyXG5cdFx0bGVuZ3RoID0gQHJlYWRVSW50MTYoKVxyXG5cdFx0IyBjb25zb2xlLmxvZyB7bGVuZ3RofVxyXG5cdFx0QF9jaGVja1NpemUobGVuZ3RoICogMTYpXHJcblx0XHRzdHIgPSBcIlwiXHJcblx0XHRmb3IgaSBpbiBbMC4ubGVuZ3RoXVxyXG5cdFx0XHRzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShAX2J1ZmZlci5zdWJzdHIoQF9wb3MsIDEpIHwgKEBfYnVmZmVyLnN1YnN0cihAX3BvcysxLCAxKSA8PCA4KSlcclxuXHRcdFx0QF9wb3MgKz0gMlxyXG5cdFx0c3RyXHJcblx0XHJcblx0IyBQdWJsaWNcclxuXHRcclxuXHRyZWFkSW50ODogLT4gQF9kZWNvZGVJbnQoOCwgdHJ1ZSlcclxuXHRyZWFkVUludDg6IC0+IEBfZGVjb2RlSW50KDgsIGZhbHNlKVxyXG5cdHJlYWRJbnQxNjogLT4gQF9kZWNvZGVJbnQoMTYsIHRydWUpXHJcblx0cmVhZFVJbnQxNjogLT4gQF9kZWNvZGVJbnQoMTYsIGZhbHNlKVxyXG5cdHJlYWRJbnQzMjogLT4gQF9kZWNvZGVJbnQoMzIsIHRydWUpXHJcblx0cmVhZFVJbnQzMjogLT4gQF9kZWNvZGVJbnQoMzIsIGZhbHNlKVxyXG5cclxuXHRyZWFkRmxvYXQ6IC0+IEBfZGVjb2RlRmxvYXQoMjMsIDgpXHJcblx0cmVhZERvdWJsZTogLT4gQF9kZWNvZGVGbG9hdCg1MiwgMTEpXHJcblx0XHJcblx0cmVhZENoYXI6IC0+IEByZWFkU3RyaW5nKDEpXHJcblx0cmVhZFN0cmluZzogKGxlbmd0aCktPlxyXG5cdFx0QF9jaGVja1NpemUobGVuZ3RoICogOClcclxuXHRcdHJlc3VsdCA9IEBfYnVmZmVyLnN1YnN0cihAX3BvcywgbGVuZ3RoKVxyXG5cdFx0QF9wb3MgKz0gbGVuZ3RoXHJcblx0XHRyZXN1bHRcclxuXHJcblx0c2VlazogKHBvcyktPlxyXG5cdFx0QF9wb3MgPSBwb3NcclxuXHRcdEBfY2hlY2tTaXplKDApXHJcblx0XHJcblx0Z2V0UG9zaXRpb246IC0+IEBfcG9zXHJcblx0XHJcblx0Z2V0U2l6ZTogLT4gQF9idWZmZXIubGVuZ3RoXHJcblx0XHJcblxyXG5cclxuXHQjIFByaXZhdGVcclxuXHRcclxuXHRfZGVjb2RlRmxvYXQ6IGBmdW5jdGlvbihwcmVjaXNpb25CaXRzLCBleHBvbmVudEJpdHMpe1xyXG5cdFx0dmFyIGxlbmd0aCA9IHByZWNpc2lvbkJpdHMgKyBleHBvbmVudEJpdHMgKyAxO1xyXG5cdFx0dmFyIHNpemUgPSBsZW5ndGggPj4gMztcclxuXHRcdHRoaXMuX2NoZWNrU2l6ZShsZW5ndGgpO1xyXG5cclxuXHRcdHZhciBiaWFzID0gTWF0aC5wb3coMiwgZXhwb25lbnRCaXRzIC0gMSkgLSAxO1xyXG5cdFx0dmFyIHNpZ25hbCA9IHRoaXMuX3JlYWRCaXRzKHByZWNpc2lvbkJpdHMgKyBleHBvbmVudEJpdHMsIDEsIHNpemUpO1xyXG5cdFx0dmFyIGV4cG9uZW50ID0gdGhpcy5fcmVhZEJpdHMocHJlY2lzaW9uQml0cywgZXhwb25lbnRCaXRzLCBzaXplKTtcclxuXHRcdHZhciBzaWduaWZpY2FuZCA9IDA7XHJcblx0XHR2YXIgZGl2aXNvciA9IDI7XHJcblx0XHR2YXIgY3VyQnl0ZSA9IDA7IC8vbGVuZ3RoICsgKC1wcmVjaXNpb25CaXRzID4+IDMpIC0gMTtcclxuXHRcdGRvIHtcclxuXHRcdFx0dmFyIGJ5dGVWYWx1ZSA9IHRoaXMuX3JlYWRCeXRlKCsrY3VyQnl0ZSwgc2l6ZSk7XHJcblx0XHRcdHZhciBzdGFydEJpdCA9IHByZWNpc2lvbkJpdHMgJSA4IHx8IDg7XHJcblx0XHRcdHZhciBtYXNrID0gMSA8PCBzdGFydEJpdDtcclxuXHRcdFx0d2hpbGUgKG1hc2sgPj49IDEpIHtcclxuXHRcdFx0XHRpZiAoYnl0ZVZhbHVlICYgbWFzaykge1xyXG5cdFx0XHRcdFx0c2lnbmlmaWNhbmQgKz0gMSAvIGRpdmlzb3I7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRpdmlzb3IgKj0gMjtcclxuXHRcdFx0fVxyXG5cdFx0fSB3aGlsZSAocHJlY2lzaW9uQml0cyAtPSBzdGFydEJpdCk7XHJcblxyXG5cdFx0dGhpcy5fcG9zICs9IHNpemU7XHJcblxyXG5cdFx0cmV0dXJuIGV4cG9uZW50ID09IChiaWFzIDw8IDEpICsgMSA/IHNpZ25pZmljYW5kID8gTmFOIDogc2lnbmFsID8gLUluZmluaXR5IDogK0luZmluaXR5XHJcblx0XHRcdDogKDEgKyBzaWduYWwgKiAtMikgKiAoZXhwb25lbnQgfHwgc2lnbmlmaWNhbmQgPyAhZXhwb25lbnQgPyBNYXRoLnBvdygyLCAtYmlhcyArIDEpICogc2lnbmlmaWNhbmRcclxuXHRcdFx0OiBNYXRoLnBvdygyLCBleHBvbmVudCAtIGJpYXMpICogKDEgKyBzaWduaWZpY2FuZCkgOiAwKTtcclxuXHR9YFxyXG5cclxuXHRfZGVjb2RlSW50OiBgZnVuY3Rpb24oYml0cywgc2lnbmVkKXtcclxuXHRcdHZhciB4ID0gdGhpcy5fcmVhZEJpdHMoMCwgYml0cywgYml0cyAvIDgpLCBtYXggPSBNYXRoLnBvdygyLCBiaXRzKTtcclxuXHRcdHZhciByZXN1bHQgPSBzaWduZWQgJiYgeCA+PSBtYXggLyAyID8geCAtIG1heCA6IHg7XHJcblxyXG5cdFx0dGhpcy5fcG9zICs9IGJpdHMgLyA4O1xyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9YFxyXG5cclxuXHQjc2hsIGZpeDogSGVucmkgVG9yZ2VtYW5lIH4xOTk2IChjb21wcmVzc2VkIGJ5IEpvbmFzIFJhb25pKVxyXG5cdF9zaGw6IGBmdW5jdGlvbiAoYSwgYil7XHJcblx0XHRmb3IgKCsrYjsgLS1iOyBhID0gKChhICU9IDB4N2ZmZmZmZmYgKyAxKSAmIDB4NDAwMDAwMDApID09IDB4NDAwMDAwMDAgPyBhICogMiA6IChhIC0gMHg0MDAwMDAwMCkgKiAyICsgMHg3ZmZmZmZmZiArIDEpO1xyXG5cdFx0cmV0dXJuIGE7XHJcblx0fWBcclxuXHRcclxuXHRfcmVhZEJ5dGU6IGBmdW5jdGlvbiAoaSwgc2l6ZSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2J1ZmZlci5jaGFyQ29kZUF0KHRoaXMuX3BvcyArIHNpemUgLSBpIC0gMSkgJiAweGZmO1xyXG5cdH1gXHJcblxyXG5cdF9yZWFkQml0czogYGZ1bmN0aW9uIChzdGFydCwgbGVuZ3RoLCBzaXplKSB7XHJcblx0XHR2YXIgb2Zmc2V0TGVmdCA9IChzdGFydCArIGxlbmd0aCkgJSA4O1xyXG5cdFx0dmFyIG9mZnNldFJpZ2h0ID0gc3RhcnQgJSA4O1xyXG5cdFx0dmFyIGN1ckJ5dGUgPSBzaXplIC0gKHN0YXJ0ID4+IDMpIC0gMTtcclxuXHRcdHZhciBsYXN0Qnl0ZSA9IHNpemUgKyAoLShzdGFydCArIGxlbmd0aCkgPj4gMyk7XHJcblx0XHR2YXIgZGlmZiA9IGN1ckJ5dGUgLSBsYXN0Qnl0ZTtcclxuXHJcblx0XHR2YXIgc3VtID0gKHRoaXMuX3JlYWRCeXRlKGN1ckJ5dGUsIHNpemUpID4+IG9mZnNldFJpZ2h0KSAmICgoMSA8PCAoZGlmZiA/IDggLSBvZmZzZXRSaWdodCA6IGxlbmd0aCkpIC0gMSk7XHJcblxyXG5cdFx0aWYgKGRpZmYgJiYgb2Zmc2V0TGVmdCkge1xyXG5cdFx0XHRzdW0gKz0gKHRoaXMuX3JlYWRCeXRlKGxhc3RCeXRlKyssIHNpemUpICYgKCgxIDw8IG9mZnNldExlZnQpIC0gMSkpIDw8IChkaWZmLS0gPDwgMykgLSBvZmZzZXRSaWdodDsgXHJcblx0XHR9XHJcblxyXG5cdFx0d2hpbGUgKGRpZmYpIHtcclxuXHRcdFx0c3VtICs9IHRoaXMuX3NobCh0aGlzLl9yZWFkQnl0ZShsYXN0Qnl0ZSsrLCBzaXplKSwgKGRpZmYtLSA8PCAzKSAtIG9mZnNldFJpZ2h0KTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gc3VtO1xyXG5cdH1gXHJcblxyXG5cdF9jaGVja1NpemU6IChuZWVkZWRCaXRzKS0+XHJcblx0XHRpZiBAX3BvcyArIE1hdGguY2VpbChuZWVkZWRCaXRzIC8gOCkgPiBAX2J1ZmZlci5sZW5ndGhcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiSW5kZXggb3V0IG9mIGJvdW5kXCJcclxuXHJcbiIsIlxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIENvbG9yXHJcblx0Y29uc3RydWN0b3I6IChvcHRpb25zKS0+XHJcblx0XHQjIEBUT0RPOiBkb24ndCBhc3NpZ24gYWxsIG9mIHtAciwgQGcsIEBiLCBAaCwgQHMsIEB2LCBAbH0gcmlnaHQgYXdheVxyXG5cdFx0IyBvbmx5IGFzc2lnbiB0aGUgcHJvcGVydGllcyB0aGF0IGFyZSB1c2VkXHJcblx0XHQjIGFsc28gbWF5YmUgYWx3YXlzIGhhdmUgQHIgQGcgQGIgKG9yIEByZWQgQGdyZWVuIEBibHVlKSBidXQgc3RpbGwgc3RyaW5naWZ5IHRvIGhzbCgpIGlmIGhzbCBvciBoc3YgZ2l2ZW5cclxuXHRcdCMgVE9ETzogZXhwZWN0IG51bWJlcnMgb3IgY29udmVydCB0byBudW1iZXJzXHJcblx0XHR7XHJcblx0XHRcdEByLCBAZywgQGIsXHJcblx0XHRcdEBoLCBAcywgQHYsIEBsLFxyXG5cdFx0XHRjLCBtLCB5LCBrLFxyXG5cdFx0XHRAbmFtZVxyXG5cdFx0fSA9IG9wdGlvbnNcclxuXHJcblx0XHRpZiBAcj8gYW5kIEBnPyBhbmQgQGI/XHJcblx0XHRcdCMgUmVkIEdyZWVuIEJsdWVcclxuXHRcdFx0IyAobm8gY29udmVyc2lvbnMgbmVlZGVkIGhlcmUpXHJcblx0XHRlbHNlIGlmIEBoPyBhbmQgQHM/XHJcblx0XHRcdCMgQ3lsaW5kcmljYWwgQ29sb3IgU3BhY2VcclxuXHRcdFx0aWYgQHY/XHJcblx0XHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBWYWx1ZVxyXG5cdFx0XHRcdEBsID0gKDIgLSBAcyAvIDEwMCkgKiBAdiAvIDJcclxuXHRcdFx0XHRAcyA9IEBzICogQHYgLyAoaWYgQGwgPCA1MCB0aGVuIEBsICogMiBlbHNlIDIwMCAtIEBsICogMilcclxuXHRcdFx0XHRAcyA9IDAgaWYgaXNOYU4gQHNcclxuXHRcdFx0ZWxzZSBpZiBAbD9cclxuXHRcdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIExpZ2h0bmVzc1xyXG5cdFx0XHRcdCMgKG5vIGNvbnZlcnNpb25zIG5lZWRlZCBoZXJlKVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0IyBUT0RPOiBpbXByb3ZlIGVycm9yIG1lc3NhZ2UgKGVzcGVjaWFsbHkgaWYgQGIgZ2l2ZW4pXHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiSHVlLCBzYXR1cmF0aW9uLCBhbmQuLi4/IChlaXRoZXIgbGlnaHRuZXNzIG9yIHZhbHVlKVwiXHJcblx0XHRcdCMgVE9ETzogbWF5YmUgY29udmVydCB0byBAciBAZyBAYiBoZXJlXHJcblx0XHRlbHNlIGlmIGM/IGFuZCBtPyBhbmQgeT8gYW5kIGs/XHJcblx0XHRcdCMgQ3lhbiBNYWdlbnRhIFllbGxvdyBibGFjS1xyXG5cdFx0XHQjIFVOVEVTVEVEXHJcblx0XHRcdGMgLz0gMTAwXHJcblx0XHRcdG0gLz0gMTAwXHJcblx0XHRcdHkgLz0gMTAwXHJcblx0XHRcdGsgLz0gMTAwXHJcblx0XHRcdFxyXG5cdFx0XHRAciA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgYyAqICgxIC0gaykgKyBrKSlcclxuXHRcdFx0QGcgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIG0gKiAoMSAtIGspICsgaykpXHJcblx0XHRcdEBiID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCB5ICogKDEgLSBrKSArIGspKVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHQjIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEXHJcblx0XHRcdGlmIEBsPyBhbmQgQGE/IGFuZCBAYj9cclxuXHRcdFx0XHR3aGl0ZSA9XHJcblx0XHRcdFx0XHR4OiA5NS4wNDdcclxuXHRcdFx0XHRcdHk6IDEwMC4wMDBcclxuXHRcdFx0XHRcdHo6IDEwOC44ODNcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR4eXogPSBcclxuXHRcdFx0XHRcdHk6IChyYXcubCArIDE2KSAvIDExNlxyXG5cdFx0XHRcdFx0eDogcmF3LmEgLyA1MDAgKyB4eXoueVxyXG5cdFx0XHRcdFx0ejogeHl6LnkgLSByYXcuYiAvIDIwMFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGZvciBfIGluIFwieHl6XCJcclxuXHRcdFx0XHRcdHBvd2VkID0gTWF0aC5wb3coeHl6W19dLCAzKVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiBwb3dlZCA+IDAuMDA4ODU2XHJcblx0XHRcdFx0XHRcdHh5eltfXSA9IHBvd2VkXHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdHh5eltfXSA9ICh4eXpbX10gLSAxNiAvIDExNikgLyA3Ljc4N1xyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHQjeHl6W19dID0gX3JvdW5kKHh5eltfXSAqIHdoaXRlW19dKVxyXG5cdFx0XHRcdFxyXG5cdFx0XHQjIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEXHJcblx0XHRcdGlmIEB4PyBhbmQgQHk/IGFuZCBAej9cclxuXHRcdFx0XHR4eXogPVxyXG5cdFx0XHRcdFx0eDogcmF3LnggLyAxMDBcclxuXHRcdFx0XHRcdHk6IHJhdy55IC8gMTAwXHJcblx0XHRcdFx0XHR6OiByYXcueiAvIDEwMFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHJnYiA9XHJcblx0XHRcdFx0XHRyOiB4eXoueCAqIDMuMjQwNiArIHh5ei55ICogLTEuNTM3MiArIHh5ei56ICogLTAuNDk4NlxyXG5cdFx0XHRcdFx0ZzogeHl6LnggKiAtMC45Njg5ICsgeHl6LnkgKiAxLjg3NTggKyB4eXoueiAqIDAuMDQxNVxyXG5cdFx0XHRcdFx0YjogeHl6LnggKiAwLjA1NTcgKyB4eXoueSAqIC0wLjIwNDAgKyB4eXoueiAqIDEuMDU3MFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGZvciBfIGluIFwicmdiXCJcclxuXHRcdFx0XHRcdCNyZ2JbX10gPSBfcm91bmQocmdiW19dKVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiByZ2JbX10gPCAwXHJcblx0XHRcdFx0XHRcdHJnYltfXSA9IDBcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYgcmdiW19dID4gMC4wMDMxMzA4XHJcblx0XHRcdFx0XHRcdHJnYltfXSA9IDEuMDU1ICogTWF0aC5wb3cocmdiW19dLCAoMSAvIDIuNCkpIC0gMC4wNTVcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0cmdiW19dICo9IDEyLjkyXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0I3JnYltfXSA9IE1hdGgucm91bmQocmdiW19dICogMjU1KVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiQ29sb3IgY29uc3RydWN0b3IgbXVzdCBiZSBjYWxsZWQgd2l0aCB7cixnLGJ9IG9yIHtoLHMsdn0gb3Ige2gscyxsfSBvciB7YyxtLHksa30gb3Ige3gseSx6fSBvciB7bCxhLGJ9LFxyXG5cdFx0XHRcdFx0I3tcclxuXHRcdFx0XHRcdFx0dHJ5XHJcblx0XHRcdFx0XHRcdFx0XCJnb3QgI3tKU09OLnN0cmluZ2lmeShvcHRpb25zKX1cIlxyXG5cdFx0XHRcdFx0XHRjYXRjaCBlXHJcblx0XHRcdFx0XHRcdFx0XCJnb3Qgc29tZXRoaW5nIHRoYXQgY291bGRuJ3QgYmUgZGlzcGxheWVkIHdpdGggSlNPTi5zdHJpbmdpZnkgZm9yIHRoaXMgZXJyb3IgbWVzc2FnZVwiXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XCJcclxuXHRcdFxyXG5cdFxyXG5cdHRvU3RyaW5nOiAtPlxyXG5cdFx0aWYgQHI/XHJcblx0XHRcdCMgUmVkIEdyZWVuIEJsdWVcclxuXHRcdFx0aWYgQGE/ICMgQWxwaGFcclxuXHRcdFx0XHRcInJnYmEoI3tAcn0sICN7QGd9LCAje0BifSwgI3tAYX0pXCJcclxuXHRcdFx0ZWxzZSAjIE9wYXF1ZVxyXG5cdFx0XHRcdFwicmdiKCN7QHJ9LCAje0BnfSwgI3tAYn0pXCJcclxuXHRcdGVsc2UgaWYgQGg/XHJcblx0XHRcdCMgSHVlIFNhdHVyYXRpb24gTGlnaHRuZXNzXHJcblx0XHRcdCMgKEFzc3VtZSBoOjAtMzYwLCBzOjAtMTAwLCBsOjAtMTAwKVxyXG5cdFx0XHRpZiBAYT8gIyBBbHBoYVxyXG5cdFx0XHRcdFwiaHNsYSgje0BofSwgI3tAc30lLCAje0BsfSUsICN7QGF9KVwiXHJcblx0XHRcdGVsc2UgIyBPcGFxdWVcclxuXHRcdFx0XHRcImhzbCgje0BofSwgI3tAc30lLCAje0BsfSUpXCJcclxuXHRcclxuXHRpczogKGNvbG9yKS0+XHJcblx0XHQjIGNvbXBhcmUgYXMgc3RyaW5nc1xyXG5cdFx0XCIje0B9XCIgaXMgXCIje2NvbG9yfVwiXHJcbiIsIlxyXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID1cclxuY2xhc3MgUGFsZXR0ZSBleHRlbmRzIEFycmF5XHJcblx0XHJcblx0Y29uc3RydWN0b3I6IChhcmdzLi4uKS0+XHJcblx0XHRzdXBlcihhcmdzLi4uKVxyXG5cdFxyXG5cdGFkZDogKG8pLT5cclxuXHRcdG5ld19jb2xvciA9IG5ldyBDb2xvcihvKVxyXG5cdFx0QHB1c2ggbmV3X2NvbG9yXHJcblx0XHJcblx0ZmluYWxpemU6IC0+XHJcblx0XHQjIFRPRE86IGdldCB0aGlzIHdvcmtpbmcgcHJvcGVybHkgYW5kIGVuYWJsZVxyXG5cdFx0IyBpZiBub3QgQG51bWJlck9mQ29sdW1uc1xyXG5cdFx0IyBcdEBndWVzc19kaW1lbnNpb25zKClcclxuXHRcdHVubGVzcyBAcGFyZW50UGFsZXR0ZVdpdGhvdXREdXBsaWNhdGVzXHJcblx0XHRcdEB3aXRoRHVwbGljYXRlcyA9IG5ldyBQYWxldHRlXHJcblx0XHRcdEB3aXRoRHVwbGljYXRlcy5wYXJlbnRQYWxldHRlV2l0aG91dER1cGxpY2F0ZXMgPSBAXHJcblx0XHRcdEB3aXRoRHVwbGljYXRlc1tpXSA9IEBbaV0gZm9yIGkgaW4gWzAuLi5AbGVuZ3RoXVxyXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXMubnVtYmVyT2ZDb2x1bW5zID0gQG51bWJlck9mQ29sdW1uc1xyXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXMuZ2VvbWV0cnlTcGVjaWZpZWRCeUZpbGUgPSBAZ2VvbWV0cnlTcGVjaWZpZWRCeUZpbGVcclxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzLmZpbmFsaXplKClcclxuXHJcblx0XHRcdCMgaW4tcGxhY2UgdW5pcXVpZnlcclxuXHRcdFx0aSA9IDBcclxuXHRcdFx0d2hpbGUgaSA8IEBsZW5ndGhcclxuXHRcdFx0XHRpX2NvbG9yID0gQFtpXVxyXG5cdFx0XHRcdGogPSBpICsgMVxyXG5cdFx0XHRcdHdoaWxlIGogPCBAbGVuZ3RoXHJcblx0XHRcdFx0XHRqX2NvbG9yID0gQFtqXVxyXG5cdFx0XHRcdFx0aWYgaV9jb2xvci5pcyBqX2NvbG9yXHJcblx0XHRcdFx0XHRcdEAuc3BsaWNlKGosIDEpXHJcblx0XHRcdFx0XHRcdGogLT0gMVxyXG5cdFx0XHRcdFx0aiArPSAxXHJcblx0XHRcdFx0aSArPSAxXHJcblxyXG5cdCMjI1xyXG5cdGd1ZXNzX2RpbWVuc2lvbnM6IC0+XHJcblx0XHQjIFRPRE86IGdldCB0aGlzIHdvcmtpbmcgcHJvcGVybHkgYW5kIGVuYWJsZVxyXG5cclxuXHRcdGxlbiA9IEBsZW5ndGhcclxuXHRcdGNhbmRpZGF0ZV9kaW1lbnNpb25zID0gW11cclxuXHRcdGZvciBudW1iZXJPZkNvbHVtbnMgaW4gWzAuLmxlbl1cclxuXHRcdFx0bl9yb3dzID0gbGVuIC8gbnVtYmVyT2ZDb2x1bW5zXHJcblx0XHRcdGlmIG5fcm93cyBpcyBNYXRoLnJvdW5kIG5fcm93c1xyXG5cdFx0XHRcdGNhbmRpZGF0ZV9kaW1lbnNpb25zLnB1c2ggW25fcm93cywgbnVtYmVyT2ZDb2x1bW5zXVxyXG5cdFx0XHJcblx0XHRzcXVhcmVzdCA9IFswLCAzNDk1MDkzXVxyXG5cdFx0Zm9yIGNkIGluIGNhbmRpZGF0ZV9kaW1lbnNpb25zXHJcblx0XHRcdGlmIE1hdGguYWJzKGNkWzBdIC0gY2RbMV0pIDwgTWF0aC5hYnMoc3F1YXJlc3RbMF0gLSBzcXVhcmVzdFsxXSlcclxuXHRcdFx0XHRzcXVhcmVzdCA9IGNkXHJcblx0XHRcclxuXHRcdEBudW1iZXJPZkNvbHVtbnMgPSBzcXVhcmVzdFsxXVxyXG5cdCMjI1xyXG4iLCJcclxuIyBMb2FkIGEgQ29sb3JTY2hlbWVyIHBhbGV0dGVcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHR2ZXJzaW9uID0gYnIucmVhZFVJbnQxNigpICMgb3Igc29tZXRoaW5nXHJcblx0bGVuZ3RoID0gYnIucmVhZFVJbnQxNigpXHJcblx0aSA9IDBcclxuXHR3aGlsZSBpIDwgbGVuZ3RoXHJcblx0XHRici5zZWVrKDggKyBpICogMjYpXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0aSArPSAxXHJcblxyXG5cdHBhbGV0dGVcclxuXHJcbiIsIlxyXG4jIExvYWQgYSBHSU1QIHBhbGV0dGVcclxuXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdGlmIGxpbmVzWzBdIGlzbnQgXCJHSU1QIFBhbGV0dGVcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiTm90IGEgR0lNUCBQYWxldHRlXCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGkgPSAxXHJcblx0d2hpbGUgKGkgKz0gMSkgPCBsaW5lcy5sZW5ndGhcclxuXHRcdGxpbmUgPSBsaW5lc1tpXVxyXG5cdFx0XHJcblx0XHRpZiBsaW5lWzBdIGlzIFwiI1wiIG9yIGxpbmUgaXMgXCJcIiB0aGVuIGNvbnRpbnVlXHJcblx0XHQjIFRPRE86IGhhbmRsZSBub24tc3RhcnQtb2YtbGluZSBjb21tZW50cz8gd2hlcmUncyB0aGUgc3BlYz9cclxuXHRcdFxyXG5cdFx0bSA9IGxpbmUubWF0Y2goL05hbWU6XFxzKiguKikvKVxyXG5cdFx0aWYgbVxyXG5cdFx0XHRwYWxldHRlLm5hbWUgPSBtWzFdXHJcblx0XHRcdGNvbnRpbnVlXHJcblx0XHRtID0gbGluZS5tYXRjaCgvQ29sdW1uczpcXHMqKC4qKS8pXHJcblx0XHRpZiBtXHJcblx0XHRcdHBhbGV0dGUubnVtYmVyT2ZDb2x1bW5zID0gTnVtYmVyKG1bMV0pXHJcblx0XHRcdCMgVE9ETzogaGFuZGxlIDAgYXMgbm90IHNwZWNpZmllZD8gd2hlcmUncyB0aGUgc3BlYyBhdCwgeW8/XHJcblx0XHRcdHBhbGV0dGUuZ2VvbWV0cnlTcGVjaWZpZWRCeUZpbGUgPSB5ZXNcclxuXHRcdFx0Y29udGludWVcclxuXHRcdFxyXG5cdFx0IyBUT0RPOiByZXBsYWNlIFxccyB3aXRoIFtcXCBcXHRdIChzcGFjZXMgb3IgdGFicylcclxuXHRcdCMgaXQgY2FuJ3QgbWF0Y2ggXFxuIGJlY2F1c2UgaXQncyBhbHJlYWR5IHNwbGl0IG9uIHRoYXQsIGJ1dCBzdGlsbFxyXG5cdFx0IyBUT0RPOiBoYW5kbGUgbGluZSB3aXRoIG5vIG5hbWUgYnV0IHNwYWNlIG9uIHRoZSBlbmRcclxuXHRcdHJfZ19iX25hbWUgPSBsaW5lLm1hdGNoKC8vL1xyXG5cdFx0XHReICMgXCJhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaW5lLFwiXHJcblx0XHRcdFxccyogIyBcImdpdmUgb3IgdGFrZSBzb21lIHNwYWNlcyxcIlxyXG5cdFx0XHQjIG1hdGNoIDMgZ3JvdXBzIG9mIG51bWJlcnMgc2VwYXJhdGVkIGJ5IHNwYWNlc1xyXG5cdFx0XHQoWzAtOV0rKSAjIHJlZFxyXG5cdFx0XHRcXHMrXHJcblx0XHRcdChbMC05XSspICMgZ3JlZW5cclxuXHRcdFx0XFxzK1xyXG5cdFx0XHQoWzAtOV0rKSAjIGJsdWVcclxuXHRcdFx0KD86XHJcblx0XHRcdFx0XFxzK1xyXG5cdFx0XHRcdCguKikgIyBvcHRpb25hbGx5IGEgbmFtZVxyXG5cdFx0XHQpP1xyXG5cdFx0XHQkICMgXCJhbmQgdGhhdCBzaG91bGQgYmUgdGhlIGVuZCBvZiB0aGUgbGluZVwiXHJcblx0XHQvLy8pXHJcblx0XHRpZiBub3Qgcl9nX2JfbmFtZVxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJMaW5lICN7aX0gZG9lc24ndCBtYXRjaCBwYXR0ZXJuICN7cl9nX2JfbmFtZX1cIiAjIFRPRE86IGJldHRlciBtZXNzYWdlP1xyXG5cdFx0XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiByX2dfYl9uYW1lWzFdXHJcblx0XHRcdGc6IHJfZ19iX25hbWVbMl1cclxuXHRcdFx0Yjogcl9nX2JfbmFtZVszXVxyXG5cdFx0XHRuYW1lOiByX2dfYl9uYW1lWzRdXHJcblx0XHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIERldGVjdCBDU1MgY29sb3JzIChleGNlcHQgbmFtZWQgY29sb3JzKVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGVzID0gW1xyXG5cdFx0cGFsZXR0ZV94UlJHR0JCID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV94UkdCID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9yZ2IgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX2hzbCA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfaHNsYSA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfcmdiYSA9IG5ldyBQYWxldHRlKClcclxuXHRdXHJcblx0XHJcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0XFwjICMgaGFzaHRhZyAjICMvXHJcblx0XHQoWzAtOUEtRl17Mn0pPyAjIGFscGhhXHJcblx0XHQoWzAtOUEtRl17M30pICMgdGhyZWUgZGlnaXRzICgjQTBDKVxyXG5cdFx0KFswLTlBLUZdezN9KT8gIyBzaXggZGlnaXRzICgjQUEwMENDKVxyXG5cdFx0XHJcblx0XHQoPyFbMC05QS1GXSkgIyAoYW5kIG5vIG1vcmUhKVxyXG5cdC8vL2dpbSwgKG0sICQwLCAkMSwgJDIpLT5cclxuXHRcdFxyXG5cdFx0YWxwaGEgPSBoZXggJDBcclxuXHRcdFxyXG5cdFx0aWYgJDJcclxuXHRcdFx0eFJHQiA9ICQxICsgJDJcclxuXHRcdFx0cGFsZXR0ZV94UlJHR0JCLmFkZFxyXG5cdFx0XHRcdHI6IGhleCB4UkdCWzBdICsgeFJHQlsxXVxyXG5cdFx0XHRcdGc6IGhleCB4UkdCWzJdICsgeFJHQlszXVxyXG5cdFx0XHRcdGI6IGhleCB4UkdCWzRdICsgeFJHQls1XVxyXG5cdFx0XHRcdGE6IGFscGhhXHJcblx0XHRlbHNlXHJcblx0XHRcdHhSR0IgPSAkMVxyXG5cdFx0XHRwYWxldHRlX3hSR0IuYWRkXHJcblx0XHRcdFx0cjogaGV4IHhSR0JbMF0gKyB4UkdCWzBdXHJcblx0XHRcdFx0ZzogaGV4IHhSR0JbMV0gKyB4UkdCWzFdXHJcblx0XHRcdFx0YjogaGV4IHhSR0JbMl0gKyB4UkdCWzJdXHJcblx0XHRcdFx0YTogYWxwaGFcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRyZ2JcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyByZWRcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgZ3JlZW5cclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgYmx1ZVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0cjogTnVtYmVyIG1bMV1cclxuXHRcdFx0ZzogTnVtYmVyIG1bMl1cclxuXHRcdFx0YjogTnVtYmVyIG1bM11cclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRyZ2JhXFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgcmVkXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGdyZWVuXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGJsdWVcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM318MFxcLlswLTldKykgIyBhbHBoYVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0cjogTnVtYmVyIG1bMV1cclxuXHRcdFx0ZzogTnVtYmVyIG1bMl1cclxuXHRcdFx0YjogTnVtYmVyIG1bM11cclxuXHRcdFx0YTogTnVtYmVyIG1bNF1cclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRoc2xcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBodWVcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgc2F0dXJhdGlvblxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyB2YWx1ZVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0aDogTnVtYmVyIG1bMV1cclxuXHRcdFx0czogTnVtYmVyIG1bMl1cclxuXHRcdFx0bDogTnVtYmVyIG1bM11cclxuXHRcclxuXHRtb3N0X2NvbG9ycyA9IFtdXHJcblx0Zm9yIHBhbGV0dGUgaW4gcGFsZXR0ZXNcclxuXHRcdGlmIHBhbGV0dGUubGVuZ3RoID49IG1vc3RfY29sb3JzLmxlbmd0aFxyXG5cdFx0XHRtb3N0X2NvbG9ycyA9IHBhbGV0dGVcclxuXHRcclxuXHRuID0gbW9zdF9jb2xvcnMubGVuZ3RoXHJcblx0aWYgbiA8IDRcclxuXHRcdHRocm93IG5ldyBFcnJvcihbXHJcblx0XHRcdFwiTm8gY29sb3JzIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IG9uZSBjb2xvciBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBhIGNvdXBsZSBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgYSBmZXcgY29sb3JzIGZvdW5kXCJcclxuXHRcdF1bbl0gKyBcIiAoI3tufSlcIilcclxuXHRcclxuXHRtb3N0X2NvbG9yc1xyXG4iLCJcclxuIyBXaGF0IGRvZXMgSFBMIHN0YW5kIGZvcj9cclxuIyBIb3dkeSwgUGFsZXR0ZSBMb3ZlcnMhXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IFwiUGFsZXR0ZVwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYW4gSFBMIHBhbGV0dGVcIlxyXG5cdGlmIG5vdCBsaW5lc1sxXS5tYXRjaCAvVmVyc2lvbiBbMzRdXFwuMC9cclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVuc3VwcG9ydGVkIEhQTCB2ZXJzaW9uXCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdFxyXG5cdGZvciBsaW5lLCBpIGluIGxpbmVzXHJcblx0XHRpZiBsaW5lLm1hdGNoIC8uKyAuKiAuKy9cclxuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcclxuXHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRyOiByZ2JbMF1cclxuXHRcdFx0XHRnOiByZ2JbMV1cclxuXHRcdFx0XHRiOiByZ2JbMl1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBQYWludC5ORVQgcGFsZXR0ZSBmaWxlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHJcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXHJcblx0XHJcblx0Zm9yIGxpbmUgaW4gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0XHRtID0gbGluZS5tYXRjaCgvXihbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkkL2kpXHJcblx0XHRpZiBtIHRoZW4gcGFsZXR0ZS5hZGRcclxuXHRcdFx0YTogaGV4IG1bMV1cclxuXHRcdFx0cjogaGV4IG1bMl1cclxuXHRcdFx0ZzogaGV4IG1bM11cclxuXHRcdFx0YjogaGV4IG1bNF1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBKQVNDIFBBTCBmaWxlIChQYWludCBTaG9wIFBybyBwYWxldHRlIGZpbGUpXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBcIkpBU0MtUEFMXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhIEpBU0MtUEFMXCJcclxuXHRpZiBsaW5lc1sxXSBpc250IFwiMDEwMFwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIEpBU0MtUEFMIHZlcnNpb25cIlxyXG5cdGlmIGxpbmVzWzJdIGlzbnQgXCIyNTZcIlxyXG5cdFx0XCJ0aGF0J3Mgb2tcIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0I25fY29sb3JzID0gTnVtYmVyKGxpbmVzWzJdKVxyXG5cdFxyXG5cdGZvciBsaW5lLCBpIGluIGxpbmVzXHJcblx0XHRpZiBsaW5lIGlzbnQgXCJcIiBhbmQgaSA+IDJcclxuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcclxuXHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRyOiByZ2JbMF1cclxuXHRcdFx0XHRnOiByZ2JbMV1cclxuXHRcdFx0XHRiOiByZ2JbMl1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBSZXNvdXJjZSBJbnRlcmNoYW5nZSBGaWxlIEZvcm1hdCBQQUwgZmlsZVxyXG5cclxuIyBwb3J0ZWQgZnJvbSBDIyBjb2RlIGF0IGh0dHBzOi8vd29ybXMyZC5pbmZvL1BhbGV0dGVfZmlsZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHQjIFJJRkYgaGVhZGVyXHJcblx0cmlmZiA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcIlJJRkZcIlxyXG5cdGRhdGFTaXplID0gYnIucmVhZFVJbnQzMigpXHJcblx0dHlwZSA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcIlBBTCBcIlxyXG5cdFxyXG5cdGlmIHJpZmYgaXNudCBcIlJJRkZcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiUklGRiBoZWFkZXIgbm90IGZvdW5kOyBub3QgYSBSSUZGIFBBTCBmaWxlXCJcclxuXHRcclxuXHRpZiB0eXBlIGlzbnQgXCJQQUwgXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlwiXCJcclxuXHRcdFx0UklGRiBoZWFkZXIgc2F5cyB0aGlzIGlzbid0IGEgUEFMIGZpbGUsXHJcblx0XHRcdG1vcmUgb2YgYSBzb3J0IG9mICN7KCh0eXBlK1wiXCIpLnRyaW0oKSl9IGZpbGVcclxuXHRcdFwiXCJcIlxyXG5cdFxyXG5cdCMgRGF0YSBjaHVua1xyXG5cdGNodW5rVHlwZSA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcImRhdGFcIlxyXG5cdGNodW5rU2l6ZSA9IGJyLnJlYWRVSW50MzIoKVxyXG5cdHBhbFZlcnNpb24gPSBici5yZWFkVUludDE2KCkgIyAweDAzMDBcclxuXHRwYWxOdW1FbnRyaWVzID0gYnIucmVhZFVJbnQxNigpXHJcblx0XHJcblx0XHJcblx0aWYgY2h1bmtUeXBlIGlzbnQgXCJkYXRhXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIkRhdGEgY2h1bmsgbm90IGZvdW5kICguLi4nI3tjaHVua1R5cGV9Jz8pXCJcclxuXHRcclxuXHRpZiBwYWxWZXJzaW9uIGlzbnQgMHgwMzAwXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbnN1cHBvcnRlZCBQQUwgZmlsZSBmb3JtYXQgdmVyc2lvbjogMHgje3BhbFZlcnNpb24udG9TdHJpbmcoMTYpfVwiXHJcblx0XHJcblx0IyBDb2xvcnNcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGkgPSAwXHJcblx0d2hpbGUgKGkgKz0gMSkgPCBwYWxOdW1FbnRyaWVzIC0gMVxyXG5cdFx0XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRfOiBici5yZWFkQnl0ZSgpICMgXCJmbGFnc1wiLCBhbHdheXMgMHgwMFxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgUEFMIChTdGFyQ3JhZnQgcmF3IHBhbGV0dGUpXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0Zm9yIGkgaW4gWzAuLi4yNTVdXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHQjOiBubyBwYWRkaW5nXHJcblx0XHJcblx0Iz8gcGFsZXR0ZS5udW1iZXJPZkNvbHVtbnMgPSAxNlxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgV1BFIChTdGFyQ3JhZnQgcGFkZGVkIHJhdyBwYWxldHRlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdGZvciBpIGluIFswLi4uMjU1XVxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0XzogYnIucmVhZEJ5dGUoKSAjIHBhZGRpbmdcclxuXHRcclxuXHRwYWxldHRlLm51bWJlck9mQ29sdW1ucyA9IDE2XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuL1BhbGV0dGVcIlxyXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcclxuXHJcbmNsYXNzIFJhbmRvbUNvbG9yIGV4dGVuZHMgQ29sb3JcclxuXHRjb25zdHJ1Y3RvcjogLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEByYW5kb21pemUoKVxyXG5cdFxyXG5cdHJhbmRvbWl6ZTogLT5cclxuXHRcdEBoID0gTWF0aC5yYW5kb20oKSAqIDM2MFxyXG5cdFx0QHMgPSBNYXRoLnJhbmRvbSgpICogMTAwXHJcblx0XHRAbCA9IE1hdGgucmFuZG9tKCkgKiAxMDBcclxuXHRcclxuXHR0b1N0cmluZzogLT5cclxuXHRcdEByYW5kb21pemUoKVxyXG5cdFx0XCJoc2woI3tAaH0sICN7QHN9JSwgI3tAbH0lKVwiXHJcblx0XHJcblx0aXM6IC0+IG5vXHJcblxyXG5jbGFzcyBSYW5kb21QYWxldHRlIGV4dGVuZHMgUGFsZXR0ZVxyXG5cdGNvbnN0cnVjdG9yOiAtPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QGxvYWRlciA9XHJcblx0XHRcdG5hbWU6IFwiQ29tcGxldGVseSBSYW5kb20gQ29sb3Jz4oSiXCJcclxuXHRcdFx0ZmlsZUV4dGVuc2lvbnM6IFtdXHJcblx0XHRcdGZpbGVFeHRlbnNpb25zUHJldHR5OiBcIiguY3JjIHNqZihEZjA5c2pkZmtzZGxmbW5tICc7JztcIlxyXG5cdFx0QG1hdGNoZWRMb2FkZXJGaWxlRXh0ZW5zaW9ucyA9IG5vXHJcblx0XHRAY29uZmlkZW5jZSA9IDBcclxuXHRcdEBmaW5hbGl6ZSgpXHJcblx0XHRmb3IgaSBpbiBbMC4uTWF0aC5yYW5kb20oKSoxNSs1XVxyXG5cdFx0XHRAcHVzaCBuZXcgUmFuZG9tQ29sb3IoKVxyXG5cclxuY2xhc3MgTG9hZGluZ0Vycm9ycyBleHRlbmRzIEVycm9yXHJcblx0Y29uc3RydWN0b3I6IChAZXJyb3JzKS0+XHJcblx0XHRzdXBlcigpXHJcblx0XHRAbWVzc2FnZSA9IFwiU29tZSBlcnJvcnMgd2VyZSBlbmNvdW50ZXJlZCB3aGVuIGxvYWRpbmc6XCIgK1xyXG5cdFx0XHRmb3IgZXJyb3IgaW4gQGVycm9yc1xyXG5cdFx0XHRcdFwiXFxuXFx0XCIgKyBlcnJvci5tZXNzYWdlXHJcblxyXG5sb2FkX3BhbGV0dGUgPSAobywgY2FsbGJhY2spLT5cclxuXHRcclxuXHRwYWxldHRlX2xvYWRlcnMgPSBbXHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiLCBcInBzcHBhbGV0dGVcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9QYWludFNob3BQcm9cIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlJJRkYgUEFMXCJcclxuXHRcdFx0ZXh0czogW1wicGFsXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvUklGRlwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiQ29sb3JTY2hlbWVyIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJjc1wiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0NvbG9yU2NoZW1lclwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUGFpbnQuTkVUIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJ0eHRcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9QYWludC5ORVRcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkdJTVAgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImdwbFwiLCBcImdpbXBcIiwgXCJjb2xvcnNcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9HSU1QXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJDU1Mtc3R5bGUgY29sb3JzXCJcclxuXHRcdFx0ZXh0czogW1wiY3NzXCIsIFwic2Nzc1wiLCBcInNhc3NcIiwgXCJsZXNzXCIsIFwic3R5bFwiLCBcImh0bWxcIiwgXCJodG1cIiwgXCJzdmdcIiwgXCJqc1wiLCBcInRzXCIsIFwieG1sXCIsIFwidHh0XCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvR2VuZXJpY1wiXHJcblx0XHR9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIFN3YXRjaFwiXHJcblx0XHQjIFx0ZXh0czogW1wiYWNvXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yU3dhdGNoXCJcclxuXHRcdCMgfVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBDb2xvciBUYWJsZVwiXHJcblx0XHQjIFx0ZXh0czogW1wiYWN0XCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yVGFibGVcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIFN3YXRjaCBFeGNoYW5nZVwiXHJcblx0XHQjIFx0ZXh0czogW1wiYXNlXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZVN3YXRjaEV4Y2hhbmdlXCJcclxuXHRcdCMgfVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBDb2xvciBCb29rXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY2JcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JCb29rXCJcclxuXHRcdCMgfVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkhQTCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiaHBsXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvSFBMXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJTdGFyQ3JhZnQgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1N0YXJDcmFmdFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiU3RhckNyYWZ0IHRlcnJhaW4gcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcIndwZVwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1N0YXJDcmFmdFBhZGRlZFwiXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQXV0b0NBRCBDb2xvciBCb29rXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY2JcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0F1dG9DQURDb2xvckJvb2tcIlxyXG5cdFx0IyB9XHJcblx0XHRcclxuXHRcdCMge1xyXG5cdFx0IyBcdCMgKHNhbWUgYXMgUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZT8pXHJcblx0XHQjIFx0bmFtZTogXCJDb3JlbERSQVcgcGFsZXR0ZVwiXHJcblx0XHQjIFx0ZXh0czogW1wicGFsXCIsIFwiY3BsXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9Db3JlbERSQVdcIlxyXG5cdFx0IyB9XHJcblx0XVxyXG5cdFxyXG5cdCMgZmluZCBwYWxldHRlIGxvYWRlcnMgdGhhdCB1c2UgdGhpcyBmaWxlIGV4dGVuc2lvblxyXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcclxuXHRcdHBsLm1hdGNoZXNfZXh0ID0gcGwuZXh0cy5pbmRleE9mKG8uZmlsZUV4dCkgaXNudCAtMVxyXG5cdFxyXG5cdCMgbW92ZSBwYWxldHRlIGxvYWRlcnMgdG8gdGhlIGJlZ2lubmluZyB0aGF0IHVzZSB0aGlzIGZpbGUgZXh0ZW5zaW9uXHJcblx0cGFsZXR0ZV9sb2FkZXJzLnNvcnQgKHBsMSwgcGwyKS0+XHJcblx0XHRwbDIubWF0Y2hlc19leHQgLSBwbDEubWF0Y2hlc19leHRcclxuXHRcclxuXHQjIHRyeSBsb2FkaW5nIHN0dWZmXHJcblx0ZXJyb3JzID0gW11cclxuXHRmb3IgcGwgaW4gcGFsZXR0ZV9sb2FkZXJzXHJcblx0XHRcclxuXHRcdHRyeVxyXG5cdFx0XHRwYWxldHRlID0gcGwubG9hZChvKVxyXG5cdFx0XHRpZiBwYWxldHRlLmxlbmd0aCBpcyAwXHJcblx0XHRcdFx0cGFsZXR0ZSA9IG51bGxcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJubyBjb2xvcnMgcmV0dXJuZWRcIlxyXG5cdFx0Y2F0Y2ggZVxyXG5cdFx0XHRtc2cgPSBcImZhaWxlZCB0byBsb2FkICN7by5maWxlTmFtZX0gYXMgI3twbC5uYW1lfTogI3tlLm1lc3NhZ2V9XCJcclxuXHRcdFx0IyBpZiBwbC5tYXRjaGVzX2V4dCBhbmQgbm90IGUubWVzc2FnZS5tYXRjaCgvbm90IGEvaSlcclxuXHRcdFx0IyBcdGNvbnNvbGU/LmVycm9yPyBtc2dcclxuXHRcdFx0IyBlbHNlXHJcblx0XHRcdCMgXHRjb25zb2xlPy53YXJuPyBtc2dcclxuXHRcdFx0XHJcblx0XHRcdCMgVE9ETzogbWF5YmUgdGhpcyBzaG91bGRuJ3QgYmUgYW4gRXJyb3Igb2JqZWN0LCBqdXN0IGEge21lc3NhZ2UsIGVycm9yfSBvYmplY3RcclxuXHRcdFx0IyBvciB7ZnJpZW5kbHlNZXNzYWdlLCBlcnJvcn1cclxuXHRcdFx0ZXJyID0gbmV3IEVycm9yIG1zZ1xyXG5cdFx0XHRlcnIuZXJyb3IgPSBlXHJcblx0XHRcdGVycm9ycy5wdXNoIGVyclxyXG5cdFx0XHJcblx0XHRpZiBwYWxldHRlXHJcblx0XHRcdCMgY29uc29sZT8uaW5mbz8gXCJsb2FkZWQgI3tvLmZpbGVOYW1lfSBhcyAje3BsLm5hbWV9XCJcclxuXHRcdFx0cGFsZXR0ZS5jb25maWRlbmNlID0gaWYgcGwubWF0Y2hlc19leHQgdGhlbiAwLjkgZWxzZSAwLjAxXHJcblx0XHRcdGV4dHNfcHJldHR5ID0gXCIuI3twbC5leHRzLmpvaW4oXCIsIC5cIil9XCJcclxuXHRcdFx0XHJcblx0XHRcdCMgVE9ETzogcHJvYmFibHkgcmVuYW1lIGxvYWRlciAtPiBmb3JtYXQgd2hlbiAyLXdheSBkYXRhIGZsb3cgKHJlYWQvd3JpdGUpIGlzIHN1cHBvcnRlZFxyXG5cdFx0XHQjIFRPRE86IG1heWJlIG1ha2UgdGhpcyBhIDNyZCAoYW5kIGZvdXJ0aD8pIGFyZ3VtZW50IHRvIHRoZSBjYWxsYmFja1xyXG5cdFx0XHRwYWxldHRlLmxvYWRlciA9XHJcblx0XHRcdFx0bmFtZTogcGwubmFtZVxyXG5cdFx0XHRcdGZpbGVFeHRlbnNpb25zOiBwbC5leHRzXHJcblx0XHRcdFx0ZmlsZUV4dGVuc2lvbnNQcmV0dHk6IGV4dHNfcHJldHR5XHJcblx0XHRcdHBhbGV0dGUubWF0Y2hlZExvYWRlckZpbGVFeHRlbnNpb25zID0gcGwubWF0Y2hlc19leHRcclxuXHRcdFx0XHJcblx0XHRcdHBhbGV0dGUuZmluYWxpemUoKVxyXG5cdFx0XHRjYWxsYmFjayhudWxsLCBwYWxldHRlKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcclxuXHRjYWxsYmFjayhuZXcgTG9hZGluZ0Vycm9ycyhlcnJvcnMpKVxyXG5cdHJldHVyblxyXG5cclxubm9ybWFsaXplX29wdGlvbnMgPSAobyA9IHt9KS0+XHJcblx0aWYgdHlwZW9mIG8gaXMgXCJzdHJpbmdcIiBvciBvIGluc3RhbmNlb2YgU3RyaW5nXHJcblx0XHRvID0gZmlsZVBhdGg6IG9cclxuXHRpZiBGaWxlPyBhbmQgbyBpbnN0YW5jZW9mIEZpbGVcclxuXHRcdG8gPSBmaWxlOiBvXHJcblx0XHJcblx0IyBvLm1pbkNvbG9ycyA/PSAyXHJcblx0IyBvLm1heENvbG9ycyA/PSAyNTZcclxuXHRvLmZpbGVOYW1lID89IG8uZmlsZT8ubmFtZSA/IChpZiBvLmZpbGVQYXRoIHRoZW4gcmVxdWlyZShcInBhdGhcIikuYmFzZW5hbWUoby5maWxlUGF0aCkpXHJcblx0by5maWxlRXh0ID89IFwiI3tvLmZpbGVOYW1lfVwiLnNwbGl0KFwiLlwiKS5wb3AoKVxyXG5cdG8uZmlsZUV4dCA9IFwiI3tvLmZpbGVFeHR9XCIudG9Mb3dlckNhc2UoKVxyXG5cdG9cclxuXHJcbkFueVBhbGV0dGUgPSB7XHJcblx0Q29sb3JcclxuXHRQYWxldHRlXHJcblx0UmFuZG9tQ29sb3JcclxuXHRSYW5kb21QYWxldHRlXHJcblx0IyBMb2FkaW5nRXJyb3JzXHJcbn1cclxuXHJcbiMgR2V0IHBhbGV0dGUgZnJvbSBhIGZpbGVcclxuQW55UGFsZXR0ZS5sb2FkUGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxyXG5cdGlmIG5vdCBvXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJQYXJhbWV0ZXJzIHJlcXVpcmVkOiBBbnlQYWxldHRlLmxvYWRQYWxldHRlKG9wdGlvbnMsIGZ1bmN0aW9uIGNhbGxiYWNrKGVyciwgcGFsZXR0ZSl7fSlcIlxyXG5cdGlmIG5vdCBjYWxsYmFja1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiQ2FsbGJhY2sgcmVxdWlyZWQ6IEFueVBhbGV0dGUubG9hZFBhbGV0dGUob3B0aW9ucywgZnVuY3Rpb24gY2FsbGJhY2soZXJyLCBwYWxldHRlKXt9KVwiXHJcblx0XHJcblx0byA9IG5vcm1hbGl6ZV9vcHRpb25zIG9cclxuXHRcclxuXHRpZiBvLmRhdGFcclxuXHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRlbHNlIGlmIEZpbGU/IGFuZCBvLmZpbGUgaW5zdGFuY2VvZiBGaWxlXHJcblx0XHRmciA9IG5ldyBGaWxlUmVhZGVyXHJcblx0XHRmci5vbmxvYWQgPSAtPlxyXG5cdFx0XHRvLmRhdGEgPSBmci5yZXN1bHRcclxuXHRcdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdFx0ZnIucmVhZEFzQmluYXJ5U3RyaW5nIG8uZmlsZVxyXG5cdGVsc2UgaWYgby5maWxlUGF0aD9cclxuXHRcdGZzID0gcmVxdWlyZSBcImZzXCJcclxuXHRcdGZzLnJlYWRGaWxlIG8uZmlsZVBhdGgsIChlcnIsIGRhdGEpLT5cclxuXHRcdFx0aWYgZXJyXHJcblx0XHRcdFx0Y2FsbGJhY2soZXJyKVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0by5kYXRhID0gZGF0YS50b1N0cmluZyhcImJpbmFyeVwiKVxyXG5cdFx0XHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRlbHNlXHJcblx0XHRjYWxsYmFjayhuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZC4gVGhlIEZpbGUgQVBJIG1heSBub3QgYmUgc3VwcG9ydGVkLlwiKSkgIyB1bS4uLlxyXG5cdFx0IyB0aGUgRmlsZSBBUEkgd291bGQgYmUgc3VwcG9ydGVkIGlmIHlvdSd2ZSBwYXNzZWQgYSBGaWxlXHJcblx0XHQjIFRPRE86IGEgYmV0dGVyIGVycm9yIG1lc3NhZ2UsIGFib3V0IG9wdGlvbnMgKG5vdCkgcGFzc2VkXHJcblxyXG5cclxuIyBHZXQgYSBwYWxldHRlIGZyb20gYSBmaWxlIG9yIGJ5IGFueSBtZWFucyBuZWNlc3NhcnlcclxuIyAoYXMgaW4gZmFsbCBiYWNrIHRvIGNvbXBsZXRlbHkgcmFuZG9tIGRhdGEpXHJcbkFueVBhbGV0dGUuZ2ltbWVBUGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxyXG5cdG8gPSBub3JtYWxpemVfb3B0aW9ucyBvXHJcblx0XHJcblx0QW55UGFsZXR0ZS5sb2FkUGFsZXR0ZSBvLCAoZXJyLCBwYWxldHRlKS0+XHJcblx0XHRjYWxsYmFjayhudWxsLCBwYWxldHRlID8gbmV3IFJhbmRvbVBhbGV0dGUpXHJcblxyXG4jIEV4cG9ydHNcclxubW9kdWxlLmV4cG9ydHMgPSBBbnlQYWxldHRlXHJcbiJdfQ==
