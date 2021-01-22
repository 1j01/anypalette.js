meta:
  id: ase
  file-extension: ase
  application:
    - Adobe Photoshop
    - Adobe InDesign
    - Adobe Illustrator
  tags:
    - color
    - palette
  license: CC0-1.0
  endian: be
  xref:
    wikidata: Q27979314
doc: |
  Adobe Swatch Exchange is a format for exchanging color palettes.
seq:
  - id: magic
    contents: "ASEF"
  - id: version
    type: u4
  - id: number_of_blocks
    type: u4
  - id: blocks
    type: block
    repeat: expr
    repeat-expr: number_of_blocks
types:
  block:
    seq:
    - id: type
      type: u2
      enum: block_type
    - id: length
      type: u4
    - id: body
      size: length
      type:
        switch-on: type
        cases:
          'block_type::group_start': group_start
          'block_type::group_end': group_end
          'block_type::color': color
  group_end:
    seq: []
  group_start:
    seq:
    - id: name_length
      type: u2
      doc: Length in codepoints, including a null terminator
    - id: name
      type: str
      encoding: UTF-16BE
      size: (name_length - 1) * 2
    - id: name_terminator
      contents: [0x00, 0x00]
  color:
    seq:
    - id: name_length
      type: u2
      doc: Length in codepoints, including a null terminator
    - id: name
      type: str
      encoding: UTF-16BE
      size: (name_length - 1) * 2
    - id: name_terminator
      contents: [0x00, 0x00]
    - id: color_space
      type: str
      encoding: ASCII
      size: 4
    - id: color_data
      type:
        switch-on: color_space
        cases:
          '"RGB "': rgb_color
          '"CMYK"': cmyk_color
          '"GRAY"': grayscale_color
    - id: color_mode
      type: u2
      enum: color_mode
  rgb_color:
    seq:
    - id: red
      type: f4
    - id: green
      type: f4
    - id: blue
      type: f4
  cmyk_color:
    seq:
    - id: cyan
      type: f4
    - id: magenta
      type: f4
    - id: yellow
      type: f4
    - id: black
      type: f4
  grayscale_color:
    seq:
    - id: lightness
      type: f4
enums:
  block_type:
    0xc001: group_start
    0xc002: group_end
    0x0001: color
  color_mode:
    0: global
    1: spot
    2: normal
