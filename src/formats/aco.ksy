meta:
  id: aco
  file-extension: aco
  application: Adobe Photoshop
  tags:
    - color
    - palette
  license: CC0-1.0
  endian: be
  xref:
    wikidata: Q21834748
doc: |
  Adobe Color Swatch is a color palette format used by Adobe Photoshop.
  Color swatch files are loaded and saved in Photoshop's Color Swatches palette.
  These are typically stored in the `Presets/Color Swatches` folder.

  The color data for a color entry is always the same size,
  but some color spaces ignore parts of it.
  RGB, HSB, and CMYK use the full range of unsigned 16-bit integers.
  For CMYK, 0 represents 100% ink. For example, pure cyan = 0,65535,65535,65535.
  For Lab, the lightness value ranges from 0 to 10000. The a and b chroma values are signed, going from -12800 to 12700.
  For grayscale, the lightness value (only component) ranges from 0 to 10000.
doc-ref: http://www.nomodes.com/aco.html
seq:
  - id: aco_v1
    type: aco_v1
  - id: aco_v2
    type: aco_v2
	# TODO: support v1 files
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
    - id: name_length
      doc: Length of color name in codepoints, including a null terminator
      type: u2
      valid:
        min: 1
    - id: name
      type: str
      encoding: UTF-16BE
      size: (name_length - 1) * 2
    - id: terminator
      contents: [0x00, 0x00]
enums:
  color_space:
    0: rgb # Red, Green, Blue
    1: hsb # Hue, Saturation, Brightness
    2: cmyk # Cyan, Magenta, Yellow, blacK (Key)
    3: pantone # *1
    4: focoltone # *1
    5: trumatch # *1
    6: toyo # *1
    7: lab # L*a*b* (CIELAB D50)
    8: grayscale
    9: wide_cmyk #*2
    10: hks # *1
    11: dic #*2
    12: total_ink #*2
    13: monitor_rgb #*2
    14: duotone #*2
    15: opacity #*2
    16: web #*2
    17: gray_float #*2
    18: rgb_float #*2
    19: opacity_float #*2
    #*1: "Photoshop allows the specification of custom colors, such as those colors that are defined in a set of custom inks provided by a printing ink manufacturer. These colors can be stored in the Colors palette and streamed to and from load files. The details of a custom color's color data fields are not public and should be treated as a black box."
    #*2: Not mentioned in the spec for ACO files, but it appears to be a shared enum.
