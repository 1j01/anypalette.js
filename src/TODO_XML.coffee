
if DOMParser?
	parse_xml = (str)->
		new DOMParser().parseFromString(str, "text/xml")
	
else if new ActiveXObject?("Microsoft.XMLDOM")
	parse_xml = (str)->
		doc = new ActiveXObject("Microsoft.XMLDOM")
		doc.async = "false"
		doc.loadXML(str)
		doc
else
	throw new Error "No XML parser found"
