const express = require('express');
const path = require('path');
const hbs = require('hbs');
const bcrypt = require('bcryptjs');
const bodyparser = require('body-parser');
require('./db/cons');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const auth = require('./middleware/auth');
const cookieParser = require('cookie-parser');
const Roomy = require('./models/roomysData');
const { Resolver } = require('dns');
const { type } = require('express/lib/response');
const { handlebars } = require('hbs');
const app = express();
const port = process.env.PORT || 3000;
const hhbs = require('handlebars-helpers');
require('handlebars');
const { checkServerIdentity } = require('tls');
// We will define the storage path for the image we are uploading. Here, we are using the middleware Multer to upload the photo to the server in a folder called `uploads` so we can process it.
const multer = require('multer');
var fs = require('fs')
const ImageModel = require('./models/images');
const VacancyModel = require('./models/vacancy')



const static_path = path.join(__dirname, '/public');
const tamplates_path = path.join(__dirname, '../tamplates/views');
const partials_path = path.join(__dirname, '../tamplates/partials');
console.log(static_path)
// console.log(process.env.SECRET_KEY)
//use midlware for display front end
app.use(express.static(static_path));

//use cookie parser as a midlware
app.use(cookieParser());

//data json me arra to express ko samjhna chahiye
app.use(express.json())
//hamara html form hai vaha se data arra to express ko samjhna chahiye
app.use(express.urlencoded({ extended: false }))

//hame hbs use karna hai
app.set("view engine", "hbs");
app.set("views", tamplates_path);

//register partials
hbs.registerPartials(partials_path)

//body parser
app.use(bodyparser.urlencoded({
    extended: true
}));

app.use(bodyparser.json());

app.get('/', (req, res) => {
    // res.send("Hello from the other side");
    res.render('index');
})
app.get('/services', (req, res) => { //auth, ye (req,res) ke pahle tha for jwt
    // res.send("Hello from the other side");
    // console.log(`Getting cookies: ${req.cookies.jwt}`);
    res.render('services');
})
app.get('/login', (req, res) => {
    // res.send("Hello from the other side");
    res.render('login');
})
// app.get('/logout', auth, async (req, res) => {
//     try {
//         console.log(req.user)
//         // for single logout
//         // req.user.tokens = req.user.tokens.filter((currentElem) => {
//         //     return currentElem.token != req.token; //db me se perticular logined user ka token delete kar ke baki ke vaise hi rakhega
//         // })

//         //for complete logout
//         req.user.tokens = [];

//         res.clearCookie('jwt');
//         console.log("Logout successfully.");
//         await req.user.save();
//         res.render('login');

//     } catch (e) {
//         res.status(400).send(e);
//     }
// })

app.get('/register', (req, res) => {
    // res.send("Hello from the other side");
    res.render('register');
})

app.post('/register', async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.cpassword;
        //html form date ko modify kiya
        const modifiedDate = new Date(req.body.registerDate);
        let dd = modifiedDate.getDate();
        let mm = modifiedDate.getMonth() + 1;
        let yyyy = modifiedDate.getFullYear();
        let registrationDate = new Date(dd + '-' + mm + '-' + yyyy);

        if (password === cpassword) {
            //gettting html form data
            const registerRoomy = new Roomy({ //collection creation
                // db key : input name attribute value`
                name: req.body.name,
                fatherName: req.body.fatherName,
                phone: req.body.phone,
                fatherPhone: req.body.fatherPhone,
                email: req.body.email,
                password: req.body.password,
                cpassword: req.body.cpassword,
                gender: req.body.gender,
                registerDate: req.body.registerDate,
                age: req.body.age,
                address: req.body.address,
                city: req.body.city,
                state: req.body.state,
                pincode: req.body.pincode,

            })
            //jaise hi user register hua hum(server) use token generate karke denge
            const token = await registerRoomy.generateAuthToken();

            // cookies me token store karenge
            res.cookie('jwt', token, {
                expires: new Date(Date.now + 30000),
                httpOnly: true
            });
            // console.log(cookie);

            const registeredRoomy = await registerRoomy.save();//registration details stored in db
            res.status(201).render("payment"); //serveing index page after registration
        } else {

            // res.send("Password Dosen't Match...");
            res.render('404');
        }

    } catch (e) {
        res.status(400).send(e)
    }
})


app.post('/login', async (req, res) => {
    try {

        //login form me diya gaya email and password hai niche ka
        const email = req.body.loginEmail;
        const password = req.body.loginPassword;

        const roomyObject = await Roomy.findOne({ email: email }); //login form me diye gaye email se hum db ka pura object get karre
        // console.log(roomyObject);
        const isMatch = await bcrypt.compare(password, roomyObject.password); //comparing form password and db password(hash vala) using bcryptjs 
        const token = await roomyObject.generateAuthToken();

        //cookies to store token while login
        res.cookie('jwt', token, {
            expires: new Date(Date.now + 6000),
            // httpOnly:true
        })

        // console.log("Generated token: " + token)

        if (isMatch) { //login form ka password and db me ka password match kiya
            console.log("Login successfully");
            res.status(201).render("services");
            //    console.log(roomyObject);
        } else {
            //    res.send("Oops! Something went wrong..")
            res.render('404');
        }

    } catch (e) {
        // res.status(400).send("Oops! Something went wrong..")
        res.render('404');
    }
})
// app.get('/dashboard',(req,res)=>{
//     try {
//         res.render('list');
//     } catch (e) {
//         res.render('404');
//     }
// })

app.get('/list', (req, res) => {

    Roomy.find((err, docs) => {
        if (!err) {
            res.render("list", {
                list: docs
            });
        }
        else {
            console.log('Error in retrieving users list :' + err);
        }
    });
});


// DELETE USER
app.get('/delete/:id', (req, res, next) => {
    Roomy.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true }, (err, docs) => {
        if (err) {
            console.log("Cant retrive data and edit because of some problem");
            next(err);
        } else {

            handlebars.registerHelper('setChecked', function (value) {
                // console.log(gender,value,251)
                if (value == docs.gender) {
                    return "Checked";
                } else {
                    return "";
                }
            })

            let fetchedDate = JSON.stringify(docs.registerDate);
            //    console.log(fetchedDate);
            const splittedDate = fetchedDate.split("T")[0].replace(",").split("-");
            res.render('deletepage', {
                Roomy: docs,
            });

        }
    })
})
app.post('/delete/:id', (req, res, next) => {
    Roomy.findByIdAndRemove({ _id: req.params.id }, (err, docs) => {
        if (!err) {
            console.log("Deleted Successfully");
            res.redirect('/list');
        } else {
            console.log('Failed to Delete user Details: ' + err);
            next(err);
        }
    });
})

//route to show update element
app.get('/update/:id', (req, res, next) => {
    Roomy.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true }, (err, docs) => {
        if (err) {
            console.log("Cant retrive data and edit because of some problem");
            next(err);
        } else {
            let fetchedDate = JSON.stringify(docs.registerDate);
            //    console.log(fetchedDate);

            let gender = docs.gender;
            console.log(gender, 246);

            handlebars.registerHelper('setChecked', function (value) {
                // console.log(gender,value,251)
                if (value == docs.gender) {
                    return "Checked";
                } else {
                    return "";
                }
            })
            const splittedDate = fetchedDate.split("T")[0].replace(",").split("-");
            res.render('updatepage', {
                Roomy: docs,
            });

        }
    })
})

//route to update element
app.post('/update/:id', (req, res, next) => {
    Roomy.findByIdAndUpdate({ _id: req.params.id }, req.body, (err, docs) => {
        if (err) {
            console.log("Cant retrive data and edit because of some problem");
            next(err);
        } else {
            console.log("UPdated Successfully");
            res.redirect('/list');
        }
    })
})


// app.get('/students', async (req,res)=>{
//     try {
//         const getStudents = await Roomy.find();
//         res.send(getStudents);
//         res.render('students');
//     } catch (e) {
//         res.send(e);
//     }
// })

// app.get('/students/:id',async (req,res)=>{
//     try{
//         const _id = req.params.id;
//         console.log(_id);
//         const getStudent = await Roomy.findById(_id);
//         res.send(getStudent);

//     }catch(e){
//         res.send(e)
//     }
// })


/*
//how to use jsonwebtoken

const jwt = require('jsonwebtoken');
//create token

const createToken = async ()=>{
 const token = await jwt.sign({_id:'617aae27a9d09f885140cab9'},'mynameisjayiammerndevloperyoutuber',{expiresIn:"59"});
 console.log(token);

 //verifying user using token in backend
 const userVar = await jwt.verify(token,'mynameisjayiammerndevloperyoutuber');
 console.log(userVar);

}
createToken();

*/

/*
//how to use bcrypt package
const bcryptjs = require('bcryptjs');

const seccuredPassword = async (password)=>{
 const passwordHash =  await bcryptjs.hash(password,10);
 console.log(passwordHash);

// const passwordMatch = await bcryptjs.compare(password,passwordHash);
const passwordMatch = await bcryptjs.compare("jay@123",passwordHash);
console.log(passwordMatch);

}
seccuredPassword("jay@123")*/

//multer code
const Storage = multer.diskStorage({
    destination: __dirname + '/public/uploads',
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
})

const upload = multer({
    storage: Storage
}).single('image')



app.get('/upload', (req, res) => {
    res.render('upload')
})

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.log(err);
        } else {
            const newImage = new ImageModel({
                name: req.body.name,
                desc: req.body.desc,
                image: {
                    data: req.file.filename,
                    contentType: 'image/png,jpg,jpeg'
                }

            })
            newImage.save()
                .then(() => res.redirect("/uploadlist")).catch((err) => console.log(err))
        }
    })
})


app.get('/uploadlist', (req, res) => {
    ImageModel.find((err, docs) => {
        if (!err) {
            res.render("uploadlist", {
                list: docs
            });
        }
        else {
            console.log('Error in retrieving users list :' + err);
        }
    });
})

app.get('/deleteimage/:id', (req, res, next) => {
    ImageModel.findByIdAndRemove({ _id: req.params.id }, (err, docs) => {
        if (!err) {
            console.log("Deleted Successfully");
            res.redirect('/uploadlist');
        } else {
            console.log('Failed to Delete user Details: ' + err);
            next(err);
        }
    });
})


app.get('/payment', (req, res) => {
    res.render('payment')
})

// vacancy functionality
const Storage1 = multer.diskStorage({
    destination: __dirname + '/public/vacantrooms',
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
})

const vacancy = multer({
    storage: Storage1
}).single('vacancyimage')

app.get('/vacancy', (req, res) => {
    res.render('vacancy')
})

app.post('/vacancy', (req, res) => {
    vacancy(req, res, (err) => {
        if (err) {
            console.log(err)
        } else {
            const newVacantRoomImage = new VacancyModel({
                room_number: req.body.room_number,
                room_capacity: req.body.room_capacity,
                vacancy: req.body.vacancy,
                image: {
                    data: req.file.filename,
                    contentType: 'image/png,jpg,jpeg'
                }

            })
            newVacantRoomImage.save()
                .then(() => res.redirect("/vacancylist")).catch((err) => console.log(err))
        }
    })
})
app.get('/vacancylist', (req, res) => {
    VacancyModel.find((err, docs) => {
        if (!err) {
            res.render("vacancylist", {
                imagelist: docs
            });
        }
        else {
            console.log('Error in retrieving users list :' + err);
        }
    });
})

app.get('/deletevimage/:id', (req, res, next) => {
    VacancyModel.findByIdAndRemove({ _id: req.params.id }, (err, docs) => {
        if (!err) {
            console.log("Deleted Successfully");
            res.redirect('/vacancylist');
        } else {
            console.log('Failed to Delete user Details: ' + err);
            next(err);
        }
    });
})

//vacancy update feature
app.get('/updatevimage/:id', (req, res, next) => {
    VacancyModel.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true }, (err, docs) => {
        // console.log(req.params.id)
        if (err) {
            console.log("Cant retrive data and edit because of some problem");
            // next(err);
        } else {
            // let imageName = JSON.stringify(docs.data.image);
            // console.log(docs)
            res.render('vacancyupdate', {
                VacancyModel: docs,
            });

        }
    })
})

//route to update element
app.post('/updatevimage/:id', vacancy, async (req, res, next) => {

    VacancyModel.findByIdAndUpdate({ _id: req.params.id }, req.body, (err, docs) => {
        if(req.file){
            docs.image = {
                data: req.file.filename,
                contentType: 'image/png,jpg,jpeg'
            }
            docs.save()
            console.log((docs.image['data'] + '').split('\n'),507)
        }else{
            console.log("Nahi hua re")
        }
        // console.log((docs.image['data'] + '').split('\n'), 501)
        if (err) {
            console.log("Cant retrive data and edit because of some problem");
            next(err);
        } else {
            (docs.image['data'] + '').split('\n')[0] = docs.image.data;
            // VacancyModel.image.data = (docs.image['data']+ '').split('\n')[0]


            console.log("UPdated Successfully");
            res.redirect('/vacancylist');

            
        }
    })

})





app.listen(port, () => {
    console.log(`Live at port no ${port}`);
})