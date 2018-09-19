(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AnyPalette = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
    // if not @n_columns
    // 	@guess_dimensions()
    if (!this.parent_palette_without_duplicates) {
      this.with_duplicates = new Palette;
      this.with_duplicates.parent_palette_without_duplicates = this;
      for (i = k = 0, ref = this.length; (0 <= ref ? k < ref : k > ref); i = 0 <= ref ? ++k : --k) {
        this.with_duplicates[i] = this[i];
      }
      this.with_duplicates.n_columns = this.n_columns;
      this.with_duplicates.has_dimensions = this.has_dimensions;
      this.with_duplicates.finalize();
      this.withDuplicates = this.with_duplicates; // TODO: just use camelCase everywhere
      
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

  guess_dimensions() {
    var candidate_dimensions, cd, k, l, len, len1, n_columns, n_rows, ref, results, squarest;
    // TODO: get this working properly and enable
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


// @n_columns = squarest[1]


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

AnyPalette = {Color, Palette, RandomColor, RandomPalette};

// Get palette from a file
// LoadingErrors
AnyPalette.load = function(o, callback) {
  var fr, fs;
  if (!o) {
    throw new Error("Parameters required: AnyPalette.load(options, function callback(err, palette){})");
  }
  if (!callback) {
    throw new Error("Callback required: AnyPalette.load(options, function callback(err, palette){})");
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
AnyPalette.gimme = function(o, callback) {
  o = normalize_options(o);
  return AnyPalette.load(o, function(err, palette) {
    return callback(null, palette != null ? palette : new RandomPalette);
  });
};

// Exports
module.exports = AnyPalette;


},{"./Color":4,"./Palette":5,"./loaders/ColorSchemer":6,"./loaders/GIMP":7,"./loaders/Generic":8,"./loaders/HPL":9,"./loaders/Paint.NET":10,"./loaders/PaintShopPro":11,"./loaders/RIFF":12,"./loaders/StarCraft":13,"./loaders/StarCraftPadded":14,"fs":"fs","path":1}]},{},[15])(15)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsInNyYy9CaW5hcnlSZWFkZXIuY29mZmVlIiwic3JjL0NvbG9yLmNvZmZlZSIsInNyYy9QYWxldHRlLmNvZmZlZSIsInNyYy9sb2FkZXJzL0NvbG9yU2NoZW1lci5jb2ZmZWUiLCJzcmMvbG9hZGVycy9HSU1QLmNvZmZlZSIsInNyYy9sb2FkZXJzL0dlbmVyaWMuY29mZmVlIiwic3JjL2xvYWRlcnMvSFBMLmNvZmZlZSIsInNyYy9sb2FkZXJzL1BhaW50Lk5FVC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9QYWludFNob3BQcm8uY29mZmVlIiwic3JjL2xvYWRlcnMvUklGRi5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TdGFyQ3JhZnQuY29mZmVlIiwic3JjL2xvYWRlcnMvU3RhckNyYWZ0UGFkZGVkLmNvZmZlZSIsInNyYy9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUFBO1dBU0osUUFBQSxDQUFTLElBQUksS0FBSixDQUFVLG9EQUFWLENBQVQsRUFUSTs7QUFoQlksRUE5TGxCOzs7Ozs7O0FBOE5BLFVBQVUsQ0FBQyxLQUFYLEdBQW1CLFFBQUEsQ0FBQyxDQUFELEVBQUksUUFBSixDQUFBO0VBQ2xCLENBQUEsR0FBSSxpQkFBQSxDQUFrQixDQUFsQjtTQUVKLFVBQVUsQ0FBQyxJQUFYLENBQWdCLENBQWhCLEVBQW1CLFFBQUEsQ0FBQyxHQUFELEVBQU0sT0FBTixDQUFBO1dBQ2xCLFFBQUEsQ0FBUyxJQUFULG9CQUFlLFVBQVUsSUFBSSxhQUE3QjtFQURrQixDQUFuQjtBQUhrQixFQTlObkI7OztBQXFPQSxNQUFNLENBQUMsT0FBUCxHQUFpQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8vIC5kaXJuYW1lLCAuYmFzZW5hbWUsIGFuZCAuZXh0bmFtZSBtZXRob2RzIGFyZSBleHRyYWN0ZWQgZnJvbSBOb2RlLmpzIHY4LjExLjEsXG4vLyBiYWNrcG9ydGVkIGFuZCB0cmFuc3BsaXRlZCB3aXRoIEJhYmVsLCB3aXRoIGJhY2t3YXJkcy1jb21wYXQgZml4ZXNcblxuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCBhcnJheSB3aXRoIGRpcmVjdG9yeSBuYW1lcyB0aGVyZVxuLy8gbXVzdCBiZSBubyBzbGFzaGVzLCBlbXB0eSBlbGVtZW50cywgb3IgZGV2aWNlIG5hbWVzIChjOlxcKSBpbiB0aGUgYXJyYXlcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxuLy8gcmVsYXRpdmUgYW5kIGFic29sdXRlIHBhdGhzKVxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkocGFydHMsIGFsbG93QWJvdmVSb290KSB7XG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT09ICcuJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBwYXJ0cy51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cztcbn1cblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgaXNBYnNvbHV0ZSA9IGV4cG9ydHMuaXNBYnNvbHV0ZShwYXRoKSxcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBzdWJzdHIocGF0aCwgLTEpID09PSAnLyc7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cblxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgcCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG5leHBvcnRzLmRlbGltaXRlciA9ICc6JztcblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykgcGF0aCA9IHBhdGggKyAnJztcbiAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSByZXR1cm4gJy4nO1xuICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdCgwKTtcbiAgdmFyIGhhc1Jvb3QgPSBjb2RlID09PSA0NyAvKi8qLztcbiAgdmFyIGVuZCA9IC0xO1xuICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgZm9yICh2YXIgaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAxOyAtLWkpIHtcbiAgICBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICAgIGVuZCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvclxuICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKGVuZCA9PT0gLTEpIHJldHVybiBoYXNSb290ID8gJy8nIDogJy4nO1xuICBpZiAoaGFzUm9vdCAmJiBlbmQgPT09IDEpIHtcbiAgICAvLyByZXR1cm4gJy8vJztcbiAgICAvLyBCYWNrd2FyZHMtY29tcGF0IGZpeDpcbiAgICByZXR1cm4gJy8nO1xuICB9XG4gIHJldHVybiBwYXRoLnNsaWNlKDAsIGVuZCk7XG59O1xuXG5mdW5jdGlvbiBiYXNlbmFtZShwYXRoKSB7XG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHBhdGggPSBwYXRoICsgJyc7XG5cbiAgdmFyIHN0YXJ0ID0gMDtcbiAgdmFyIGVuZCA9IC0xO1xuICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgdmFyIGk7XG5cbiAgZm9yIChpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgIGlmIChwYXRoLmNoYXJDb2RlQXQoaSkgPT09IDQ3IC8qLyovKSB7XG4gICAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAgIC8vIHNlcGFyYXRvcnMgYXQgdGhlIGVuZCBvZiB0aGUgc3RyaW5nLCBzdG9wIG5vd1xuICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICAgIHN0YXJ0ID0gaSArIDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZW5kID09PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgLy8gcGF0aCBjb21wb25lbnRcbiAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgICAgZW5kID0gaSArIDE7XG4gICAgfVxuICB9XG5cbiAgaWYgKGVuZCA9PT0gLTEpIHJldHVybiAnJztcbiAgcmV0dXJuIHBhdGguc2xpY2Uoc3RhcnQsIGVuZCk7XG59XG5cbi8vIFVzZXMgYSBtaXhlZCBhcHByb2FjaCBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHksIGFzIGV4dCBiZWhhdmlvciBjaGFuZ2VkXG4vLyBpbiBuZXcgTm9kZS5qcyB2ZXJzaW9ucywgc28gb25seSBiYXNlbmFtZSgpIGFib3ZlIGlzIGJhY2twb3J0ZWQgaGVyZVxuZXhwb3J0cy5iYXNlbmFtZSA9IGZ1bmN0aW9uIChwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBiYXNlbmFtZShwYXRoKTtcbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHBhdGggPSBwYXRoICsgJyc7XG4gIHZhciBzdGFydERvdCA9IC0xO1xuICB2YXIgc3RhcnRQYXJ0ID0gMDtcbiAgdmFyIGVuZCA9IC0xO1xuICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgLy8gVHJhY2sgdGhlIHN0YXRlIG9mIGNoYXJhY3RlcnMgKGlmIGFueSkgd2Ugc2VlIGJlZm9yZSBvdXIgZmlyc3QgZG90IGFuZFxuICAvLyBhZnRlciBhbnkgcGF0aCBzZXBhcmF0b3Igd2UgZmluZFxuICB2YXIgcHJlRG90U3RhdGUgPSAwO1xuICBmb3IgKHZhciBpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgIHZhciBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICBzdGFydFBhcnQgPSBpICsgMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICBpZiAoZW5kID09PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgLy8gZXh0ZW5zaW9uXG4gICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgIGVuZCA9IGkgKyAxO1xuICAgIH1cbiAgICBpZiAoY29kZSA9PT0gNDYgLyouKi8pIHtcbiAgICAgICAgLy8gSWYgdGhpcyBpcyBvdXIgZmlyc3QgZG90LCBtYXJrIGl0IGFzIHRoZSBzdGFydCBvZiBvdXIgZXh0ZW5zaW9uXG4gICAgICAgIGlmIChzdGFydERvdCA9PT0gLTEpXG4gICAgICAgICAgc3RhcnREb3QgPSBpO1xuICAgICAgICBlbHNlIGlmIChwcmVEb3RTdGF0ZSAhPT0gMSlcbiAgICAgICAgICBwcmVEb3RTdGF0ZSA9IDE7XG4gICAgfSBlbHNlIGlmIChzdGFydERvdCAhPT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgYW5kIG5vbi1wYXRoIHNlcGFyYXRvciBiZWZvcmUgb3VyIGRvdCwgc28gd2Ugc2hvdWxkXG4gICAgICAvLyBoYXZlIGEgZ29vZCBjaGFuY2UgYXQgaGF2aW5nIGEgbm9uLWVtcHR5IGV4dGVuc2lvblxuICAgICAgcHJlRG90U3RhdGUgPSAtMTtcbiAgICB9XG4gIH1cblxuICBpZiAoc3RhcnREb3QgPT09IC0xIHx8IGVuZCA9PT0gLTEgfHxcbiAgICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgY2hhcmFjdGVyIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZG90XG4gICAgICBwcmVEb3RTdGF0ZSA9PT0gMCB8fFxuICAgICAgLy8gVGhlIChyaWdodC1tb3N0KSB0cmltbWVkIHBhdGggY29tcG9uZW50IGlzIGV4YWN0bHkgJy4uJ1xuICAgICAgcHJlRG90U3RhdGUgPT09IDEgJiYgc3RhcnREb3QgPT09IGVuZCAtIDEgJiYgc3RhcnREb3QgPT09IHN0YXJ0UGFydCArIDEpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgcmV0dXJuIHBhdGguc2xpY2Uoc3RhcnREb3QsIGVuZCk7XG59O1xuXG5mdW5jdGlvbiBmaWx0ZXIgKHhzLCBmKSB7XG4gICAgaWYgKHhzLmZpbHRlcikgcmV0dXJuIHhzLmZpbHRlcihmKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZih4c1tpXSwgaSwgeHMpKSByZXMucHVzaCh4c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIFN0cmluZy5wcm90b3R5cGUuc3Vic3RyIC0gbmVnYXRpdmUgaW5kZXggZG9uJ3Qgd29yayBpbiBJRThcbnZhciBzdWJzdHIgPSAnYWInLnN1YnN0cigtMSkgPT09ICdiJ1xuICAgID8gZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikgeyByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKSB9XG4gICAgOiBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7XG4gICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gc3RyLmxlbmd0aCArIHN0YXJ0O1xuICAgICAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKTtcbiAgICB9XG47XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiXHJcbiMjI1xyXG5CaW5hcnlSZWFkZXJcclxuXHJcbk1vZGlmaWVkIGJ5IElzYWlhaCBPZGhuZXJcclxuQFRPRE86IHVzZSBqRGF0YVZpZXcgKyBqQmluYXJ5IGluc3RlYWRcclxuXHJcblJlZmFjdG9yZWQgYnkgVmpldXggPHZqZXV4eEBnbWFpbC5jb20+XHJcbmh0dHA6Ly9ibG9nLnZqZXV4LmNvbS8yMDEwL2phdmFzY3JpcHQvamF2YXNjcmlwdC1iaW5hcnktcmVhZGVyLmh0bWxcclxuXHJcbk9yaWdpbmFsXHJcbisgSm9uYXMgUmFvbmkgU29hcmVzIFNpbHZhXHJcbkAgaHR0cDovL2pzZnJvbWhlbGwuY29tL2NsYXNzZXMvYmluYXJ5LXBhcnNlciBbcmV2LiAjMV1cclxuIyMjXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIEJpbmFyeVJlYWRlclxyXG5cdGNvbnN0cnVjdG9yOiAoZGF0YSktPlxyXG5cdFx0QF9idWZmZXIgPSBkYXRhXHJcblx0XHRAX3BvcyA9IDBcclxuXHJcblx0IyBQdWJsaWMgKGN1c3RvbSlcclxuXHRcclxuXHRyZWFkQnl0ZTogLT5cclxuXHRcdEBfY2hlY2tTaXplKDgpXHJcblx0XHRjaCA9IHRoaXMuX2J1ZmZlci5jaGFyQ29kZUF0KEBfcG9zKSAmIDB4ZmZcclxuXHRcdEBfcG9zICs9IDFcclxuXHRcdGNoICYgMHhmZlxyXG5cdFxyXG5cdHJlYWRVbmljb2RlU3RyaW5nOiAtPlxyXG5cdFx0bGVuZ3RoID0gQHJlYWRVSW50MTYoKVxyXG5cdFx0IyBjb25zb2xlLmxvZyB7bGVuZ3RofVxyXG5cdFx0QF9jaGVja1NpemUobGVuZ3RoICogMTYpXHJcblx0XHRzdHIgPSBcIlwiXHJcblx0XHRmb3IgaSBpbiBbMC4ubGVuZ3RoXVxyXG5cdFx0XHRzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShAX2J1ZmZlci5zdWJzdHIoQF9wb3MsIDEpIHwgKEBfYnVmZmVyLnN1YnN0cihAX3BvcysxLCAxKSA8PCA4KSlcclxuXHRcdFx0QF9wb3MgKz0gMlxyXG5cdFx0c3RyXHJcblx0XHJcblx0IyBQdWJsaWNcclxuXHRcclxuXHRyZWFkSW50ODogLT4gQF9kZWNvZGVJbnQoOCwgdHJ1ZSlcclxuXHRyZWFkVUludDg6IC0+IEBfZGVjb2RlSW50KDgsIGZhbHNlKVxyXG5cdHJlYWRJbnQxNjogLT4gQF9kZWNvZGVJbnQoMTYsIHRydWUpXHJcblx0cmVhZFVJbnQxNjogLT4gQF9kZWNvZGVJbnQoMTYsIGZhbHNlKVxyXG5cdHJlYWRJbnQzMjogLT4gQF9kZWNvZGVJbnQoMzIsIHRydWUpXHJcblx0cmVhZFVJbnQzMjogLT4gQF9kZWNvZGVJbnQoMzIsIGZhbHNlKVxyXG5cclxuXHRyZWFkRmxvYXQ6IC0+IEBfZGVjb2RlRmxvYXQoMjMsIDgpXHJcblx0cmVhZERvdWJsZTogLT4gQF9kZWNvZGVGbG9hdCg1MiwgMTEpXHJcblx0XHJcblx0cmVhZENoYXI6IC0+IEByZWFkU3RyaW5nKDEpXHJcblx0cmVhZFN0cmluZzogKGxlbmd0aCktPlxyXG5cdFx0QF9jaGVja1NpemUobGVuZ3RoICogOClcclxuXHRcdHJlc3VsdCA9IEBfYnVmZmVyLnN1YnN0cihAX3BvcywgbGVuZ3RoKVxyXG5cdFx0QF9wb3MgKz0gbGVuZ3RoXHJcblx0XHRyZXN1bHRcclxuXHJcblx0c2VlazogKHBvcyktPlxyXG5cdFx0QF9wb3MgPSBwb3NcclxuXHRcdEBfY2hlY2tTaXplKDApXHJcblx0XHJcblx0Z2V0UG9zaXRpb246IC0+IEBfcG9zXHJcblx0XHJcblx0Z2V0U2l6ZTogLT4gQF9idWZmZXIubGVuZ3RoXHJcblx0XHJcblxyXG5cclxuXHQjIFByaXZhdGVcclxuXHRcclxuXHRfZGVjb2RlRmxvYXQ6IGBmdW5jdGlvbihwcmVjaXNpb25CaXRzLCBleHBvbmVudEJpdHMpe1xyXG5cdFx0dmFyIGxlbmd0aCA9IHByZWNpc2lvbkJpdHMgKyBleHBvbmVudEJpdHMgKyAxO1xyXG5cdFx0dmFyIHNpemUgPSBsZW5ndGggPj4gMztcclxuXHRcdHRoaXMuX2NoZWNrU2l6ZShsZW5ndGgpO1xyXG5cclxuXHRcdHZhciBiaWFzID0gTWF0aC5wb3coMiwgZXhwb25lbnRCaXRzIC0gMSkgLSAxO1xyXG5cdFx0dmFyIHNpZ25hbCA9IHRoaXMuX3JlYWRCaXRzKHByZWNpc2lvbkJpdHMgKyBleHBvbmVudEJpdHMsIDEsIHNpemUpO1xyXG5cdFx0dmFyIGV4cG9uZW50ID0gdGhpcy5fcmVhZEJpdHMocHJlY2lzaW9uQml0cywgZXhwb25lbnRCaXRzLCBzaXplKTtcclxuXHRcdHZhciBzaWduaWZpY2FuZCA9IDA7XHJcblx0XHR2YXIgZGl2aXNvciA9IDI7XHJcblx0XHR2YXIgY3VyQnl0ZSA9IDA7IC8vbGVuZ3RoICsgKC1wcmVjaXNpb25CaXRzID4+IDMpIC0gMTtcclxuXHRcdGRvIHtcclxuXHRcdFx0dmFyIGJ5dGVWYWx1ZSA9IHRoaXMuX3JlYWRCeXRlKCsrY3VyQnl0ZSwgc2l6ZSk7XHJcblx0XHRcdHZhciBzdGFydEJpdCA9IHByZWNpc2lvbkJpdHMgJSA4IHx8IDg7XHJcblx0XHRcdHZhciBtYXNrID0gMSA8PCBzdGFydEJpdDtcclxuXHRcdFx0d2hpbGUgKG1hc2sgPj49IDEpIHtcclxuXHRcdFx0XHRpZiAoYnl0ZVZhbHVlICYgbWFzaykge1xyXG5cdFx0XHRcdFx0c2lnbmlmaWNhbmQgKz0gMSAvIGRpdmlzb3I7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRpdmlzb3IgKj0gMjtcclxuXHRcdFx0fVxyXG5cdFx0fSB3aGlsZSAocHJlY2lzaW9uQml0cyAtPSBzdGFydEJpdCk7XHJcblxyXG5cdFx0dGhpcy5fcG9zICs9IHNpemU7XHJcblxyXG5cdFx0cmV0dXJuIGV4cG9uZW50ID09IChiaWFzIDw8IDEpICsgMSA/IHNpZ25pZmljYW5kID8gTmFOIDogc2lnbmFsID8gLUluZmluaXR5IDogK0luZmluaXR5XHJcblx0XHRcdDogKDEgKyBzaWduYWwgKiAtMikgKiAoZXhwb25lbnQgfHwgc2lnbmlmaWNhbmQgPyAhZXhwb25lbnQgPyBNYXRoLnBvdygyLCAtYmlhcyArIDEpICogc2lnbmlmaWNhbmRcclxuXHRcdFx0OiBNYXRoLnBvdygyLCBleHBvbmVudCAtIGJpYXMpICogKDEgKyBzaWduaWZpY2FuZCkgOiAwKTtcclxuXHR9YFxyXG5cclxuXHRfZGVjb2RlSW50OiBgZnVuY3Rpb24oYml0cywgc2lnbmVkKXtcclxuXHRcdHZhciB4ID0gdGhpcy5fcmVhZEJpdHMoMCwgYml0cywgYml0cyAvIDgpLCBtYXggPSBNYXRoLnBvdygyLCBiaXRzKTtcclxuXHRcdHZhciByZXN1bHQgPSBzaWduZWQgJiYgeCA+PSBtYXggLyAyID8geCAtIG1heCA6IHg7XHJcblxyXG5cdFx0dGhpcy5fcG9zICs9IGJpdHMgLyA4O1xyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9YFxyXG5cclxuXHQjc2hsIGZpeDogSGVucmkgVG9yZ2VtYW5lIH4xOTk2IChjb21wcmVzc2VkIGJ5IEpvbmFzIFJhb25pKVxyXG5cdF9zaGw6IGBmdW5jdGlvbiAoYSwgYil7XHJcblx0XHRmb3IgKCsrYjsgLS1iOyBhID0gKChhICU9IDB4N2ZmZmZmZmYgKyAxKSAmIDB4NDAwMDAwMDApID09IDB4NDAwMDAwMDAgPyBhICogMiA6IChhIC0gMHg0MDAwMDAwMCkgKiAyICsgMHg3ZmZmZmZmZiArIDEpO1xyXG5cdFx0cmV0dXJuIGE7XHJcblx0fWBcclxuXHRcclxuXHRfcmVhZEJ5dGU6IGBmdW5jdGlvbiAoaSwgc2l6ZSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2J1ZmZlci5jaGFyQ29kZUF0KHRoaXMuX3BvcyArIHNpemUgLSBpIC0gMSkgJiAweGZmO1xyXG5cdH1gXHJcblxyXG5cdF9yZWFkQml0czogYGZ1bmN0aW9uIChzdGFydCwgbGVuZ3RoLCBzaXplKSB7XHJcblx0XHR2YXIgb2Zmc2V0TGVmdCA9IChzdGFydCArIGxlbmd0aCkgJSA4O1xyXG5cdFx0dmFyIG9mZnNldFJpZ2h0ID0gc3RhcnQgJSA4O1xyXG5cdFx0dmFyIGN1ckJ5dGUgPSBzaXplIC0gKHN0YXJ0ID4+IDMpIC0gMTtcclxuXHRcdHZhciBsYXN0Qnl0ZSA9IHNpemUgKyAoLShzdGFydCArIGxlbmd0aCkgPj4gMyk7XHJcblx0XHR2YXIgZGlmZiA9IGN1ckJ5dGUgLSBsYXN0Qnl0ZTtcclxuXHJcblx0XHR2YXIgc3VtID0gKHRoaXMuX3JlYWRCeXRlKGN1ckJ5dGUsIHNpemUpID4+IG9mZnNldFJpZ2h0KSAmICgoMSA8PCAoZGlmZiA/IDggLSBvZmZzZXRSaWdodCA6IGxlbmd0aCkpIC0gMSk7XHJcblxyXG5cdFx0aWYgKGRpZmYgJiYgb2Zmc2V0TGVmdCkge1xyXG5cdFx0XHRzdW0gKz0gKHRoaXMuX3JlYWRCeXRlKGxhc3RCeXRlKyssIHNpemUpICYgKCgxIDw8IG9mZnNldExlZnQpIC0gMSkpIDw8IChkaWZmLS0gPDwgMykgLSBvZmZzZXRSaWdodDsgXHJcblx0XHR9XHJcblxyXG5cdFx0d2hpbGUgKGRpZmYpIHtcclxuXHRcdFx0c3VtICs9IHRoaXMuX3NobCh0aGlzLl9yZWFkQnl0ZShsYXN0Qnl0ZSsrLCBzaXplKSwgKGRpZmYtLSA8PCAzKSAtIG9mZnNldFJpZ2h0KTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gc3VtO1xyXG5cdH1gXHJcblxyXG5cdF9jaGVja1NpemU6IChuZWVkZWRCaXRzKS0+XHJcblx0XHRpZiBAX3BvcyArIE1hdGguY2VpbChuZWVkZWRCaXRzIC8gOCkgPiBAX2J1ZmZlci5sZW5ndGhcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiSW5kZXggb3V0IG9mIGJvdW5kXCJcclxuXHJcbiIsIlxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIENvbG9yXHJcblx0Y29uc3RydWN0b3I6IChvcHRpb25zKS0+XHJcblx0XHQjIEBUT0RPOiBkb24ndCBhc3NpZ24ge0ByLCBAZywgQGIsIEBoLCBAcywgQHYsIEBsfSByaWdodCBhd2F5XHJcblx0XHQjIChtb3JlIG9mIGEgdG8tZG9uJ3QsIHJlYWxseSlcclxuXHRcdHtcclxuXHRcdFx0QHIsIEBnLCBAYixcclxuXHRcdFx0QGgsIEBzLCBAdiwgQGwsXHJcblx0XHRcdGMsIG0sIHksIGssXHJcblx0XHRcdEBuYW1lXHJcblx0XHR9ID0gb3B0aW9uc1xyXG5cclxuXHRcdGlmIEByPyBhbmQgQGc/IGFuZCBAYj9cclxuXHRcdFx0IyBSZWQgR3JlZW4gQmx1ZVxyXG5cdFx0XHQjIChubyBjb252ZXJzaW9ucyBuZWVkZWQgaGVyZSlcclxuXHRcdGVsc2UgaWYgQGg/IGFuZCBAcz9cclxuXHRcdFx0IyBDeWxpbmRyaWNhbCBDb2xvciBTcGFjZVxyXG5cdFx0XHRpZiBAdj9cclxuXHRcdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIFZhbHVlXHJcblx0XHRcdFx0QGwgPSAoMiAtIEBzIC8gMTAwKSAqIEB2IC8gMlxyXG5cdFx0XHRcdEBzID0gQHMgKiBAdiAvIChpZiBAbCA8IDUwIHRoZW4gQGwgKiAyIGVsc2UgMjAwIC0gQGwgKiAyKVxyXG5cdFx0XHRcdEBzID0gMCBpZiBpc05hTiBAc1xyXG5cdFx0XHRlbHNlIGlmIEBsP1xyXG5cdFx0XHRcdCMgSHVlIFNhdHVyYXRpb24gTGlnaHRuZXNzXHJcblx0XHRcdFx0IyAobm8gY29udmVyc2lvbnMgbmVlZGVkIGhlcmUpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJIdWUsIHNhdHVyYXRpb24sIGFuZC4uLj8gKGVpdGhlciBsaWdodG5lc3Mgb3IgdmFsdWUpXCJcclxuXHRcdGVsc2UgaWYgYz8gYW5kIG0/IGFuZCB5PyBhbmQgaz9cclxuXHRcdFx0IyBDeWFuIE1hZ2VudGEgWWVsbG93IGJsYWNLXHJcblx0XHRcdCMgVU5URVNURURcclxuXHRcdFx0YyAvPSAxMDBcclxuXHRcdFx0bSAvPSAxMDBcclxuXHRcdFx0eSAvPSAxMDBcclxuXHRcdFx0ayAvPSAxMDBcclxuXHRcdFx0XHJcblx0XHRcdEByID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCBjICogKDEgLSBrKSArIGspKVxyXG5cdFx0XHRAZyA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgbSAqICgxIC0gaykgKyBrKSlcclxuXHRcdFx0QGIgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIHkgKiAoMSAtIGspICsgaykpXHJcblx0XHRlbHNlXHJcblx0XHRcdCMgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURURcclxuXHRcdFx0aWYgQGw/IGFuZCBAYT8gYW5kIEBiP1xyXG5cdFx0XHRcdHdoaXRlID1cclxuXHRcdFx0XHRcdHg6IDk1LjA0N1xyXG5cdFx0XHRcdFx0eTogMTAwLjAwMFxyXG5cdFx0XHRcdFx0ejogMTA4Ljg4M1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHh5eiA9IFxyXG5cdFx0XHRcdFx0eTogKHJhdy5sICsgMTYpIC8gMTE2XHJcblx0XHRcdFx0XHR4OiByYXcuYSAvIDUwMCArIHh5ei55XHJcblx0XHRcdFx0XHR6OiB4eXoueSAtIHJhdy5iIC8gMjAwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Zm9yIF8gaW4gXCJ4eXpcIlxyXG5cdFx0XHRcdFx0cG93ZWQgPSBNYXRoLnBvdyh4eXpbX10sIDMpXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHBvd2VkID4gMC4wMDg4NTZcclxuXHRcdFx0XHRcdFx0eHl6W19dID0gcG93ZWRcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0eHl6W19dID0gKHh5eltfXSAtIDE2IC8gMTE2KSAvIDcuNzg3XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdCN4eXpbX10gPSBfcm91bmQoeHl6W19dICogd2hpdGVbX10pXHJcblx0XHRcdFx0XHJcblx0XHRcdCMgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURURcclxuXHRcdFx0aWYgQHg/IGFuZCBAeT8gYW5kIEB6P1xyXG5cdFx0XHRcdHh5eiA9XHJcblx0XHRcdFx0XHR4OiByYXcueCAvIDEwMFxyXG5cdFx0XHRcdFx0eTogcmF3LnkgLyAxMDBcclxuXHRcdFx0XHRcdHo6IHJhdy56IC8gMTAwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0cmdiID1cclxuXHRcdFx0XHRcdHI6IHh5ei54ICogMy4yNDA2ICsgeHl6LnkgKiAtMS41MzcyICsgeHl6LnogKiAtMC40OTg2XHJcblx0XHRcdFx0XHRnOiB4eXoueCAqIC0wLjk2ODkgKyB4eXoueSAqIDEuODc1OCArIHh5ei56ICogMC4wNDE1XHJcblx0XHRcdFx0XHRiOiB4eXoueCAqIDAuMDU1NyArIHh5ei55ICogLTAuMjA0MCArIHh5ei56ICogMS4wNTcwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Zm9yIF8gaW4gXCJyZ2JcIlxyXG5cdFx0XHRcdFx0I3JnYltfXSA9IF9yb3VuZChyZ2JbX10pXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHJnYltfXSA8IDBcclxuXHRcdFx0XHRcdFx0cmdiW19dID0gMFxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiByZ2JbX10gPiAwLjAwMzEzMDhcclxuXHRcdFx0XHRcdFx0cmdiW19dID0gMS4wNTUgKiBNYXRoLnBvdyhyZ2JbX10sICgxIC8gMi40KSkgLSAwLjA1NVxyXG5cdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gKj0gMTIuOTJcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHQjcmdiW19dID0gTWF0aC5yb3VuZChyZ2JbX10gKiAyNTUpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJDb2xvciBjb25zdHJ1Y3RvciBtdXN0IGJlIGNhbGxlZCB3aXRoIHtyLGcsYn0gb3Ige2gscyx2fSBvciB7aCxzLGx9IG9yIHtjLG0seSxrfSBvciB7eCx5LHp9IG9yIHtsLGEsYn0sXHJcblx0XHRcdFx0XHQje1xyXG5cdFx0XHRcdFx0XHR0cnlcclxuXHRcdFx0XHRcdFx0XHRcImdvdCAje0pTT04uc3RyaW5naWZ5KG9wdGlvbnMpfVwiXHJcblx0XHRcdFx0XHRcdGNhdGNoIGVcclxuXHRcdFx0XHRcdFx0XHRcImdvdCBzb21ldGhpbmcgdGhhdCBjb3VsZG4ndCBiZSBkaXNwbGF5ZWQgd2l0aCBKU09OLnN0cmluZ2lmeSBmb3IgdGhpcyBlcnJvciBtZXNzYWdlXCJcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcIlxyXG5cdFx0XHJcblx0XHJcblx0dG9TdHJpbmc6IC0+XHJcblx0XHRpZiBAcj9cclxuXHRcdFx0IyBSZWQgR3JlZW4gQmx1ZVxyXG5cdFx0XHRpZiBAYT8gIyBBbHBoYVxyXG5cdFx0XHRcdFwicmdiYSgje0ByfSwgI3tAZ30sICN7QGJ9LCAje0BhfSlcIlxyXG5cdFx0XHRlbHNlICMgT3BhcXVlXHJcblx0XHRcdFx0XCJyZ2IoI3tAcn0sICN7QGd9LCAje0BifSlcIlxyXG5cdFx0ZWxzZSBpZiBAaD9cclxuXHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBMaWdodG5lc3NcclxuXHRcdFx0IyAoQXNzdW1lIGg6MC0zNjAsIHM6MC0xMDAsIGw6MC0xMDApXHJcblx0XHRcdGlmIEBhPyAjIEFscGhhXHJcblx0XHRcdFx0XCJoc2xhKCN7QGh9LCAje0BzfSUsICN7QGx9JSwgI3tAYX0pXCJcclxuXHRcdFx0ZWxzZSAjIE9wYXF1ZVxyXG5cdFx0XHRcdFwiaHNsKCN7QGh9LCAje0BzfSUsICN7QGx9JSlcIlxyXG5cdFxyXG5cdGlzOiAoY29sb3IpLT5cclxuXHRcdCMgY29tcGFyZSBhcyBzdHJpbmdzXHJcblx0XHRcIiN7QH1cIiBpcyBcIiN7Y29sb3J9XCJcclxuIiwiXHJcbkNvbG9yID0gcmVxdWlyZSBcIi4vQ29sb3JcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG5jbGFzcyBQYWxldHRlIGV4dGVuZHMgQXJyYXlcclxuXHRcclxuXHRjb25zdHJ1Y3RvcjogKGFyZ3MuLi4pLT5cclxuXHRcdHN1cGVyKGFyZ3MuLi4pXHJcblx0XHJcblx0YWRkOiAobyktPlxyXG5cdFx0bmV3X2NvbG9yID0gbmV3IENvbG9yKG8pXHJcblx0XHRAcHVzaCBuZXdfY29sb3JcclxuXHRcclxuXHRmaW5hbGl6ZTogLT5cclxuXHRcdCMgaWYgbm90IEBuX2NvbHVtbnNcclxuXHRcdCMgXHRAZ3Vlc3NfZGltZW5zaW9ucygpXHJcblx0XHR1bmxlc3MgQHBhcmVudF9wYWxldHRlX3dpdGhvdXRfZHVwbGljYXRlc1xyXG5cdFx0XHRAd2l0aF9kdXBsaWNhdGVzID0gbmV3IFBhbGV0dGVcclxuXHRcdFx0QHdpdGhfZHVwbGljYXRlcy5wYXJlbnRfcGFsZXR0ZV93aXRob3V0X2R1cGxpY2F0ZXMgPSBAXHJcblx0XHRcdEB3aXRoX2R1cGxpY2F0ZXNbaV0gPSBAW2ldIGZvciBpIGluIFswLi4uQGxlbmd0aF1cclxuXHRcdFx0QHdpdGhfZHVwbGljYXRlcy5uX2NvbHVtbnMgPSBAbl9jb2x1bW5zXHJcblx0XHRcdEB3aXRoX2R1cGxpY2F0ZXMuaGFzX2RpbWVuc2lvbnMgPSBAaGFzX2RpbWVuc2lvbnNcclxuXHRcdFx0QHdpdGhfZHVwbGljYXRlcy5maW5hbGl6ZSgpXHJcblx0XHRcdEB3aXRoRHVwbGljYXRlcyA9IEB3aXRoX2R1cGxpY2F0ZXMgIyBUT0RPOiBqdXN0IHVzZSBjYW1lbENhc2UgZXZlcnl3aGVyZVxyXG5cclxuXHRcdFx0IyBpbi1wbGFjZSB1bmlxdWlmeVxyXG5cdFx0XHRpID0gMFxyXG5cdFx0XHR3aGlsZSBpIDwgQGxlbmd0aFxyXG5cdFx0XHRcdGlfY29sb3IgPSBAW2ldXHJcblx0XHRcdFx0aiA9IGkgKyAxXHJcblx0XHRcdFx0d2hpbGUgaiA8IEBsZW5ndGhcclxuXHRcdFx0XHRcdGpfY29sb3IgPSBAW2pdXHJcblx0XHRcdFx0XHRpZiBpX2NvbG9yLmlzIGpfY29sb3JcclxuXHRcdFx0XHRcdFx0QC5zcGxpY2UoaiwgMSlcclxuXHRcdFx0XHRcdFx0aiAtPSAxXHJcblx0XHRcdFx0XHRqICs9IDFcclxuXHRcdFx0XHRpICs9IDFcclxuXHJcblx0Z3Vlc3NfZGltZW5zaW9uczogLT5cclxuXHRcdCMgVE9ETzogZ2V0IHRoaXMgd29ya2luZyBwcm9wZXJseSBhbmQgZW5hYmxlXHJcblxyXG5cdFx0bGVuID0gQGxlbmd0aFxyXG5cdFx0Y2FuZGlkYXRlX2RpbWVuc2lvbnMgPSBbXVxyXG5cdFx0Zm9yIG5fY29sdW1ucyBpbiBbMC4ubGVuXVxyXG5cdFx0XHRuX3Jvd3MgPSBsZW4gLyBuX2NvbHVtbnNcclxuXHRcdFx0aWYgbl9yb3dzIGlzIE1hdGgucm91bmQgbl9yb3dzXHJcblx0XHRcdFx0Y2FuZGlkYXRlX2RpbWVuc2lvbnMucHVzaCBbbl9yb3dzLCBuX2NvbHVtbnNdXHJcblx0XHRcclxuXHRcdHNxdWFyZXN0ID0gWzAsIDM0OTUwOTNdXHJcblx0XHRmb3IgY2QgaW4gY2FuZGlkYXRlX2RpbWVuc2lvbnNcclxuXHRcdFx0aWYgTWF0aC5hYnMoY2RbMF0gLSBjZFsxXSkgPCBNYXRoLmFicyhzcXVhcmVzdFswXSAtIHNxdWFyZXN0WzFdKVxyXG5cdFx0XHRcdHNxdWFyZXN0ID0gY2RcclxuXHRcdFxyXG5cdFx0IyBAbl9jb2x1bW5zID0gc3F1YXJlc3RbMV1cclxuIiwiXHJcbiMgTG9hZCBhIENvbG9yU2NoZW1lciBwYWxldHRlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0dmVyc2lvbiA9IGJyLnJlYWRVSW50MTYoKSAjIG9yIHNvbWV0aGluZ1xyXG5cdGxlbmd0aCA9IGJyLnJlYWRVSW50MTYoKVxyXG5cdGkgPSAwXHJcblx0d2hpbGUgaSA8IGxlbmd0aFxyXG5cdFx0YnIuc2Vlayg4ICsgaSAqIDI2KVxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdGkgKz0gMVxyXG5cclxuXHRwYWxldHRlXHJcblxyXG4iLCJcclxuIyBMb2FkIGEgR0lNUCBwYWxldHRlXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IFwiR0lNUCBQYWxldHRlXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhIEdJTVAgUGFsZXR0ZVwiXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRpID0gMVxyXG5cdHdoaWxlIChpICs9IDEpIDwgbGluZXMubGVuZ3RoXHJcblx0XHRsaW5lID0gbGluZXNbaV1cclxuXHRcdFxyXG5cdFx0aWYgbGluZS5tYXRjaCgvXiMvKSBvciBsaW5lIGlzIFwiXCIgdGhlbiBjb250aW51ZVxyXG5cdFx0XHJcblx0XHRtID0gbGluZS5tYXRjaCgvTmFtZTpcXHMqKC4qKS8pXHJcblx0XHRpZiBtXHJcblx0XHRcdHBhbGV0dGUubmFtZSA9IG1bMV1cclxuXHRcdFx0Y29udGludWVcclxuXHRcdG0gPSBsaW5lLm1hdGNoKC9Db2x1bW5zOlxccyooLiopLylcclxuXHRcdGlmIG1cclxuXHRcdFx0cGFsZXR0ZS5uX2NvbHVtbnMgPSBOdW1iZXIobVsxXSlcclxuXHRcdFx0cGFsZXR0ZS5oYXNfZGltZW5zaW9ucyA9IHllc1xyXG5cdFx0XHRjb250aW51ZVxyXG5cdFx0XHJcblx0XHRyX2dfYl9uYW1lID0gbGluZS5tYXRjaCgvXlxccyooWzAtOV0rKVxccysoWzAtOV0rKVxccysoWzAtOV0rKSg/OlxccysoLiopKT8kLylcclxuXHRcdGlmIG5vdCByX2dfYl9uYW1lXHJcblx0XHRcdHRocm93IG5ldyBFcnJvciBcIkxpbmUgI3tpfSBkb2Vzbid0IG1hdGNoIHBhdHRlcm4gcl9nX2JfbmFtZVwiICMgVE9ETzogYmV0dGVyIG1lc3NhZ2VcclxuXHRcdFxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogcl9nX2JfbmFtZVsxXVxyXG5cdFx0XHRnOiByX2dfYl9uYW1lWzJdXHJcblx0XHRcdGI6IHJfZ19iX25hbWVbM11cclxuXHRcdFx0bmFtZTogcl9nX2JfbmFtZVs0XVxyXG5cdFx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBEZXRlY3QgQ1NTIGNvbG9ycyAoZXhjZXB0IG5hbWVkIGNvbG9ycylcclxuXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlcyA9IFtcclxuXHRcdHBhbGV0dGVfeFJSR0dCQiA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfeFJHQiA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfcmdiID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9oc2wgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX2hzbGEgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX3JnYmEgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XVxyXG5cdFxyXG5cdGhleCA9ICh4KS0+IHBhcnNlSW50KHgsIDE2KVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdFxcIyAjIGhhc2h0YWcgIyAjL1xyXG5cdFx0KFswLTlBLUZdezJ9KT8gIyBhbHBoYVxyXG5cdFx0KFswLTlBLUZdezN9KSAjIHRocmVlIGRpZ2l0cyAoI0EwQylcclxuXHRcdChbMC05QS1GXXszfSk/ICMgc2l4IGRpZ2l0cyAoI0FBMDBDQylcclxuXHRcdFxyXG5cdFx0KD8hWzAtOUEtRl0pICMgKGFuZCBubyBtb3JlISlcclxuXHQvLy9naW0sIChtLCAkMCwgJDEsICQyKS0+XHJcblx0XHRcclxuXHRcdGFscGhhID0gaGV4ICQwXHJcblx0XHRcclxuXHRcdGlmICQyXHJcblx0XHRcdHhSR0IgPSAkMSArICQyXHJcblx0XHRcdHBhbGV0dGVfeFJSR0dCQi5hZGRcclxuXHRcdFx0XHRyOiBoZXggeFJHQlswXSArIHhSR0JbMV1cclxuXHRcdFx0XHRnOiBoZXggeFJHQlsyXSArIHhSR0JbM11cclxuXHRcdFx0XHRiOiBoZXggeFJHQls0XSArIHhSR0JbNV1cclxuXHRcdFx0XHRhOiBhbHBoYVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHR4UkdCID0gJDFcclxuXHRcdFx0cGFsZXR0ZV94UkdCLmFkZFxyXG5cdFx0XHRcdHI6IGhleCB4UkdCWzBdICsgeFJHQlswXVxyXG5cdFx0XHRcdGc6IGhleCB4UkdCWzFdICsgeFJHQlsxXVxyXG5cdFx0XHRcdGI6IGhleCB4UkdCWzJdICsgeFJHQlsyXVxyXG5cdFx0XHRcdGE6IGFscGhhXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0cmdiXFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgcmVkXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGdyZWVuXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGJsdWVcclxuXHRcdFx0XFxzKlxyXG5cdFx0XFwpXHJcblx0Ly8vZ2ltLCAobSktPlxyXG5cdFx0cGFsZXR0ZV9yZ2IuYWRkXHJcblx0XHRcdHI6IE51bWJlciBtWzFdXHJcblx0XHRcdGc6IE51bWJlciBtWzJdXHJcblx0XHRcdGI6IE51bWJlciBtWzNdXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0cmdiYVxcKFxyXG5cdFx0XHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIHJlZFxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBncmVlblxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBibHVlXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9fDBcXC5bMC05XSspICMgYWxwaGFcclxuXHRcdFx0XFxzKlxyXG5cdFx0XFwpXHJcblx0Ly8vZ2ltLCAobSktPlxyXG5cdFx0cGFsZXR0ZV9yZ2IuYWRkXHJcblx0XHRcdHI6IE51bWJlciBtWzFdXHJcblx0XHRcdGc6IE51bWJlciBtWzJdXHJcblx0XHRcdGI6IE51bWJlciBtWzNdXHJcblx0XHRcdGE6IE51bWJlciBtWzRdXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0aHNsXFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgaHVlXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIHNhdHVyYXRpb25cclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgdmFsdWVcclxuXHRcdFx0XFxzKlxyXG5cdFx0XFwpXHJcblx0Ly8vZ2ltLCAobSktPlxyXG5cdFx0cGFsZXR0ZV9yZ2IuYWRkXHJcblx0XHRcdGg6IE51bWJlciBtWzFdXHJcblx0XHRcdHM6IE51bWJlciBtWzJdXHJcblx0XHRcdGw6IE51bWJlciBtWzNdXHJcblx0XHJcblx0bW9zdF9jb2xvcnMgPSBbXVxyXG5cdGZvciBwYWxldHRlIGluIHBhbGV0dGVzXHJcblx0XHRpZiBwYWxldHRlLmxlbmd0aCA+PSBtb3N0X2NvbG9ycy5sZW5ndGhcclxuXHRcdFx0bW9zdF9jb2xvcnMgPSBwYWxldHRlXHJcblx0XHJcblx0biA9IG1vc3RfY29sb3JzLmxlbmd0aFxyXG5cdGlmIG4gPCA0XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoW1xyXG5cdFx0XHRcIk5vIGNvbG9ycyBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBvbmUgY29sb3IgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgYSBjb3VwbGUgY29sb3JzIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IGEgZmV3IGNvbG9ycyBmb3VuZFwiXHJcblx0XHRdW25dICsgXCIgKCN7bn0pXCIpXHJcblx0XHJcblx0bW9zdF9jb2xvcnNcclxuIiwiXHJcbiMgV2hhdCBkb2VzIEhQTCBzdGFuZCBmb3I/XHJcbiMgSG93ZHksIFBhbGV0dGUgTG92ZXJzIVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBcIlBhbGV0dGVcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiTm90IGFuIEhQTCBwYWxldHRlXCJcclxuXHRpZiBub3QgbGluZXNbMV0ubWF0Y2ggL1ZlcnNpb24gWzM0XVxcLjAvXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbnN1cHBvcnRlZCBIUEwgdmVyc2lvblwiXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRcclxuXHRmb3IgbGluZSwgaSBpbiBsaW5lc1xyXG5cdFx0aWYgbGluZS5tYXRjaCAvLisgLiogLisvXHJcblx0XHRcdHJnYiA9IGxpbmUuc3BsaXQoXCIgXCIpXHJcblx0XHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdFx0cjogcmdiWzBdXHJcblx0XHRcdFx0ZzogcmdiWzFdXHJcblx0XHRcdFx0YjogcmdiWzJdXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBMb2FkIGEgUGFpbnQuTkVUIHBhbGV0dGUgZmlsZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdFxyXG5cdGhleCA9ICh4KS0+IHBhcnNlSW50KHgsIDE2KVxyXG5cdFxyXG5cdGZvciBsaW5lIGluIGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdFx0bSA9IGxpbmUubWF0Y2goL14oWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pJC9pKVxyXG5cdFx0aWYgbSB0aGVuIHBhbGV0dGUuYWRkXHJcblx0XHRcdGE6IGhleCBtWzFdXHJcblx0XHRcdHI6IGhleCBtWzJdXHJcblx0XHRcdGc6IGhleCBtWzNdXHJcblx0XHRcdGI6IGhleCBtWzRdXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBMb2FkIGEgSkFTQyBQQUwgZmlsZSAoUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZSBmaWxlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdGlmIGxpbmVzWzBdIGlzbnQgXCJKQVNDLVBBTFwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYSBKQVNDLVBBTFwiXHJcblx0aWYgbGluZXNbMV0gaXNudCBcIjAxMDBcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiVW5rbm93biBKQVNDLVBBTCB2ZXJzaW9uXCJcclxuXHRpZiBsaW5lc1syXSBpc250IFwiMjU2XCJcclxuXHRcdFwidGhhdCdzIG9rXCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdCNuX2NvbG9ycyA9IE51bWJlcihsaW5lc1syXSlcclxuXHRcclxuXHRmb3IgbGluZSwgaSBpbiBsaW5lc1xyXG5cdFx0aWYgbGluZSBpc250IFwiXCIgYW5kIGkgPiAyXHJcblx0XHRcdHJnYiA9IGxpbmUuc3BsaXQoXCIgXCIpXHJcblx0XHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdFx0cjogcmdiWzBdXHJcblx0XHRcdFx0ZzogcmdiWzFdXHJcblx0XHRcdFx0YjogcmdiWzJdXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBMb2FkIGEgUmVzb3VyY2UgSW50ZXJjaGFuZ2UgRmlsZSBGb3JtYXQgUEFMIGZpbGVcclxuXHJcbiMgcG9ydGVkIGZyb20gQyMgY29kZSBhdCBodHRwczovL3dvcm1zMmQuaW5mby9QYWxldHRlX2ZpbGVcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0IyBSSUZGIGhlYWRlclxyXG5cdHJpZmYgPSBici5yZWFkU3RyaW5nKDQpICMgXCJSSUZGXCJcclxuXHRkYXRhU2l6ZSA9IGJyLnJlYWRVSW50MzIoKVxyXG5cdHR5cGUgPSBici5yZWFkU3RyaW5nKDQpICMgXCJQQUwgXCJcclxuXHRcclxuXHRpZiByaWZmIGlzbnQgXCJSSUZGXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlJJRkYgaGVhZGVyIG5vdCBmb3VuZDsgbm90IGEgUklGRiBQQUwgZmlsZVwiXHJcblx0XHJcblx0aWYgdHlwZSBpc250IFwiUEFMIFwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJcIlwiXHJcblx0XHRcdFJJRkYgaGVhZGVyIHNheXMgdGhpcyBpc24ndCBhIFBBTCBmaWxlLFxyXG5cdFx0XHRtb3JlIG9mIGEgc29ydCBvZiAjeygodHlwZStcIlwiKS50cmltKCkpfSBmaWxlXHJcblx0XHRcIlwiXCJcclxuXHRcclxuXHQjIERhdGEgY2h1bmtcclxuXHRjaHVua1R5cGUgPSBici5yZWFkU3RyaW5nKDQpICMgXCJkYXRhXCJcclxuXHRjaHVua1NpemUgPSBici5yZWFkVUludDMyKClcclxuXHRwYWxWZXJzaW9uID0gYnIucmVhZFVJbnQxNigpICMgMHgwMzAwXHJcblx0cGFsTnVtRW50cmllcyA9IGJyLnJlYWRVSW50MTYoKVxyXG5cdFxyXG5cdFxyXG5cdGlmIGNodW5rVHlwZSBpc250IFwiZGF0YVwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJEYXRhIGNodW5rIG5vdCBmb3VuZCAoLi4uJyN7Y2h1bmtUeXBlfSc/KVwiXHJcblx0XHJcblx0aWYgcGFsVmVyc2lvbiBpc250IDB4MDMwMFxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiVW5zdXBwb3J0ZWQgUEFMIGZpbGUgZm9ybWF0IHZlcnNpb246IDB4I3twYWxWZXJzaW9uLnRvU3RyaW5nKDE2KX1cIlxyXG5cdFxyXG5cdCMgQ29sb3JzXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRpID0gMFxyXG5cdHdoaWxlIChpICs9IDEpIDwgcGFsTnVtRW50cmllcyAtIDFcclxuXHRcdFxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0XzogYnIucmVhZEJ5dGUoKSAjIFwiZmxhZ3NcIiwgYWx3YXlzIDB4MDBcclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIFBBTCAoU3RhckNyYWZ0IHJhdyBwYWxldHRlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdGZvciBpIGluIFswLi4uMjU1XVxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0Izogbm8gcGFkZGluZ1xyXG5cdFxyXG5cdCM/IHBhbGV0dGUubl9jb2x1bW5zID0gMTZcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIFdQRSAoU3RhckNyYWZ0IHBhZGRlZCByYXcgcGFsZXR0ZSlcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHRmb3IgaSBpbiBbMC4uLjI1NV1cclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdF86IGJyLnJlYWRCeXRlKCkgIyBwYWRkaW5nXHJcblx0XHJcblx0cGFsZXR0ZS5uX2NvbHVtbnMgPSAxNlxyXG5cdHBhbGV0dGVcclxuIiwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi9QYWxldHRlXCJcclxuQ29sb3IgPSByZXF1aXJlIFwiLi9Db2xvclwiXHJcblxyXG5jbGFzcyBSYW5kb21Db2xvciBleHRlbmRzIENvbG9yXHJcblx0Y29uc3RydWN0b3I6IC0+XHJcblx0XHRzdXBlcigpXHJcblx0XHRAcmFuZG9taXplKClcclxuXHRcclxuXHRyYW5kb21pemU6IC0+XHJcblx0XHRAaCA9IE1hdGgucmFuZG9tKCkgKiAzNjBcclxuXHRcdEBzID0gTWF0aC5yYW5kb20oKSAqIDEwMFxyXG5cdFx0QGwgPSBNYXRoLnJhbmRvbSgpICogMTAwXHJcblx0XHJcblx0dG9TdHJpbmc6IC0+XHJcblx0XHRAcmFuZG9taXplKClcclxuXHRcdFwiaHNsKCN7QGh9LCAje0BzfSUsICN7QGx9JSlcIlxyXG5cdFxyXG5cdGlzOiAtPiBub1xyXG5cclxuY2xhc3MgUmFuZG9tUGFsZXR0ZSBleHRlbmRzIFBhbGV0dGVcclxuXHRjb25zdHJ1Y3RvcjogLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEBsb2FkZWRfYXMgPSBcIkNvbXBsZXRlbHkgUmFuZG9tIENvbG9yc+KEolwiXHJcblx0XHRAbG9hZGVkX2FzX2NsYXVzZSA9IFwiKC5jcmMgc2pmKERmMDlzamRma3NkbGZtbm0gJzsnO1wiXHJcblx0XHRAY29uZmlkZW5jZSA9IDBcclxuXHRcdEBmaW5hbGl6ZSgpXHJcblx0XHRmb3IgaSBpbiBbMC4uTWF0aC5yYW5kb20oKSoxNSs1XVxyXG5cdFx0XHRAcHVzaCBuZXcgUmFuZG9tQ29sb3IoKVxyXG5cclxuY2xhc3MgTG9hZGluZ0Vycm9ycyBleHRlbmRzIEVycm9yXHJcblx0Y29uc3RydWN0b3I6IChAZXJyb3JzKS0+XHJcblx0XHRzdXBlcigpXHJcblx0XHRAbWVzc2FnZSA9IFwiU29tZSBlcnJvcnMgd2VyZSBlbmNvdW50ZXJlZCB3aGVuIGxvYWRpbmc6XCIgK1xyXG5cdFx0XHRmb3IgZXJyb3IgaW4gQGVycm9yc1xyXG5cdFx0XHRcdFwiXFxuXFx0XCIgKyBlcnJvci5tZXNzYWdlXHJcblxyXG5sb2FkX3BhbGV0dGUgPSAobywgY2FsbGJhY2spLT5cclxuXHRcclxuXHRwYWxldHRlX2xvYWRlcnMgPSBbXHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiLCBcInBzcHBhbGV0dGVcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9QYWludFNob3BQcm9cIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlJJRkYgUEFMXCJcclxuXHRcdFx0ZXh0czogW1wicGFsXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvUklGRlwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiQ29sb3JTY2hlbWVyIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJjc1wiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0NvbG9yU2NoZW1lclwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUGFpbnQuTkVUIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJ0eHRcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9QYWludC5ORVRcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkdJTVAgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImdwbFwiLCBcImdpbXBcIiwgXCJjb2xvcnNcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9HSU1QXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJDU1Mtc3R5bGUgY29sb3JzXCJcclxuXHRcdFx0ZXh0czogW1wiY3NzXCIsIFwic2Nzc1wiLCBcInNhc3NcIiwgXCJsZXNzXCIsIFwiaHRtbFwiLCBcInN2Z1wiLCBcImpzXCIsIFwidHNcIiwgXCJ4bWxcIiwgXCJ0eHRcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9HZW5lcmljXCJcclxuXHRcdH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgU3dhdGNoXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY29cIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JTd2F0Y2hcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIFRhYmxlXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY3RcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlQ29sb3JUYWJsZVwiXHJcblx0XHQjIH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgU3dhdGNoIEV4Y2hhbmdlXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhc2VcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlU3dhdGNoRXhjaGFuZ2VcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIEJvb2tcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjYlwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvckJvb2tcIlxyXG5cdFx0IyB9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiSFBMIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJocGxcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9IUExcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlN0YXJDcmFmdCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wicGFsXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvU3RhckNyYWZ0XCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJTdGFyQ3JhZnQgdGVycmFpbiBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wid3BlXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvU3RhckNyYWZ0UGFkZGVkXCJcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBdXRvQ0FEIENvbG9yIEJvb2tcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjYlwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQXV0b0NBRENvbG9yQm9va1wiXHJcblx0XHQjIH1cclxuXHRcdFxyXG5cdFx0IyB7XHJcblx0XHQjIFx0IyAoc2FtZSBhcyBQYWludCBTaG9wIFBybyBwYWxldHRlPylcclxuXHRcdCMgXHRuYW1lOiBcIkNvcmVsRFJBVyBwYWxldHRlXCJcclxuXHRcdCMgXHRleHRzOiBbXCJwYWxcIiwgXCJjcGxcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0NvcmVsRFJBV1wiXHJcblx0XHQjIH1cclxuXHRdXHJcblx0XHJcblx0IyBmaW5kIHBhbGV0dGUgbG9hZGVycyB0aGF0IHVzZSB0aGlzIGZpbGUgZXh0ZW5zaW9uXHJcblx0Zm9yIHBsIGluIHBhbGV0dGVfbG9hZGVyc1xyXG5cdFx0cGwubWF0Y2hlc19leHQgPSBwbC5leHRzLmluZGV4T2Yoby5maWxlX2V4dCkgaXNudCAtMVxyXG5cdFxyXG5cdCMgbW92ZSBwYWxldHRlIGxvYWRlcnMgdG8gdGhlIGJlZ2lubmluZyB0aGF0IHVzZSB0aGlzIGZpbGUgZXh0ZW5zaW9uXHJcblx0cGFsZXR0ZV9sb2FkZXJzLnNvcnQgKHBsMSwgcGwyKS0+XHJcblx0XHRwbDIubWF0Y2hlc19leHQgLSBwbDEubWF0Y2hlc19leHRcclxuXHRcclxuXHQjIHRyeSBsb2FkaW5nIHN0dWZmXHJcblx0ZXJyb3JzID0gW11cclxuXHRmb3IgcGwgaW4gcGFsZXR0ZV9sb2FkZXJzXHJcblx0XHRcclxuXHRcdHRyeVxyXG5cdFx0XHRwYWxldHRlID0gcGwubG9hZChvKVxyXG5cdFx0XHRpZiBwYWxldHRlLmxlbmd0aCBpcyAwXHJcblx0XHRcdFx0cGFsZXR0ZSA9IG51bGxcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJubyBjb2xvcnMgcmV0dXJuZWRcIlxyXG5cdFx0Y2F0Y2ggZVxyXG5cdFx0XHRtc2cgPSBcImZhaWxlZCB0byBsb2FkICN7by5maWxlX25hbWV9IGFzICN7cGwubmFtZX06ICN7ZS5tZXNzYWdlfVwiXHJcblx0XHRcdCMgaWYgcGwubWF0Y2hlc19leHQgYW5kIG5vdCBlLm1lc3NhZ2UubWF0Y2goL25vdCBhL2kpXHJcblx0XHRcdCMgXHRjb25zb2xlPy5lcnJvcj8gbXNnXHJcblx0XHRcdCMgZWxzZVxyXG5cdFx0XHQjIFx0Y29uc29sZT8ud2Fybj8gbXNnXHJcblx0XHRcdFxyXG5cdFx0XHQjIFRPRE86IG1heWJlIHRoaXMgc2hvdWxkbid0IGJlIGFuIEVycm9yIG9iamVjdCwganVzdCBhIHttZXNzYWdlLCBlcnJvcn0gb2JqZWN0XHJcblx0XHRcdCMgb3Ige2ZyaWVuZGx5TWVzc2FnZSwgZXJyb3J9XHJcblx0XHRcdGVyciA9IG5ldyBFcnJvciBtc2dcclxuXHRcdFx0ZXJyLmVycm9yID0gZVxyXG5cdFx0XHRlcnJvcnMucHVzaCBlcnJcclxuXHRcdFxyXG5cdFx0aWYgcGFsZXR0ZVxyXG5cdFx0XHQjIGNvbnNvbGU/LmluZm8/IFwibG9hZGVkICN7by5maWxlX25hbWV9IGFzICN7cGwubmFtZX1cIlxyXG5cdFx0XHRwYWxldHRlLmNvbmZpZGVuY2UgPSBpZiBwbC5tYXRjaGVzX2V4dCB0aGVuIDAuOSBlbHNlIDAuMDFcclxuXHRcdFx0cGFsZXR0ZS5sb2FkZWRfYXMgPSBwbC5uYW1lXHJcblx0XHRcdGV4dHNfcHJldHR5ID0gXCIoLiN7cGwuZXh0cy5qb2luKFwiLCAuXCIpfSlcIlxyXG5cdFx0XHRcclxuXHRcdFx0aWYgcGwubWF0Y2hlc19leHRcclxuXHRcdFx0XHRwYWxldHRlLmxvYWRlZF9hc19jbGF1c2UgPSBleHRzX3ByZXR0eVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0cGFsZXR0ZS5sb2FkZWRfYXNfY2xhdXNlID0gXCIgZm9yIHNvbWUgcmVhc29uXCJcclxuXHRcdFx0XHJcblx0XHRcdHBhbGV0dGUuZmluYWxpemUoKVxyXG5cdFx0XHRjYWxsYmFjayhudWxsLCBwYWxldHRlKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcclxuXHRjYWxsYmFjayhuZXcgTG9hZGluZ0Vycm9ycyhlcnJvcnMpKVxyXG5cdHJldHVyblxyXG5cclxubm9ybWFsaXplX29wdGlvbnMgPSAobyA9IHt9KS0+XHJcblx0aWYgdHlwZW9mIG8gaXMgXCJzdHJpbmdcIiBvciBvIGluc3RhbmNlb2YgU3RyaW5nXHJcblx0XHRvID0gZmlsZV9wYXRoOiBvXHJcblx0aWYgRmlsZT8gYW5kIG8gaW5zdGFuY2VvZiBGaWxlXHJcblx0XHRvID0gZmlsZTogb1xyXG5cdFxyXG5cdG8ubWluX2NvbG9ycyA/PSBvLm1pbkNvbG9ycyA/IDJcclxuXHRvLm1heF9jb2xvcnMgPz0gby5tYXhDb2xvcnMgPyAyNTZcclxuXHRvLmZpbGVfcGF0aCA/PSBvLmZpbGVQYXRoXHJcblx0by5maWxlX25hbWUgPz0gby5maWxlTmFtZSA/IG8uZm5hbWUgPyBvLmZpbGU/Lm5hbWUgPyAoaWYgby5maWxlX3BhdGggdGhlbiByZXF1aXJlKFwicGF0aFwiKS5iYXNlbmFtZShvLmZpbGVfcGF0aCkpXHJcblx0by5maWxlX2V4dCA/PSBvLmZpbGVFeHQgPyBcIiN7by5maWxlX25hbWV9XCIuc3BsaXQoXCIuXCIpLnBvcCgpXHJcblx0by5maWxlX2V4dCA9IChcIiN7by5maWxlX2V4dH1cIikudG9Mb3dlckNhc2UoKVxyXG5cdG9cclxuXHJcbkFueVBhbGV0dGUgPSB7XHJcblx0Q29sb3JcclxuXHRQYWxldHRlXHJcblx0UmFuZG9tQ29sb3JcclxuXHRSYW5kb21QYWxldHRlXHJcblx0IyBMb2FkaW5nRXJyb3JzXHJcbn1cclxuXHJcbiMgR2V0IHBhbGV0dGUgZnJvbSBhIGZpbGVcclxuQW55UGFsZXR0ZS5sb2FkID0gKG8sIGNhbGxiYWNrKS0+XHJcblx0aWYgbm90IG9cclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlBhcmFtZXRlcnMgcmVxdWlyZWQ6IEFueVBhbGV0dGUubG9hZChvcHRpb25zLCBmdW5jdGlvbiBjYWxsYmFjayhlcnIsIHBhbGV0dGUpe30pXCJcclxuXHRpZiBub3QgY2FsbGJhY2tcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIkNhbGxiYWNrIHJlcXVpcmVkOiBBbnlQYWxldHRlLmxvYWQob3B0aW9ucywgZnVuY3Rpb24gY2FsbGJhY2soZXJyLCBwYWxldHRlKXt9KVwiXHJcblx0XHJcblx0byA9IG5vcm1hbGl6ZV9vcHRpb25zIG9cclxuXHRcclxuXHRpZiBvLmRhdGFcclxuXHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRlbHNlIGlmIEZpbGU/IGFuZCBvLmZpbGUgaW5zdGFuY2VvZiBGaWxlXHJcblx0XHRmciA9IG5ldyBGaWxlUmVhZGVyXHJcblx0XHRmci5vbmxvYWQgPSAtPlxyXG5cdFx0XHRvLmRhdGEgPSBmci5yZXN1bHRcclxuXHRcdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdFx0ZnIucmVhZEFzQmluYXJ5U3RyaW5nIG8uZmlsZVxyXG5cdGVsc2UgaWYgby5maWxlX3BhdGg/XHJcblx0XHRmcyA9IHJlcXVpcmUgXCJmc1wiXHJcblx0XHRmcy5yZWFkRmlsZSBvLmZpbGVfcGF0aCwgKGVyciwgZGF0YSktPlxyXG5cdFx0XHRpZiBlcnJcclxuXHRcdFx0XHRjYWxsYmFjayhlcnIpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRvLmRhdGEgPSBkYXRhLnRvU3RyaW5nKFwiYmluYXJ5XCIpXHJcblx0XHRcdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdGVsc2VcclxuXHRcdGNhbGxiYWNrKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkLiBUaGUgRmlsZSBBUEkgbWF5IG5vdCBiZSBzdXBwb3J0ZWQuXCIpKSAjIHVtLi4uXHJcblx0XHQjIHRoZSBGaWxlIEFQSSB3b3VsZCBiZSBzdXBwb3J0ZWQgaWYgeW91J3ZlIHBhc3NlZCBhIEZpbGVcclxuXHRcdCMgVE9ETzogYSBiZXR0ZXIgZXJyb3IgbWVzc2FnZSwgYWJvdXQgb3B0aW9ucyAobm90KSBwYXNzZWRcclxuXHJcblxyXG4jIEdldCBhIHBhbGV0dGUgZnJvbSBhIGZpbGUgb3IgYnkgYW55IG1lYW5zIG5lY2Vzc2FyeVxyXG4jIChhcyBpbiBmYWxsIGJhY2sgdG8gY29tcGxldGVseSByYW5kb20gZGF0YSlcclxuQW55UGFsZXR0ZS5naW1tZSA9IChvLCBjYWxsYmFjayktPlxyXG5cdG8gPSBub3JtYWxpemVfb3B0aW9ucyBvXHJcblx0XHJcblx0QW55UGFsZXR0ZS5sb2FkIG8sIChlcnIsIHBhbGV0dGUpLT5cclxuXHRcdGNhbGxiYWNrKG51bGwsIHBhbGV0dGUgPyBuZXcgUmFuZG9tUGFsZXR0ZSlcclxuXHJcbiMgRXhwb3J0c1xyXG5tb2R1bGUuZXhwb3J0cyA9IEFueVBhbGV0dGVcclxuIl19
