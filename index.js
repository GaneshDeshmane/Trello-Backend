const express = require('express');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
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

const SALT_ROUNDS = 10;

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
       const hashedPassword = await bcrypt.hash(ParseData.data.password, SALT_ROUNDS)
       await UserModel.create({
        email : ParseData.data.email,
        password : hashedPassword,
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
        email : parseData.data.email
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

     const passwordMatch = await bcrypt.compare(parseData.data.password, checkUser.password)
     if(!passwordMatch){
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
    
    // Validate request body fields
    if(!req.body || !req.body.token || !req.body.organisationName){
        return res.status(400).json({
            msg : 'missing required fields',
            error : ['token is required', 'organisationName is required']
        })
    }
    
    const token = req.body.token;
    const organisationName = req.body.organisationName;
    
    // Validate organisation name format (must be non-empty string)
    if(typeof organisationName !== 'string' || organisationName.trim() === ''){
        return res.status(400).json({
            msg : 'invalid organisation name',
            error : 'organisationName must be a non-empty string'
        })
    }
    
    try {
        const NewBoard = await OrganisationModel.create({
            name : organisationName,
            user_Id : user_Id
        })
        res.json({
            msg : 'welcome to organisation',
            user_Id : user_Id,
            data : NewBoard
        })
    } catch(err){
        res.status(500).json({
            error : err.message,
            msg : 'error creating organisation'
        })
    }
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
    
    try {
        const organisation = await OrganisationModel.find({
            user_Id : user_Id
        })
        res.json({
            data : organisation
        })
    } catch(err){
        res.status(500).json({
            error : err.message,
            msg : 'error fetching organisations'
        })
    }
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
    
    // Validate request body fields
    if(!req.body || !req.body.organisationName){
        return res.status(400).json({
            msg : 'missing required fields',
            error : ['organisationName is required']
        })
    }
    
    const organisationName = req.body.organisationName;
    
    // Validate organisation name format (must be non-empty string)
    if(typeof organisationName !== 'string' || organisationName.trim() === ''){
        return res.status(400).json({
            msg : 'invalid organisation name',
            error : 'organisationName must be a non-empty string'
        })
    }
    
    try {
        const deleteOrganisation = await OrganisationModel.findOneAndDelete({
            name : organisationName,
            user_Id : user_Id
        })
        
        if(!deleteOrganisation){
            return res.status(404).json({
                msg : 'organisation not found'
            })
        }
        res.json({
            msg : 'organisation deleted successfully'
        })
    } catch(err){
        res.status(500).json({
            error : err.message,
            msg : 'error deleting organisation'
        })
    }
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
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server started");
});

module.exports = app;