
# Load tabular RGB values

Palette = require "../Palette"

module.exports.read_tabular_colors = ({fileContentString})->
	lines = fileContentString.split(/[\n\r]+/m)
	palettes = [
		csv_palette = new Palette()
		ssv_palette = new Palette()
	]
	try_parse_line = (line, palette, regexp)->
		match = line.match(regexp)
		if match
			# If the RGB match is at the start or end,
			# the remainder of the line may make a good name.
			# If it's in the middle, simply removing the RGB part could yield weird names,
			# like '<color cs="RGB" tints="" name="Lime" />' where the RGB data was taken out of 'tints'
			# The whole line could be used as a semi-reasonable color name, although obviously
			# ideally it should use the XML parameter 'name' in that case.
			# @TODO: handle XML name parameter somehow, perhaps generically, perhaps specifically
			# @TODO: handle MTL format (it's picking up some keywords as names, although that format should ideally be handled specially)
			# (Should it ignore all names if the names it finds are not mostly unique? Would be ugly, since there may be a case for duplicate color names in practice, but it could avoid some false positives.)
			name = line
			if match.index is 0
				name = name[match[0].length..]
			else if match.index is line.length - match[0].length
				name = name[..(line.length - match[0].length - 1)]
			else
				name = undefined
			# trim whitespace and some symbols
			name = name?.replace(/^[\s=:,;/|]+|[\s=:,;/|]+$/g, "")

			# debug
			# name = "match.index = #{match.index}, line.length - match[0].length = #{line.length - match[0].length}, name = #{JSON.stringify(name)}"

			palette.add
				red: Number(match[1]) / 255
				green: Number(match[2]) / 255
				blue: Number(match[3]) / 255
				name: name
	for line in lines
		try_parse_line line, csv_palette, /([0-9]*\.?[0-9]+),\s*([0-9]*\.?[0-9]+),\s*([0-9]*\.?[0-9]+)/
		try_parse_line line, ssv_palette, /([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)/
	
	most_colors = []
	for palette in palettes
		if palette.length >= most_colors.length
			most_colors = palette
	
	n = most_colors.length
	if n < 4
		throw new Error([
			"No colors found"
			"Only one color found"
			"Only a couple colors found"
			"Only a few colors found"
		][n] + " (#{n})")
	
	if most_colors.every((color)-> color.red <= 1/255 and color.green <= 1/255 and color.blue <= 1/255)
		most_colors.forEach (color)->
			color.red *= 255
			color.green *= 255
			color.blue *= 255

	most_colors
