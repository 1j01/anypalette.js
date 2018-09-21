
# AnyPalette.js

There are a LOT of different types of palette files.

ONE LIBRARY SHALL RULE THEM ALL

[Let's load some palettes](https://1j01.github.io/anypalette.js/test)


## Features

AnyPalette.js has a single interface for all formats, so you can load any of the supported file types with one call,
and it'll choose an appropriate parser to use automatically.

Supported palette formats:

* [RIFF] PAL (.pal)
* [Paint.NET] palette (.txt)
* [GIMP][Gimp] palette (.gpl), also used in [Inkscape], [CinePaint], and [Krita]
* [Paint Shop Pro] palette (.pal, .psppalette) (JASC / Corel)
* ColorSchemer palette (.cs)
* Whatever HPL stands for (.hpl) (Homesite PaLette?), used by Allaire Homesite / Macromedia ColdFusion
* [Starcraft] palette files, because why not? Well, maybe because it can give false positives and thereby return garbage data for a file instead of an error saying it couldn't be parsed
* Loads from files that aren't intended specifically as palettes, but that have CSS-style color values in them (.css, .html, .svg, .js, etc.)


| File Extension    | Name                              | Programs                                                                          |   Read  |  Write  |
|-------------------|-----------------------------------|-----------------------------------------------------------------------------------|:-------:|:-------:|
| .pal              | [RIFF] Palette                    | [MS Paint] for Windows 95 and Windows NT 4.0                                      |   ✅   | Planned |
| .gpl              | [GIMP][Gimp] Palette              | [Gimp], [Inkscape], [Krita], [KolourPaint], [Scribus], [CinePaint], [MyPaint]     |   ✅   | Planned |
| .txt              | [Paint.NET] Palette               | [Paint.NET]                                                                       |   ✅   | Planned |
| .pal, .psppalette | [Paint Shop Pro] Palette          | [Paint Shop Pro][] (Jasc Software / Corel)                                        |   ✅   | Planned |
| .hpl              | [Homesite] Palette                | Allaire [Homesite] / Macromedia [ColdFusion]                                      |   ✅   |         |
| .cs               | ColorSchemer Studio Color Scheme  | ColorSchemer Studio                                                               |   ✅   |         |
| .aco              | Adobe Color file                  | Adobe [Photoshop]                                                                 | Planned | Planned |
| .ase              | Adobe Swatch Exchange             | Adobe [Photoshop], [InDesign], and [Illustrator]                                  | Planned | Planned |
| .acbl             | Adobe Color Book Library/Legacy   | Adobe [InDesign] and [Illustrator]                                                | Planned |         |
| .soc              | StarOffice Colors                 | StarOffice, [OpenOffice], [LibreOffice]                                           | Planned | Planned |
| .*                | And many more...                  | ...                                                                               | Planned | Planned |


[RIFF]: https://en.wikipedia.org/wiki/Resource_Interchange_File_Format
[MS Paint]: https://en.wikipedia.org/wiki/Microsoft_Paint
[Paint.NET]: https://www.getpaint.net/
[Paint Shop Pro]: https://www.paintshoppro.com/en/
[Starcraft]: https://en.wikipedia.org/wiki/StarCraft
[Homesite]: https://en.wikipedia.org/wiki/Macromedia_HomeSite
[StarOffice]: https://en.wikipedia.org/wiki/StarOffice
[OpenOffice]: https://www.openoffice.org/
[LibreOffice]: https://www.libreoffice.org/
[ColdFusion]: https://en.wikipedia.org/wiki/Adobe_ColdFusion
[Photoshop]: https://www.adobe.com/products/photoshop.html
[InDesign]: https://www.adobe.com/products/indesign.html
[Illustrator]: https://www.adobe.com/products/illustrator.html

[Gimp]: https://www.gimp.org/
[Inkscape]: https://inkscape.org/en/
[Krita]: https://www.calligra.org/krita/
[KolourPaint]: http://kolourpaint.org/
[Scribus]: https://www.scribus.net/
[CinePaint]: http://www.cinepaint.org/
[MyPaint]: http://mypaint.org/
[Blender]: https://www.blender.org/


## Use cases

* Image editor
	* On file drop or file selection...
		* Load palette if it's a palette file
		* Load image into editor (don't generate palette from image (unless you're specifically loading a palette, like by dropping a file onto a palette widget))
	* Display any error messages
* Palette Editor
	* Load palette from palette file
	* Pick colors from image file (not implemented; there are other libraries for this)
	* Display any error messages
	* Save palettes to different formats
	  (not implemented;
	  to do this, the whole project should probably move to
	  [jBinary](https://github.com/jDataView/jBinary);
	  but text based formats should be pretty easy!)
* From Node.js
	* Load palette from Buffer or file
	* Maybe pick colors from image file (not implemented; there are other libraries for this)
	* Maybe save palettes
	* Use Node style callbacks `(err, result)->`
* [Demo](https://1j01.github.io/anypalette.js/test)
  (a niche "use case")
	* Load palettes from lots of palette files
	* Maybe pick colors from an image (not implemented; there are other libraries for this)
	* Display extra information like what palette loader was used


## License

MIT-licensed, see [LICENSE](LICENSE)


## Install

For Node.js / Webpack / Parcel / Rollup / Browserify:
```
npm i anypalette --save
```

Then access the library with:
```javascript
const AnyPalette = require("anypalette");
```

Alternatively, download [`build/anypalette.js`](build/anypalette.js) and include it as a script:

```html
<script src="anypalette.js"></script>
```

This will create a global `AnyPalette`

This file uses a Universal Module Definition, so you can also load it with AMD or CommonJS (in which case it won't create a global).


## API Documentation

Only what's documented should be considered part of the API.

Not following semver yet.

### `AnyPalette.load(options, callback)`

Knowing the file extension means AnyPalette.js can often pick the correct palette loader right away, which can improve the load speed, and also (TODO:) some loaders won't load except via their specific file extension because they can't determine if the file is actually in that format or not (for raw data formats without headers).

- `options.file` - the palette file to load, as a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File)
- `options.data` - the palette file data to load, as a binary string (**not** an ArrayBuffer/TypedArray/DataView)
- `options.filePath` - a path to a palette file, for Node.js usage
- `options.fileName` (optional) - the file name, if you have it, including the file extension - can be obtained from `options.file` or `options.filePath`
- `options.fileExt` (optional) - the file extension, if you have it, *excluding* the dot, e.g. `"pal"` - can be obtained from `options.fileName` or `options.file` or `options.filePath`
- `callback(error, palette)` (required) - called when palette loading is finished, either with an error (in the first argument) or a `Palette` (in the second)

Note: the callback is asynchronous to allow for file loading, but all palette parsing is currently synchronous.

### `AnyPalette.load(file, callback)`

Shortcut to load from a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) - equivalent to passing `{file: file}` as `options`.

### `AnyPalette.load(filePath, callback)`

Shortcut to load from a file path in Node.js - equivalent to passing `{filePath: filePath}` as `options`.


### class `Palette` extends `Array`

(Accessible as `AnyPalette.Palette`)


Stores a list of Colors, with some additional data.

Because `Palette` is a subclass of `Array`, you can use `forEach`, `map`, `join` and other methods,
or access the colors via indexing e.g. `palette[0]` and loop over them using `palette.length`

#### `palette.withDuplicates`

Some palette formats are commonly made variable size by just leaving unused slots a certain color
such as `#000` or `#00F`.
So by default, duplicates are removed.
You can get all duplicates with `palette.withDuplicates` (which is another `Palette`)

#### `palette.nColumns`

`palette.nColumns` may contain a number of columns for the palette to fit into (with the number of rows being implicit).  
You should ignore an `nColumns` of zero, and may want to ignore this property entirely.

Currently only GIMP palettes will have this specified, but dimension guessing is planned.


### class `Color`

(Accessible as `AnyPalette.Color`)


`Color` has a `toString` method that returns a CSS color.  
You can therefore pass a Color object directly to an element's style or a canvas's context.

```javascript
var color = palette[0];
div.style.background = color;
ctx.fillStyle = color;
```

See [Using JavaScript's 'toString' Method](http://adripofjavascript.com/blog/drips/using-javascripts-tostring-method.html), which incidentally uses a `Color` class as an example.

`Color` objects also have `r`, `g`, `b` properties, **OR** `h`, `s`, `l`, depending on how they were loaded

Also for GIMP palettes, a `Color` may have a `name` (string or undefined)


## Todo


* Save palettes to different formats. [jBinary](https://github.com/jDataView/jBinary) should be helpful.


* Load *all the palettes!*
	* Adobe Color files (`.aco`) used in Photoshop
	* Adobe Swatch Exchange (`.ase`) (Illustrator and InDesign) - see [ase-to-sketchpalette](https://github.com/andrewfiorillo/ase-to-sketchpalette/) (JS with jDataView), [adobe-swatch-exchange](https://github.com/hughsk/adobe-swatch-exchange) (Node.js), [color-palette](https://github.com/portnov/color-palette/blob/master/palette-editor/palette/storage/ase.py) (Python)
	* Sketch Palette (`.sketchpalette`) - see [sketch-palettes](https://github.com/andrewfiorillo/sketch-palettes)
	* Skencil Palette (`.spl`) - examples: https://wald.intevation.org/scm/viewvc.php/skencil/trunk/Resources/Misc/?root=skencil
	* Magica Voxel Palette (`.png`) (single pixel color strip) - see [MagicaVoxelPalettes](https://github.com/mattperrin/MagicaVoxelPalettes) for examples
	* macOS Color Palette (`.clr`)
	* [Gpick](http://www.gpick.org/) Palette (`.gpa`)
	* KDE Colors (`.colors`)
	* maayyybe
		* ASCII Color Format (`.acf`)
		* Binary Color Format (`.bcf`)
		* Alias/WaveFront Material (`.mtl`)
		* XML-based:
			* Adobe Color Book Legacy (`.acbl`)
			* AutoCAD Color Book (`.acb`)
			* QuarkXPress Color Library (`.qcl`)
			* Scribus (`.xml`)
			* sK1 (`.skp`)
			* StarOffice / OpenOffice.org / LibreOffice (`.soc`)


* Prevent false positives from formats that are raw data without headers


* Guess palette geometries


## Development

	git clone https://github.com/1j01/anypalette.js.git
	cd anypalette.js
	git submodule update --init
	npm install
	npm run watch

Note: this watch task will actually just crash if there's a syntax error

Then (concurrently, in a separate terminal) start up a webserver, e.g.

	python -m SimpleHTTPServer

or better yet [Live Server](https://www.npmjs.com/package/live-server)

	npm i -g live-server
	live-server

Run `npm test` to update a `regression-data` folder, and then view any changes with git.  
If the changes are good/positive, that's good! Commit the changes along with the source code.  
If the changes are bad/negative, try to fix the regression.  
