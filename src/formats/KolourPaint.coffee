
# Read/write KDE RGB Palette / KolourPaint / KOffice palette (.colors)

{parse_gimp_or_kde_rgb_palette, write_gimp_or_kde_rgb_palette} = require "./GIMP"

module.exports = ({data})->
	parse_gimp_or_kde_rgb_palette(data, "KDE RGB Palette")

module.exports.write = (palette)->
	write_gimp_or_kde_rgb_palette(palette, "KDE RGB Palette")

module.exports.extension = "colors";
