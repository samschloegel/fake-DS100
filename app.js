const udp = require('dgram');
const osc = require('./oscextended.js');
const config = require('./config.json');
const posCache = require('./objects.json');

const server = udp.createSocket('udp4');

server.bind({
	port: config.DS100.Port,
});

server.on('error', (err) => {
	console.log(err);
	server.close(() => {
		console.log('server closed');
	});
});

server.on('listening', () => {
	const address = server.address();
	console.log(`Fake DS100 listening on ${address.address}:${address.port}`);
	server.emit('randomize');
});

server.on('message', (msg, rinfo) => {
	let oscMessage;
	try {
		oscMessage = osc.fromBuffer(msg);
		console.log(`Fake DS100 received: ${oscMessage.oscString} from ${rinfo.address}:${rinfo.port}`);
	} catch (err) {
		console.error(err);
	}

	if (oscMessage.pathArr[0] === 'dbaudio1') {
		server.emit('dbaudio1', oscMessage);
	} else if (oscMessage.pathArr[0] === 'fakeds100') {
		server.emit('fakeds100', oscMessage);
	} else {
		console.error(`Fake DS100 received an unusable message: ${oscMessage.oscString}`);
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

function getCacheObj(objNum) {
	return posCache.filter((cacheObj) => cacheObj.num === objNum).pop();
}

function updateCacheObjPos(oscMessage) {
	let newX;
	let newY;
	if (oscMessage.pathArr[2].endsWith('_y')) {
		[newY] = oscMessage.argsArr;
	} else {
		[newX, newY] = oscMessage.argsArr;
	}

	const objNum = parseInt(oscMessage.pathArr[4]);

	const queriedObj = getCacheObj(objNum);

	if (typeof newX !== 'undefined') queriedObj.x = newX;
	if (typeof newY !== 'undefined') queriedObj.y = newY;

	server.emit('cacheUpdated', oscMessage);
}

function sendObjPos(oscMessage) {
	const objNum = parseInt(oscMessage.pathArr[4]);
	const mapping = oscMessage.pathArr[3];
	const queriedObj = getCacheObj(objNum);

	const message = {
		oscType: 'message',
		address: `/dbaudio1/coordinatemapping/source_position_xy/${mapping}/${objNum}`,
		args: [queriedObj.x, queriedObj.y],
	};

	const buffer = osc.toBuffer(message);

	server.send(buffer, 0, buffer.length, config.DS100.Reply, 'localhost', (err) => {
		if (err) {
			throw err;
		}
		console.log(`Fake DS100 sent: ${message.address} ${message.args.join(' ')}`);
	});
}
server.on('posQueried', sendObjPos);
server.on('cacheUpdated', sendObjPos);

server.on('fakeds100', (oscMessage) => {
	if (oscMessage.pathArr[1] === 'randomize') {
		console.log('Randomizing!');
		posCache.forEach((obj) => {
			// eslint-disable-next-line no-param-reassign
			obj.x = Math.random();
			// eslint-disable-next-line no-param-reassign
			obj.y = Math.random();
		});
		posCache.forEach((cacheObj) => {
			sendCacheObjPos(cacheObj);
		});
	} else {
		console.error(`Fake DS100 received an unusable message: ${oscMessage.oscString}`);
	}
});

server.on('dbaudio1', (oscMessage) => {
	if (oscMessage.pathArr[1] === 'coordinatemapping') {
		if (oscMessage.argsArr.length === 0) {
			server.emit('posQueried', oscMessage);
		} else {
			updateCacheObjPos(oscMessage);
		}
	}
});
