/* eslint-disable no-unused-vars */
const osc = require("osc-min");
const udp = require("dgram");
const config = require("./config.json");
const { objects: posCache } = require("./objects.json");

let server = udp.createSocket("udp4");

// Listen for incoming OSC
server.bind({
	port: config.DS100.Port
});

// Server error handling (closes listening port)
server.on("error", (err) => {
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
		if (oscMessage.argsArr.length > 0) {
			oscMessage.oscString = `${oscMessage.address} ${oscMessage.argsArr.join(" ")}`;
		} else {
			oscMessage.oscString = `${oscMessage.address}`;
		}
		console.log(
			`Fake DS100 received: ${oscMessage.address} ${oscMessage.argsArr.join(" ")} from ${rinfo.address}:${rinfo.port}`
		);
	} catch (err) {
		console.error(err);
	}
	if (oscMessage && oscMessage.address.startsWith("/dbaudio1")) {
		server.emit("dbaudio1", oscMessage);
	} else if (oscMessage && oscMessage.address.startsWith("/fakeDS100")) {
		server.emit("fakeds100", oscMessage);
	}
});

// /fakeds100...
server.on("fakeds100", function(oscMessage) {
	if (oscMessage.pathArr[1] === "randomize") {
		server.emit("randomize", oscMessage);
	} else {
		console.error(`Fake DS100 received an unusable message: ${oscMessage.oscString}`);
	}
});

// /fakeds100/randomize
server.on("randomize", function(oscMessage) {
	posCache.forEach(obj => {
		obj.x = Math.random();
		obj.y = Math.random();
	});
	server.emit("cacheRandomized");
	posCache.forEach(cacheObj => {
		sendCacheObjPos(cacheObj);
	});
});

// /dbaudio1...
server.on("dbaudio1", function(oscMessage) { 
	if (oscMessage.pathArr[1] === "coordinatemapping") {
		
		let mapping = parseInt(oscMessage.pathArr[3]);
		let objNum = parseInt(oscMessage.pathArr[4]);
		
		if (oscMessage.argsArr.length === 0) { // No arguments, send current coordinates
			server.emit("posQueried", oscMessage);
		} else { // Save new position to cache
			server.emit("newCoordinatesReceived", oscMessage);
		}

	}
});

const getCacheObj = function(key, value, cache = posCache) {
	return cache.filter(item => item[key] === value).pop();
};

// Send cached position of queried object BASED ON oscMessage
const sendObjPos = function(oscMessage) {
	let objNum = parseInt(oscMessage.pathArr[4]);
	let mapping = oscMessage.pathArr[3];
	let queriedObj = getCacheObj("num", objNum, posCache);
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
server.on("posQueried", sendObjPos);
server.on("cacheUpdated", sendObjPos);

const sendCacheObjPos = function(cacheObj) {
	let mapping = config.DS100.defaultMapping;
	let currentPos = {
		oscType: "message",
		address: `/dbaudio1/coordinatemapping/source_position_xy/${mapping}/${cacheObj.num}`,
		args: [cacheObj.x, cacheObj.y]
	};

	let buffer = osc.toBuffer(currentPos);

	server.send(buffer, 0, buffer.length, config.DS100.Reply, "localhost", (err) => { // localhost is placeholder
		if (err) { throw err; }
		console.log(`Fake DS100 sent: ${currentPos.address} ${currentPos.args.join(" ")}`);
	});
};

// Store received coordinates to cache, emit cacheUpdated
const cacheObjPos = function(oscMessage) {
	
	let newX, newY;
	if (oscMessage.pathArr[2].endsWith("_y")) {
		[newY] = oscMessage.argsArr;
	} else {
		[newX, newY] = oscMessage.argsArr;
	}

	let objNum = parseInt(oscMessage.pathArr[4]);
	let mapping = parseInt(oscMessage.pathArr[3]);

	let queriedObj = getCacheObj("num", objNum, posCache);
	typeof newX !== "undefined" ? (queriedObj.x = newX) : "";
	typeof newY !== "undefined" ? (queriedObj.y = newY) : "";

	server.emit("cacheUpdated", oscMessage); // Send new object position
};
server.on("newCoordinatesReceived", (oscMessage) => cacheObjPos(oscMessage));