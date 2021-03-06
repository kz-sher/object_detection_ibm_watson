const http=require('http')
const express = require('express')
const cors = require('cors');
const app = express()
const socketio = require('socket.io')
const PORT = process.env.PORT || 5000;
const VisualRecognitionV3 = require('ibm-watson/visual-recognition/v3');
const { IamAuthenticator } = require('ibm-watson/auth');
var cron = require('node-cron');

app.use(cors());

const visualRecognition = new VisualRecognitionV3({
    version: '2018-03-19',
    authenticator: new IamAuthenticator({
    apikey: process.env.API_KEY,
    }),
    url: 'https://gateway.watsonplatform.net/visual-recognition/api',
});
        
const server = http.createServer(app).listen(PORT, function() {
    console.log(`Listening at: http://localhost:${PORT}`);
});
const io = socketio(server);

// Initiate a socket connection
io.on('connection', function(socket){
    console.log('new connection');

    // Listen upload image request from client side
    socket.on('upload image', function(img){
        
        const classifyParams = {
            imagesFile: img,
        };

        visualRecognition.classify(classifyParams)
            .then(response => {
                const classifiedImages = response.result;
                console.log(JSON.stringify(classifiedImages, null, 2));
                const detectedClasses = classifiedImages.images[0].classifiers[0].classes.map(classObj => classObj.class);
                socket.emit('image classes', detectedClasses);
            })
            .catch(err => {
                console.log('error:', err);
                socket.emit('error', err);
            });
    });
});

// Schedule a monthly request to IBM Watson Visual Recognition API
cron.schedule('00 00 12 29 * *', () => {
    console.log('Runing a job at 12:00 P.M. 29th of every month');
    
    const classifyParams = {
        url: 'https://ibm.biz/BdzLPG',
    };
      
    visualRecognition.classify(classifyParams)
    .then(response => {
        const classifiedImages = response.result;
        console.log(JSON.stringify(classifiedImages, null, 2));
    })
    .catch(err => {
        console.log('error:', err);
    });        
  }, {
    scheduled: true,
    timezone: 'Asia/Kuala_Lumpur'
});

if(process.env.NODE_ENV === 'production'){
    app.use(express.static('client/build'));
}