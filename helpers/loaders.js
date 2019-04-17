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

const loadFont = function(fontSrc) {
  return new Promise((resolve, reject) => {
    if (!fontSrc.includes('http')) {
      resolve(fontSrc);
    }

    let link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = fontSrc;
    document.getElementsByTagName('head')[0].appendChild(link);

    // Trick from https://stackoverflow.com/questions/2635814/
    let image = new Image;
    image.src = link.href;
    image.onerror = function () {
      var match = fontSrc.match(/family=(.*?)$/)[1];
      var fontName = `"${match.replace('+', ' ')}"`;
      resolve({
        type: 'font',
        value: fontName
      });
    };
  });
}

const loadSound = function(key, url) {
  return new Promise((resolve, reject) => {
    let sound = new Audio(url);
    sound.preload = 'auto';
    sound.autoplay = false;
    sound.oncanplaythrough = function() {
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
