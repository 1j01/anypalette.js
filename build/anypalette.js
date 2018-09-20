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
    
    // TODO: don't need regexp here
    if (line.match(/^#/) || line === "") {
      continue;
    }
    // TODO: handle non-start-of-line comments?
    m = line.match(/Name:\s*(.*)/);
    if (m) {
      palette.name = m[1];
      continue;
    }
    m = line.match(/Columns:\s*(.*)/);
    if (m) {
      palette.n_columns = Number(m[1]);
      // TODO: handle 0 as not specified?
      palette.has_dimensions = true;
      continue;
    }
    
    // TODO: replace \s with [\ \t] (spaces or tabs)
    // it can't match \n because it's already split on that, but still
    // TODO: handle line with no name but space on the end
    // match 3 groups of numbers separated by spaces
    r_g_b_name = line.match(/^\s*([0-9]+)\s+([0-9]+)\s+([0-9]+)(?:\s+(.*))?$/); // "at the beginning of the line,"
    // "give or take some spaces,"
    // red
    // green
    // blue
    // optionally a name
    // "and that should be the end of the line"
    if (!r_g_b_name) {
      throw new Error(`Line ${i} doesn't match pattern ${r_g_b_name // TODO: better message?
}`);
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsInNyYy9CaW5hcnlSZWFkZXIuY29mZmVlIiwic3JjL0NvbG9yLmNvZmZlZSIsInNyYy9QYWxldHRlLmNvZmZlZSIsInNyYy9sb2FkZXJzL0NvbG9yU2NoZW1lci5jb2ZmZWUiLCJzcmMvbG9hZGVycy9HSU1QLmNvZmZlZSIsInNyYy9sb2FkZXJzL0dlbmVyaWMuY29mZmVlIiwic3JjL2xvYWRlcnMvSFBMLmNvZmZlZSIsInNyYy9sb2FkZXJzL1BhaW50Lk5FVC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9QYWludFNob3BQcm8uY29mZmVlIiwic3JjL2xvYWRlcnMvUklGRi5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TdGFyQ3JhZnQuY29mZmVlIiwic3JjL2xvYWRlcnMvU3RhckNyYWZ0UGFkZGVkLmNvZmZlZSIsInNyYy9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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UUFBZDtlQUNULFlBQUEsQ0FBYSxDQUFiLEVBQWdCLFFBQWhCLEVBSkQ7O0lBRHdCLENBQXpCLEVBRkk7R0FBQSxNQUFBO1dBU0osUUFBQSxDQUFTLElBQUksS0FBSixDQUFVLG9EQUFWLENBQVQsRUFUSTs7QUFoQlksRUE5TGxCOzs7Ozs7O0FBOE5BLFVBQVUsQ0FBQyxLQUFYLEdBQW1CLFFBQUEsQ0FBQyxDQUFELEVBQUksUUFBSixDQUFBO0VBQ2xCLENBQUEsR0FBSSxpQkFBQSxDQUFrQixDQUFsQjtTQUVKLFVBQVUsQ0FBQyxJQUFYLENBQWdCLENBQWhCLEVBQW1CLFFBQUEsQ0FBQyxHQUFELEVBQU0sT0FBTixDQUFBO1dBQ2xCLFFBQUEsQ0FBUyxJQUFULG9CQUFlLFVBQVUsSUFBSSxhQUE3QjtFQURrQixDQUFuQjtBQUhrQixFQTlObkI7OztBQXFPQSxNQUFNLENBQUMsT0FBUCxHQUFpQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8vIC5kaXJuYW1lLCAuYmFzZW5hbWUsIGFuZCAuZXh0bmFtZSBtZXRob2RzIGFyZSBleHRyYWN0ZWQgZnJvbSBOb2RlLmpzIHY4LjExLjEsXG4vLyBiYWNrcG9ydGVkIGFuZCB0cmFuc3BsaXRlZCB3aXRoIEJhYmVsLCB3aXRoIGJhY2t3YXJkcy1jb21wYXQgZml4ZXNcblxuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCBhcnJheSB3aXRoIGRpcmVjdG9yeSBuYW1lcyB0aGVyZVxuLy8gbXVzdCBiZSBubyBzbGFzaGVzLCBlbXB0eSBlbGVtZW50cywgb3IgZGV2aWNlIG5hbWVzIChjOlxcKSBpbiB0aGUgYXJyYXlcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxuLy8gcmVsYXRpdmUgYW5kIGFic29sdXRlIHBhdGhzKVxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkocGFydHMsIGFsbG93QWJvdmVSb290KSB7XG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT09ICcuJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBwYXJ0cy51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cztcbn1cblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgaXNBYnNvbHV0ZSA9IGV4cG9ydHMuaXNBYnNvbHV0ZShwYXRoKSxcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBzdWJzdHIocGF0aCwgLTEpID09PSAnLyc7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cblxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgcCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG5leHBvcnRzLmRlbGltaXRlciA9ICc6JztcblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykgcGF0aCA9IHBhdGggKyAnJztcbiAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSByZXR1cm4gJy4nO1xuICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdCgwKTtcbiAgdmFyIGhhc1Jvb3QgPSBjb2RlID09PSA0NyAvKi8qLztcbiAgdmFyIGVuZCA9IC0xO1xuICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgZm9yICh2YXIgaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAxOyAtLWkpIHtcbiAgICBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICAgIGVuZCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvclxuICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKGVuZCA9PT0gLTEpIHJldHVybiBoYXNSb290ID8gJy8nIDogJy4nO1xuICBpZiAoaGFzUm9vdCAmJiBlbmQgPT09IDEpIHtcbiAgICAvLyByZXR1cm4gJy8vJztcbiAgICAvLyBCYWNrd2FyZHMtY29tcGF0IGZpeDpcbiAgICByZXR1cm4gJy8nO1xuICB9XG4gIHJldHVybiBwYXRoLnNsaWNlKDAsIGVuZCk7XG59O1xuXG5mdW5jdGlvbiBiYXNlbmFtZShwYXRoKSB7XG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHBhdGggPSBwYXRoICsgJyc7XG5cbiAgdmFyIHN0YXJ0ID0gMDtcbiAgdmFyIGVuZCA9IC0xO1xuICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgdmFyIGk7XG5cbiAgZm9yIChpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgIGlmIChwYXRoLmNoYXJDb2RlQXQoaSkgPT09IDQ3IC8qLyovKSB7XG4gICAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAgIC8vIHNlcGFyYXRvcnMgYXQgdGhlIGVuZCBvZiB0aGUgc3RyaW5nLCBzdG9wIG5vd1xuICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICAgIHN0YXJ0ID0gaSArIDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZW5kID09PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgLy8gcGF0aCBjb21wb25lbnRcbiAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgICAgZW5kID0gaSArIDE7XG4gICAgfVxuICB9XG5cbiAgaWYgKGVuZCA9PT0gLTEpIHJldHVybiAnJztcbiAgcmV0dXJuIHBhdGguc2xpY2Uoc3RhcnQsIGVuZCk7XG59XG5cbi8vIFVzZXMgYSBtaXhlZCBhcHByb2FjaCBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHksIGFzIGV4dCBiZWhhdmlvciBjaGFuZ2VkXG4vLyBpbiBuZXcgTm9kZS5qcyB2ZXJzaW9ucywgc28gb25seSBiYXNlbmFtZSgpIGFib3ZlIGlzIGJhY2twb3J0ZWQgaGVyZVxuZXhwb3J0cy5iYXNlbmFtZSA9IGZ1bmN0aW9uIChwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBiYXNlbmFtZShwYXRoKTtcbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHBhdGggPSBwYXRoICsgJyc7XG4gIHZhciBzdGFydERvdCA9IC0xO1xuICB2YXIgc3RhcnRQYXJ0ID0gMDtcbiAgdmFyIGVuZCA9IC0xO1xuICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgLy8gVHJhY2sgdGhlIHN0YXRlIG9mIGNoYXJhY3RlcnMgKGlmIGFueSkgd2Ugc2VlIGJlZm9yZSBvdXIgZmlyc3QgZG90IGFuZFxuICAvLyBhZnRlciBhbnkgcGF0aCBzZXBhcmF0b3Igd2UgZmluZFxuICB2YXIgcHJlRG90U3RhdGUgPSAwO1xuICBmb3IgKHZhciBpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgIHZhciBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICBzdGFydFBhcnQgPSBpICsgMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICBpZiAoZW5kID09PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgLy8gZXh0ZW5zaW9uXG4gICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgIGVuZCA9IGkgKyAxO1xuICAgIH1cbiAgICBpZiAoY29kZSA9PT0gNDYgLyouKi8pIHtcbiAgICAgICAgLy8gSWYgdGhpcyBpcyBvdXIgZmlyc3QgZG90LCBtYXJrIGl0IGFzIHRoZSBzdGFydCBvZiBvdXIgZXh0ZW5zaW9uXG4gICAgICAgIGlmIChzdGFydERvdCA9PT0gLTEpXG4gICAgICAgICAgc3RhcnREb3QgPSBpO1xuICAgICAgICBlbHNlIGlmIChwcmVEb3RTdGF0ZSAhPT0gMSlcbiAgICAgICAgICBwcmVEb3RTdGF0ZSA9IDE7XG4gICAgfSBlbHNlIGlmIChzdGFydERvdCAhPT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgYW5kIG5vbi1wYXRoIHNlcGFyYXRvciBiZWZvcmUgb3VyIGRvdCwgc28gd2Ugc2hvdWxkXG4gICAgICAvLyBoYXZlIGEgZ29vZCBjaGFuY2UgYXQgaGF2aW5nIGEgbm9uLWVtcHR5IGV4dGVuc2lvblxuICAgICAgcHJlRG90U3RhdGUgPSAtMTtcbiAgICB9XG4gIH1cblxuICBpZiAoc3RhcnREb3QgPT09IC0xIHx8IGVuZCA9PT0gLTEgfHxcbiAgICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgY2hhcmFjdGVyIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZG90XG4gICAgICBwcmVEb3RTdGF0ZSA9PT0gMCB8fFxuICAgICAgLy8gVGhlIChyaWdodC1tb3N0KSB0cmltbWVkIHBhdGggY29tcG9uZW50IGlzIGV4YWN0bHkgJy4uJ1xuICAgICAgcHJlRG90U3RhdGUgPT09IDEgJiYgc3RhcnREb3QgPT09IGVuZCAtIDEgJiYgc3RhcnREb3QgPT09IHN0YXJ0UGFydCArIDEpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgcmV0dXJuIHBhdGguc2xpY2Uoc3RhcnREb3QsIGVuZCk7XG59O1xuXG5mdW5jdGlvbiBmaWx0ZXIgKHhzLCBmKSB7XG4gICAgaWYgKHhzLmZpbHRlcikgcmV0dXJuIHhzLmZpbHRlcihmKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZih4c1tpXSwgaSwgeHMpKSByZXMucHVzaCh4c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIFN0cmluZy5wcm90b3R5cGUuc3Vic3RyIC0gbmVnYXRpdmUgaW5kZXggZG9uJ3Qgd29yayBpbiBJRThcbnZhciBzdWJzdHIgPSAnYWInLnN1YnN0cigtMSkgPT09ICdiJ1xuICAgID8gZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikgeyByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKSB9XG4gICAgOiBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7XG4gICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gc3RyLmxlbmd0aCArIHN0YXJ0O1xuICAgICAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKTtcbiAgICB9XG47XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiXHJcbiMjI1xyXG5CaW5hcnlSZWFkZXJcclxuXHJcbk1vZGlmaWVkIGJ5IElzYWlhaCBPZGhuZXJcclxuQFRPRE86IHVzZSBqRGF0YVZpZXcgKyBqQmluYXJ5IGluc3RlYWRcclxuXHJcblJlZmFjdG9yZWQgYnkgVmpldXggPHZqZXV4eEBnbWFpbC5jb20+XHJcbmh0dHA6Ly9ibG9nLnZqZXV4LmNvbS8yMDEwL2phdmFzY3JpcHQvamF2YXNjcmlwdC1iaW5hcnktcmVhZGVyLmh0bWxcclxuXHJcbk9yaWdpbmFsXHJcbisgSm9uYXMgUmFvbmkgU29hcmVzIFNpbHZhXHJcbkAgaHR0cDovL2pzZnJvbWhlbGwuY29tL2NsYXNzZXMvYmluYXJ5LXBhcnNlciBbcmV2LiAjMV1cclxuIyMjXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIEJpbmFyeVJlYWRlclxyXG5cdGNvbnN0cnVjdG9yOiAoZGF0YSktPlxyXG5cdFx0QF9idWZmZXIgPSBkYXRhXHJcblx0XHRAX3BvcyA9IDBcclxuXHJcblx0IyBQdWJsaWMgKGN1c3RvbSlcclxuXHRcclxuXHRyZWFkQnl0ZTogLT5cclxuXHRcdEBfY2hlY2tTaXplKDgpXHJcblx0XHRjaCA9IHRoaXMuX2J1ZmZlci5jaGFyQ29kZUF0KEBfcG9zKSAmIDB4ZmZcclxuXHRcdEBfcG9zICs9IDFcclxuXHRcdGNoICYgMHhmZlxyXG5cdFxyXG5cdHJlYWRVbmljb2RlU3RyaW5nOiAtPlxyXG5cdFx0bGVuZ3RoID0gQHJlYWRVSW50MTYoKVxyXG5cdFx0IyBjb25zb2xlLmxvZyB7bGVuZ3RofVxyXG5cdFx0QF9jaGVja1NpemUobGVuZ3RoICogMTYpXHJcblx0XHRzdHIgPSBcIlwiXHJcblx0XHRmb3IgaSBpbiBbMC4ubGVuZ3RoXVxyXG5cdFx0XHRzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShAX2J1ZmZlci5zdWJzdHIoQF9wb3MsIDEpIHwgKEBfYnVmZmVyLnN1YnN0cihAX3BvcysxLCAxKSA8PCA4KSlcclxuXHRcdFx0QF9wb3MgKz0gMlxyXG5cdFx0c3RyXHJcblx0XHJcblx0IyBQdWJsaWNcclxuXHRcclxuXHRyZWFkSW50ODogLT4gQF9kZWNvZGVJbnQoOCwgdHJ1ZSlcclxuXHRyZWFkVUludDg6IC0+IEBfZGVjb2RlSW50KDgsIGZhbHNlKVxyXG5cdHJlYWRJbnQxNjogLT4gQF9kZWNvZGVJbnQoMTYsIHRydWUpXHJcblx0cmVhZFVJbnQxNjogLT4gQF9kZWNvZGVJbnQoMTYsIGZhbHNlKVxyXG5cdHJlYWRJbnQzMjogLT4gQF9kZWNvZGVJbnQoMzIsIHRydWUpXHJcblx0cmVhZFVJbnQzMjogLT4gQF9kZWNvZGVJbnQoMzIsIGZhbHNlKVxyXG5cclxuXHRyZWFkRmxvYXQ6IC0+IEBfZGVjb2RlRmxvYXQoMjMsIDgpXHJcblx0cmVhZERvdWJsZTogLT4gQF9kZWNvZGVGbG9hdCg1MiwgMTEpXHJcblx0XHJcblx0cmVhZENoYXI6IC0+IEByZWFkU3RyaW5nKDEpXHJcblx0cmVhZFN0cmluZzogKGxlbmd0aCktPlxyXG5cdFx0QF9jaGVja1NpemUobGVuZ3RoICogOClcclxuXHRcdHJlc3VsdCA9IEBfYnVmZmVyLnN1YnN0cihAX3BvcywgbGVuZ3RoKVxyXG5cdFx0QF9wb3MgKz0gbGVuZ3RoXHJcblx0XHRyZXN1bHRcclxuXHJcblx0c2VlazogKHBvcyktPlxyXG5cdFx0QF9wb3MgPSBwb3NcclxuXHRcdEBfY2hlY2tTaXplKDApXHJcblx0XHJcblx0Z2V0UG9zaXRpb246IC0+IEBfcG9zXHJcblx0XHJcblx0Z2V0U2l6ZTogLT4gQF9idWZmZXIubGVuZ3RoXHJcblx0XHJcblxyXG5cclxuXHQjIFByaXZhdGVcclxuXHRcclxuXHRfZGVjb2RlRmxvYXQ6IGBmdW5jdGlvbihwcmVjaXNpb25CaXRzLCBleHBvbmVudEJpdHMpe1xyXG5cdFx0dmFyIGxlbmd0aCA9IHByZWNpc2lvbkJpdHMgKyBleHBvbmVudEJpdHMgKyAxO1xyXG5cdFx0dmFyIHNpemUgPSBsZW5ndGggPj4gMztcclxuXHRcdHRoaXMuX2NoZWNrU2l6ZShsZW5ndGgpO1xyXG5cclxuXHRcdHZhciBiaWFzID0gTWF0aC5wb3coMiwgZXhwb25lbnRCaXRzIC0gMSkgLSAxO1xyXG5cdFx0dmFyIHNpZ25hbCA9IHRoaXMuX3JlYWRCaXRzKHByZWNpc2lvbkJpdHMgKyBleHBvbmVudEJpdHMsIDEsIHNpemUpO1xyXG5cdFx0dmFyIGV4cG9uZW50ID0gdGhpcy5fcmVhZEJpdHMocHJlY2lzaW9uQml0cywgZXhwb25lbnRCaXRzLCBzaXplKTtcclxuXHRcdHZhciBzaWduaWZpY2FuZCA9IDA7XHJcblx0XHR2YXIgZGl2aXNvciA9IDI7XHJcblx0XHR2YXIgY3VyQnl0ZSA9IDA7IC8vbGVuZ3RoICsgKC1wcmVjaXNpb25CaXRzID4+IDMpIC0gMTtcclxuXHRcdGRvIHtcclxuXHRcdFx0dmFyIGJ5dGVWYWx1ZSA9IHRoaXMuX3JlYWRCeXRlKCsrY3VyQnl0ZSwgc2l6ZSk7XHJcblx0XHRcdHZhciBzdGFydEJpdCA9IHByZWNpc2lvbkJpdHMgJSA4IHx8IDg7XHJcblx0XHRcdHZhciBtYXNrID0gMSA8PCBzdGFydEJpdDtcclxuXHRcdFx0d2hpbGUgKG1hc2sgPj49IDEpIHtcclxuXHRcdFx0XHRpZiAoYnl0ZVZhbHVlICYgbWFzaykge1xyXG5cdFx0XHRcdFx0c2lnbmlmaWNhbmQgKz0gMSAvIGRpdmlzb3I7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRpdmlzb3IgKj0gMjtcclxuXHRcdFx0fVxyXG5cdFx0fSB3aGlsZSAocHJlY2lzaW9uQml0cyAtPSBzdGFydEJpdCk7XHJcblxyXG5cdFx0dGhpcy5fcG9zICs9IHNpemU7XHJcblxyXG5cdFx0cmV0dXJuIGV4cG9uZW50ID09IChiaWFzIDw8IDEpICsgMSA/IHNpZ25pZmljYW5kID8gTmFOIDogc2lnbmFsID8gLUluZmluaXR5IDogK0luZmluaXR5XHJcblx0XHRcdDogKDEgKyBzaWduYWwgKiAtMikgKiAoZXhwb25lbnQgfHwgc2lnbmlmaWNhbmQgPyAhZXhwb25lbnQgPyBNYXRoLnBvdygyLCAtYmlhcyArIDEpICogc2lnbmlmaWNhbmRcclxuXHRcdFx0OiBNYXRoLnBvdygyLCBleHBvbmVudCAtIGJpYXMpICogKDEgKyBzaWduaWZpY2FuZCkgOiAwKTtcclxuXHR9YFxyXG5cclxuXHRfZGVjb2RlSW50OiBgZnVuY3Rpb24oYml0cywgc2lnbmVkKXtcclxuXHRcdHZhciB4ID0gdGhpcy5fcmVhZEJpdHMoMCwgYml0cywgYml0cyAvIDgpLCBtYXggPSBNYXRoLnBvdygyLCBiaXRzKTtcclxuXHRcdHZhciByZXN1bHQgPSBzaWduZWQgJiYgeCA+PSBtYXggLyAyID8geCAtIG1heCA6IHg7XHJcblxyXG5cdFx0dGhpcy5fcG9zICs9IGJpdHMgLyA4O1xyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9YFxyXG5cclxuXHQjc2hsIGZpeDogSGVucmkgVG9yZ2VtYW5lIH4xOTk2IChjb21wcmVzc2VkIGJ5IEpvbmFzIFJhb25pKVxyXG5cdF9zaGw6IGBmdW5jdGlvbiAoYSwgYil7XHJcblx0XHRmb3IgKCsrYjsgLS1iOyBhID0gKChhICU9IDB4N2ZmZmZmZmYgKyAxKSAmIDB4NDAwMDAwMDApID09IDB4NDAwMDAwMDAgPyBhICogMiA6IChhIC0gMHg0MDAwMDAwMCkgKiAyICsgMHg3ZmZmZmZmZiArIDEpO1xyXG5cdFx0cmV0dXJuIGE7XHJcblx0fWBcclxuXHRcclxuXHRfcmVhZEJ5dGU6IGBmdW5jdGlvbiAoaSwgc2l6ZSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2J1ZmZlci5jaGFyQ29kZUF0KHRoaXMuX3BvcyArIHNpemUgLSBpIC0gMSkgJiAweGZmO1xyXG5cdH1gXHJcblxyXG5cdF9yZWFkQml0czogYGZ1bmN0aW9uIChzdGFydCwgbGVuZ3RoLCBzaXplKSB7XHJcblx0XHR2YXIgb2Zmc2V0TGVmdCA9IChzdGFydCArIGxlbmd0aCkgJSA4O1xyXG5cdFx0dmFyIG9mZnNldFJpZ2h0ID0gc3RhcnQgJSA4O1xyXG5cdFx0dmFyIGN1ckJ5dGUgPSBzaXplIC0gKHN0YXJ0ID4+IDMpIC0gMTtcclxuXHRcdHZhciBsYXN0Qnl0ZSA9IHNpemUgKyAoLShzdGFydCArIGxlbmd0aCkgPj4gMyk7XHJcblx0XHR2YXIgZGlmZiA9IGN1ckJ5dGUgLSBsYXN0Qnl0ZTtcclxuXHJcblx0XHR2YXIgc3VtID0gKHRoaXMuX3JlYWRCeXRlKGN1ckJ5dGUsIHNpemUpID4+IG9mZnNldFJpZ2h0KSAmICgoMSA8PCAoZGlmZiA/IDggLSBvZmZzZXRSaWdodCA6IGxlbmd0aCkpIC0gMSk7XHJcblxyXG5cdFx0aWYgKGRpZmYgJiYgb2Zmc2V0TGVmdCkge1xyXG5cdFx0XHRzdW0gKz0gKHRoaXMuX3JlYWRCeXRlKGxhc3RCeXRlKyssIHNpemUpICYgKCgxIDw8IG9mZnNldExlZnQpIC0gMSkpIDw8IChkaWZmLS0gPDwgMykgLSBvZmZzZXRSaWdodDsgXHJcblx0XHR9XHJcblxyXG5cdFx0d2hpbGUgKGRpZmYpIHtcclxuXHRcdFx0c3VtICs9IHRoaXMuX3NobCh0aGlzLl9yZWFkQnl0ZShsYXN0Qnl0ZSsrLCBzaXplKSwgKGRpZmYtLSA8PCAzKSAtIG9mZnNldFJpZ2h0KTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gc3VtO1xyXG5cdH1gXHJcblxyXG5cdF9jaGVja1NpemU6IChuZWVkZWRCaXRzKS0+XHJcblx0XHRpZiBAX3BvcyArIE1hdGguY2VpbChuZWVkZWRCaXRzIC8gOCkgPiBAX2J1ZmZlci5sZW5ndGhcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiSW5kZXggb3V0IG9mIGJvdW5kXCJcclxuXHJcbiIsIlxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIENvbG9yXHJcblx0Y29uc3RydWN0b3I6IChvcHRpb25zKS0+XHJcblx0XHQjIEBUT0RPOiBkb24ndCBhc3NpZ24gYWxsIG9mIHtAciwgQGcsIEBiLCBAaCwgQHMsIEB2LCBAbH0gcmlnaHQgYXdheVxyXG5cdFx0IyBvbmx5IGFzc2lnbiB0aGUgcHJvcGVydGllcyB0aGF0IGFyZSB1c2VkXHJcblx0XHQjIGFsc28gbWF5YmUgYWx3YXlzIGhhdmUgQHIgQGcgQGIgKG9yIEByZWQgQGdyZWVuIEBibHVlKSBidXQgc3RpbGwgc3RyaW5naWZ5IHRvIGhzbCgpIGlmIGhzbCBvciBoc3YgZ2l2ZW5cclxuXHRcdCMgVE9ETzogZXhwZWN0IG51bWJlcnMgb3IgY29udmVydCB0byBudW1iZXJzXHJcblx0XHR7XHJcblx0XHRcdEByLCBAZywgQGIsXHJcblx0XHRcdEBoLCBAcywgQHYsIEBsLFxyXG5cdFx0XHRjLCBtLCB5LCBrLFxyXG5cdFx0XHRAbmFtZVxyXG5cdFx0fSA9IG9wdGlvbnNcclxuXHJcblx0XHRpZiBAcj8gYW5kIEBnPyBhbmQgQGI/XHJcblx0XHRcdCMgUmVkIEdyZWVuIEJsdWVcclxuXHRcdFx0IyAobm8gY29udmVyc2lvbnMgbmVlZGVkIGhlcmUpXHJcblx0XHRlbHNlIGlmIEBoPyBhbmQgQHM/XHJcblx0XHRcdCMgQ3lsaW5kcmljYWwgQ29sb3IgU3BhY2VcclxuXHRcdFx0aWYgQHY/XHJcblx0XHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBWYWx1ZVxyXG5cdFx0XHRcdEBsID0gKDIgLSBAcyAvIDEwMCkgKiBAdiAvIDJcclxuXHRcdFx0XHRAcyA9IEBzICogQHYgLyAoaWYgQGwgPCA1MCB0aGVuIEBsICogMiBlbHNlIDIwMCAtIEBsICogMilcclxuXHRcdFx0XHRAcyA9IDAgaWYgaXNOYU4gQHNcclxuXHRcdFx0ZWxzZSBpZiBAbD9cclxuXHRcdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIExpZ2h0bmVzc1xyXG5cdFx0XHRcdCMgKG5vIGNvbnZlcnNpb25zIG5lZWRlZCBoZXJlKVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0IyBUT0RPOiBpbXByb3ZlIGVycm9yIG1lc3NhZ2UgKGVzcGVjaWFsbHkgaWYgQGIgZ2l2ZW4pXHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiSHVlLCBzYXR1cmF0aW9uLCBhbmQuLi4/IChlaXRoZXIgbGlnaHRuZXNzIG9yIHZhbHVlKVwiXHJcblx0XHRcdCMgVE9ETzogbWF5YmUgY29udmVydCB0byBAciBAZyBAYiBoZXJlXHJcblx0XHRlbHNlIGlmIGM/IGFuZCBtPyBhbmQgeT8gYW5kIGs/XHJcblx0XHRcdCMgQ3lhbiBNYWdlbnRhIFllbGxvdyBibGFjS1xyXG5cdFx0XHQjIFVOVEVTVEVEXHJcblx0XHRcdGMgLz0gMTAwXHJcblx0XHRcdG0gLz0gMTAwXHJcblx0XHRcdHkgLz0gMTAwXHJcblx0XHRcdGsgLz0gMTAwXHJcblx0XHRcdFxyXG5cdFx0XHRAciA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgYyAqICgxIC0gaykgKyBrKSlcclxuXHRcdFx0QGcgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIG0gKiAoMSAtIGspICsgaykpXHJcblx0XHRcdEBiID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCB5ICogKDEgLSBrKSArIGspKVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHQjIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEXHJcblx0XHRcdGlmIEBsPyBhbmQgQGE/IGFuZCBAYj9cclxuXHRcdFx0XHR3aGl0ZSA9XHJcblx0XHRcdFx0XHR4OiA5NS4wNDdcclxuXHRcdFx0XHRcdHk6IDEwMC4wMDBcclxuXHRcdFx0XHRcdHo6IDEwOC44ODNcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR4eXogPSBcclxuXHRcdFx0XHRcdHk6IChyYXcubCArIDE2KSAvIDExNlxyXG5cdFx0XHRcdFx0eDogcmF3LmEgLyA1MDAgKyB4eXoueVxyXG5cdFx0XHRcdFx0ejogeHl6LnkgLSByYXcuYiAvIDIwMFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGZvciBfIGluIFwieHl6XCJcclxuXHRcdFx0XHRcdHBvd2VkID0gTWF0aC5wb3coeHl6W19dLCAzKVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiBwb3dlZCA+IDAuMDA4ODU2XHJcblx0XHRcdFx0XHRcdHh5eltfXSA9IHBvd2VkXHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdHh5eltfXSA9ICh4eXpbX10gLSAxNiAvIDExNikgLyA3Ljc4N1xyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHQjeHl6W19dID0gX3JvdW5kKHh5eltfXSAqIHdoaXRlW19dKVxyXG5cdFx0XHRcdFxyXG5cdFx0XHQjIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEIFVOVEVTVEVEXHJcblx0XHRcdGlmIEB4PyBhbmQgQHk/IGFuZCBAej9cclxuXHRcdFx0XHR4eXogPVxyXG5cdFx0XHRcdFx0eDogcmF3LnggLyAxMDBcclxuXHRcdFx0XHRcdHk6IHJhdy55IC8gMTAwXHJcblx0XHRcdFx0XHR6OiByYXcueiAvIDEwMFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHJnYiA9XHJcblx0XHRcdFx0XHRyOiB4eXoueCAqIDMuMjQwNiArIHh5ei55ICogLTEuNTM3MiArIHh5ei56ICogLTAuNDk4NlxyXG5cdFx0XHRcdFx0ZzogeHl6LnggKiAtMC45Njg5ICsgeHl6LnkgKiAxLjg3NTggKyB4eXoueiAqIDAuMDQxNVxyXG5cdFx0XHRcdFx0YjogeHl6LnggKiAwLjA1NTcgKyB4eXoueSAqIC0wLjIwNDAgKyB4eXoueiAqIDEuMDU3MFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGZvciBfIGluIFwicmdiXCJcclxuXHRcdFx0XHRcdCNyZ2JbX10gPSBfcm91bmQocmdiW19dKVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiByZ2JbX10gPCAwXHJcblx0XHRcdFx0XHRcdHJnYltfXSA9IDBcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYgcmdiW19dID4gMC4wMDMxMzA4XHJcblx0XHRcdFx0XHRcdHJnYltfXSA9IDEuMDU1ICogTWF0aC5wb3cocmdiW19dLCAoMSAvIDIuNCkpIC0gMC4wNTVcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0cmdiW19dICo9IDEyLjkyXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0I3JnYltfXSA9IE1hdGgucm91bmQocmdiW19dICogMjU1KVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiQ29sb3IgY29uc3RydWN0b3IgbXVzdCBiZSBjYWxsZWQgd2l0aCB7cixnLGJ9IG9yIHtoLHMsdn0gb3Ige2gscyxsfSBvciB7YyxtLHksa30gb3Ige3gseSx6fSBvciB7bCxhLGJ9LFxyXG5cdFx0XHRcdFx0I3tcclxuXHRcdFx0XHRcdFx0dHJ5XHJcblx0XHRcdFx0XHRcdFx0XCJnb3QgI3tKU09OLnN0cmluZ2lmeShvcHRpb25zKX1cIlxyXG5cdFx0XHRcdFx0XHRjYXRjaCBlXHJcblx0XHRcdFx0XHRcdFx0XCJnb3Qgc29tZXRoaW5nIHRoYXQgY291bGRuJ3QgYmUgZGlzcGxheWVkIHdpdGggSlNPTi5zdHJpbmdpZnkgZm9yIHRoaXMgZXJyb3IgbWVzc2FnZVwiXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XCJcclxuXHRcdFxyXG5cdFxyXG5cdHRvU3RyaW5nOiAtPlxyXG5cdFx0aWYgQHI/XHJcblx0XHRcdCMgUmVkIEdyZWVuIEJsdWVcclxuXHRcdFx0aWYgQGE/ICMgQWxwaGFcclxuXHRcdFx0XHRcInJnYmEoI3tAcn0sICN7QGd9LCAje0BifSwgI3tAYX0pXCJcclxuXHRcdFx0ZWxzZSAjIE9wYXF1ZVxyXG5cdFx0XHRcdFwicmdiKCN7QHJ9LCAje0BnfSwgI3tAYn0pXCJcclxuXHRcdGVsc2UgaWYgQGg/XHJcblx0XHRcdCMgSHVlIFNhdHVyYXRpb24gTGlnaHRuZXNzXHJcblx0XHRcdCMgKEFzc3VtZSBoOjAtMzYwLCBzOjAtMTAwLCBsOjAtMTAwKVxyXG5cdFx0XHRpZiBAYT8gIyBBbHBoYVxyXG5cdFx0XHRcdFwiaHNsYSgje0BofSwgI3tAc30lLCAje0BsfSUsICN7QGF9KVwiXHJcblx0XHRcdGVsc2UgIyBPcGFxdWVcclxuXHRcdFx0XHRcImhzbCgje0BofSwgI3tAc30lLCAje0BsfSUpXCJcclxuXHRcclxuXHRpczogKGNvbG9yKS0+XHJcblx0XHQjIGNvbXBhcmUgYXMgc3RyaW5nc1xyXG5cdFx0XCIje0B9XCIgaXMgXCIje2NvbG9yfVwiXHJcbiIsIlxyXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID1cclxuY2xhc3MgUGFsZXR0ZSBleHRlbmRzIEFycmF5XHJcblx0XHJcblx0Y29uc3RydWN0b3I6IChhcmdzLi4uKS0+XHJcblx0XHRzdXBlcihhcmdzLi4uKVxyXG5cdFxyXG5cdGFkZDogKG8pLT5cclxuXHRcdG5ld19jb2xvciA9IG5ldyBDb2xvcihvKVxyXG5cdFx0QHB1c2ggbmV3X2NvbG9yXHJcblx0XHJcblx0ZmluYWxpemU6IC0+XHJcblx0XHQjIGlmIG5vdCBAbl9jb2x1bW5zXHJcblx0XHQjIFx0QGd1ZXNzX2RpbWVuc2lvbnMoKVxyXG5cdFx0dW5sZXNzIEBwYXJlbnRfcGFsZXR0ZV93aXRob3V0X2R1cGxpY2F0ZXNcclxuXHRcdFx0QHdpdGhfZHVwbGljYXRlcyA9IG5ldyBQYWxldHRlXHJcblx0XHRcdEB3aXRoX2R1cGxpY2F0ZXMucGFyZW50X3BhbGV0dGVfd2l0aG91dF9kdXBsaWNhdGVzID0gQFxyXG5cdFx0XHRAd2l0aF9kdXBsaWNhdGVzW2ldID0gQFtpXSBmb3IgaSBpbiBbMC4uLkBsZW5ndGhdXHJcblx0XHRcdEB3aXRoX2R1cGxpY2F0ZXMubl9jb2x1bW5zID0gQG5fY29sdW1uc1xyXG5cdFx0XHRAd2l0aF9kdXBsaWNhdGVzLmhhc19kaW1lbnNpb25zID0gQGhhc19kaW1lbnNpb25zXHJcblx0XHRcdEB3aXRoX2R1cGxpY2F0ZXMuZmluYWxpemUoKVxyXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXMgPSBAd2l0aF9kdXBsaWNhdGVzICMgVE9ETzoganVzdCB1c2UgY2FtZWxDYXNlIGV2ZXJ5d2hlcmVcclxuXHJcblx0XHRcdCMgaW4tcGxhY2UgdW5pcXVpZnlcclxuXHRcdFx0aSA9IDBcclxuXHRcdFx0d2hpbGUgaSA8IEBsZW5ndGhcclxuXHRcdFx0XHRpX2NvbG9yID0gQFtpXVxyXG5cdFx0XHRcdGogPSBpICsgMVxyXG5cdFx0XHRcdHdoaWxlIGogPCBAbGVuZ3RoXHJcblx0XHRcdFx0XHRqX2NvbG9yID0gQFtqXVxyXG5cdFx0XHRcdFx0aWYgaV9jb2xvci5pcyBqX2NvbG9yXHJcblx0XHRcdFx0XHRcdEAuc3BsaWNlKGosIDEpXHJcblx0XHRcdFx0XHRcdGogLT0gMVxyXG5cdFx0XHRcdFx0aiArPSAxXHJcblx0XHRcdFx0aSArPSAxXHJcblxyXG5cdGd1ZXNzX2RpbWVuc2lvbnM6IC0+XHJcblx0XHQjIFRPRE86IGdldCB0aGlzIHdvcmtpbmcgcHJvcGVybHkgYW5kIGVuYWJsZVxyXG5cclxuXHRcdGxlbiA9IEBsZW5ndGhcclxuXHRcdGNhbmRpZGF0ZV9kaW1lbnNpb25zID0gW11cclxuXHRcdGZvciBuX2NvbHVtbnMgaW4gWzAuLmxlbl1cclxuXHRcdFx0bl9yb3dzID0gbGVuIC8gbl9jb2x1bW5zXHJcblx0XHRcdGlmIG5fcm93cyBpcyBNYXRoLnJvdW5kIG5fcm93c1xyXG5cdFx0XHRcdGNhbmRpZGF0ZV9kaW1lbnNpb25zLnB1c2ggW25fcm93cywgbl9jb2x1bW5zXVxyXG5cdFx0XHJcblx0XHRzcXVhcmVzdCA9IFswLCAzNDk1MDkzXVxyXG5cdFx0Zm9yIGNkIGluIGNhbmRpZGF0ZV9kaW1lbnNpb25zXHJcblx0XHRcdGlmIE1hdGguYWJzKGNkWzBdIC0gY2RbMV0pIDwgTWF0aC5hYnMoc3F1YXJlc3RbMF0gLSBzcXVhcmVzdFsxXSlcclxuXHRcdFx0XHRzcXVhcmVzdCA9IGNkXHJcblx0XHRcclxuXHRcdCMgQG5fY29sdW1ucyA9IHNxdWFyZXN0WzFdXHJcbiIsIlxyXG4jIExvYWQgYSBDb2xvclNjaGVtZXIgcGFsZXR0ZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdHZlcnNpb24gPSBici5yZWFkVUludDE2KCkgIyBvciBzb21ldGhpbmdcclxuXHRsZW5ndGggPSBici5yZWFkVUludDE2KClcclxuXHRpID0gMFxyXG5cdHdoaWxlIGkgPCBsZW5ndGhcclxuXHRcdGJyLnNlZWsoOCArIGkgKiAyNilcclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRpICs9IDFcclxuXHJcblx0cGFsZXR0ZVxyXG5cclxuIiwiXHJcbiMgTG9hZCBhIEdJTVAgcGFsZXR0ZVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBcIkdJTVAgUGFsZXR0ZVwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYSBHSU1QIFBhbGV0dGVcIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0aSA9IDFcclxuXHR3aGlsZSAoaSArPSAxKSA8IGxpbmVzLmxlbmd0aFxyXG5cdFx0bGluZSA9IGxpbmVzW2ldXHJcblx0XHRcclxuXHRcdCMgVE9ETzogZG9uJ3QgbmVlZCByZWdleHAgaGVyZVxyXG5cdFx0aWYgbGluZS5tYXRjaCgvXiMvKSBvciBsaW5lIGlzIFwiXCIgdGhlbiBjb250aW51ZVxyXG5cdFx0IyBUT0RPOiBoYW5kbGUgbm9uLXN0YXJ0LW9mLWxpbmUgY29tbWVudHM/XHJcblx0XHRcclxuXHRcdG0gPSBsaW5lLm1hdGNoKC9OYW1lOlxccyooLiopLylcclxuXHRcdGlmIG1cclxuXHRcdFx0cGFsZXR0ZS5uYW1lID0gbVsxXVxyXG5cdFx0XHRjb250aW51ZVxyXG5cdFx0bSA9IGxpbmUubWF0Y2goL0NvbHVtbnM6XFxzKiguKikvKVxyXG5cdFx0aWYgbVxyXG5cdFx0XHRwYWxldHRlLm5fY29sdW1ucyA9IE51bWJlcihtWzFdKVxyXG5cdFx0XHQjIFRPRE86IGhhbmRsZSAwIGFzIG5vdCBzcGVjaWZpZWQ/XHJcblx0XHRcdHBhbGV0dGUuaGFzX2RpbWVuc2lvbnMgPSB5ZXNcclxuXHRcdFx0Y29udGludWVcclxuXHRcdFxyXG5cdFx0IyBUT0RPOiByZXBsYWNlIFxccyB3aXRoIFtcXCBcXHRdIChzcGFjZXMgb3IgdGFicylcclxuXHRcdCMgaXQgY2FuJ3QgbWF0Y2ggXFxuIGJlY2F1c2UgaXQncyBhbHJlYWR5IHNwbGl0IG9uIHRoYXQsIGJ1dCBzdGlsbFxyXG5cdFx0IyBUT0RPOiBoYW5kbGUgbGluZSB3aXRoIG5vIG5hbWUgYnV0IHNwYWNlIG9uIHRoZSBlbmRcclxuXHRcdHJfZ19iX25hbWUgPSBsaW5lLm1hdGNoKC8vL1xyXG5cdFx0XHReICMgXCJhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaW5lLFwiXHJcblx0XHRcdFxccyogIyBcImdpdmUgb3IgdGFrZSBzb21lIHNwYWNlcyxcIlxyXG5cdFx0XHQjIG1hdGNoIDMgZ3JvdXBzIG9mIG51bWJlcnMgc2VwYXJhdGVkIGJ5IHNwYWNlc1xyXG5cdFx0XHQoWzAtOV0rKSAjIHJlZFxyXG5cdFx0XHRcXHMrXHJcblx0XHRcdChbMC05XSspICMgZ3JlZW5cclxuXHRcdFx0XFxzK1xyXG5cdFx0XHQoWzAtOV0rKSAjIGJsdWVcclxuXHRcdFx0KD86XHJcblx0XHRcdFx0XFxzK1xyXG5cdFx0XHRcdCguKikgIyBvcHRpb25hbGx5IGEgbmFtZVxyXG5cdFx0XHQpP1xyXG5cdFx0XHQkICMgXCJhbmQgdGhhdCBzaG91bGQgYmUgdGhlIGVuZCBvZiB0aGUgbGluZVwiXHJcblx0XHQvLy8pXHJcblx0XHRpZiBub3Qgcl9nX2JfbmFtZVxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJMaW5lICN7aX0gZG9lc24ndCBtYXRjaCBwYXR0ZXJuICN7cl9nX2JfbmFtZX1cIiAjIFRPRE86IGJldHRlciBtZXNzYWdlP1xyXG5cdFx0XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiByX2dfYl9uYW1lWzFdXHJcblx0XHRcdGc6IHJfZ19iX25hbWVbMl1cclxuXHRcdFx0Yjogcl9nX2JfbmFtZVszXVxyXG5cdFx0XHRuYW1lOiByX2dfYl9uYW1lWzRdXHJcblx0XHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIERldGVjdCBDU1MgY29sb3JzIChleGNlcHQgbmFtZWQgY29sb3JzKVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGVzID0gW1xyXG5cdFx0cGFsZXR0ZV94UlJHR0JCID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV94UkdCID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9yZ2IgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX2hzbCA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfaHNsYSA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfcmdiYSA9IG5ldyBQYWxldHRlKClcclxuXHRdXHJcblx0XHJcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0XFwjICMgaGFzaHRhZyAjICMvXHJcblx0XHQoWzAtOUEtRl17Mn0pPyAjIGFscGhhXHJcblx0XHQoWzAtOUEtRl17M30pICMgdGhyZWUgZGlnaXRzICgjQTBDKVxyXG5cdFx0KFswLTlBLUZdezN9KT8gIyBzaXggZGlnaXRzICgjQUEwMENDKVxyXG5cdFx0XHJcblx0XHQoPyFbMC05QS1GXSkgIyAoYW5kIG5vIG1vcmUhKVxyXG5cdC8vL2dpbSwgKG0sICQwLCAkMSwgJDIpLT5cclxuXHRcdFxyXG5cdFx0YWxwaGEgPSBoZXggJDBcclxuXHRcdFxyXG5cdFx0aWYgJDJcclxuXHRcdFx0eFJHQiA9ICQxICsgJDJcclxuXHRcdFx0cGFsZXR0ZV94UlJHR0JCLmFkZFxyXG5cdFx0XHRcdHI6IGhleCB4UkdCWzBdICsgeFJHQlsxXVxyXG5cdFx0XHRcdGc6IGhleCB4UkdCWzJdICsgeFJHQlszXVxyXG5cdFx0XHRcdGI6IGhleCB4UkdCWzRdICsgeFJHQls1XVxyXG5cdFx0XHRcdGE6IGFscGhhXHJcblx0XHRlbHNlXHJcblx0XHRcdHhSR0IgPSAkMVxyXG5cdFx0XHRwYWxldHRlX3hSR0IuYWRkXHJcblx0XHRcdFx0cjogaGV4IHhSR0JbMF0gKyB4UkdCWzBdXHJcblx0XHRcdFx0ZzogaGV4IHhSR0JbMV0gKyB4UkdCWzFdXHJcblx0XHRcdFx0YjogaGV4IHhSR0JbMl0gKyB4UkdCWzJdXHJcblx0XHRcdFx0YTogYWxwaGFcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRyZ2JcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyByZWRcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgZ3JlZW5cclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgYmx1ZVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0cjogTnVtYmVyIG1bMV1cclxuXHRcdFx0ZzogTnVtYmVyIG1bMl1cclxuXHRcdFx0YjogTnVtYmVyIG1bM11cclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRyZ2JhXFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgcmVkXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGdyZWVuXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGJsdWVcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM318MFxcLlswLTldKykgIyBhbHBoYVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0cjogTnVtYmVyIG1bMV1cclxuXHRcdFx0ZzogTnVtYmVyIG1bMl1cclxuXHRcdFx0YjogTnVtYmVyIG1bM11cclxuXHRcdFx0YTogTnVtYmVyIG1bNF1cclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRoc2xcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBodWVcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgc2F0dXJhdGlvblxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyB2YWx1ZVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0aDogTnVtYmVyIG1bMV1cclxuXHRcdFx0czogTnVtYmVyIG1bMl1cclxuXHRcdFx0bDogTnVtYmVyIG1bM11cclxuXHRcclxuXHRtb3N0X2NvbG9ycyA9IFtdXHJcblx0Zm9yIHBhbGV0dGUgaW4gcGFsZXR0ZXNcclxuXHRcdGlmIHBhbGV0dGUubGVuZ3RoID49IG1vc3RfY29sb3JzLmxlbmd0aFxyXG5cdFx0XHRtb3N0X2NvbG9ycyA9IHBhbGV0dGVcclxuXHRcclxuXHRuID0gbW9zdF9jb2xvcnMubGVuZ3RoXHJcblx0aWYgbiA8IDRcclxuXHRcdHRocm93IG5ldyBFcnJvcihbXHJcblx0XHRcdFwiTm8gY29sb3JzIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IG9uZSBjb2xvciBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBhIGNvdXBsZSBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgYSBmZXcgY29sb3JzIGZvdW5kXCJcclxuXHRcdF1bbl0gKyBcIiAoI3tufSlcIilcclxuXHRcclxuXHRtb3N0X2NvbG9yc1xyXG4iLCJcclxuIyBXaGF0IGRvZXMgSFBMIHN0YW5kIGZvcj9cclxuIyBIb3dkeSwgUGFsZXR0ZSBMb3ZlcnMhXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IFwiUGFsZXR0ZVwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYW4gSFBMIHBhbGV0dGVcIlxyXG5cdGlmIG5vdCBsaW5lc1sxXS5tYXRjaCAvVmVyc2lvbiBbMzRdXFwuMC9cclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVuc3VwcG9ydGVkIEhQTCB2ZXJzaW9uXCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdFxyXG5cdGZvciBsaW5lLCBpIGluIGxpbmVzXHJcblx0XHRpZiBsaW5lLm1hdGNoIC8uKyAuKiAuKy9cclxuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcclxuXHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRyOiByZ2JbMF1cclxuXHRcdFx0XHRnOiByZ2JbMV1cclxuXHRcdFx0XHRiOiByZ2JbMl1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBQYWludC5ORVQgcGFsZXR0ZSBmaWxlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHJcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXHJcblx0XHJcblx0Zm9yIGxpbmUgaW4gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0XHRtID0gbGluZS5tYXRjaCgvXihbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkkL2kpXHJcblx0XHRpZiBtIHRoZW4gcGFsZXR0ZS5hZGRcclxuXHRcdFx0YTogaGV4IG1bMV1cclxuXHRcdFx0cjogaGV4IG1bMl1cclxuXHRcdFx0ZzogaGV4IG1bM11cclxuXHRcdFx0YjogaGV4IG1bNF1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBKQVNDIFBBTCBmaWxlIChQYWludCBTaG9wIFBybyBwYWxldHRlIGZpbGUpXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBcIkpBU0MtUEFMXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhIEpBU0MtUEFMXCJcclxuXHRpZiBsaW5lc1sxXSBpc250IFwiMDEwMFwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIEpBU0MtUEFMIHZlcnNpb25cIlxyXG5cdGlmIGxpbmVzWzJdIGlzbnQgXCIyNTZcIlxyXG5cdFx0XCJ0aGF0J3Mgb2tcIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0I25fY29sb3JzID0gTnVtYmVyKGxpbmVzWzJdKVxyXG5cdFxyXG5cdGZvciBsaW5lLCBpIGluIGxpbmVzXHJcblx0XHRpZiBsaW5lIGlzbnQgXCJcIiBhbmQgaSA+IDJcclxuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcclxuXHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRyOiByZ2JbMF1cclxuXHRcdFx0XHRnOiByZ2JbMV1cclxuXHRcdFx0XHRiOiByZ2JbMl1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBSZXNvdXJjZSBJbnRlcmNoYW5nZSBGaWxlIEZvcm1hdCBQQUwgZmlsZVxyXG5cclxuIyBwb3J0ZWQgZnJvbSBDIyBjb2RlIGF0IGh0dHBzOi8vd29ybXMyZC5pbmZvL1BhbGV0dGVfZmlsZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHQjIFJJRkYgaGVhZGVyXHJcblx0cmlmZiA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcIlJJRkZcIlxyXG5cdGRhdGFTaXplID0gYnIucmVhZFVJbnQzMigpXHJcblx0dHlwZSA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcIlBBTCBcIlxyXG5cdFxyXG5cdGlmIHJpZmYgaXNudCBcIlJJRkZcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiUklGRiBoZWFkZXIgbm90IGZvdW5kOyBub3QgYSBSSUZGIFBBTCBmaWxlXCJcclxuXHRcclxuXHRpZiB0eXBlIGlzbnQgXCJQQUwgXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlwiXCJcclxuXHRcdFx0UklGRiBoZWFkZXIgc2F5cyB0aGlzIGlzbid0IGEgUEFMIGZpbGUsXHJcblx0XHRcdG1vcmUgb2YgYSBzb3J0IG9mICN7KCh0eXBlK1wiXCIpLnRyaW0oKSl9IGZpbGVcclxuXHRcdFwiXCJcIlxyXG5cdFxyXG5cdCMgRGF0YSBjaHVua1xyXG5cdGNodW5rVHlwZSA9IGJyLnJlYWRTdHJpbmcoNCkgIyBcImRhdGFcIlxyXG5cdGNodW5rU2l6ZSA9IGJyLnJlYWRVSW50MzIoKVxyXG5cdHBhbFZlcnNpb24gPSBici5yZWFkVUludDE2KCkgIyAweDAzMDBcclxuXHRwYWxOdW1FbnRyaWVzID0gYnIucmVhZFVJbnQxNigpXHJcblx0XHJcblx0XHJcblx0aWYgY2h1bmtUeXBlIGlzbnQgXCJkYXRhXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIkRhdGEgY2h1bmsgbm90IGZvdW5kICguLi4nI3tjaHVua1R5cGV9Jz8pXCJcclxuXHRcclxuXHRpZiBwYWxWZXJzaW9uIGlzbnQgMHgwMzAwXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbnN1cHBvcnRlZCBQQUwgZmlsZSBmb3JtYXQgdmVyc2lvbjogMHgje3BhbFZlcnNpb24udG9TdHJpbmcoMTYpfVwiXHJcblx0XHJcblx0IyBDb2xvcnNcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGkgPSAwXHJcblx0d2hpbGUgKGkgKz0gMSkgPCBwYWxOdW1FbnRyaWVzIC0gMVxyXG5cdFx0XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRfOiBici5yZWFkQnl0ZSgpICMgXCJmbGFnc1wiLCBhbHdheXMgMHgwMFxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgUEFMIChTdGFyQ3JhZnQgcmF3IHBhbGV0dGUpXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0Zm9yIGkgaW4gWzAuLi4yNTVdXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHQjOiBubyBwYWRkaW5nXHJcblx0XHJcblx0Iz8gcGFsZXR0ZS5uX2NvbHVtbnMgPSAxNlxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgV1BFIChTdGFyQ3JhZnQgcGFkZGVkIHJhdyBwYWxldHRlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdGZvciBpIGluIFswLi4uMjU1XVxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0XzogYnIucmVhZEJ5dGUoKSAjIHBhZGRpbmdcclxuXHRcclxuXHRwYWxldHRlLm5fY29sdW1ucyA9IDE2XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuL1BhbGV0dGVcIlxyXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcclxuXHJcbmNsYXNzIFJhbmRvbUNvbG9yIGV4dGVuZHMgQ29sb3JcclxuXHRjb25zdHJ1Y3RvcjogLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEByYW5kb21pemUoKVxyXG5cdFxyXG5cdHJhbmRvbWl6ZTogLT5cclxuXHRcdEBoID0gTWF0aC5yYW5kb20oKSAqIDM2MFxyXG5cdFx0QHMgPSBNYXRoLnJhbmRvbSgpICogMTAwXHJcblx0XHRAbCA9IE1hdGgucmFuZG9tKCkgKiAxMDBcclxuXHRcclxuXHR0b1N0cmluZzogLT5cclxuXHRcdEByYW5kb21pemUoKVxyXG5cdFx0XCJoc2woI3tAaH0sICN7QHN9JSwgI3tAbH0lKVwiXHJcblx0XHJcblx0aXM6IC0+IG5vXHJcblxyXG5jbGFzcyBSYW5kb21QYWxldHRlIGV4dGVuZHMgUGFsZXR0ZVxyXG5cdGNvbnN0cnVjdG9yOiAtPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QGxvYWRlZF9hcyA9IFwiQ29tcGxldGVseSBSYW5kb20gQ29sb3Jz4oSiXCJcclxuXHRcdEBsb2FkZWRfYXNfY2xhdXNlID0gXCIoLmNyYyBzamYoRGYwOXNqZGZrc2RsZm1ubSAnOyc7XCJcclxuXHRcdEBjb25maWRlbmNlID0gMFxyXG5cdFx0QGZpbmFsaXplKClcclxuXHRcdGZvciBpIGluIFswLi5NYXRoLnJhbmRvbSgpKjE1KzVdXHJcblx0XHRcdEBwdXNoIG5ldyBSYW5kb21Db2xvcigpXHJcblxyXG5jbGFzcyBMb2FkaW5nRXJyb3JzIGV4dGVuZHMgRXJyb3JcclxuXHRjb25zdHJ1Y3RvcjogKEBlcnJvcnMpLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEBtZXNzYWdlID0gXCJTb21lIGVycm9ycyB3ZXJlIGVuY291bnRlcmVkIHdoZW4gbG9hZGluZzpcIiArXHJcblx0XHRcdGZvciBlcnJvciBpbiBAZXJyb3JzXHJcblx0XHRcdFx0XCJcXG5cXHRcIiArIGVycm9yLm1lc3NhZ2VcclxuXHJcbmxvYWRfcGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxyXG5cdFxyXG5cdHBhbGV0dGVfbG9hZGVycyA9IFtcclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJQYWludCBTaG9wIFBybyBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wicGFsXCIsIFwicHNwcGFsZXR0ZVwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50U2hvcFByb1wiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUklGRiBQQUxcIlxyXG5cdFx0XHRleHRzOiBbXCJwYWxcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9SSUZGXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJDb2xvclNjaGVtZXIgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImNzXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQ29sb3JTY2hlbWVyXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJQYWludC5ORVQgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInR4dFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50Lk5FVFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiR0lNUCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiZ3BsXCIsIFwiZ2ltcFwiLCBcImNvbG9yc1wiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0dJTVBcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkNTUy1zdHlsZSBjb2xvcnNcIlxyXG5cdFx0XHRleHRzOiBbXCJjc3NcIiwgXCJzY3NzXCIsIFwic2Fzc1wiLCBcImxlc3NcIiwgXCJodG1sXCIsIFwic3ZnXCIsIFwianNcIiwgXCJ0c1wiLCBcInhtbFwiLCBcInR4dFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0dlbmVyaWNcIlxyXG5cdFx0fVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBDb2xvciBTd2F0Y2hcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjb1wiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvclN3YXRjaFwiXHJcblx0XHQjIH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgVGFibGVcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjdFwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvclRhYmxlXCJcclxuXHRcdCMgfVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBTd2F0Y2ggRXhjaGFuZ2VcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFzZVwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVTd2F0Y2hFeGNoYW5nZVwiXHJcblx0XHQjIH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgQm9va1wiXHJcblx0XHQjIFx0ZXh0czogW1wiYWNiXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yQm9va1wiXHJcblx0XHQjIH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJIUEwgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImhwbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0hQTFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiU3RhckNyYWZ0IHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJwYWxcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TdGFyQ3JhZnRcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlN0YXJDcmFmdCB0ZXJyYWluIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJ3cGVcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TdGFyQ3JhZnRQYWRkZWRcIlxyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkF1dG9DQUQgQ29sb3IgQm9va1wiXHJcblx0XHQjIFx0ZXh0czogW1wiYWNiXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BdXRvQ0FEQ29sb3JCb29rXCJcclxuXHRcdCMgfVxyXG5cdFx0XHJcblx0XHQjIHtcclxuXHRcdCMgXHQjIChzYW1lIGFzIFBhaW50IFNob3AgUHJvIHBhbGV0dGU/KVxyXG5cdFx0IyBcdG5hbWU6IFwiQ29yZWxEUkFXIHBhbGV0dGVcIlxyXG5cdFx0IyBcdGV4dHM6IFtcInBhbFwiLCBcImNwbFwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQ29yZWxEUkFXXCJcclxuXHRcdCMgfVxyXG5cdF1cclxuXHRcclxuXHQjIGZpbmQgcGFsZXR0ZSBsb2FkZXJzIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cclxuXHRmb3IgcGwgaW4gcGFsZXR0ZV9sb2FkZXJzXHJcblx0XHRwbC5tYXRjaGVzX2V4dCA9IHBsLmV4dHMuaW5kZXhPZihvLmZpbGVfZXh0KSBpc250IC0xXHJcblx0XHJcblx0IyBtb3ZlIHBhbGV0dGUgbG9hZGVycyB0byB0aGUgYmVnaW5uaW5nIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cclxuXHRwYWxldHRlX2xvYWRlcnMuc29ydCAocGwxLCBwbDIpLT5cclxuXHRcdHBsMi5tYXRjaGVzX2V4dCAtIHBsMS5tYXRjaGVzX2V4dFxyXG5cdFxyXG5cdCMgdHJ5IGxvYWRpbmcgc3R1ZmZcclxuXHRlcnJvcnMgPSBbXVxyXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcclxuXHRcdFxyXG5cdFx0dHJ5XHJcblx0XHRcdHBhbGV0dGUgPSBwbC5sb2FkKG8pXHJcblx0XHRcdGlmIHBhbGV0dGUubGVuZ3RoIGlzIDBcclxuXHRcdFx0XHRwYWxldHRlID0gbnVsbFxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIm5vIGNvbG9ycyByZXR1cm5lZFwiXHJcblx0XHRjYXRjaCBlXHJcblx0XHRcdG1zZyA9IFwiZmFpbGVkIHRvIGxvYWQgI3tvLmZpbGVfbmFtZX0gYXMgI3twbC5uYW1lfTogI3tlLm1lc3NhZ2V9XCJcclxuXHRcdFx0IyBpZiBwbC5tYXRjaGVzX2V4dCBhbmQgbm90IGUubWVzc2FnZS5tYXRjaCgvbm90IGEvaSlcclxuXHRcdFx0IyBcdGNvbnNvbGU/LmVycm9yPyBtc2dcclxuXHRcdFx0IyBlbHNlXHJcblx0XHRcdCMgXHRjb25zb2xlPy53YXJuPyBtc2dcclxuXHRcdFx0XHJcblx0XHRcdCMgVE9ETzogbWF5YmUgdGhpcyBzaG91bGRuJ3QgYmUgYW4gRXJyb3Igb2JqZWN0LCBqdXN0IGEge21lc3NhZ2UsIGVycm9yfSBvYmplY3RcclxuXHRcdFx0IyBvciB7ZnJpZW5kbHlNZXNzYWdlLCBlcnJvcn1cclxuXHRcdFx0ZXJyID0gbmV3IEVycm9yIG1zZ1xyXG5cdFx0XHRlcnIuZXJyb3IgPSBlXHJcblx0XHRcdGVycm9ycy5wdXNoIGVyclxyXG5cdFx0XHJcblx0XHRpZiBwYWxldHRlXHJcblx0XHRcdCMgY29uc29sZT8uaW5mbz8gXCJsb2FkZWQgI3tvLmZpbGVfbmFtZX0gYXMgI3twbC5uYW1lfVwiXHJcblx0XHRcdHBhbGV0dGUuY29uZmlkZW5jZSA9IGlmIHBsLm1hdGNoZXNfZXh0IHRoZW4gMC45IGVsc2UgMC4wMVxyXG5cdFx0XHRwYWxldHRlLmxvYWRlZF9hcyA9IHBsLm5hbWVcclxuXHRcdFx0ZXh0c19wcmV0dHkgPSBcIiguI3twbC5leHRzLmpvaW4oXCIsIC5cIil9KVwiXHJcblx0XHRcdFxyXG5cdFx0XHRpZiBwbC5tYXRjaGVzX2V4dFxyXG5cdFx0XHRcdHBhbGV0dGUubG9hZGVkX2FzX2NsYXVzZSA9IGV4dHNfcHJldHR5XHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRwYWxldHRlLmxvYWRlZF9hc19jbGF1c2UgPSBcIiBmb3Igc29tZSByZWFzb25cIlxyXG5cdFx0XHRcclxuXHRcdFx0cGFsZXR0ZS5maW5hbGl6ZSgpXHJcblx0XHRcdGNhbGxiYWNrKG51bGwsIHBhbGV0dGUpXHJcblx0XHRcdHJldHVyblxyXG5cdFxyXG5cdGNhbGxiYWNrKG5ldyBMb2FkaW5nRXJyb3JzKGVycm9ycykpXHJcblx0cmV0dXJuXHJcblxyXG5ub3JtYWxpemVfb3B0aW9ucyA9IChvID0ge30pLT5cclxuXHRpZiB0eXBlb2YgbyBpcyBcInN0cmluZ1wiIG9yIG8gaW5zdGFuY2VvZiBTdHJpbmdcclxuXHRcdG8gPSBmaWxlX3BhdGg6IG9cclxuXHRpZiBGaWxlPyBhbmQgbyBpbnN0YW5jZW9mIEZpbGVcclxuXHRcdG8gPSBmaWxlOiBvXHJcblx0XHJcblx0by5taW5fY29sb3JzID89IG8ubWluQ29sb3JzID8gMlxyXG5cdG8ubWF4X2NvbG9ycyA/PSBvLm1heENvbG9ycyA/IDI1NlxyXG5cdG8uZmlsZV9wYXRoID89IG8uZmlsZVBhdGhcclxuXHRvLmZpbGVfbmFtZSA/PSBvLmZpbGVOYW1lID8gby5mbmFtZSA/IG8uZmlsZT8ubmFtZSA/IChpZiBvLmZpbGVfcGF0aCB0aGVuIHJlcXVpcmUoXCJwYXRoXCIpLmJhc2VuYW1lKG8uZmlsZV9wYXRoKSlcclxuXHRvLmZpbGVfZXh0ID89IG8uZmlsZUV4dCA/IFwiI3tvLmZpbGVfbmFtZX1cIi5zcGxpdChcIi5cIikucG9wKClcclxuXHRvLmZpbGVfZXh0ID0gKFwiI3tvLmZpbGVfZXh0fVwiKS50b0xvd2VyQ2FzZSgpXHJcblx0b1xyXG5cclxuQW55UGFsZXR0ZSA9IHtcclxuXHRDb2xvclxyXG5cdFBhbGV0dGVcclxuXHRSYW5kb21Db2xvclxyXG5cdFJhbmRvbVBhbGV0dGVcclxuXHQjIExvYWRpbmdFcnJvcnNcclxufVxyXG5cclxuIyBHZXQgcGFsZXR0ZSBmcm9tIGEgZmlsZVxyXG5BbnlQYWxldHRlLmxvYWQgPSAobywgY2FsbGJhY2spLT5cclxuXHRpZiBub3Qgb1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiUGFyYW1ldGVycyByZXF1aXJlZDogQW55UGFsZXR0ZS5sb2FkKG9wdGlvbnMsIGZ1bmN0aW9uIGNhbGxiYWNrKGVyciwgcGFsZXR0ZSl7fSlcIlxyXG5cdGlmIG5vdCBjYWxsYmFja1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiQ2FsbGJhY2sgcmVxdWlyZWQ6IEFueVBhbGV0dGUubG9hZChvcHRpb25zLCBmdW5jdGlvbiBjYWxsYmFjayhlcnIsIHBhbGV0dGUpe30pXCJcclxuXHRcclxuXHRvID0gbm9ybWFsaXplX29wdGlvbnMgb1xyXG5cdFxyXG5cdGlmIG8uZGF0YVxyXG5cdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdGVsc2UgaWYgRmlsZT8gYW5kIG8uZmlsZSBpbnN0YW5jZW9mIEZpbGVcclxuXHRcdGZyID0gbmV3IEZpbGVSZWFkZXJcclxuXHRcdGZyLm9ubG9hZCA9IC0+XHJcblx0XHRcdG8uZGF0YSA9IGZyLnJlc3VsdFxyXG5cdFx0XHRsb2FkX3BhbGV0dGUobywgY2FsbGJhY2spXHJcblx0XHRmci5yZWFkQXNCaW5hcnlTdHJpbmcgby5maWxlXHJcblx0ZWxzZSBpZiBvLmZpbGVfcGF0aD9cclxuXHRcdGZzID0gcmVxdWlyZSBcImZzXCJcclxuXHRcdGZzLnJlYWRGaWxlIG8uZmlsZV9wYXRoLCAoZXJyLCBkYXRhKS0+XHJcblx0XHRcdGlmIGVyclxyXG5cdFx0XHRcdGNhbGxiYWNrKGVycilcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdG8uZGF0YSA9IGRhdGEudG9TdHJpbmcoXCJiaW5hcnlcIilcclxuXHRcdFx0XHRsb2FkX3BhbGV0dGUobywgY2FsbGJhY2spXHJcblx0ZWxzZVxyXG5cdFx0Y2FsbGJhY2sobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQuIFRoZSBGaWxlIEFQSSBtYXkgbm90IGJlIHN1cHBvcnRlZC5cIikpICMgdW0uLi5cclxuXHRcdCMgdGhlIEZpbGUgQVBJIHdvdWxkIGJlIHN1cHBvcnRlZCBpZiB5b3UndmUgcGFzc2VkIGEgRmlsZVxyXG5cdFx0IyBUT0RPOiBhIGJldHRlciBlcnJvciBtZXNzYWdlLCBhYm91dCBvcHRpb25zIChub3QpIHBhc3NlZFxyXG5cclxuXHJcbiMgR2V0IGEgcGFsZXR0ZSBmcm9tIGEgZmlsZSBvciBieSBhbnkgbWVhbnMgbmVjZXNzYXJ5XHJcbiMgKGFzIGluIGZhbGwgYmFjayB0byBjb21wbGV0ZWx5IHJhbmRvbSBkYXRhKVxyXG5BbnlQYWxldHRlLmdpbW1lID0gKG8sIGNhbGxiYWNrKS0+XHJcblx0byA9IG5vcm1hbGl6ZV9vcHRpb25zIG9cclxuXHRcclxuXHRBbnlQYWxldHRlLmxvYWQgbywgKGVyciwgcGFsZXR0ZSktPlxyXG5cdFx0Y2FsbGJhY2sobnVsbCwgcGFsZXR0ZSA/IG5ldyBSYW5kb21QYWxldHRlKVxyXG5cclxuIyBFeHBvcnRzXHJcbm1vZHVsZS5leHBvcnRzID0gQW55UGFsZXR0ZVxyXG4iXX0=
