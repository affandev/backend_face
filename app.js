require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const app = express();
let namefile = Date.now().toString()+(Math.random() + 1).toString(36).substring(2);
var cors = require('cors')
const appRouteUser = require('./src/routes/routeUser');
 const fileStorage = multer.diskStorage({
   destination: (req, file, cb) => {
     cb(null,'photo')
   },
   filename: (req, file, cb) => {
     
     cb(null,namefile+'.jpg')
   }
 })
 const fileFilter = (req, file, cb) =>{
   if(file.mimetype === 'image/png'||
    file.mimetype === 'image/jpg ' || 
    file.mimetype === 'image/jpeg'){
      cb(null,true)
    }else {
      cb(null, false)
    }
 }
app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({ extended: false }))

app.use(cors())


app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))
app.use('/', [appRouteUser]);
let allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "*");
    next();
  }
app.use(allowCrossDomain);
app.use("/photo", express.static(__dirname + "/photo"));
const port = 8081
app.listen(port, ()=>{
    console.log('Server Berjalan di Port : '+port);
});