const WebFont = require('webfontloader');

const loadImage = function(key, url) {
  return new Promise((resolve, reject) => {
    let image = new Image;
    image.src = url;
    image.onload = () => {
      resolve({
        type: 'image',
        key: key,
        value: image
      });
    };
  });

}


const loadFont = (key, fontName) => {
  return new Promise((resolve, reject) => {
    let font = {
      google: {
        families: [fontName]
      },
      fontactive: function (familyName) {
        resolve({
          type: 'font',
          key: key,
          value: familyName
        })
      }
    }
    WebFont.load(font);
  });
}

const loadSound = function(key, url) {
  return new Promise((resolve, reject) => {
    let sound = new Audio(url);
    sound.preload = 'auto';
    sound.autoplay = false;
    sound.oncanplay = function() {
      resolve({
        type: 'sound',
        key: key,
        value: sound
      });
    }
    sound.load();
  });
}

export { loadImage, loadSound, loadFont };
