meta:
  id: riff_pal
  file-extension: pal
  application: Microsoft Paint
  tags:
    - color
    - palette
  license: CC0-1.0
  xref:
    pronom: fmt/624
    wikidata: Q27979508
  imports:
    - /common/riff
  encoding: ASCII
  endian: le
seq:
  - id: chunk
    type: 'riff::chunk'
instances:
  chunk_id:
    value: chunk.id
    enum: fourcc
  is_riff_chunk:
    value: 'chunk_id == fourcc::riff'
  parent_chunk_data:
    io: chunk.data_slot._io
    pos: 0
    type: 'riff::parent_chunk_data'
    if: is_riff_chunk
  form_type:
    value: parent_chunk_data.form_type
    enum: fourcc
  is_form_type_pal:
    value: 'is_riff_chunk and form_type == fourcc::pal'
  subchunks:
    io: parent_chunk_data.subchunks_slot._io
    pos: 0
    type: chunk_type
    repeat: eos
    if: is_form_type_pal
types:
  chunk_type:
    seq:
      - id: chunk
        type: 'riff::chunk'
    instances:
      chunk_id:
        value: chunk.id
        enum: fourcc
      chunk_data:
        io: chunk.data_slot._io
        pos: 0
        type:
          switch-on: chunk_id
          cases:
            'fourcc::data': data_chunk_type

  data_chunk_type:
    seq:
      - id: pal_version
        type: u2
        valid: 0x0300
      - id: color_count
        type: u2
      - id: colors
        type: color
        repeat: expr
        repeat-expr: color_count
  
  color:
    seq:
      - id: red
        type: u1
      - id: green
        type: u1
      - id: blue
        type: u1

enums:
  fourcc:
    # little-endian
    0x46464952: riff
    0x204c4150: pal
    0x61746164: data
