# Roof skeleton demo
Straight skeleton of a drawn polygon (2D plan + three.js roof). ES modules need http: `cd docs/roof_skeleton && python3 -m http.server 8000`, open http://localhost:8000/ (three.js loads from jsDelivr; `?preset=L&mode=nearest` picks preset and mode).
Core algorithm in `skeleton.js`; check it with `node test_skeleton.mjs` (area sum, simple faces, node height = distance to face planes, 300 random polygons).
