
# Palette.js

There are many, *many* different types of palette files.

ONE LIBRARY SHALL RULE THEM ALL

# Use cases

* Image editor ([example]())
	* On file drop or file selection...
		* Load palette if it's a palette file
		* Load image into editor (don't generate palette from image (unless you're specifically loading a palette))
	* Display any error messages
* Palette Editor ([example]())
	* Load palette from palette file
	* Pick colors from image file
	* Display any error messages
	* Save palettes (**not implemented**; to do this, the whole project should probably use [jBinary](https://github.com/jDataView/jBinary))
* From Node.js ([example]())
	* Load palette from Buffer or file_name
	* OPTIONALLY Pick colors from image file
	* **OPTIONALLY** fall back to generating Completely Random Colors™ (which you *probably don't want*)
	* Use Node style callbacks `(err, result)->`
* [Demo](1j01.github.io/palette.js/) (Not a "real" use case, but the only thing in use right now)
	* Load palette from palette file or pick colors from image
	* Fall back to generating Completely Random Colors™
	* Display extra information (see demo source)

# Documentation

The Color class is accessible as `Palette.Color`

The Palette class is accessible as `require("palette")` in node, or `Palette` in browser, or `Palette.Palette` for consistency, or `Palette.Palette.Palette` for redundancy.

### class `Palette`
Stores a list of Colors and additional data

Also used as the namespace

`Palette`

### class `Color`
The Color class is meant to be stringified. It should be able to be passed directly to an element's style or a canvas's context.
```javascript
var color = palette[0] || new Color({r: 255, g: 0, b: 255});
ctx.fillStyle = color;
div.style.background = color;
```

# Todo


* Test palette loading against previous data. That way I can change the "backend" without worrying too much.

* use [jDataView](https://github.com/jDataView/jDataView)
	
	* use [jBinary](https://github.com/jDataView/jBinary)

		* use [jPalette](https://github.com/1j01/jPalette)
		
			* make jPalette
			
				* heheh


* Load all the palettes!
	* ...

* Less false positives (pretty much anything can be loaded as raw color data)


* Improve support for palette geometries


* Nice API + documentation


* Don't use the console


* Node module


* Maybe make a bower package even though I don't use bower

