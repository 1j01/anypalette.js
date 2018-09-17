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
  constructor(options) {
    var _, c, e, i, j, k, len, len1, m, powed, ref, ref1, rgb, white, xyz, y;
    // @TODO: don't assign {@r, @g, @b, @h, @s, @v, @l} right away
    // (more of a to-don't, really)
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
        // Hue Saturation Lightness
        // (no conversions needed here)
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
        throw new Error(`Color constructor must be called with {r,g,b} or {h,s,v} or {h,s,l} or {c,m,y,k} or {x,y,z} or {l,a,b}, ${((function() {
          try {
            return `got ${JSON.stringify(options)}`;
          } catch (error) {
            e = error;
            return "got something that couldn't be displayed with JSON.stringify for this error message";
          }
        })())}`);
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
    // compare as strings
    return `${this}` === `${color}`;
  }

};


},{}],5:[function(require,module,exports){
var Color, Palette;

Color = require("./Color");

module.exports = Palette = class Palette extends Array {
  constructor(...colors) {
    // colors = colors.map((value)-> if value instanceof Color then value else new Color(value))
    super(...colors);
  }

  add(o) {
    var new_color;
    new_color = new Color(o);
    
    // for color in @
    // 	if color.is new_color
    // 		new_color.is_duplicate = true
    // 		return
    return this.push(new_color);
  }

  
  // push: (o)->
  // 	new_color = new Color(o)
  // 	super.push new_color
  finalize() {
    var i, i_color, j, j_color, k, ref, results;
    if (!this.n_columns) {
      this.guess_dimensions();
    }
    // if @with_duplicates isnt @
    // 	@with_duplicates.finalize()
    if (!this.parent_palette_without_duplicates) {
      this.with_duplicates = new Palette;
      this.with_duplicates.parent_palette_without_duplicates = this;
      for (i = k = 0, ref = this.length; (0 <= ref ? k < ref : k > ref); i = 0 <= ref ? ++k : --k) {
        this.with_duplicates[i] = this[i];
      }
      this.with_duplicates.n_columns = this.n_columns;
      this.with_duplicates.has_dimensions = this.has_dimensions;
      this.with_duplicates.finalize();
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

  // else
  // @with_duplicates = @
  guess_dimensions() {
    var candidate_dimensions, cd, k, l, len, len1, n_columns, n_rows, ref, results, squarest;
    len = this.length;
    candidate_dimensions = [];
    for (n_columns = k = 0, ref = len; (0 <= ref ? k <= ref : k >= ref); n_columns = 0 <= ref ? ++k : --k) {
      n_rows = len / n_columns;
      if (n_rows === Math.round(n_rows)) {
        candidate_dimensions.push([n_rows, n_columns]);
      }
    }
    squarest = [0, 3495093];
    results = [];
    for (l = 0, len1 = candidate_dimensions.length; l < len1; l++) {
      cd = candidate_dimensions[l];
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
      throw new Error(`Line ${i
// TODO: better message
} doesn't match pattern r_g_b_name`);
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsInNyYy9CaW5hcnlSZWFkZXIuY29mZmVlIiwic3JjL0NvbG9yLmNvZmZlZSIsInNyYy9QYWxldHRlLmNvZmZlZSIsInNyYy9sb2FkZXJzL0NvbG9yU2NoZW1lci5jb2ZmZWUiLCJzcmMvbG9hZGVycy9HSU1QLmNvZmZlZSIsInNyYy9sb2FkZXJzL0dlbmVyaWMuY29mZmVlIiwic3JjL2xvYWRlcnMvSFBMLmNvZmZlZSIsInNyYy9sb2FkZXJzL1BhaW50Lk5FVC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9QYWludFNob3BQcm8uY29mZmVlIiwic3JjL2xvYWRlcnMvUklGRi5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TdGFyQ3JhZnQuY29mZmVlIiwic3JjL2xvYWRlcnMvU3RhckNyYWZ0UGFkZGVkLmNvZmZlZSIsInNyYy9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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UUFBQSxDQUFTLElBQUksS0FBSixDQUFVLG9EQUFWLENBQVQsRUFUSTs7QUFoQlMsRUF0TGY7Ozs7Ozs7QUFzTkEsT0FBTyxDQUFDLEtBQVIsR0FBZ0IsUUFBQSxDQUFDLENBQUQsRUFBSSxRQUFKLENBQUE7RUFDZixDQUFBLEdBQUksaUJBQUEsQ0FBa0IsQ0FBbEI7U0FFSixPQUFPLENBQUMsSUFBUixDQUFhLENBQWIsRUFBZ0IsUUFBQSxDQUFDLEdBQUQsRUFBTSxPQUFOLENBQUE7V0FDZixRQUFBLENBQVMsSUFBVCxvQkFBZSxVQUFVLElBQUksYUFBN0I7RUFEZSxDQUFoQjtBQUhlLEVBdE5oQjs7O0FBNk5BLENBQUEsR0FBSSxNQUFNLENBQUMsT0FBUCxHQUFpQjs7QUFDckIsQ0FBQyxDQUFDLEtBQUYsR0FBVTs7QUFDVixDQUFDLENBQUMsT0FBRixHQUFZOztBQUNaLENBQUMsQ0FBQyxXQUFGLEdBQWdCOztBQUNoQixDQUFDLENBQUMsYUFBRixHQUFrQjs7QUFqT2xCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLy8gLmRpcm5hbWUsIC5iYXNlbmFtZSwgYW5kIC5leHRuYW1lIG1ldGhvZHMgYXJlIGV4dHJhY3RlZCBmcm9tIE5vZGUuanMgdjguMTEuMSxcbi8vIGJhY2twb3J0ZWQgYW5kIHRyYW5zcGxpdGVkIHdpdGggQmFiZWwsIHdpdGggYmFja3dhcmRzLWNvbXBhdCBmaXhlc1xuXG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGxhc3QgPSBwYXJ0c1tpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gICAgdmFyIHBhdGggPSAoaSA+PSAwKSA/IGFyZ3VtZW50c1tpXSA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGFuZCBpbnZhbGlkIGVudHJpZXNcbiAgICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5yZXNvbHZlIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH0gZWxzZSBpZiAoIXBhdGgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLyc7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBpc0Fic29sdXRlID0gZXhwb3J0cy5pc0Fic29sdXRlKHBhdGgpLFxuICAgICAgdHJhaWxpbmdTbGFzaCA9IHN1YnN0cihwYXRoLCAtMSkgPT09ICcvJztcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmlzQWJzb2x1dGUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBwICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGguam9pbiBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH0pLmpvaW4oJy8nKSk7XG59O1xuXG5cbi8vIHBhdGgucmVsYXRpdmUoZnJvbSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgZnJvbSA9IGV4cG9ydHMucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XG4gIHRvID0gZXhwb3J0cy5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XG5cbiAgZnVuY3Rpb24gdHJpbShhcnIpIHtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIGZvciAoOyBzdGFydCA8IGFyci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICAgIGlmIChhcnJbc3RhcnRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcbiAgICAgIGlmIChhcnJbZW5kXSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBhcnIuc2xpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0ICsgMSk7XG4gIH1cblxuICB2YXIgZnJvbVBhcnRzID0gdHJpbShmcm9tLnNwbGl0KCcvJykpO1xuICB2YXIgdG9QYXJ0cyA9IHRyaW0odG8uc3BsaXQoJy8nKSk7XG5cbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XG4gIH1cblxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xuXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XG59O1xuXG5leHBvcnRzLnNlcCA9ICcvJztcbmV4cG9ydHMuZGVsaW1pdGVyID0gJzonO1xuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbiAocGF0aCkge1xuICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSBwYXRoID0gcGF0aCArICcnO1xuICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiAnLic7XG4gIHZhciBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KDApO1xuICB2YXIgaGFzUm9vdCA9IGNvZGUgPT09IDQ3IC8qLyovO1xuICB2YXIgZW5kID0gLTE7XG4gIHZhciBtYXRjaGVkU2xhc2ggPSB0cnVlO1xuICBmb3IgKHZhciBpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDE7IC0taSkge1xuICAgIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoaSk7XG4gICAgaWYgKGNvZGUgPT09IDQ3IC8qLyovKSB7XG4gICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgZW5kID0gaTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yXG4gICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBpZiAoZW5kID09PSAtMSkgcmV0dXJuIGhhc1Jvb3QgPyAnLycgOiAnLic7XG4gIGlmIChoYXNSb290ICYmIGVuZCA9PT0gMSkge1xuICAgIC8vIHJldHVybiAnLy8nO1xuICAgIC8vIEJhY2t3YXJkcy1jb21wYXQgZml4OlxuICAgIHJldHVybiAnLyc7XG4gIH1cbiAgcmV0dXJuIHBhdGguc2xpY2UoMCwgZW5kKTtcbn07XG5cbmZ1bmN0aW9uIGJhc2VuYW1lKHBhdGgpIHtcbiAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykgcGF0aCA9IHBhdGggKyAnJztcblxuICB2YXIgc3RhcnQgPSAwO1xuICB2YXIgZW5kID0gLTE7XG4gIHZhciBtYXRjaGVkU2xhc2ggPSB0cnVlO1xuICB2YXIgaTtcblxuICBmb3IgKGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgaWYgKHBhdGguY2hhckNvZGVBdChpKSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChlbmQgPT09IC0xKSB7XG4gICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvciwgbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyXG4gICAgICAvLyBwYXRoIGNvbXBvbmVudFxuICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICBlbmQgPSBpICsgMTtcbiAgICB9XG4gIH1cblxuICBpZiAoZW5kID09PSAtMSkgcmV0dXJuICcnO1xuICByZXR1cm4gcGF0aC5zbGljZShzdGFydCwgZW5kKTtcbn1cblxuLy8gVXNlcyBhIG1peGVkIGFwcHJvYWNoIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSwgYXMgZXh0IGJlaGF2aW9yIGNoYW5nZWRcbi8vIGluIG5ldyBOb2RlLmpzIHZlcnNpb25zLCBzbyBvbmx5IGJhc2VuYW1lKCkgYWJvdmUgaXMgYmFja3BvcnRlZCBoZXJlXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24gKHBhdGgsIGV4dCkge1xuICB2YXIgZiA9IGJhc2VuYW1lKHBhdGgpO1xuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBmO1xufTtcblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykgcGF0aCA9IHBhdGggKyAnJztcbiAgdmFyIHN0YXJ0RG90ID0gLTE7XG4gIHZhciBzdGFydFBhcnQgPSAwO1xuICB2YXIgZW5kID0gLTE7XG4gIHZhciBtYXRjaGVkU2xhc2ggPSB0cnVlO1xuICAvLyBUcmFjayB0aGUgc3RhdGUgb2YgY2hhcmFjdGVycyAoaWYgYW55KSB3ZSBzZWUgYmVmb3JlIG91ciBmaXJzdCBkb3QgYW5kXG4gIC8vIGFmdGVyIGFueSBwYXRoIHNlcGFyYXRvciB3ZSBmaW5kXG4gIHZhciBwcmVEb3RTdGF0ZSA9IDA7XG4gIGZvciAodmFyIGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgdmFyIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoaSk7XG4gICAgaWYgKGNvZGUgPT09IDQ3IC8qLyovKSB7XG4gICAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAgIC8vIHNlcGFyYXRvcnMgYXQgdGhlIGVuZCBvZiB0aGUgc3RyaW5nLCBzdG9wIG5vd1xuICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICAgIHN0YXJ0UGFydCA9IGkgKyAxO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIGlmIChlbmQgPT09IC0xKSB7XG4gICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvciwgbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyXG4gICAgICAvLyBleHRlbnNpb25cbiAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgICAgZW5kID0gaSArIDE7XG4gICAgfVxuICAgIGlmIChjb2RlID09PSA0NiAvKi4qLykge1xuICAgICAgICAvLyBJZiB0aGlzIGlzIG91ciBmaXJzdCBkb3QsIG1hcmsgaXQgYXMgdGhlIHN0YXJ0IG9mIG91ciBleHRlbnNpb25cbiAgICAgICAgaWYgKHN0YXJ0RG90ID09PSAtMSlcbiAgICAgICAgICBzdGFydERvdCA9IGk7XG4gICAgICAgIGVsc2UgaWYgKHByZURvdFN0YXRlICE9PSAxKVxuICAgICAgICAgIHByZURvdFN0YXRlID0gMTtcbiAgICB9IGVsc2UgaWYgKHN0YXJ0RG90ICE9PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBhbmQgbm9uLXBhdGggc2VwYXJhdG9yIGJlZm9yZSBvdXIgZG90LCBzbyB3ZSBzaG91bGRcbiAgICAgIC8vIGhhdmUgYSBnb29kIGNoYW5jZSBhdCBoYXZpbmcgYSBub24tZW1wdHkgZXh0ZW5zaW9uXG4gICAgICBwcmVEb3RTdGF0ZSA9IC0xO1xuICAgIH1cbiAgfVxuXG4gIGlmIChzdGFydERvdCA9PT0gLTEgfHwgZW5kID09PSAtMSB8fFxuICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBjaGFyYWN0ZXIgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBkb3RcbiAgICAgIHByZURvdFN0YXRlID09PSAwIHx8XG4gICAgICAvLyBUaGUgKHJpZ2h0LW1vc3QpIHRyaW1tZWQgcGF0aCBjb21wb25lbnQgaXMgZXhhY3RseSAnLi4nXG4gICAgICBwcmVEb3RTdGF0ZSA9PT0gMSAmJiBzdGFydERvdCA9PT0gZW5kIC0gMSAmJiBzdGFydERvdCA9PT0gc3RhcnRQYXJ0ICsgMSkge1xuICAgIHJldHVybiAnJztcbiAgfVxuICByZXR1cm4gcGF0aC5zbGljZShzdGFydERvdCwgZW5kKTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlciAoeHMsIGYpIHtcbiAgICBpZiAoeHMuZmlsdGVyKSByZXR1cm4geHMuZmlsdGVyKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS5zdWJzdHIgLSBuZWdhdGl2ZSBpbmRleCBkb24ndCB3b3JrIGluIElFOFxudmFyIHN1YnN0ciA9ICdhYicuc3Vic3RyKC0xKSA9PT0gJ2InXG4gICAgPyBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7IHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pIH1cbiAgICA6IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHtcbiAgICAgICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBzdHIubGVuZ3RoICsgc3RhcnQ7XG4gICAgICAgIHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pO1xuICAgIH1cbjtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJcclxuIyMjXHJcbkJpbmFyeVJlYWRlclxyXG5cclxuTW9kaWZpZWQgYnkgSXNhaWFoIE9kaG5lclxyXG5AVE9ETzogdXNlIGpEYXRhVmlldyArIGpCaW5hcnkgaW5zdGVhZFxyXG5cclxuUmVmYWN0b3JlZCBieSBWamV1eCA8dmpldXh4QGdtYWlsLmNvbT5cclxuaHR0cDovL2Jsb2cudmpldXguY29tLzIwMTAvamF2YXNjcmlwdC9qYXZhc2NyaXB0LWJpbmFyeS1yZWFkZXIuaHRtbFxyXG5cclxuT3JpZ2luYWxcclxuKyBKb25hcyBSYW9uaSBTb2FyZXMgU2lsdmFcclxuQCBodHRwOi8vanNmcm9taGVsbC5jb20vY2xhc3Nlcy9iaW5hcnktcGFyc2VyIFtyZXYuICMxXVxyXG4jIyNcclxuXHJcbm1vZHVsZS5leHBvcnRzID1cclxuY2xhc3MgQmluYXJ5UmVhZGVyXHJcblx0Y29uc3RydWN0b3I6IChkYXRhKS0+XHJcblx0XHRAX2J1ZmZlciA9IGRhdGFcclxuXHRcdEBfcG9zID0gMFxyXG5cclxuXHQjIFB1YmxpYyAoY3VzdG9tKVxyXG5cdFxyXG5cdHJlYWRCeXRlOiAtPlxyXG5cdFx0QF9jaGVja1NpemUoOClcclxuXHRcdGNoID0gdGhpcy5fYnVmZmVyLmNoYXJDb2RlQXQoQF9wb3MpICYgMHhmZlxyXG5cdFx0QF9wb3MgKz0gMVxyXG5cdFx0Y2ggJiAweGZmXHJcblx0XHJcblx0cmVhZFVuaWNvZGVTdHJpbmc6IC0+XHJcblx0XHRsZW5ndGggPSBAcmVhZFVJbnQxNigpXHJcblx0XHQjIGNvbnNvbGUubG9nIHtsZW5ndGh9XHJcblx0XHRAX2NoZWNrU2l6ZShsZW5ndGggKiAxNilcclxuXHRcdHN0ciA9IFwiXCJcclxuXHRcdGZvciBpIGluIFswLi5sZW5ndGhdXHJcblx0XHRcdHN0ciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKEBfYnVmZmVyLnN1YnN0cihAX3BvcywgMSkgfCAoQF9idWZmZXIuc3Vic3RyKEBfcG9zKzEsIDEpIDw8IDgpKVxyXG5cdFx0XHRAX3BvcyArPSAyXHJcblx0XHRzdHJcclxuXHRcclxuXHQjIFB1YmxpY1xyXG5cdFxyXG5cdHJlYWRJbnQ4OiAtPiBAX2RlY29kZUludCg4LCB0cnVlKVxyXG5cdHJlYWRVSW50ODogLT4gQF9kZWNvZGVJbnQoOCwgZmFsc2UpXHJcblx0cmVhZEludDE2OiAtPiBAX2RlY29kZUludCgxNiwgdHJ1ZSlcclxuXHRyZWFkVUludDE2OiAtPiBAX2RlY29kZUludCgxNiwgZmFsc2UpXHJcblx0cmVhZEludDMyOiAtPiBAX2RlY29kZUludCgzMiwgdHJ1ZSlcclxuXHRyZWFkVUludDMyOiAtPiBAX2RlY29kZUludCgzMiwgZmFsc2UpXHJcblxyXG5cdHJlYWRGbG9hdDogLT4gQF9kZWNvZGVGbG9hdCgyMywgOClcclxuXHRyZWFkRG91YmxlOiAtPiBAX2RlY29kZUZsb2F0KDUyLCAxMSlcclxuXHRcclxuXHRyZWFkQ2hhcjogLT4gQHJlYWRTdHJpbmcoMSlcclxuXHRyZWFkU3RyaW5nOiAobGVuZ3RoKS0+XHJcblx0XHRAX2NoZWNrU2l6ZShsZW5ndGggKiA4KVxyXG5cdFx0cmVzdWx0ID0gQF9idWZmZXIuc3Vic3RyKEBfcG9zLCBsZW5ndGgpXHJcblx0XHRAX3BvcyArPSBsZW5ndGhcclxuXHRcdHJlc3VsdFxyXG5cclxuXHRzZWVrOiAocG9zKS0+XHJcblx0XHRAX3BvcyA9IHBvc1xyXG5cdFx0QF9jaGVja1NpemUoMClcclxuXHRcclxuXHRnZXRQb3NpdGlvbjogLT4gQF9wb3NcclxuXHRcclxuXHRnZXRTaXplOiAtPiBAX2J1ZmZlci5sZW5ndGhcclxuXHRcclxuXHJcblxyXG5cdCMgUHJpdmF0ZVxyXG5cdFxyXG5cdF9kZWNvZGVGbG9hdDogYGZ1bmN0aW9uKHByZWNpc2lvbkJpdHMsIGV4cG9uZW50Qml0cyl7XHJcblx0XHR2YXIgbGVuZ3RoID0gcHJlY2lzaW9uQml0cyArIGV4cG9uZW50Qml0cyArIDE7XHJcblx0XHR2YXIgc2l6ZSA9IGxlbmd0aCA+PiAzO1xyXG5cdFx0dGhpcy5fY2hlY2tTaXplKGxlbmd0aCk7XHJcblxyXG5cdFx0dmFyIGJpYXMgPSBNYXRoLnBvdygyLCBleHBvbmVudEJpdHMgLSAxKSAtIDE7XHJcblx0XHR2YXIgc2lnbmFsID0gdGhpcy5fcmVhZEJpdHMocHJlY2lzaW9uQml0cyArIGV4cG9uZW50Qml0cywgMSwgc2l6ZSk7XHJcblx0XHR2YXIgZXhwb25lbnQgPSB0aGlzLl9yZWFkQml0cyhwcmVjaXNpb25CaXRzLCBleHBvbmVudEJpdHMsIHNpemUpO1xyXG5cdFx0dmFyIHNpZ25pZmljYW5kID0gMDtcclxuXHRcdHZhciBkaXZpc29yID0gMjtcclxuXHRcdHZhciBjdXJCeXRlID0gMDsgLy9sZW5ndGggKyAoLXByZWNpc2lvbkJpdHMgPj4gMykgLSAxO1xyXG5cdFx0ZG8ge1xyXG5cdFx0XHR2YXIgYnl0ZVZhbHVlID0gdGhpcy5fcmVhZEJ5dGUoKytjdXJCeXRlLCBzaXplKTtcclxuXHRcdFx0dmFyIHN0YXJ0Qml0ID0gcHJlY2lzaW9uQml0cyAlIDggfHwgODtcclxuXHRcdFx0dmFyIG1hc2sgPSAxIDw8IHN0YXJ0Qml0O1xyXG5cdFx0XHR3aGlsZSAobWFzayA+Pj0gMSkge1xyXG5cdFx0XHRcdGlmIChieXRlVmFsdWUgJiBtYXNrKSB7XHJcblx0XHRcdFx0XHRzaWduaWZpY2FuZCArPSAxIC8gZGl2aXNvcjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZGl2aXNvciAqPSAyO1xyXG5cdFx0XHR9XHJcblx0XHR9IHdoaWxlIChwcmVjaXNpb25CaXRzIC09IHN0YXJ0Qml0KTtcclxuXHJcblx0XHR0aGlzLl9wb3MgKz0gc2l6ZTtcclxuXHJcblx0XHRyZXR1cm4gZXhwb25lbnQgPT0gKGJpYXMgPDwgMSkgKyAxID8gc2lnbmlmaWNhbmQgPyBOYU4gOiBzaWduYWwgPyAtSW5maW5pdHkgOiArSW5maW5pdHlcclxuXHRcdFx0OiAoMSArIHNpZ25hbCAqIC0yKSAqIChleHBvbmVudCB8fCBzaWduaWZpY2FuZCA/ICFleHBvbmVudCA/IE1hdGgucG93KDIsIC1iaWFzICsgMSkgKiBzaWduaWZpY2FuZFxyXG5cdFx0XHQ6IE1hdGgucG93KDIsIGV4cG9uZW50IC0gYmlhcykgKiAoMSArIHNpZ25pZmljYW5kKSA6IDApO1xyXG5cdH1gXHJcblxyXG5cdF9kZWNvZGVJbnQ6IGBmdW5jdGlvbihiaXRzLCBzaWduZWQpe1xyXG5cdFx0dmFyIHggPSB0aGlzLl9yZWFkQml0cygwLCBiaXRzLCBiaXRzIC8gOCksIG1heCA9IE1hdGgucG93KDIsIGJpdHMpO1xyXG5cdFx0dmFyIHJlc3VsdCA9IHNpZ25lZCAmJiB4ID49IG1heCAvIDIgPyB4IC0gbWF4IDogeDtcclxuXHJcblx0XHR0aGlzLl9wb3MgKz0gYml0cyAvIDg7XHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH1gXHJcblxyXG5cdCNzaGwgZml4OiBIZW5yaSBUb3JnZW1hbmUgfjE5OTYgKGNvbXByZXNzZWQgYnkgSm9uYXMgUmFvbmkpXHJcblx0X3NobDogYGZ1bmN0aW9uIChhLCBiKXtcclxuXHRcdGZvciAoKytiOyAtLWI7IGEgPSAoKGEgJT0gMHg3ZmZmZmZmZiArIDEpICYgMHg0MDAwMDAwMCkgPT0gMHg0MDAwMDAwMCA/IGEgKiAyIDogKGEgLSAweDQwMDAwMDAwKSAqIDIgKyAweDdmZmZmZmZmICsgMSk7XHJcblx0XHRyZXR1cm4gYTtcclxuXHR9YFxyXG5cdFxyXG5cdF9yZWFkQnl0ZTogYGZ1bmN0aW9uIChpLCBzaXplKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fYnVmZmVyLmNoYXJDb2RlQXQodGhpcy5fcG9zICsgc2l6ZSAtIGkgLSAxKSAmIDB4ZmY7XHJcblx0fWBcclxuXHJcblx0X3JlYWRCaXRzOiBgZnVuY3Rpb24gKHN0YXJ0LCBsZW5ndGgsIHNpemUpIHtcclxuXHRcdHZhciBvZmZzZXRMZWZ0ID0gKHN0YXJ0ICsgbGVuZ3RoKSAlIDg7XHJcblx0XHR2YXIgb2Zmc2V0UmlnaHQgPSBzdGFydCAlIDg7XHJcblx0XHR2YXIgY3VyQnl0ZSA9IHNpemUgLSAoc3RhcnQgPj4gMykgLSAxO1xyXG5cdFx0dmFyIGxhc3RCeXRlID0gc2l6ZSArICgtKHN0YXJ0ICsgbGVuZ3RoKSA+PiAzKTtcclxuXHRcdHZhciBkaWZmID0gY3VyQnl0ZSAtIGxhc3RCeXRlO1xyXG5cclxuXHRcdHZhciBzdW0gPSAodGhpcy5fcmVhZEJ5dGUoY3VyQnl0ZSwgc2l6ZSkgPj4gb2Zmc2V0UmlnaHQpICYgKCgxIDw8IChkaWZmID8gOCAtIG9mZnNldFJpZ2h0IDogbGVuZ3RoKSkgLSAxKTtcclxuXHJcblx0XHRpZiAoZGlmZiAmJiBvZmZzZXRMZWZ0KSB7XHJcblx0XHRcdHN1bSArPSAodGhpcy5fcmVhZEJ5dGUobGFzdEJ5dGUrKywgc2l6ZSkgJiAoKDEgPDwgb2Zmc2V0TGVmdCkgLSAxKSkgPDwgKGRpZmYtLSA8PCAzKSAtIG9mZnNldFJpZ2h0OyBcclxuXHRcdH1cclxuXHJcblx0XHR3aGlsZSAoZGlmZikge1xyXG5cdFx0XHRzdW0gKz0gdGhpcy5fc2hsKHRoaXMuX3JlYWRCeXRlKGxhc3RCeXRlKyssIHNpemUpLCAoZGlmZi0tIDw8IDMpIC0gb2Zmc2V0UmlnaHQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBzdW07XHJcblx0fWBcclxuXHJcblx0X2NoZWNrU2l6ZTogKG5lZWRlZEJpdHMpLT5cclxuXHRcdGlmIEBfcG9zICsgTWF0aC5jZWlsKG5lZWRlZEJpdHMgLyA4KSA+IEBfYnVmZmVyLmxlbmd0aFxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJJbmRleCBvdXQgb2YgYm91bmRcIlxyXG5cclxuIiwiXHJcbm1vZHVsZS5leHBvcnRzID1cclxuY2xhc3MgQ29sb3JcclxuXHRjb25zdHJ1Y3RvcjogKG9wdGlvbnMpLT5cclxuXHRcdCMgQFRPRE86IGRvbid0IGFzc2lnbiB7QHIsIEBnLCBAYiwgQGgsIEBzLCBAdiwgQGx9IHJpZ2h0IGF3YXlcclxuXHRcdCMgKG1vcmUgb2YgYSB0by1kb24ndCwgcmVhbGx5KVxyXG5cdFx0e1xyXG5cdFx0XHRAciwgQGcsIEBiLFxyXG5cdFx0XHRAaCwgQHMsIEB2LCBAbCxcclxuXHRcdFx0YywgbSwgeSwgayxcclxuXHRcdFx0QG5hbWVcclxuXHRcdH0gPSBvcHRpb25zXHJcblxyXG5cdFx0aWYgQHI/IGFuZCBAZz8gYW5kIEBiP1xyXG5cdFx0XHQjIFJlZCBHcmVlbiBCbHVlXHJcblx0XHRcdCMgKG5vIGNvbnZlcnNpb25zIG5lZWRlZCBoZXJlKVxyXG5cdFx0ZWxzZSBpZiBAaD8gYW5kIEBzP1xyXG5cdFx0XHQjIEN5bGluZHJpY2FsIENvbG9yIFNwYWNlXHJcblx0XHRcdGlmIEB2P1xyXG5cdFx0XHRcdCMgSHVlIFNhdHVyYXRpb24gVmFsdWVcclxuXHRcdFx0XHRAbCA9ICgyIC0gQHMgLyAxMDApICogQHYgLyAyXHJcblx0XHRcdFx0QHMgPSBAcyAqIEB2IC8gKGlmIEBsIDwgNTAgdGhlbiBAbCAqIDIgZWxzZSAyMDAgLSBAbCAqIDIpXHJcblx0XHRcdFx0QHMgPSAwIGlmIGlzTmFOIEBzXHJcblx0XHRcdGVsc2UgaWYgQGw/XHJcblx0XHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBMaWdodG5lc3NcclxuXHRcdFx0XHQjIChubyBjb252ZXJzaW9ucyBuZWVkZWQgaGVyZSlcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIkh1ZSwgc2F0dXJhdGlvbiwgYW5kLi4uPyAoZWl0aGVyIGxpZ2h0bmVzcyBvciB2YWx1ZSlcIlxyXG5cdFx0ZWxzZSBpZiBjPyBhbmQgbT8gYW5kIHk/IGFuZCBrP1xyXG5cdFx0XHQjIEN5YW4gTWFnZW50YSBZZWxsb3cgYmxhY0tcclxuXHRcdFx0IyBVTlRFU1RFRFxyXG5cdFx0XHRjIC89IDEwMFxyXG5cdFx0XHRtIC89IDEwMFxyXG5cdFx0XHR5IC89IDEwMFxyXG5cdFx0XHRrIC89IDEwMFxyXG5cdFx0XHRcclxuXHRcdFx0QHIgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIGMgKiAoMSAtIGspICsgaykpXHJcblx0XHRcdEBnID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCBtICogKDEgLSBrKSArIGspKVxyXG5cdFx0XHRAYiA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgeSAqICgxIC0gaykgKyBrKSlcclxuXHRcdGVsc2VcclxuXHRcdFx0IyBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRFxyXG5cdFx0XHRpZiBAbD8gYW5kIEBhPyBhbmQgQGI/XHJcblx0XHRcdFx0d2hpdGUgPVxyXG5cdFx0XHRcdFx0eDogOTUuMDQ3XHJcblx0XHRcdFx0XHR5OiAxMDAuMDAwXHJcblx0XHRcdFx0XHR6OiAxMDguODgzXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0eHl6ID0gXHJcblx0XHRcdFx0XHR5OiAocmF3LmwgKyAxNikgLyAxMTZcclxuXHRcdFx0XHRcdHg6IHJhdy5hIC8gNTAwICsgeHl6LnlcclxuXHRcdFx0XHRcdHo6IHh5ei55IC0gcmF3LmIgLyAyMDBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRmb3IgXyBpbiBcInh5elwiXHJcblx0XHRcdFx0XHRwb3dlZCA9IE1hdGgucG93KHh5eltfXSwgMylcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYgcG93ZWQgPiAwLjAwODg1NlxyXG5cdFx0XHRcdFx0XHR4eXpbX10gPSBwb3dlZFxyXG5cdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHR4eXpbX10gPSAoeHl6W19dIC0gMTYgLyAxMTYpIC8gNy43ODdcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0I3h5eltfXSA9IF9yb3VuZCh4eXpbX10gKiB3aGl0ZVtfXSlcclxuXHRcdFx0XHRcclxuXHRcdFx0IyBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRFxyXG5cdFx0XHRpZiBAeD8gYW5kIEB5PyBhbmQgQHo/XHJcblx0XHRcdFx0eHl6ID1cclxuXHRcdFx0XHRcdHg6IHJhdy54IC8gMTAwXHJcblx0XHRcdFx0XHR5OiByYXcueSAvIDEwMFxyXG5cdFx0XHRcdFx0ejogcmF3LnogLyAxMDBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRyZ2IgPVxyXG5cdFx0XHRcdFx0cjogeHl6LnggKiAzLjI0MDYgKyB4eXoueSAqIC0xLjUzNzIgKyB4eXoueiAqIC0wLjQ5ODZcclxuXHRcdFx0XHRcdGc6IHh5ei54ICogLTAuOTY4OSArIHh5ei55ICogMS44NzU4ICsgeHl6LnogKiAwLjA0MTVcclxuXHRcdFx0XHRcdGI6IHh5ei54ICogMC4wNTU3ICsgeHl6LnkgKiAtMC4yMDQwICsgeHl6LnogKiAxLjA1NzBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRmb3IgXyBpbiBcInJnYlwiXHJcblx0XHRcdFx0XHQjcmdiW19dID0gX3JvdW5kKHJnYltfXSlcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYgcmdiW19dIDwgMFxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gPSAwXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHJnYltfXSA+IDAuMDAzMTMwOFxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gPSAxLjA1NSAqIE1hdGgucG93KHJnYltfXSwgKDEgLyAyLjQpKSAtIDAuMDU1XHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdHJnYltfXSAqPSAxMi45MlxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdCNyZ2JbX10gPSBNYXRoLnJvdW5kKHJnYltfXSAqIDI1NSlcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIkNvbG9yIGNvbnN0cnVjdG9yIG11c3QgYmUgY2FsbGVkIHdpdGgge3IsZyxifSBvciB7aCxzLHZ9IG9yIHtoLHMsbH0gb3Ige2MsbSx5LGt9IG9yIHt4LHksen0gb3Ige2wsYSxifSxcclxuXHRcdFx0XHRcdCN7XHJcblx0XHRcdFx0XHRcdHRyeVxyXG5cdFx0XHRcdFx0XHRcdFwiZ290ICN7SlNPTi5zdHJpbmdpZnkob3B0aW9ucyl9XCJcclxuXHRcdFx0XHRcdFx0Y2F0Y2ggZVxyXG5cdFx0XHRcdFx0XHRcdFwiZ290IHNvbWV0aGluZyB0aGF0IGNvdWxkbid0IGJlIGRpc3BsYXllZCB3aXRoIEpTT04uc3RyaW5naWZ5IGZvciB0aGlzIGVycm9yIG1lc3NhZ2VcIlxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFwiXHJcblx0XHRcclxuXHRcclxuXHR0b1N0cmluZzogLT5cclxuXHRcdGlmIEByP1xyXG5cdFx0XHQjIFJlZCBHcmVlbiBCbHVlXHJcblx0XHRcdGlmIEBhPyAjIEFscGhhXHJcblx0XHRcdFx0XCJyZ2JhKCN7QHJ9LCAje0BnfSwgI3tAYn0sICN7QGF9KVwiXHJcblx0XHRcdGVsc2UgIyBPcGFxdWVcclxuXHRcdFx0XHRcInJnYigje0ByfSwgI3tAZ30sICN7QGJ9KVwiXHJcblx0XHRlbHNlIGlmIEBoP1xyXG5cdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIExpZ2h0bmVzc1xyXG5cdFx0XHQjIChBc3N1bWUgaDowLTM2MCwgczowLTEwMCwgbDowLTEwMClcclxuXHRcdFx0aWYgQGE/ICMgQWxwaGFcclxuXHRcdFx0XHRcImhzbGEoI3tAaH0sICN7QHN9JSwgI3tAbH0lLCAje0BhfSlcIlxyXG5cdFx0XHRlbHNlICMgT3BhcXVlXHJcblx0XHRcdFx0XCJoc2woI3tAaH0sICN7QHN9JSwgI3tAbH0lKVwiXHJcblx0XHJcblx0aXM6IChjb2xvciktPlxyXG5cdFx0IyBjb21wYXJlIGFzIHN0cmluZ3NcclxuXHRcdFwiI3tAfVwiIGlzIFwiI3tjb2xvcn1cIlxyXG4iLCJcclxuQ29sb3IgPSByZXF1aXJlIFwiLi9Db2xvclwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIFBhbGV0dGUgZXh0ZW5kcyBBcnJheVxyXG5cdFxyXG5cdGNvbnN0cnVjdG9yOiAoY29sb3JzLi4uKS0+XHJcblx0XHQjIGNvbG9ycyA9IGNvbG9ycy5tYXAoKHZhbHVlKS0+IGlmIHZhbHVlIGluc3RhbmNlb2YgQ29sb3IgdGhlbiB2YWx1ZSBlbHNlIG5ldyBDb2xvcih2YWx1ZSkpXHJcblx0XHRzdXBlcihjb2xvcnMuLi4pXHJcblx0XHJcblx0YWRkOiAobyktPlxyXG5cdFx0bmV3X2NvbG9yID0gbmV3IENvbG9yKG8pXHJcblx0XHRcclxuXHRcdCMgZm9yIGNvbG9yIGluIEBcclxuXHRcdCMgXHRpZiBjb2xvci5pcyBuZXdfY29sb3JcclxuXHRcdCMgXHRcdG5ld19jb2xvci5pc19kdXBsaWNhdGUgPSB0cnVlXHJcblx0XHQjIFx0XHRyZXR1cm5cclxuXHRcdFxyXG5cdFx0QHB1c2ggbmV3X2NvbG9yXHJcblx0XHJcblx0IyBwdXNoOiAobyktPlxyXG5cdCMgXHRuZXdfY29sb3IgPSBuZXcgQ29sb3IobylcclxuXHQjIFx0c3VwZXIucHVzaCBuZXdfY29sb3JcclxuXHRcclxuXHRmaW5hbGl6ZTogLT5cclxuXHRcdGlmIG5vdCBAbl9jb2x1bW5zXHJcblx0XHRcdEBndWVzc19kaW1lbnNpb25zKClcclxuXHRcdCMgaWYgQHdpdGhfZHVwbGljYXRlcyBpc250IEBcclxuXHRcdCMgXHRAd2l0aF9kdXBsaWNhdGVzLmZpbmFsaXplKClcclxuXHRcdHVubGVzcyBAcGFyZW50X3BhbGV0dGVfd2l0aG91dF9kdXBsaWNhdGVzXHJcblx0XHRcdEB3aXRoX2R1cGxpY2F0ZXMgPSBuZXcgUGFsZXR0ZVxyXG5cdFx0XHRAd2l0aF9kdXBsaWNhdGVzLnBhcmVudF9wYWxldHRlX3dpdGhvdXRfZHVwbGljYXRlcyA9IEBcclxuXHRcdFx0QHdpdGhfZHVwbGljYXRlc1tpXSA9IEBbaV0gZm9yIGkgaW4gWzAuLi5AbGVuZ3RoXVxyXG5cdFx0XHRAd2l0aF9kdXBsaWNhdGVzLm5fY29sdW1ucyA9IEBuX2NvbHVtbnNcclxuXHRcdFx0QHdpdGhfZHVwbGljYXRlcy5oYXNfZGltZW5zaW9ucyA9IEBoYXNfZGltZW5zaW9uc1xyXG5cdFx0XHRAd2l0aF9kdXBsaWNhdGVzLmZpbmFsaXplKClcclxuXHJcblx0XHRcdCMgaW4tcGxhY2UgdW5pcXVpZnlcclxuXHRcdFx0aSA9IDBcclxuXHRcdFx0d2hpbGUgaSA8IEBsZW5ndGhcclxuXHRcdFx0XHRpX2NvbG9yID0gQFtpXVxyXG5cdFx0XHRcdGogPSBpICsgMVxyXG5cdFx0XHRcdHdoaWxlIGogPCBAbGVuZ3RoXHJcblx0XHRcdFx0XHRqX2NvbG9yID0gQFtqXVxyXG5cdFx0XHRcdFx0aWYgaV9jb2xvci5pcyBqX2NvbG9yXHJcblx0XHRcdFx0XHRcdEAuc3BsaWNlKGosIDEpXHJcblx0XHRcdFx0XHRcdGogLT0gMVxyXG5cdFx0XHRcdFx0aiArPSAxXHJcblx0XHRcdFx0aSArPSAxXHJcblx0XHQjIGVsc2VcclxuXHRcdFx0IyBAd2l0aF9kdXBsaWNhdGVzID0gQFxyXG5cclxuXHRndWVzc19kaW1lbnNpb25zOiAtPlxyXG5cdFx0bGVuID0gQGxlbmd0aFxyXG5cdFx0Y2FuZGlkYXRlX2RpbWVuc2lvbnMgPSBbXVxyXG5cdFx0Zm9yIG5fY29sdW1ucyBpbiBbMC4ubGVuXVxyXG5cdFx0XHRuX3Jvd3MgPSBsZW4gLyBuX2NvbHVtbnNcclxuXHRcdFx0aWYgbl9yb3dzIGlzIE1hdGgucm91bmQgbl9yb3dzXHJcblx0XHRcdFx0Y2FuZGlkYXRlX2RpbWVuc2lvbnMucHVzaCBbbl9yb3dzLCBuX2NvbHVtbnNdXHJcblx0XHRcclxuXHRcdHNxdWFyZXN0ID0gWzAsIDM0OTUwOTNdXHJcblx0XHRmb3IgY2QgaW4gY2FuZGlkYXRlX2RpbWVuc2lvbnNcclxuXHRcdFx0aWYgTWF0aC5hYnMoY2RbMF0gLSBjZFsxXSkgPCBNYXRoLmFicyhzcXVhcmVzdFswXSAtIHNxdWFyZXN0WzFdKVxyXG5cdFx0XHRcdHNxdWFyZXN0ID0gY2RcclxuXHRcdFxyXG5cdFx0I0BuX2NvbHVtbnMgPSBzcXVhcmVzdFsxXVxyXG4iLCJcclxuIyBMb2FkIGEgQ29sb3JTY2hlbWVyIHBhbGV0dGVcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHR2ZXJzaW9uID0gYnIucmVhZFVJbnQxNigpICMgb3Igc29tZXRoaW5nXHJcblx0bGVuZ3RoID0gYnIucmVhZFVJbnQxNigpXHJcblx0aSA9IDBcclxuXHR3aGlsZSBpIDwgbGVuZ3RoXHJcblx0XHRici5zZWVrKDggKyBpICogMjYpXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0aSArPSAxXHJcblxyXG5cdHBhbGV0dGVcclxuXHJcbiIsIlxyXG4jIExvYWQgYSBHSU1QIHBhbGV0dGVcclxuXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdGlmIGxpbmVzWzBdIGlzbnQgXCJHSU1QIFBhbGV0dGVcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiTm90IGEgR0lNUCBQYWxldHRlXCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGkgPSAxXHJcblx0d2hpbGUgKGkgKz0gMSkgPCBsaW5lcy5sZW5ndGhcclxuXHRcdGxpbmUgPSBsaW5lc1tpXVxyXG5cdFx0XHJcblx0XHRpZiBsaW5lLm1hdGNoKC9eIy8pIG9yIGxpbmUgaXMgXCJcIiB0aGVuIGNvbnRpbnVlXHJcblx0XHRcclxuXHRcdG0gPSBsaW5lLm1hdGNoKC9OYW1lOlxccyooLiopLylcclxuXHRcdGlmIG1cclxuXHRcdFx0cGFsZXR0ZS5uYW1lID0gbVsxXVxyXG5cdFx0XHRjb250aW51ZVxyXG5cdFx0bSA9IGxpbmUubWF0Y2goL0NvbHVtbnM6XFxzKiguKikvKVxyXG5cdFx0aWYgbVxyXG5cdFx0XHRwYWxldHRlLm5fY29sdW1ucyA9IE51bWJlcihtWzFdKVxyXG5cdFx0XHRwYWxldHRlLmhhc19kaW1lbnNpb25zID0geWVzXHJcblx0XHRcdGNvbnRpbnVlXHJcblx0XHRcclxuXHRcdHJfZ19iX25hbWUgPSBsaW5lLm1hdGNoKC9eXFxzKihbMC05XSspXFxzKyhbMC05XSspXFxzKyhbMC05XSspKD86XFxzKyguKikpPyQvKVxyXG5cdFx0aWYgbm90IHJfZ19iX25hbWVcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiTGluZSAje2l9IGRvZXNuJ3QgbWF0Y2ggcGF0dGVybiByX2dfYl9uYW1lXCIgIyBUT0RPOiBiZXR0ZXIgbWVzc2FnZVxyXG5cdFx0XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiByX2dfYl9uYW1lWzFdXHJcblx0XHRcdGc6IHJfZ19iX25hbWVbMl1cclxuXHRcdFx0Yjogcl9nX2JfbmFtZVszXVxyXG5cdFx0XHRuYW1lOiByX2dfYl9uYW1lWzRdXHJcblx0XHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIERldGVjdCBDU1MgY29sb3JzIChleGNlcHQgbmFtZWQgY29sb3JzKVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGVzID0gW1xyXG5cdFx0cGFsZXR0ZV94UlJHR0JCID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV94UkdCID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9yZ2IgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX2hzbCA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfaHNsYSA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfcmdiYSA9IG5ldyBQYWxldHRlKClcclxuXHRdXHJcblx0XHJcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0XFwjICMgaGFzaHRhZyAjICMvXHJcblx0XHQoWzAtOUEtRl17Mn0pPyAjIGFscGhhXHJcblx0XHQoWzAtOUEtRl17M30pICMgdGhyZWUgZGlnaXRzICgjQTBDKVxyXG5cdFx0KFswLTlBLUZdezN9KT8gIyBzaXggZGlnaXRzICgjQUEwMENDKVxyXG5cdFx0XHJcblx0XHQoPyFbMC05QS1GXSkgIyAoYW5kIG5vIG1vcmUhKVxyXG5cdC8vL2dpbSwgKG0sICQwLCAkMSwgJDIpLT5cclxuXHRcdFxyXG5cdFx0YWxwaGEgPSBoZXggJDBcclxuXHRcdFxyXG5cdFx0aWYgJDJcclxuXHRcdFx0eFJHQiA9ICQxICsgJDJcclxuXHRcdFx0cGFsZXR0ZV94UlJHR0JCLmFkZFxyXG5cdFx0XHRcdHI6IGhleCB4UkdCWzBdICsgeFJHQlsxXVxyXG5cdFx0XHRcdGc6IGhleCB4UkdCWzJdICsgeFJHQlszXVxyXG5cdFx0XHRcdGI6IGhleCB4UkdCWzRdICsgeFJHQls1XVxyXG5cdFx0XHRcdGE6IGFscGhhXHJcblx0XHRlbHNlXHJcblx0XHRcdHhSR0IgPSAkMVxyXG5cdFx0XHRwYWxldHRlX3hSR0IuYWRkXHJcblx0XHRcdFx0cjogaGV4IHhSR0JbMF0gKyB4UkdCWzBdXHJcblx0XHRcdFx0ZzogaGV4IHhSR0JbMV0gKyB4UkdCWzFdXHJcblx0XHRcdFx0YjogaGV4IHhSR0JbMl0gKyB4UkdCWzJdXHJcblx0XHRcdFx0YTogYWxwaGFcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRyZ2JcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyByZWRcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgZ3JlZW5cclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgYmx1ZVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0cjogTnVtYmVyIG1bMV1cclxuXHRcdFx0ZzogTnVtYmVyIG1bMl1cclxuXHRcdFx0YjogTnVtYmVyIG1bM11cclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRyZ2JhXFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgcmVkXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGdyZWVuXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGJsdWVcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM318MFxcLlswLTldKykgIyBhbHBoYVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0cjogTnVtYmVyIG1bMV1cclxuXHRcdFx0ZzogTnVtYmVyIG1bMl1cclxuXHRcdFx0YjogTnVtYmVyIG1bM11cclxuXHRcdFx0YTogTnVtYmVyIG1bNF1cclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRoc2xcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBodWVcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgc2F0dXJhdGlvblxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyB2YWx1ZVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0aDogTnVtYmVyIG1bMV1cclxuXHRcdFx0czogTnVtYmVyIG1bMl1cclxuXHRcdFx0bDogTnVtYmVyIG1bM11cclxuXHRcclxuXHRtb3N0X2NvbG9ycyA9IFtdXHJcblx0Zm9yIHBhbGV0dGUgaW4gcGFsZXR0ZXNcclxuXHRcdGlmIHBhbGV0dGUubGVuZ3RoID49IG1vc3RfY29sb3JzLmxlbmd0aFxyXG5cdFx0XHRtb3N0X2NvbG9ycyA9IHBhbGV0dGVcclxuXHRcclxuXHRuID0gbW9zdF9jb2xvcnMubGVuZ3RoXHJcblx0aWYgbiA8IDRcclxuXHRcdHRocm93IG5ldyBFcnJvcihbXHJcblx0XHRcdFwiTm8gY29sb3JzIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IG9uZSBjb2xvciBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBhIGNvdXBsZSBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgYSBmZXcgY29sb3JzIGZvdW5kXCJcclxuXHRcdF1bbl0gKyBcIiAoI3tufSlcIilcclxuXHRcclxuXHRtb3N0X2NvbG9yc1xyXG4iLCJcclxuIyBXaGF0IGRvZXMgSFBMIHN0YW5kIGZvcj9cclxuIyBIb3dkeSwgUGFsZXR0ZSBMb3ZlcnMhXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IFwiUGFsZXR0ZVwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYW4gSFBMIHBhbGV0dGVcIlxyXG5cdGlmIG5vdCBsaW5lc1sxXS5tYXRjaCAvVmVyc2lvbiBbMzRdXFwuMC9cclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVuc3VwcG9ydGVkIEhQTCB2ZXJzaW9uXCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdFxyXG5cdGZvciBsaW5lLCBpIGluIGxpbmVzXHJcblx0XHRpZiBsaW5lLm1hdGNoIC8uKyAuKiAuKy9cclxuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcclxuXHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRyOiByZ2JbMF1cclxuXHRcdFx0XHRnOiByZ2JbMV1cclxuXHRcdFx0XHRiOiByZ2JbMl1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBQYWludC5ORVQgcGFsZXR0ZSBmaWxlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHJcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXHJcblx0XHJcblx0Zm9yIGxpbmUgaW4gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0XHRtID0gbGluZS5tYXRjaCgvXihbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkkL2kpXHJcblx0XHRpZiBtIHRoZW4gcGFsZXR0ZS5hZGRcclxuXHRcdFx0YTogaGV4IG1bMV1cclxuXHRcdFx0cjogaGV4IG1bMl1cclxuXHRcdFx0ZzogaGV4IG1bM11cclxuXHRcdFx0YjogaGV4IG1bNF1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBKQVNDIFBBTCBmaWxlIChQYWludCBTaG9wIFBybyBwYWxldHRlIGZpbGUpXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBcIkpBU0MtUEFMXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhIEpBU0MtUEFMXCJcclxuXHRpZiBsaW5lc1sxXSBpc250IFwiMDEwMFwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIEpBU0MtUEFMIHZlcnNpb25cIlxyXG5cdGlmIGxpbmVzWzJdIGlzbnQgXCIyNTZcIlxyXG5cdFx0XCJ0aGF0J3Mgb2tcIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0I25fY29sb3JzID0gTnVtYmVyKGxpbmVzWzJdKVxyXG5cdFxyXG5cdGZvciBsaW5lLCBpIGluIGxpbmVzXHJcblx0XHRpZiBsaW5lIGlzbnQgXCJcIiBhbmQgaSA+IDJcclxuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcclxuXHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRyOiByZ2JbMF1cclxuXHRcdFx0XHRnOiByZ2JbMV1cclxuXHRcdFx0XHRiOiByZ2JbMl1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBSZXNvdXJjZSBJbnRlcmNoYW5nZSBGaWxlIEZvcm1hdCBQQUwgZmlsZVxyXG5cclxuIyBwb3J0ZWQgZnJvbSBDIyBjb2RlIGF0IGh0dHBzOi8vd29ybXMyZC5pbmZvL1BhbGV0dGVfZmlsZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHQjIFJJRkYgaGVhZGVyXHJcblx0cmlmZiA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcIlJJRkZcIlxyXG5cdGRhdGFTaXplID0gYnIucmVhZFVJbnQzMigpXHJcblx0dHlwZSA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcIlBBTCBcIlxyXG5cdFxyXG5cdGlmIHJpZmYgaXNudCBcIlJJRkZcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiUklGRiBoZWFkZXIgbm90IGZvdW5kOyBub3QgYSBSSUZGIFBBTCBmaWxlXCJcclxuXHRcclxuXHRpZiB0eXBlIGlzbnQgXCJQQUwgXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlwiXCJcclxuXHRcdFx0UklGRiBoZWFkZXIgc2F5cyB0aGlzIGlzbid0IGEgUEFMIGZpbGUsXHJcblx0XHRcdG1vcmUgb2YgYSBzb3J0IG9mICN7KCh0eXBlK1wiXCIpLnRyaW0oKSl9IGZpbGVcclxuXHRcdFwiXCJcIlxyXG5cdFxyXG5cdCMgRGF0YSBjaHVua1xyXG5cdGNodW5rVHlwZSA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcImRhdGFcIlxyXG5cdGNodW5rU2l6ZSA9IGJyLnJlYWRVSW50MzIoKVxyXG5cdHBhbFZlcnNpb24gPSBici5yZWFkVUludDE2KCkgIyAweDAzMDBcclxuXHRwYWxOdW1FbnRyaWVzID0gYnIucmVhZFVJbnQxNigpXHJcblx0XHJcblx0XHJcblx0aWYgY2h1bmtUeXBlIGlzbnQgXCJkYXRhXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIkRhdGEgY2h1bmsgbm90IGZvdW5kICguLi4nI3tjaHVua1R5cGV9Jz8pXCJcclxuXHRcclxuXHRpZiBwYWxWZXJzaW9uIGlzbnQgMHgwMzAwXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbnN1cHBvcnRlZCBQQUwgZmlsZSBmb3JtYXQgdmVyc2lvbjogMHgje3BhbFZlcnNpb24udG9TdHJpbmcoMTYpfVwiXHJcblx0XHJcblx0IyBDb2xvcnNcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGkgPSAwXHJcblx0d2hpbGUgKGkgKz0gMSkgPCBwYWxOdW1FbnRyaWVzIC0gMVxyXG5cdFx0XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRfOiBici5yZWFkQnl0ZSgpICMgXCJmbGFnc1wiLCBhbHdheXMgMHgwMFxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgUEFMIChTdGFyQ3JhZnQgcmF3IHBhbGV0dGUpXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0Zm9yIGkgaW4gWzAuLi4yNTVdXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHQjOiBubyBwYWRkaW5nXHJcblx0XHJcblx0Iz8gcGFsZXR0ZS5uX2NvbHVtbnMgPSAxNlxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgV1BFIChTdGFyQ3JhZnQgcGFkZGVkIHJhdyBwYWxldHRlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdGZvciBpIGluIFswLi4uMjU1XVxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0XzogYnIucmVhZEJ5dGUoKSAjIHBhZGRpbmdcclxuXHRcclxuXHRwYWxldHRlLm5fY29sdW1ucyA9IDE2XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuL1BhbGV0dGVcIlxyXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcclxuXHJcbmNsYXNzIFJhbmRvbUNvbG9yIGV4dGVuZHMgQ29sb3JcclxuXHRjb25zdHJ1Y3RvcjogLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEByYW5kb21pemUoKVxyXG5cdFxyXG5cdHJhbmRvbWl6ZTogLT5cclxuXHRcdEBoID0gTWF0aC5yYW5kb20oKSAqIDM2MFxyXG5cdFx0QHMgPSBNYXRoLnJhbmRvbSgpICogMTAwXHJcblx0XHRAbCA9IE1hdGgucmFuZG9tKCkgKiAxMDBcclxuXHRcclxuXHR0b1N0cmluZzogLT5cclxuXHRcdEByYW5kb21pemUoKVxyXG5cdFx0XCJoc2woI3tAaH0sICN7QHN9JSwgI3tAbH0lKVwiXHJcblx0XHJcblx0aXM6IC0+IG5vXHJcblxyXG5jbGFzcyBSYW5kb21QYWxldHRlIGV4dGVuZHMgUGFsZXR0ZVxyXG5cdGNvbnN0cnVjdG9yOiAtPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QGxvYWRlZF9hcyA9IFwiQ29tcGxldGVseSBSYW5kb20gQ29sb3Jz4oSiXCJcclxuXHRcdEBsb2FkZWRfYXNfY2xhdXNlID0gXCIoLmNyYyBzamYoRGYwOXNqZGZrc2RsZm1ubSAnOyc7XCJcclxuXHRcdEBjb25maWRlbmNlID0gMFxyXG5cdFx0QGZpbmFsaXplKClcclxuXHRcdGZvciBpIGluIFswLi5NYXRoLnJhbmRvbSgpKjE1KzVdXHJcblx0XHRcdEBwdXNoIG5ldyBSYW5kb21Db2xvcigpXHJcblxyXG5jbGFzcyBMb2FkaW5nRXJyb3JzIGV4dGVuZHMgRXJyb3JcclxuXHRjb25zdHJ1Y3RvcjogKEBlcnJvcnMpLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEBtZXNzYWdlID0gXCJTb21lIGVycm9ycyB3ZXJlIGVuY291bnRlcmVkIHdoZW4gbG9hZGluZzpcIiArXHJcblx0XHRcdGZvciBlcnJvciBpbiBAZXJyb3JzXHJcblx0XHRcdFx0XCJcXG5cXHRcIiArIGVycm9yLm1lc3NhZ2VcclxuXHJcbmxvYWRfcGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxyXG5cdFxyXG5cdHBhbGV0dGVfbG9hZGVycyA9IFtcclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJQYWludCBTaG9wIFBybyBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wicGFsXCIsIFwicHNwcGFsZXR0ZVwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50U2hvcFByb1wiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUklGRiBQQUxcIlxyXG5cdFx0XHRleHRzOiBbXCJwYWxcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9SSUZGXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJDb2xvclNjaGVtZXIgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImNzXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQ29sb3JTY2hlbWVyXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJQYWludC5ORVQgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInR4dFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50Lk5FVFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiR0lNUCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiZ3BsXCIsIFwiZ2ltcFwiLCBcImNvbG9yc1wiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0dJTVBcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkNTUy1zdHlsZSBjb2xvcnNcIlxyXG5cdFx0XHRleHRzOiBbXCJjc3NcIiwgXCJzY3NzXCIsIFwic2Fzc1wiLCBcImxlc3NcIiwgXCJodG1sXCIsIFwic3ZnXCIsIFwianNcIiwgXCJ0c1wiLCBcInhtbFwiLCBcInR4dFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0dlbmVyaWNcIlxyXG5cdFx0fVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBDb2xvciBTd2F0Y2hcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjb1wiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvclN3YXRjaFwiXHJcblx0XHQjIH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgVGFibGVcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjdFwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvclRhYmxlXCJcclxuXHRcdCMgfVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBTd2F0Y2ggRXhjaGFuZ2VcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFzZVwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVTd2F0Y2hFeGNoYW5nZVwiXHJcblx0XHQjIH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgQm9va1wiXHJcblx0XHQjIFx0ZXh0czogW1wiYWNiXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yQm9va1wiXHJcblx0XHQjIH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJIUEwgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImhwbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0hQTFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiU3RhckNyYWZ0IHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJwYWxcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TdGFyQ3JhZnRcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlN0YXJDcmFmdCB0ZXJyYWluIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJ3cGVcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TdGFyQ3JhZnRQYWRkZWRcIlxyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkF1dG9DQUQgQ29sb3IgQm9va1wiXHJcblx0XHQjIFx0ZXh0czogW1wiYWNiXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BdXRvQ0FEQ29sb3JCb29rXCJcclxuXHRcdCMgfVxyXG5cdFx0XHJcblx0XHQjIHtcclxuXHRcdCMgXHQjIChzYW1lIGFzIFBhaW50IFNob3AgUHJvIHBhbGV0dGU/KVxyXG5cdFx0IyBcdG5hbWU6IFwiQ29yZWxEUkFXIHBhbGV0dGVcIlxyXG5cdFx0IyBcdGV4dHM6IFtcInBhbFwiLCBcImNwbFwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQ29yZWxEUkFXXCJcclxuXHRcdCMgfVxyXG5cdF1cclxuXHRcclxuXHQjIGZpbmQgcGFsZXR0ZSBsb2FkZXJzIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cclxuXHRmb3IgcGwgaW4gcGFsZXR0ZV9sb2FkZXJzXHJcblx0XHRwbC5tYXRjaGVzX2V4dCA9IHBsLmV4dHMuaW5kZXhPZihvLmZpbGVfZXh0KSBpc250IC0xXHJcblx0XHJcblx0IyBtb3ZlIHBhbGV0dGUgbG9hZGVycyB0byB0aGUgYmVnaW5uaW5nIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cclxuXHRwYWxldHRlX2xvYWRlcnMuc29ydCAocGwxLCBwbDIpLT5cclxuXHRcdHBsMi5tYXRjaGVzX2V4dCAtIHBsMS5tYXRjaGVzX2V4dFxyXG5cdFxyXG5cdCMgdHJ5IGxvYWRpbmcgc3R1ZmZcclxuXHRlcnJvcnMgPSBbXVxyXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcclxuXHRcdFxyXG5cdFx0dHJ5XHJcblx0XHRcdHBhbGV0dGUgPSBwbC5sb2FkKG8pXHJcblx0XHRcdGlmIHBhbGV0dGUubGVuZ3RoIGlzIDBcclxuXHRcdFx0XHRwYWxldHRlID0gbnVsbFxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIm5vIGNvbG9ycyByZXR1cm5lZFwiXHJcblx0XHRjYXRjaCBlXHJcblx0XHRcdG1zZyA9IFwiZmFpbGVkIHRvIGxvYWQgI3tvLmZpbGVfbmFtZX0gYXMgI3twbC5uYW1lfTogI3tlLm1lc3NhZ2V9XCJcclxuXHRcdFx0IyBpZiBwbC5tYXRjaGVzX2V4dCBhbmQgbm90IGUubWVzc2FnZS5tYXRjaCgvbm90IGEvaSlcclxuXHRcdFx0IyBcdGNvbnNvbGU/LmVycm9yPyBtc2dcclxuXHRcdFx0IyBlbHNlXHJcblx0XHRcdCMgXHRjb25zb2xlPy53YXJuPyBtc2dcclxuXHRcdFx0XHJcblx0XHRcdCMgVE9ETzogbWF5YmUgdGhpcyBzaG91bGRuJ3QgYmUgYW4gRXJyb3Igb2JqZWN0LCBqdXN0IGEge21lc3NhZ2UsIGVycm9yfSBvYmplY3RcclxuXHRcdFx0IyBvciB7ZnJpZW5kbHlNZXNzYWdlLCBlcnJvcn1cclxuXHRcdFx0ZXJyID0gbmV3IEVycm9yIG1zZ1xyXG5cdFx0XHRlcnIuZXJyb3IgPSBlXHJcblx0XHRcdGVycm9ycy5wdXNoIGVyclxyXG5cdFx0XHJcblx0XHRpZiBwYWxldHRlXHJcblx0XHRcdCMgY29uc29sZT8uaW5mbz8gXCJsb2FkZWQgI3tvLmZpbGVfbmFtZX0gYXMgI3twbC5uYW1lfVwiXHJcblx0XHRcdHBhbGV0dGUuY29uZmlkZW5jZSA9IGlmIHBsLm1hdGNoZXNfZXh0IHRoZW4gMC45IGVsc2UgMC4wMVxyXG5cdFx0XHRwYWxldHRlLmxvYWRlZF9hcyA9IHBsLm5hbWVcclxuXHRcdFx0ZXh0c19wcmV0dHkgPSBcIiguI3twbC5leHRzLmpvaW4oXCIsIC5cIil9KVwiXHJcblx0XHRcdFxyXG5cdFx0XHRpZiBwbC5tYXRjaGVzX2V4dFxyXG5cdFx0XHRcdHBhbGV0dGUubG9hZGVkX2FzX2NsYXVzZSA9IGV4dHNfcHJldHR5XHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRwYWxldHRlLmxvYWRlZF9hc19jbGF1c2UgPSBcIiBmb3Igc29tZSByZWFzb25cIlxyXG5cdFx0XHRcclxuXHRcdFx0cGFsZXR0ZS5maW5hbGl6ZSgpXHJcblx0XHRcdGNhbGxiYWNrKG51bGwsIHBhbGV0dGUpXHJcblx0XHRcdHJldHVyblxyXG5cdFxyXG5cdGNhbGxiYWNrKG5ldyBMb2FkaW5nRXJyb3JzKGVycm9ycykpXHJcblx0cmV0dXJuXHJcblxyXG5ub3JtYWxpemVfb3B0aW9ucyA9IChvID0ge30pLT5cclxuXHRpZiB0eXBlb2YgbyBpcyBcInN0cmluZ1wiIG9yIG8gaW5zdGFuY2VvZiBTdHJpbmdcclxuXHRcdG8gPSBmaWxlX3BhdGg6IG9cclxuXHRpZiBGaWxlPyBhbmQgbyBpbnN0YW5jZW9mIEZpbGVcclxuXHRcdG8gPSBmaWxlOiBvXHJcblx0XHJcblx0by5taW5fY29sb3JzID89IG8ubWluQ29sb3JzID8gMlxyXG5cdG8ubWF4X2NvbG9ycyA/PSBvLm1heENvbG9ycyA/IDI1NlxyXG5cdG8uZmlsZV9wYXRoID89IG8uZmlsZVBhdGhcclxuXHRvLmZpbGVfbmFtZSA/PSBvLmZpbGVOYW1lID8gby5mbmFtZSA/IG8uZmlsZT8ubmFtZSA/IChpZiBvLmZpbGVfcGF0aCB0aGVuIHJlcXVpcmUoXCJwYXRoXCIpLmJhc2VuYW1lKG8uZmlsZV9wYXRoKSlcclxuXHRvLmZpbGVfZXh0ID89IG8uZmlsZUV4dCA/IFwiI3tvLmZpbGVfbmFtZX1cIi5zcGxpdChcIi5cIikucG9wKClcclxuXHRvLmZpbGVfZXh0ID0gKFwiI3tvLmZpbGVfZXh0fVwiKS50b0xvd2VyQ2FzZSgpXHJcblx0b1xyXG5cclxuIyBHZXQgcGFsZXR0ZSBmcm9tIGEgZmlsZVxyXG5QYWxldHRlLmxvYWQgPSAobywgY2FsbGJhY2spLT5cclxuXHRpZiBub3Qgb1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiUGFyYW1ldGVycyByZXF1aXJlZDogUGFsZXR0ZS5sb2FkKG9wdGlvbnMsIGZ1bmN0aW9uIGNhbGxiYWNrKGVyciwgcGFsZXR0ZSl7fSlcIlxyXG5cdGlmIG5vdCBjYWxsYmFja1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiQ2FsbGJhY2sgcmVxdWlyZWQ6IFBhbGV0dGUubG9hZChvcHRpb25zLCBmdW5jdGlvbiBjYWxsYmFjayhlcnIsIHBhbGV0dGUpe30pXCJcclxuXHRcclxuXHRvID0gbm9ybWFsaXplX29wdGlvbnMgb1xyXG5cdFxyXG5cdGlmIG8uZGF0YVxyXG5cdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdGVsc2UgaWYgRmlsZT8gYW5kIG8uZmlsZSBpbnN0YW5jZW9mIEZpbGVcclxuXHRcdGZyID0gbmV3IEZpbGVSZWFkZXJcclxuXHRcdGZyLm9ubG9hZCA9IC0+XHJcblx0XHRcdG8uZGF0YSA9IGZyLnJlc3VsdFxyXG5cdFx0XHRsb2FkX3BhbGV0dGUobywgY2FsbGJhY2spXHJcblx0XHRmci5yZWFkQXNCaW5hcnlTdHJpbmcgby5maWxlXHJcblx0ZWxzZSBpZiBvLmZpbGVfcGF0aD9cclxuXHRcdGZzID0gcmVxdWlyZSBcImZzXCJcclxuXHRcdGZzLnJlYWRGaWxlIG8uZmlsZV9wYXRoLCAoZXJyLCBkYXRhKS0+XHJcblx0XHRcdGlmIGVyclxyXG5cdFx0XHRcdGNhbGxiYWNrKGVycilcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdG8uZGF0YSA9IGRhdGEudG9TdHJpbmcoXCJiaW5hcnlcIilcclxuXHRcdFx0XHRsb2FkX3BhbGV0dGUobywgY2FsbGJhY2spXHJcblx0ZWxzZVxyXG5cdFx0Y2FsbGJhY2sobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQuIFRoZSBGaWxlIEFQSSBtYXkgbm90IGJlIHN1cHBvcnRlZC5cIikpICMgdW0uLi5cclxuXHRcdCMgdGhlIEZpbGUgQVBJIHdvdWxkIGJlIHN1cHBvcnRlZCBpZiB5b3UndmUgcGFzc2VkIGEgRmlsZVxyXG5cdFx0IyBUT0RPOiBhIGJldHRlciBlcnJvciBtZXNzYWdlLCBhYm91dCBvcHRpb25zIChub3QpIHBhc3NlZFxyXG5cclxuXHJcbiMgR2V0IGEgcGFsZXR0ZSBmcm9tIGEgZmlsZSBvciBieSBhbnkgbWVhbnMgbmVjZXNzYXJ5XHJcbiMgKGFzIGluIGZhbGwgYmFjayB0byBjb21wbGV0ZWx5IHJhbmRvbSBkYXRhKVxyXG5QYWxldHRlLmdpbW1lID0gKG8sIGNhbGxiYWNrKS0+XHJcblx0byA9IG5vcm1hbGl6ZV9vcHRpb25zIG9cclxuXHRcclxuXHRQYWxldHRlLmxvYWQgbywgKGVyciwgcGFsZXR0ZSktPlxyXG5cdFx0Y2FsbGJhY2sobnVsbCwgcGFsZXR0ZSA/IG5ldyBSYW5kb21QYWxldHRlKVxyXG5cclxuIyBFeHBvcnRzXHJcblAgPSBtb2R1bGUuZXhwb3J0cyA9IFBhbGV0dGVcclxuUC5Db2xvciA9IENvbG9yXHJcblAuUGFsZXR0ZSA9IFBhbGV0dGVcclxuUC5SYW5kb21Db2xvciA9IFJhbmRvbUNvbG9yXHJcblAuUmFuZG9tUGFsZXR0ZSA9IFJhbmRvbVBhbGV0dGVcclxuIyBQLkxvYWRpbmdFcnJvcnMgPSBMb2FkaW5nRXJyb3JzXHJcbiJdfQ==
