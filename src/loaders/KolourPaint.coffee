
# Load a KDE RGB Palette / KolourPaint / KOffice palette (.colors)

{parse_gimp_or_kde_rgb_palette} = require "./GIMP"

module.exports = ({data})->
	parse_gimp_or_kde_rgb_palette(data, "KDE RGB Palette")
