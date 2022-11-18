const jwt = require('jsonwebtoken');
const Roomy = require('../models/roomysData');
const cookieParser = require('cookie-parser');

const auth = async (req,res,next)=>{
    try {
        const token = req.cookies.jwt; //geting cookies 
        const verifyUser = jwt.verify(token,process.env.SECRET_KEY); //verify same user using secret key
        // console.log(verifyUser);

        const user = await Roomy.findOne({_id:verifyUser._id}); //get roomyobject using id
        console.log(user)

        req.token = token;
        req.user = user;
        next();
    } catch (e) {
        res.status(401).send(e);
    }

}

module.exports = auth;