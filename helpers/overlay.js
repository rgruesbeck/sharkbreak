// Overlay wrapper

class Overlay {
    constructor(node) {
        this.root = node;

        this.container = node.querySelector('.container');
        this.banner = node.querySelector('#banner');
        this.button = node.querySelector('#button');
        this.score = node.querySelector('#score');
        this.lives = node.querySelector('#lives');
        this.mute = node.querySelector('#mute');

        this.styles = {
            textColor: 'white',
            primaryColor: 'purple',
            fontFamily: 'Courier New'
        };
    }

    showBanner(message) {
        this.banner.textContent = message;
        this.show('banner');
    }

    hideBanner() {
        this.hide('banner');
    }

    showButton(message) {
        this.button.style.fontFamily = this.styles.fontFamily;
        this.button.textContent = message;
        this.show('button');
    }

    hideButton() {
        this.hide('button');
    }

    showStats() {
        this.show('score');
        this.show('lives');
    }

    setScore(score) {
        this.score.textContent = `Score: ${score}`;
    }

    setLives(lives) {
        this.lives.textContent = `Lives: ${lives}`;
    }

    setStyles(styles) {
        this.styles = { ...this.styles, ...styles };
        this.applyStyles();
    }

    applyStyles() {
        this.container.style.color = this.styles.textColor;
        this.container.style.fontFamily = this.styles.fontFamily;

        this.button.style.borderColor = this.styles.primaryColor;
    }

    setMute(muted) {
        this.mute.textContent = muted ? 'volume_off' : 'volume_up';
        this.show('mute');
    }

    show(node) {
        this[node].active = true;
        this[node].style.visibility = 'visible';
        this[node].style.opacity = 1;
    }

    hide(node) {
        this[node].active = false;
        this[node].style.opacity = 0;
        this[node].style.visibility = 'hidden';
    }
}

export default Overlay;