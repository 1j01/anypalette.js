# TODO: DRY with CSS.coffee
module.exports.parse_css_hex_color = (hex_color)->
	hex = (x)-> parseInt(x, 16)
	
	match = hex_color.match(///
		\# # hashtag # #/
		(
			[0-9A-F]{3} # three hex-digits (#A0C)
			|
			[0-9A-F]{6} # six hex-digits (#AA00CC)
			|
			[0-9A-F]{4} # with alpha, four hex-digits (#A0CF)
			|
			[0-9A-F]{8} # with alpha, eight hex-digits (#AA00CCFF)
		)
		(?![0-9A-F]) # (and no more!)
	///gim)

	[$0, $1] = match

	if $1.length > 4
		red: hex($1[0] + $1[1]) / 255
		green: hex($1[2] + $1[3]) / 255
		blue: hex($1[4] + $1[5]) / 255
		alpha: if $1.length is 8 then hex($1[6] + $1[7]) / 255 else 1 # TODO: not else 1
	else
		red: hex($1[0] + $1[0]) / 255
		green: hex($1[1] + $1[1]) / 255
		blue: hex($1[2] + $1[2]) / 255
		alpha: if $1.length is 4 then hex($1[3] + $1[3]) / 255 else 1 # TODO: not else 1
