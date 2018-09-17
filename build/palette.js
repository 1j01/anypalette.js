(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Palette = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":2}],2:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
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


},{}],4:[function(require,module,exports){
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


},{}],5:[function(require,module,exports){
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


},{"./Color":4}],6:[function(require,module,exports){
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


},{"../BinaryReader":3,"../Palette":5}],7:[function(require,module,exports){
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


},{"../Palette":5}],8:[function(require,module,exports){
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


},{"../Palette":5}],9:[function(require,module,exports){
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


},{"../Palette":5}],10:[function(require,module,exports){
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


},{"../BinaryReader":3,"../Palette":5}],11:[function(require,module,exports){
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


},{"../BinaryReader":3,"../Palette":5}],12:[function(require,module,exports){
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


},{"../BinaryReader":3,"../Palette":5}],13:[function(require,module,exports){
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


},{"../BinaryReader":3,"../Palette":5}],14:[function(require,module,exports){
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


},{"../BinaryReader":3,"../Palette":5}],15:[function(require,module,exports){
var Color, LoadingErrors, P, Palette, RandomColor, RandomPalette, load_palette, normalize_options;

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
    "html",
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
      
      // TODO: maybe this shouldn't be an Error object, just a {message, error} object
      // or {friendlyMessage, error}
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

normalize_options = function(o = {}) {
  var ref, ref1, ref2, ref3, ref4, ref5, ref6;
  if (typeof o === "string" || o instanceof String) {
    o = {
      file_path: o
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
  if (o.file_path == null) {
    o.file_path = o.filePath;
  }
  if (o.file_name == null) {
    o.file_name = (ref2 = (ref3 = (ref4 = o.fileName) != null ? ref4 : o.fname) != null ? ref3 : (ref5 = o.file) != null ? ref5.name : void 0) != null ? ref2 : (o.file_path ? require("path").basename(o.file_path) : void 0);
  }
  if (o.file_ext == null) {
    o.file_ext = (ref6 = o.fileExt) != null ? ref6 : `${o.file_name}`.split(".").pop();
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
  o = normalize_options(o);
  if (o.data) {
    return load_palette(o, callback);
  } else if ((typeof File !== "undefined" && File !== null) && o.file instanceof File) {
    fr = new FileReader;
    fr.onload = function() {
      o.data = fr.result;
      return load_palette(o, callback);
    };
    return fr.readAsBinaryString(o.file);
  } else if (o.file_path != null) {
    fs = require("fs");
    return fs.readFile(o.file_path, function(err, data) {
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
Palette.gimme = function(o, callback) {
  o = normalize_options(o);
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


},{"./Color":4,"./Palette":5,"./loaders/ColorSchemer":6,"./loaders/GIMP":7,"./loaders/Generic":8,"./loaders/HPL":9,"./loaders/Paint.NET":10,"./loaders/PaintShopPro":11,"./loaders/RIFF":12,"./loaders/StarCraft":13,"./loaders/StarCraftPadded":14,"fs":"fs","path":1}]},{},[15])(15)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsInNyYy9CaW5hcnlSZWFkZXIuY29mZmVlIiwic3JjL0NvbG9yLmNvZmZlZSIsInNyYy9QYWxldHRlLmNvZmZlZSIsInNyYy9sb2FkZXJzL0NvbG9yU2NoZW1lci5jb2ZmZWUiLCJzcmMvbG9hZGVycy9HSU1QLmNvZmZlZSIsInNyYy9sb2FkZXJzL0dlbmVyaWMuY29mZmVlIiwic3JjL2xvYWRlcnMvSFBMLmNvZmZlZSIsInNyYy9sb2FkZXJzL1BhaW50Lk5FVC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9QYWludFNob3BQcm8uY29mZmVlIiwic3JjL2xvYWRlcnMvUklGRi5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TdGFyQ3JhZnQuY29mZmVlIiwic3JjL2xvYWRlcnMvU3RhckNyYWZ0UGFkZGVkLmNvZmZlZSIsInNyYy9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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LFdBQUYsR0FBZ0I7O0FBQ2hCLENBQUMsQ0FBQyxhQUFGLEdBQWtCOztBQWpPbEIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvLyAuZGlybmFtZSwgLmJhc2VuYW1lLCBhbmQgLmV4dG5hbWUgbWV0aG9kcyBhcmUgZXh0cmFjdGVkIGZyb20gTm9kZS5qcyB2OC4xMS4xLFxuLy8gYmFja3BvcnRlZCBhbmQgdHJhbnNwbGl0ZWQgd2l0aCBCYWJlbCwgd2l0aCBiYWNrd2FyZHMtY29tcGF0IGZpeGVzXG5cbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICB2YXIgcGF0aCA9IChpID49IDApID8gYXJndW1lbnRzW2ldIDogcHJvY2Vzcy5jd2QoKTtcblxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfSBlbHNlIGlmICghcGF0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbiAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcbn07XG5cbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIGlzQWJzb2x1dGUgPSBleHBvcnRzLmlzQWJzb2x1dGUocGF0aCksXG4gICAgICB0cmFpbGluZ1NsYXNoID0gc3Vic3RyKHBhdGgsIC0xKSA9PT0gJy8nO1xuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICBwYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHBhdGggPSAnLic7XG4gIH1cbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xuICAgIHBhdGggKz0gJy8nO1xuICB9XG5cbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnLyc7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhdGhzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgcmV0dXJuIGV4cG9ydHMubm9ybWFsaXplKGZpbHRlcihwYXRocywgZnVuY3Rpb24ocCwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIHAgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5qb2luIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuLy8gcGF0aC5yZWxhdGl2ZShmcm9tLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbmV4cG9ydHMuc2VwID0gJy8nO1xuZXhwb3J0cy5kZWxpbWl0ZXIgPSAnOic7XG5cbmV4cG9ydHMuZGlybmFtZSA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHBhdGggPSBwYXRoICsgJyc7XG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcuJztcbiAgdmFyIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG4gIHZhciBoYXNSb290ID0gY29kZSA9PT0gNDcgLyovKi87XG4gIHZhciBlbmQgPSAtMTtcbiAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIGZvciAodmFyIGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMTsgLS1pKSB7XG4gICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICBpZiAoY29kZSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICBlbmQgPSBpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3JcbiAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlbmQgPT09IC0xKSByZXR1cm4gaGFzUm9vdCA/ICcvJyA6ICcuJztcbiAgaWYgKGhhc1Jvb3QgJiYgZW5kID09PSAxKSB7XG4gICAgLy8gcmV0dXJuICcvLyc7XG4gICAgLy8gQmFja3dhcmRzLWNvbXBhdCBmaXg6XG4gICAgcmV0dXJuICcvJztcbiAgfVxuICByZXR1cm4gcGF0aC5zbGljZSgwLCBlbmQpO1xufTtcblxuZnVuY3Rpb24gYmFzZW5hbWUocGF0aCkge1xuICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSBwYXRoID0gcGF0aCArICcnO1xuXG4gIHZhciBzdGFydCA9IDA7XG4gIHZhciBlbmQgPSAtMTtcbiAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIHZhciBpO1xuXG4gIGZvciAoaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICBpZiAocGF0aC5jaGFyQ29kZUF0KGkpID09PSA0NyAvKi8qLykge1xuICAgICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgIC8vIHBhdGggY29tcG9uZW50XG4gICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgIGVuZCA9IGkgKyAxO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlbmQgPT09IC0xKSByZXR1cm4gJyc7XG4gIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0LCBlbmQpO1xufVxuXG4vLyBVc2VzIGEgbWl4ZWQgYXBwcm9hY2ggZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5LCBhcyBleHQgYmVoYXZpb3IgY2hhbmdlZFxuLy8gaW4gbmV3IE5vZGUuanMgdmVyc2lvbnMsIHNvIG9ubHkgYmFzZW5hbWUoKSBhYm92ZSBpcyBiYWNrcG9ydGVkIGhlcmVcbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbiAocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gYmFzZW5hbWUocGF0aCk7XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbiAocGF0aCkge1xuICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSBwYXRoID0gcGF0aCArICcnO1xuICB2YXIgc3RhcnREb3QgPSAtMTtcbiAgdmFyIHN0YXJ0UGFydCA9IDA7XG4gIHZhciBlbmQgPSAtMTtcbiAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIC8vIFRyYWNrIHRoZSBzdGF0ZSBvZiBjaGFyYWN0ZXJzIChpZiBhbnkpIHdlIHNlZSBiZWZvcmUgb3VyIGZpcnN0IGRvdCBhbmRcbiAgLy8gYWZ0ZXIgYW55IHBhdGggc2VwYXJhdG9yIHdlIGZpbmRcbiAgdmFyIHByZURvdFN0YXRlID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICBpZiAoY29kZSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgc3RhcnRQYXJ0ID0gaSArIDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgIC8vIGV4dGVuc2lvblxuICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICBlbmQgPSBpICsgMTtcbiAgICB9XG4gICAgaWYgKGNvZGUgPT09IDQ2IC8qLiovKSB7XG4gICAgICAgIC8vIElmIHRoaXMgaXMgb3VyIGZpcnN0IGRvdCwgbWFyayBpdCBhcyB0aGUgc3RhcnQgb2Ygb3VyIGV4dGVuc2lvblxuICAgICAgICBpZiAoc3RhcnREb3QgPT09IC0xKVxuICAgICAgICAgIHN0YXJ0RG90ID0gaTtcbiAgICAgICAgZWxzZSBpZiAocHJlRG90U3RhdGUgIT09IDEpXG4gICAgICAgICAgcHJlRG90U3RhdGUgPSAxO1xuICAgIH0gZWxzZSBpZiAoc3RhcnREb3QgIT09IC0xKSB7XG4gICAgICAvLyBXZSBzYXcgYSBub24tZG90IGFuZCBub24tcGF0aCBzZXBhcmF0b3IgYmVmb3JlIG91ciBkb3QsIHNvIHdlIHNob3VsZFxuICAgICAgLy8gaGF2ZSBhIGdvb2QgY2hhbmNlIGF0IGhhdmluZyBhIG5vbi1lbXB0eSBleHRlbnNpb25cbiAgICAgIHByZURvdFN0YXRlID0gLTE7XG4gICAgfVxuICB9XG5cbiAgaWYgKHN0YXJ0RG90ID09PSAtMSB8fCBlbmQgPT09IC0xIHx8XG4gICAgICAvLyBXZSBzYXcgYSBub24tZG90IGNoYXJhY3RlciBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIGRvdFxuICAgICAgcHJlRG90U3RhdGUgPT09IDAgfHxcbiAgICAgIC8vIFRoZSAocmlnaHQtbW9zdCkgdHJpbW1lZCBwYXRoIGNvbXBvbmVudCBpcyBleGFjdGx5ICcuLidcbiAgICAgIHByZURvdFN0YXRlID09PSAxICYmIHN0YXJ0RG90ID09PSBlbmQgLSAxICYmIHN0YXJ0RG90ID09PSBzdGFydFBhcnQgKyAxKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0RG90LCBlbmQpO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyICh4cywgZikge1xuICAgIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGYoeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG52YXIgc3Vic3RyID0gJ2FiJy5zdWJzdHIoLTEpID09PSAnYidcbiAgICA/IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHsgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbikgfVxuICAgIDogZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbik7XG4gICAgfVxuO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIlxyXG4jIyNcclxuQmluYXJ5UmVhZGVyXHJcblxyXG5Nb2RpZmllZCBieSBJc2FpYWggT2RobmVyXHJcbkBUT0RPOiB1c2UgakRhdGFWaWV3ICsgakJpbmFyeSBpbnN0ZWFkXHJcblxyXG5SZWZhY3RvcmVkIGJ5IFZqZXV4IDx2amV1eHhAZ21haWwuY29tPlxyXG5odHRwOi8vYmxvZy52amV1eC5jb20vMjAxMC9qYXZhc2NyaXB0L2phdmFzY3JpcHQtYmluYXJ5LXJlYWRlci5odG1sXHJcblxyXG5PcmlnaW5hbFxyXG4rIEpvbmFzIFJhb25pIFNvYXJlcyBTaWx2YVxyXG5AIGh0dHA6Ly9qc2Zyb21oZWxsLmNvbS9jbGFzc2VzL2JpbmFyeS1wYXJzZXIgW3Jldi4gIzFdXHJcbiMjI1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG5jbGFzcyBCaW5hcnlSZWFkZXJcclxuXHRjb25zdHJ1Y3RvcjogKGRhdGEpLT5cclxuXHRcdEBfYnVmZmVyID0gZGF0YVxyXG5cdFx0QF9wb3MgPSAwXHJcblxyXG5cdCMgUHVibGljIChjdXN0b20pXHJcblx0XHJcblx0cmVhZEJ5dGU6IC0+XHJcblx0XHRAX2NoZWNrU2l6ZSg4KVxyXG5cdFx0Y2ggPSB0aGlzLl9idWZmZXIuY2hhckNvZGVBdChAX3BvcykgJiAweGZmXHJcblx0XHRAX3BvcyArPSAxXHJcblx0XHRjaCAmIDB4ZmZcclxuXHRcclxuXHRyZWFkVW5pY29kZVN0cmluZzogLT5cclxuXHRcdGxlbmd0aCA9IEByZWFkVUludDE2KClcclxuXHRcdGNvbnNvbGUubG9nIHtsZW5ndGh9XHJcblx0XHRAX2NoZWNrU2l6ZShsZW5ndGggKiAxNilcclxuXHRcdHN0ciA9IFwiXCJcclxuXHRcdGZvciBpIGluIFswLi5sZW5ndGhdXHJcblx0XHRcdHN0ciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKEBfYnVmZmVyLnN1YnN0cihAX3BvcywgMSkgfCAoQF9idWZmZXIuc3Vic3RyKEBfcG9zKzEsIDEpIDw8IDgpKVxyXG5cdFx0XHRAX3BvcyArPSAyXHJcblx0XHRzdHJcclxuXHRcclxuXHQjIFB1YmxpY1xyXG5cdFxyXG5cdHJlYWRJbnQ4OiAtPiBAX2RlY29kZUludCg4LCB0cnVlKVxyXG5cdHJlYWRVSW50ODogLT4gQF9kZWNvZGVJbnQoOCwgZmFsc2UpXHJcblx0cmVhZEludDE2OiAtPiBAX2RlY29kZUludCgxNiwgdHJ1ZSlcclxuXHRyZWFkVUludDE2OiAtPiBAX2RlY29kZUludCgxNiwgZmFsc2UpXHJcblx0cmVhZEludDMyOiAtPiBAX2RlY29kZUludCgzMiwgdHJ1ZSlcclxuXHRyZWFkVUludDMyOiAtPiBAX2RlY29kZUludCgzMiwgZmFsc2UpXHJcblxyXG5cdHJlYWRGbG9hdDogLT4gQF9kZWNvZGVGbG9hdCgyMywgOClcclxuXHRyZWFkRG91YmxlOiAtPiBAX2RlY29kZUZsb2F0KDUyLCAxMSlcclxuXHRcclxuXHRyZWFkQ2hhcjogLT4gQHJlYWRTdHJpbmcoMSlcclxuXHRyZWFkU3RyaW5nOiAobGVuZ3RoKS0+XHJcblx0XHRAX2NoZWNrU2l6ZShsZW5ndGggKiA4KVxyXG5cdFx0cmVzdWx0ID0gQF9idWZmZXIuc3Vic3RyKEBfcG9zLCBsZW5ndGgpXHJcblx0XHRAX3BvcyArPSBsZW5ndGhcclxuXHRcdHJlc3VsdFxyXG5cclxuXHRzZWVrOiAocG9zKS0+XHJcblx0XHRAX3BvcyA9IHBvc1xyXG5cdFx0QF9jaGVja1NpemUoMClcclxuXHRcclxuXHRnZXRQb3NpdGlvbjogLT4gQF9wb3NcclxuXHRcclxuXHRnZXRTaXplOiAtPiBAX2J1ZmZlci5sZW5ndGhcclxuXHRcclxuXHJcblxyXG5cdCMgUHJpdmF0ZVxyXG5cdFxyXG5cdF9kZWNvZGVGbG9hdDogYGZ1bmN0aW9uKHByZWNpc2lvbkJpdHMsIGV4cG9uZW50Qml0cyl7XHJcblx0XHR2YXIgbGVuZ3RoID0gcHJlY2lzaW9uQml0cyArIGV4cG9uZW50Qml0cyArIDE7XHJcblx0XHR2YXIgc2l6ZSA9IGxlbmd0aCA+PiAzO1xyXG5cdFx0dGhpcy5fY2hlY2tTaXplKGxlbmd0aCk7XHJcblxyXG5cdFx0dmFyIGJpYXMgPSBNYXRoLnBvdygyLCBleHBvbmVudEJpdHMgLSAxKSAtIDE7XHJcblx0XHR2YXIgc2lnbmFsID0gdGhpcy5fcmVhZEJpdHMocHJlY2lzaW9uQml0cyArIGV4cG9uZW50Qml0cywgMSwgc2l6ZSk7XHJcblx0XHR2YXIgZXhwb25lbnQgPSB0aGlzLl9yZWFkQml0cyhwcmVjaXNpb25CaXRzLCBleHBvbmVudEJpdHMsIHNpemUpO1xyXG5cdFx0dmFyIHNpZ25pZmljYW5kID0gMDtcclxuXHRcdHZhciBkaXZpc29yID0gMjtcclxuXHRcdHZhciBjdXJCeXRlID0gMDsgLy9sZW5ndGggKyAoLXByZWNpc2lvbkJpdHMgPj4gMykgLSAxO1xyXG5cdFx0ZG8ge1xyXG5cdFx0XHR2YXIgYnl0ZVZhbHVlID0gdGhpcy5fcmVhZEJ5dGUoKytjdXJCeXRlLCBzaXplKTtcclxuXHRcdFx0dmFyIHN0YXJ0Qml0ID0gcHJlY2lzaW9uQml0cyAlIDggfHwgODtcclxuXHRcdFx0dmFyIG1hc2sgPSAxIDw8IHN0YXJ0Qml0O1xyXG5cdFx0XHR3aGlsZSAobWFzayA+Pj0gMSkge1xyXG5cdFx0XHRcdGlmIChieXRlVmFsdWUgJiBtYXNrKSB7XHJcblx0XHRcdFx0XHRzaWduaWZpY2FuZCArPSAxIC8gZGl2aXNvcjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZGl2aXNvciAqPSAyO1xyXG5cdFx0XHR9XHJcblx0XHR9IHdoaWxlIChwcmVjaXNpb25CaXRzIC09IHN0YXJ0Qml0KTtcclxuXHJcblx0XHR0aGlzLl9wb3MgKz0gc2l6ZTtcclxuXHJcblx0XHRyZXR1cm4gZXhwb25lbnQgPT0gKGJpYXMgPDwgMSkgKyAxID8gc2lnbmlmaWNhbmQgPyBOYU4gOiBzaWduYWwgPyAtSW5maW5pdHkgOiArSW5maW5pdHlcclxuXHRcdFx0OiAoMSArIHNpZ25hbCAqIC0yKSAqIChleHBvbmVudCB8fCBzaWduaWZpY2FuZCA/ICFleHBvbmVudCA/IE1hdGgucG93KDIsIC1iaWFzICsgMSkgKiBzaWduaWZpY2FuZFxyXG5cdFx0XHQ6IE1hdGgucG93KDIsIGV4cG9uZW50IC0gYmlhcykgKiAoMSArIHNpZ25pZmljYW5kKSA6IDApO1xyXG5cdH1gXHJcblxyXG5cdF9kZWNvZGVJbnQ6IGBmdW5jdGlvbihiaXRzLCBzaWduZWQpe1xyXG5cdFx0dmFyIHggPSB0aGlzLl9yZWFkQml0cygwLCBiaXRzLCBiaXRzIC8gOCksIG1heCA9IE1hdGgucG93KDIsIGJpdHMpO1xyXG5cdFx0dmFyIHJlc3VsdCA9IHNpZ25lZCAmJiB4ID49IG1heCAvIDIgPyB4IC0gbWF4IDogeDtcclxuXHJcblx0XHR0aGlzLl9wb3MgKz0gYml0cyAvIDg7XHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH1gXHJcblxyXG5cdCNzaGwgZml4OiBIZW5yaSBUb3JnZW1hbmUgfjE5OTYgKGNvbXByZXNzZWQgYnkgSm9uYXMgUmFvbmkpXHJcblx0X3NobDogYGZ1bmN0aW9uIChhLCBiKXtcclxuXHRcdGZvciAoKytiOyAtLWI7IGEgPSAoKGEgJT0gMHg3ZmZmZmZmZiArIDEpICYgMHg0MDAwMDAwMCkgPT0gMHg0MDAwMDAwMCA/IGEgKiAyIDogKGEgLSAweDQwMDAwMDAwKSAqIDIgKyAweDdmZmZmZmZmICsgMSk7XHJcblx0XHRyZXR1cm4gYTtcclxuXHR9YFxyXG5cdFxyXG5cdF9yZWFkQnl0ZTogYGZ1bmN0aW9uIChpLCBzaXplKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fYnVmZmVyLmNoYXJDb2RlQXQodGhpcy5fcG9zICsgc2l6ZSAtIGkgLSAxKSAmIDB4ZmY7XHJcblx0fWBcclxuXHJcblx0X3JlYWRCaXRzOiBgZnVuY3Rpb24gKHN0YXJ0LCBsZW5ndGgsIHNpemUpIHtcclxuXHRcdHZhciBvZmZzZXRMZWZ0ID0gKHN0YXJ0ICsgbGVuZ3RoKSAlIDg7XHJcblx0XHR2YXIgb2Zmc2V0UmlnaHQgPSBzdGFydCAlIDg7XHJcblx0XHR2YXIgY3VyQnl0ZSA9IHNpemUgLSAoc3RhcnQgPj4gMykgLSAxO1xyXG5cdFx0dmFyIGxhc3RCeXRlID0gc2l6ZSArICgtKHN0YXJ0ICsgbGVuZ3RoKSA+PiAzKTtcclxuXHRcdHZhciBkaWZmID0gY3VyQnl0ZSAtIGxhc3RCeXRlO1xyXG5cclxuXHRcdHZhciBzdW0gPSAodGhpcy5fcmVhZEJ5dGUoY3VyQnl0ZSwgc2l6ZSkgPj4gb2Zmc2V0UmlnaHQpICYgKCgxIDw8IChkaWZmID8gOCAtIG9mZnNldFJpZ2h0IDogbGVuZ3RoKSkgLSAxKTtcclxuXHJcblx0XHRpZiAoZGlmZiAmJiBvZmZzZXRMZWZ0KSB7XHJcblx0XHRcdHN1bSArPSAodGhpcy5fcmVhZEJ5dGUobGFzdEJ5dGUrKywgc2l6ZSkgJiAoKDEgPDwgb2Zmc2V0TGVmdCkgLSAxKSkgPDwgKGRpZmYtLSA8PCAzKSAtIG9mZnNldFJpZ2h0OyBcclxuXHRcdH1cclxuXHJcblx0XHR3aGlsZSAoZGlmZikge1xyXG5cdFx0XHRzdW0gKz0gdGhpcy5fc2hsKHRoaXMuX3JlYWRCeXRlKGxhc3RCeXRlKyssIHNpemUpLCAoZGlmZi0tIDw8IDMpIC0gb2Zmc2V0UmlnaHQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBzdW07XHJcblx0fWBcclxuXHJcblx0X2NoZWNrU2l6ZTogKG5lZWRlZEJpdHMpLT5cclxuXHRcdGlmIEBfcG9zICsgTWF0aC5jZWlsKG5lZWRlZEJpdHMgLyA4KSA+IEBfYnVmZmVyLmxlbmd0aFxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJJbmRleCBvdXQgb2YgYm91bmRcIlxyXG5cclxuIiwiXHJcbm1vZHVsZS5leHBvcnRzID1cclxuY2xhc3MgQ29sb3JcclxuXHQjIEBUT0RPOiBkb24ndCBhc3NpZ24ge0ByLCBAZywgQGIsIEBoLCBAcywgQHYsIEBsfSByaWdodCBhd2F5XHJcblx0IyAobW9yZSBvZiBhIHRvLWRvbid0LCByZWFsbHkpXHJcblx0Y29uc3RydWN0b3I6ICh7XHJcblx0XHRAciwgQGcsIEBiLFxyXG5cdFx0QGgsIEBzLCBAdiwgQGwsXHJcblx0XHRjLCBtLCB5LCBrLFxyXG5cdFx0QG5hbWVcclxuXHR9KS0+XHJcblx0XHRpZiBAcj8gYW5kIEBnPyBhbmQgQGI/XHJcblx0XHRcdCMgUmVkIEdyZWVuIEJsdWVcclxuXHRcdGVsc2UgaWYgQGg/IGFuZCBAcz9cclxuXHRcdFx0IyBDeWxpbmRyaWNhbCBDb2xvciBTcGFjZVxyXG5cdFx0XHRpZiBAdj9cclxuXHRcdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIFZhbHVlXHJcblx0XHRcdFx0QGwgPSAoMiAtIEBzIC8gMTAwKSAqIEB2IC8gMlxyXG5cdFx0XHRcdEBzID0gQHMgKiBAdiAvIChpZiBAbCA8IDUwIHRoZW4gQGwgKiAyIGVsc2UgMjAwIC0gQGwgKiAyKVxyXG5cdFx0XHRcdEBzID0gMCBpZiBpc05hTiBAc1xyXG5cdFx0XHRlbHNlIGlmIEBsP1xyXG5cdFx0XHRcdCMgSHVlIFNhdHVyYXRpb24gTGlnaHRuZXNzXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJIdWUsIHNhdHVyYXRpb24sIGFuZC4uLj8gKGVpdGhlciBsaWdodG5lc3Mgb3IgdmFsdWUpXCJcclxuXHRcdGVsc2UgaWYgYz8gYW5kIG0/IGFuZCB5PyBhbmQgaz9cclxuXHRcdFx0IyBDeWFuIE1hZ2VudGEgWWVsbG93IGJsYWNLXHJcblx0XHRcdCMgVU5URVNURURcclxuXHRcdFx0YyAvPSAxMDBcclxuXHRcdFx0bSAvPSAxMDBcclxuXHRcdFx0eSAvPSAxMDBcclxuXHRcdFx0ayAvPSAxMDBcclxuXHRcdFx0XHJcblx0XHRcdEByID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCBjICogKDEgLSBrKSArIGspKVxyXG5cdFx0XHRAZyA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgbSAqICgxIC0gaykgKyBrKSlcclxuXHRcdFx0QGIgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIHkgKiAoMSAtIGspICsgaykpXHJcblx0XHRlbHNlXHJcblx0XHRcdCMgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURURcclxuXHRcdFx0aWYgQGw/IGFuZCBAYT8gYW5kIEBiP1xyXG5cdFx0XHRcdHdoaXRlID1cclxuXHRcdFx0XHRcdHg6IDk1LjA0N1xyXG5cdFx0XHRcdFx0eTogMTAwLjAwMFxyXG5cdFx0XHRcdFx0ejogMTA4Ljg4M1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHh5eiA9IFxyXG5cdFx0XHRcdFx0eTogKHJhdy5sICsgMTYpIC8gMTE2XHJcblx0XHRcdFx0XHR4OiByYXcuYSAvIDUwMCArIHh5ei55XHJcblx0XHRcdFx0XHR6OiB4eXoueSAtIHJhdy5iIC8gMjAwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Zm9yIF8gaW4gXCJ4eXpcIlxyXG5cdFx0XHRcdFx0cG93ZWQgPSBNYXRoLnBvdyh4eXpbX10sIDMpXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHBvd2VkID4gMC4wMDg4NTZcclxuXHRcdFx0XHRcdFx0eHl6W19dID0gcG93ZWRcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0eHl6W19dID0gKHh5eltfXSAtIDE2IC8gMTE2KSAvIDcuNzg3XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdCN4eXpbX10gPSBfcm91bmQoeHl6W19dICogd2hpdGVbX10pXHJcblx0XHRcdFx0XHJcblx0XHRcdCMgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURURcclxuXHRcdFx0aWYgQHg/IGFuZCBAeT8gYW5kIEB6P1xyXG5cdFx0XHRcdHh5eiA9XHJcblx0XHRcdFx0XHR4OiByYXcueCAvIDEwMFxyXG5cdFx0XHRcdFx0eTogcmF3LnkgLyAxMDBcclxuXHRcdFx0XHRcdHo6IHJhdy56IC8gMTAwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0cmdiID1cclxuXHRcdFx0XHRcdHI6IHh5ei54ICogMy4yNDA2ICsgeHl6LnkgKiAtMS41MzcyICsgeHl6LnogKiAtMC40OTg2XHJcblx0XHRcdFx0XHRnOiB4eXoueCAqIC0wLjk2ODkgKyB4eXoueSAqIDEuODc1OCArIHh5ei56ICogMC4wNDE1XHJcblx0XHRcdFx0XHRiOiB4eXoueCAqIDAuMDU1NyArIHh5ei55ICogLTAuMjA0MCArIHh5ei56ICogMS4wNTcwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Zm9yIF8gaW4gXCJyZ2JcIlxyXG5cdFx0XHRcdFx0I3JnYltfXSA9IF9yb3VuZChyZ2JbX10pXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHJnYltfXSA8IDBcclxuXHRcdFx0XHRcdFx0cmdiW19dID0gMFxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiByZ2JbX10gPiAwLjAwMzEzMDhcclxuXHRcdFx0XHRcdFx0cmdiW19dID0gMS4wNTUgKiBNYXRoLnBvdyhyZ2JbX10sICgxIC8gMi40KSkgLSAwLjA1NVxyXG5cdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gKj0gMTIuOTJcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHQjcmdiW19dID0gTWF0aC5yb3VuZChyZ2JbX10gKiAyNTUpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJDb2xvciBjb25zdHJ1Y3RvciBtdXN0IGJlIGNhbGxlZCB3aXRoIHtyLGcsYn0gb3Ige2gscyx2fSBvciB7aCxzLGx9IG9yIHtjLG0seSxrfSBvciB7eCx5LHp9IG9yIHtsLGEsYn1cIlxyXG5cdFx0XHJcblx0XHJcblx0dG9TdHJpbmc6IC0+XHJcblx0XHRpZiBAcj9cclxuXHRcdFx0IyBSZWQgR3JlZW4gQmx1ZVxyXG5cdFx0XHRpZiBAYT8gIyBBbHBoYVxyXG5cdFx0XHRcdFwicmdiYSgje0ByfSwgI3tAZ30sICN7QGJ9LCAje0BhfSlcIlxyXG5cdFx0XHRlbHNlICMgT3BhcXVlXHJcblx0XHRcdFx0XCJyZ2IoI3tAcn0sICN7QGd9LCAje0BifSlcIlxyXG5cdFx0ZWxzZSBpZiBAaD9cclxuXHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBMaWdodG5lc3NcclxuXHRcdFx0IyAoQXNzdW1lIGg6MC0zNjAsIHM6MC0xMDAsIGw6MC0xMDApXHJcblx0XHRcdGlmIEBhPyAjIEFscGhhXHJcblx0XHRcdFx0XCJoc2xhKCN7QGh9LCAje0BzfSUsICN7QGx9JSwgI3tAYX0pXCJcclxuXHRcdFx0ZWxzZSAjIE9wYXF1ZVxyXG5cdFx0XHRcdFwiaHNsKCN7QGh9LCAje0BzfSUsICN7QGx9JSlcIlxyXG5cdFxyXG5cdGlzOiAoY29sb3IpLT5cclxuXHRcdFwiI3tAfVwiIGlzIFwiI3tjb2xvcn1cIlxyXG4iLCJcclxuQ29sb3IgPSByZXF1aXJlIFwiLi9Db2xvclwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIFBhbGV0dGUgZXh0ZW5kcyBBcnJheVxyXG5cdFxyXG5cdGNvbnN0cnVjdG9yOiAtPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QHdpdGhfZHVwbGljYXRlcyA9IEBcclxuXHRcdFxyXG5cdGFkZDogKG8pLT5cclxuXHRcdG5ld19jb2xvciA9IG5ldyBDb2xvcihvKVxyXG5cdFx0XHJcblx0XHRpZiBAd2l0aF9kdXBsaWNhdGVzIGlzIEBcclxuXHRcdFx0QHdpdGhfZHVwbGljYXRlcyA9IG5ldyBQYWxldHRlKClcclxuXHRcdFxyXG5cdFx0QHdpdGhfZHVwbGljYXRlcy5wdXNoIG5ld19jb2xvclxyXG5cdFx0XHJcblx0XHRmb3IgY29sb3IgaW4gQFxyXG5cdFx0XHRpZiBjb2xvci5pcyBuZXdfY29sb3JcclxuXHRcdFx0XHRuZXdfY29sb3IuaXNfZHVwbGljYXRlID0gdHJ1ZVxyXG5cdFx0XHRcdHJldHVyblxyXG5cdFx0XHJcblx0XHRAcHVzaCBuZXdfY29sb3JcclxuXHRcclxuXHRmaW5hbGl6ZTogLT5cclxuXHRcdGlmIG5vdCBAbl9jb2x1bW5zXHJcblx0XHRcdEBndWVzc19kaW1lbnNpb25zKClcclxuXHRcdGlmIEB3aXRoX2R1cGxpY2F0ZXNcclxuXHRcdFx0QHdpdGhfZHVwbGljYXRlcy5ndWVzc19kaW1lbnNpb25zKClcclxuXHRcdFxyXG5cdGd1ZXNzX2RpbWVuc2lvbnM6IC0+XHJcblx0XHRsZW4gPSBAbGVuZ3RoXHJcblx0XHRjYW5kaWRhdGVfZGltZW5zaW9ucyA9IFtdXHJcblx0XHRmb3Igbl9jb2x1bW5zIGluIFswLi5sZW5dXHJcblx0XHRcdG5fcm93cyA9IGxlbiAvIG5fY29sdW1uc1xyXG5cdFx0XHRpZiBuX3Jvd3MgaXMgTWF0aC5yb3VuZCBuX3Jvd3NcclxuXHRcdFx0XHRjYW5kaWRhdGVfZGltZW5zaW9ucy5wdXNoIFtuX3Jvd3MsIG5fY29sdW1uc11cclxuXHRcdFxyXG5cdFx0c3F1YXJlc3QgPSBbMCwgMzQ5NTA5M11cclxuXHRcdGZvciBjZCBpbiBjYW5kaWRhdGVfZGltZW5zaW9uc1xyXG5cdFx0XHRpZiBNYXRoLmFicyhjZFswXSAtIGNkWzFdKSA8IE1hdGguYWJzKHNxdWFyZXN0WzBdIC0gc3F1YXJlc3RbMV0pXHJcblx0XHRcdFx0c3F1YXJlc3QgPSBjZFxyXG5cdFx0XHJcblx0XHQjQG5fY29sdW1ucyA9IHNxdWFyZXN0WzFdXHJcbiIsIlxyXG4jIExvYWQgYSBDb2xvclNjaGVtZXIgcGFsZXR0ZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdHZlcnNpb24gPSBici5yZWFkVUludDE2KCkgIyBvciBzb21ldGhpbmdcclxuXHRsZW5ndGggPSBici5yZWFkVUludDE2KClcclxuXHRpID0gMFxyXG5cdHdoaWxlIGkgPCBsZW5ndGhcclxuXHRcdGJyLnNlZWsoOCArIGkgKiAyNilcclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRpICs9IDFcclxuXHJcblx0cGFsZXR0ZVxyXG5cclxuIiwiXHJcbiMgTG9hZCBhIEdJTVAgcGFsZXR0ZVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBcIkdJTVAgUGFsZXR0ZVwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYSBHSU1QIFBhbGV0dGVcIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0aSA9IDFcclxuXHR3aGlsZSAoaSArPSAxKSA8IGxpbmVzLmxlbmd0aFxyXG5cdFx0bGluZSA9IGxpbmVzW2ldXHJcblx0XHRcclxuXHRcdGlmIGxpbmUubWF0Y2goL14jLykgb3IgbGluZSBpcyBcIlwiIHRoZW4gY29udGludWVcclxuXHRcdFxyXG5cdFx0bSA9IGxpbmUubWF0Y2goL05hbWU6XFxzKiguKikvKVxyXG5cdFx0aWYgbVxyXG5cdFx0XHRwYWxldHRlLm5hbWUgPSBtWzFdXHJcblx0XHRcdGNvbnRpbnVlXHJcblx0XHRtID0gbGluZS5tYXRjaCgvQ29sdW1uczpcXHMqKC4qKS8pXHJcblx0XHRpZiBtXHJcblx0XHRcdHBhbGV0dGUubl9jb2x1bW5zID0gTnVtYmVyKG1bMV0pXHJcblx0XHRcdHBhbGV0dGUuaGFzX2RpbWVuc2lvbnMgPSB5ZXNcclxuXHRcdFx0Y29udGludWVcclxuXHRcdFxyXG5cdFx0cl9nX2JfbmFtZSA9IGxpbmUubWF0Y2goL15cXHMqKFswLTldKylcXHMrKFswLTldKylcXHMrKFswLTldKykoPzpcXHMrKC4qKSk/JC8pXHJcblx0XHRpZiBub3Qgcl9nX2JfbmFtZVxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJMaW5lICN7aX0gZG9lc24ndCBtYXRjaCBwYXR0ZXJuIHJfZ19iX25hbWVcIlxyXG5cdFx0XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiByX2dfYl9uYW1lWzFdXHJcblx0XHRcdGc6IHJfZ19iX25hbWVbMl1cclxuXHRcdFx0Yjogcl9nX2JfbmFtZVszXVxyXG5cdFx0XHRuYW1lOiByX2dfYl9uYW1lWzRdXHJcblx0XHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIERldGVjdCBDU1MgY29sb3JzIChleGNlcHQgbmFtZWQgY29sb3JzKVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGVzID0gW1xyXG5cdFx0cGFsZXR0ZV94UlJHR0JCID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV94UkdCID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9yZ2IgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX2hzbCA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfaHNsYSA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfcmdiYSA9IG5ldyBQYWxldHRlKClcclxuXHRdXHJcblx0XHJcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0XFwjICMgaGFzaHRhZyAjICMvXHJcblx0XHQoWzAtOUEtRl17Mn0pPyAjIGFscGhhXHJcblx0XHQoWzAtOUEtRl17M30pICMgdGhyZWUgZGlnaXRzICgjQTBDKVxyXG5cdFx0KFswLTlBLUZdezN9KT8gIyBzaXggZGlnaXRzICgjQUEwMENDKVxyXG5cdFx0XHJcblx0XHQoPyFbMC05QS1GXSkgIyAoYW5kIG5vIG1vcmUhKVxyXG5cdC8vL2dpbSwgKG0sICQwLCAkMSwgJDIpLT5cclxuXHRcdFxyXG5cdFx0YWxwaGEgPSBoZXggJDBcclxuXHRcdFxyXG5cdFx0aWYgJDJcclxuXHRcdFx0eFJHQiA9ICQxICsgJDJcclxuXHRcdFx0cGFsZXR0ZV94UlJHR0JCLmFkZFxyXG5cdFx0XHRcdHI6IGhleCB4UkdCWzBdICsgeFJHQlsxXVxyXG5cdFx0XHRcdGc6IGhleCB4UkdCWzJdICsgeFJHQlszXVxyXG5cdFx0XHRcdGI6IGhleCB4UkdCWzRdICsgeFJHQls1XVxyXG5cdFx0XHRcdGE6IGFscGhhXHJcblx0XHRlbHNlXHJcblx0XHRcdHhSR0IgPSAkMVxyXG5cdFx0XHRwYWxldHRlX3hSR0IuYWRkXHJcblx0XHRcdFx0cjogaGV4IHhSR0JbMF0gKyB4UkdCWzBdXHJcblx0XHRcdFx0ZzogaGV4IHhSR0JbMV0gKyB4UkdCWzFdXHJcblx0XHRcdFx0YjogaGV4IHhSR0JbMl0gKyB4UkdCWzJdXHJcblx0XHRcdFx0YTogYWxwaGFcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRyZ2JcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyByZWRcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgZ3JlZW5cclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgYmx1ZVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0cjogTnVtYmVyIG1bMV1cclxuXHRcdFx0ZzogTnVtYmVyIG1bMl1cclxuXHRcdFx0YjogTnVtYmVyIG1bM11cclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRyZ2JhXFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgcmVkXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGdyZWVuXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGJsdWVcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM318MFxcLlswLTldKykgIyBhbHBoYVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0cjogTnVtYmVyIG1bMV1cclxuXHRcdFx0ZzogTnVtYmVyIG1bMl1cclxuXHRcdFx0YjogTnVtYmVyIG1bM11cclxuXHRcdFx0YTogTnVtYmVyIG1bNF1cclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRoc2xcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBodWVcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgc2F0dXJhdGlvblxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyB2YWx1ZVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0aDogTnVtYmVyIG1bMV1cclxuXHRcdFx0czogTnVtYmVyIG1bMl1cclxuXHRcdFx0bDogTnVtYmVyIG1bM11cclxuXHRcclxuXHRtb3N0X2NvbG9ycyA9IFtdXHJcblx0Zm9yIHBhbGV0dGUgaW4gcGFsZXR0ZXNcclxuXHRcdGlmIHBhbGV0dGUubGVuZ3RoID49IG1vc3RfY29sb3JzLmxlbmd0aFxyXG5cdFx0XHRtb3N0X2NvbG9ycyA9IHBhbGV0dGVcclxuXHRcclxuXHRuID0gbW9zdF9jb2xvcnMubGVuZ3RoXHJcblx0aWYgbiA8IDRcclxuXHRcdHRocm93IG5ldyBFcnJvcihbXHJcblx0XHRcdFwiTm8gY29sb3JzIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IG9uZSBjb2xvciBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBhIGNvdXBsZSBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgYSBmZXcgY29sb3JzIGZvdW5kXCJcclxuXHRcdF1bbl0gKyBcIiAoI3tufSlcIilcclxuXHRcclxuXHRtb3N0X2NvbG9yc1xyXG4iLCJcclxuIyBXaGF0IGRvZXMgSFBMIHN0YW5kIGZvcj9cclxuIyBIb3dkeSwgUGFsZXR0ZSBMb3ZlcnMhXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IFwiUGFsZXR0ZVwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYW4gSFBMIHBhbGV0dGVcIlxyXG5cdGlmIG5vdCBsaW5lc1sxXS5tYXRjaCAvVmVyc2lvbiBbMzRdXFwuMC9cclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVuc3VwcG9ydGVkIEhQTCB2ZXJzaW9uXCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdFxyXG5cdGZvciBsaW5lLCBpIGluIGxpbmVzXHJcblx0XHRpZiBsaW5lLm1hdGNoIC8uKyAuKiAuKy9cclxuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcclxuXHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRyOiByZ2JbMF1cclxuXHRcdFx0XHRnOiByZ2JbMV1cclxuXHRcdFx0XHRiOiByZ2JbMl1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBQYWludC5ORVQgcGFsZXR0ZSBmaWxlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHJcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXHJcblx0XHJcblx0Zm9yIGxpbmUgaW4gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0XHRtID0gbGluZS5tYXRjaCgvXihbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkkL2kpXHJcblx0XHRpZiBtIHRoZW4gcGFsZXR0ZS5hZGRcclxuXHRcdFx0YTogaGV4IG1bMV1cclxuXHRcdFx0cjogaGV4IG1bMl1cclxuXHRcdFx0ZzogaGV4IG1bM11cclxuXHRcdFx0YjogaGV4IG1bNF1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBKQVNDIFBBTCBmaWxlIChQYWludCBTaG9wIFBybyBwYWxldHRlIGZpbGUpXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBcIkpBU0MtUEFMXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhIEpBU0MtUEFMXCJcclxuXHRpZiBsaW5lc1sxXSBpc250IFwiMDEwMFwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIEpBU0MtUEFMIHZlcnNpb25cIlxyXG5cdGlmIGxpbmVzWzJdIGlzbnQgXCIyNTZcIlxyXG5cdFx0XCJ0aGF0J3Mgb2tcIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0I25fY29sb3JzID0gTnVtYmVyKGxpbmVzWzJdKVxyXG5cdFxyXG5cdGZvciBsaW5lLCBpIGluIGxpbmVzXHJcblx0XHRpZiBsaW5lIGlzbnQgXCJcIiBhbmQgaSA+IDJcclxuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcclxuXHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRyOiByZ2JbMF1cclxuXHRcdFx0XHRnOiByZ2JbMV1cclxuXHRcdFx0XHRiOiByZ2JbMl1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBSZXNvdXJjZSBJbnRlcmNoYW5nZSBGaWxlIEZvcm1hdCBQQUwgZmlsZVxyXG5cclxuIyBwb3J0ZWQgZnJvbSBDIyBjb2RlIGF0IGh0dHBzOi8vd29ybXMyZC5pbmZvL1BhbGV0dGVfZmlsZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHQjIFJJRkYgaGVhZGVyXHJcblx0cmlmZiA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcIlJJRkZcIlxyXG5cdGRhdGFTaXplID0gYnIucmVhZFVJbnQzMigpXHJcblx0dHlwZSA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcIlBBTCBcIlxyXG5cdFxyXG5cdGlmIHJpZmYgaXNudCBcIlJJRkZcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiUklGRiBoZWFkZXIgbm90IGZvdW5kOyBub3QgYSBSSUZGIFBBTCBmaWxlXCJcclxuXHRcclxuXHRpZiB0eXBlIGlzbnQgXCJQQUwgXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlwiXCJcclxuXHRcdFx0UklGRiBoZWFkZXIgc2F5cyB0aGlzIGlzbid0IGEgUEFMIGZpbGUsXHJcblx0XHRcdG1vcmUgb2YgYSBzb3J0IG9mICN7KCh0eXBlK1wiXCIpLnRyaW0oKSl9IGZpbGVcclxuXHRcdFwiXCJcIlxyXG5cdFxyXG5cdCMgRGF0YSBjaHVua1xyXG5cdGNodW5rVHlwZSA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcImRhdGFcIlxyXG5cdGNodW5rU2l6ZSA9IGJyLnJlYWRVSW50MzIoKVxyXG5cdHBhbFZlcnNpb24gPSBici5yZWFkVUludDE2KCkgIyAweDAzMDBcclxuXHRwYWxOdW1FbnRyaWVzID0gYnIucmVhZFVJbnQxNigpXHJcblx0XHJcblx0XHJcblx0aWYgY2h1bmtUeXBlIGlzbnQgXCJkYXRhXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIkRhdGEgY2h1bmsgbm90IGZvdW5kICguLi4nI3tjaHVua1R5cGV9Jz8pXCJcclxuXHRcclxuXHRpZiBwYWxWZXJzaW9uIGlzbnQgMHgwMzAwXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbnN1cHBvcnRlZCBQQUwgZmlsZSBmb3JtYXQgdmVyc2lvbjogMHgje3BhbFZlcnNpb24udG9TdHJpbmcoMTYpfVwiXHJcblx0XHJcblx0IyBDb2xvcnNcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGkgPSAwXHJcblx0d2hpbGUgKGkgKz0gMSkgPCBwYWxOdW1FbnRyaWVzIC0gMVxyXG5cdFx0XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRfOiBici5yZWFkQnl0ZSgpICMgXCJmbGFnc1wiLCBhbHdheXMgMHgwMFxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgUEFMIChTdGFyQ3JhZnQgcmF3IHBhbGV0dGUpXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0Zm9yIGkgaW4gWzAuLi4yNTVdXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHQjOiBubyBwYWRkaW5nXHJcblx0XHJcblx0Iz8gcGFsZXR0ZS5uX2NvbHVtbnMgPSAxNlxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgV1BFIChTdGFyQ3JhZnQgcGFkZGVkIHJhdyBwYWxldHRlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdGZvciBpIGluIFswLi4uMjU1XVxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0XzogYnIucmVhZEJ5dGUoKSAjIHBhZGRpbmdcclxuXHRcclxuXHRwYWxldHRlLm5fY29sdW1ucyA9IDE2XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuL1BhbGV0dGVcIlxyXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcclxuXHJcbmNsYXNzIFJhbmRvbUNvbG9yIGV4dGVuZHMgQ29sb3JcclxuXHRjb25zdHJ1Y3RvcjogLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEByYW5kb21pemUoKVxyXG5cdFxyXG5cdHJhbmRvbWl6ZTogLT5cclxuXHRcdEBoID0gTWF0aC5yYW5kb20oKSAqIDM2MFxyXG5cdFx0QHMgPSBNYXRoLnJhbmRvbSgpICogMTAwXHJcblx0XHRAbCA9IE1hdGgucmFuZG9tKCkgKiAxMDBcclxuXHRcclxuXHR0b1N0cmluZzogLT5cclxuXHRcdEByYW5kb21pemUoKVxyXG5cdFx0XCJoc2woI3tAaH0sICN7QHN9JSwgI3tAbH0lKVwiXHJcblx0XHJcblx0aXM6IC0+IG5vXHJcblxyXG5jbGFzcyBSYW5kb21QYWxldHRlIGV4dGVuZHMgUGFsZXR0ZVxyXG5cdGNvbnN0cnVjdG9yOiAtPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QGxvYWRlZF9hcyA9IFwiQ29tcGxldGVseSBSYW5kb20gQ29sb3Jz4oSiXCJcclxuXHRcdEBsb2FkZWRfYXNfY2xhdXNlID0gXCIoLmNyYyBzamYoRGYwOXNqZGZrc2RsZm1ubSAnOyc7XCJcclxuXHRcdEBjb25maWRlbmNlID0gMFxyXG5cdFx0QGZpbmFsaXplKClcclxuXHRcdGZvciBpIGluIFswLi5NYXRoLnJhbmRvbSgpKjE1KzVdXHJcblx0XHRcdEBwdXNoIG5ldyBSYW5kb21Db2xvcigpXHJcblxyXG5jbGFzcyBMb2FkaW5nRXJyb3JzIGV4dGVuZHMgRXJyb3JcclxuXHRjb25zdHJ1Y3RvcjogKEBlcnJvcnMpLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEBtZXNzYWdlID0gXCJTb21lIGVycm9ycyB3ZXJlIGVuY291bnRlcmVkIHdoZW4gbG9hZGluZzpcIiArXHJcblx0XHRcdGZvciBlcnJvciBpbiBAZXJyb3JzXHJcblx0XHRcdFx0XCJcXG5cXHRcIiArIGVycm9yLm1lc3NhZ2VcclxuXHJcbmxvYWRfcGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxyXG5cdFxyXG5cdHBhbGV0dGVfbG9hZGVycyA9IFtcclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJQYWludCBTaG9wIFBybyBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wicGFsXCIsIFwicHNwcGFsZXR0ZVwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50U2hvcFByb1wiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUklGRiBQQUxcIlxyXG5cdFx0XHRleHRzOiBbXCJwYWxcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9SSUZGXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJDb2xvclNjaGVtZXIgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImNzXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQ29sb3JTY2hlbWVyXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJQYWludC5ORVQgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInR4dFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50Lk5FVFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiR0lNUCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiZ3BsXCIsIFwiZ2ltcFwiLCBcImNvbG9yc1wiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0dJTVBcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkNTUy1zdHlsZSBjb2xvcnNcIlxyXG5cdFx0XHRleHRzOiBbXCJjc3NcIiwgXCJzY3NzXCIsIFwic2Fzc1wiLCBcImxlc3NcIiwgXCJodG1sXCIsIFwic3ZnXCIsIFwianNcIiwgXCJ0c1wiLCBcInhtbFwiLCBcInR4dFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0dlbmVyaWNcIlxyXG5cdFx0fVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBDb2xvciBTd2F0Y2hcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjb1wiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvclN3YXRjaFwiXHJcblx0XHQjIH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgVGFibGVcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjdFwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvclRhYmxlXCJcclxuXHRcdCMgfVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBTd2F0Y2ggRXhjaGFuZ2VcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFzZVwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVTd2F0Y2hFeGNoYW5nZVwiXHJcblx0XHQjIH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgQm9va1wiXHJcblx0XHQjIFx0ZXh0czogW1wiYWNiXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yQm9va1wiXHJcblx0XHQjIH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJIUEwgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImhwbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0hQTFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiU3RhckNyYWZ0IHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJwYWxcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TdGFyQ3JhZnRcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlN0YXJDcmFmdCB0ZXJyYWluIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJ3cGVcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TdGFyQ3JhZnRQYWRkZWRcIlxyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkF1dG9DQUQgQ29sb3IgQm9va1wiXHJcblx0XHQjIFx0ZXh0czogW1wiYWNiXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BdXRvQ0FEQ29sb3JCb29rXCJcclxuXHRcdCMgfVxyXG5cdFx0XHJcblx0XHQjIHtcclxuXHRcdCMgXHQjIChzYW1lIGFzIFBhaW50IFNob3AgUHJvIHBhbGV0dGU/KVxyXG5cdFx0IyBcdG5hbWU6IFwiQ29yZWxEUkFXIHBhbGV0dGVcIlxyXG5cdFx0IyBcdGV4dHM6IFtcInBhbFwiLCBcImNwbFwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQ29yZWxEUkFXXCJcclxuXHRcdCMgfVxyXG5cdF1cclxuXHRcclxuXHQjIGZpbmQgcGFsZXR0ZSBsb2FkZXJzIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cclxuXHRmb3IgcGwgaW4gcGFsZXR0ZV9sb2FkZXJzXHJcblx0XHRwbC5tYXRjaGVzX2V4dCA9IHBsLmV4dHMuaW5kZXhPZihvLmZpbGVfZXh0KSBpc250IC0xXHJcblx0XHJcblx0IyBtb3ZlIHBhbGV0dGUgbG9hZGVycyB0byB0aGUgYmVnaW5uaW5nIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cclxuXHRwYWxldHRlX2xvYWRlcnMuc29ydCAocGwxLCBwbDIpLT5cclxuXHRcdHBsMi5tYXRjaGVzX2V4dCAtIHBsMS5tYXRjaGVzX2V4dFxyXG5cdFxyXG5cdCMgdHJ5IGxvYWRpbmcgc3R1ZmZcclxuXHRlcnJvcnMgPSBbXVxyXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcclxuXHRcdFxyXG5cdFx0dHJ5XHJcblx0XHRcdHBhbGV0dGUgPSBwbC5sb2FkKG8pXHJcblx0XHRcdGlmIHBhbGV0dGUubGVuZ3RoIGlzIDBcclxuXHRcdFx0XHRwYWxldHRlID0gbnVsbFxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIm5vIGNvbG9ycyByZXR1cm5lZFwiXHJcblx0XHRjYXRjaCBlXHJcblx0XHRcdG1zZyA9IFwiZmFpbGVkIHRvIGxvYWQgI3tvLmZpbGVfbmFtZX0gYXMgI3twbC5uYW1lfTogI3tlLm1lc3NhZ2V9XCJcclxuXHRcdFx0aWYgcGwubWF0Y2hlc19leHQgYW5kIG5vdCBlLm1lc3NhZ2UubWF0Y2goL25vdCBhL2kpXHJcblx0XHRcdFx0Y29uc29sZT8uZXJyb3I/IG1zZ1xyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0Y29uc29sZT8ud2Fybj8gbXNnXHJcblx0XHRcdFxyXG5cdFx0XHQjIFRPRE86IG1heWJlIHRoaXMgc2hvdWxkbid0IGJlIGFuIEVycm9yIG9iamVjdCwganVzdCBhIHttZXNzYWdlLCBlcnJvcn0gb2JqZWN0XHJcblx0XHRcdCMgb3Ige2ZyaWVuZGx5TWVzc2FnZSwgZXJyb3J9XHJcblx0XHRcdGVyciA9IG5ldyBFcnJvciBtc2dcclxuXHRcdFx0ZXJyLmVycm9yID0gZVxyXG5cdFx0XHRlcnJvcnMucHVzaCBlcnJcclxuXHRcdFxyXG5cdFx0aWYgcGFsZXR0ZVxyXG5cdFx0XHRjb25zb2xlPy5pbmZvPyBcImxvYWRlZCAje28uZmlsZV9uYW1lfSBhcyAje3BsLm5hbWV9XCJcclxuXHRcdFx0cGFsZXR0ZS5jb25maWRlbmNlID0gaWYgcGwubWF0Y2hlc19leHQgdGhlbiAwLjkgZWxzZSAwLjAxXHJcblx0XHRcdHBhbGV0dGUubG9hZGVkX2FzID0gcGwubmFtZVxyXG5cdFx0XHRleHRzX3ByZXR0eSA9IFwiKC4je3BsLmV4dHMuam9pbihcIiwgLlwiKX0pXCJcclxuXHRcdFx0XHJcblx0XHRcdGlmIHBsLm1hdGNoZXNfZXh0XHJcblx0XHRcdFx0cGFsZXR0ZS5sb2FkZWRfYXNfY2xhdXNlID0gZXh0c19wcmV0dHlcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHBhbGV0dGUubG9hZGVkX2FzX2NsYXVzZSA9IFwiIGZvciBzb21lIHJlYXNvblwiXHJcblx0XHRcdFxyXG5cdFx0XHRwYWxldHRlLmZpbmFsaXplKClcclxuXHRcdFx0Y2FsbGJhY2sobnVsbCwgcGFsZXR0ZSlcclxuXHRcdFx0cmV0dXJuXHJcblx0XHJcblx0Y2FsbGJhY2sobmV3IExvYWRpbmdFcnJvcnMoZXJyb3JzKSlcclxuXHRyZXR1cm5cclxuXHJcbm5vcm1hbGl6ZV9vcHRpb25zID0gKG8gPSB7fSktPlxyXG5cdGlmIHR5cGVvZiBvIGlzIFwic3RyaW5nXCIgb3IgbyBpbnN0YW5jZW9mIFN0cmluZ1xyXG5cdFx0byA9IGZpbGVfcGF0aDogb1xyXG5cdGlmIEZpbGU/IGFuZCBvIGluc3RhbmNlb2YgRmlsZVxyXG5cdFx0byA9IGZpbGU6IG9cclxuXHRcclxuXHRvLm1pbl9jb2xvcnMgPz0gby5taW5Db2xvcnMgPyAyXHJcblx0by5tYXhfY29sb3JzID89IG8ubWF4Q29sb3JzID8gMjU2XHJcblx0by5maWxlX3BhdGggPz0gby5maWxlUGF0aFxyXG5cdG8uZmlsZV9uYW1lID89IG8uZmlsZU5hbWUgPyBvLmZuYW1lID8gby5maWxlPy5uYW1lID8gKGlmIG8uZmlsZV9wYXRoIHRoZW4gcmVxdWlyZShcInBhdGhcIikuYmFzZW5hbWUoby5maWxlX3BhdGgpKVxyXG5cdG8uZmlsZV9leHQgPz0gby5maWxlRXh0ID8gXCIje28uZmlsZV9uYW1lfVwiLnNwbGl0KFwiLlwiKS5wb3AoKVxyXG5cdG8uZmlsZV9leHQgPSAoXCIje28uZmlsZV9leHR9XCIpLnRvTG93ZXJDYXNlKClcclxuXHRvXHJcblxyXG4jIEdldCBwYWxldHRlIGZyb20gYSBmaWxlXHJcblBhbGV0dGUubG9hZCA9IChvLCBjYWxsYmFjayktPlxyXG5cdGlmIG5vdCBvXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJQYXJhbWV0ZXJzIHJlcXVpcmVkOiBQYWxldHRlLmxvYWQob3B0aW9ucywgZnVuY3Rpb24gY2FsbGJhY2soZXJyLCBwYWxldHRlKXt9KVwiXHJcblx0aWYgbm90IGNhbGxiYWNrXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJDYWxsYmFjayByZXF1aXJlZDogUGFsZXR0ZS5sb2FkKG9wdGlvbnMsIGZ1bmN0aW9uIGNhbGxiYWNrKGVyciwgcGFsZXR0ZSl7fSlcIlxyXG5cdFxyXG5cdG8gPSBub3JtYWxpemVfb3B0aW9ucyBvXHJcblx0XHJcblx0aWYgby5kYXRhXHJcblx0XHRsb2FkX3BhbGV0dGUobywgY2FsbGJhY2spXHJcblx0ZWxzZSBpZiBGaWxlPyBhbmQgby5maWxlIGluc3RhbmNlb2YgRmlsZVxyXG5cdFx0ZnIgPSBuZXcgRmlsZVJlYWRlclxyXG5cdFx0ZnIub25sb2FkID0gLT5cclxuXHRcdFx0by5kYXRhID0gZnIucmVzdWx0XHJcblx0XHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRcdGZyLnJlYWRBc0JpbmFyeVN0cmluZyBvLmZpbGVcclxuXHRlbHNlIGlmIG8uZmlsZV9wYXRoP1xyXG5cdFx0ZnMgPSByZXF1aXJlIFwiZnNcIlxyXG5cdFx0ZnMucmVhZEZpbGUgby5maWxlX3BhdGgsIChlcnIsIGRhdGEpLT5cclxuXHRcdFx0aWYgZXJyXHJcblx0XHRcdFx0Y2FsbGJhY2soZXJyKVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0by5kYXRhID0gZGF0YS50b1N0cmluZyhcImJpbmFyeVwiKVxyXG5cdFx0XHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRlbHNlXHJcblx0XHRjYWxsYmFjayhuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZC4gVGhlIEZpbGUgQVBJIG1heSBub3QgYmUgc3VwcG9ydGVkLlwiKSkgIyB1bS4uLlxyXG5cdFx0IyB0aGUgRmlsZSBBUEkgd291bGQgYmUgc3VwcG9ydGVkIGlmIHlvdSd2ZSBwYXNzZWQgYSBGaWxlXHJcblx0XHQjIFRPRE86IGEgYmV0dGVyIGVycm9yIG1lc3NhZ2UsIGFib3V0IG9wdGlvbnMgKG5vdCkgcGFzc2VkXHJcblxyXG5cclxuIyBHZXQgYSBwYWxldHRlIGZyb20gYSBmaWxlIG9yIGJ5IGFueSBtZWFucyBuZWNlc3NhcnlcclxuIyAoYXMgaW4gZmFsbCBiYWNrIHRvIGNvbXBsZXRlbHkgcmFuZG9tIGRhdGEpXHJcblBhbGV0dGUuZ2ltbWUgPSAobywgY2FsbGJhY2spLT5cclxuXHRvID0gbm9ybWFsaXplX29wdGlvbnMgb1xyXG5cdFxyXG5cdFBhbGV0dGUubG9hZCBvLCAoZXJyLCBwYWxldHRlKS0+XHJcblx0XHRjYWxsYmFjayhudWxsLCBwYWxldHRlID8gbmV3IFJhbmRvbVBhbGV0dGUpXHJcblxyXG4jIEV4cG9ydHNcclxuUCA9IG1vZHVsZS5leHBvcnRzID0gUGFsZXR0ZVxyXG5QLkNvbG9yID0gQ29sb3JcclxuUC5QYWxldHRlID0gUGFsZXR0ZVxyXG5QLlJhbmRvbUNvbG9yID0gUmFuZG9tQ29sb3JcclxuUC5SYW5kb21QYWxldHRlID0gUmFuZG9tUGFsZXR0ZVxyXG4jIFAuTG9hZGluZ0Vycm9ycyA9IExvYWRpbmdFcnJvcnNcclxuIl19
