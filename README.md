# Brick Breaker

The breakout clone.

# VCC's

- 🎮 Change the text and game settings.
    * [Open configuration](#~/.koji/customization/settings.json!visual)
- 🖼️ Replace the paddle, ball, bricks, and background.
    * [Open configuration](#~/.koji/customization/images.json!visual)
- 🔈 Change the sounds and background music.
    * [Open configuration](#~/.koji/customization/sounds.json!visual)
- 💅 Change the colors and visual style.
    * [Open configuration](#~/.koji/customization/colors.json!visual)
- ⚙️ Add your Google Analytics ID and Open Graph information for sharing.
    * [Open configuration](#~/.koji/customization/metadata.json!visual)

## Structure
### ~/
This is the main directory
- [index.html](#~/index.html) is the main html file where the game canvas, and overlay elements are declared.
- [index.js](#~/index.js) is the main javascript file where the load, create, and play loop methods are including code for initializing and loading the game.
- [style.css](#~/style.css) this file contains css styles for the game canvas, and overlay elements.

### ~/helpers
This directory contains the main game code.
- [helpers/overlay.js](#~/helpers/overlay.js)controls the html overlay for displaying game text.
- [helpers/animationframe.js](#~/helpers/animationframe.js) a shim for requestAnimationFrame, the browsers method for asking for a new frame. Browsers request around 60 frames per second depending of resources.
- [helpers/loaders.js](#~/helpers/loaders.js) a collections of functions to help load image, sound, and font assets.

## Support
### Community
If you need any help, you can ask the community by [making a post](https://gokoji.com/posts), or [joining the discord](https://discordapp.com/invite/eQuMJF6).

### Helpful Resources
- [Mozilla Game Development Docs](https://developer.mozilla.org/en-US/docs/Games).
- [HTML5 Game Devs Forum](http://www.html5gamedevs.com/).