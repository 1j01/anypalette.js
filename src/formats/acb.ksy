meta:
  id: acb
  file-extension: acb
  application: Adobe Photoshop
  tags: palette
  license: CC0-1.0
  endian: be
  xref:
    wikidata: Q27907415
doc: |
  Adobe Color Book files are color palette files that Photoshop loads,
  but does not have support for editing.
doc-ref: http://magnetiq.com/pages/acb-spec/
seq:
  - id: magic
    contents: "8BCB"
  - id: version
    contents: [0x00, 0x01]
  - id: identifier
    type: u2
  - id: title
    type: unicode_string
  - id: color_name_prefix
    type: unicode_string
  - id: color_name_suffix
    type: unicode_string
  - id: description
    type: unicode_string
  - id: color_count
    type: u2
    valid:
      max: 8000
  - id: colors_per_page
    type: u2
    valid:
      max: 9
  - id: key_color_page
    type: u2
    valid:
      max: colors_per_page
  - id: color_space
    type: u2
    enum: color_space_type
  - id: colors
    type: color
    repeat: expr
    repeat-expr: color_count
types:
  unicode_string:
    seq:
      - id: length
        type: u4
      - id: data
        type: str
        encoding: UTF-16BE
        size: length * 2
    doc: |
      UTF-16 encoded string.
      Some replacements should be made: "^R" -> "®", "^C" -> "©"
  color:
    seq:
    - id: name
      type: unicode_string
    - id: code
      size: 6
      type: str
      encoding: ASCII
      doc: Unique key for the color
    - id: w
      type: u1
    - id: x
      type: u1
      if: _root.color_space != color_space_type::grayscale
    - id: y
      type: u1
      if: _root.color_space != color_space_type::grayscale
    - id: z
      type: u1
      if: _root.color_space == color_space_type::cmyk or _root.color_space == color_space_type::wide_cmyk
enums:
  color_space_type:
    0: rgb # Red, Green, Blue
    1: hsb #*
    2: cmyk # Cyan, Magenta, Yellow, blacK (Key)
    3: pantone #*
    4: focoltone #*
    5: trumatch #*
    6: toyo #*
    7: lab # L*a*b* (CIELAB D50)
    8: grayscale #*
    9: wide_cmyk #*
    10: hks #*
    11: dic #*
    12: total_ink #*
    13: monitor_rgb #*
    14: duotone #*
    15: opacity #*
    16: web #*
    17: gray_float #*
    18: rgb_float #*
    19: opacity_float #*
    #*: Photoshop 7.0 probably doesn't support these spaces for ACB files.
