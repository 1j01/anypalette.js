
# Write a KDE RGB Palette / KolourPaint / KOffice palette (.colors)

{write_gimp_or_kde_rgb_palette} = require "./GIMP"

module.exports = (palette)->
	write_gimp_or_kde_rgb_palette(palette, "KDE RGB Palette")

module.exports.extension = "colors";