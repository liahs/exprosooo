const Express = require('express')
const multer = require('multer')
const bodyParser = require('body-parser')
const ftp = require("basic-ftp")
var upload = multer({dest:'./uploads'})
const fs=require('fs')
const app = Express()

app.use(bodyParser.json())
 
app.use(function(req,res,next){
  console.log(req.method,req.path,"-",req.ip)
  next()
})


// Mongo connection and schemema and models
const mongoose=require('mongoose')
mongoose.connect("mongodb+srv://H:H@cluster0.dm0bt.mongodb.net/Users?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true }); 
var personSchema =new mongoose.Schema({
  name:{type:String,required:true},
  age:Number,
  favoriteFoods:[String]
})
var Person=mongoose.model('Person',personSchema)

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
// we're connected!
console.log('success')
});
// end 




// Upload to ftp
async function up(data) {
    const client = new ftp.Client()
    client.ftp.verbose = true
    console.log(data)
    try {
        await client.access({
            host: "166.62.10.186",
            user: "dev@himmat.spectacularitpark.com",
            password: "kumarhimmat",
        })
        console.log("connected")
        path='/images/'
        switch(data.mimetype.split('/')[0]){
          case "video":
            path='/videos/'
            break
          case "image":
            path='/images/'
            break
          case "audio":
            path="/audios/"
            break
          default:
            path='/documents/'
        }
        await client.uploadFrom(data.path,path+data.originalname)

        // delete file in server after uploaded to ftp server
        await fs.unlink(data.path, (err) => {
          if (err) throw err;
          console.log( data.originalname,'was deleted');
        });
    }

    catch(err) {
        console.log(err)
    }
  
   client.close()
  
}




app.get('/', (req, res) => {

  res.status(200).send('You can post to /api/upload.')
  
})
// api for uploading files
app.post('/api/upload', upload.any(), (req, res) => {
  up(req.files[0])
  res.status(200).json({
    message: 'success!',
  })
})



app.listen(3000,()=>console.log('runing'))