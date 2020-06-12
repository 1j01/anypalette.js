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
      name: "tabular colors",
      exts: ["csv",
    "tsv",
    "txt"],
      load: require("./loaders/tabular")
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


},{"./Color":2,"./Palette":3,"./loaders/CSS":4,"./loaders/ColorSchemer":5,"./loaders/GIMP":6,"./loaders/HPL":7,"./loaders/KolourPaint":8,"./loaders/Paint.NET":9,"./loaders/PaintShopPro":10,"./loaders/RIFF":11,"./loaders/SKP":12,"./loaders/SPL":13,"./loaders/StarCraft":14,"./loaders/StarCraftPadded":15,"./loaders/sketchpalette":16,"./loaders/tabular":17,"fs":"fs","path":"path"}]},{},[18])(18)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQmluYXJ5UmVhZGVyLmNvZmZlZSIsInNyYy9Db2xvci5jb2ZmZWUiLCJzcmMvUGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbG9hZGVycy9DU1MuY29mZmVlIiwic3JjL2xvYWRlcnMvQ29sb3JTY2hlbWVyLmNvZmZlZSIsInNyYy9sb2FkZXJzL0dJTVAuY29mZmVlIiwic3JjL2xvYWRlcnMvSFBMLmNvZmZlZSIsInNyYy9sb2FkZXJzL0tvbG91clBhaW50LmNvZmZlZSIsInNyYy9sb2FkZXJzL1BhaW50Lk5FVC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9QYWludFNob3BQcm8uY29mZmVlIiwic3JjL2xvYWRlcnMvUklGRi5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TS1AuY29mZmVlIiwic3JjL2xvYWRlcnMvU1BMLmNvZmZlZSIsInNyYy9sb2FkZXJzL1N0YXJDcmFmdC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TdGFyQ3JhZnRQYWRkZWQuY29mZmVlIiwic3JjL2xvYWRlcnMvc2tldGNocGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbG9hZGVycy90YWJ1bGFyLmNvZmZlZSIsInNyYy9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ2FJOzs7Ozs7Ozs7Ozs7O0FBQUEsSUFBQTs7QUFFRixNQUFNLENBQUMsT0FBUCxHQUNNO0VBQU4sTUFBQSxhQUFBO0lBQ0EsV0FBYSxDQUFDLElBQUQsQ0FBQTtNQUNaLElBQUMsQ0FBQSxPQUFELEdBQVc7TUFDWCxJQUFDLENBQUEsSUFBRCxHQUFRO0lBRkksQ0FBZDs7O0lBTUMsUUFBVSxDQUFBLENBQUE7QUFDWCxVQUFBO01BQUUsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFaO01BQ0EsRUFBQSxHQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBYixDQUF3QixJQUFDLENBQUEsSUFBekIsQ0FBQSxHQUFpQztNQUN0QyxJQUFDLENBQUEsSUFB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Ozs7Ozs7QUEyUEMsVUFBVSxDQUFDLGFBQVgsR0FBMkIsUUFBQSxDQUFDLENBQUQsRUFBSSxRQUFKLENBQUE7RUFDM0IsQ0FBQSxHQUFJLGlCQUFBLENBQWtCLENBQWxCO1NBRUosVUFBVSxDQUFDLFdBQVgsQ0FBdUIsQ0FBdkIsRUFBMEIsUUFBQSxDQUFDLEdBQUQsRUFBTSxPQUFOLENBQUE7V0FDekIsUUFBQSxDQUFTLElBQVQsb0JBQWUsVUFBVSxJQUFJLGFBQUosQ0FBQSxDQUF6QjtFQUR5QixDQUExQjtBQUgyQixFQTNQNUI7OztBQWtRQyxNQUFNLENBQUMsT0FBUCxHQUFpQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlxyXG4jIyNcclxuQmluYXJ5UmVhZGVyXHJcblxyXG5Nb2RpZmllZCBieSBJc2FpYWggT2RobmVyXHJcbkBUT0RPOiB1c2UgakRhdGFWaWV3ICsgakJpbmFyeSBpbnN0ZWFkXHJcblxyXG5SZWZhY3RvcmVkIGJ5IFZqZXV4IDx2amV1eHhAZ21haWwuY29tPlxyXG5odHRwOi8vYmxvZy52amV1eC5jb20vMjAxMC9qYXZhc2NyaXB0L2phdmFzY3JpcHQtYmluYXJ5LXJlYWRlci5odG1sXHJcblxyXG5PcmlnaW5hbFxyXG4rIEpvbmFzIFJhb25pIFNvYXJlcyBTaWx2YVxyXG5AIGh0dHA6Ly9qc2Zyb21oZWxsLmNvbS9jbGFzc2VzL2JpbmFyeS1wYXJzZXIgW3Jldi4gIzFdXHJcbiMjI1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG5jbGFzcyBCaW5hcnlSZWFkZXJcclxuXHRjb25zdHJ1Y3RvcjogKGRhdGEpLT5cclxuXHRcdEBfYnVmZmVyID0gZGF0YVxyXG5cdFx0QF9wb3MgPSAwXHJcblxyXG5cdCMgUHVibGljIChjdXN0b20pXHJcblx0XHJcblx0cmVhZEJ5dGU6IC0+XHJcblx0XHRAX2NoZWNrU2l6ZSg4KVxyXG5cdFx0Y2ggPSB0aGlzLl9idWZmZXIuY2hhckNvZGVBdChAX3BvcykgJiAweGZmXHJcblx0XHRAX3BvcyArPSAxXHJcblx0XHRjaCAmIDB4ZmZcclxuXHRcclxuXHRyZWFkVW5pY29kZVN0cmluZzogLT5cclxuXHRcdGxlbmd0aCA9IEByZWFkVUludDE2KClcclxuXHRcdCMgY29uc29sZS5sb2cge2xlbmd0aH1cclxuXHRcdEBfY2hlY2tTaXplKGxlbmd0aCAqIDE2KVxyXG5cdFx0c3RyID0gXCJcIlxyXG5cdFx0Zm9yIGkgaW4gWzAuLmxlbmd0aF1cclxuXHRcdFx0c3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoQF9idWZmZXIuc3Vic3RyKEBfcG9zLCAxKSB8IChAX2J1ZmZlci5zdWJzdHIoQF9wb3MrMSwgMSkgPDwgOCkpXHJcblx0XHRcdEBfcG9zICs9IDJcclxuXHRcdHN0clxyXG5cdFxyXG5cdCMgUHVibGljXHJcblx0XHJcblx0cmVhZEludDg6IC0+IEBfZGVjb2RlSW50KDgsIHRydWUpXHJcblx0cmVhZFVJbnQ4OiAtPiBAX2RlY29kZUludCg4LCBmYWxzZSlcclxuXHRyZWFkSW50MTY6IC0+IEBfZGVjb2RlSW50KDE2LCB0cnVlKVxyXG5cdHJlYWRVSW50MTY6IC0+IEBfZGVjb2RlSW50KDE2LCBmYWxzZSlcclxuXHRyZWFkSW50MzI6IC0+IEBfZGVjb2RlSW50KDMyLCB0cnVlKVxyXG5cdHJlYWRVSW50MzI6IC0+IEBfZGVjb2RlSW50KDMyLCBmYWxzZSlcclxuXHJcblx0cmVhZEZsb2F0OiAtPiBAX2RlY29kZUZsb2F0KDIzLCA4KVxyXG5cdHJlYWREb3VibGU6IC0+IEBfZGVjb2RlRmxvYXQoNTIsIDExKVxyXG5cdFxyXG5cdHJlYWRDaGFyOiAtPiBAcmVhZFN0cmluZygxKVxyXG5cdHJlYWRTdHJpbmc6IChsZW5ndGgpLT5cclxuXHRcdEBfY2hlY2tTaXplKGxlbmd0aCAqIDgpXHJcblx0XHRyZXN1bHQgPSBAX2J1ZmZlci5zdWJzdHIoQF9wb3MsIGxlbmd0aClcclxuXHRcdEBfcG9zICs9IGxlbmd0aFxyXG5cdFx0cmVzdWx0XHJcblxyXG5cdHNlZWs6IChwb3MpLT5cclxuXHRcdEBfcG9zID0gcG9zXHJcblx0XHRAX2NoZWNrU2l6ZSgwKVxyXG5cdFxyXG5cdGdldFBvc2l0aW9uOiAtPiBAX3Bvc1xyXG5cdFxyXG5cdGdldFNpemU6IC0+IEBfYnVmZmVyLmxlbmd0aFxyXG5cdFxyXG5cclxuXHJcblx0IyBQcml2YXRlXHJcblx0XHJcblx0X2RlY29kZUZsb2F0OiBgZnVuY3Rpb24ocHJlY2lzaW9uQml0cywgZXhwb25lbnRCaXRzKXtcclxuXHRcdHZhciBsZW5ndGggPSBwcmVjaXNpb25CaXRzICsgZXhwb25lbnRCaXRzICsgMTtcclxuXHRcdHZhciBzaXplID0gbGVuZ3RoID4+IDM7XHJcblx0XHR0aGlzLl9jaGVja1NpemUobGVuZ3RoKTtcclxuXHJcblx0XHR2YXIgYmlhcyA9IE1hdGgucG93KDIsIGV4cG9uZW50Qml0cyAtIDEpIC0gMTtcclxuXHRcdHZhciBzaWduYWwgPSB0aGlzLl9yZWFkQml0cyhwcmVjaXNpb25CaXRzICsgZXhwb25lbnRCaXRzLCAxLCBzaXplKTtcclxuXHRcdHZhciBleHBvbmVudCA9IHRoaXMuX3JlYWRCaXRzKHByZWNpc2lvbkJpdHMsIGV4cG9uZW50Qml0cywgc2l6ZSk7XHJcblx0XHR2YXIgc2lnbmlmaWNhbmQgPSAwO1xyXG5cdFx0dmFyIGRpdmlzb3IgPSAyO1xyXG5cdFx0dmFyIGN1ckJ5dGUgPSAwOyAvL2xlbmd0aCArICgtcHJlY2lzaW9uQml0cyA+PiAzKSAtIDE7XHJcblx0XHRkbyB7XHJcblx0XHRcdHZhciBieXRlVmFsdWUgPSB0aGlzLl9yZWFkQnl0ZSgrK2N1ckJ5dGUsIHNpemUpO1xyXG5cdFx0XHR2YXIgc3RhcnRCaXQgPSBwcmVjaXNpb25CaXRzICUgOCB8fCA4O1xyXG5cdFx0XHR2YXIgbWFzayA9IDEgPDwgc3RhcnRCaXQ7XHJcblx0XHRcdHdoaWxlIChtYXNrID4+PSAxKSB7XHJcblx0XHRcdFx0aWYgKGJ5dGVWYWx1ZSAmIG1hc2spIHtcclxuXHRcdFx0XHRcdHNpZ25pZmljYW5kICs9IDEgLyBkaXZpc29yO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkaXZpc29yICo9IDI7XHJcblx0XHRcdH1cclxuXHRcdH0gd2hpbGUgKHByZWNpc2lvbkJpdHMgLT0gc3RhcnRCaXQpO1xyXG5cclxuXHRcdHRoaXMuX3BvcyArPSBzaXplO1xyXG5cclxuXHRcdHJldHVybiBleHBvbmVudCA9PSAoYmlhcyA8PCAxKSArIDEgPyBzaWduaWZpY2FuZCA/IE5hTiA6IHNpZ25hbCA/IC1JbmZpbml0eSA6ICtJbmZpbml0eVxyXG5cdFx0XHQ6ICgxICsgc2lnbmFsICogLTIpICogKGV4cG9uZW50IHx8IHNpZ25pZmljYW5kID8gIWV4cG9uZW50ID8gTWF0aC5wb3coMiwgLWJpYXMgKyAxKSAqIHNpZ25pZmljYW5kXHJcblx0XHRcdDogTWF0aC5wb3coMiwgZXhwb25lbnQgLSBiaWFzKSAqICgxICsgc2lnbmlmaWNhbmQpIDogMCk7XHJcblx0fWBcclxuXHJcblx0X2RlY29kZUludDogYGZ1bmN0aW9uKGJpdHMsIHNpZ25lZCl7XHJcblx0XHR2YXIgeCA9IHRoaXMuX3JlYWRCaXRzKDAsIGJpdHMsIGJpdHMgLyA4KSwgbWF4ID0gTWF0aC5wb3coMiwgYml0cyk7XHJcblx0XHR2YXIgcmVzdWx0ID0gc2lnbmVkICYmIHggPj0gbWF4IC8gMiA/IHggLSBtYXggOiB4O1xyXG5cclxuXHRcdHRoaXMuX3BvcyArPSBiaXRzIC8gODtcclxuXHRcdHJldHVybiByZXN1bHQ7XHJcblx0fWBcclxuXHJcblx0I3NobCBmaXg6IEhlbnJpIFRvcmdlbWFuZSB+MTk5NiAoY29tcHJlc3NlZCBieSBKb25hcyBSYW9uaSlcclxuXHRfc2hsOiBgZnVuY3Rpb24gKGEsIGIpe1xyXG5cdFx0Zm9yICgrK2I7IC0tYjsgYSA9ICgoYSAlPSAweDdmZmZmZmZmICsgMSkgJiAweDQwMDAwMDAwKSA9PSAweDQwMDAwMDAwID8gYSAqIDIgOiAoYSAtIDB4NDAwMDAwMDApICogMiArIDB4N2ZmZmZmZmYgKyAxKTtcclxuXHRcdHJldHVybiBhO1xyXG5cdH1gXHJcblx0XHJcblx0X3JlYWRCeXRlOiBgZnVuY3Rpb24gKGksIHNpemUpIHtcclxuXHRcdHJldHVybiB0aGlzLl9idWZmZXIuY2hhckNvZGVBdCh0aGlzLl9wb3MgKyBzaXplIC0gaSAtIDEpICYgMHhmZjtcclxuXHR9YFxyXG5cclxuXHRfcmVhZEJpdHM6IGBmdW5jdGlvbiAoc3RhcnQsIGxlbmd0aCwgc2l6ZSkge1xyXG5cdFx0dmFyIG9mZnNldExlZnQgPSAoc3RhcnQgKyBsZW5ndGgpICUgODtcclxuXHRcdHZhciBvZmZzZXRSaWdodCA9IHN0YXJ0ICUgODtcclxuXHRcdHZhciBjdXJCeXRlID0gc2l6ZSAtIChzdGFydCA+PiAzKSAtIDE7XHJcblx0XHR2YXIgbGFzdEJ5dGUgPSBzaXplICsgKC0oc3RhcnQgKyBsZW5ndGgpID4+IDMpO1xyXG5cdFx0dmFyIGRpZmYgPSBjdXJCeXRlIC0gbGFzdEJ5dGU7XHJcblxyXG5cdFx0dmFyIHN1bSA9ICh0aGlzLl9yZWFkQnl0ZShjdXJCeXRlLCBzaXplKSA+PiBvZmZzZXRSaWdodCkgJiAoKDEgPDwgKGRpZmYgPyA4IC0gb2Zmc2V0UmlnaHQgOiBsZW5ndGgpKSAtIDEpO1xyXG5cclxuXHRcdGlmIChkaWZmICYmIG9mZnNldExlZnQpIHtcclxuXHRcdFx0c3VtICs9ICh0aGlzLl9yZWFkQnl0ZShsYXN0Qnl0ZSsrLCBzaXplKSAmICgoMSA8PCBvZmZzZXRMZWZ0KSAtIDEpKSA8PCAoZGlmZi0tIDw8IDMpIC0gb2Zmc2V0UmlnaHQ7IFxyXG5cdFx0fVxyXG5cclxuXHRcdHdoaWxlIChkaWZmKSB7XHJcblx0XHRcdHN1bSArPSB0aGlzLl9zaGwodGhpcy5fcmVhZEJ5dGUobGFzdEJ5dGUrKywgc2l6ZSksIChkaWZmLS0gPDwgMykgLSBvZmZzZXRSaWdodCk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHN1bTtcclxuXHR9YFxyXG5cclxuXHRfY2hlY2tTaXplOiAobmVlZGVkQml0cyktPlxyXG5cdFx0aWYgQF9wb3MgKyBNYXRoLmNlaWwobmVlZGVkQml0cyAvIDgpID4gQF9idWZmZXIubGVuZ3RoXHJcblx0XHRcdHRocm93IG5ldyBFcnJvciBcIkluZGV4IG91dCBvZiBib3VuZFwiXHJcblxyXG4iLCJcclxuIyBjb2xvciB2YWx1ZSByYW5nZXM6XHJcbiMgYTogMCB0byAxXHJcbiMgci9nL2I6IDAgdG8gMjU1XHJcbiMgaDogMCB0byAzNjBcclxuIyBzL2w6IDAgdG8gMTAwXHJcbiMgYy9tL3kvazogMCB0byAxMDBcclxuXHJcbm1vZHVsZS5leHBvcnRzID1cclxuY2xhc3MgQ29sb3JcclxuXHRjb25zdHJ1Y3RvcjogKG9wdGlvbnMpLT5cclxuXHRcdCMgQFRPRE86IGRvbid0IGFzc2lnbiBhbGwgb2Yge0ByLCBAZywgQGIsIEBoLCBAcywgQHYsIEBsfSByaWdodCBhd2F5XHJcblx0XHQjIG9ubHkgYXNzaWduIHRoZSBwcm9wZXJ0aWVzIHRoYXQgYXJlIHVzZWRcclxuXHRcdCMgYWxzbyBtYXliZSBhbHdheXMgaGF2ZSBAciBAZyBAYiAob3IgQHJlZCBAZ3JlZW4gQGJsdWUpIGJ1dCBzdGlsbCBzdHJpbmdpZnkgdG8gaHNsKCkgaWYgaHNsIG9yIGhzdiBnaXZlblxyXG5cdFx0IyBUT0RPOiBleHBlY3QgbnVtYmVycyBvciBjb252ZXJ0IHRvIG51bWJlcnNcclxuXHRcdHtcclxuXHRcdFx0QHIsIEBnLCBAYixcclxuXHRcdFx0QGgsIEBzLCBAdiwgQGwsXHJcblx0XHRcdGMsIG0sIHksIGssXHJcblx0XHRcdEBuYW1lXHJcblx0XHR9ID0gb3B0aW9uc1xyXG5cclxuXHRcdGlmIEByPyBhbmQgQGc/IGFuZCBAYj9cclxuXHRcdFx0IyBSZWQgR3JlZW4gQmx1ZVxyXG5cdFx0XHQjIChubyBjb252ZXJzaW9ucyBuZWVkZWQgaGVyZSlcclxuXHRcdGVsc2UgaWYgQGg/IGFuZCBAcz9cclxuXHRcdFx0IyBDeWxpbmRyaWNhbCBDb2xvciBTcGFjZVxyXG5cdFx0XHRpZiBAdj9cclxuXHRcdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIFZhbHVlXHJcblx0XHRcdFx0QGwgPSAoMiAtIEBzIC8gMTAwKSAqIEB2IC8gMlxyXG5cdFx0XHRcdEBzID0gQHMgKiBAdiAvIChpZiBAbCA8IDUwIHRoZW4gQGwgKiAyIGVsc2UgMjAwIC0gQGwgKiAyKVxyXG5cdFx0XHRcdEBzID0gMCBpZiBpc05hTiBAc1xyXG5cdFx0XHRlbHNlIGlmIEBsP1xyXG5cdFx0XHRcdCMgSHVlIFNhdHVyYXRpb24gTGlnaHRuZXNzXHJcblx0XHRcdFx0IyAobm8gY29udmVyc2lvbnMgbmVlZGVkIGhlcmUpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHQjIFRPRE86IGltcHJvdmUgZXJyb3IgbWVzc2FnZSAoZXNwZWNpYWxseSBpZiBAYiBnaXZlbilcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJIdWUsIHNhdHVyYXRpb24sIGFuZC4uLj8gKGVpdGhlciBsaWdodG5lc3Mgb3IgdmFsdWUpXCJcclxuXHRcdFx0IyBUT0RPOiBtYXliZSBjb252ZXJ0IHRvIEByIEBnIEBiIGhlcmVcclxuXHRcdGVsc2UgaWYgYz8gYW5kIG0/IGFuZCB5PyBhbmQgaz9cclxuXHRcdFx0IyBDeWFuIE1hZ2VudGEgWWVsbG93IGJsYWNLXHJcblx0XHRcdCMgVU5URVNURURcclxuXHRcdFx0YyAvPSAxMDBcclxuXHRcdFx0bSAvPSAxMDBcclxuXHRcdFx0eSAvPSAxMDBcclxuXHRcdFx0ayAvPSAxMDBcclxuXHRcdFx0XHJcblx0XHRcdEByID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCBjICogKDEgLSBrKSArIGspKVxyXG5cdFx0XHRAZyA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgbSAqICgxIC0gaykgKyBrKSlcclxuXHRcdFx0QGIgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIHkgKiAoMSAtIGspICsgaykpXHJcblx0XHRlbHNlXHJcblx0XHRcdCMgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURURcclxuXHRcdFx0aWYgQGw/IGFuZCBAYT8gYW5kIEBiP1xyXG5cdFx0XHRcdHdoaXRlID1cclxuXHRcdFx0XHRcdHg6IDk1LjA0N1xyXG5cdFx0XHRcdFx0eTogMTAwLjAwMFxyXG5cdFx0XHRcdFx0ejogMTA4Ljg4M1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHh5eiA9IFxyXG5cdFx0XHRcdFx0eTogKHJhdy5sICsgMTYpIC8gMTE2XHJcblx0XHRcdFx0XHR4OiByYXcuYSAvIDUwMCArIHh5ei55XHJcblx0XHRcdFx0XHR6OiB4eXoueSAtIHJhdy5iIC8gMjAwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Zm9yIF8gaW4gXCJ4eXpcIlxyXG5cdFx0XHRcdFx0cG93ZWQgPSBNYXRoLnBvdyh4eXpbX10sIDMpXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHBvd2VkID4gMC4wMDg4NTZcclxuXHRcdFx0XHRcdFx0eHl6W19dID0gcG93ZWRcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0eHl6W19dID0gKHh5eltfXSAtIDE2IC8gMTE2KSAvIDcuNzg3XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdCN4eXpbX10gPSBfcm91bmQoeHl6W19dICogd2hpdGVbX10pXHJcblx0XHRcdFx0XHJcblx0XHRcdCMgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURURcclxuXHRcdFx0aWYgQHg/IGFuZCBAeT8gYW5kIEB6P1xyXG5cdFx0XHRcdHh5eiA9XHJcblx0XHRcdFx0XHR4OiByYXcueCAvIDEwMFxyXG5cdFx0XHRcdFx0eTogcmF3LnkgLyAxMDBcclxuXHRcdFx0XHRcdHo6IHJhdy56IC8gMTAwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0cmdiID1cclxuXHRcdFx0XHRcdHI6IHh5ei54ICogMy4yNDA2ICsgeHl6LnkgKiAtMS41MzcyICsgeHl6LnogKiAtMC40OTg2XHJcblx0XHRcdFx0XHRnOiB4eXoueCAqIC0wLjk2ODkgKyB4eXoueSAqIDEuODc1OCArIHh5ei56ICogMC4wNDE1XHJcblx0XHRcdFx0XHRiOiB4eXoueCAqIDAuMDU1NyArIHh5ei55ICogLTAuMjA0MCArIHh5ei56ICogMS4wNTcwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Zm9yIF8gaW4gXCJyZ2JcIlxyXG5cdFx0XHRcdFx0I3JnYltfXSA9IF9yb3VuZChyZ2JbX10pXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHJnYltfXSA8IDBcclxuXHRcdFx0XHRcdFx0cmdiW19dID0gMFxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiByZ2JbX10gPiAwLjAwMzEzMDhcclxuXHRcdFx0XHRcdFx0cmdiW19dID0gMS4wNTUgKiBNYXRoLnBvdyhyZ2JbX10sICgxIC8gMi40KSkgLSAwLjA1NVxyXG5cdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gKj0gMTIuOTJcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHQjcmdiW19dID0gTWF0aC5yb3VuZChyZ2JbX10gKiAyNTUpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJDb2xvciBjb25zdHJ1Y3RvciBtdXN0IGJlIGNhbGxlZCB3aXRoIHtyLGcsYn0gb3Ige2gscyx2fSBvciB7aCxzLGx9IG9yIHtjLG0seSxrfSBvciB7eCx5LHp9IG9yIHtsLGEsYn0sXHJcblx0XHRcdFx0XHQje1xyXG5cdFx0XHRcdFx0XHR0cnlcclxuXHRcdFx0XHRcdFx0XHRcImdvdCAje0pTT04uc3RyaW5naWZ5KG9wdGlvbnMpfVwiXHJcblx0XHRcdFx0XHRcdGNhdGNoIGVcclxuXHRcdFx0XHRcdFx0XHRcImdvdCBzb21ldGhpbmcgdGhhdCBjb3VsZG4ndCBiZSBkaXNwbGF5ZWQgd2l0aCBKU09OLnN0cmluZ2lmeSBmb3IgdGhpcyBlcnJvciBtZXNzYWdlXCJcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcIlxyXG5cdFx0XHJcblx0XHJcblx0dG9TdHJpbmc6IC0+XHJcblx0XHRpZiBAcj9cclxuXHRcdFx0IyBSZWQgR3JlZW4gQmx1ZVxyXG5cdFx0XHRpZiBAYT8gIyBBbHBoYVxyXG5cdFx0XHRcdFwicmdiYSgje0ByfSwgI3tAZ30sICN7QGJ9LCAje0BhfSlcIlxyXG5cdFx0XHRlbHNlICMgT3BhcXVlXHJcblx0XHRcdFx0XCJyZ2IoI3tAcn0sICN7QGd9LCAje0BifSlcIlxyXG5cdFx0ZWxzZSBpZiBAaD9cclxuXHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBMaWdodG5lc3NcclxuXHRcdFx0IyAoQXNzdW1lIGg6MC0zNjAsIHM6MC0xMDAsIGw6MC0xMDApXHJcblx0XHRcdGlmIEBhPyAjIEFscGhhXHJcblx0XHRcdFx0XCJoc2xhKCN7QGh9LCAje0BzfSUsICN7QGx9JSwgI3tAYX0pXCJcclxuXHRcdFx0ZWxzZSAjIE9wYXF1ZVxyXG5cdFx0XHRcdFwiaHNsKCN7QGh9LCAje0BzfSUsICN7QGx9JSlcIlxyXG5cdFxyXG5cdGlzOiAoY29sb3IpLT5cclxuXHRcdCMgY29tcGFyZSBhcyBzdHJpbmdzXHJcblx0XHRcIiN7QH1cIiBpcyBcIiN7Y29sb3J9XCJcclxuIiwiXHJcbkNvbG9yID0gcmVxdWlyZSBcIi4vQ29sb3JcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG5jbGFzcyBQYWxldHRlIGV4dGVuZHMgQXJyYXlcclxuXHRcclxuXHRjb25zdHJ1Y3RvcjogKGFyZ3MuLi4pLT5cclxuXHRcdHN1cGVyKGFyZ3MuLi4pXHJcblx0XHJcblx0YWRkOiAobyktPlxyXG5cdFx0bmV3X2NvbG9yID0gbmV3IENvbG9yKG8pXHJcblx0XHRAcHVzaCBuZXdfY29sb3JcclxuXHRcclxuXHRmaW5hbGl6ZTogLT5cclxuXHRcdCMgVE9ETzogZ2V0IHRoaXMgd29ya2luZyBwcm9wZXJseSBhbmQgZW5hYmxlXHJcblx0XHQjIGlmIG5vdCBAbnVtYmVyT2ZDb2x1bW5zXHJcblx0XHQjIFx0QGd1ZXNzX2RpbWVuc2lvbnMoKVxyXG5cdFx0dW5sZXNzIEBwYXJlbnRQYWxldHRlV2l0aG91dER1cGxpY2F0ZXNcclxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzID0gbmV3IFBhbGV0dGVcclxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzLnBhcmVudFBhbGV0dGVXaXRob3V0RHVwbGljYXRlcyA9IEBcclxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzW2ldID0gQFtpXSBmb3IgaSBpbiBbMC4uLkBsZW5ndGhdXHJcblx0XHRcdEB3aXRoRHVwbGljYXRlcy5udW1iZXJPZkNvbHVtbnMgPSBAbnVtYmVyT2ZDb2x1bW5zXHJcblx0XHRcdEB3aXRoRHVwbGljYXRlcy5nZW9tZXRyeVNwZWNpZmllZEJ5RmlsZSA9IEBnZW9tZXRyeVNwZWNpZmllZEJ5RmlsZVxyXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXMuZmluYWxpemUoKVxyXG5cclxuXHRcdFx0IyBpbi1wbGFjZSB1bmlxdWlmeVxyXG5cdFx0XHRpID0gMFxyXG5cdFx0XHR3aGlsZSBpIDwgQGxlbmd0aFxyXG5cdFx0XHRcdGlfY29sb3IgPSBAW2ldXHJcblx0XHRcdFx0aiA9IGkgKyAxXHJcblx0XHRcdFx0d2hpbGUgaiA8IEBsZW5ndGhcclxuXHRcdFx0XHRcdGpfY29sb3IgPSBAW2pdXHJcblx0XHRcdFx0XHRpZiBpX2NvbG9yLmlzIGpfY29sb3JcclxuXHRcdFx0XHRcdFx0QC5zcGxpY2UoaiwgMSlcclxuXHRcdFx0XHRcdFx0aiAtPSAxXHJcblx0XHRcdFx0XHRqICs9IDFcclxuXHRcdFx0XHRpICs9IDFcclxuXHJcblx0IyMjXHJcblx0Z3Vlc3NfZGltZW5zaW9uczogLT5cclxuXHRcdCMgVE9ETzogZ2V0IHRoaXMgd29ya2luZyBwcm9wZXJseSBhbmQgZW5hYmxlXHJcblxyXG5cdFx0bGVuID0gQGxlbmd0aFxyXG5cdFx0Y2FuZGlkYXRlX2RpbWVuc2lvbnMgPSBbXVxyXG5cdFx0Zm9yIG51bWJlck9mQ29sdW1ucyBpbiBbMC4ubGVuXVxyXG5cdFx0XHRuX3Jvd3MgPSBsZW4gLyBudW1iZXJPZkNvbHVtbnNcclxuXHRcdFx0aWYgbl9yb3dzIGlzIE1hdGgucm91bmQgbl9yb3dzXHJcblx0XHRcdFx0Y2FuZGlkYXRlX2RpbWVuc2lvbnMucHVzaCBbbl9yb3dzLCBudW1iZXJPZkNvbHVtbnNdXHJcblx0XHRcclxuXHRcdHNxdWFyZXN0ID0gWzAsIDM0OTUwOTNdXHJcblx0XHRmb3IgY2QgaW4gY2FuZGlkYXRlX2RpbWVuc2lvbnNcclxuXHRcdFx0aWYgTWF0aC5hYnMoY2RbMF0gLSBjZFsxXSkgPCBNYXRoLmFicyhzcXVhcmVzdFswXSAtIHNxdWFyZXN0WzFdKVxyXG5cdFx0XHRcdHNxdWFyZXN0ID0gY2RcclxuXHRcdFxyXG5cdFx0QG51bWJlck9mQ29sdW1ucyA9IHNxdWFyZXN0WzFdXHJcblx0IyMjXHJcbiIsIlxyXG4jIERldGVjdCBDU1MgY29sb3JzIChleGNlcHQgbmFtZWQgY29sb3JzKVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbiMgVE9ETzogZGV0ZWN0IG5hbWVzIHZpYSBzdHJ1Y3R1cmVzIGxpa2UgQ1NTIHZhcmlhYmxlcywgSlNPTiBvYmplY3Qga2V5cy92YWx1ZXMsIGNvbW1lbnRzXHJcbiMgVE9ETzogdXNlIGFsbCBjb2xvcnMgcmVnYXJkbGVzcyBvZiBmb3JtYXQsIHdpdGhpbiBhIGRldGVjdGVkIHN0cnVjdHVyZSwgb3IgbWF5YmUgYWx3YXlzXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlcyA9IFtcclxuXHRcdHBhbGV0dGVfaGV4X2xvbmcgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX2hleF9zaG9ydCA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfcmdiID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9oc2wgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX2hzbGEgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX3JnYmEgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XVxyXG5cdFxyXG5cdGhleCA9ICh4KS0+IHBhcnNlSW50KHgsIDE2KVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdFxcIyAjIGhhc2h0YWcgIyAjL1xyXG5cdFx0KFxyXG5cdFx0XHRbMC05QS1GXXszfSAjIHRocmVlIGhleC1kaWdpdHMgKCNBMEMpXHJcblx0XHRcdHxcclxuXHRcdFx0WzAtOUEtRl17Nn0gIyBzaXggaGV4LWRpZ2l0cyAoI0FBMDBDQylcclxuXHRcdFx0fFxyXG5cdFx0XHRbMC05QS1GXXs0fSAjIHdpdGggYWxwaGEsIGZvdXIgaGV4LWRpZ2l0cyAoI0EwQ0YpXHJcblx0XHRcdHxcclxuXHRcdFx0WzAtOUEtRl17OH0gIyB3aXRoIGFscGhhLCBlaWdodCBoZXgtZGlnaXRzICgjQUEwMENDRkYpXHJcblx0XHQpXHJcblx0XHQoPyFbMC05QS1GXSkgIyAoYW5kIG5vIG1vcmUhKVxyXG5cdC8vL2dpbSwgKG0sICQxKS0+XHJcblx0XHRpZiAkMS5sZW5ndGggPiA0XHJcblx0XHRcdHBhbGV0dGVfaGV4X2xvbmcuYWRkXHJcblx0XHRcdFx0cjogaGV4ICQxWzBdICsgJDFbMV1cclxuXHRcdFx0XHRnOiBoZXggJDFbMl0gKyAkMVszXVxyXG5cdFx0XHRcdGI6IGhleCAkMVs0XSArICQxWzVdXHJcblx0XHRcdFx0YTogaWYgJDEubGVuZ3RoIGlzIDggdGhlbiBoZXggJDFbNl0gKyAkMVs3XSBlbHNlIDFcclxuXHRcdGVsc2VcclxuXHRcdFx0cGFsZXR0ZV9oZXhfc2hvcnQuYWRkXHJcblx0XHRcdFx0cjogaGV4ICQxWzBdICsgJDFbMF1cclxuXHRcdFx0XHRnOiBoZXggJDFbMV0gKyAkMVsxXVxyXG5cdFx0XHRcdGI6IGhleCAkMVsyXSArICQxWzJdXHJcblx0XHRcdFx0YTogaWYgJDEubGVuZ3RoIGlzIDQgdGhlbiBoZXggJDFbM10gKyAkMVszXSBlbHNlIDFcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRyZ2JcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyByZWRcclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgZ3JlZW5cclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgYmx1ZVxyXG5cdFx0XHQoJT8pXHJcblx0XHRcdFxccypcclxuXHRcdFxcKVxyXG5cdC8vL2dpbSwgKF9tLCByX3ZhbCwgcl91bml0LCBnX3ZhbCwgZ191bml0LCBiX3ZhbCwgYl91bml0KS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0cjogTnVtYmVyKHJfdmFsKSAqIChpZiByX3VuaXQgaXMgXCIlXCIgdGhlbiAyNTUvMTAwIGVsc2UgMSlcclxuXHRcdFx0ZzogTnVtYmVyKGdfdmFsKSAqIChpZiBnX3VuaXQgaXMgXCIlXCIgdGhlbiAyNTUvMTAwIGVsc2UgMSlcclxuXHRcdFx0YjogTnVtYmVyKGJfdmFsKSAqIChpZiBiX3VuaXQgaXMgXCIlXCIgdGhlbiAyNTUvMTAwIGVsc2UgMSlcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRyZ2JhP1xcKFxyXG5cdFx0XHRcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHJlZFxyXG5cdFx0XHQoJT8pXHJcblx0XHRcXHMqKD86LHxcXHMpXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBncmVlblxyXG5cdFx0XHQoJT8pXHJcblx0XHRcXHMqKD86LHxcXHMpXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBibHVlXHJcblx0XHRcdCglPylcclxuXHRcdFxccyooPzosfC8pXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBhbHBoYVxyXG5cdFx0XHQoJT8pXHJcblx0XHRcdFxccypcclxuXHRcdFxcKVxyXG5cdC8vL2dpbSwgKF9tLCByX3ZhbCwgcl91bml0LCBnX3ZhbCwgZ191bml0LCBiX3ZhbCwgYl91bml0LCBhX3ZhbCwgYV91bml0KS0+XHJcblx0XHRwYWxldHRlX3JnYmEuYWRkXHJcblx0XHRcdHI6IE51bWJlcihyX3ZhbCkgKiAoaWYgcl91bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXHJcblx0XHRcdGc6IE51bWJlcihnX3ZhbCkgKiAoaWYgZ191bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXHJcblx0XHRcdGI6IE51bWJlcihiX3ZhbCkgKiAoaWYgYl91bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXHJcblx0XHRcdGE6IE51bWJlcihhX3ZhbCkgKiAoaWYgYV91bml0IGlzIFwiJVwiIHRoZW4gMS8xMDAgZWxzZSAxKVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdGhzbFxcKFxyXG5cdFx0XHRcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGh1ZVxyXG5cdFx0XHQoZGVnfHJhZHx0dXJufClcclxuXHRcdFxccyooPzosfFxccylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHNhdHVyYXRpb25cclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgdmFsdWVcclxuXHRcdFx0KCU/KVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChfbSwgaF92YWwsIGhfdW5pdCwgc192YWwsIHNfdW5pdCwgbF92YWwsIGxfdW5pdCktPlxyXG5cdFx0cGFsZXR0ZV9oc2wuYWRkXHJcblx0XHRcdGg6IE51bWJlcihoX3ZhbCkgKiAoaWYgaF91bml0IGlzIFwicmFkXCIgdGhlbiAxODAvTWF0aC5QSSBlbHNlIGlmIGhfdW5pdCBpcyBcInR1cm5cIiB0aGVuIDM2MCBlbHNlIDEpXHJcblx0XHRcdHM6IE51bWJlcihzX3ZhbCkgKiAoaWYgc191bml0IGlzIFwiJVwiIHRoZW4gMSBlbHNlIDEwMClcclxuXHRcdFx0bDogTnVtYmVyKGxfdmFsKSAqIChpZiBsX3VuaXQgaXMgXCIlXCIgdGhlbiAxIGVsc2UgMTAwKVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdGhzbGE/XFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgaHVlXHJcblx0XHRcdChkZWd8cmFkfHR1cm58KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgc2F0dXJhdGlvblxyXG5cdFx0XHQoJT8pXHJcblx0XHRcXHMqKD86LHxcXHMpXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyB2YWx1ZVxyXG5cdFx0XHQoJT8pXHJcblx0XHRcXHMqKD86LHwvKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgYWxwaGFcclxuXHRcdFx0KCU/KVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChfbSwgaF92YWwsIGhfdW5pdCwgc192YWwsIHNfdW5pdCwgbF92YWwsIGxfdW5pdCwgYV92YWwsIGFfdW5pdCktPlxyXG5cdFx0cGFsZXR0ZV9oc2xhLmFkZFxyXG5cdFx0XHRoOiBOdW1iZXIoaF92YWwpICogKGlmIGhfdW5pdCBpcyBcInJhZFwiIHRoZW4gMTgwL01hdGguUEkgZWxzZSBpZiBoX3VuaXQgaXMgXCJ0dXJuXCIgdGhlbiAzNjAgZWxzZSAxKVxyXG5cdFx0XHRzOiBOdW1iZXIoc192YWwpICogKGlmIHNfdW5pdCBpcyBcIiVcIiB0aGVuIDEgZWxzZSAxMDApXHJcblx0XHRcdGw6IE51bWJlcihsX3ZhbCkgKiAoaWYgbF91bml0IGlzIFwiJVwiIHRoZW4gMSBlbHNlIDEwMClcclxuXHRcdFx0YTogTnVtYmVyKGFfdmFsKSAqIChpZiBhX3VuaXQgaXMgXCIlXCIgdGhlbiAxLzEwMCBlbHNlIDEpXHJcblx0XHJcblx0bW9zdF9jb2xvcnMgPSBbXVxyXG5cdGZvciBwYWxldHRlIGluIHBhbGV0dGVzXHJcblx0XHRpZiBwYWxldHRlLmxlbmd0aCA+PSBtb3N0X2NvbG9ycy5sZW5ndGhcclxuXHRcdFx0bW9zdF9jb2xvcnMgPSBwYWxldHRlXHJcblx0XHJcblx0biA9IG1vc3RfY29sb3JzLmxlbmd0aFxyXG5cdGlmIG4gPCA0XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoW1xyXG5cdFx0XHRcIk5vIGNvbG9ycyBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBvbmUgY29sb3IgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgYSBjb3VwbGUgY29sb3JzIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IGEgZmV3IGNvbG9ycyBmb3VuZFwiXHJcblx0XHRdW25dICsgXCIgKCN7bn0pXCIpXHJcblx0XHJcblx0bW9zdF9jb2xvcnNcclxuIiwiXHJcbiMgTG9hZCBhIENvbG9yU2NoZW1lciBwYWxldHRlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0dmVyc2lvbiA9IGJyLnJlYWRVSW50MTYoKSAjIG9yIHNvbWV0aGluZ1xyXG5cdGxlbmd0aCA9IGJyLnJlYWRVSW50MTYoKVxyXG5cdGkgPSAwXHJcblx0d2hpbGUgaSA8IGxlbmd0aFxyXG5cdFx0YnIuc2Vlayg4ICsgaSAqIDI2KVxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdGkgKz0gMVxyXG5cclxuXHRwYWxldHRlXHJcblxyXG4iLCJcclxuIyBMb2FkIGEgR0lNUCBwYWxldHRlXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxucGFyc2VfZ2ltcF9vcl9rZGVfcmdiX3BhbGV0dGUgPSAoZGF0YSwgZm9ybWF0X25hbWUpLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdGlmIGxpbmVzWzBdIGlzbnQgZm9ybWF0X25hbWVcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhICN7Zm9ybWF0X25hbWV9XCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGkgPSAwXHJcblx0IyBzdGFydHMgYXQgaSA9IDEgYmVjYXVzZSB0aGUgaW5jcmVtZW50IGhhcHBlbnMgYXQgdGhlIHN0YXJ0IG9mIHRoZSBsb29wXHJcblx0d2hpbGUgKGkgKz0gMSkgPCBsaW5lcy5sZW5ndGhcclxuXHRcdGxpbmUgPSBsaW5lc1tpXVxyXG5cdFx0XHJcblx0XHRpZiBsaW5lWzBdIGlzIFwiI1wiIG9yIGxpbmUgaXMgXCJcIiB0aGVuIGNvbnRpbnVlXHJcblx0XHQjIFRPRE86IGhhbmRsZSBub24tc3RhcnQtb2YtbGluZSBjb21tZW50cz8gd2hlcmUncyB0aGUgc3BlYz9cclxuXHRcdFxyXG5cdFx0bSA9IGxpbmUubWF0Y2goL05hbWU6XFxzKiguKikvKVxyXG5cdFx0aWYgbVxyXG5cdFx0XHRwYWxldHRlLm5hbWUgPSBtWzFdXHJcblx0XHRcdGNvbnRpbnVlXHJcblx0XHRtID0gbGluZS5tYXRjaCgvQ29sdW1uczpcXHMqKC4qKS8pXHJcblx0XHRpZiBtXHJcblx0XHRcdHBhbGV0dGUubnVtYmVyT2ZDb2x1bW5zID0gTnVtYmVyKG1bMV0pXHJcblx0XHRcdCMgVE9ETzogaGFuZGxlIDAgYXMgbm90IHNwZWNpZmllZD8gd2hlcmUncyB0aGUgc3BlYyBhdCwgeW8/XHJcblx0XHRcdHBhbGV0dGUuZ2VvbWV0cnlTcGVjaWZpZWRCeUZpbGUgPSB5ZXNcclxuXHRcdFx0Y29udGludWVcclxuXHRcdFxyXG5cdFx0IyBUT0RPOiByZXBsYWNlIFxccyB3aXRoIFtcXCBcXHRdIChzcGFjZXMgb3IgdGFicylcclxuXHRcdCMgaXQgY2FuJ3QgbWF0Y2ggXFxuIGJlY2F1c2UgaXQncyBhbHJlYWR5IHNwbGl0IG9uIHRoYXQsIGJ1dCBzdGlsbFxyXG5cdFx0IyBUT0RPOiBoYW5kbGUgbGluZSB3aXRoIG5vIG5hbWUgYnV0IHNwYWNlIG9uIHRoZSBlbmRcclxuXHRcdHJfZ19iX25hbWUgPSBsaW5lLm1hdGNoKC8vL1xyXG5cdFx0XHReICMgXCJhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaW5lLFwiXHJcblx0XHRcdFxccyogIyBcImdpdmUgb3IgdGFrZSBzb21lIHNwYWNlcyxcIlxyXG5cdFx0XHQjIG1hdGNoIDMgZ3JvdXBzIG9mIG51bWJlcnMgc2VwYXJhdGVkIGJ5IHNwYWNlc1xyXG5cdFx0XHQoWzAtOV0rKSAjIHJlZFxyXG5cdFx0XHRcXHMrXHJcblx0XHRcdChbMC05XSspICMgZ3JlZW5cclxuXHRcdFx0XFxzK1xyXG5cdFx0XHQoWzAtOV0rKSAjIGJsdWVcclxuXHRcdFx0KD86XHJcblx0XHRcdFx0XFxzK1xyXG5cdFx0XHRcdCguKikgIyBvcHRpb25hbGx5IGEgbmFtZVxyXG5cdFx0XHQpP1xyXG5cdFx0XHQkICMgXCJhbmQgdGhhdCBzaG91bGQgYmUgdGhlIGVuZCBvZiB0aGUgbGluZVwiXHJcblx0XHQvLy8pXHJcblx0XHRpZiBub3Qgcl9nX2JfbmFtZVxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJMaW5lICN7aX0gZG9lc24ndCBtYXRjaCBwYXR0ZXJuICN7cl9nX2JfbmFtZX1cIiAjIFRPRE86IGJldHRlciBtZXNzYWdlP1xyXG5cdFx0XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiByX2dfYl9uYW1lWzFdXHJcblx0XHRcdGc6IHJfZ19iX25hbWVbMl1cclxuXHRcdFx0Yjogcl9nX2JfbmFtZVszXVxyXG5cdFx0XHRuYW1lOiByX2dfYl9uYW1lWzRdXHJcblx0XHRcclxuXHRwYWxldHRlXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRwYXJzZV9naW1wX29yX2tkZV9yZ2JfcGFsZXR0ZShkYXRhLCBcIkdJTVAgUGFsZXR0ZVwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMucGFyc2VfZ2ltcF9vcl9rZGVfcmdiX3BhbGV0dGUgPSBwYXJzZV9naW1wX29yX2tkZV9yZ2JfcGFsZXR0ZVxyXG4iLCJcclxuIyBXaGF0IGRvZXMgSFBMIHN0YW5kIGZvcj9cclxuIyBIb3dkeSwgUGFsZXR0ZSBMb3ZlcnMhXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IFwiUGFsZXR0ZVwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYW4gSFBMIHBhbGV0dGVcIlxyXG5cdGlmIG5vdCBsaW5lc1sxXS5tYXRjaCAvVmVyc2lvbiBbMzRdXFwuMC9cclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVuc3VwcG9ydGVkIEhQTCB2ZXJzaW9uXCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdFxyXG5cdGZvciBsaW5lLCBpIGluIGxpbmVzXHJcblx0XHRpZiBsaW5lLm1hdGNoIC8uKyAuKiAuKy9cclxuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcclxuXHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRyOiByZ2JbMF1cclxuXHRcdFx0XHRnOiByZ2JbMV1cclxuXHRcdFx0XHRiOiByZ2JbMl1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG57cGFyc2VfZ2ltcF9vcl9rZGVfcmdiX3BhbGV0dGV9ID0gcmVxdWlyZSBcIi4vR0lNUFwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRwYXJzZV9naW1wX29yX2tkZV9yZ2JfcGFsZXR0ZShkYXRhLCBcIktERSBSR0IgUGFsZXR0ZVwiKVxyXG4iLCJcclxuIyBMb2FkIGEgUGFpbnQuTkVUIHBhbGV0dGUgZmlsZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdFxyXG5cdGhleCA9ICh4KS0+IHBhcnNlSW50KHgsIDE2KVxyXG5cdFxyXG5cdGZvciBsaW5lIGluIGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdFx0bSA9IGxpbmUubWF0Y2goL14oWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pJC9pKVxyXG5cdFx0aWYgbSB0aGVuIHBhbGV0dGUuYWRkXHJcblx0XHRcdGE6IGhleCBtWzFdXHJcblx0XHRcdHI6IGhleCBtWzJdXHJcblx0XHRcdGc6IGhleCBtWzNdXHJcblx0XHRcdGI6IGhleCBtWzRdXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBMb2FkIGEgSkFTQyBQQUwgZmlsZSAoUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZSBmaWxlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdGlmIGxpbmVzWzBdIGlzbnQgXCJKQVNDLVBBTFwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYSBKQVNDLVBBTFwiXHJcblx0aWYgbGluZXNbMV0gaXNudCBcIjAxMDBcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiVW5rbm93biBKQVNDLVBBTCB2ZXJzaW9uXCJcclxuXHRpZiBsaW5lc1syXSBpc250IFwiMjU2XCJcclxuXHRcdFwidGhhdCdzIG9rXCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdCNuX2NvbG9ycyA9IE51bWJlcihsaW5lc1syXSlcclxuXHRcclxuXHRmb3IgbGluZSwgaSBpbiBsaW5lc1xyXG5cdFx0aWYgbGluZSBpc250IFwiXCIgYW5kIGkgPiAyXHJcblx0XHRcdHJnYiA9IGxpbmUuc3BsaXQoXCIgXCIpXHJcblx0XHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdFx0cjogcmdiWzBdXHJcblx0XHRcdFx0ZzogcmdiWzFdXHJcblx0XHRcdFx0YjogcmdiWzJdXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBMb2FkIGEgUmVzb3VyY2UgSW50ZXJjaGFuZ2UgRmlsZSBGb3JtYXQgUEFMIGZpbGVcclxuXHJcbiMgcG9ydGVkIGZyb20gQyMgY29kZSBhdCBodHRwczovL3dvcm1zMmQuaW5mby9QYWxldHRlX2ZpbGVcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0IyBSSUZGIGhlYWRlclxyXG5cdHJpZmYgPSBici5yZWFkU3RyaW5nKDQpICMgXCJSSUZGXCJcclxuXHRkYXRhU2l6ZSA9IGJyLnJlYWRVSW50MzIoKVxyXG5cdHR5cGUgPSBici5yZWFkU3RyaW5nKDQpICMgXCJQQUwgXCJcclxuXHRcclxuXHRpZiByaWZmIGlzbnQgXCJSSUZGXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlJJRkYgaGVhZGVyIG5vdCBmb3VuZDsgbm90IGEgUklGRiBQQUwgZmlsZVwiXHJcblx0XHJcblx0aWYgdHlwZSBpc250IFwiUEFMIFwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJcIlwiXHJcblx0XHRcdFJJRkYgaGVhZGVyIHNheXMgdGhpcyBpc24ndCBhIFBBTCBmaWxlLFxyXG5cdFx0XHRtb3JlIG9mIGEgc29ydCBvZiAjeygodHlwZStcIlwiKS50cmltKCkpfSBmaWxlXHJcblx0XHRcIlwiXCJcclxuXHRcclxuXHQjIERhdGEgY2h1bmtcclxuXHRjaHVua1R5cGUgPSBici5yZWFkU3RyaW5nKDQpICMgXCJkYXRhXCJcclxuXHRjaHVua1NpemUgPSBici5yZWFkVUludDMyKClcclxuXHRwYWxWZXJzaW9uID0gYnIucmVhZFVJbnQxNigpICMgMHgwMzAwXHJcblx0cGFsTnVtRW50cmllcyA9IGJyLnJlYWRVSW50MTYoKVxyXG5cdFxyXG5cdFxyXG5cdGlmIGNodW5rVHlwZSBpc250IFwiZGF0YVwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJEYXRhIGNodW5rIG5vdCBmb3VuZCAoLi4uJyN7Y2h1bmtUeXBlfSc/KVwiXHJcblx0XHJcblx0aWYgcGFsVmVyc2lvbiBpc250IDB4MDMwMFxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiVW5zdXBwb3J0ZWQgUEFMIGZpbGUgZm9ybWF0IHZlcnNpb246IDB4I3twYWxWZXJzaW9uLnRvU3RyaW5nKDE2KX1cIlxyXG5cdFxyXG5cdCMgQ29sb3JzXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRpID0gMFxyXG5cdHdoaWxlIChpICs9IDEpIDwgcGFsTnVtRW50cmllcyAtIDFcclxuXHRcdFxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0XzogYnIucmVhZEJ5dGUoKSAjIFwiZmxhZ3NcIiwgYWx3YXlzIDB4MDBcclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIiMgTG9hZCBzSzEgcGFsZXR0ZXNcclxuIyBUaGVzZSBmaWxlcyBhcmUgYWN0dWFsbHkgcHl0aG9uaWMsIGJ1dCBsZXQncyBqdXN0IHRyeSB0byBwYXJzZSB0aGVtIGluIGEgYmFzaWMsIG5vbi1nZW5lcmFsIHdheVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZVxyXG5cclxuXHRmbnMgPVxyXG5cdFx0c2V0X25hbWU6IChuYW1lKS0+IHBhbGV0dGUubmFtZSA9IG5hbWVcclxuXHRcdGFkZF9jb21tZW50czogKGxpbmUpLT5cclxuXHRcdFx0cGFsZXR0ZS5kZXNjcmlwdGlvbiA/PSBcIlwiXHJcblx0XHRcdHBhbGV0dGUuZGVzY3JpcHRpb24gKz0gbGluZSArIFwiXFxuXCJcclxuXHRcdHNldF9jb2x1bW5zOiAoY29sdW1uc19zdHIpLT5cclxuXHRcdFx0cGFsZXR0ZS5udW1iZXJPZkNvbHVtbnMgPSBwYXJzZUludChjb2x1bW5zX3N0cilcclxuXHRcdGNvbG9yOiAoY29sb3JfZGVmX3N0ciktPlxyXG5cdFx0XHRjb2xvcl9kZWYgPSBKU09OLnBhcnNlKGNvbG9yX2RlZl9zdHIucmVwbGFjZSgvXFxidShbJ1wiXSkvZywgXCIkMVwiKS5yZXBsYWNlKC8nL2csICdcIicpKVxyXG5cdFx0XHRbY29sb3JfdHlwZSwgY29tcG9uZW50cywgYWxwaGEsIG5hbWVdID0gY29sb3JfZGVmXHJcblx0XHRcdHN3aXRjaCBjb2xvcl90eXBlXHJcblx0XHRcdFx0d2hlbiBcIlJHQlwiXHJcblx0XHRcdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdFx0XHRyOiBjb21wb25lbnRzWzBdICogMjU1XHJcblx0XHRcdFx0XHRcdGc6IGNvbXBvbmVudHNbMV0gKiAyNTVcclxuXHRcdFx0XHRcdFx0YjogY29tcG9uZW50c1syXSAqIDI1NVxyXG5cdFx0XHRcdFx0XHRhOiBhbHBoYVxyXG5cdFx0XHRcdHdoZW4gXCJHcmF5c2NhbGVcIlxyXG5cdFx0XHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRcdFx0cjogY29tcG9uZW50c1swXSAqIDI1NVxyXG5cdFx0XHRcdFx0XHRnOiBjb21wb25lbnRzWzBdICogMjU1XHJcblx0XHRcdFx0XHRcdGI6IGNvbXBvbmVudHNbMF0gKiAyNTVcclxuXHRcdFx0XHRcdFx0YTogYWxwaGFcclxuXHRcdFx0XHR3aGVuIFwiQ01ZS1wiXHJcblx0XHRcdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdFx0XHRjOiBjb21wb25lbnRzWzBdICogMTAwXHJcblx0XHRcdFx0XHRcdG06IGNvbXBvbmVudHNbMV0gKiAxMDBcclxuXHRcdFx0XHRcdFx0eTogY29tcG9uZW50c1syXSAqIDEwMFxyXG5cdFx0XHRcdFx0XHRrOiBjb21wb25lbnRzWzNdICogMTAwXHJcblx0XHRcdFx0XHRcdGE6IGFscGhhXHJcblx0XHRcdFx0d2hlbiBcIkhTTFwiXHJcblx0XHRcdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdFx0XHRoOiBjb21wb25lbnRzWzBdICogMzYwXHJcblx0XHRcdFx0XHRcdHM6IGNvbXBvbmVudHNbMV0gKiAxMDBcclxuXHRcdFx0XHRcdFx0bDogY29tcG9uZW50c1syXSAqIDEwMFxyXG5cdFx0XHRcdFx0XHRhOiBhbHBoYVxyXG5cdFxyXG5cdGZvciBsaW5lIGluIGxpbmVzXHJcblx0XHRtYXRjaCA9IGxpbmUubWF0Y2goLyhbXFx3X10rKVxcKCguKilcXCkvKVxyXG5cdFx0aWYgbWF0Y2hcclxuXHRcdFx0W18sIGZuX25hbWUsIGFyZ3Nfc3RyXSA9IG1hdGNoXHJcblx0XHRcdGZuc1tmbl9uYW1lXT8oYXJnc19zdHIpXHJcblxyXG5cdG4gPSBwYWxldHRlLmxlbmd0aFxyXG5cdGlmIG4gPCAyXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoW1xyXG5cdFx0XHRcIk5vIGNvbG9ycyBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBvbmUgY29sb3IgZm91bmRcIlxyXG5cdFx0XVtuXSArIFwiICgje259KVwiKVxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIFNrZW5jaWwgcGFsZXR0ZSAoLnNwbCkgKFwiU2tldGNoIFJHQlBhbGV0dGVcIilcclxuIyAobm90IHJlbGF0ZWQgdG8gLnNrZXRjaHBhbGV0dGUgU2tldGNoIEFwcCBwYWxldHRlIGZvcm1hdClcclxuXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0aSA9IDFcclxuXHR3aGlsZSAoaSArPSAxKSA8IGxpbmVzLmxlbmd0aFxyXG5cdFx0bGluZSA9IGxpbmVzW2ldXHJcblx0XHRcclxuXHRcdGlmIGxpbmVbMF0gaXMgXCIjXCIgb3IgbGluZSBpcyBcIlwiIHRoZW4gY29udGludWVcclxuXHRcdCMgVE9ETzogaGFuZGxlIG5vbi1zdGFydC1vZi1saW5lIGNvbW1lbnRzPyB3aGVyZSdzIHRoZSBzcGVjP1xyXG5cdFx0XHJcblx0XHQjIFRPRE86IHJlcGxhY2UgXFxzIHdpdGggW1xcIFxcdF0gKHNwYWNlcyBvciB0YWJzKVxyXG5cdFx0IyBpdCBjYW4ndCBtYXRjaCBcXG4gYmVjYXVzZSBpdCdzIGFscmVhZHkgc3BsaXQgb24gdGhhdCwgYnV0IHN0aWxsXHJcblx0XHQjIFRPRE86IGhhbmRsZSBsaW5lIHdpdGggbm8gbmFtZSBidXQgc3BhY2Ugb24gdGhlIGVuZFxyXG5cdFx0cl9nX2JfbmFtZSA9IGxpbmUubWF0Y2goLy8vXHJcblx0XHRcdF4gIyBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaW5lLFxyXG5cdFx0XHRcXHMqICMgcGVyaGFwcyB3aXRoIHNvbWUgbGVhZGluZyBzcGFjZXNcclxuXHRcdFx0IyBtYXRjaCAzIGdyb3VwcyBvZiBudW1iZXJzIHNlcGFyYXRlZCBieSBzcGFjZXNcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgcmVkXHJcblx0XHRcdFxccytcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgZ3JlZW5cclxuXHRcdFx0XFxzK1xyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBibHVlXHJcblx0XHRcdCg/OlxyXG5cdFx0XHRcdFxccytcclxuXHRcdFx0XHQoLiopICMgb3B0aW9uYWxseSBhIG5hbWVcclxuXHRcdFx0KT9cclxuXHRcdFx0JCAjIFwiYW5kIHRoYXQgc2hvdWxkIGJlIHRoZSBlbmQgb2YgdGhlIGxpbmVcIlxyXG5cdFx0Ly8vKVxyXG5cdFx0aWYgbm90IHJfZ19iX25hbWVcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiTGluZSAje2l9IGRvZXNuJ3QgbWF0Y2ggcGF0dGVybiAje3JfZ19iX25hbWV9XCIgIyBUT0RPOiBiZXR0ZXIgbWVzc2FnZT9cclxuXHRcdFxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogcl9nX2JfbmFtZVsxXSAqIDI1NVxyXG5cdFx0XHRnOiByX2dfYl9uYW1lWzJdICogMjU1XHJcblx0XHRcdGI6IHJfZ19iX25hbWVbM10gKiAyNTVcclxuXHRcdFx0bmFtZTogcl9nX2JfbmFtZVs0XVxyXG5cdFx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBQQUwgKFN0YXJDcmFmdCByYXcgcGFsZXR0ZSlcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHRpZiBici5nZXRTaXplKCkgaXNudCA3NjhcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIldyb25nIGZpbGUgc2l6ZSwgbXVzdCBiZSAjezc2OH0gYnl0ZXMgbG9uZyAobm90ICN7YnIuZ2V0U2l6ZSgpfSlcIlxyXG5cdFxyXG5cdGZvciBpIGluIFswLi4uMjU1XVxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0Izogbm8gcGFkZGluZ1xyXG5cdFxyXG5cdCM/IHBhbGV0dGUubnVtYmVyT2ZDb2x1bW5zID0gMTZcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIFdQRSAoU3RhckNyYWZ0IHBhZGRlZCByYXcgcGFsZXR0ZSlcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHRpZiBici5nZXRTaXplKCkgaXNudCAxMDI0XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJXcm9uZyBmaWxlIHNpemUsIG11c3QgYmUgI3sxMDI0fSBieXRlcyBsb25nIChub3QgI3tici5nZXRTaXplKCl9KVwiXHJcblx0XHJcblx0Zm9yIGkgaW4gWzAuLi4yNTVdXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRfOiBici5yZWFkQnl0ZSgpICMgcGFkZGluZ1xyXG5cdFxyXG5cdHBhbGV0dGUubnVtYmVyT2ZDb2x1bW5zID0gMTZcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBTa2V0Y2ggQXBwIEpTT04gcGFsZXR0ZSAoLnNrZXRjaHBhbGV0dGUpXHJcbiMgKG5vdCByZWxhdGVkIHRvIC5zcGwgU2tldGNoIFJHQiBwYWxldHRlIGZvcm1hdClcclxuXHJcbiMgYmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2FuZHJld2Zpb3JpbGxvL3NrZXRjaC1wYWxldHRlcy9ibG9iLzViNmJmYTZlYjI1Y2IzMjQ0YTllNmEyMjZkZjI1OWU4ZmIzMWZjMmMvU2tldGNoJTIwUGFsZXR0ZXMuc2tldGNocGx1Z2luL0NvbnRlbnRzL1NrZXRjaC9za2V0Y2hQYWxldHRlcy5qc1xyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbnZlcnNpb24gPSAxLjRcclxuXHJcbiMgVE9ETzogRFJZIHdpdGggQ1NTLmNvZmZlZVxyXG5wYXJzZV9jc3NfaGV4X2NvbG9yID0gKGhleF9jb2xvciktPlxyXG5cdGhleCA9ICh4KS0+IHBhcnNlSW50KHgsIDE2KVxyXG5cdFxyXG5cdG1hdGNoID0gaGV4X2NvbG9yLm1hdGNoKC8vL1xyXG5cdFx0XFwjICMgaGFzaHRhZyAjICMvXHJcblx0XHQoXHJcblx0XHRcdFswLTlBLUZdezN9ICMgdGhyZWUgaGV4LWRpZ2l0cyAoI0EwQylcclxuXHRcdFx0fFxyXG5cdFx0XHRbMC05QS1GXXs2fSAjIHNpeCBoZXgtZGlnaXRzICgjQUEwMENDKVxyXG5cdFx0XHR8XHJcblx0XHRcdFswLTlBLUZdezR9ICMgd2l0aCBhbHBoYSwgZm91ciBoZXgtZGlnaXRzICgjQTBDRilcclxuXHRcdFx0fFxyXG5cdFx0XHRbMC05QS1GXXs4fSAjIHdpdGggYWxwaGEsIGVpZ2h0IGhleC1kaWdpdHMgKCNBQTAwQ0NGRilcclxuXHRcdClcclxuXHRcdCg/IVswLTlBLUZdKSAjIChhbmQgbm8gbW9yZSEpXHJcblx0Ly8vZ2ltKVxyXG5cclxuXHRbJDAsICQxXSA9IG1hdGNoXHJcblxyXG5cdGlmICQxLmxlbmd0aCA+IDRcclxuXHRcdHI6IGhleCAkMVswXSArICQxWzFdXHJcblx0XHRnOiBoZXggJDFbMl0gKyAkMVszXVxyXG5cdFx0YjogaGV4ICQxWzRdICsgJDFbNV1cclxuXHRcdGE6IGlmICQxLmxlbmd0aCBpcyA4IHRoZW4gaGV4ICQxWzZdICsgJDFbN10gZWxzZSAxXHJcblx0ZWxzZVxyXG5cdFx0cjogaGV4ICQxWzBdICsgJDFbMF1cclxuXHRcdGc6IGhleCAkMVsxXSArICQxWzFdXHJcblx0XHRiOiBoZXggJDFbMl0gKyAkMVsyXVxyXG5cdFx0YTogaWYgJDEubGVuZ3RoIGlzIDQgdGhlbiBoZXggJDFbM10gKyAkMVszXSBlbHNlIDFcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGlmIG5vdCBkYXRhLm1hdGNoKC9eXFxzKnsvKVxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwibm90IHNrZXRjaHBhbGV0dGUgSlNPTlwiXHJcblx0cGFsZXR0ZUNvbnRlbnRzID0gSlNPTi5wYXJzZShkYXRhKVxyXG5cclxuXHRjb21wYXRpYmxlVmVyc2lvbiA9IHBhbGV0dGVDb250ZW50cy5jb21wYXRpYmxlVmVyc2lvblxyXG5cclxuXHQjIENoZWNrIGZvciBwcmVzZXRzIGluIGZpbGUsIGVsc2Ugc2V0IHRvIGVtcHR5IGFycmF5XHJcblx0Y29sb3JEZWZpbml0aW9ucyA9IHBhbGV0dGVDb250ZW50cy5jb2xvcnMgPyBbXVxyXG5cdGdyYWRpZW50RGVmaW5pdGlvbnMgPSBwYWxldHRlQ29udGVudHMuZ3JhZGllbnRzID8gW11cclxuXHRpbWFnZURlZmluaXRpb25zID0gcGFsZXR0ZUNvbnRlbnRzLmltYWdlcyA/IFtdXHJcblx0Y29sb3JBc3NldHMgPSBbXVxyXG5cdGdyYWRpZW50QXNzZXRzID0gW11cclxuXHRpbWFnZXMgPSBbXVxyXG5cclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGVcclxuXHJcblx0IyBDaGVjayBpZiBwbHVnaW4gaXMgb3V0IG9mIGRhdGUgYW5kIGluY29tcGF0aWJsZSB3aXRoIGEgbmV3ZXIgcGFsZXR0ZSB2ZXJzaW9uXHJcblx0aWYgY29tcGF0aWJsZVZlcnNpb24gYW5kIGNvbXBhdGlibGVWZXJzaW9uID4gdmVyc2lvblxyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgaGFuZGxlIGNvbXBhdGlibGVWZXJzaW9uIG9mICN7Y29tcGF0aWJsZVZlcnNpb259LlwiKVxyXG5cdFx0cmV0dXJuXHJcblxyXG5cdCMgQ2hlY2sgZm9yIG9sZGVyIGhleCBjb2RlIHBhbGV0dGUgdmVyc2lvblxyXG5cdGlmIG5vdCBjb21wYXRpYmxlVmVyc2lvbiBvciBjb21wYXRpYmxlVmVyc2lvbiA8IDEuNFxyXG5cdFx0IyBDb252ZXJ0IGhleCBjb2xvcnNcclxuXHRcdGZvciBoZXhfY29sb3IgaW4gY29sb3JEZWZpbml0aW9uc1xyXG5cdFx0XHRwYWxldHRlLmFkZChwYXJzZV9jc3NfaGV4X2NvbG9yKGhleF9jb2xvcikpXHJcblx0ZWxzZVxyXG5cdFx0IyBDb2xvciBGaWxsczogY29udmVydCByZ2JhIGNvbG9yc1xyXG5cdFx0aWYgY29sb3JEZWZpbml0aW9ucy5sZW5ndGggPiAwXHJcblx0XHRcdGZvciBjb2xvcl9kZWZpbml0aW9uIGluIGNvbG9yRGVmaW5pdGlvbnNcclxuXHRcdFx0XHRwYWxldHRlLmFkZChcclxuXHRcdFx0XHRcdHI6IGNvbG9yX2RlZmluaXRpb24ucmVkICogMjU1XHJcblx0XHRcdFx0XHRnOiBjb2xvcl9kZWZpbml0aW9uLmdyZWVuICogMjU1XHJcblx0XHRcdFx0XHRiOiBjb2xvcl9kZWZpbml0aW9uLmJsdWUgKiAyNTVcclxuXHRcdFx0XHRcdGE6IGNvbG9yX2RlZmluaXRpb24uYWxwaGEgKiAyNTVcclxuXHRcdFx0XHRcdG5hbWU6IGNvbG9yX2RlZmluaXRpb24ubmFtZVxyXG5cdFx0XHRcdClcclxuXHJcblx0XHQjICMgUGF0dGVybiBGaWxsczogY29udmVydCBiYXNlNjQgc3RyaW5ncyB0byBNU0ltYWdlRGF0YSBvYmplY3RzXHJcblx0XHQjIGlmIGltYWdlRGVmaW5pdGlvbnMubGVuZ3RoID4gMFxyXG5cdFx0IyBcdGZvciBpIGluIFswLi5pbWFnZURlZmluaXRpb25zLmxlbmd0aF1cclxuXHRcdCMgXHRcdG5zZGF0YSA9IE5TRGF0YS5hbGxvYygpLmluaXRXaXRoQmFzZTY0RW5jb2RlZFN0cmluZ19vcHRpb25zKGltYWdlRGVmaW5pdGlvbnNbaV0uZGF0YSwgMClcclxuXHRcdCMgXHRcdG5zaW1hZ2UgPSBOU0ltYWdlLmFsbG9jKCkuaW5pdFdpdGhEYXRhKG5zZGF0YSlcclxuXHRcdCMgXHRcdCMgbXNpbWFnZSA9IE1TSW1hZ2VEYXRhLmFsbG9jKCkuaW5pdFdpdGhJbWFnZUNvbnZlcnRpbmdDb2xvclNwYWNlKG5zaW1hZ2UpXHJcblx0XHQjIFx0XHRtc2ltYWdlID0gTVNJbWFnZURhdGEuYWxsb2MoKS5pbml0V2l0aEltYWdlKG5zaW1hZ2UpXHJcblx0XHQjIFx0XHRpbWFnZXMucHVzaChtc2ltYWdlKVxyXG5cclxuXHRcdCMgIyBHcmFkaWVudCBGaWxsczogYnVpbGQgTVNHcmFkaWVudFN0b3AgYW5kIE1TR3JhZGllbnQgb2JqZWN0c1xyXG5cdFx0IyBpZiBncmFkaWVudERlZmluaXRpb25zLmxlbmd0aCA+IDBcclxuXHRcdCMgXHRmb3IgaSBpbiBbMC4uZ3JhZGllbnREZWZpbml0aW9ucy5sZW5ndGhdXHJcblx0XHQjIFx0XHQjIENyZWF0ZSBncmFkaWVudCBzdG9wc1xyXG5cdFx0IyBcdFx0Z3JhZGllbnQgPSBncmFkaWVudERlZmluaXRpb25zW2ldXHJcblx0XHQjIFx0XHRzdG9wcyA9IFtdXHJcblx0XHQjIFx0XHRmb3IgaiBpbiBbMC4uZ3JhZGllbnQuc3RvcHNdXHJcblx0XHQjIFx0XHRcdGNvbG9yID0gTVNDb2xvci5jb2xvcldpdGhSZWRfZ3JlZW5fYmx1ZV9hbHBoYShcclxuXHRcdCMgXHRcdFx0XHRncmFkaWVudC5zdG9wc1tqXS5jb2xvci5yZWQsXHJcblx0XHQjIFx0XHRcdFx0Z3JhZGllbnQuc3RvcHNbal0uY29sb3IuZ3JlZW4sXHJcblx0XHQjIFx0XHRcdFx0Z3JhZGllbnQuc3RvcHNbal0uY29sb3IuYmx1ZSxcclxuXHRcdCMgXHRcdFx0XHRncmFkaWVudC5zdG9wc1tqXS5jb2xvci5hbHBoYVxyXG5cdFx0IyBcdFx0XHQpXHJcblx0XHQjIFx0XHRcdHN0b3BzLnB1c2goTVNHcmFkaWVudFN0b3Auc3RvcFdpdGhQb3NpdGlvbl9jb2xvcl8oZ3JhZGllbnQuc3RvcHNbal0ucG9zaXRpb24sIGNvbG9yKSlcclxuXHJcblx0XHQjIFx0XHQjIENyZWF0ZSBncmFkaWVudCBvYmplY3QgYW5kIHNldCBiYXNpYyBwcm9wZXJ0aWVzXHJcblx0XHQjIFx0XHRtc2dyYWRpZW50ID0gTVNHcmFkaWVudC5uZXcoKVxyXG5cdFx0IyBcdFx0bXNncmFkaWVudC5zZXRHcmFkaWVudFR5cGUoZ3JhZGllbnQuZ3JhZGllbnRUeXBlKVxyXG5cdFx0IyBcdFx0IyBtc2dyYWRpZW50LnNob3VsZFNtb290aGVuT3BhY2l0eSA9IGdyYWRpZW50LnNob3VsZFNtb290aGVuT3BhY2l0eVxyXG5cdFx0IyBcdFx0bXNncmFkaWVudC5lbGlwc2VMZW5ndGggPSBncmFkaWVudC5lbGlwc2VMZW5ndGhcclxuXHRcdCMgXHRcdG1zZ3JhZGllbnQuc2V0U3RvcHMoc3RvcHMpXHJcblxyXG5cdFx0IyBcdFx0IyBQYXJzZSBGcm9tIGFuZCBUbyB2YWx1ZXMgaW50byBhcnJheXMgZS5nLjogZnJvbTogXCJ7MC4xLC0wLjQzfVwiID0+IGZyb21WYWx1ZSA9IFswLjEsIC0wLjQzXVxyXG5cdFx0IyBcdFx0ZnJvbVZhbHVlID0gZ3JhZGllbnQuZnJvbS5zbGljZSgxLC0xKS5zcGxpdChcIixcIilcclxuXHRcdCMgXHRcdHRvVmFsdWUgPSBncmFkaWVudC50by5zbGljZSgxLC0xKS5zcGxpdChcIixcIilcclxuXHJcblx0XHQjIFx0XHQjIFNldCBDR1BvaW50IG9iamVjdHMgYXMgRnJvbSBhbmQgVG8gdmFsdWVzXHJcblx0XHQjIFx0XHRtc2dyYWRpZW50LnNldEZyb20oeyB4OiBmcm9tVmFsdWVbMF0sIHk6IGZyb21WYWx1ZVsxXSB9KVxyXG5cdFx0IyBcdFx0bXNncmFkaWVudC5zZXRUbyh7IHg6IHRvVmFsdWVbMF0sIHk6IHRvVmFsdWVbMV0gfSlcclxuXHJcblx0XHQjIFx0XHRncmFkaWVudE5hbWUgPSBncmFkaWVudERlZmluaXRpb25zW2ldLm5hbWUgPyBncmFkaWVudERlZmluaXRpb25zW2ldLm5hbWUgOiBudWxsXHJcblx0XHQjIFx0XHRncmFkaWVudEFzc2V0cy5wdXNoKE1TR3JhZGllbnRBc3NldC5hbGxvYygpLmluaXRXaXRoQXNzZXRfbmFtZShtc2dyYWRpZW50LCBncmFkaWVudE5hbWUpKVxyXG5cclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgdGFidWxhciBSR0IgdmFsdWVzXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRwYWxldHRlcyA9IFtcclxuXHRcdGNzdl9wYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0c3N2X3BhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XVxyXG5cdHRyeV9wYXJzZV9saW5lID0gKGxpbmUsIHBhbGV0dGUsIHJlZ2V4cCktPlxyXG5cdFx0bWF0Y2ggPSBsaW5lLm1hdGNoKHJlZ2V4cClcclxuXHRcdGlmIG1hdGNoXHJcblx0XHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdFx0cjogbWF0Y2hbMV1cclxuXHRcdFx0XHRnOiBtYXRjaFsyXVxyXG5cdFx0XHRcdGI6IG1hdGNoWzNdXHJcblx0Zm9yIGxpbmUgaW4gbGluZXNcclxuXHRcdHRyeV9wYXJzZV9saW5lIGxpbmUsIGNzdl9wYWxldHRlLCAvKFswLTldKlxcLj9bMC05XSspLFxccyooWzAtOV0qXFwuP1swLTldKyksXFxzKihbMC05XSpcXC4/WzAtOV0rKS9cclxuXHRcdHRyeV9wYXJzZV9saW5lIGxpbmUsIHNzdl9wYWxldHRlLCAvKFswLTldKlxcLj9bMC05XSspXFxzKyhbMC05XSpcXC4/WzAtOV0rKVxccysoWzAtOV0qXFwuP1swLTldKykvXHJcblx0XHJcblx0bW9zdF9jb2xvcnMgPSBbXVxyXG5cdGZvciBwYWxldHRlIGluIHBhbGV0dGVzXHJcblx0XHRpZiBwYWxldHRlLmxlbmd0aCA+PSBtb3N0X2NvbG9ycy5sZW5ndGhcclxuXHRcdFx0bW9zdF9jb2xvcnMgPSBwYWxldHRlXHJcblx0XHJcblx0biA9IG1vc3RfY29sb3JzLmxlbmd0aFxyXG5cdGlmIG4gPCA0XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoW1xyXG5cdFx0XHRcIk5vIGNvbG9ycyBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBvbmUgY29sb3IgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgYSBjb3VwbGUgY29sb3JzIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IGEgZmV3IGNvbG9ycyBmb3VuZFwiXHJcblx0XHRdW25dICsgXCIgKCN7bn0pXCIpXHJcblx0XHJcblx0aWYgbW9zdF9jb2xvcnMuZXZlcnkoKGNvbG9yKS0+IGNvbG9yLnIgPD0gMSBhbmQgY29sb3IuZyA8PSAxIGFuZCBjb2xvci5iIDw9IDEpXHJcblx0XHRtb3N0X2NvbG9ycy5mb3JFYWNoIChjb2xvciktPlxyXG5cdFx0XHRjb2xvci5yICo9IDI1NVxyXG5cdFx0XHRjb2xvci5nICo9IDI1NVxyXG5cdFx0XHRjb2xvci5iICo9IDI1NVxyXG5cclxuXHRtb3N0X2NvbG9yc1xyXG4iLCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuL1BhbGV0dGVcIlxyXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcclxuXHJcbmNsYXNzIFJhbmRvbUNvbG9yIGV4dGVuZHMgQ29sb3JcclxuXHRjb25zdHJ1Y3RvcjogLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEByYW5kb21pemUoKVxyXG5cdFxyXG5cdHJhbmRvbWl6ZTogLT5cclxuXHRcdEBoID0gTWF0aC5yYW5kb20oKSAqIDM2MFxyXG5cdFx0QHMgPSBNYXRoLnJhbmRvbSgpICogMTAwXHJcblx0XHRAbCA9IE1hdGgucmFuZG9tKCkgKiAxMDBcclxuXHRcclxuXHR0b1N0cmluZzogLT5cclxuXHRcdEByYW5kb21pemUoKVxyXG5cdFx0XCJoc2woI3tAaH0sICN7QHN9JSwgI3tAbH0lKVwiXHJcblx0XHJcblx0aXM6IC0+IG5vXHJcblxyXG5jbGFzcyBSYW5kb21QYWxldHRlIGV4dGVuZHMgUGFsZXR0ZVxyXG5cdGNvbnN0cnVjdG9yOiAtPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QGxvYWRlciA9XHJcblx0XHRcdG5hbWU6IFwiQ29tcGxldGVseSBSYW5kb20gQ29sb3Jz4oSiXCJcclxuXHRcdFx0ZmlsZUV4dGVuc2lvbnM6IFtdXHJcblx0XHRcdGZpbGVFeHRlbnNpb25zUHJldHR5OiBcIiguY3JjIHNqZihEZjA5c2pkZmtzZGxmbW5tICc7JztcIlxyXG5cdFx0QG1hdGNoZWRMb2FkZXJGaWxlRXh0ZW5zaW9ucyA9IG5vXHJcblx0XHRAY29uZmlkZW5jZSA9IDBcclxuXHRcdEBmaW5hbGl6ZSgpXHJcblx0XHRmb3IgaSBpbiBbMC4uTWF0aC5yYW5kb20oKSoxNSs1XVxyXG5cdFx0XHRAcHVzaCBuZXcgUmFuZG9tQ29sb3IoKVxyXG5cclxuY2xhc3MgTG9hZGluZ0Vycm9ycyBleHRlbmRzIEVycm9yXHJcblx0Y29uc3RydWN0b3I6IChAZXJyb3JzKS0+XHJcblx0XHRzdXBlcigpXHJcblx0XHRAbWVzc2FnZSA9IFwiU29tZSBlcnJvcnMgd2VyZSBlbmNvdW50ZXJlZCB3aGVuIGxvYWRpbmc6XCIgK1xyXG5cdFx0XHRmb3IgZXJyb3IgaW4gQGVycm9yc1xyXG5cdFx0XHRcdFwiXFxuXFx0XCIgKyBlcnJvci5tZXNzYWdlXHJcblxyXG5sb2FkX3BhbGV0dGUgPSAobywgY2FsbGJhY2spLT5cclxuXHRcclxuXHRwYWxldHRlX2xvYWRlcnMgPSBbXHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiLCBcInBzcHBhbGV0dGVcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9QYWludFNob3BQcm9cIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlJJRkYgUEFMXCJcclxuXHRcdFx0ZXh0czogW1wicGFsXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvUklGRlwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiQ29sb3JTY2hlbWVyIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJjc1wiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0NvbG9yU2NoZW1lclwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUGFpbnQuTkVUIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJ0eHRcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9QYWludC5ORVRcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkdJTVAgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImdwbFwiLCBcImdpbXBcIiwgXCJjb2xvcnNcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9HSU1QXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJLb2xvdXJQYWludCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiY29sb3JzXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvS29sb3VyUGFpbnRcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlNrZW5jaWwgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInNwbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1NQTFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiU2tldGNoIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJza2V0Y2hwYWxldHRlXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvc2tldGNocGFsZXR0ZVwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwic0sxIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJza3BcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TS1BcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkNTUyBjb2xvcnNcIlxyXG5cdFx0XHRleHRzOiBbXCJjc3NcIiwgXCJzY3NzXCIsIFwic2Fzc1wiLCBcImxlc3NcIiwgXCJzdHlsXCIsIFwiaHRtbFwiLCBcImh0bVwiLCBcInN2Z1wiLCBcImpzXCIsIFwidHNcIiwgXCJ4bWxcIiwgXCJ0eHRcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9DU1NcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcInRhYnVsYXIgY29sb3JzXCJcclxuXHRcdFx0ZXh0czogW1wiY3N2XCIsIFwidHN2XCIsIFwidHh0XCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvdGFidWxhclwiXHJcblx0XHR9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIFN3YXRjaFwiXHJcblx0XHQjIFx0ZXh0czogW1wiYWNvXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yU3dhdGNoXCJcclxuXHRcdCMgfVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBDb2xvciBUYWJsZVwiXHJcblx0XHQjIFx0ZXh0czogW1wiYWN0XCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yVGFibGVcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIFN3YXRjaCBFeGNoYW5nZVwiXHJcblx0XHQjIFx0ZXh0czogW1wiYXNlXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZVN3YXRjaEV4Y2hhbmdlXCJcclxuXHRcdCMgfVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBDb2xvciBCb29rXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY2JcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JCb29rXCJcclxuXHRcdCMgfVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkhQTCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiaHBsXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvSFBMXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJTdGFyQ3JhZnQgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1N0YXJDcmFmdFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiU3RhckNyYWZ0IHRlcnJhaW4gcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcIndwZVwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1N0YXJDcmFmdFBhZGRlZFwiXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQXV0b0NBRCBDb2xvciBCb29rXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY2JcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0F1dG9DQURDb2xvckJvb2tcIlxyXG5cdFx0IyB9XHJcblx0XHRcclxuXHRcdCMge1xyXG5cdFx0IyBcdCMgKHNhbWUgYXMgUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZT8pXHJcblx0XHQjIFx0bmFtZTogXCJDb3JlbERSQVcgcGFsZXR0ZVwiXHJcblx0XHQjIFx0ZXh0czogW1wicGFsXCIsIFwiY3BsXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9Db3JlbERSQVdcIlxyXG5cdFx0IyB9XHJcblx0XVxyXG5cdFxyXG5cdCMgZmluZCBwYWxldHRlIGxvYWRlcnMgdGhhdCB1c2UgdGhpcyBmaWxlIGV4dGVuc2lvblxyXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcclxuXHRcdHBsLm1hdGNoZXNfZXh0ID0gcGwuZXh0cy5pbmRleE9mKG8uZmlsZUV4dCkgaXNudCAtMVxyXG5cdFxyXG5cdCMgbW92ZSBwYWxldHRlIGxvYWRlcnMgdG8gdGhlIGJlZ2lubmluZyB0aGF0IHVzZSB0aGlzIGZpbGUgZXh0ZW5zaW9uXHJcblx0cGFsZXR0ZV9sb2FkZXJzLnNvcnQgKHBsMSwgcGwyKS0+XHJcblx0XHRwbDIubWF0Y2hlc19leHQgLSBwbDEubWF0Y2hlc19leHRcclxuXHRcclxuXHQjIHRyeSBsb2FkaW5nIHN0dWZmXHJcblx0ZXJyb3JzID0gW11cclxuXHRmb3IgcGwgaW4gcGFsZXR0ZV9sb2FkZXJzXHJcblx0XHRcclxuXHRcdHRyeVxyXG5cdFx0XHRwYWxldHRlID0gcGwubG9hZChvKVxyXG5cdFx0XHRpZiBwYWxldHRlLmxlbmd0aCBpcyAwXHJcblx0XHRcdFx0cGFsZXR0ZSA9IG51bGxcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJubyBjb2xvcnMgcmV0dXJuZWRcIlxyXG5cdFx0Y2F0Y2ggZVxyXG5cdFx0XHRtc2cgPSBcImZhaWxlZCB0byBsb2FkICN7by5maWxlTmFtZX0gYXMgI3twbC5uYW1lfTogI3tlLm1lc3NhZ2V9XCJcclxuXHRcdFx0IyBpZiBwbC5tYXRjaGVzX2V4dCBhbmQgbm90IGUubWVzc2FnZS5tYXRjaCgvbm90IGEvaSlcclxuXHRcdFx0IyBcdGNvbnNvbGU/LmVycm9yPyBtc2dcclxuXHRcdFx0IyBlbHNlXHJcblx0XHRcdCMgXHRjb25zb2xlPy53YXJuPyBtc2dcclxuXHRcdFx0XHJcblx0XHRcdCMgVE9ETzogbWF5YmUgdGhpcyBzaG91bGRuJ3QgYmUgYW4gRXJyb3Igb2JqZWN0LCBqdXN0IGEge21lc3NhZ2UsIGVycm9yfSBvYmplY3RcclxuXHRcdFx0IyBvciB7ZnJpZW5kbHlNZXNzYWdlLCBlcnJvcn1cclxuXHRcdFx0ZXJyID0gbmV3IEVycm9yIG1zZ1xyXG5cdFx0XHRlcnIuZXJyb3IgPSBlXHJcblx0XHRcdGVycm9ycy5wdXNoIGVyclxyXG5cdFx0XHJcblx0XHRpZiBwYWxldHRlXHJcblx0XHRcdCMgY29uc29sZT8uaW5mbz8gXCJsb2FkZWQgI3tvLmZpbGVOYW1lfSBhcyAje3BsLm5hbWV9XCJcclxuXHRcdFx0cGFsZXR0ZS5jb25maWRlbmNlID0gaWYgcGwubWF0Y2hlc19leHQgdGhlbiAwLjkgZWxzZSAwLjAxXHJcblx0XHRcdGV4dHNfcHJldHR5ID0gXCIuI3twbC5leHRzLmpvaW4oXCIsIC5cIil9XCJcclxuXHRcdFx0XHJcblx0XHRcdCMgVE9ETzogcHJvYmFibHkgcmVuYW1lIGxvYWRlciAtPiBmb3JtYXQgd2hlbiAyLXdheSBkYXRhIGZsb3cgKHJlYWQvd3JpdGUpIGlzIHN1cHBvcnRlZFxyXG5cdFx0XHQjIFRPRE86IG1heWJlIG1ha2UgdGhpcyBhIDNyZCAoYW5kIGZvdXJ0aD8pIGFyZ3VtZW50IHRvIHRoZSBjYWxsYmFja1xyXG5cdFx0XHRwYWxldHRlLmxvYWRlciA9XHJcblx0XHRcdFx0bmFtZTogcGwubmFtZVxyXG5cdFx0XHRcdGZpbGVFeHRlbnNpb25zOiBwbC5leHRzXHJcblx0XHRcdFx0ZmlsZUV4dGVuc2lvbnNQcmV0dHk6IGV4dHNfcHJldHR5XHJcblx0XHRcdHBhbGV0dGUubWF0Y2hlZExvYWRlckZpbGVFeHRlbnNpb25zID0gcGwubWF0Y2hlc19leHRcclxuXHRcdFx0XHJcblx0XHRcdHBhbGV0dGUuZmluYWxpemUoKVxyXG5cdFx0XHRjYWxsYmFjayhudWxsLCBwYWxldHRlKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcclxuXHRjYWxsYmFjayhuZXcgTG9hZGluZ0Vycm9ycyhlcnJvcnMpKVxyXG5cdHJldHVyblxyXG5cclxubm9ybWFsaXplX29wdGlvbnMgPSAobyA9IHt9KS0+XHJcblx0aWYgdHlwZW9mIG8gaXMgXCJzdHJpbmdcIiBvciBvIGluc3RhbmNlb2YgU3RyaW5nXHJcblx0XHRvID0gZmlsZVBhdGg6IG9cclxuXHRpZiBGaWxlPyBhbmQgbyBpbnN0YW5jZW9mIEZpbGVcclxuXHRcdG8gPSBmaWxlOiBvXHJcblx0XHJcblx0IyBvLm1pbkNvbG9ycyA/PSAyXHJcblx0IyBvLm1heENvbG9ycyA/PSAyNTZcclxuXHRvLmZpbGVOYW1lID89IG8uZmlsZT8ubmFtZSA/IChpZiBvLmZpbGVQYXRoIHRoZW4gcmVxdWlyZShcInBhdGhcIikuYmFzZW5hbWUoby5maWxlUGF0aCkpXHJcblx0by5maWxlRXh0ID89IFwiI3tvLmZpbGVOYW1lfVwiLnNwbGl0KFwiLlwiKS5wb3AoKVxyXG5cdG8uZmlsZUV4dCA9IFwiI3tvLmZpbGVFeHR9XCIudG9Mb3dlckNhc2UoKVxyXG5cdG9cclxuXHJcbkFueVBhbGV0dGUgPSB7XHJcblx0Q29sb3JcclxuXHRQYWxldHRlXHJcblx0UmFuZG9tQ29sb3JcclxuXHRSYW5kb21QYWxldHRlXHJcblx0IyBMb2FkaW5nRXJyb3JzXHJcbn1cclxuXHJcbiMgR2V0IHBhbGV0dGUgZnJvbSBhIGZpbGVcclxuQW55UGFsZXR0ZS5sb2FkUGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxyXG5cdGlmIG5vdCBvXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJQYXJhbWV0ZXJzIHJlcXVpcmVkOiBBbnlQYWxldHRlLmxvYWRQYWxldHRlKG9wdGlvbnMsIGZ1bmN0aW9uIGNhbGxiYWNrKGVyciwgcGFsZXR0ZSl7fSlcIlxyXG5cdGlmIG5vdCBjYWxsYmFja1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiQ2FsbGJhY2sgcmVxdWlyZWQ6IEFueVBhbGV0dGUubG9hZFBhbGV0dGUob3B0aW9ucywgZnVuY3Rpb24gY2FsbGJhY2soZXJyLCBwYWxldHRlKXt9KVwiXHJcblx0XHJcblx0byA9IG5vcm1hbGl6ZV9vcHRpb25zIG9cclxuXHRcclxuXHRpZiBvLmRhdGFcclxuXHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRlbHNlIGlmIEZpbGU/IGFuZCBvLmZpbGUgaW5zdGFuY2VvZiBGaWxlXHJcblx0XHRmciA9IG5ldyBGaWxlUmVhZGVyXHJcblx0XHRmci5vbmxvYWQgPSAtPlxyXG5cdFx0XHRvLmRhdGEgPSBmci5yZXN1bHRcclxuXHRcdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdFx0ZnIucmVhZEFzQmluYXJ5U3RyaW5nIG8uZmlsZVxyXG5cdGVsc2UgaWYgby5maWxlUGF0aD9cclxuXHRcdGZzID0gcmVxdWlyZSBcImZzXCJcclxuXHRcdGZzLnJlYWRGaWxlIG8uZmlsZVBhdGgsIChlcnIsIGRhdGEpLT5cclxuXHRcdFx0aWYgZXJyXHJcblx0XHRcdFx0Y2FsbGJhY2soZXJyKVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0by5kYXRhID0gZGF0YS50b1N0cmluZyhcImJpbmFyeVwiKVxyXG5cdFx0XHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRlbHNlXHJcblx0XHRjYWxsYmFjayhuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZC4gVGhlIEZpbGUgQVBJIG1heSBub3QgYmUgc3VwcG9ydGVkLlwiKSkgIyB1bS4uLlxyXG5cdFx0IyB0aGUgRmlsZSBBUEkgd291bGQgYmUgc3VwcG9ydGVkIGlmIHlvdSd2ZSBwYXNzZWQgYSBGaWxlXHJcblx0XHQjIFRPRE86IGEgYmV0dGVyIGVycm9yIG1lc3NhZ2UsIGFib3V0IG9wdGlvbnMgKG5vdCkgcGFzc2VkXHJcblxyXG5cclxuIyBHZXQgYSBwYWxldHRlIGZyb20gYSBmaWxlIG9yIGJ5IGFueSBtZWFucyBuZWNlc3NhcnlcclxuIyAoYXMgaW4gZmFsbCBiYWNrIHRvIGNvbXBsZXRlbHkgcmFuZG9tIGRhdGEpXHJcbkFueVBhbGV0dGUuZ2ltbWVBUGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxyXG5cdG8gPSBub3JtYWxpemVfb3B0aW9ucyBvXHJcblx0XHJcblx0QW55UGFsZXR0ZS5sb2FkUGFsZXR0ZSBvLCAoZXJyLCBwYWxldHRlKS0+XHJcblx0XHRjYWxsYmFjayhudWxsLCBwYWxldHRlID8gbmV3IFJhbmRvbVBhbGV0dGUpXHJcblxyXG4jIEV4cG9ydHNcclxubW9kdWxlLmV4cG9ydHMgPSBBbnlQYWxldHRlXHJcbiJdfQ==
