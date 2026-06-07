const jwt = require('jsonwebtoken')
const JWT_SECRET = 'skycode'

function authMiddleware(req,res,next){
    const token = req.headers.token;
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