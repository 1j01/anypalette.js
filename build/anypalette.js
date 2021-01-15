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
      var i, length, ref, str;
      length = this.readUInt16();
      // console.log {length}
      this._checkSize(length * 16);
      str = "";
      for (i = 0, ref = length; (0 <= ref ? i < ref : i > ref); 0 <= ref ? i++ : i--) {
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
  for (var i = 0; i < 256; i++) {
    palette.add({
      r: br.readUInt8(),
      g: br.readUInt8(),
      b: br.readUInt8()
    });
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
  var br, color_count, i, j, palette, ref, version;
  if (fileExt !== "cs") {
    throw new Error(`ColorSchemer loader is only enabled when file extension is '.cs' (saw '.${fileExt}' instead)`);
  }
  palette = new Palette();
  br = new BinaryReader(data);
  version = br.readUInt16(); // or something
  color_count = br.readUInt16();
  for (i = j = 0, ref = color_count; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
    br.seek(8 + i * 26);
    palette.add({
      r: br.readByte(),
      g: br.readByte(),
      b: br.readByte()
    });
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
  var br, i, palette;
  palette = new Palette();
  br = new BinaryReader(data);
  if (br.getSize() !== 768) {
    throw new Error(`Wrong file size, must be ${768} bytes long (not ${br.getSize()})`);
  }
  for (var i = 0; i < 256; i++) {
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
  var br, i, palette;
  palette = new Palette();
  br = new BinaryReader(data);
  if (br.getSize() !== 1024) {
    throw new Error(`Wrong file size, must be ${1024} bytes long (not ${br.getSize()})`);
  }
  for (var i = 0; i < 256; i++) {
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
  // 	for imageDefinition in imageDefinitions
  // 		nsdata = NSData.alloc().initWithBase64EncodedString_options(imageDefinition.data, 0)
  // 		nsimage = NSImage.alloc().initWithData(nsdata)
  // 		# msimage = MSImageData.alloc().initWithImageConvertingColorSpace(nsimage)
  // 		msimage = MSImageData.alloc().initWithImage(nsimage)
  // 		images.push(msimage)

  // # Gradient Fills: build MSGradientStop and MSGradient objects
  // if gradientDefinitions.length > 0
  // 	for gradient in gradientDefinitions
  // 		# Create gradient stops
  // 		stops = []
  // 		for stop in gradient.stops
  // 			color = MSColor.colorWithRed_green_blue_alpha(
  // 				stop.color.red,
  // 				stop.color.green,
  // 				stop.color.blue,
  // 				stop.color.alpha
  // 			)
  // 			stops.push(MSGradientStop.stopWithPosition_color_(stop.position, color))

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

  // 		gradientName = gradient.name ? null
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQmluYXJ5UmVhZGVyLmNvZmZlZSIsInNyYy9Db2xvci5jb2ZmZWUiLCJzcmMvUGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbG9hZGVycy9BZG9iZUNvbG9yVGFibGUuY29mZmVlIiwic3JjL2xvYWRlcnMvQ1NTLmNvZmZlZSIsInNyYy9sb2FkZXJzL0NvbG9yU2NoZW1lci5jb2ZmZWUiLCJzcmMvbG9hZGVycy9HSU1QLmNvZmZlZSIsInNyYy9sb2FkZXJzL0hvbWVzaXRlLmNvZmZlZSIsInNyYy9sb2FkZXJzL0tvbG91clBhaW50LmNvZmZlZSIsInNyYy9sb2FkZXJzL1BhaW50Lk5FVC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9QYWludFNob3BQcm8uY29mZmVlIiwic3JjL2xvYWRlcnMvUklGRi5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TS1AuY29mZmVlIiwic3JjL2xvYWRlcnMvU1BMLmNvZmZlZSIsInNyYy9sb2FkZXJzL1N0YXJDcmFmdC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TdGFyQ3JhZnRQYWRkZWQuY29mZmVlIiwic3JjL2xvYWRlcnMvc2tldGNocGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbG9hZGVycy90YWJ1bGFyLmNvZmZlZSIsInNyYy9sb2FkZXJzL3RoZW1lLmNvZmZlZSIsInNyYy9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ2FHOzs7Ozs7Ozs7Ozs7O0FBQUEsSUFBQTs7QUFFSCxNQUFNLENBQUMsT0FBUCxHQUNNO0VBQU4sTUFBQSxhQUFBO0lBQ0MsV0FBYSxDQUFDLElBQUQsQ0FBQTtNQUNaLElBQUMsQ0FBQSxPQUFELEdBQVc7TUFDWCxJQUFDLENBQUEsSUFBRCxHQUFRO0lBRkksQ0FBZDs7O0lBTUMsUUFBVSxDQUFBLENBQUE7QUFDWCxVQUFBO01BQUUsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFaO01BQ0EsRUFBQSxHQUFLLElBQUksQ0FB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ZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXG4jIyNcbkJpbmFyeVJlYWRlclxuXG5Nb2RpZmllZCBieSBJc2FpYWggT2RobmVyXG5AVE9ETzogdXNlIGpEYXRhVmlldyArIGpCaW5hcnkgaW5zdGVhZFxuXG5SZWZhY3RvcmVkIGJ5IFZqZXV4IDx2amV1eHhAZ21haWwuY29tPlxuaHR0cDovL2Jsb2cudmpldXguY29tLzIwMTAvamF2YXNjcmlwdC9qYXZhc2NyaXB0LWJpbmFyeS1yZWFkZXIuaHRtbFxuXG5PcmlnaW5hbFxuKyBKb25hcyBSYW9uaSBTb2FyZXMgU2lsdmFcbkAgaHR0cDovL2pzZnJvbWhlbGwuY29tL2NsYXNzZXMvYmluYXJ5LXBhcnNlciBbcmV2LiAjMV1cbiMjI1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBCaW5hcnlSZWFkZXJcblx0Y29uc3RydWN0b3I6IChkYXRhKS0+XG5cdFx0QF9idWZmZXIgPSBkYXRhXG5cdFx0QF9wb3MgPSAwXG5cblx0IyBQdWJsaWMgKGN1c3RvbSlcblx0XG5cdHJlYWRCeXRlOiAtPlxuXHRcdEBfY2hlY2tTaXplKDgpXG5cdFx0Y2ggPSB0aGlzLl9idWZmZXIuY2hhckNvZGVBdChAX3BvcykgJiAweGZmXG5cdFx0QF9wb3MgKz0gMVxuXHRcdGNoICYgMHhmZlxuXHRcblx0cmVhZFVuaWNvZGVTdHJpbmc6IC0+XG5cdFx0bGVuZ3RoID0gQHJlYWRVSW50MTYoKVxuXHRcdCMgY29uc29sZS5sb2cge2xlbmd0aH1cblx0XHRAX2NoZWNrU2l6ZShsZW5ndGggKiAxNilcblx0XHRzdHIgPSBcIlwiXG5cdFx0Zm9yIFswLi4ubGVuZ3RoXVxuXHRcdFx0c3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoQF9idWZmZXIuc3Vic3RyKEBfcG9zLCAxKSB8IChAX2J1ZmZlci5zdWJzdHIoQF9wb3MrMSwgMSkgPDwgOCkpXG5cdFx0XHRAX3BvcyArPSAyXG5cdFx0c3RyXG5cdFxuXHQjIFB1YmxpY1xuXHRcblx0cmVhZEludDg6IC0+IEBfZGVjb2RlSW50KDgsIHRydWUpXG5cdHJlYWRVSW50ODogLT4gQF9kZWNvZGVJbnQoOCwgZmFsc2UpXG5cdHJlYWRJbnQxNjogLT4gQF9kZWNvZGVJbnQoMTYsIHRydWUpXG5cdHJlYWRVSW50MTY6IC0+IEBfZGVjb2RlSW50KDE2LCBmYWxzZSlcblx0cmVhZEludDMyOiAtPiBAX2RlY29kZUludCgzMiwgdHJ1ZSlcblx0cmVhZFVJbnQzMjogLT4gQF9kZWNvZGVJbnQoMzIsIGZhbHNlKVxuXG5cdHJlYWRGbG9hdDogLT4gQF9kZWNvZGVGbG9hdCgyMywgOClcblx0cmVhZERvdWJsZTogLT4gQF9kZWNvZGVGbG9hdCg1MiwgMTEpXG5cdFxuXHRyZWFkQ2hhcjogLT4gQHJlYWRTdHJpbmcoMSlcblx0cmVhZFN0cmluZzogKGxlbmd0aCktPlxuXHRcdEBfY2hlY2tTaXplKGxlbmd0aCAqIDgpXG5cdFx0cmVzdWx0ID0gQF9idWZmZXIuc3Vic3RyKEBfcG9zLCBsZW5ndGgpXG5cdFx0QF9wb3MgKz0gbGVuZ3RoXG5cdFx0cmVzdWx0XG5cblx0c2VlazogKHBvcyktPlxuXHRcdEBfcG9zID0gcG9zXG5cdFx0QF9jaGVja1NpemUoMClcblx0XG5cdGdldFBvc2l0aW9uOiAtPiBAX3Bvc1xuXHRcblx0Z2V0U2l6ZTogLT4gQF9idWZmZXIubGVuZ3RoXG5cdFxuXG5cblx0IyBQcml2YXRlXG5cdFxuXHRfZGVjb2RlRmxvYXQ6IGBmdW5jdGlvbihwcmVjaXNpb25CaXRzLCBleHBvbmVudEJpdHMpe1xuXHRcdHZhciBsZW5ndGggPSBwcmVjaXNpb25CaXRzICsgZXhwb25lbnRCaXRzICsgMTtcblx0XHR2YXIgc2l6ZSA9IGxlbmd0aCA+PiAzO1xuXHRcdHRoaXMuX2NoZWNrU2l6ZShsZW5ndGgpO1xuXG5cdFx0dmFyIGJpYXMgPSBNYXRoLnBvdygyLCBleHBvbmVudEJpdHMgLSAxKSAtIDE7XG5cdFx0dmFyIHNpZ25hbCA9IHRoaXMuX3JlYWRCaXRzKHByZWNpc2lvbkJpdHMgKyBleHBvbmVudEJpdHMsIDEsIHNpemUpO1xuXHRcdHZhciBleHBvbmVudCA9IHRoaXMuX3JlYWRCaXRzKHByZWNpc2lvbkJpdHMsIGV4cG9uZW50Qml0cywgc2l6ZSk7XG5cdFx0dmFyIHNpZ25pZmljYW5kID0gMDtcblx0XHR2YXIgZGl2aXNvciA9IDI7XG5cdFx0dmFyIGN1ckJ5dGUgPSAwOyAvL2xlbmd0aCArICgtcHJlY2lzaW9uQml0cyA+PiAzKSAtIDE7XG5cdFx0ZG8ge1xuXHRcdFx0dmFyIGJ5dGVWYWx1ZSA9IHRoaXMuX3JlYWRCeXRlKCsrY3VyQnl0ZSwgc2l6ZSk7XG5cdFx0XHR2YXIgc3RhcnRCaXQgPSBwcmVjaXNpb25CaXRzICUgOCB8fCA4O1xuXHRcdFx0dmFyIG1hc2sgPSAxIDw8IHN0YXJ0Qml0O1xuXHRcdFx0d2hpbGUgKG1hc2sgPj49IDEpIHtcblx0XHRcdFx0aWYgKGJ5dGVWYWx1ZSAmIG1hc2spIHtcblx0XHRcdFx0XHRzaWduaWZpY2FuZCArPSAxIC8gZGl2aXNvcjtcblx0XHRcdFx0fVxuXHRcdFx0XHRkaXZpc29yICo9IDI7XG5cdFx0XHR9XG5cdFx0fSB3aGlsZSAocHJlY2lzaW9uQml0cyAtPSBzdGFydEJpdCk7XG5cblx0XHR0aGlzLl9wb3MgKz0gc2l6ZTtcblxuXHRcdHJldHVybiBleHBvbmVudCA9PSAoYmlhcyA8PCAxKSArIDEgPyBzaWduaWZpY2FuZCA/IE5hTiA6IHNpZ25hbCA/IC1JbmZpbml0eSA6ICtJbmZpbml0eVxuXHRcdFx0OiAoMSArIHNpZ25hbCAqIC0yKSAqIChleHBvbmVudCB8fCBzaWduaWZpY2FuZCA/ICFleHBvbmVudCA/IE1hdGgucG93KDIsIC1iaWFzICsgMSkgKiBzaWduaWZpY2FuZFxuXHRcdFx0OiBNYXRoLnBvdygyLCBleHBvbmVudCAtIGJpYXMpICogKDEgKyBzaWduaWZpY2FuZCkgOiAwKTtcblx0fWBcblxuXHRfZGVjb2RlSW50OiBgZnVuY3Rpb24oYml0cywgc2lnbmVkKXtcblx0XHR2YXIgeCA9IHRoaXMuX3JlYWRCaXRzKDAsIGJpdHMsIGJpdHMgLyA4KSwgbWF4ID0gTWF0aC5wb3coMiwgYml0cyk7XG5cdFx0dmFyIHJlc3VsdCA9IHNpZ25lZCAmJiB4ID49IG1heCAvIDIgPyB4IC0gbWF4IDogeDtcblxuXHRcdHRoaXMuX3BvcyArPSBiaXRzIC8gODtcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9YFxuXG5cdCNzaGwgZml4OiBIZW5yaSBUb3JnZW1hbmUgfjE5OTYgKGNvbXByZXNzZWQgYnkgSm9uYXMgUmFvbmkpXG5cdF9zaGw6IGBmdW5jdGlvbiAoYSwgYil7XG5cdFx0Zm9yICgrK2I7IC0tYjsgYSA9ICgoYSAlPSAweDdmZmZmZmZmICsgMSkgJiAweDQwMDAwMDAwKSA9PSAweDQwMDAwMDAwID8gYSAqIDIgOiAoYSAtIDB4NDAwMDAwMDApICogMiArIDB4N2ZmZmZmZmYgKyAxKTtcblx0XHRyZXR1cm4gYTtcblx0fWBcblx0XG5cdF9yZWFkQnl0ZTogYGZ1bmN0aW9uIChpLCBzaXplKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2J1ZmZlci5jaGFyQ29kZUF0KHRoaXMuX3BvcyArIHNpemUgLSBpIC0gMSkgJiAweGZmO1xuXHR9YFxuXG5cdF9yZWFkQml0czogYGZ1bmN0aW9uIChzdGFydCwgbGVuZ3RoLCBzaXplKSB7XG5cdFx0dmFyIG9mZnNldExlZnQgPSAoc3RhcnQgKyBsZW5ndGgpICUgODtcblx0XHR2YXIgb2Zmc2V0UmlnaHQgPSBzdGFydCAlIDg7XG5cdFx0dmFyIGN1ckJ5dGUgPSBzaXplIC0gKHN0YXJ0ID4+IDMpIC0gMTtcblx0XHR2YXIgbGFzdEJ5dGUgPSBzaXplICsgKC0oc3RhcnQgKyBsZW5ndGgpID4+IDMpO1xuXHRcdHZhciBkaWZmID0gY3VyQnl0ZSAtIGxhc3RCeXRlO1xuXG5cdFx0dmFyIHN1bSA9ICh0aGlzLl9yZWFkQnl0ZShjdXJCeXRlLCBzaXplKSA+PiBvZmZzZXRSaWdodCkgJiAoKDEgPDwgKGRpZmYgPyA4IC0gb2Zmc2V0UmlnaHQgOiBsZW5ndGgpKSAtIDEpO1xuXG5cdFx0aWYgKGRpZmYgJiYgb2Zmc2V0TGVmdCkge1xuXHRcdFx0c3VtICs9ICh0aGlzLl9yZWFkQnl0ZShsYXN0Qnl0ZSsrLCBzaXplKSAmICgoMSA8PCBvZmZzZXRMZWZ0KSAtIDEpKSA8PCAoZGlmZi0tIDw8IDMpIC0gb2Zmc2V0UmlnaHQ7IFxuXHRcdH1cblxuXHRcdHdoaWxlIChkaWZmKSB7XG5cdFx0XHRzdW0gKz0gdGhpcy5fc2hsKHRoaXMuX3JlYWRCeXRlKGxhc3RCeXRlKyssIHNpemUpLCAoZGlmZi0tIDw8IDMpIC0gb2Zmc2V0UmlnaHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiBzdW07XG5cdH1gXG5cblx0X2NoZWNrU2l6ZTogKG5lZWRlZEJpdHMpLT5cblx0XHRpZiBAX3BvcyArIE1hdGguY2VpbChuZWVkZWRCaXRzIC8gOCkgPiBAX2J1ZmZlci5sZW5ndGhcblx0XHRcdHRocm93IG5ldyBFcnJvciBcIkluZGV4IG91dCBvZiBib3VuZFwiXG5cbiIsIlxuIyBjb2xvciB2YWx1ZSByYW5nZXM6XG4jIGE6IDAgdG8gMVxuIyByL2cvYjogMCB0byAyNTVcbiMgaDogMCB0byAzNjBcbiMgcy9sOiAwIHRvIDEwMFxuIyBjL20veS9rOiAwIHRvIDEwMFxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBDb2xvclxuXHRjb25zdHJ1Y3RvcjogKG9wdGlvbnMpLT5cblx0XHQjIEBUT0RPOiBkb24ndCBhc3NpZ24gYWxsIG9mIHtAciwgQGcsIEBiLCBAaCwgQHMsIEB2LCBAbH0gcmlnaHQgYXdheVxuXHRcdCMgb25seSBhc3NpZ24gdGhlIHByb3BlcnRpZXMgdGhhdCBhcmUgdXNlZFxuXHRcdCMgYWxzbyBtYXliZSBhbHdheXMgaGF2ZSBAciBAZyBAYiAob3IgQHJlZCBAZ3JlZW4gQGJsdWUpIGJ1dCBzdGlsbCBzdHJpbmdpZnkgdG8gaHNsKCkgaWYgaHNsIG9yIGhzdiBnaXZlblxuXHRcdCMgVE9ETzogZXhwZWN0IG51bWJlcnMgb3IgY29udmVydCB0byBudW1iZXJzXG5cdFx0e1xuXHRcdFx0QHIsIEBnLCBAYixcblx0XHRcdEBoLCBAcywgQHYsIEBsLFxuXHRcdFx0YywgbSwgeSwgayxcblx0XHRcdEBuYW1lXG5cdFx0fSA9IG9wdGlvbnNcblxuXHRcdGlmIEByPyBhbmQgQGc/IGFuZCBAYj9cblx0XHRcdCMgUmVkIEdyZWVuIEJsdWVcblx0XHRcdCMgKG5vIGNvbnZlcnNpb25zIG5lZWRlZCBoZXJlKVxuXHRcdGVsc2UgaWYgQGg/IGFuZCBAcz9cblx0XHRcdCMgQ3lsaW5kcmljYWwgQ29sb3IgU3BhY2Vcblx0XHRcdGlmIEB2P1xuXHRcdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIFZhbHVlXG5cdFx0XHRcdEBsID0gKDIgLSBAcyAvIDEwMCkgKiBAdiAvIDJcblx0XHRcdFx0QHMgPSBAcyAqIEB2IC8gKGlmIEBsIDwgNTAgdGhlbiBAbCAqIDIgZWxzZSAyMDAgLSBAbCAqIDIpXG5cdFx0XHRcdEBzID0gMCBpZiBpc05hTiBAc1xuXHRcdFx0ZWxzZSBpZiBAbD9cblx0XHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBMaWdodG5lc3Ncblx0XHRcdFx0IyAobm8gY29udmVyc2lvbnMgbmVlZGVkIGhlcmUpXG5cdFx0XHRlbHNlXG5cdFx0XHRcdCMgVE9ETzogaW1wcm92ZSBlcnJvciBtZXNzYWdlIChlc3BlY2lhbGx5IGlmIEBiIGdpdmVuKVxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJIdWUsIHNhdHVyYXRpb24sIGFuZC4uLj8gKGVpdGhlciBsaWdodG5lc3Mgb3IgdmFsdWUpXCJcblx0XHRcdCMgVE9ETzogbWF5YmUgY29udmVydCB0byBAciBAZyBAYiBoZXJlXG5cdFx0ZWxzZSBpZiBjPyBhbmQgbT8gYW5kIHk/IGFuZCBrP1xuXHRcdFx0IyBDeWFuIE1hZ2VudGEgWWVsbG93IGJsYWNLXG5cdFx0XHQjIFVOVEVTVEVEXG5cdFx0XHRjIC89IDEwMFxuXHRcdFx0bSAvPSAxMDBcblx0XHRcdHkgLz0gMTAwXG5cdFx0XHRrIC89IDEwMFxuXHRcdFx0XG5cdFx0XHRAciA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgYyAqICgxIC0gaykgKyBrKSlcblx0XHRcdEBnID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCBtICogKDEgLSBrKSArIGspKVxuXHRcdFx0QGIgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIHkgKiAoMSAtIGspICsgaykpXG5cdFx0ZWxzZVxuXHRcdFx0IyBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRFxuXHRcdFx0aWYgQGw/IGFuZCBAYT8gYW5kIEBiP1xuXHRcdFx0XHQjIHdoaXRlID1cblx0XHRcdFx0IyBcdHg6IDk1LjA0N1xuXHRcdFx0XHQjIFx0eTogMTAwLjAwMFxuXHRcdFx0XHQjIFx0ejogMTA4Ljg4M1xuXHRcdFx0XHRcblx0XHRcdFx0eHl6ID1cblx0XHRcdFx0XHR5OiAocmF3LmwgKyAxNikgLyAxMTZcblx0XHRcdFx0eHl6LnggPSByYXcuYSAvIDUwMCArIHh5ei55XG5cdFx0XHRcdHh5ei56ID0geHl6LnkgLSByYXcuYiAvIDIwMFxuXHRcdFx0XHRcblx0XHRcdFx0Zm9yIF8gaW4gXCJ4eXpcIlxuXHRcdFx0XHRcdHBvd2VkID0gTWF0aC5wb3coeHl6W19dLCAzKVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmIHBvd2VkID4gMC4wMDg4NTZcblx0XHRcdFx0XHRcdHh5eltfXSA9IHBvd2VkXG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0eHl6W19dID0gKHh5eltfXSAtIDE2IC8gMTE2KSAvIDcuNzg3XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0I3h5eltfXSA9IF9yb3VuZCh4eXpbX10gKiB3aGl0ZVtfXSlcblx0XHRcdFx0XG5cdFx0XHQjIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEXG5cdFx0XHRpZiBAeD8gYW5kIEB5PyBhbmQgQHo/XG5cdFx0XHRcdHh5eiA9XG5cdFx0XHRcdFx0eDogcmF3LnggLyAxMDBcblx0XHRcdFx0XHR5OiByYXcueSAvIDEwMFxuXHRcdFx0XHRcdHo6IHJhdy56IC8gMTAwXG5cdFx0XHRcdFxuXHRcdFx0XHRyZ2IgPVxuXHRcdFx0XHRcdHI6IHh5ei54ICogMy4yNDA2ICsgeHl6LnkgKiAtMS41MzcyICsgeHl6LnogKiAtMC40OTg2XG5cdFx0XHRcdFx0ZzogeHl6LnggKiAtMC45Njg5ICsgeHl6LnkgKiAxLjg3NTggKyB4eXoueiAqIDAuMDQxNVxuXHRcdFx0XHRcdGI6IHh5ei54ICogMC4wNTU3ICsgeHl6LnkgKiAtMC4yMDQwICsgeHl6LnogKiAxLjA1NzBcblx0XHRcdFx0XG5cdFx0XHRcdGZvciBfIGluIFwicmdiXCJcblx0XHRcdFx0XHQjcmdiW19dID0gX3JvdW5kKHJnYltfXSlcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRpZiByZ2JbX10gPCAwXG5cdFx0XHRcdFx0XHRyZ2JbX10gPSAwXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgcmdiW19dID4gMC4wMDMxMzA4XG5cdFx0XHRcdFx0XHRyZ2JbX10gPSAxLjA1NSAqIE1hdGgucG93KHJnYltfXSwgKDEgLyAyLjQpKSAtIDAuMDU1XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0cmdiW19dICo9IDEyLjkyXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0I3JnYltfXSA9IE1hdGgucm91bmQocmdiW19dICogMjU1KVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJDb2xvciBjb25zdHJ1Y3RvciBtdXN0IGJlIGNhbGxlZCB3aXRoIHtyLGcsYn0gb3Ige2gscyx2fSBvciB7aCxzLGx9IG9yIHtjLG0seSxrfSBvciB7eCx5LHp9IG9yIHtsLGEsYn0sXG5cdFx0XHRcdFx0I3tcblx0XHRcdFx0XHRcdHRyeVxuXHRcdFx0XHRcdFx0XHRcImdvdCAje0pTT04uc3RyaW5naWZ5KG9wdGlvbnMpfVwiXG5cdFx0XHRcdFx0XHRjYXRjaFxuXHRcdFx0XHRcdFx0XHRcImdvdCBzb21ldGhpbmcgdGhhdCBjb3VsZG4ndCBiZSBkaXNwbGF5ZWQgd2l0aCBKU09OLnN0cmluZ2lmeSBmb3IgdGhpcyBlcnJvciBtZXNzYWdlXCJcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFwiXG5cdFx0XG5cdFxuXHR0b1N0cmluZzogLT5cblx0XHRpZiBAcj9cblx0XHRcdCMgUmVkIEdyZWVuIEJsdWVcblx0XHRcdGlmIEBhPyAjIEFscGhhXG5cdFx0XHRcdFwicmdiYSgje0ByfSwgI3tAZ30sICN7QGJ9LCAje0BhfSlcIlxuXHRcdFx0ZWxzZSAjIE9wYXF1ZVxuXHRcdFx0XHRcInJnYigje0ByfSwgI3tAZ30sICN7QGJ9KVwiXG5cdFx0ZWxzZSBpZiBAaD9cblx0XHRcdCMgSHVlIFNhdHVyYXRpb24gTGlnaHRuZXNzXG5cdFx0XHQjIChBc3N1bWUgaDowLTM2MCwgczowLTEwMCwgbDowLTEwMClcblx0XHRcdGlmIEBhPyAjIEFscGhhXG5cdFx0XHRcdFwiaHNsYSgje0BofSwgI3tAc30lLCAje0BsfSUsICN7QGF9KVwiXG5cdFx0XHRlbHNlICMgT3BhcXVlXG5cdFx0XHRcdFwiaHNsKCN7QGh9LCAje0BzfSUsICN7QGx9JSlcIlxuXHRcblx0aXM6IChjb2xvciktPlxuXHRcdCMgY29tcGFyZSBhcyBzdHJpbmdzXG5cdFx0XCIje0B9XCIgaXMgXCIje2NvbG9yfVwiXG4iLCJcbkNvbG9yID0gcmVxdWlyZSBcIi4vQ29sb3JcIlxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBQYWxldHRlIGV4dGVuZHMgQXJyYXlcblx0XG5cdGNvbnN0cnVjdG9yOiAoYXJncy4uLiktPlxuXHRcdHN1cGVyKGFyZ3MuLi4pXG5cdFxuXHRhZGQ6IChvKS0+XG5cdFx0bmV3X2NvbG9yID0gbmV3IENvbG9yKG8pXG5cdFx0QHB1c2ggbmV3X2NvbG9yXG5cdFxuXHRmaW5hbGl6ZTogLT5cblx0XHQjIFRPRE86IGdldCB0aGlzIHdvcmtpbmcgcHJvcGVybHkgYW5kIGVuYWJsZVxuXHRcdCMgaWYgbm90IEBudW1iZXJPZkNvbHVtbnNcblx0XHQjIFx0QGd1ZXNzX2RpbWVuc2lvbnMoKVxuXHRcdHVubGVzcyBAcGFyZW50UGFsZXR0ZVdpdGhvdXREdXBsaWNhdGVzXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXMgPSBuZXcgUGFsZXR0ZVxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzLnBhcmVudFBhbGV0dGVXaXRob3V0RHVwbGljYXRlcyA9IEBcblx0XHRcdEB3aXRoRHVwbGljYXRlc1tpXSA9IEBbaV0gZm9yIGkgaW4gWzAuLi5AbGVuZ3RoXVxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzLm51bWJlck9mQ29sdW1ucyA9IEBudW1iZXJPZkNvbHVtbnNcblx0XHRcdEB3aXRoRHVwbGljYXRlcy5nZW9tZXRyeVNwZWNpZmllZEJ5RmlsZSA9IEBnZW9tZXRyeVNwZWNpZmllZEJ5RmlsZVxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzLmZpbmFsaXplKClcblxuXHRcdFx0IyBpbi1wbGFjZSB1bmlxdWlmeVxuXHRcdFx0aSA9IDBcblx0XHRcdHdoaWxlIGkgPCBAbGVuZ3RoXG5cdFx0XHRcdGlfY29sb3IgPSBAW2ldXG5cdFx0XHRcdGogPSBpICsgMVxuXHRcdFx0XHR3aGlsZSBqIDwgQGxlbmd0aFxuXHRcdFx0XHRcdGpfY29sb3IgPSBAW2pdXG5cdFx0XHRcdFx0aWYgaV9jb2xvci5pcyBqX2NvbG9yXG5cdFx0XHRcdFx0XHRALnNwbGljZShqLCAxKVxuXHRcdFx0XHRcdFx0aiAtPSAxXG5cdFx0XHRcdFx0aiArPSAxXG5cdFx0XHRcdGkgKz0gMVxuXG5cdCMjI1xuXHRndWVzc19kaW1lbnNpb25zOiAtPlxuXHRcdCMgVE9ETzogZ2V0IHRoaXMgd29ya2luZyBwcm9wZXJseSBhbmQgZW5hYmxlXG5cblx0XHRsZW4gPSBAbGVuZ3RoXG5cdFx0Y2FuZGlkYXRlX2RpbWVuc2lvbnMgPSBbXVxuXHRcdGZvciBudW1iZXJPZkNvbHVtbnMgaW4gWzAuLmxlbl1cblx0XHRcdG5fcm93cyA9IGxlbiAvIG51bWJlck9mQ29sdW1uc1xuXHRcdFx0aWYgbl9yb3dzIGlzIE1hdGgucm91bmQgbl9yb3dzXG5cdFx0XHRcdGNhbmRpZGF0ZV9kaW1lbnNpb25zLnB1c2ggW25fcm93cywgbnVtYmVyT2ZDb2x1bW5zXVxuXHRcdFxuXHRcdHNxdWFyZXN0ID0gWzAsIDM0OTUwOTNdXG5cdFx0Zm9yIGNkIGluIGNhbmRpZGF0ZV9kaW1lbnNpb25zXG5cdFx0XHRpZiBNYXRoLmFicyhjZFswXSAtIGNkWzFdKSA8IE1hdGguYWJzKHNxdWFyZXN0WzBdIC0gc3F1YXJlc3RbMV0pXG5cdFx0XHRcdHNxdWFyZXN0ID0gY2Rcblx0XHRcblx0XHRAbnVtYmVyT2ZDb2x1bW5zID0gc3F1YXJlc3RbMV1cblx0IyMjXG4iLCIjIExvYWQgYW4gQWRvYmUgQ29sb3IgVGFibGUgZmlsZSAoLmFjdClcblxuIyMjXG5cIlRoZXJlIGlzIG5vIHZlcnNpb24gbnVtYmVyIHdyaXR0ZW4gaW4gdGhlIGZpbGUuXG5UaGUgZmlsZSBpcyA3Njggb3IgNzcyIGJ5dGVzIGxvbmcgYW5kIGNvbnRhaW5zIDI1NiBSR0IgY29sb3JzLlxuVGhlIGZpcnN0IGNvbG9yIGluIHRoZSB0YWJsZSBpcyBpbmRleCB6ZXJvLlxuVGhlcmUgYXJlIHRocmVlIGJ5dGVzIHBlciBjb2xvciBpbiB0aGUgb3JkZXIgcmVkLCBncmVlbiwgYmx1ZS5cbklmIHRoZSBmaWxlIGlzIDc3MiBieXRlcyBsb25nIHRoZXJlIGFyZSA0IGFkZGl0aW9uYWwgYnl0ZXMgcmVtYWluaW5nLlxuXHRUd28gYnl0ZXMgZm9yIHRoZSBudW1iZXIgb2YgY29sb3JzIHRvIHVzZS5cblx0VHdvIGJ5dGVzIGZvciB0aGUgY29sb3IgaW5kZXggd2l0aCB0aGUgdHJhbnNwYXJlbmN5IGNvbG9yIHRvIHVzZS5cIlxuXG5odHRwczovL3d3dy5hZG9iZS5jb20vZGV2bmV0LWFwcHMvcGhvdG9zaG9wL2ZpbGVmb3JtYXRhc2h0bWwvIzUwNTc3NDExX3BnZklkLTEwNzA2MjZcbiMjI1xuXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXG5cbm1vZHVsZS5leHBvcnRzID1cbmxvYWRfYWRvYmVfY29sb3JfdGFibGUgPSAoe2RhdGEsIGZpbGVFeHR9KS0+XG5cblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXG5cdFxuXHR1bmxlc3MgKFxuXHRcdGJyLmdldFNpemUoKSBpbiBbNzY4LCA3NzJdIG9yXG5cdFx0ZmlsZUV4dCBpcyBcImFjdFwiICMgYmVjYXVzZSBcIkZpcmV3b3JrcyBjYW4gcmVhZCBBQ1QgZmlsZXMgYmlnZ2VyIHRoYW4gNzY4IGJ5dGVzXCJcblx0KVxuXHRcdHRocm93IG5ldyBFcnJvciBcImZpbGUgc2l6ZSBtdXN0IGJlIDc2OCBvciA3NzIgYnl0ZXMgKHNhdyAje2JyLmdldFNpemUoKX0pLCBPUiBmaWxlIGV4dGVuc2lvbiBtdXN0IGJlICcuYWN0JyAoc2F3ICcuI3tmaWxlRXh0fScpXCJcblx0XG5cdGZvciBbMC4uLjI1Nl1cblx0XHRwYWxldHRlLmFkZFxuXHRcdFx0cjogYnIucmVhZFVJbnQ4KClcblx0XHRcdGc6IGJyLnJlYWRVSW50OCgpXG5cdFx0XHRiOiBici5yZWFkVUludDgoKVxuXHRcblx0cGFsZXR0ZS5udW1iZXJPZkNvbHVtbnMgPSAxNiAjIGNvbmZpZ3VyYWJsZSBpbiBQaG90b3Nob3AsIGJ1dCB0aGlzIGlzIHRoZSBkZWZhdWx0IHZpZXcsIGFuZCBmb3IgaW5zdGFuY2UgVmlzaWJvbmUgYW5kIHRoZSBkZWZhdWx0IHN3YXRjaGVzIHJlbHkgb24gdGhpcyBsYXlvdXRcblxuXHRwYWxldHRlXG4iLCJcbiMgRGV0ZWN0IENTUyBjb2xvcnMgKGV4Y2VwdCBuYW1lZCBjb2xvcnMpXG5cblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXG5cbiMgVE9ETzogZGV0ZWN0IG5hbWVzIHZpYSBzdHJ1Y3R1cmVzIGxpa2UgQ1NTIHZhcmlhYmxlcywgSlNPTiBvYmplY3Qga2V5cy92YWx1ZXMsIGNvbW1lbnRzXG4jIFRPRE86IHVzZSBhbGwgY29sb3JzIHJlZ2FyZGxlc3Mgb2YgZm9ybWF0LCB3aXRoaW4gYSBkZXRlY3RlZCBzdHJ1Y3R1cmUsIG9yIG1heWJlIGFsd2F5c1xuXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cblx0XG5cdG5fY29udHJvbF9jaGFyYWN0ZXJzID0gMFxuXHRmb3IgY2hhciBpbiBkYXRhXG5cdFx0aWYgY2hhciBpbiBbXG5cdFx0XHRcIlxceDAwXCIsIFwiXFx4MDFcIiwgXCJcXHgwMlwiLCBcIlxceDAzXCIsIFwiXFx4MDRcIiwgXCJcXHgwNVwiLCBcIlxceDA2XCIsIFwiXFx4MDdcIiwgXCJcXHgwOFwiXG5cdFx0XHRcIlxceDBCXCIsIFwiXFx4MENcIlxuXHRcdFx0XCJcXHgwRVwiLCBcIlxceDBGXCIsIFwiXFx4MTBcIiwgXCJcXHgxMVwiLCBcIlxceDEyXCIsIFwiXFx4MTNcIiwgXCJcXHgxNFwiLCBcIlxceDE1XCIsIFwiXFx4MTZcIiwgXCJcXHgxN1wiLCBcIlxceDE4XCIsIFwiXFx4MTlcIiwgXCJcXHgxQVwiLCBcIlxceDFCXCIsIFwiXFx4MUNcIiwgXCJcXHgxRFwiLCBcIlxceDFFXCIsIFwiXFx4MUZcIiwgXCJcXHg3RlwiXG5cdFx0XVxuXHRcdFx0bl9jb250cm9sX2NoYXJhY3RlcnMrK1xuXHRpZiBuX2NvbnRyb2xfY2hhcmFjdGVycyA+IDVcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJsb29rcyBsaWtlIGEgYmluYXJ5IGZpbGVcIilcblxuXHRwYWxldHRlcyA9IFtcblx0XHRwYWxldHRlX2hleF9sb25nID0gbmV3IFBhbGV0dGUoKVxuXHRcdHBhbGV0dGVfaGV4X3Nob3J0ID0gbmV3IFBhbGV0dGUoKVxuXHRcdHBhbGV0dGVfcmdiID0gbmV3IFBhbGV0dGUoKVxuXHRcdHBhbGV0dGVfaHNsID0gbmV3IFBhbGV0dGUoKVxuXHRcdHBhbGV0dGVfaHNsYSA9IG5ldyBQYWxldHRlKClcblx0XHRwYWxldHRlX3JnYmEgPSBuZXcgUGFsZXR0ZSgpXG5cdF1cblx0XG5cdGhleCA9ICh4KS0+IHBhcnNlSW50KHgsIDE2KVxuXHRcblx0ZGF0YS5yZXBsYWNlIC8vL1xuXHRcdFxcIyAjIGhhc2h0YWcgIyAjL1xuXHRcdChcblx0XHRcdFswLTlBLUZdezN9ICMgdGhyZWUgaGV4LWRpZ2l0cyAoI0EwQylcblx0XHRcdHxcblx0XHRcdFswLTlBLUZdezZ9ICMgc2l4IGhleC1kaWdpdHMgKCNBQTAwQ0MpXG5cdFx0XHR8XG5cdFx0XHRbMC05QS1GXXs0fSAjIHdpdGggYWxwaGEsIGZvdXIgaGV4LWRpZ2l0cyAoI0EwQ0YpXG5cdFx0XHR8XG5cdFx0XHRbMC05QS1GXXs4fSAjIHdpdGggYWxwaGEsIGVpZ2h0IGhleC1kaWdpdHMgKCNBQTAwQ0NGRilcblx0XHQpXG5cdFx0KD8hWzAtOUEtRl0pICMgKGFuZCBubyBtb3JlISlcblx0Ly8vZ2ltLCAobSwgJDEpLT5cblx0XHRpZiAkMS5sZW5ndGggPiA0XG5cdFx0XHRwYWxldHRlX2hleF9sb25nLmFkZFxuXHRcdFx0XHRyOiBoZXggJDFbMF0gKyAkMVsxXVxuXHRcdFx0XHRnOiBoZXggJDFbMl0gKyAkMVszXVxuXHRcdFx0XHRiOiBoZXggJDFbNF0gKyAkMVs1XVxuXHRcdFx0XHRhOiBpZiAkMS5sZW5ndGggaXMgOCB0aGVuIGhleCAkMVs2XSArICQxWzddIGVsc2UgMVxuXHRcdGVsc2Vcblx0XHRcdHBhbGV0dGVfaGV4X3Nob3J0LmFkZFxuXHRcdFx0XHRyOiBoZXggJDFbMF0gKyAkMVswXVxuXHRcdFx0XHRnOiBoZXggJDFbMV0gKyAkMVsxXVxuXHRcdFx0XHRiOiBoZXggJDFbMl0gKyAkMVsyXVxuXHRcdFx0XHRhOiBpZiAkMS5sZW5ndGggaXMgNCB0aGVuIGhleCAkMVszXSArICQxWzNdIGVsc2UgMVxuXHRcblx0ZGF0YS5yZXBsYWNlIC8vL1xuXHRcdHJnYlxcKFxuXHRcdFx0XFxzKlxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgcmVkXG5cdFx0XHQoJT8pXG5cdFx0XFxzKig/Oix8XFxzKVxccypcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGdyZWVuXG5cdFx0XHQoJT8pXG5cdFx0XFxzKig/Oix8XFxzKVxccypcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGJsdWVcblx0XHRcdCglPylcblx0XHRcdFxccypcblx0XHRcXClcblx0Ly8vZ2ltLCAoX20sIHJfdmFsLCByX3VuaXQsIGdfdmFsLCBnX3VuaXQsIGJfdmFsLCBiX3VuaXQpLT5cblx0XHRwYWxldHRlX3JnYi5hZGRcblx0XHRcdHI6IE51bWJlcihyX3ZhbCkgKiAoaWYgcl91bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXG5cdFx0XHRnOiBOdW1iZXIoZ192YWwpICogKGlmIGdfdW5pdCBpcyBcIiVcIiB0aGVuIDI1NS8xMDAgZWxzZSAxKVxuXHRcdFx0YjogTnVtYmVyKGJfdmFsKSAqIChpZiBiX3VuaXQgaXMgXCIlXCIgdGhlbiAyNTUvMTAwIGVsc2UgMSlcblx0XG5cdGRhdGEucmVwbGFjZSAvLy9cblx0XHRyZ2JhP1xcKFxuXHRcdFx0XFxzKlxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgcmVkXG5cdFx0XHQoJT8pXG5cdFx0XFxzKig/Oix8XFxzKVxccypcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGdyZWVuXG5cdFx0XHQoJT8pXG5cdFx0XFxzKig/Oix8XFxzKVxccypcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGJsdWVcblx0XHRcdCglPylcblx0XHRcXHMqKD86LHwvKVxccypcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGFscGhhXG5cdFx0XHQoJT8pXG5cdFx0XHRcXHMqXG5cdFx0XFwpXG5cdC8vL2dpbSwgKF9tLCByX3ZhbCwgcl91bml0LCBnX3ZhbCwgZ191bml0LCBiX3ZhbCwgYl91bml0LCBhX3ZhbCwgYV91bml0KS0+XG5cdFx0cGFsZXR0ZV9yZ2JhLmFkZFxuXHRcdFx0cjogTnVtYmVyKHJfdmFsKSAqIChpZiByX3VuaXQgaXMgXCIlXCIgdGhlbiAyNTUvMTAwIGVsc2UgMSlcblx0XHRcdGc6IE51bWJlcihnX3ZhbCkgKiAoaWYgZ191bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXG5cdFx0XHRiOiBOdW1iZXIoYl92YWwpICogKGlmIGJfdW5pdCBpcyBcIiVcIiB0aGVuIDI1NS8xMDAgZWxzZSAxKVxuXHRcdFx0YTogTnVtYmVyKGFfdmFsKSAqIChpZiBhX3VuaXQgaXMgXCIlXCIgdGhlbiAxLzEwMCBlbHNlIDEpXG5cdFxuXHRkYXRhLnJlcGxhY2UgLy8vXG5cdFx0aHNsXFwoXG5cdFx0XHRcXHMqXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBodWVcblx0XHRcdChkZWd8cmFkfHR1cm58KVxuXHRcdFxccyooPzosfFxccylcXHMqXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBzYXR1cmF0aW9uXG5cdFx0XHQoJT8pXG5cdFx0XFxzKig/Oix8XFxzKVxccypcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHZhbHVlXG5cdFx0XHQoJT8pXG5cdFx0XHRcXHMqXG5cdFx0XFwpXG5cdC8vL2dpbSwgKF9tLCBoX3ZhbCwgaF91bml0LCBzX3ZhbCwgc191bml0LCBsX3ZhbCwgbF91bml0KS0+XG5cdFx0cGFsZXR0ZV9oc2wuYWRkXG5cdFx0XHRoOiBOdW1iZXIoaF92YWwpICogKGlmIGhfdW5pdCBpcyBcInJhZFwiIHRoZW4gMTgwL01hdGguUEkgZWxzZSBpZiBoX3VuaXQgaXMgXCJ0dXJuXCIgdGhlbiAzNjAgZWxzZSAxKVxuXHRcdFx0czogTnVtYmVyKHNfdmFsKSAqIChpZiBzX3VuaXQgaXMgXCIlXCIgdGhlbiAxIGVsc2UgMTAwKVxuXHRcdFx0bDogTnVtYmVyKGxfdmFsKSAqIChpZiBsX3VuaXQgaXMgXCIlXCIgdGhlbiAxIGVsc2UgMTAwKVxuXHRcblx0ZGF0YS5yZXBsYWNlIC8vL1xuXHRcdGhzbGE/XFwoXG5cdFx0XHRcXHMqXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBodWVcblx0XHRcdChkZWd8cmFkfHR1cm58KVxuXHRcdFxccyooPzosfFxccylcXHMqXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBzYXR1cmF0aW9uXG5cdFx0XHQoJT8pXG5cdFx0XFxzKig/Oix8XFxzKVxccypcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHZhbHVlXG5cdFx0XHQoJT8pXG5cdFx0XFxzKig/Oix8LylcXHMqXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBhbHBoYVxuXHRcdFx0KCU/KVxuXHRcdFx0XFxzKlxuXHRcdFxcKVxuXHQvLy9naW0sIChfbSwgaF92YWwsIGhfdW5pdCwgc192YWwsIHNfdW5pdCwgbF92YWwsIGxfdW5pdCwgYV92YWwsIGFfdW5pdCktPlxuXHRcdHBhbGV0dGVfaHNsYS5hZGRcblx0XHRcdGg6IE51bWJlcihoX3ZhbCkgKiAoaWYgaF91bml0IGlzIFwicmFkXCIgdGhlbiAxODAvTWF0aC5QSSBlbHNlIGlmIGhfdW5pdCBpcyBcInR1cm5cIiB0aGVuIDM2MCBlbHNlIDEpXG5cdFx0XHRzOiBOdW1iZXIoc192YWwpICogKGlmIHNfdW5pdCBpcyBcIiVcIiB0aGVuIDEgZWxzZSAxMDApXG5cdFx0XHRsOiBOdW1iZXIobF92YWwpICogKGlmIGxfdW5pdCBpcyBcIiVcIiB0aGVuIDEgZWxzZSAxMDApXG5cdFx0XHRhOiBOdW1iZXIoYV92YWwpICogKGlmIGFfdW5pdCBpcyBcIiVcIiB0aGVuIDEvMTAwIGVsc2UgMSlcblx0XG5cdG1vc3RfY29sb3JzID0gW11cblx0Zm9yIHBhbGV0dGUgaW4gcGFsZXR0ZXNcblx0XHRpZiBwYWxldHRlLmxlbmd0aCA+PSBtb3N0X2NvbG9ycy5sZW5ndGhcblx0XHRcdG1vc3RfY29sb3JzID0gcGFsZXR0ZVxuXHRcblx0biA9IG1vc3RfY29sb3JzLmxlbmd0aFxuXHRpZiBuIDwgNFxuXHRcdHRocm93IG5ldyBFcnJvcihbXG5cdFx0XHRcIk5vIGNvbG9ycyBmb3VuZFwiXG5cdFx0XHRcIk9ubHkgb25lIGNvbG9yIGZvdW5kXCJcblx0XHRcdFwiT25seSBhIGNvdXBsZSBjb2xvcnMgZm91bmRcIlxuXHRcdFx0XCJPbmx5IGEgZmV3IGNvbG9ycyBmb3VuZFwiXG5cdFx0XVtuXSArIFwiICgje259KVwiKVxuXHRcblx0bW9zdF9jb2xvcnNcbiIsIlxuIyBMb2FkIGEgQ29sb3JTY2hlbWVyIHBhbGV0dGUgKC5jcylcblxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxuXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YSwgZmlsZUV4dH0pLT5cblxuXHRpZiBmaWxlRXh0IGlzbnQgXCJjc1wiXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiQ29sb3JTY2hlbWVyIGxvYWRlciBpcyBvbmx5IGVuYWJsZWQgd2hlbiBmaWxlIGV4dGVuc2lvbiBpcyAnLmNzJyAoc2F3ICcuI3tmaWxlRXh0fScgaW5zdGVhZClcIilcblx0XG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxuXHRcblx0dmVyc2lvbiA9IGJyLnJlYWRVSW50MTYoKSAjIG9yIHNvbWV0aGluZ1xuXHRjb2xvcl9jb3VudCA9IGJyLnJlYWRVSW50MTYoKVxuXHRmb3IgaSBpbiBbMC4uLmNvbG9yX2NvdW50XVxuXHRcdGJyLnNlZWsoOCArIGkgKiAyNilcblx0XHRwYWxldHRlLmFkZFxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxuXG5cdHBhbGV0dGVcblxuIiwiXG4jIExvYWQgYSBHSU1QIHBhbGV0dGUgKC5ncGwpLCBhbHNvIHVzZWQgYnkgb3Igc3VwcG9ydGVkIGJ5IG1hbnkgcHJvZ3JhbXMsIHN1Y2ggYXMgSW5rc2NhcGUsIEtyaXRhLFxuXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxuXG5wYXJzZV9naW1wX29yX2tkZV9yZ2JfcGFsZXR0ZSA9IChkYXRhLCBmb3JtYXRfbmFtZSktPlxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxuXHRpZiBsaW5lc1swXSBpc250IGZvcm1hdF9uYW1lXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiTm90IGEgI3tmb3JtYXRfbmFtZX1cIlxuXHRcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcblx0aSA9IDBcblx0IyBzdGFydHMgYXQgaSA9IDEgYmVjYXVzZSB0aGUgaW5jcmVtZW50IGhhcHBlbnMgYXQgdGhlIHN0YXJ0IG9mIHRoZSBsb29wXG5cdHdoaWxlIChpICs9IDEpIDwgbGluZXMubGVuZ3RoXG5cdFx0bGluZSA9IGxpbmVzW2ldXG5cdFx0XG5cdFx0aWYgbGluZVswXSBpcyBcIiNcIiBvciBsaW5lIGlzIFwiXCIgdGhlbiBjb250aW51ZVxuXHRcdCMgVE9ETzogaGFuZGxlIG5vbi1zdGFydC1vZi1saW5lIGNvbW1lbnRzPyB3aGVyZSdzIHRoZSBzcGVjP1xuXHRcdFxuXHRcdG0gPSBsaW5lLm1hdGNoKC9OYW1lOlxccyooLiopLylcblx0XHRpZiBtXG5cdFx0XHRwYWxldHRlLm5hbWUgPSBtWzFdXG5cdFx0XHRjb250aW51ZVxuXHRcdG0gPSBsaW5lLm1hdGNoKC9Db2x1bW5zOlxccyooLiopLylcblx0XHRpZiBtXG5cdFx0XHRwYWxldHRlLm51bWJlck9mQ29sdW1ucyA9IE51bWJlcihtWzFdKVxuXHRcdFx0IyBUT0RPOiBoYW5kbGUgMCBhcyBub3Qgc3BlY2lmaWVkPyB3aGVyZSdzIHRoZSBzcGVjIGF0LCB5bz9cblx0XHRcdHBhbGV0dGUuZ2VvbWV0cnlTcGVjaWZpZWRCeUZpbGUgPSB5ZXNcblx0XHRcdGNvbnRpbnVlXG5cdFx0XG5cdFx0IyBUT0RPOiByZXBsYWNlIFxccyB3aXRoIFtcXCBcXHRdIChzcGFjZXMgb3IgdGFicylcblx0XHQjIGl0IGNhbid0IG1hdGNoIFxcbiBiZWNhdXNlIGl0J3MgYWxyZWFkeSBzcGxpdCBvbiB0aGF0LCBidXQgc3RpbGxcblx0XHQjIFRPRE86IGhhbmRsZSBsaW5lIHdpdGggbm8gbmFtZSBidXQgc3BhY2Ugb24gdGhlIGVuZFxuXHRcdHJfZ19iX25hbWUgPSBsaW5lLm1hdGNoKC8vL1xuXHRcdFx0XiAjIFwiYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgbGluZSxcIlxuXHRcdFx0XFxzKiAjIFwiZ2l2ZSBvciB0YWtlIHNvbWUgc3BhY2VzLFwiXG5cdFx0XHQjIG1hdGNoIDMgZ3JvdXBzIG9mIG51bWJlcnMgc2VwYXJhdGVkIGJ5IHNwYWNlc1xuXHRcdFx0KFswLTldKykgIyByZWRcblx0XHRcdFxccytcblx0XHRcdChbMC05XSspICMgZ3JlZW5cblx0XHRcdFxccytcblx0XHRcdChbMC05XSspICMgYmx1ZVxuXHRcdFx0KD86XG5cdFx0XHRcdFxccytcblx0XHRcdFx0KC4qKSAjIG9wdGlvbmFsbHkgYSBuYW1lXG5cdFx0XHQpP1xuXHRcdFx0JCAjIFwiYW5kIHRoYXQgc2hvdWxkIGJlIHRoZSBlbmQgb2YgdGhlIGxpbmVcIlxuXHRcdC8vLylcblx0XHRpZiBub3Qgcl9nX2JfbmFtZVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiTGluZSAje2l9IGRvZXNuJ3QgbWF0Y2ggcGF0dGVybiAje3JfZ19iX25hbWV9XCIgIyBUT0RPOiBiZXR0ZXIgbWVzc2FnZT9cblx0XHRcblx0XHRwYWxldHRlLmFkZFxuXHRcdFx0cjogcl9nX2JfbmFtZVsxXVxuXHRcdFx0Zzogcl9nX2JfbmFtZVsyXVxuXHRcdFx0Yjogcl9nX2JfbmFtZVszXVxuXHRcdFx0bmFtZTogcl9nX2JfbmFtZVs0XVxuXHRcdFxuXHRwYWxldHRlXG5cbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxuXHRwYXJzZV9naW1wX29yX2tkZV9yZ2JfcGFsZXR0ZShkYXRhLCBcIkdJTVAgUGFsZXR0ZVwiKVxuXG5tb2R1bGUuZXhwb3J0cy5wYXJzZV9naW1wX29yX2tkZV9yZ2JfcGFsZXR0ZSA9IHBhcnNlX2dpbXBfb3Jfa2RlX3JnYl9wYWxldHRlXG4iLCIjIExvYWQgYW4gQWxsYWlyZSBIb21lc2l0ZSAvIE1hY3JvbWVkaWEgQ29sZEZ1c2lvbiBwYWxldHRlICguaHBsKVxuXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxuXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcblx0aWYgbGluZXNbMF0gaXNudCBcIlBhbGV0dGVcIlxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhIEhvbWVzaXRlIHBhbGV0dGVcIlxuXHRpZiBub3QgbGluZXNbMV0ubWF0Y2ggL1ZlcnNpb24gWzM0XVxcLjAvXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiVW5zdXBwb3J0ZWQgSG9tZXNpdGUgcGFsZXR0ZSB2ZXJzaW9uXCJcblx0XG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXG5cdFxuXHRmb3IgbGluZSwgaSBpbiBsaW5lc1xuXHRcdGlmIGxpbmUubWF0Y2ggLy4rIC4rIC4rL1xuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcblx0XHRcdHBhbGV0dGUuYWRkXG5cdFx0XHRcdHI6IHJnYlswXVxuXHRcdFx0XHRnOiByZ2JbMV1cblx0XHRcdFx0YjogcmdiWzJdXG5cdFxuXHRwYWxldHRlXG4iLCJcbiMgTG9hZCBhIEtERSBSR0IgUGFsZXR0ZSAvIEtvbG91clBhaW50IC8gS09mZmljZSBwYWxldHRlICguY29sb3JzKVxuXG57cGFyc2VfZ2ltcF9vcl9rZGVfcmdiX3BhbGV0dGV9ID0gcmVxdWlyZSBcIi4vR0lNUFwiXG5cbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxuXHRwYXJzZV9naW1wX29yX2tkZV9yZ2JfcGFsZXR0ZShkYXRhLCBcIktERSBSR0IgUGFsZXR0ZVwiKVxuIiwiXG4jIExvYWQgYSBQYWludC5ORVQgcGFsZXR0ZSBmaWxlICgudHh0KVxuXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxuXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cblx0XG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXG5cdFxuXHRoZXggPSAoeCktPiBwYXJzZUludCh4LCAxNilcblx0XG5cdGZvciBsaW5lIGluIGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxuXHRcdG0gPSBsaW5lLm1hdGNoKC9eKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KSQvaSlcblx0XHRpZiBtIHRoZW4gcGFsZXR0ZS5hZGRcblx0XHRcdGE6IGhleCBtWzFdXG5cdFx0XHRyOiBoZXggbVsyXVxuXHRcdFx0ZzogaGV4IG1bM11cblx0XHRcdGI6IGhleCBtWzRdXG5cdFxuXHRwYWxldHRlXG4iLCJcbiMgTG9hZCBhIEpBU0MgUEFMIGZpbGUgKFBhaW50IFNob3AgUHJvIHBhbGV0dGUgZmlsZSkgKC5wYWwpXG5cblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXG5cbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxuXHRpZiBsaW5lc1swXSBpc250IFwiSkFTQy1QQUxcIlxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhIEpBU0MtUEFMXCJcblx0aWYgbGluZXNbMV0gaXNudCBcIjAxMDBcIlxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVua25vd24gSkFTQy1QQUwgdmVyc2lvblwiXG5cdCMgaWYgbGluZXNbMl0gaXNudCBcIjI1NlwiXG5cdCMgXHRcInRoYXQncyBva1wiXG5cdFxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxuXHQjbl9jb2xvcnMgPSBOdW1iZXIobGluZXNbMl0pXG5cdFxuXHRmb3IgbGluZSwgaSBpbiBsaW5lc1xuXHRcdGlmIGxpbmUgaXNudCBcIlwiIGFuZCBpID4gMlxuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcblx0XHRcdHBhbGV0dGUuYWRkXG5cdFx0XHRcdHI6IHJnYlswXVxuXHRcdFx0XHRnOiByZ2JbMV1cblx0XHRcdFx0YjogcmdiWzJdXG5cdFxuXHRwYWxldHRlXG4iLCJcbiMgTG9hZCBhIFJlc291cmNlIEludGVyY2hhbmdlIEZpbGUgRm9ybWF0IFBhbGV0dGUgZmlsZSAoLnBhbClcblxuIyBwb3J0ZWQgZnJvbSBDIyBjb2RlIGF0IGh0dHBzOi8vd29ybXMyZC5pbmZvL1BhbGV0dGVfZmlsZVxuXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXG5cbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcblx0XG5cdCMgUklGRiBoZWFkZXJcblx0cmlmZiA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcIlJJRkZcIlxuXHRkYXRhU2l6ZSA9IGJyLnJlYWRVSW50MzIoKVxuXHR0eXBlID0gYnIucmVhZFN0cmluZyg0KSAjIFwiUEFMIFwiXG5cdFxuXHRpZiByaWZmIGlzbnQgXCJSSUZGXCJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJSSUZGIGhlYWRlciBub3QgZm91bmQ7IG5vdCBhIFJJRkYgUEFMIGZpbGVcIlxuXHRcblx0aWYgdHlwZSBpc250IFwiUEFMIFwiXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiXCJcIlxuXHRcdFx0UklGRiBoZWFkZXIgc2F5cyB0aGlzIGlzbid0IGEgUEFMIGZpbGUsXG5cdFx0XHRtb3JlIG9mIGEgc29ydCBvZiAjeygodHlwZStcIlwiKS50cmltKCkpfSBmaWxlXG5cdFx0XCJcIlwiXG5cdFxuXHQjIERhdGEgY2h1bmtcblx0Y2h1bmtUeXBlID0gYnIucmVhZFN0cmluZyg0KSAjIFwiZGF0YVwiXG5cdGNodW5rU2l6ZSA9IGJyLnJlYWRVSW50MzIoKVxuXHRwYWxWZXJzaW9uID0gYnIucmVhZFVJbnQxNigpICMgMHgwMzAwXG5cdHBhbE51bUVudHJpZXMgPSBici5yZWFkVUludDE2KClcblx0XG5cdFxuXHRpZiBjaHVua1R5cGUgaXNudCBcImRhdGFcIlxuXHRcdHRocm93IG5ldyBFcnJvciBcIkRhdGEgY2h1bmsgbm90IGZvdW5kICguLi4nI3tjaHVua1R5cGV9Jz8pXCJcblx0XG5cdGlmIHBhbFZlcnNpb24gaXNudCAweDAzMDBcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbnN1cHBvcnRlZCBQQUwgZmlsZSBmb3JtYXQgdmVyc2lvbjogMHgje3BhbFZlcnNpb24udG9TdHJpbmcoMTYpfVwiXG5cdFxuXHQjIENvbG9yc1xuXHRcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcblx0aSA9IDBcblx0d2hpbGUgKGkgKz0gMSkgPCBwYWxOdW1FbnRyaWVzIC0gMVxuXHRcdFxuXHRcdHBhbGV0dGUuYWRkXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXG5cdFx0XHRfOiBici5yZWFkQnl0ZSgpICMgXCJmbGFnc1wiLCBhbHdheXMgMHgwMFxuXHRcblx0cGFsZXR0ZVxuIiwiIyBMb2FkIHNLMSBwYWxldHRlcyAoLnNrcClcbiMgVGhlc2UgZmlsZXMgYXJlIGFjdHVhbGx5IGFwcGFyZW50bHkgcHl0aG9uIHNvdXJjZSBjb2RlLFxuIyBidXQgbGV0J3MganVzdCB0cnkgdG8gcGFyc2UgdGhlbSBpbiBhIGJhc2ljLCBub24tZ2VuZXJhbCB3YXlcblxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcblxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXG5cblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlXG5cblx0Zm5zID1cblx0XHRzZXRfbmFtZTogKG5hbWUpLT4gcGFsZXR0ZS5uYW1lID0gbmFtZVxuXHRcdGFkZF9jb21tZW50czogKGxpbmUpLT5cblx0XHRcdHBhbGV0dGUuZGVzY3JpcHRpb24gPz0gXCJcIlxuXHRcdFx0cGFsZXR0ZS5kZXNjcmlwdGlvbiArPSBsaW5lICsgXCJcXG5cIlxuXHRcdHNldF9jb2x1bW5zOiAoY29sdW1uc19zdHIpLT5cblx0XHRcdHBhbGV0dGUubnVtYmVyT2ZDb2x1bW5zID0gcGFyc2VJbnQoY29sdW1uc19zdHIpXG5cdFx0Y29sb3I6IChjb2xvcl9kZWZfc3RyKS0+XG5cdFx0XHRjb2xvcl9kZWYgPSBKU09OLnBhcnNlKGNvbG9yX2RlZl9zdHIucmVwbGFjZSgvXFxidShbJ1wiXSkvZywgXCIkMVwiKS5yZXBsYWNlKC8nL2csICdcIicpKVxuXHRcdFx0W2NvbG9yX3R5cGUsIGNvbXBvbmVudHMsIGFscGhhLCBuYW1lXSA9IGNvbG9yX2RlZlxuXHRcdFx0c3dpdGNoIGNvbG9yX3R5cGVcblx0XHRcdFx0d2hlbiBcIlJHQlwiXG5cdFx0XHRcdFx0cGFsZXR0ZS5hZGRcblx0XHRcdFx0XHRcdHI6IGNvbXBvbmVudHNbMF0gKiAyNTVcblx0XHRcdFx0XHRcdGc6IGNvbXBvbmVudHNbMV0gKiAyNTVcblx0XHRcdFx0XHRcdGI6IGNvbXBvbmVudHNbMl0gKiAyNTVcblx0XHRcdFx0XHRcdGE6IGFscGhhXG5cdFx0XHRcdHdoZW4gXCJHcmF5c2NhbGVcIlxuXHRcdFx0XHRcdHBhbGV0dGUuYWRkXG5cdFx0XHRcdFx0XHRyOiBjb21wb25lbnRzWzBdICogMjU1XG5cdFx0XHRcdFx0XHRnOiBjb21wb25lbnRzWzBdICogMjU1XG5cdFx0XHRcdFx0XHRiOiBjb21wb25lbnRzWzBdICogMjU1XG5cdFx0XHRcdFx0XHRhOiBhbHBoYVxuXHRcdFx0XHR3aGVuIFwiQ01ZS1wiXG5cdFx0XHRcdFx0cGFsZXR0ZS5hZGRcblx0XHRcdFx0XHRcdGM6IGNvbXBvbmVudHNbMF0gKiAxMDBcblx0XHRcdFx0XHRcdG06IGNvbXBvbmVudHNbMV0gKiAxMDBcblx0XHRcdFx0XHRcdHk6IGNvbXBvbmVudHNbMl0gKiAxMDBcblx0XHRcdFx0XHRcdGs6IGNvbXBvbmVudHNbM10gKiAxMDBcblx0XHRcdFx0XHRcdGE6IGFscGhhXG5cdFx0XHRcdHdoZW4gXCJIU0xcIlxuXHRcdFx0XHRcdHBhbGV0dGUuYWRkXG5cdFx0XHRcdFx0XHRoOiBjb21wb25lbnRzWzBdICogMzYwXG5cdFx0XHRcdFx0XHRzOiBjb21wb25lbnRzWzFdICogMTAwXG5cdFx0XHRcdFx0XHRsOiBjb21wb25lbnRzWzJdICogMTAwXG5cdFx0XHRcdFx0XHRhOiBhbHBoYVxuXHRcblx0Zm9yIGxpbmUgaW4gbGluZXNcblx0XHRtYXRjaCA9IGxpbmUubWF0Y2goLyhbXFx3X10rKVxcKCguKilcXCkvKVxuXHRcdGlmIG1hdGNoXG5cdFx0XHRbXywgZm5fbmFtZSwgYXJnc19zdHJdID0gbWF0Y2hcblx0XHRcdGZuc1tmbl9uYW1lXT8oYXJnc19zdHIpXG5cblx0biA9IHBhbGV0dGUubGVuZ3RoXG5cdGlmIG4gPCAyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFtcblx0XHRcdFwiTm8gY29sb3JzIGZvdW5kXCJcblx0XHRcdFwiT25seSBvbmUgY29sb3IgZm91bmRcIlxuXHRcdF1bbl0gKyBcIiAoI3tufSlcIilcblx0XG5cdHBhbGV0dGVcbiIsIlxuIyBMb2FkIGEgU2tlbmNpbCBwYWxldHRlICguc3BsKSAoXCJTa2V0Y2ggUkdCUGFsZXR0ZVwiKVxuIyBTa2VuY2lsIHdhcyBmb3JtZXJseSBjYWxsZWQgU2tldGNoLCBidXQgdGhpcyBpcyBub3QgcmVsYXRlZCB0byB0aGUgLnNrZXRjaHBhbGV0dGUgZm9ybWF0LlxuXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxuXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcblx0XG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXG5cdGkgPSAxXG5cdHdoaWxlIChpICs9IDEpIDwgbGluZXMubGVuZ3RoXG5cdFx0bGluZSA9IGxpbmVzW2ldXG5cdFx0XG5cdFx0aWYgbGluZVswXSBpcyBcIiNcIiBvciBsaW5lIGlzIFwiXCIgdGhlbiBjb250aW51ZVxuXHRcdCMgVE9ETzogaGFuZGxlIG5vbi1zdGFydC1vZi1saW5lIGNvbW1lbnRzPyB3aGVyZSdzIHRoZSBzcGVjP1xuXHRcdFxuXHRcdCMgVE9ETzogcmVwbGFjZSBcXHMgd2l0aCBbXFwgXFx0XSAoc3BhY2VzIG9yIHRhYnMpXG5cdFx0IyBpdCBjYW4ndCBtYXRjaCBcXG4gYmVjYXVzZSBpdCdzIGFscmVhZHkgc3BsaXQgb24gdGhhdCwgYnV0IHN0aWxsXG5cdFx0IyBUT0RPOiBoYW5kbGUgbGluZSB3aXRoIG5vIG5hbWUgYnV0IHNwYWNlIG9uIHRoZSBlbmRcblx0XHRyX2dfYl9uYW1lID0gbGluZS5tYXRjaCgvLy9cblx0XHRcdF4gIyBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaW5lLFxuXHRcdFx0XFxzKiAjIHBlcmhhcHMgd2l0aCBzb21lIGxlYWRpbmcgc3BhY2VzXG5cdFx0XHQjIG1hdGNoIDMgZ3JvdXBzIG9mIG51bWJlcnMgc2VwYXJhdGVkIGJ5IHNwYWNlc1xuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgcmVkXG5cdFx0XHRcXHMrXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBncmVlblxuXHRcdFx0XFxzK1xuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgYmx1ZVxuXHRcdFx0KD86XG5cdFx0XHRcdFxccytcblx0XHRcdFx0KC4qKSAjIG9wdGlvbmFsbHkgYSBuYW1lXG5cdFx0XHQpP1xuXHRcdFx0JCAjIFwiYW5kIHRoYXQgc2hvdWxkIGJlIHRoZSBlbmQgb2YgdGhlIGxpbmVcIlxuXHRcdC8vLylcblx0XHRpZiBub3Qgcl9nX2JfbmFtZVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiTGluZSAje2l9IGRvZXNuJ3QgbWF0Y2ggcGF0dGVybiAje3JfZ19iX25hbWV9XCIgIyBUT0RPOiBiZXR0ZXIgbWVzc2FnZT9cblx0XHRcblx0XHRwYWxldHRlLmFkZFxuXHRcdFx0cjogcl9nX2JfbmFtZVsxXSAqIDI1NVxuXHRcdFx0Zzogcl9nX2JfbmFtZVsyXSAqIDI1NVxuXHRcdFx0Yjogcl9nX2JfbmFtZVszXSAqIDI1NVxuXHRcdFx0bmFtZTogcl9nX2JfbmFtZVs0XVxuXHRcdFxuXHRwYWxldHRlXG4iLCJcbiMgTG9hZCBhIFN0YXJDcmFmdCByYXcgcGFsZXR0ZSAoLnBhbClcblxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxuXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cblx0XG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxuXHRcblx0aWYgYnIuZ2V0U2l6ZSgpIGlzbnQgNzY4XG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiV3JvbmcgZmlsZSBzaXplLCBtdXN0IGJlICN7NzY4fSBieXRlcyBsb25nIChub3QgI3tici5nZXRTaXplKCl9KVwiXG5cdFxuXHRmb3IgWzAuLi4yNTZdXG5cdFx0cGFsZXR0ZS5hZGRcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcblx0XHRcdCM6IG5vIHBhZGRpbmdcblx0XG5cdCM/IHBhbGV0dGUubnVtYmVyT2ZDb2x1bW5zID0gMTZcblx0cGFsZXR0ZVxuIiwiXG4jIExvYWQgYSBTdGFyQ3JhZnQgcGFkZGVkIHJhdyBwYWxldHRlICgud3BlKVxuXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXG5cbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxuXHRcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXG5cdFxuXHRpZiBici5nZXRTaXplKCkgaXNudCAxMDI0XG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiV3JvbmcgZmlsZSBzaXplLCBtdXN0IGJlICN7MTAyNH0gYnl0ZXMgbG9uZyAobm90ICN7YnIuZ2V0U2l6ZSgpfSlcIlxuXHRcblx0Zm9yIFswLi4uMjU2XVxuXHRcdHBhbGV0dGUuYWRkXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXG5cdFx0XHRfOiBici5yZWFkQnl0ZSgpICMgcGFkZGluZ1xuXHRcblx0cGFsZXR0ZS5udW1iZXJPZkNvbHVtbnMgPSAxNlxuXHRwYWxldHRlXG4iLCJcbiMgTG9hZCBhIFNrZXRjaCBBcHAgSlNPTiBwYWxldHRlICguc2tldGNocGFsZXR0ZSlcbiMgKG5vdCByZWxhdGVkIHRvIC5zcGwgU2tldGNoIFJHQiBQYWxldHRlIGZvcm1hdClcblxuIyBiYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vYW5kcmV3ZmlvcmlsbG8vc2tldGNoLXBhbGV0dGVzL2Jsb2IvNWI2YmZhNmViMjVjYjMyNDRhOWU2YTIyNmRmMjU5ZThmYjMxZmMyYy9Ta2V0Y2glMjBQYWxldHRlcy5za2V0Y2hwbHVnaW4vQ29udGVudHMvU2tldGNoL3NrZXRjaFBhbGV0dGVzLmpzXG5cblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXG5cbnZlcnNpb24gPSAxLjRcblxuIyBUT0RPOiBEUlkgd2l0aCBDU1MuY29mZmVlXG5wYXJzZV9jc3NfaGV4X2NvbG9yID0gKGhleF9jb2xvciktPlxuXHRoZXggPSAoeCktPiBwYXJzZUludCh4LCAxNilcblx0XG5cdG1hdGNoID0gaGV4X2NvbG9yLm1hdGNoKC8vL1xuXHRcdFxcIyAjIGhhc2h0YWcgIyAjL1xuXHRcdChcblx0XHRcdFswLTlBLUZdezN9ICMgdGhyZWUgaGV4LWRpZ2l0cyAoI0EwQylcblx0XHRcdHxcblx0XHRcdFswLTlBLUZdezZ9ICMgc2l4IGhleC1kaWdpdHMgKCNBQTAwQ0MpXG5cdFx0XHR8XG5cdFx0XHRbMC05QS1GXXs0fSAjIHdpdGggYWxwaGEsIGZvdXIgaGV4LWRpZ2l0cyAoI0EwQ0YpXG5cdFx0XHR8XG5cdFx0XHRbMC05QS1GXXs4fSAjIHdpdGggYWxwaGEsIGVpZ2h0IGhleC1kaWdpdHMgKCNBQTAwQ0NGRilcblx0XHQpXG5cdFx0KD8hWzAtOUEtRl0pICMgKGFuZCBubyBtb3JlISlcblx0Ly8vZ2ltKVxuXG5cdFskMCwgJDFdID0gbWF0Y2hcblxuXHRpZiAkMS5sZW5ndGggPiA0XG5cdFx0cjogaGV4ICQxWzBdICsgJDFbMV1cblx0XHRnOiBoZXggJDFbMl0gKyAkMVszXVxuXHRcdGI6IGhleCAkMVs0XSArICQxWzVdXG5cdFx0YTogaWYgJDEubGVuZ3RoIGlzIDggdGhlbiBoZXggJDFbNl0gKyAkMVs3XSBlbHNlIDFcblx0ZWxzZVxuXHRcdHI6IGhleCAkMVswXSArICQxWzBdXG5cdFx0ZzogaGV4ICQxWzFdICsgJDFbMV1cblx0XHRiOiBoZXggJDFbMl0gKyAkMVsyXVxuXHRcdGE6IGlmICQxLmxlbmd0aCBpcyA0IHRoZW4gaGV4ICQxWzNdICsgJDFbM10gZWxzZSAxXG5cbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxuXHRpZiBub3QgZGF0YS5tYXRjaCgvXlxccyp7Lylcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJub3Qgc2tldGNocGFsZXR0ZSBKU09OXCJcblx0cGFsZXR0ZUNvbnRlbnRzID0gSlNPTi5wYXJzZShkYXRhKVxuXG5cdGNvbXBhdGlibGVWZXJzaW9uID0gcGFsZXR0ZUNvbnRlbnRzLmNvbXBhdGlibGVWZXJzaW9uXG5cblx0IyBDaGVjayBmb3IgcHJlc2V0cyBpbiBmaWxlLCBlbHNlIHNldCB0byBlbXB0eSBhcnJheVxuXHRjb2xvckRlZmluaXRpb25zID0gcGFsZXR0ZUNvbnRlbnRzLmNvbG9ycyA/IFtdXG5cdCMgZ3JhZGllbnREZWZpbml0aW9ucyA9IHBhbGV0dGVDb250ZW50cy5ncmFkaWVudHMgPyBbXVxuXHQjIGltYWdlRGVmaW5pdGlvbnMgPSBwYWxldHRlQ29udGVudHMuaW1hZ2VzID8gW11cblx0Y29sb3JBc3NldHMgPSBbXVxuXHRncmFkaWVudEFzc2V0cyA9IFtdXG5cdGltYWdlcyA9IFtdXG5cblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlXG5cblx0IyBDaGVjayBpZiBwbHVnaW4gaXMgb3V0IG9mIGRhdGUgYW5kIGluY29tcGF0aWJsZSB3aXRoIGEgbmV3ZXIgcGFsZXR0ZSB2ZXJzaW9uXG5cdGlmIGNvbXBhdGlibGVWZXJzaW9uIGFuZCBjb21wYXRpYmxlVmVyc2lvbiA+IHZlcnNpb25cblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBoYW5kbGUgY29tcGF0aWJsZVZlcnNpb24gb2YgI3tjb21wYXRpYmxlVmVyc2lvbn0uXCIpXG5cblx0IyBDaGVjayBmb3Igb2xkZXIgaGV4IGNvZGUgcGFsZXR0ZSB2ZXJzaW9uXG5cdGlmIG5vdCBjb21wYXRpYmxlVmVyc2lvbiBvciBjb21wYXRpYmxlVmVyc2lvbiA8IDEuNFxuXHRcdCMgQ29udmVydCBoZXggY29sb3JzXG5cdFx0Zm9yIGhleF9jb2xvciBpbiBjb2xvckRlZmluaXRpb25zXG5cdFx0XHRwYWxldHRlLmFkZChwYXJzZV9jc3NfaGV4X2NvbG9yKGhleF9jb2xvcikpXG5cdGVsc2Vcblx0XHQjIENvbG9yIEZpbGxzOiBjb252ZXJ0IHJnYmEgY29sb3JzXG5cdFx0aWYgY29sb3JEZWZpbml0aW9ucy5sZW5ndGggPiAwXG5cdFx0XHRmb3IgY29sb3JfZGVmaW5pdGlvbiBpbiBjb2xvckRlZmluaXRpb25zXG5cdFx0XHRcdHBhbGV0dGUuYWRkKFxuXHRcdFx0XHRcdHI6IGNvbG9yX2RlZmluaXRpb24ucmVkICogMjU1XG5cdFx0XHRcdFx0ZzogY29sb3JfZGVmaW5pdGlvbi5ncmVlbiAqIDI1NVxuXHRcdFx0XHRcdGI6IGNvbG9yX2RlZmluaXRpb24uYmx1ZSAqIDI1NVxuXHRcdFx0XHRcdGE6IGNvbG9yX2RlZmluaXRpb24uYWxwaGEgKiAyNTVcblx0XHRcdFx0XHRuYW1lOiBjb2xvcl9kZWZpbml0aW9uLm5hbWVcblx0XHRcdFx0KVxuXG5cdFx0IyAjIFBhdHRlcm4gRmlsbHM6IGNvbnZlcnQgYmFzZTY0IHN0cmluZ3MgdG8gTVNJbWFnZURhdGEgb2JqZWN0c1xuXHRcdCMgaWYgaW1hZ2VEZWZpbml0aW9ucy5sZW5ndGggPiAwXG5cdFx0IyBcdGZvciBpbWFnZURlZmluaXRpb24gaW4gaW1hZ2VEZWZpbml0aW9uc1xuXHRcdCMgXHRcdG5zZGF0YSA9IE5TRGF0YS5hbGxvYygpLmluaXRXaXRoQmFzZTY0RW5jb2RlZFN0cmluZ19vcHRpb25zKGltYWdlRGVmaW5pdGlvbi5kYXRhLCAwKVxuXHRcdCMgXHRcdG5zaW1hZ2UgPSBOU0ltYWdlLmFsbG9jKCkuaW5pdFdpdGhEYXRhKG5zZGF0YSlcblx0XHQjIFx0XHQjIG1zaW1hZ2UgPSBNU0ltYWdlRGF0YS5hbGxvYygpLmluaXRXaXRoSW1hZ2VDb252ZXJ0aW5nQ29sb3JTcGFjZShuc2ltYWdlKVxuXHRcdCMgXHRcdG1zaW1hZ2UgPSBNU0ltYWdlRGF0YS5hbGxvYygpLmluaXRXaXRoSW1hZ2UobnNpbWFnZSlcblx0XHQjIFx0XHRpbWFnZXMucHVzaChtc2ltYWdlKVxuXG5cdFx0IyAjIEdyYWRpZW50IEZpbGxzOiBidWlsZCBNU0dyYWRpZW50U3RvcCBhbmQgTVNHcmFkaWVudCBvYmplY3RzXG5cdFx0IyBpZiBncmFkaWVudERlZmluaXRpb25zLmxlbmd0aCA+IDBcblx0XHQjIFx0Zm9yIGdyYWRpZW50IGluIGdyYWRpZW50RGVmaW5pdGlvbnNcblx0XHQjIFx0XHQjIENyZWF0ZSBncmFkaWVudCBzdG9wc1xuXHRcdCMgXHRcdHN0b3BzID0gW11cblx0XHQjIFx0XHRmb3Igc3RvcCBpbiBncmFkaWVudC5zdG9wc1xuXHRcdCMgXHRcdFx0Y29sb3IgPSBNU0NvbG9yLmNvbG9yV2l0aFJlZF9ncmVlbl9ibHVlX2FscGhhKFxuXHRcdCMgXHRcdFx0XHRzdG9wLmNvbG9yLnJlZCxcblx0XHQjIFx0XHRcdFx0c3RvcC5jb2xvci5ncmVlbixcblx0XHQjIFx0XHRcdFx0c3RvcC5jb2xvci5ibHVlLFxuXHRcdCMgXHRcdFx0XHRzdG9wLmNvbG9yLmFscGhhXG5cdFx0IyBcdFx0XHQpXG5cdFx0IyBcdFx0XHRzdG9wcy5wdXNoKE1TR3JhZGllbnRTdG9wLnN0b3BXaXRoUG9zaXRpb25fY29sb3JfKHN0b3AucG9zaXRpb24sIGNvbG9yKSlcblxuXHRcdCMgXHRcdCMgQ3JlYXRlIGdyYWRpZW50IG9iamVjdCBhbmQgc2V0IGJhc2ljIHByb3BlcnRpZXNcblx0XHQjIFx0XHRtc2dyYWRpZW50ID0gTVNHcmFkaWVudC5uZXcoKVxuXHRcdCMgXHRcdG1zZ3JhZGllbnQuc2V0R3JhZGllbnRUeXBlKGdyYWRpZW50LmdyYWRpZW50VHlwZSlcblx0XHQjIFx0XHQjIG1zZ3JhZGllbnQuc2hvdWxkU21vb3RoZW5PcGFjaXR5ID0gZ3JhZGllbnQuc2hvdWxkU21vb3RoZW5PcGFjaXR5XG5cdFx0IyBcdFx0bXNncmFkaWVudC5lbGlwc2VMZW5ndGggPSBncmFkaWVudC5lbGlwc2VMZW5ndGhcblx0XHQjIFx0XHRtc2dyYWRpZW50LnNldFN0b3BzKHN0b3BzKVxuXG5cdFx0IyBcdFx0IyBQYXJzZSBGcm9tIGFuZCBUbyB2YWx1ZXMgaW50byBhcnJheXMgZS5nLjogZnJvbTogXCJ7MC4xLC0wLjQzfVwiID0+IGZyb21WYWx1ZSA9IFswLjEsIC0wLjQzXVxuXHRcdCMgXHRcdGZyb21WYWx1ZSA9IGdyYWRpZW50LmZyb20uc2xpY2UoMSwtMSkuc3BsaXQoXCIsXCIpXG5cdFx0IyBcdFx0dG9WYWx1ZSA9IGdyYWRpZW50LnRvLnNsaWNlKDEsLTEpLnNwbGl0KFwiLFwiKVxuXG5cdFx0IyBcdFx0IyBTZXQgQ0dQb2ludCBvYmplY3RzIGFzIEZyb20gYW5kIFRvIHZhbHVlc1xuXHRcdCMgXHRcdG1zZ3JhZGllbnQuc2V0RnJvbSh7IHg6IGZyb21WYWx1ZVswXSwgeTogZnJvbVZhbHVlWzFdIH0pXG5cdFx0IyBcdFx0bXNncmFkaWVudC5zZXRUbyh7IHg6IHRvVmFsdWVbMF0sIHk6IHRvVmFsdWVbMV0gfSlcblxuXHRcdCMgXHRcdGdyYWRpZW50TmFtZSA9IGdyYWRpZW50Lm5hbWUgPyBudWxsXG5cdFx0IyBcdFx0Z3JhZGllbnRBc3NldHMucHVzaChNU0dyYWRpZW50QXNzZXQuYWxsb2MoKS5pbml0V2l0aEFzc2V0X25hbWUobXNncmFkaWVudCwgZ3JhZGllbnROYW1lKSlcblxuXHRwYWxldHRlXG4iLCJcbiMgTG9hZCB0YWJ1bGFyIFJHQiB2YWx1ZXNcblxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcblxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXG5cdHBhbGV0dGVzID0gW1xuXHRcdGNzdl9wYWxldHRlID0gbmV3IFBhbGV0dGUoKVxuXHRcdHNzdl9wYWxldHRlID0gbmV3IFBhbGV0dGUoKVxuXHRdXG5cdHRyeV9wYXJzZV9saW5lID0gKGxpbmUsIHBhbGV0dGUsIHJlZ2V4cCktPlxuXHRcdG1hdGNoID0gbGluZS5tYXRjaChyZWdleHApXG5cdFx0aWYgbWF0Y2hcblx0XHRcdHBhbGV0dGUuYWRkXG5cdFx0XHRcdHI6IG1hdGNoWzFdXG5cdFx0XHRcdGc6IG1hdGNoWzJdXG5cdFx0XHRcdGI6IG1hdGNoWzNdXG5cdGZvciBsaW5lIGluIGxpbmVzXG5cdFx0dHJ5X3BhcnNlX2xpbmUgbGluZSwgY3N2X3BhbGV0dGUsIC8oWzAtOV0qXFwuP1swLTldKyksXFxzKihbMC05XSpcXC4/WzAtOV0rKSxcXHMqKFswLTldKlxcLj9bMC05XSspL1xuXHRcdHRyeV9wYXJzZV9saW5lIGxpbmUsIHNzdl9wYWxldHRlLCAvKFswLTldKlxcLj9bMC05XSspXFxzKyhbMC05XSpcXC4/WzAtOV0rKVxccysoWzAtOV0qXFwuP1swLTldKykvXG5cdFxuXHRtb3N0X2NvbG9ycyA9IFtdXG5cdGZvciBwYWxldHRlIGluIHBhbGV0dGVzXG5cdFx0aWYgcGFsZXR0ZS5sZW5ndGggPj0gbW9zdF9jb2xvcnMubGVuZ3RoXG5cdFx0XHRtb3N0X2NvbG9ycyA9IHBhbGV0dGVcblx0XG5cdG4gPSBtb3N0X2NvbG9ycy5sZW5ndGhcblx0aWYgbiA8IDRcblx0XHR0aHJvdyBuZXcgRXJyb3IoW1xuXHRcdFx0XCJObyBjb2xvcnMgZm91bmRcIlxuXHRcdFx0XCJPbmx5IG9uZSBjb2xvciBmb3VuZFwiXG5cdFx0XHRcIk9ubHkgYSBjb3VwbGUgY29sb3JzIGZvdW5kXCJcblx0XHRcdFwiT25seSBhIGZldyBjb2xvcnMgZm91bmRcIlxuXHRcdF1bbl0gKyBcIiAoI3tufSlcIilcblx0XG5cdGlmIG1vc3RfY29sb3JzLmV2ZXJ5KChjb2xvciktPiBjb2xvci5yIDw9IDEgYW5kIGNvbG9yLmcgPD0gMSBhbmQgY29sb3IuYiA8PSAxKVxuXHRcdG1vc3RfY29sb3JzLmZvckVhY2ggKGNvbG9yKS0+XG5cdFx0XHRjb2xvci5yICo9IDI1NVxuXHRcdFx0Y29sb3IuZyAqPSAyNTVcblx0XHRcdGNvbG9yLmIgKj0gMjU1XG5cblx0bW9zdF9jb2xvcnNcbiIsIiMgTG9hZCBXaW5kb3dzIC50aGVtZSBhbmQgLnRoZW1lcGFjayBmaWxlc1xuXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxuXG5wYXJzZUlOSVN0cmluZyA9IChkYXRhKS0+XG5cdHJlZ2V4ID0gXG5cdFx0c2VjdGlvbjogL15cXHMqXFxbXFxzKihbXlxcXV0qKVxccypcXF1cXHMqJC9cblx0XHRwYXJhbTogL15cXHMqKFtePV0rPylcXHMqPVxccyooLio/KVxccyokL1xuXHRcdGNvbW1lbnQ6IC9eXFxzKjsuKiQvXG5cdHZhbHVlID0ge31cblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxyXFxuXSsvKVxuXHRzZWN0aW9uID0gbnVsbFxuXHRsaW5lcy5mb3JFYWNoIChsaW5lKS0+XG5cdFx0aWYgcmVnZXguY29tbWVudC50ZXN0KGxpbmUpXG5cdFx0XHRyZXR1cm5cblx0XHRlbHNlIGlmIHJlZ2V4LnBhcmFtLnRlc3QobGluZSlcblx0XHRcdG1hdGNoID0gbGluZS5tYXRjaChyZWdleC5wYXJhbSlcblx0XHRcdGlmIHNlY3Rpb25cblx0XHRcdFx0dmFsdWVbc2VjdGlvbl1bbWF0Y2hbMV1dID0gbWF0Y2hbMl1cblx0XHRcdGVsc2Vcblx0XHRcdFx0dmFsdWVbbWF0Y2hbMV1dID0gbWF0Y2hbMl1cblx0XHRlbHNlIGlmIHJlZ2V4LnNlY3Rpb24udGVzdChsaW5lKVxuXHRcdFx0bWF0Y2ggPSBsaW5lLm1hdGNoKHJlZ2V4LnNlY3Rpb24pXG5cdFx0XHR2YWx1ZVttYXRjaFsxXV0gPSB7fVxuXHRcdFx0c2VjdGlvbiA9IG1hdGNoWzFdXG5cdFx0ZWxzZSBpZiBsaW5lLmxlbmd0aCBpcyAwIGFuZCBzZWN0aW9uXG5cdFx0XHRzZWN0aW9uID0gbnVsbFxuXHRcdHJldHVyblxuXHR2YWx1ZVxuXG5wYXJzZVRoZW1lRmlsZVN0cmluZyA9ICh0aGVtZUluaSktPlxuXHQjIC50aGVtZSBpcyBhIHJlbmFtZWQgLmluaSB0ZXh0IGZpbGVcblx0IyAudGhlbWVwYWNrIGlzIGEgcmVuYW1lZCAuY2FiIGZpbGUsIGFuZCBwYXJzaW5nIGl0IGFzIC5pbmkgc2VlbXMgdG8gd29yayB3ZWxsIGVub3VnaCBmb3IgdGhlIG1vc3QgcGFydCwgYXMgdGhlIC5pbmkgZGF0YSBhcHBlYXJzIGluIHBsYWluLFxuXHQjIGJ1dCBpdCBtYXkgbm90IGlmIGNvbXByZXNzaW9uIGlzIGVuYWJsZWQgZm9yIHRoZSAuY2FiIGZpbGVcblx0dGhlbWUgPSBwYXJzZUlOSVN0cmluZyh0aGVtZUluaSlcblx0Y29sb3JzID0gdGhlbWVbXCJDb250cm9sIFBhbmVsXFxcXENvbG9yc1wiXVxuXHRpZiBub3QgY29sb3JzXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0aGVtZSBmaWxlLCBubyBbQ29udHJvbCBQYW5lbFxcXFxDb2xvcnNdIHNlY3Rpb25cIilcblx0XG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZVxuXHRmb3Iga2V5IG9mIGNvbG9yc1xuXHRcdCMgZm9yIC50aGVtZXBhY2sgZmlsZSBzdXBwb3J0LCBqdXN0IGlnbm9yZSBiYWQga2V5cyB0aGF0IHdlcmUgcGFyc2VkXG5cdFx0aWYgbm90IGtleS5tYXRjaCgvXFxXLylcblx0XHRcdGNvbXBvbmVudHMgPSBjb2xvcnNba2V5XS5zcGxpdChcIiBcIilcblx0XHRcdGlmIGNvbXBvbmVudHMubGVuZ3RoIGlzIDNcblx0XHRcdFx0Zm9yIGNvbXBvbmVudCwgaSBpbiBjb21wb25lbnRzXG5cdFx0XHRcdFx0Y29tcG9uZW50c1tpXSA9IHBhcnNlSW50KGNvbXBvbmVudCwgMTApXG5cdFx0XHRcdGlmIGNvbXBvbmVudHMuZXZlcnkoKGNvbXBvbmVudCktPiBpc0Zpbml0ZShjb21wb25lbnQpKVxuXHRcdFx0XHRcdHBhbGV0dGUuYWRkXG5cdFx0XHRcdFx0XHRyOiBjb21wb25lbnRzWzBdXG5cdFx0XHRcdFx0XHRnOiBjb21wb25lbnRzWzFdXG5cdFx0XHRcdFx0XHRiOiBjb21wb25lbnRzWzJdXG5cdFx0XHRcdFx0XHRuYW1lOiBrZXlcblx0cGFsZXR0ZVxuXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cblx0cGFyc2VUaGVtZUZpbGVTdHJpbmcgZGF0YVxuIiwiXG5QYWxldHRlID0gcmVxdWlyZSBcIi4vUGFsZXR0ZVwiXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcblxuY2xhc3MgUmFuZG9tQ29sb3IgZXh0ZW5kcyBDb2xvclxuXHRjb25zdHJ1Y3RvcjogLT5cblx0XHRzdXBlcigpXG5cdFx0QHJhbmRvbWl6ZSgpXG5cdFxuXHRyYW5kb21pemU6IC0+XG5cdFx0QGggPSBNYXRoLnJhbmRvbSgpICogMzYwXG5cdFx0QHMgPSBNYXRoLnJhbmRvbSgpICogMTAwXG5cdFx0QGwgPSBNYXRoLnJhbmRvbSgpICogMTAwXG5cdFxuXHR0b1N0cmluZzogLT5cblx0XHRAcmFuZG9taXplKClcblx0XHRcImhzbCgje0BofSwgI3tAc30lLCAje0BsfSUpXCJcblx0XG5cdGlzOiAtPiBub1xuXG5jbGFzcyBSYW5kb21QYWxldHRlIGV4dGVuZHMgUGFsZXR0ZVxuXHRjb25zdHJ1Y3RvcjogLT5cblx0XHRzdXBlcigpXG5cdFx0QGxvYWRlciA9XG5cdFx0XHRuYW1lOiBcIkNvbXBsZXRlbHkgUmFuZG9tIENvbG9yc+KEolwiXG5cdFx0XHRmaWxlRXh0ZW5zaW9uczogW11cblx0XHRcdGZpbGVFeHRlbnNpb25zUHJldHR5OiBcIiguY3JjIHNqZihEZjA5c2pkZmtzZGxmbW5tICc7JztcIlxuXHRcdEBtYXRjaGVkTG9hZGVyRmlsZUV4dGVuc2lvbnMgPSBub1xuXHRcdEBjb25maWRlbmNlID0gMFxuXHRcdEBmaW5hbGl6ZSgpXG5cdFx0Zm9yIGkgaW4gWzAuLk1hdGgucmFuZG9tKCkqMTUrNV1cblx0XHRcdEBwdXNoIG5ldyBSYW5kb21Db2xvcigpXG5cbmNsYXNzIExvYWRpbmdFcnJvcnMgZXh0ZW5kcyBFcnJvclxuXHRjb25zdHJ1Y3RvcjogKEBlcnJvcnMpLT5cblx0XHRzdXBlcigpXG5cdFx0QG1lc3NhZ2UgPSBcIlNvbWUgZXJyb3JzIHdlcmUgZW5jb3VudGVyZWQgd2hlbiBsb2FkaW5nOlwiICtcblx0XHRcdGZvciBlcnJvciBpbiBAZXJyb3JzXG5cdFx0XHRcdFwiXFxuXFx0XCIgKyBlcnJvci5tZXNzYWdlXG5cbmxvYWRfcGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxuXHRcblx0cGFsZXR0ZV9sb2FkZXJzID0gW1xuXHRcdHtcblx0XHRcdG5hbWU6IFwiUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZVwiXG5cdFx0XHRleHRzOiBbXCJwYWxcIiwgXCJwc3BwYWxldHRlXCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50U2hvcFByb1wiXG5cdFx0fVxuXHRcdHtcblx0XHRcdG5hbWU6IFwiUklGRiBQQUxcIlxuXHRcdFx0ZXh0czogW1wicGFsXCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1JJRkZcIlxuXHRcdH1cblx0XHR7XG5cdFx0XHRuYW1lOiBcIkNvbG9yU2NoZW1lciBwYWxldHRlXCJcblx0XHRcdGV4dHM6IFtcImNzXCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0NvbG9yU2NoZW1lclwiXG5cdFx0fVxuXHRcdHtcblx0XHRcdG5hbWU6IFwiUGFpbnQuTkVUIHBhbGV0dGVcIlxuXHRcdFx0ZXh0czogW1widHh0XCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50Lk5FVFwiXG5cdFx0fVxuXHRcdHtcblx0XHRcdG5hbWU6IFwiR0lNUCBwYWxldHRlXCJcblx0XHRcdGV4dHM6IFtcImdwbFwiLCBcImdpbXBcIiwgXCJjb2xvcnNcIl1cblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvR0lNUFwiXG5cdFx0fVxuXHRcdHtcblx0XHRcdG5hbWU6IFwiS29sb3VyUGFpbnQgcGFsZXR0ZVwiXG5cdFx0XHRleHRzOiBbXCJjb2xvcnNcIl1cblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvS29sb3VyUGFpbnRcIlxuXHRcdH1cblx0XHR7XG5cdFx0XHRuYW1lOiBcIlNrZW5jaWwgcGFsZXR0ZVwiXG5cdFx0XHRleHRzOiBbXCJzcGxcIl1cblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvU1BMXCJcblx0XHR9XG5cdFx0e1xuXHRcdFx0bmFtZTogXCJTa2V0Y2ggcGFsZXR0ZVwiXG5cdFx0XHRleHRzOiBbXCJza2V0Y2hwYWxldHRlXCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL3NrZXRjaHBhbGV0dGVcIlxuXHRcdH1cblx0XHR7XG5cdFx0XHRuYW1lOiBcInNLMSBwYWxldHRlXCJcblx0XHRcdGV4dHM6IFtcInNrcFwiXVxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TS1BcIlxuXHRcdH1cblx0XHR7XG5cdFx0XHRuYW1lOiBcIkNTUyBjb2xvcnNcIlxuXHRcdFx0ZXh0czogW1wiY3NzXCIsIFwic2Nzc1wiLCBcInNhc3NcIiwgXCJsZXNzXCIsIFwic3R5bFwiLCBcImh0bWxcIiwgXCJodG1cIiwgXCJzdmdcIiwgXCJqc1wiLCBcInRzXCIsIFwieG1sXCIsIFwidHh0XCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0NTU1wiXG5cdFx0fVxuXHRcdHtcblx0XHRcdG5hbWU6IFwiV2luZG93cyBkZXNrdG9wIHRoZW1lXCJcblx0XHRcdGV4dHM6IFtcInRoZW1lXCIsIFwidGhlbWVwYWNrXCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL3RoZW1lXCJcblx0XHR9XG5cdFx0IyB7XG5cdFx0IyBcdG5hbWU6IFwiS0RFIGRlc2t0b3AgdGhlbWVcIlxuXHRcdCMgXHRleHRzOiBbXCJjb2xvcnNcIl1cblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy90aGVtZVwiXG5cdFx0IyB9XG5cdFx0IyB7XG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgU3dhdGNoXCJcblx0XHQjIFx0ZXh0czogW1wiYWNvXCJdXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvclN3YXRjaFwiXG5cdFx0IyB9XG5cdFx0e1xuXHRcdFx0bmFtZTogXCJBZG9iZSBDb2xvciBUYWJsZVwiXG5cdFx0XHRleHRzOiBbXCJhY3RcIl1cblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvclRhYmxlXCJcblx0XHR9XG5cdFx0IyB7XG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgU3dhdGNoIEV4Y2hhbmdlXCJcblx0XHQjIFx0ZXh0czogW1wiYXNlXCJdXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVTd2F0Y2hFeGNoYW5nZVwiXG5cdFx0IyB9XG5cdFx0IyB7XG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgQm9va1wiXG5cdFx0IyBcdGV4dHM6IFtcImFjYlwiXVxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JCb29rXCJcblx0XHQjIH1cblx0XHR7XG5cdFx0XHRuYW1lOiBcIkhvbWVzaXRlIHBhbGV0dGVcIlxuXHRcdFx0ZXh0czogW1wiaHBsXCJdXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0hvbWVzaXRlXCJcblx0XHR9XG5cdFx0e1xuXHRcdFx0bmFtZTogXCJTdGFyQ3JhZnQgcGFsZXR0ZVwiXG5cdFx0XHRleHRzOiBbXCJwYWxcIl1cblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvU3RhckNyYWZ0XCJcblx0XHR9XG5cdFx0e1xuXHRcdFx0bmFtZTogXCJTdGFyQ3JhZnQgdGVycmFpbiBwYWxldHRlXCJcblx0XHRcdGV4dHM6IFtcIndwZVwiXVxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TdGFyQ3JhZnRQYWRkZWRcIlxuXHRcdH1cblx0XHRcblx0XHQjIHtcblx0XHQjIFx0bmFtZTogXCJBdXRvQ0FEIENvbG9yIEJvb2tcIlxuXHRcdCMgXHRleHRzOiBbXCJhY2JcIl1cblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BdXRvQ0FEQ29sb3JCb29rXCJcblx0XHQjIH1cblx0XHRcblx0XHQjIHtcblx0XHQjIFx0IyAoc2FtZSBhcyBQYWludCBTaG9wIFBybyBwYWxldHRlPylcblx0XHQjIFx0bmFtZTogXCJDb3JlbERSQVcgcGFsZXR0ZVwiXG5cdFx0IyBcdGV4dHM6IFtcInBhbFwiLCBcImNwbFwiXVxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0NvcmVsRFJBV1wiXG5cdFx0IyB9XG5cdFx0e1xuXHRcdFx0bmFtZTogXCJ0YWJ1bGFyIGNvbG9yc1wiXG5cdFx0XHRleHRzOiBbXCJjc3ZcIiwgXCJ0c3ZcIiwgXCJ0eHRcIl1cblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvdGFidWxhclwiXG5cdFx0fVxuXHRdXG5cdFxuXHQjIGZpbmQgcGFsZXR0ZSBsb2FkZXJzIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cblx0Zm9yIHBsIGluIHBhbGV0dGVfbG9hZGVyc1xuXHRcdHBsLm1hdGNoZXNfZXh0ID0gcGwuZXh0cy5pbmRleE9mKG8uZmlsZUV4dCkgaXNudCAtMVxuXHRcblx0IyBtb3ZlIHBhbGV0dGUgbG9hZGVycyB0byB0aGUgYmVnaW5uaW5nIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cblx0cGFsZXR0ZV9sb2FkZXJzLnNvcnQgKHBsMSwgcGwyKS0+XG5cdFx0cGwyLm1hdGNoZXNfZXh0IC0gcGwxLm1hdGNoZXNfZXh0XG5cdFxuXHQjIHRyeSBsb2FkaW5nIHN0dWZmXG5cdGVycm9ycyA9IFtdXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcblx0XHRcblx0XHR0cnlcblx0XHRcdHBhbGV0dGUgPSBwbC5sb2FkKG8pXG5cdFx0XHRpZiBwYWxldHRlLmxlbmd0aCBpcyAwXG5cdFx0XHRcdHBhbGV0dGUgPSBudWxsXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIm5vIGNvbG9ycyByZXR1cm5lZFwiXG5cdFx0Y2F0Y2ggZVxuXHRcdFx0bXNnID0gXCJmYWlsZWQgdG8gbG9hZCAje28uZmlsZU5hbWV9IGFzICN7cGwubmFtZX06ICN7ZS5tZXNzYWdlfVwiXG5cdFx0XHQjIGlmIHBsLm1hdGNoZXNfZXh0IGFuZCBub3QgZS5tZXNzYWdlLm1hdGNoKC9ub3QgYS9pKVxuXHRcdFx0IyBcdGNvbnNvbGU/LmVycm9yPyBtc2dcblx0XHRcdCMgZWxzZVxuXHRcdFx0IyBcdGNvbnNvbGU/Lndhcm4/IG1zZ1xuXHRcdFx0XG5cdFx0XHQjIFRPRE86IG1heWJlIHRoaXMgc2hvdWxkbid0IGJlIGFuIEVycm9yIG9iamVjdCwganVzdCBhIHttZXNzYWdlLCBlcnJvcn0gb2JqZWN0XG5cdFx0XHQjIG9yIHtmcmllbmRseU1lc3NhZ2UsIGVycm9yfVxuXHRcdFx0ZXJyID0gbmV3IEVycm9yIG1zZ1xuXHRcdFx0ZXJyLmVycm9yID0gZVxuXHRcdFx0ZXJyb3JzLnB1c2ggZXJyXG5cdFx0XG5cdFx0aWYgcGFsZXR0ZVxuXHRcdFx0IyBjb25zb2xlPy5pbmZvPyBcImxvYWRlZCAje28uZmlsZU5hbWV9IGFzICN7cGwubmFtZX1cIlxuXHRcdFx0cGFsZXR0ZS5jb25maWRlbmNlID0gaWYgcGwubWF0Y2hlc19leHQgdGhlbiAwLjkgZWxzZSAwLjAxXG5cdFx0XHRleHRzX3ByZXR0eSA9IFwiLiN7cGwuZXh0cy5qb2luKFwiLCAuXCIpfVwiXG5cdFx0XHRcblx0XHRcdCMgVE9ETzogcHJvYmFibHkgcmVuYW1lIGxvYWRlciAtPiBmb3JtYXQgd2hlbiAyLXdheSBkYXRhIGZsb3cgKHJlYWQvd3JpdGUpIGlzIHN1cHBvcnRlZFxuXHRcdFx0IyBUT0RPOiBtYXliZSBtYWtlIHRoaXMgYSAzcmQgKGFuZCBmb3VydGg/KSBhcmd1bWVudCB0byB0aGUgY2FsbGJhY2tcblx0XHRcdHBhbGV0dGUubG9hZGVyID1cblx0XHRcdFx0bmFtZTogcGwubmFtZVxuXHRcdFx0XHRmaWxlRXh0ZW5zaW9uczogcGwuZXh0c1xuXHRcdFx0XHRmaWxlRXh0ZW5zaW9uc1ByZXR0eTogZXh0c19wcmV0dHlcblx0XHRcdHBhbGV0dGUubWF0Y2hlZExvYWRlckZpbGVFeHRlbnNpb25zID0gcGwubWF0Y2hlc19leHRcblx0XHRcdFxuXHRcdFx0cGFsZXR0ZS5maW5hbGl6ZSgpXG5cdFx0XHRjYWxsYmFjayhudWxsLCBwYWxldHRlKVxuXHRcdFx0cmV0dXJuXG5cdFxuXHRjYWxsYmFjayhuZXcgTG9hZGluZ0Vycm9ycyhlcnJvcnMpKVxuXHRyZXR1cm5cblxubm9ybWFsaXplX29wdGlvbnMgPSAobyA9IHt9KS0+XG5cdGlmIHR5cGVvZiBvIGlzIFwic3RyaW5nXCIgb3IgbyBpbnN0YW5jZW9mIFN0cmluZ1xuXHRcdG8gPSBmaWxlUGF0aDogb1xuXHRpZiBGaWxlPyBhbmQgbyBpbnN0YW5jZW9mIEZpbGVcblx0XHRvID0gZmlsZTogb1xuXHRcblx0IyBvLm1pbkNvbG9ycyA/PSAyXG5cdCMgby5tYXhDb2xvcnMgPz0gMjU2XG5cdG8uZmlsZU5hbWUgPz0gby5maWxlPy5uYW1lID8gKGlmIG8uZmlsZVBhdGggdGhlbiByZXF1aXJlKFwicGF0aFwiKS5iYXNlbmFtZShvLmZpbGVQYXRoKSlcblx0by5maWxlRXh0ID89IFwiI3tvLmZpbGVOYW1lfVwiLnNwbGl0KFwiLlwiKS5wb3AoKVxuXHRvLmZpbGVFeHQgPSBcIiN7by5maWxlRXh0fVwiLnRvTG93ZXJDYXNlKClcblx0b1xuXG5BbnlQYWxldHRlID0ge1xuXHRDb2xvclxuXHRQYWxldHRlXG5cdFJhbmRvbUNvbG9yXG5cdFJhbmRvbVBhbGV0dGVcblx0IyBMb2FkaW5nRXJyb3JzXG59XG5cbiMgR2V0IHBhbGV0dGUgZnJvbSBhIGZpbGVcbkFueVBhbGV0dGUubG9hZFBhbGV0dGUgPSAobywgY2FsbGJhY2spLT5cblx0aWYgbm90IG9cblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yIFwicGFyYW1ldGVycyByZXF1aXJlZDogQW55UGFsZXR0ZS5sb2FkUGFsZXR0ZShvcHRpb25zLCBmdW5jdGlvbiBjYWxsYmFjayhlcnJvciwgcGFsZXR0ZSl7fSlcIlxuXHRpZiBub3QgY2FsbGJhY2tcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yIFwiY2FsbGJhY2sgcmVxdWlyZWQ6IEFueVBhbGV0dGUubG9hZFBhbGV0dGUob3B0aW9ucywgZnVuY3Rpb24gY2FsbGJhY2soZXJyb3IsIHBhbGV0dGUpe30pXCJcblx0XG5cdG8gPSBub3JtYWxpemVfb3B0aW9ucyBvXG5cdFxuXHRpZiBvLmRhdGFcblx0XHRsb2FkX3BhbGV0dGUobywgY2FsbGJhY2spXG5cdGVsc2UgaWYgby5maWxlXG5cdFx0aWYgbm90IChvLmZpbGUgaW5zdGFuY2VvZiBGaWxlKVxuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvciBcIm9wdGlvbnMuZmlsZSB3YXMgcGFzc2VkIGJ1dCBpdCBpcyBub3QgYSBGaWxlXCJcblx0XHRmciA9IG5ldyBGaWxlUmVhZGVyXG5cdFx0ZnIub25lcnJvciA9IC0+XG5cdFx0XHRjYWxsYmFjayhmci5lcnJvcilcblx0XHRmci5vbmxvYWQgPSAtPlxuXHRcdFx0by5kYXRhID0gZnIucmVzdWx0XG5cdFx0XHRsb2FkX3BhbGV0dGUobywgY2FsbGJhY2spXG5cdFx0ZnIucmVhZEFzQmluYXJ5U3RyaW5nIG8uZmlsZVxuXHRlbHNlIGlmIG8uZmlsZVBhdGg/XG5cdFx0ZnMgPSByZXF1aXJlIFwiZnNcIlxuXHRcdGZzLnJlYWRGaWxlIG8uZmlsZVBhdGgsIChlcnJvciwgZGF0YSktPlxuXHRcdFx0aWYgZXJyb3Jcblx0XHRcdFx0Y2FsbGJhY2soZXJyb3IpXG5cdFx0XHRlbHNlXG5cdFx0XHRcdG8uZGF0YSA9IGRhdGEudG9TdHJpbmcoXCJiaW5hcnlcIilcblx0XHRcdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxuXHRlbHNlXG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvciBcImVpdGhlciBvcHRpb25zLmRhdGEgb3Igb3B0aW9ucy5maWxlIG9yIG9wdGlvbnMuZmlsZVBhdGggbXVzdCBiZSBwYXNzZWRcIlxuXG5cbiMgR2V0IGEgcGFsZXR0ZSBmcm9tIGEgZmlsZSBvciBieSBhbnkgbWVhbnMgbmVjZXNzYXJ5XG4jIChhcyBpbiBmYWxsIGJhY2sgdG8gY29tcGxldGVseSByYW5kb20gZGF0YSlcbkFueVBhbGV0dGUuZ2ltbWVBUGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxuXHRvID0gbm9ybWFsaXplX29wdGlvbnMgb1xuXHRcblx0QW55UGFsZXR0ZS5sb2FkUGFsZXR0ZSBvLCAoZXJyLCBwYWxldHRlKS0+XG5cdFx0Y2FsbGJhY2sobnVsbCwgcGFsZXR0ZSA/IG5ldyBSYW5kb21QYWxldHRlKVxuXG4jIEV4cG9ydHNcbm1vZHVsZS5leHBvcnRzID0gQW55UGFsZXR0ZVxuIl19
