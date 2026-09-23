# Icon provenance

All PNGs in this directory are rasterised from `public/favicon.svg`, the SZLIF
mark authored for this project: the Barbicide jar standing at its fill line,
drawn in the shop's two inks (glaze `#1D2FC9`, second ink `#D3291F`) on label
stock `#F4F2EA`.

Pipeline: `qlmanage -t -s 1024 -o <tmp> public/favicon.svg`, then
`sips -Z <size>` for each manifest size. No third-party or stock artwork is
used; the mark is original vector geometry with no type dependency.
