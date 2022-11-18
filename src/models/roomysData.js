require('dotenv').config();  
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JsonWebTokenError } = require('jsonwebtoken');
const roomysSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    fatherName: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true,
        maxlength: 10,
        unique: true
    },
    fatherPhone: {
        type: Number,
        required: true,
        maxlength: 10,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    cpassword: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        required: true,
        
    },
    registerDate: {
        type: String,
        required: true,
        default: JSON.stringify(Date.now)
    },
    age: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true,
        maxlength: 6
    },
    tokens:[{
        token:{
            type:String,
            required:true
        },
    }]
})

//generating token
roomysSchema.methods.generateAuthToken = async function(){
    try {
        //generate token 
        console.log(this._id);
        const token = jwt.sign({_id:this._id}, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({token:token}); //humne gnerate kiya hua token us tokens arry of object ke token object me set karee
        //add token into db
        await this.save(); 
        // console.log(token);
        return token;
    } catch (e) {
        res.send(e);
        console.log("error",e);
    }
}

//making midlware : register form data get karne ke bad and db me save karne se pahale
//hasing midlware
roomysSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        // console.log(`The current password is ${this.password}`);
        this.password = await bcrypt.hash(this.password, 10);
        // console.log(`The current password is ${this.password}`);
        
        // this.cpassword = undefined; //pasword hash hone ke bad iski jarurat nahi 
        this.cpassword = await bcrypt.hash(this.password, 10); //pasword hash hone ke bad iski jarurat nahi 

    }
    next();
})

const Roomys = new mongoose.model("Roomy", roomysSchema);
module.exports = Roomys;