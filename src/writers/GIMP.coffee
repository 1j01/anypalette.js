write_gimp_or_kde_rgb_palette = (palette, format_name)->
	"""
	#{format_name or "GIMP Palette"}
	Name: #{palette.name or "Saved Colors"}
	Columns: #{palette.numberOfColumns or 8}
	#
	#{palette.map((color)=>
		{r, g, b} = color
		"#{[r, g, b].map((component)=> "#{component}".padEnd(3, " ")).join(" ")}   #{color}"
	).join("\n")}
	"""

module.exports = (palette)->
	write_gimp_or_kde_rgb_palette(palette, "GIMP Palette")

module.exports.extension = "gpl";

module.exports.write_gimp_or_kde_rgb_palette = write_gimp_or_kde_rgb_palette
