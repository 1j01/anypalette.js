
# Palette.js

There are a LOT of different types of palette files.

ONE LIBRARY SHALL RULE THEM ALL

[Let's load some palettes](https://1j01.github.io/palette.js/test)


## Supported Palette Formats

* [RIFF](https://en.wikipedia.org/wiki/Resource_Interchange_File_Format) PAL (.pal)
* [Paint.NET](https://www.getpaint.net/) palette (.txt)
* [GIMP](https://www.gimp.org/) palette (.gpl), also used in [Inkscape](https://inkscape.org/en/), [CinePaint](http://www.cinepaint.org/), and [Krita](https://krita.org/en/homepage/)
* [Paint Shop Pro](https://www.paintshoppro.com/en/) palette (.pal, .psppalette) (JASC / Corel)
* Whatever HPL stands for (.hpl) (H-something PaLette?)
* [Starcraft](https://en.wikipedia.org/wiki/StarCraft) palette files, because why not? Well, maybe because it can give false positives and thereby return garbage data for a file instead of an error saying it couldn't be parsed
* Loads from files that aren't intended specifically as palettes, but that have CSS-style color values in them (.css, .html, .svg, .js, etc.)


## Use cases

* Image editor
	* On file drop or file selection...
		* Load palette if it's a palette file
		* Load image into editor (don't generate palette from image (unless you're specifically loading a palette, like by dropping a file onto a palette widget))
	* Display any error messages (in a friendly way)
* Palette Editor
	* Load palette from palette file
	* Pick colors from image file (there are modules for this)
	* Display any error messages (perhaps more detailed? or, it could be the same and just have an expandable view for details, which might be more "friendly" when you need it!)
	* Save palettes
	  (**not implemented**;
	  to do this, the whole project should probably move to
	  [jBinary](https://github.com/jDataView/jBinary))
* From Node.js
	* Load palette from Buffer or file
	* OPTIONALLY pick colors from image file (there are modules for this)
	* Use Node style callbacks `(err, result)->`
* [Demo](https://1j01.github.io/palette.js/test)
  (a niche "use case")
	* Load palettes from lots of palette files
	* Maybe pick colors from an image (there are modules for this)
	* Display extra information like what palette loader was used


## License

MIT-licensed, see [LICENSE](LICENSE)


## Documentation

`Palette` is both a namespace containing functions for loading palettes and classes for reading the results, and the class that holds color swatches.

Accessible as
* ~~`require("palette.js")` in node~~ (COMING (maybe) SOON: an npm module, altho under a different name; I'm planning on renaming the project to something a little less generic) or
* `Palette` in browser

### `Palette.load(options, callback)`

Knowing the file extension means Palette.js can often pick the correct palette loader right away, which can give speed improvements, and also some loaders won't load except via their specific file extension because they can't determine if the file is actually in that format or not (for raw data formats without headers).

- `options.file` - the palette file to load, as a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File)
- `options.data` - the palette file data to load, as a binary string (**not** an ArrayBuffer/TypedArray/DataView)
- `options.filePath` - a path to a palette file, for Node.js usage
- `options.fileName` (optional) - the file name, if you have it, including the file extension - can be obtained from `options.file` or `options.filePath`
- `options.fileExt` (optional) - the file extension, if you have it, *excluding* the dot, e.g. `"pal"` - can be obtained from `options.fileName` or `options.file` or `options.filePath`
- `callback(error, palette)` (required) - called when palette loading is finished, either with an error (in the first argument) or a `Palette` (in the second argument)

### `Palette.load(file, callback)`

Shortcut to load from a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) - equivalent to passing `{file: file}` as options.

### `Palette.load(filePath, callback)`

Shortcut to load from a file path in Node.js - equivalent to passing `{filePath: filePath}` as options.

### class `Palette` extends `Array`

Accessible as
* ~~`require("palette.js")` in node,~~ (COMING SOON maybe: an npm module, altho under a different name; I'm gonna rename the project to be a little less generic) or
* `Palette` in browser, or
* `Palette.Palette` for consistency, or
* `Palette.Palette.Palette` for redundancy.


Stores a list of Colors and additional data

Some palette formats are commonly made variable size by just leaving unused slots a certain color
such as `#000` or `#00F`.
By default, duplicates are removed.
You can get all duplicates with `palette.with_duplicates`


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
	* Adobe Color files (`.aco`) used in Photoshop
	* Adobe Swatch Exchange (`.ase`) (Illustrator and InDesign) - see [ase-to-sketchpalette](https://github.com/andrewfiorillo/ase-to-sketchpalette/), [adobe-swatch-exchange](https://github.com/hughsk/adobe-swatch-exchange)
	* Sketch (`.sketchpalette`) - see [sketch-palettes](https://github.com/andrewfiorillo/sketch-palettes)
	* Skencil (`.spl`) - examples: https://wald.intevation.org/scm/viewvc.php/skencil/trunk/Resources/Misc/?root=skencil
	* Magica Voxel PNG (single pixel color strip)
	* maayyybe
		* KDE (`.colors`)
		* ASCII Color Format (`.acf`)
		* XML-based:
			* Adobe Color Book Legacy (`.acbl`)
			* AutoCAD Color Book (`.acb`)
			* QuarkXPress Color Library (`.qcl`)
			* Scribus (`.xml`)
			* sK1 (`.skp`)
			* StarOffice / OpenOffice.org / LibreOffice (`.soc`)


* Less false positives
  (pretty much anything can be loaded as raw color data)


* Improve support for palette geometries


* Improve API and documentation


* Publish to npm


## Development

	git clone https://github.com/1j01/palette.js.git
	git submodule update --init
	npm install
	npm run watch

And then start up a webserver, e.g.

	python -m SimpleHTTPServer

or better yet [Live Server](https://www.npmjs.com/package/live-server)

Run `npm test` to update a `regression-data` folder, and then view any changes with git.  
If the changes are good/positive, that's good! Commit the changes along with the source code.  
If the changes are bad/negative, try to fix the regression.  
