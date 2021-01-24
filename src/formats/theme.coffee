# Load Windows .theme and .themepack files

Palette = require "../Palette"

parseINIString = (fileContentString)->
	regex = 
		section: /^\s*\[\s*([^\]]*)\s*\]\s*$/
		param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/
		comment: /^\s*;.*$/
	value = {}
	lines = fileContentString.split(/[\r\n]+/)
	section = null
	lines.forEach (line)->
		if regex.comment.test(line)
			return
		else if regex.param.test(line)
			match = line.match(regex.param)
			if section
				value[section][match[1]] = match[2]
			else
				value[match[1]] = match[2]
		else if regex.section.test(line)
			match = line.match(regex.section)
			value[match[1]] = {}
			section = match[1]
		else if line.length is 0 and section
			section = null
		return
	value

parseThemeFileString = (themeIni)->
	# .theme is a renamed .ini text file
	# .themepack is a renamed .cab file, and parsing it as .ini seems to work well enough for the most part, as the .ini data appears in plain,
	# but it may not if compression is enabled for the .cab file
	theme = parseINIString(themeIni)
	colors = theme["Control Panel\\Colors"]
	if not colors
		throw new Error("Invalid theme file, no [Control Panel\\Colors] section")
	
	palette = new Palette
	for key of colors
		# for .themepack file support, just ignore bad keys that were parsed
		if not key.match(/\W/)
			components = colors[key].split(" ")
			if components.length is 3
				for component, i in components
					components[i] = parseInt(component, 10)
				if components.every((component)-> isFinite(component))
					palette.add
						red: components[0] / 255
						green: components[1] / 255
						blue: components[2] / 255
						name: key
	palette.name = theme["Theme"]?.DisplayName # or theme["General"]?.Name for KDE .colors
	palette

module.exports = ({fileContentString})->
	parseThemeFileString fileContentString
