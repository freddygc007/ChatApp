const mongoose=require('mongoose')
const dotenv=require('dotenv')

dotenv.config();

exports.connectDatabase = ()=>{
    mongoose.connect(process.env.DB_LOCAL_URI,{
        useNewUrlParser:true,
        useUnifiedTopology:true
    }).then(con=>{
        console.log(`mongoDB is connected`);
    }).catch((err)=>{
        console.log(err);
    })
};mongoose.set('strictQuery', false);
