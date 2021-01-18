meta:
  id: aco
  file-extension: aco
  application: Adobe Photoshop
  tags: palette
  license: CC0-1.0
  endian: be
doc: |
  Adobe Color Swatches are used in Adobe Photoshop for color palettes.
  http://www.nomodes.com/aco.html
seq:
  - id: aco_v1
    type: aco_v1
  - id: aco_v2
    type: aco_v2
	# 
types:
  aco_v1:
    seq:
      - id: version
        # type: u2
        contents: [0x00, 0x01]
      - id: number_of_colors
        type: u2
      - id: aco_v1_colors
        type: aco_v1_color
        repeat: expr
        repeat-expr: number_of_colors
  aco_v2:
    seq:
      - id: version
        # type: u2
        contents: [0x00, 0x02]
      - id: number_of_colors
        type: u2
      - id: aco_v2_colors
        type: aco_v2_color
        repeat: expr
        repeat-expr: number_of_colors
  aco_v1_color:
    seq:
    - id: color_space
      type: u2
      enum: color_space
    - id: w
      type: u2
    - id: x
      type: u2
    - id: y
      type: u2
    - id: z
      type: u2
  aco_v2_color:
    seq:
    - id: color
      type: aco_v1_color
    - id: reserved
      type: u2
      # contents: [0x00, 0x00]
    - id: name_length
      doc: Length of color name plus a 2-byte null terminator
      type: u2
      valid:
        min: 1
    - id: name
      doc: UTF-16 representation of color name
      size: (name_length - 1) * 2
    - id: terminator
      contents: [0x00, 0x00]
enums:
  color_space:
    0: rgb
    1: hsb
    2: cmyk
    7: lab
    8: grayscale
    9: wide_cmyk
