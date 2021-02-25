# fakeDS100

An OSC utility for mimicking some d&amp;b audiotechnik DS100 OSC replies.

**DISCLAIMER**: I am a live sound person, NOT a software developer. I am very new to Node, JavaScript, Git, and frankly coding in general. If this project is a mess, or looks ridiculous, sorry about that.

If you are like me and this is all very new to you, and you think you might want to use this and need help or have some questions, please [email me](mailto:samsdomainaddress@gmail.com)! I would love to hear from you.

---

## Initial Setup

### Your QLab workspace

You may have a QLab workspace already built, with a network patch addressed to your DS100. Maybe something like this:

![alt text](./assets/qlab_network_window.png)

To use fakeds100 instead of your fancy, expensive REAL DS100, change the address of your DS100 Network patch (Patch #2 in the example above) to localhost. The port number should remain at 50010.

---

### objects.js

Exports from the `objects.js` file are used as the cache of En-Scene objects. If for some reason you'd rather not have all 64 objects exist, alter the file to export the objects array you want.

The exports should be an array of objects resembling this one:

```js
{
  num: 1,
  x: 0.0,
  y: 0.0
}
```

---

## Running the app

Assuming you have node.js installed:

Open a terminal window, `cd` into the fakeds100 repository, and enter `npm start` to start the program.

To stop, end the terminal session or press `⌃C` on your keyboard.

### Initial State

Upon running the app, a cache of current object positions is initialized from the `objects.js` file. Objects must be present in this file in order to work with fakeds100. For example, sending a query for the current position of En-Scene object #5 will not work is there is not a `{ num: 5 }` object exported from `objects.js`.

---

## OSC Commands

fakeds100 responds to a very limited set of the commands that a real DS100 would respond to. The full OSC library for a real DS100 can be found on d&b's [DS100 Downloads page](https://www.dbaudio.com/global/en/products/processing-matrix/ds100/#tab-downloads).

The limited set of commands that fakeds100 **will** respond to are documented here:

### /fakeds100/...

```
/fakeds100/randomize
```

Updates x and y coordinates of each object in the cache to a random number between 0 and 1, then sends the new cached coordinates of the object (with the default mapping)

---

### /dbaudio1/coordinatemapping...

```
/dbaudio1/coordinatemapping/source_position_x/[mapping]/[object] [x]
```

If an argument is provided, updates cached x coordinate, then sends cached x and y coordinates.

```
/dbaudio1/coordinatemapping/source_position_y/[mapping]/[object] [y]
```

If an argument is provided, updates cached y coordinate, then sends cached x and y coordinates.

```
/dbaudio1/coordinatemapping/source_position_xy/[mapping]/[object] [x] [y]
```

If arguments are provided, updates cached x and y coordinates, then sends cached x and y coordinates.

---

## That's it

That's all for now. Hopefully more to come sometime. You can watch this GitHub repo for future updates or [send me an email](mailto:samsdomainaddress@gmail.com).

If you find any bugs or have feature requests please [submit an issue](https://github.com/samschloegel/fake-DS100/issues).
