/* eslint-disable no-unused-vars */
const osc = require('osc-min');
const udp = require('dgram');
const config = require('./config.json');
const { objects: posCache } = require('./objects.json');

const server = udp.createSocket('udp4');

// Listen for incoming OSC
server.bind({
	port: config.DS100.Port,
});

// Server error handling (closes listening port)
server.on('error', (err) => {
	console.log(err);
	console.log('server will close');
	server.close();
});

// Log server Listening event
server.on('listening', () => {
	const address = server.address();
	console.log(`Fake DS100 listening on ${address.address}:${address.port}`);
});

// Incoming message handling
server.on('message', (msg, rinfo) => {
	let oscMessage;
	try {
		oscMessage = osc.fromBuffer(msg);
		oscMessage.argsArr = oscMessage.args.map((arg) => arg.value);
		oscMessage.pathArr = oscMessage.address.split('/').slice(1);
		console.log(oscMessage.pathArr);
		if (oscMessage.argsArr.length > 0) {
			oscMessage.oscString = `${oscMessage.address} ${oscMessage.argsArr.join(' ')}`;
		} else {
			oscMessage.oscString = `${oscMessage.address}`;
		}
		console.log(`Fake DS100 received: ${oscMessage.oscString} from ${rinfo.address}:${rinfo.port}`);
	} catch (err) {
		console.error(err);
	}
	if (oscMessage.pathArr[0] === 'dbaudio1') {
		server.emit('dbaudio1', oscMessage);
	} else if (oscMessage.pathArr[0] === 'fakeds100') {
		server.emit('fakeds100', oscMessage);
	} else {
		console.log('that didnt work!');
	}
});

function sendCacheObjPos(cacheObj) {
	const mapping = config.DS100.defaultMapping;
	const currentPos = {
		oscType: 'message',
		address: `/dbaudio1/coordinatemapping/source_position_xy/${mapping}/${cacheObj.num}`,
		args: [cacheObj.x, cacheObj.y],
	};

	const buffer = osc.toBuffer(currentPos);

	server.send(buffer, 0, buffer.length, config.DS100.Reply, 'localhost', (err) => {
		// localhost is placeholder
		if (err) {
			throw err;
		}
		console.log(`Fake DS100 sent: ${currentPos.address} ${currentPos.args.join(' ')}`);
	});
}

// /fakeds100...
server.on('fakeds100', (oscMessage) => {
	console.log('/fakeds100/');
	if (oscMessage.pathArr[1] === 'randomize') {
		server.emit('randomize', oscMessage);
	} else {
		console.error(`Fake DS100 received an unusable message: ${oscMessage.oscString}`);
	}
});

// /fakeds100/randomize
server.on('randomize', (oscMessage) => {
	console.log('Randomizing!');
	posCache.forEach((obj) => {
		// eslint-disable-next-line no-param-reassign
		obj.x = Math.random();
		// eslint-disable-next-line no-param-reassign
		obj.y = Math.random();
	});
	server.emit('cacheRandomized');
	posCache.forEach((cacheObj) => {
		sendCacheObjPos(cacheObj);
	});
});

// /dbaudio1...
server.on('dbaudio1', (oscMessage) => {
	if (oscMessage.pathArr[1] === 'coordinatemapping') {
		const mapping = parseInt(oscMessage.pathArr[3]);
		const objNum = parseInt(oscMessage.pathArr[4]);

		if (oscMessage.argsArr.length === 0) {
			// No arguments, send current coordinates
			server.emit('posQueried', oscMessage);
		} else {
			// Save new position to cache
			server.emit('newCoordinatesReceived', oscMessage);
		}
	}
});

const getCacheObj = (key, value, cache = posCache) => {
	return cache.filter((item) => item[key] === value).pop();
};

// Send cached position of queried object BASED ON oscMessage
const sendObjPos = (oscMessage) => {
	const objNum = parseInt(oscMessage.pathArr[4]);
	const mapping = oscMessage.pathArr[3];
	const queriedObj = getCacheObj('num', objNum, posCache);
	const currentX = queriedObj.x;
	const currentY = queriedObj.y;

	const currentPos = {
		oscType: 'message',
		address: `/dbaudio1/coordinatemapping/source_position_xy/${mapping}/${objNum}`,
		args: [currentX, currentY],
	};

	const buffer = osc.toBuffer(currentPos);

	server.send(buffer, 0, buffer.length, config.DS100.Reply, 'localhost', (err) => {
		// localhost is placeholder
		if (err) {
			throw err;
		}
		console.log(`Fake DS100 sent: ${currentPos.address} ${currentPos.args.join(' ')}`);
	});
};
server.on('posQueried', sendObjPos);
server.on('cacheUpdated', sendObjPos);

// Store received coordinates to cache, emit cacheUpdated
const cacheObjPos = (oscMessage) => {
	let newX;
	let newY;
	if (oscMessage.pathArr[2].endsWith('_y')) {
		[newY] = oscMessage.argsArr;
	} else {
		[newX, newY] = oscMessage.argsArr;
	}

	const objNum = parseInt(oscMessage.pathArr[4]);
	const mapping = parseInt(oscMessage.pathArr[3]);

	const queriedObj = getCacheObj('num', objNum, posCache);

	if (typeof newX !== 'undefined') queriedObj.x = newX;
	if (typeof newY !== 'undefined') queriedObj.y = newY;

	server.emit('cacheUpdated', oscMessage); // Send new object position
};
server.on('newCoordinatesReceived', (oscMessage) => cacheObjPos(oscMessage));
