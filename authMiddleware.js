const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET
require('dotenv').config();
function authMiddleware(req,res,next){
    const  authHeader = req.headers["authorization"];
    console.log("authheader here:" + authHeader +"ends here")
    const token = authHeader.split(" ")[1];//this part removes the bearer part from the token and gives us the actual token
    console.log("token here:" + token +"ends here")
    if(!token){
        res.status(401).json({
            msg : 'token not found'
        })
    }else{
        const decode=jwt.verify(token,JWT_SECRET)
        const user_Id = decode.user_Id
        if(!user_Id){
            res.json({
                msg : 'user not found'

            })
            return
        }else{
            req.user_Id = user_Id;
            next()
        }
    }
}
module.exports = {
    authMiddleware : authMiddleware
}