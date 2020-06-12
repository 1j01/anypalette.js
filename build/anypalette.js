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
// Detect CSS colors (except named colors)
var Palette;

Palette = require("../Palette");

// TODO: detect names via structures like CSS variables, JSON object keys/values, comments
// TODO: use all colors regardless of format, within a detected structure, or maybe always
module.exports = function({data}) {
  var hex, i, len, most_colors, n, palette, palette_hex_long, palette_hex_short, palette_hsl, palette_hsla, palette_rgb, palette_rgba, palettes;
  palettes = [palette_hex_long = new Palette(), palette_hex_short = new Palette(), palette_rgb = new Palette(), palette_hsl = new Palette(), palette_hsla = new Palette(), palette_rgba = new Palette()];
  hex = function(x) {
    return parseInt(x, 16);
  };
  data.replace(/\#([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{4}|[0-9A-F]{8})(?![0-9A-F])/gim, function(m, $1) { // hashtag # #/
    // three hex-digits (#A0C)
    // six hex-digits (#AA00CC)
    // with alpha, four hex-digits (#A0CF)
    // with alpha, eight hex-digits (#AA00CCFF)
    // (and no more!)
    if ($1.length > 4) {
      return palette_hex_long.add({
        r: hex($1[0] + $1[1]),
        g: hex($1[2] + $1[3]),
        b: hex($1[4] + $1[5]),
        a: $1.length === 8 ? hex($1[6] + $1[7]) : 1
      });
    } else {
      return palette_hex_short.add({
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


},{"../Palette":3}],5:[function(require,module,exports){
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


},{"../BinaryReader":1,"../Palette":3}],6:[function(require,module,exports){
// Load a GIMP palette
var Palette, parse_gimp_or_kde_rgb_palette;

Palette = require("../Palette");

parse_gimp_or_kde_rgb_palette = function(data, format_name) {
  var i, line, lines, m, palette, r_g_b_name;
  lines = data.split(/[\n\r]+/m);
  if (lines[0] !== format_name) {
    throw new Error(`Not a ${format_name}`);
  }
  palette = new Palette();
  i = 0;
  // starts at i = 1 because the increment happens at the start of the loop
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

module.exports = function({data}) {
  return parse_gimp_or_kde_rgb_palette(data, "GIMP Palette");
};

module.exports.parse_gimp_or_kde_rgb_palette = parse_gimp_or_kde_rgb_palette;


},{"../Palette":3}],7:[function(require,module,exports){
// Load an Allaire Homesite / Macromedia ColdFusion palette (.hpl)
var Palette;

Palette = require("../Palette");

module.exports = function({data}) {
  var i, j, len, line, lines, palette, rgb;
  lines = data.split(/[\n\r]+/m);
  if (lines[0] !== "Palette") {
    throw new Error("Not a Homesite palette");
  }
  if (!lines[1].match(/Version [34]\.0/)) {
    throw new Error("Unsupported Homesite palette version");
  }
  palette = new Palette();
  for (i = j = 0, len = lines.length; j < len; i = ++j) {
    line = lines[i];
    if (line.match(/.+ .+ .+/)) {
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
var parse_gimp_or_kde_rgb_palette;

({parse_gimp_or_kde_rgb_palette} = require("./GIMP"));

module.exports = function({data}) {
  return parse_gimp_or_kde_rgb_palette(data, "KDE RGB Palette");
};


},{"./GIMP":6}],9:[function(require,module,exports){
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


},{"../BinaryReader":1,"../Palette":3}],10:[function(require,module,exports){
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


},{"../BinaryReader":1,"../Palette":3}],11:[function(require,module,exports){
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


},{"../BinaryReader":1,"../Palette":3}],12:[function(require,module,exports){
// Load sK1 palettes
// These files are actually pythonic, but let's just try to parse them in a basic, non-general way
var Palette;

Palette = require("../Palette");

module.exports = function({data}) {
  var _, args_str, fn_name, fns, i, len, line, lines, match, n, palette;
  lines = data.split(/[\n\r]+/m);
  palette = new Palette();
  fns = {
    set_name: function(name) {
      return palette.name = name;
    },
    add_comments: function(line) {
      if (palette.description == null) {
        palette.description = "";
      }
      return palette.description += line + "\n";
    },
    set_columns: function(columns_str) {
      return palette.numberOfColumns = parseInt(columns_str);
    },
    color: function(color_def_str) {
      var alpha, color_def, color_type, components, name;
      color_def = JSON.parse(color_def_str.replace(/\bu(['"])/g, "$1").replace(/'/g, '"'));
      [color_type, components, alpha, name] = color_def;
      switch (color_type) {
        case "RGB":
          return palette.add({
            r: components[0] * 255,
            g: components[1] * 255,
            b: components[2] * 255,
            a: alpha
          });
        case "Grayscale":
          return palette.add({
            r: components[0] * 255,
            g: components[0] * 255,
            b: components[0] * 255,
            a: alpha
          });
        case "CMYK":
          return palette.add({
            c: components[0] * 100,
            m: components[1] * 100,
            y: components[2] * 100,
            k: components[3] * 100,
            a: alpha
          });
        case "HSL":
          return palette.add({
            h: components[0] * 360,
            s: components[1] * 100,
            l: components[2] * 100,
            a: alpha
          });
      }
    }
  };
  for (i = 0, len = lines.length; i < len; i++) {
    line = lines[i];
    match = line.match(/([\w_]+)\((.*)\)/);
    if (match) {
      [_, fn_name, args_str] = match;
      if (typeof fns[fn_name] === "function") {
        fns[fn_name](args_str);
      }
    }
  }
  n = palette.length;
  if (n < 2) {
    throw new Error(["No colors found", "Only one color found"][n] + ` (${n})`);
  }
  return palette;
};


},{"../Palette":3}],13:[function(require,module,exports){
// Load a Skencil palette (.spl) ("Sketch RGBPalette")
// (not related to .sketchpalette Sketch App palette format)
var Palette;

Palette = require("../Palette");

module.exports = function({data}) {
  var i, line, lines, palette, r_g_b_name;
  lines = data.split(/[\n\r]+/m);
  palette = new Palette();
  i = 1;
  while ((i += 1) < lines.length) {
    line = lines[i];
    if (line[0] === "#" || line === "") {
      continue;
    }
    // TODO: handle non-start-of-line comments? where's the spec?

    // TODO: replace \s with [\ \t] (spaces or tabs)
    // it can't match \n because it's already split on that, but still
    // TODO: handle line with no name but space on the end
    r_g_b_name = line.match(/^\s*([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)(?:\s+(.*))?$/); // at the beginning of the line,
    // perhaps with some leading spaces
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
      r: r_g_b_name[1] * 255,
      g: r_g_b_name[2] * 255,
      b: r_g_b_name[3] * 255,
      name: r_g_b_name[4]
    });
  }
  return palette;
};


},{"../Palette":3}],14:[function(require,module,exports){
// PAL (StarCraft raw palette)
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data}) {
  var br, i, j, palette;
  palette = new Palette();
  br = new BinaryReader(data);
  if (br.getSize() !== 768) {
    throw new Error(`Wrong file size, must be ${768} bytes long (not ${br.getSize()})`);
  }
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


},{"../BinaryReader":1,"../Palette":3}],15:[function(require,module,exports){
// WPE (StarCraft padded raw palette)
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data}) {
  var br, i, j, palette;
  palette = new Palette();
  br = new BinaryReader(data);
  if (br.getSize() !== 1024) {
    throw new Error(`Wrong file size, must be ${1024} bytes long (not ${br.getSize()})`);
  }
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


},{"../BinaryReader":1,"../Palette":3}],16:[function(require,module,exports){
// Load a Sketch App JSON palette (.sketchpalette)
// (not related to .spl Sketch RGB palette format)

// based on https://github.com/andrewfiorillo/sketch-palettes/blob/5b6bfa6eb25cb3244a9e6a226df259e8fb31fc2c/Sketch%20Palettes.sketchplugin/Contents/Sketch/sketchPalettes.js
var Palette, parse_css_hex_color, version;

Palette = require("../Palette");

version = 1.4;

// TODO: DRY with CSS.coffee
parse_css_hex_color = function(hex_color) {
  var $0, $1, hex, match;
  hex = function(x) {
    return parseInt(x, 16);
  };
  match = hex_color.match(/\#([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{4}|[0-9A-F]{8})(?![0-9A-F])/gim); // hashtag # #/
  // three hex-digits (#A0C)
  // six hex-digits (#AA00CC)
  // with alpha, four hex-digits (#A0CF)
  // with alpha, eight hex-digits (#AA00CCFF)
  // (and no more!)
  [$0, $1] = match;
  if ($1.length > 4) {
    return {
      r: hex($1[0] + $1[1]),
      g: hex($1[2] + $1[3]),
      b: hex($1[4] + $1[5]),
      a: $1.length === 8 ? hex($1[6] + $1[7]) : 1
    };
  } else {
    return {
      r: hex($1[0] + $1[0]),
      g: hex($1[1] + $1[1]),
      b: hex($1[2] + $1[2]),
      a: $1.length === 4 ? hex($1[3] + $1[3]) : 1
    };
  }
};

module.exports = function({data}) {
  var colorAssets, colorDefinitions, color_definition, compatibleVersion, gradientAssets, gradientDefinitions, hex_color, i, imageDefinitions, images, j, len, len1, palette, paletteContents, ref, ref1, ref2;
  if (!data.match(/^\s*{/)) {
    throw new Error("not sketchpalette JSON");
  }
  paletteContents = JSON.parse(data);
  compatibleVersion = paletteContents.compatibleVersion;
  // Check for presets in file, else set to empty array
  colorDefinitions = (ref = paletteContents.colors) != null ? ref : [];
  gradientDefinitions = (ref1 = paletteContents.gradients) != null ? ref1 : [];
  imageDefinitions = (ref2 = paletteContents.images) != null ? ref2 : [];
  colorAssets = [];
  gradientAssets = [];
  images = [];
  palette = new Palette();
  // Check if plugin is out of date and incompatible with a newer palette version
  if (compatibleVersion && compatibleVersion > version) {
    throw new Error(`Can't handle compatibleVersion of ${compatibleVersion}.`);
    return;
  }
  // Check for older hex code palette version
  if (!compatibleVersion || compatibleVersion < 1.4) {
// Convert hex colors
    for (i = 0, len = colorDefinitions.length; i < len; i++) {
      hex_color = colorDefinitions[i];
      palette.add(parse_css_hex_color(hex_color));
    }
  } else {
    // Color Fills: convert rgba colors
    if (colorDefinitions.length > 0) {
      for (j = 0, len1 = colorDefinitions.length; j < len1; j++) {
        color_definition = colorDefinitions[j];
        palette.add({
          r: color_definition.red * 255,
          g: color_definition.green * 255,
          b: color_definition.blue * 255,
          a: color_definition.alpha * 255,
          name: color_definition.name
        });
      }
    }
  }
  // # Pattern Fills: convert base64 strings to MSImageData objects
  // if imageDefinitions.length > 0
  // 	for i in [0..imageDefinitions.length]
  // 		nsdata = NSData.alloc().initWithBase64EncodedString_options(imageDefinitions[i].data, 0)
  // 		nsimage = NSImage.alloc().initWithData(nsdata)
  // 		# msimage = MSImageData.alloc().initWithImageConvertingColorSpace(nsimage)
  // 		msimage = MSImageData.alloc().initWithImage(nsimage)
  // 		images.push(msimage)

  // # Gradient Fills: build MSGradientStop and MSGradient objects
  // if gradientDefinitions.length > 0
  // 	for i in [0..gradientDefinitions.length]
  // 		# Create gradient stops
  // 		gradient = gradientDefinitions[i]
  // 		stops = []
  // 		for j in [0..gradient.stops]
  // 			color = MSColor.colorWithRed_green_blue_alpha(
  // 				gradient.stops[j].color.red,
  // 				gradient.stops[j].color.green,
  // 				gradient.stops[j].color.blue,
  // 				gradient.stops[j].color.alpha
  // 			)
  // 			stops.push(MSGradientStop.stopWithPosition_color_(gradient.stops[j].position, color))

  // 		# Create gradient object and set basic properties
  // 		msgradient = MSGradient.new()
  // 		msgradient.setGradientType(gradient.gradientType)
  // 		# msgradient.shouldSmoothenOpacity = gradient.shouldSmoothenOpacity
  // 		msgradient.elipseLength = gradient.elipseLength
  // 		msgradient.setStops(stops)

  // 		# Parse From and To values into arrays e.g.: from: "{0.1,-0.43}" => fromValue = [0.1, -0.43]
  // 		fromValue = gradient.from.slice(1,-1).split(",")
  // 		toValue = gradient.to.slice(1,-1).split(",")

  // 		# Set CGPoint objects as From and To values
  // 		msgradient.setFrom({ x: fromValue[0], y: fromValue[1] })
  // 		msgradient.setTo({ x: toValue[0], y: toValue[1] })

  // 		gradientName = gradientDefinitions[i].name ? gradientDefinitions[i].name : null
  // 		gradientAssets.push(MSGradientAsset.alloc().initWithAsset_name(msgradient, gradientName))
  return palette;
};


},{"../Palette":3}],17:[function(require,module,exports){
// Load tabular RGB values
var Palette;

Palette = require("../Palette");

module.exports = function({data}) {
  var csv_palette, i, j, len, len1, line, lines, most_colors, n, palette, palettes, ssv_palette, try_parse_line;
  lines = data.split(/[\n\r]+/m);
  palettes = [csv_palette = new Palette(), ssv_palette = new Palette()];
  try_parse_line = function(line, palette, regexp) {
    var match;
    match = line.match(regexp);
    if (match) {
      return palette.add({
        r: match[1],
        g: match[2],
        b: match[3]
      });
    }
  };
  for (i = 0, len = lines.length; i < len; i++) {
    line = lines[i];
    try_parse_line(line, csv_palette, /([0-9]*\.?[0-9]+),\s*([0-9]*\.?[0-9]+),\s*([0-9]*\.?[0-9]+)/);
    try_parse_line(line, ssv_palette, /([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)/);
  }
  most_colors = [];
  for (j = 0, len1 = palettes.length; j < len1; j++) {
    palette = palettes[j];
    if (palette.length >= most_colors.length) {
      most_colors = palette;
    }
  }
  n = most_colors.length;
  if (n < 4) {
    throw new Error(["No colors found", "Only one color found", "Only a couple colors found", "Only a few colors found"][n] + ` (${n})`);
  }
  if (most_colors.every(function(color) {
    return color.r <= 1 && color.g <= 1 && color.b <= 1;
  })) {
    most_colors.forEach(function(color) {
      color.r *= 255;
      color.g *= 255;
      return color.b *= 255;
    });
  }
  return most_colors;
};


},{"../Palette":3}],18:[function(require,module,exports){
// Load Windows .theme and .themepack files, and KDE .colors color schemes

var Palette = require("../Palette");

function parseINIString(data){
	var regex = {
		section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
		param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
		comment: /^\s*;.*$/
	};
	var value = {};
	var lines = data.split(/[\r\n]+/);
	var section = null;
	lines.forEach(function(line){
		if(regex.comment.test(line)){
			return;
		}else if(regex.param.test(line)){
			var match = line.match(regex.param);
			if(section){
				value[section][match[1]] = match[2];
			}else{
				value[match[1]] = match[2];
			}
		}else if(regex.section.test(line)){
			var match = line.match(regex.section);
			value[match[1]] = {};
			section = match[1];
		}else if(line.length == 0 && section){
			section = null;
		};
	});
	return value;
}

function parseThemeFileString(themeIni) {
	// .theme is a renamed .ini text file
	// .themepack is a renamed .cab file, and parsing it as .ini seems to work well enough for the most part, as the .ini data appears in plain,
	// but it may not if compression is enabled for the .cab file
	var theme = parseINIString(themeIni);
	var colors = theme["Control Panel\\Colors"];
	if (!colors) {
		throw new Error("Invalid theme file, no [Control Panel\\Colors] section");
	}
	var palette = new Palette();
	for (var k in colors) {
		// for .themepack file support, just ignore bad keys that were parsed
		if (!k.match(/\W/)) {
			var components = colors[k].split(" ");
			if (components.length === 3) {
				for (var i = 0; i < components.length; i++) {
					components[i] = parseInt(components[i], 10);
				}
				if (components.every((component)=> isFinite(component))) {
					palette.add({
						r: components[0],
						g: components[1],
						b: components[2],
						name: k,
					});
				}
			}
		}
	}

	return palette;
}

module.exports = ({data})=> {
	return parseThemeFileString(data);
};

},{"../Palette":3}],19:[function(require,module,exports){
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
      name: "KolourPaint palette",
      exts: ["colors"],
      load: require("./loaders/KolourPaint")
    },
    {
      name: "Skencil palette",
      exts: ["spl"],
      load: require("./loaders/SPL")
    },
    {
      name: "Sketch palette",
      exts: ["sketchpalette"],
      load: require("./loaders/sketchpalette")
    },
    {
      name: "sK1 palette",
      exts: ["skp"],
      load: require("./loaders/SKP")
    },
    {
      name: "CSS colors",
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
      load: require("./loaders/CSS")
    },
    {
      name: "Windows desktop theme",
      exts: ["theme",
    "themepack"],
      load: require("./loaders/theme")
    },
    {
      // {
      // 	name: "KDE desktop theme"
      // 	exts: ["colors"]
      // 	load: require "./loaders/theme"
      // }
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
      name: "Homesite palette",
      exts: ["hpl"],
      load: require("./loaders/Homesite")
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
    },
    {
      
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
      name: "tabular colors",
      exts: ["csv",
    "tsv",
    "txt"],
      load: require("./loaders/tabular")
    }
  ];

  // find palette loaders that use this file extension
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
    throw new TypeError("parameters required: AnyPalette.loadPalette(options, function callback(error, palette){})");
  }
  if (!callback) {
    throw new TypeError("callback required: AnyPalette.loadPalette(options, function callback(error, palette){})");
  }
  o = normalize_options(o);
  if (o.data) {
    return load_palette(o, callback);
  } else if (o.file) {
    if (!(o.file instanceof File)) {
      throw new TypeError("options.file was passed but it is not a File");
    }
    fr = new FileReader();
    fr.onerror = function() {
      return callback(fr.error);
    };
    fr.onload = function() {
      o.data = fr.result;
      return load_palette(o, callback);
    };
    return fr.readAsBinaryString(o.file);
  } else if (o.filePath != null) {
    fs = require("fs");
    return fs.readFile(o.filePath, function(error, data) {
      if (error) {
        return callback(error);
      } else {
        o.data = data.toString("binary");
        return load_palette(o, callback);
      }
    });
  } else {
    throw new TypeError("either options.data or options.file or options.filePath must be passed");
  }
};

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


},{"./Color":2,"./Palette":3,"./loaders/CSS":4,"./loaders/ColorSchemer":5,"./loaders/GIMP":6,"./loaders/Homesite":7,"./loaders/KolourPaint":8,"./loaders/Paint.NET":9,"./loaders/PaintShopPro":10,"./loaders/RIFF":11,"./loaders/SKP":12,"./loaders/SPL":13,"./loaders/StarCraft":14,"./loaders/StarCraftPadded":15,"./loaders/sketchpalette":16,"./loaders/tabular":17,"./loaders/theme":18,"fs":"fs","path":"path"}]},{},[19])(19)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQmluYXJ5UmVhZGVyLmNvZmZlZSIsInNyYy9Db2xvci5jb2ZmZWUiLCJzcmMvUGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbG9hZGVycy9DU1MuY29mZmVlIiwic3JjL2xvYWRlcnMvQ29sb3JTY2hlbWVyLmNvZmZlZSIsInNyYy9sb2FkZXJzL0dJTVAuY29mZmVlIiwic3JjL2xvYWRlcnMvSG9tZXNpdGUuY29mZmVlIiwic3JjL2xvYWRlcnMvS29sb3VyUGFpbnQuY29mZmVlIiwic3JjL2xvYWRlcnMvUGFpbnQuTkVULmNvZmZlZSIsInNyYy9sb2FkZXJzL1BhaW50U2hvcFByby5jb2ZmZWUiLCJzcmMvbG9hZGVycy9SSUZGLmNvZmZlZSIsInNyYy9sb2FkZXJzL1NLUC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TUEwuY29mZmVlIiwic3JjL2xvYWRlcnMvU3RhckNyYWZ0LmNvZmZlZSIsInNyYy9sb2FkZXJzL1N0YXJDcmFmdFBhZGRlZC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9za2V0Y2hwYWxldHRlLmNvZmZlZSIsInNyYy9sb2FkZXJzL3RhYnVsYXIuY29mZmVlIiwic3JjL2xvYWRlcnMvdGhlbWUuanMiLCJzcmMvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNhSTs7Ozs7Ozs7Ozs7OztBQUFBLElBQUE7O0FBRUYsTUFBTSxDQUFDLE9BQVAsR0FDTTtFQUFOLE1BQUEsYUFBQTtJQUNBLFdBQWEsQ0FBQyxJQUFELENBQUE7TUFDWixJQUFDLENBQUEsT0FBRCxHQUFXO01BQ1gsSUFBQyxDQUFBLElBQUQsR0FBUTtJQUZJLENBQWQ7OztJQU1DLFFBQVUsQ0FBQSxDQUFBO0FBQ1gsVUFBQTtNQUFFLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBWjtNQUNBLEVBQUEsR0FBSyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQWIsQ0FBd0IsSUFBQyxDQUFBLElBQXpCLENB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LEdBQWlCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXHJcbiMjI1xyXG5CaW5hcnlSZWFkZXJcclxuXHJcbk1vZGlmaWVkIGJ5IElzYWlhaCBPZGhuZXJcclxuQFRPRE86IHVzZSBqRGF0YVZpZXcgKyBqQmluYXJ5IGluc3RlYWRcclxuXHJcblJlZmFjdG9yZWQgYnkgVmpldXggPHZqZXV4eEBnbWFpbC5jb20+XHJcbmh0dHA6Ly9ibG9nLnZqZXV4LmNvbS8yMDEwL2phdmFzY3JpcHQvamF2YXNjcmlwdC1iaW5hcnktcmVhZGVyLmh0bWxcclxuXHJcbk9yaWdpbmFsXHJcbisgSm9uYXMgUmFvbmkgU29hcmVzIFNpbHZhXHJcbkAgaHR0cDovL2pzZnJvbWhlbGwuY29tL2NsYXNzZXMvYmluYXJ5LXBhcnNlciBbcmV2LiAjMV1cclxuIyMjXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIEJpbmFyeVJlYWRlclxyXG5cdGNvbnN0cnVjdG9yOiAoZGF0YSktPlxyXG5cdFx0QF9idWZmZXIgPSBkYXRhXHJcblx0XHRAX3BvcyA9IDBcclxuXHJcblx0IyBQdWJsaWMgKGN1c3RvbSlcclxuXHRcclxuXHRyZWFkQnl0ZTogLT5cclxuXHRcdEBfY2hlY2tTaXplKDgpXHJcblx0XHRjaCA9IHRoaXMuX2J1ZmZlci5jaGFyQ29kZUF0KEBfcG9zKSAmIDB4ZmZcclxuXHRcdEBfcG9zICs9IDFcclxuXHRcdGNoICYgMHhmZlxyXG5cdFxyXG5cdHJlYWRVbmljb2RlU3RyaW5nOiAtPlxyXG5cdFx0bGVuZ3RoID0gQHJlYWRVSW50MTYoKVxyXG5cdFx0IyBjb25zb2xlLmxvZyB7bGVuZ3RofVxyXG5cdFx0QF9jaGVja1NpemUobGVuZ3RoICogMTYpXHJcblx0XHRzdHIgPSBcIlwiXHJcblx0XHRmb3IgaSBpbiBbMC4ubGVuZ3RoXVxyXG5cdFx0XHRzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShAX2J1ZmZlci5zdWJzdHIoQF9wb3MsIDEpIHwgKEBfYnVmZmVyLnN1YnN0cihAX3BvcysxLCAxKSA8PCA4KSlcclxuXHRcdFx0QF9wb3MgKz0gMlxyXG5cdFx0c3RyXHJcblx0XHJcblx0IyBQdWJsaWNcclxuXHRcclxuXHRyZWFkSW50ODogLT4gQF9kZWNvZGVJbnQoOCwgdHJ1ZSlcclxuXHRyZWFkVUludDg6IC0+IEBfZGVjb2RlSW50KDgsIGZhbHNlKVxyXG5cdHJlYWRJbnQxNjogLT4gQF9kZWNvZGVJbnQoMTYsIHRydWUpXHJcblx0cmVhZFVJbnQxNjogLT4gQF9kZWNvZGVJbnQoMTYsIGZhbHNlKVxyXG5cdHJlYWRJbnQzMjogLT4gQF9kZWNvZGVJbnQoMzIsIHRydWUpXHJcblx0cmVhZFVJbnQzMjogLT4gQF9kZWNvZGVJbnQoMzIsIGZhbHNlKVxyXG5cclxuXHRyZWFkRmxvYXQ6IC0+IEBfZGVjb2RlRmxvYXQoMjMsIDgpXHJcblx0cmVhZERvdWJsZTogLT4gQF9kZWNvZGVGbG9hdCg1MiwgMTEpXHJcblx0XHJcblx0cmVhZENoYXI6IC0+IEByZWFkU3RyaW5nKDEpXHJcblx0cmVhZFN0cmluZzogKGxlbmd0aCktPlxyXG5cdFx0QF9jaGVja1NpemUobGVuZ3RoICogOClcclxuXHRcdHJlc3VsdCA9IEBfYnVmZmVyLnN1YnN0cihAX3BvcywgbGVuZ3RoKVxyXG5cdFx0QF9wb3MgKz0gbGVuZ3RoXHJcblx0XHRyZXN1bHRcclxuXHJcblx0c2VlazogKHBvcyktPlxyXG5cdFx0QF9wb3MgPSBwb3NcclxuXHRcdEBfY2hlY2tTaXplKDApXHJcblx0XHJcblx0Z2V0UG9zaXRpb246IC0+IEBfcG9zXHJcblx0XHJcblx0Z2V0U2l6ZTogLT4gQF9idWZmZXIubGVuZ3RoXHJcblx0XHJcblxyXG5cclxuXHQjIFByaXZhdGVcclxuXHRcclxuXHRfZGVjb2RlRmxvYXQ6IGBmdW5jdGlvbihwcmVjaXNpb25CaXRzLCBleHBvbmVudEJpdHMpe1xyXG5cdFx0dmFyIGxlbmd0aCA9IHByZWNpc2lvbkJpdHMgKyBleHBvbmVudEJpdHMgKyAxO1xyXG5cdFx0dmFyIHNpemUgPSBsZW5ndGggPj4gMztcclxuXHRcdHRoaXMuX2NoZWNrU2l6ZShsZW5ndGgpO1xyXG5cclxuXHRcdHZhciBiaWFzID0gTWF0aC5wb3coMiwgZXhwb25lbnRCaXRzIC0gMSkgLSAxO1xyXG5cdFx0dmFyIHNpZ25hbCA9IHRoaXMuX3JlYWRCaXRzKHByZWNpc2lvbkJpdHMgKyBleHBvbmVudEJpdHMsIDEsIHNpemUpO1xyXG5cdFx0dmFyIGV4cG9uZW50ID0gdGhpcy5fcmVhZEJpdHMocHJlY2lzaW9uQml0cywgZXhwb25lbnRCaXRzLCBzaXplKTtcclxuXHRcdHZhciBzaWduaWZpY2FuZCA9IDA7XHJcblx0XHR2YXIgZGl2aXNvciA9IDI7XHJcblx0XHR2YXIgY3VyQnl0ZSA9IDA7IC8vbGVuZ3RoICsgKC1wcmVjaXNpb25CaXRzID4+IDMpIC0gMTtcclxuXHRcdGRvIHtcclxuXHRcdFx0dmFyIGJ5dGVWYWx1ZSA9IHRoaXMuX3JlYWRCeXRlKCsrY3VyQnl0ZSwgc2l6ZSk7XHJcblx0XHRcdHZhciBzdGFydEJpdCA9IHByZWNpc2lvbkJpdHMgJSA4IHx8IDg7XHJcblx0XHRcdHZhciBtYXNrID0gMSA8PCBzdGFydEJpdDtcclxuXHRcdFx0d2hpbGUgKG1hc2sgPj49IDEpIHtcclxuXHRcdFx0XHRpZiAoYnl0ZVZhbHVlICYgbWFzaykge1xyXG5cdFx0XHRcdFx0c2lnbmlmaWNhbmQgKz0gMSAvIGRpdmlzb3I7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRpdmlzb3IgKj0gMjtcclxuXHRcdFx0fVxyXG5cdFx0fSB3aGlsZSAocHJlY2lzaW9uQml0cyAtPSBzdGFydEJpdCk7XHJcblxyXG5cdFx0dGhpcy5fcG9zICs9IHNpemU7XHJcblxyXG5cdFx0cmV0dXJuIGV4cG9uZW50ID09IChiaWFzIDw8IDEpICsgMSA/IHNpZ25pZmljYW5kID8gTmFOIDogc2lnbmFsID8gLUluZmluaXR5IDogK0luZmluaXR5XHJcblx0XHRcdDogKDEgKyBzaWduYWwgKiAtMikgKiAoZXhwb25lbnQgfHwgc2lnbmlmaWNhbmQgPyAhZXhwb25lbnQgPyBNYXRoLnBvdygyLCAtYmlhcyArIDEpICogc2lnbmlmaWNhbmRcclxuXHRcdFx0OiBNYXRoLnBvdygyLCBleHBvbmVudCAtIGJpYXMpICogKDEgKyBzaWduaWZpY2FuZCkgOiAwKTtcclxuXHR9YFxyXG5cclxuXHRfZGVjb2RlSW50OiBgZnVuY3Rpb24oYml0cywgc2lnbmVkKXtcclxuXHRcdHZhciB4ID0gdGhpcy5fcmVhZEJpdHMoMCwgYml0cywgYml0cyAvIDgpLCBtYXggPSBNYXRoLnBvdygyLCBiaXRzKTtcclxuXHRcdHZhciByZXN1bHQgPSBzaWduZWQgJiYgeCA+PSBtYXggLyAyID8geCAtIG1heCA6IHg7XHJcblxyXG5cdFx0dGhpcy5fcG9zICs9IGJpdHMgLyA4O1xyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9YFxyXG5cclxuXHQjc2hsIGZpeDogSGVucmkgVG9yZ2VtYW5lIH4xOTk2IChjb21wcmVzc2VkIGJ5IEpvbmFzIFJhb25pKVxyXG5cdF9zaGw6IGBmdW5jdGlvbiAoYSwgYil7XHJcblx0XHRmb3IgKCsrYjsgLS1iOyBhID0gKChhICU9IDB4N2ZmZmZmZmYgKyAxKSAmIDB4NDAwMDAwMDApID09IDB4NDAwMDAwMDAgPyBhICogMiA6IChhIC0gMHg0MDAwMDAwMCkgKiAyICsgMHg3ZmZmZmZmZiArIDEpO1xyXG5cdFx0cmV0dXJuIGE7XHJcblx0fWBcclxuXHRcclxuXHRfcmVhZEJ5dGU6IGBmdW5jdGlvbiAoaSwgc2l6ZSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2J1ZmZlci5jaGFyQ29kZUF0KHRoaXMuX3BvcyArIHNpemUgLSBpIC0gMSkgJiAweGZmO1xyXG5cdH1gXHJcblxyXG5cdF9yZWFkQml0czogYGZ1bmN0aW9uIChzdGFydCwgbGVuZ3RoLCBzaXplKSB7XHJcblx0XHR2YXIgb2Zmc2V0TGVmdCA9IChzdGFydCArIGxlbmd0aCkgJSA4O1xyXG5cdFx0dmFyIG9mZnNldFJpZ2h0ID0gc3RhcnQgJSA4O1xyXG5cdFx0dmFyIGN1ckJ5dGUgPSBzaXplIC0gKHN0YXJ0ID4+IDMpIC0gMTtcclxuXHRcdHZhciBsYXN0Qnl0ZSA9IHNpemUgKyAoLShzdGFydCArIGxlbmd0aCkgPj4gMyk7XHJcblx0XHR2YXIgZGlmZiA9IGN1ckJ5dGUgLSBsYXN0Qnl0ZTtcclxuXHJcblx0XHR2YXIgc3VtID0gKHRoaXMuX3JlYWRCeXRlKGN1ckJ5dGUsIHNpemUpID4+IG9mZnNldFJpZ2h0KSAmICgoMSA8PCAoZGlmZiA/IDggLSBvZmZzZXRSaWdodCA6IGxlbmd0aCkpIC0gMSk7XHJcblxyXG5cdFx0aWYgKGRpZmYgJiYgb2Zmc2V0TGVmdCkge1xyXG5cdFx0XHRzdW0gKz0gKHRoaXMuX3JlYWRCeXRlKGxhc3RCeXRlKyssIHNpemUpICYgKCgxIDw8IG9mZnNldExlZnQpIC0gMSkpIDw8IChkaWZmLS0gPDwgMykgLSBvZmZzZXRSaWdodDsgXHJcblx0XHR9XHJcblxyXG5cdFx0d2hpbGUgKGRpZmYpIHtcclxuXHRcdFx0c3VtICs9IHRoaXMuX3NobCh0aGlzLl9yZWFkQnl0ZShsYXN0Qnl0ZSsrLCBzaXplKSwgKGRpZmYtLSA8PCAzKSAtIG9mZnNldFJpZ2h0KTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gc3VtO1xyXG5cdH1gXHJcblxyXG5cdF9jaGVja1NpemU6IChuZWVkZWRCaXRzKS0+XHJcblx0XHRpZiBAX3BvcyArIE1hdGguY2VpbChuZWVkZWRCaXRzIC8gOCkgPiBAX2J1ZmZlci5sZW5ndGhcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiSW5kZXggb3V0IG9mIGJvdW5kXCJcclxuXHJcbiIsIlxyXG4jIGNvbG9yIHZhbHVlIHJhbmdlczpcclxuIyBhOiAwIHRvIDFcclxuIyByL2cvYjogMCB0byAyNTVcclxuIyBoOiAwIHRvIDM2MFxyXG4jIHMvbDogMCB0byAxMDBcclxuIyBjL20veS9rOiAwIHRvIDEwMFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG5jbGFzcyBDb2xvclxyXG5cdGNvbnN0cnVjdG9yOiAob3B0aW9ucyktPlxyXG5cdFx0IyBAVE9ETzogZG9uJ3QgYXNzaWduIGFsbCBvZiB7QHIsIEBnLCBAYiwgQGgsIEBzLCBAdiwgQGx9IHJpZ2h0IGF3YXlcclxuXHRcdCMgb25seSBhc3NpZ24gdGhlIHByb3BlcnRpZXMgdGhhdCBhcmUgdXNlZFxyXG5cdFx0IyBhbHNvIG1heWJlIGFsd2F5cyBoYXZlIEByIEBnIEBiIChvciBAcmVkIEBncmVlbiBAYmx1ZSkgYnV0IHN0aWxsIHN0cmluZ2lmeSB0byBoc2woKSBpZiBoc2wgb3IgaHN2IGdpdmVuXHJcblx0XHQjIFRPRE86IGV4cGVjdCBudW1iZXJzIG9yIGNvbnZlcnQgdG8gbnVtYmVyc1xyXG5cdFx0e1xyXG5cdFx0XHRAciwgQGcsIEBiLFxyXG5cdFx0XHRAaCwgQHMsIEB2LCBAbCxcclxuXHRcdFx0YywgbSwgeSwgayxcclxuXHRcdFx0QG5hbWVcclxuXHRcdH0gPSBvcHRpb25zXHJcblxyXG5cdFx0aWYgQHI/IGFuZCBAZz8gYW5kIEBiP1xyXG5cdFx0XHQjIFJlZCBHcmVlbiBCbHVlXHJcblx0XHRcdCMgKG5vIGNvbnZlcnNpb25zIG5lZWRlZCBoZXJlKVxyXG5cdFx0ZWxzZSBpZiBAaD8gYW5kIEBzP1xyXG5cdFx0XHQjIEN5bGluZHJpY2FsIENvbG9yIFNwYWNlXHJcblx0XHRcdGlmIEB2P1xyXG5cdFx0XHRcdCMgSHVlIFNhdHVyYXRpb24gVmFsdWVcclxuXHRcdFx0XHRAbCA9ICgyIC0gQHMgLyAxMDApICogQHYgLyAyXHJcblx0XHRcdFx0QHMgPSBAcyAqIEB2IC8gKGlmIEBsIDwgNTAgdGhlbiBAbCAqIDIgZWxzZSAyMDAgLSBAbCAqIDIpXHJcblx0XHRcdFx0QHMgPSAwIGlmIGlzTmFOIEBzXHJcblx0XHRcdGVsc2UgaWYgQGw/XHJcblx0XHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBMaWdodG5lc3NcclxuXHRcdFx0XHQjIChubyBjb252ZXJzaW9ucyBuZWVkZWQgaGVyZSlcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdCMgVE9ETzogaW1wcm92ZSBlcnJvciBtZXNzYWdlIChlc3BlY2lhbGx5IGlmIEBiIGdpdmVuKVxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIkh1ZSwgc2F0dXJhdGlvbiwgYW5kLi4uPyAoZWl0aGVyIGxpZ2h0bmVzcyBvciB2YWx1ZSlcIlxyXG5cdFx0XHQjIFRPRE86IG1heWJlIGNvbnZlcnQgdG8gQHIgQGcgQGIgaGVyZVxyXG5cdFx0ZWxzZSBpZiBjPyBhbmQgbT8gYW5kIHk/IGFuZCBrP1xyXG5cdFx0XHQjIEN5YW4gTWFnZW50YSBZZWxsb3cgYmxhY0tcclxuXHRcdFx0IyBVTlRFU1RFRFxyXG5cdFx0XHRjIC89IDEwMFxyXG5cdFx0XHRtIC89IDEwMFxyXG5cdFx0XHR5IC89IDEwMFxyXG5cdFx0XHRrIC89IDEwMFxyXG5cdFx0XHRcclxuXHRcdFx0QHIgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIGMgKiAoMSAtIGspICsgaykpXHJcblx0XHRcdEBnID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCBtICogKDEgLSBrKSArIGspKVxyXG5cdFx0XHRAYiA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgeSAqICgxIC0gaykgKyBrKSlcclxuXHRcdGVsc2VcclxuXHRcdFx0IyBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRFxyXG5cdFx0XHRpZiBAbD8gYW5kIEBhPyBhbmQgQGI/XHJcblx0XHRcdFx0d2hpdGUgPVxyXG5cdFx0XHRcdFx0eDogOTUuMDQ3XHJcblx0XHRcdFx0XHR5OiAxMDAuMDAwXHJcblx0XHRcdFx0XHR6OiAxMDguODgzXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0eHl6ID0gXHJcblx0XHRcdFx0XHR5OiAocmF3LmwgKyAxNikgLyAxMTZcclxuXHRcdFx0XHRcdHg6IHJhdy5hIC8gNTAwICsgeHl6LnlcclxuXHRcdFx0XHRcdHo6IHh5ei55IC0gcmF3LmIgLyAyMDBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRmb3IgXyBpbiBcInh5elwiXHJcblx0XHRcdFx0XHRwb3dlZCA9IE1hdGgucG93KHh5eltfXSwgMylcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYgcG93ZWQgPiAwLjAwODg1NlxyXG5cdFx0XHRcdFx0XHR4eXpbX10gPSBwb3dlZFxyXG5cdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHR4eXpbX10gPSAoeHl6W19dIC0gMTYgLyAxMTYpIC8gNy43ODdcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0I3h5eltfXSA9IF9yb3VuZCh4eXpbX10gKiB3aGl0ZVtfXSlcclxuXHRcdFx0XHRcclxuXHRcdFx0IyBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRFxyXG5cdFx0XHRpZiBAeD8gYW5kIEB5PyBhbmQgQHo/XHJcblx0XHRcdFx0eHl6ID1cclxuXHRcdFx0XHRcdHg6IHJhdy54IC8gMTAwXHJcblx0XHRcdFx0XHR5OiByYXcueSAvIDEwMFxyXG5cdFx0XHRcdFx0ejogcmF3LnogLyAxMDBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRyZ2IgPVxyXG5cdFx0XHRcdFx0cjogeHl6LnggKiAzLjI0MDYgKyB4eXoueSAqIC0xLjUzNzIgKyB4eXoueiAqIC0wLjQ5ODZcclxuXHRcdFx0XHRcdGc6IHh5ei54ICogLTAuOTY4OSArIHh5ei55ICogMS44NzU4ICsgeHl6LnogKiAwLjA0MTVcclxuXHRcdFx0XHRcdGI6IHh5ei54ICogMC4wNTU3ICsgeHl6LnkgKiAtMC4yMDQwICsgeHl6LnogKiAxLjA1NzBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRmb3IgXyBpbiBcInJnYlwiXHJcblx0XHRcdFx0XHQjcmdiW19dID0gX3JvdW5kKHJnYltfXSlcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYgcmdiW19dIDwgMFxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gPSAwXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHJnYltfXSA+IDAuMDAzMTMwOFxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gPSAxLjA1NSAqIE1hdGgucG93KHJnYltfXSwgKDEgLyAyLjQpKSAtIDAuMDU1XHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdHJnYltfXSAqPSAxMi45MlxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdCNyZ2JbX10gPSBNYXRoLnJvdW5kKHJnYltfXSAqIDI1NSlcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIkNvbG9yIGNvbnN0cnVjdG9yIG11c3QgYmUgY2FsbGVkIHdpdGgge3IsZyxifSBvciB7aCxzLHZ9IG9yIHtoLHMsbH0gb3Ige2MsbSx5LGt9IG9yIHt4LHksen0gb3Ige2wsYSxifSxcclxuXHRcdFx0XHRcdCN7XHJcblx0XHRcdFx0XHRcdHRyeVxyXG5cdFx0XHRcdFx0XHRcdFwiZ290ICN7SlNPTi5zdHJpbmdpZnkob3B0aW9ucyl9XCJcclxuXHRcdFx0XHRcdFx0Y2F0Y2ggZVxyXG5cdFx0XHRcdFx0XHRcdFwiZ290IHNvbWV0aGluZyB0aGF0IGNvdWxkbid0IGJlIGRpc3BsYXllZCB3aXRoIEpTT04uc3RyaW5naWZ5IGZvciB0aGlzIGVycm9yIG1lc3NhZ2VcIlxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFwiXHJcblx0XHRcclxuXHRcclxuXHR0b1N0cmluZzogLT5cclxuXHRcdGlmIEByP1xyXG5cdFx0XHQjIFJlZCBHcmVlbiBCbHVlXHJcblx0XHRcdGlmIEBhPyAjIEFscGhhXHJcblx0XHRcdFx0XCJyZ2JhKCN7QHJ9LCAje0BnfSwgI3tAYn0sICN7QGF9KVwiXHJcblx0XHRcdGVsc2UgIyBPcGFxdWVcclxuXHRcdFx0XHRcInJnYigje0ByfSwgI3tAZ30sICN7QGJ9KVwiXHJcblx0XHRlbHNlIGlmIEBoP1xyXG5cdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIExpZ2h0bmVzc1xyXG5cdFx0XHQjIChBc3N1bWUgaDowLTM2MCwgczowLTEwMCwgbDowLTEwMClcclxuXHRcdFx0aWYgQGE/ICMgQWxwaGFcclxuXHRcdFx0XHRcImhzbGEoI3tAaH0sICN7QHN9JSwgI3tAbH0lLCAje0BhfSlcIlxyXG5cdFx0XHRlbHNlICMgT3BhcXVlXHJcblx0XHRcdFx0XCJoc2woI3tAaH0sICN7QHN9JSwgI3tAbH0lKVwiXHJcblx0XHJcblx0aXM6IChjb2xvciktPlxyXG5cdFx0IyBjb21wYXJlIGFzIHN0cmluZ3NcclxuXHRcdFwiI3tAfVwiIGlzIFwiI3tjb2xvcn1cIlxyXG4iLCJcclxuQ29sb3IgPSByZXF1aXJlIFwiLi9Db2xvclwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIFBhbGV0dGUgZXh0ZW5kcyBBcnJheVxyXG5cdFxyXG5cdGNvbnN0cnVjdG9yOiAoYXJncy4uLiktPlxyXG5cdFx0c3VwZXIoYXJncy4uLilcclxuXHRcclxuXHRhZGQ6IChvKS0+XHJcblx0XHRuZXdfY29sb3IgPSBuZXcgQ29sb3IobylcclxuXHRcdEBwdXNoIG5ld19jb2xvclxyXG5cdFxyXG5cdGZpbmFsaXplOiAtPlxyXG5cdFx0IyBUT0RPOiBnZXQgdGhpcyB3b3JraW5nIHByb3Blcmx5IGFuZCBlbmFibGVcclxuXHRcdCMgaWYgbm90IEBudW1iZXJPZkNvbHVtbnNcclxuXHRcdCMgXHRAZ3Vlc3NfZGltZW5zaW9ucygpXHJcblx0XHR1bmxlc3MgQHBhcmVudFBhbGV0dGVXaXRob3V0RHVwbGljYXRlc1xyXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXMgPSBuZXcgUGFsZXR0ZVxyXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXMucGFyZW50UGFsZXR0ZVdpdGhvdXREdXBsaWNhdGVzID0gQFxyXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXNbaV0gPSBAW2ldIGZvciBpIGluIFswLi4uQGxlbmd0aF1cclxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzLm51bWJlck9mQ29sdW1ucyA9IEBudW1iZXJPZkNvbHVtbnNcclxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzLmdlb21ldHJ5U3BlY2lmaWVkQnlGaWxlID0gQGdlb21ldHJ5U3BlY2lmaWVkQnlGaWxlXHJcblx0XHRcdEB3aXRoRHVwbGljYXRlcy5maW5hbGl6ZSgpXHJcblxyXG5cdFx0XHQjIGluLXBsYWNlIHVuaXF1aWZ5XHJcblx0XHRcdGkgPSAwXHJcblx0XHRcdHdoaWxlIGkgPCBAbGVuZ3RoXHJcblx0XHRcdFx0aV9jb2xvciA9IEBbaV1cclxuXHRcdFx0XHRqID0gaSArIDFcclxuXHRcdFx0XHR3aGlsZSBqIDwgQGxlbmd0aFxyXG5cdFx0XHRcdFx0al9jb2xvciA9IEBbal1cclxuXHRcdFx0XHRcdGlmIGlfY29sb3IuaXMgal9jb2xvclxyXG5cdFx0XHRcdFx0XHRALnNwbGljZShqLCAxKVxyXG5cdFx0XHRcdFx0XHRqIC09IDFcclxuXHRcdFx0XHRcdGogKz0gMVxyXG5cdFx0XHRcdGkgKz0gMVxyXG5cclxuXHQjIyNcclxuXHRndWVzc19kaW1lbnNpb25zOiAtPlxyXG5cdFx0IyBUT0RPOiBnZXQgdGhpcyB3b3JraW5nIHByb3Blcmx5IGFuZCBlbmFibGVcclxuXHJcblx0XHRsZW4gPSBAbGVuZ3RoXHJcblx0XHRjYW5kaWRhdGVfZGltZW5zaW9ucyA9IFtdXHJcblx0XHRmb3IgbnVtYmVyT2ZDb2x1bW5zIGluIFswLi5sZW5dXHJcblx0XHRcdG5fcm93cyA9IGxlbiAvIG51bWJlck9mQ29sdW1uc1xyXG5cdFx0XHRpZiBuX3Jvd3MgaXMgTWF0aC5yb3VuZCBuX3Jvd3NcclxuXHRcdFx0XHRjYW5kaWRhdGVfZGltZW5zaW9ucy5wdXNoIFtuX3Jvd3MsIG51bWJlck9mQ29sdW1uc11cclxuXHRcdFxyXG5cdFx0c3F1YXJlc3QgPSBbMCwgMzQ5NTA5M11cclxuXHRcdGZvciBjZCBpbiBjYW5kaWRhdGVfZGltZW5zaW9uc1xyXG5cdFx0XHRpZiBNYXRoLmFicyhjZFswXSAtIGNkWzFdKSA8IE1hdGguYWJzKHNxdWFyZXN0WzBdIC0gc3F1YXJlc3RbMV0pXHJcblx0XHRcdFx0c3F1YXJlc3QgPSBjZFxyXG5cdFx0XHJcblx0XHRAbnVtYmVyT2ZDb2x1bW5zID0gc3F1YXJlc3RbMV1cclxuXHQjIyNcclxuIiwiXHJcbiMgRGV0ZWN0IENTUyBjb2xvcnMgKGV4Y2VwdCBuYW1lZCBjb2xvcnMpXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxuIyBUT0RPOiBkZXRlY3QgbmFtZXMgdmlhIHN0cnVjdHVyZXMgbGlrZSBDU1MgdmFyaWFibGVzLCBKU09OIG9iamVjdCBrZXlzL3ZhbHVlcywgY29tbWVudHNcclxuIyBUT0RPOiB1c2UgYWxsIGNvbG9ycyByZWdhcmRsZXNzIG9mIGZvcm1hdCwgd2l0aGluIGEgZGV0ZWN0ZWQgc3RydWN0dXJlLCBvciBtYXliZSBhbHdheXNcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGVzID0gW1xyXG5cdFx0cGFsZXR0ZV9oZXhfbG9uZyA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfaGV4X3Nob3J0ID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9yZ2IgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX2hzbCA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfaHNsYSA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfcmdiYSA9IG5ldyBQYWxldHRlKClcclxuXHRdXHJcblx0XHJcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0XFwjICMgaGFzaHRhZyAjICMvXHJcblx0XHQoXHJcblx0XHRcdFswLTlBLUZdezN9ICMgdGhyZWUgaGV4LWRpZ2l0cyAoI0EwQylcclxuXHRcdFx0fFxyXG5cdFx0XHRbMC05QS1GXXs2fSAjIHNpeCBoZXgtZGlnaXRzICgjQUEwMENDKVxyXG5cdFx0XHR8XHJcblx0XHRcdFswLTlBLUZdezR9ICMgd2l0aCBhbHBoYSwgZm91ciBoZXgtZGlnaXRzICgjQTBDRilcclxuXHRcdFx0fFxyXG5cdFx0XHRbMC05QS1GXXs4fSAjIHdpdGggYWxwaGEsIGVpZ2h0IGhleC1kaWdpdHMgKCNBQTAwQ0NGRilcclxuXHRcdClcclxuXHRcdCg/IVswLTlBLUZdKSAjIChhbmQgbm8gbW9yZSEpXHJcblx0Ly8vZ2ltLCAobSwgJDEpLT5cclxuXHRcdGlmICQxLmxlbmd0aCA+IDRcclxuXHRcdFx0cGFsZXR0ZV9oZXhfbG9uZy5hZGRcclxuXHRcdFx0XHRyOiBoZXggJDFbMF0gKyAkMVsxXVxyXG5cdFx0XHRcdGc6IGhleCAkMVsyXSArICQxWzNdXHJcblx0XHRcdFx0YjogaGV4ICQxWzRdICsgJDFbNV1cclxuXHRcdFx0XHRhOiBpZiAkMS5sZW5ndGggaXMgOCB0aGVuIGhleCAkMVs2XSArICQxWzddIGVsc2UgMVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHRwYWxldHRlX2hleF9zaG9ydC5hZGRcclxuXHRcdFx0XHRyOiBoZXggJDFbMF0gKyAkMVswXVxyXG5cdFx0XHRcdGc6IGhleCAkMVsxXSArICQxWzFdXHJcblx0XHRcdFx0YjogaGV4ICQxWzJdICsgJDFbMl1cclxuXHRcdFx0XHRhOiBpZiAkMS5sZW5ndGggaXMgNCB0aGVuIGhleCAkMVszXSArICQxWzNdIGVsc2UgMVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdHJnYlxcKFxyXG5cdFx0XHRcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHJlZFxyXG5cdFx0XHQoJT8pXHJcblx0XHRcXHMqKD86LHxcXHMpXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBncmVlblxyXG5cdFx0XHQoJT8pXHJcblx0XHRcXHMqKD86LHxcXHMpXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBibHVlXHJcblx0XHRcdCglPylcclxuXHRcdFx0XFxzKlxyXG5cdFx0XFwpXHJcblx0Ly8vZ2ltLCAoX20sIHJfdmFsLCByX3VuaXQsIGdfdmFsLCBnX3VuaXQsIGJfdmFsLCBiX3VuaXQpLT5cclxuXHRcdHBhbGV0dGVfcmdiLmFkZFxyXG5cdFx0XHRyOiBOdW1iZXIocl92YWwpICogKGlmIHJfdW5pdCBpcyBcIiVcIiB0aGVuIDI1NS8xMDAgZWxzZSAxKVxyXG5cdFx0XHRnOiBOdW1iZXIoZ192YWwpICogKGlmIGdfdW5pdCBpcyBcIiVcIiB0aGVuIDI1NS8xMDAgZWxzZSAxKVxyXG5cdFx0XHRiOiBOdW1iZXIoYl92YWwpICogKGlmIGJfdW5pdCBpcyBcIiVcIiB0aGVuIDI1NS8xMDAgZWxzZSAxKVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdHJnYmE/XFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgcmVkXHJcblx0XHRcdCglPylcclxuXHRcdFxccyooPzosfFxccylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGdyZWVuXHJcblx0XHRcdCglPylcclxuXHRcdFxccyooPzosfFxccylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGJsdWVcclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8LylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGFscGhhXHJcblx0XHRcdCglPylcclxuXHRcdFx0XFxzKlxyXG5cdFx0XFwpXHJcblx0Ly8vZ2ltLCAoX20sIHJfdmFsLCByX3VuaXQsIGdfdmFsLCBnX3VuaXQsIGJfdmFsLCBiX3VuaXQsIGFfdmFsLCBhX3VuaXQpLT5cclxuXHRcdHBhbGV0dGVfcmdiYS5hZGRcclxuXHRcdFx0cjogTnVtYmVyKHJfdmFsKSAqIChpZiByX3VuaXQgaXMgXCIlXCIgdGhlbiAyNTUvMTAwIGVsc2UgMSlcclxuXHRcdFx0ZzogTnVtYmVyKGdfdmFsKSAqIChpZiBnX3VuaXQgaXMgXCIlXCIgdGhlbiAyNTUvMTAwIGVsc2UgMSlcclxuXHRcdFx0YjogTnVtYmVyKGJfdmFsKSAqIChpZiBiX3VuaXQgaXMgXCIlXCIgdGhlbiAyNTUvMTAwIGVsc2UgMSlcclxuXHRcdFx0YTogTnVtYmVyKGFfdmFsKSAqIChpZiBhX3VuaXQgaXMgXCIlXCIgdGhlbiAxLzEwMCBlbHNlIDEpXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0aHNsXFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgaHVlXHJcblx0XHRcdChkZWd8cmFkfHR1cm58KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgc2F0dXJhdGlvblxyXG5cdFx0XHQoJT8pXHJcblx0XHRcXHMqKD86LHxcXHMpXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyB2YWx1ZVxyXG5cdFx0XHQoJT8pXHJcblx0XHRcdFxccypcclxuXHRcdFxcKVxyXG5cdC8vL2dpbSwgKF9tLCBoX3ZhbCwgaF91bml0LCBzX3ZhbCwgc191bml0LCBsX3ZhbCwgbF91bml0KS0+XHJcblx0XHRwYWxldHRlX2hzbC5hZGRcclxuXHRcdFx0aDogTnVtYmVyKGhfdmFsKSAqIChpZiBoX3VuaXQgaXMgXCJyYWRcIiB0aGVuIDE4MC9NYXRoLlBJIGVsc2UgaWYgaF91bml0IGlzIFwidHVyblwiIHRoZW4gMzYwIGVsc2UgMSlcclxuXHRcdFx0czogTnVtYmVyKHNfdmFsKSAqIChpZiBzX3VuaXQgaXMgXCIlXCIgdGhlbiAxIGVsc2UgMTAwKVxyXG5cdFx0XHRsOiBOdW1iZXIobF92YWwpICogKGlmIGxfdW5pdCBpcyBcIiVcIiB0aGVuIDEgZWxzZSAxMDApXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0aHNsYT9cXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBodWVcclxuXHRcdFx0KGRlZ3xyYWR8dHVybnwpXHJcblx0XHRcXHMqKD86LHxcXHMpXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBzYXR1cmF0aW9uXHJcblx0XHRcdCglPylcclxuXHRcdFxccyooPzosfFxccylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHZhbHVlXHJcblx0XHRcdCglPylcclxuXHRcdFxccyooPzosfC8pXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBhbHBoYVxyXG5cdFx0XHQoJT8pXHJcblx0XHRcdFxccypcclxuXHRcdFxcKVxyXG5cdC8vL2dpbSwgKF9tLCBoX3ZhbCwgaF91bml0LCBzX3ZhbCwgc191bml0LCBsX3ZhbCwgbF91bml0LCBhX3ZhbCwgYV91bml0KS0+XHJcblx0XHRwYWxldHRlX2hzbGEuYWRkXHJcblx0XHRcdGg6IE51bWJlcihoX3ZhbCkgKiAoaWYgaF91bml0IGlzIFwicmFkXCIgdGhlbiAxODAvTWF0aC5QSSBlbHNlIGlmIGhfdW5pdCBpcyBcInR1cm5cIiB0aGVuIDM2MCBlbHNlIDEpXHJcblx0XHRcdHM6IE51bWJlcihzX3ZhbCkgKiAoaWYgc191bml0IGlzIFwiJVwiIHRoZW4gMSBlbHNlIDEwMClcclxuXHRcdFx0bDogTnVtYmVyKGxfdmFsKSAqIChpZiBsX3VuaXQgaXMgXCIlXCIgdGhlbiAxIGVsc2UgMTAwKVxyXG5cdFx0XHRhOiBOdW1iZXIoYV92YWwpICogKGlmIGFfdW5pdCBpcyBcIiVcIiB0aGVuIDEvMTAwIGVsc2UgMSlcclxuXHRcclxuXHRtb3N0X2NvbG9ycyA9IFtdXHJcblx0Zm9yIHBhbGV0dGUgaW4gcGFsZXR0ZXNcclxuXHRcdGlmIHBhbGV0dGUubGVuZ3RoID49IG1vc3RfY29sb3JzLmxlbmd0aFxyXG5cdFx0XHRtb3N0X2NvbG9ycyA9IHBhbGV0dGVcclxuXHRcclxuXHRuID0gbW9zdF9jb2xvcnMubGVuZ3RoXHJcblx0aWYgbiA8IDRcclxuXHRcdHRocm93IG5ldyBFcnJvcihbXHJcblx0XHRcdFwiTm8gY29sb3JzIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IG9uZSBjb2xvciBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBhIGNvdXBsZSBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgYSBmZXcgY29sb3JzIGZvdW5kXCJcclxuXHRcdF1bbl0gKyBcIiAoI3tufSlcIilcclxuXHRcclxuXHRtb3N0X2NvbG9yc1xyXG4iLCJcclxuIyBMb2FkIGEgQ29sb3JTY2hlbWVyIHBhbGV0dGVcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHR2ZXJzaW9uID0gYnIucmVhZFVJbnQxNigpICMgb3Igc29tZXRoaW5nXHJcblx0bGVuZ3RoID0gYnIucmVhZFVJbnQxNigpXHJcblx0aSA9IDBcclxuXHR3aGlsZSBpIDwgbGVuZ3RoXHJcblx0XHRici5zZWVrKDggKyBpICogMjYpXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0aSArPSAxXHJcblxyXG5cdHBhbGV0dGVcclxuXHJcbiIsIlxyXG4jIExvYWQgYSBHSU1QIHBhbGV0dGVcclxuXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5wYXJzZV9naW1wX29yX2tkZV9yZ2JfcGFsZXR0ZSA9IChkYXRhLCBmb3JtYXRfbmFtZSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBmb3JtYXRfbmFtZVxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiTm90IGEgI3tmb3JtYXRfbmFtZX1cIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0aSA9IDBcclxuXHQjIHN0YXJ0cyBhdCBpID0gMSBiZWNhdXNlIHRoZSBpbmNyZW1lbnQgaGFwcGVucyBhdCB0aGUgc3RhcnQgb2YgdGhlIGxvb3BcclxuXHR3aGlsZSAoaSArPSAxKSA8IGxpbmVzLmxlbmd0aFxyXG5cdFx0bGluZSA9IGxpbmVzW2ldXHJcblx0XHRcclxuXHRcdGlmIGxpbmVbMF0gaXMgXCIjXCIgb3IgbGluZSBpcyBcIlwiIHRoZW4gY29udGludWVcclxuXHRcdCMgVE9ETzogaGFuZGxlIG5vbi1zdGFydC1vZi1saW5lIGNvbW1lbnRzPyB3aGVyZSdzIHRoZSBzcGVjP1xyXG5cdFx0XHJcblx0XHRtID0gbGluZS5tYXRjaCgvTmFtZTpcXHMqKC4qKS8pXHJcblx0XHRpZiBtXHJcblx0XHRcdHBhbGV0dGUubmFtZSA9IG1bMV1cclxuXHRcdFx0Y29udGludWVcclxuXHRcdG0gPSBsaW5lLm1hdGNoKC9Db2x1bW5zOlxccyooLiopLylcclxuXHRcdGlmIG1cclxuXHRcdFx0cGFsZXR0ZS5udW1iZXJPZkNvbHVtbnMgPSBOdW1iZXIobVsxXSlcclxuXHRcdFx0IyBUT0RPOiBoYW5kbGUgMCBhcyBub3Qgc3BlY2lmaWVkPyB3aGVyZSdzIHRoZSBzcGVjIGF0LCB5bz9cclxuXHRcdFx0cGFsZXR0ZS5nZW9tZXRyeVNwZWNpZmllZEJ5RmlsZSA9IHllc1xyXG5cdFx0XHRjb250aW51ZVxyXG5cdFx0XHJcblx0XHQjIFRPRE86IHJlcGxhY2UgXFxzIHdpdGggW1xcIFxcdF0gKHNwYWNlcyBvciB0YWJzKVxyXG5cdFx0IyBpdCBjYW4ndCBtYXRjaCBcXG4gYmVjYXVzZSBpdCdzIGFscmVhZHkgc3BsaXQgb24gdGhhdCwgYnV0IHN0aWxsXHJcblx0XHQjIFRPRE86IGhhbmRsZSBsaW5lIHdpdGggbm8gbmFtZSBidXQgc3BhY2Ugb24gdGhlIGVuZFxyXG5cdFx0cl9nX2JfbmFtZSA9IGxpbmUubWF0Y2goLy8vXHJcblx0XHRcdF4gIyBcImF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpbmUsXCJcclxuXHRcdFx0XFxzKiAjIFwiZ2l2ZSBvciB0YWtlIHNvbWUgc3BhY2VzLFwiXHJcblx0XHRcdCMgbWF0Y2ggMyBncm91cHMgb2YgbnVtYmVycyBzZXBhcmF0ZWQgYnkgc3BhY2VzXHJcblx0XHRcdChbMC05XSspICMgcmVkXHJcblx0XHRcdFxccytcclxuXHRcdFx0KFswLTldKykgIyBncmVlblxyXG5cdFx0XHRcXHMrXHJcblx0XHRcdChbMC05XSspICMgYmx1ZVxyXG5cdFx0XHQoPzpcclxuXHRcdFx0XHRcXHMrXHJcblx0XHRcdFx0KC4qKSAjIG9wdGlvbmFsbHkgYSBuYW1lXHJcblx0XHRcdCk/XHJcblx0XHRcdCQgIyBcImFuZCB0aGF0IHNob3VsZCBiZSB0aGUgZW5kIG9mIHRoZSBsaW5lXCJcclxuXHRcdC8vLylcclxuXHRcdGlmIG5vdCByX2dfYl9uYW1lXHJcblx0XHRcdHRocm93IG5ldyBFcnJvciBcIkxpbmUgI3tpfSBkb2Vzbid0IG1hdGNoIHBhdHRlcm4gI3tyX2dfYl9uYW1lfVwiICMgVE9ETzogYmV0dGVyIG1lc3NhZ2U/XHJcblx0XHRcclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IHJfZ19iX25hbWVbMV1cclxuXHRcdFx0Zzogcl9nX2JfbmFtZVsyXVxyXG5cdFx0XHRiOiByX2dfYl9uYW1lWzNdXHJcblx0XHRcdG5hbWU6IHJfZ19iX25hbWVbNF1cclxuXHRcdFxyXG5cdHBhbGV0dGVcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdHBhcnNlX2dpbXBfb3Jfa2RlX3JnYl9wYWxldHRlKGRhdGEsIFwiR0lNUCBQYWxldHRlXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cy5wYXJzZV9naW1wX29yX2tkZV9yZ2JfcGFsZXR0ZSA9IHBhcnNlX2dpbXBfb3Jfa2RlX3JnYl9wYWxldHRlXHJcbiIsIiMgTG9hZCBhbiBBbGxhaXJlIEhvbWVzaXRlIC8gTWFjcm9tZWRpYSBDb2xkRnVzaW9uIHBhbGV0dGUgKC5ocGwpXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IFwiUGFsZXR0ZVwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYSBIb21lc2l0ZSBwYWxldHRlXCJcclxuXHRpZiBub3QgbGluZXNbMV0ubWF0Y2ggL1ZlcnNpb24gWzM0XVxcLjAvXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbnN1cHBvcnRlZCBIb21lc2l0ZSBwYWxldHRlIHZlcnNpb25cIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHJcblx0Zm9yIGxpbmUsIGkgaW4gbGluZXNcclxuXHRcdGlmIGxpbmUubWF0Y2ggLy4rIC4rIC4rL1xyXG5cdFx0XHRyZ2IgPSBsaW5lLnNwbGl0KFwiIFwiKVxyXG5cdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdHI6IHJnYlswXVxyXG5cdFx0XHRcdGc6IHJnYlsxXVxyXG5cdFx0XHRcdGI6IHJnYlsyXVxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbntwYXJzZV9naW1wX29yX2tkZV9yZ2JfcGFsZXR0ZX0gPSByZXF1aXJlIFwiLi9HSU1QXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdHBhcnNlX2dpbXBfb3Jfa2RlX3JnYl9wYWxldHRlKGRhdGEsIFwiS0RFIFJHQiBQYWxldHRlXCIpXHJcbiIsIlxyXG4jIExvYWQgYSBQYWludC5ORVQgcGFsZXR0ZSBmaWxlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHJcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXHJcblx0XHJcblx0Zm9yIGxpbmUgaW4gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0XHRtID0gbGluZS5tYXRjaCgvXihbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkkL2kpXHJcblx0XHRpZiBtIHRoZW4gcGFsZXR0ZS5hZGRcclxuXHRcdFx0YTogaGV4IG1bMV1cclxuXHRcdFx0cjogaGV4IG1bMl1cclxuXHRcdFx0ZzogaGV4IG1bM11cclxuXHRcdFx0YjogaGV4IG1bNF1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBKQVNDIFBBTCBmaWxlIChQYWludCBTaG9wIFBybyBwYWxldHRlIGZpbGUpXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBcIkpBU0MtUEFMXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhIEpBU0MtUEFMXCJcclxuXHRpZiBsaW5lc1sxXSBpc250IFwiMDEwMFwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIEpBU0MtUEFMIHZlcnNpb25cIlxyXG5cdGlmIGxpbmVzWzJdIGlzbnQgXCIyNTZcIlxyXG5cdFx0XCJ0aGF0J3Mgb2tcIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0I25fY29sb3JzID0gTnVtYmVyKGxpbmVzWzJdKVxyXG5cdFxyXG5cdGZvciBsaW5lLCBpIGluIGxpbmVzXHJcblx0XHRpZiBsaW5lIGlzbnQgXCJcIiBhbmQgaSA+IDJcclxuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcclxuXHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRyOiByZ2JbMF1cclxuXHRcdFx0XHRnOiByZ2JbMV1cclxuXHRcdFx0XHRiOiByZ2JbMl1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBSZXNvdXJjZSBJbnRlcmNoYW5nZSBGaWxlIEZvcm1hdCBQQUwgZmlsZVxyXG5cclxuIyBwb3J0ZWQgZnJvbSBDIyBjb2RlIGF0IGh0dHBzOi8vd29ybXMyZC5pbmZvL1BhbGV0dGVfZmlsZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHQjIFJJRkYgaGVhZGVyXHJcblx0cmlmZiA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcIlJJRkZcIlxyXG5cdGRhdGFTaXplID0gYnIucmVhZFVJbnQzMigpXHJcblx0dHlwZSA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcIlBBTCBcIlxyXG5cdFxyXG5cdGlmIHJpZmYgaXNudCBcIlJJRkZcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiUklGRiBoZWFkZXIgbm90IGZvdW5kOyBub3QgYSBSSUZGIFBBTCBmaWxlXCJcclxuXHRcclxuXHRpZiB0eXBlIGlzbnQgXCJQQUwgXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlwiXCJcclxuXHRcdFx0UklGRiBoZWFkZXIgc2F5cyB0aGlzIGlzbid0IGEgUEFMIGZpbGUsXHJcblx0XHRcdG1vcmUgb2YgYSBzb3J0IG9mICN7KCh0eXBlK1wiXCIpLnRyaW0oKSl9IGZpbGVcclxuXHRcdFwiXCJcIlxyXG5cdFxyXG5cdCMgRGF0YSBjaHVua1xyXG5cdGNodW5rVHlwZSA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcImRhdGFcIlxyXG5cdGNodW5rU2l6ZSA9IGJyLnJlYWRVSW50MzIoKVxyXG5cdHBhbFZlcnNpb24gPSBici5yZWFkVUludDE2KCkgIyAweDAzMDBcclxuXHRwYWxOdW1FbnRyaWVzID0gYnIucmVhZFVJbnQxNigpXHJcblx0XHJcblx0XHJcblx0aWYgY2h1bmtUeXBlIGlzbnQgXCJkYXRhXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIkRhdGEgY2h1bmsgbm90IGZvdW5kICguLi4nI3tjaHVua1R5cGV9Jz8pXCJcclxuXHRcclxuXHRpZiBwYWxWZXJzaW9uIGlzbnQgMHgwMzAwXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbnN1cHBvcnRlZCBQQUwgZmlsZSBmb3JtYXQgdmVyc2lvbjogMHgje3BhbFZlcnNpb24udG9TdHJpbmcoMTYpfVwiXHJcblx0XHJcblx0IyBDb2xvcnNcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGkgPSAwXHJcblx0d2hpbGUgKGkgKz0gMSkgPCBwYWxOdW1FbnRyaWVzIC0gMVxyXG5cdFx0XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRfOiBici5yZWFkQnl0ZSgpICMgXCJmbGFnc1wiLCBhbHdheXMgMHgwMFxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiIyBMb2FkIHNLMSBwYWxldHRlc1xyXG4jIFRoZXNlIGZpbGVzIGFyZSBhY3R1YWxseSBweXRob25pYywgYnV0IGxldCdzIGp1c3QgdHJ5IHRvIHBhcnNlIHRoZW0gaW4gYSBiYXNpYywgbm9uLWdlbmVyYWwgd2F5XHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlXHJcblxyXG5cdGZucyA9XHJcblx0XHRzZXRfbmFtZTogKG5hbWUpLT4gcGFsZXR0ZS5uYW1lID0gbmFtZVxyXG5cdFx0YWRkX2NvbW1lbnRzOiAobGluZSktPlxyXG5cdFx0XHRwYWxldHRlLmRlc2NyaXB0aW9uID89IFwiXCJcclxuXHRcdFx0cGFsZXR0ZS5kZXNjcmlwdGlvbiArPSBsaW5lICsgXCJcXG5cIlxyXG5cdFx0c2V0X2NvbHVtbnM6IChjb2x1bW5zX3N0ciktPlxyXG5cdFx0XHRwYWxldHRlLm51bWJlck9mQ29sdW1ucyA9IHBhcnNlSW50KGNvbHVtbnNfc3RyKVxyXG5cdFx0Y29sb3I6IChjb2xvcl9kZWZfc3RyKS0+XHJcblx0XHRcdGNvbG9yX2RlZiA9IEpTT04ucGFyc2UoY29sb3JfZGVmX3N0ci5yZXBsYWNlKC9cXGJ1KFsnXCJdKS9nLCBcIiQxXCIpLnJlcGxhY2UoLycvZywgJ1wiJykpXHJcblx0XHRcdFtjb2xvcl90eXBlLCBjb21wb25lbnRzLCBhbHBoYSwgbmFtZV0gPSBjb2xvcl9kZWZcclxuXHRcdFx0c3dpdGNoIGNvbG9yX3R5cGVcclxuXHRcdFx0XHR3aGVuIFwiUkdCXCJcclxuXHRcdFx0XHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdFx0XHRcdHI6IGNvbXBvbmVudHNbMF0gKiAyNTVcclxuXHRcdFx0XHRcdFx0ZzogY29tcG9uZW50c1sxXSAqIDI1NVxyXG5cdFx0XHRcdFx0XHRiOiBjb21wb25lbnRzWzJdICogMjU1XHJcblx0XHRcdFx0XHRcdGE6IGFscGhhXHJcblx0XHRcdFx0d2hlbiBcIkdyYXlzY2FsZVwiXHJcblx0XHRcdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdFx0XHRyOiBjb21wb25lbnRzWzBdICogMjU1XHJcblx0XHRcdFx0XHRcdGc6IGNvbXBvbmVudHNbMF0gKiAyNTVcclxuXHRcdFx0XHRcdFx0YjogY29tcG9uZW50c1swXSAqIDI1NVxyXG5cdFx0XHRcdFx0XHRhOiBhbHBoYVxyXG5cdFx0XHRcdHdoZW4gXCJDTVlLXCJcclxuXHRcdFx0XHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdFx0XHRcdGM6IGNvbXBvbmVudHNbMF0gKiAxMDBcclxuXHRcdFx0XHRcdFx0bTogY29tcG9uZW50c1sxXSAqIDEwMFxyXG5cdFx0XHRcdFx0XHR5OiBjb21wb25lbnRzWzJdICogMTAwXHJcblx0XHRcdFx0XHRcdGs6IGNvbXBvbmVudHNbM10gKiAxMDBcclxuXHRcdFx0XHRcdFx0YTogYWxwaGFcclxuXHRcdFx0XHR3aGVuIFwiSFNMXCJcclxuXHRcdFx0XHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdFx0XHRcdGg6IGNvbXBvbmVudHNbMF0gKiAzNjBcclxuXHRcdFx0XHRcdFx0czogY29tcG9uZW50c1sxXSAqIDEwMFxyXG5cdFx0XHRcdFx0XHRsOiBjb21wb25lbnRzWzJdICogMTAwXHJcblx0XHRcdFx0XHRcdGE6IGFscGhhXHJcblx0XHJcblx0Zm9yIGxpbmUgaW4gbGluZXNcclxuXHRcdG1hdGNoID0gbGluZS5tYXRjaCgvKFtcXHdfXSspXFwoKC4qKVxcKS8pXHJcblx0XHRpZiBtYXRjaFxyXG5cdFx0XHRbXywgZm5fbmFtZSwgYXJnc19zdHJdID0gbWF0Y2hcclxuXHRcdFx0Zm5zW2ZuX25hbWVdPyhhcmdzX3N0cilcclxuXHJcblx0biA9IHBhbGV0dGUubGVuZ3RoXHJcblx0aWYgbiA8IDJcclxuXHRcdHRocm93IG5ldyBFcnJvcihbXHJcblx0XHRcdFwiTm8gY29sb3JzIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IG9uZSBjb2xvciBmb3VuZFwiXHJcblx0XHRdW25dICsgXCIgKCN7bn0pXCIpXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBMb2FkIGEgU2tlbmNpbCBwYWxldHRlICguc3BsKSAoXCJTa2V0Y2ggUkdCUGFsZXR0ZVwiKVxyXG4jIChub3QgcmVsYXRlZCB0byAuc2tldGNocGFsZXR0ZSBTa2V0Y2ggQXBwIHBhbGV0dGUgZm9ybWF0KVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRpID0gMVxyXG5cdHdoaWxlIChpICs9IDEpIDwgbGluZXMubGVuZ3RoXHJcblx0XHRsaW5lID0gbGluZXNbaV1cclxuXHRcdFxyXG5cdFx0aWYgbGluZVswXSBpcyBcIiNcIiBvciBsaW5lIGlzIFwiXCIgdGhlbiBjb250aW51ZVxyXG5cdFx0IyBUT0RPOiBoYW5kbGUgbm9uLXN0YXJ0LW9mLWxpbmUgY29tbWVudHM/IHdoZXJlJ3MgdGhlIHNwZWM/XHJcblx0XHRcclxuXHRcdCMgVE9ETzogcmVwbGFjZSBcXHMgd2l0aCBbXFwgXFx0XSAoc3BhY2VzIG9yIHRhYnMpXHJcblx0XHQjIGl0IGNhbid0IG1hdGNoIFxcbiBiZWNhdXNlIGl0J3MgYWxyZWFkeSBzcGxpdCBvbiB0aGF0LCBidXQgc3RpbGxcclxuXHRcdCMgVE9ETzogaGFuZGxlIGxpbmUgd2l0aCBubyBuYW1lIGJ1dCBzcGFjZSBvbiB0aGUgZW5kXHJcblx0XHRyX2dfYl9uYW1lID0gbGluZS5tYXRjaCgvLy9cclxuXHRcdFx0XiAjIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpbmUsXHJcblx0XHRcdFxccyogIyBwZXJoYXBzIHdpdGggc29tZSBsZWFkaW5nIHNwYWNlc1xyXG5cdFx0XHQjIG1hdGNoIDMgZ3JvdXBzIG9mIG51bWJlcnMgc2VwYXJhdGVkIGJ5IHNwYWNlc1xyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyByZWRcclxuXHRcdFx0XFxzK1xyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBncmVlblxyXG5cdFx0XHRcXHMrXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGJsdWVcclxuXHRcdFx0KD86XHJcblx0XHRcdFx0XFxzK1xyXG5cdFx0XHRcdCguKikgIyBvcHRpb25hbGx5IGEgbmFtZVxyXG5cdFx0XHQpP1xyXG5cdFx0XHQkICMgXCJhbmQgdGhhdCBzaG91bGQgYmUgdGhlIGVuZCBvZiB0aGUgbGluZVwiXHJcblx0XHQvLy8pXHJcblx0XHRpZiBub3Qgcl9nX2JfbmFtZVxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJMaW5lICN7aX0gZG9lc24ndCBtYXRjaCBwYXR0ZXJuICN7cl9nX2JfbmFtZX1cIiAjIFRPRE86IGJldHRlciBtZXNzYWdlP1xyXG5cdFx0XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiByX2dfYl9uYW1lWzFdICogMjU1XHJcblx0XHRcdGc6IHJfZ19iX25hbWVbMl0gKiAyNTVcclxuXHRcdFx0Yjogcl9nX2JfbmFtZVszXSAqIDI1NVxyXG5cdFx0XHRuYW1lOiByX2dfYl9uYW1lWzRdXHJcblx0XHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIFBBTCAoU3RhckNyYWZ0IHJhdyBwYWxldHRlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdGlmIGJyLmdldFNpemUoKSBpc250IDc2OFxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiV3JvbmcgZmlsZSBzaXplLCBtdXN0IGJlICN7NzY4fSBieXRlcyBsb25nIChub3QgI3tici5nZXRTaXplKCl9KVwiXHJcblx0XHJcblx0Zm9yIGkgaW4gWzAuLi4yNTVdXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHQjOiBubyBwYWRkaW5nXHJcblx0XHJcblx0Iz8gcGFsZXR0ZS5udW1iZXJPZkNvbHVtbnMgPSAxNlxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgV1BFIChTdGFyQ3JhZnQgcGFkZGVkIHJhdyBwYWxldHRlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdGlmIGJyLmdldFNpemUoKSBpc250IDEwMjRcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIldyb25nIGZpbGUgc2l6ZSwgbXVzdCBiZSAjezEwMjR9IGJ5dGVzIGxvbmcgKG5vdCAje2JyLmdldFNpemUoKX0pXCJcclxuXHRcclxuXHRmb3IgaSBpbiBbMC4uLjI1NV1cclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdF86IGJyLnJlYWRCeXRlKCkgIyBwYWRkaW5nXHJcblx0XHJcblx0cGFsZXR0ZS5udW1iZXJPZkNvbHVtbnMgPSAxNlxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIFNrZXRjaCBBcHAgSlNPTiBwYWxldHRlICguc2tldGNocGFsZXR0ZSlcclxuIyAobm90IHJlbGF0ZWQgdG8gLnNwbCBTa2V0Y2ggUkdCIHBhbGV0dGUgZm9ybWF0KVxyXG5cclxuIyBiYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vYW5kcmV3ZmlvcmlsbG8vc2tldGNoLXBhbGV0dGVzL2Jsb2IvNWI2YmZhNmViMjVjYjMyNDRhOWU2YTIyNmRmMjU5ZThmYjMxZmMyYy9Ta2V0Y2glMjBQYWxldHRlcy5za2V0Y2hwbHVnaW4vQ29udGVudHMvU2tldGNoL3NrZXRjaFBhbGV0dGVzLmpzXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxudmVyc2lvbiA9IDEuNFxyXG5cclxuIyBUT0RPOiBEUlkgd2l0aCBDU1MuY29mZmVlXHJcbnBhcnNlX2Nzc19oZXhfY29sb3IgPSAoaGV4X2NvbG9yKS0+XHJcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXHJcblx0XHJcblx0bWF0Y2ggPSBoZXhfY29sb3IubWF0Y2goLy8vXHJcblx0XHRcXCMgIyBoYXNodGFnICMgIy9cclxuXHRcdChcclxuXHRcdFx0WzAtOUEtRl17M30gIyB0aHJlZSBoZXgtZGlnaXRzICgjQTBDKVxyXG5cdFx0XHR8XHJcblx0XHRcdFswLTlBLUZdezZ9ICMgc2l4IGhleC1kaWdpdHMgKCNBQTAwQ0MpXHJcblx0XHRcdHxcclxuXHRcdFx0WzAtOUEtRl17NH0gIyB3aXRoIGFscGhhLCBmb3VyIGhleC1kaWdpdHMgKCNBMENGKVxyXG5cdFx0XHR8XHJcblx0XHRcdFswLTlBLUZdezh9ICMgd2l0aCBhbHBoYSwgZWlnaHQgaGV4LWRpZ2l0cyAoI0FBMDBDQ0ZGKVxyXG5cdFx0KVxyXG5cdFx0KD8hWzAtOUEtRl0pICMgKGFuZCBubyBtb3JlISlcclxuXHQvLy9naW0pXHJcblxyXG5cdFskMCwgJDFdID0gbWF0Y2hcclxuXHJcblx0aWYgJDEubGVuZ3RoID4gNFxyXG5cdFx0cjogaGV4ICQxWzBdICsgJDFbMV1cclxuXHRcdGc6IGhleCAkMVsyXSArICQxWzNdXHJcblx0XHRiOiBoZXggJDFbNF0gKyAkMVs1XVxyXG5cdFx0YTogaWYgJDEubGVuZ3RoIGlzIDggdGhlbiBoZXggJDFbNl0gKyAkMVs3XSBlbHNlIDFcclxuXHRlbHNlXHJcblx0XHRyOiBoZXggJDFbMF0gKyAkMVswXVxyXG5cdFx0ZzogaGV4ICQxWzFdICsgJDFbMV1cclxuXHRcdGI6IGhleCAkMVsyXSArICQxWzJdXHJcblx0XHRhOiBpZiAkMS5sZW5ndGggaXMgNCB0aGVuIGhleCAkMVszXSArICQxWzNdIGVsc2UgMVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0aWYgbm90IGRhdGEubWF0Y2goL15cXHMqey8pXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJub3Qgc2tldGNocGFsZXR0ZSBKU09OXCJcclxuXHRwYWxldHRlQ29udGVudHMgPSBKU09OLnBhcnNlKGRhdGEpXHJcblxyXG5cdGNvbXBhdGlibGVWZXJzaW9uID0gcGFsZXR0ZUNvbnRlbnRzLmNvbXBhdGlibGVWZXJzaW9uXHJcblxyXG5cdCMgQ2hlY2sgZm9yIHByZXNldHMgaW4gZmlsZSwgZWxzZSBzZXQgdG8gZW1wdHkgYXJyYXlcclxuXHRjb2xvckRlZmluaXRpb25zID0gcGFsZXR0ZUNvbnRlbnRzLmNvbG9ycyA/IFtdXHJcblx0Z3JhZGllbnREZWZpbml0aW9ucyA9IHBhbGV0dGVDb250ZW50cy5ncmFkaWVudHMgPyBbXVxyXG5cdGltYWdlRGVmaW5pdGlvbnMgPSBwYWxldHRlQ29udGVudHMuaW1hZ2VzID8gW11cclxuXHRjb2xvckFzc2V0cyA9IFtdXHJcblx0Z3JhZGllbnRBc3NldHMgPSBbXVxyXG5cdGltYWdlcyA9IFtdXHJcblxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZVxyXG5cclxuXHQjIENoZWNrIGlmIHBsdWdpbiBpcyBvdXQgb2YgZGF0ZSBhbmQgaW5jb21wYXRpYmxlIHdpdGggYSBuZXdlciBwYWxldHRlIHZlcnNpb25cclxuXHRpZiBjb21wYXRpYmxlVmVyc2lvbiBhbmQgY29tcGF0aWJsZVZlcnNpb24gPiB2ZXJzaW9uXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBoYW5kbGUgY29tcGF0aWJsZVZlcnNpb24gb2YgI3tjb21wYXRpYmxlVmVyc2lvbn0uXCIpXHJcblx0XHRyZXR1cm5cclxuXHJcblx0IyBDaGVjayBmb3Igb2xkZXIgaGV4IGNvZGUgcGFsZXR0ZSB2ZXJzaW9uXHJcblx0aWYgbm90IGNvbXBhdGlibGVWZXJzaW9uIG9yIGNvbXBhdGlibGVWZXJzaW9uIDwgMS40XHJcblx0XHQjIENvbnZlcnQgaGV4IGNvbG9yc1xyXG5cdFx0Zm9yIGhleF9jb2xvciBpbiBjb2xvckRlZmluaXRpb25zXHJcblx0XHRcdHBhbGV0dGUuYWRkKHBhcnNlX2Nzc19oZXhfY29sb3IoaGV4X2NvbG9yKSlcclxuXHRlbHNlXHJcblx0XHQjIENvbG9yIEZpbGxzOiBjb252ZXJ0IHJnYmEgY29sb3JzXHJcblx0XHRpZiBjb2xvckRlZmluaXRpb25zLmxlbmd0aCA+IDBcclxuXHRcdFx0Zm9yIGNvbG9yX2RlZmluaXRpb24gaW4gY29sb3JEZWZpbml0aW9uc1xyXG5cdFx0XHRcdHBhbGV0dGUuYWRkKFxyXG5cdFx0XHRcdFx0cjogY29sb3JfZGVmaW5pdGlvbi5yZWQgKiAyNTVcclxuXHRcdFx0XHRcdGc6IGNvbG9yX2RlZmluaXRpb24uZ3JlZW4gKiAyNTVcclxuXHRcdFx0XHRcdGI6IGNvbG9yX2RlZmluaXRpb24uYmx1ZSAqIDI1NVxyXG5cdFx0XHRcdFx0YTogY29sb3JfZGVmaW5pdGlvbi5hbHBoYSAqIDI1NVxyXG5cdFx0XHRcdFx0bmFtZTogY29sb3JfZGVmaW5pdGlvbi5uYW1lXHJcblx0XHRcdFx0KVxyXG5cclxuXHRcdCMgIyBQYXR0ZXJuIEZpbGxzOiBjb252ZXJ0IGJhc2U2NCBzdHJpbmdzIHRvIE1TSW1hZ2VEYXRhIG9iamVjdHNcclxuXHRcdCMgaWYgaW1hZ2VEZWZpbml0aW9ucy5sZW5ndGggPiAwXHJcblx0XHQjIFx0Zm9yIGkgaW4gWzAuLmltYWdlRGVmaW5pdGlvbnMubGVuZ3RoXVxyXG5cdFx0IyBcdFx0bnNkYXRhID0gTlNEYXRhLmFsbG9jKCkuaW5pdFdpdGhCYXNlNjRFbmNvZGVkU3RyaW5nX29wdGlvbnMoaW1hZ2VEZWZpbml0aW9uc1tpXS5kYXRhLCAwKVxyXG5cdFx0IyBcdFx0bnNpbWFnZSA9IE5TSW1hZ2UuYWxsb2MoKS5pbml0V2l0aERhdGEobnNkYXRhKVxyXG5cdFx0IyBcdFx0IyBtc2ltYWdlID0gTVNJbWFnZURhdGEuYWxsb2MoKS5pbml0V2l0aEltYWdlQ29udmVydGluZ0NvbG9yU3BhY2UobnNpbWFnZSlcclxuXHRcdCMgXHRcdG1zaW1hZ2UgPSBNU0ltYWdlRGF0YS5hbGxvYygpLmluaXRXaXRoSW1hZ2UobnNpbWFnZSlcclxuXHRcdCMgXHRcdGltYWdlcy5wdXNoKG1zaW1hZ2UpXHJcblxyXG5cdFx0IyAjIEdyYWRpZW50IEZpbGxzOiBidWlsZCBNU0dyYWRpZW50U3RvcCBhbmQgTVNHcmFkaWVudCBvYmplY3RzXHJcblx0XHQjIGlmIGdyYWRpZW50RGVmaW5pdGlvbnMubGVuZ3RoID4gMFxyXG5cdFx0IyBcdGZvciBpIGluIFswLi5ncmFkaWVudERlZmluaXRpb25zLmxlbmd0aF1cclxuXHRcdCMgXHRcdCMgQ3JlYXRlIGdyYWRpZW50IHN0b3BzXHJcblx0XHQjIFx0XHRncmFkaWVudCA9IGdyYWRpZW50RGVmaW5pdGlvbnNbaV1cclxuXHRcdCMgXHRcdHN0b3BzID0gW11cclxuXHRcdCMgXHRcdGZvciBqIGluIFswLi5ncmFkaWVudC5zdG9wc11cclxuXHRcdCMgXHRcdFx0Y29sb3IgPSBNU0NvbG9yLmNvbG9yV2l0aFJlZF9ncmVlbl9ibHVlX2FscGhhKFxyXG5cdFx0IyBcdFx0XHRcdGdyYWRpZW50LnN0b3BzW2pdLmNvbG9yLnJlZCxcclxuXHRcdCMgXHRcdFx0XHRncmFkaWVudC5zdG9wc1tqXS5jb2xvci5ncmVlbixcclxuXHRcdCMgXHRcdFx0XHRncmFkaWVudC5zdG9wc1tqXS5jb2xvci5ibHVlLFxyXG5cdFx0IyBcdFx0XHRcdGdyYWRpZW50LnN0b3BzW2pdLmNvbG9yLmFscGhhXHJcblx0XHQjIFx0XHRcdClcclxuXHRcdCMgXHRcdFx0c3RvcHMucHVzaChNU0dyYWRpZW50U3RvcC5zdG9wV2l0aFBvc2l0aW9uX2NvbG9yXyhncmFkaWVudC5zdG9wc1tqXS5wb3NpdGlvbiwgY29sb3IpKVxyXG5cclxuXHRcdCMgXHRcdCMgQ3JlYXRlIGdyYWRpZW50IG9iamVjdCBhbmQgc2V0IGJhc2ljIHByb3BlcnRpZXNcclxuXHRcdCMgXHRcdG1zZ3JhZGllbnQgPSBNU0dyYWRpZW50Lm5ldygpXHJcblx0XHQjIFx0XHRtc2dyYWRpZW50LnNldEdyYWRpZW50VHlwZShncmFkaWVudC5ncmFkaWVudFR5cGUpXHJcblx0XHQjIFx0XHQjIG1zZ3JhZGllbnQuc2hvdWxkU21vb3RoZW5PcGFjaXR5ID0gZ3JhZGllbnQuc2hvdWxkU21vb3RoZW5PcGFjaXR5XHJcblx0XHQjIFx0XHRtc2dyYWRpZW50LmVsaXBzZUxlbmd0aCA9IGdyYWRpZW50LmVsaXBzZUxlbmd0aFxyXG5cdFx0IyBcdFx0bXNncmFkaWVudC5zZXRTdG9wcyhzdG9wcylcclxuXHJcblx0XHQjIFx0XHQjIFBhcnNlIEZyb20gYW5kIFRvIHZhbHVlcyBpbnRvIGFycmF5cyBlLmcuOiBmcm9tOiBcInswLjEsLTAuNDN9XCIgPT4gZnJvbVZhbHVlID0gWzAuMSwgLTAuNDNdXHJcblx0XHQjIFx0XHRmcm9tVmFsdWUgPSBncmFkaWVudC5mcm9tLnNsaWNlKDEsLTEpLnNwbGl0KFwiLFwiKVxyXG5cdFx0IyBcdFx0dG9WYWx1ZSA9IGdyYWRpZW50LnRvLnNsaWNlKDEsLTEpLnNwbGl0KFwiLFwiKVxyXG5cclxuXHRcdCMgXHRcdCMgU2V0IENHUG9pbnQgb2JqZWN0cyBhcyBGcm9tIGFuZCBUbyB2YWx1ZXNcclxuXHRcdCMgXHRcdG1zZ3JhZGllbnQuc2V0RnJvbSh7IHg6IGZyb21WYWx1ZVswXSwgeTogZnJvbVZhbHVlWzFdIH0pXHJcblx0XHQjIFx0XHRtc2dyYWRpZW50LnNldFRvKHsgeDogdG9WYWx1ZVswXSwgeTogdG9WYWx1ZVsxXSB9KVxyXG5cclxuXHRcdCMgXHRcdGdyYWRpZW50TmFtZSA9IGdyYWRpZW50RGVmaW5pdGlvbnNbaV0ubmFtZSA/IGdyYWRpZW50RGVmaW5pdGlvbnNbaV0ubmFtZSA6IG51bGxcclxuXHRcdCMgXHRcdGdyYWRpZW50QXNzZXRzLnB1c2goTVNHcmFkaWVudEFzc2V0LmFsbG9jKCkuaW5pdFdpdGhBc3NldF9uYW1lKG1zZ3JhZGllbnQsIGdyYWRpZW50TmFtZSkpXHJcblxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCB0YWJ1bGFyIFJHQiB2YWx1ZXNcclxuXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdHBhbGV0dGVzID0gW1xyXG5cdFx0Y3N2X3BhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRzc3ZfcGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRdXHJcblx0dHJ5X3BhcnNlX2xpbmUgPSAobGluZSwgcGFsZXR0ZSwgcmVnZXhwKS0+XHJcblx0XHRtYXRjaCA9IGxpbmUubWF0Y2gocmVnZXhwKVxyXG5cdFx0aWYgbWF0Y2hcclxuXHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRyOiBtYXRjaFsxXVxyXG5cdFx0XHRcdGc6IG1hdGNoWzJdXHJcblx0XHRcdFx0YjogbWF0Y2hbM11cclxuXHRmb3IgbGluZSBpbiBsaW5lc1xyXG5cdFx0dHJ5X3BhcnNlX2xpbmUgbGluZSwgY3N2X3BhbGV0dGUsIC8oWzAtOV0qXFwuP1swLTldKyksXFxzKihbMC05XSpcXC4/WzAtOV0rKSxcXHMqKFswLTldKlxcLj9bMC05XSspL1xyXG5cdFx0dHJ5X3BhcnNlX2xpbmUgbGluZSwgc3N2X3BhbGV0dGUsIC8oWzAtOV0qXFwuP1swLTldKylcXHMrKFswLTldKlxcLj9bMC05XSspXFxzKyhbMC05XSpcXC4/WzAtOV0rKS9cclxuXHRcclxuXHRtb3N0X2NvbG9ycyA9IFtdXHJcblx0Zm9yIHBhbGV0dGUgaW4gcGFsZXR0ZXNcclxuXHRcdGlmIHBhbGV0dGUubGVuZ3RoID49IG1vc3RfY29sb3JzLmxlbmd0aFxyXG5cdFx0XHRtb3N0X2NvbG9ycyA9IHBhbGV0dGVcclxuXHRcclxuXHRuID0gbW9zdF9jb2xvcnMubGVuZ3RoXHJcblx0aWYgbiA8IDRcclxuXHRcdHRocm93IG5ldyBFcnJvcihbXHJcblx0XHRcdFwiTm8gY29sb3JzIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IG9uZSBjb2xvciBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBhIGNvdXBsZSBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgYSBmZXcgY29sb3JzIGZvdW5kXCJcclxuXHRcdF1bbl0gKyBcIiAoI3tufSlcIilcclxuXHRcclxuXHRpZiBtb3N0X2NvbG9ycy5ldmVyeSgoY29sb3IpLT4gY29sb3IuciA8PSAxIGFuZCBjb2xvci5nIDw9IDEgYW5kIGNvbG9yLmIgPD0gMSlcclxuXHRcdG1vc3RfY29sb3JzLmZvckVhY2ggKGNvbG9yKS0+XHJcblx0XHRcdGNvbG9yLnIgKj0gMjU1XHJcblx0XHRcdGNvbG9yLmcgKj0gMjU1XHJcblx0XHRcdGNvbG9yLmIgKj0gMjU1XHJcblxyXG5cdG1vc3RfY29sb3JzXHJcbiIsIi8vIExvYWQgV2luZG93cyAudGhlbWUgYW5kIC50aGVtZXBhY2sgZmlsZXMsIGFuZCBLREUgLmNvbG9ycyBjb2xvciBzY2hlbWVzXHJcblxyXG52YXIgUGFsZXR0ZSA9IHJlcXVpcmUoXCIuLi9QYWxldHRlXCIpO1xyXG5cclxuZnVuY3Rpb24gcGFyc2VJTklTdHJpbmcoZGF0YSl7XHJcblx0dmFyIHJlZ2V4ID0ge1xyXG5cdFx0c2VjdGlvbjogL15cXHMqXFxbXFxzKihbXlxcXV0qKVxccypcXF1cXHMqJC8sXHJcblx0XHRwYXJhbTogL15cXHMqKFtePV0rPylcXHMqPVxccyooLio/KVxccyokLyxcclxuXHRcdGNvbW1lbnQ6IC9eXFxzKjsuKiQvXHJcblx0fTtcclxuXHR2YXIgdmFsdWUgPSB7fTtcclxuXHR2YXIgbGluZXMgPSBkYXRhLnNwbGl0KC9bXFxyXFxuXSsvKTtcclxuXHR2YXIgc2VjdGlvbiA9IG51bGw7XHJcblx0bGluZXMuZm9yRWFjaChmdW5jdGlvbihsaW5lKXtcclxuXHRcdGlmKHJlZ2V4LmNvbW1lbnQudGVzdChsaW5lKSl7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1lbHNlIGlmKHJlZ2V4LnBhcmFtLnRlc3QobGluZSkpe1xyXG5cdFx0XHR2YXIgbWF0Y2ggPSBsaW5lLm1hdGNoKHJlZ2V4LnBhcmFtKTtcclxuXHRcdFx0aWYoc2VjdGlvbil7XHJcblx0XHRcdFx0dmFsdWVbc2VjdGlvbl1bbWF0Y2hbMV1dID0gbWF0Y2hbMl07XHJcblx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdHZhbHVlW21hdGNoWzFdXSA9IG1hdGNoWzJdO1xyXG5cdFx0XHR9XHJcblx0XHR9ZWxzZSBpZihyZWdleC5zZWN0aW9uLnRlc3QobGluZSkpe1xyXG5cdFx0XHR2YXIgbWF0Y2ggPSBsaW5lLm1hdGNoKHJlZ2V4LnNlY3Rpb24pO1xyXG5cdFx0XHR2YWx1ZVttYXRjaFsxXV0gPSB7fTtcclxuXHRcdFx0c2VjdGlvbiA9IG1hdGNoWzFdO1xyXG5cdFx0fWVsc2UgaWYobGluZS5sZW5ndGggPT0gMCAmJiBzZWN0aW9uKXtcclxuXHRcdFx0c2VjdGlvbiA9IG51bGw7XHJcblx0XHR9O1xyXG5cdH0pO1xyXG5cdHJldHVybiB2YWx1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VUaGVtZUZpbGVTdHJpbmcodGhlbWVJbmkpIHtcclxuXHQvLyAudGhlbWUgaXMgYSByZW5hbWVkIC5pbmkgdGV4dCBmaWxlXHJcblx0Ly8gLnRoZW1lcGFjayBpcyBhIHJlbmFtZWQgLmNhYiBmaWxlLCBhbmQgcGFyc2luZyBpdCBhcyAuaW5pIHNlZW1zIHRvIHdvcmsgd2VsbCBlbm91Z2ggZm9yIHRoZSBtb3N0IHBhcnQsIGFzIHRoZSAuaW5pIGRhdGEgYXBwZWFycyBpbiBwbGFpbixcclxuXHQvLyBidXQgaXQgbWF5IG5vdCBpZiBjb21wcmVzc2lvbiBpcyBlbmFibGVkIGZvciB0aGUgLmNhYiBmaWxlXHJcblx0dmFyIHRoZW1lID0gcGFyc2VJTklTdHJpbmcodGhlbWVJbmkpO1xyXG5cdHZhciBjb2xvcnMgPSB0aGVtZVtcIkNvbnRyb2wgUGFuZWxcXFxcQ29sb3JzXCJdO1xyXG5cdGlmICghY29sb3JzKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHRoZW1lIGZpbGUsIG5vIFtDb250cm9sIFBhbmVsXFxcXENvbG9yc10gc2VjdGlvblwiKTtcclxuXHR9XHJcblx0dmFyIHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpO1xyXG5cdGZvciAodmFyIGsgaW4gY29sb3JzKSB7XHJcblx0XHQvLyBmb3IgLnRoZW1lcGFjayBmaWxlIHN1cHBvcnQsIGp1c3QgaWdub3JlIGJhZCBrZXlzIHRoYXQgd2VyZSBwYXJzZWRcclxuXHRcdGlmICghay5tYXRjaCgvXFxXLykpIHtcclxuXHRcdFx0dmFyIGNvbXBvbmVudHMgPSBjb2xvcnNba10uc3BsaXQoXCIgXCIpO1xyXG5cdFx0XHRpZiAoY29tcG9uZW50cy5sZW5ndGggPT09IDMpIHtcclxuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRcdGNvbXBvbmVudHNbaV0gPSBwYXJzZUludChjb21wb25lbnRzW2ldLCAxMCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChjb21wb25lbnRzLmV2ZXJ5KChjb21wb25lbnQpPT4gaXNGaW5pdGUoY29tcG9uZW50KSkpIHtcclxuXHRcdFx0XHRcdHBhbGV0dGUuYWRkKHtcclxuXHRcdFx0XHRcdFx0cjogY29tcG9uZW50c1swXSxcclxuXHRcdFx0XHRcdFx0ZzogY29tcG9uZW50c1sxXSxcclxuXHRcdFx0XHRcdFx0YjogY29tcG9uZW50c1syXSxcclxuXHRcdFx0XHRcdFx0bmFtZTogayxcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIHBhbGV0dGU7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSk9PiB7XHJcblx0cmV0dXJuIHBhcnNlVGhlbWVGaWxlU3RyaW5nKGRhdGEpO1xyXG59O1xyXG4iLCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuL1BhbGV0dGVcIlxyXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcclxuXHJcbmNsYXNzIFJhbmRvbUNvbG9yIGV4dGVuZHMgQ29sb3JcclxuXHRjb25zdHJ1Y3RvcjogLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEByYW5kb21pemUoKVxyXG5cdFxyXG5cdHJhbmRvbWl6ZTogLT5cclxuXHRcdEBoID0gTWF0aC5yYW5kb20oKSAqIDM2MFxyXG5cdFx0QHMgPSBNYXRoLnJhbmRvbSgpICogMTAwXHJcblx0XHRAbCA9IE1hdGgucmFuZG9tKCkgKiAxMDBcclxuXHRcclxuXHR0b1N0cmluZzogLT5cclxuXHRcdEByYW5kb21pemUoKVxyXG5cdFx0XCJoc2woI3tAaH0sICN7QHN9JSwgI3tAbH0lKVwiXHJcblx0XHJcblx0aXM6IC0+IG5vXHJcblxyXG5jbGFzcyBSYW5kb21QYWxldHRlIGV4dGVuZHMgUGFsZXR0ZVxyXG5cdGNvbnN0cnVjdG9yOiAtPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QGxvYWRlciA9XHJcblx0XHRcdG5hbWU6IFwiQ29tcGxldGVseSBSYW5kb20gQ29sb3Jz4oSiXCJcclxuXHRcdFx0ZmlsZUV4dGVuc2lvbnM6IFtdXHJcblx0XHRcdGZpbGVFeHRlbnNpb25zUHJldHR5OiBcIiguY3JjIHNqZihEZjA5c2pkZmtzZGxmbW5tICc7JztcIlxyXG5cdFx0QG1hdGNoZWRMb2FkZXJGaWxlRXh0ZW5zaW9ucyA9IG5vXHJcblx0XHRAY29uZmlkZW5jZSA9IDBcclxuXHRcdEBmaW5hbGl6ZSgpXHJcblx0XHRmb3IgaSBpbiBbMC4uTWF0aC5yYW5kb20oKSoxNSs1XVxyXG5cdFx0XHRAcHVzaCBuZXcgUmFuZG9tQ29sb3IoKVxyXG5cclxuY2xhc3MgTG9hZGluZ0Vycm9ycyBleHRlbmRzIEVycm9yXHJcblx0Y29uc3RydWN0b3I6IChAZXJyb3JzKS0+XHJcblx0XHRzdXBlcigpXHJcblx0XHRAbWVzc2FnZSA9IFwiU29tZSBlcnJvcnMgd2VyZSBlbmNvdW50ZXJlZCB3aGVuIGxvYWRpbmc6XCIgK1xyXG5cdFx0XHRmb3IgZXJyb3IgaW4gQGVycm9yc1xyXG5cdFx0XHRcdFwiXFxuXFx0XCIgKyBlcnJvci5tZXNzYWdlXHJcblxyXG5sb2FkX3BhbGV0dGUgPSAobywgY2FsbGJhY2spLT5cclxuXHRcclxuXHRwYWxldHRlX2xvYWRlcnMgPSBbXHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiLCBcInBzcHBhbGV0dGVcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9QYWludFNob3BQcm9cIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlJJRkYgUEFMXCJcclxuXHRcdFx0ZXh0czogW1wicGFsXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvUklGRlwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiQ29sb3JTY2hlbWVyIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJjc1wiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0NvbG9yU2NoZW1lclwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUGFpbnQuTkVUIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJ0eHRcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9QYWludC5ORVRcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkdJTVAgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImdwbFwiLCBcImdpbXBcIiwgXCJjb2xvcnNcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9HSU1QXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJLb2xvdXJQYWludCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiY29sb3JzXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvS29sb3VyUGFpbnRcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlNrZW5jaWwgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInNwbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1NQTFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiU2tldGNoIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJza2V0Y2hwYWxldHRlXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvc2tldGNocGFsZXR0ZVwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwic0sxIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJza3BcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TS1BcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkNTUyBjb2xvcnNcIlxyXG5cdFx0XHRleHRzOiBbXCJjc3NcIiwgXCJzY3NzXCIsIFwic2Fzc1wiLCBcImxlc3NcIiwgXCJzdHlsXCIsIFwiaHRtbFwiLCBcImh0bVwiLCBcInN2Z1wiLCBcImpzXCIsIFwidHNcIiwgXCJ4bWxcIiwgXCJ0eHRcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9DU1NcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIldpbmRvd3MgZGVza3RvcCB0aGVtZVwiXHJcblx0XHRcdGV4dHM6IFtcInRoZW1lXCIsIFwidGhlbWVwYWNrXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvdGhlbWVcIlxyXG5cdFx0fVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJLREUgZGVza3RvcCB0aGVtZVwiXHJcblx0XHQjIFx0ZXh0czogW1wiY29sb3JzXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy90aGVtZVwiXHJcblx0XHQjIH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgU3dhdGNoXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY29cIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JTd2F0Y2hcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIFRhYmxlXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY3RcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JUYWJsZVwiXHJcblx0XHQjIH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgU3dhdGNoIEV4Y2hhbmdlXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhc2VcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlU3dhdGNoRXhjaGFuZ2VcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIEJvb2tcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjYlwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvckJvb2tcIlxyXG5cdFx0IyB9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiSG9tZXNpdGUgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImhwbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0hvbWVzaXRlXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJTdGFyQ3JhZnQgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1N0YXJDcmFmdFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiU3RhckNyYWZ0IHRlcnJhaW4gcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcIndwZVwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1N0YXJDcmFmdFBhZGRlZFwiXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQXV0b0NBRCBDb2xvciBCb29rXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY2JcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0F1dG9DQURDb2xvckJvb2tcIlxyXG5cdFx0IyB9XHJcblx0XHRcclxuXHRcdCMge1xyXG5cdFx0IyBcdCMgKHNhbWUgYXMgUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZT8pXHJcblx0XHQjIFx0bmFtZTogXCJDb3JlbERSQVcgcGFsZXR0ZVwiXHJcblx0XHQjIFx0ZXh0czogW1wicGFsXCIsIFwiY3BsXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9Db3JlbERSQVdcIlxyXG5cdFx0IyB9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwidGFidWxhciBjb2xvcnNcIlxyXG5cdFx0XHRleHRzOiBbXCJjc3ZcIiwgXCJ0c3ZcIiwgXCJ0eHRcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy90YWJ1bGFyXCJcclxuXHRcdH1cclxuXHRdXHJcblx0XHJcblx0IyBmaW5kIHBhbGV0dGUgbG9hZGVycyB0aGF0IHVzZSB0aGlzIGZpbGUgZXh0ZW5zaW9uXHJcblx0Zm9yIHBsIGluIHBhbGV0dGVfbG9hZGVyc1xyXG5cdFx0cGwubWF0Y2hlc19leHQgPSBwbC5leHRzLmluZGV4T2Yoby5maWxlRXh0KSBpc250IC0xXHJcblx0XHJcblx0IyBtb3ZlIHBhbGV0dGUgbG9hZGVycyB0byB0aGUgYmVnaW5uaW5nIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cclxuXHRwYWxldHRlX2xvYWRlcnMuc29ydCAocGwxLCBwbDIpLT5cclxuXHRcdHBsMi5tYXRjaGVzX2V4dCAtIHBsMS5tYXRjaGVzX2V4dFxyXG5cdFxyXG5cdCMgdHJ5IGxvYWRpbmcgc3R1ZmZcclxuXHRlcnJvcnMgPSBbXVxyXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcclxuXHRcdFxyXG5cdFx0dHJ5XHJcblx0XHRcdHBhbGV0dGUgPSBwbC5sb2FkKG8pXHJcblx0XHRcdGlmIHBhbGV0dGUubGVuZ3RoIGlzIDBcclxuXHRcdFx0XHRwYWxldHRlID0gbnVsbFxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIm5vIGNvbG9ycyByZXR1cm5lZFwiXHJcblx0XHRjYXRjaCBlXHJcblx0XHRcdG1zZyA9IFwiZmFpbGVkIHRvIGxvYWQgI3tvLmZpbGVOYW1lfSBhcyAje3BsLm5hbWV9OiAje2UubWVzc2FnZX1cIlxyXG5cdFx0XHQjIGlmIHBsLm1hdGNoZXNfZXh0IGFuZCBub3QgZS5tZXNzYWdlLm1hdGNoKC9ub3QgYS9pKVxyXG5cdFx0XHQjIFx0Y29uc29sZT8uZXJyb3I/IG1zZ1xyXG5cdFx0XHQjIGVsc2VcclxuXHRcdFx0IyBcdGNvbnNvbGU/Lndhcm4/IG1zZ1xyXG5cdFx0XHRcclxuXHRcdFx0IyBUT0RPOiBtYXliZSB0aGlzIHNob3VsZG4ndCBiZSBhbiBFcnJvciBvYmplY3QsIGp1c3QgYSB7bWVzc2FnZSwgZXJyb3J9IG9iamVjdFxyXG5cdFx0XHQjIG9yIHtmcmllbmRseU1lc3NhZ2UsIGVycm9yfVxyXG5cdFx0XHRlcnIgPSBuZXcgRXJyb3IgbXNnXHJcblx0XHRcdGVyci5lcnJvciA9IGVcclxuXHRcdFx0ZXJyb3JzLnB1c2ggZXJyXHJcblx0XHRcclxuXHRcdGlmIHBhbGV0dGVcclxuXHRcdFx0IyBjb25zb2xlPy5pbmZvPyBcImxvYWRlZCAje28uZmlsZU5hbWV9IGFzICN7cGwubmFtZX1cIlxyXG5cdFx0XHRwYWxldHRlLmNvbmZpZGVuY2UgPSBpZiBwbC5tYXRjaGVzX2V4dCB0aGVuIDAuOSBlbHNlIDAuMDFcclxuXHRcdFx0ZXh0c19wcmV0dHkgPSBcIi4je3BsLmV4dHMuam9pbihcIiwgLlwiKX1cIlxyXG5cdFx0XHRcclxuXHRcdFx0IyBUT0RPOiBwcm9iYWJseSByZW5hbWUgbG9hZGVyIC0+IGZvcm1hdCB3aGVuIDItd2F5IGRhdGEgZmxvdyAocmVhZC93cml0ZSkgaXMgc3VwcG9ydGVkXHJcblx0XHRcdCMgVE9ETzogbWF5YmUgbWFrZSB0aGlzIGEgM3JkIChhbmQgZm91cnRoPykgYXJndW1lbnQgdG8gdGhlIGNhbGxiYWNrXHJcblx0XHRcdHBhbGV0dGUubG9hZGVyID1cclxuXHRcdFx0XHRuYW1lOiBwbC5uYW1lXHJcblx0XHRcdFx0ZmlsZUV4dGVuc2lvbnM6IHBsLmV4dHNcclxuXHRcdFx0XHRmaWxlRXh0ZW5zaW9uc1ByZXR0eTogZXh0c19wcmV0dHlcclxuXHRcdFx0cGFsZXR0ZS5tYXRjaGVkTG9hZGVyRmlsZUV4dGVuc2lvbnMgPSBwbC5tYXRjaGVzX2V4dFxyXG5cdFx0XHRcclxuXHRcdFx0cGFsZXR0ZS5maW5hbGl6ZSgpXHJcblx0XHRcdGNhbGxiYWNrKG51bGwsIHBhbGV0dGUpXHJcblx0XHRcdHJldHVyblxyXG5cdFxyXG5cdGNhbGxiYWNrKG5ldyBMb2FkaW5nRXJyb3JzKGVycm9ycykpXHJcblx0cmV0dXJuXHJcblxyXG5ub3JtYWxpemVfb3B0aW9ucyA9IChvID0ge30pLT5cclxuXHRpZiB0eXBlb2YgbyBpcyBcInN0cmluZ1wiIG9yIG8gaW5zdGFuY2VvZiBTdHJpbmdcclxuXHRcdG8gPSBmaWxlUGF0aDogb1xyXG5cdGlmIEZpbGU/IGFuZCBvIGluc3RhbmNlb2YgRmlsZVxyXG5cdFx0byA9IGZpbGU6IG9cclxuXHRcclxuXHQjIG8ubWluQ29sb3JzID89IDJcclxuXHQjIG8ubWF4Q29sb3JzID89IDI1NlxyXG5cdG8uZmlsZU5hbWUgPz0gby5maWxlPy5uYW1lID8gKGlmIG8uZmlsZVBhdGggdGhlbiByZXF1aXJlKFwicGF0aFwiKS5iYXNlbmFtZShvLmZpbGVQYXRoKSlcclxuXHRvLmZpbGVFeHQgPz0gXCIje28uZmlsZU5hbWV9XCIuc3BsaXQoXCIuXCIpLnBvcCgpXHJcblx0by5maWxlRXh0ID0gXCIje28uZmlsZUV4dH1cIi50b0xvd2VyQ2FzZSgpXHJcblx0b1xyXG5cclxuQW55UGFsZXR0ZSA9IHtcclxuXHRDb2xvclxyXG5cdFBhbGV0dGVcclxuXHRSYW5kb21Db2xvclxyXG5cdFJhbmRvbVBhbGV0dGVcclxuXHQjIExvYWRpbmdFcnJvcnNcclxufVxyXG5cclxuIyBHZXQgcGFsZXR0ZSBmcm9tIGEgZmlsZVxyXG5BbnlQYWxldHRlLmxvYWRQYWxldHRlID0gKG8sIGNhbGxiYWNrKS0+XHJcblx0aWYgbm90IG9cclxuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IgXCJwYXJhbWV0ZXJzIHJlcXVpcmVkOiBBbnlQYWxldHRlLmxvYWRQYWxldHRlKG9wdGlvbnMsIGZ1bmN0aW9uIGNhbGxiYWNrKGVycm9yLCBwYWxldHRlKXt9KVwiXHJcblx0aWYgbm90IGNhbGxiYWNrXHJcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yIFwiY2FsbGJhY2sgcmVxdWlyZWQ6IEFueVBhbGV0dGUubG9hZFBhbGV0dGUob3B0aW9ucywgZnVuY3Rpb24gY2FsbGJhY2soZXJyb3IsIHBhbGV0dGUpe30pXCJcclxuXHRcclxuXHRvID0gbm9ybWFsaXplX29wdGlvbnMgb1xyXG5cdFxyXG5cdGlmIG8uZGF0YVxyXG5cdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdGVsc2UgaWYgby5maWxlXHJcblx0XHRpZiBub3QgKG8uZmlsZSBpbnN0YW5jZW9mIEZpbGUpXHJcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IgXCJvcHRpb25zLmZpbGUgd2FzIHBhc3NlZCBidXQgaXQgaXMgbm90IGEgRmlsZVwiXHJcblx0XHRmciA9IG5ldyBGaWxlUmVhZGVyXHJcblx0XHRmci5vbmVycm9yID0gLT5cclxuXHRcdFx0Y2FsbGJhY2soZnIuZXJyb3IpXHJcblx0XHRmci5vbmxvYWQgPSAtPlxyXG5cdFx0XHRvLmRhdGEgPSBmci5yZXN1bHRcclxuXHRcdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdFx0ZnIucmVhZEFzQmluYXJ5U3RyaW5nIG8uZmlsZVxyXG5cdGVsc2UgaWYgby5maWxlUGF0aD9cclxuXHRcdGZzID0gcmVxdWlyZSBcImZzXCJcclxuXHRcdGZzLnJlYWRGaWxlIG8uZmlsZVBhdGgsIChlcnJvciwgZGF0YSktPlxyXG5cdFx0XHRpZiBlcnJvclxyXG5cdFx0XHRcdGNhbGxiYWNrKGVycm9yKVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0by5kYXRhID0gZGF0YS50b1N0cmluZyhcImJpbmFyeVwiKVxyXG5cdFx0XHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRlbHNlXHJcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yIFwiZWl0aGVyIG9wdGlvbnMuZGF0YSBvciBvcHRpb25zLmZpbGUgb3Igb3B0aW9ucy5maWxlUGF0aCBtdXN0IGJlIHBhc3NlZFwiXHJcblxyXG5cclxuIyBHZXQgYSBwYWxldHRlIGZyb20gYSBmaWxlIG9yIGJ5IGFueSBtZWFucyBuZWNlc3NhcnlcclxuIyAoYXMgaW4gZmFsbCBiYWNrIHRvIGNvbXBsZXRlbHkgcmFuZG9tIGRhdGEpXHJcbkFueVBhbGV0dGUuZ2ltbWVBUGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxyXG5cdG8gPSBub3JtYWxpemVfb3B0aW9ucyBvXHJcblx0XHJcblx0QW55UGFsZXR0ZS5sb2FkUGFsZXR0ZSBvLCAoZXJyLCBwYWxldHRlKS0+XHJcblx0XHRjYWxsYmFjayhudWxsLCBwYWxldHRlID8gbmV3IFJhbmRvbVBhbGV0dGUpXHJcblxyXG4jIEV4cG9ydHNcclxubW9kdWxlLmV4cG9ydHMgPSBBbnlQYWxldHRlXHJcbiJdfQ==
