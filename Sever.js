# audio-video-calling
Audio Video Calling Experiment

## Set up

1) Run `npm install`

2) [Install ssl on Node/Express](https://aghassi.github.io/ssl-using-express-4/)

3) Configure your ssl with your keys and pass phrase `bin/www:24`

````javascript
var sslOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),
  passphrase: 'webRTC'
};

var server = https.createServer(sslOptions, app);

````

4) Run `npm install nodemon -g`

5) `nodemon bin/www` for watching changes and starting/restarting server
