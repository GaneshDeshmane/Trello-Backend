const express = require('express');
const jwt = require('jsonwebtoken')
const env = require("dotenv").config();
const  JWT_SECRET = process.env.JWT_SECRET
const {z}= require('zod')
const {UserModel , OrganisationModel, BoardModel,IssueModel} = require('./db')
const {authMiddleware}= require('./authMiddleware')
const cors = require('cors');
const app = express();
app.use(cors());

app.use(express.json())

app.use(express.static(__dirname + '/frontend/dist'))
app.get('/',function(req,res){
   res.sendFile(__dirname + '/frontend/dist/index.html')
})
app.post('/signup',async function(req,res){
   const userRequired = z.object({
    email : z.string().email(),
    password : z.string().min(6),
    username : z.string()
   })
   const ParseData = userRequired.safeParse(req.body)
   if(!ParseData.success){
    return res.status(400).json(
        {
        msg : 'validation error',
        error : ParseData.error.errors
    })
   }
   const existingUser = await UserModel.findOne({
    email : ParseData.data.email
   })
   if(existingUser){
    return res.status(400).json({
        msg : 'user already exists'
    })}
   try{
       await UserModel.create({
        email : ParseData.data.email,
        password : ParseData.data.password,
        username : ParseData.data.username
    })
    res.json({
        msg : 'user signed up successfully'
    })}
    catch(err){
        res.json({
            error : err.message,
            msg : 'error creating user'
        })
    }
 })
   


app.post('/signin',async function(req,res){
    const signinRequired = z.object({
        email : z.string().email(),
        password : z.string().min(6)
    })
    const parseData = signinRequired.safeParse(req.body)
    if(!parseData.success){
        return res.status(400).json({
            msg : 'validation error',
            error : parseData.error.errors
        })
    }
    let checkUser;
    try{
         checkUser = await UserModel.findOne({
        email : parseData.data.email,
        password : parseData.data.password
     })}catch(err){
        return res.status(400).json({
            msg : 'error occurred while signing in',
            error : err.message
        })
     }

     if(!checkUser){
        return res.status(400).json({
            msg : 'invalid credentials'
        })
     }
        const token = jwt.sign({user_Id : checkUser._id},JWT_SECRET)
        res.json({
            msg : 'signedin successfully',
            token:token
        })

    })
    

app.post('/organisation',authMiddleware,async function(req,res){
    const user_Id = req.user_Id;
    const token = req.body.token;
    const organisationName = req.body.organisationName;

    const NewBoard = await OrganisationModel.create({
        
        name : organisationName,
        user_Id : user_Id
    })
    res.json({
        msg : 'welcome to organisation',
        user_Id : user_Id
    })
})
app.post('/boards',authMiddleware,async function(req,res){
    const user_Id = req.user_Id;
    const boardName = req.body.boardName;
    const organisationName = req.body.organisationName;
  
    const organisationfound = await OrganisationModel.findOne({
  
        user_Id : user_Id,
        name : organisationName
    })

    if(!organisationfound){
        return res.status(400).json({
            msg : 'organisation not found'
        })
    }
  
    const NewBoard = await BoardModel.create({
        name : boardName,
        user_Id : user_Id,
        organisation_Id : organisationfound._id
    })
      res.json({
        msg : 'welcome to boards',
        user_Id : user_Id
    })
})
app.post('/issues',authMiddleware,async function(req,res){
    const user_Id = req.user_Id;
    const organisationName = req.body.organisationName;
    const boardName = req.body.boardName;
    const issueTitle = req.body.issueTitle;
    const issueDescription = req.body.issueDescription;

    const organisationCheck = await OrganisationModel.findOne({
        name : organisationName,
        user_Id : user_Id
    })
    if(!organisationCheck){
        return res.status(400).json({
            msg : 'organisation not found'
        })
    }
  
    const boardCheck = await BoardModel.findOne({
        name : boardName,
        user_Id : user_Id,
        organisation_Id : organisationCheck._id
    })
    if(!boardCheck){
        return res.status(400).json({
            msg : 'board not found'
        })
    }
    const NewIssue = await IssueModel.create({
        title : issueTitle,
        description : issueDescription,
        user_Id : user_Id,
        boardName : boardCheck._id
    })
      res.json({
        msg : 'welcome to issues',
        user_Id : user_Id
    })
})
app.get('/organisation',authMiddleware,async function(req,res){
    const user_Id = req.user_Id;
    const organisation = await OrganisationModel.find({
        user_Id : user_Id
    })
    res.json({
        data : organisation
    })
})
app.get('/boards',authMiddleware,async function(req,res){
    const user_Id = req.user_Id;
    const board = await BoardModel.find({
        user_Id : user_Id
    })
    res.json({
        data : board
    })
})
app.get('/issues',authMiddleware,async function(req,res){
    const user_Id = req.user_Id;
    const issue = await IssueModel.find({
        user_Id : user_Id
    })
    res.json({
        data : issue
    })
})
app.delete('/organisation',authMiddleware,async function(req,res){
    const user_Id = req.user_Id;
    const organisationName = req.body.organisationName;
    const deleteOrganisation = await OrganisationModel.findOneAndDelete({
        name : organisationName,
        user_Id : user_Id
    })
    if(!deleteOrganisation){
        return res.status(400).json({
            msg : 'organisation not found'
        })
    }
    res.json({
        msg : 'organisation deleted successfully'
    })
})  
app.delete('/boards',authMiddleware,async function(req,res){
    const user_Id = req.user_Id;
    const boardName = req.body.boardName;
    const deleteBoard = await BoardModel.findOneAndDelete({
        name : boardName,
        user_Id : user_Id
    })
    if(!deleteBoard){
        return res.status(400).json({
            msg : 'board not found'
        })
    }
    res.json({
        msg : 'board deleted successfully'
    })
})  
app.put('/issues',authMiddleware,async function(req,res){
    const user_Id = req.user_Id;
    const issueTitle = req.body.issueTitle;
    const newDescription = req.body.newDescription;
    const updateIssue = await IssueModel.findOneAndUpdate({
        title : issueTitle,
        user_Id : user_Id
    },{
        description : newDescription
    })
    if(!updateIssue){
        return res.status(400).json({
            msg : 'issue not found'
        })
    }
    res.json({
        msg : 'issue updated successfully'
    })
})
app.listen(3000)