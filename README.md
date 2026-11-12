# Rebusday

A fresh set of three picture-word puzzles (rebuses) every day. Free, no account needed.

## Run it

It's a static site with no build step. Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server
```

## Host on GitHub Pages

1. Push these files to the root of a repository.
2. In the repo go to **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`.
3. Your game will be live at `https://<username>.github.io/<repo>/`.

## Files

- `index.html`: page markup
- `styles.css`: sketchbook theme
- `app.js`: game logic, stats, hints and daily rotation
- `puzzles.js`: puzzle bank
- `doodles.js`: hand-drawn SVG doodles used in puzzles
