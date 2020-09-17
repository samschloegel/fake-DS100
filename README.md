# fakeDS100
**An OSC utility for mimicking d&amp;b audiotechnik DS100 OSC replies**

---
---


## OSC Commands
---

**/fakeds100...**

`/fakeds100/randomize`

> Sets x and y coordinate of each object in the cache to Math.random()

---

**/dbaudio1/coordinatemapping...**

`/dbaudio1/coordinatemapping/source_position_[x, y, xy]/[mapping]/[object] [x] [y]`

> Sets cache to new coordinates if provided, else queries current cached position