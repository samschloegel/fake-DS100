# fakeDS100
**An OSC utility for mimicking d&amp;b audiotechnik DS100 OSC replies**

---

## Initial Setup

### Your QLab workspace

Change the address of your DS100 Network patch to localhost. Port number should remain at 50010.

### config.json

Change details in the ./config.json file as necessary before running.
As of this writing (Sept 17, 2020) DS100 and QLab port numbers are fixed by their respective creators and should not require changes here.

DS100.defaultMapping does not currently serve a purpose, added for future funcionality.

```
{
  "QLab": {
    "Port": "53000",
    "Address": "localhost"
  },
  "DS100": {
    "Port": "50010",
    "Reply": "50011",
    "Address": "localhost",
    "defaultMapping": "1"
  }
}
```

### objects.json

Edit, add, or remove your DS100 En-Scene objects here. Each object has a **num** property which corresponds to its DS100 input number.
The **name** property does not currently serve a purpose, added for future functionality and easier management of the file.

```
{
  "objects": [
    {
      "num": 1,
      "name": "Homer",
      "x": 0.0,
      "y": 0.0
    },
    {
      "num": 2,
      "name": "Marge",
      "x": 0.0,
      "y": 0.0
    },
    
    ...

  ]
}
```

---


## OSC Commands


### /fakeds100...
```
/fakeds100/randomize
```

Updates x and y coordinates of each object in the cache to a random number between 0 and 1, then sends the new cached coordinates of the object (with the default mapping)

---
### /dbaudio1/coordinatemapping...

```
/dbaudio1/coordinatemapping/source_position_x/[mapping]/[object] [x]
```
If an argument is provided, updates cached x coordinate, then sends cached x and y coordinates

```
/dbaudio1/coordinatemapping/source_position_y/[mapping]/[object] [y]
```
If an argument is provided, updates cached y coordinate, then sends cached x and y coordinates

```
/dbaudio1/coordinatemapping/source_position_xy/[mapping]/[object] [x] [y]
```
If arguments are provided, updates cached x and y coordinates, then sends cached x and y coordinates