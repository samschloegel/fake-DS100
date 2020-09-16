const osc = require("osc-min");
const udp = require("dgram");
const config = require("./config.json");
const { objects: posCache } = require("./objects.json");

let server = udp.createSocket("udp4");

// Listen for incoming OSC
server.bind({
  port: config.DS100.Port
});

// Error handling (closes listening port)
server.on("error", (err) => {
  console.log(`server error:\n${err.stack}`);
  console.log(`server will close`);
  server.close();
});

// Log Listening event
server.on("listening", () => {
  const address = server.address();
  console.log(`Fake DS100 listening on ${address.address}:${address.port}`);
});

// Incoming message initial handling
server.on("message", (msg, rinfo) => {
  let message;
  try {
    message = osc.fromBuffer(msg);
    let args = message.args.map((arg) => arg.value);
    let received = `${message.address} ${args.join(" ")}`;
    console.log(
      `--------------------------------\nFake DS100 received: ${received} from ${rinfo.family} address ${rinfo.address}:${rinfo.port} (size ${rinfo.size})`
    );
  } catch (err) {
    console.error(err);
  }
  if (message && message.address.startsWith("/dbaudio1")) {
    parseDbaudio1(message);
  } else if (message && message.address.startsWith("/fakeDS100")) {
    parseFakeDS100(message);
  }
});

const parseFakeDS100 = function(oscMessage) { // Parse messages beginning with /fakeDS100
  let addressArr = oscMessage.address.split("/").slice(2);
  let args = oscMessage.args.map((arg) => arg.value);
  if (addressArr[0] === "randomize") {
    posCache.forEach(obj => {
      obj.x = Math.random();
      obj.y = Math.random();
      replyObjPos(obj.num, config.DS100.defaultMapping);
    });
  };
}

const parseDbaudio1 = function (oscMessage) { // Parse messages beginning with /dbaudio1
  let addressArr = oscMessage.address.split("/").slice(2);
  let args = oscMessage.args.map((arg) => arg.value);
  //console.log(args);
  if (addressArr[0] === "coordinatemapping") {
    let mapping = addressArr[2];
    let objNum = addressArr[3];
    if (args.length === 0) {
      replyObjPos(objNum, mapping);
    } else {
      let newX, newY;
      if (addressArr[1].endsWith("_y")) {
        [newY] = args;
      } else {
        [newX, newY] = args;
      }
      console.log(newX, newY);
      let mapping = addressArr[2];
      let obj = parseInt(addressArr[3]);
      cacheObjPos(obj, [newX, newY]);
      replyObjPos(obj, mapping);
    };

  };
};

const replyObjPos = function(objNum, mapping) { // objNum is an integer corresponding to DS100 Obj number
  if (typeof objNum === "string") {
    objNum = parseInt(objNum);
  }
  let queriedObj = posCache.filter(item => item.num === objNum).pop()
  let currentX = queriedObj.x;
  let currentY = queriedObj.y;
  let currentPos = {
    oscType: "message",
    address: `/dbaudio1/coordinatemapping/source_position_xy/${mapping}/${objNum}`,
    args: [
      {
        type: "float",
        value: currentX
      },
      {
        type: "float",
        value: currentY
      }
    ]
  };
  let buffer = osc.toBuffer(currentPos);
  server.send(buffer, 0, buffer.length, config.DS100.Reply, "localhost", () => { // localhost is placeholder
    console.log(
      `Fake DS100 replied: ${currentPos.address} ${currentPos.args
        .map((arg) => arg.value)
        .join(" ")}`
    );
  });
};

const cacheObjPos = function (objNum, args) { // objNum is an integer corresponding to DS100 Obj number
  let queriedObj = posCache.filter(item => item.num === objNum).pop()
  //let objIndex = posCache.indexOf(queriedObj);
  let newX = args[0];
  let newY = args[1];
  newX !== undefined ? queriedObj.x = newX : "";
  newY !== undefined ? queriedObj.y = newY : "";
};