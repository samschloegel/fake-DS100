const oscmin = require('osc-min');

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

module.exports = {
	fromBuffer,
	toBuffer: oscmin.toBuffer,
	applyAddressTransform: oscmin.applyAddressTransform,
	applyMessageTransform: oscmin.applyMessageTransform,
	timetagToDate: oscmin.timetagToDate,
	dateToTimetag: oscmin.dateToTimetag,
	timetagToTimestamp: oscmin.timetagToTimestamp,
	timestampToTimetag: oscmin.timestampToTimetag,
};
