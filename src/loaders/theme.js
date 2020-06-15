// Load Windows .theme and .themepack files

var Palette = require("../Palette");

function parseINIString(data){
	var regex = {
		section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
		param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
		comment: /^\s*;.*$/
	};
	var value = {};
	var lines = data.split(/[\r\n]+/);
	var section = null;
	lines.forEach(function(line){
		if(regex.comment.test(line)){
			return;
		}else if(regex.param.test(line)){
			var match = line.match(regex.param);
			if(section){
				value[section][match[1]] = match[2];
			}else{
				value[match[1]] = match[2];
			}
		}else if(regex.section.test(line)){
			var match = line.match(regex.section);
			value[match[1]] = {};
			section = match[1];
		}else if(line.length == 0 && section){
			section = null;
		};
	});
	return value;
}

function parseThemeFileString(themeIni) {
	// .theme is a renamed .ini text file
	// .themepack is a renamed .cab file, and parsing it as .ini seems to work well enough for the most part, as the .ini data appears in plain,
	// but it may not if compression is enabled for the .cab file
	var theme = parseINIString(themeIni);
	var colors = theme["Control Panel\\Colors"];
	if (!colors) {
		throw new Error("Invalid theme file, no [Control Panel\\Colors] section");
	}
	var palette = new Palette();
	for (var k in colors) {
		// for .themepack file support, just ignore bad keys that were parsed
		if (!k.match(/\W/)) {
			var components = colors[k].split(" ");
			if (components.length === 3) {
				for (var i = 0; i < components.length; i++) {
					components[i] = parseInt(components[i], 10);
				}
				if (components.every((component)=> isFinite(component))) {
					palette.add({
						r: components[0],
						g: components[1],
						b: components[2],
						name: k,
					});
				}
			}
		}
	}

	return palette;
}

module.exports = ({data})=> {
	return parseThemeFileString(data);
};
