meta:
  id: act
  file-extension: act
  application: Adobe Photoshop
  tags:
    - color
    - palette
  license: CC0-1.0
  xref:
    wikidata: Q28551294
doc: Adobe Color Table is a very simple format for RGB color palettes.
seq:
  - id: colors
    type: color
    repeat: expr
    repeat-expr: 256
types:
  color:
    seq:
    - id: red
      type: u1
    - id: green
      type: u1
    - id: blue
      type: u1
