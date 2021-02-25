const udp = require('dgram');
const oscmin = require('osc-min');
const { toBuffer } = require('osc-min');

const inPort = 50010;
const outPort = 50011;
const defaultMapping = 1;

const cache = require('./objects');

const server = udp.createSocket('udp4');
server.bind(inPort);

function fromBuffer(msg) {
	const oscMinMsg = oscmin.fromBuffer(msg);
	const extendedMsg = oscMinMsg;
	extendedMsg.pathArr = oscMinMsg.address.split('/').slice(1);
	extendedMsg.argsArr = oscMinMsg.args.map((arg) => arg.value);
	if (extendedMsg.argsArr.length > 0) {
		extendedMsg.oscString = `${oscMinMsg.address} ${oscMinMsg.argsArr.join(' ')}`;
	} else {
		extendedMsg.oscString = `${oscMinMsg.address}`;
	}
	return extendedMsg;
}

function getCacheObj(objNum) {
	const num = parseInt(objNum);
	return cache.find((cacheObj) => cacheObj.num === num);
}

function sendPosition(cacheObj, destAddress, mapping = defaultMapping) {
	const currentPos = {
		oscType: 'message',
		address: `/dbaudio1/coordinatemapping/source_position_xy/${mapping}/${cacheObj.num}`,
		args: [cacheObj.x, cacheObj.y],
	};
	const buffer = toBuffer(currentPos);
	server.send(buffer, 0, buffer.length, outPort, destAddress, (error) => {
		// localhost is placeholder
		if (error) {
			throw error;
		}
		console.log(
			`Sent:     ${currentPos.address} ${currentPos.args.join(' ')} to ${destAddress}:${outPort}`
		);
	});
}

function updateCoordinates(oscMessage) {
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
}

function handlefakeds100(oscMessage, rinfo) {
	if (oscMessage.pathArr[1] === 'randomize') {
		console.log('Randomizing!');
		cache.forEach((cacheObj) => {
			// eslint-disable-next-line no-param-reassign
			cacheObj.x = Math.random();
			// eslint-disable-next-line no-param-reassign
			cacheObj.y = Math.random();

			sendPosition(cacheObj, rinfo.address);
		});
	} else {
		console.error(`Received an unusable message: ${oscMessage.oscString}`);
	}
}

function handledbaudio1(oscMessage, rinfo) {
	const coordMapRegex = /\/dbaudio1\/coordinatemapping\/source_position(_(x|y|xy))?\/[1-4]\/([1-9]$|[1-5][0-9]|6[0-4])/;
	if (coordMapRegex.test(oscMessage.address)) {
		const queriedObj = getCacheObj(oscMessage.pathArr[4]);
		if (oscMessage.argsArr.length === 0) {
			sendPosition(queriedObj, rinfo.address);
		} else {
			updateCoordinates(oscMessage);
			sendPosition(queriedObj, rinfo.address);
		}
	} else {
		console.log('Received an unusable /dbaudio1 message');
	}
}

server.on('error', (error) => {
	console.error(error);
	server.close(() => {
		console.log('server closed');
	});
});

server.on('listening', () => {
	const address = server.address();
	console.log(`Listening on port ${address.port}`);
	server.emit('randomize');
});

server.on('message', (msg, rinfo) => {
	let oscMessage;
	try {
		oscMessage = fromBuffer(msg);
		console.log(`Received: ${oscMessage.oscString} from ${rinfo.address}:${rinfo.port}`);
	} catch (error) {
		console.error(error);
	}

	if (oscMessage.pathArr[0] === 'dbaudio1') {
		handledbaudio1(oscMessage, rinfo);
	} else if (oscMessage.pathArr[0] === 'fakeds100') {
		handlefakeds100(oscMessage, rinfo);
	} else {
		console.error(`Received an unusable message: ${oscMessage.oscString}`);
	}
});
