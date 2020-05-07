const path = require('path');
const express = require('express');
const app =  express();
const http = require('http');
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public');
const Filter = require('bad-words');
const {generateMessage} = require('./utils/messages');
const { addUser ,removeUser ,getUser ,getUsersInRoom } = require('./utils/users');
app.use(express.static(publicDirectoryPath));

io.on('connection',(socket)=>{
    console.log("New Websocket Connection!");
    
    socket.on('join',({ username, room },callback)=>{
            const {error, user} = addUser({id: socket.id, username, room})
            if(error){
                return callback(error);
            }
            socket.join(user.room);
            socket.emit('message', generateMessage('Admin','Welcome!'));
            socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has Joined!`));
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })

            callback();
    })

    socket.on('sendMessage',(msg,callback)=>{
        const user = getUser(socket.id);
        const filter = new Filter();
        if(filter.isProfane(msg)){
                return callback('profanity is not allowed!');
        } 
        
        io.to(user.room).emit('message',generateMessage(user.username,msg));
        callback();
    })

    socket.on('sendLocation',(coords,callback)=>{
         const user = getUser(socket.id);
         io.to(user.room).emit('locationMessage',generateMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
         callback();
   })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        if(user){
            io.emit('message',generateMessage('Admin',`${user.username} has left`));
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
    })

})

server.listen(port,()=>{
    console.log(`Server is Running on port ${port}!`);
})

