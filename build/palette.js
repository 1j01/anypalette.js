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
      // console?.info? "loaded #{o.file_name} as #{pl.name}"
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsInNyYy9CaW5hcnlSZWFkZXIuY29mZmVlIiwic3JjL0NvbG9yLmNvZmZlZSIsInNyYy9QYWxldHRlLmNvZmZlZSIsInNyYy9sb2FkZXJzL0NvbG9yU2NoZW1lci5jb2ZmZWUiLCJzcmMvbG9hZGVycy9HSU1QLmNvZmZlZSIsInNyYy9sb2FkZXJzL0dlbmVyaWMuY29mZmVlIiwic3JjL2xvYWRlcnMvSFBMLmNvZmZlZSIsInNyYy9sb2FkZXJzL1BhaW50Lk5FVC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9QYWludFNob3BQcm8uY29mZmVlIiwic3JjL2xvYWRlcnMvUklGRi5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TdGFyQ3JhZnQuY29mZmVlIiwic3JjL2xvYWRlcnMvU3RhckNyYWZ0UGFkZGVkLmNvZmZlZSIsInNyYy9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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LFFBQUgsQ0FBWSxDQUFDLENBQUMsU0FBZCxFQUF5QixRQUFBLENBQUMsR0FBRCxFQUFNLElBQU4sQ0FBQTtNQUN4QixJQUFHLEdBQUg7ZUFDQyxRQUFBLENBQVMsR0FBVCxFQUREO09BQUEsTUFBQTtRQUdDLENBQUMsQ0FBQyxJQUFGLEdBQVMsSUFBSSxDQUFDLFFBQUwsQ0FBYyxRQUFkO2VBQ1QsWUFBQSxDQUFhLENBQWIsRUFBZ0IsUUFBaEIsRUFKRDs7SUFEd0IsQ0FBekIsRUFGSTtHQUFBLE1BQUE7V0FTSixRQUFBLENBQVMsSUFBSSxLQUFKLENBQVUsb0RBQVYsQ0FBVCxFQVRJOztBQWhCUyxFQXRMZjs7Ozs7OztBQXNOQSxPQUFPLENBQUMsS0FBUixHQUFnQixRQUFBLENBQUMsQ0FBRCxFQUFJLFFBQUosQ0FBQTtFQUNmLENBQUEsR0FBSSxpQkFBQSxDQUFrQixDQUFsQjtTQUVKLE9BQU8sQ0FBQyxJQUFSLENBQWEsQ0FBYixFQUFnQixRQUFBLENBQUMsR0FBRCxFQUFNLE9BQU4sQ0FBQTtXQUNmLFFBQUEsQ0FBUyxJQUFULG9CQUFlLFVBQVUsSUFBSSxhQUE3QjtFQURlLENBQWhCO0FBSGUsRUF0TmhCOzs7QUE2TkEsQ0FBQSxHQUFJLE1BQU0sQ0FBQyxPQUFQLEdBQWlCOztBQUNyQixDQUFDLENBQUMsS0FBRixHQUFVOztBQUNWLENBQUMsQ0FBQyxPQUFGLEdBQVk7O0FBQ1osQ0FBQyxDQUFDLFdBQUYsR0FBZ0I7O0FBQ2hCLENBQUMsQ0FBQyxhQUFGLEdBQWtCOztBQWpPbEIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvLyAuZGlybmFtZSwgLmJhc2VuYW1lLCBhbmQgLmV4dG5hbWUgbWV0aG9kcyBhcmUgZXh0cmFjdGVkIGZyb20gTm9kZS5qcyB2OC4xMS4xLFxuLy8gYmFja3BvcnRlZCBhbmQgdHJhbnNwbGl0ZWQgd2l0aCBCYWJlbCwgd2l0aCBiYWNrd2FyZHMtY29tcGF0IGZpeGVzXG5cbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICB2YXIgcGF0aCA9IChpID49IDApID8gYXJndW1lbnRzW2ldIDogcHJvY2Vzcy5jd2QoKTtcblxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfSBlbHNlIGlmICghcGF0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbiAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcbn07XG5cbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIGlzQWJzb2x1dGUgPSBleHBvcnRzLmlzQWJzb2x1dGUocGF0aCksXG4gICAgICB0cmFpbGluZ1NsYXNoID0gc3Vic3RyKHBhdGgsIC0xKSA9PT0gJy8nO1xuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICBwYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHBhdGggPSAnLic7XG4gIH1cbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xuICAgIHBhdGggKz0gJy8nO1xuICB9XG5cbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnLyc7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhdGhzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgcmV0dXJuIGV4cG9ydHMubm9ybWFsaXplKGZpbHRlcihwYXRocywgZnVuY3Rpb24ocCwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIHAgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5qb2luIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuLy8gcGF0aC5yZWxhdGl2ZShmcm9tLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbmV4cG9ydHMuc2VwID0gJy8nO1xuZXhwb3J0cy5kZWxpbWl0ZXIgPSAnOic7XG5cbmV4cG9ydHMuZGlybmFtZSA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHBhdGggPSBwYXRoICsgJyc7XG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcuJztcbiAgdmFyIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG4gIHZhciBoYXNSb290ID0gY29kZSA9PT0gNDcgLyovKi87XG4gIHZhciBlbmQgPSAtMTtcbiAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIGZvciAodmFyIGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMTsgLS1pKSB7XG4gICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICBpZiAoY29kZSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICBlbmQgPSBpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3JcbiAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlbmQgPT09IC0xKSByZXR1cm4gaGFzUm9vdCA/ICcvJyA6ICcuJztcbiAgaWYgKGhhc1Jvb3QgJiYgZW5kID09PSAxKSB7XG4gICAgLy8gcmV0dXJuICcvLyc7XG4gICAgLy8gQmFja3dhcmRzLWNvbXBhdCBmaXg6XG4gICAgcmV0dXJuICcvJztcbiAgfVxuICByZXR1cm4gcGF0aC5zbGljZSgwLCBlbmQpO1xufTtcblxuZnVuY3Rpb24gYmFzZW5hbWUocGF0aCkge1xuICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSBwYXRoID0gcGF0aCArICcnO1xuXG4gIHZhciBzdGFydCA9IDA7XG4gIHZhciBlbmQgPSAtMTtcbiAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIHZhciBpO1xuXG4gIGZvciAoaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICBpZiAocGF0aC5jaGFyQ29kZUF0KGkpID09PSA0NyAvKi8qLykge1xuICAgICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgIC8vIHBhdGggY29tcG9uZW50XG4gICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgIGVuZCA9IGkgKyAxO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlbmQgPT09IC0xKSByZXR1cm4gJyc7XG4gIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0LCBlbmQpO1xufVxuXG4vLyBVc2VzIGEgbWl4ZWQgYXBwcm9hY2ggZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5LCBhcyBleHQgYmVoYXZpb3IgY2hhbmdlZFxuLy8gaW4gbmV3IE5vZGUuanMgdmVyc2lvbnMsIHNvIG9ubHkgYmFzZW5hbWUoKSBhYm92ZSBpcyBiYWNrcG9ydGVkIGhlcmVcbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbiAocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gYmFzZW5hbWUocGF0aCk7XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbiAocGF0aCkge1xuICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSBwYXRoID0gcGF0aCArICcnO1xuICB2YXIgc3RhcnREb3QgPSAtMTtcbiAgdmFyIHN0YXJ0UGFydCA9IDA7XG4gIHZhciBlbmQgPSAtMTtcbiAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIC8vIFRyYWNrIHRoZSBzdGF0ZSBvZiBjaGFyYWN0ZXJzIChpZiBhbnkpIHdlIHNlZSBiZWZvcmUgb3VyIGZpcnN0IGRvdCBhbmRcbiAgLy8gYWZ0ZXIgYW55IHBhdGggc2VwYXJhdG9yIHdlIGZpbmRcbiAgdmFyIHByZURvdFN0YXRlID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICBpZiAoY29kZSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgc3RhcnRQYXJ0ID0gaSArIDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgIC8vIGV4dGVuc2lvblxuICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICBlbmQgPSBpICsgMTtcbiAgICB9XG4gICAgaWYgKGNvZGUgPT09IDQ2IC8qLiovKSB7XG4gICAgICAgIC8vIElmIHRoaXMgaXMgb3VyIGZpcnN0IGRvdCwgbWFyayBpdCBhcyB0aGUgc3RhcnQgb2Ygb3VyIGV4dGVuc2lvblxuICAgICAgICBpZiAoc3RhcnREb3QgPT09IC0xKVxuICAgICAgICAgIHN0YXJ0RG90ID0gaTtcbiAgICAgICAgZWxzZSBpZiAocHJlRG90U3RhdGUgIT09IDEpXG4gICAgICAgICAgcHJlRG90U3RhdGUgPSAxO1xuICAgIH0gZWxzZSBpZiAoc3RhcnREb3QgIT09IC0xKSB7XG4gICAgICAvLyBXZSBzYXcgYSBub24tZG90IGFuZCBub24tcGF0aCBzZXBhcmF0b3IgYmVmb3JlIG91ciBkb3QsIHNvIHdlIHNob3VsZFxuICAgICAgLy8gaGF2ZSBhIGdvb2QgY2hhbmNlIGF0IGhhdmluZyBhIG5vbi1lbXB0eSBleHRlbnNpb25cbiAgICAgIHByZURvdFN0YXRlID0gLTE7XG4gICAgfVxuICB9XG5cbiAgaWYgKHN0YXJ0RG90ID09PSAtMSB8fCBlbmQgPT09IC0xIHx8XG4gICAgICAvLyBXZSBzYXcgYSBub24tZG90IGNoYXJhY3RlciBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIGRvdFxuICAgICAgcHJlRG90U3RhdGUgPT09IDAgfHxcbiAgICAgIC8vIFRoZSAocmlnaHQtbW9zdCkgdHJpbW1lZCBwYXRoIGNvbXBvbmVudCBpcyBleGFjdGx5ICcuLidcbiAgICAgIHByZURvdFN0YXRlID09PSAxICYmIHN0YXJ0RG90ID09PSBlbmQgLSAxICYmIHN0YXJ0RG90ID09PSBzdGFydFBhcnQgKyAxKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0RG90LCBlbmQpO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyICh4cywgZikge1xuICAgIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGYoeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG52YXIgc3Vic3RyID0gJ2FiJy5zdWJzdHIoLTEpID09PSAnYidcbiAgICA/IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHsgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbikgfVxuICAgIDogZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbik7XG4gICAgfVxuO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIlxyXG4jIyNcclxuQmluYXJ5UmVhZGVyXHJcblxyXG5Nb2RpZmllZCBieSBJc2FpYWggT2RobmVyXHJcbkBUT0RPOiB1c2UgakRhdGFWaWV3ICsgakJpbmFyeSBpbnN0ZWFkXHJcblxyXG5SZWZhY3RvcmVkIGJ5IFZqZXV4IDx2amV1eHhAZ21haWwuY29tPlxyXG5odHRwOi8vYmxvZy52amV1eC5jb20vMjAxMC9qYXZhc2NyaXB0L2phdmFzY3JpcHQtYmluYXJ5LXJlYWRlci5odG1sXHJcblxyXG5PcmlnaW5hbFxyXG4rIEpvbmFzIFJhb25pIFNvYXJlcyBTaWx2YVxyXG5AIGh0dHA6Ly9qc2Zyb21oZWxsLmNvbS9jbGFzc2VzL2JpbmFyeS1wYXJzZXIgW3Jldi4gIzFdXHJcbiMjI1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG5jbGFzcyBCaW5hcnlSZWFkZXJcclxuXHRjb25zdHJ1Y3RvcjogKGRhdGEpLT5cclxuXHRcdEBfYnVmZmVyID0gZGF0YVxyXG5cdFx0QF9wb3MgPSAwXHJcblxyXG5cdCMgUHVibGljIChjdXN0b20pXHJcblx0XHJcblx0cmVhZEJ5dGU6IC0+XHJcblx0XHRAX2NoZWNrU2l6ZSg4KVxyXG5cdFx0Y2ggPSB0aGlzLl9idWZmZXIuY2hhckNvZGVBdChAX3BvcykgJiAweGZmXHJcblx0XHRAX3BvcyArPSAxXHJcblx0XHRjaCAmIDB4ZmZcclxuXHRcclxuXHRyZWFkVW5pY29kZVN0cmluZzogLT5cclxuXHRcdGxlbmd0aCA9IEByZWFkVUludDE2KClcclxuXHRcdCMgY29uc29sZS5sb2cge2xlbmd0aH1cclxuXHRcdEBfY2hlY2tTaXplKGxlbmd0aCAqIDE2KVxyXG5cdFx0c3RyID0gXCJcIlxyXG5cdFx0Zm9yIGkgaW4gWzAuLmxlbmd0aF1cclxuXHRcdFx0c3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoQF9idWZmZXIuc3Vic3RyKEBfcG9zLCAxKSB8IChAX2J1ZmZlci5zdWJzdHIoQF9wb3MrMSwgMSkgPDwgOCkpXHJcblx0XHRcdEBfcG9zICs9IDJcclxuXHRcdHN0clxyXG5cdFxyXG5cdCMgUHVibGljXHJcblx0XHJcblx0cmVhZEludDg6IC0+IEBfZGVjb2RlSW50KDgsIHRydWUpXHJcblx0cmVhZFVJbnQ4OiAtPiBAX2RlY29kZUludCg4LCBmYWxzZSlcclxuXHRyZWFkSW50MTY6IC0+IEBfZGVjb2RlSW50KDE2LCB0cnVlKVxyXG5cdHJlYWRVSW50MTY6IC0+IEBfZGVjb2RlSW50KDE2LCBmYWxzZSlcclxuXHRyZWFkSW50MzI6IC0+IEBfZGVjb2RlSW50KDMyLCB0cnVlKVxyXG5cdHJlYWRVSW50MzI6IC0+IEBfZGVjb2RlSW50KDMyLCBmYWxzZSlcclxuXHJcblx0cmVhZEZsb2F0OiAtPiBAX2RlY29kZUZsb2F0KDIzLCA4KVxyXG5cdHJlYWREb3VibGU6IC0+IEBfZGVjb2RlRmxvYXQoNTIsIDExKVxyXG5cdFxyXG5cdHJlYWRDaGFyOiAtPiBAcmVhZFN0cmluZygxKVxyXG5cdHJlYWRTdHJpbmc6IChsZW5ndGgpLT5cclxuXHRcdEBfY2hlY2tTaXplKGxlbmd0aCAqIDgpXHJcblx0XHRyZXN1bHQgPSBAX2J1ZmZlci5zdWJzdHIoQF9wb3MsIGxlbmd0aClcclxuXHRcdEBfcG9zICs9IGxlbmd0aFxyXG5cdFx0cmVzdWx0XHJcblxyXG5cdHNlZWs6IChwb3MpLT5cclxuXHRcdEBfcG9zID0gcG9zXHJcblx0XHRAX2NoZWNrU2l6ZSgwKVxyXG5cdFxyXG5cdGdldFBvc2l0aW9uOiAtPiBAX3Bvc1xyXG5cdFxyXG5cdGdldFNpemU6IC0+IEBfYnVmZmVyLmxlbmd0aFxyXG5cdFxyXG5cclxuXHJcblx0IyBQcml2YXRlXHJcblx0XHJcblx0X2RlY29kZUZsb2F0OiBgZnVuY3Rpb24ocHJlY2lzaW9uQml0cywgZXhwb25lbnRCaXRzKXtcclxuXHRcdHZhciBsZW5ndGggPSBwcmVjaXNpb25CaXRzICsgZXhwb25lbnRCaXRzICsgMTtcclxuXHRcdHZhciBzaXplID0gbGVuZ3RoID4+IDM7XHJcblx0XHR0aGlzLl9jaGVja1NpemUobGVuZ3RoKTtcclxuXHJcblx0XHR2YXIgYmlhcyA9IE1hdGgucG93KDIsIGV4cG9uZW50Qml0cyAtIDEpIC0gMTtcclxuXHRcdHZhciBzaWduYWwgPSB0aGlzLl9yZWFkQml0cyhwcmVjaXNpb25CaXRzICsgZXhwb25lbnRCaXRzLCAxLCBzaXplKTtcclxuXHRcdHZhciBleHBvbmVudCA9IHRoaXMuX3JlYWRCaXRzKHByZWNpc2lvbkJpdHMsIGV4cG9uZW50Qml0cywgc2l6ZSk7XHJcblx0XHR2YXIgc2lnbmlmaWNhbmQgPSAwO1xyXG5cdFx0dmFyIGRpdmlzb3IgPSAyO1xyXG5cdFx0dmFyIGN1ckJ5dGUgPSAwOyAvL2xlbmd0aCArICgtcHJlY2lzaW9uQml0cyA+PiAzKSAtIDE7XHJcblx0XHRkbyB7XHJcblx0XHRcdHZhciBieXRlVmFsdWUgPSB0aGlzLl9yZWFkQnl0ZSgrK2N1ckJ5dGUsIHNpemUpO1xyXG5cdFx0XHR2YXIgc3RhcnRCaXQgPSBwcmVjaXNpb25CaXRzICUgOCB8fCA4O1xyXG5cdFx0XHR2YXIgbWFzayA9IDEgPDwgc3RhcnRCaXQ7XHJcblx0XHRcdHdoaWxlIChtYXNrID4+PSAxKSB7XHJcblx0XHRcdFx0aWYgKGJ5dGVWYWx1ZSAmIG1hc2spIHtcclxuXHRcdFx0XHRcdHNpZ25pZmljYW5kICs9IDEgLyBkaXZpc29yO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkaXZpc29yICo9IDI7XHJcblx0XHRcdH1cclxuXHRcdH0gd2hpbGUgKHByZWNpc2lvbkJpdHMgLT0gc3RhcnRCaXQpO1xyXG5cclxuXHRcdHRoaXMuX3BvcyArPSBzaXplO1xyXG5cclxuXHRcdHJldHVybiBleHBvbmVudCA9PSAoYmlhcyA8PCAxKSArIDEgPyBzaWduaWZpY2FuZCA/IE5hTiA6IHNpZ25hbCA/IC1JbmZpbml0eSA6ICtJbmZpbml0eVxyXG5cdFx0XHQ6ICgxICsgc2lnbmFsICogLTIpICogKGV4cG9uZW50IHx8IHNpZ25pZmljYW5kID8gIWV4cG9uZW50ID8gTWF0aC5wb3coMiwgLWJpYXMgKyAxKSAqIHNpZ25pZmljYW5kXHJcblx0XHRcdDogTWF0aC5wb3coMiwgZXhwb25lbnQgLSBiaWFzKSAqICgxICsgc2lnbmlmaWNhbmQpIDogMCk7XHJcblx0fWBcclxuXHJcblx0X2RlY29kZUludDogYGZ1bmN0aW9uKGJpdHMsIHNpZ25lZCl7XHJcblx0XHR2YXIgeCA9IHRoaXMuX3JlYWRCaXRzKDAsIGJpdHMsIGJpdHMgLyA4KSwgbWF4ID0gTWF0aC5wb3coMiwgYml0cyk7XHJcblx0XHR2YXIgcmVzdWx0ID0gc2lnbmVkICYmIHggPj0gbWF4IC8gMiA/IHggLSBtYXggOiB4O1xyXG5cclxuXHRcdHRoaXMuX3BvcyArPSBiaXRzIC8gODtcclxuXHRcdHJldHVybiByZXN1bHQ7XHJcblx0fWBcclxuXHJcblx0I3NobCBmaXg6IEhlbnJpIFRvcmdlbWFuZSB+MTk5NiAoY29tcHJlc3NlZCBieSBKb25hcyBSYW9uaSlcclxuXHRfc2hsOiBgZnVuY3Rpb24gKGEsIGIpe1xyXG5cdFx0Zm9yICgrK2I7IC0tYjsgYSA9ICgoYSAlPSAweDdmZmZmZmZmICsgMSkgJiAweDQwMDAwMDAwKSA9PSAweDQwMDAwMDAwID8gYSAqIDIgOiAoYSAtIDB4NDAwMDAwMDApICogMiArIDB4N2ZmZmZmZmYgKyAxKTtcclxuXHRcdHJldHVybiBhO1xyXG5cdH1gXHJcblx0XHJcblx0X3JlYWRCeXRlOiBgZnVuY3Rpb24gKGksIHNpemUpIHtcclxuXHRcdHJldHVybiB0aGlzLl9idWZmZXIuY2hhckNvZGVBdCh0aGlzLl9wb3MgKyBzaXplIC0gaSAtIDEpICYgMHhmZjtcclxuXHR9YFxyXG5cclxuXHRfcmVhZEJpdHM6IGBmdW5jdGlvbiAoc3RhcnQsIGxlbmd0aCwgc2l6ZSkge1xyXG5cdFx0dmFyIG9mZnNldExlZnQgPSAoc3RhcnQgKyBsZW5ndGgpICUgODtcclxuXHRcdHZhciBvZmZzZXRSaWdodCA9IHN0YXJ0ICUgODtcclxuXHRcdHZhciBjdXJCeXRlID0gc2l6ZSAtIChzdGFydCA+PiAzKSAtIDE7XHJcblx0XHR2YXIgbGFzdEJ5dGUgPSBzaXplICsgKC0oc3RhcnQgKyBsZW5ndGgpID4+IDMpO1xyXG5cdFx0dmFyIGRpZmYgPSBjdXJCeXRlIC0gbGFzdEJ5dGU7XHJcblxyXG5cdFx0dmFyIHN1bSA9ICh0aGlzLl9yZWFkQnl0ZShjdXJCeXRlLCBzaXplKSA+PiBvZmZzZXRSaWdodCkgJiAoKDEgPDwgKGRpZmYgPyA4IC0gb2Zmc2V0UmlnaHQgOiBsZW5ndGgpKSAtIDEpO1xyXG5cclxuXHRcdGlmIChkaWZmICYmIG9mZnNldExlZnQpIHtcclxuXHRcdFx0c3VtICs9ICh0aGlzLl9yZWFkQnl0ZShsYXN0Qnl0ZSsrLCBzaXplKSAmICgoMSA8PCBvZmZzZXRMZWZ0KSAtIDEpKSA8PCAoZGlmZi0tIDw8IDMpIC0gb2Zmc2V0UmlnaHQ7IFxyXG5cdFx0fVxyXG5cclxuXHRcdHdoaWxlIChkaWZmKSB7XHJcblx0XHRcdHN1bSArPSB0aGlzLl9zaGwodGhpcy5fcmVhZEJ5dGUobGFzdEJ5dGUrKywgc2l6ZSksIChkaWZmLS0gPDwgMykgLSBvZmZzZXRSaWdodCk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHN1bTtcclxuXHR9YFxyXG5cclxuXHRfY2hlY2tTaXplOiAobmVlZGVkQml0cyktPlxyXG5cdFx0aWYgQF9wb3MgKyBNYXRoLmNlaWwobmVlZGVkQml0cyAvIDgpID4gQF9idWZmZXIubGVuZ3RoXHJcblx0XHRcdHRocm93IG5ldyBFcnJvciBcIkluZGV4IG91dCBvZiBib3VuZFwiXHJcblxyXG4iLCJcclxubW9kdWxlLmV4cG9ydHMgPVxyXG5jbGFzcyBDb2xvclxyXG5cdCMgQFRPRE86IGRvbid0IGFzc2lnbiB7QHIsIEBnLCBAYiwgQGgsIEBzLCBAdiwgQGx9IHJpZ2h0IGF3YXlcclxuXHQjIChtb3JlIG9mIGEgdG8tZG9uJ3QsIHJlYWxseSlcclxuXHRjb25zdHJ1Y3RvcjogKHtcclxuXHRcdEByLCBAZywgQGIsXHJcblx0XHRAaCwgQHMsIEB2LCBAbCxcclxuXHRcdGMsIG0sIHksIGssXHJcblx0XHRAbmFtZVxyXG5cdH0pLT5cclxuXHRcdGlmIEByPyBhbmQgQGc/IGFuZCBAYj9cclxuXHRcdFx0IyBSZWQgR3JlZW4gQmx1ZVxyXG5cdFx0ZWxzZSBpZiBAaD8gYW5kIEBzP1xyXG5cdFx0XHQjIEN5bGluZHJpY2FsIENvbG9yIFNwYWNlXHJcblx0XHRcdGlmIEB2P1xyXG5cdFx0XHRcdCMgSHVlIFNhdHVyYXRpb24gVmFsdWVcclxuXHRcdFx0XHRAbCA9ICgyIC0gQHMgLyAxMDApICogQHYgLyAyXHJcblx0XHRcdFx0QHMgPSBAcyAqIEB2IC8gKGlmIEBsIDwgNTAgdGhlbiBAbCAqIDIgZWxzZSAyMDAgLSBAbCAqIDIpXHJcblx0XHRcdFx0QHMgPSAwIGlmIGlzTmFOIEBzXHJcblx0XHRcdGVsc2UgaWYgQGw/XHJcblx0XHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBMaWdodG5lc3NcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIkh1ZSwgc2F0dXJhdGlvbiwgYW5kLi4uPyAoZWl0aGVyIGxpZ2h0bmVzcyBvciB2YWx1ZSlcIlxyXG5cdFx0ZWxzZSBpZiBjPyBhbmQgbT8gYW5kIHk/IGFuZCBrP1xyXG5cdFx0XHQjIEN5YW4gTWFnZW50YSBZZWxsb3cgYmxhY0tcclxuXHRcdFx0IyBVTlRFU1RFRFxyXG5cdFx0XHRjIC89IDEwMFxyXG5cdFx0XHRtIC89IDEwMFxyXG5cdFx0XHR5IC89IDEwMFxyXG5cdFx0XHRrIC89IDEwMFxyXG5cdFx0XHRcclxuXHRcdFx0QHIgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIGMgKiAoMSAtIGspICsgaykpXHJcblx0XHRcdEBnID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCBtICogKDEgLSBrKSArIGspKVxyXG5cdFx0XHRAYiA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgeSAqICgxIC0gaykgKyBrKSlcclxuXHRcdGVsc2VcclxuXHRcdFx0IyBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRFxyXG5cdFx0XHRpZiBAbD8gYW5kIEBhPyBhbmQgQGI/XHJcblx0XHRcdFx0d2hpdGUgPVxyXG5cdFx0XHRcdFx0eDogOTUuMDQ3XHJcblx0XHRcdFx0XHR5OiAxMDAuMDAwXHJcblx0XHRcdFx0XHR6OiAxMDguODgzXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0eHl6ID0gXHJcblx0XHRcdFx0XHR5OiAocmF3LmwgKyAxNikgLyAxMTZcclxuXHRcdFx0XHRcdHg6IHJhdy5hIC8gNTAwICsgeHl6LnlcclxuXHRcdFx0XHRcdHo6IHh5ei55IC0gcmF3LmIgLyAyMDBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRmb3IgXyBpbiBcInh5elwiXHJcblx0XHRcdFx0XHRwb3dlZCA9IE1hdGgucG93KHh5eltfXSwgMylcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYgcG93ZWQgPiAwLjAwODg1NlxyXG5cdFx0XHRcdFx0XHR4eXpbX10gPSBwb3dlZFxyXG5cdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHR4eXpbX10gPSAoeHl6W19dIC0gMTYgLyAxMTYpIC8gNy43ODdcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0I3h5eltfXSA9IF9yb3VuZCh4eXpbX10gKiB3aGl0ZVtfXSlcclxuXHRcdFx0XHRcclxuXHRcdFx0IyBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRFxyXG5cdFx0XHRpZiBAeD8gYW5kIEB5PyBhbmQgQHo/XHJcblx0XHRcdFx0eHl6ID1cclxuXHRcdFx0XHRcdHg6IHJhdy54IC8gMTAwXHJcblx0XHRcdFx0XHR5OiByYXcueSAvIDEwMFxyXG5cdFx0XHRcdFx0ejogcmF3LnogLyAxMDBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRyZ2IgPVxyXG5cdFx0XHRcdFx0cjogeHl6LnggKiAzLjI0MDYgKyB4eXoueSAqIC0xLjUzNzIgKyB4eXoueiAqIC0wLjQ5ODZcclxuXHRcdFx0XHRcdGc6IHh5ei54ICogLTAuOTY4OSArIHh5ei55ICogMS44NzU4ICsgeHl6LnogKiAwLjA0MTVcclxuXHRcdFx0XHRcdGI6IHh5ei54ICogMC4wNTU3ICsgeHl6LnkgKiAtMC4yMDQwICsgeHl6LnogKiAxLjA1NzBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRmb3IgXyBpbiBcInJnYlwiXHJcblx0XHRcdFx0XHQjcmdiW19dID0gX3JvdW5kKHJnYltfXSlcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYgcmdiW19dIDwgMFxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gPSAwXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHJnYltfXSA+IDAuMDAzMTMwOFxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gPSAxLjA1NSAqIE1hdGgucG93KHJnYltfXSwgKDEgLyAyLjQpKSAtIDAuMDU1XHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdHJnYltfXSAqPSAxMi45MlxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdCNyZ2JbX10gPSBNYXRoLnJvdW5kKHJnYltfXSAqIDI1NSlcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIkNvbG9yIGNvbnN0cnVjdG9yIG11c3QgYmUgY2FsbGVkIHdpdGgge3IsZyxifSBvciB7aCxzLHZ9IG9yIHtoLHMsbH0gb3Ige2MsbSx5LGt9IG9yIHt4LHksen0gb3Ige2wsYSxifVwiXHJcblx0XHRcclxuXHRcclxuXHR0b1N0cmluZzogLT5cclxuXHRcdGlmIEByP1xyXG5cdFx0XHQjIFJlZCBHcmVlbiBCbHVlXHJcblx0XHRcdGlmIEBhPyAjIEFscGhhXHJcblx0XHRcdFx0XCJyZ2JhKCN7QHJ9LCAje0BnfSwgI3tAYn0sICN7QGF9KVwiXHJcblx0XHRcdGVsc2UgIyBPcGFxdWVcclxuXHRcdFx0XHRcInJnYigje0ByfSwgI3tAZ30sICN7QGJ9KVwiXHJcblx0XHRlbHNlIGlmIEBoP1xyXG5cdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIExpZ2h0bmVzc1xyXG5cdFx0XHQjIChBc3N1bWUgaDowLTM2MCwgczowLTEwMCwgbDowLTEwMClcclxuXHRcdFx0aWYgQGE/ICMgQWxwaGFcclxuXHRcdFx0XHRcImhzbGEoI3tAaH0sICN7QHN9JSwgI3tAbH0lLCAje0BhfSlcIlxyXG5cdFx0XHRlbHNlICMgT3BhcXVlXHJcblx0XHRcdFx0XCJoc2woI3tAaH0sICN7QHN9JSwgI3tAbH0lKVwiXHJcblx0XHJcblx0aXM6IChjb2xvciktPlxyXG5cdFx0XCIje0B9XCIgaXMgXCIje2NvbG9yfVwiXHJcbiIsIlxyXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID1cclxuY2xhc3MgUGFsZXR0ZSBleHRlbmRzIEFycmF5XHJcblx0XHJcblx0Y29uc3RydWN0b3I6IC0+XHJcblx0XHRzdXBlcigpXHJcblx0XHRAd2l0aF9kdXBsaWNhdGVzID0gQFxyXG5cdFx0XHJcblx0YWRkOiAobyktPlxyXG5cdFx0bmV3X2NvbG9yID0gbmV3IENvbG9yKG8pXHJcblx0XHRcclxuXHRcdGlmIEB3aXRoX2R1cGxpY2F0ZXMgaXMgQFxyXG5cdFx0XHRAd2l0aF9kdXBsaWNhdGVzID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0XHJcblx0XHRAd2l0aF9kdXBsaWNhdGVzLnB1c2ggbmV3X2NvbG9yXHJcblx0XHRcclxuXHRcdGZvciBjb2xvciBpbiBAXHJcblx0XHRcdGlmIGNvbG9yLmlzIG5ld19jb2xvclxyXG5cdFx0XHRcdG5ld19jb2xvci5pc19kdXBsaWNhdGUgPSB0cnVlXHJcblx0XHRcdFx0cmV0dXJuXHJcblx0XHRcclxuXHRcdEBwdXNoIG5ld19jb2xvclxyXG5cdFxyXG5cdGZpbmFsaXplOiAtPlxyXG5cdFx0aWYgbm90IEBuX2NvbHVtbnNcclxuXHRcdFx0QGd1ZXNzX2RpbWVuc2lvbnMoKVxyXG5cdFx0aWYgQHdpdGhfZHVwbGljYXRlc1xyXG5cdFx0XHRAd2l0aF9kdXBsaWNhdGVzLmd1ZXNzX2RpbWVuc2lvbnMoKVxyXG5cdFx0XHJcblx0Z3Vlc3NfZGltZW5zaW9uczogLT5cclxuXHRcdGxlbiA9IEBsZW5ndGhcclxuXHRcdGNhbmRpZGF0ZV9kaW1lbnNpb25zID0gW11cclxuXHRcdGZvciBuX2NvbHVtbnMgaW4gWzAuLmxlbl1cclxuXHRcdFx0bl9yb3dzID0gbGVuIC8gbl9jb2x1bW5zXHJcblx0XHRcdGlmIG5fcm93cyBpcyBNYXRoLnJvdW5kIG5fcm93c1xyXG5cdFx0XHRcdGNhbmRpZGF0ZV9kaW1lbnNpb25zLnB1c2ggW25fcm93cywgbl9jb2x1bW5zXVxyXG5cdFx0XHJcblx0XHRzcXVhcmVzdCA9IFswLCAzNDk1MDkzXVxyXG5cdFx0Zm9yIGNkIGluIGNhbmRpZGF0ZV9kaW1lbnNpb25zXHJcblx0XHRcdGlmIE1hdGguYWJzKGNkWzBdIC0gY2RbMV0pIDwgTWF0aC5hYnMoc3F1YXJlc3RbMF0gLSBzcXVhcmVzdFsxXSlcclxuXHRcdFx0XHRzcXVhcmVzdCA9IGNkXHJcblx0XHRcclxuXHRcdCNAbl9jb2x1bW5zID0gc3F1YXJlc3RbMV1cclxuIiwiXHJcbiMgTG9hZCBhIENvbG9yU2NoZW1lciBwYWxldHRlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0dmVyc2lvbiA9IGJyLnJlYWRVSW50MTYoKSAjIG9yIHNvbWV0aGluZ1xyXG5cdGxlbmd0aCA9IGJyLnJlYWRVSW50MTYoKVxyXG5cdGkgPSAwXHJcblx0d2hpbGUgaSA8IGxlbmd0aFxyXG5cdFx0YnIuc2Vlayg4ICsgaSAqIDI2KVxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdGkgKz0gMVxyXG5cclxuXHRwYWxldHRlXHJcblxyXG4iLCJcclxuIyBMb2FkIGEgR0lNUCBwYWxldHRlXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IFwiR0lNUCBQYWxldHRlXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhIEdJTVAgUGFsZXR0ZVwiXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRpID0gMVxyXG5cdHdoaWxlIChpICs9IDEpIDwgbGluZXMubGVuZ3RoXHJcblx0XHRsaW5lID0gbGluZXNbaV1cclxuXHRcdFxyXG5cdFx0aWYgbGluZS5tYXRjaCgvXiMvKSBvciBsaW5lIGlzIFwiXCIgdGhlbiBjb250aW51ZVxyXG5cdFx0XHJcblx0XHRtID0gbGluZS5tYXRjaCgvTmFtZTpcXHMqKC4qKS8pXHJcblx0XHRpZiBtXHJcblx0XHRcdHBhbGV0dGUubmFtZSA9IG1bMV1cclxuXHRcdFx0Y29udGludWVcclxuXHRcdG0gPSBsaW5lLm1hdGNoKC9Db2x1bW5zOlxccyooLiopLylcclxuXHRcdGlmIG1cclxuXHRcdFx0cGFsZXR0ZS5uX2NvbHVtbnMgPSBOdW1iZXIobVsxXSlcclxuXHRcdFx0cGFsZXR0ZS5oYXNfZGltZW5zaW9ucyA9IHllc1xyXG5cdFx0XHRjb250aW51ZVxyXG5cdFx0XHJcblx0XHRyX2dfYl9uYW1lID0gbGluZS5tYXRjaCgvXlxccyooWzAtOV0rKVxccysoWzAtOV0rKVxccysoWzAtOV0rKSg/OlxccysoLiopKT8kLylcclxuXHRcdGlmIG5vdCByX2dfYl9uYW1lXHJcblx0XHRcdHRocm93IG5ldyBFcnJvciBcIkxpbmUgI3tpfSBkb2Vzbid0IG1hdGNoIHBhdHRlcm4gcl9nX2JfbmFtZVwiXHJcblx0XHRcclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IHJfZ19iX25hbWVbMV1cclxuXHRcdFx0Zzogcl9nX2JfbmFtZVsyXVxyXG5cdFx0XHRiOiByX2dfYl9uYW1lWzNdXHJcblx0XHRcdG5hbWU6IHJfZ19iX25hbWVbNF1cclxuXHRcdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgRGV0ZWN0IENTUyBjb2xvcnMgKGV4Y2VwdCBuYW1lZCBjb2xvcnMpXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZXMgPSBbXHJcblx0XHRwYWxldHRlX3hSUkdHQkIgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX3hSR0IgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX3JnYiA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfaHNsID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9oc2xhID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9yZ2JhID0gbmV3IFBhbGV0dGUoKVxyXG5cdF1cclxuXHRcclxuXHRoZXggPSAoeCktPiBwYXJzZUludCh4LCAxNilcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRcXCMgIyBoYXNodGFnICMgIy9cclxuXHRcdChbMC05QS1GXXsyfSk/ICMgYWxwaGFcclxuXHRcdChbMC05QS1GXXszfSkgIyB0aHJlZSBkaWdpdHMgKCNBMEMpXHJcblx0XHQoWzAtOUEtRl17M30pPyAjIHNpeCBkaWdpdHMgKCNBQTAwQ0MpXHJcblx0XHRcclxuXHRcdCg/IVswLTlBLUZdKSAjIChhbmQgbm8gbW9yZSEpXHJcblx0Ly8vZ2ltLCAobSwgJDAsICQxLCAkMiktPlxyXG5cdFx0XHJcblx0XHRhbHBoYSA9IGhleCAkMFxyXG5cdFx0XHJcblx0XHRpZiAkMlxyXG5cdFx0XHR4UkdCID0gJDEgKyAkMlxyXG5cdFx0XHRwYWxldHRlX3hSUkdHQkIuYWRkXHJcblx0XHRcdFx0cjogaGV4IHhSR0JbMF0gKyB4UkdCWzFdXHJcblx0XHRcdFx0ZzogaGV4IHhSR0JbMl0gKyB4UkdCWzNdXHJcblx0XHRcdFx0YjogaGV4IHhSR0JbNF0gKyB4UkdCWzVdXHJcblx0XHRcdFx0YTogYWxwaGFcclxuXHRcdGVsc2VcclxuXHRcdFx0eFJHQiA9ICQxXHJcblx0XHRcdHBhbGV0dGVfeFJHQi5hZGRcclxuXHRcdFx0XHRyOiBoZXggeFJHQlswXSArIHhSR0JbMF1cclxuXHRcdFx0XHRnOiBoZXggeFJHQlsxXSArIHhSR0JbMV1cclxuXHRcdFx0XHRiOiBoZXggeFJHQlsyXSArIHhSR0JbMl1cclxuXHRcdFx0XHRhOiBhbHBoYVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdHJnYlxcKFxyXG5cdFx0XHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIHJlZFxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBncmVlblxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBibHVlXHJcblx0XHRcdFxccypcclxuXHRcdFxcKVxyXG5cdC8vL2dpbSwgKG0pLT5cclxuXHRcdHBhbGV0dGVfcmdiLmFkZFxyXG5cdFx0XHRyOiBOdW1iZXIgbVsxXVxyXG5cdFx0XHRnOiBOdW1iZXIgbVsyXVxyXG5cdFx0XHRiOiBOdW1iZXIgbVszXVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdHJnYmFcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyByZWRcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgZ3JlZW5cclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgYmx1ZVxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfXwwXFwuWzAtOV0rKSAjIGFscGhhXHJcblx0XHRcdFxccypcclxuXHRcdFxcKVxyXG5cdC8vL2dpbSwgKG0pLT5cclxuXHRcdHBhbGV0dGVfcmdiLmFkZFxyXG5cdFx0XHRyOiBOdW1iZXIgbVsxXVxyXG5cdFx0XHRnOiBOdW1iZXIgbVsyXVxyXG5cdFx0XHRiOiBOdW1iZXIgbVszXVxyXG5cdFx0XHRhOiBOdW1iZXIgbVs0XVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdGhzbFxcKFxyXG5cdFx0XHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGh1ZVxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBzYXR1cmF0aW9uXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIHZhbHVlXHJcblx0XHRcdFxccypcclxuXHRcdFxcKVxyXG5cdC8vL2dpbSwgKG0pLT5cclxuXHRcdHBhbGV0dGVfcmdiLmFkZFxyXG5cdFx0XHRoOiBOdW1iZXIgbVsxXVxyXG5cdFx0XHRzOiBOdW1iZXIgbVsyXVxyXG5cdFx0XHRsOiBOdW1iZXIgbVszXVxyXG5cdFxyXG5cdG1vc3RfY29sb3JzID0gW11cclxuXHRmb3IgcGFsZXR0ZSBpbiBwYWxldHRlc1xyXG5cdFx0aWYgcGFsZXR0ZS5sZW5ndGggPj0gbW9zdF9jb2xvcnMubGVuZ3RoXHJcblx0XHRcdG1vc3RfY29sb3JzID0gcGFsZXR0ZVxyXG5cdFxyXG5cdG4gPSBtb3N0X2NvbG9ycy5sZW5ndGhcclxuXHRpZiBuIDwgNFxyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFtcclxuXHRcdFx0XCJObyBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgb25lIGNvbG9yIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IGEgY291cGxlIGNvbG9ycyBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBhIGZldyBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XVtuXSArIFwiICgje259KVwiKVxyXG5cdFxyXG5cdG1vc3RfY29sb3JzXHJcbiIsIlxyXG4jIFdoYXQgZG9lcyBIUEwgc3RhbmQgZm9yP1xyXG4jIEhvd2R5LCBQYWxldHRlIExvdmVycyFcclxuXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdGlmIGxpbmVzWzBdIGlzbnQgXCJQYWxldHRlXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhbiBIUEwgcGFsZXR0ZVwiXHJcblx0aWYgbm90IGxpbmVzWzFdLm1hdGNoIC9WZXJzaW9uIFszNF1cXC4wL1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiVW5zdXBwb3J0ZWQgSFBMIHZlcnNpb25cIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHJcblx0Zm9yIGxpbmUsIGkgaW4gbGluZXNcclxuXHRcdGlmIGxpbmUubWF0Y2ggLy4rIC4qIC4rL1xyXG5cdFx0XHRyZ2IgPSBsaW5lLnNwbGl0KFwiIFwiKVxyXG5cdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdHI6IHJnYlswXVxyXG5cdFx0XHRcdGc6IHJnYlsxXVxyXG5cdFx0XHRcdGI6IHJnYlsyXVxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIFBhaW50Lk5FVCBwYWxldHRlIGZpbGVcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRcclxuXHRoZXggPSAoeCktPiBwYXJzZUludCh4LCAxNilcclxuXHRcclxuXHRmb3IgbGluZSBpbiBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRcdG0gPSBsaW5lLm1hdGNoKC9eKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KSQvaSlcclxuXHRcdGlmIG0gdGhlbiBwYWxldHRlLmFkZFxyXG5cdFx0XHRhOiBoZXggbVsxXVxyXG5cdFx0XHRyOiBoZXggbVsyXVxyXG5cdFx0XHRnOiBoZXggbVszXVxyXG5cdFx0XHRiOiBoZXggbVs0XVxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIEpBU0MgUEFMIGZpbGUgKFBhaW50IFNob3AgUHJvIHBhbGV0dGUgZmlsZSlcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IFwiSkFTQy1QQUxcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiTm90IGEgSkFTQy1QQUxcIlxyXG5cdGlmIGxpbmVzWzFdIGlzbnQgXCIwMTAwXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVua25vd24gSkFTQy1QQUwgdmVyc2lvblwiXHJcblx0aWYgbGluZXNbMl0gaXNudCBcIjI1NlwiXHJcblx0XHRcInRoYXQncyBva1wiXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHQjbl9jb2xvcnMgPSBOdW1iZXIobGluZXNbMl0pXHJcblx0XHJcblx0Zm9yIGxpbmUsIGkgaW4gbGluZXNcclxuXHRcdGlmIGxpbmUgaXNudCBcIlwiIGFuZCBpID4gMlxyXG5cdFx0XHRyZ2IgPSBsaW5lLnNwbGl0KFwiIFwiKVxyXG5cdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdHI6IHJnYlswXVxyXG5cdFx0XHRcdGc6IHJnYlsxXVxyXG5cdFx0XHRcdGI6IHJnYlsyXVxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIFJlc291cmNlIEludGVyY2hhbmdlIEZpbGUgRm9ybWF0IFBBTCBmaWxlXHJcblxyXG4jIHBvcnRlZCBmcm9tIEMjIGNvZGUgYXQgaHR0cHM6Ly93b3JtczJkLmluZm8vUGFsZXR0ZV9maWxlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdCMgUklGRiBoZWFkZXJcclxuXHRyaWZmID0gYnIucmVhZFN0cmluZyg0KSAjIFwiUklGRlwiXHJcblx0ZGF0YVNpemUgPSBici5yZWFkVUludDMyKClcclxuXHR0eXBlID0gYnIucmVhZFN0cmluZyg0KSAjIFwiUEFMIFwiXHJcblx0XHJcblx0aWYgcmlmZiBpc250IFwiUklGRlwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJSSUZGIGhlYWRlciBub3QgZm91bmQ7IG5vdCBhIFJJRkYgUEFMIGZpbGVcIlxyXG5cdFxyXG5cdGlmIHR5cGUgaXNudCBcIlBBTCBcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiXCJcIlxyXG5cdFx0XHRSSUZGIGhlYWRlciBzYXlzIHRoaXMgaXNuJ3QgYSBQQUwgZmlsZSxcclxuXHRcdFx0bW9yZSBvZiBhIHNvcnQgb2YgI3soKHR5cGUrXCJcIikudHJpbSgpKX0gZmlsZVxyXG5cdFx0XCJcIlwiXHJcblx0XHJcblx0IyBEYXRhIGNodW5rXHJcblx0Y2h1bmtUeXBlID0gYnIucmVhZFN0cmluZyg0KSAjIFwiZGF0YVwiXHJcblx0Y2h1bmtTaXplID0gYnIucmVhZFVJbnQzMigpXHJcblx0cGFsVmVyc2lvbiA9IGJyLnJlYWRVSW50MTYoKSAjIDB4MDMwMFxyXG5cdHBhbE51bUVudHJpZXMgPSBici5yZWFkVUludDE2KClcclxuXHRcclxuXHRcclxuXHRpZiBjaHVua1R5cGUgaXNudCBcImRhdGFcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiRGF0YSBjaHVuayBub3QgZm91bmQgKC4uLicje2NodW5rVHlwZX0nPylcIlxyXG5cdFxyXG5cdGlmIHBhbFZlcnNpb24gaXNudCAweDAzMDBcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVuc3VwcG9ydGVkIFBBTCBmaWxlIGZvcm1hdCB2ZXJzaW9uOiAweCN7cGFsVmVyc2lvbi50b1N0cmluZygxNil9XCJcclxuXHRcclxuXHQjIENvbG9yc1xyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0aSA9IDBcclxuXHR3aGlsZSAoaSArPSAxKSA8IHBhbE51bUVudHJpZXMgLSAxXHJcblx0XHRcclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdF86IGJyLnJlYWRCeXRlKCkgIyBcImZsYWdzXCIsIGFsd2F5cyAweDAwXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBQQUwgKFN0YXJDcmFmdCByYXcgcGFsZXR0ZSlcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHRmb3IgaSBpbiBbMC4uLjI1NV1cclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdCM6IG5vIHBhZGRpbmdcclxuXHRcclxuXHQjPyBwYWxldHRlLm5fY29sdW1ucyA9IDE2XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBXUEUgKFN0YXJDcmFmdCBwYWRkZWQgcmF3IHBhbGV0dGUpXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0Zm9yIGkgaW4gWzAuLi4yNTVdXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRfOiBici5yZWFkQnl0ZSgpICMgcGFkZGluZ1xyXG5cdFxyXG5cdHBhbGV0dGUubl9jb2x1bW5zID0gMTZcclxuXHRwYWxldHRlXHJcbiIsIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4vUGFsZXR0ZVwiXHJcbkNvbG9yID0gcmVxdWlyZSBcIi4vQ29sb3JcIlxyXG5cclxuY2xhc3MgUmFuZG9tQ29sb3IgZXh0ZW5kcyBDb2xvclxyXG5cdGNvbnN0cnVjdG9yOiAtPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QHJhbmRvbWl6ZSgpXHJcblx0XHJcblx0cmFuZG9taXplOiAtPlxyXG5cdFx0QGggPSBNYXRoLnJhbmRvbSgpICogMzYwXHJcblx0XHRAcyA9IE1hdGgucmFuZG9tKCkgKiAxMDBcclxuXHRcdEBsID0gTWF0aC5yYW5kb20oKSAqIDEwMFxyXG5cdFxyXG5cdHRvU3RyaW5nOiAtPlxyXG5cdFx0QHJhbmRvbWl6ZSgpXHJcblx0XHRcImhzbCgje0BofSwgI3tAc30lLCAje0BsfSUpXCJcclxuXHRcclxuXHRpczogLT4gbm9cclxuXHJcbmNsYXNzIFJhbmRvbVBhbGV0dGUgZXh0ZW5kcyBQYWxldHRlXHJcblx0Y29uc3RydWN0b3I6IC0+XHJcblx0XHRzdXBlcigpXHJcblx0XHRAbG9hZGVkX2FzID0gXCJDb21wbGV0ZWx5IFJhbmRvbSBDb2xvcnPihKJcIlxyXG5cdFx0QGxvYWRlZF9hc19jbGF1c2UgPSBcIiguY3JjIHNqZihEZjA5c2pkZmtzZGxmbW5tICc7JztcIlxyXG5cdFx0QGNvbmZpZGVuY2UgPSAwXHJcblx0XHRAZmluYWxpemUoKVxyXG5cdFx0Zm9yIGkgaW4gWzAuLk1hdGgucmFuZG9tKCkqMTUrNV1cclxuXHRcdFx0QHB1c2ggbmV3IFJhbmRvbUNvbG9yKClcclxuXHJcbmNsYXNzIExvYWRpbmdFcnJvcnMgZXh0ZW5kcyBFcnJvclxyXG5cdGNvbnN0cnVjdG9yOiAoQGVycm9ycyktPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QG1lc3NhZ2UgPSBcIlNvbWUgZXJyb3JzIHdlcmUgZW5jb3VudGVyZWQgd2hlbiBsb2FkaW5nOlwiICtcclxuXHRcdFx0Zm9yIGVycm9yIGluIEBlcnJvcnNcclxuXHRcdFx0XHRcIlxcblxcdFwiICsgZXJyb3IubWVzc2FnZVxyXG5cclxubG9hZF9wYWxldHRlID0gKG8sIGNhbGxiYWNrKS0+XHJcblx0XHJcblx0cGFsZXR0ZV9sb2FkZXJzID0gW1xyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlBhaW50IFNob3AgUHJvIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJwYWxcIiwgXCJwc3BwYWxldHRlXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvUGFpbnRTaG9wUHJvXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJSSUZGIFBBTFwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1JJRkZcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkNvbG9yU2NoZW1lciBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiY3NcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9Db2xvclNjaGVtZXJcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlBhaW50Lk5FVCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1widHh0XCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvUGFpbnQuTkVUXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJHSU1QIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJncGxcIiwgXCJnaW1wXCIsIFwiY29sb3JzXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvR0lNUFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiQ1NTLXN0eWxlIGNvbG9yc1wiXHJcblx0XHRcdGV4dHM6IFtcImNzc1wiLCBcInNjc3NcIiwgXCJzYXNzXCIsIFwibGVzc1wiLCBcImh0bWxcIiwgXCJzdmdcIiwgXCJqc1wiLCBcInRzXCIsIFwieG1sXCIsIFwidHh0XCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvR2VuZXJpY1wiXHJcblx0XHR9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIFN3YXRjaFwiXHJcblx0XHQjIFx0ZXh0czogW1wiYWNvXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yU3dhdGNoXCJcclxuXHRcdCMgfVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBDb2xvciBUYWJsZVwiXHJcblx0XHQjIFx0ZXh0czogW1wiYWN0XCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yVGFibGVcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIFN3YXRjaCBFeGNoYW5nZVwiXHJcblx0XHQjIFx0ZXh0czogW1wiYXNlXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZVN3YXRjaEV4Y2hhbmdlXCJcclxuXHRcdCMgfVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBDb2xvciBCb29rXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY2JcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JCb29rXCJcclxuXHRcdCMgfVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkhQTCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiaHBsXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvSFBMXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJTdGFyQ3JhZnQgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1N0YXJDcmFmdFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiU3RhckNyYWZ0IHRlcnJhaW4gcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcIndwZVwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1N0YXJDcmFmdFBhZGRlZFwiXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQXV0b0NBRCBDb2xvciBCb29rXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY2JcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0F1dG9DQURDb2xvckJvb2tcIlxyXG5cdFx0IyB9XHJcblx0XHRcclxuXHRcdCMge1xyXG5cdFx0IyBcdCMgKHNhbWUgYXMgUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZT8pXHJcblx0XHQjIFx0bmFtZTogXCJDb3JlbERSQVcgcGFsZXR0ZVwiXHJcblx0XHQjIFx0ZXh0czogW1wicGFsXCIsIFwiY3BsXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9Db3JlbERSQVdcIlxyXG5cdFx0IyB9XHJcblx0XVxyXG5cdFxyXG5cdCMgZmluZCBwYWxldHRlIGxvYWRlcnMgdGhhdCB1c2UgdGhpcyBmaWxlIGV4dGVuc2lvblxyXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcclxuXHRcdHBsLm1hdGNoZXNfZXh0ID0gcGwuZXh0cy5pbmRleE9mKG8uZmlsZV9leHQpIGlzbnQgLTFcclxuXHRcclxuXHQjIG1vdmUgcGFsZXR0ZSBsb2FkZXJzIHRvIHRoZSBiZWdpbm5pbmcgdGhhdCB1c2UgdGhpcyBmaWxlIGV4dGVuc2lvblxyXG5cdHBhbGV0dGVfbG9hZGVycy5zb3J0IChwbDEsIHBsMiktPlxyXG5cdFx0cGwyLm1hdGNoZXNfZXh0IC0gcGwxLm1hdGNoZXNfZXh0XHJcblx0XHJcblx0IyB0cnkgbG9hZGluZyBzdHVmZlxyXG5cdGVycm9ycyA9IFtdXHJcblx0Zm9yIHBsIGluIHBhbGV0dGVfbG9hZGVyc1xyXG5cdFx0XHJcblx0XHR0cnlcclxuXHRcdFx0cGFsZXR0ZSA9IHBsLmxvYWQobylcclxuXHRcdFx0aWYgcGFsZXR0ZS5sZW5ndGggaXMgMFxyXG5cdFx0XHRcdHBhbGV0dGUgPSBudWxsXHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwibm8gY29sb3JzIHJldHVybmVkXCJcclxuXHRcdGNhdGNoIGVcclxuXHRcdFx0bXNnID0gXCJmYWlsZWQgdG8gbG9hZCAje28uZmlsZV9uYW1lfSBhcyAje3BsLm5hbWV9OiAje2UubWVzc2FnZX1cIlxyXG5cdFx0XHQjIGlmIHBsLm1hdGNoZXNfZXh0IGFuZCBub3QgZS5tZXNzYWdlLm1hdGNoKC9ub3QgYS9pKVxyXG5cdFx0XHQjIFx0Y29uc29sZT8uZXJyb3I/IG1zZ1xyXG5cdFx0XHQjIGVsc2VcclxuXHRcdFx0IyBcdGNvbnNvbGU/Lndhcm4/IG1zZ1xyXG5cdFx0XHRcclxuXHRcdFx0IyBUT0RPOiBtYXliZSB0aGlzIHNob3VsZG4ndCBiZSBhbiBFcnJvciBvYmplY3QsIGp1c3QgYSB7bWVzc2FnZSwgZXJyb3J9IG9iamVjdFxyXG5cdFx0XHQjIG9yIHtmcmllbmRseU1lc3NhZ2UsIGVycm9yfVxyXG5cdFx0XHRlcnIgPSBuZXcgRXJyb3IgbXNnXHJcblx0XHRcdGVyci5lcnJvciA9IGVcclxuXHRcdFx0ZXJyb3JzLnB1c2ggZXJyXHJcblx0XHRcclxuXHRcdGlmIHBhbGV0dGVcclxuXHRcdFx0IyBjb25zb2xlPy5pbmZvPyBcImxvYWRlZCAje28uZmlsZV9uYW1lfSBhcyAje3BsLm5hbWV9XCJcclxuXHRcdFx0cGFsZXR0ZS5jb25maWRlbmNlID0gaWYgcGwubWF0Y2hlc19leHQgdGhlbiAwLjkgZWxzZSAwLjAxXHJcblx0XHRcdHBhbGV0dGUubG9hZGVkX2FzID0gcGwubmFtZVxyXG5cdFx0XHRleHRzX3ByZXR0eSA9IFwiKC4je3BsLmV4dHMuam9pbihcIiwgLlwiKX0pXCJcclxuXHRcdFx0XHJcblx0XHRcdGlmIHBsLm1hdGNoZXNfZXh0XHJcblx0XHRcdFx0cGFsZXR0ZS5sb2FkZWRfYXNfY2xhdXNlID0gZXh0c19wcmV0dHlcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHBhbGV0dGUubG9hZGVkX2FzX2NsYXVzZSA9IFwiIGZvciBzb21lIHJlYXNvblwiXHJcblx0XHRcdFxyXG5cdFx0XHRwYWxldHRlLmZpbmFsaXplKClcclxuXHRcdFx0Y2FsbGJhY2sobnVsbCwgcGFsZXR0ZSlcclxuXHRcdFx0cmV0dXJuXHJcblx0XHJcblx0Y2FsbGJhY2sobmV3IExvYWRpbmdFcnJvcnMoZXJyb3JzKSlcclxuXHRyZXR1cm5cclxuXHJcbm5vcm1hbGl6ZV9vcHRpb25zID0gKG8gPSB7fSktPlxyXG5cdGlmIHR5cGVvZiBvIGlzIFwic3RyaW5nXCIgb3IgbyBpbnN0YW5jZW9mIFN0cmluZ1xyXG5cdFx0byA9IGZpbGVfcGF0aDogb1xyXG5cdGlmIEZpbGU/IGFuZCBvIGluc3RhbmNlb2YgRmlsZVxyXG5cdFx0byA9IGZpbGU6IG9cclxuXHRcclxuXHRvLm1pbl9jb2xvcnMgPz0gby5taW5Db2xvcnMgPyAyXHJcblx0by5tYXhfY29sb3JzID89IG8ubWF4Q29sb3JzID8gMjU2XHJcblx0by5maWxlX3BhdGggPz0gby5maWxlUGF0aFxyXG5cdG8uZmlsZV9uYW1lID89IG8uZmlsZU5hbWUgPyBvLmZuYW1lID8gby5maWxlPy5uYW1lID8gKGlmIG8uZmlsZV9wYXRoIHRoZW4gcmVxdWlyZShcInBhdGhcIikuYmFzZW5hbWUoby5maWxlX3BhdGgpKVxyXG5cdG8uZmlsZV9leHQgPz0gby5maWxlRXh0ID8gXCIje28uZmlsZV9uYW1lfVwiLnNwbGl0KFwiLlwiKS5wb3AoKVxyXG5cdG8uZmlsZV9leHQgPSAoXCIje28uZmlsZV9leHR9XCIpLnRvTG93ZXJDYXNlKClcclxuXHRvXHJcblxyXG4jIEdldCBwYWxldHRlIGZyb20gYSBmaWxlXHJcblBhbGV0dGUubG9hZCA9IChvLCBjYWxsYmFjayktPlxyXG5cdGlmIG5vdCBvXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJQYXJhbWV0ZXJzIHJlcXVpcmVkOiBQYWxldHRlLmxvYWQob3B0aW9ucywgZnVuY3Rpb24gY2FsbGJhY2soZXJyLCBwYWxldHRlKXt9KVwiXHJcblx0aWYgbm90IGNhbGxiYWNrXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJDYWxsYmFjayByZXF1aXJlZDogUGFsZXR0ZS5sb2FkKG9wdGlvbnMsIGZ1bmN0aW9uIGNhbGxiYWNrKGVyciwgcGFsZXR0ZSl7fSlcIlxyXG5cdFxyXG5cdG8gPSBub3JtYWxpemVfb3B0aW9ucyBvXHJcblx0XHJcblx0aWYgby5kYXRhXHJcblx0XHRsb2FkX3BhbGV0dGUobywgY2FsbGJhY2spXHJcblx0ZWxzZSBpZiBGaWxlPyBhbmQgby5maWxlIGluc3RhbmNlb2YgRmlsZVxyXG5cdFx0ZnIgPSBuZXcgRmlsZVJlYWRlclxyXG5cdFx0ZnIub25sb2FkID0gLT5cclxuXHRcdFx0by5kYXRhID0gZnIucmVzdWx0XHJcblx0XHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRcdGZyLnJlYWRBc0JpbmFyeVN0cmluZyBvLmZpbGVcclxuXHRlbHNlIGlmIG8uZmlsZV9wYXRoP1xyXG5cdFx0ZnMgPSByZXF1aXJlIFwiZnNcIlxyXG5cdFx0ZnMucmVhZEZpbGUgby5maWxlX3BhdGgsIChlcnIsIGRhdGEpLT5cclxuXHRcdFx0aWYgZXJyXHJcblx0XHRcdFx0Y2FsbGJhY2soZXJyKVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0by5kYXRhID0gZGF0YS50b1N0cmluZyhcImJpbmFyeVwiKVxyXG5cdFx0XHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRlbHNlXHJcblx0XHRjYWxsYmFjayhuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZC4gVGhlIEZpbGUgQVBJIG1heSBub3QgYmUgc3VwcG9ydGVkLlwiKSkgIyB1bS4uLlxyXG5cdFx0IyB0aGUgRmlsZSBBUEkgd291bGQgYmUgc3VwcG9ydGVkIGlmIHlvdSd2ZSBwYXNzZWQgYSBGaWxlXHJcblx0XHQjIFRPRE86IGEgYmV0dGVyIGVycm9yIG1lc3NhZ2UsIGFib3V0IG9wdGlvbnMgKG5vdCkgcGFzc2VkXHJcblxyXG5cclxuIyBHZXQgYSBwYWxldHRlIGZyb20gYSBmaWxlIG9yIGJ5IGFueSBtZWFucyBuZWNlc3NhcnlcclxuIyAoYXMgaW4gZmFsbCBiYWNrIHRvIGNvbXBsZXRlbHkgcmFuZG9tIGRhdGEpXHJcblBhbGV0dGUuZ2ltbWUgPSAobywgY2FsbGJhY2spLT5cclxuXHRvID0gbm9ybWFsaXplX29wdGlvbnMgb1xyXG5cdFxyXG5cdFBhbGV0dGUubG9hZCBvLCAoZXJyLCBwYWxldHRlKS0+XHJcblx0XHRjYWxsYmFjayhudWxsLCBwYWxldHRlID8gbmV3IFJhbmRvbVBhbGV0dGUpXHJcblxyXG4jIEV4cG9ydHNcclxuUCA9IG1vZHVsZS5leHBvcnRzID0gUGFsZXR0ZVxyXG5QLkNvbG9yID0gQ29sb3JcclxuUC5QYWxldHRlID0gUGFsZXR0ZVxyXG5QLlJhbmRvbUNvbG9yID0gUmFuZG9tQ29sb3JcclxuUC5SYW5kb21QYWxldHRlID0gUmFuZG9tUGFsZXR0ZVxyXG4jIFAuTG9hZGluZ0Vycm9ycyA9IExvYWRpbmdFcnJvcnNcclxuIl19
