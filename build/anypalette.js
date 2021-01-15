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
    var _, c, i, j, k, len, len1, m, powed, ref, ref1, rgb, xyz, y;
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
        // white =
        // 	x: 95.047
        // 	y: 100.000
        // 	z: 108.883
        xyz = {
          y: (raw.l + 16) / 116
        };
        xyz.x = raw.a / 500 + xyz.y;
        xyz.z = xyz.y - raw.b / 200;
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
// Load an Adobe Color Table file (.act)
/*
"There is no version number written in the file.
The file is 768 or 772 bytes long and contains 256 RGB colors.
The first color in the table is index zero.
There are three bytes per color in the order red, green, blue.
If the file is 772 bytes long there are 4 additional bytes remaining.
	Two bytes for the number of colors to use.
	Two bytes for the color index with the transparency color to use."

https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/#50577411_pgfId-1070626
*/
var BinaryReader, Palette, load_adobe_color_table;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = load_adobe_color_table = function({data, fileExt}) {
  var br, i, palette, ref;
  palette = new Palette();
  br = new BinaryReader(data);
  if (!(((ref = br.getSize()) === 768 || ref === 772) || fileExt === "act")) { // because "Fireworks can read ACT files bigger than 768 bytes"
    throw new Error(`file size must be 768 or 772 bytes (saw ${br.getSize()}), OR file extension must be '.act' (saw '.${fileExt}')`);
  }
  i = 0;
  while (i < 255) {
    palette.add({
      r: br.readUInt8(),
      g: br.readUInt8(),
      b: br.readUInt8()
    });
    i += 1;
  }
  palette.numberOfColumns = 16; // configurable in Photoshop, but this is the default view, and for instance Visibone and the default swatches rely on this layout
  return palette;
};


},{"../BinaryReader":1,"../Palette":3}],5:[function(require,module,exports){
// Detect CSS colors (except named colors)
var Palette;

Palette = require("../Palette");

// TODO: detect names via structures like CSS variables, JSON object keys/values, comments
// TODO: use all colors regardless of format, within a detected structure, or maybe always
module.exports = function({data}) {
  var char, hex, i, j, len, len1, most_colors, n, n_control_characters, palette, palette_hex_long, palette_hex_short, palette_hsl, palette_hsla, palette_rgb, palette_rgba, palettes;
  n_control_characters = 0;
  for (i = 0, len = data.length; i < len; i++) {
    char = data[i];
    if (char === "\x00" || char === "\x01" || char === "\x02" || char === "\x03" || char === "\x04" || char === "\x05" || char === "\x06" || char === "\x07" || char === "\x08" || char === "\x0B" || char === "\x0C" || char === "\x0E" || char === "\x0F" || char === "\x10" || char === "\x11" || char === "\x12" || char === "\x13" || char === "\x14" || char === "\x15" || char === "\x16" || char === "\x17" || char === "\x18" || char === "\x19" || char === "\x1A" || char === "\x1B" || char === "\x1C" || char === "\x1D" || char === "\x1E" || char === "\x1F" || char === "\x7F") {
      n_control_characters++;
    }
  }
  if (n_control_characters > 5) {
    throw new Error("looks like a binary file");
  }
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
  return most_colors;
};


},{"../Palette":3}],6:[function(require,module,exports){
// Load a ColorSchemer palette (.cs)
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data, fileExt}) {
  var br, i, length, palette, version;
  if (fileExt !== "cs") {
    throw new Error(`ColorSchemer loader is only enabled when file extension is '.cs' (saw '.${fileExt}' instead)`);
  }
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


},{"../BinaryReader":1,"../Palette":3}],7:[function(require,module,exports){
// Load a GIMP palette (.gpl), also used by or supported by many programs, such as Inkscape, Krita,
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


},{"../Palette":3}],8:[function(require,module,exports){
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


},{"../Palette":3}],9:[function(require,module,exports){
// Load a KDE RGB Palette / KolourPaint / KOffice palette (.colors)
var parse_gimp_or_kde_rgb_palette;

({parse_gimp_or_kde_rgb_palette} = require("./GIMP"));

module.exports = function({data}) {
  return parse_gimp_or_kde_rgb_palette(data, "KDE RGB Palette");
};


},{"./GIMP":7}],10:[function(require,module,exports){
// Load a Paint.NET palette file (.txt)
var Palette;

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


},{"../Palette":3}],11:[function(require,module,exports){
// Load a JASC PAL file (Paint Shop Pro palette file) (.pal)
var Palette;

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
  // if lines[2] isnt "256"
  // 	"that's ok"
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


},{"../Palette":3}],12:[function(require,module,exports){
// Load a Resource Interchange File Format Palette file (.pal)

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


},{"../BinaryReader":1,"../Palette":3}],13:[function(require,module,exports){
// Load sK1 palettes (.skp)
// These files are actually apparently python source code,
// but let's just try to parse them in a basic, non-general way
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


},{"../Palette":3}],14:[function(require,module,exports){
// Load a Skencil palette (.spl) ("Sketch RGBPalette")
// Skencil was formerly called Sketch, but this is not related to the .sketchpalette format.
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


},{"../Palette":3}],15:[function(require,module,exports){
// Load a StarCraft raw palette (.pal)
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


},{"../BinaryReader":1,"../Palette":3}],16:[function(require,module,exports){
// Load a StarCraft padded raw palette (.wpe)
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


},{"../BinaryReader":1,"../Palette":3}],17:[function(require,module,exports){
// Load a Sketch App JSON palette (.sketchpalette)
// (not related to .spl Sketch RGB Palette format)

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
  var colorAssets, colorDefinitions, color_definition, compatibleVersion, gradientAssets, hex_color, i, images, j, len, len1, palette, paletteContents, ref;
  if (!data.match(/^\s*{/)) {
    throw new Error("not sketchpalette JSON");
  }
  paletteContents = JSON.parse(data);
  compatibleVersion = paletteContents.compatibleVersion;
  // Check for presets in file, else set to empty array
  colorDefinitions = (ref = paletteContents.colors) != null ? ref : [];
  // gradientDefinitions = paletteContents.gradients ? []
  // imageDefinitions = paletteContents.images ? []
  colorAssets = [];
  gradientAssets = [];
  images = [];
  palette = new Palette();
  // Check if plugin is out of date and incompatible with a newer palette version
  if (compatibleVersion && compatibleVersion > version) {
    throw new Error(`Can't handle compatibleVersion of ${compatibleVersion}.`);
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


},{"../Palette":3}],18:[function(require,module,exports){
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


},{"../Palette":3}],19:[function(require,module,exports){
// Load Windows .theme and .themepack files
var Palette, parseINIString, parseThemeFileString;

Palette = require("../Palette");

parseINIString = function(data) {
  var lines, regex, section, value;
  regex = {
    section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
    param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
    comment: /^\s*;.*$/
  };
  value = {};
  lines = data.split(/[\r\n]+/);
  section = null;
  lines.forEach(function(line) {
    var match;
    if (regex.comment.test(line)) {
      return;
    } else if (regex.param.test(line)) {
      match = line.match(regex.param);
      if (section) {
        value[section][match[1]] = match[2];
      } else {
        value[match[1]] = match[2];
      }
    } else if (regex.section.test(line)) {
      match = line.match(regex.section);
      value[match[1]] = {};
      section = match[1];
    } else if (line.length === 0 && section) {
      section = null;
    }
  });
  return value;
};

parseThemeFileString = function(themeIni) {
  var colors, component, components, i, j, key, len, palette, theme;
  // .theme is a renamed .ini text file
  // .themepack is a renamed .cab file, and parsing it as .ini seems to work well enough for the most part, as the .ini data appears in plain,
  // but it may not if compression is enabled for the .cab file
  theme = parseINIString(themeIni);
  colors = theme["Control Panel\\Colors"];
  if (!colors) {
    throw new Error("Invalid theme file, no [Control Panel\\Colors] section");
  }
  palette = new Palette();
  for (key in colors) {
    // for .themepack file support, just ignore bad keys that were parsed
    if (!key.match(/\W/)) {
      components = colors[key].split(" ");
      if (components.length === 3) {
        for (i = j = 0, len = components.length; j < len; i = ++j) {
          component = components[i];
          components[i] = parseInt(component, 10);
        }
        if (components.every(function(component) {
          return isFinite(component);
        })) {
          palette.add({
            r: components[0],
            g: components[1],
            b: components[2],
            name: key
          });
        }
      }
    }
  }
  return palette;
};

module.exports = function({data}) {
  return parseThemeFileString(data);
};


},{"../Palette":3}],20:[function(require,module,exports){
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
      name: "Adobe Color Table",
      exts: ["act"],
      load: require("./loaders/AdobeColorTable")
    },
    {
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


},{"./Color":2,"./Palette":3,"./loaders/AdobeColorTable":4,"./loaders/CSS":5,"./loaders/ColorSchemer":6,"./loaders/GIMP":7,"./loaders/Homesite":8,"./loaders/KolourPaint":9,"./loaders/Paint.NET":10,"./loaders/PaintShopPro":11,"./loaders/RIFF":12,"./loaders/SKP":13,"./loaders/SPL":14,"./loaders/StarCraft":15,"./loaders/StarCraftPadded":16,"./loaders/sketchpalette":17,"./loaders/tabular":18,"./loaders/theme":19,"fs":"fs","path":"path"}]},{},[20])(20)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQmluYXJ5UmVhZGVyLmNvZmZlZSIsInNyYy9Db2xvci5jb2ZmZWUiLCJzcmMvUGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbG9hZGVycy9BZG9iZUNvbG9yVGFibGUuY29mZmVlIiwic3JjL2xvYWRlcnMvQ1NTLmNvZmZlZSIsInNyYy9sb2FkZXJzL0NvbG9yU2NoZW1lci5jb2ZmZWUiLCJzcmMvbG9hZGVycy9HSU1QLmNvZmZlZSIsInNyYy9sb2FkZXJzL0hvbWVzaXRlLmNvZmZlZSIsInNyYy9sb2FkZXJzL0tvbG91clBhaW50LmNvZmZlZSIsInNyYy9sb2FkZXJzL1BhaW50Lk5FVC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9QYWludFNob3BQcm8uY29mZmVlIiwic3JjL2xvYWRlcnMvUklGRi5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TS1AuY29mZmVlIiwic3JjL2xvYWRlcnMvU1BMLmNvZmZlZSIsInNyYy9sb2FkZXJzL1N0YXJDcmFmdC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TdGFyQ3JhZnRQYWRkZWQuY29mZmVlIiwic3JjL2xvYWRlcnMvc2tldGNocGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbG9hZGVycy90YWJ1bGFyLmNvZmZlZSIsInNyYy9sb2FkZXJzL3RoZW1lLmNvZmZlZSIsInNyYy9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ2FHOzs7Ozs7Ozs7Ozs7O0FBQUEsSUFBQTs7QUFFSCxNQUFNLENBQUMsT0FBUCxHQUNNO0VBQU4sTUFBQSxhQUFBO0lBQ0MsV0FBYSxDQUFDLElBQUQsQ0FBQTtNQUNaLElBQUMsQ0FBQSxPQUFELEdBQVc7TUFDWCxJQUFDLENBQUEsSUFBRCxHQUFRO0lBRkksQ0FBZDs7O0lBTUMsUUFBVSxDQUFBLENBQUE7QUFDWCxVQUFBO01BQUUsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFaO01BQ0EsRUFBQSxHQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBYixDQUF3QixJQUFDLENBQUEsSUFBekIsQ0FBQSxHQUFpQztNQUN0QyxJQUFDLENBQUEsSUFBRCxJQUFTO2FBQ1QsRUFBQSxHQUFLO0lBSkk7O0lBTVYsaUJBQW1CLENBQUEsQ0FBQTtBQUNwQixVQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQTtNQUFFLE1BQUEsR0FBUyxJQUFDLENBQUEsVUFBRCxDQUFBLEVBQVg7O01BRUUsSUFBQyxDQUFBLFVBQUQsQ0FBWSxNQUFBLEdBQVMsRUFBckI7TUFDQSxHQUFBLEdBQU07TUFDTixLQUFTLG1GQUFUO1FBQ0MsR0FBQSxJQUFPLE1BQU0sQ0FBQyxZQUFQLENBQW9CLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFnQixJQUFDLENBQUEsSUFBakIsRUFBdUIsQ0FBdkIsQ0FBQSxHQUE0QixDQUFDLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFnQixJQUFDLENBQUEsSUFBRCxHQUFNLENBQXRCLEVBQXlCLENBQXpCLENBQUEsSUFBK0IsQ0FBaEMsQ0FBaEQ7UUFDUCxJQUFDLENBQUEsSUFBRCxJQUFTO01BRlY7YUFHQTtJQVJrQixDQVpwQjs7OztJQXdCQyxRQUFVLENBQUEsQ0FBQTthQUFHLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBWixFQUFlLElBQWY7SUFBSDs7SUFDVixTQUFXLENBQUEsQ0FBQTthQUFHLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBWixFQUFlLEtBQWY7SUFBSDs7SUFDWCxTQUFXLENBQUEsQ0FBQTthQUFHLElBQUMsQ0FBQSxVQUFELENBQVksRUFBWixFQUFnQixJQUFoQjtJQUFIOztJQUNYLFVBQVksQ0FBQSxDQUFBO2FBQUcsSUFBQyxDQUFBLFVBQUQsQ0FBWSxFQUFaLEVBQWdCLEtBQWhCO0lBQUg7O0lBQ1osU0FBVyxDQUFBLENBQUE7YUFBRyxJQUFDLENBQUEsVUFBRCxDQUFZLEVBQVosRUFBZ0IsSUFBaEI7SUFBSDs7SUFDWCxVQUFZLENBQUEsQ0FBQTthQUFHLElBQUMsQ0FBQSxVQUFELENBQVksRUFBWixFQUFnQixLQUFoQjtJQUFIOztJQUVaLFNBQVcsQ0FBQSxDQUFBO2FBQUcsSUFBQyxDQUFBLFlBQUQsQ0FBYyxFQUFkLEVBQWtCLENBQWxCO0lBQUg7O0lBQ1gsVUFBWSxDQUFBLENBQUE7YUFBRyxJQUFDLENBQUEsWUFBRCxDQUFjLEVBQWQsRUFBa0IsRUFBbEI7SUFBSDs7SUFFWixRQUFVLENBQUEsQ0FBQTthQUFHLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBWjtJQUFIOztJQUNWLFVBQVksQ0FBQyxNQUFELENBQUE7QUFDYixVQUFBO01BQUUsSUFBQyxDQUFBLFVBQUQsQ0FBWSxNQUFBLEdBQVMsQ0FBckI7TUFDQSxNQUFBLEdBQVMsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULENBQWdCLElBQUMsQ0FBQSxJQUFqQixFQUF1QixNQUF2QjtNQUNULElBQUMsQ0FBQSxJQUFELElBQVM7YUFDVDtJQUpXOztJQU1aLElBQU0sQ0FBQyxHQUFELENBQUE7TUFDTCxJQUFDLENBQUEsSUFBRCxHQUFRO2FBQ1IsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFaO0lBRks7O0lBSU4sV0FBYSxDQUFBLENBQUE7YUFBRyxJQUFDLENBQUE7SUFBSjs7SUFFYixPQUFTLENBQUEsQ0FBQTthQUFHLElBQUMsQ0FBQSxPQUFPLENBQUM7SUFBWjs7SUEwRVQsVUFBWSxDQUFDLFVBQUQsQ0FBQTtNQUNYLElBQUcsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFJLENBQUMsSUFBTCxDQUFVLFVBQUEsR0FBYSxDQUF2QixDQUFSLEdBQW9DLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBaEQ7UUFDQyxNQUFNLElBQUksS0FBSixDQUFVLG9CQUFWLEVBRFA7O0lBRFc7O0VBMUhiOzs7O3lCQXNEQyxZQUFBLEdBQWM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt5QkE4QmQsVUFBQSxHQUFZOzs7Ozs7Ozs7eUJBU1osSUFBQSxHQUFNOzs7Ozt5QkFLTixTQUFBLEdBQVc7Ozs7eUJBSVgsU0FBQSxHQUFXOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2hITzs7Ozs7O0FBQUEsSUFBQTs7QUFFbkIsTUFBTSxDQUFDLE9BQVAsR0FDTSxRQUFOLE1BQUEsTUFBQTtFQUNDLFdBQWEsQ0FBQyxPQUFELENBQUE7QUFDZCxRQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxDQUFBOzs7OztJQUlFLENBQUEsQ0FDRSxHQUFELElBQUMsQ0FBQSxDQURGLEVBQ00sR0FBRCxJQUFDLENBQUEsQ0FETixFQUNVLEdBQUQsSUFBQyxDQUFBLENBRFYsRUFFRSxHQUFELElBQUMsQ0FBQSxDQUZGLEVBRU0sR0FBRCxJQUFDLENBQUEsQ0FGTixFQUVVLEdBQUQsSUFBQyxDQUFBLENBRlYsRUFFYyxHQUFELElBQUMsQ0FBQSxDQUZkLEVBR0MsQ0FIRCxFQUdJLENBSEosRUFHTyxDQUhQLEVBR1UsQ0FIVixFQUlFLE1BQUQsSUFBQyxDQUFBLElBSkYsQ0FBQSxHQUtJLE9BTEo7SUFPQSxJQUFHLGdCQUFBLElBQVEsZ0JBQVIsSUFBZ0IsZ0JBQW5CO0FBQUE7OztLQUFBLE1BR0ssSUFBRyxnQkFBQSxJQUFRLGdCQUFYOztNQUVKLElBQUcsY0FBSDs7UUFFQyxJQUFDLENBQUEsQ0FBRCxHQUFLLENBQUMsQ0FBQSxHQUFJLElBQUMsQ0FBQSxDQUFELEdBQUssR0FBVixDQUFBLEdBQWlCLElBQUMsQ0FBQSxDQUFsQixHQUFzQjtRQUMzQixJQUFDLENBQUEsQ0FBRCxHQUFLLElBQUMsQ0FBQSxDQUFELEdBQUssSUFBQyxDQUFBLENBQU4sR0FBVSxDQUFJLElBQUMsQ0FBQSxDQUFELEdBQUssRUFBUixHQUFnQixJQUFDLENBQUEsQ0FBRCxHQUFLLENBQXJCLEdBQTRCLEdBQUEsR0FBTSxJQUFDLENBQUEsQ0FBRCxHQUFLLENBQXhDO1FBQ2YsSUFBVSxLQUFBLENBQU0sSUFBQyxDQUFBLENBQVAsQ0FBVjtVQUFBLElBQUMsQ0FBQSxDQUFELEdBQUssRUFBTDtTQUpEO09BQUEsTUFLSyxJQUFHLGNBQUg7QUFBQTtPQUFBLE1BQUE7Ozs7UUFLSixNQUFNLElBQUksS0FBSixDQUFVLHNEQUFWLEVBTEY7T0FQRDs7S0FBQSxNQWNBLElBQUcsV0FBQSxJQUFPLFdBQVAsSUFBYyxXQUFkLElBQXFCLFdBQXhCOzs7TUFHSixDQUFBLElBQUs7TUFDTCxDQUFBLElBQUs7TUFDTCxDQUFBLElBQUs7TUFDTCxDQUFBLElBQUs7TUFFTCxJQUFDLENBQUEsQ0FBRCxHQUFLLEdBQUEsR0FBTSxDQUFDLENBQUEsR0FBSSxJQUFJLENBQUMsR0FBTCxDQUFTLENBQVQsRUFBWSxDQUFBLEdBQUksQ0FBQyxDQUFBLEdBQUksQ0FBTCxDQUFKLEdBQWMsQ0FBMUIsQ0FBTDtNQUNYLElBQUMsQ0FBQSxDQUFELEdBQUssR0FBQSxHQUFNLENBQUMsQ0FBQSxHQUFJLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBVCxFQUFZLENBQUEsR0FBSSxDQUFDLENBQUEsR0FBSSxDQUFMLENBQUosR0FBYyxDQUExQixDQUFMO01BQ1gsSUFBQyxDQUFBLENBQUQsR0FBSyxHQUFBLEdBQU0sQ0FBQyxDQUFBLEdBQUksSUFBSSxDQUFDLEdBQUwsQ0FBUyxDQUFULEVBQVksQ0FBQSxHQUFJLENBQUMsQ0FBQSxHQUFJLENBQUwsQ0FBSixHQUFjLENBQTFCLENBQUwsRUFWUDtLQUFBLE1BQUE7O01BYUosSUFBRyxnQkFBQSxJQUFRLGdCQUFSLElBQWdCLGdCQUFuQjs7Ozs7UUFNQyxHQUFBLEdBQ0M7VUFBQSxDQUFBLEVBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBSixHQUFRLEVBQVQsQ0FBQSxHQUFlO1FBQWxCO1FBQ0QsR0FBRyxDQUFDLENBQUosR0FBUSxHQUFHLENBQUMsQ0FBSixHQUFRLEdBQVIsR0FBYyxHQUFHLENBQUM7UUFDMUIsR0FBRyxDQUFDLENBQUosR0FBUSxHQUFHLENBQUMsQ0FBSixHQUFRLEdBQUcsQ0FBQyxDQUFKLEdBQVE7QUFFeEI7UUFBQSxLQUFBLHFDQUFBOztVQUNDLEtBQUEsR0FBUSxJQUFJLENBQUMsR0FBTCxDQUFTLEdBQUcsQ0FBQyxDQUFELENBQVosRUFBaUIsQ0FBakI7VUFFUixJQUFHLEtBQUEsR0FBUSxRQUFYO1lBQ0MsR0FBRyxDQUFDLENBQUQsQ0FBSCxHQUFTLE1BRFY7V0FBQSxNQUFBO1lBR0MsR0FBRyxDQUFDLENBQUQsQ0FBSCxHQUFTLENBQUMsR0FBRyxDQUFDLENBQUQsQ0FBSCxHQUFTLEVBQUEsR0FBSyxHQUFmLENBQUEsR0FBc0IsTUFIaEM7O1FBSEQsQ0FYRDtPQURIOzs7OztNQXVCRyxJQUFHLGdCQUFBLElBQVEsZ0JBQVIsSUFBZ0IsZ0JBQW5CO1FBQ0MsR0FBQSxHQUNDO1VBQUEsQ0FBQSxFQUFHLEdBQUcsQ0FBQyxDQUFKLEdBQVEsR0FBWDtVQUNBLENBQUEsRUFBRyxHQUFHLENBQUMsQ0FBSixHQUFRLEdBRFg7VUFFQSxDQUFBLEVBQUcsR0FBRyxDQUFDLENBQUosR0FBUTtRQUZYO1FBSUQsR0FBQSxHQUNDO1VBQUEsQ0FBQSxFQUFHLEdBQUcsQ0FBQyxDQUFKLEdBQVEsTUFBUixHQUFpQixHQUFHLENBQUMsQ0FBSixHQUFRLENBQUMsTUFBMUIsR0FBbUMsR0FBRyxDQUFDLENBQUosR0FBUSxDQUFDLE1BQS9DO1VBQ0EsQ0FBQSxFQUFHLEdBQUcsQ0FBQyxDQUFKLEdBQVEsQ0FBQyxNQUFULEdBQWtCLEdBQUcsQ0FBQyxDQUFKLEdBQVEsTUFBMUIsR0FBbUMsR0FBRyxDQUFDLENBQUosR0FBUSxNQUQ5QztVQUVBLENBQUEsRUFBRyxHQUFHLENBQUMsQ0FBSixHQUFRLE1BQVIsR0FBaUIsR0FBRyxDQUFDLENBQUosR0FBUSxDQUFDLE1BQTFCLEdBQW1DLEdBQUcsQ0FBQyxDQUFKLEdBQVE7UUFGOUM7QUFJRDtRQUFBLEtBQUEsd0NBQUE7c0JBQUE7O1VBR0MsSUFBRyxHQUFHLENBQUMsQ0FBRCxDQUFILEdBQVMsQ0FBWjtZQUNDLEdBQUcsQ0FBQyxDQUFELENBQUgsR0FBUyxFQURWOztVQUdBLElBQUcsR0FBRyxDQUFDLENBQUQsQ0FBSCxHQUFTLFNBQVo7WUFDQyxHQUFHLENBQUMsQ0FBRCxDQUFILEdBQVMsS0FBQSxHQUFRLElBQUksQ0FBQyxHQUFMLENBQVMsR0FBRyxDQUFDLENBQUQsQ0FBWixFQUFrQixDQUFBLEdBQUksR0FBdEIsQ0FBUixHQUFzQyxNQURoRDtXQUFBLE1BQUE7WUFHQyxHQUFHLENBQUMsQ0FBRCxDQUFILElBQVUsTUFIWDs7UUFORCxDQVhEO09BQUEsTUFBQTs7O1FBeUJDLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSx3R0FBQSxDQUFBO0FBRWQ7bUJBQ0MsQ0FBQSxJQUFBLENBQUEsQ0FBTyxJQUFJLENBQUMsU0FBTCxDQUFlLE9BQWYsQ0FBUCxDQUFBLEVBREQ7V0FFQSxhQUFBO21CQUNDLHNGQUREOztZQUpjLENBQUEsQ0FBVixFQXpCUDtPQW5DSTs7RUE3Qk87O0VBbUdiLFFBQVUsQ0FBQSxDQUFBO0lBQ1QsSUFBRyxjQUFIOztNQUVDLElBQUcsY0FBSDtlQUNDLENBQUEsS0FBQSxDQUFBLENBQVEsSUFBQyxDQUFBLENBQVQsQ0FBQSxFQUFBLENBQUEsQ0FBZSxJQUFDLENBQUEsQ0FBaEIsQ0FBQSxFQUFBLENBQUEsQ0FBc0IsSUFBQyxDQUFBLENBQXZCLENBQUEsRUFBQSxDQUFBLENBQTZCLElBQUMsQ0FBQSxDQUE5QixDQUFBLENBQUEsRUFERDtPQUFBLE1BQUE7ZUFHQyxDQUFBLElBQUEsQ0FBQSxDQUFPLElBQUMsQ0FBQSxDQUFSLENBQUEsRUFBQSxDQUFBLENBQWMsSUFBQyxDQUFBLENBQWYsQ0FBQSxFQUFBLENBQUEsQ0FBcUIsSUFBQyxDQUFBLENBQXRCLENBQUEsQ0FBQSxFQUhEO09BRkQ7S0FBQSxNQU1LLElBQUcsY0FBSDs7O01BR0osSUFBRyxjQUFIO2VBQ0MsQ0FBQSxLQUFBLENBQUEsQ0FBUSxJQUFDLENBQUEsQ0FBVCxDQUFBLEVBQUEsQ0FBQSxDQUFlLElBQUMsQ0FBQSxDQUFoQixDQUFBLEdBQUEsQ0FBQSxDQUF1QixJQUFDLENBQUEsQ0FBeEIsQ0FBQSxHQUFBLENBQUEsQ0FBK0IsSUFBQyxDQUFBLENBQWhDLENBQUEsQ0FBQSxFQUREO09BQUEsTUFBQTtlQUdDLENBQUEsSUFBQSxDQUFBLENBQU8sSUFBQyxDQUFBLENBQVIsQ0FBQSxFQUFBLENBQUEsQ0FBYyxJQUFDLENBQUEsQ0FBZixDQUFBLEdBQUEsQ0FBQSxDQUFzQixJQUFDLENBQUEsQ0FBdkIsQ0FBQSxFQUFBLEVBSEQ7T0FISTs7RUFQSTs7RUFlVixFQUFJLENBQUMsS0FBRCxDQUFBLEVBQUE7O1dBRUgsQ0FBQSxDQUFBLENBQUcsSUFBSCxDQUFBLENBQUEsS0FBVSxDQUFBLENBQUEsQ0FBRyxLQUFILENBQUE7RUFGUDs7QUFuSEw7Ozs7QUNSQSxJQUFBLEtBQUEsRUFBQTs7QUFBQSxLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0FBRVIsTUFBTSxDQUFDLE9BQVAsR0FDTSxVQUFOLE1BQUEsUUFBQSxRQUFzQixNQUF0QjtFQUVDLFdBQWEsQ0FBQSxHQUFDLElBQUQsQ0FBQTtTQUNaLENBQU0sR0FBQSxJQUFOO0VBRFk7O0VBR2IsR0FBSyxDQUFDLENBQUQsQ0FBQTtBQUNOLFFBQUE7SUFBRSxTQUFBLEdBQVksSUFBSSxLQUFKLENBQVUsQ0FBVjtXQUNaLElBQUMsQ0FBQSxJQUFELENBQU0sU0FBTjtFQUZJOztFQUlMLFFBQVUsQ0FBQSxDQUFBO0FBQ1gsUUFBQSxDQUFBLEVBQUEsT0FBQSxFQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBOzs7O0lBR0UsS0FBTyxJQUFDLENBQUEsOEJBQVI7TUFDQyxJQUFDLENBQUEsY0FBRCxHQUFrQixJQUFJLE9BQUosQ0FBQTtNQUNsQixJQUFDLENBQUEsY0FBYyxDQUFDLDhCQUFoQixHQUFpRDtNQUNqRCxLQUFtQyxzRkFBbkM7UUFBQSxJQUFDLENBQUEsY0FBYyxDQUFDLENBQUQsQ0FBZixHQUFxQixJQUFDLENBQUMsQ0FBRDtNQUF0QjtNQUNBLElBQUMsQ0FBQSxjQUFjLENBQUMsZUFBaEIsR0FBa0MsSUFBQyxDQUFBO01BQ25DLElBQUMsQ0FBQSxjQUFjLENBQUMsdUJBQWhCLEdBQTBDLElBQUMsQ0FBQTtNQUMzQyxJQUFDLENBQUEsY0FBYyxDQUFDLFFBQWhCLENBQUEsRUFMSDs7TUFRRyxDQUFBLEdBQUk7QUFDSjthQUFNLENBQUEsR0FBSSxJQUFDLENBQUEsTUFBWDtRQUNDLE9BQUEsR0FBVSxJQUFDLENBQUMsQ0FBRDtRQUNYLENBQUEsR0FBSSxDQUFBLEdBQUk7QUFDUixlQUFNLENBQUEsR0FBSSxJQUFDLENBQUEsTUFBWDtVQUNDLE9BQUEsR0FBVSxJQUFDLENBQUMsQ0FBRDtVQUNYLElBQUcsT0FBTyxDQUFDLEVBQVIsQ0FBVyxPQUFYLENBQUg7WUFDQyxJQUFDLENBQUMsTUFBRixDQUFTLENBQVQsRUFBWSxDQUFaO1lBQ0EsQ0FBQSxJQUFLLEVBRk47O1VBR0EsQ0FBQSxJQUFLO1FBTE47cUJBTUEsQ0FBQSxJQUFLO01BVE4sQ0FBQTtxQkFWRDs7RUFKUzs7QUFUWDs7QUFIQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDRHVDOzs7Ozs7Ozs7Ozs7QUFBQSxJQUFBLFlBQUEsRUFBQSxPQUFBLEVBQUE7O0FBY3ZDLFlBQUEsR0FBZSxPQUFBLENBQVEsaUJBQVI7O0FBQ2YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxZQUFSOztBQUVWLE1BQU0sQ0FBQyxPQUFQLEdBQ0Esc0JBQUEsR0FBeUIsUUFBQSxDQUFDLENBQUMsSUFBRCxFQUFPLE9BQVAsQ0FBRCxDQUFBO0FBRXpCLE1BQUEsRUFBQSxFQUFBLENBQUEsRUFBQSxPQUFBLEVBQUE7RUFBQyxPQUFBLEdBQVUsSUFBSSxPQUFKLENBQUE7RUFDVixFQUFBLEdBQUssSUFBSSxZQUFKLENBQWlCLElBQWpCO0VBRUwsS0FBTyxTQUNOLEVBQUUsQ0FBQyxPQUFILENBQUEsT0FBaUIsT0FBakIsUUFBc0IsSUFBdEIsSUFDQSxPQUFBLEtBQVcsS0FGTCxDQUFQO0lBSUMsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLHdDQUFBLENBQUEsQ0FBMkMsRUFBRSxDQUFDLE9BQUgsQ0FBQSxDQUEzQyxDQUFBLDJDQUFBLENBQUEsQ0FBcUcsT0FBckcsQ0FBQSxFQUFBLENBQVYsRUFKUDs7RUFNQSxDQUFBLEdBQUk7QUFDSixTQUFNLENBQUEsR0FBSSxHQUFWO0lBQ0MsT0FBTyxDQUFDLEdBQVIsQ0FDQztNQUFBLENBQUEsRUFBRyxFQUFFLENBQUMsU0FBSCxDQUFBLENBQUg7TUFDQSxDQUFBLEVBQUcsRUFBRSxDQUFDLFNBQUgsQ0FBQSxDQURIO01BRUEsQ0FBQSxFQUFHLEVBQUUsQ0FBQyxTQUFILENBQUE7SUFGSCxDQUREO0lBSUEsQ0FBQSxJQUFLO0VBTE47RUFPQSxPQUFPLENBQUMsZUFBUixHQUEwQixHQWpCM0I7U0FtQkM7QUFyQndCOzs7O0FDakJnQjtBQUFBLElBQUE7O0FBRXpDLE9BQUEsR0FBVSxPQUFBLENBQVEsWUFBUixFQUYrQjs7OztBQU96QyxNQUFNLENBQUMsT0FBUCxHQUFpQixRQUFBLENBQUMsQ0FBQyxJQUFELENBQUQsQ0FBQTtBQUVqQixNQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLFdBQUEsRUFBQSxDQUFBLEVBQUEsb0JBQUEsRUFBQSxPQUFBLEVBQUEsZ0JBQUEsRUFBQSxpQkFBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQTtFQUFDLG9CQUFBLEdBQXVCO0VBQ3ZCLEtBQUEsc0NBQUE7O0lBQ0MsSUFBRyxTQUNGLFVBREUsU0FDTSxVQUROLFNBQ2MsVUFEZCxTQUNzQixVQUR0QixTQUM4QixVQUQ5QixTQUNzQyxVQUR0QyxTQUM4QyxVQUQ5QyxTQUNzRCxVQUR0RCxTQUM4RCxVQUQ5RCxTQUVGLFVBRkUsU0FFTSxVQUZOLFNBR0YsVUFIRSxTQUdNLFVBSE4sU0FHYyxVQUhkLFNBR3NCLFVBSHRCLFNBRzhCLFVBSDlCLFNBR3NDLFVBSHRDLFNBRzhDLFVBSDlDLFNBR3NELFVBSHRELFNBRzhELFVBSDlELFNBR3NFLFVBSHRFLFNBRzhFLFVBSDlFLFNBR3NGLFVBSHRGLFNBRzhGLFVBSDlGLFNBR3NHLFVBSHRHLFNBRzhHLFVBSDlHLFNBR3NILFVBSHRILFNBRzhILFVBSDlILFNBR3NJLFVBSHRJLFNBRzhJLE1BSGpKO01BS0Msb0JBQUEsR0FMRDs7RUFERDtFQU9BLElBQUcsb0JBQUEsR0FBdUIsQ0FBMUI7SUFDQyxNQUFNLElBQUksS0FBSixDQUFVLDBCQUFWLEVBRFA7O0VBR0EsUUFBQSxHQUFXLENBQ1YsZ0JBQUEsR0FBbUIsSUFBSSxPQUFKLENBQUEsQ0FEVCxFQUVWLGlCQUFBLEdBQW9CLElBQUksT0FBSixDQUFBLENBRlYsRUFHVixXQUFBLEdBQWMsSUFBSSxPQUFKLENBQUEsQ0FISixFQUlWLFdBQUEsR0FBYyxJQUFJLE9BQUosQ0FBQSxDQUpKLEVBS1YsWUFBQSxHQUFlLElBQUksT0FBSixDQUFBLENBTEwsRUFNVixZQUFBLEdBQWUsSUFBSSxPQUFKLENBQUEsQ0FOTDtFQVNYLEdBQUEsR0FBTSxRQUFBLENBQUMsQ0FBRCxDQUFBO1dBQU0sUUFBQSxDQUFTLENBQVQsRUFBWSxFQUFaO0VBQU47RUFFTixJQUFJLENBQUMsT0FBTCxDQUFhLG9FQUFiLEVBWVEsUUFBQSxDQUFDLENBQUQsRUFBSSxFQUFKLENBQUEsRUFBQTs7Ozs7O0lBQ1AsSUFBRyxFQUFFLENBQUMsTUFBSCxHQUFZLENBQWY7YUFDQyxnQkFBZ0IsQ0FBQyxHQUFqQixDQUNDO1FBQUEsQ0FBQSxFQUFHLEdBQUEsQ0FBSSxFQUFFLENBQUMsQ0FBRCxDQUFGLEdBQVEsRUFBRSxDQUFDLENBQUQsQ0FBZCxDQUFIO1FBQ0EsQ0FBQSxFQUFHLEdBQUEsQ0FBSSxFQUFFLENBQUMsQ0FBRCxDQUFGLEdBQVEsRUFBRSxDQUFDLENBQUQsQ0FBZCxDQURIO1FBRUEsQ0FBQSxFQUFHLEdBQUEsQ0FBSSxFQUFFLENBQUMsQ0FBRCxDQUFGLEdBQVEsRUFBRSxDQUFDLENBQUQsQ0FBZCxDQUZIO1FBR0EsQ0FBQSxFQUFNLEVBQUUsQ0FBQyxNQUFILEtBQWEsQ0FBaEIsR0FBdUIsR0FBQSxDQUFJLEVBQUUsQ0FBQyxDQUFELENBQUYsR0FBUSxFQUFFLENBQUMsQ0FBRCxDQUFkLENBQXZCLEdBQThDO01BSGpELENBREQsRUFERDtLQUFBLE1BQUE7YUFPQyxpQkFBaUIsQ0FBQyxHQUFsQixDQUNDO1FBQUEsQ0FBQSxFQUFHLEdBQUEsQ0FBSSxFQUFFLENBQUMsQ0FBRCxDQUFGLEdBQVEsRUFBRSxDQUFDLENBQUQsQ0FBZCxDQUFIO1FBQ0EsQ0FBQSxFQUFHLEdBQUEsQ0FBSSxFQUFFLENBQUMsQ0FBRCxDQUFGLEdBQVEsRUFBRSxDQUFDLENBQUQsQ0FBZCxDQURIO1FBRUEsQ0FBQSxFQUFHLEdBQUEsQ0FBSSxFQUFFLENBQUMsQ0FBRCxDQUFGLEdBQVEsRUFBRSxDQUFDLENBQUQsQ0FBZCxDQUZIO1FBR0EsQ0FBQSxFQUFNLEVBQUUsQ0FBQyxNQUFILEtBQWEsQ0FBaEIsR0FBdUIsR0FBQSxDQUFJLEVBQUUsQ0FBQyxDQUFELENBQUYsR0FBUSxFQUFFLENBQUMsQ0FBRCxDQUFkLENBQXZCLEdBQThDO01BSGpELENBREQsRUFQRDs7RUFETyxDQVpSO0VBMEJBLElBQUksQ0FBQyxPQUFMLENBQWEsNkdBQWIsRUFhUSxRQUFBLENBQUMsRUFBRCxFQUFLLEtBQUwsRUFBWSxNQUFaLEVBQW9CLEtBQXBCLEVBQTJCLE1BQTNCLEVBQW1DLEtBQW5DLEVBQTBDLE1BQTFDLENBQUEsRUFBQTs7O1dBQ1AsV0FBVyxDQUFDLEdBQVosQ0FDQztNQUFBLENBQUEsRUFBRyxNQUFBLENBQU8sS0FBUCxDQUFBLEdBQWdCLENBQUksTUFBQSxLQUFVLEdBQWIsR0FBc0IsR0FBQSxHQUFJLEdBQTFCLEdBQW1DLENBQXBDLENBQW5CO01BQ0EsQ0FBQSxFQUFHLE1BQUEsQ0FBTyxLQUFQLENBQUEsR0FBZ0IsQ0FBSSxNQUFBLEtBQVUsR0FBYixHQUFzQixHQUFBLEdBQUksR0FBMUIsR0FBbUMsQ0FBcEMsQ0FEbkI7TUFFQSxDQUFBLEVBQUcsTUFBQSxDQUFPLEtBQVAsQ0FBQSxHQUFnQixDQUFJLE1BQUEsS0FBVSxHQUFiLEdBQXNCLEdBQUEsR0FBSSxHQUExQixHQUFtQyxDQUFwQztJQUZuQixDQUREO0VBRE8sQ0FiUjtFQW1CQSxJQUFJLENBQUMsT0FBTCxDQUFhLGtKQUFiLEVBZ0JRLFFBQUEsQ0FBQyxFQUFELEVBQUssS0FBTCxFQUFZLE1BQVosRUFBb0IsS0FBcEIsRUFBMkIsTUFBM0IsRUFBbUMsS0FBbkMsRUFBMEMsTUFBMUMsRUFBa0QsS0FBbEQsRUFBeUQsTUFBekQsQ0FBQSxFQUFBOzs7O1dBQ1AsWUFBWSxDQUFDLEdBQWIsQ0FDQztNQUFBLENBQUEsRUFBRyxNQUFBLENBQU8sS0FBUCxDQUFBLEdBQWdCLENBQUksTUFBQSxLQUFVLEdBQWIsR0FBc0IsR0FBQSxHQUFJLEdBQTFCLEdBQW1DLENBQXBDLENBQW5CO01BQ0EsQ0FBQSxFQUFHLE1BQUEsQ0FBTyxLQUFQLENBQUEsR0FBZ0IsQ0FBSSxNQUFBLEtBQVUsR0FBYixHQUFzQixHQUFBLEdBQUksR0FBMUIsR0FBbUMsQ0FBcEMsQ0FEbkI7TUFFQSxDQUFBLEVBQUcsTUFBQSxDQUFPLEtBQVAsQ0FBQSxHQUFnQixDQUFJLE1BQUEsS0FBVSxHQUFiLEdBQXNCLEdBQUEsR0FBSSxHQUExQixHQUFtQyxDQUFwQyxDQUZuQjtNQUdBLENBQUEsRUFBRyxNQUFBLENBQU8sS0FBUCxDQUFBLEdBQWdCLENBQUksTUFBQSxLQUFVLEdBQWIsR0FBc0IsQ0FBQSxHQUFFLEdBQXhCLEdBQWlDLENBQWxDO0lBSG5CLENBREQ7RUFETyxDQWhCUjtFQXVCQSxJQUFJLENBQUMsT0FBTCxDQUFhLHdIQUFiLEVBYVEsUUFBQSxDQUFDLEVBQUQsRUFBSyxLQUFMLEVBQVksTUFBWixFQUFvQixLQUFwQixFQUEyQixNQUEzQixFQUFtQyxLQUFuQyxFQUEwQyxNQUExQyxDQUFBLEVBQUE7OztXQUNQLFdBQVcsQ0FBQyxHQUFaLENBQ0M7TUFBQSxDQUFBLEVBQUcsTUFBQSxDQUFPLEtBQVAsQ0FBQSxHQUFnQixDQUFJLE1BQUEsS0FBVSxLQUFiLEdBQXdCLEdBQUEsR0FBSSxJQUFJLENBQUMsRUFBakMsR0FBNEMsTUFBQSxLQUFVLE1BQWIsR0FBeUIsR0FBekIsR0FBa0MsQ0FBNUUsQ0FBbkI7TUFDQSxDQUFBLEVBQUcsTUFBQSxDQUFPLEtBQVAsQ0FBQSxHQUFnQixDQUFJLE1BQUEsS0FBVSxHQUFiLEdBQXNCLENBQXRCLEdBQTZCLEdBQTlCLENBRG5CO01BRUEsQ0FBQSxFQUFHLE1BQUEsQ0FBTyxLQUFQLENBQUEsR0FBZ0IsQ0FBSSxNQUFBLEtBQVUsR0FBYixHQUFzQixDQUF0QixHQUE2QixHQUE5QjtJQUZuQixDQUREO0VBRE8sQ0FiUjtFQW1CQSxJQUFJLENBQUMsT0FBTCxDQUFhLDZKQUFiLEVBZ0JRLFFBQUEsQ0FBQyxFQUFELEVBQUssS0FBTCxFQUFZLE1BQVosRUFBb0IsS0FBcEIsRUFBMkIsTUFBM0IsRUFBbUMsS0FBbkMsRUFBMEMsTUFBMUMsRUFBa0QsS0FBbEQsRUFBeUQsTUFBekQsQ0FBQSxFQUFBOzs7O1dBQ1AsWUFBWSxDQUFDLEdBQWIsQ0FDQztNQUFBLENBQUEsRUFBRyxNQUFBLENBQU8sS0FBUCxDQUFBLEdBQWdCLENBQUksTUFBQSxLQUFVLEtBQWIsR0FBd0IsR0FBQSxHQUFJLElBQUksQ0FBQyxFQUFqQyxHQUE0QyxNQUFBLEtBQVUsTUFBYixHQUF5QixHQUF6QixHQUFrQyxDQUE1RSxDQUFuQjtNQUNBLENBQUEsRUFBRyxNQUFBLENBQU8sS0FBUCxDQUFBLEdBQWdCLENBQUksTUFBQSxLQUFVLEdBQWIsR0FBc0IsQ0FBdEIsR0FBNkIsR0FBOUIsQ0FEbkI7TUFFQSxDQUFBLEVBQUcsTUFBQSxDQUFPLEtBQVAsQ0FBQSxHQUFnQixDQUFJLE1BQUEsS0FBVSxHQUFiLEdBQXNCLENBQXRCLEdBQTZCLEdBQTlCLENBRm5CO01BR0EsQ0FBQSxFQUFHLE1BQUEsQ0FBTyxLQUFQLENBQUEsR0FBZ0IsQ0FBSSxNQUFBLEtBQVUsR0FBYixHQUFzQixDQUFBLEdBQUUsR0FBeEIsR0FBaUMsQ0FBbEM7SUFIbkIsQ0FERDtFQURPLENBaEJSO0VBdUJBLFdBQUEsR0FBYztFQUNkLEtBQUEsNENBQUE7O0lBQ0MsSUFBRyxPQUFPLENBQUMsTUFBUixJQUFrQixXQUFXLENBQUMsTUFBakM7TUFDQyxXQUFBLEdBQWMsUUFEZjs7RUFERDtFQUlBLENBQUEsR0FBSSxXQUFXLENBQUM7RUFDaEIsSUFBRyxDQUFBLEdBQUksQ0FBUDtJQUNDLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FDZixpQkFEZSxFQUVmLHNCQUZlLEVBR2YsNEJBSGUsRUFJZix5QkFKZSxDQUtmLENBQUMsQ0FBRCxDQUxlLEdBS1QsQ0FBQSxFQUFBLENBQUEsQ0FBSyxDQUFMLENBQUEsQ0FBQSxDQUxELEVBRFA7O1NBUUE7QUFwSmdCOzs7O0FDUGtCO0FBQUEsSUFBQSxZQUFBLEVBQUE7O0FBRW5DLFlBQUEsR0FBZSxPQUFBLENBQVEsaUJBQVI7O0FBQ2YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxZQUFSOztBQUVWLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFFBQUEsQ0FBQyxDQUFDLElBQUQsRUFBTyxPQUFQLENBQUQsQ0FBQTtBQUVqQixNQUFBLEVBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQTtFQUFDLElBQUcsT0FBQSxLQUFhLElBQWhCO0lBQ0MsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLHdFQUFBLENBQUEsQ0FBMkUsT0FBM0UsQ0FBQSxVQUFBLENBQVYsRUFEUDs7RUFHQSxPQUFBLEdBQVUsSUFBSSxPQUFKLENBQUE7RUFDVixFQUFBLEdBQUssSUFBSSxZQUFKLENBQWlCLElBQWpCO0VBRUwsT0FBQSxHQUFVLEVBQUUsQ0FBQyxVQUFILENBQUEsRUFOWDtFQU9DLE1BQUEsR0FBUyxFQUFFLENBQUMsVUFBSCxDQUFBO0VBQ1QsQ0FBQSxHQUFJO0FBQ0osU0FBTSxDQUFBLEdBQUksTUFBVjtJQUNDLEVBQUUsQ0FBQyxJQUFILENBQVEsQ0FBQSxHQUFJLENBQUEsR0FBSSxFQUFoQjtJQUNBLE9BQU8sQ0FBQyxHQUFSLENBQ0M7TUFBQSxDQUFBLEVBQUcsRUFBRSxDQUFDLFFBQUgsQ0FBQSxDQUFIO01BQ0EsQ0FBQSxFQUFHLEVBQUUsQ0FBQyxRQUFILENBQUEsQ0FESDtNQUVBLENBQUEsRUFBRyxFQUFFLENBQUMsUUFBSCxDQUFBO0lBRkgsQ0FERDtJQUlBLENBQUEsSUFBSztFQU5OO1NBUUE7QUFuQmdCOzs7O0FDTGlGO0FBQUEsSUFBQSxPQUFBLEVBQUE7O0FBRWxHLE9BQUEsR0FBVSxPQUFBLENBQVEsWUFBUjs7QUFFViw2QkFBQSxHQUFnQyxRQUFBLENBQUMsSUFBRCxFQUFPLFdBQVAsQ0FBQTtBQUNoQyxNQUFBLENBQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBLENBQUEsRUFBQSxPQUFBLEVBQUE7RUFBQyxLQUFBLEdBQVEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxVQUFYO0VBQ1IsSUFBRyxLQUFLLENBQUMsQ0FBRCxDQUFMLEtBQWMsV0FBakI7SUFDQyxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsTUFBQSxDQUFBLENBQVMsV0FBVCxDQUFBLENBQVYsRUFEUDs7RUFHQSxPQUFBLEdBQVUsSUFBSSxPQUFKLENBQUE7RUFDVixDQUFBLEdBQUksRUFMTDs7QUFPQyxTQUFNLENBQUMsQ0FBQSxJQUFLLENBQU4sQ0FBQSxHQUFXLEtBQUssQ0FBQyxNQUF2QjtJQUNDLElBQUEsR0FBTyxLQUFLLENBQUMsQ0FBRDtJQUVaLElBQUcsSUFBSSxDQUFDLENBQUQsQ0FBSixLQUFXLEdBQVgsSUFBa0IsSUFBQSxLQUFRLEVBQTdCO0FBQXFDLGVBQXJDO0tBRkY7O0lBS0UsQ0FBQSxHQUFJLElBQUksQ0FBQyxLQUFMLENBQVcsY0FBWDtJQUNKLElBQUcsQ0FBSDtNQUNDLE9BQU8sQ0FBQyxJQUFSLEdBQWUsQ0FBQyxDQUFDLENBQUQ7QUFDaEIsZUFGRDs7SUFHQSxDQUFBLEdBQUksSUFBSSxDQUFDLEtBQUwsQ0FBVyxpQkFBWDtJQUNKLElBQUcsQ0FBSDtNQUNDLE9BQU8sQ0FBQyxlQUFSLEdBQTBCLE1BQUEsQ0FBTyxDQUFDLENBQUMsQ0FBRCxDQUFSLEVBQTdCOztNQUVHLE9BQU8sQ0FBQyx1QkFBUixHQUFrQztBQUNsQyxlQUpEO0tBVkY7Ozs7O0lBbUJFLFVBQUEsR0FBYSxJQUFJLENBQUMsS0FBTCxDQUFXLGlEQUFYLEVBbkJmOzs7Ozs7OztJQWtDRSxJQUFHLENBQUksVUFBUDtNQUNDLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSxLQUFBLENBQUEsQ0FBUSxDQUFSLENBQUEsdUJBQUEsQ0FBQSxDQUFtQyxVQUFuQyxDQUFBLENBQVYsRUFEUDs7SUFHQSxPQUFPLENBQUMsR0FBUixDQUNDO01BQUEsQ0FBQSxFQUFHLFVBQVUsQ0FBQyxDQUFELENBQWI7TUFDQSxDQUFBLEVBQUcsVUFBVSxDQUFDLENBQUQsQ0FEYjtNQUVBLENBQUEsRUFBRyxVQUFVLENBQUMsQ0FBRCxDQUZiO01BR0EsSUFBQSxFQUFNLFVBQVUsQ0FBQyxDQUFEO0lBSGhCLENBREQ7RUF0Q0Q7U0E0Q0E7QUFwRCtCOztBQXNEaEMsTUFBTSxDQUFDLE9BQVAsR0FBaUIsUUFBQSxDQUFDLENBQUMsSUFBRCxDQUFELENBQUE7U0FDaEIsNkJBQUEsQ0FBOEIsSUFBOUIsRUFBb0MsY0FBcEM7QUFEZ0I7O0FBR2pCLE1BQU0sQ0FBQyxPQUFPLENBQUMsNkJBQWYsR0FBK0M7Ozs7QUM5RGtCO0FBQUEsSUFBQTs7QUFFakUsT0FBQSxHQUFVLE9BQUEsQ0FBUSxZQUFSOztBQUVWLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFFBQUEsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFBO0FBQ2pCLE1BQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUE7RUFBQyxLQUFBLEdBQVEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxVQUFYO0VBQ1IsSUFBRyxLQUFLLENBQUMsQ0FBRCxDQUFMLEtBQWMsU0FBakI7SUFDQyxNQUFNLElBQUksS0FBSixDQUFVLHdCQUFWLEVBRFA7O0VBRUEsSUFBRyxDQUFJLEtBQUssQ0FBQyxDQUFELENBQUcsQ0FBQyxLQUFULENBQWUsaUJBQWYsQ0FBUDtJQUNDLE1BQU0sSUFBSSxLQUFKLENBQVUsc0NBQVYsRUFEUDs7RUFHQSxPQUFBLEdBQVUsSUFBSSxPQUFKLENBQUE7RUFFVixLQUFBLCtDQUFBOztJQUNDLElBQUcsSUFBSSxDQUFDLEtBQUwsQ0FBVyxVQUFYLENBQUg7TUFDQyxHQUFBLEdBQU0sSUFBSSxDQUFDLEtBQUwsQ0FBVyxHQUFYO01BQ04sT0FBTyxDQUFDLEdBQVIsQ0FDQztRQUFBLENBQUEsRUFBRyxHQUFHLENBQUMsQ0FBRCxDQUFOO1FBQ0EsQ0FBQSxFQUFHLEdBQUcsQ0FBQyxDQUFELENBRE47UUFFQSxDQUFBLEVBQUcsR0FBRyxDQUFDLENBQUQ7TUFGTixDQURELEVBRkQ7O0VBREQ7U0FRQTtBQWpCZ0I7Ozs7QUNIaUQ7QUFBQSxJQUFBOztBQUVsRSxDQUFBLENBQUMsNkJBQUQsQ0FBQSxHQUFrQyxPQUFBLENBQVEsUUFBUixDQUFsQzs7QUFFQSxNQUFNLENBQUMsT0FBUCxHQUFpQixRQUFBLENBQUMsQ0FBQyxJQUFELENBQUQsQ0FBQTtTQUNoQiw2QkFBQSxDQUE4QixJQUE5QixFQUFvQyxpQkFBcEM7QUFEZ0I7Ozs7QUNKcUI7QUFBQSxJQUFBOztBQUV0QyxPQUFBLEdBQVUsT0FBQSxDQUFRLFlBQVI7O0FBRVYsTUFBTSxDQUFDLE9BQVAsR0FBaUIsUUFBQSxDQUFDLENBQUMsSUFBRCxDQUFELENBQUE7QUFFakIsTUFBQSxHQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQTtFQUFDLE9BQUEsR0FBVSxJQUFJLE9BQUosQ0FBQTtFQUVWLEdBQUEsR0FBTSxRQUFBLENBQUMsQ0FBRCxDQUFBO1dBQU0sUUFBQSxDQUFTLENBQVQsRUFBWSxFQUFaO0VBQU47QUFFTjtFQUFBLEtBQUEscUNBQUE7O0lBQ0MsQ0FBQSxHQUFJLElBQUksQ0FBQyxLQUFMLENBQVcseURBQVg7SUFDSixJQUFHLENBQUg7TUFBVSxPQUFPLENBQUMsR0FBUixDQUNUO1FBQUEsQ0FBQSxFQUFHLEdBQUEsQ0FBSSxDQUFDLENBQUMsQ0FBRCxDQUFMLENBQUg7UUFDQSxDQUFBLEVBQUcsR0FBQSxDQUFJLENBQUMsQ0FBQyxDQUFELENBQUwsQ0FESDtRQUVBLENBQUEsRUFBRyxHQUFBLENBQUksQ0FBQyxDQUFDLENBQUQsQ0FBTCxDQUZIO1FBR0EsQ0FBQSxFQUFHLEdBQUEsQ0FBSSxDQUFDLENBQUMsQ0FBRCxDQUFMO01BSEgsQ0FEUyxFQUFWOztFQUZEO1NBUUE7QUFkZ0I7Ozs7QUNKMEM7QUFBQSxJQUFBOztBQUUzRCxPQUFBLEdBQVUsT0FBQSxDQUFRLFlBQVI7O0FBRVYsTUFBTSxDQUFDLE9BQVAsR0FBaUIsUUFBQSxDQUFDLENBQUMsSUFBRCxDQUFELENBQUE7QUFDakIsTUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQTtFQUFDLEtBQUEsR0FBUSxJQUFJLENBQUMsS0FBTCxDQUFXLFVBQVg7RUFDUixJQUFHLEtBQUssQ0FBQyxDQUFELENBQUwsS0FBYyxVQUFqQjtJQUNDLE1BQU0sSUFBSSxLQUFKLENBQVUsZ0JBQVYsRUFEUDs7RUFFQSxJQUFHLEtBQUssQ0FBQyxDQUFELENBQUwsS0FBYyxNQUFqQjtJQUNDLE1BQU0sSUFBSSxLQUFKLENBQVUsMEJBQVYsRUFEUDtHQUhEOzs7RUFRQyxPQUFBLEdBQVUsSUFBSSxPQUFKLENBQUEsRUFSWDs7RUFXQyxLQUFBLCtDQUFBOztJQUNDLElBQUcsSUFBQSxLQUFVLEVBQVYsSUFBaUIsQ0FBQSxHQUFJLENBQXhCO01BQ0MsR0FBQSxHQUFNLElBQUksQ0FBQyxLQUFMLENBQVcsR0FBWDtNQUNOLE9BQU8sQ0FBQyxHQUFSLENBQ0M7UUFBQSxDQUFBLEVBQUcsR0FBRyxDQUFDLENBQUQsQ0FBTjtRQUNBLENBQUEsRUFBRyxHQUFHLENBQUMsQ0FBRCxDQUROO1FBRUEsQ0FBQSxFQUFHLEdBQUcsQ0FBQyxDQUFEO01BRk4sQ0FERCxFQUZEOztFQUREO1NBUUE7QUFwQmdCOzs7O0FDRnlDOzs7QUFBQSxJQUFBLFlBQUEsRUFBQTs7QUFFMUQsWUFBQSxHQUFlLE9BQUEsQ0FBUSxpQkFBUjs7QUFDZixPQUFBLEdBQVUsT0FBQSxDQUFRLFlBQVI7O0FBRVYsTUFBTSxDQUFDLE9BQVAsR0FBaUIsUUFBQSxDQUFDLENBQUMsSUFBRCxDQUFELENBQUE7QUFDakIsTUFBQSxFQUFBLEVBQUEsU0FBQSxFQUFBLFNBQUEsRUFBQSxRQUFBLEVBQUEsQ0FBQSxFQUFBLGFBQUEsRUFBQSxVQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQTtFQUFDLEVBQUEsR0FBSyxJQUFJLFlBQUosQ0FBaUIsSUFBakIsRUFBTjs7O0VBR0MsSUFBQSxHQUFPLEVBQUUsQ0FBQyxVQUFILENBQWMsQ0FBZCxFQUhSO0VBSUMsUUFBQSxHQUFXLEVBQUUsQ0FBQyxVQUFILENBQUE7RUFDWCxJQUFBLEdBQU8sRUFBRSxDQUFDLFVBQUgsQ0FBYyxDQUFkLEVBTFI7RUFPQyxJQUFHLElBQUEsS0FBVSxNQUFiO0lBQ0MsTUFBTSxJQUFJLEtBQUosQ0FBVSw0Q0FBVixFQURQOztFQUdBLElBQUcsSUFBQSxLQUFVLE1BQWI7SUFDQyxNQUFNLElBQUksS0FBSixDQUFVLENBQUE7a0JBQUEsQ0FBQSxDQUVNLENBQUMsSUFBQSxHQUFLLEVBQU4sQ0FBUyxDQUFDLElBQVYsQ0FBQSxDQUZOLENBQUEsS0FBQSxDQUFWLEVBRFA7R0FWRDs7O0VBaUJDLFNBQUEsR0FBWSxFQUFFLENBQUMsVUFBSCxDQUFjLENBQWQsRUFqQmI7RUFrQkMsU0FBQSxHQUFZLEVBQUUsQ0FBQyxVQUFILENBQUE7RUFDWixVQUFBLEdBQWEsRUFBRSxDQUFDLFVBQUgsQ0FBQSxFQW5CZDtFQW9CQyxhQUFBLEdBQWdCLEVBQUUsQ0FBQyxVQUFILENBQUE7RUFHaEIsSUFBRyxTQUFBLEtBQWUsTUFBbEI7SUFDQyxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsMEJBQUEsQ0FBQSxDQUE2QixTQUE3QixDQUFBLEdBQUEsQ0FBVixFQURQOztFQUdBLElBQUcsVUFBQSxLQUFnQixNQUFuQjtJQUNDLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSx1Q0FBQSxDQUFBLENBQTBDLFVBQVUsQ0FBQyxRQUFYLENBQW9CLEVBQXBCLENBQTFDLENBQUEsQ0FBVixFQURQO0dBMUJEOzs7RUErQkMsT0FBQSxHQUFVLElBQUksT0FBSixDQUFBO0VBQ1YsQ0FBQSxHQUFJO0FBQ0osU0FBTSxDQUFDLENBQUEsSUFBSyxDQUFOLENBQUEsR0FBVyxhQUFBLEdBQWdCLENBQWpDO0lBRUMsT0FBTyxDQUFDLEdBQVIsQ0FDQztNQUFBLENBQUEsRUFBRyxFQUFFLENBQUMsUUFBSCxDQUFBLENBQUg7TUFDQSxDQUFBLEVBQUcsRUFBRSxDQUFDLFFBQUgsQ0FBQSxDQURIO01BRUEsQ0FBQSxFQUFHLEVBQUUsQ0FBQyxRQUFILENBQUEsQ0FGSDtNQUdBLENBQUEsRUFBRyxFQUFFLENBQUMsUUFBSCxDQUFBLENBSEg7SUFBQSxDQUREO0VBRkQ7U0FRQTtBQTFDZ0I7Ozs7QUNONkM7OztBQUFBLElBQUE7O0FBRTlELE9BQUEsR0FBVSxPQUFBLENBQVEsWUFBUjs7QUFFVixNQUFNLENBQUMsT0FBUCxHQUFpQixRQUFBLENBQUMsQ0FBQyxJQUFELENBQUQsQ0FBQTtBQUNqQixNQUFBLENBQUEsRUFBQSxRQUFBLEVBQUEsT0FBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLENBQUEsRUFBQTtFQUFDLEtBQUEsR0FBUSxJQUFJLENBQUMsS0FBTCxDQUFXLFVBQVg7RUFFUixPQUFBLEdBQVUsSUFBSSxPQUFKLENBQUE7RUFFVixHQUFBLEdBQ0M7SUFBQSxRQUFBLEVBQVUsUUFBQSxDQUFDLElBQUQsQ0FBQTthQUFTLE9BQU8sQ0FBQyxJQUFSLEdBQWU7SUFBeEIsQ0FBVjtJQUNBLFlBQUEsRUFBYyxRQUFBLENBQUMsSUFBRCxDQUFBOztRQUNiLE9BQU8sQ0FBQyxjQUFlOzthQUN2QixPQUFPLENBQUMsV0FBUixJQUF1QixJQUFBLEdBQU87SUFGakIsQ0FEZDtJQUlBLFdBQUEsRUFBYSxRQUFBLENBQUMsV0FBRCxDQUFBO2FBQ1osT0FBTyxDQUFDLGVBQVIsR0FBMEIsUUFBQSxDQUFTLFdBQVQ7SUFEZCxDQUpiO0lBTUEsS0FBQSxFQUFPLFFBQUEsQ0FBQyxhQUFELENBQUE7QUFDVCxVQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsVUFBQSxFQUFBLFVBQUEsRUFBQTtNQUFHLFNBQUEsR0FBWSxJQUFJLENBQUMsS0FBTCxDQUFXLGFBQWEsQ0FBQyxPQUFkLENBQXNCLFlBQXRCLEVBQW9DLElBQXBDLENBQXlDLENBQUMsT0FBMUMsQ0FBa0QsSUFBbEQsRUFBd0QsR0FBeEQsQ0FBWDtNQUNaLENBQUMsVUFBRCxFQUFhLFVBQWIsRUFBeUIsS0FBekIsRUFBZ0MsSUFBaEMsQ0FBQSxHQUF3QztBQUN4QyxjQUFPLFVBQVA7QUFBQSxhQUNNLEtBRE47aUJBRUUsT0FBTyxDQUFDLEdBQVIsQ0FDQztZQUFBLENBQUEsRUFBRyxVQUFVLENBQUMsQ0FBRCxDQUFWLEdBQWdCLEdBQW5CO1lBQ0EsQ0FBQSxFQUFHLFVBQVUsQ0FBQyxDQUFELENBQVYsR0FBZ0IsR0FEbkI7WUFFQSxDQUFBLEVBQUcsVUFBVSxDQUFDLENBQUQsQ0FBVixHQUFnQixHQUZuQjtZQUdBLENBQUEsRUFBRztVQUhILENBREQ7QUFGRixhQU9NLFdBUE47aUJBUUUsT0FBTyxDQUFDLEdBQVIsQ0FDQztZQUFBLENBQUEsRUFBRyxVQUFVLENBQUMsQ0FBRCxDQUFWLEdBQWdCLEdBQW5CO1lBQ0EsQ0FBQSxFQUFHLFVBQVUsQ0FBQyxDQUFELENBQVYsR0FBZ0IsR0FEbkI7WUFFQSxDQUFBLEVBQUcsVUFBVSxDQUFDLENBQUQsQ0FBVixHQUFnQixHQUZuQjtZQUdBLENBQUEsRUFBRztVQUhILENBREQ7QUFSRixhQWFNLE1BYk47aUJBY0UsT0FBTyxDQUFDLEdBQVIsQ0FDQztZQUFBLENBQUEsRUFBRyxVQUFVLENBQUMsQ0FBRCxDQUFWLEdBQWdCLEdBQW5CO1lBQ0EsQ0FBQSxFQUFHLFVBQVUsQ0FBQyxDQUFELENBQVYsR0FBZ0IsR0FEbkI7WUFFQSxDQUFBLEVBQUcsVUFBVSxDQUFDLENBQUQsQ0FBVixHQUFnQixHQUZuQjtZQUdBLENBQUEsRUFBRyxVQUFVLENBQUMsQ0FBRCxDQUFWLEdBQWdCLEdBSG5CO1lBSUEsQ0FBQSxFQUFHO1VBSkgsQ0FERDtBQWRGLGFBb0JNLEtBcEJOO2lCQXFCRSxPQUFPLENBQUMsR0FBUixDQUNDO1lBQUEsQ0FBQSxFQUFHLFVBQVUsQ0FBQyxDQUFELENBQVYsR0FBZ0IsR0FBbkI7WUFDQSxDQUFBLEVBQUcsVUFBVSxDQUFDLENBQUQsQ0FBVixHQUFnQixHQURuQjtZQUVBLENBQUEsRUFBRyxVQUFVLENBQUMsQ0FBRCxDQUFWLEdBQWdCLEdBRm5CO1lBR0EsQ0FBQSxFQUFHO1VBSEgsQ0FERDtBQXJCRjtJQUhNO0VBTlA7RUFvQ0QsS0FBQSx1Q0FBQTs7SUFDQyxLQUFBLEdBQVEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxrQkFBWDtJQUNSLElBQUcsS0FBSDtNQUNDLENBQUMsQ0FBRCxFQUFJLE9BQUosRUFBYSxRQUFiLENBQUEsR0FBeUI7O1FBQ3pCLEdBQUcsQ0FBQyxPQUFELEVBQVc7T0FGZjs7RUFGRDtFQU1BLENBQUEsR0FBSSxPQUFPLENBQUM7RUFDWixJQUFHLENBQUEsR0FBSSxDQUFQO0lBQ0MsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUNmLGlCQURlLEVBRWYsc0JBRmUsQ0FHZixDQUFDLENBQUQsQ0FIZSxHQUdULENBQUEsRUFBQSxDQUFBLENBQUssQ0FBTCxDQUFBLENBQUEsQ0FIRCxFQURQOztTQU1BO0FBdkRnQjs7OztBQ0owRTs7QUFBQSxJQUFBOztBQUUzRixPQUFBLEdBQVUsT0FBQSxDQUFRLFlBQVI7O0FBRVYsTUFBTSxDQUFDLE9BQVAsR0FBaUIsUUFBQSxDQUFDLENBQUMsSUFBRCxDQUFELENBQUE7QUFDakIsTUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUE7RUFBQyxLQUFBLEdBQVEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxVQUFYO0VBRVIsT0FBQSxHQUFVLElBQUksT0FBSixDQUFBO0VBQ1YsQ0FBQSxHQUFJO0FBQ0osU0FBTSxDQUFDLENBQUEsSUFBSyxDQUFOLENBQUEsR0FBVyxLQUFLLENBQUMsTUFBdkI7SUFDQyxJQUFBLEdBQU8sS0FBSyxDQUFDLENBQUQ7SUFFWixJQUFHLElBQUksQ0FBQyxDQUFELENBQUosS0FBVyxHQUFYLElBQWtCLElBQUEsS0FBUSxFQUE3QjtBQUFxQyxlQUFyQztLQUZGOzs7Ozs7SUFRRSxVQUFBLEdBQWEsSUFBSSxDQUFDLEtBQUwsQ0FBVyw0RUFBWCxFQVJmOzs7Ozs7OztJQXVCRSxJQUFHLENBQUksVUFBUDtNQUNDLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSxLQUFBLENBQUEsQ0FBUSxDQUFSLENBQUEsdUJBQUEsQ0FBQSxDQUFtQyxVQUFuQyxDQUFBLENBQVYsRUFEUDs7SUFHQSxPQUFPLENBQUMsR0FBUixDQUNDO01BQUEsQ0FBQSxFQUFHLFVBQVUsQ0FBQyxDQUFELENBQVYsR0FBZ0IsR0FBbkI7TUFDQSxDQUFBLEVBQUcsVUFBVSxDQUFDLENBQUQsQ0FBVixHQUFnQixHQURuQjtNQUVBLENBQUEsRUFBRyxVQUFVLENBQUMsQ0FBRCxDQUFWLEdBQWdCLEdBRm5CO01BR0EsSUFBQSxFQUFNLFVBQVUsQ0FBQyxDQUFEO0lBSGhCLENBREQ7RUEzQkQ7U0FpQ0E7QUF0Q2dCOzs7O0FDTG9CO0FBQUEsSUFBQSxZQUFBLEVBQUE7O0FBRXJDLFlBQUEsR0FBZSxPQUFBLENBQVEsaUJBQVI7O0FBQ2YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxZQUFSOztBQUVWLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFFBQUEsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFBO0FBRWpCLE1BQUEsRUFBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUE7RUFBQyxPQUFBLEdBQVUsSUFBSSxPQUFKLENBQUE7RUFDVixFQUFBLEdBQUssSUFBSSxZQUFKLENBQWlCLElBQWpCO0VBRUwsSUFBRyxFQUFFLENBQUMsT0FBSCxDQUFBLENBQUEsS0FBa0IsR0FBckI7SUFDQyxNQUFNLElBQUksS0FBSixDQUFVLENBQUEseUJBQUEsQ0FBQSxDQUE0QixHQUE1QixDQUFBLGlCQUFBLENBQUEsQ0FBbUQsRUFBRSxDQUFDLE9BQUgsQ0FBQSxDQUFuRCxDQUFBLENBQUEsQ0FBVixFQURQOztFQUdBLEtBQVMsMkJBQVQ7SUFDQyxPQUFPLENBQUMsR0FBUixDQUNDO01BQUEsQ0FBQSxFQUFHLEVBQUUsQ0FBQyxRQUFILENBQUEsQ0FBSDtNQUNBLENBQUEsRUFBRyxFQUFFLENBQUMsUUFBSCxDQUFBLENBREg7TUFFQSxDQUFBLEVBQUcsRUFBRSxDQUFDLFFBQUgsQ0FBQTtJQUZILENBREQ7RUFERCxDQU5EOzs7O1NBY0M7QUFoQmdCOzs7O0FDTDJCO0FBQUEsSUFBQSxZQUFBLEVBQUE7O0FBRTVDLFlBQUEsR0FBZSxPQUFBLENBQVEsaUJBQVI7O0FBQ2YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxZQUFSOztBQUVWLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFFBQUEsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFBO0FBRWpCLE1BQUEsRUFBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUE7RUFBQyxPQUFBLEdBQVUsSUFBSSxPQUFKLENBQUE7RUFDVixFQUFBLEdBQUssSUFBSSxZQUFKLENBQWlCLElBQWpCO0VBRUwsSUFBRyxFQUFFLENBQUMsT0FBSCxDQUFBLENBQUEsS0FBa0IsSUFBckI7SUFDQyxNQUFNLElBQUksS0FBSixDQUFVLENBQUEseUJBQUEsQ0FBQSxDQUE0QixJQUE1QixDQUFBLGlCQUFBLENBQUEsQ0FBb0QsRUFBRSxDQUFDLE9BQUgsQ0FBQSxDQUFwRCxDQUFBLENBQUEsQ0FBVixFQURQOztFQUdBLEtBQVMsMkJBQVQ7SUFDQyxPQUFPLENBQUMsR0FBUixDQUNDO01BQUEsQ0FBQSxFQUFHLEVBQUUsQ0FBQyxRQUFILENBQUEsQ0FBSDtNQUNBLENBQUEsRUFBRyxFQUFFLENBQUMsUUFBSCxDQUFBLENBREg7TUFFQSxDQUFBLEVBQUcsRUFBRSxDQUFDLFFBQUgsQ0FBQSxDQUZIO01BR0EsQ0FBQSxFQUFHLEVBQUUsQ0FBQyxRQUFILENBQUEsQ0FISDtJQUFBLENBREQ7RUFERDtFQU9BLE9BQU8sQ0FBQyxlQUFSLEdBQTBCO1NBQzFCO0FBaEJnQjs7OztBQ0YwSjs7OztBQUFBLElBQUEsT0FBQSxFQUFBLG1CQUFBLEVBQUE7O0FBRTNLLE9BQUEsR0FBVSxPQUFBLENBQVEsWUFBUjs7QUFFVixPQUFBLEdBQVUsSUFKaUs7OztBQU8zSyxtQkFBQSxHQUFzQixRQUFBLENBQUMsU0FBRCxDQUFBO0FBQ3RCLE1BQUEsRUFBQSxFQUFBLEVBQUEsRUFBQSxHQUFBLEVBQUE7RUFBQyxHQUFBLEdBQU0sUUFBQSxDQUFDLENBQUQsQ0FBQTtXQUFNLFFBQUEsQ0FBUyxDQUFULEVBQVksRUFBWjtFQUFOO0VBRU4sS0FBQSxHQUFRLFNBQVMsQ0FBQyxLQUFWLENBQWdCLG9FQUFoQixFQUZUOzs7Ozs7RUFnQkMsQ0FBQyxFQUFELEVBQUssRUFBTCxDQUFBLEdBQVc7RUFFWCxJQUFHLEVBQUUsQ0FBQyxNQUFILEdBQVksQ0FBZjtXQUNDO01BQUEsQ0FBQSxFQUFHLEdBQUEsQ0FBSSxFQUFFLENBQUMsQ0FBRCxDQUFGLEdBQVEsRUFBRSxDQUFDLENBQUQsQ0FBZCxDQUFIO01BQ0EsQ0FBQSxFQUFHLEdBQUEsQ0FBSSxFQUFFLENBQUMsQ0FBRCxDQUFGLEdBQVEsRUFBRSxDQUFDLENBQUQsQ0FBZCxDQURIO01BRUEsQ0FBQSxFQUFHLEdBQUEsQ0FBSSxFQUFFLENBQUMsQ0FBRCxDQUFGLEdBQVEsRUFBRSxDQUFDLENBQUQsQ0FBZCxDQUZIO01BR0EsQ0FBQSxFQUFNLEVBQUUsQ0FBQyxNQUFILEtBQWEsQ0FBaEIsR0FBdUIsR0FBQSxDQUFJLEVBQUUsQ0FBQyxDQUFELENBQUYsR0FBUSxFQUFFLENBQUMsQ0FBRCxDQUFkLENBQXZCLEdBQThDO0lBSGpELEVBREQ7R0FBQSxNQUFBO1dBTUM7TUFBQSxDQUFBLEVBQUcsR0FBQSxDQUFJLEVBQUUsQ0FBQyxDQUFELENBQUYsR0FBUSxFQUFFLENBQUMsQ0FBRCxDQUFkLENBQUg7TUFDQSxDQUFBLEVBQUcsR0FBQSxDQUFJLEVBQUUsQ0FBQyxDQUFELENBQUYsR0FBUSxFQUFFLENBQUMsQ0FBRCxDQUFkLENBREg7TUFFQSxDQUFBLEVBQUcsR0FBQSxDQUFJLEVBQUUsQ0FBQyxDQUFELENBQUYsR0FBUSxFQUFFLENBQUMsQ0FBRCxDQUFkLENBRkg7TUFHQSxDQUFBLEVBQU0sRUFBRSxDQUFDLE1BQUgsS0FBYSxDQUFoQixHQUF1QixHQUFBLENBQUksRUFBRSxDQUFDLENBQUQsQ0FBRixHQUFRLEVBQUUsQ0FBQyxDQUFELENBQWQsQ0FBdkIsR0FBOEM7SUFIakQsRUFORDs7QUFuQnFCOztBQThCdEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIsUUFBQSxDQUFDLENBQUMsSUFBRCxDQUFELENBQUE7QUFDakIsTUFBQSxXQUFBLEVBQUEsZ0JBQUEsRUFBQSxnQkFBQSxFQUFBLGlCQUFBLEVBQUEsY0FBQSxFQUFBLFNBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLE9BQUEsRUFBQSxlQUFBLEVBQUE7RUFBQyxJQUFHLENBQUksSUFBSSxDQUFDLEtBQUwsQ0FBVyxPQUFYLENBQVA7SUFDQyxNQUFNLElBQUksS0FBSixDQUFVLHdCQUFWLEVBRFA7O0VBRUEsZUFBQSxHQUFrQixJQUFJLENBQUMsS0FBTCxDQUFXLElBQVg7RUFFbEIsaUJBQUEsR0FBb0IsZUFBZSxDQUFDLGtCQUpyQzs7RUFPQyxnQkFBQSxrREFBNEMsR0FQN0M7OztFQVVDLFdBQUEsR0FBYztFQUNkLGNBQUEsR0FBaUI7RUFDakIsTUFBQSxHQUFTO0VBRVQsT0FBQSxHQUFVLElBQUksT0FBSixDQUFBLEVBZFg7O0VBaUJDLElBQUcsaUJBQUEsSUFBc0IsaUJBQUEsR0FBb0IsT0FBN0M7SUFDQyxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsa0NBQUEsQ0FBQSxDQUFxQyxpQkFBckMsQ0FBQSxDQUFBLENBQVYsRUFEUDtHQWpCRDs7RUFxQkMsSUFBRyxDQUFJLGlCQUFKLElBQXlCLGlCQUFBLEdBQW9CLEdBQWhEOztJQUVDLEtBQUEsa0RBQUE7O01BQ0MsT0FBTyxDQUFDLEdBQVIsQ0FBWSxtQkFBQSxDQUFvQixTQUFwQixDQUFaO0lBREQsQ0FGRDtHQUFBLE1BQUE7O0lBTUMsSUFBRyxnQkFBZ0IsQ0FBQyxNQUFqQixHQUEwQixDQUE3QjtNQUNDLEtBQUEsb0RBQUE7O1FBQ0MsT0FBTyxDQUFDLEdBQVIsQ0FDQztVQUFBLENBQUEsRUFBRyxnQkFBZ0IsQ0FBQyxHQUFqQixHQUF1QixHQUExQjtVQUNBLENBQUEsRUFBRyxnQkFBZ0IsQ0FBQyxLQUFqQixHQUF5QixHQUQ1QjtVQUVBLENBQUEsRUFBRyxnQkFBZ0IsQ0FBQyxJQUFqQixHQUF3QixHQUYzQjtVQUdBLENBQUEsRUFBRyxnQkFBZ0IsQ0FBQyxLQUFqQixHQUF5QixHQUg1QjtVQUlBLElBQUEsRUFBTSxnQkFBZ0IsQ0FBQztRQUp2QixDQUREO01BREQsQ0FERDtLQU5EO0dBckJEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7U0ErRUM7QUFoRmdCOzs7O0FDeENRO0FBQUEsSUFBQTs7QUFFekIsT0FBQSxHQUFVLE9BQUEsQ0FBUSxZQUFSOztBQUVWLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFFBQUEsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFBO0FBQ2pCLE1BQUEsV0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBLFdBQUEsRUFBQSxDQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQSxXQUFBLEVBQUE7RUFBQyxLQUFBLEdBQVEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxVQUFYO0VBQ1IsUUFBQSxHQUFXLENBQ1YsV0FBQSxHQUFjLElBQUksT0FBSixDQUFBLENBREosRUFFVixXQUFBLEdBQWMsSUFBSSxPQUFKLENBQUEsQ0FGSjtFQUlYLGNBQUEsR0FBaUIsUUFBQSxDQUFDLElBQUQsRUFBTyxPQUFQLEVBQWdCLE1BQWhCLENBQUE7QUFDbEIsUUFBQTtJQUFFLEtBQUEsR0FBUSxJQUFJLENBQUMsS0FBTCxDQUFXLE1BQVg7SUFDUixJQUFHLEtBQUg7YUFDQyxPQUFPLENBQUMsR0FBUixDQUNDO1FBQUEsQ0FBQSxFQUFHLEtBQUssQ0FBQyxDQUFELENBQVI7UUFDQSxDQUFBLEVBQUcsS0FBSyxDQUFDLENBQUQsQ0FEUjtRQUVBLENBQUEsRUFBRyxLQUFLLENBQUMsQ0FBRDtNQUZSLENBREQsRUFERDs7RUFGZ0I7RUFPakIsS0FBQSx1Q0FBQTs7SUFDQyxjQUFBLENBQWUsSUFBZixFQUFxQixXQUFyQixFQUFrQyw2REFBbEM7SUFDQSxjQUFBLENBQWUsSUFBZixFQUFxQixXQUFyQixFQUFrQywyREFBbEM7RUFGRDtFQUlBLFdBQUEsR0FBYztFQUNkLEtBQUEsNENBQUE7O0lBQ0MsSUFBRyxPQUFPLENBQUMsTUFBUixJQUFrQixXQUFXLENBQUMsTUFBakM7TUFDQyxXQUFBLEdBQWMsUUFEZjs7RUFERDtFQUlBLENBQUEsR0FBSSxXQUFXLENBQUM7RUFDaEIsSUFBRyxDQUFBLEdBQUksQ0FBUDtJQUNDLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FDZixpQkFEZSxFQUVmLHNCQUZlLEVBR2YsNEJBSGUsRUFJZix5QkFKZSxDQUtmLENBQUMsQ0FBRCxDQUxlLEdBS1QsQ0FBQSxFQUFBLENBQUEsQ0FBSyxDQUFMLENBQUEsQ0FBQSxDQUxELEVBRFA7O0VBUUEsSUFBRyxXQUFXLENBQUMsS0FBWixDQUFrQixRQUFBLENBQUMsS0FBRCxDQUFBO1dBQVUsS0FBSyxDQUFDLENBQU4sSUFBVyxDQUFYLElBQWlCLEtBQUssQ0FBQyxDQUFOLElBQVcsQ0FBNUIsSUFBa0MsS0FBSyxDQUFDLENBQU4sSUFBVztFQUF2RCxDQUFsQixDQUFIO0lBQ0MsV0FBVyxDQUFDLE9BQVosQ0FBb0IsUUFBQSxDQUFDLEtBQUQsQ0FBQTtNQUNuQixLQUFLLENBQUMsQ0FBTixJQUFXO01BQ1gsS0FBSyxDQUFDLENBQU4sSUFBVzthQUNYLEtBQUssQ0FBQyxDQUFOLElBQVc7SUFIUSxDQUFwQixFQUREOztTQU1BO0FBckNnQjs7OztBQ0x5QjtBQUFBLElBQUEsT0FBQSxFQUFBLGNBQUEsRUFBQTs7QUFFMUMsT0FBQSxHQUFVLE9BQUEsQ0FBUSxZQUFSOztBQUVWLGNBQUEsR0FBaUIsUUFBQSxDQUFDLElBQUQsQ0FBQTtBQUNqQixNQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBO0VBQUMsS0FBQSxHQUNDO0lBQUEsT0FBQSxFQUFTLDRCQUFUO0lBQ0EsS0FBQSxFQUFPLDhCQURQO0lBRUEsT0FBQSxFQUFTO0VBRlQ7RUFHRCxLQUFBLEdBQVEsQ0FBQTtFQUNSLEtBQUEsR0FBUSxJQUFJLENBQUMsS0FBTCxDQUFXLFNBQVg7RUFDUixPQUFBLEdBQVU7RUFDVixLQUFLLENBQUMsT0FBTixDQUFjLFFBQUEsQ0FBQyxJQUFELENBQUE7QUFDZixRQUFBO0lBQUUsSUFBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQWQsQ0FBbUIsSUFBbkIsQ0FBSDtBQUNDLGFBREQ7S0FBQSxNQUVLLElBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFaLENBQWlCLElBQWpCLENBQUg7TUFDSixLQUFBLEdBQVEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxLQUFLLENBQUMsS0FBakI7TUFDUixJQUFHLE9BQUg7UUFDQyxLQUFLLENBQUMsT0FBRCxDQUFTLENBQUMsS0FBSyxDQUFDLENBQUQsQ0FBTixDQUFkLEdBQTJCLEtBQUssQ0FBQyxDQUFELEVBRGpDO09BQUEsTUFBQTtRQUdDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBRCxDQUFOLENBQUwsR0FBa0IsS0FBSyxDQUFDLENBQUQsRUFIeEI7T0FGSTtLQUFBLE1BTUEsSUFBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQWQsQ0FBbUIsSUFBbkIsQ0FBSDtNQUNKLEtBQUEsR0FBUSxJQUFJLENBQUMsS0FBTCxDQUFXLEtBQUssQ0FBQyxPQUFqQjtNQUNSLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBRCxDQUFOLENBQUwsR0FBa0IsQ0FBQTtNQUNsQixPQUFBLEdBQVUsS0FBSyxDQUFDLENBQUQsRUFIWDtLQUFBLE1BSUEsSUFBRyxJQUFJLENBQUMsTUFBTCxLQUFlLENBQWYsSUFBcUIsT0FBeEI7TUFDSixPQUFBLEdBQVUsS0FETjs7RUFiUSxDQUFkO1NBZ0JBO0FBeEJnQjs7QUEwQmpCLG9CQUFBLEdBQXVCLFFBQUEsQ0FBQyxRQUFELENBQUE7QUFDdkIsTUFBQSxNQUFBLEVBQUEsU0FBQSxFQUFBLFVBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUE7Ozs7RUFHQyxLQUFBLEdBQVEsY0FBQSxDQUFlLFFBQWY7RUFDUixNQUFBLEdBQVMsS0FBSyxDQUFDLHVCQUFEO0VBQ2QsSUFBRyxDQUFJLE1BQVA7SUFDQyxNQUFNLElBQUksS0FBSixDQUFVLHdEQUFWLEVBRFA7O0VBR0EsT0FBQSxHQUFVLElBQUksT0FBSixDQUFBO0VBQ1YsS0FBQSxhQUFBLEdBQUE7O0lBRUMsSUFBRyxDQUFJLEdBQUcsQ0FBQyxLQUFKLENBQVUsSUFBVixDQUFQO01BQ0MsVUFBQSxHQUFhLE1BQU0sQ0FBQyxHQUFELENBQUssQ0FBQyxLQUFaLENBQWtCLEdBQWxCO01BQ2IsSUFBRyxVQUFVLENBQUMsTUFBWCxLQUFxQixDQUF4QjtRQUNDLEtBQUEsb0RBQUE7O1VBQ0MsVUFBVSxDQUFDLENBQUQsQ0FBVixHQUFnQixRQUFBLENBQVMsU0FBVCxFQUFvQixFQUFwQjtRQURqQjtRQUVBLElBQUcsVUFBVSxDQUFDLEtBQVgsQ0FBaUIsUUFBQSxDQUFDLFNBQUQsQ0FBQTtpQkFBYyxRQUFBLENBQVMsU0FBVDtRQUFkLENBQWpCLENBQUg7VUFDQyxPQUFPLENBQUMsR0FBUixDQUNDO1lBQUEsQ0FBQSxFQUFHLFVBQVUsQ0FBQyxDQUFELENBQWI7WUFDQSxDQUFBLEVBQUcsVUFBVSxDQUFDLENBQUQsQ0FEYjtZQUVBLENBQUEsRUFBRyxVQUFVLENBQUMsQ0FBRCxDQUZiO1lBR0EsSUFBQSxFQUFNO1VBSE4sQ0FERCxFQUREO1NBSEQ7T0FGRDs7RUFGRDtTQWFBO0FBdkJzQjs7QUF5QnZCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFFBQUEsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFBO1NBQ2hCLG9CQUFBLENBQXFCLElBQXJCO0FBRGdCOzs7O0FDdERqQixJQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUEsYUFBQSxFQUFBLE9BQUEsRUFBQSxXQUFBLEVBQUEsYUFBQSxFQUFBLFlBQUEsRUFBQTs7QUFBQSxPQUFBLEdBQVUsT0FBQSxDQUFRLFdBQVI7O0FBQ1YsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSOztBQUVGLGNBQU4sTUFBQSxZQUFBLFFBQTBCLE1BQTFCO0VBQ0MsV0FBYSxDQUFBLENBQUE7U0FDWixDQUFBO0lBQ0EsSUFBQyxDQUFBLFNBQUQsQ0FBQTtFQUZZOztFQUliLFNBQVcsQ0FBQSxDQUFBO0lBQ1YsSUFBQyxDQUFBLENBQUQsR0FBSyxJQUFJLENBQUMsTUFBTCxDQUFBLENBQUEsR0FBZ0I7SUFDckIsSUFBQyxDQUFBLENBQUQsR0FBSyxJQUFJLENBQUMsTUFBTCxDQUFBLENBQUEsR0FBZ0I7V0FDckIsSUFBQyxDQUFBLENBQUQsR0FBSyxJQUFJLENBQUMsTUFBTCxDQUFBLENBQUEsR0FBZ0I7RUFIWDs7RUFLWCxRQUFVLENBQUEsQ0FBQTtJQUNULElBQUMsQ0FBQSxTQUFELENBQUE7V0FDQSxDQUFBLElBQUEsQ0FBQSxDQUFPLElBQUMsQ0FBQSxDQUFSLENBQUEsRUFBQSxDQUFBLENBQWMsSUFBQyxDQUFBLENBQWYsQ0FBQSxHQUFBLENBQUEsQ0FBc0IsSUFBQyxDQUFBLENBQXZCLENBQUEsRUFBQTtFQUZTOztFQUlWLEVBQUksQ0FBQSxDQUFBO1dBQUc7RUFBSDs7QUFkTDs7QUFnQk0sZ0JBQU4sTUFBQSxjQUFBLFFBQTRCLFFBQTVCO0VBQ0MsV0FBYSxDQUFBLENBQUE7QUFDZCxRQUFBLENBQUEsRUFBQSxDQUFBLEVBQUE7U0FBRSxDQUFBO0lBQ0EsSUFBQyxDQUFBLE1BQUQsR0FDQztNQUFBLElBQUEsRUFBTSwyQkFBTjtNQUNBLGNBQUEsRUFBZ0IsRUFEaEI7TUFFQSxvQkFBQSxFQUFzQjtJQUZ0QjtJQUdELElBQUMsQ0FBQSwyQkFBRCxHQUErQjtJQUMvQixJQUFDLENBQUEsVUFBRCxHQUFjO0lBQ2QsSUFBQyxDQUFBLFFBQUQsQ0FBQTtJQUNBLEtBQVMsbUdBQVQ7TUFDQyxJQUFDLENBQUEsSUFBRCxDQUFNLElBQUksV0FBSixDQUFBLENBQU47SUFERDtFQVRZOztBQURkOztBQWFNLGdCQUFOLE1BQUEsY0FBQSxRQUE0QixNQUE1QjtFQUNDLFdBQWEsUUFBQSxDQUFBO0FBQ2QsUUFBQTs7SUFEZSxJQUFDLENBQUE7SUFFZCxJQUFDLENBQUEsT0FBRCxHQUFXLDRDQUFBOztBQUNWO0FBQUE7TUFBQSxLQUFBLHFDQUFBOztxQkFDQyxNQUFBLEdBQVMsS0FBSyxDQUFDO01BRGhCLENBQUE7OztFQUhXOztBQURkOztBQU9BLFlBQUEsR0FBZSxRQUFBLENBQUMsQ0FBRCxFQUFJLFFBQUosQ0FBQTtBQUVmLE1BQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLGVBQUEsRUFBQTtFQUFDLGVBQUEsR0FBa0I7SUFDakI7TUFDQyxJQUFBLEVBQU0sd0JBRFA7TUFFQyxJQUFBLEVBQU0sQ0FBQyxLQUFEO0lBQVEsWUFBUixDQUZQO01BR0MsSUFBQSxFQUFNLE9BQUEsQ0FBUSx3QkFBUjtJQUhQLENBRGlCO0lBTWpCO01BQ0MsSUFBQSxFQUFNLFVBRFA7TUFFQyxJQUFBLEVBQU0sQ0FBQyxLQUFELENBRlA7TUFHQyxJQUFBLEVBQU0sT0FBQSxDQUFRLGdCQUFSO0lBSFAsQ0FOaUI7SUFXakI7TUFDQyxJQUFBLEVBQU0sc0JBRFA7TUFFQyxJQUFBLEVBQU0sQ0FBQyxJQUFELENBRlA7TUFHQyxJQUFBLEVBQU0sT0FBQSxDQUFRLHdCQUFSO0lBSFAsQ0FYaUI7SUFnQmpCO01BQ0MsSUFBQSxFQUFNLG1CQURQO01BRUMsSUFBQSxFQUFNLENBQUMsS0FBRCxDQUZQO01BR0MsSUFBQSxFQUFNLE9BQUEsQ0FBUSxxQkFBUjtJQUhQLENBaEJpQjtJQXFCakI7TUFDQyxJQUFBLEVBQU0sY0FEUDtNQUVDLElBQUEsRUFBTSxDQUFDLEtBQUQ7SUFBUSxNQUFSO0lBQWdCLFFBQWhCLENBRlA7TUFHQyxJQUFBLEVBQU0sT0FBQSxDQUFRLGdCQUFSO0lBSFAsQ0FyQmlCO0lBMEJqQjtNQUNDLElBQUEsRUFBTSxxQkFEUDtNQUVDLElBQUEsRUFBTSxDQUFDLFFBQUQsQ0FGUDtNQUdDLElBQUEsRUFBTSxPQUFBLENBQVEsdUJBQVI7SUFIUCxDQTFCaUI7SUErQmpCO01BQ0MsSUFBQSxFQUFNLGlCQURQO01BRUMsSUFBQSxFQUFNLENBQUMsS0FBRCxDQUZQO01BR0MsSUFBQSxFQUFNLE9BQUEsQ0FBUSxlQUFSO0lBSFAsQ0EvQmlCO0lBb0NqQjtNQUNDLElBQUEsRUFBTSxnQkFEUDtNQUVDLElBQUEsRUFBTSxDQUFDLGVBQUQsQ0FGUDtNQUdDLElBQUEsRUFBTSxPQUFBLENBQVEseUJBQVI7SUFIUCxDQXBDaUI7SUF5Q2pCO01BQ0MsSUFBQSxFQUFNLGFBRFA7TUFFQyxJQUFBLEVBQU0sQ0FBQyxLQUFELENBRlA7TUFHQyxJQUFBLEVBQU0sT0FBQSxDQUFRLGVBQVI7SUFIUCxDQXpDaUI7SUE4Q2pCO01BQ0MsSUFBQSxFQUFNLFlBRFA7TUFFQyxJQUFBLEVBQU0sQ0FBQyxLQUFEO0lBQVEsTUFBUjtJQUFnQixNQUFoQjtJQUF3QixNQUF4QjtJQUFnQyxNQUFoQztJQUF3QyxNQUF4QztJQUFnRCxLQUFoRDtJQUF1RCxLQUF2RDtJQUE4RCxJQUE5RDtJQUFvRSxJQUFwRTtJQUEwRSxLQUExRTtJQUFpRixLQUFqRixDQUZQO01BR0MsSUFBQSxFQUFNLE9BQUEsQ0FBUSxlQUFSO0lBSFAsQ0E5Q2lCO0lBbURqQjtNQUNDLElBQUEsRUFBTSx1QkFEUDtNQUVDLElBQUEsRUFBTSxDQUFDLE9BQUQ7SUFBVSxXQUFWLENBRlA7TUFHQyxJQUFBLEVBQU0sT0FBQSxDQUFRLGlCQUFSO0lBSFAsQ0FuRGlCO0lBa0VqQixDQUFBOzs7Ozs7Ozs7OztNQUNDLElBQUEsRUFBTSxtQkFEUDtNQUVDLElBQUEsRUFBTSxDQUFDLEtBQUQsQ0FGUDtNQUdDLElBQUEsRUFBTSxPQUFBLENBQVEsMkJBQVI7SUFIUCxDQWxFaUI7SUFpRmpCLENBQUE7Ozs7Ozs7Ozs7O01BQ0MsSUFBQSxFQUFNLGtCQURQO01BRUMsSUFBQSxFQUFNLENBQUMsS0FBRCxDQUZQO01BR0MsSUFBQSxFQUFNLE9BQUEsQ0FBUSxvQkFBUjtJQUhQLENBakZpQjtJQXNGakI7TUFDQyxJQUFBLEVBQU0sbUJBRFA7TUFFQyxJQUFBLEVBQU0sQ0FBQyxLQUFELENBRlA7TUFHQyxJQUFBLEVBQU0sT0FBQSxDQUFRLHFCQUFSO0lBSFAsQ0F0RmlCO0lBMkZqQjtNQUNDLElBQUEsRUFBTSwyQkFEUDtNQUVDLElBQUEsRUFBTSxDQUFDLEtBQUQsQ0FGUDtNQUdDLElBQUEsRUFBTSxPQUFBLENBQVEsMkJBQVI7SUFIUCxDQTNGaUI7SUE2R2pCLENBQUE7Ozs7Ozs7Ozs7Ozs7O01BQ0MsSUFBQSxFQUFNLGdCQURQO01BRUMsSUFBQSxFQUFNLENBQUMsS0FBRDtJQUFRLEtBQVI7SUFBZSxLQUFmLENBRlA7TUFHQyxJQUFBLEVBQU0sT0FBQSxDQUFRLG1CQUFSO0lBSFAsQ0E3R2lCO0lBQW5COzs7RUFxSEMsS0FBQSxpREFBQTs7SUFDQyxFQUFFLENBQUMsV0FBSCxHQUFpQixFQUFFLENBQUMsSUFBSSxDQUFDLE9BQVIsQ0FBZ0IsQ0FBQyxDQUFDLE9BQWxCLENBQUEsS0FBZ0MsQ0FBQztFQURuRCxDQXJIRDs7O0VBeUhDLGVBQWUsQ0FBQyxJQUFoQixDQUFxQixRQUFBLENBQUMsR0FBRCxFQUFNLEdBQU4sQ0FBQTtXQUNwQixHQUFHLENBQUMsV0FBSixHQUFrQixHQUFHLENBQUM7RUFERixDQUFyQixFQXpIRDs7O0VBNkhDLE1BQUEsR0FBUztFQUNULEtBQUEsbURBQUE7O0FBRUM7TUFDQyxPQUFBLEdBQVUsRUFBRSxDQUFDLElBQUgsQ0FBUSxDQUFSO01BQ1YsSUFBRyxPQUFPLENBQUMsTUFBUixLQUFrQixDQUFyQjtRQUNDLE9BQUEsR0FBVTtRQUNWLE1BQU0sSUFBSSxLQUFKLENBQVUsb0JBQVYsRUFGUDtPQUZEO0tBS0EsY0FBQTtNQUFNO01BQ0wsR0FBQSxHQUFNLENBQUEsZUFBQSxDQUFBLENBQWtCLENBQUMsQ0FBQyxRQUFwQixDQUFBLElBQUEsQ0FBQSxDQUFtQyxFQUFFLENBQUMsSUFBdEMsQ0FBQSxFQUFBLENBQUEsQ0FBK0MsQ0FBQyxDQUFDLE9BQWpELENBQUEsRUFBVDs7Ozs7Ozs7TUFRRyxHQUFBLEdBQU0sSUFBSSxLQUFKLENBQVUsR0FBVjtNQUNOLEdBQUcsQ0FBQyxLQUFKLEdBQVk7TUFDWixNQUFNLENBQUMsSUFBUCxDQUFZLEdBQVosRUFYRDs7SUFhQSxJQUFHLE9BQUg7O01BRUMsT0FBTyxDQUFDLFVBQVIsR0FBd0IsRUFBRSxDQUFDLFdBQU4sR0FBdUIsR0FBdkIsR0FBZ0M7TUFDckQsV0FBQSxHQUFjLENBQUEsQ0FBQSxDQUFBLENBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFSLENBQWEsS0FBYixDQUFKLENBQUEsRUFGakI7Ozs7TUFNRyxPQUFPLENBQUMsTUFBUixHQUNDO1FBQUEsSUFBQSxFQUFNLEVBQUUsQ0FBQyxJQUFUO1FBQ0EsY0FBQSxFQUFnQixFQUFFLENBQUMsSUFEbkI7UUFFQSxvQkFBQSxFQUFzQjtNQUZ0QjtNQUdELE9BQU8sQ0FBQywyQkFBUixHQUFzQyxFQUFFLENBQUM7TUFFekMsT0FBTyxDQUFDLFFBQVIsQ0FBQTtNQUNBLFFBQUEsQ0FBUyxJQUFULEVBQWUsT0FBZjtBQUNBLGFBZkQ7O0VBcEJEO0VBcUNBLFFBQUEsQ0FBUyxJQUFJLGFBQUosQ0FBa0IsTUFBbEIsQ0FBVDtBQXJLYzs7QUF3S2YsaUJBQUEsR0FBb0IsUUFBQSxDQUFDLElBQUksQ0FBQSxDQUFMLENBQUE7QUFDcEIsTUFBQSxHQUFBLEVBQUE7RUFBQyxJQUFHLE9BQU8sQ0FBUCxLQUFZLFFBQVosSUFBd0IsQ0FBQSxZQUFhLE1BQXhDO0lBQ0MsQ0FBQSxHQUFJO01BQUEsUUFBQSxFQUFVO0lBQVYsRUFETDs7RUFFQSxJQUFHLDhDQUFBLElBQVUsQ0FBQSxZQUFhLElBQTFCO0lBQ0MsQ0FBQSxHQUFJO01BQUEsSUFBQSxFQUFNO0lBQU4sRUFETDtHQUZEOzs7OztJQU9DLENBQUMsQ0FBQyxnRkFBMkIsQ0FBSSxDQUFDLENBQUMsUUFBTCxHQUFtQixPQUFBLENBQVEsTUFBUixDQUFlLENBQUMsUUFBaEIsQ0FBeUIsQ0FBQyxDQUFDLFFBQTNCLENBQW5CLEdBQUEsTUFBRDs7O0lBQzdCLENBQUMsQ0FBQyxVQUFXLENBQUEsQ0FBQSxDQUFHLENBQUMsQ0FBQyxRQUFMLENBQUEsQ0FBZSxDQUFDLEtBQWhCLENBQXNCLEdBQXRCLENBQTBCLENBQUMsR0FBM0IsQ0FBQTs7RUFDYixDQUFDLENBQUMsT0FBRixHQUFZLENBQUEsQ0FBQSxDQUFHLENBQUMsQ0FBQyxPQUFMLENBQUEsQ0FBYyxDQUFDLFdBQWYsQ0FBQTtTQUNaO0FBWG1COztBQWFwQixVQUFBLEdBQWEsQ0FDWixLQURZLEVBRVosT0FGWSxFQUdaLFdBSFksRUFJWixhQUpZLEVBNU5iOzs7O0FBcU9BLFVBQVUsQ0FBQyxXQUFYLEdBQXlCLFFBQUEsQ0FBQyxDQUFELEVBQUksUUFBSixDQUFBO0FBQ3pCLE1BQUEsRUFBQSxFQUFBO0VBQUMsSUFBRyxDQUFJLENBQVA7SUFDQyxNQUFNLElBQUksU0FBSixDQUFjLDJGQUFkLEVBRFA7O0VBRUEsSUFBRyxDQUFJLFFBQVA7SUFDQyxNQUFNLElBQUksU0FBSixDQUFjLHlGQUFkLEVBRFA7O0VBR0EsQ0FBQSxHQUFJLGlCQUFBLENBQWtCLENBQWxCO0VBRUosSUFBRyxDQUFDLENBQUMsSUFBTDtXQUNDLFlBQUEsQ0FBYSxDQUFiLEVBQWdCLFFBQWhCLEVBREQ7R0FBQSxNQUVLLElBQUcsQ0FBQyxDQUFDLElBQUw7SUFDSixJQUFHLENBQUksQ0FBQyxDQUFDLENBQUMsSUFBRixZQUFrQixJQUFuQixDQUFQO01BQ0MsTUFBTSxJQUFJLFNBQUosQ0FBYyw4Q0FBZCxFQURQOztJQUVBLEVBQUEsR0FBSyxJQUFJLFVBQUosQ0FBQTtJQUNMLEVBQUUsQ0FBQyxPQUFILEdBQWEsUUFBQSxDQUFBLENBQUE7YUFDWixRQUFBLENBQVMsRUFBRSxDQUFDLEtBQVo7SUFEWTtJQUViLEVBQUUsQ0FBQyxNQUFILEdBQVksUUFBQSxDQUFBLENBQUE7TUFDWCxDQUFDLENBQUMsSUFBRixHQUFTLEVBQUUsQ0FBQzthQUNaLFlBQUEsQ0FBYSxDQUFiLEVBQWdCLFFBQWhCO0lBRlc7V0FHWixFQUFFLENBQUMsa0JBQUgsQ0FBc0IsQ0FBQyxDQUFDLElBQXhCLEVBVEk7R0FBQSxNQVVBLElBQUcsa0JBQUg7SUFDSixFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7V0FDTCxFQUFFLENBQUMsUUFBSCxDQUFZLENBQUMsQ0FBQyxRQUFkLEVBQXdCLFFBQUEsQ0FBQyxLQUFELEVBQVEsSUFBUixDQUFBO01BQ3ZCLElBQUcsS0FBSDtlQUNDLFFBQUEsQ0FBUyxLQUFULEVBREQ7T0FBQSxNQUFBO1FBR0MsQ0FBQyxDQUFDLElBQUYsR0FBUyxJQUFJLENBQUMsUUFBTCxDQUFjLFFBQWQ7ZUFDVCxZQUFBLENBQWEsQ0FBYixFQUFnQixRQUFoQixFQUpEOztJQUR1QixDQUF4QixFQUZJO0dBQUEsTUFBQTtJQVNKLE1BQU0sSUFBSSxTQUFKLENBQWMsd0VBQWQsRUFURjs7QUFwQm1CLEVBck96Qjs7OztBQXVRQSxVQUFVLENBQUMsYUFBWCxHQUEyQixRQUFBLENBQUMsQ0FBRCxFQUFJLFFBQUosQ0FBQTtFQUMxQixDQUFBLEdBQUksaUJBQUEsQ0FBa0IsQ0FBbEI7U0FFSixVQUFVLENBQUMsV0FBWCxDQUF1QixDQUF2QixFQUEwQixRQUFBLENBQUMsR0FBRCxFQUFNLE9BQU4sQ0FBQTtXQUN6QixRQUFBLENBQVMsSUFBVCxvQkFBZSxVQUFVLElBQUksYUFBSixDQUFBLENBQXpCO0VBRHlCLENBQTFCO0FBSDBCLEVBdlEzQjs7O0FBOFFBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXG4jIyNcbkJpbmFyeVJlYWRlclxuXG5Nb2RpZmllZCBieSBJc2FpYWggT2RobmVyXG5AVE9ETzogdXNlIGpEYXRhVmlldyArIGpCaW5hcnkgaW5zdGVhZFxuXG5SZWZhY3RvcmVkIGJ5IFZqZXV4IDx2amV1eHhAZ21haWwuY29tPlxuaHR0cDovL2Jsb2cudmpldXguY29tLzIwMTAvamF2YXNjcmlwdC9qYXZhc2NyaXB0LWJpbmFyeS1yZWFkZXIuaHRtbFxuXG5PcmlnaW5hbFxuKyBKb25hcyBSYW9uaSBTb2FyZXMgU2lsdmFcbkAgaHR0cDovL2pzZnJvbWhlbGwuY29tL2NsYXNzZXMvYmluYXJ5LXBhcnNlciBbcmV2LiAjMV1cbiMjI1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBCaW5hcnlSZWFkZXJcblx0Y29uc3RydWN0b3I6IChkYXRhKS0+XG5cdFx0QF9idWZmZXIgPSBkYXRhXG5cdFx0QF9wb3MgPSAwXG5cblx0IyBQdWJsaWMgKGN1c3RvbSlcblx0XG5cdHJlYWRCeXRlOiAtPlxuXHRcdEBfY2hlY2tTaXplKDgpXG5cdFx0Y2ggPSB0aGlzLl9idWZmZXIuY2hhckNvZGVBdChAX3BvcykgJiAweGZmXG5cdFx0QF9wb3MgKz0gMVxuXHRcdGNoICYgMHhmZlxuXHRcblx0cmVhZFVuaWNvZGVTdHJpbmc6IC0+XG5cdFx0bGVuZ3RoID0gQHJlYWRVSW50MTYoKVxuXHRcdCMgY29uc29sZS5sb2cge2xlbmd0aH1cblx0XHRAX2NoZWNrU2l6ZShsZW5ndGggKiAxNilcblx0XHRzdHIgPSBcIlwiXG5cdFx0Zm9yIGkgaW4gWzAuLmxlbmd0aF1cblx0XHRcdHN0ciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKEBfYnVmZmVyLnN1YnN0cihAX3BvcywgMSkgfCAoQF9idWZmZXIuc3Vic3RyKEBfcG9zKzEsIDEpIDw8IDgpKVxuXHRcdFx0QF9wb3MgKz0gMlxuXHRcdHN0clxuXHRcblx0IyBQdWJsaWNcblx0XG5cdHJlYWRJbnQ4OiAtPiBAX2RlY29kZUludCg4LCB0cnVlKVxuXHRyZWFkVUludDg6IC0+IEBfZGVjb2RlSW50KDgsIGZhbHNlKVxuXHRyZWFkSW50MTY6IC0+IEBfZGVjb2RlSW50KDE2LCB0cnVlKVxuXHRyZWFkVUludDE2OiAtPiBAX2RlY29kZUludCgxNiwgZmFsc2UpXG5cdHJlYWRJbnQzMjogLT4gQF9kZWNvZGVJbnQoMzIsIHRydWUpXG5cdHJlYWRVSW50MzI6IC0+IEBfZGVjb2RlSW50KDMyLCBmYWxzZSlcblxuXHRyZWFkRmxvYXQ6IC0+IEBfZGVjb2RlRmxvYXQoMjMsIDgpXG5cdHJlYWREb3VibGU6IC0+IEBfZGVjb2RlRmxvYXQoNTIsIDExKVxuXHRcblx0cmVhZENoYXI6IC0+IEByZWFkU3RyaW5nKDEpXG5cdHJlYWRTdHJpbmc6IChsZW5ndGgpLT5cblx0XHRAX2NoZWNrU2l6ZShsZW5ndGggKiA4KVxuXHRcdHJlc3VsdCA9IEBfYnVmZmVyLnN1YnN0cihAX3BvcywgbGVuZ3RoKVxuXHRcdEBfcG9zICs9IGxlbmd0aFxuXHRcdHJlc3VsdFxuXG5cdHNlZWs6IChwb3MpLT5cblx0XHRAX3BvcyA9IHBvc1xuXHRcdEBfY2hlY2tTaXplKDApXG5cdFxuXHRnZXRQb3NpdGlvbjogLT4gQF9wb3Ncblx0XG5cdGdldFNpemU6IC0+IEBfYnVmZmVyLmxlbmd0aFxuXHRcblxuXG5cdCMgUHJpdmF0ZVxuXHRcblx0X2RlY29kZUZsb2F0OiBgZnVuY3Rpb24ocHJlY2lzaW9uQml0cywgZXhwb25lbnRCaXRzKXtcblx0XHR2YXIgbGVuZ3RoID0gcHJlY2lzaW9uQml0cyArIGV4cG9uZW50Qml0cyArIDE7XG5cdFx0dmFyIHNpemUgPSBsZW5ndGggPj4gMztcblx0XHR0aGlzLl9jaGVja1NpemUobGVuZ3RoKTtcblxuXHRcdHZhciBiaWFzID0gTWF0aC5wb3coMiwgZXhwb25lbnRCaXRzIC0gMSkgLSAxO1xuXHRcdHZhciBzaWduYWwgPSB0aGlzLl9yZWFkQml0cyhwcmVjaXNpb25CaXRzICsgZXhwb25lbnRCaXRzLCAxLCBzaXplKTtcblx0XHR2YXIgZXhwb25lbnQgPSB0aGlzLl9yZWFkQml0cyhwcmVjaXNpb25CaXRzLCBleHBvbmVudEJpdHMsIHNpemUpO1xuXHRcdHZhciBzaWduaWZpY2FuZCA9IDA7XG5cdFx0dmFyIGRpdmlzb3IgPSAyO1xuXHRcdHZhciBjdXJCeXRlID0gMDsgLy9sZW5ndGggKyAoLXByZWNpc2lvbkJpdHMgPj4gMykgLSAxO1xuXHRcdGRvIHtcblx0XHRcdHZhciBieXRlVmFsdWUgPSB0aGlzLl9yZWFkQnl0ZSgrK2N1ckJ5dGUsIHNpemUpO1xuXHRcdFx0dmFyIHN0YXJ0Qml0ID0gcHJlY2lzaW9uQml0cyAlIDggfHwgODtcblx0XHRcdHZhciBtYXNrID0gMSA8PCBzdGFydEJpdDtcblx0XHRcdHdoaWxlIChtYXNrID4+PSAxKSB7XG5cdFx0XHRcdGlmIChieXRlVmFsdWUgJiBtYXNrKSB7XG5cdFx0XHRcdFx0c2lnbmlmaWNhbmQgKz0gMSAvIGRpdmlzb3I7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZGl2aXNvciAqPSAyO1xuXHRcdFx0fVxuXHRcdH0gd2hpbGUgKHByZWNpc2lvbkJpdHMgLT0gc3RhcnRCaXQpO1xuXG5cdFx0dGhpcy5fcG9zICs9IHNpemU7XG5cblx0XHRyZXR1cm4gZXhwb25lbnQgPT0gKGJpYXMgPDwgMSkgKyAxID8gc2lnbmlmaWNhbmQgPyBOYU4gOiBzaWduYWwgPyAtSW5maW5pdHkgOiArSW5maW5pdHlcblx0XHRcdDogKDEgKyBzaWduYWwgKiAtMikgKiAoZXhwb25lbnQgfHwgc2lnbmlmaWNhbmQgPyAhZXhwb25lbnQgPyBNYXRoLnBvdygyLCAtYmlhcyArIDEpICogc2lnbmlmaWNhbmRcblx0XHRcdDogTWF0aC5wb3coMiwgZXhwb25lbnQgLSBiaWFzKSAqICgxICsgc2lnbmlmaWNhbmQpIDogMCk7XG5cdH1gXG5cblx0X2RlY29kZUludDogYGZ1bmN0aW9uKGJpdHMsIHNpZ25lZCl7XG5cdFx0dmFyIHggPSB0aGlzLl9yZWFkQml0cygwLCBiaXRzLCBiaXRzIC8gOCksIG1heCA9IE1hdGgucG93KDIsIGJpdHMpO1xuXHRcdHZhciByZXN1bHQgPSBzaWduZWQgJiYgeCA+PSBtYXggLyAyID8geCAtIG1heCA6IHg7XG5cblx0XHR0aGlzLl9wb3MgKz0gYml0cyAvIDg7XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fWBcblxuXHQjc2hsIGZpeDogSGVucmkgVG9yZ2VtYW5lIH4xOTk2IChjb21wcmVzc2VkIGJ5IEpvbmFzIFJhb25pKVxuXHRfc2hsOiBgZnVuY3Rpb24gKGEsIGIpe1xuXHRcdGZvciAoKytiOyAtLWI7IGEgPSAoKGEgJT0gMHg3ZmZmZmZmZiArIDEpICYgMHg0MDAwMDAwMCkgPT0gMHg0MDAwMDAwMCA/IGEgKiAyIDogKGEgLSAweDQwMDAwMDAwKSAqIDIgKyAweDdmZmZmZmZmICsgMSk7XG5cdFx0cmV0dXJuIGE7XG5cdH1gXG5cdFxuXHRfcmVhZEJ5dGU6IGBmdW5jdGlvbiAoaSwgc2l6ZSkge1xuXHRcdHJldHVybiB0aGlzLl9idWZmZXIuY2hhckNvZGVBdCh0aGlzLl9wb3MgKyBzaXplIC0gaSAtIDEpICYgMHhmZjtcblx0fWBcblxuXHRfcmVhZEJpdHM6IGBmdW5jdGlvbiAoc3RhcnQsIGxlbmd0aCwgc2l6ZSkge1xuXHRcdHZhciBvZmZzZXRMZWZ0ID0gKHN0YXJ0ICsgbGVuZ3RoKSAlIDg7XG5cdFx0dmFyIG9mZnNldFJpZ2h0ID0gc3RhcnQgJSA4O1xuXHRcdHZhciBjdXJCeXRlID0gc2l6ZSAtIChzdGFydCA+PiAzKSAtIDE7XG5cdFx0dmFyIGxhc3RCeXRlID0gc2l6ZSArICgtKHN0YXJ0ICsgbGVuZ3RoKSA+PiAzKTtcblx0XHR2YXIgZGlmZiA9IGN1ckJ5dGUgLSBsYXN0Qnl0ZTtcblxuXHRcdHZhciBzdW0gPSAodGhpcy5fcmVhZEJ5dGUoY3VyQnl0ZSwgc2l6ZSkgPj4gb2Zmc2V0UmlnaHQpICYgKCgxIDw8IChkaWZmID8gOCAtIG9mZnNldFJpZ2h0IDogbGVuZ3RoKSkgLSAxKTtcblxuXHRcdGlmIChkaWZmICYmIG9mZnNldExlZnQpIHtcblx0XHRcdHN1bSArPSAodGhpcy5fcmVhZEJ5dGUobGFzdEJ5dGUrKywgc2l6ZSkgJiAoKDEgPDwgb2Zmc2V0TGVmdCkgLSAxKSkgPDwgKGRpZmYtLSA8PCAzKSAtIG9mZnNldFJpZ2h0OyBcblx0XHR9XG5cblx0XHR3aGlsZSAoZGlmZikge1xuXHRcdFx0c3VtICs9IHRoaXMuX3NobCh0aGlzLl9yZWFkQnl0ZShsYXN0Qnl0ZSsrLCBzaXplKSwgKGRpZmYtLSA8PCAzKSAtIG9mZnNldFJpZ2h0KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gc3VtO1xuXHR9YFxuXG5cdF9jaGVja1NpemU6IChuZWVkZWRCaXRzKS0+XG5cdFx0aWYgQF9wb3MgKyBNYXRoLmNlaWwobmVlZGVkQml0cyAvIDgpID4gQF9idWZmZXIubGVuZ3RoXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJJbmRleCBvdXQgb2YgYm91bmRcIlxuXG4iLCJcbiMgY29sb3IgdmFsdWUgcmFuZ2VzOlxuIyBhOiAwIHRvIDFcbiMgci9nL2I6IDAgdG8gMjU1XG4jIGg6IDAgdG8gMzYwXG4jIHMvbDogMCB0byAxMDBcbiMgYy9tL3kvazogMCB0byAxMDBcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQ29sb3Jcblx0Y29uc3RydWN0b3I6IChvcHRpb25zKS0+XG5cdFx0IyBAVE9ETzogZG9uJ3QgYXNzaWduIGFsbCBvZiB7QHIsIEBnLCBAYiwgQGgsIEBzLCBAdiwgQGx9IHJpZ2h0IGF3YXlcblx0XHQjIG9ubHkgYXNzaWduIHRoZSBwcm9wZXJ0aWVzIHRoYXQgYXJlIHVzZWRcblx0XHQjIGFsc28gbWF5YmUgYWx3YXlzIGhhdmUgQHIgQGcgQGIgKG9yIEByZWQgQGdyZWVuIEBibHVlKSBidXQgc3RpbGwgc3RyaW5naWZ5IHRvIGhzbCgpIGlmIGhzbCBvciBoc3YgZ2l2ZW5cblx0XHQjIFRPRE86IGV4cGVjdCBudW1iZXJzIG9yIGNvbnZlcnQgdG8gbnVtYmVyc1xuXHRcdHtcblx0XHRcdEByLCBAZywgQGIsXG5cdFx0XHRAaCwgQHMsIEB2LCBAbCxcblx0XHRcdGMsIG0sIHksIGssXG5cdFx0XHRAbmFtZVxuXHRcdH0gPSBvcHRpb25zXG5cblx0XHRpZiBAcj8gYW5kIEBnPyBhbmQgQGI/XG5cdFx0XHQjIFJlZCBHcmVlbiBCbHVlXG5cdFx0XHQjIChubyBjb252ZXJzaW9ucyBuZWVkZWQgaGVyZSlcblx0XHRlbHNlIGlmIEBoPyBhbmQgQHM/XG5cdFx0XHQjIEN5bGluZHJpY2FsIENvbG9yIFNwYWNlXG5cdFx0XHRpZiBAdj9cblx0XHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBWYWx1ZVxuXHRcdFx0XHRAbCA9ICgyIC0gQHMgLyAxMDApICogQHYgLyAyXG5cdFx0XHRcdEBzID0gQHMgKiBAdiAvIChpZiBAbCA8IDUwIHRoZW4gQGwgKiAyIGVsc2UgMjAwIC0gQGwgKiAyKVxuXHRcdFx0XHRAcyA9IDAgaWYgaXNOYU4gQHNcblx0XHRcdGVsc2UgaWYgQGw/XG5cdFx0XHRcdCMgSHVlIFNhdHVyYXRpb24gTGlnaHRuZXNzXG5cdFx0XHRcdCMgKG5vIGNvbnZlcnNpb25zIG5lZWRlZCBoZXJlKVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHQjIFRPRE86IGltcHJvdmUgZXJyb3IgbWVzc2FnZSAoZXNwZWNpYWxseSBpZiBAYiBnaXZlbilcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiSHVlLCBzYXR1cmF0aW9uLCBhbmQuLi4/IChlaXRoZXIgbGlnaHRuZXNzIG9yIHZhbHVlKVwiXG5cdFx0XHQjIFRPRE86IG1heWJlIGNvbnZlcnQgdG8gQHIgQGcgQGIgaGVyZVxuXHRcdGVsc2UgaWYgYz8gYW5kIG0/IGFuZCB5PyBhbmQgaz9cblx0XHRcdCMgQ3lhbiBNYWdlbnRhIFllbGxvdyBibGFjS1xuXHRcdFx0IyBVTlRFU1RFRFxuXHRcdFx0YyAvPSAxMDBcblx0XHRcdG0gLz0gMTAwXG5cdFx0XHR5IC89IDEwMFxuXHRcdFx0ayAvPSAxMDBcblx0XHRcdFxuXHRcdFx0QHIgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIGMgKiAoMSAtIGspICsgaykpXG5cdFx0XHRAZyA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgbSAqICgxIC0gaykgKyBrKSlcblx0XHRcdEBiID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCB5ICogKDEgLSBrKSArIGspKVxuXHRcdGVsc2Vcblx0XHRcdCMgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURURcblx0XHRcdGlmIEBsPyBhbmQgQGE/IGFuZCBAYj9cblx0XHRcdFx0IyB3aGl0ZSA9XG5cdFx0XHRcdCMgXHR4OiA5NS4wNDdcblx0XHRcdFx0IyBcdHk6IDEwMC4wMDBcblx0XHRcdFx0IyBcdHo6IDEwOC44ODNcblx0XHRcdFx0XG5cdFx0XHRcdHh5eiA9XG5cdFx0XHRcdFx0eTogKHJhdy5sICsgMTYpIC8gMTE2XG5cdFx0XHRcdHh5ei54ID0gcmF3LmEgLyA1MDAgKyB4eXoueVxuXHRcdFx0XHR4eXoueiA9IHh5ei55IC0gcmF3LmIgLyAyMDBcblx0XHRcdFx0XG5cdFx0XHRcdGZvciBfIGluIFwieHl6XCJcblx0XHRcdFx0XHRwb3dlZCA9IE1hdGgucG93KHh5eltfXSwgMylcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRpZiBwb3dlZCA+IDAuMDA4ODU2XG5cdFx0XHRcdFx0XHR4eXpbX10gPSBwb3dlZFxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHh5eltfXSA9ICh4eXpbX10gLSAxNiAvIDExNikgLyA3Ljc4N1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdCN4eXpbX10gPSBfcm91bmQoeHl6W19dICogd2hpdGVbX10pXG5cdFx0XHRcdFxuXHRcdFx0IyBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRFxuXHRcdFx0aWYgQHg/IGFuZCBAeT8gYW5kIEB6P1xuXHRcdFx0XHR4eXogPVxuXHRcdFx0XHRcdHg6IHJhdy54IC8gMTAwXG5cdFx0XHRcdFx0eTogcmF3LnkgLyAxMDBcblx0XHRcdFx0XHR6OiByYXcueiAvIDEwMFxuXHRcdFx0XHRcblx0XHRcdFx0cmdiID1cblx0XHRcdFx0XHRyOiB4eXoueCAqIDMuMjQwNiArIHh5ei55ICogLTEuNTM3MiArIHh5ei56ICogLTAuNDk4NlxuXHRcdFx0XHRcdGc6IHh5ei54ICogLTAuOTY4OSArIHh5ei55ICogMS44NzU4ICsgeHl6LnogKiAwLjA0MTVcblx0XHRcdFx0XHRiOiB4eXoueCAqIDAuMDU1NyArIHh5ei55ICogLTAuMjA0MCArIHh5ei56ICogMS4wNTcwXG5cdFx0XHRcdFxuXHRcdFx0XHRmb3IgXyBpbiBcInJnYlwiXG5cdFx0XHRcdFx0I3JnYltfXSA9IF9yb3VuZChyZ2JbX10pXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgcmdiW19dIDwgMFxuXHRcdFx0XHRcdFx0cmdiW19dID0gMFxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmIHJnYltfXSA+IDAuMDAzMTMwOFxuXHRcdFx0XHRcdFx0cmdiW19dID0gMS4wNTUgKiBNYXRoLnBvdyhyZ2JbX10sICgxIC8gMi40KSkgLSAwLjA1NVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHJnYltfXSAqPSAxMi45MlxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdCNyZ2JbX10gPSBNYXRoLnJvdW5kKHJnYltfXSAqIDI1NSlcblx0XHRcdGVsc2Vcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiQ29sb3IgY29uc3RydWN0b3IgbXVzdCBiZSBjYWxsZWQgd2l0aCB7cixnLGJ9IG9yIHtoLHMsdn0gb3Ige2gscyxsfSBvciB7YyxtLHksa30gb3Ige3gseSx6fSBvciB7bCxhLGJ9LFxuXHRcdFx0XHRcdCN7XG5cdFx0XHRcdFx0XHR0cnlcblx0XHRcdFx0XHRcdFx0XCJnb3QgI3tKU09OLnN0cmluZ2lmeShvcHRpb25zKX1cIlxuXHRcdFx0XHRcdFx0Y2F0Y2hcblx0XHRcdFx0XHRcdFx0XCJnb3Qgc29tZXRoaW5nIHRoYXQgY291bGRuJ3QgYmUgZGlzcGxheWVkIHdpdGggSlNPTi5zdHJpbmdpZnkgZm9yIHRoaXMgZXJyb3IgbWVzc2FnZVwiXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcIlxuXHRcdFxuXHRcblx0dG9TdHJpbmc6IC0+XG5cdFx0aWYgQHI/XG5cdFx0XHQjIFJlZCBHcmVlbiBCbHVlXG5cdFx0XHRpZiBAYT8gIyBBbHBoYVxuXHRcdFx0XHRcInJnYmEoI3tAcn0sICN7QGd9LCAje0BifSwgI3tAYX0pXCJcblx0XHRcdGVsc2UgIyBPcGFxdWVcblx0XHRcdFx0XCJyZ2IoI3tAcn0sICN7QGd9LCAje0BifSlcIlxuXHRcdGVsc2UgaWYgQGg/XG5cdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIExpZ2h0bmVzc1xuXHRcdFx0IyAoQXNzdW1lIGg6MC0zNjAsIHM6MC0xMDAsIGw6MC0xMDApXG5cdFx0XHRpZiBAYT8gIyBBbHBoYVxuXHRcdFx0XHRcImhzbGEoI3tAaH0sICN7QHN9JSwgI3tAbH0lLCAje0BhfSlcIlxuXHRcdFx0ZWxzZSAjIE9wYXF1ZVxuXHRcdFx0XHRcImhzbCgje0BofSwgI3tAc30lLCAje0BsfSUpXCJcblx0XG5cdGlzOiAoY29sb3IpLT5cblx0XHQjIGNvbXBhcmUgYXMgc3RyaW5nc1xuXHRcdFwiI3tAfVwiIGlzIFwiI3tjb2xvcn1cIlxuIiwiXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUGFsZXR0ZSBleHRlbmRzIEFycmF5XG5cdFxuXHRjb25zdHJ1Y3RvcjogKGFyZ3MuLi4pLT5cblx0XHRzdXBlcihhcmdzLi4uKVxuXHRcblx0YWRkOiAobyktPlxuXHRcdG5ld19jb2xvciA9IG5ldyBDb2xvcihvKVxuXHRcdEBwdXNoIG5ld19jb2xvclxuXHRcblx0ZmluYWxpemU6IC0+XG5cdFx0IyBUT0RPOiBnZXQgdGhpcyB3b3JraW5nIHByb3Blcmx5IGFuZCBlbmFibGVcblx0XHQjIGlmIG5vdCBAbnVtYmVyT2ZDb2x1bW5zXG5cdFx0IyBcdEBndWVzc19kaW1lbnNpb25zKClcblx0XHR1bmxlc3MgQHBhcmVudFBhbGV0dGVXaXRob3V0RHVwbGljYXRlc1xuXHRcdFx0QHdpdGhEdXBsaWNhdGVzID0gbmV3IFBhbGV0dGVcblx0XHRcdEB3aXRoRHVwbGljYXRlcy5wYXJlbnRQYWxldHRlV2l0aG91dER1cGxpY2F0ZXMgPSBAXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXNbaV0gPSBAW2ldIGZvciBpIGluIFswLi4uQGxlbmd0aF1cblx0XHRcdEB3aXRoRHVwbGljYXRlcy5udW1iZXJPZkNvbHVtbnMgPSBAbnVtYmVyT2ZDb2x1bW5zXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXMuZ2VvbWV0cnlTcGVjaWZpZWRCeUZpbGUgPSBAZ2VvbWV0cnlTcGVjaWZpZWRCeUZpbGVcblx0XHRcdEB3aXRoRHVwbGljYXRlcy5maW5hbGl6ZSgpXG5cblx0XHRcdCMgaW4tcGxhY2UgdW5pcXVpZnlcblx0XHRcdGkgPSAwXG5cdFx0XHR3aGlsZSBpIDwgQGxlbmd0aFxuXHRcdFx0XHRpX2NvbG9yID0gQFtpXVxuXHRcdFx0XHRqID0gaSArIDFcblx0XHRcdFx0d2hpbGUgaiA8IEBsZW5ndGhcblx0XHRcdFx0XHRqX2NvbG9yID0gQFtqXVxuXHRcdFx0XHRcdGlmIGlfY29sb3IuaXMgal9jb2xvclxuXHRcdFx0XHRcdFx0QC5zcGxpY2UoaiwgMSlcblx0XHRcdFx0XHRcdGogLT0gMVxuXHRcdFx0XHRcdGogKz0gMVxuXHRcdFx0XHRpICs9IDFcblxuXHQjIyNcblx0Z3Vlc3NfZGltZW5zaW9uczogLT5cblx0XHQjIFRPRE86IGdldCB0aGlzIHdvcmtpbmcgcHJvcGVybHkgYW5kIGVuYWJsZVxuXG5cdFx0bGVuID0gQGxlbmd0aFxuXHRcdGNhbmRpZGF0ZV9kaW1lbnNpb25zID0gW11cblx0XHRmb3IgbnVtYmVyT2ZDb2x1bW5zIGluIFswLi5sZW5dXG5cdFx0XHRuX3Jvd3MgPSBsZW4gLyBudW1iZXJPZkNvbHVtbnNcblx0XHRcdGlmIG5fcm93cyBpcyBNYXRoLnJvdW5kIG5fcm93c1xuXHRcdFx0XHRjYW5kaWRhdGVfZGltZW5zaW9ucy5wdXNoIFtuX3Jvd3MsIG51bWJlck9mQ29sdW1uc11cblx0XHRcblx0XHRzcXVhcmVzdCA9IFswLCAzNDk1MDkzXVxuXHRcdGZvciBjZCBpbiBjYW5kaWRhdGVfZGltZW5zaW9uc1xuXHRcdFx0aWYgTWF0aC5hYnMoY2RbMF0gLSBjZFsxXSkgPCBNYXRoLmFicyhzcXVhcmVzdFswXSAtIHNxdWFyZXN0WzFdKVxuXHRcdFx0XHRzcXVhcmVzdCA9IGNkXG5cdFx0XG5cdFx0QG51bWJlck9mQ29sdW1ucyA9IHNxdWFyZXN0WzFdXG5cdCMjI1xuIiwiIyBMb2FkIGFuIEFkb2JlIENvbG9yIFRhYmxlIGZpbGUgKC5hY3QpXG5cbiMjI1xuXCJUaGVyZSBpcyBubyB2ZXJzaW9uIG51bWJlciB3cml0dGVuIGluIHRoZSBmaWxlLlxuVGhlIGZpbGUgaXMgNzY4IG9yIDc3MiBieXRlcyBsb25nIGFuZCBjb250YWlucyAyNTYgUkdCIGNvbG9ycy5cblRoZSBmaXJzdCBjb2xvciBpbiB0aGUgdGFibGUgaXMgaW5kZXggemVyby5cblRoZXJlIGFyZSB0aHJlZSBieXRlcyBwZXIgY29sb3IgaW4gdGhlIG9yZGVyIHJlZCwgZ3JlZW4sIGJsdWUuXG5JZiB0aGUgZmlsZSBpcyA3NzIgYnl0ZXMgbG9uZyB0aGVyZSBhcmUgNCBhZGRpdGlvbmFsIGJ5dGVzIHJlbWFpbmluZy5cblx0VHdvIGJ5dGVzIGZvciB0aGUgbnVtYmVyIG9mIGNvbG9ycyB0byB1c2UuXG5cdFR3byBieXRlcyBmb3IgdGhlIGNvbG9yIGluZGV4IHdpdGggdGhlIHRyYW5zcGFyZW5jeSBjb2xvciB0byB1c2UuXCJcblxuaHR0cHM6Ly93d3cuYWRvYmUuY29tL2Rldm5ldC1hcHBzL3Bob3Rvc2hvcC9maWxlZm9ybWF0YXNodG1sLyM1MDU3NzQxMV9wZ2ZJZC0xMDcwNjI2XG4jIyNcblxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxuXG5tb2R1bGUuZXhwb3J0cyA9XG5sb2FkX2Fkb2JlX2NvbG9yX3RhYmxlID0gKHtkYXRhLCBmaWxlRXh0fSktPlxuXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxuXHRcblx0dW5sZXNzIChcblx0XHRici5nZXRTaXplKCkgaW4gWzc2OCwgNzcyXSBvclxuXHRcdGZpbGVFeHQgaXMgXCJhY3RcIiAjIGJlY2F1c2UgXCJGaXJld29ya3MgY2FuIHJlYWQgQUNUIGZpbGVzIGJpZ2dlciB0aGFuIDc2OCBieXRlc1wiXG5cdClcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJmaWxlIHNpemUgbXVzdCBiZSA3Njggb3IgNzcyIGJ5dGVzIChzYXcgI3tici5nZXRTaXplKCl9KSwgT1IgZmlsZSBleHRlbnNpb24gbXVzdCBiZSAnLmFjdCcgKHNhdyAnLiN7ZmlsZUV4dH0nKVwiXG5cdFxuXHRpID0gMFxuXHR3aGlsZSBpIDwgMjU1XG5cdFx0cGFsZXR0ZS5hZGRcblx0XHRcdHI6IGJyLnJlYWRVSW50OCgpXG5cdFx0XHRnOiBici5yZWFkVUludDgoKVxuXHRcdFx0YjogYnIucmVhZFVJbnQ4KClcblx0XHRpICs9IDFcblx0XG5cdHBhbGV0dGUubnVtYmVyT2ZDb2x1bW5zID0gMTYgIyBjb25maWd1cmFibGUgaW4gUGhvdG9zaG9wLCBidXQgdGhpcyBpcyB0aGUgZGVmYXVsdCB2aWV3LCBhbmQgZm9yIGluc3RhbmNlIFZpc2lib25lIGFuZCB0aGUgZGVmYXVsdCBzd2F0Y2hlcyByZWx5IG9uIHRoaXMgbGF5b3V0XG5cblx0cGFsZXR0ZVxuIiwiXG4jIERldGVjdCBDU1MgY29sb3JzIChleGNlcHQgbmFtZWQgY29sb3JzKVxuXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxuXG4jIFRPRE86IGRldGVjdCBuYW1lcyB2aWEgc3RydWN0dXJlcyBsaWtlIENTUyB2YXJpYWJsZXMsIEpTT04gb2JqZWN0IGtleXMvdmFsdWVzLCBjb21tZW50c1xuIyBUT0RPOiB1c2UgYWxsIGNvbG9ycyByZWdhcmRsZXNzIG9mIGZvcm1hdCwgd2l0aGluIGEgZGV0ZWN0ZWQgc3RydWN0dXJlLCBvciBtYXliZSBhbHdheXNcblxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XG5cdFxuXHRuX2NvbnRyb2xfY2hhcmFjdGVycyA9IDBcblx0Zm9yIGNoYXIgaW4gZGF0YVxuXHRcdGlmIGNoYXIgaW4gW1xuXHRcdFx0XCJcXHgwMFwiLCBcIlxceDAxXCIsIFwiXFx4MDJcIiwgXCJcXHgwM1wiLCBcIlxceDA0XCIsIFwiXFx4MDVcIiwgXCJcXHgwNlwiLCBcIlxceDA3XCIsIFwiXFx4MDhcIlxuXHRcdFx0XCJcXHgwQlwiLCBcIlxceDBDXCJcblx0XHRcdFwiXFx4MEVcIiwgXCJcXHgwRlwiLCBcIlxceDEwXCIsIFwiXFx4MTFcIiwgXCJcXHgxMlwiLCBcIlxceDEzXCIsIFwiXFx4MTRcIiwgXCJcXHgxNVwiLCBcIlxceDE2XCIsIFwiXFx4MTdcIiwgXCJcXHgxOFwiLCBcIlxceDE5XCIsIFwiXFx4MUFcIiwgXCJcXHgxQlwiLCBcIlxceDFDXCIsIFwiXFx4MURcIiwgXCJcXHgxRVwiLCBcIlxceDFGXCIsIFwiXFx4N0ZcIlxuXHRcdF1cblx0XHRcdG5fY29udHJvbF9jaGFyYWN0ZXJzKytcblx0aWYgbl9jb250cm9sX2NoYXJhY3RlcnMgPiA1XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwibG9va3MgbGlrZSBhIGJpbmFyeSBmaWxlXCIpXG5cblx0cGFsZXR0ZXMgPSBbXG5cdFx0cGFsZXR0ZV9oZXhfbG9uZyA9IG5ldyBQYWxldHRlKClcblx0XHRwYWxldHRlX2hleF9zaG9ydCA9IG5ldyBQYWxldHRlKClcblx0XHRwYWxldHRlX3JnYiA9IG5ldyBQYWxldHRlKClcblx0XHRwYWxldHRlX2hzbCA9IG5ldyBQYWxldHRlKClcblx0XHRwYWxldHRlX2hzbGEgPSBuZXcgUGFsZXR0ZSgpXG5cdFx0cGFsZXR0ZV9yZ2JhID0gbmV3IFBhbGV0dGUoKVxuXHRdXG5cdFxuXHRoZXggPSAoeCktPiBwYXJzZUludCh4LCAxNilcblx0XG5cdGRhdGEucmVwbGFjZSAvLy9cblx0XHRcXCMgIyBoYXNodGFnICMgIy9cblx0XHQoXG5cdFx0XHRbMC05QS1GXXszfSAjIHRocmVlIGhleC1kaWdpdHMgKCNBMEMpXG5cdFx0XHR8XG5cdFx0XHRbMC05QS1GXXs2fSAjIHNpeCBoZXgtZGlnaXRzICgjQUEwMENDKVxuXHRcdFx0fFxuXHRcdFx0WzAtOUEtRl17NH0gIyB3aXRoIGFscGhhLCBmb3VyIGhleC1kaWdpdHMgKCNBMENGKVxuXHRcdFx0fFxuXHRcdFx0WzAtOUEtRl17OH0gIyB3aXRoIGFscGhhLCBlaWdodCBoZXgtZGlnaXRzICgjQUEwMENDRkYpXG5cdFx0KVxuXHRcdCg/IVswLTlBLUZdKSAjIChhbmQgbm8gbW9yZSEpXG5cdC8vL2dpbSwgKG0sICQxKS0+XG5cdFx0aWYgJDEubGVuZ3RoID4gNFxuXHRcdFx0cGFsZXR0ZV9oZXhfbG9uZy5hZGRcblx0XHRcdFx0cjogaGV4ICQxWzBdICsgJDFbMV1cblx0XHRcdFx0ZzogaGV4ICQxWzJdICsgJDFbM11cblx0XHRcdFx0YjogaGV4ICQxWzRdICsgJDFbNV1cblx0XHRcdFx0YTogaWYgJDEubGVuZ3RoIGlzIDggdGhlbiBoZXggJDFbNl0gKyAkMVs3XSBlbHNlIDFcblx0XHRlbHNlXG5cdFx0XHRwYWxldHRlX2hleF9zaG9ydC5hZGRcblx0XHRcdFx0cjogaGV4ICQxWzBdICsgJDFbMF1cblx0XHRcdFx0ZzogaGV4ICQxWzFdICsgJDFbMV1cblx0XHRcdFx0YjogaGV4ICQxWzJdICsgJDFbMl1cblx0XHRcdFx0YTogaWYgJDEubGVuZ3RoIGlzIDQgdGhlbiBoZXggJDFbM10gKyAkMVszXSBlbHNlIDFcblx0XG5cdGRhdGEucmVwbGFjZSAvLy9cblx0XHRyZ2JcXChcblx0XHRcdFxccypcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHJlZFxuXHRcdFx0KCU/KVxuXHRcdFxccyooPzosfFxccylcXHMqXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBncmVlblxuXHRcdFx0KCU/KVxuXHRcdFxccyooPzosfFxccylcXHMqXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBibHVlXG5cdFx0XHQoJT8pXG5cdFx0XHRcXHMqXG5cdFx0XFwpXG5cdC8vL2dpbSwgKF9tLCByX3ZhbCwgcl91bml0LCBnX3ZhbCwgZ191bml0LCBiX3ZhbCwgYl91bml0KS0+XG5cdFx0cGFsZXR0ZV9yZ2IuYWRkXG5cdFx0XHRyOiBOdW1iZXIocl92YWwpICogKGlmIHJfdW5pdCBpcyBcIiVcIiB0aGVuIDI1NS8xMDAgZWxzZSAxKVxuXHRcdFx0ZzogTnVtYmVyKGdfdmFsKSAqIChpZiBnX3VuaXQgaXMgXCIlXCIgdGhlbiAyNTUvMTAwIGVsc2UgMSlcblx0XHRcdGI6IE51bWJlcihiX3ZhbCkgKiAoaWYgYl91bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXG5cdFxuXHRkYXRhLnJlcGxhY2UgLy8vXG5cdFx0cmdiYT9cXChcblx0XHRcdFxccypcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHJlZFxuXHRcdFx0KCU/KVxuXHRcdFxccyooPzosfFxccylcXHMqXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBncmVlblxuXHRcdFx0KCU/KVxuXHRcdFxccyooPzosfFxccylcXHMqXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBibHVlXG5cdFx0XHQoJT8pXG5cdFx0XFxzKig/Oix8LylcXHMqXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBhbHBoYVxuXHRcdFx0KCU/KVxuXHRcdFx0XFxzKlxuXHRcdFxcKVxuXHQvLy9naW0sIChfbSwgcl92YWwsIHJfdW5pdCwgZ192YWwsIGdfdW5pdCwgYl92YWwsIGJfdW5pdCwgYV92YWwsIGFfdW5pdCktPlxuXHRcdHBhbGV0dGVfcmdiYS5hZGRcblx0XHRcdHI6IE51bWJlcihyX3ZhbCkgKiAoaWYgcl91bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXG5cdFx0XHRnOiBOdW1iZXIoZ192YWwpICogKGlmIGdfdW5pdCBpcyBcIiVcIiB0aGVuIDI1NS8xMDAgZWxzZSAxKVxuXHRcdFx0YjogTnVtYmVyKGJfdmFsKSAqIChpZiBiX3VuaXQgaXMgXCIlXCIgdGhlbiAyNTUvMTAwIGVsc2UgMSlcblx0XHRcdGE6IE51bWJlcihhX3ZhbCkgKiAoaWYgYV91bml0IGlzIFwiJVwiIHRoZW4gMS8xMDAgZWxzZSAxKVxuXHRcblx0ZGF0YS5yZXBsYWNlIC8vL1xuXHRcdGhzbFxcKFxuXHRcdFx0XFxzKlxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgaHVlXG5cdFx0XHQoZGVnfHJhZHx0dXJufClcblx0XHRcXHMqKD86LHxcXHMpXFxzKlxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgc2F0dXJhdGlvblxuXHRcdFx0KCU/KVxuXHRcdFxccyooPzosfFxccylcXHMqXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyB2YWx1ZVxuXHRcdFx0KCU/KVxuXHRcdFx0XFxzKlxuXHRcdFxcKVxuXHQvLy9naW0sIChfbSwgaF92YWwsIGhfdW5pdCwgc192YWwsIHNfdW5pdCwgbF92YWwsIGxfdW5pdCktPlxuXHRcdHBhbGV0dGVfaHNsLmFkZFxuXHRcdFx0aDogTnVtYmVyKGhfdmFsKSAqIChpZiBoX3VuaXQgaXMgXCJyYWRcIiB0aGVuIDE4MC9NYXRoLlBJIGVsc2UgaWYgaF91bml0IGlzIFwidHVyblwiIHRoZW4gMzYwIGVsc2UgMSlcblx0XHRcdHM6IE51bWJlcihzX3ZhbCkgKiAoaWYgc191bml0IGlzIFwiJVwiIHRoZW4gMSBlbHNlIDEwMClcblx0XHRcdGw6IE51bWJlcihsX3ZhbCkgKiAoaWYgbF91bml0IGlzIFwiJVwiIHRoZW4gMSBlbHNlIDEwMClcblx0XG5cdGRhdGEucmVwbGFjZSAvLy9cblx0XHRoc2xhP1xcKFxuXHRcdFx0XFxzKlxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgaHVlXG5cdFx0XHQoZGVnfHJhZHx0dXJufClcblx0XHRcXHMqKD86LHxcXHMpXFxzKlxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgc2F0dXJhdGlvblxuXHRcdFx0KCU/KVxuXHRcdFxccyooPzosfFxccylcXHMqXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyB2YWx1ZVxuXHRcdFx0KCU/KVxuXHRcdFxccyooPzosfC8pXFxzKlxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgYWxwaGFcblx0XHRcdCglPylcblx0XHRcdFxccypcblx0XHRcXClcblx0Ly8vZ2ltLCAoX20sIGhfdmFsLCBoX3VuaXQsIHNfdmFsLCBzX3VuaXQsIGxfdmFsLCBsX3VuaXQsIGFfdmFsLCBhX3VuaXQpLT5cblx0XHRwYWxldHRlX2hzbGEuYWRkXG5cdFx0XHRoOiBOdW1iZXIoaF92YWwpICogKGlmIGhfdW5pdCBpcyBcInJhZFwiIHRoZW4gMTgwL01hdGguUEkgZWxzZSBpZiBoX3VuaXQgaXMgXCJ0dXJuXCIgdGhlbiAzNjAgZWxzZSAxKVxuXHRcdFx0czogTnVtYmVyKHNfdmFsKSAqIChpZiBzX3VuaXQgaXMgXCIlXCIgdGhlbiAxIGVsc2UgMTAwKVxuXHRcdFx0bDogTnVtYmVyKGxfdmFsKSAqIChpZiBsX3VuaXQgaXMgXCIlXCIgdGhlbiAxIGVsc2UgMTAwKVxuXHRcdFx0YTogTnVtYmVyKGFfdmFsKSAqIChpZiBhX3VuaXQgaXMgXCIlXCIgdGhlbiAxLzEwMCBlbHNlIDEpXG5cdFxuXHRtb3N0X2NvbG9ycyA9IFtdXG5cdGZvciBwYWxldHRlIGluIHBhbGV0dGVzXG5cdFx0aWYgcGFsZXR0ZS5sZW5ndGggPj0gbW9zdF9jb2xvcnMubGVuZ3RoXG5cdFx0XHRtb3N0X2NvbG9ycyA9IHBhbGV0dGVcblx0XG5cdG4gPSBtb3N0X2NvbG9ycy5sZW5ndGhcblx0aWYgbiA8IDRcblx0XHR0aHJvdyBuZXcgRXJyb3IoW1xuXHRcdFx0XCJObyBjb2xvcnMgZm91bmRcIlxuXHRcdFx0XCJPbmx5IG9uZSBjb2xvciBmb3VuZFwiXG5cdFx0XHRcIk9ubHkgYSBjb3VwbGUgY29sb3JzIGZvdW5kXCJcblx0XHRcdFwiT25seSBhIGZldyBjb2xvcnMgZm91bmRcIlxuXHRcdF1bbl0gKyBcIiAoI3tufSlcIilcblx0XG5cdG1vc3RfY29sb3JzXG4iLCJcbiMgTG9hZCBhIENvbG9yU2NoZW1lciBwYWxldHRlICguY3MpXG5cbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcblxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGEsIGZpbGVFeHR9KS0+XG5cblx0aWYgZmlsZUV4dCBpc250IFwiY3NcIlxuXHRcdHRocm93IG5ldyBFcnJvcihcIkNvbG9yU2NoZW1lciBsb2FkZXIgaXMgb25seSBlbmFibGVkIHdoZW4gZmlsZSBleHRlbnNpb24gaXMgJy5jcycgKHNhdyAnLiN7ZmlsZUV4dH0nIGluc3RlYWQpXCIpXG5cdFxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcblx0XG5cdHZlcnNpb24gPSBici5yZWFkVUludDE2KCkgIyBvciBzb21ldGhpbmdcblx0bGVuZ3RoID0gYnIucmVhZFVJbnQxNigpXG5cdGkgPSAwXG5cdHdoaWxlIGkgPCBsZW5ndGhcblx0XHRici5zZWVrKDggKyBpICogMjYpXG5cdFx0cGFsZXR0ZS5hZGRcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcblx0XHRpICs9IDFcblxuXHRwYWxldHRlXG5cbiIsIlxuIyBMb2FkIGEgR0lNUCBwYWxldHRlICguZ3BsKSwgYWxzbyB1c2VkIGJ5IG9yIHN1cHBvcnRlZCBieSBtYW55IHByb2dyYW1zLCBzdWNoIGFzIElua3NjYXBlLCBLcml0YSxcblxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcblxucGFyc2VfZ2ltcF9vcl9rZGVfcmdiX3BhbGV0dGUgPSAoZGF0YSwgZm9ybWF0X25hbWUpLT5cblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcblx0aWYgbGluZXNbMF0gaXNudCBmb3JtYXRfbmFtZVxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhICN7Zm9ybWF0X25hbWV9XCJcblx0XG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXG5cdGkgPSAwXG5cdCMgc3RhcnRzIGF0IGkgPSAxIGJlY2F1c2UgdGhlIGluY3JlbWVudCBoYXBwZW5zIGF0IHRoZSBzdGFydCBvZiB0aGUgbG9vcFxuXHR3aGlsZSAoaSArPSAxKSA8IGxpbmVzLmxlbmd0aFxuXHRcdGxpbmUgPSBsaW5lc1tpXVxuXHRcdFxuXHRcdGlmIGxpbmVbMF0gaXMgXCIjXCIgb3IgbGluZSBpcyBcIlwiIHRoZW4gY29udGludWVcblx0XHQjIFRPRE86IGhhbmRsZSBub24tc3RhcnQtb2YtbGluZSBjb21tZW50cz8gd2hlcmUncyB0aGUgc3BlYz9cblx0XHRcblx0XHRtID0gbGluZS5tYXRjaCgvTmFtZTpcXHMqKC4qKS8pXG5cdFx0aWYgbVxuXHRcdFx0cGFsZXR0ZS5uYW1lID0gbVsxXVxuXHRcdFx0Y29udGludWVcblx0XHRtID0gbGluZS5tYXRjaCgvQ29sdW1uczpcXHMqKC4qKS8pXG5cdFx0aWYgbVxuXHRcdFx0cGFsZXR0ZS5udW1iZXJPZkNvbHVtbnMgPSBOdW1iZXIobVsxXSlcblx0XHRcdCMgVE9ETzogaGFuZGxlIDAgYXMgbm90IHNwZWNpZmllZD8gd2hlcmUncyB0aGUgc3BlYyBhdCwgeW8/XG5cdFx0XHRwYWxldHRlLmdlb21ldHJ5U3BlY2lmaWVkQnlGaWxlID0geWVzXG5cdFx0XHRjb250aW51ZVxuXHRcdFxuXHRcdCMgVE9ETzogcmVwbGFjZSBcXHMgd2l0aCBbXFwgXFx0XSAoc3BhY2VzIG9yIHRhYnMpXG5cdFx0IyBpdCBjYW4ndCBtYXRjaCBcXG4gYmVjYXVzZSBpdCdzIGFscmVhZHkgc3BsaXQgb24gdGhhdCwgYnV0IHN0aWxsXG5cdFx0IyBUT0RPOiBoYW5kbGUgbGluZSB3aXRoIG5vIG5hbWUgYnV0IHNwYWNlIG9uIHRoZSBlbmRcblx0XHRyX2dfYl9uYW1lID0gbGluZS5tYXRjaCgvLy9cblx0XHRcdF4gIyBcImF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpbmUsXCJcblx0XHRcdFxccyogIyBcImdpdmUgb3IgdGFrZSBzb21lIHNwYWNlcyxcIlxuXHRcdFx0IyBtYXRjaCAzIGdyb3VwcyBvZiBudW1iZXJzIHNlcGFyYXRlZCBieSBzcGFjZXNcblx0XHRcdChbMC05XSspICMgcmVkXG5cdFx0XHRcXHMrXG5cdFx0XHQoWzAtOV0rKSAjIGdyZWVuXG5cdFx0XHRcXHMrXG5cdFx0XHQoWzAtOV0rKSAjIGJsdWVcblx0XHRcdCg/OlxuXHRcdFx0XHRcXHMrXG5cdFx0XHRcdCguKikgIyBvcHRpb25hbGx5IGEgbmFtZVxuXHRcdFx0KT9cblx0XHRcdCQgIyBcImFuZCB0aGF0IHNob3VsZCBiZSB0aGUgZW5kIG9mIHRoZSBsaW5lXCJcblx0XHQvLy8pXG5cdFx0aWYgbm90IHJfZ19iX25hbWVcblx0XHRcdHRocm93IG5ldyBFcnJvciBcIkxpbmUgI3tpfSBkb2Vzbid0IG1hdGNoIHBhdHRlcm4gI3tyX2dfYl9uYW1lfVwiICMgVE9ETzogYmV0dGVyIG1lc3NhZ2U/XG5cdFx0XG5cdFx0cGFsZXR0ZS5hZGRcblx0XHRcdHI6IHJfZ19iX25hbWVbMV1cblx0XHRcdGc6IHJfZ19iX25hbWVbMl1cblx0XHRcdGI6IHJfZ19iX25hbWVbM11cblx0XHRcdG5hbWU6IHJfZ19iX25hbWVbNF1cblx0XHRcblx0cGFsZXR0ZVxuXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cblx0cGFyc2VfZ2ltcF9vcl9rZGVfcmdiX3BhbGV0dGUoZGF0YSwgXCJHSU1QIFBhbGV0dGVcIilcblxubW9kdWxlLmV4cG9ydHMucGFyc2VfZ2ltcF9vcl9rZGVfcmdiX3BhbGV0dGUgPSBwYXJzZV9naW1wX29yX2tkZV9yZ2JfcGFsZXR0ZVxuIiwiIyBMb2FkIGFuIEFsbGFpcmUgSG9tZXNpdGUgLyBNYWNyb21lZGlhIENvbGRGdXNpb24gcGFsZXR0ZSAoLmhwbClcblxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcblxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXG5cdGlmIGxpbmVzWzBdIGlzbnQgXCJQYWxldHRlXCJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYSBIb21lc2l0ZSBwYWxldHRlXCJcblx0aWYgbm90IGxpbmVzWzFdLm1hdGNoIC9WZXJzaW9uIFszNF1cXC4wL1xuXHRcdHRocm93IG5ldyBFcnJvciBcIlVuc3VwcG9ydGVkIEhvbWVzaXRlIHBhbGV0dGUgdmVyc2lvblwiXG5cdFxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxuXHRcblx0Zm9yIGxpbmUsIGkgaW4gbGluZXNcblx0XHRpZiBsaW5lLm1hdGNoIC8uKyAuKyAuKy9cblx0XHRcdHJnYiA9IGxpbmUuc3BsaXQoXCIgXCIpXG5cdFx0XHRwYWxldHRlLmFkZFxuXHRcdFx0XHRyOiByZ2JbMF1cblx0XHRcdFx0ZzogcmdiWzFdXG5cdFx0XHRcdGI6IHJnYlsyXVxuXHRcblx0cGFsZXR0ZVxuIiwiXG4jIExvYWQgYSBLREUgUkdCIFBhbGV0dGUgLyBLb2xvdXJQYWludCAvIEtPZmZpY2UgcGFsZXR0ZSAoLmNvbG9ycylcblxue3BhcnNlX2dpbXBfb3Jfa2RlX3JnYl9wYWxldHRlfSA9IHJlcXVpcmUgXCIuL0dJTVBcIlxuXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cblx0cGFyc2VfZ2ltcF9vcl9rZGVfcmdiX3BhbGV0dGUoZGF0YSwgXCJLREUgUkdCIFBhbGV0dGVcIilcbiIsIlxuIyBMb2FkIGEgUGFpbnQuTkVUIHBhbGV0dGUgZmlsZSAoLnR4dClcblxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcblxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XG5cdFxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxuXHRcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXG5cdFxuXHRmb3IgbGluZSBpbiBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcblx0XHRtID0gbGluZS5tYXRjaCgvXihbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkkL2kpXG5cdFx0aWYgbSB0aGVuIHBhbGV0dGUuYWRkXG5cdFx0XHRhOiBoZXggbVsxXVxuXHRcdFx0cjogaGV4IG1bMl1cblx0XHRcdGc6IGhleCBtWzNdXG5cdFx0XHRiOiBoZXggbVs0XVxuXHRcblx0cGFsZXR0ZVxuIiwiXG4jIExvYWQgYSBKQVNDIFBBTCBmaWxlIChQYWludCBTaG9wIFBybyBwYWxldHRlIGZpbGUpICgucGFsKVxuXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxuXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcblx0aWYgbGluZXNbMF0gaXNudCBcIkpBU0MtUEFMXCJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYSBKQVNDLVBBTFwiXG5cdGlmIGxpbmVzWzFdIGlzbnQgXCIwMTAwXCJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIEpBU0MtUEFMIHZlcnNpb25cIlxuXHQjIGlmIGxpbmVzWzJdIGlzbnQgXCIyNTZcIlxuXHQjIFx0XCJ0aGF0J3Mgb2tcIlxuXHRcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcblx0I25fY29sb3JzID0gTnVtYmVyKGxpbmVzWzJdKVxuXHRcblx0Zm9yIGxpbmUsIGkgaW4gbGluZXNcblx0XHRpZiBsaW5lIGlzbnQgXCJcIiBhbmQgaSA+IDJcblx0XHRcdHJnYiA9IGxpbmUuc3BsaXQoXCIgXCIpXG5cdFx0XHRwYWxldHRlLmFkZFxuXHRcdFx0XHRyOiByZ2JbMF1cblx0XHRcdFx0ZzogcmdiWzFdXG5cdFx0XHRcdGI6IHJnYlsyXVxuXHRcblx0cGFsZXR0ZVxuIiwiXG4jIExvYWQgYSBSZXNvdXJjZSBJbnRlcmNoYW5nZSBGaWxlIEZvcm1hdCBQYWxldHRlIGZpbGUgKC5wYWwpXG5cbiMgcG9ydGVkIGZyb20gQyMgY29kZSBhdCBodHRwczovL3dvcm1zMmQuaW5mby9QYWxldHRlX2ZpbGVcblxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxuXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXG5cdFxuXHQjIFJJRkYgaGVhZGVyXG5cdHJpZmYgPSBici5yZWFkU3RyaW5nKDQpICMgXCJSSUZGXCJcblx0ZGF0YVNpemUgPSBici5yZWFkVUludDMyKClcblx0dHlwZSA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcIlBBTCBcIlxuXHRcblx0aWYgcmlmZiBpc250IFwiUklGRlwiXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiUklGRiBoZWFkZXIgbm90IGZvdW5kOyBub3QgYSBSSUZGIFBBTCBmaWxlXCJcblx0XG5cdGlmIHR5cGUgaXNudCBcIlBBTCBcIlxuXHRcdHRocm93IG5ldyBFcnJvciBcIlwiXCJcblx0XHRcdFJJRkYgaGVhZGVyIHNheXMgdGhpcyBpc24ndCBhIFBBTCBmaWxlLFxuXHRcdFx0bW9yZSBvZiBhIHNvcnQgb2YgI3soKHR5cGUrXCJcIikudHJpbSgpKX0gZmlsZVxuXHRcdFwiXCJcIlxuXHRcblx0IyBEYXRhIGNodW5rXG5cdGNodW5rVHlwZSA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcImRhdGFcIlxuXHRjaHVua1NpemUgPSBici5yZWFkVUludDMyKClcblx0cGFsVmVyc2lvbiA9IGJyLnJlYWRVSW50MTYoKSAjIDB4MDMwMFxuXHRwYWxOdW1FbnRyaWVzID0gYnIucmVhZFVJbnQxNigpXG5cdFxuXHRcblx0aWYgY2h1bmtUeXBlIGlzbnQgXCJkYXRhXCJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJEYXRhIGNodW5rIG5vdCBmb3VuZCAoLi4uJyN7Y2h1bmtUeXBlfSc/KVwiXG5cdFxuXHRpZiBwYWxWZXJzaW9uIGlzbnQgMHgwMzAwXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiVW5zdXBwb3J0ZWQgUEFMIGZpbGUgZm9ybWF0IHZlcnNpb246IDB4I3twYWxWZXJzaW9uLnRvU3RyaW5nKDE2KX1cIlxuXHRcblx0IyBDb2xvcnNcblx0XG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXG5cdGkgPSAwXG5cdHdoaWxlIChpICs9IDEpIDwgcGFsTnVtRW50cmllcyAtIDFcblx0XHRcblx0XHRwYWxldHRlLmFkZFxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxuXHRcdFx0XzogYnIucmVhZEJ5dGUoKSAjIFwiZmxhZ3NcIiwgYWx3YXlzIDB4MDBcblx0XG5cdHBhbGV0dGVcbiIsIiMgTG9hZCBzSzEgcGFsZXR0ZXMgKC5za3ApXG4jIFRoZXNlIGZpbGVzIGFyZSBhY3R1YWxseSBhcHBhcmVudGx5IHB5dGhvbiBzb3VyY2UgY29kZSxcbiMgYnV0IGxldCdzIGp1c3QgdHJ5IHRvIHBhcnNlIHRoZW0gaW4gYSBiYXNpYywgbm9uLWdlbmVyYWwgd2F5XG5cblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXG5cbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxuXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZVxuXG5cdGZucyA9XG5cdFx0c2V0X25hbWU6IChuYW1lKS0+IHBhbGV0dGUubmFtZSA9IG5hbWVcblx0XHRhZGRfY29tbWVudHM6IChsaW5lKS0+XG5cdFx0XHRwYWxldHRlLmRlc2NyaXB0aW9uID89IFwiXCJcblx0XHRcdHBhbGV0dGUuZGVzY3JpcHRpb24gKz0gbGluZSArIFwiXFxuXCJcblx0XHRzZXRfY29sdW1uczogKGNvbHVtbnNfc3RyKS0+XG5cdFx0XHRwYWxldHRlLm51bWJlck9mQ29sdW1ucyA9IHBhcnNlSW50KGNvbHVtbnNfc3RyKVxuXHRcdGNvbG9yOiAoY29sb3JfZGVmX3N0ciktPlxuXHRcdFx0Y29sb3JfZGVmID0gSlNPTi5wYXJzZShjb2xvcl9kZWZfc3RyLnJlcGxhY2UoL1xcYnUoWydcIl0pL2csIFwiJDFcIikucmVwbGFjZSgvJy9nLCAnXCInKSlcblx0XHRcdFtjb2xvcl90eXBlLCBjb21wb25lbnRzLCBhbHBoYSwgbmFtZV0gPSBjb2xvcl9kZWZcblx0XHRcdHN3aXRjaCBjb2xvcl90eXBlXG5cdFx0XHRcdHdoZW4gXCJSR0JcIlxuXHRcdFx0XHRcdHBhbGV0dGUuYWRkXG5cdFx0XHRcdFx0XHRyOiBjb21wb25lbnRzWzBdICogMjU1XG5cdFx0XHRcdFx0XHRnOiBjb21wb25lbnRzWzFdICogMjU1XG5cdFx0XHRcdFx0XHRiOiBjb21wb25lbnRzWzJdICogMjU1XG5cdFx0XHRcdFx0XHRhOiBhbHBoYVxuXHRcdFx0XHR3aGVuIFwiR3JheXNjYWxlXCJcblx0XHRcdFx0XHRwYWxldHRlLmFkZFxuXHRcdFx0XHRcdFx0cjogY29tcG9uZW50c1swXSAqIDI1NVxuXHRcdFx0XHRcdFx0ZzogY29tcG9uZW50c1swXSAqIDI1NVxuXHRcdFx0XHRcdFx0YjogY29tcG9uZW50c1swXSAqIDI1NVxuXHRcdFx0XHRcdFx0YTogYWxwaGFcblx0XHRcdFx0d2hlbiBcIkNNWUtcIlxuXHRcdFx0XHRcdHBhbGV0dGUuYWRkXG5cdFx0XHRcdFx0XHRjOiBjb21wb25lbnRzWzBdICogMTAwXG5cdFx0XHRcdFx0XHRtOiBjb21wb25lbnRzWzFdICogMTAwXG5cdFx0XHRcdFx0XHR5OiBjb21wb25lbnRzWzJdICogMTAwXG5cdFx0XHRcdFx0XHRrOiBjb21wb25lbnRzWzNdICogMTAwXG5cdFx0XHRcdFx0XHRhOiBhbHBoYVxuXHRcdFx0XHR3aGVuIFwiSFNMXCJcblx0XHRcdFx0XHRwYWxldHRlLmFkZFxuXHRcdFx0XHRcdFx0aDogY29tcG9uZW50c1swXSAqIDM2MFxuXHRcdFx0XHRcdFx0czogY29tcG9uZW50c1sxXSAqIDEwMFxuXHRcdFx0XHRcdFx0bDogY29tcG9uZW50c1syXSAqIDEwMFxuXHRcdFx0XHRcdFx0YTogYWxwaGFcblx0XG5cdGZvciBsaW5lIGluIGxpbmVzXG5cdFx0bWF0Y2ggPSBsaW5lLm1hdGNoKC8oW1xcd19dKylcXCgoLiopXFwpLylcblx0XHRpZiBtYXRjaFxuXHRcdFx0W18sIGZuX25hbWUsIGFyZ3Nfc3RyXSA9IG1hdGNoXG5cdFx0XHRmbnNbZm5fbmFtZV0/KGFyZ3Nfc3RyKVxuXG5cdG4gPSBwYWxldHRlLmxlbmd0aFxuXHRpZiBuIDwgMlxuXHRcdHRocm93IG5ldyBFcnJvcihbXG5cdFx0XHRcIk5vIGNvbG9ycyBmb3VuZFwiXG5cdFx0XHRcIk9ubHkgb25lIGNvbG9yIGZvdW5kXCJcblx0XHRdW25dICsgXCIgKCN7bn0pXCIpXG5cdFxuXHRwYWxldHRlXG4iLCJcbiMgTG9hZCBhIFNrZW5jaWwgcGFsZXR0ZSAoLnNwbCkgKFwiU2tldGNoIFJHQlBhbGV0dGVcIilcbiMgU2tlbmNpbCB3YXMgZm9ybWVybHkgY2FsbGVkIFNrZXRjaCwgYnV0IHRoaXMgaXMgbm90IHJlbGF0ZWQgdG8gdGhlIC5za2V0Y2hwYWxldHRlIGZvcm1hdC5cblxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcblxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXG5cdFxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxuXHRpID0gMVxuXHR3aGlsZSAoaSArPSAxKSA8IGxpbmVzLmxlbmd0aFxuXHRcdGxpbmUgPSBsaW5lc1tpXVxuXHRcdFxuXHRcdGlmIGxpbmVbMF0gaXMgXCIjXCIgb3IgbGluZSBpcyBcIlwiIHRoZW4gY29udGludWVcblx0XHQjIFRPRE86IGhhbmRsZSBub24tc3RhcnQtb2YtbGluZSBjb21tZW50cz8gd2hlcmUncyB0aGUgc3BlYz9cblx0XHRcblx0XHQjIFRPRE86IHJlcGxhY2UgXFxzIHdpdGggW1xcIFxcdF0gKHNwYWNlcyBvciB0YWJzKVxuXHRcdCMgaXQgY2FuJ3QgbWF0Y2ggXFxuIGJlY2F1c2UgaXQncyBhbHJlYWR5IHNwbGl0IG9uIHRoYXQsIGJ1dCBzdGlsbFxuXHRcdCMgVE9ETzogaGFuZGxlIGxpbmUgd2l0aCBubyBuYW1lIGJ1dCBzcGFjZSBvbiB0aGUgZW5kXG5cdFx0cl9nX2JfbmFtZSA9IGxpbmUubWF0Y2goLy8vXG5cdFx0XHReICMgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgbGluZSxcblx0XHRcdFxccyogIyBwZXJoYXBzIHdpdGggc29tZSBsZWFkaW5nIHNwYWNlc1xuXHRcdFx0IyBtYXRjaCAzIGdyb3VwcyBvZiBudW1iZXJzIHNlcGFyYXRlZCBieSBzcGFjZXNcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHJlZFxuXHRcdFx0XFxzK1xuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgZ3JlZW5cblx0XHRcdFxccytcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGJsdWVcblx0XHRcdCg/OlxuXHRcdFx0XHRcXHMrXG5cdFx0XHRcdCguKikgIyBvcHRpb25hbGx5IGEgbmFtZVxuXHRcdFx0KT9cblx0XHRcdCQgIyBcImFuZCB0aGF0IHNob3VsZCBiZSB0aGUgZW5kIG9mIHRoZSBsaW5lXCJcblx0XHQvLy8pXG5cdFx0aWYgbm90IHJfZ19iX25hbWVcblx0XHRcdHRocm93IG5ldyBFcnJvciBcIkxpbmUgI3tpfSBkb2Vzbid0IG1hdGNoIHBhdHRlcm4gI3tyX2dfYl9uYW1lfVwiICMgVE9ETzogYmV0dGVyIG1lc3NhZ2U/XG5cdFx0XG5cdFx0cGFsZXR0ZS5hZGRcblx0XHRcdHI6IHJfZ19iX25hbWVbMV0gKiAyNTVcblx0XHRcdGc6IHJfZ19iX25hbWVbMl0gKiAyNTVcblx0XHRcdGI6IHJfZ19iX25hbWVbM10gKiAyNTVcblx0XHRcdG5hbWU6IHJfZ19iX25hbWVbNF1cblx0XHRcblx0cGFsZXR0ZVxuIiwiXG4jIExvYWQgYSBTdGFyQ3JhZnQgcmF3IHBhbGV0dGUgKC5wYWwpXG5cbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcblxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XG5cdFxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcblx0XG5cdGlmIGJyLmdldFNpemUoKSBpc250IDc2OFxuXHRcdHRocm93IG5ldyBFcnJvciBcIldyb25nIGZpbGUgc2l6ZSwgbXVzdCBiZSAjezc2OH0gYnl0ZXMgbG9uZyAobm90ICN7YnIuZ2V0U2l6ZSgpfSlcIlxuXHRcblx0Zm9yIGkgaW4gWzAuLi4yNTVdXG5cdFx0cGFsZXR0ZS5hZGRcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcblx0XHRcdCM6IG5vIHBhZGRpbmdcblx0XG5cdCM/IHBhbGV0dGUubnVtYmVyT2ZDb2x1bW5zID0gMTZcblx0cGFsZXR0ZVxuIiwiXG4jIExvYWQgYSBTdGFyQ3JhZnQgcGFkZGVkIHJhdyBwYWxldHRlICgud3BlKVxuXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXG5cbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxuXHRcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXG5cdFxuXHRpZiBici5nZXRTaXplKCkgaXNudCAxMDI0XG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiV3JvbmcgZmlsZSBzaXplLCBtdXN0IGJlICN7MTAyNH0gYnl0ZXMgbG9uZyAobm90ICN7YnIuZ2V0U2l6ZSgpfSlcIlxuXHRcblx0Zm9yIGkgaW4gWzAuLi4yNTVdXG5cdFx0cGFsZXR0ZS5hZGRcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcblx0XHRcdF86IGJyLnJlYWRCeXRlKCkgIyBwYWRkaW5nXG5cdFxuXHRwYWxldHRlLm51bWJlck9mQ29sdW1ucyA9IDE2XG5cdHBhbGV0dGVcbiIsIlxuIyBMb2FkIGEgU2tldGNoIEFwcCBKU09OIHBhbGV0dGUgKC5za2V0Y2hwYWxldHRlKVxuIyAobm90IHJlbGF0ZWQgdG8gLnNwbCBTa2V0Y2ggUkdCIFBhbGV0dGUgZm9ybWF0KVxuXG4jIGJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmRyZXdmaW9yaWxsby9za2V0Y2gtcGFsZXR0ZXMvYmxvYi81YjZiZmE2ZWIyNWNiMzI0NGE5ZTZhMjI2ZGYyNTllOGZiMzFmYzJjL1NrZXRjaCUyMFBhbGV0dGVzLnNrZXRjaHBsdWdpbi9Db250ZW50cy9Ta2V0Y2gvc2tldGNoUGFsZXR0ZXMuanNcblxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcblxudmVyc2lvbiA9IDEuNFxuXG4jIFRPRE86IERSWSB3aXRoIENTUy5jb2ZmZWVcbnBhcnNlX2Nzc19oZXhfY29sb3IgPSAoaGV4X2NvbG9yKS0+XG5cdGhleCA9ICh4KS0+IHBhcnNlSW50KHgsIDE2KVxuXHRcblx0bWF0Y2ggPSBoZXhfY29sb3IubWF0Y2goLy8vXG5cdFx0XFwjICMgaGFzaHRhZyAjICMvXG5cdFx0KFxuXHRcdFx0WzAtOUEtRl17M30gIyB0aHJlZSBoZXgtZGlnaXRzICgjQTBDKVxuXHRcdFx0fFxuXHRcdFx0WzAtOUEtRl17Nn0gIyBzaXggaGV4LWRpZ2l0cyAoI0FBMDBDQylcblx0XHRcdHxcblx0XHRcdFswLTlBLUZdezR9ICMgd2l0aCBhbHBoYSwgZm91ciBoZXgtZGlnaXRzICgjQTBDRilcblx0XHRcdHxcblx0XHRcdFswLTlBLUZdezh9ICMgd2l0aCBhbHBoYSwgZWlnaHQgaGV4LWRpZ2l0cyAoI0FBMDBDQ0ZGKVxuXHRcdClcblx0XHQoPyFbMC05QS1GXSkgIyAoYW5kIG5vIG1vcmUhKVxuXHQvLy9naW0pXG5cblx0WyQwLCAkMV0gPSBtYXRjaFxuXG5cdGlmICQxLmxlbmd0aCA+IDRcblx0XHRyOiBoZXggJDFbMF0gKyAkMVsxXVxuXHRcdGc6IGhleCAkMVsyXSArICQxWzNdXG5cdFx0YjogaGV4ICQxWzRdICsgJDFbNV1cblx0XHRhOiBpZiAkMS5sZW5ndGggaXMgOCB0aGVuIGhleCAkMVs2XSArICQxWzddIGVsc2UgMVxuXHRlbHNlXG5cdFx0cjogaGV4ICQxWzBdICsgJDFbMF1cblx0XHRnOiBoZXggJDFbMV0gKyAkMVsxXVxuXHRcdGI6IGhleCAkMVsyXSArICQxWzJdXG5cdFx0YTogaWYgJDEubGVuZ3RoIGlzIDQgdGhlbiBoZXggJDFbM10gKyAkMVszXSBlbHNlIDFcblxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XG5cdGlmIG5vdCBkYXRhLm1hdGNoKC9eXFxzKnsvKVxuXHRcdHRocm93IG5ldyBFcnJvciBcIm5vdCBza2V0Y2hwYWxldHRlIEpTT05cIlxuXHRwYWxldHRlQ29udGVudHMgPSBKU09OLnBhcnNlKGRhdGEpXG5cblx0Y29tcGF0aWJsZVZlcnNpb24gPSBwYWxldHRlQ29udGVudHMuY29tcGF0aWJsZVZlcnNpb25cblxuXHQjIENoZWNrIGZvciBwcmVzZXRzIGluIGZpbGUsIGVsc2Ugc2V0IHRvIGVtcHR5IGFycmF5XG5cdGNvbG9yRGVmaW5pdGlvbnMgPSBwYWxldHRlQ29udGVudHMuY29sb3JzID8gW11cblx0IyBncmFkaWVudERlZmluaXRpb25zID0gcGFsZXR0ZUNvbnRlbnRzLmdyYWRpZW50cyA/IFtdXG5cdCMgaW1hZ2VEZWZpbml0aW9ucyA9IHBhbGV0dGVDb250ZW50cy5pbWFnZXMgPyBbXVxuXHRjb2xvckFzc2V0cyA9IFtdXG5cdGdyYWRpZW50QXNzZXRzID0gW11cblx0aW1hZ2VzID0gW11cblxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGVcblxuXHQjIENoZWNrIGlmIHBsdWdpbiBpcyBvdXQgb2YgZGF0ZSBhbmQgaW5jb21wYXRpYmxlIHdpdGggYSBuZXdlciBwYWxldHRlIHZlcnNpb25cblx0aWYgY29tcGF0aWJsZVZlcnNpb24gYW5kIGNvbXBhdGlibGVWZXJzaW9uID4gdmVyc2lvblxuXHRcdHRocm93IG5ldyBFcnJvcihcIkNhbid0IGhhbmRsZSBjb21wYXRpYmxlVmVyc2lvbiBvZiAje2NvbXBhdGlibGVWZXJzaW9ufS5cIilcblxuXHQjIENoZWNrIGZvciBvbGRlciBoZXggY29kZSBwYWxldHRlIHZlcnNpb25cblx0aWYgbm90IGNvbXBhdGlibGVWZXJzaW9uIG9yIGNvbXBhdGlibGVWZXJzaW9uIDwgMS40XG5cdFx0IyBDb252ZXJ0IGhleCBjb2xvcnNcblx0XHRmb3IgaGV4X2NvbG9yIGluIGNvbG9yRGVmaW5pdGlvbnNcblx0XHRcdHBhbGV0dGUuYWRkKHBhcnNlX2Nzc19oZXhfY29sb3IoaGV4X2NvbG9yKSlcblx0ZWxzZVxuXHRcdCMgQ29sb3IgRmlsbHM6IGNvbnZlcnQgcmdiYSBjb2xvcnNcblx0XHRpZiBjb2xvckRlZmluaXRpb25zLmxlbmd0aCA+IDBcblx0XHRcdGZvciBjb2xvcl9kZWZpbml0aW9uIGluIGNvbG9yRGVmaW5pdGlvbnNcblx0XHRcdFx0cGFsZXR0ZS5hZGQoXG5cdFx0XHRcdFx0cjogY29sb3JfZGVmaW5pdGlvbi5yZWQgKiAyNTVcblx0XHRcdFx0XHRnOiBjb2xvcl9kZWZpbml0aW9uLmdyZWVuICogMjU1XG5cdFx0XHRcdFx0YjogY29sb3JfZGVmaW5pdGlvbi5ibHVlICogMjU1XG5cdFx0XHRcdFx0YTogY29sb3JfZGVmaW5pdGlvbi5hbHBoYSAqIDI1NVxuXHRcdFx0XHRcdG5hbWU6IGNvbG9yX2RlZmluaXRpb24ubmFtZVxuXHRcdFx0XHQpXG5cblx0XHQjICMgUGF0dGVybiBGaWxsczogY29udmVydCBiYXNlNjQgc3RyaW5ncyB0byBNU0ltYWdlRGF0YSBvYmplY3RzXG5cdFx0IyBpZiBpbWFnZURlZmluaXRpb25zLmxlbmd0aCA+IDBcblx0XHQjIFx0Zm9yIGkgaW4gWzAuLmltYWdlRGVmaW5pdGlvbnMubGVuZ3RoXVxuXHRcdCMgXHRcdG5zZGF0YSA9IE5TRGF0YS5hbGxvYygpLmluaXRXaXRoQmFzZTY0RW5jb2RlZFN0cmluZ19vcHRpb25zKGltYWdlRGVmaW5pdGlvbnNbaV0uZGF0YSwgMClcblx0XHQjIFx0XHRuc2ltYWdlID0gTlNJbWFnZS5hbGxvYygpLmluaXRXaXRoRGF0YShuc2RhdGEpXG5cdFx0IyBcdFx0IyBtc2ltYWdlID0gTVNJbWFnZURhdGEuYWxsb2MoKS5pbml0V2l0aEltYWdlQ29udmVydGluZ0NvbG9yU3BhY2UobnNpbWFnZSlcblx0XHQjIFx0XHRtc2ltYWdlID0gTVNJbWFnZURhdGEuYWxsb2MoKS5pbml0V2l0aEltYWdlKG5zaW1hZ2UpXG5cdFx0IyBcdFx0aW1hZ2VzLnB1c2gobXNpbWFnZSlcblxuXHRcdCMgIyBHcmFkaWVudCBGaWxsczogYnVpbGQgTVNHcmFkaWVudFN0b3AgYW5kIE1TR3JhZGllbnQgb2JqZWN0c1xuXHRcdCMgaWYgZ3JhZGllbnREZWZpbml0aW9ucy5sZW5ndGggPiAwXG5cdFx0IyBcdGZvciBpIGluIFswLi5ncmFkaWVudERlZmluaXRpb25zLmxlbmd0aF1cblx0XHQjIFx0XHQjIENyZWF0ZSBncmFkaWVudCBzdG9wc1xuXHRcdCMgXHRcdGdyYWRpZW50ID0gZ3JhZGllbnREZWZpbml0aW9uc1tpXVxuXHRcdCMgXHRcdHN0b3BzID0gW11cblx0XHQjIFx0XHRmb3IgaiBpbiBbMC4uZ3JhZGllbnQuc3RvcHNdXG5cdFx0IyBcdFx0XHRjb2xvciA9IE1TQ29sb3IuY29sb3JXaXRoUmVkX2dyZWVuX2JsdWVfYWxwaGEoXG5cdFx0IyBcdFx0XHRcdGdyYWRpZW50LnN0b3BzW2pdLmNvbG9yLnJlZCxcblx0XHQjIFx0XHRcdFx0Z3JhZGllbnQuc3RvcHNbal0uY29sb3IuZ3JlZW4sXG5cdFx0IyBcdFx0XHRcdGdyYWRpZW50LnN0b3BzW2pdLmNvbG9yLmJsdWUsXG5cdFx0IyBcdFx0XHRcdGdyYWRpZW50LnN0b3BzW2pdLmNvbG9yLmFscGhhXG5cdFx0IyBcdFx0XHQpXG5cdFx0IyBcdFx0XHRzdG9wcy5wdXNoKE1TR3JhZGllbnRTdG9wLnN0b3BXaXRoUG9zaXRpb25fY29sb3JfKGdyYWRpZW50LnN0b3BzW2pdLnBvc2l0aW9uLCBjb2xvcikpXG5cblx0XHQjIFx0XHQjIENyZWF0ZSBncmFkaWVudCBvYmplY3QgYW5kIHNldCBiYXNpYyBwcm9wZXJ0aWVzXG5cdFx0IyBcdFx0bXNncmFkaWVudCA9IE1TR3JhZGllbnQubmV3KClcblx0XHQjIFx0XHRtc2dyYWRpZW50LnNldEdyYWRpZW50VHlwZShncmFkaWVudC5ncmFkaWVudFR5cGUpXG5cdFx0IyBcdFx0IyBtc2dyYWRpZW50LnNob3VsZFNtb290aGVuT3BhY2l0eSA9IGdyYWRpZW50LnNob3VsZFNtb290aGVuT3BhY2l0eVxuXHRcdCMgXHRcdG1zZ3JhZGllbnQuZWxpcHNlTGVuZ3RoID0gZ3JhZGllbnQuZWxpcHNlTGVuZ3RoXG5cdFx0IyBcdFx0bXNncmFkaWVudC5zZXRTdG9wcyhzdG9wcylcblxuXHRcdCMgXHRcdCMgUGFyc2UgRnJvbSBhbmQgVG8gdmFsdWVzIGludG8gYXJyYXlzIGUuZy46IGZyb206IFwiezAuMSwtMC40M31cIiA9PiBmcm9tVmFsdWUgPSBbMC4xLCAtMC40M11cblx0XHQjIFx0XHRmcm9tVmFsdWUgPSBncmFkaWVudC5mcm9tLnNsaWNlKDEsLTEpLnNwbGl0KFwiLFwiKVxuXHRcdCMgXHRcdHRvVmFsdWUgPSBncmFkaWVudC50by5zbGljZSgxLC0xKS5zcGxpdChcIixcIilcblxuXHRcdCMgXHRcdCMgU2V0IENHUG9pbnQgb2JqZWN0cyBhcyBGcm9tIGFuZCBUbyB2YWx1ZXNcblx0XHQjIFx0XHRtc2dyYWRpZW50LnNldEZyb20oeyB4OiBmcm9tVmFsdWVbMF0sIHk6IGZyb21WYWx1ZVsxXSB9KVxuXHRcdCMgXHRcdG1zZ3JhZGllbnQuc2V0VG8oeyB4OiB0b1ZhbHVlWzBdLCB5OiB0b1ZhbHVlWzFdIH0pXG5cblx0XHQjIFx0XHRncmFkaWVudE5hbWUgPSBncmFkaWVudERlZmluaXRpb25zW2ldLm5hbWUgPyBncmFkaWVudERlZmluaXRpb25zW2ldLm5hbWUgOiBudWxsXG5cdFx0IyBcdFx0Z3JhZGllbnRBc3NldHMucHVzaChNU0dyYWRpZW50QXNzZXQuYWxsb2MoKS5pbml0V2l0aEFzc2V0X25hbWUobXNncmFkaWVudCwgZ3JhZGllbnROYW1lKSlcblxuXHRwYWxldHRlXG4iLCJcbiMgTG9hZCB0YWJ1bGFyIFJHQiB2YWx1ZXNcblxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcblxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXG5cdHBhbGV0dGVzID0gW1xuXHRcdGNzdl9wYWxldHRlID0gbmV3IFBhbGV0dGUoKVxuXHRcdHNzdl9wYWxldHRlID0gbmV3IFBhbGV0dGUoKVxuXHRdXG5cdHRyeV9wYXJzZV9saW5lID0gKGxpbmUsIHBhbGV0dGUsIHJlZ2V4cCktPlxuXHRcdG1hdGNoID0gbGluZS5tYXRjaChyZWdleHApXG5cdFx0aWYgbWF0Y2hcblx0XHRcdHBhbGV0dGUuYWRkXG5cdFx0XHRcdHI6IG1hdGNoWzFdXG5cdFx0XHRcdGc6IG1hdGNoWzJdXG5cdFx0XHRcdGI6IG1hdGNoWzNdXG5cdGZvciBsaW5lIGluIGxpbmVzXG5cdFx0dHJ5X3BhcnNlX2xpbmUgbGluZSwgY3N2X3BhbGV0dGUsIC8oWzAtOV0qXFwuP1swLTldKyksXFxzKihbMC05XSpcXC4/WzAtOV0rKSxcXHMqKFswLTldKlxcLj9bMC05XSspL1xuXHRcdHRyeV9wYXJzZV9saW5lIGxpbmUsIHNzdl9wYWxldHRlLCAvKFswLTldKlxcLj9bMC05XSspXFxzKyhbMC05XSpcXC4/WzAtOV0rKVxccysoWzAtOV0qXFwuP1swLTldKykvXG5cdFxuXHRtb3N0X2NvbG9ycyA9IFtdXG5cdGZvciBwYWxldHRlIGluIHBhbGV0dGVzXG5cdFx0aWYgcGFsZXR0ZS5sZW5ndGggPj0gbW9zdF9jb2xvcnMubGVuZ3RoXG5cdFx0XHRtb3N0X2NvbG9ycyA9IHBhbGV0dGVcblx0XG5cdG4gPSBtb3N0X2NvbG9ycy5sZW5ndGhcblx0aWYgbiA8IDRcblx0XHR0aHJvdyBuZXcgRXJyb3IoW1xuXHRcdFx0XCJObyBjb2xvcnMgZm91bmRcIlxuXHRcdFx0XCJPbmx5IG9uZSBjb2xvciBmb3VuZFwiXG5cdFx0XHRcIk9ubHkgYSBjb3VwbGUgY29sb3JzIGZvdW5kXCJcblx0XHRcdFwiT25seSBhIGZldyBjb2xvcnMgZm91bmRcIlxuXHRcdF1bbl0gKyBcIiAoI3tufSlcIilcblx0XG5cdGlmIG1vc3RfY29sb3JzLmV2ZXJ5KChjb2xvciktPiBjb2xvci5yIDw9IDEgYW5kIGNvbG9yLmcgPD0gMSBhbmQgY29sb3IuYiA8PSAxKVxuXHRcdG1vc3RfY29sb3JzLmZvckVhY2ggKGNvbG9yKS0+XG5cdFx0XHRjb2xvci5yICo9IDI1NVxuXHRcdFx0Y29sb3IuZyAqPSAyNTVcblx0XHRcdGNvbG9yLmIgKj0gMjU1XG5cblx0bW9zdF9jb2xvcnNcbiIsIiMgTG9hZCBXaW5kb3dzIC50aGVtZSBhbmQgLnRoZW1lcGFjayBmaWxlc1xuXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxuXG5wYXJzZUlOSVN0cmluZyA9IChkYXRhKS0+XG5cdHJlZ2V4ID0gXG5cdFx0c2VjdGlvbjogL15cXHMqXFxbXFxzKihbXlxcXV0qKVxccypcXF1cXHMqJC9cblx0XHRwYXJhbTogL15cXHMqKFtePV0rPylcXHMqPVxccyooLio/KVxccyokL1xuXHRcdGNvbW1lbnQ6IC9eXFxzKjsuKiQvXG5cdHZhbHVlID0ge31cblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxyXFxuXSsvKVxuXHRzZWN0aW9uID0gbnVsbFxuXHRsaW5lcy5mb3JFYWNoIChsaW5lKS0+XG5cdFx0aWYgcmVnZXguY29tbWVudC50ZXN0KGxpbmUpXG5cdFx0XHRyZXR1cm5cblx0XHRlbHNlIGlmIHJlZ2V4LnBhcmFtLnRlc3QobGluZSlcblx0XHRcdG1hdGNoID0gbGluZS5tYXRjaChyZWdleC5wYXJhbSlcblx0XHRcdGlmIHNlY3Rpb25cblx0XHRcdFx0dmFsdWVbc2VjdGlvbl1bbWF0Y2hbMV1dID0gbWF0Y2hbMl1cblx0XHRcdGVsc2Vcblx0XHRcdFx0dmFsdWVbbWF0Y2hbMV1dID0gbWF0Y2hbMl1cblx0XHRlbHNlIGlmIHJlZ2V4LnNlY3Rpb24udGVzdChsaW5lKVxuXHRcdFx0bWF0Y2ggPSBsaW5lLm1hdGNoKHJlZ2V4LnNlY3Rpb24pXG5cdFx0XHR2YWx1ZVttYXRjaFsxXV0gPSB7fVxuXHRcdFx0c2VjdGlvbiA9IG1hdGNoWzFdXG5cdFx0ZWxzZSBpZiBsaW5lLmxlbmd0aCBpcyAwIGFuZCBzZWN0aW9uXG5cdFx0XHRzZWN0aW9uID0gbnVsbFxuXHRcdHJldHVyblxuXHR2YWx1ZVxuXG5wYXJzZVRoZW1lRmlsZVN0cmluZyA9ICh0aGVtZUluaSktPlxuXHQjIC50aGVtZSBpcyBhIHJlbmFtZWQgLmluaSB0ZXh0IGZpbGVcblx0IyAudGhlbWVwYWNrIGlzIGEgcmVuYW1lZCAuY2FiIGZpbGUsIGFuZCBwYXJzaW5nIGl0IGFzIC5pbmkgc2VlbXMgdG8gd29yayB3ZWxsIGVub3VnaCBmb3IgdGhlIG1vc3QgcGFydCwgYXMgdGhlIC5pbmkgZGF0YSBhcHBlYXJzIGluIHBsYWluLFxuXHQjIGJ1dCBpdCBtYXkgbm90IGlmIGNvbXByZXNzaW9uIGlzIGVuYWJsZWQgZm9yIHRoZSAuY2FiIGZpbGVcblx0dGhlbWUgPSBwYXJzZUlOSVN0cmluZyh0aGVtZUluaSlcblx0Y29sb3JzID0gdGhlbWVbXCJDb250cm9sIFBhbmVsXFxcXENvbG9yc1wiXVxuXHRpZiBub3QgY29sb3JzXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0aGVtZSBmaWxlLCBubyBbQ29udHJvbCBQYW5lbFxcXFxDb2xvcnNdIHNlY3Rpb25cIilcblx0XG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZVxuXHRmb3Iga2V5IG9mIGNvbG9yc1xuXHRcdCMgZm9yIC50aGVtZXBhY2sgZmlsZSBzdXBwb3J0LCBqdXN0IGlnbm9yZSBiYWQga2V5cyB0aGF0IHdlcmUgcGFyc2VkXG5cdFx0aWYgbm90IGtleS5tYXRjaCgvXFxXLylcblx0XHRcdGNvbXBvbmVudHMgPSBjb2xvcnNba2V5XS5zcGxpdChcIiBcIilcblx0XHRcdGlmIGNvbXBvbmVudHMubGVuZ3RoIGlzIDNcblx0XHRcdFx0Zm9yIGNvbXBvbmVudCwgaSBpbiBjb21wb25lbnRzXG5cdFx0XHRcdFx0Y29tcG9uZW50c1tpXSA9IHBhcnNlSW50KGNvbXBvbmVudCwgMTApXG5cdFx0XHRcdGlmIGNvbXBvbmVudHMuZXZlcnkoKGNvbXBvbmVudCktPiBpc0Zpbml0ZShjb21wb25lbnQpKVxuXHRcdFx0XHRcdHBhbGV0dGUuYWRkXG5cdFx0XHRcdFx0XHRyOiBjb21wb25lbnRzWzBdXG5cdFx0XHRcdFx0XHRnOiBjb21wb25lbnRzWzFdXG5cdFx0XHRcdFx0XHRiOiBjb21wb25lbnRzWzJdXG5cdFx0XHRcdFx0XHRuYW1lOiBrZXlcblx0cGFsZXR0ZVxuXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cblx0cGFyc2VUaGVtZUZpbGVTdHJpbmcgZGF0YVxuIiwiXG5QYWxldHRlID0gcmVxdWlyZSBcIi4vUGFsZXR0ZVwiXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcblxuY2xhc3MgUmFuZG9tQ29sb3IgZXh0ZW5kcyBDb2xvclxuXHRjb25zdHJ1Y3RvcjogLT5cblx0XHRzdXBlcigpXG5cdFx0QHJhbmRvbWl6ZSgpXG5cdFxuXHRyYW5kb21pemU6IC0+XG5cdFx0QGggPSBNYXRoLnJhbmRvbSgpICogMzYwXG5cdFx0QHMgPSBNYXRoLnJhbmRvbSgpICogMTAwXG5cdFx0QGwgPSBNYXRoLnJhbmRvbSgpICogMTAwXG5cdFxuXHR0b1N0cmluZzogLT5cblx0XHRAcmFuZG9taXplKClcblx0XHRcImhzbCgje0BofSwgI3tAc30lLCAje0BsfSUpXCJcblx0XG5cdGlzOiAtPiBub1xuXG5jbGFzcyBSYW5kb21QYWxldHRlIGV4dGVuZHMgUGFsZXR0ZVxuXHRjb25zdHJ1Y3RvcjogLT5cblx0XHRzdXBlcigpXG5cdFx0QGxvYWRlciA9XG5cdFx0XHRuYW1lOiBcIkNvbXBsZXRlbHkgUmFuZG9tIENvbG9yc+KEolwiXG5cdFx0XHRmaWxlRXh0ZW5zaW9uczogW11cblx0XHRcdGZpbGVFeHRlbnNpb25zUHJldHR5OiBcIiguY3JjIHNqZihEZjA5c2pkZmtzZGxmbW5tICc7JztcIlxuXHRcdEBtYXRjaGVkTG9hZGVyRmlsZUV4dGVuc2lvbnMgPSBub1xuXHRcdEBjb25maWRlbmNlID0gMFxuXHRcdEBmaW5hbGl6ZSgpXG5cdFx0Zm9yIGkgaW4gWzAuLk1hdGgucmFuZG9tKCkqMTUrNV1cblx0XHRcdEBwdXNoIG5ldyBSYW5kb21Db2xvcigpXG5cbmNsYXNzIExvYWRpbmdFcnJvcnMgZXh0ZW5kcyBFcnJvclxuXHRjb25zdHJ1Y3RvcjogKEBlcnJvcnMpLT5cblx0XHRzdXBlcigpXG5cdFx0QG1lc3NhZ2UgPSBcIlNvbWUgZXJyb3JzIHdlcmUgZW5jb3VudGVyZWQgd2hlbiBsb2FkaW5nOlwiICtcblx0XHRcdGZvciBlcnJvciBpbiBAZXJyb3JzXG5cdFx0XHRcdFwiXFxuXFx0XCIgKyBlcnJvci5tZXNzYWdlXG5cbmxvYWRfcGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxuXHRcblx0cGFsZXR0ZV9sb2FkZXJzID0gW1xuXHRcdHtcblx0XHRcdG5hbWU6IFwiUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZVwiXG5cdFx0XHRleHRzOiBbXCJwYWxcIiwgXCJwc3BwYWxldHRlXCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50U2hvcFByb1wiXG5cdFx0fVxuXHRcdHtcblx0XHRcdG5hbWU6IFwiUklGRiBQQUxcIlxuXHRcdFx0ZXh0czogW1wicGFsXCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1JJRkZcIlxuXHRcdH1cblx0XHR7XG5cdFx0XHRuYW1lOiBcIkNvbG9yU2NoZW1lciBwYWxldHRlXCJcblx0XHRcdGV4dHM6IFtcImNzXCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0NvbG9yU2NoZW1lclwiXG5cdFx0fVxuXHRcdHtcblx0XHRcdG5hbWU6IFwiUGFpbnQuTkVUIHBhbGV0dGVcIlxuXHRcdFx0ZXh0czogW1widHh0XCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50Lk5FVFwiXG5cdFx0fVxuXHRcdHtcblx0XHRcdG5hbWU6IFwiR0lNUCBwYWxldHRlXCJcblx0XHRcdGV4dHM6IFtcImdwbFwiLCBcImdpbXBcIiwgXCJjb2xvcnNcIl1cblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvR0lNUFwiXG5cdFx0fVxuXHRcdHtcblx0XHRcdG5hbWU6IFwiS29sb3VyUGFpbnQgcGFsZXR0ZVwiXG5cdFx0XHRleHRzOiBbXCJjb2xvcnNcIl1cblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvS29sb3VyUGFpbnRcIlxuXHRcdH1cblx0XHR7XG5cdFx0XHRuYW1lOiBcIlNrZW5jaWwgcGFsZXR0ZVwiXG5cdFx0XHRleHRzOiBbXCJzcGxcIl1cblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvU1BMXCJcblx0XHR9XG5cdFx0e1xuXHRcdFx0bmFtZTogXCJTa2V0Y2ggcGFsZXR0ZVwiXG5cdFx0XHRleHRzOiBbXCJza2V0Y2hwYWxldHRlXCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL3NrZXRjaHBhbGV0dGVcIlxuXHRcdH1cblx0XHR7XG5cdFx0XHRuYW1lOiBcInNLMSBwYWxldHRlXCJcblx0XHRcdGV4dHM6IFtcInNrcFwiXVxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TS1BcIlxuXHRcdH1cblx0XHR7XG5cdFx0XHRuYW1lOiBcIkNTUyBjb2xvcnNcIlxuXHRcdFx0ZXh0czogW1wiY3NzXCIsIFwic2Nzc1wiLCBcInNhc3NcIiwgXCJsZXNzXCIsIFwic3R5bFwiLCBcImh0bWxcIiwgXCJodG1cIiwgXCJzdmdcIiwgXCJqc1wiLCBcInRzXCIsIFwieG1sXCIsIFwidHh0XCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0NTU1wiXG5cdFx0fVxuXHRcdHtcblx0XHRcdG5hbWU6IFwiV2luZG93cyBkZXNrdG9wIHRoZW1lXCJcblx0XHRcdGV4dHM6IFtcInRoZW1lXCIsIFwidGhlbWVwYWNrXCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL3RoZW1lXCJcblx0XHR9XG5cdFx0IyB7XG5cdFx0IyBcdG5hbWU6IFwiS0RFIGRlc2t0b3AgdGhlbWVcIlxuXHRcdCMgXHRleHRzOiBbXCJjb2xvcnNcIl1cblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy90aGVtZVwiXG5cdFx0IyB9XG5cdFx0IyB7XG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgU3dhdGNoXCJcblx0XHQjIFx0ZXh0czogW1wiYWNvXCJdXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvclN3YXRjaFwiXG5cdFx0IyB9XG5cdFx0e1xuXHRcdFx0bmFtZTogXCJBZG9iZSBDb2xvciBUYWJsZVwiXG5cdFx0XHRleHRzOiBbXCJhY3RcIl1cblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvclRhYmxlXCJcblx0XHR9XG5cdFx0IyB7XG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgU3dhdGNoIEV4Y2hhbmdlXCJcblx0XHQjIFx0ZXh0czogW1wiYXNlXCJdXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVTd2F0Y2hFeGNoYW5nZVwiXG5cdFx0IyB9XG5cdFx0IyB7XG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgQm9va1wiXG5cdFx0IyBcdGV4dHM6IFtcImFjYlwiXVxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JCb29rXCJcblx0XHQjIH1cblx0XHR7XG5cdFx0XHRuYW1lOiBcIkhvbWVzaXRlIHBhbGV0dGVcIlxuXHRcdFx0ZXh0czogW1wiaHBsXCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0hvbWVzaXRlXCJcblx0XHR9XG5cdFx0e1xuXHRcdFx0bmFtZTogXCJTdGFyQ3JhZnQgcGFsZXR0ZVwiXG5cdFx0XHRleHRzOiBbXCJwYWxcIl1cblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvU3RhckNyYWZ0XCJcblx0XHR9XG5cdFx0e1xuXHRcdFx0bmFtZTogXCJTdGFyQ3JhZnQgdGVycmFpbiBwYWxldHRlXCJcblx0XHRcdGV4dHM6IFtcIndwZVwiXVxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TdGFyQ3JhZnRQYWRkZWRcIlxuXHRcdH1cblx0XHRcblx0XHQjIHtcblx0XHQjIFx0bmFtZTogXCJBdXRvQ0FEIENvbG9yIEJvb2tcIlxuXHRcdCMgXHRleHRzOiBbXCJhY2JcIl1cblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BdXRvQ0FEQ29sb3JCb29rXCJcblx0XHQjIH1cblx0XHRcblx0XHQjIHtcblx0XHQjIFx0IyAoc2FtZSBhcyBQYWludCBTaG9wIFBybyBwYWxldHRlPylcblx0XHQjIFx0bmFtZTogXCJDb3JlbERSQVcgcGFsZXR0ZVwiXG5cdFx0IyBcdGV4dHM6IFtcInBhbFwiLCBcImNwbFwiXVxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0NvcmVsRFJBV1wiXG5cdFx0IyB9XG5cdFx0e1xuXHRcdFx0bmFtZTogXCJ0YWJ1bGFyIGNvbG9yc1wiXG5cdFx0XHRleHRzOiBbXCJjc3ZcIiwgXCJ0c3ZcIiwgXCJ0eHRcIl1cblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvdGFidWxhclwiXG5cdFx0fVxuXHRdXG5cdFxuXHQjIGZpbmQgcGFsZXR0ZSBsb2FkZXJzIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cblx0Zm9yIHBsIGluIHBhbGV0dGVfbG9hZGVyc1xuXHRcdHBsLm1hdGNoZXNfZXh0ID0gcGwuZXh0cy5pbmRleE9mKG8uZmlsZUV4dCkgaXNudCAtMVxuXHRcblx0IyBtb3ZlIHBhbGV0dGUgbG9hZGVycyB0byB0aGUgYmVnaW5uaW5nIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cblx0cGFsZXR0ZV9sb2FkZXJzLnNvcnQgKHBsMSwgcGwyKS0+XG5cdFx0cGwyLm1hdGNoZXNfZXh0IC0gcGwxLm1hdGNoZXNfZXh0XG5cdFxuXHQjIHRyeSBsb2FkaW5nIHN0dWZmXG5cdGVycm9ycyA9IFtdXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcblx0XHRcblx0XHR0cnlcblx0XHRcdHBhbGV0dGUgPSBwbC5sb2FkKG8pXG5cdFx0XHRpZiBwYWxldHRlLmxlbmd0aCBpcyAwXG5cdFx0XHRcdHBhbGV0dGUgPSBudWxsXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIm5vIGNvbG9ycyByZXR1cm5lZFwiXG5cdFx0Y2F0Y2ggZVxuXHRcdFx0bXNnID0gXCJmYWlsZWQgdG8gbG9hZCAje28uZmlsZU5hbWV9IGFzICN7cGwubmFtZX06ICN7ZS5tZXNzYWdlfVwiXG5cdFx0XHQjIGlmIHBsLm1hdGNoZXNfZXh0IGFuZCBub3QgZS5tZXNzYWdlLm1hdGNoKC9ub3QgYS9pKVxuXHRcdFx0IyBcdGNvbnNvbGU/LmVycm9yPyBtc2dcblx0XHRcdCMgZWxzZVxuXHRcdFx0IyBcdGNvbnNvbGU/Lndhcm4/IG1zZ1xuXHRcdFx0XG5cdFx0XHQjIFRPRE86IG1heWJlIHRoaXMgc2hvdWxkbid0IGJlIGFuIEVycm9yIG9iamVjdCwganVzdCBhIHttZXNzYWdlLCBlcnJvcn0gb2JqZWN0XG5cdFx0XHQjIG9yIHtmcmllbmRseU1lc3NhZ2UsIGVycm9yfVxuXHRcdFx0ZXJyID0gbmV3IEVycm9yIG1zZ1xuXHRcdFx0ZXJyLmVycm9yID0gZVxuXHRcdFx0ZXJyb3JzLnB1c2ggZXJyXG5cdFx0XG5cdFx0aWYgcGFsZXR0ZVxuXHRcdFx0IyBjb25zb2xlPy5pbmZvPyBcImxvYWRlZCAje28uZmlsZU5hbWV9IGFzICN7cGwubmFtZX1cIlxuXHRcdFx0cGFsZXR0ZS5jb25maWRlbmNlID0gaWYgcGwubWF0Y2hlc19leHQgdGhlbiAwLjkgZWxzZSAwLjAxXG5cdFx0XHRleHRzX3ByZXR0eSA9IFwiLiN7cGwuZXh0cy5qb2luKFwiLCAuXCIpfVwiXG5cdFx0XHRcblx0XHRcdCMgVE9ETzogcHJvYmFibHkgcmVuYW1lIGxvYWRlciAtPiBmb3JtYXQgd2hlbiAyLXdheSBkYXRhIGZsb3cgKHJlYWQvd3JpdGUpIGlzIHN1cHBvcnRlZFxuXHRcdFx0IyBUT0RPOiBtYXliZSBtYWtlIHRoaXMgYSAzcmQgKGFuZCBmb3VydGg/KSBhcmd1bWVudCB0byB0aGUgY2FsbGJhY2tcblx0XHRcdHBhbGV0dGUubG9hZGVyID1cblx0XHRcdFx0bmFtZTogcGwubmFtZVxuXHRcdFx0XHRmaWxlRXh0ZW5zaW9uczogcGwuZXh0c1xuXHRcdFx0XHRmaWxlRXh0ZW5zaW9uc1ByZXR0eTogZXh0c19wcmV0dHlcblx0XHRcdHBhbGV0dGUubWF0Y2hlZExvYWRlckZpbGVFeHRlbnNpb25zID0gcGwubWF0Y2hlc19leHRcblx0XHRcdFxuXHRcdFx0cGFsZXR0ZS5maW5hbGl6ZSgpXG5cdFx0XHRjYWxsYmFjayhudWxsLCBwYWxldHRlKVxuXHRcdFx0cmV0dXJuXG5cdFxuXHRjYWxsYmFjayhuZXcgTG9hZGluZ0Vycm9ycyhlcnJvcnMpKVxuXHRyZXR1cm5cblxubm9ybWFsaXplX29wdGlvbnMgPSAobyA9IHt9KS0+XG5cdGlmIHR5cGVvZiBvIGlzIFwic3RyaW5nXCIgb3IgbyBpbnN0YW5jZW9mIFN0cmluZ1xuXHRcdG8gPSBmaWxlUGF0aDogb1xuXHRpZiBGaWxlPyBhbmQgbyBpbnN0YW5jZW9mIEZpbGVcblx0XHRvID0gZmlsZTogb1xuXHRcblx0IyBvLm1pbkNvbG9ycyA/PSAyXG5cdCMgby5tYXhDb2xvcnMgPz0gMjU2XG5cdG8uZmlsZU5hbWUgPz0gby5maWxlPy5uYW1lID8gKGlmIG8uZmlsZVBhdGggdGhlbiByZXF1aXJlKFwicGF0aFwiKS5iYXNlbmFtZShvLmZpbGVQYXRoKSlcblx0by5maWxlRXh0ID89IFwiI3tvLmZpbGVOYW1lfVwiLnNwbGl0KFwiLlwiKS5wb3AoKVxuXHRvLmZpbGVFeHQgPSBcIiN7by5maWxlRXh0fVwiLnRvTG93ZXJDYXNlKClcblx0b1xuXG5BbnlQYWxldHRlID0ge1xuXHRDb2xvclxuXHRQYWxldHRlXG5cdFJhbmRvbUNvbG9yXG5cdFJhbmRvbVBhbGV0dGVcblx0IyBMb2FkaW5nRXJyb3JzXG59XG5cbiMgR2V0IHBhbGV0dGUgZnJvbSBhIGZpbGVcbkFueVBhbGV0dGUubG9hZFBhbGV0dGUgPSAobywgY2FsbGJhY2spLT5cblx0aWYgbm90IG9cblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yIFwicGFyYW1ldGVycyByZXF1aXJlZDogQW55UGFsZXR0ZS5sb2FkUGFsZXR0ZShvcHRpb25zLCBmdW5jdGlvbiBjYWxsYmFjayhlcnJvciwgcGFsZXR0ZSl7fSlcIlxuXHRpZiBub3QgY2FsbGJhY2tcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yIFwiY2FsbGJhY2sgcmVxdWlyZWQ6IEFueVBhbGV0dGUubG9hZFBhbGV0dGUob3B0aW9ucywgZnVuY3Rpb24gY2FsbGJhY2soZXJyb3IsIHBhbGV0dGUpe30pXCJcblx0XG5cdG8gPSBub3JtYWxpemVfb3B0aW9ucyBvXG5cdFxuXHRpZiBvLmRhdGFcblx0XHRsb2FkX3BhbGV0dGUobywgY2FsbGJhY2spXG5cdGVsc2UgaWYgby5maWxlXG5cdFx0aWYgbm90IChvLmZpbGUgaW5zdGFuY2VvZiBGaWxlKVxuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvciBcIm9wdGlvbnMuZmlsZSB3YXMgcGFzc2VkIGJ1dCBpdCBpcyBub3QgYSBGaWxlXCJcblx0XHRmciA9IG5ldyBGaWxlUmVhZGVyXG5cdFx0ZnIub25lcnJvciA9IC0+XG5cdFx0XHRjYWxsYmFjayhmci5lcnJvcilcblx0XHRmci5vbmxvYWQgPSAtPlxuXHRcdFx0by5kYXRhID0gZnIucmVzdWx0XG5cdFx0XHRsb2FkX3BhbGV0dGUobywgY2FsbGJhY2spXG5cdFx0ZnIucmVhZEFzQmluYXJ5U3RyaW5nIG8uZmlsZVxuXHRlbHNlIGlmIG8uZmlsZVBhdGg/XG5cdFx0ZnMgPSByZXF1aXJlIFwiZnNcIlxuXHRcdGZzLnJlYWRGaWxlIG8uZmlsZVBhdGgsIChlcnJvciwgZGF0YSktPlxuXHRcdFx0aWYgZXJyb3Jcblx0XHRcdFx0Y2FsbGJhY2soZXJyb3IpXG5cdFx0XHRlbHNlXG5cdFx0XHRcdG8uZGF0YSA9IGRhdGEudG9TdHJpbmcoXCJiaW5hcnlcIilcblx0XHRcdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxuXHRlbHNlXG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvciBcImVpdGhlciBvcHRpb25zLmRhdGEgb3Igb3B0aW9ucy5maWxlIG9yIG9wdGlvbnMuZmlsZVBhdGggbXVzdCBiZSBwYXNzZWRcIlxuXG5cbiMgR2V0IGEgcGFsZXR0ZSBmcm9tIGEgZmlsZSBvciBieSBhbnkgbWVhbnMgbmVjZXNzYXJ5XG4jIChhcyBpbiBmYWxsIGJhY2sgdG8gY29tcGxldGVseSByYW5kb20gZGF0YSlcbkFueVBhbGV0dGUuZ2ltbWVBUGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxuXHRvID0gbm9ybWFsaXplX29wdGlvbnMgb1xuXHRcblx0QW55UGFsZXR0ZS5sb2FkUGFsZXR0ZSBvLCAoZXJyLCBwYWxldHRlKS0+XG5cdFx0Y2FsbGJhY2sobnVsbCwgcGFsZXR0ZSA/IG5ldyBSYW5kb21QYWxldHRlKVxuXG4jIEV4cG9ydHNcbm1vZHVsZS5leHBvcnRzID0gQW55UGFsZXR0ZVxuIl19
