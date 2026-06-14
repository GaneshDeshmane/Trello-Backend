const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const dotenv = require('dotenv');
dotenv.config();
mongoose.connect(process.env.mongodb)
const userSchema = new Schema({
  
    email : {type : String,unique:true},
    password : String,
    username : String
})
const OrganisationSchema = new Schema({
    name : String,
    user_Id : String
})
const BoardSchema = new Schema({
    name : String,
    user_Id : String,
    organisation_Id : { type: Schema.Types.ObjectId, ref: 'Organisation' }
})
const IssueSchema = new Schema({
    title : String,
    description : String,
    user_Id : String,
    boardName : { type: Schema.Types.ObjectId, ref: 'Board' }
})

const UserModel = mongoose.model("users",userSchema);
const OrganisationModel = mongoose.model("Organisation",OrganisationSchema);
const BoardModel = mongoose.model("Board",BoardSchema);
const IssueModel = mongoose.model("Issue",IssueSchema);

module.exports = {
    UserModel : UserModel,
    OrganisationModel : OrganisationModel,
    BoardModel : BoardModel,
    IssueModel : IssueModel
}
