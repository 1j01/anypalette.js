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
      name: "CSS-style colors",
      exts: ["txt",
    "html",
    "css",
    "xml",
    "svg",
    "js"],
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

// Get a palette from a file or by any means necessary
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQmluYXJ5UmVhZGVyLmNvZmZlZSIsInNyYy9Db2xvci5jb2ZmZWUiLCJzcmMvUGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbG9hZGVycy9Db2xvclNjaGVtZXIuY29mZmVlIiwic3JjL2xvYWRlcnMvR0lNUC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9HZW5lcmljLmNvZmZlZSIsInNyYy9sb2FkZXJzL0hQTC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9QYWludC5ORVQuY29mZmVlIiwic3JjL2xvYWRlcnMvUGFpbnRTaG9wUHJvLmNvZmZlZSIsInNyYy9sb2FkZXJzL1JJRkYuY29mZmVlIiwic3JjL2xvYWRlcnMvU3RhckNyYWZ0LmNvZmZlZSIsInNyYy9sb2FkZXJzL1N0YXJDcmFmdFBhZGRlZC5jb2ZmZWUiLCJzcmMvc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFBOztBQWVBLE1BQU0sQ0FBQyxPQUFQLEdBQ007RUFBTixNQUFBLGFBQUE7SUFDQyxXQUFhLENBQUMsSUFBRCxDQUFBO01BQ1osSUFBQyxDQUFBLE9BQUQsR0FBVztNQUNYLElBQUMsQ0FBQSxJQUFELEdBQVE7SUFGSSxDQUFiOzs7SUFNQSxRQUFVLENBQUEsQ0FBQTtBQUNULFVBQUE7TUFBQSxJQUFDLENBQUEsVUFBRCxDQUFZLENBQVo7TUFDQSxFQUFBLEdBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFiLENBQXdCLElBQUMsQ0FBQSxJQUF6QixDQUFBLEdBQWlDO01BQ3RDLElBQUMsQ0FBQSxJQUFELElBQVM7YUFDVCxFQUFBLEdBQUs7SUFKSTs7SUFNVixpQkFBbUIsQ0FBQSxDQUFBO0FBQ2xCLFVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBO01BQUEsTUFBQSxHQUFTLElBQUMsQ0FBQSxVQUFELENBQUE7TUFD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QWdCOztBQUNoQixDQUFDLENBQUMsYUFBRixHQUFrQjs7QUE5TmxCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXHJcbiMjI1xyXG5CaW5hcnlSZWFkZXJcclxuXHJcbk1vZGlmaWVkIGJ5IElzYWlhaCBPZGhuZXJcclxuQFRPRE86IHVzZSBqRGF0YVZpZXcgKyBqQmluYXJ5IGluc3RlYWRcclxuXHJcblJlZmFjdG9yZWQgYnkgVmpldXggPHZqZXV4eEBnbWFpbC5jb20+XHJcbmh0dHA6Ly9ibG9nLnZqZXV4LmNvbS8yMDEwL2phdmFzY3JpcHQvamF2YXNjcmlwdC1iaW5hcnktcmVhZGVyLmh0bWxcclxuXHJcbk9yaWdpbmFsXHJcbisgSm9uYXMgUmFvbmkgU29hcmVzIFNpbHZhXHJcbkAgaHR0cDovL2pzZnJvbWhlbGwuY29tL2NsYXNzZXMvYmluYXJ5LXBhcnNlciBbcmV2LiAjMV1cclxuIyMjXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIEJpbmFyeVJlYWRlclxyXG5cdGNvbnN0cnVjdG9yOiAoZGF0YSktPlxyXG5cdFx0QF9idWZmZXIgPSBkYXRhXHJcblx0XHRAX3BvcyA9IDBcclxuXHJcblx0IyBQdWJsaWMgKGN1c3RvbSlcclxuXHRcclxuXHRyZWFkQnl0ZTogLT5cclxuXHRcdEBfY2hlY2tTaXplKDgpXHJcblx0XHRjaCA9IHRoaXMuX2J1ZmZlci5jaGFyQ29kZUF0KEBfcG9zKSAmIDB4ZmZcclxuXHRcdEBfcG9zICs9IDFcclxuXHRcdGNoICYgMHhmZlxyXG5cdFxyXG5cdHJlYWRVbmljb2RlU3RyaW5nOiAtPlxyXG5cdFx0bGVuZ3RoID0gQHJlYWRVSW50MTYoKVxyXG5cdFx0Y29uc29sZS5sb2cge2xlbmd0aH1cclxuXHRcdEBfY2hlY2tTaXplKGxlbmd0aCAqIDE2KVxyXG5cdFx0c3RyID0gXCJcIlxyXG5cdFx0Zm9yIGkgaW4gWzAuLmxlbmd0aF1cclxuXHRcdFx0c3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoQF9idWZmZXIuc3Vic3RyKEBfcG9zLCAxKSB8IChAX2J1ZmZlci5zdWJzdHIoQF9wb3MrMSwgMSkgPDwgOCkpXHJcblx0XHRcdEBfcG9zICs9IDJcclxuXHRcdHN0clxyXG5cdFxyXG5cdCMgUHVibGljXHJcblx0XHJcblx0cmVhZEludDg6IC0+IEBfZGVjb2RlSW50KDgsIHRydWUpXHJcblx0cmVhZFVJbnQ4OiAtPiBAX2RlY29kZUludCg4LCBmYWxzZSlcclxuXHRyZWFkSW50MTY6IC0+IEBfZGVjb2RlSW50KDE2LCB0cnVlKVxyXG5cdHJlYWRVSW50MTY6IC0+IEBfZGVjb2RlSW50KDE2LCBmYWxzZSlcclxuXHRyZWFkSW50MzI6IC0+IEBfZGVjb2RlSW50KDMyLCB0cnVlKVxyXG5cdHJlYWRVSW50MzI6IC0+IEBfZGVjb2RlSW50KDMyLCBmYWxzZSlcclxuXHJcblx0cmVhZEZsb2F0OiAtPiBAX2RlY29kZUZsb2F0KDIzLCA4KVxyXG5cdHJlYWREb3VibGU6IC0+IEBfZGVjb2RlRmxvYXQoNTIsIDExKVxyXG5cdFxyXG5cdHJlYWRDaGFyOiAtPiBAcmVhZFN0cmluZygxKVxyXG5cdHJlYWRTdHJpbmc6IChsZW5ndGgpLT5cclxuXHRcdEBfY2hlY2tTaXplKGxlbmd0aCAqIDgpXHJcblx0XHRyZXN1bHQgPSBAX2J1ZmZlci5zdWJzdHIoQF9wb3MsIGxlbmd0aClcclxuXHRcdEBfcG9zICs9IGxlbmd0aFxyXG5cdFx0cmVzdWx0XHJcblxyXG5cdHNlZWs6IChwb3MpLT5cclxuXHRcdEBfcG9zID0gcG9zXHJcblx0XHRAX2NoZWNrU2l6ZSgwKVxyXG5cdFxyXG5cdGdldFBvc2l0aW9uOiAtPiBAX3Bvc1xyXG5cdFxyXG5cdGdldFNpemU6IC0+IEBfYnVmZmVyLmxlbmd0aFxyXG5cdFxyXG5cclxuXHJcblx0IyBQcml2YXRlXHJcblx0XHJcblx0X2RlY29kZUZsb2F0OiBgZnVuY3Rpb24ocHJlY2lzaW9uQml0cywgZXhwb25lbnRCaXRzKXtcclxuXHRcdHZhciBsZW5ndGggPSBwcmVjaXNpb25CaXRzICsgZXhwb25lbnRCaXRzICsgMTtcclxuXHRcdHZhciBzaXplID0gbGVuZ3RoID4+IDM7XHJcblx0XHR0aGlzLl9jaGVja1NpemUobGVuZ3RoKTtcclxuXHJcblx0XHR2YXIgYmlhcyA9IE1hdGgucG93KDIsIGV4cG9uZW50Qml0cyAtIDEpIC0gMTtcclxuXHRcdHZhciBzaWduYWwgPSB0aGlzLl9yZWFkQml0cyhwcmVjaXNpb25CaXRzICsgZXhwb25lbnRCaXRzLCAxLCBzaXplKTtcclxuXHRcdHZhciBleHBvbmVudCA9IHRoaXMuX3JlYWRCaXRzKHByZWNpc2lvbkJpdHMsIGV4cG9uZW50Qml0cywgc2l6ZSk7XHJcblx0XHR2YXIgc2lnbmlmaWNhbmQgPSAwO1xyXG5cdFx0dmFyIGRpdmlzb3IgPSAyO1xyXG5cdFx0dmFyIGN1ckJ5dGUgPSAwOyAvL2xlbmd0aCArICgtcHJlY2lzaW9uQml0cyA+PiAzKSAtIDE7XHJcblx0XHRkbyB7XHJcblx0XHRcdHZhciBieXRlVmFsdWUgPSB0aGlzLl9yZWFkQnl0ZSgrK2N1ckJ5dGUsIHNpemUpO1xyXG5cdFx0XHR2YXIgc3RhcnRCaXQgPSBwcmVjaXNpb25CaXRzICUgOCB8fCA4O1xyXG5cdFx0XHR2YXIgbWFzayA9IDEgPDwgc3RhcnRCaXQ7XHJcblx0XHRcdHdoaWxlIChtYXNrID4+PSAxKSB7XHJcblx0XHRcdFx0aWYgKGJ5dGVWYWx1ZSAmIG1hc2spIHtcclxuXHRcdFx0XHRcdHNpZ25pZmljYW5kICs9IDEgLyBkaXZpc29yO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkaXZpc29yICo9IDI7XHJcblx0XHRcdH1cclxuXHRcdH0gd2hpbGUgKHByZWNpc2lvbkJpdHMgLT0gc3RhcnRCaXQpO1xyXG5cclxuXHRcdHRoaXMuX3BvcyArPSBzaXplO1xyXG5cclxuXHRcdHJldHVybiBleHBvbmVudCA9PSAoYmlhcyA8PCAxKSArIDEgPyBzaWduaWZpY2FuZCA/IE5hTiA6IHNpZ25hbCA/IC1JbmZpbml0eSA6ICtJbmZpbml0eVxyXG5cdFx0XHQ6ICgxICsgc2lnbmFsICogLTIpICogKGV4cG9uZW50IHx8IHNpZ25pZmljYW5kID8gIWV4cG9uZW50ID8gTWF0aC5wb3coMiwgLWJpYXMgKyAxKSAqIHNpZ25pZmljYW5kXHJcblx0XHRcdDogTWF0aC5wb3coMiwgZXhwb25lbnQgLSBiaWFzKSAqICgxICsgc2lnbmlmaWNhbmQpIDogMCk7XHJcblx0fWBcclxuXHJcblx0X2RlY29kZUludDogYGZ1bmN0aW9uKGJpdHMsIHNpZ25lZCl7XHJcblx0XHR2YXIgeCA9IHRoaXMuX3JlYWRCaXRzKDAsIGJpdHMsIGJpdHMgLyA4KSwgbWF4ID0gTWF0aC5wb3coMiwgYml0cyk7XHJcblx0XHR2YXIgcmVzdWx0ID0gc2lnbmVkICYmIHggPj0gbWF4IC8gMiA/IHggLSBtYXggOiB4O1xyXG5cclxuXHRcdHRoaXMuX3BvcyArPSBiaXRzIC8gODtcclxuXHRcdHJldHVybiByZXN1bHQ7XHJcblx0fWBcclxuXHJcblx0I3NobCBmaXg6IEhlbnJpIFRvcmdlbWFuZSB+MTk5NiAoY29tcHJlc3NlZCBieSBKb25hcyBSYW9uaSlcclxuXHRfc2hsOiBgZnVuY3Rpb24gKGEsIGIpe1xyXG5cdFx0Zm9yICgrK2I7IC0tYjsgYSA9ICgoYSAlPSAweDdmZmZmZmZmICsgMSkgJiAweDQwMDAwMDAwKSA9PSAweDQwMDAwMDAwID8gYSAqIDIgOiAoYSAtIDB4NDAwMDAwMDApICogMiArIDB4N2ZmZmZmZmYgKyAxKTtcclxuXHRcdHJldHVybiBhO1xyXG5cdH1gXHJcblx0XHJcblx0X3JlYWRCeXRlOiBgZnVuY3Rpb24gKGksIHNpemUpIHtcclxuXHRcdHJldHVybiB0aGlzLl9idWZmZXIuY2hhckNvZGVBdCh0aGlzLl9wb3MgKyBzaXplIC0gaSAtIDEpICYgMHhmZjtcclxuXHR9YFxyXG5cclxuXHRfcmVhZEJpdHM6IGBmdW5jdGlvbiAoc3RhcnQsIGxlbmd0aCwgc2l6ZSkge1xyXG5cdFx0dmFyIG9mZnNldExlZnQgPSAoc3RhcnQgKyBsZW5ndGgpICUgODtcclxuXHRcdHZhciBvZmZzZXRSaWdodCA9IHN0YXJ0ICUgODtcclxuXHRcdHZhciBjdXJCeXRlID0gc2l6ZSAtIChzdGFydCA+PiAzKSAtIDE7XHJcblx0XHR2YXIgbGFzdEJ5dGUgPSBzaXplICsgKC0oc3RhcnQgKyBsZW5ndGgpID4+IDMpO1xyXG5cdFx0dmFyIGRpZmYgPSBjdXJCeXRlIC0gbGFzdEJ5dGU7XHJcblxyXG5cdFx0dmFyIHN1bSA9ICh0aGlzLl9yZWFkQnl0ZShjdXJCeXRlLCBzaXplKSA+PiBvZmZzZXRSaWdodCkgJiAoKDEgPDwgKGRpZmYgPyA4IC0gb2Zmc2V0UmlnaHQgOiBsZW5ndGgpKSAtIDEpO1xyXG5cclxuXHRcdGlmIChkaWZmICYmIG9mZnNldExlZnQpIHtcclxuXHRcdFx0c3VtICs9ICh0aGlzLl9yZWFkQnl0ZShsYXN0Qnl0ZSsrLCBzaXplKSAmICgoMSA8PCBvZmZzZXRMZWZ0KSAtIDEpKSA8PCAoZGlmZi0tIDw8IDMpIC0gb2Zmc2V0UmlnaHQ7IFxyXG5cdFx0fVxyXG5cclxuXHRcdHdoaWxlIChkaWZmKSB7XHJcblx0XHRcdHN1bSArPSB0aGlzLl9zaGwodGhpcy5fcmVhZEJ5dGUobGFzdEJ5dGUrKywgc2l6ZSksIChkaWZmLS0gPDwgMykgLSBvZmZzZXRSaWdodCk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHN1bTtcclxuXHR9YFxyXG5cclxuXHRfY2hlY2tTaXplOiAobmVlZGVkQml0cyktPlxyXG5cdFx0aWYgQF9wb3MgKyBNYXRoLmNlaWwobmVlZGVkQml0cyAvIDgpID4gQF9idWZmZXIubGVuZ3RoXHJcblx0XHRcdHRocm93IG5ldyBFcnJvciBcIkluZGV4IG91dCBvZiBib3VuZFwiXHJcblxyXG4iLCJcclxubW9kdWxlLmV4cG9ydHMgPVxyXG5jbGFzcyBDb2xvclxyXG5cdCMgQFRPRE86IGRvbid0IGFzc2lnbiB7QHIsIEBnLCBAYiwgQGgsIEBzLCBAdiwgQGx9IHJpZ2h0IGF3YXlcclxuXHQjIChtb3JlIG9mIGEgdG8tZG9uJ3QsIHJlYWxseSlcclxuXHRjb25zdHJ1Y3RvcjogKHtcclxuXHRcdEByLCBAZywgQGIsXHJcblx0XHRAaCwgQHMsIEB2LCBAbCxcclxuXHRcdGMsIG0sIHksIGssXHJcblx0XHRAbmFtZVxyXG5cdH0pLT5cclxuXHRcdGlmIEByPyBhbmQgQGc/IGFuZCBAYj9cclxuXHRcdFx0IyBSZWQgR3JlZW4gQmx1ZVxyXG5cdFx0ZWxzZSBpZiBAaD8gYW5kIEBzP1xyXG5cdFx0XHQjIEN5bGluZHJpY2FsIENvbG9yIFNwYWNlXHJcblx0XHRcdGlmIEB2P1xyXG5cdFx0XHRcdCMgSHVlIFNhdHVyYXRpb24gVmFsdWVcclxuXHRcdFx0XHRAbCA9ICgyIC0gQHMgLyAxMDApICogQHYgLyAyXHJcblx0XHRcdFx0QHMgPSBAcyAqIEB2IC8gKGlmIEBsIDwgNTAgdGhlbiBAbCAqIDIgZWxzZSAyMDAgLSBAbCAqIDIpXHJcblx0XHRcdFx0QHMgPSAwIGlmIGlzTmFOIEBzXHJcblx0XHRcdGVsc2UgaWYgQGw/XHJcblx0XHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBMaWdodG5lc3NcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIkh1ZSwgc2F0dXJhdGlvbiwgYW5kLi4uPyAoZWl0aGVyIGxpZ2h0bmVzcyBvciB2YWx1ZSlcIlxyXG5cdFx0ZWxzZSBpZiBjPyBhbmQgbT8gYW5kIHk/IGFuZCBrP1xyXG5cdFx0XHQjIEN5YW4gTWFnZW50YSBZZWxsb3cgYmxhY0tcclxuXHRcdFx0IyBVTlRFU1RFRFxyXG5cdFx0XHRjIC89IDEwMFxyXG5cdFx0XHRtIC89IDEwMFxyXG5cdFx0XHR5IC89IDEwMFxyXG5cdFx0XHRrIC89IDEwMFxyXG5cdFx0XHRcclxuXHRcdFx0QHIgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIGMgKiAoMSAtIGspICsgaykpXHJcblx0XHRcdEBnID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCBtICogKDEgLSBrKSArIGspKVxyXG5cdFx0XHRAYiA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgeSAqICgxIC0gaykgKyBrKSlcclxuXHRcdGVsc2VcclxuXHRcdFx0IyBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRFxyXG5cdFx0XHRpZiBAbD8gYW5kIEBhPyBhbmQgQGI/XHJcblx0XHRcdFx0d2hpdGUgPVxyXG5cdFx0XHRcdFx0eDogOTUuMDQ3XHJcblx0XHRcdFx0XHR5OiAxMDAuMDAwXHJcblx0XHRcdFx0XHR6OiAxMDguODgzXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0eHl6ID0gXHJcblx0XHRcdFx0XHR5OiAocmF3LmwgKyAxNikgLyAxMTZcclxuXHRcdFx0XHRcdHg6IHJhdy5hIC8gNTAwICsgeHl6LnlcclxuXHRcdFx0XHRcdHo6IHh5ei55IC0gcmF3LmIgLyAyMDBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRmb3IgXyBpbiBcInh5elwiXHJcblx0XHRcdFx0XHRwb3dlZCA9IE1hdGgucG93KHh5eltfXSwgMylcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYgcG93ZWQgPiAwLjAwODg1NlxyXG5cdFx0XHRcdFx0XHR4eXpbX10gPSBwb3dlZFxyXG5cdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHR4eXpbX10gPSAoeHl6W19dIC0gMTYgLyAxMTYpIC8gNy43ODdcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0I3h5eltfXSA9IF9yb3VuZCh4eXpbX10gKiB3aGl0ZVtfXSlcclxuXHRcdFx0XHRcclxuXHRcdFx0IyBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRFxyXG5cdFx0XHRpZiBAeD8gYW5kIEB5PyBhbmQgQHo/XHJcblx0XHRcdFx0eHl6ID1cclxuXHRcdFx0XHRcdHg6IHJhdy54IC8gMTAwXHJcblx0XHRcdFx0XHR5OiByYXcueSAvIDEwMFxyXG5cdFx0XHRcdFx0ejogcmF3LnogLyAxMDBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRyZ2IgPVxyXG5cdFx0XHRcdFx0cjogeHl6LnggKiAzLjI0MDYgKyB4eXoueSAqIC0xLjUzNzIgKyB4eXoueiAqIC0wLjQ5ODZcclxuXHRcdFx0XHRcdGc6IHh5ei54ICogLTAuOTY4OSArIHh5ei55ICogMS44NzU4ICsgeHl6LnogKiAwLjA0MTVcclxuXHRcdFx0XHRcdGI6IHh5ei54ICogMC4wNTU3ICsgeHl6LnkgKiAtMC4yMDQwICsgeHl6LnogKiAxLjA1NzBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRmb3IgXyBpbiBcInJnYlwiXHJcblx0XHRcdFx0XHQjcmdiW19dID0gX3JvdW5kKHJnYltfXSlcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYgcmdiW19dIDwgMFxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gPSAwXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHJnYltfXSA+IDAuMDAzMTMwOFxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gPSAxLjA1NSAqIE1hdGgucG93KHJnYltfXSwgKDEgLyAyLjQpKSAtIDAuMDU1XHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdHJnYltfXSAqPSAxMi45MlxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdCNyZ2JbX10gPSBNYXRoLnJvdW5kKHJnYltfXSAqIDI1NSlcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIkNvbG9yIGNvbnN0cnVjdG9yIG11c3QgYmUgY2FsbGVkIHdpdGgge3IsZyxifSBvciB7aCxzLHZ9IG9yIHtoLHMsbH0gb3Ige2MsbSx5LGt9IG9yIHt4LHksen0gb3Ige2wsYSxifVwiXHJcblx0XHRcclxuXHRcclxuXHR0b1N0cmluZzogLT5cclxuXHRcdGlmIEByP1xyXG5cdFx0XHQjIFJlZCBHcmVlbiBCbHVlXHJcblx0XHRcdGlmIEBhPyAjIEFscGhhXHJcblx0XHRcdFx0XCJyZ2JhKCN7QHJ9LCAje0BnfSwgI3tAYn0sICN7QGF9KVwiXHJcblx0XHRcdGVsc2UgIyBPcGFxdWVcclxuXHRcdFx0XHRcInJnYigje0ByfSwgI3tAZ30sICN7QGJ9KVwiXHJcblx0XHRlbHNlIGlmIEBoP1xyXG5cdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIExpZ2h0bmVzc1xyXG5cdFx0XHQjIChBc3N1bWUgaDowLTM2MCwgczowLTEwMCwgbDowLTEwMClcclxuXHRcdFx0aWYgQGE/ICMgQWxwaGFcclxuXHRcdFx0XHRcImhzbGEoI3tAaH0sICN7QHN9JSwgI3tAbH0lLCAje0BhfSlcIlxyXG5cdFx0XHRlbHNlICMgT3BhcXVlXHJcblx0XHRcdFx0XCJoc2woI3tAaH0sICN7QHN9JSwgI3tAbH0lKVwiXHJcblx0XHJcblx0aXM6IChjb2xvciktPlxyXG5cdFx0XCIje0B9XCIgaXMgXCIje2NvbG9yfVwiXHJcbiIsIlxyXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID1cclxuY2xhc3MgUGFsZXR0ZSBleHRlbmRzIEFycmF5XHJcblx0XHJcblx0Y29uc3RydWN0b3I6IC0+XHJcblx0XHRzdXBlcigpXHJcblx0XHRAd2l0aF9kdXBsaWNhdGVzID0gQFxyXG5cdFx0XHJcblx0YWRkOiAobyktPlxyXG5cdFx0bmV3X2NvbG9yID0gbmV3IENvbG9yKG8pXHJcblx0XHRcclxuXHRcdGlmIEB3aXRoX2R1cGxpY2F0ZXMgaXMgQFxyXG5cdFx0XHRAd2l0aF9kdXBsaWNhdGVzID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0XHJcblx0XHRAd2l0aF9kdXBsaWNhdGVzLnB1c2ggbmV3X2NvbG9yXHJcblx0XHRcclxuXHRcdGZvciBjb2xvciBpbiBAXHJcblx0XHRcdGlmIGNvbG9yLmlzIG5ld19jb2xvclxyXG5cdFx0XHRcdG5ld19jb2xvci5pc19kdXBsaWNhdGUgPSB0cnVlXHJcblx0XHRcdFx0cmV0dXJuXHJcblx0XHRcclxuXHRcdEBwdXNoIG5ld19jb2xvclxyXG5cdFxyXG5cdGZpbmFsaXplOiAtPlxyXG5cdFx0aWYgbm90IEBuX2NvbHVtbnNcclxuXHRcdFx0QGd1ZXNzX2RpbWVuc2lvbnMoKVxyXG5cdFx0aWYgQHdpdGhfZHVwbGljYXRlc1xyXG5cdFx0XHRAd2l0aF9kdXBsaWNhdGVzLmd1ZXNzX2RpbWVuc2lvbnMoKVxyXG5cdFx0XHJcblx0Z3Vlc3NfZGltZW5zaW9uczogLT5cclxuXHRcdGxlbiA9IEBsZW5ndGhcclxuXHRcdGNhbmRpZGF0ZV9kaW1lbnNpb25zID0gW11cclxuXHRcdGZvciBuX2NvbHVtbnMgaW4gWzAuLmxlbl1cclxuXHRcdFx0bl9yb3dzID0gbGVuIC8gbl9jb2x1bW5zXHJcblx0XHRcdGlmIG5fcm93cyBpcyBNYXRoLnJvdW5kIG5fcm93c1xyXG5cdFx0XHRcdGNhbmRpZGF0ZV9kaW1lbnNpb25zLnB1c2ggW25fcm93cywgbl9jb2x1bW5zXVxyXG5cdFx0XHJcblx0XHRzcXVhcmVzdCA9IFswLCAzNDk1MDkzXVxyXG5cdFx0Zm9yIGNkIGluIGNhbmRpZGF0ZV9kaW1lbnNpb25zXHJcblx0XHRcdGlmIE1hdGguYWJzKGNkWzBdIC0gY2RbMV0pIDwgTWF0aC5hYnMoc3F1YXJlc3RbMF0gLSBzcXVhcmVzdFsxXSlcclxuXHRcdFx0XHRzcXVhcmVzdCA9IGNkXHJcblx0XHRcclxuXHRcdCNAbl9jb2x1bW5zID0gc3F1YXJlc3RbMV1cclxuIiwiXHJcbiMgTG9hZCBhIENvbG9yU2NoZW1lciBwYWxldHRlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0dmVyc2lvbiA9IGJyLnJlYWRVSW50MTYoKSAjIG9yIHNvbWV0aGluZ1xyXG5cdGxlbmd0aCA9IGJyLnJlYWRVSW50MTYoKVxyXG5cdGkgPSAwXHJcblx0d2hpbGUgaSA8IGxlbmd0aFxyXG5cdFx0YnIuc2Vlayg4ICsgaSAqIDI2KVxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdGkgKz0gMVxyXG5cclxuXHRwYWxldHRlXHJcblxyXG4iLCJcclxuIyBMb2FkIGEgR0lNUCBwYWxldHRlXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IFwiR0lNUCBQYWxldHRlXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhIEdJTVAgUGFsZXR0ZVwiXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRpID0gMVxyXG5cdHdoaWxlIChpICs9IDEpIDwgbGluZXMubGVuZ3RoXHJcblx0XHRsaW5lID0gbGluZXNbaV1cclxuXHRcdFxyXG5cdFx0aWYgbGluZS5tYXRjaCgvXiMvKSBvciBsaW5lIGlzIFwiXCIgdGhlbiBjb250aW51ZVxyXG5cdFx0XHJcblx0XHRtID0gbGluZS5tYXRjaCgvTmFtZTpcXHMqKC4qKS8pXHJcblx0XHRpZiBtXHJcblx0XHRcdHBhbGV0dGUubmFtZSA9IG1bMV1cclxuXHRcdFx0Y29udGludWVcclxuXHRcdG0gPSBsaW5lLm1hdGNoKC9Db2x1bW5zOlxccyooLiopLylcclxuXHRcdGlmIG1cclxuXHRcdFx0cGFsZXR0ZS5uX2NvbHVtbnMgPSBOdW1iZXIobVsxXSlcclxuXHRcdFx0cGFsZXR0ZS5oYXNfZGltZW5zaW9ucyA9IHllc1xyXG5cdFx0XHRjb250aW51ZVxyXG5cdFx0XHJcblx0XHRyX2dfYl9uYW1lID0gbGluZS5tYXRjaCgvXlxccyooWzAtOV0rKVxccysoWzAtOV0rKVxccysoWzAtOV0rKSg/OlxccysoLiopKT8kLylcclxuXHRcdGlmIG5vdCByX2dfYl9uYW1lXHJcblx0XHRcdHRocm93IG5ldyBFcnJvciBcIkxpbmUgI3tpfSBkb2Vzbid0IG1hdGNoIHBhdHRlcm4gcl9nX2JfbmFtZVwiXHJcblx0XHRcclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IHJfZ19iX25hbWVbMV1cclxuXHRcdFx0Zzogcl9nX2JfbmFtZVsyXVxyXG5cdFx0XHRiOiByX2dfYl9uYW1lWzNdXHJcblx0XHRcdG5hbWU6IHJfZ19iX25hbWVbNF1cclxuXHRcdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgRGV0ZWN0IENTUyBjb2xvcnMgKGV4Y2VwdCBuYW1lZCBjb2xvcnMpXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZXMgPSBbXHJcblx0XHRwYWxldHRlX3hSUkdHQkIgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX3hSR0IgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX3JnYiA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfaHNsID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9oc2xhID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9yZ2JhID0gbmV3IFBhbGV0dGUoKVxyXG5cdF1cclxuXHRcclxuXHRoZXggPSAoeCktPiBwYXJzZUludCh4LCAxNilcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRcXCMgIyBoYXNodGFnICMgIy9cclxuXHRcdChbMC05QS1GXXsyfSk/ICMgYWxwaGFcclxuXHRcdChbMC05QS1GXXszfSkgIyB0aHJlZSBkaWdpdHMgKCNBMEMpXHJcblx0XHQoWzAtOUEtRl17M30pPyAjIHNpeCBkaWdpdHMgKCNBQTAwQ0MpXHJcblx0XHRcclxuXHRcdCg/IVswLTlBLUZdKSAjIChhbmQgbm8gbW9yZSEpXHJcblx0Ly8vZ2ltLCAobSwgJDAsICQxLCAkMiktPlxyXG5cdFx0XHJcblx0XHRhbHBoYSA9IGhleCAkMFxyXG5cdFx0XHJcblx0XHRpZiAkMlxyXG5cdFx0XHR4UkdCID0gJDEgKyAkMlxyXG5cdFx0XHRwYWxldHRlX3hSUkdHQkIuYWRkXHJcblx0XHRcdFx0cjogaGV4IHhSR0JbMF0gKyB4UkdCWzFdXHJcblx0XHRcdFx0ZzogaGV4IHhSR0JbMl0gKyB4UkdCWzNdXHJcblx0XHRcdFx0YjogaGV4IHhSR0JbNF0gKyB4UkdCWzVdXHJcblx0XHRcdFx0YTogYWxwaGFcclxuXHRcdGVsc2VcclxuXHRcdFx0eFJHQiA9ICQxXHJcblx0XHRcdHBhbGV0dGVfeFJHQi5hZGRcclxuXHRcdFx0XHRyOiBoZXggeFJHQlswXSArIHhSR0JbMF1cclxuXHRcdFx0XHRnOiBoZXggeFJHQlsxXSArIHhSR0JbMV1cclxuXHRcdFx0XHRiOiBoZXggeFJHQlsyXSArIHhSR0JbMl1cclxuXHRcdFx0XHRhOiBhbHBoYVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdHJnYlxcKFxyXG5cdFx0XHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIHJlZFxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBncmVlblxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBibHVlXHJcblx0XHRcdFxccypcclxuXHRcdFxcKVxyXG5cdC8vL2dpbSwgKG0pLT5cclxuXHRcdHBhbGV0dGVfcmdiLmFkZFxyXG5cdFx0XHRyOiBOdW1iZXIgbVsxXVxyXG5cdFx0XHRnOiBOdW1iZXIgbVsyXVxyXG5cdFx0XHRiOiBOdW1iZXIgbVszXVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdHJnYmFcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyByZWRcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgZ3JlZW5cclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgYmx1ZVxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfXwwXFwuWzAtOV0rKSAjIGFscGhhXHJcblx0XHRcdFxccypcclxuXHRcdFxcKVxyXG5cdC8vL2dpbSwgKG0pLT5cclxuXHRcdHBhbGV0dGVfcmdiLmFkZFxyXG5cdFx0XHRyOiBOdW1iZXIgbVsxXVxyXG5cdFx0XHRnOiBOdW1iZXIgbVsyXVxyXG5cdFx0XHRiOiBOdW1iZXIgbVszXVxyXG5cdFx0XHRhOiBOdW1iZXIgbVs0XVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdGhzbFxcKFxyXG5cdFx0XHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGh1ZVxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBzYXR1cmF0aW9uXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIHZhbHVlXHJcblx0XHRcdFxccypcclxuXHRcdFxcKVxyXG5cdC8vL2dpbSwgKG0pLT5cclxuXHRcdHBhbGV0dGVfcmdiLmFkZFxyXG5cdFx0XHRoOiBOdW1iZXIgbVsxXVxyXG5cdFx0XHRzOiBOdW1iZXIgbVsyXVxyXG5cdFx0XHRsOiBOdW1iZXIgbVszXVxyXG5cdFxyXG5cdG1vc3RfY29sb3JzID0gW11cclxuXHRmb3IgcGFsZXR0ZSBpbiBwYWxldHRlc1xyXG5cdFx0aWYgcGFsZXR0ZS5sZW5ndGggPj0gbW9zdF9jb2xvcnMubGVuZ3RoXHJcblx0XHRcdG1vc3RfY29sb3JzID0gcGFsZXR0ZVxyXG5cdFxyXG5cdG4gPSBtb3N0X2NvbG9ycy5sZW5ndGhcclxuXHRpZiBuIDwgNFxyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFtcclxuXHRcdFx0XCJObyBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgb25lIGNvbG9yIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IGEgY291cGxlIGNvbG9ycyBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBhIGZldyBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XVtuXSArIFwiICgje259KVwiKVxyXG5cdFxyXG5cdG1vc3RfY29sb3JzXHJcbiIsIlxyXG4jIFdoYXQgZG9lcyBIUEwgc3RhbmQgZm9yP1xyXG4jIEhvd2R5LCBQYWxldHRlIExvdmVycyFcclxuXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdGlmIGxpbmVzWzBdIGlzbnQgXCJQYWxldHRlXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhbiBIUEwgcGFsZXR0ZVwiXHJcblx0aWYgbm90IGxpbmVzWzFdLm1hdGNoIC9WZXJzaW9uIFszNF1cXC4wL1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiVW5zdXBwb3J0ZWQgSFBMIHZlcnNpb25cIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHJcblx0Zm9yIGxpbmUsIGkgaW4gbGluZXNcclxuXHRcdGlmIGxpbmUubWF0Y2ggLy4rIC4qIC4rL1xyXG5cdFx0XHRyZ2IgPSBsaW5lLnNwbGl0KFwiIFwiKVxyXG5cdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdHI6IHJnYlswXVxyXG5cdFx0XHRcdGc6IHJnYlsxXVxyXG5cdFx0XHRcdGI6IHJnYlsyXVxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIFBhaW50Lk5FVCBwYWxldHRlIGZpbGVcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRcclxuXHRoZXggPSAoeCktPiBwYXJzZUludCh4LCAxNilcclxuXHRcclxuXHRmb3IgbGluZSBpbiBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRcdG0gPSBsaW5lLm1hdGNoKC9eKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KSQvaSlcclxuXHRcdGlmIG0gdGhlbiBwYWxldHRlLmFkZFxyXG5cdFx0XHRhOiBoZXggbVsxXVxyXG5cdFx0XHRyOiBoZXggbVsyXVxyXG5cdFx0XHRnOiBoZXggbVszXVxyXG5cdFx0XHRiOiBoZXggbVs0XVxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIEpBU0MgUEFMIGZpbGUgKFBhaW50IFNob3AgUHJvIHBhbGV0dGUgZmlsZSlcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IFwiSkFTQy1QQUxcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiTm90IGEgSkFTQy1QQUxcIlxyXG5cdGlmIGxpbmVzWzFdIGlzbnQgXCIwMTAwXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVua25vd24gSkFTQy1QQUwgdmVyc2lvblwiXHJcblx0aWYgbGluZXNbMl0gaXNudCBcIjI1NlwiXHJcblx0XHRcInRoYXQncyBva1wiXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHQjbl9jb2xvcnMgPSBOdW1iZXIobGluZXNbMl0pXHJcblx0XHJcblx0Zm9yIGxpbmUsIGkgaW4gbGluZXNcclxuXHRcdGlmIGxpbmUgaXNudCBcIlwiIGFuZCBpID4gMlxyXG5cdFx0XHRyZ2IgPSBsaW5lLnNwbGl0KFwiIFwiKVxyXG5cdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdHI6IHJnYlswXVxyXG5cdFx0XHRcdGc6IHJnYlsxXVxyXG5cdFx0XHRcdGI6IHJnYlsyXVxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIFJlc291cmNlIEludGVyY2hhbmdlIEZpbGUgRm9ybWF0IFBBTCBmaWxlXHJcblxyXG4jIHBvcnRlZCBmcm9tIEMjIGNvZGUgYXQgaHR0cHM6Ly93b3JtczJkLmluZm8vUGFsZXR0ZV9maWxlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdCMgUklGRiBoZWFkZXJcclxuXHRyaWZmID0gYnIucmVhZFN0cmluZyg0KSAjIFwiUklGRlwiXHJcblx0ZGF0YVNpemUgPSBici5yZWFkVUludDMyKClcclxuXHR0eXBlID0gYnIucmVhZFN0cmluZyg0KSAjIFwiUEFMIFwiXHJcblx0XHJcblx0aWYgcmlmZiBpc250IFwiUklGRlwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJSSUZGIGhlYWRlciBub3QgZm91bmQ7IG5vdCBhIFJJRkYgUEFMIGZpbGVcIlxyXG5cdFxyXG5cdGlmIHR5cGUgaXNudCBcIlBBTCBcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiXCJcIlxyXG5cdFx0XHRSSUZGIGhlYWRlciBzYXlzIHRoaXMgaXNuJ3QgYSBQQUwgZmlsZSxcclxuXHRcdFx0bW9yZSBvZiBhIHNvcnQgb2YgI3soKHR5cGUrXCJcIikudHJpbSgpKX0gZmlsZVxyXG5cdFx0XCJcIlwiXHJcblx0XHJcblx0IyBEYXRhIGNodW5rXHJcblx0Y2h1bmtUeXBlID0gYnIucmVhZFN0cmluZyg0KSAjIFwiZGF0YVwiXHJcblx0Y2h1bmtTaXplID0gYnIucmVhZFVJbnQzMigpXHJcblx0cGFsVmVyc2lvbiA9IGJyLnJlYWRVSW50MTYoKSAjIDB4MDMwMFxyXG5cdHBhbE51bUVudHJpZXMgPSBici5yZWFkVUludDE2KClcclxuXHRcclxuXHRcclxuXHRpZiBjaHVua1R5cGUgaXNudCBcImRhdGFcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiRGF0YSBjaHVuayBub3QgZm91bmQgKC4uLicje2NodW5rVHlwZX0nPylcIlxyXG5cdFxyXG5cdGlmIHBhbFZlcnNpb24gaXNudCAweDAzMDBcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVuc3VwcG9ydGVkIFBBTCBmaWxlIHZlcnNpb246IDB4I3twYWxWZXJzaW9uLnRvU3RyaW5nKDE2KX1cIlxyXG5cdFxyXG5cdCMgQ29sb3JzXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRpID0gMFxyXG5cdHdoaWxlIChpICs9IDEpIDwgcGFsTnVtRW50cmllcyAtIDFcclxuXHRcdFxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0XzogYnIucmVhZEJ5dGUoKSAjIFwiZmxhZ3NcIiwgYWx3YXlzIDB4MDBcclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIFBBTCAoU3RhckNyYWZ0IHJhdyBwYWxldHRlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdGZvciBpIGluIFswLi4uMjU1XVxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0Izogbm8gcGFkZGluZ1xyXG5cdFxyXG5cdCM/IHBhbGV0dGUubl9jb2x1bW5zID0gMTZcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIFdQRSAoU3RhckNyYWZ0IHBhZGRlZCByYXcgcGFsZXR0ZSlcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHRmb3IgaSBpbiBbMC4uLjI1NV1cclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdF86IGJyLnJlYWRCeXRlKCkgIyBwYWRkaW5nXHJcblx0XHJcblx0cGFsZXR0ZS5uX2NvbHVtbnMgPSAxNlxyXG5cdHBhbGV0dGVcclxuIiwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi9QYWxldHRlXCJcclxuQ29sb3IgPSByZXF1aXJlIFwiLi9Db2xvclwiXHJcblxyXG5jbGFzcyBSYW5kb21Db2xvciBleHRlbmRzIENvbG9yXHJcblx0Y29uc3RydWN0b3I6IC0+XHJcblx0XHRzdXBlcigpXHJcblx0XHRAcmFuZG9taXplKClcclxuXHRcclxuXHRyYW5kb21pemU6IC0+XHJcblx0XHRAaCA9IE1hdGgucmFuZG9tKCkgKiAzNjBcclxuXHRcdEBzID0gTWF0aC5yYW5kb20oKSAqIDEwMFxyXG5cdFx0QGwgPSBNYXRoLnJhbmRvbSgpICogMTAwXHJcblx0XHJcblx0dG9TdHJpbmc6IC0+XHJcblx0XHRAcmFuZG9taXplKClcclxuXHRcdFwiaHNsKCN7QGh9LCAje0BzfSUsICN7QGx9JSlcIlxyXG5cdFxyXG5cdGlzOiAtPiBub1xyXG5cclxuY2xhc3MgUmFuZG9tUGFsZXR0ZSBleHRlbmRzIFBhbGV0dGVcclxuXHRjb25zdHJ1Y3RvcjogLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEBsb2FkZWRfYXMgPSBcIkNvbXBsZXRlbHkgUmFuZG9tIENvbG9yc+KEolwiXHJcblx0XHRAbG9hZGVkX2FzX2NsYXVzZSA9IFwiKC5jcmMgc2pmKERmMDlzamRma3NkbGZtbm0gJzsnO1wiXHJcblx0XHRAY29uZmlkZW5jZSA9IDBcclxuXHRcdEBmaW5hbGl6ZSgpXHJcblx0XHRmb3IgaSBpbiBbMC4uTWF0aC5yYW5kb20oKSoxNSs1XVxyXG5cdFx0XHRAcHVzaCBuZXcgUmFuZG9tQ29sb3IoKVxyXG5cclxuY2xhc3MgTG9hZGluZ0Vycm9ycyBleHRlbmRzIEVycm9yXHJcblx0Y29uc3RydWN0b3I6IChAZXJyb3JzKS0+XHJcblx0XHRzdXBlcigpXHJcblx0XHRAbWVzc2FnZSA9IFwiU29tZSBlcnJvcnMgd2VyZSBlbmNvdW50ZXJlZCB3aGVuIGxvYWRpbmc6XCIgK1xyXG5cdFx0XHRmb3IgZXJyb3IgaW4gQGVycm9yc1xyXG5cdFx0XHRcdFwiXFxuXFx0XCIgKyBlcnJvci5tZXNzYWdlXHJcblxyXG5sb2FkX3BhbGV0dGUgPSAobywgY2FsbGJhY2spLT5cclxuXHRcclxuXHRwYWxldHRlX2xvYWRlcnMgPSBbXHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiLCBcInBzcHBhbGV0dGVcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9QYWludFNob3BQcm9cIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlJJRkYgUEFMXCJcclxuXHRcdFx0ZXh0czogW1wicGFsXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvUklGRlwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiQ29sb3JTY2hlbWVyIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJjc1wiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0NvbG9yU2NoZW1lclwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUGFpbnQuTkVUIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJ0eHRcIiwgXCJwZG5cIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9QYWludC5ORVRcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkdJTVAgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImdwbFwiLCBcImdpbXBcIiwgXCJjb2xvcnNcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9HSU1QXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJDU1Mtc3R5bGUgY29sb3JzXCJcclxuXHRcdFx0ZXh0czogW1widHh0XCIsIFwiaHRtbFwiLCBcImNzc1wiLCBcInhtbFwiLCBcInN2Z1wiLCBcImpzXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvR2VuZXJpY1wiXHJcblx0XHR9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIFN3YXRjaFwiXHJcblx0XHQjIFx0ZXh0czogW1wiYWNvXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yU3dhdGNoXCJcclxuXHRcdCMgfVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBDb2xvciBUYWJsZVwiXHJcblx0XHQjIFx0ZXh0czogW1wiYWN0XCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yVGFibGVcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIFN3YXRjaCBFeGNoYW5nZVwiXHJcblx0XHQjIFx0ZXh0czogW1wiYXNlXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZVN3YXRjaEV4Y2hhbmdlXCJcclxuXHRcdCMgfVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBDb2xvciBCb29rXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY2JcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JCb29rXCJcclxuXHRcdCMgfVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkhQTCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiaHBsXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvSFBMXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJTdGFyQ3JhZnQgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1N0YXJDcmFmdFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiU3RhckNyYWZ0IHRlcnJhaW4gcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcIndwZVwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1N0YXJDcmFmdFBhZGRlZFwiXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQXV0b0NBRCBDb2xvciBCb29rXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY2JcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0F1dG9DQURDb2xvckJvb2tcIlxyXG5cdFx0IyB9XHJcblx0XHRcclxuXHRcdCMge1xyXG5cdFx0IyBcdCMgKHNhbWUgYXMgUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZT8pXHJcblx0XHQjIFx0bmFtZTogXCJDb3JlbERSQVcgcGFsZXR0ZVwiXHJcblx0XHQjIFx0ZXh0czogW1wicGFsXCIsIFwiY3BsXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9Db3JlbERSQVdcIlxyXG5cdFx0IyB9XHJcblx0XVxyXG5cdFxyXG5cdCMgZmluZCBwYWxldHRlIGxvYWRlcnMgdGhhdCB1c2UgdGhpcyBmaWxlIGV4dGVuc2lvblxyXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcclxuXHRcdHBsLm1hdGNoZXNfZXh0ID0gcGwuZXh0cy5pbmRleE9mKG8uZmlsZV9leHQpIGlzbnQgLTFcclxuXHRcclxuXHQjIG1vdmUgcGFsZXR0ZSBsb2FkZXJzIHRvIHRoZSBiZWdpbm5pbmcgdGhhdCB1c2UgdGhpcyBmaWxlIGV4dGVuc2lvblxyXG5cdHBhbGV0dGVfbG9hZGVycy5zb3J0IChwbDEsIHBsMiktPlxyXG5cdFx0cGwyLm1hdGNoZXNfZXh0IC0gcGwxLm1hdGNoZXNfZXh0XHJcblx0XHJcblx0IyB0cnkgbG9hZGluZyBzdHVmZlxyXG5cdGVycm9ycyA9IFtdXHJcblx0Zm9yIHBsIGluIHBhbGV0dGVfbG9hZGVyc1xyXG5cdFx0XHJcblx0XHR0cnlcclxuXHRcdFx0cGFsZXR0ZSA9IHBsLmxvYWQobylcclxuXHRcdFx0aWYgcGFsZXR0ZS5sZW5ndGggaXMgMFxyXG5cdFx0XHRcdHBhbGV0dGUgPSBudWxsXHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwibm8gY29sb3JzIHJldHVybmVkXCJcclxuXHRcdGNhdGNoIGVcclxuXHRcdFx0bXNnID0gXCJmYWlsZWQgdG8gbG9hZCAje28uZmlsZV9uYW1lfSBhcyAje3BsLm5hbWV9OiAje2UubWVzc2FnZX1cIlxyXG5cdFx0XHRpZiBwbC5tYXRjaGVzX2V4dCBhbmQgbm90IGUubWVzc2FnZS5tYXRjaCgvbm90IGEvaSlcclxuXHRcdFx0XHRjb25zb2xlPy5lcnJvcj8gbXNnXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRjb25zb2xlPy53YXJuPyBtc2dcclxuXHRcdFx0XHJcblx0XHRcdGVyciA9IG5ldyBFcnJvciBtc2dcclxuXHRcdFx0ZXJyLmVycm9yID0gZVxyXG5cdFx0XHRlcnJvcnMucHVzaCBlcnJcclxuXHRcdFxyXG5cdFx0aWYgcGFsZXR0ZVxyXG5cdFx0XHRjb25zb2xlPy5pbmZvPyBcImxvYWRlZCAje28uZmlsZV9uYW1lfSBhcyAje3BsLm5hbWV9XCJcclxuXHRcdFx0cGFsZXR0ZS5jb25maWRlbmNlID0gaWYgcGwubWF0Y2hlc19leHQgdGhlbiAwLjkgZWxzZSAwLjAxXHJcblx0XHRcdHBhbGV0dGUubG9hZGVkX2FzID0gcGwubmFtZVxyXG5cdFx0XHRleHRzX3ByZXR0eSA9IFwiKC4je3BsLmV4dHMuam9pbihcIiwgLlwiKX0pXCJcclxuXHRcdFx0XHJcblx0XHRcdGlmIHBsLm1hdGNoZXNfZXh0XHJcblx0XHRcdFx0cGFsZXR0ZS5sb2FkZWRfYXNfY2xhdXNlID0gZXh0c19wcmV0dHlcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHBhbGV0dGUubG9hZGVkX2FzX2NsYXVzZSA9IFwiIGZvciBzb21lIHJlYXNvblwiXHJcblx0XHRcdFxyXG5cdFx0XHRwYWxldHRlLmZpbmFsaXplKClcclxuXHRcdFx0Y2FsbGJhY2sobnVsbCwgcGFsZXR0ZSlcclxuXHRcdFx0cmV0dXJuXHJcblx0XHJcblx0Y2FsbGJhY2sobmV3IExvYWRpbmdFcnJvcnMoZXJyb3JzKSlcclxuXHRyZXR1cm5cclxuXHJcbm9wdGlvbnMgPSAobyA9IHt9KS0+XHJcblx0aWYgdHlwZW9mIG8gaXMgXCJzdHJpbmdcIiBvciBvIGluc3RhbmNlb2YgU3RyaW5nXHJcblx0XHRvID0gZmlsZV9uYW1lOiBvXHJcblx0aWYgRmlsZT8gYW5kIG8gaW5zdGFuY2VvZiBGaWxlXHJcblx0XHRvID0gZmlsZTogb1xyXG5cdFxyXG5cdG8ubWluX2NvbG9ycyA/PSBvLm1pbkNvbG9ycyA/IDJcclxuXHRvLm1heF9jb2xvcnMgPz0gby5tYXhDb2xvcnMgPyAyNTZcclxuXHRvLmZpbGVfbmFtZSA/PSBvLmZpbGVOYW1lID8gby5mbmFtZSA/IG8uZmlsZT8ubmFtZVxyXG5cdG8uZmlsZV9leHQgPz0gby5maWxlRXh0ID8gXCIje28uZmlsZV9uYW1lfVwiLnNwbGl0KFwiLlwiKS5wb3AoKVxyXG5cdG8uZmlsZV9leHQgPSAoXCIje28uZmlsZV9leHR9XCIpLnRvTG93ZXJDYXNlKClcclxuXHRvXHJcblx0XHJcblxyXG4jIEdldCBwYWxldHRlIGZyb20gYSBmaWxlXHJcblBhbGV0dGUubG9hZCA9IChvLCBjYWxsYmFjayktPlxyXG5cdGlmIG5vdCBvXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJQYXJhbWV0ZXJzIHJlcXVpcmVkOiBQYWxldHRlLmxvYWQob3B0aW9ucywgZnVuY3Rpb24gY2FsbGJhY2soZXJyLCBwYWxldHRlKXt9KVwiXHJcblx0aWYgbm90IGNhbGxiYWNrXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJDYWxsYmFjayByZXF1aXJlZDogUGFsZXR0ZS5sb2FkKG9wdGlvbnMsIGZ1bmN0aW9uIGNhbGxiYWNrKGVyciwgcGFsZXR0ZSl7fSlcIlxyXG5cdFxyXG5cdG8gPSBvcHRpb25zIG9cclxuXHRcclxuXHRpZiBvLmRhdGFcclxuXHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRlbHNlIGlmIEZpbGU/IGFuZCBvLmZpbGUgaW5zdGFuY2VvZiBGaWxlXHJcblx0XHRmciA9IG5ldyBGaWxlUmVhZGVyXHJcblx0XHRmci5vbmxvYWQgPSAtPlxyXG5cdFx0XHRvLmRhdGEgPSBmci5yZXN1bHRcclxuXHRcdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdFx0ZnIucmVhZEFzQmluYXJ5U3RyaW5nIG8uZmlsZVxyXG5cdGVsc2UgaWYgZ2xvYmFsP1xyXG5cdFx0XHJcblx0XHRmcyA9IHJlcXVpcmUgXCJmc1wiXHJcblx0XHRmcy5yZWFkRmlsZSBvLmZpbGVfbmFtZSwgKGVyciwgZGF0YSktPlxyXG5cdFx0XHRpZiBlcnJcclxuXHRcdFx0XHRjYWxsYmFjayhlcnIpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRvLmRhdGEgPSBkYXRhLnRvU3RyaW5nKFwiYmluYXJ5XCIpXHJcblx0XHRcdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdGVsc2VcclxuXHRcdGNhbGxiYWNrKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkLiBUaGUgRmlsZSBBUEkgbWF5IG5vdCBiZSBzdXBwb3J0ZWQuXCIpKVxyXG5cclxuXHJcbiMgR2V0IGEgcGFsZXR0ZSBmcm9tIGEgZmlsZSBvciBieSBhbnkgbWVhbnMgbmVjZXNzYXJ5XHJcbiMgKGFzIGluIGZhbGwgYmFjayB0byBjb21wbGV0ZWx5IHJhbmRvbSBkYXRhKVxyXG5QYWxldHRlLmdpbW1lID0gKG8sIGNhbGxiYWNrKS0+XHJcblx0byA9IG9wdGlvbnMgb1xyXG5cdFxyXG5cdFBhbGV0dGUubG9hZCBvLCAoZXJyLCBwYWxldHRlKS0+XHJcblx0XHRjYWxsYmFjayhudWxsLCBwYWxldHRlID8gbmV3IFJhbmRvbVBhbGV0dGUpXHJcblxyXG4jIEV4cG9ydHNcclxuUCA9IG1vZHVsZS5leHBvcnRzID0gUGFsZXR0ZVxyXG5QLkNvbG9yID0gQ29sb3JcclxuUC5QYWxldHRlID0gUGFsZXR0ZVxyXG5QLlJhbmRvbUNvbG9yID0gUmFuZG9tQ29sb3JcclxuUC5SYW5kb21QYWxldHRlID0gUmFuZG9tUGFsZXR0ZVxyXG4jIFAuTG9hZGluZ0Vycm9ycyA9IExvYWRpbmdFcnJvcnNcclxuIl19
