var mongoose = require("mongoose");
var leadSchema = mongoose.Schema({
    name:String,
    experience:String,
    intrestedCourse:String,
    mode:String,
    academics:String,
    mobile:Number,
    email:String,
    address:String,
    referredBy:String,
    remarks:Array
})

var Lead = mongoose.model('Lead',leadSchema)
module.exports = Lead