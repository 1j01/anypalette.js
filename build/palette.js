(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Palette = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
      console.log({length});
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
  // @TODO: don't assign {@r, @g, @b, @h, @s, @v, @l} right away
  // (more of a to-don't, really)
  constructor({r, g, b, h, s, v, l, c, m, y, k, name}) {
    var _, i, j, len, len1, powed, ref, ref1, rgb, white, xyz;
    this.r = r;
    this.g = g;
    this.b = b;
    this.h = h;
    this.s = s;
    this.v = v;
    this.l = l;
    this.name = name;
    if ((this.r != null) && (this.g != null) && (this.b != null)) {

    // Red Green Blue
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
        // Hue Saturation Lightness
        throw new Error("Hue, saturation, and...? (either lightness or value)");
      }
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
        throw new Error("Color constructor must be called with {r,g,b} or {h,s,v} or {h,s,l} or {c,m,y,k} or {x,y,z} or {l,a,b}");
      }
    }
  }

  toString() {
    if (this.r != null) {
      // Red Green Blue
      if (this.a != null) {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a
// Opaque
})`;
      } else {
        return `rgb(${this.r}, ${this.g}, ${this.b})`; // Alpha
      }
    } else if (this.h != null) {
      // Hue Saturation Lightness
      // (Assume h:0-360, s:0-100, l:0-100)
      if (this.a != null) {
        return `hsla(${this.h}, ${this.s}%, ${this.l}%, ${this.a
// Opaque
})`;
      } else {
        return `hsl(${this.h}, ${this.s}%, ${this.l}%)`; // Alpha
      }
    }
  }

  is(color) {
    return `${this}` === `${color}`;
  }

};


},{}],3:[function(require,module,exports){
var Color, Palette;

Color = require("./Color");

module.exports = Palette = class Palette extends Array {
  constructor() {
    super();
    this.with_duplicates = this;
  }

  add(o) {
    var color, i, len1, new_color, ref;
    new_color = new Color(o);
    if (this.with_duplicates === this) {
      this.with_duplicates = new Palette();
    }
    this.with_duplicates.push(new_color);
    ref = this;
    for (i = 0, len1 = ref.length; i < len1; i++) {
      color = ref[i];
      if (color.is(new_color)) {
        new_color.is_duplicate = true;
        return;
      }
    }
    return this.push(new_color);
  }

  finalize() {
    if (!this.n_columns) {
      this.guess_dimensions();
    }
    if (this.with_duplicates) {
      return this.with_duplicates.guess_dimensions();
    }
  }

  guess_dimensions() {
    var candidate_dimensions, cd, i, j, len, len1, n_columns, n_rows, ref, results, squarest;
    len = this.length;
    candidate_dimensions = [];
    for (n_columns = i = 0, ref = len; (0 <= ref ? i <= ref : i >= ref); n_columns = 0 <= ref ? ++i : --i) {
      n_rows = len / n_columns;
      if (n_rows === Math.round(n_rows)) {
        candidate_dimensions.push([n_rows, n_columns]);
      }
    }
    squarest = [0, 3495093];
    results = [];
    for (j = 0, len1 = candidate_dimensions.length; j < len1; j++) {
      cd = candidate_dimensions[j];
      if (Math.abs(cd[0] - cd[1]) < Math.abs(squarest[0] - squarest[1])) {
        results.push(squarest = cd);
      } else {
        results.push(void 0);
      }
    }
    return results;
  }

};


//@n_columns = squarest[1]


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
    if (line.match(/^#/) || line === "") {
      continue;
    }
    m = line.match(/Name:\s*(.*)/);
    if (m) {
      palette.name = m[1];
      continue;
    }
    m = line.match(/Columns:\s*(.*)/);
    if (m) {
      palette.n_columns = Number(m[1]);
      palette.has_dimensions = true;
      continue;
    }
    r_g_b_name = line.match(/^\s*([0-9]+)\s+([0-9]+)\s+([0-9]+)(?:\s+(.*))?$/);
    if (!r_g_b_name) {
      throw new Error(`Line ${i} doesn't match pattern r_g_b_name`);
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

// ported from C# code at http://worms2d.info/Palette_file
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
    throw new Error(`RIFF header says this isn't a PAL file,\nmore of a sort of ${(type + "").trim()} file`);
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
    throw new Error(`Unsupported PAL file version: 0x${palVersion.toString(16)}`);
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

  //? palette.n_columns = 16
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
  palette.n_columns = 16;
  return palette;
};


},{"../BinaryReader":1,"../Palette":3}],13:[function(require,module,exports){
(function (global){
var Color, LoadingErrors, P, Palette, RandomColor, RandomPalette, load_palette, options;

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
    this.loaded_as = "Completely Random Colors™";
    this.loaded_as_clause = "(.crc sjf(Df09sjdfksdlfmnm ';';";
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
      exts: ["txt",
    "pdn"],
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
      name: "hey look some colors",
      exts: ["txt",
    "html",
    "css",
    "xml",
    "svg",
    "etc"],
      // @TODO: rename this to "CSS" (it's not very "generic")
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
      name: "Houndstooth Palette Locellate",
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
    pl.matches_ext = pl.exts.indexOf(o.file_ext) !== -1;
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
      msg = `failed to load ${o.file_name} as ${pl.name}: ${e.message}`;
      if (pl.matches_ext && !e.message.match(/not a/i)) {
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.error === "function") {
            console.error(msg);
          }
        }
      } else {
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.warn === "function") {
            console.warn(msg);
          }
        }
      }
      err = new Error(msg);
      err.error = e;
      errors.push(err);
    }
    if (palette) {
      if (typeof console !== "undefined" && console !== null) {
        if (typeof console.info === "function") {
          console.info(`loaded ${o.file_name} as ${pl.name}`);
        }
      }
      palette.confidence = pl.matches_ext ? 0.9 : 0.01;
      palette.loaded_as = pl.name;
      exts_pretty = `(.${pl.exts.join(", .")})`;
      if (pl.matches_ext) {
        palette.loaded_as_clause = exts_pretty;
      } else {
        palette.loaded_as_clause = " for some reason";
      }
      palette.finalize();
      callback(null, palette);
      return;
    }
  }
  callback(new LoadingErrors(errors));
};

options = function(o = {}) {
  var ref, ref1, ref2, ref3, ref4, ref5;
  if (typeof o === "string" || o instanceof String) {
    o = {
      file_name: o
    };
  }
  if ((typeof File !== "undefined" && File !== null) && o instanceof File) {
    o = {
      file: o
    };
  }
  if (o.min_colors == null) {
    o.min_colors = (ref = o.minColors) != null ? ref : 2;
  }
  if (o.max_colors == null) {
    o.max_colors = (ref1 = o.maxColors) != null ? ref1 : 256;
  }
  if (o.file_name == null) {
    o.file_name = (ref2 = (ref3 = o.fileName) != null ? ref3 : o.fname) != null ? ref2 : (ref4 = o.file) != null ? ref4.name : void 0;
  }
  if (o.file_ext == null) {
    o.file_ext = (ref5 = o.fileExt) != null ? ref5 : `${o.file_name}`.split(".").pop();
  }
  o.file_ext = `${o.file_ext}`.toLowerCase();
  return o;
};


// Get palette from a file
Palette.load = function(o, callback) {
  var fr, fs;
  if (!o) {
    throw new Error("Parameters required: Palette.load(options, function callback(err, palette){})");
  }
  if (!callback) {
    throw new Error("Callback required: Palette.load(options, function callback(err, palette){})");
  }
  o = options(o);
  if (o.data) {
    return load_palette(o, callback);
  } else if ((typeof File !== "undefined" && File !== null) && o.file instanceof File) {
    fr = new FileReader;
    fr.onload = function() {
      o.data = fr.result;
      return load_palette(o, callback);
    };
    return fr.readAsBinaryString(o.file);
  } else if (typeof global !== "undefined" && global !== null) {
    fs = require("fs");
    return fs.readFile(o.file_name, function(err, data) {
      if (err) {
        return callback(err);
      } else {
        o.data = data.toString("binary");
        return load_palette(o, callback);
      }
    });
  } else {
    return callback(new Error("Could not load. The File API may not be supported."));
  }
};

// Get a palette from a file or by any means nessesary
// (as in fall back to completely random data)
Palette.gimme = function(o, callback) {
  o = options(o);
  return Palette.load(o, function(err, palette) {
    return callback(null, palette != null ? palette : new RandomPalette);
  });
};

// Exports
P = module.exports = Palette;

P.Color = Color;

P.Palette = Palette;

P.RandomColor = RandomColor;

P.RandomPalette = RandomPalette;

// P.LoadingErrors = LoadingErrors


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./Color":2,"./Palette":3,"./loaders/ColorSchemer":4,"./loaders/GIMP":5,"./loaders/Generic":6,"./loaders/HPL":7,"./loaders/Paint.NET":8,"./loaders/PaintShopPro":9,"./loaders/RIFF":10,"./loaders/StarCraft":11,"./loaders/StarCraftPadded":12,"fs":"fs"}]},{},[13])(13)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQmluYXJ5UmVhZGVyLmNvZmZlZSIsInNyYy9Db2xvci5jb2ZmZWUiLCJzcmMvUGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbG9hZGVycy9Db2xvclNjaGVtZXIuY29mZmVlIiwic3JjL2xvYWRlcnMvR0lNUC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9HZW5lcmljLmNvZmZlZSIsInNyYy9sb2FkZXJzL0hQTC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9QYWludC5ORVQuY29mZmVlIiwic3JjL2xvYWRlcnMvUGFpbnRTaG9wUHJvLmNvZmZlZSIsInNyYy9sb2FkZXJzL1JJRkYuY29mZmVlIiwic3JjL2xvYWRlcnMvU3RhckNyYWZ0LmNvZmZlZSIsInNyYy9sb2FkZXJzL1N0YXJDcmFmdFBhZGRlZC5jb2ZmZWUiLCJzcmMvc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFBOztBQWVBLE1BQU0sQ0FBQyxPQUFQLEdBQ007RUFBTixNQUFBLGFBQUE7SUFDQyxXQUFhLENBQUMsSUFBRCxDQUFBO01BQ1osSUFBQyxDQUFBLE9BQUQsR0FBVztNQUNYLElBQUMsQ0FBQSxJQUFELEdBQVE7SUFGSSxDQUFiOzs7SUFNQSxRQUFVLENBQUEsQ0FBQTtBQUNULFVBQUE7TUFBQSxJQUFDLENBQUEsVUFBRCxDQUFZLENBQVo7TUFDQSxFQUFBLEdBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFiLENBQXdCLElBQUMsQ0FBQSxJQUF6QixDQUFBLEdBQWlDO01BQ3RDLElBQUMsQ0FBQSxJQUFELElBQVM7YUFDVCxFQUFBLEdBQUs7SUFKSTs7SUFNVixpQkFBbUIsQ0FBQSxDQUFBO0FBQ2xCLFVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBO01BQUEsTUFBQSxHQUFTLElBQUMsQ0FBQSxVQUFELENBQUE7TUFD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R0FBZ0I7O0FBQ2hCLENBQUMsQ0FBQyxhQUFGLEdBQWtCOztBQS9ObEIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcclxuIyMjXHJcbkJpbmFyeVJlYWRlclxyXG5cclxuTW9kaWZpZWQgYnkgSXNhaWFoIE9kaG5lclxyXG5AVE9ETzogdXNlIGpEYXRhVmlldyArIGpCaW5hcnkgaW5zdGVhZFxyXG5cclxuUmVmYWN0b3JlZCBieSBWamV1eCA8dmpldXh4QGdtYWlsLmNvbT5cclxuaHR0cDovL2Jsb2cudmpldXguY29tLzIwMTAvamF2YXNjcmlwdC9qYXZhc2NyaXB0LWJpbmFyeS1yZWFkZXIuaHRtbFxyXG5cclxuT3JpZ2luYWxcclxuKyBKb25hcyBSYW9uaSBTb2FyZXMgU2lsdmFcclxuQCBodHRwOi8vanNmcm9taGVsbC5jb20vY2xhc3Nlcy9iaW5hcnktcGFyc2VyIFtyZXYuICMxXVxyXG4jIyNcclxuXHJcbm1vZHVsZS5leHBvcnRzID1cclxuY2xhc3MgQmluYXJ5UmVhZGVyXHJcblx0Y29uc3RydWN0b3I6IChkYXRhKS0+XHJcblx0XHRAX2J1ZmZlciA9IGRhdGFcclxuXHRcdEBfcG9zID0gMFxyXG5cclxuXHQjIFB1YmxpYyAoY3VzdG9tKVxyXG5cdFxyXG5cdHJlYWRCeXRlOiAtPlxyXG5cdFx0QF9jaGVja1NpemUoOClcclxuXHRcdGNoID0gdGhpcy5fYnVmZmVyLmNoYXJDb2RlQXQoQF9wb3MpICYgMHhmZlxyXG5cdFx0QF9wb3MgKz0gMVxyXG5cdFx0Y2ggJiAweGZmXHJcblx0XHJcblx0cmVhZFVuaWNvZGVTdHJpbmc6IC0+XHJcblx0XHRsZW5ndGggPSBAcmVhZFVJbnQxNigpXHJcblx0XHRjb25zb2xlLmxvZyB7bGVuZ3RofVxyXG5cdFx0QF9jaGVja1NpemUobGVuZ3RoICogMTYpXHJcblx0XHRzdHIgPSBcIlwiXHJcblx0XHRmb3IgaSBpbiBbMC4ubGVuZ3RoXVxyXG5cdFx0XHRzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShAX2J1ZmZlci5zdWJzdHIoQF9wb3MsIDEpIHwgKEBfYnVmZmVyLnN1YnN0cihAX3BvcysxLCAxKSA8PCA4KSlcclxuXHRcdFx0QF9wb3MgKz0gMlxyXG5cdFx0c3RyXHJcblx0XHJcblx0IyBQdWJsaWNcclxuXHRcclxuXHRyZWFkSW50ODogLT4gQF9kZWNvZGVJbnQoOCwgdHJ1ZSlcclxuXHRyZWFkVUludDg6IC0+IEBfZGVjb2RlSW50KDgsIGZhbHNlKVxyXG5cdHJlYWRJbnQxNjogLT4gQF9kZWNvZGVJbnQoMTYsIHRydWUpXHJcblx0cmVhZFVJbnQxNjogLT4gQF9kZWNvZGVJbnQoMTYsIGZhbHNlKVxyXG5cdHJlYWRJbnQzMjogLT4gQF9kZWNvZGVJbnQoMzIsIHRydWUpXHJcblx0cmVhZFVJbnQzMjogLT4gQF9kZWNvZGVJbnQoMzIsIGZhbHNlKVxyXG5cclxuXHRyZWFkRmxvYXQ6IC0+IEBfZGVjb2RlRmxvYXQoMjMsIDgpXHJcblx0cmVhZERvdWJsZTogLT4gQF9kZWNvZGVGbG9hdCg1MiwgMTEpXHJcblx0XHJcblx0cmVhZENoYXI6IC0+IEByZWFkU3RyaW5nKDEpXHJcblx0cmVhZFN0cmluZzogKGxlbmd0aCktPlxyXG5cdFx0QF9jaGVja1NpemUobGVuZ3RoICogOClcclxuXHRcdHJlc3VsdCA9IEBfYnVmZmVyLnN1YnN0cihAX3BvcywgbGVuZ3RoKVxyXG5cdFx0QF9wb3MgKz0gbGVuZ3RoXHJcblx0XHRyZXN1bHRcclxuXHJcblx0c2VlazogKHBvcyktPlxyXG5cdFx0QF9wb3MgPSBwb3NcclxuXHRcdEBfY2hlY2tTaXplKDApXHJcblx0XHJcblx0Z2V0UG9zaXRpb246IC0+IEBfcG9zXHJcblx0XHJcblx0Z2V0U2l6ZTogLT4gQF9idWZmZXIubGVuZ3RoXHJcblx0XHJcblxyXG5cclxuXHQjIFByaXZhdGVcclxuXHRcclxuXHRfZGVjb2RlRmxvYXQ6IGBmdW5jdGlvbihwcmVjaXNpb25CaXRzLCBleHBvbmVudEJpdHMpe1xyXG5cdFx0dmFyIGxlbmd0aCA9IHByZWNpc2lvbkJpdHMgKyBleHBvbmVudEJpdHMgKyAxO1xyXG5cdFx0dmFyIHNpemUgPSBsZW5ndGggPj4gMztcclxuXHRcdHRoaXMuX2NoZWNrU2l6ZShsZW5ndGgpO1xyXG5cclxuXHRcdHZhciBiaWFzID0gTWF0aC5wb3coMiwgZXhwb25lbnRCaXRzIC0gMSkgLSAxO1xyXG5cdFx0dmFyIHNpZ25hbCA9IHRoaXMuX3JlYWRCaXRzKHByZWNpc2lvbkJpdHMgKyBleHBvbmVudEJpdHMsIDEsIHNpemUpO1xyXG5cdFx0dmFyIGV4cG9uZW50ID0gdGhpcy5fcmVhZEJpdHMocHJlY2lzaW9uQml0cywgZXhwb25lbnRCaXRzLCBzaXplKTtcclxuXHRcdHZhciBzaWduaWZpY2FuZCA9IDA7XHJcblx0XHR2YXIgZGl2aXNvciA9IDI7XHJcblx0XHR2YXIgY3VyQnl0ZSA9IDA7IC8vbGVuZ3RoICsgKC1wcmVjaXNpb25CaXRzID4+IDMpIC0gMTtcclxuXHRcdGRvIHtcclxuXHRcdFx0dmFyIGJ5dGVWYWx1ZSA9IHRoaXMuX3JlYWRCeXRlKCsrY3VyQnl0ZSwgc2l6ZSk7XHJcblx0XHRcdHZhciBzdGFydEJpdCA9IHByZWNpc2lvbkJpdHMgJSA4IHx8IDg7XHJcblx0XHRcdHZhciBtYXNrID0gMSA8PCBzdGFydEJpdDtcclxuXHRcdFx0d2hpbGUgKG1hc2sgPj49IDEpIHtcclxuXHRcdFx0XHRpZiAoYnl0ZVZhbHVlICYgbWFzaykge1xyXG5cdFx0XHRcdFx0c2lnbmlmaWNhbmQgKz0gMSAvIGRpdmlzb3I7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRpdmlzb3IgKj0gMjtcclxuXHRcdFx0fVxyXG5cdFx0fSB3aGlsZSAocHJlY2lzaW9uQml0cyAtPSBzdGFydEJpdCk7XHJcblxyXG5cdFx0dGhpcy5fcG9zICs9IHNpemU7XHJcblxyXG5cdFx0cmV0dXJuIGV4cG9uZW50ID09IChiaWFzIDw8IDEpICsgMSA/IHNpZ25pZmljYW5kID8gTmFOIDogc2lnbmFsID8gLUluZmluaXR5IDogK0luZmluaXR5XHJcblx0XHRcdDogKDEgKyBzaWduYWwgKiAtMikgKiAoZXhwb25lbnQgfHwgc2lnbmlmaWNhbmQgPyAhZXhwb25lbnQgPyBNYXRoLnBvdygyLCAtYmlhcyArIDEpICogc2lnbmlmaWNhbmRcclxuXHRcdFx0OiBNYXRoLnBvdygyLCBleHBvbmVudCAtIGJpYXMpICogKDEgKyBzaWduaWZpY2FuZCkgOiAwKTtcclxuXHR9YFxyXG5cclxuXHRfZGVjb2RlSW50OiBgZnVuY3Rpb24oYml0cywgc2lnbmVkKXtcclxuXHRcdHZhciB4ID0gdGhpcy5fcmVhZEJpdHMoMCwgYml0cywgYml0cyAvIDgpLCBtYXggPSBNYXRoLnBvdygyLCBiaXRzKTtcclxuXHRcdHZhciByZXN1bHQgPSBzaWduZWQgJiYgeCA+PSBtYXggLyAyID8geCAtIG1heCA6IHg7XHJcblxyXG5cdFx0dGhpcy5fcG9zICs9IGJpdHMgLyA4O1xyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9YFxyXG5cclxuXHQjc2hsIGZpeDogSGVucmkgVG9yZ2VtYW5lIH4xOTk2IChjb21wcmVzc2VkIGJ5IEpvbmFzIFJhb25pKVxyXG5cdF9zaGw6IGBmdW5jdGlvbiAoYSwgYil7XHJcblx0XHRmb3IgKCsrYjsgLS1iOyBhID0gKChhICU9IDB4N2ZmZmZmZmYgKyAxKSAmIDB4NDAwMDAwMDApID09IDB4NDAwMDAwMDAgPyBhICogMiA6IChhIC0gMHg0MDAwMDAwMCkgKiAyICsgMHg3ZmZmZmZmZiArIDEpO1xyXG5cdFx0cmV0dXJuIGE7XHJcblx0fWBcclxuXHRcclxuXHRfcmVhZEJ5dGU6IGBmdW5jdGlvbiAoaSwgc2l6ZSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2J1ZmZlci5jaGFyQ29kZUF0KHRoaXMuX3BvcyArIHNpemUgLSBpIC0gMSkgJiAweGZmO1xyXG5cdH1gXHJcblxyXG5cdF9yZWFkQml0czogYGZ1bmN0aW9uIChzdGFydCwgbGVuZ3RoLCBzaXplKSB7XHJcblx0XHR2YXIgb2Zmc2V0TGVmdCA9IChzdGFydCArIGxlbmd0aCkgJSA4O1xyXG5cdFx0dmFyIG9mZnNldFJpZ2h0ID0gc3RhcnQgJSA4O1xyXG5cdFx0dmFyIGN1ckJ5dGUgPSBzaXplIC0gKHN0YXJ0ID4+IDMpIC0gMTtcclxuXHRcdHZhciBsYXN0Qnl0ZSA9IHNpemUgKyAoLShzdGFydCArIGxlbmd0aCkgPj4gMyk7XHJcblx0XHR2YXIgZGlmZiA9IGN1ckJ5dGUgLSBsYXN0Qnl0ZTtcclxuXHJcblx0XHR2YXIgc3VtID0gKHRoaXMuX3JlYWRCeXRlKGN1ckJ5dGUsIHNpemUpID4+IG9mZnNldFJpZ2h0KSAmICgoMSA8PCAoZGlmZiA/IDggLSBvZmZzZXRSaWdodCA6IGxlbmd0aCkpIC0gMSk7XHJcblxyXG5cdFx0aWYgKGRpZmYgJiYgb2Zmc2V0TGVmdCkge1xyXG5cdFx0XHRzdW0gKz0gKHRoaXMuX3JlYWRCeXRlKGxhc3RCeXRlKyssIHNpemUpICYgKCgxIDw8IG9mZnNldExlZnQpIC0gMSkpIDw8IChkaWZmLS0gPDwgMykgLSBvZmZzZXRSaWdodDsgXHJcblx0XHR9XHJcblxyXG5cdFx0d2hpbGUgKGRpZmYpIHtcclxuXHRcdFx0c3VtICs9IHRoaXMuX3NobCh0aGlzLl9yZWFkQnl0ZShsYXN0Qnl0ZSsrLCBzaXplKSwgKGRpZmYtLSA8PCAzKSAtIG9mZnNldFJpZ2h0KTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gc3VtO1xyXG5cdH1gXHJcblxyXG5cdF9jaGVja1NpemU6IChuZWVkZWRCaXRzKS0+XHJcblx0XHRpZiBAX3BvcyArIE1hdGguY2VpbChuZWVkZWRCaXRzIC8gOCkgPiBAX2J1ZmZlci5sZW5ndGhcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiSW5kZXggb3V0IG9mIGJvdW5kXCJcclxuXHJcbiIsIlxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIENvbG9yXHJcblx0IyBAVE9ETzogZG9uJ3QgYXNzaWduIHtAciwgQGcsIEBiLCBAaCwgQHMsIEB2LCBAbH0gcmlnaHQgYXdheVxyXG5cdCMgKG1vcmUgb2YgYSB0by1kb24ndCwgcmVhbGx5KVxyXG5cdGNvbnN0cnVjdG9yOiAoe1xyXG5cdFx0QHIsIEBnLCBAYixcclxuXHRcdEBoLCBAcywgQHYsIEBsLFxyXG5cdFx0YywgbSwgeSwgayxcclxuXHRcdEBuYW1lXHJcblx0fSktPlxyXG5cdFx0aWYgQHI/IGFuZCBAZz8gYW5kIEBiP1xyXG5cdFx0XHQjIFJlZCBHcmVlbiBCbHVlXHJcblx0XHRlbHNlIGlmIEBoPyBhbmQgQHM/XHJcblx0XHRcdCMgQ3lsaW5kcmljYWwgQ29sb3IgU3BhY2VcclxuXHRcdFx0aWYgQHY/XHJcblx0XHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBWYWx1ZVxyXG5cdFx0XHRcdEBsID0gKDIgLSBAcyAvIDEwMCkgKiBAdiAvIDJcclxuXHRcdFx0XHRAcyA9IEBzICogQHYgLyAoaWYgQGwgPCA1MCB0aGVuIEBsICogMiBlbHNlIDIwMCAtIEBsICogMilcclxuXHRcdFx0XHRAcyA9IDAgaWYgaXNOYU4gQHNcclxuXHRcdFx0ZWxzZSBpZiBAbD9cclxuXHRcdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIExpZ2h0bmVzc1xyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiSHVlLCBzYXR1cmF0aW9uLCBhbmQuLi4/IChlaXRoZXIgbGlnaHRuZXNzIG9yIHZhbHVlKVwiXHJcblx0XHRlbHNlIGlmIGM/IGFuZCBtPyBhbmQgeT8gYW5kIGs/XHJcblx0XHRcdCMgQ3lhbiBNYWdlbnRhIFllbGxvdyBibGFjS1xyXG5cdFx0XHQjIFVOVEVTVEVEXHJcblx0XHRcdGMgLz0gMTAwXHJcblx0XHRcdG0gLz0gMTAwXHJcblx0XHRcdHkgLz0gMTAwXHJcblx0XHRcdGsgLz0gMTAwXHJcblx0XHRcdFxyXG5cdFx0XHRAciA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgYyAqICgxIC0gaykgKyBrKSlcclxuXHRcdFx0QGcgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIG0gKiAoMSAtIGspICsgaykpXHJcblx0XHRcdEBiID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCB5ICogKDEgLSBrKSArIGspKVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHQjIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEXHJcblx0XHRcdGlmIEBsPyBhbmQgQGE/IGFuZCBAYj9cclxuXHRcdFx0XHR3aGl0ZSA9XHJcblx0XHRcdFx0XHR4OiA5NS4wNDdcclxuXHRcdFx0XHRcdHk6IDEwMC4wMDBcclxuXHRcdFx0XHRcdHo6IDEwOC44ODNcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR4eXogPSBcclxuXHRcdFx0XHRcdHk6IChyYXcubCArIDE2KSAvIDExNlxyXG5cdFx0XHRcdFx0eDogcmF3LmEgLyA1MDAgKyB4eXoueVxyXG5cdFx0XHRcdFx0ejogeHl6LnkgLSByYXcuYiAvIDIwMFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGZvciBfIGluIFwieHl6XCJcclxuXHRcdFx0XHRcdHBvd2VkID0gTWF0aC5wb3coeHl6W19dLCAzKVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiBwb3dlZCA+IDAuMDA4ODU2XHJcblx0XHRcdFx0XHRcdHh5eltfXSA9IHBvd2VkXHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdHh5eltfXSA9ICh4eXpbX10gLSAxNiAvIDExNikgLyA3Ljc4N1xyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHQjeHl6W19dID0gX3JvdW5kKHh5eltfXSAqIHdoaXRlW19dKVxyXG5cdFx0XHRcdFxyXG5cdFx0XHQjIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEXHJcblx0XHRcdGlmIEB4PyBhbmQgQHk/IGFuZCBAej9cclxuXHRcdFx0XHR4eXogPVxyXG5cdFx0XHRcdFx0eDogcmF3LnggLyAxMDBcclxuXHRcdFx0XHRcdHk6IHJhdy55IC8gMTAwXHJcblx0XHRcdFx0XHR6OiByYXcueiAvIDEwMFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHJnYiA9XHJcblx0XHRcdFx0XHRyOiB4eXoueCAqIDMuMjQwNiArIHh5ei55ICogLTEuNTM3MiArIHh5ei56ICogLTAuNDk4NlxyXG5cdFx0XHRcdFx0ZzogeHl6LnggKiAtMC45Njg5ICsgeHl6LnkgKiAxLjg3NTggKyB4eXoueiAqIDAuMDQxNVxyXG5cdFx0XHRcdFx0YjogeHl6LnggKiAwLjA1NTcgKyB4eXoueSAqIC0wLjIwNDAgKyB4eXoueiAqIDEuMDU3MFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGZvciBfIGluIFwicmdiXCJcclxuXHRcdFx0XHRcdCNyZ2JbX10gPSBfcm91bmQocmdiW19dKVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiByZ2JbX10gPCAwXHJcblx0XHRcdFx0XHRcdHJnYltfXSA9IDBcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYgcmdiW19dID4gMC4wMDMxMzA4XHJcblx0XHRcdFx0XHRcdHJnYltfXSA9IDEuMDU1ICogTWF0aC5wb3cocmdiW19dLCAoMSAvIDIuNCkpIC0gMC4wNTVcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0cmdiW19dICo9IDEyLjkyXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0I3JnYltfXSA9IE1hdGgucm91bmQocmdiW19dICogMjU1KVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiQ29sb3IgY29uc3RydWN0b3IgbXVzdCBiZSBjYWxsZWQgd2l0aCB7cixnLGJ9IG9yIHtoLHMsdn0gb3Ige2gscyxsfSBvciB7YyxtLHksa30gb3Ige3gseSx6fSBvciB7bCxhLGJ9XCJcclxuXHRcdFxyXG5cdFxyXG5cdHRvU3RyaW5nOiAtPlxyXG5cdFx0aWYgQHI/XHJcblx0XHRcdCMgUmVkIEdyZWVuIEJsdWVcclxuXHRcdFx0aWYgQGE/ICMgQWxwaGFcclxuXHRcdFx0XHRcInJnYmEoI3tAcn0sICN7QGd9LCAje0BifSwgI3tAYX0pXCJcclxuXHRcdFx0ZWxzZSAjIE9wYXF1ZVxyXG5cdFx0XHRcdFwicmdiKCN7QHJ9LCAje0BnfSwgI3tAYn0pXCJcclxuXHRcdGVsc2UgaWYgQGg/XHJcblx0XHRcdCMgSHVlIFNhdHVyYXRpb24gTGlnaHRuZXNzXHJcblx0XHRcdCMgKEFzc3VtZSBoOjAtMzYwLCBzOjAtMTAwLCBsOjAtMTAwKVxyXG5cdFx0XHRpZiBAYT8gIyBBbHBoYVxyXG5cdFx0XHRcdFwiaHNsYSgje0BofSwgI3tAc30lLCAje0BsfSUsICN7QGF9KVwiXHJcblx0XHRcdGVsc2UgIyBPcGFxdWVcclxuXHRcdFx0XHRcImhzbCgje0BofSwgI3tAc30lLCAje0BsfSUpXCJcclxuXHRcclxuXHRpczogKGNvbG9yKS0+XHJcblx0XHRcIiN7QH1cIiBpcyBcIiN7Y29sb3J9XCJcclxuIiwiXHJcbkNvbG9yID0gcmVxdWlyZSBcIi4vQ29sb3JcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG5jbGFzcyBQYWxldHRlIGV4dGVuZHMgQXJyYXlcclxuXHRcclxuXHRjb25zdHJ1Y3RvcjogLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEB3aXRoX2R1cGxpY2F0ZXMgPSBAXHJcblx0XHRcclxuXHRhZGQ6IChvKS0+XHJcblx0XHRuZXdfY29sb3IgPSBuZXcgQ29sb3IobylcclxuXHRcdFxyXG5cdFx0aWYgQHdpdGhfZHVwbGljYXRlcyBpcyBAXHJcblx0XHRcdEB3aXRoX2R1cGxpY2F0ZXMgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRcclxuXHRcdEB3aXRoX2R1cGxpY2F0ZXMucHVzaCBuZXdfY29sb3JcclxuXHRcdFxyXG5cdFx0Zm9yIGNvbG9yIGluIEBcclxuXHRcdFx0aWYgY29sb3IuaXMgbmV3X2NvbG9yXHJcblx0XHRcdFx0bmV3X2NvbG9yLmlzX2R1cGxpY2F0ZSA9IHRydWVcclxuXHRcdFx0XHRyZXR1cm5cclxuXHRcdFxyXG5cdFx0QHB1c2ggbmV3X2NvbG9yXHJcblx0XHJcblx0ZmluYWxpemU6IC0+XHJcblx0XHRpZiBub3QgQG5fY29sdW1uc1xyXG5cdFx0XHRAZ3Vlc3NfZGltZW5zaW9ucygpXHJcblx0XHRpZiBAd2l0aF9kdXBsaWNhdGVzXHJcblx0XHRcdEB3aXRoX2R1cGxpY2F0ZXMuZ3Vlc3NfZGltZW5zaW9ucygpXHJcblx0XHRcclxuXHRndWVzc19kaW1lbnNpb25zOiAtPlxyXG5cdFx0bGVuID0gQGxlbmd0aFxyXG5cdFx0Y2FuZGlkYXRlX2RpbWVuc2lvbnMgPSBbXVxyXG5cdFx0Zm9yIG5fY29sdW1ucyBpbiBbMC4ubGVuXVxyXG5cdFx0XHRuX3Jvd3MgPSBsZW4gLyBuX2NvbHVtbnNcclxuXHRcdFx0aWYgbl9yb3dzIGlzIE1hdGgucm91bmQgbl9yb3dzXHJcblx0XHRcdFx0Y2FuZGlkYXRlX2RpbWVuc2lvbnMucHVzaCBbbl9yb3dzLCBuX2NvbHVtbnNdXHJcblx0XHRcclxuXHRcdHNxdWFyZXN0ID0gWzAsIDM0OTUwOTNdXHJcblx0XHRmb3IgY2QgaW4gY2FuZGlkYXRlX2RpbWVuc2lvbnNcclxuXHRcdFx0aWYgTWF0aC5hYnMoY2RbMF0gLSBjZFsxXSkgPCBNYXRoLmFicyhzcXVhcmVzdFswXSAtIHNxdWFyZXN0WzFdKVxyXG5cdFx0XHRcdHNxdWFyZXN0ID0gY2RcclxuXHRcdFxyXG5cdFx0I0BuX2NvbHVtbnMgPSBzcXVhcmVzdFsxXVxyXG4iLCJcclxuIyBMb2FkIGEgQ29sb3JTY2hlbWVyIHBhbGV0dGVcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHR2ZXJzaW9uID0gYnIucmVhZFVJbnQxNigpICMgb3Igc29tZXRoaW5nXHJcblx0bGVuZ3RoID0gYnIucmVhZFVJbnQxNigpXHJcblx0aSA9IDBcclxuXHR3aGlsZSBpIDwgbGVuZ3RoXHJcblx0XHRici5zZWVrKDggKyBpICogMjYpXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0aSArPSAxXHJcblxyXG5cdHBhbGV0dGVcclxuXHJcbiIsIlxyXG4jIExvYWQgYSBHSU1QIHBhbGV0dGVcclxuXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdGlmIGxpbmVzWzBdIGlzbnQgXCJHSU1QIFBhbGV0dGVcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiTm90IGEgR0lNUCBQYWxldHRlXCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGkgPSAxXHJcblx0d2hpbGUgKGkgKz0gMSkgPCBsaW5lcy5sZW5ndGhcclxuXHRcdGxpbmUgPSBsaW5lc1tpXVxyXG5cdFx0XHJcblx0XHRpZiBsaW5lLm1hdGNoKC9eIy8pIG9yIGxpbmUgaXMgXCJcIiB0aGVuIGNvbnRpbnVlXHJcblx0XHRcclxuXHRcdG0gPSBsaW5lLm1hdGNoKC9OYW1lOlxccyooLiopLylcclxuXHRcdGlmIG1cclxuXHRcdFx0cGFsZXR0ZS5uYW1lID0gbVsxXVxyXG5cdFx0XHRjb250aW51ZVxyXG5cdFx0bSA9IGxpbmUubWF0Y2goL0NvbHVtbnM6XFxzKiguKikvKVxyXG5cdFx0aWYgbVxyXG5cdFx0XHRwYWxldHRlLm5fY29sdW1ucyA9IE51bWJlcihtWzFdKVxyXG5cdFx0XHRwYWxldHRlLmhhc19kaW1lbnNpb25zID0geWVzXHJcblx0XHRcdGNvbnRpbnVlXHJcblx0XHRcclxuXHRcdHJfZ19iX25hbWUgPSBsaW5lLm1hdGNoKC9eXFxzKihbMC05XSspXFxzKyhbMC05XSspXFxzKyhbMC05XSspKD86XFxzKyguKikpPyQvKVxyXG5cdFx0aWYgbm90IHJfZ19iX25hbWVcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiTGluZSAje2l9IGRvZXNuJ3QgbWF0Y2ggcGF0dGVybiByX2dfYl9uYW1lXCJcclxuXHRcdFxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogcl9nX2JfbmFtZVsxXVxyXG5cdFx0XHRnOiByX2dfYl9uYW1lWzJdXHJcblx0XHRcdGI6IHJfZ19iX25hbWVbM11cclxuXHRcdFx0bmFtZTogcl9nX2JfbmFtZVs0XVxyXG5cdFx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBEZXRlY3QgQ1NTIGNvbG9ycyAoZXhjZXB0IG5hbWVkIGNvbG9ycylcclxuXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlcyA9IFtcclxuXHRcdHBhbGV0dGVfeFJSR0dCQiA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfeFJHQiA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfcmdiID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9oc2wgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX2hzbGEgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX3JnYmEgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XVxyXG5cdFxyXG5cdGhleCA9ICh4KS0+IHBhcnNlSW50KHgsIDE2KVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdFxcIyAjIGhhc2h0YWcgIyAjL1xyXG5cdFx0KFswLTlBLUZdezJ9KT8gIyBhbHBoYVxyXG5cdFx0KFswLTlBLUZdezN9KSAjIHRocmVlIGRpZ2l0cyAoI0EwQylcclxuXHRcdChbMC05QS1GXXszfSk/ICMgc2l4IGRpZ2l0cyAoI0FBMDBDQylcclxuXHRcdFxyXG5cdFx0KD8hWzAtOUEtRl0pICMgKGFuZCBubyBtb3JlISlcclxuXHQvLy9naW0sIChtLCAkMCwgJDEsICQyKS0+XHJcblx0XHRcclxuXHRcdGFscGhhID0gaGV4ICQwXHJcblx0XHRcclxuXHRcdGlmICQyXHJcblx0XHRcdHhSR0IgPSAkMSArICQyXHJcblx0XHRcdHBhbGV0dGVfeFJSR0dCQi5hZGRcclxuXHRcdFx0XHRyOiBoZXggeFJHQlswXSArIHhSR0JbMV1cclxuXHRcdFx0XHRnOiBoZXggeFJHQlsyXSArIHhSR0JbM11cclxuXHRcdFx0XHRiOiBoZXggeFJHQls0XSArIHhSR0JbNV1cclxuXHRcdFx0XHRhOiBhbHBoYVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHR4UkdCID0gJDFcclxuXHRcdFx0cGFsZXR0ZV94UkdCLmFkZFxyXG5cdFx0XHRcdHI6IGhleCB4UkdCWzBdICsgeFJHQlswXVxyXG5cdFx0XHRcdGc6IGhleCB4UkdCWzFdICsgeFJHQlsxXVxyXG5cdFx0XHRcdGI6IGhleCB4UkdCWzJdICsgeFJHQlsyXVxyXG5cdFx0XHRcdGE6IGFscGhhXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0cmdiXFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgcmVkXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGdyZWVuXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGJsdWVcclxuXHRcdFx0XFxzKlxyXG5cdFx0XFwpXHJcblx0Ly8vZ2ltLCAobSktPlxyXG5cdFx0cGFsZXR0ZV9yZ2IuYWRkXHJcblx0XHRcdHI6IE51bWJlciBtWzFdXHJcblx0XHRcdGc6IE51bWJlciBtWzJdXHJcblx0XHRcdGI6IE51bWJlciBtWzNdXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0cmdiYVxcKFxyXG5cdFx0XHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIHJlZFxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBncmVlblxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBibHVlXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9fDBcXC5bMC05XSspICMgYWxwaGFcclxuXHRcdFx0XFxzKlxyXG5cdFx0XFwpXHJcblx0Ly8vZ2ltLCAobSktPlxyXG5cdFx0cGFsZXR0ZV9yZ2IuYWRkXHJcblx0XHRcdHI6IE51bWJlciBtWzFdXHJcblx0XHRcdGc6IE51bWJlciBtWzJdXHJcblx0XHRcdGI6IE51bWJlciBtWzNdXHJcblx0XHRcdGE6IE51bWJlciBtWzRdXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0aHNsXFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgaHVlXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIHNhdHVyYXRpb25cclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgdmFsdWVcclxuXHRcdFx0XFxzKlxyXG5cdFx0XFwpXHJcblx0Ly8vZ2ltLCAobSktPlxyXG5cdFx0cGFsZXR0ZV9yZ2IuYWRkXHJcblx0XHRcdGg6IE51bWJlciBtWzFdXHJcblx0XHRcdHM6IE51bWJlciBtWzJdXHJcblx0XHRcdGw6IE51bWJlciBtWzNdXHJcblx0XHJcblx0bW9zdF9jb2xvcnMgPSBbXVxyXG5cdGZvciBwYWxldHRlIGluIHBhbGV0dGVzXHJcblx0XHRpZiBwYWxldHRlLmxlbmd0aCA+PSBtb3N0X2NvbG9ycy5sZW5ndGhcclxuXHRcdFx0bW9zdF9jb2xvcnMgPSBwYWxldHRlXHJcblx0XHJcblx0biA9IG1vc3RfY29sb3JzLmxlbmd0aFxyXG5cdGlmIG4gPCA0XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoW1xyXG5cdFx0XHRcIk5vIGNvbG9ycyBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBvbmUgY29sb3IgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgYSBjb3VwbGUgY29sb3JzIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IGEgZmV3IGNvbG9ycyBmb3VuZFwiXHJcblx0XHRdW25dICsgXCIgKCN7bn0pXCIpXHJcblx0XHJcblx0bW9zdF9jb2xvcnNcclxuIiwiXHJcbiMgV2hhdCBkb2VzIEhQTCBzdGFuZCBmb3I/XHJcbiMgSG93ZHksIFBhbGV0dGUgTG92ZXJzIVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBcIlBhbGV0dGVcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiTm90IGFuIEhQTCBwYWxldHRlXCJcclxuXHRpZiBub3QgbGluZXNbMV0ubWF0Y2ggL1ZlcnNpb24gWzM0XVxcLjAvXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbnN1cHBvcnRlZCBIUEwgdmVyc2lvblwiXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRcclxuXHRmb3IgbGluZSwgaSBpbiBsaW5lc1xyXG5cdFx0aWYgbGluZS5tYXRjaCAvLisgLiogLisvXHJcblx0XHRcdHJnYiA9IGxpbmUuc3BsaXQoXCIgXCIpXHJcblx0XHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdFx0cjogcmdiWzBdXHJcblx0XHRcdFx0ZzogcmdiWzFdXHJcblx0XHRcdFx0YjogcmdiWzJdXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBMb2FkIGEgUGFpbnQuTkVUIHBhbGV0dGUgZmlsZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdFxyXG5cdGhleCA9ICh4KS0+IHBhcnNlSW50KHgsIDE2KVxyXG5cdFxyXG5cdGZvciBsaW5lIGluIGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdFx0bSA9IGxpbmUubWF0Y2goL14oWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pJC9pKVxyXG5cdFx0aWYgbSB0aGVuIHBhbGV0dGUuYWRkXHJcblx0XHRcdGE6IGhleCBtWzFdXHJcblx0XHRcdHI6IGhleCBtWzJdXHJcblx0XHRcdGc6IGhleCBtWzNdXHJcblx0XHRcdGI6IGhleCBtWzRdXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBMb2FkIGEgSkFTQyBQQUwgZmlsZSAoUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZSBmaWxlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdGlmIGxpbmVzWzBdIGlzbnQgXCJKQVNDLVBBTFwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYSBKQVNDLVBBTFwiXHJcblx0aWYgbGluZXNbMV0gaXNudCBcIjAxMDBcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiVW5rbm93biBKQVNDLVBBTCB2ZXJzaW9uXCJcclxuXHRpZiBsaW5lc1syXSBpc250IFwiMjU2XCJcclxuXHRcdFwidGhhdCdzIG9rXCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdCNuX2NvbG9ycyA9IE51bWJlcihsaW5lc1syXSlcclxuXHRcclxuXHRmb3IgbGluZSwgaSBpbiBsaW5lc1xyXG5cdFx0aWYgbGluZSBpc250IFwiXCIgYW5kIGkgPiAyXHJcblx0XHRcdHJnYiA9IGxpbmUuc3BsaXQoXCIgXCIpXHJcblx0XHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdFx0cjogcmdiWzBdXHJcblx0XHRcdFx0ZzogcmdiWzFdXHJcblx0XHRcdFx0YjogcmdiWzJdXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBMb2FkIGEgUmVzb3VyY2UgSW50ZXJjaGFuZ2UgRmlsZSBGb3JtYXQgUEFMIGZpbGVcclxuXHJcbiMgcG9ydGVkIGZyb20gQyMgY29kZSBhdCBodHRwOi8vd29ybXMyZC5pbmZvL1BhbGV0dGVfZmlsZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHQjIFJJRkYgaGVhZGVyXHJcblx0cmlmZiA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcIlJJRkZcIlxyXG5cdGRhdGFTaXplID0gYnIucmVhZFVJbnQzMigpXHJcblx0dHlwZSA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcIlBBTCBcIlxyXG5cdFxyXG5cdGlmIHJpZmYgaXNudCBcIlJJRkZcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiUklGRiBoZWFkZXIgbm90IGZvdW5kOyBub3QgYSBSSUZGIFBBTCBmaWxlXCJcclxuXHRcclxuXHRpZiB0eXBlIGlzbnQgXCJQQUwgXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlwiXCJcclxuXHRcdFx0UklGRiBoZWFkZXIgc2F5cyB0aGlzIGlzbid0IGEgUEFMIGZpbGUsXHJcblx0XHRcdG1vcmUgb2YgYSBzb3J0IG9mICN7KCh0eXBlK1wiXCIpLnRyaW0oKSl9IGZpbGVcclxuXHRcdFwiXCJcIlxyXG5cdFxyXG5cdCMgRGF0YSBjaHVua1xyXG5cdGNodW5rVHlwZSA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcImRhdGFcIlxyXG5cdGNodW5rU2l6ZSA9IGJyLnJlYWRVSW50MzIoKVxyXG5cdHBhbFZlcnNpb24gPSBici5yZWFkVUludDE2KCkgIyAweDAzMDBcclxuXHRwYWxOdW1FbnRyaWVzID0gYnIucmVhZFVJbnQxNigpXHJcblx0XHJcblx0XHJcblx0aWYgY2h1bmtUeXBlIGlzbnQgXCJkYXRhXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIkRhdGEgY2h1bmsgbm90IGZvdW5kICguLi4nI3tjaHVua1R5cGV9Jz8pXCJcclxuXHRcclxuXHRpZiBwYWxWZXJzaW9uIGlzbnQgMHgwMzAwXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbnN1cHBvcnRlZCBQQUwgZmlsZSB2ZXJzaW9uOiAweCN7cGFsVmVyc2lvbi50b1N0cmluZygxNil9XCJcclxuXHRcclxuXHQjIENvbG9yc1xyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0aSA9IDBcclxuXHR3aGlsZSAoaSArPSAxKSA8IHBhbE51bUVudHJpZXMgLSAxXHJcblx0XHRcclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdF86IGJyLnJlYWRCeXRlKCkgIyBcImZsYWdzXCIsIGFsd2F5cyAweDAwXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBQQUwgKFN0YXJDcmFmdCByYXcgcGFsZXR0ZSlcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHRmb3IgaSBpbiBbMC4uLjI1NV1cclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdCM6IG5vIHBhZGRpbmdcclxuXHRcclxuXHQjPyBwYWxldHRlLm5fY29sdW1ucyA9IDE2XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBXUEUgKFN0YXJDcmFmdCBwYWRkZWQgcmF3IHBhbGV0dGUpXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0Zm9yIGkgaW4gWzAuLi4yNTVdXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRfOiBici5yZWFkQnl0ZSgpICMgcGFkZGluZ1xyXG5cdFxyXG5cdHBhbGV0dGUubl9jb2x1bW5zID0gMTZcclxuXHRwYWxldHRlXHJcbiIsIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4vUGFsZXR0ZVwiXHJcbkNvbG9yID0gcmVxdWlyZSBcIi4vQ29sb3JcIlxyXG5cclxuY2xhc3MgUmFuZG9tQ29sb3IgZXh0ZW5kcyBDb2xvclxyXG5cdGNvbnN0cnVjdG9yOiAtPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QHJhbmRvbWl6ZSgpXHJcblx0XHJcblx0cmFuZG9taXplOiAtPlxyXG5cdFx0QGggPSBNYXRoLnJhbmRvbSgpICogMzYwXHJcblx0XHRAcyA9IE1hdGgucmFuZG9tKCkgKiAxMDBcclxuXHRcdEBsID0gTWF0aC5yYW5kb20oKSAqIDEwMFxyXG5cdFxyXG5cdHRvU3RyaW5nOiAtPlxyXG5cdFx0QHJhbmRvbWl6ZSgpXHJcblx0XHRcImhzbCgje0BofSwgI3tAc30lLCAje0BsfSUpXCJcclxuXHRcclxuXHRpczogLT4gbm9cclxuXHJcbmNsYXNzIFJhbmRvbVBhbGV0dGUgZXh0ZW5kcyBQYWxldHRlXHJcblx0Y29uc3RydWN0b3I6IC0+XHJcblx0XHRzdXBlcigpXHJcblx0XHRAbG9hZGVkX2FzID0gXCJDb21wbGV0ZWx5IFJhbmRvbSBDb2xvcnPihKJcIlxyXG5cdFx0QGxvYWRlZF9hc19jbGF1c2UgPSBcIiguY3JjIHNqZihEZjA5c2pkZmtzZGxmbW5tICc7JztcIlxyXG5cdFx0QGNvbmZpZGVuY2UgPSAwXHJcblx0XHRAZmluYWxpemUoKVxyXG5cdFx0Zm9yIGkgaW4gWzAuLk1hdGgucmFuZG9tKCkqMTUrNV1cclxuXHRcdFx0QHB1c2ggbmV3IFJhbmRvbUNvbG9yKClcclxuXHJcbmNsYXNzIExvYWRpbmdFcnJvcnMgZXh0ZW5kcyBFcnJvclxyXG5cdGNvbnN0cnVjdG9yOiAoQGVycm9ycyktPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QG1lc3NhZ2UgPSBcIlNvbWUgZXJyb3JzIHdlcmUgZW5jb3VudGVyZWQgd2hlbiBsb2FkaW5nOlwiICtcclxuXHRcdFx0Zm9yIGVycm9yIGluIEBlcnJvcnNcclxuXHRcdFx0XHRcIlxcblxcdFwiICsgZXJyb3IubWVzc2FnZVxyXG5cclxubG9hZF9wYWxldHRlID0gKG8sIGNhbGxiYWNrKS0+XHJcblx0XHJcblx0cGFsZXR0ZV9sb2FkZXJzID0gW1xyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlBhaW50IFNob3AgUHJvIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJwYWxcIiwgXCJwc3BwYWxldHRlXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvUGFpbnRTaG9wUHJvXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJSSUZGIFBBTFwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1JJRkZcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkNvbG9yU2NoZW1lciBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiY3NcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9Db2xvclNjaGVtZXJcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlBhaW50Lk5FVCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1widHh0XCIsIFwicGRuXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvUGFpbnQuTkVUXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJHSU1QIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJncGxcIiwgXCJnaW1wXCIsIFwiY29sb3JzXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvR0lNUFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiaGV5IGxvb2sgc29tZSBjb2xvcnNcIlxyXG5cdFx0XHRleHRzOiBbXCJ0eHRcIiwgXCJodG1sXCIsIFwiY3NzXCIsIFwieG1sXCIsIFwic3ZnXCIsIFwiZXRjXCJdXHJcblx0XHRcdCMgQFRPRE86IHJlbmFtZSB0aGlzIHRvIFwiQ1NTXCIgKGl0J3Mgbm90IHZlcnkgXCJnZW5lcmljXCIpXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvR2VuZXJpY1wiXHJcblx0XHR9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIFN3YXRjaFwiXHJcblx0XHQjIFx0ZXh0czogW1wiYWNvXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yU3dhdGNoXCJcclxuXHRcdCMgfVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBDb2xvciBUYWJsZVwiXHJcblx0XHQjIFx0ZXh0czogW1wiYWN0XCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yVGFibGVcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIFN3YXRjaCBFeGNoYW5nZVwiXHJcblx0XHQjIFx0ZXh0czogW1wiYXNlXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZVN3YXRjaEV4Y2hhbmdlXCJcclxuXHRcdCMgfVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBDb2xvciBCb29rXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY2JcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JCb29rXCJcclxuXHRcdCMgfVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkhvdW5kc3Rvb3RoIFBhbGV0dGUgTG9jZWxsYXRlXCJcclxuXHRcdFx0ZXh0czogW1wiaHBsXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvSFBMXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJTdGFyQ3JhZnQgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1N0YXJDcmFmdFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiU3RhckNyYWZ0IHRlcnJhaW4gcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcIndwZVwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1N0YXJDcmFmdFBhZGRlZFwiXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQXV0b0NBRCBDb2xvciBCb29rXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY2JcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0F1dG9DQURDb2xvckJvb2tcIlxyXG5cdFx0IyB9XHJcblx0XHRcclxuXHRcdCMge1xyXG5cdFx0IyBcdCMgKHNhbWUgYXMgUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZT8pXHJcblx0XHQjIFx0bmFtZTogXCJDb3JlbERSQVcgcGFsZXR0ZVwiXHJcblx0XHQjIFx0ZXh0czogW1wicGFsXCIsIFwiY3BsXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9Db3JlbERSQVdcIlxyXG5cdFx0IyB9XHJcblx0XVxyXG5cdFxyXG5cdCMgZmluZCBwYWxldHRlIGxvYWRlcnMgdGhhdCB1c2UgdGhpcyBmaWxlIGV4dGVuc2lvblxyXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcclxuXHRcdHBsLm1hdGNoZXNfZXh0ID0gcGwuZXh0cy5pbmRleE9mKG8uZmlsZV9leHQpIGlzbnQgLTFcclxuXHRcclxuXHQjIG1vdmUgcGFsZXR0ZSBsb2FkZXJzIHRvIHRoZSBiZWdpbm5pbmcgdGhhdCB1c2UgdGhpcyBmaWxlIGV4dGVuc2lvblxyXG5cdHBhbGV0dGVfbG9hZGVycy5zb3J0IChwbDEsIHBsMiktPlxyXG5cdFx0cGwyLm1hdGNoZXNfZXh0IC0gcGwxLm1hdGNoZXNfZXh0XHJcblx0XHJcblx0IyB0cnkgbG9hZGluZyBzdHVmZlxyXG5cdGVycm9ycyA9IFtdXHJcblx0Zm9yIHBsIGluIHBhbGV0dGVfbG9hZGVyc1xyXG5cdFx0XHJcblx0XHR0cnlcclxuXHRcdFx0cGFsZXR0ZSA9IHBsLmxvYWQobylcclxuXHRcdFx0aWYgcGFsZXR0ZS5sZW5ndGggaXMgMFxyXG5cdFx0XHRcdHBhbGV0dGUgPSBudWxsXHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwibm8gY29sb3JzIHJldHVybmVkXCJcclxuXHRcdGNhdGNoIGVcclxuXHRcdFx0bXNnID0gXCJmYWlsZWQgdG8gbG9hZCAje28uZmlsZV9uYW1lfSBhcyAje3BsLm5hbWV9OiAje2UubWVzc2FnZX1cIlxyXG5cdFx0XHRpZiBwbC5tYXRjaGVzX2V4dCBhbmQgbm90IGUubWVzc2FnZS5tYXRjaCgvbm90IGEvaSlcclxuXHRcdFx0XHRjb25zb2xlPy5lcnJvcj8gbXNnXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRjb25zb2xlPy53YXJuPyBtc2dcclxuXHRcdFx0XHJcblx0XHRcdGVyciA9IG5ldyBFcnJvciBtc2dcclxuXHRcdFx0ZXJyLmVycm9yID0gZVxyXG5cdFx0XHRlcnJvcnMucHVzaCBlcnJcclxuXHRcdFxyXG5cdFx0aWYgcGFsZXR0ZVxyXG5cdFx0XHRjb25zb2xlPy5pbmZvPyBcImxvYWRlZCAje28uZmlsZV9uYW1lfSBhcyAje3BsLm5hbWV9XCJcclxuXHRcdFx0cGFsZXR0ZS5jb25maWRlbmNlID0gaWYgcGwubWF0Y2hlc19leHQgdGhlbiAwLjkgZWxzZSAwLjAxXHJcblx0XHRcdHBhbGV0dGUubG9hZGVkX2FzID0gcGwubmFtZVxyXG5cdFx0XHRleHRzX3ByZXR0eSA9IFwiKC4je3BsLmV4dHMuam9pbihcIiwgLlwiKX0pXCJcclxuXHRcdFx0XHJcblx0XHRcdGlmIHBsLm1hdGNoZXNfZXh0XHJcblx0XHRcdFx0cGFsZXR0ZS5sb2FkZWRfYXNfY2xhdXNlID0gZXh0c19wcmV0dHlcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHBhbGV0dGUubG9hZGVkX2FzX2NsYXVzZSA9IFwiIGZvciBzb21lIHJlYXNvblwiXHJcblx0XHRcdFxyXG5cdFx0XHRwYWxldHRlLmZpbmFsaXplKClcclxuXHRcdFx0Y2FsbGJhY2sobnVsbCwgcGFsZXR0ZSlcclxuXHRcdFx0cmV0dXJuXHJcblx0XHJcblx0Y2FsbGJhY2sobmV3IExvYWRpbmdFcnJvcnMoZXJyb3JzKSlcclxuXHRyZXR1cm5cclxuXHJcbm9wdGlvbnMgPSAobyA9IHt9KS0+XHJcblx0aWYgdHlwZW9mIG8gaXMgXCJzdHJpbmdcIiBvciBvIGluc3RhbmNlb2YgU3RyaW5nXHJcblx0XHRvID0gZmlsZV9uYW1lOiBvXHJcblx0aWYgRmlsZT8gYW5kIG8gaW5zdGFuY2VvZiBGaWxlXHJcblx0XHRvID0gZmlsZTogb1xyXG5cdFxyXG5cdG8ubWluX2NvbG9ycyA/PSBvLm1pbkNvbG9ycyA/IDJcclxuXHRvLm1heF9jb2xvcnMgPz0gby5tYXhDb2xvcnMgPyAyNTZcclxuXHRvLmZpbGVfbmFtZSA/PSBvLmZpbGVOYW1lID8gby5mbmFtZSA/IG8uZmlsZT8ubmFtZVxyXG5cdG8uZmlsZV9leHQgPz0gby5maWxlRXh0ID8gXCIje28uZmlsZV9uYW1lfVwiLnNwbGl0KFwiLlwiKS5wb3AoKVxyXG5cdG8uZmlsZV9leHQgPSAoXCIje28uZmlsZV9leHR9XCIpLnRvTG93ZXJDYXNlKClcclxuXHRvXHJcblx0XHJcblxyXG4jIEdldCBwYWxldHRlIGZyb20gYSBmaWxlXHJcblBhbGV0dGUubG9hZCA9IChvLCBjYWxsYmFjayktPlxyXG5cdGlmIG5vdCBvXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJQYXJhbWV0ZXJzIHJlcXVpcmVkOiBQYWxldHRlLmxvYWQob3B0aW9ucywgZnVuY3Rpb24gY2FsbGJhY2soZXJyLCBwYWxldHRlKXt9KVwiXHJcblx0aWYgbm90IGNhbGxiYWNrXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJDYWxsYmFjayByZXF1aXJlZDogUGFsZXR0ZS5sb2FkKG9wdGlvbnMsIGZ1bmN0aW9uIGNhbGxiYWNrKGVyciwgcGFsZXR0ZSl7fSlcIlxyXG5cdFxyXG5cdG8gPSBvcHRpb25zIG9cclxuXHRcclxuXHRpZiBvLmRhdGFcclxuXHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRlbHNlIGlmIEZpbGU/IGFuZCBvLmZpbGUgaW5zdGFuY2VvZiBGaWxlXHJcblx0XHRmciA9IG5ldyBGaWxlUmVhZGVyXHJcblx0XHRmci5vbmxvYWQgPSAtPlxyXG5cdFx0XHRvLmRhdGEgPSBmci5yZXN1bHRcclxuXHRcdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdFx0ZnIucmVhZEFzQmluYXJ5U3RyaW5nIG8uZmlsZVxyXG5cdGVsc2UgaWYgZ2xvYmFsP1xyXG5cdFx0XHJcblx0XHRmcyA9IHJlcXVpcmUgXCJmc1wiXHJcblx0XHRmcy5yZWFkRmlsZSBvLmZpbGVfbmFtZSwgKGVyciwgZGF0YSktPlxyXG5cdFx0XHRpZiBlcnJcclxuXHRcdFx0XHRjYWxsYmFjayhlcnIpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRvLmRhdGEgPSBkYXRhLnRvU3RyaW5nKFwiYmluYXJ5XCIpXHJcblx0XHRcdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdGVsc2VcclxuXHRcdGNhbGxiYWNrKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkLiBUaGUgRmlsZSBBUEkgbWF5IG5vdCBiZSBzdXBwb3J0ZWQuXCIpKVxyXG5cclxuXHJcbiMgR2V0IGEgcGFsZXR0ZSBmcm9tIGEgZmlsZSBvciBieSBhbnkgbWVhbnMgbmVzc2VzYXJ5XHJcbiMgKGFzIGluIGZhbGwgYmFjayB0byBjb21wbGV0ZWx5IHJhbmRvbSBkYXRhKVxyXG5QYWxldHRlLmdpbW1lID0gKG8sIGNhbGxiYWNrKS0+XHJcblx0byA9IG9wdGlvbnMgb1xyXG5cdFxyXG5cdFBhbGV0dGUubG9hZCBvLCAoZXJyLCBwYWxldHRlKS0+XHJcblx0XHRjYWxsYmFjayhudWxsLCBwYWxldHRlID8gbmV3IFJhbmRvbVBhbGV0dGUpXHJcblxyXG4jIEV4cG9ydHNcclxuUCA9IG1vZHVsZS5leHBvcnRzID0gUGFsZXR0ZVxyXG5QLkNvbG9yID0gQ29sb3JcclxuUC5QYWxldHRlID0gUGFsZXR0ZVxyXG5QLlJhbmRvbUNvbG9yID0gUmFuZG9tQ29sb3JcclxuUC5SYW5kb21QYWxldHRlID0gUmFuZG9tUGFsZXR0ZVxyXG4jIFAuTG9hZGluZ0Vycm9ycyA9IExvYWRpbmdFcnJvcnNcclxuIl19
