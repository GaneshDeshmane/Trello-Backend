const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const dotenv = require('dotenv');
dotenv.config();
mongoose.connect(process.env.mongodb)
const userSchema = new Schema({
    email : String,
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

})
const IssueSchema = new Schema({
    title : String,
    description : String,
    user_Id : String
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
