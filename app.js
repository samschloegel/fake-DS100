/* eslint-disable no-unused-vars */
const osc = require("osc-min");
const udp = require("dgram");
const config = require("./config.json");
const { objects: posCache } = require("./objects.json");
const EventEmitter = require("events");

const emitter = new EventEmitter();

let server = udp.createSocket("udp4");

// Listen for incoming OSC
server.bind({
	port: config.DS100.Port
});

// Server error handling (closes listening port)
server.on("error", (err) => {
	//console.log(`server error:\n${err.stack}`);
	console.log(err);
	console.log("server will close");
	server.close();
});

// Log server Listening event
server.on("listening", () => {
	const address = server.address();
	console.log(`Fake DS100 listening on ${address.address}:${address.port}`);
});

// Incoming message handling
server.on("message", (msg, rinfo) => {
	let oscMessage;
	try {
		oscMessage = osc.fromBuffer(msg);
		oscMessage.argsArr = oscMessage.args.map((arg) => arg.value);
		oscMessage.pathArr = oscMessage.address.split("/").slice(1);
		console.log(
			`Fake DS100 received: ${oscMessage.address} ${oscMessage.argsArr.join(" ")} from ${rinfo.address}:${rinfo.port}`
		);
	} catch (err) {
		console.error(err);
	}
	if (oscMessage && oscMessage.address.startsWith("/dbaudio1")) {
		emitter.emit("dbaudio1", oscMessage);
	} else if (oscMessage && oscMessage.address.startsWith("/fakeDS100")) {
		emitter.emit("fakeds100", oscMessage);
	}
});

// /fakeds100...
emitter.on("fakeds100", function(oscMessage) { // Parse messages beginning with /fakeDS100
	if (oscMessage.pathArr[1] === "randomize") {
		emitter.emit("randomize", oscMessage);
	}
});

// /fakeds100/randomize
emitter.on("randomize", function(oscMessage) {
	posCache.forEach(obj => {
		obj.x = Math.random();
		obj.y = Math.random();
		emitter.emit("cacheRandomized", oscMessage);
	});
});

// /dbaudio1...
emitter.on("dbaudio1", function (oscMessage) { 
	if (oscMessage.pathArr[1] === "coordinatemapping") {
		
		let mapping = parseInt(oscMessage.pathArr[3]);
		let objNum = parseInt(oscMessage.pathArr[4]);
		
		if (oscMessage.argsArr.length === 0) { // No arguments, send current coordinates
			emitter.emit("posQueried", oscMessage);
		} else { // Save new position to cache
			emitter.emit("newCoordinatesReceived", oscMessage);
		}

	}
});

// Send cached position of queried object
const sendObjPos = function(oscMessage) {
	let objNum = parseInt(oscMessage.pathArr[4]);
	let mapping = oscMessage.pathArr[3];

	let queriedObj = posCache.filter(item => item.num === objNum).pop(); // posCache object
	let currentX = queriedObj.x;
	let currentY = queriedObj.y;

	let currentPos = {
		oscType: "message",
		address: `/dbaudio1/coordinatemapping/source_position_xy/${mapping}/${objNum}`,
		args: [currentX, currentY]
	};

	let buffer = osc.toBuffer(currentPos);

	server.send(buffer, 0, buffer.length, config.DS100.Reply, "localhost", (err) => { // localhost is placeholder
		if (err) {throw err;}
		console.log(`Fake DS100 sent: ${currentPos.address} ${currentPos.args.join(" ")}`);
	});

};
emitter.on("cacheRandomized", (oscMessage) => sendObjPos(oscMessage));
emitter.on("posQueried", (oscMessage) => sendObjPos(oscMessage));
emitter.on("cacheUpdated", (oscMessage) => sendObjPos(oscMessage));

// Store received coordinated to cache, emit cacheUpdated
const cacheObjPos = function (oscMessage) {
	
	let newX, newY;
	if (oscMessage.pathArr[2].endsWith("_y")) {
		[newY] = oscMessage.argsArr;
	} else {
		[newX, newY] = oscMessage.argsArr;
	}

	let objNum = parseInt(oscMessage.pathArr[4]);
	let mapping = parseInt(oscMessage.pathArr[3]);

	let queriedObj = posCache.filter((item) => item.num === objNum).pop();
	typeof newX !== "undefined" ? (queriedObj.x = newX) : "";
	typeof newY !== "undefined" ? (queriedObj.y = newY) : "";

	emitter.emit("cacheUpdated", oscMessage); // Send new object position
};
emitter.on("newCoordinatesReceived", (oscMessage) => cacheObjPos(oscMessage));