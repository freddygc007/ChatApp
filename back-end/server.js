const express = require ('express')
const app = express();
const User =require('./models/User')
const Message =require('./models/Message')
require('dotenv').config()
const userRoutes = require('./routes/userRoutes')

const rooms=['general','tech','finance','crypto'];
const cors = require('cors');
const { connectDatabase } = require('./connection');

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors());

connectDatabase();




app.use('/api/users',userRoutes)

const server=require('http').createServer(app)

const PORT= process.env.PORT || 5001;
const io = require('socket.io')(server,{
    cors:{
        origin:'http://localhost:3000',
        methods:['GET','POST']
    }
})

app.get('/api/rooms',(req,res)=>{
    console.log(req.url);
    res.json(rooms)
})

async function getLastMessagesFromRoom(room){
    let roomMessages =await Message.aggregate([
        {$match: {to:room}},
        {$group: {_id: '$date', messagesByDate: {$push: '$$ROOT'}}}
    ])
    return roomMessages;
}

function sortRoomMessagesByDate(messages){
    return messages.sort(function(a,b){
        let date1=a._id.split('/');
        let date2=a._id.split('/');

        date1=date1[2]+date1[0]+date1[1]
        date2=date2[2]+date2[0]+date2[1]

        return date1 < date2 ? -1 : 1
    })
}

const apiNamespace = io.of('/api');


//socket connection
apiNamespace.on('connection',(socket)=>{

    socket.on('new-user', async()=>{
        const members = await User.find();
        apiNamespace.emit('new-user',members)
    })

    socket.on('join-room',async(newRoom,previousRoom)=>{
        socket.join(newRoom)
        socket.leave(previousRoom)
        let roomMessages=await getLastMessagesFromRoom(newRoom);
        roomMessages = sortRoomMessagesByDate(roomMessages);
        socket.emit('room-messages',roomMessages)
    })

    socket.on('message-room', async(room, content, sender, time, date)=>{
        console.log('new message', content);
        const newMessage = await Message.create({content, from: sender, time, date, to: room});
        let roomMessages = await getLastMessagesFromRoom(room);
        roomMessages=sortRoomMessagesByDate(roomMessages);

        //sending messages to room
        apiNamespace.to(room).emit('room-messages', roomMessages);

        socket.broadcast.emit('notifications', room)
    })
    
    app.delete('/api/logout', async(req,res)=>{
        try {
            console.log(req.body);

            const {_id,newMessage} = req.body;
            const user= await User.findById(_id);
            user.status = "offline"
            user.newMessage=newMessage;
            await user.save();
            const members = await User.find();
            socket.broadcast.emit('new-user', members);
            res.status(200).send();
            
        } catch (e) {
            console.log(e);
            res.status(400).send();
        }
    })


})

server.listen(PORT,()=>{
    console.log(`listening to port`, PORT);
})