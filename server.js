const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let cliens = [];
let messages = {};

class User {

	constructor(id, name, ws){
		this.id = id;
		this.name = name;
		this.ws = ws;
	}
}

function newMessage(id1, id2, message) {
	key = id1 < id2 ? `${id1}/${id2}` : `${id2}/${id1}`;
	messageObj = {message: message,
				senderId: id1,
	}
	messages[key] ? messages[key].push(messageObj) : messages[key] = [messageObj];
}

function getMessages(id1, id2) {
	key = id1 < id2 ? `${id1}/${id2}` : `${id2}/${id1}`;
	return messages[key];
}

function getDialog(id) {
	response = [];
	for(dialog in messages) {
		if (dialog.split('/').includes(JSON.stringify(id))) {
			response.push(messages[dialog]);
		}
	}
	return(response);
}

wss.on('connection', function connection(ws) {
	let user;
	let toUserId;
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    let data = JSON.parse(message); //{"connect" id : "asd" dasd }
    if(data.connect >= 0){
    	user = new User(data.id, data.name, ws);
    	cliens[data.id] = user;
    	toUserId = data.connect;
    	ws.send(JSON.stringify({messages: getMessages(user.id, data.connect), 'start': 1}))
    }

    if(data.message){ // {message: "dasdasd", to: 1 } 
    	if (cliens[toUserId]){
    		messageObj = {
    			message: data.message,
    			senderId: user.id,
    		}
    		cliens[toUserId].ws.send(JSON.stringify(messageObj));
    	}
	    newMessage(user.id, toUserId, data.message);
    }

    if(data.method === 'dialogs'){
    	let response = {
    		dialogs: getDialog(data.id),
    	};
    	console.log(response);
    	ws.send(JSON.stringify(response))
    }

    if(data.close) {
    	cliens.splice(user.id, 1);
    	ws.terminate();
    }
  });
});