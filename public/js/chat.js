const socket = io();
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//query parsing
const { username, room } = Qs.parse(location.search,{ ignoreQueryPrefix: true});

const autoscroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild
    
    //Height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
   
    //visible height
    const visibleheight =  $messages.offsetHeight;

    //Height of message container
    const containerHeight = $messages.scrollHeight;

    //How far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleheight;

    if(containerHeight-newMessageHeight<=scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }


}

socket.on('message',(message)=>{
    console.log(message);
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll();
})

socket.on('locationMessage',(location)=>{
    console.log(location);
    const html = Mustache.render(locationTemplate,{
        username: location.username,
        location: location.text,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll();
})

socket.on('roomData',({ room, users}) => {
   const html = Mustache.render(sidebarTemplate,{
       room,
       users
   })    
   document.querySelector('#sidebar').innerHTML = html
})



$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();

    $messageFormButton.setAttribute('disabled','disabled');

    const msg = e.target.elements.message.value
    socket.emit('sendMessage',msg,(error)=>{

        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(error){
               return console.log(error);
           }
               console.log("Delivered");
           
    });

})

$locationButton.addEventListener('click',()=>{
    
    if(!navigator.geolocation){
         return alert('Geolocation is not supported by your user!');
     }
     
    $locationButton.setAttribute('disabled','disabled');

     navigator.geolocation.getCurrentPosition((position)=>{

        socket.emit('sendLocation',{
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
        },()=>{
            $locationButton.removeAttribute('disabled');
            console.log("Location is Shared");
        })
    
    })
    
})

socket.emit('join', { username, room },(error)=>{
         if(error){
             alert(error);
             location.href = "/";
         }
});