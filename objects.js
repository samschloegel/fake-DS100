const objects = [];

for (let num = 1; num <= 64; num += 1) {
	const object = {
		num,
		x: 0,
		y: 0,
	};
	objects.push(object);
}

module.exports = objects;
