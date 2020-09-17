# fakeDS100
**An OSC utility for mimicking d&amp;b audiotechnik DS100 OSC replies**

---
---


## OSC Commands

---
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