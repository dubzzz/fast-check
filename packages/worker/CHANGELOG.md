# 0.0.1

_First stable release of `@fast-check/worker`_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.0.1)]

The bare metal version of fast-check is unable to stop a synchronous code (as most of test runners in JavaScript). This package can be plugged onto fast-check to make it able to stop synchronous code going into infinite loops, shrink the case and report it as any other failure.
