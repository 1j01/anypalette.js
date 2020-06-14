
# AnyPalette.js

There are a LOT of different types of palette files.

ONE LIBRARY SHALL RULE THEM ALL

[Let's load some palettes](https://1j01.github.io/anypalette.js/demo)


## Features

AnyPalette.js has a single interface for all formats, so you can load any of the supported file types with one call,
and it'll choose an appropriate parser to use automatically.

It can even load from files that aren't intended specifically as palettes, but that have CSS-style color values in them (.css, .html, .svg, .js, etc.)

Works in Node.js and in the browser.

Supported palette formats:

| File Extension    | Name                              | Programs                                                                          |   Read  |  Write  |
|-------------------|-----------------------------------|-----------------------------------------------------------------------------------|:-------:|:-------:|
| .pal              | [RIFF] Palette                    | [MS Paint] for Windows 95 and Windows NT 4.0                                      |   ✅   | Planned |
| .gpl              | [GIMP][Gimp] Palette              | [Gimp], [Inkscape], [Krita], [KolourPaint], [Scribus], [CinePaint], [MyPaint]     |   ✅   | Planned |
| .txt              | [Paint.NET] Palette               | [Paint.NET]                                                                       |   ✅   | Planned |
| .pal, .psppalette | [Paint Shop Pro] Palette          | [Paint Shop Pro][] (Jasc Software / Corel)                                        |   ✅   | Planned |
| .hpl              | [Homesite] Palette                | Allaire [Homesite] / Macromedia [ColdFusion]                                      |   ✅   |         |
| .cs               | ColorSchemer                      | ColorSchemer Studio                                                               |   ✅*  | Planned |
| .pal              | [Starcraft] Palette               | [Starcraft]                                                                       |   ✅   |         |
| .wpe              | [Starcraft] Terrain Palette       | [Starcraft]                                                                       |   ✅   |         |
| .sketchpalette    | [Sketch] Palette                  | [Sketch]                                                                          |   ✅   | Planned |
| .spl              | [Skencil] Palette                 | [Skencil] (formerly called Sketch)                                                |   ✅   |         |
| .colors           | KolourPaint Color Collection      | [KolourPaint]                                                                     |   ✅   |         |
| .colors           | Plasma Desktop Color Scheme       | [KDE] Plasma Desktop                                                              |   ✅   |         |
| .theme            | Windows Theme                     | [Windows] Desktop                                                                 |   ✅   |         |
| .themepack        | Windows Theme                     | [Windows] Desktop                                                                 |   ✅   |         |

\*The ColorSchemer file parser is only enabled when a file name is available, either thru passing a `File` object, or providing `options.fileName`, and the file extension is `.cs`

UNSUPPORTED palette formats (for now):

| File Extension    | Name                              | Programs                                                                          |   Read  |  Write  |
|-------------------|-----------------------------------|-----------------------------------------------------------------------------------|:-------:|:-------:|
| .gpa              | [Gpick] Palette                   | [Gpick]                                                                           | Planned |         |
| .aco              | Adobe Color Swatches              | Adobe [Photoshop]                                                                 | Planned | Planned |
| .act              | Adobe Color Table                 | Adobe [Photoshop] and [Illustrator]                                               | Planned | Planned |
| .ase              | Adobe Swatch Exchange             | Adobe [Photoshop], [InDesign], and [Illustrator]                                  | Planned | Planned |
| .acbl             | Adobe Color Book Library / Legacy | Adobe [InDesign] and [Illustrator]                                                | Planned | Planned |
| .soc              | StarOffice Colors                 | [StarOffice], [OpenOffice], [LibreOffice]                                         | Planned | Planned |


[RIFF]: https://en.wikipedia.org/wiki/Resource_Interchange_File_Format
[MS Paint]: https://en.wikipedia.org/wiki/Microsoft_Paint
[Paint.NET]: https://www.getpaint.net/
[Paint Shop Pro]: https://www.paintshoppro.com/en/
[Starcraft]: https://en.wikipedia.org/wiki/StarCraft
[Homesite]: https://en.wikipedia.org/wiki/Macromedia_HomeSite
[ColdFusion]: https://en.wikipedia.org/wiki/Adobe_ColdFusion
[StarOffice]: https://en.wikipedia.org/wiki/StarOffice
[OpenOffice]: https://www.openoffice.org/
[LibreOffice]: https://www.libreoffice.org/
[Sketch]: https://www.sketchapp.com/
[Skencil]: https://skencil.org/
[Gpick]: http://www.gpick.org/
[Photoshop]: https://www.adobe.com/products/photoshop.html
[InDesign]: https://www.adobe.com/products/indesign.html
[Illustrator]: https://www.adobe.com/products/illustrator.html
[Gimp]: https://www.gimp.org/
[Inkscape]: https://inkscape.org/en/
[Krita]: https://www.calligra.org/krita/
[KolourPaint]: http://kolourpaint.org/
[KDE]: https://kde.org/
[Windows]: https://en.wikipedia.org/wiki/Microsoft_Windows
[Scribus]: https://www.scribus.net/
[CinePaint]: http://www.cinepaint.org/
[MyPaint]: http://mypaint.org/
[Blender]: https://www.blender.org/


Picking colors from an image can be done by other libraries, like [vibrant.js]/[node-vibrant]

[vibrant.js]: https://jariz.github.io/vibrant.js/
[node-vibrant]: https://github.com/akfish/node-vibrant


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

**Alternatively**, download [`build/anypalette.js`](build/anypalette.js) and include it as a script:

```html
<script src="anypalette.js"></script>
```

This will create a global `AnyPalette`

This library uses UMD, so you can also load it with AMD or CommonJS (in which case it won't create a global).


## API

See the [changelog](CHANGELOG.md) for upgrading.
Properties and methods not documented here may break without notice.

### `AnyPalette.loadPalette(options, callback)`

Knowing the file extension means AnyPalette.js can often pick the correct palette loader right away, which can improve the load speed, and also (TODO:) some loaders won't load except via their specific file extension because they can't determine if the file is actually in that format or not (for raw data formats without headers).

- `options.file` - the palette file to load, as a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File)
- `options.data` - the palette file data to load, as a binary string (**not** an ArrayBuffer/TypedArray/DataView)
- `options.filePath` - a path to a palette file, for Node.js usage
- `options.fileName` (optional) - the file name, if you have it, including the file extension - can be obtained from `options.file` or `options.filePath`
- `options.fileExt` (optional) - the file extension, if you have it, *excluding* the dot, e.g. `"pal"` - can be obtained from `options.fileName` or `options.file` or `options.filePath`
- `callback(error, palette)` (required) - called when palette loading is finished, either with an error (in the first argument) or a `Palette` (in the second)

Note: the callback is asynchronous to allow for file loading, but all the palette parsing is currently synchronous.

### `AnyPalette.loadPalette(file, callback)`

Shortcut to load from a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) - equivalent to passing `{file: file}` for `options`.

### `AnyPalette.loadPalette(filePath, callback)`

Shortcut to load from a file path in Node.js - equivalent to passing `{filePath: filePath}` for `options`.


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

#### `palette.numberOfColumns`

`palette.numberOfColumns` may contain a number of columns for the palette to fit into (with the number of rows being implicit).  
You should ignore an `numberOfColumns` of zero, and may want to ignore this property entirely.

Currently only GIMP palettes will have this specified, but geometry guessing is planned.

You should use `palette.withDuplicates` (and `palette.withDuplicates.numberOfColumns`) to work with file-specified geometry.


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


* Save palettes to different formats. [jBinary](https://github.com/jDataView/jBinary) may be helpful.


* Load *all the palettes!*
	* Adobe Color files (`.aco`) used in Photoshop
	* Adobe Swatch Exchange (`.ase`) used in Photoshop, Illustrator and InDesign
	* Magica Voxel Palette (`.png`) - see [MagicaVoxelPalettes](https://github.com/mattperrin/MagicaVoxelPalettes) for examples
	* macOS Color Palette (`.clr`)
	* Gpick Palette (`.gpa`)
	* Low priority
		* ASCII Color Format (`.acf`)
		* Binary Color Format (`.bcf`)
		* Alias/WaveFront Material (`.mtl`)
		* XML-based:
			* Adobe Color Book Legacy (`.acbl`)
			* AutoCAD Color Book (`.acb`)
			* QuarkXPress Color Library (`.qcl`)
			* Scribus (`.xml`)
			* sK1 (`.skpx` / `.skp`)
			* StarOffice / OpenOffice.org / LibreOffice (`.soc`)


* Prevent false positive parsing of unsupported file types


* Guess palette geometries


* Load from a Buffer in Node.js, maybe even a Stream (altho streaming would mostly involve collecting it into a buffer),
and from an ArrayBuffer in the browser


## Contributing

<!-- See CONTRIBUTING.md -->

### Development Setup

* Install Node.js, if you don't already have it. (It comes with `npm`)

* [Fork and clone](https://help.github.com/articles/fork-a-repo/) the repository

* The repo has a git submodule, so in the repository folder run `git submodule update --init`

* Install dependencies with `npm install`

### Development Workflow

`npm start` will start a server and open a page in your default browser;
it'll rebuild the library when changes to the source files are detected, and it'll auto-reload the page

Run `npm test` to update a `regression-data` folder, and then view any changes with git.  
If the changes are good/positive, that's good! Commit the changes along with the source code.  
If the changes are bad/negative, try to fix the regression.  

Don't commit `build/anypalette.js` until cutting a release
(to reduce noise and avoid conflicts when reverting and such).

Update [CHANGELOG.md](CHANGELOG.md)'s [Unreleased] section with any notable changes,
following the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.
(Include any information someone upgrading the library might need to know.)

When pulling changes (e.g. syncing a fork) you may need to `npm install` again to update the dependencies.

### To cut a release

The process is currently something like this:

In [CHANGELOG.md](CHANGELOG.md), replace the [Unreleased] section with the next version number
(TODO: use [update-changelog](https://github.com/ukatama/update-changelog) (altho it doesn't support links to commit ranges; [this does, but it's for a different ecosystem](https://github.com/pajapro/fastlane-plugin-changelog)), and update the build within `npm version`)

	npm run build
	npm test
	git diff tests/ # there shouldn't be changes to the test data at this point, that should ideally happen in earlier commits
	git add -A && git commit -m "Update for release"
	npm version minor # or major or patch
	git push --follow-tags # better than --tags!
	npm publish
