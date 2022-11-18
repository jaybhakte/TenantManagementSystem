const mongoose = require('mongoose');
const VacancySchema =  mongoose.Schema({
    room_number: Number,
    room_capacity: Number,
    vacancy: Number,
    image:
    {
        data: Buffer,
        contentType: String
    }
});

module.exports = VacancyModel =  mongoose.model('vacancyModel', VacancySchema);