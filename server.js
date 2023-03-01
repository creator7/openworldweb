var express  = require('express');//import express NodeJS framework module
var app      = express();// create an object of the express module
var http     = require('http').Server(app);// create a http web server using the http library
var io       = require('socket.io')(http);// import socketio communication module
const url = require('url');
const port = 3000;

app.use("/public/TemplateData",express.static(__dirname + "/public/TemplateData"));
app.use("/public/Build",express.static(__dirname + "/public/Build"));
app.use(express.static(__dirname+'/public'));

var clients			= [];// to storage clients
var clientLookup = {};// clients search engine
var sockets = {};//// to storage sockets

function getDistance(x1, y1, x2, y2){
    let y = x2 - x1;
    let x = y2 - y1;
    
    return Math.sqrt(x * x + y * y);
}



//open a connection with the specific client
io.on('connection', function(socket){

   //print a log in node.js command prompt
  console.log('A user ready for connection!');
  
  //to store current client connection
  var currentUser;
  
  var sended = false;
  
  var muteAll = false;
	
	
	//create a callback fuction to listening EmitPing() method in NetworkMannager.cs unity script
	// socket.on('PING', function (_pack)
	// {
	//   //console.log('_pack# '+_pack);
	//   var pack = JSON.parse(_pack);	

	//     console.log('message from user# '+socket.id+": "+pack.msg);
        
	// 	 //emit back to NetworkManager in Unity by client.js script
	// 	 socket.emit('PONG', socket.id,pack.msg);
		
	// });

		//  //create a callback fuction to listening EmitPing() method in NetworkMannager.cs unity script
		 socket.on("PING",function(pack){


			console.log('message from user# '+socket.id+": "+pack.msg);
		 
			var json_pack = {
				socket_id : socket.id,
			  	message:"pong!!!"
			};
		 
		   socket.emit("PONG",  json_pack);
		});
	
	//create a callback fuction to listening EmitJoin() method in NetworkMannager.cs unity script
	socket.on('JOIN', function (pack)
	{
	
	    console.log('[INFO] JOIN received !!! ');

		var data = JSON.parse(pack);

         // fills out with the information emitted by the player in the unity
        currentUser = {
			       name:data.name,
				   publicAddress: data.publicAddress,
				   model:data.model,
                   posX:data.posX,
				   posY:data.posY,
				   posZ:data.posZ,
				   rotation:'0',
			       id:socket.id,//alternatively we could use socket.id
				   socketID:socket.id,//fills out with the id of the socket that was open
				   muteUsers:[],
				   muteAll:false,
				   isMute:true
				   };//new user  in clients list
					
				   console.log('PLOTX ' + data.plotX);
				   console.log('PLOTY ' + data.plotY);

		console.log('[INFO] player '+currentUser.name+': logged!');
		console.log('[INFO] currentUser.position '+currentUser.position);	

		 //add currentUser in clients list
		 clients.push(currentUser);
		 
		 //add client in search engine
		 clientLookup[currentUser.id] = currentUser;
		 
		 sockets[currentUser.id] = socket;//add curent user socket
		 
		 console.log('[INFO] Total players: ' + clients.length);
		 
		var currentUserAtr = currentUser.id+','+currentUser.name+','+currentUser.posX+','+currentUser.posY+','+currentUser.posZ+','+currentUser.model;
		 /*********************************************************************************************/		
		

		//send to the client.js script
		socket.emit("JOIN_SUCCESS",currentUserAtr);
		//socket.emit("JOIN_SUCCESS",currentUser);
		
         //spawn all connected clients for currentUser client 
         clients.forEach( function(i) {
		    if(i.id!=currentUser.id)
			{
				var currentUserAtr = i.id+','+i.name+','+i.posX+','+i.posY+','+i.posZ+','+i.model; 
		      //send to the client.js script
		       socket.emit('SPAWN_PLAYER',currentUserAtr);

		    }//END_IF
	   
	     });//end_forEach

		 var currentUserBrod = currentUser.id+','+currentUser.name+','+currentUser.posX+','+currentUser.posY+','+currentUser.posZ+','+data.model;
		 // spawn currentUser client on clients in broadcast
		socket.broadcast.emit('SPAWN_PLAYER',currentUserBrod);
		
  
	});//END_SOCKET_ON
	
	
	

	
		
	//create a callback fuction to listening EmitMoveAndRotate() method in NetworkMannager.cs unity script
	socket.on('MOVE_AND_ROTATE', function (_data)
	{
	  var data = JSON.parse(_data);

	  if(currentUser)
	  {

       currentUser.posX= data.posX;
	   currentUser.posY = data.posY;
	   currentUser.posZ = data.posZ;
	   
	   currentUser.rotation = data.rotation;

	   var currentUserAttr = currentUser.id+','+currentUser.posX+','+currentUser.posY+','+currentUser.posZ+','+currentUser.rotation;
	   
	  
	   // send current user position and  rotation in broadcast to all clients in game
       socket.broadcast.emit('UPDATE_MOVE_AND_ROTATE', currentUserAttr);

       }
	});//END_SOCKET_ON
	
		//create a callback fuction to listening EmitAnimation() method in NetworkMannager.cs unity script
	socket.on('ANIMATION', function (_data)
	{
	  var data = JSON.parse(_data);	
	  
	  if(currentUser)
	  {
	   
	   currentUser.timeOut = 0;
	   var currentUserAttr = currentUser.id+','+data.speed+','+data.motionSpeed+','+data.grounded+','+data.jump+','+data.freefall;
	    //send to the client.js script
	   //updates the animation of the player for the other game clients
       socket.broadcast.emit('UPDATE_PLAYER_ANIMATOR', currentUserAttr);
	
	   
      }//END_IF
	  
	});//END_SOCKET_ON

	socket.on('INFO_CHANGED', function (_data)
	{
	  var data = JSON.parse(_data);	
	  
	  if(currentUser)
	  {
	   	var currentUserAttr = currentUser.id+','+data.model+','+data.name;

		   for (var i = 0; i < clients.length; i++)
		   {
			  if (clients[i].name == currentUser.name && clients[i].id == currentUser.id) 
			  {
					clients[i].name = currentUser.name = data.name;
					clients[i].model = currentUser.model = data.model;
				  console.log("User "+clients[i].name+" info has changed");
  
			  };
		  };

	    //send to the client.js script
	   //updates the animation of the player for the other game clients
       	socket.broadcast.emit('UPDATE_PLAYER_INFO', currentUserAttr);
	
	   
      }//END_IF
	  
	});//END_SOCKET_ON
	

    // called when the user desconnect
	socket.on('disconnect', function ()
	{
     
	    if(currentUser)
		{
		 currentUser.isDead = true;
		 
		 //send to the client.js script
		 //updates the currentUser disconnection for all players in game
		 socket.broadcast.emit('USER_DISCONNECTED', currentUser.id);
		
		
		 for (var i = 0; i < clients.length; i++)
		 {
			if (clients[i].name == currentUser.name && clients[i].id == currentUser.id) 
			{

				console.log("User "+clients[i].name+" has disconnected");
				clients.splice(i,1);

			};
		};
		
		}
		
    });//END_SOCKET_ON
		
});//END_IO.ON



http.listen(process.env.PORT ||3000, function(){
	console.log('listening on *:3000');
});


console.log("------- server is running -------");