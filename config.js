const fs = require('fs');

var kojiConfig = require('./.koji/resources/scripts/buildCofig.js');
var koji = kojiConfig();

fs.writeFileSync('config.json', koji);

var kojiManifest = require('./.koji/resources/scripts/manifest.js');
var manifest = kojiManifest();

fs.writeFileSync('manifest.json', manifest);
