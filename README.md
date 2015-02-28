
# Palette.js

There are many, *many* different types of palette files.

ONE LIBRARY SHALL RULE THEM ALL

## Use cases

* Image editor ([example (TODO)](#todo))
	* On file drop or file selection...
		* Load palette if it's a palette file
		* Load image into editor (don't generate palette from image (unless you're specifically loading a palette))
	* Display any error messages
* Palette Editor ([example (TODO)](#todo))
	* Load palette from palette file
	* Pick colors from image file
	* Display any error messages
	* Save palettes (**not implemented**; to do this, the whole project should probably use [jBinary](https://github.com/jDataView/jBinary))
* From Node.js ([example (TODO)](#todo))
	* Load palette from Buffer or file_name
	* OPTIONALLY Pick colors from image file
	* **OPTIONALLY** fall back to generating Completely Random Colors™ (which you *probably don't want*)
	* Use Node style callbacks `(err, result)->`
* [Demo](1j01.github.io/palette.js/test)
  (Not really a "use case", but the only thing using palette.js right now)
	* Load palette from palette file or pick colors from image
	* Fall back to generating Completely Random Colors™
	* Display extra information (see demo source)



## Documentation


### class `Palette` extends `Array`

Accessible as
`require("palette.js")` in node,
or `Palette` in browser,
or `Palette.Palette` for consistency,
or `Palette.Palette.Palette` for redundancy.


Stores a list of Colors and additional data

Some palette formats do not support or are not commonly made variable size.
By default, duplicates are removed.
You can get all duplucates with `palette.with_duplicates`

The `Palette` class used as the namespace object.



### class `Color`

Accessible as `Palette.Color`


The Color class, when stringified, gives a CSS color.
You can pass a Color object directly to an element's style or a canvas's context.

```javascript
var color = palette[0];
ctx.fillStyle = color;
div.style.background = color;
```




## Todo


* Test palette loading for regression

* use [jDataView](https://github.com/jDataView/jDataView)
	
	* use [jBinary](https://github.com/jDataView/jBinary)

		* use [jPalette](https://github.com/1j01/jPalette)
		
			* make jPalette
			
				* heheh


* Load *all the palettes!*
	* ...


* Less false positives (pretty much anything can be loaded as raw color data)


* Improve support for palette geometries


* Nice API + documentation


* Don't use the console


* Node module


* Maybe make a bower package even though I don't use bower


## Development

For the demo ([test.html](test.html)) to work,
the separate [Palettes](https://github.com/1j01/palettes) repository
must be available at `/palettes/`
on the server

`npm install`

`npm run watch`



