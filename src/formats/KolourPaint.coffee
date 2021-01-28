
# Read/write KDE RGB Palette / KolourPaint / KOffice palette (.colors)

{parse_gimp_or_kde_rgb_palette, write_gimp_or_kde_rgb_palette} = require "./GIMP"

module.exports.read_kolourpaint_palette = ({fileContentString})->
	parse_gimp_or_kde_rgb_palette(fileContentString, "KDE RGB Palette")

module.exports.write_kolourpaint_palette = (palette)->
	write_gimp_or_kde_rgb_palette(palette, "KDE RGB Palette")

module.exports.extension = "colors";
