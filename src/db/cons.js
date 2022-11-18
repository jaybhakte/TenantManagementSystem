const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/roomysRegistration").then(()=>{
    console.log("Connection succeful");
}).catch((e)=>{
    console.log(e,"No Connection");
})

