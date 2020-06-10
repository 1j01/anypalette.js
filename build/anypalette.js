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


},{"../Palette":3}],13:[function(require,module,exports){
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


},{"../BinaryReader":1,"../Palette":3}],14:[function(require,module,exports){
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


},{"../BinaryReader":1,"../Palette":3}],15:[function(require,module,exports){
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


},{"../Palette":3}],16:[function(require,module,exports){
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
      name: "KDE RGB palette",
      exts: ["colors"],
      load: require("./loaders/KDE")
    },
    {
      name: "Sketch RGB palette",
      exts: ["spl"],
      load: require("./loaders/SPL")
    },
    {
      name: "Sketch palette",
      exts: ["sketchpalette"],
      load: require("./loaders/sketchpalette")
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


},{"./Color":2,"./Palette":3,"./loaders/CSS":4,"./loaders/ColorSchemer":5,"./loaders/GIMP":6,"./loaders/HPL":7,"./loaders/KDE":8,"./loaders/Paint.NET":9,"./loaders/PaintShopPro":10,"./loaders/RIFF":11,"./loaders/SPL":12,"./loaders/StarCraft":13,"./loaders/StarCraftPadded":14,"./loaders/sketchpalette":15,"fs":"fs","path":"path"}]},{},[16])(16)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQmluYXJ5UmVhZGVyLmNvZmZlZSIsInNyYy9Db2xvci5jb2ZmZWUiLCJzcmMvUGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbG9hZGVycy9DU1MuY29mZmVlIiwic3JjL2xvYWRlcnMvQ29sb3JTY2hlbWVyLmNvZmZlZSIsInNyYy9sb2FkZXJzL0dJTVAuY29mZmVlIiwic3JjL2xvYWRlcnMvSFBMLmNvZmZlZSIsInNyYy9sb2FkZXJzL0tERS5jb2ZmZWUiLCJzcmMvbG9hZGVycy9QYWludC5ORVQuY29mZmVlIiwic3JjL2xvYWRlcnMvUGFpbnRTaG9wUHJvLmNvZmZlZSIsInNyYy9sb2FkZXJzL1JJRkYuY29mZmVlIiwic3JjL2xvYWRlcnMvU1BMLmNvZmZlZSIsInNyYy9sb2FkZXJzL1N0YXJDcmFmdC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TdGFyQ3JhZnRQYWRkZWQuY29mZmVlIiwic3JjL2xvYWRlcnMvc2tldGNocGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNhSTs7Ozs7Ozs7Ozs7OztBQUFBLElBQUE7O0FBRUYsTUFBTSxDQUFDLE9BQVAsR0FDTTtFQUFOLE1BQUEsYUFBQTtJQUNBLFdBQWEsQ0FBQyxJQUFELENBQUE7TUFDWixJQUFDLENBQUEsT0FBRCxHQUFXO01BQ1gsSUFBQyxDQUFBLElBQUQsR0FBUTtJQUZJLENBQWQ7OztJQU1DLFFBQVUsQ0FBQSxDQUFBO0FBQ1gsVUFBQTtNQUFFLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBWjtNQUNBLEVBQUEsR0FBSyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQWIsQ0FBd0IsSUFBQyxDQUFBLElBQXpCLENBQUEsR0FBaUM7TUFDdEMsSUFBQyxDQUFBLElBQUQsSUFBUzthQUNULEVBQUEsR0FBSztJQUpJOztJQU1WLGlCQUFtQixDQUFBLENBQUE7QUFDcEIsVUFBQSxD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SUFBSSxhQUFKLENBQUEsQ0FBekI7RUFEeUIsQ0FBMUI7QUFIMkIsRUFqUDVCOzs7QUF3UEMsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcclxuIyMjXHJcbkJpbmFyeVJlYWRlclxyXG5cclxuTW9kaWZpZWQgYnkgSXNhaWFoIE9kaG5lclxyXG5AVE9ETzogdXNlIGpEYXRhVmlldyArIGpCaW5hcnkgaW5zdGVhZFxyXG5cclxuUmVmYWN0b3JlZCBieSBWamV1eCA8dmpldXh4QGdtYWlsLmNvbT5cclxuaHR0cDovL2Jsb2cudmpldXguY29tLzIwMTAvamF2YXNjcmlwdC9qYXZhc2NyaXB0LWJpbmFyeS1yZWFkZXIuaHRtbFxyXG5cclxuT3JpZ2luYWxcclxuKyBKb25hcyBSYW9uaSBTb2FyZXMgU2lsdmFcclxuQCBodHRwOi8vanNmcm9taGVsbC5jb20vY2xhc3Nlcy9iaW5hcnktcGFyc2VyIFtyZXYuICMxXVxyXG4jIyNcclxuXHJcbm1vZHVsZS5leHBvcnRzID1cclxuY2xhc3MgQmluYXJ5UmVhZGVyXHJcblx0Y29uc3RydWN0b3I6IChkYXRhKS0+XHJcblx0XHRAX2J1ZmZlciA9IGRhdGFcclxuXHRcdEBfcG9zID0gMFxyXG5cclxuXHQjIFB1YmxpYyAoY3VzdG9tKVxyXG5cdFxyXG5cdHJlYWRCeXRlOiAtPlxyXG5cdFx0QF9jaGVja1NpemUoOClcclxuXHRcdGNoID0gdGhpcy5fYnVmZmVyLmNoYXJDb2RlQXQoQF9wb3MpICYgMHhmZlxyXG5cdFx0QF9wb3MgKz0gMVxyXG5cdFx0Y2ggJiAweGZmXHJcblx0XHJcblx0cmVhZFVuaWNvZGVTdHJpbmc6IC0+XHJcblx0XHRsZW5ndGggPSBAcmVhZFVJbnQxNigpXHJcblx0XHQjIGNvbnNvbGUubG9nIHtsZW5ndGh9XHJcblx0XHRAX2NoZWNrU2l6ZShsZW5ndGggKiAxNilcclxuXHRcdHN0ciA9IFwiXCJcclxuXHRcdGZvciBpIGluIFswLi5sZW5ndGhdXHJcblx0XHRcdHN0ciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKEBfYnVmZmVyLnN1YnN0cihAX3BvcywgMSkgfCAoQF9idWZmZXIuc3Vic3RyKEBfcG9zKzEsIDEpIDw8IDgpKVxyXG5cdFx0XHRAX3BvcyArPSAyXHJcblx0XHRzdHJcclxuXHRcclxuXHQjIFB1YmxpY1xyXG5cdFxyXG5cdHJlYWRJbnQ4OiAtPiBAX2RlY29kZUludCg4LCB0cnVlKVxyXG5cdHJlYWRVSW50ODogLT4gQF9kZWNvZGVJbnQoOCwgZmFsc2UpXHJcblx0cmVhZEludDE2OiAtPiBAX2RlY29kZUludCgxNiwgdHJ1ZSlcclxuXHRyZWFkVUludDE2OiAtPiBAX2RlY29kZUludCgxNiwgZmFsc2UpXHJcblx0cmVhZEludDMyOiAtPiBAX2RlY29kZUludCgzMiwgdHJ1ZSlcclxuXHRyZWFkVUludDMyOiAtPiBAX2RlY29kZUludCgzMiwgZmFsc2UpXHJcblxyXG5cdHJlYWRGbG9hdDogLT4gQF9kZWNvZGVGbG9hdCgyMywgOClcclxuXHRyZWFkRG91YmxlOiAtPiBAX2RlY29kZUZsb2F0KDUyLCAxMSlcclxuXHRcclxuXHRyZWFkQ2hhcjogLT4gQHJlYWRTdHJpbmcoMSlcclxuXHRyZWFkU3RyaW5nOiAobGVuZ3RoKS0+XHJcblx0XHRAX2NoZWNrU2l6ZShsZW5ndGggKiA4KVxyXG5cdFx0cmVzdWx0ID0gQF9idWZmZXIuc3Vic3RyKEBfcG9zLCBsZW5ndGgpXHJcblx0XHRAX3BvcyArPSBsZW5ndGhcclxuXHRcdHJlc3VsdFxyXG5cclxuXHRzZWVrOiAocG9zKS0+XHJcblx0XHRAX3BvcyA9IHBvc1xyXG5cdFx0QF9jaGVja1NpemUoMClcclxuXHRcclxuXHRnZXRQb3NpdGlvbjogLT4gQF9wb3NcclxuXHRcclxuXHRnZXRTaXplOiAtPiBAX2J1ZmZlci5sZW5ndGhcclxuXHRcclxuXHJcblxyXG5cdCMgUHJpdmF0ZVxyXG5cdFxyXG5cdF9kZWNvZGVGbG9hdDogYGZ1bmN0aW9uKHByZWNpc2lvbkJpdHMsIGV4cG9uZW50Qml0cyl7XHJcblx0XHR2YXIgbGVuZ3RoID0gcHJlY2lzaW9uQml0cyArIGV4cG9uZW50Qml0cyArIDE7XHJcblx0XHR2YXIgc2l6ZSA9IGxlbmd0aCA+PiAzO1xyXG5cdFx0dGhpcy5fY2hlY2tTaXplKGxlbmd0aCk7XHJcblxyXG5cdFx0dmFyIGJpYXMgPSBNYXRoLnBvdygyLCBleHBvbmVudEJpdHMgLSAxKSAtIDE7XHJcblx0XHR2YXIgc2lnbmFsID0gdGhpcy5fcmVhZEJpdHMocHJlY2lzaW9uQml0cyArIGV4cG9uZW50Qml0cywgMSwgc2l6ZSk7XHJcblx0XHR2YXIgZXhwb25lbnQgPSB0aGlzLl9yZWFkQml0cyhwcmVjaXNpb25CaXRzLCBleHBvbmVudEJpdHMsIHNpemUpO1xyXG5cdFx0dmFyIHNpZ25pZmljYW5kID0gMDtcclxuXHRcdHZhciBkaXZpc29yID0gMjtcclxuXHRcdHZhciBjdXJCeXRlID0gMDsgLy9sZW5ndGggKyAoLXByZWNpc2lvbkJpdHMgPj4gMykgLSAxO1xyXG5cdFx0ZG8ge1xyXG5cdFx0XHR2YXIgYnl0ZVZhbHVlID0gdGhpcy5fcmVhZEJ5dGUoKytjdXJCeXRlLCBzaXplKTtcclxuXHRcdFx0dmFyIHN0YXJ0Qml0ID0gcHJlY2lzaW9uQml0cyAlIDggfHwgODtcclxuXHRcdFx0dmFyIG1hc2sgPSAxIDw8IHN0YXJ0Qml0O1xyXG5cdFx0XHR3aGlsZSAobWFzayA+Pj0gMSkge1xyXG5cdFx0XHRcdGlmIChieXRlVmFsdWUgJiBtYXNrKSB7XHJcblx0XHRcdFx0XHRzaWduaWZpY2FuZCArPSAxIC8gZGl2aXNvcjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZGl2aXNvciAqPSAyO1xyXG5cdFx0XHR9XHJcblx0XHR9IHdoaWxlIChwcmVjaXNpb25CaXRzIC09IHN0YXJ0Qml0KTtcclxuXHJcblx0XHR0aGlzLl9wb3MgKz0gc2l6ZTtcclxuXHJcblx0XHRyZXR1cm4gZXhwb25lbnQgPT0gKGJpYXMgPDwgMSkgKyAxID8gc2lnbmlmaWNhbmQgPyBOYU4gOiBzaWduYWwgPyAtSW5maW5pdHkgOiArSW5maW5pdHlcclxuXHRcdFx0OiAoMSArIHNpZ25hbCAqIC0yKSAqIChleHBvbmVudCB8fCBzaWduaWZpY2FuZCA/ICFleHBvbmVudCA/IE1hdGgucG93KDIsIC1iaWFzICsgMSkgKiBzaWduaWZpY2FuZFxyXG5cdFx0XHQ6IE1hdGgucG93KDIsIGV4cG9uZW50IC0gYmlhcykgKiAoMSArIHNpZ25pZmljYW5kKSA6IDApO1xyXG5cdH1gXHJcblxyXG5cdF9kZWNvZGVJbnQ6IGBmdW5jdGlvbihiaXRzLCBzaWduZWQpe1xyXG5cdFx0dmFyIHggPSB0aGlzLl9yZWFkQml0cygwLCBiaXRzLCBiaXRzIC8gOCksIG1heCA9IE1hdGgucG93KDIsIGJpdHMpO1xyXG5cdFx0dmFyIHJlc3VsdCA9IHNpZ25lZCAmJiB4ID49IG1heCAvIDIgPyB4IC0gbWF4IDogeDtcclxuXHJcblx0XHR0aGlzLl9wb3MgKz0gYml0cyAvIDg7XHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH1gXHJcblxyXG5cdCNzaGwgZml4OiBIZW5yaSBUb3JnZW1hbmUgfjE5OTYgKGNvbXByZXNzZWQgYnkgSm9uYXMgUmFvbmkpXHJcblx0X3NobDogYGZ1bmN0aW9uIChhLCBiKXtcclxuXHRcdGZvciAoKytiOyAtLWI7IGEgPSAoKGEgJT0gMHg3ZmZmZmZmZiArIDEpICYgMHg0MDAwMDAwMCkgPT0gMHg0MDAwMDAwMCA/IGEgKiAyIDogKGEgLSAweDQwMDAwMDAwKSAqIDIgKyAweDdmZmZmZmZmICsgMSk7XHJcblx0XHRyZXR1cm4gYTtcclxuXHR9YFxyXG5cdFxyXG5cdF9yZWFkQnl0ZTogYGZ1bmN0aW9uIChpLCBzaXplKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fYnVmZmVyLmNoYXJDb2RlQXQodGhpcy5fcG9zICsgc2l6ZSAtIGkgLSAxKSAmIDB4ZmY7XHJcblx0fWBcclxuXHJcblx0X3JlYWRCaXRzOiBgZnVuY3Rpb24gKHN0YXJ0LCBsZW5ndGgsIHNpemUpIHtcclxuXHRcdHZhciBvZmZzZXRMZWZ0ID0gKHN0YXJ0ICsgbGVuZ3RoKSAlIDg7XHJcblx0XHR2YXIgb2Zmc2V0UmlnaHQgPSBzdGFydCAlIDg7XHJcblx0XHR2YXIgY3VyQnl0ZSA9IHNpemUgLSAoc3RhcnQgPj4gMykgLSAxO1xyXG5cdFx0dmFyIGxhc3RCeXRlID0gc2l6ZSArICgtKHN0YXJ0ICsgbGVuZ3RoKSA+PiAzKTtcclxuXHRcdHZhciBkaWZmID0gY3VyQnl0ZSAtIGxhc3RCeXRlO1xyXG5cclxuXHRcdHZhciBzdW0gPSAodGhpcy5fcmVhZEJ5dGUoY3VyQnl0ZSwgc2l6ZSkgPj4gb2Zmc2V0UmlnaHQpICYgKCgxIDw8IChkaWZmID8gOCAtIG9mZnNldFJpZ2h0IDogbGVuZ3RoKSkgLSAxKTtcclxuXHJcblx0XHRpZiAoZGlmZiAmJiBvZmZzZXRMZWZ0KSB7XHJcblx0XHRcdHN1bSArPSAodGhpcy5fcmVhZEJ5dGUobGFzdEJ5dGUrKywgc2l6ZSkgJiAoKDEgPDwgb2Zmc2V0TGVmdCkgLSAxKSkgPDwgKGRpZmYtLSA8PCAzKSAtIG9mZnNldFJpZ2h0OyBcclxuXHRcdH1cclxuXHJcblx0XHR3aGlsZSAoZGlmZikge1xyXG5cdFx0XHRzdW0gKz0gdGhpcy5fc2hsKHRoaXMuX3JlYWRCeXRlKGxhc3RCeXRlKyssIHNpemUpLCAoZGlmZi0tIDw8IDMpIC0gb2Zmc2V0UmlnaHQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBzdW07XHJcblx0fWBcclxuXHJcblx0X2NoZWNrU2l6ZTogKG5lZWRlZEJpdHMpLT5cclxuXHRcdGlmIEBfcG9zICsgTWF0aC5jZWlsKG5lZWRlZEJpdHMgLyA4KSA+IEBfYnVmZmVyLmxlbmd0aFxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJJbmRleCBvdXQgb2YgYm91bmRcIlxyXG5cclxuIiwiXHJcbiMgY29sb3IgdmFsdWUgcmFuZ2VzOlxyXG4jIGE6IDAgdG8gMVxyXG4jIHIvZy9iOiAwIHRvIDI1NVxyXG4jIGg6IDAgdG8gMzYwXHJcbiMgcy9sOiAwIHRvIDEwMFxyXG4jIGMvbS95L2s6IDAgdG8gMTAwXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIENvbG9yXHJcblx0Y29uc3RydWN0b3I6IChvcHRpb25zKS0+XHJcblx0XHQjIEBUT0RPOiBkb24ndCBhc3NpZ24gYWxsIG9mIHtAciwgQGcsIEBiLCBAaCwgQHMsIEB2LCBAbH0gcmlnaHQgYXdheVxyXG5cdFx0IyBvbmx5IGFzc2lnbiB0aGUgcHJvcGVydGllcyB0aGF0IGFyZSB1c2VkXHJcblx0XHQjIGFsc28gbWF5YmUgYWx3YXlzIGhhdmUgQHIgQGcgQGIgKG9yIEByZWQgQGdyZWVuIEBibHVlKSBidXQgc3RpbGwgc3RyaW5naWZ5IHRvIGhzbCgpIGlmIGhzbCBvciBoc3YgZ2l2ZW5cclxuXHRcdCMgVE9ETzogZXhwZWN0IG51bWJlcnMgb3IgY29udmVydCB0byBudW1iZXJzXHJcblx0XHR7XHJcblx0XHRcdEByLCBAZywgQGIsXHJcblx0XHRcdEBoLCBAcywgQHYsIEBsLFxyXG5cdFx0XHRjLCBtLCB5LCBrLFxyXG5cdFx0XHRAbmFtZVxyXG5cdFx0fSA9IG9wdGlvbnNcclxuXHJcblx0XHRpZiBAcj8gYW5kIEBnPyBhbmQgQGI/XHJcblx0XHRcdCMgUmVkIEdyZWVuIEJsdWVcclxuXHRcdFx0IyAobm8gY29udmVyc2lvbnMgbmVlZGVkIGhlcmUpXHJcblx0XHRlbHNlIGlmIEBoPyBhbmQgQHM/XHJcblx0XHRcdCMgQ3lsaW5kcmljYWwgQ29sb3IgU3BhY2VcclxuXHRcdFx0aWYgQHY/XHJcblx0XHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBWYWx1ZVxyXG5cdFx0XHRcdEBsID0gKDIgLSBAcyAvIDEwMCkgKiBAdiAvIDJcclxuXHRcdFx0XHRAcyA9IEBzICogQHYgLyAoaWYgQGwgPCA1MCB0aGVuIEBsICogMiBlbHNlIDIwMCAtIEBsICogMilcclxuXHRcdFx0XHRAcyA9IDAgaWYgaXNOYU4gQHNcclxuXHRcdFx0ZWxzZSBpZiBAbD9cclxuXHRcdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIExpZ2h0bmVzc1xyXG5cdFx0XHRcdCMgKG5vIGNvbnZlcnNpb25zIG5lZWRlZCBoZXJlKVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0IyBUT0RPOiBpbXByb3ZlIGVycm9yIG1lc3NhZ2UgKGVzcGVjaWFsbHkgaWYgQGIgZ2l2ZW4pXHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiSHVlLCBzYXR1cmF0aW9uLCBhbmQuLi4/IChlaXRoZXIgbGlnaHRuZXNzIG9yIHZhbHVlKVwiXHJcblx0XHRcdCMgVE9ETzogbWF5YmUgY29udmVydCB0byBAciBAZyBAYiBoZXJlXHJcblx0XHRlbHNlIGlmIGM/IGFuZCBtPyBhbmQgeT8gYW5kIGs/XHJcblx0XHRcdCMgQ3lhbiBNYWdlbnRhIFllbGxvdyBibGFjS1xyXG5cdFx0XHQjIFVOVEVTVEVEXHJcblx0XHRcdGMgLz0gMTAwXHJcblx0XHRcdG0gLz0gMTAwXHJcblx0XHRcdHkgLz0gMTAwXHJcblx0XHRcdGsgLz0gMTAwXHJcblx0XHRcdFxyXG5cdFx0XHRAciA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgYyAqICgxIC0gaykgKyBrKSlcclxuXHRcdFx0QGcgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIG0gKiAoMSAtIGspICsgaykpXHJcblx0XHRcdEBiID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCB5ICogKDEgLSBrKSArIGspKVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHQjIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEXHJcblx0XHRcdGlmIEBsPyBhbmQgQGE/IGFuZCBAYj9cclxuXHRcdFx0XHR3aGl0ZSA9XHJcblx0XHRcdFx0XHR4OiA5NS4wNDdcclxuXHRcdFx0XHRcdHk6IDEwMC4wMDBcclxuXHRcdFx0XHRcdHo6IDEwOC44ODNcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR4eXogPSBcclxuXHRcdFx0XHRcdHk6IChyYXcubCArIDE2KSAvIDExNlxyXG5cdFx0XHRcdFx0eDogcmF3LmEgLyA1MDAgKyB4eXoueVxyXG5cdFx0XHRcdFx0ejogeHl6LnkgLSByYXcuYiAvIDIwMFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGZvciBfIGluIFwieHl6XCJcclxuXHRcdFx0XHRcdHBvd2VkID0gTWF0aC5wb3coeHl6W19dLCAzKVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiBwb3dlZCA+IDAuMDA4ODU2XHJcblx0XHRcdFx0XHRcdHh5eltfXSA9IHBvd2VkXHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdHh5eltfXSA9ICh4eXpbX10gLSAxNiAvIDExNikgLyA3Ljc4N1xyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHQjeHl6W19dID0gX3JvdW5kKHh5eltfXSAqIHdoaXRlW19dKVxyXG5cdFx0XHRcdFxyXG5cdFx0XHQjIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEXHJcblx0XHRcdGlmIEB4PyBhbmQgQHk/IGFuZCBAej9cclxuXHRcdFx0XHR4eXogPVxyXG5cdFx0XHRcdFx0eDogcmF3LnggLyAxMDBcclxuXHRcdFx0XHRcdHk6IHJhdy55IC8gMTAwXHJcblx0XHRcdFx0XHR6OiByYXcueiAvIDEwMFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHJnYiA9XHJcblx0XHRcdFx0XHRyOiB4eXoueCAqIDMuMjQwNiArIHh5ei55ICogLTEuNTM3MiArIHh5ei56ICogLTAuNDk4NlxyXG5cdFx0XHRcdFx0ZzogeHl6LnggKiAtMC45Njg5ICsgeHl6LnkgKiAxLjg3NTggKyB4eXoueiAqIDAuMDQxNVxyXG5cdFx0XHRcdFx0YjogeHl6LnggKiAwLjA1NTcgKyB4eXoueSAqIC0wLjIwNDAgKyB4eXoueiAqIDEuMDU3MFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGZvciBfIGluIFwicmdiXCJcclxuXHRcdFx0XHRcdCNyZ2JbX10gPSBfcm91bmQocmdiW19dKVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiByZ2JbX10gPCAwXHJcblx0XHRcdFx0XHRcdHJnYltfXSA9IDBcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYgcmdiW19dID4gMC4wMDMxMzA4XHJcblx0XHRcdFx0XHRcdHJnYltfXSA9IDEuMDU1ICogTWF0aC5wb3cocmdiW19dLCAoMSAvIDIuNCkpIC0gMC4wNTVcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0cmdiW19dICo9IDEyLjkyXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0I3JnYltfXSA9IE1hdGgucm91bmQocmdiW19dICogMjU1KVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiQ29sb3IgY29uc3RydWN0b3IgbXVzdCBiZSBjYWxsZWQgd2l0aCB7cixnLGJ9IG9yIHtoLHMsdn0gb3Ige2gscyxsfSBvciB7YyxtLHksa30gb3Ige3gseSx6fSBvciB7bCxhLGJ9LFxyXG5cdFx0XHRcdFx0I3tcclxuXHRcdFx0XHRcdFx0dHJ5XHJcblx0XHRcdFx0XHRcdFx0XCJnb3QgI3tKU09OLnN0cmluZ2lmeShvcHRpb25zKX1cIlxyXG5cdFx0XHRcdFx0XHRjYXRjaCBlXHJcblx0XHRcdFx0XHRcdFx0XCJnb3Qgc29tZXRoaW5nIHRoYXQgY291bGRuJ3QgYmUgZGlzcGxheWVkIHdpdGggSlNPTi5zdHJpbmdpZnkgZm9yIHRoaXMgZXJyb3IgbWVzc2FnZVwiXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XCJcclxuXHRcdFxyXG5cdFxyXG5cdHRvU3RyaW5nOiAtPlxyXG5cdFx0aWYgQHI/XHJcblx0XHRcdCMgUmVkIEdyZWVuIEJsdWVcclxuXHRcdFx0aWYgQGE/ICMgQWxwaGFcclxuXHRcdFx0XHRcInJnYmEoI3tAcn0sICN7QGd9LCAje0BifSwgI3tAYX0pXCJcclxuXHRcdFx0ZWxzZSAjIE9wYXF1ZVxyXG5cdFx0XHRcdFwicmdiKCN7QHJ9LCAje0BnfSwgI3tAYn0pXCJcclxuXHRcdGVsc2UgaWYgQGg/XHJcblx0XHRcdCMgSHVlIFNhdHVyYXRpb24gTGlnaHRuZXNzXHJcblx0XHRcdCMgKEFzc3VtZSBoOjAtMzYwLCBzOjAtMTAwLCBsOjAtMTAwKVxyXG5cdFx0XHRpZiBAYT8gIyBBbHBoYVxyXG5cdFx0XHRcdFwiaHNsYSgje0BofSwgI3tAc30lLCAje0BsfSUsICN7QGF9KVwiXHJcblx0XHRcdGVsc2UgIyBPcGFxdWVcclxuXHRcdFx0XHRcImhzbCgje0BofSwgI3tAc30lLCAje0BsfSUpXCJcclxuXHRcclxuXHRpczogKGNvbG9yKS0+XHJcblx0XHQjIGNvbXBhcmUgYXMgc3RyaW5nc1xyXG5cdFx0XCIje0B9XCIgaXMgXCIje2NvbG9yfVwiXHJcbiIsIlxyXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID1cclxuY2xhc3MgUGFsZXR0ZSBleHRlbmRzIEFycmF5XHJcblx0XHJcblx0Y29uc3RydWN0b3I6IChhcmdzLi4uKS0+XHJcblx0XHRzdXBlcihhcmdzLi4uKVxyXG5cdFxyXG5cdGFkZDogKG8pLT5cclxuXHRcdG5ld19jb2xvciA9IG5ldyBDb2xvcihvKVxyXG5cdFx0QHB1c2ggbmV3X2NvbG9yXHJcblx0XHJcblx0ZmluYWxpemU6IC0+XHJcblx0XHQjIFRPRE86IGdldCB0aGlzIHdvcmtpbmcgcHJvcGVybHkgYW5kIGVuYWJsZVxyXG5cdFx0IyBpZiBub3QgQG51bWJlck9mQ29sdW1uc1xyXG5cdFx0IyBcdEBndWVzc19kaW1lbnNpb25zKClcclxuXHRcdHVubGVzcyBAcGFyZW50UGFsZXR0ZVdpdGhvdXREdXBsaWNhdGVzXHJcblx0XHRcdEB3aXRoRHVwbGljYXRlcyA9IG5ldyBQYWxldHRlXHJcblx0XHRcdEB3aXRoRHVwbGljYXRlcy5wYXJlbnRQYWxldHRlV2l0aG91dER1cGxpY2F0ZXMgPSBAXHJcblx0XHRcdEB3aXRoRHVwbGljYXRlc1tpXSA9IEBbaV0gZm9yIGkgaW4gWzAuLi5AbGVuZ3RoXVxyXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXMubnVtYmVyT2ZDb2x1bW5zID0gQG51bWJlck9mQ29sdW1uc1xyXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXMuZ2VvbWV0cnlTcGVjaWZpZWRCeUZpbGUgPSBAZ2VvbWV0cnlTcGVjaWZpZWRCeUZpbGVcclxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzLmZpbmFsaXplKClcclxuXHJcblx0XHRcdCMgaW4tcGxhY2UgdW5pcXVpZnlcclxuXHRcdFx0aSA9IDBcclxuXHRcdFx0d2hpbGUgaSA8IEBsZW5ndGhcclxuXHRcdFx0XHRpX2NvbG9yID0gQFtpXVxyXG5cdFx0XHRcdGogPSBpICsgMVxyXG5cdFx0XHRcdHdoaWxlIGogPCBAbGVuZ3RoXHJcblx0XHRcdFx0XHRqX2NvbG9yID0gQFtqXVxyXG5cdFx0XHRcdFx0aWYgaV9jb2xvci5pcyBqX2NvbG9yXHJcblx0XHRcdFx0XHRcdEAuc3BsaWNlKGosIDEpXHJcblx0XHRcdFx0XHRcdGogLT0gMVxyXG5cdFx0XHRcdFx0aiArPSAxXHJcblx0XHRcdFx0aSArPSAxXHJcblxyXG5cdCMjI1xyXG5cdGd1ZXNzX2RpbWVuc2lvbnM6IC0+XHJcblx0XHQjIFRPRE86IGdldCB0aGlzIHdvcmtpbmcgcHJvcGVybHkgYW5kIGVuYWJsZVxyXG5cclxuXHRcdGxlbiA9IEBsZW5ndGhcclxuXHRcdGNhbmRpZGF0ZV9kaW1lbnNpb25zID0gW11cclxuXHRcdGZvciBudW1iZXJPZkNvbHVtbnMgaW4gWzAuLmxlbl1cclxuXHRcdFx0bl9yb3dzID0gbGVuIC8gbnVtYmVyT2ZDb2x1bW5zXHJcblx0XHRcdGlmIG5fcm93cyBpcyBNYXRoLnJvdW5kIG5fcm93c1xyXG5cdFx0XHRcdGNhbmRpZGF0ZV9kaW1lbnNpb25zLnB1c2ggW25fcm93cywgbnVtYmVyT2ZDb2x1bW5zXVxyXG5cdFx0XHJcblx0XHRzcXVhcmVzdCA9IFswLCAzNDk1MDkzXVxyXG5cdFx0Zm9yIGNkIGluIGNhbmRpZGF0ZV9kaW1lbnNpb25zXHJcblx0XHRcdGlmIE1hdGguYWJzKGNkWzBdIC0gY2RbMV0pIDwgTWF0aC5hYnMoc3F1YXJlc3RbMF0gLSBzcXVhcmVzdFsxXSlcclxuXHRcdFx0XHRzcXVhcmVzdCA9IGNkXHJcblx0XHRcclxuXHRcdEBudW1iZXJPZkNvbHVtbnMgPSBzcXVhcmVzdFsxXVxyXG5cdCMjI1xyXG4iLCJcclxuIyBEZXRlY3QgQ1NTIGNvbG9ycyAoZXhjZXB0IG5hbWVkIGNvbG9ycylcclxuXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG4jIFRPRE86IGRldGVjdCBuYW1lcyB2aWEgc3RydWN0dXJlcyBsaWtlIENTUyB2YXJpYWJsZXMsIEpTT04gb2JqZWN0IGtleXMvdmFsdWVzLCBjb21tZW50c1xyXG4jIFRPRE86IHVzZSBhbGwgY29sb3JzIHJlZ2FyZGxlc3Mgb2YgZm9ybWF0LCB3aXRoaW4gYSBkZXRlY3RlZCBzdHJ1Y3R1cmUsIG9yIG1heWJlIGFsd2F5c1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZXMgPSBbXHJcblx0XHRwYWxldHRlX2hleF9sb25nID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9oZXhfc2hvcnQgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX3JnYiA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfaHNsID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9oc2xhID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9yZ2JhID0gbmV3IFBhbGV0dGUoKVxyXG5cdF1cclxuXHRcclxuXHRoZXggPSAoeCktPiBwYXJzZUludCh4LCAxNilcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRcXCMgIyBoYXNodGFnICMgIy9cclxuXHRcdChcclxuXHRcdFx0WzAtOUEtRl17M30gIyB0aHJlZSBoZXgtZGlnaXRzICgjQTBDKVxyXG5cdFx0XHR8XHJcblx0XHRcdFswLTlBLUZdezZ9ICMgc2l4IGhleC1kaWdpdHMgKCNBQTAwQ0MpXHJcblx0XHRcdHxcclxuXHRcdFx0WzAtOUEtRl17NH0gIyB3aXRoIGFscGhhLCBmb3VyIGhleC1kaWdpdHMgKCNBMENGKVxyXG5cdFx0XHR8XHJcblx0XHRcdFswLTlBLUZdezh9ICMgd2l0aCBhbHBoYSwgZWlnaHQgaGV4LWRpZ2l0cyAoI0FBMDBDQ0ZGKVxyXG5cdFx0KVxyXG5cdFx0KD8hWzAtOUEtRl0pICMgKGFuZCBubyBtb3JlISlcclxuXHQvLy9naW0sIChtLCAkMSktPlxyXG5cdFx0aWYgJDEubGVuZ3RoID4gNFxyXG5cdFx0XHRwYWxldHRlX2hleF9sb25nLmFkZFxyXG5cdFx0XHRcdHI6IGhleCAkMVswXSArICQxWzFdXHJcblx0XHRcdFx0ZzogaGV4ICQxWzJdICsgJDFbM11cclxuXHRcdFx0XHRiOiBoZXggJDFbNF0gKyAkMVs1XVxyXG5cdFx0XHRcdGE6IGlmICQxLmxlbmd0aCBpcyA4IHRoZW4gaGV4ICQxWzZdICsgJDFbN10gZWxzZSAxXHJcblx0XHRlbHNlXHJcblx0XHRcdHBhbGV0dGVfaGV4X3Nob3J0LmFkZFxyXG5cdFx0XHRcdHI6IGhleCAkMVswXSArICQxWzBdXHJcblx0XHRcdFx0ZzogaGV4ICQxWzFdICsgJDFbMV1cclxuXHRcdFx0XHRiOiBoZXggJDFbMl0gKyAkMVsyXVxyXG5cdFx0XHRcdGE6IGlmICQxLmxlbmd0aCBpcyA0IHRoZW4gaGV4ICQxWzNdICsgJDFbM10gZWxzZSAxXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0cmdiXFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgcmVkXHJcblx0XHRcdCglPylcclxuXHRcdFxccyooPzosfFxccylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGdyZWVuXHJcblx0XHRcdCglPylcclxuXHRcdFxccyooPzosfFxccylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGJsdWVcclxuXHRcdFx0KCU/KVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChfbSwgcl92YWwsIHJfdW5pdCwgZ192YWwsIGdfdW5pdCwgYl92YWwsIGJfdW5pdCktPlxyXG5cdFx0cGFsZXR0ZV9yZ2IuYWRkXHJcblx0XHRcdHI6IE51bWJlcihyX3ZhbCkgKiAoaWYgcl91bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXHJcblx0XHRcdGc6IE51bWJlcihnX3ZhbCkgKiAoaWYgZ191bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXHJcblx0XHRcdGI6IE51bWJlcihiX3ZhbCkgKiAoaWYgYl91bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0cmdiYT9cXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyByZWRcclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgZ3JlZW5cclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgYmx1ZVxyXG5cdFx0XHQoJT8pXHJcblx0XHRcXHMqKD86LHwvKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgYWxwaGFcclxuXHRcdFx0KCU/KVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChfbSwgcl92YWwsIHJfdW5pdCwgZ192YWwsIGdfdW5pdCwgYl92YWwsIGJfdW5pdCwgYV92YWwsIGFfdW5pdCktPlxyXG5cdFx0cGFsZXR0ZV9yZ2JhLmFkZFxyXG5cdFx0XHRyOiBOdW1iZXIocl92YWwpICogKGlmIHJfdW5pdCBpcyBcIiVcIiB0aGVuIDI1NS8xMDAgZWxzZSAxKVxyXG5cdFx0XHRnOiBOdW1iZXIoZ192YWwpICogKGlmIGdfdW5pdCBpcyBcIiVcIiB0aGVuIDI1NS8xMDAgZWxzZSAxKVxyXG5cdFx0XHRiOiBOdW1iZXIoYl92YWwpICogKGlmIGJfdW5pdCBpcyBcIiVcIiB0aGVuIDI1NS8xMDAgZWxzZSAxKVxyXG5cdFx0XHRhOiBOdW1iZXIoYV92YWwpICogKGlmIGFfdW5pdCBpcyBcIiVcIiB0aGVuIDEvMTAwIGVsc2UgMSlcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRoc2xcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBodWVcclxuXHRcdFx0KGRlZ3xyYWR8dHVybnwpXHJcblx0XHRcXHMqKD86LHxcXHMpXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBzYXR1cmF0aW9uXHJcblx0XHRcdCglPylcclxuXHRcdFxccyooPzosfFxccylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHZhbHVlXHJcblx0XHRcdCglPylcclxuXHRcdFx0XFxzKlxyXG5cdFx0XFwpXHJcblx0Ly8vZ2ltLCAoX20sIGhfdmFsLCBoX3VuaXQsIHNfdmFsLCBzX3VuaXQsIGxfdmFsLCBsX3VuaXQpLT5cclxuXHRcdHBhbGV0dGVfaHNsLmFkZFxyXG5cdFx0XHRoOiBOdW1iZXIoaF92YWwpICogKGlmIGhfdW5pdCBpcyBcInJhZFwiIHRoZW4gMTgwL01hdGguUEkgZWxzZSBpZiBoX3VuaXQgaXMgXCJ0dXJuXCIgdGhlbiAzNjAgZWxzZSAxKVxyXG5cdFx0XHRzOiBOdW1iZXIoc192YWwpICogKGlmIHNfdW5pdCBpcyBcIiVcIiB0aGVuIDEgZWxzZSAxMDApXHJcblx0XHRcdGw6IE51bWJlcihsX3ZhbCkgKiAoaWYgbF91bml0IGlzIFwiJVwiIHRoZW4gMSBlbHNlIDEwMClcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRoc2xhP1xcKFxyXG5cdFx0XHRcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGh1ZVxyXG5cdFx0XHQoZGVnfHJhZHx0dXJufClcclxuXHRcdFxccyooPzosfFxccylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHNhdHVyYXRpb25cclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgdmFsdWVcclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8LylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGFscGhhXHJcblx0XHRcdCglPylcclxuXHRcdFx0XFxzKlxyXG5cdFx0XFwpXHJcblx0Ly8vZ2ltLCAoX20sIGhfdmFsLCBoX3VuaXQsIHNfdmFsLCBzX3VuaXQsIGxfdmFsLCBsX3VuaXQsIGFfdmFsLCBhX3VuaXQpLT5cclxuXHRcdHBhbGV0dGVfaHNsYS5hZGRcclxuXHRcdFx0aDogTnVtYmVyKGhfdmFsKSAqIChpZiBoX3VuaXQgaXMgXCJyYWRcIiB0aGVuIDE4MC9NYXRoLlBJIGVsc2UgaWYgaF91bml0IGlzIFwidHVyblwiIHRoZW4gMzYwIGVsc2UgMSlcclxuXHRcdFx0czogTnVtYmVyKHNfdmFsKSAqIChpZiBzX3VuaXQgaXMgXCIlXCIgdGhlbiAxIGVsc2UgMTAwKVxyXG5cdFx0XHRsOiBOdW1iZXIobF92YWwpICogKGlmIGxfdW5pdCBpcyBcIiVcIiB0aGVuIDEgZWxzZSAxMDApXHJcblx0XHRcdGE6IE51bWJlcihhX3ZhbCkgKiAoaWYgYV91bml0IGlzIFwiJVwiIHRoZW4gMS8xMDAgZWxzZSAxKVxyXG5cdFxyXG5cdG1vc3RfY29sb3JzID0gW11cclxuXHRmb3IgcGFsZXR0ZSBpbiBwYWxldHRlc1xyXG5cdFx0aWYgcGFsZXR0ZS5sZW5ndGggPj0gbW9zdF9jb2xvcnMubGVuZ3RoXHJcblx0XHRcdG1vc3RfY29sb3JzID0gcGFsZXR0ZVxyXG5cdFxyXG5cdG4gPSBtb3N0X2NvbG9ycy5sZW5ndGhcclxuXHRpZiBuIDwgNFxyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFtcclxuXHRcdFx0XCJObyBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgb25lIGNvbG9yIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IGEgY291cGxlIGNvbG9ycyBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBhIGZldyBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XVtuXSArIFwiICgje259KVwiKVxyXG5cdFxyXG5cdG1vc3RfY29sb3JzXHJcbiIsIlxyXG4jIExvYWQgYSBDb2xvclNjaGVtZXIgcGFsZXR0ZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdHZlcnNpb24gPSBici5yZWFkVUludDE2KCkgIyBvciBzb21ldGhpbmdcclxuXHRsZW5ndGggPSBici5yZWFkVUludDE2KClcclxuXHRpID0gMFxyXG5cdHdoaWxlIGkgPCBsZW5ndGhcclxuXHRcdGJyLnNlZWsoOCArIGkgKiAyNilcclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRpICs9IDFcclxuXHJcblx0cGFsZXR0ZVxyXG5cclxuIiwiXHJcbiMgTG9hZCBhIEdJTVAgcGFsZXR0ZVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbnBhcnNlX2dpbXBfb3Jfa2RlX3JnYl9wYWxldHRlID0gKGRhdGEsIGZvcm1hdF9uYW1lKS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IGZvcm1hdF9uYW1lXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYSAje2Zvcm1hdF9uYW1lfVwiXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRpID0gMFxyXG5cdCMgc3RhcnRzIGF0IGkgPSAxIGJlY2F1c2UgdGhlIGluY3JlbWVudCBoYXBwZW5zIGF0IHRoZSBzdGFydCBvZiB0aGUgbG9vcFxyXG5cdHdoaWxlIChpICs9IDEpIDwgbGluZXMubGVuZ3RoXHJcblx0XHRsaW5lID0gbGluZXNbaV1cclxuXHRcdFxyXG5cdFx0aWYgbGluZVswXSBpcyBcIiNcIiBvciBsaW5lIGlzIFwiXCIgdGhlbiBjb250aW51ZVxyXG5cdFx0IyBUT0RPOiBoYW5kbGUgbm9uLXN0YXJ0LW9mLWxpbmUgY29tbWVudHM/IHdoZXJlJ3MgdGhlIHNwZWM/XHJcblx0XHRcclxuXHRcdG0gPSBsaW5lLm1hdGNoKC9OYW1lOlxccyooLiopLylcclxuXHRcdGlmIG1cclxuXHRcdFx0cGFsZXR0ZS5uYW1lID0gbVsxXVxyXG5cdFx0XHRjb250aW51ZVxyXG5cdFx0bSA9IGxpbmUubWF0Y2goL0NvbHVtbnM6XFxzKiguKikvKVxyXG5cdFx0aWYgbVxyXG5cdFx0XHRwYWxldHRlLm51bWJlck9mQ29sdW1ucyA9IE51bWJlcihtWzFdKVxyXG5cdFx0XHQjIFRPRE86IGhhbmRsZSAwIGFzIG5vdCBzcGVjaWZpZWQ/IHdoZXJlJ3MgdGhlIHNwZWMgYXQsIHlvP1xyXG5cdFx0XHRwYWxldHRlLmdlb21ldHJ5U3BlY2lmaWVkQnlGaWxlID0geWVzXHJcblx0XHRcdGNvbnRpbnVlXHJcblx0XHRcclxuXHRcdCMgVE9ETzogcmVwbGFjZSBcXHMgd2l0aCBbXFwgXFx0XSAoc3BhY2VzIG9yIHRhYnMpXHJcblx0XHQjIGl0IGNhbid0IG1hdGNoIFxcbiBiZWNhdXNlIGl0J3MgYWxyZWFkeSBzcGxpdCBvbiB0aGF0LCBidXQgc3RpbGxcclxuXHRcdCMgVE9ETzogaGFuZGxlIGxpbmUgd2l0aCBubyBuYW1lIGJ1dCBzcGFjZSBvbiB0aGUgZW5kXHJcblx0XHRyX2dfYl9uYW1lID0gbGluZS5tYXRjaCgvLy9cclxuXHRcdFx0XiAjIFwiYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgbGluZSxcIlxyXG5cdFx0XHRcXHMqICMgXCJnaXZlIG9yIHRha2Ugc29tZSBzcGFjZXMsXCJcclxuXHRcdFx0IyBtYXRjaCAzIGdyb3VwcyBvZiBudW1iZXJzIHNlcGFyYXRlZCBieSBzcGFjZXNcclxuXHRcdFx0KFswLTldKykgIyByZWRcclxuXHRcdFx0XFxzK1xyXG5cdFx0XHQoWzAtOV0rKSAjIGdyZWVuXHJcblx0XHRcdFxccytcclxuXHRcdFx0KFswLTldKykgIyBibHVlXHJcblx0XHRcdCg/OlxyXG5cdFx0XHRcdFxccytcclxuXHRcdFx0XHQoLiopICMgb3B0aW9uYWxseSBhIG5hbWVcclxuXHRcdFx0KT9cclxuXHRcdFx0JCAjIFwiYW5kIHRoYXQgc2hvdWxkIGJlIHRoZSBlbmQgb2YgdGhlIGxpbmVcIlxyXG5cdFx0Ly8vKVxyXG5cdFx0aWYgbm90IHJfZ19iX25hbWVcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiTGluZSAje2l9IGRvZXNuJ3QgbWF0Y2ggcGF0dGVybiAje3JfZ19iX25hbWV9XCIgIyBUT0RPOiBiZXR0ZXIgbWVzc2FnZT9cclxuXHRcdFxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogcl9nX2JfbmFtZVsxXVxyXG5cdFx0XHRnOiByX2dfYl9uYW1lWzJdXHJcblx0XHRcdGI6IHJfZ19iX25hbWVbM11cclxuXHRcdFx0bmFtZTogcl9nX2JfbmFtZVs0XVxyXG5cdFx0XHJcblx0cGFsZXR0ZVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0cGFyc2VfZ2ltcF9vcl9rZGVfcmdiX3BhbGV0dGUoZGF0YSwgXCJHSU1QIFBhbGV0dGVcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzLnBhcnNlX2dpbXBfb3Jfa2RlX3JnYl9wYWxldHRlID0gcGFyc2VfZ2ltcF9vcl9rZGVfcmdiX3BhbGV0dGVcclxuIiwiXHJcbiMgV2hhdCBkb2VzIEhQTCBzdGFuZCBmb3I/XHJcbiMgSG93ZHksIFBhbGV0dGUgTG92ZXJzIVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBcIlBhbGV0dGVcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiTm90IGFuIEhQTCBwYWxldHRlXCJcclxuXHRpZiBub3QgbGluZXNbMV0ubWF0Y2ggL1ZlcnNpb24gWzM0XVxcLjAvXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbnN1cHBvcnRlZCBIUEwgdmVyc2lvblwiXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRcclxuXHRmb3IgbGluZSwgaSBpbiBsaW5lc1xyXG5cdFx0aWYgbGluZS5tYXRjaCAvLisgLiogLisvXHJcblx0XHRcdHJnYiA9IGxpbmUuc3BsaXQoXCIgXCIpXHJcblx0XHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdFx0cjogcmdiWzBdXHJcblx0XHRcdFx0ZzogcmdiWzFdXHJcblx0XHRcdFx0YjogcmdiWzJdXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxue3BhcnNlX2dpbXBfb3Jfa2RlX3JnYl9wYWxldHRlfSA9IHJlcXVpcmUgXCIuL0dJTVBcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0cGFyc2VfZ2ltcF9vcl9rZGVfcmdiX3BhbGV0dGUoZGF0YSwgXCJLREUgUkdCIFBhbGV0dGVcIilcclxuIiwiXHJcbiMgTG9hZCBhIFBhaW50Lk5FVCBwYWxldHRlIGZpbGVcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRcclxuXHRoZXggPSAoeCktPiBwYXJzZUludCh4LCAxNilcclxuXHRcclxuXHRmb3IgbGluZSBpbiBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRcdG0gPSBsaW5lLm1hdGNoKC9eKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KSQvaSlcclxuXHRcdGlmIG0gdGhlbiBwYWxldHRlLmFkZFxyXG5cdFx0XHRhOiBoZXggbVsxXVxyXG5cdFx0XHRyOiBoZXggbVsyXVxyXG5cdFx0XHRnOiBoZXggbVszXVxyXG5cdFx0XHRiOiBoZXggbVs0XVxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIEpBU0MgUEFMIGZpbGUgKFBhaW50IFNob3AgUHJvIHBhbGV0dGUgZmlsZSlcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IFwiSkFTQy1QQUxcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiTm90IGEgSkFTQy1QQUxcIlxyXG5cdGlmIGxpbmVzWzFdIGlzbnQgXCIwMTAwXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVua25vd24gSkFTQy1QQUwgdmVyc2lvblwiXHJcblx0aWYgbGluZXNbMl0gaXNudCBcIjI1NlwiXHJcblx0XHRcInRoYXQncyBva1wiXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHQjbl9jb2xvcnMgPSBOdW1iZXIobGluZXNbMl0pXHJcblx0XHJcblx0Zm9yIGxpbmUsIGkgaW4gbGluZXNcclxuXHRcdGlmIGxpbmUgaXNudCBcIlwiIGFuZCBpID4gMlxyXG5cdFx0XHRyZ2IgPSBsaW5lLnNwbGl0KFwiIFwiKVxyXG5cdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdHI6IHJnYlswXVxyXG5cdFx0XHRcdGc6IHJnYlsxXVxyXG5cdFx0XHRcdGI6IHJnYlsyXVxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIFJlc291cmNlIEludGVyY2hhbmdlIEZpbGUgRm9ybWF0IFBBTCBmaWxlXHJcblxyXG4jIHBvcnRlZCBmcm9tIEMjIGNvZGUgYXQgaHR0cHM6Ly93b3JtczJkLmluZm8vUGFsZXR0ZV9maWxlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdCMgUklGRiBoZWFkZXJcclxuXHRyaWZmID0gYnIucmVhZFN0cmluZyg0KSAjIFwiUklGRlwiXHJcblx0ZGF0YVNpemUgPSBici5yZWFkVUludDMyKClcclxuXHR0eXBlID0gYnIucmVhZFN0cmluZyg0KSAjIFwiUEFMIFwiXHJcblx0XHJcblx0aWYgcmlmZiBpc250IFwiUklGRlwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJSSUZGIGhlYWRlciBub3QgZm91bmQ7IG5vdCBhIFJJRkYgUEFMIGZpbGVcIlxyXG5cdFxyXG5cdGlmIHR5cGUgaXNudCBcIlBBTCBcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiXCJcIlxyXG5cdFx0XHRSSUZGIGhlYWRlciBzYXlzIHRoaXMgaXNuJ3QgYSBQQUwgZmlsZSxcclxuXHRcdFx0bW9yZSBvZiBhIHNvcnQgb2YgI3soKHR5cGUrXCJcIikudHJpbSgpKX0gZmlsZVxyXG5cdFx0XCJcIlwiXHJcblx0XHJcblx0IyBEYXRhIGNodW5rXHJcblx0Y2h1bmtUeXBlID0gYnIucmVhZFN0cmluZyg0KSAjIFwiZGF0YVwiXHJcblx0Y2h1bmtTaXplID0gYnIucmVhZFVJbnQzMigpXHJcblx0cGFsVmVyc2lvbiA9IGJyLnJlYWRVSW50MTYoKSAjIDB4MDMwMFxyXG5cdHBhbE51bUVudHJpZXMgPSBici5yZWFkVUludDE2KClcclxuXHRcclxuXHRcclxuXHRpZiBjaHVua1R5cGUgaXNudCBcImRhdGFcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiRGF0YSBjaHVuayBub3QgZm91bmQgKC4uLicje2NodW5rVHlwZX0nPylcIlxyXG5cdFxyXG5cdGlmIHBhbFZlcnNpb24gaXNudCAweDAzMDBcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVuc3VwcG9ydGVkIFBBTCBmaWxlIGZvcm1hdCB2ZXJzaW9uOiAweCN7cGFsVmVyc2lvbi50b1N0cmluZygxNil9XCJcclxuXHRcclxuXHQjIENvbG9yc1xyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0aSA9IDBcclxuXHR3aGlsZSAoaSArPSAxKSA8IHBhbE51bUVudHJpZXMgLSAxXHJcblx0XHRcclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdF86IGJyLnJlYWRCeXRlKCkgIyBcImZsYWdzXCIsIGFsd2F5cyAweDAwXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBMb2FkIGEgU2tlbmNpbCBwYWxldHRlICguc3BsKSAoXCJTa2V0Y2ggUkdCUGFsZXR0ZVwiKVxyXG4jIChub3QgcmVsYXRlZCB0byAuc2tldGNocGFsZXR0ZSBTa2V0Y2ggQXBwIHBhbGV0dGUgZm9ybWF0KVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRpID0gMVxyXG5cdHdoaWxlIChpICs9IDEpIDwgbGluZXMubGVuZ3RoXHJcblx0XHRsaW5lID0gbGluZXNbaV1cclxuXHRcdFxyXG5cdFx0aWYgbGluZVswXSBpcyBcIiNcIiBvciBsaW5lIGlzIFwiXCIgdGhlbiBjb250aW51ZVxyXG5cdFx0IyBUT0RPOiBoYW5kbGUgbm9uLXN0YXJ0LW9mLWxpbmUgY29tbWVudHM/IHdoZXJlJ3MgdGhlIHNwZWM/XHJcblx0XHRcclxuXHRcdCMgVE9ETzogcmVwbGFjZSBcXHMgd2l0aCBbXFwgXFx0XSAoc3BhY2VzIG9yIHRhYnMpXHJcblx0XHQjIGl0IGNhbid0IG1hdGNoIFxcbiBiZWNhdXNlIGl0J3MgYWxyZWFkeSBzcGxpdCBvbiB0aGF0LCBidXQgc3RpbGxcclxuXHRcdCMgVE9ETzogaGFuZGxlIGxpbmUgd2l0aCBubyBuYW1lIGJ1dCBzcGFjZSBvbiB0aGUgZW5kXHJcblx0XHRyX2dfYl9uYW1lID0gbGluZS5tYXRjaCgvLy9cclxuXHRcdFx0XiAjIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpbmUsXHJcblx0XHRcdFxccyogIyBwZXJoYXBzIHdpdGggc29tZSBsZWFkaW5nIHNwYWNlc1xyXG5cdFx0XHQjIG1hdGNoIDMgZ3JvdXBzIG9mIG51bWJlcnMgc2VwYXJhdGVkIGJ5IHNwYWNlc1xyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyByZWRcclxuXHRcdFx0XFxzK1xyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBncmVlblxyXG5cdFx0XHRcXHMrXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGJsdWVcclxuXHRcdFx0KD86XHJcblx0XHRcdFx0XFxzK1xyXG5cdFx0XHRcdCguKikgIyBvcHRpb25hbGx5IGEgbmFtZVxyXG5cdFx0XHQpP1xyXG5cdFx0XHQkICMgXCJhbmQgdGhhdCBzaG91bGQgYmUgdGhlIGVuZCBvZiB0aGUgbGluZVwiXHJcblx0XHQvLy8pXHJcblx0XHRpZiBub3Qgcl9nX2JfbmFtZVxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJMaW5lICN7aX0gZG9lc24ndCBtYXRjaCBwYXR0ZXJuICN7cl9nX2JfbmFtZX1cIiAjIFRPRE86IGJldHRlciBtZXNzYWdlP1xyXG5cdFx0XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiByX2dfYl9uYW1lWzFdICogMjU1XHJcblx0XHRcdGc6IHJfZ19iX25hbWVbMl0gKiAyNTVcclxuXHRcdFx0Yjogcl9nX2JfbmFtZVszXSAqIDI1NVxyXG5cdFx0XHRuYW1lOiByX2dfYl9uYW1lWzRdXHJcblx0XHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIFBBTCAoU3RhckNyYWZ0IHJhdyBwYWxldHRlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdGlmIGJyLmdldFNpemUoKSBpc250IDc2OFxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiV3JvbmcgZmlsZSBzaXplLCBtdXN0IGJlICN7NzY4fSBieXRlcyBsb25nIChub3QgI3tici5nZXRTaXplKCl9KVwiXHJcblx0XHJcblx0Zm9yIGkgaW4gWzAuLi4yNTVdXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHQjOiBubyBwYWRkaW5nXHJcblx0XHJcblx0Iz8gcGFsZXR0ZS5udW1iZXJPZkNvbHVtbnMgPSAxNlxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgV1BFIChTdGFyQ3JhZnQgcGFkZGVkIHJhdyBwYWxldHRlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdGlmIGJyLmdldFNpemUoKSBpc250IDEwMjRcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIldyb25nIGZpbGUgc2l6ZSwgbXVzdCBiZSAjezEwMjR9IGJ5dGVzIGxvbmcgKG5vdCAje2JyLmdldFNpemUoKX0pXCJcclxuXHRcclxuXHRmb3IgaSBpbiBbMC4uLjI1NV1cclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdF86IGJyLnJlYWRCeXRlKCkgIyBwYWRkaW5nXHJcblx0XHJcblx0cGFsZXR0ZS5udW1iZXJPZkNvbHVtbnMgPSAxNlxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIFNrZXRjaCBBcHAgSlNPTiBwYWxldHRlICguc2tldGNocGFsZXR0ZSlcclxuIyAobm90IHJlbGF0ZWQgdG8gLnNwbCBTa2V0Y2ggUkdCIHBhbGV0dGUgZm9ybWF0KVxyXG5cclxuIyBiYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vYW5kcmV3ZmlvcmlsbG8vc2tldGNoLXBhbGV0dGVzL2Jsb2IvNWI2YmZhNmViMjVjYjMyNDRhOWU2YTIyNmRmMjU5ZThmYjMxZmMyYy9Ta2V0Y2glMjBQYWxldHRlcy5za2V0Y2hwbHVnaW4vQ29udGVudHMvU2tldGNoL3NrZXRjaFBhbGV0dGVzLmpzXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxudmVyc2lvbiA9IDEuNFxyXG5cclxuIyBUT0RPOiBEUlkgd2l0aCBDU1MuY29mZmVlXHJcbnBhcnNlX2Nzc19oZXhfY29sb3IgPSAoaGV4X2NvbG9yKS0+XHJcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXHJcblx0XHJcblx0bWF0Y2ggPSBoZXhfY29sb3IubWF0Y2goLy8vXHJcblx0XHRcXCMgIyBoYXNodGFnICMgIy9cclxuXHRcdChcclxuXHRcdFx0WzAtOUEtRl17M30gIyB0aHJlZSBoZXgtZGlnaXRzICgjQTBDKVxyXG5cdFx0XHR8XHJcblx0XHRcdFswLTlBLUZdezZ9ICMgc2l4IGhleC1kaWdpdHMgKCNBQTAwQ0MpXHJcblx0XHRcdHxcclxuXHRcdFx0WzAtOUEtRl17NH0gIyB3aXRoIGFscGhhLCBmb3VyIGhleC1kaWdpdHMgKCNBMENGKVxyXG5cdFx0XHR8XHJcblx0XHRcdFswLTlBLUZdezh9ICMgd2l0aCBhbHBoYSwgZWlnaHQgaGV4LWRpZ2l0cyAoI0FBMDBDQ0ZGKVxyXG5cdFx0KVxyXG5cdFx0KD8hWzAtOUEtRl0pICMgKGFuZCBubyBtb3JlISlcclxuXHQvLy9naW0pXHJcblxyXG5cdFskMCwgJDFdID0gbWF0Y2hcclxuXHJcblx0aWYgJDEubGVuZ3RoID4gNFxyXG5cdFx0cjogaGV4ICQxWzBdICsgJDFbMV1cclxuXHRcdGc6IGhleCAkMVsyXSArICQxWzNdXHJcblx0XHRiOiBoZXggJDFbNF0gKyAkMVs1XVxyXG5cdFx0YTogaWYgJDEubGVuZ3RoIGlzIDggdGhlbiBoZXggJDFbNl0gKyAkMVs3XSBlbHNlIDFcclxuXHRlbHNlXHJcblx0XHRyOiBoZXggJDFbMF0gKyAkMVswXVxyXG5cdFx0ZzogaGV4ICQxWzFdICsgJDFbMV1cclxuXHRcdGI6IGhleCAkMVsyXSArICQxWzJdXHJcblx0XHRhOiBpZiAkMS5sZW5ndGggaXMgNCB0aGVuIGhleCAkMVszXSArICQxWzNdIGVsc2UgMVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0cGFsZXR0ZUNvbnRlbnRzID0gSlNPTi5wYXJzZShkYXRhKVxyXG5cclxuXHRjb21wYXRpYmxlVmVyc2lvbiA9IHBhbGV0dGVDb250ZW50cy5jb21wYXRpYmxlVmVyc2lvblxyXG5cclxuXHQjIENoZWNrIGZvciBwcmVzZXRzIGluIGZpbGUsIGVsc2Ugc2V0IHRvIGVtcHR5IGFycmF5XHJcblx0Y29sb3JEZWZpbml0aW9ucyA9IHBhbGV0dGVDb250ZW50cy5jb2xvcnMgPyBbXVxyXG5cdGdyYWRpZW50RGVmaW5pdGlvbnMgPSBwYWxldHRlQ29udGVudHMuZ3JhZGllbnRzID8gW11cclxuXHRpbWFnZURlZmluaXRpb25zID0gcGFsZXR0ZUNvbnRlbnRzLmltYWdlcyA/IFtdXHJcblx0Y29sb3JBc3NldHMgPSBbXVxyXG5cdGdyYWRpZW50QXNzZXRzID0gW11cclxuXHRpbWFnZXMgPSBbXVxyXG5cclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGVcclxuXHJcblx0IyBDaGVjayBpZiBwbHVnaW4gaXMgb3V0IG9mIGRhdGUgYW5kIGluY29tcGF0aWJsZSB3aXRoIGEgbmV3ZXIgcGFsZXR0ZSB2ZXJzaW9uXHJcblx0aWYgY29tcGF0aWJsZVZlcnNpb24gYW5kIGNvbXBhdGlibGVWZXJzaW9uID4gdmVyc2lvblxyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgaGFuZGxlIGNvbXBhdGlibGVWZXJzaW9uIG9mICN7Y29tcGF0aWJsZVZlcnNpb259LlwiKVxyXG5cdFx0cmV0dXJuXHJcblxyXG5cdCMgQ2hlY2sgZm9yIG9sZGVyIGhleCBjb2RlIHBhbGV0dGUgdmVyc2lvblxyXG5cdGlmIG5vdCBjb21wYXRpYmxlVmVyc2lvbiBvciBjb21wYXRpYmxlVmVyc2lvbiA8IDEuNFxyXG5cdFx0IyBDb252ZXJ0IGhleCBjb2xvcnNcclxuXHRcdGZvciBoZXhfY29sb3IgaW4gY29sb3JEZWZpbml0aW9uc1xyXG5cdFx0XHRwYWxldHRlLmFkZChwYXJzZV9jc3NfaGV4X2NvbG9yKGhleF9jb2xvcikpXHJcblx0ZWxzZVxyXG5cdFx0IyBDb2xvciBGaWxsczogY29udmVydCByZ2JhIGNvbG9yc1xyXG5cdFx0aWYgY29sb3JEZWZpbml0aW9ucy5sZW5ndGggPiAwXHJcblx0XHRcdGZvciBjb2xvcl9kZWZpbml0aW9uIGluIGNvbG9yRGVmaW5pdGlvbnNcclxuXHRcdFx0XHRwYWxldHRlLmFkZChcclxuXHRcdFx0XHRcdHI6IGNvbG9yX2RlZmluaXRpb24ucmVkICogMjU1XHJcblx0XHRcdFx0XHRnOiBjb2xvcl9kZWZpbml0aW9uLmdyZWVuICogMjU1XHJcblx0XHRcdFx0XHRiOiBjb2xvcl9kZWZpbml0aW9uLmJsdWUgKiAyNTVcclxuXHRcdFx0XHRcdGE6IGNvbG9yX2RlZmluaXRpb24uYWxwaGEgKiAyNTVcclxuXHRcdFx0XHRcdG5hbWU6IGNvbG9yX2RlZmluaXRpb24ubmFtZVxyXG5cdFx0XHRcdClcclxuXHJcblx0XHQjICMgUGF0dGVybiBGaWxsczogY29udmVydCBiYXNlNjQgc3RyaW5ncyB0byBNU0ltYWdlRGF0YSBvYmplY3RzXHJcblx0XHQjIGlmIGltYWdlRGVmaW5pdGlvbnMubGVuZ3RoID4gMFxyXG5cdFx0IyBcdGZvciBpIGluIFswLi5pbWFnZURlZmluaXRpb25zLmxlbmd0aF1cclxuXHRcdCMgXHRcdG5zZGF0YSA9IE5TRGF0YS5hbGxvYygpLmluaXRXaXRoQmFzZTY0RW5jb2RlZFN0cmluZ19vcHRpb25zKGltYWdlRGVmaW5pdGlvbnNbaV0uZGF0YSwgMClcclxuXHRcdCMgXHRcdG5zaW1hZ2UgPSBOU0ltYWdlLmFsbG9jKCkuaW5pdFdpdGhEYXRhKG5zZGF0YSlcclxuXHRcdCMgXHRcdCMgbXNpbWFnZSA9IE1TSW1hZ2VEYXRhLmFsbG9jKCkuaW5pdFdpdGhJbWFnZUNvbnZlcnRpbmdDb2xvclNwYWNlKG5zaW1hZ2UpXHJcblx0XHQjIFx0XHRtc2ltYWdlID0gTVNJbWFnZURhdGEuYWxsb2MoKS5pbml0V2l0aEltYWdlKG5zaW1hZ2UpXHJcblx0XHQjIFx0XHRpbWFnZXMucHVzaChtc2ltYWdlKVxyXG5cclxuXHRcdCMgIyBHcmFkaWVudCBGaWxsczogYnVpbGQgTVNHcmFkaWVudFN0b3AgYW5kIE1TR3JhZGllbnQgb2JqZWN0c1xyXG5cdFx0IyBpZiBncmFkaWVudERlZmluaXRpb25zLmxlbmd0aCA+IDBcclxuXHRcdCMgXHRmb3IgaSBpbiBbMC4uZ3JhZGllbnREZWZpbml0aW9ucy5sZW5ndGhdXHJcblx0XHQjIFx0XHQjIENyZWF0ZSBncmFkaWVudCBzdG9wc1xyXG5cdFx0IyBcdFx0Z3JhZGllbnQgPSBncmFkaWVudERlZmluaXRpb25zW2ldXHJcblx0XHQjIFx0XHRzdG9wcyA9IFtdXHJcblx0XHQjIFx0XHRmb3IgaiBpbiBbMC4uZ3JhZGllbnQuc3RvcHNdXHJcblx0XHQjIFx0XHRcdGNvbG9yID0gTVNDb2xvci5jb2xvcldpdGhSZWRfZ3JlZW5fYmx1ZV9hbHBoYShcclxuXHRcdCMgXHRcdFx0XHRncmFkaWVudC5zdG9wc1tqXS5jb2xvci5yZWQsXHJcblx0XHQjIFx0XHRcdFx0Z3JhZGllbnQuc3RvcHNbal0uY29sb3IuZ3JlZW4sXHJcblx0XHQjIFx0XHRcdFx0Z3JhZGllbnQuc3RvcHNbal0uY29sb3IuYmx1ZSxcclxuXHRcdCMgXHRcdFx0XHRncmFkaWVudC5zdG9wc1tqXS5jb2xvci5hbHBoYVxyXG5cdFx0IyBcdFx0XHQpXHJcblx0XHQjIFx0XHRcdHN0b3BzLnB1c2goTVNHcmFkaWVudFN0b3Auc3RvcFdpdGhQb3NpdGlvbl9jb2xvcl8oZ3JhZGllbnQuc3RvcHNbal0ucG9zaXRpb24sIGNvbG9yKSlcclxuXHJcblx0XHQjIFx0XHQjIENyZWF0ZSBncmFkaWVudCBvYmplY3QgYW5kIHNldCBiYXNpYyBwcm9wZXJ0aWVzXHJcblx0XHQjIFx0XHRtc2dyYWRpZW50ID0gTVNHcmFkaWVudC5uZXcoKVxyXG5cdFx0IyBcdFx0bXNncmFkaWVudC5zZXRHcmFkaWVudFR5cGUoZ3JhZGllbnQuZ3JhZGllbnRUeXBlKVxyXG5cdFx0IyBcdFx0IyBtc2dyYWRpZW50LnNob3VsZFNtb290aGVuT3BhY2l0eSA9IGdyYWRpZW50LnNob3VsZFNtb290aGVuT3BhY2l0eVxyXG5cdFx0IyBcdFx0bXNncmFkaWVudC5lbGlwc2VMZW5ndGggPSBncmFkaWVudC5lbGlwc2VMZW5ndGhcclxuXHRcdCMgXHRcdG1zZ3JhZGllbnQuc2V0U3RvcHMoc3RvcHMpXHJcblxyXG5cdFx0IyBcdFx0IyBQYXJzZSBGcm9tIGFuZCBUbyB2YWx1ZXMgaW50byBhcnJheXMgZS5nLjogZnJvbTogXCJ7MC4xLC0wLjQzfVwiID0+IGZyb21WYWx1ZSA9IFswLjEsIC0wLjQzXVxyXG5cdFx0IyBcdFx0ZnJvbVZhbHVlID0gZ3JhZGllbnQuZnJvbS5zbGljZSgxLC0xKS5zcGxpdChcIixcIilcclxuXHRcdCMgXHRcdHRvVmFsdWUgPSBncmFkaWVudC50by5zbGljZSgxLC0xKS5zcGxpdChcIixcIilcclxuXHJcblx0XHQjIFx0XHQjIFNldCBDR1BvaW50IG9iamVjdHMgYXMgRnJvbSBhbmQgVG8gdmFsdWVzXHJcblx0XHQjIFx0XHRtc2dyYWRpZW50LnNldEZyb20oeyB4OiBmcm9tVmFsdWVbMF0sIHk6IGZyb21WYWx1ZVsxXSB9KVxyXG5cdFx0IyBcdFx0bXNncmFkaWVudC5zZXRUbyh7IHg6IHRvVmFsdWVbMF0sIHk6IHRvVmFsdWVbMV0gfSlcclxuXHJcblx0XHQjIFx0XHRncmFkaWVudE5hbWUgPSBncmFkaWVudERlZmluaXRpb25zW2ldLm5hbWUgPyBncmFkaWVudERlZmluaXRpb25zW2ldLm5hbWUgOiBudWxsXHJcblx0XHQjIFx0XHRncmFkaWVudEFzc2V0cy5wdXNoKE1TR3JhZGllbnRBc3NldC5hbGxvYygpLmluaXRXaXRoQXNzZXRfbmFtZShtc2dyYWRpZW50LCBncmFkaWVudE5hbWUpKVxyXG5cclxuXHRwYWxldHRlXHJcbiIsIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4vUGFsZXR0ZVwiXHJcbkNvbG9yID0gcmVxdWlyZSBcIi4vQ29sb3JcIlxyXG5cclxuY2xhc3MgUmFuZG9tQ29sb3IgZXh0ZW5kcyBDb2xvclxyXG5cdGNvbnN0cnVjdG9yOiAtPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QHJhbmRvbWl6ZSgpXHJcblx0XHJcblx0cmFuZG9taXplOiAtPlxyXG5cdFx0QGggPSBNYXRoLnJhbmRvbSgpICogMzYwXHJcblx0XHRAcyA9IE1hdGgucmFuZG9tKCkgKiAxMDBcclxuXHRcdEBsID0gTWF0aC5yYW5kb20oKSAqIDEwMFxyXG5cdFxyXG5cdHRvU3RyaW5nOiAtPlxyXG5cdFx0QHJhbmRvbWl6ZSgpXHJcblx0XHRcImhzbCgje0BofSwgI3tAc30lLCAje0BsfSUpXCJcclxuXHRcclxuXHRpczogLT4gbm9cclxuXHJcbmNsYXNzIFJhbmRvbVBhbGV0dGUgZXh0ZW5kcyBQYWxldHRlXHJcblx0Y29uc3RydWN0b3I6IC0+XHJcblx0XHRzdXBlcigpXHJcblx0XHRAbG9hZGVyID1cclxuXHRcdFx0bmFtZTogXCJDb21wbGV0ZWx5IFJhbmRvbSBDb2xvcnPihKJcIlxyXG5cdFx0XHRmaWxlRXh0ZW5zaW9uczogW11cclxuXHRcdFx0ZmlsZUV4dGVuc2lvbnNQcmV0dHk6IFwiKC5jcmMgc2pmKERmMDlzamRma3NkbGZtbm0gJzsnO1wiXHJcblx0XHRAbWF0Y2hlZExvYWRlckZpbGVFeHRlbnNpb25zID0gbm9cclxuXHRcdEBjb25maWRlbmNlID0gMFxyXG5cdFx0QGZpbmFsaXplKClcclxuXHRcdGZvciBpIGluIFswLi5NYXRoLnJhbmRvbSgpKjE1KzVdXHJcblx0XHRcdEBwdXNoIG5ldyBSYW5kb21Db2xvcigpXHJcblxyXG5jbGFzcyBMb2FkaW5nRXJyb3JzIGV4dGVuZHMgRXJyb3JcclxuXHRjb25zdHJ1Y3RvcjogKEBlcnJvcnMpLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEBtZXNzYWdlID0gXCJTb21lIGVycm9ycyB3ZXJlIGVuY291bnRlcmVkIHdoZW4gbG9hZGluZzpcIiArXHJcblx0XHRcdGZvciBlcnJvciBpbiBAZXJyb3JzXHJcblx0XHRcdFx0XCJcXG5cXHRcIiArIGVycm9yLm1lc3NhZ2VcclxuXHJcbmxvYWRfcGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxyXG5cdFxyXG5cdHBhbGV0dGVfbG9hZGVycyA9IFtcclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJQYWludCBTaG9wIFBybyBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wicGFsXCIsIFwicHNwcGFsZXR0ZVwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50U2hvcFByb1wiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUklGRiBQQUxcIlxyXG5cdFx0XHRleHRzOiBbXCJwYWxcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9SSUZGXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJDb2xvclNjaGVtZXIgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImNzXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQ29sb3JTY2hlbWVyXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJQYWludC5ORVQgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInR4dFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50Lk5FVFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiR0lNUCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiZ3BsXCIsIFwiZ2ltcFwiLCBcImNvbG9yc1wiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0dJTVBcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIktERSBSR0IgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImNvbG9yc1wiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0tERVwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiU2tldGNoIFJHQiBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wic3BsXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvU1BMXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJTa2V0Y2ggcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInNrZXRjaHBhbGV0dGVcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9za2V0Y2hwYWxldHRlXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJDU1MgY29sb3JzXCJcclxuXHRcdFx0ZXh0czogW1wiY3NzXCIsIFwic2Nzc1wiLCBcInNhc3NcIiwgXCJsZXNzXCIsIFwic3R5bFwiLCBcImh0bWxcIiwgXCJodG1cIiwgXCJzdmdcIiwgXCJqc1wiLCBcInRzXCIsIFwieG1sXCIsIFwidHh0XCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQ1NTXCJcclxuXHRcdH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgU3dhdGNoXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY29cIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JTd2F0Y2hcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIFRhYmxlXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY3RcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JUYWJsZVwiXHJcblx0XHQjIH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgU3dhdGNoIEV4Y2hhbmdlXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhc2VcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlU3dhdGNoRXhjaGFuZ2VcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIEJvb2tcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjYlwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvckJvb2tcIlxyXG5cdFx0IyB9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiSFBMIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJocGxcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9IUExcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlN0YXJDcmFmdCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wicGFsXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvU3RhckNyYWZ0XCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJTdGFyQ3JhZnQgdGVycmFpbiBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wid3BlXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvU3RhckNyYWZ0UGFkZGVkXCJcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBdXRvQ0FEIENvbG9yIEJvb2tcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjYlwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQXV0b0NBRENvbG9yQm9va1wiXHJcblx0XHQjIH1cclxuXHRcdFxyXG5cdFx0IyB7XHJcblx0XHQjIFx0IyAoc2FtZSBhcyBQYWludCBTaG9wIFBybyBwYWxldHRlPylcclxuXHRcdCMgXHRuYW1lOiBcIkNvcmVsRFJBVyBwYWxldHRlXCJcclxuXHRcdCMgXHRleHRzOiBbXCJwYWxcIiwgXCJjcGxcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0NvcmVsRFJBV1wiXHJcblx0XHQjIH1cclxuXHRdXHJcblx0XHJcblx0IyBmaW5kIHBhbGV0dGUgbG9hZGVycyB0aGF0IHVzZSB0aGlzIGZpbGUgZXh0ZW5zaW9uXHJcblx0Zm9yIHBsIGluIHBhbGV0dGVfbG9hZGVyc1xyXG5cdFx0cGwubWF0Y2hlc19leHQgPSBwbC5leHRzLmluZGV4T2Yoby5maWxlRXh0KSBpc250IC0xXHJcblx0XHJcblx0IyBtb3ZlIHBhbGV0dGUgbG9hZGVycyB0byB0aGUgYmVnaW5uaW5nIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cclxuXHRwYWxldHRlX2xvYWRlcnMuc29ydCAocGwxLCBwbDIpLT5cclxuXHRcdHBsMi5tYXRjaGVzX2V4dCAtIHBsMS5tYXRjaGVzX2V4dFxyXG5cdFxyXG5cdCMgdHJ5IGxvYWRpbmcgc3R1ZmZcclxuXHRlcnJvcnMgPSBbXVxyXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcclxuXHRcdFxyXG5cdFx0dHJ5XHJcblx0XHRcdHBhbGV0dGUgPSBwbC5sb2FkKG8pXHJcblx0XHRcdGlmIHBhbGV0dGUubGVuZ3RoIGlzIDBcclxuXHRcdFx0XHRwYWxldHRlID0gbnVsbFxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIm5vIGNvbG9ycyByZXR1cm5lZFwiXHJcblx0XHRjYXRjaCBlXHJcblx0XHRcdG1zZyA9IFwiZmFpbGVkIHRvIGxvYWQgI3tvLmZpbGVOYW1lfSBhcyAje3BsLm5hbWV9OiAje2UubWVzc2FnZX1cIlxyXG5cdFx0XHQjIGlmIHBsLm1hdGNoZXNfZXh0IGFuZCBub3QgZS5tZXNzYWdlLm1hdGNoKC9ub3QgYS9pKVxyXG5cdFx0XHQjIFx0Y29uc29sZT8uZXJyb3I/IG1zZ1xyXG5cdFx0XHQjIGVsc2VcclxuXHRcdFx0IyBcdGNvbnNvbGU/Lndhcm4/IG1zZ1xyXG5cdFx0XHRcclxuXHRcdFx0IyBUT0RPOiBtYXliZSB0aGlzIHNob3VsZG4ndCBiZSBhbiBFcnJvciBvYmplY3QsIGp1c3QgYSB7bWVzc2FnZSwgZXJyb3J9IG9iamVjdFxyXG5cdFx0XHQjIG9yIHtmcmllbmRseU1lc3NhZ2UsIGVycm9yfVxyXG5cdFx0XHRlcnIgPSBuZXcgRXJyb3IgbXNnXHJcblx0XHRcdGVyci5lcnJvciA9IGVcclxuXHRcdFx0ZXJyb3JzLnB1c2ggZXJyXHJcblx0XHRcclxuXHRcdGlmIHBhbGV0dGVcclxuXHRcdFx0IyBjb25zb2xlPy5pbmZvPyBcImxvYWRlZCAje28uZmlsZU5hbWV9IGFzICN7cGwubmFtZX1cIlxyXG5cdFx0XHRwYWxldHRlLmNvbmZpZGVuY2UgPSBpZiBwbC5tYXRjaGVzX2V4dCB0aGVuIDAuOSBlbHNlIDAuMDFcclxuXHRcdFx0ZXh0c19wcmV0dHkgPSBcIi4je3BsLmV4dHMuam9pbihcIiwgLlwiKX1cIlxyXG5cdFx0XHRcclxuXHRcdFx0IyBUT0RPOiBwcm9iYWJseSByZW5hbWUgbG9hZGVyIC0+IGZvcm1hdCB3aGVuIDItd2F5IGRhdGEgZmxvdyAocmVhZC93cml0ZSkgaXMgc3VwcG9ydGVkXHJcblx0XHRcdCMgVE9ETzogbWF5YmUgbWFrZSB0aGlzIGEgM3JkIChhbmQgZm91cnRoPykgYXJndW1lbnQgdG8gdGhlIGNhbGxiYWNrXHJcblx0XHRcdHBhbGV0dGUubG9hZGVyID1cclxuXHRcdFx0XHRuYW1lOiBwbC5uYW1lXHJcblx0XHRcdFx0ZmlsZUV4dGVuc2lvbnM6IHBsLmV4dHNcclxuXHRcdFx0XHRmaWxlRXh0ZW5zaW9uc1ByZXR0eTogZXh0c19wcmV0dHlcclxuXHRcdFx0cGFsZXR0ZS5tYXRjaGVkTG9hZGVyRmlsZUV4dGVuc2lvbnMgPSBwbC5tYXRjaGVzX2V4dFxyXG5cdFx0XHRcclxuXHRcdFx0cGFsZXR0ZS5maW5hbGl6ZSgpXHJcblx0XHRcdGNhbGxiYWNrKG51bGwsIHBhbGV0dGUpXHJcblx0XHRcdHJldHVyblxyXG5cdFxyXG5cdGNhbGxiYWNrKG5ldyBMb2FkaW5nRXJyb3JzKGVycm9ycykpXHJcblx0cmV0dXJuXHJcblxyXG5ub3JtYWxpemVfb3B0aW9ucyA9IChvID0ge30pLT5cclxuXHRpZiB0eXBlb2YgbyBpcyBcInN0cmluZ1wiIG9yIG8gaW5zdGFuY2VvZiBTdHJpbmdcclxuXHRcdG8gPSBmaWxlUGF0aDogb1xyXG5cdGlmIEZpbGU/IGFuZCBvIGluc3RhbmNlb2YgRmlsZVxyXG5cdFx0byA9IGZpbGU6IG9cclxuXHRcclxuXHQjIG8ubWluQ29sb3JzID89IDJcclxuXHQjIG8ubWF4Q29sb3JzID89IDI1NlxyXG5cdG8uZmlsZU5hbWUgPz0gby5maWxlPy5uYW1lID8gKGlmIG8uZmlsZVBhdGggdGhlbiByZXF1aXJlKFwicGF0aFwiKS5iYXNlbmFtZShvLmZpbGVQYXRoKSlcclxuXHRvLmZpbGVFeHQgPz0gXCIje28uZmlsZU5hbWV9XCIuc3BsaXQoXCIuXCIpLnBvcCgpXHJcblx0by5maWxlRXh0ID0gXCIje28uZmlsZUV4dH1cIi50b0xvd2VyQ2FzZSgpXHJcblx0b1xyXG5cclxuQW55UGFsZXR0ZSA9IHtcclxuXHRDb2xvclxyXG5cdFBhbGV0dGVcclxuXHRSYW5kb21Db2xvclxyXG5cdFJhbmRvbVBhbGV0dGVcclxuXHQjIExvYWRpbmdFcnJvcnNcclxufVxyXG5cclxuIyBHZXQgcGFsZXR0ZSBmcm9tIGEgZmlsZVxyXG5BbnlQYWxldHRlLmxvYWRQYWxldHRlID0gKG8sIGNhbGxiYWNrKS0+XHJcblx0aWYgbm90IG9cclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlBhcmFtZXRlcnMgcmVxdWlyZWQ6IEFueVBhbGV0dGUubG9hZFBhbGV0dGUob3B0aW9ucywgZnVuY3Rpb24gY2FsbGJhY2soZXJyLCBwYWxldHRlKXt9KVwiXHJcblx0aWYgbm90IGNhbGxiYWNrXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJDYWxsYmFjayByZXF1aXJlZDogQW55UGFsZXR0ZS5sb2FkUGFsZXR0ZShvcHRpb25zLCBmdW5jdGlvbiBjYWxsYmFjayhlcnIsIHBhbGV0dGUpe30pXCJcclxuXHRcclxuXHRvID0gbm9ybWFsaXplX29wdGlvbnMgb1xyXG5cdFxyXG5cdGlmIG8uZGF0YVxyXG5cdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdGVsc2UgaWYgRmlsZT8gYW5kIG8uZmlsZSBpbnN0YW5jZW9mIEZpbGVcclxuXHRcdGZyID0gbmV3IEZpbGVSZWFkZXJcclxuXHRcdGZyLm9ubG9hZCA9IC0+XHJcblx0XHRcdG8uZGF0YSA9IGZyLnJlc3VsdFxyXG5cdFx0XHRsb2FkX3BhbGV0dGUobywgY2FsbGJhY2spXHJcblx0XHRmci5yZWFkQXNCaW5hcnlTdHJpbmcgby5maWxlXHJcblx0ZWxzZSBpZiBvLmZpbGVQYXRoP1xyXG5cdFx0ZnMgPSByZXF1aXJlIFwiZnNcIlxyXG5cdFx0ZnMucmVhZEZpbGUgby5maWxlUGF0aCwgKGVyciwgZGF0YSktPlxyXG5cdFx0XHRpZiBlcnJcclxuXHRcdFx0XHRjYWxsYmFjayhlcnIpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRvLmRhdGEgPSBkYXRhLnRvU3RyaW5nKFwiYmluYXJ5XCIpXHJcblx0XHRcdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdGVsc2VcclxuXHRcdGNhbGxiYWNrKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkLiBUaGUgRmlsZSBBUEkgbWF5IG5vdCBiZSBzdXBwb3J0ZWQuXCIpKSAjIHVtLi4uXHJcblx0XHQjIHRoZSBGaWxlIEFQSSB3b3VsZCBiZSBzdXBwb3J0ZWQgaWYgeW91J3ZlIHBhc3NlZCBhIEZpbGVcclxuXHRcdCMgVE9ETzogYSBiZXR0ZXIgZXJyb3IgbWVzc2FnZSwgYWJvdXQgb3B0aW9ucyAobm90KSBwYXNzZWRcclxuXHJcblxyXG4jIEdldCBhIHBhbGV0dGUgZnJvbSBhIGZpbGUgb3IgYnkgYW55IG1lYW5zIG5lY2Vzc2FyeVxyXG4jIChhcyBpbiBmYWxsIGJhY2sgdG8gY29tcGxldGVseSByYW5kb20gZGF0YSlcclxuQW55UGFsZXR0ZS5naW1tZUFQYWxldHRlID0gKG8sIGNhbGxiYWNrKS0+XHJcblx0byA9IG5vcm1hbGl6ZV9vcHRpb25zIG9cclxuXHRcclxuXHRBbnlQYWxldHRlLmxvYWRQYWxldHRlIG8sIChlcnIsIHBhbGV0dGUpLT5cclxuXHRcdGNhbGxiYWNrKG51bGwsIHBhbGV0dGUgPyBuZXcgUmFuZG9tUGFsZXR0ZSlcclxuXHJcbiMgRXhwb3J0c1xyXG5tb2R1bGUuZXhwb3J0cyA9IEFueVBhbGV0dGVcclxuIl19
