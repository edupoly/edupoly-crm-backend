var express = require('express')
var cors = require('cors')
var bodyparser = require("body-parser")
var mongoose = require('mongoose')
var jwt = require('jsonwebtoken')
var Lead = require('./models/lead.model')
var User = require("./models/user.model")

var app = express()

app.use(cors())
app.use(express.static(__dirname+"/public"))
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

mongoose.connect("mongodb+srv://sai:sai123456789@atlascluster.ym1yuin.mongodb.net/edulgm?retryWrites=true&w=majority&appName=AtlasCluster")


var authenticate = async (req,res,next)=>{
    try {
       var token = req.headers.authorization;
       if(!token){
         return res.json({msg:"token missing"})
       }
       var decoded = jwt.verify(token,secretkey);
       var user = await User.findById(decoded._doc._id);
       if(!user){
        return res.json({msg:"user not found"})
       }
       next()
    }
    catch (error) {
        res.json({ message: 'Invalid token' });
    }
}


app.get("/",  async(req,res)=>{
    try {
        var studentleads = await Lead.find({})
        if(studentleads){
            console.log(studentleads)
            res.json(studentleads)
        }
    } 
    catch (error) {
        res.json({msg:"err in finding student leads"})
    }
})


app.post("/addlead",async(req,res)=>{
    try {
       var leaddata = req.body
       var newLead = new Lead(leaddata)

       var obj = {response:"unknown",name:"unknown",timestamp:Date.now()}
       newLead.remarks.push(obj)
       var newleadgen = await newLead.save()
       res.json({msg:"lead added"})
       
    } 
    catch (error) {
        console.log("err",error)
        res.json({msg:"error in adding lead"})
    }
})


app.put("/addremark/:id",async(req,res)=>{
    try {
        var newremark = {...req.body,timestamp:Date.now()}
        var remarkadded = await Lead.findOneAndUpdate({_id:req.params.id},{$push:{remarks:newremark}})
        res.json({msg:"remark added"})
    } 
    catch (error) {
        res.json({msg:"error in adding remark"})
    }
})


app.delete("/deletelead/:id",async(req,res)=>{
    try {
        console.log("del lead")
        var deletelead = await Lead.findOneAndDelete({_id:req.params.id})
        res.json({msg:"lead deleted"})
    } 
    catch (error) {
        res.json({msg:"error in deleting lead"})
    }
})

app.post("/signup",async(req,res)=>{
     try {
        var newUser = new User({...req.body,role:'user'})
        var user = await newUser.save()
        res.json({msg:"signupsuccess"})
     } 
     catch (error) {
        res.json({msg:"signup failed"})
     }
})

app.post("/login",async(req,res)=>{
    try {
      var user = await User.findOne({username:req.body.username,password:req.body.password})
        var token = jwt.sign({...user}, 'secretkey')
        res.json({msg:"loginsuccess",token,role:user.role})
    } 
    catch (error) {
        res.json({msg:"login failed"})
    }
})


app.listen(7777,()=>{
    console.log("server is running on port 7777")
})