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


var adminauthenticate = async (req,res,next)=>{
    try {
       var token = req.headers.authorization;
       if(!token){
         return res.json({msg:"token missing"})
       }
       var decoded =  jwt.verify(token,'secretkey');
       var user = await User.findById(decoded._doc._id);
       console.log("user",user)
       if(!user){
        return res.json({msg:"user not found"})
       }
       if(user.role==='admin' || user.role==='manager'){
          next()
       }
       else{
         return res.json({msg:"you dont have access admin approval required"})
       }
       
    }
    catch (error) {
        res.json({ message: 'Invalid token' });
    }
}


var auth = async(req,res,next)=>{
    try {
        var token = req.headers.authorization;
        if(!token){
          return res.json({msg:"token missing"})
        }
        var decoded =  jwt.verify(token,'secretkey');
        var user = await User.findById(decoded._doc._id);
        console.log("user",user)
        if(!user){
         return res.json({msg:"user not found"})
        }
        if(user.role==='admin'){
           next()
        }
         else{
            return res.json({msg:"you dont have access"})
         }
     }
     catch (error) {
         res.json({ message: 'Invalid token' });
     }
}


app.get("/", adminauthenticate, async (req, res) => {
    try {
        var page = parseInt(req.query.page) || 1;
        var limit = parseInt(req.query.limit) || 2;
        var skip = (page - 1) * limit;
        var studentleads = await Lead.aggregate([
            { $sort: { updatedAt: -1 } },   
            { $skip: skip },                
            { $limit: limit },             
            { 
                $project: {                 
                    _id: 1,
                    name: 1,
                    mobile: 1,
                    intrestedCourse: 1
                }
            }
        ]);
        if(studentleads.length>0){
            res.send(studentleads);
        }
        else{
            res.json({ msg: "No leads found" });
        }
        
    } catch (error) {
        res.json({ msg: "Error in finding student leads" });
    }
});




app.get("/leaddetails/:id",adminauthenticate,async(req,res)=>{
     try {
        var lead = await Lead.findOne({_id:req.params.id})
        res.send(lead)
     } catch (error) {
        res.json({msg:"err in finding lead details"})
     }
})



app.post("/addlead",adminauthenticate,async(req,res)=>{
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


app.put("/addremark/:id",adminauthenticate,async(req,res)=>{
    try {
        var newremark = {...req.body,timestamp:Date.now()}
        var remarkadded = await Lead.findOneAndUpdate({_id:req.params.id},{$push:{remarks:newremark}})
        res.json({msg:"remark added"})
    } 
    catch (error) {
        res.json({msg:"error in adding remark"})
    }
})


app.delete("/deletelead/:id",adminauthenticate,async(req,res)=>{
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


app.get("/search",adminauthenticate,async(req,res)=>{
    try {
        const results = await Lead.aggregate([
            {
              $search: {
                index: "search", 
                compound: {
                  should: [
                    {
                      text: {
                        query: req.query.term,              
                        path: ["name", "intrestedCourse"]      
                      }
                    },
                    {
                      equals: {
                        value: parseInt(req.query.term, 10),
                        path: "mobile"                 
                      }
                    }
                  ]
                }
              }
            }
          ])
          if (results.length > 0) {
            const modifiedData = results.map((student) => ({
              id: student._id,
              name: student.name,
              mobile: student.mobile,
              intrestedCourse: student.intrestedCourse,
            }));
            res.send(modifiedData);
          } 
          else {
            res.json({ msg: "No leads found matching the search term" });
          }
    } catch (error) {
        res.json({ msg: "Error in search operation" });
    }  
})



app.get('/addmanager',auth,async(req,res)=>{
    try {
        const users = await User.find()
        const upddata = users.map((user)=>{
            var obj = {id:user._id,username:user.username,role:user.role}
            return obj
        })
        res.send(upddata)
    } catch (error) {
        res.json({ msg: "Error in finding data" });
    } 
})


app.put("/approvemanager/:id",auth,async(req,res)=>{
    try {
        const approvemanager = await User.findOneAndUpdate({_id:req.params.id},{ $set: { role: "manager" } },{ new: true })
         res.json({msg:"approved"})
    } catch (error) {
        res.json({ msg: "Error in approving manager" });
    }
})


app.put("/removemanager/:id",auth,async(req,res)=>{
    try {
        const removemanager = await User.findOneAndUpdate({_id:req.params.id},{ $set: { role: "user" } },{ new: true })
         res.json({msg:"manager removed"})
    } catch (error) {
        res.json({ msg: "Error in removing manager" });
    }
})


app.listen(7777,()=>{
    console.log("server is running on port 7777")
})