'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var os = _interopDefault(require('os'));

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var PreconditionFailure_1 = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
/** @hidden */
var PreconditionFailure = /** @class */ (function (_super) {
    __extends(PreconditionFailure, _super);
    function PreconditionFailure() {
        var _this = _super.call(this) || this;
        _this.footprint = PreconditionFailure.SharedFootPrint;
        return _this;
    }
    PreconditionFailure.isFailure = function (err) {
        return err != null && err.footprint === PreconditionFailure.SharedFootPrint;
    };
    PreconditionFailure.SharedFootPrint = Symbol["for"]('fast-check/PreconditionFailure');
    return PreconditionFailure;
}(Error));
exports.PreconditionFailure = PreconditionFailure;

});

unwrapExports(PreconditionFailure_1);
var PreconditionFailure_2 = PreconditionFailure_1.PreconditionFailure;

var Pre = createCommonjsModule(function (module, exports) {
exports.__esModule = true;

/**
 * Add pre-condition checks inside a property execution
 * @param expectTruthy cancel the run whenever this value is falsy
 */
exports.pre = function (expectTruthy) {
    if (!expectTruthy) {
        throw new PreconditionFailure_1.PreconditionFailure();
    }
};

});

unwrapExports(Pre);
var Pre_1 = Pre.pre;

var Stream_1 = createCommonjsModule(function (module, exports) {
var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (commonjsGlobal && commonjsGlobal.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
exports.__esModule = true;
var Stream = /** @class */ (function () {
    // /*DEBUG*/ // no double iteration
    // /*DEBUG*/ private isLive: boolean;
    /**
     * Create a Stream based on `g`
     * @param g Underlying data of the Stream
     */
    function Stream(g) {
        this.g = g;
        // /*DEBUG*/ this.isLive = true;
    }
    /**
     * Create an empty stream of T
     */
    Stream.nil = function () {
        function g() {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        }
        return new Stream(g());
    };
    // /*DEBUG*/ private closeCurrentStream() {
    // /*DEBUG*/   if (! this.isLive) throw new Error('Stream has already been closed');
    // /*DEBUG*/   this.isLive = false;
    // /*DEBUG*/ }
    Stream.prototype.next = function () {
        return this.g.next();
    };
    Stream.prototype[Symbol.iterator] = function () {
        // /*DEBUG*/ this.closeCurrentStream();
        return this.g;
    };
    /**
     * Map all elements of the Stream using `f`
     *
     * WARNING: It closes the current stream
     *
     * @param f Mapper function
     */
    Stream.prototype.map = function (f) {
        function helper(v) {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, f(v)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }
        return this.flatMap(helper);
    };
    /**
     * Flat map all elements of the Stream using `f`
     *
     * WARNING: It closes the current stream
     *
     * @param f Mapper function
     */
    Stream.prototype.flatMap = function (f) {
        // /*DEBUG*/ this.closeCurrentStream();
        function helper(g) {
            var e_1, _a, g_1, g_1_1, v, e_1_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, 6, 7]);
                        g_1 = __values(g), g_1_1 = g_1.next();
                        _b.label = 1;
                    case 1:
                        if (!!g_1_1.done) return [3 /*break*/, 4];
                        v = g_1_1.value;
                        return [5 /*yield**/, __values(f(v))];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        g_1_1 = g_1.next();
                        return [3 /*break*/, 1];
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        e_1_1 = _b.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 7];
                    case 6:
                        try {
                            if (g_1_1 && !g_1_1.done && (_a = g_1["return"])) _a.call(g_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        }
        return new Stream(helper(this.g));
    };
    /**
     * Drop elements from the Stream while `f(element) === true`
     *
     * WARNING: It closes the current stream
     *
     * @param f Drop condition
     */
    Stream.prototype.dropWhile = function (f) {
        var foundEligible = false;
        function helper(v) {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(foundEligible || !f(v))) return [3 /*break*/, 2];
                        foundEligible = true;
                        return [4 /*yield*/, v];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }
        return this.flatMap(helper);
    };
    /**
     * Drop `n` first elements of the Stream
     *
     * WARNING: It closes the current stream
     *
     * @param n Number of elements to drop
     */
    Stream.prototype.drop = function (n) {
        var idx = 0;
        function helper(v) {
            return idx++ < n;
        }
        return this.dropWhile(helper);
    };
    /**
     * Take elements from the Stream while `f(element) === true`
     *
     * WARNING: It closes the current stream
     *
     * @param f Take condition
     */
    Stream.prototype.takeWhile = function (f) {
        // /*DEBUG*/ this.closeCurrentStream();
        function helper(g) {
            var cur;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cur = g.next();
                        _a.label = 1;
                    case 1:
                        if (!(!cur.done && f(cur.value))) return [3 /*break*/, 3];
                        return [4 /*yield*/, cur.value];
                    case 2:
                        _a.sent();
                        cur = g.next();
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/];
                }
            });
        }
        return new Stream(helper(this.g));
    };
    /**
     * Take `n` first elements of the Stream
     *
     * WARNING: It closes the current stream
     *
     * @param n Number of elements to take
     */
    Stream.prototype.take = function (n) {
        var idx = 0;
        function helper(v) {
            return idx++ < n;
        }
        return this.takeWhile(helper);
    };
    /**
     * Filter elements of the Stream
     *
     * WARNING: It closes the current stream
     *
     * @param f Elements to keep
     */
    Stream.prototype.filter = function (f) {
        function helper(v) {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!f(v)) return [3 /*break*/, 2];
                        return [4 /*yield*/, v];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }
        return this.flatMap(helper);
    };
    /**
     * Check whether all elements of the Stream are successful for `f`
     *
     * WARNING: It closes the current stream
     *
     * @param f Condition to check
     */
    Stream.prototype.every = function (f) {
        var e_2, _a;
        try {
            // /*DEBUG*/ this.closeCurrentStream();
            for (var _b = __values(this.g), _c = _b.next(); !_c.done; _c = _b.next()) {
                var v = _c.value;
                if (!f(v)) {
                    return false;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return true;
    };
    /**
     * Check whether one of the elements of the Stream is successful for `f`
     *
     * WARNING: It closes the current stream
     *
     * @param f Condition to check
     */
    Stream.prototype.has = function (f) {
        var e_3, _a;
        try {
            // /*DEBUG*/ this.closeCurrentStream();
            for (var _b = __values(this.g), _c = _b.next(); !_c.done; _c = _b.next()) {
                var v = _c.value;
                if (f(v)) {
                    return [true, v];
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return [false, null];
    };
    /**
     * Join `others` Stream to the current Stream
     *
     * WARNING: It closes the current stream and the other ones (as soon as it iterates over them)
     *
     * @param others Streams to join to the current Stream
     */
    Stream.prototype.join = function () {
        var others = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            others[_i] = arguments[_i];
        }
        function helper(c) {
            var e_4, _a, others_1, others_1_1, s, e_4_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [5 /*yield**/, __values(c)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 7, 8, 9]);
                        others_1 = __values(others), others_1_1 = others_1.next();
                        _b.label = 3;
                    case 3:
                        if (!!others_1_1.done) return [3 /*break*/, 6];
                        s = others_1_1.value;
                        return [5 /*yield**/, __values(s)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        others_1_1 = others_1.next();
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_4_1 = _b.sent();
                        e_4 = { error: e_4_1 };
                        return [3 /*break*/, 9];
                    case 8:
                        try {
                            if (others_1_1 && !others_1_1.done && (_a = others_1["return"])) _a.call(others_1);
                        }
                        finally { if (e_4) throw e_4.error; }
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        }
        return new Stream(helper(this));
    };
    /**
     * Take the `nth` element of the Stream of the last (if it does not exist)
     *
     * WARNING: It closes the current stream
     *
     * @param nth Position of the element to extract
     */
    Stream.prototype.getNthOrLast = function (nth) {
        var e_5, _a;
        // /*DEBUG*/ this.closeCurrentStream();
        var remaining = nth;
        var last = null;
        try {
            for (var _b = __values(this.g), _c = _b.next(); !_c.done; _c = _b.next()) {
                var v = _c.value;
                if (remaining-- === 0)
                    return v;
                last = v;
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return last;
    };
    return Stream;
}());
exports.Stream = Stream;
/**
 * Create a Stream based on `g`
 * @param g Underlying data of the Stream
 */
function stream(g) {
    return new Stream(g);
}
exports.stream = stream;

});

unwrapExports(Stream_1);
var Stream_2 = Stream_1.Stream;
var Stream_3 = Stream_1.stream;

var Shrinkable_1 = createCommonjsModule(function (module, exports) {
exports.__esModule = true;

/**
 * A Shrinkable<T> holds an internal value of type `T`
 * and can shrink it to smaller `T` values
 */
var Shrinkable = /** @class */ (function () {
    /**
     * @param value Internal value of the shrinkable
     * @param shrink Function producing Stream of shrinks associated to value
     */
    function Shrinkable(value, shrink) {
        if (shrink === void 0) { shrink = function () { return Stream_1.Stream.nil(); }; }
        this.value = value;
        this.shrink = shrink;
    }
    /**
     * Create another shrinkable by mapping all values using the provided `mapper`
     * Both the original value and the shrunk ones are impacted
     *
     * @param mapper Map function, to produce a new element based on an old one
     * @returns New shrinkable with mapped elements
     */
    Shrinkable.prototype.map = function (mapper) {
        var _this = this;
        return new Shrinkable(mapper(this.value), function () { return _this.shrink().map(function (v) { return v.map(mapper); }); });
    };
    /**
     * Create another shrinkable
     * by filtering its shrunk values against `predicate`
     *
     * All the shrunk values produced by the resulting `Shrinkable<T>`
     * satisfy `predicate(value) == true`
     *
     * @param predicate Predicate, to test each produced element. Return true to keep the element, false otherwise
     * @returns New shrinkable filtered using predicate
     */
    Shrinkable.prototype.filter = function (predicate) {
        var _this = this;
        return new Shrinkable(this.value, function () {
            return _this.shrink()
                .filter(function (v) { return predicate(v.value); })
                .map(function (v) { return v.filter(predicate); });
        });
    };
    return Shrinkable;
}());
exports.Shrinkable = Shrinkable;

});

unwrapExports(Shrinkable_1);
var Shrinkable_2 = Shrinkable_1.Shrinkable;

var Arbitrary_1 = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;

/**
 * Abstract class able to generate values on type `T`
 *
 * The values generated by an instance of Arbitrary can be previewed - with {@link sample}
 * - or classified - with {@link statistics}.
 */
var Arbitrary = /** @class */ (function () {
    function Arbitrary() {
    }
    /**
     * Create another arbitrary by filtering values against `predicate`
     *
     * All the values produced by the resulting arbitrary
     * satisfy `predicate(value) == true`
     *
     * @example
     * ```typescript
     * const integerGenerator: Arbitrary<number> = ...;
     * const evenIntegerGenerator: Arbitrary<number> = integerGenerator.filter(e => e % 2 === 0);
     * // new Arbitrary only keeps even values
     * ```
     *
     * @param predicate Predicate, to test each produced element. Return true to keep the element, false otherwise
     * @returns New arbitrary filtered using predicate
     */
    Arbitrary.prototype.filter = function (predicate) {
        var arb = this;
        return new /** @class */ (function (_super) {
            __extends(class_1, _super);
            function class_1() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_1.prototype.generate = function (mrng) {
                var g = arb.generate(mrng);
                while (!predicate(g.value)) {
                    g = arb.generate(mrng);
                }
                return g.filter(predicate);
            };
            class_1.prototype.withBias = function (freq) {
                return arb.withBias(freq).filter(predicate);
            };
            return class_1;
        }(Arbitrary))();
    };
    /**
     * Create another arbitrary by mapping all produced values using the provided `mapper`
     * Values produced by the new arbitrary are the result of applying `mapper` value by value
     *
     * @example
     * ```typescript
     * const rgbChannels: Arbitrary<{r:number,g:number,b:number}> = ...;
     * const color: Arbitrary<string> = rgbChannels.map(ch => `#${(ch.r*65536 + ch.g*256 + ch.b).toString(16).padStart(6, '0')}`);
     * // transform an Arbitrary producing {r,g,b} integers into an Arbitrary of '#rrggbb'
     * ```
     *
     * @param mapper Map function, to produce a new element based on an old one
     * @returns New arbitrary with mapped elements
     */
    Arbitrary.prototype.map = function (mapper) {
        var arb = this;
        return new /** @class */ (function (_super) {
            __extends(class_2, _super);
            function class_2() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_2.prototype.generate = function (mrng) {
                return arb.generate(mrng).map(mapper);
            };
            class_2.prototype.withBias = function (freq) {
                return arb.withBias(freq).map(mapper);
            };
            return class_2;
        }(Arbitrary))();
    };
    /** @hidden */
    Arbitrary.shrinkChain = function (mrng, src, dst, fmapper) {
        return new Shrinkable_1.Shrinkable(dst.value, function () {
            return src
                .shrink()
                .map(function (v) {
                return Arbitrary.shrinkChain(mrng.clone(), v, fmapper(v.value).generate(mrng.clone()), fmapper);
            })
                .join(dst.shrink());
        });
    };
    /**
     * Create another arbitrary by mapping a value from a base Arbirary using the provided `fmapper`
     * Values produced by the new arbitrary are the result of the arbitrary generated by applying `fmapper` to a value
     * @example
     * ```typescript
     * const arrayAndLimitArbitrary = fc.nat().chain((c: number) => fc.tuple( fc.array(fc.nat(c)), fc.constant(c)));
     * ```
     *
     * @param fmapper Chain function, to produce a new Arbitrary using a value from another Arbitrary
     * @returns New arbitrary of new type
     */
    Arbitrary.prototype.chain = function (fmapper) {
        var arb = this;
        return new /** @class */ (function (_super) {
            __extends(class_3, _super);
            function class_3() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_3.prototype.generate = function (mrng) {
                var clonedMrng = mrng.clone();
                var src = arb.generate(mrng);
                var dst = fmapper(src.value).generate(mrng);
                return Arbitrary.shrinkChain(clonedMrng, src, dst, fmapper);
            };
            class_3.prototype.withBias = function (freq) {
                return arb.withBias(freq).chain(function (t) { return fmapper(t).withBias(freq); });
            };
            return class_3;
        }(Arbitrary))();
    };
    /**
     * Create another Arbitrary with no shrink values
     *
     * @example
     * ```typescript
     * const dataGenerator: Arbitrary<string> = ...;
     * const unshrinkableDataGenerator: Arbitrary<string> = dataGenerator.noShrink();
     * // same values no shrink
     * ```
     *
     * @returns Create another arbitrary with no shrink values
     */
    Arbitrary.prototype.noShrink = function () {
        var arb = this;
        return new /** @class */ (function (_super) {
            __extends(class_4, _super);
            function class_4() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_4.prototype.generate = function (mrng) {
                return new Shrinkable_1.Shrinkable(arb.generate(mrng).value);
            };
            class_4.prototype.withBias = function (freq) {
                return arb.withBias(freq).noShrink();
            };
            return class_4;
        }(Arbitrary))();
    };
    /**
     * Create another Arbitrary having bias - by default return itself
     *
     * @param freq The biased version will be used one time over freq - if it exists - freq must be superior or equal to 2 to avoid any lock
     */
    Arbitrary.prototype.withBias = function (freq) {
        return this;
    };
    /**
     * Create another Arbitrary that cannot be biased
     *
     * @param freq The biased version will be used one time over freq - if it exists
     */
    Arbitrary.prototype.noBias = function () {
        var arb = this;
        return new /** @class */ (function (_super) {
            __extends(class_5, _super);
            function class_5() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_5.prototype.generate = function (mrng) {
                return arb.generate(mrng);
            };
            return class_5;
        }(Arbitrary))();
    };
    return Arbitrary;
}());
exports.Arbitrary = Arbitrary;

});

unwrapExports(Arbitrary_1);
var Arbitrary_2 = Arbitrary_1.Arbitrary;

var TupleArbitrary_generic = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;



/** @hidden */
var GenericTupleArbitrary = /** @class */ (function (_super) {
    __extends(GenericTupleArbitrary, _super);
    function GenericTupleArbitrary(arbs) {
        var _this = _super.call(this) || this;
        _this.arbs = arbs;
        for (var idx = 0; idx !== arbs.length; ++idx) {
            var arb = arbs[idx];
            if (arb == null || arb.generate == null)
                throw new Error("Invalid parameter encountered at index " + idx + ": expecting an Arbitrary");
        }
        return _this;
    }
    GenericTupleArbitrary.wrapper = function (shrinkables) {
        return new Shrinkable_1.Shrinkable(shrinkables.map(function (s) { return s.value; }), function () {
            return GenericTupleArbitrary.shrinkImpl(shrinkables).map(GenericTupleArbitrary.wrapper);
        });
    };
    GenericTupleArbitrary.prototype.generate = function (mrng) {
        return GenericTupleArbitrary.wrapper(this.arbs.map(function (a) { return a.generate(mrng); }));
    };
    GenericTupleArbitrary.shrinkImpl = function (value) {
        // shrinking one by one is the not the most comprehensive
        // but allows a reasonable number of entries in the shrink
        var s = Stream_1.Stream.nil();
        var _loop_1 = function (idx) {
            s = s.join(value[idx].shrink().map(function (v) {
                return value
                    .slice(0, idx)
                    .concat([v])
                    .concat(value.slice(idx + 1));
            }));
        };
        for (var idx = 0; idx !== value.length; ++idx) {
            _loop_1(idx);
        }
        return s;
    };
    GenericTupleArbitrary.prototype.withBias = function (freq) {
        return new GenericTupleArbitrary(this.arbs.map(function (a) { return a.withBias(freq); }));
    };
    return GenericTupleArbitrary;
}(Arbitrary_1.Arbitrary));
exports.GenericTupleArbitrary = GenericTupleArbitrary;
/**
 * For tuples produced by the provided `arbs`
 * @param arbs Ordered list of arbitraries
 */
function genericTuple(arbs) {
    return new GenericTupleArbitrary(arbs);
}
exports.genericTuple = genericTuple;

});

unwrapExports(TupleArbitrary_generic);
var TupleArbitrary_generic_1 = TupleArbitrary_generic.GenericTupleArbitrary;
var TupleArbitrary_generic_2 = TupleArbitrary_generic.genericTuple;

var TupleArbitrary_generated = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;


/** @hidden */
var Tuple1Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple1Arbitrary, _super);
    function Tuple1Arbitrary(arb0) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0]);
        return _this;
    }
    Tuple1Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple1Arbitrary.prototype.withBias = function (freq) {
        return new Tuple1Arbitrary(this.arb0.withBias(freq));
    };
    return Tuple1Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple1Arbitrary = Tuple1Arbitrary;
/** @hidden */
var Tuple2Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple2Arbitrary, _super);
    function Tuple2Arbitrary(arb0, arb1) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1]);
        return _this;
    }
    Tuple2Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple2Arbitrary.prototype.withBias = function (freq) {
        return new Tuple2Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq));
    };
    return Tuple2Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple2Arbitrary = Tuple2Arbitrary;
/** @hidden */
var Tuple3Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple3Arbitrary, _super);
    function Tuple3Arbitrary(arb0, arb1, arb2) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2]);
        return _this;
    }
    Tuple3Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple3Arbitrary.prototype.withBias = function (freq) {
        return new Tuple3Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq));
    };
    return Tuple3Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple3Arbitrary = Tuple3Arbitrary;
/** @hidden */
var Tuple4Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple4Arbitrary, _super);
    function Tuple4Arbitrary(arb0, arb1, arb2, arb3) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3]);
        return _this;
    }
    Tuple4Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple4Arbitrary.prototype.withBias = function (freq) {
        return new Tuple4Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq));
    };
    return Tuple4Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple4Arbitrary = Tuple4Arbitrary;
/** @hidden */
var Tuple5Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple5Arbitrary, _super);
    function Tuple5Arbitrary(arb0, arb1, arb2, arb3, arb4) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4]);
        return _this;
    }
    Tuple5Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple5Arbitrary.prototype.withBias = function (freq) {
        return new Tuple5Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq));
    };
    return Tuple5Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple5Arbitrary = Tuple5Arbitrary;
/** @hidden */
var Tuple6Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple6Arbitrary, _super);
    function Tuple6Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5]);
        return _this;
    }
    Tuple6Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple6Arbitrary.prototype.withBias = function (freq) {
        return new Tuple6Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq));
    };
    return Tuple6Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple6Arbitrary = Tuple6Arbitrary;
/** @hidden */
var Tuple7Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple7Arbitrary, _super);
    function Tuple7Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6]);
        return _this;
    }
    Tuple7Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple7Arbitrary.prototype.withBias = function (freq) {
        return new Tuple7Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq));
    };
    return Tuple7Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple7Arbitrary = Tuple7Arbitrary;
/** @hidden */
var Tuple8Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple8Arbitrary, _super);
    function Tuple8Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7]);
        return _this;
    }
    Tuple8Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple8Arbitrary.prototype.withBias = function (freq) {
        return new Tuple8Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq));
    };
    return Tuple8Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple8Arbitrary = Tuple8Arbitrary;
/** @hidden */
var Tuple9Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple9Arbitrary, _super);
    function Tuple9Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.arb8 = arb8;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8]);
        return _this;
    }
    Tuple9Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple9Arbitrary.prototype.withBias = function (freq) {
        return new Tuple9Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq), this.arb8.withBias(freq));
    };
    return Tuple9Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple9Arbitrary = Tuple9Arbitrary;
/** @hidden */
var Tuple10Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple10Arbitrary, _super);
    function Tuple10Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.arb8 = arb8;
        _this.arb9 = arb9;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9]);
        return _this;
    }
    Tuple10Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple10Arbitrary.prototype.withBias = function (freq) {
        return new Tuple10Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq), this.arb8.withBias(freq), this.arb9.withBias(freq));
    };
    return Tuple10Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple10Arbitrary = Tuple10Arbitrary;
/** @hidden */
var Tuple11Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple11Arbitrary, _super);
    function Tuple11Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.arb8 = arb8;
        _this.arb9 = arb9;
        _this.arb10 = arb10;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10]);
        return _this;
    }
    Tuple11Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple11Arbitrary.prototype.withBias = function (freq) {
        return new Tuple11Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq), this.arb8.withBias(freq), this.arb9.withBias(freq), this.arb10.withBias(freq));
    };
    return Tuple11Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple11Arbitrary = Tuple11Arbitrary;
/** @hidden */
var Tuple12Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple12Arbitrary, _super);
    function Tuple12Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.arb8 = arb8;
        _this.arb9 = arb9;
        _this.arb10 = arb10;
        _this.arb11 = arb11;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11]);
        return _this;
    }
    Tuple12Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple12Arbitrary.prototype.withBias = function (freq) {
        return new Tuple12Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq), this.arb8.withBias(freq), this.arb9.withBias(freq), this.arb10.withBias(freq), this.arb11.withBias(freq));
    };
    return Tuple12Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple12Arbitrary = Tuple12Arbitrary;
/** @hidden */
var Tuple13Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple13Arbitrary, _super);
    function Tuple13Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.arb8 = arb8;
        _this.arb9 = arb9;
        _this.arb10 = arb10;
        _this.arb11 = arb11;
        _this.arb12 = arb12;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12]);
        return _this;
    }
    Tuple13Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple13Arbitrary.prototype.withBias = function (freq) {
        return new Tuple13Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq), this.arb8.withBias(freq), this.arb9.withBias(freq), this.arb10.withBias(freq), this.arb11.withBias(freq), this.arb12.withBias(freq));
    };
    return Tuple13Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple13Arbitrary = Tuple13Arbitrary;
/** @hidden */
var Tuple14Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple14Arbitrary, _super);
    function Tuple14Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.arb8 = arb8;
        _this.arb9 = arb9;
        _this.arb10 = arb10;
        _this.arb11 = arb11;
        _this.arb12 = arb12;
        _this.arb13 = arb13;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13]);
        return _this;
    }
    Tuple14Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple14Arbitrary.prototype.withBias = function (freq) {
        return new Tuple14Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq), this.arb8.withBias(freq), this.arb9.withBias(freq), this.arb10.withBias(freq), this.arb11.withBias(freq), this.arb12.withBias(freq), this.arb13.withBias(freq));
    };
    return Tuple14Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple14Arbitrary = Tuple14Arbitrary;
/** @hidden */
var Tuple15Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple15Arbitrary, _super);
    function Tuple15Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.arb8 = arb8;
        _this.arb9 = arb9;
        _this.arb10 = arb10;
        _this.arb11 = arb11;
        _this.arb12 = arb12;
        _this.arb13 = arb13;
        _this.arb14 = arb14;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14]);
        return _this;
    }
    Tuple15Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple15Arbitrary.prototype.withBias = function (freq) {
        return new Tuple15Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq), this.arb8.withBias(freq), this.arb9.withBias(freq), this.arb10.withBias(freq), this.arb11.withBias(freq), this.arb12.withBias(freq), this.arb13.withBias(freq), this.arb14.withBias(freq));
    };
    return Tuple15Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple15Arbitrary = Tuple15Arbitrary;
/** @hidden */
var Tuple16Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple16Arbitrary, _super);
    function Tuple16Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.arb8 = arb8;
        _this.arb9 = arb9;
        _this.arb10 = arb10;
        _this.arb11 = arb11;
        _this.arb12 = arb12;
        _this.arb13 = arb13;
        _this.arb14 = arb14;
        _this.arb15 = arb15;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15]);
        return _this;
    }
    Tuple16Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple16Arbitrary.prototype.withBias = function (freq) {
        return new Tuple16Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq), this.arb8.withBias(freq), this.arb9.withBias(freq), this.arb10.withBias(freq), this.arb11.withBias(freq), this.arb12.withBias(freq), this.arb13.withBias(freq), this.arb14.withBias(freq), this.arb15.withBias(freq));
    };
    return Tuple16Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple16Arbitrary = Tuple16Arbitrary;
/** @hidden */
var Tuple17Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple17Arbitrary, _super);
    function Tuple17Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.arb8 = arb8;
        _this.arb9 = arb9;
        _this.arb10 = arb10;
        _this.arb11 = arb11;
        _this.arb12 = arb12;
        _this.arb13 = arb13;
        _this.arb14 = arb14;
        _this.arb15 = arb15;
        _this.arb16 = arb16;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16]);
        return _this;
    }
    Tuple17Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple17Arbitrary.prototype.withBias = function (freq) {
        return new Tuple17Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq), this.arb8.withBias(freq), this.arb9.withBias(freq), this.arb10.withBias(freq), this.arb11.withBias(freq), this.arb12.withBias(freq), this.arb13.withBias(freq), this.arb14.withBias(freq), this.arb15.withBias(freq), this.arb16.withBias(freq));
    };
    return Tuple17Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple17Arbitrary = Tuple17Arbitrary;
/** @hidden */
var Tuple18Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple18Arbitrary, _super);
    function Tuple18Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.arb8 = arb8;
        _this.arb9 = arb9;
        _this.arb10 = arb10;
        _this.arb11 = arb11;
        _this.arb12 = arb12;
        _this.arb13 = arb13;
        _this.arb14 = arb14;
        _this.arb15 = arb15;
        _this.arb16 = arb16;
        _this.arb17 = arb17;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17]);
        return _this;
    }
    Tuple18Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple18Arbitrary.prototype.withBias = function (freq) {
        return new Tuple18Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq), this.arb8.withBias(freq), this.arb9.withBias(freq), this.arb10.withBias(freq), this.arb11.withBias(freq), this.arb12.withBias(freq), this.arb13.withBias(freq), this.arb14.withBias(freq), this.arb15.withBias(freq), this.arb16.withBias(freq), this.arb17.withBias(freq));
    };
    return Tuple18Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple18Arbitrary = Tuple18Arbitrary;
/** @hidden */
var Tuple19Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple19Arbitrary, _super);
    function Tuple19Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.arb8 = arb8;
        _this.arb9 = arb9;
        _this.arb10 = arb10;
        _this.arb11 = arb11;
        _this.arb12 = arb12;
        _this.arb13 = arb13;
        _this.arb14 = arb14;
        _this.arb15 = arb15;
        _this.arb16 = arb16;
        _this.arb17 = arb17;
        _this.arb18 = arb18;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18]);
        return _this;
    }
    Tuple19Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple19Arbitrary.prototype.withBias = function (freq) {
        return new Tuple19Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq), this.arb8.withBias(freq), this.arb9.withBias(freq), this.arb10.withBias(freq), this.arb11.withBias(freq), this.arb12.withBias(freq), this.arb13.withBias(freq), this.arb14.withBias(freq), this.arb15.withBias(freq), this.arb16.withBias(freq), this.arb17.withBias(freq), this.arb18.withBias(freq));
    };
    return Tuple19Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple19Arbitrary = Tuple19Arbitrary;
/** @hidden */
var Tuple20Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple20Arbitrary, _super);
    function Tuple20Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.arb8 = arb8;
        _this.arb9 = arb9;
        _this.arb10 = arb10;
        _this.arb11 = arb11;
        _this.arb12 = arb12;
        _this.arb13 = arb13;
        _this.arb14 = arb14;
        _this.arb15 = arb15;
        _this.arb16 = arb16;
        _this.arb17 = arb17;
        _this.arb18 = arb18;
        _this.arb19 = arb19;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19]);
        return _this;
    }
    Tuple20Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple20Arbitrary.prototype.withBias = function (freq) {
        return new Tuple20Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq), this.arb8.withBias(freq), this.arb9.withBias(freq), this.arb10.withBias(freq), this.arb11.withBias(freq), this.arb12.withBias(freq), this.arb13.withBias(freq), this.arb14.withBias(freq), this.arb15.withBias(freq), this.arb16.withBias(freq), this.arb17.withBias(freq), this.arb18.withBias(freq), this.arb19.withBias(freq));
    };
    return Tuple20Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple20Arbitrary = Tuple20Arbitrary;
/** @hidden */
var Tuple21Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple21Arbitrary, _super);
    function Tuple21Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19, arb20) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.arb8 = arb8;
        _this.arb9 = arb9;
        _this.arb10 = arb10;
        _this.arb11 = arb11;
        _this.arb12 = arb12;
        _this.arb13 = arb13;
        _this.arb14 = arb14;
        _this.arb15 = arb15;
        _this.arb16 = arb16;
        _this.arb17 = arb17;
        _this.arb18 = arb18;
        _this.arb19 = arb19;
        _this.arb20 = arb20;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19, arb20]);
        return _this;
    }
    Tuple21Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple21Arbitrary.prototype.withBias = function (freq) {
        return new Tuple21Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq), this.arb8.withBias(freq), this.arb9.withBias(freq), this.arb10.withBias(freq), this.arb11.withBias(freq), this.arb12.withBias(freq), this.arb13.withBias(freq), this.arb14.withBias(freq), this.arb15.withBias(freq), this.arb16.withBias(freq), this.arb17.withBias(freq), this.arb18.withBias(freq), this.arb19.withBias(freq), this.arb20.withBias(freq));
    };
    return Tuple21Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple21Arbitrary = Tuple21Arbitrary;
/** @hidden */
var Tuple22Arbitrary = /** @class */ (function (_super) {
    __extends(Tuple22Arbitrary, _super);
    function Tuple22Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19, arb20, arb21) {
        var _this = _super.call(this) || this;
        _this.arb0 = arb0;
        _this.arb1 = arb1;
        _this.arb2 = arb2;
        _this.arb3 = arb3;
        _this.arb4 = arb4;
        _this.arb5 = arb5;
        _this.arb6 = arb6;
        _this.arb7 = arb7;
        _this.arb8 = arb8;
        _this.arb9 = arb9;
        _this.arb10 = arb10;
        _this.arb11 = arb11;
        _this.arb12 = arb12;
        _this.arb13 = arb13;
        _this.arb14 = arb14;
        _this.arb15 = arb15;
        _this.arb16 = arb16;
        _this.arb17 = arb17;
        _this.arb18 = arb18;
        _this.arb19 = arb19;
        _this.arb20 = arb20;
        _this.arb21 = arb21;
        _this.tupleArb = new TupleArbitrary_generic.GenericTupleArbitrary([arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19, arb20, arb21]);
        return _this;
    }
    Tuple22Arbitrary.prototype.generate = function (mrng) {
        return this.tupleArb.generate(mrng);
    };
    Tuple22Arbitrary.prototype.withBias = function (freq) {
        return new Tuple22Arbitrary(this.arb0.withBias(freq), this.arb1.withBias(freq), this.arb2.withBias(freq), this.arb3.withBias(freq), this.arb4.withBias(freq), this.arb5.withBias(freq), this.arb6.withBias(freq), this.arb7.withBias(freq), this.arb8.withBias(freq), this.arb9.withBias(freq), this.arb10.withBias(freq), this.arb11.withBias(freq), this.arb12.withBias(freq), this.arb13.withBias(freq), this.arb14.withBias(freq), this.arb15.withBias(freq), this.arb16.withBias(freq), this.arb17.withBias(freq), this.arb18.withBias(freq), this.arb19.withBias(freq), this.arb20.withBias(freq), this.arb21.withBias(freq));
    };
    return Tuple22Arbitrary;
}(Arbitrary_1.Arbitrary));
exports.Tuple22Arbitrary = Tuple22Arbitrary;
/**
 * For tuples of [T0,T1,T2,T3,T4,T5,T6,T7,T8,T9,T10,T11,T12,T13,T14,T15,T16,T17,T18,T19,T20,T21]
 * @param arb0 Arbitrary responsible for T0
* @param arb1 Arbitrary responsible for T1
* @param arb2 Arbitrary responsible for T2
* @param arb3 Arbitrary responsible for T3
* @param arb4 Arbitrary responsible for T4
* @param arb5 Arbitrary responsible for T5
* @param arb6 Arbitrary responsible for T6
* @param arb7 Arbitrary responsible for T7
* @param arb8 Arbitrary responsible for T8
* @param arb9 Arbitrary responsible for T9
* @param arb10 Arbitrary responsible for T10
* @param arb11 Arbitrary responsible for T11
* @param arb12 Arbitrary responsible for T12
* @param arb13 Arbitrary responsible for T13
* @param arb14 Arbitrary responsible for T14
* @param arb15 Arbitrary responsible for T15
* @param arb16 Arbitrary responsible for T16
* @param arb17 Arbitrary responsible for T17
* @param arb18 Arbitrary responsible for T18
* @param arb19 Arbitrary responsible for T19
* @param arb20 Arbitrary responsible for T20
* @param arb21 Arbitrary responsible for T21
 */
function tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19, arb20, arb21) {
    if (arb21) {
        return new Tuple22Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19, arb20, arb21);
    }
    if (arb20) {
        return new Tuple21Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19, arb20);
    }
    if (arb19) {
        return new Tuple20Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19);
    }
    if (arb18) {
        return new Tuple19Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18);
    }
    if (arb17) {
        return new Tuple18Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17);
    }
    if (arb16) {
        return new Tuple17Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16);
    }
    if (arb15) {
        return new Tuple16Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15);
    }
    if (arb14) {
        return new Tuple15Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14);
    }
    if (arb13) {
        return new Tuple14Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13);
    }
    if (arb12) {
        return new Tuple13Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12);
    }
    if (arb11) {
        return new Tuple12Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11);
    }
    if (arb10) {
        return new Tuple11Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10);
    }
    if (arb9) {
        return new Tuple10Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9);
    }
    if (arb8) {
        return new Tuple9Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8);
    }
    if (arb7) {
        return new Tuple8Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7);
    }
    if (arb6) {
        return new Tuple7Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5, arb6);
    }
    if (arb5) {
        return new Tuple6Arbitrary(arb0, arb1, arb2, arb3, arb4, arb5);
    }
    if (arb4) {
        return new Tuple5Arbitrary(arb0, arb1, arb2, arb3, arb4);
    }
    if (arb3) {
        return new Tuple4Arbitrary(arb0, arb1, arb2, arb3);
    }
    if (arb2) {
        return new Tuple3Arbitrary(arb0, arb1, arb2);
    }
    if (arb1) {
        return new Tuple2Arbitrary(arb0, arb1);
    }
    if (arb0) {
        return new Tuple1Arbitrary(arb0);
    }
}
exports.tuple = tuple;

});

unwrapExports(TupleArbitrary_generated);
var TupleArbitrary_generated_1 = TupleArbitrary_generated.Tuple1Arbitrary;
var TupleArbitrary_generated_2 = TupleArbitrary_generated.Tuple2Arbitrary;
var TupleArbitrary_generated_3 = TupleArbitrary_generated.Tuple3Arbitrary;
var TupleArbitrary_generated_4 = TupleArbitrary_generated.Tuple4Arbitrary;
var TupleArbitrary_generated_5 = TupleArbitrary_generated.Tuple5Arbitrary;
var TupleArbitrary_generated_6 = TupleArbitrary_generated.Tuple6Arbitrary;
var TupleArbitrary_generated_7 = TupleArbitrary_generated.Tuple7Arbitrary;
var TupleArbitrary_generated_8 = TupleArbitrary_generated.Tuple8Arbitrary;
var TupleArbitrary_generated_9 = TupleArbitrary_generated.Tuple9Arbitrary;
var TupleArbitrary_generated_10 = TupleArbitrary_generated.Tuple10Arbitrary;
var TupleArbitrary_generated_11 = TupleArbitrary_generated.Tuple11Arbitrary;
var TupleArbitrary_generated_12 = TupleArbitrary_generated.Tuple12Arbitrary;
var TupleArbitrary_generated_13 = TupleArbitrary_generated.Tuple13Arbitrary;
var TupleArbitrary_generated_14 = TupleArbitrary_generated.Tuple14Arbitrary;
var TupleArbitrary_generated_15 = TupleArbitrary_generated.Tuple15Arbitrary;
var TupleArbitrary_generated_16 = TupleArbitrary_generated.Tuple16Arbitrary;
var TupleArbitrary_generated_17 = TupleArbitrary_generated.Tuple17Arbitrary;
var TupleArbitrary_generated_18 = TupleArbitrary_generated.Tuple18Arbitrary;
var TupleArbitrary_generated_19 = TupleArbitrary_generated.Tuple19Arbitrary;
var TupleArbitrary_generated_20 = TupleArbitrary_generated.Tuple20Arbitrary;
var TupleArbitrary_generated_21 = TupleArbitrary_generated.Tuple21Arbitrary;
var TupleArbitrary_generated_22 = TupleArbitrary_generated.Tuple22Arbitrary;
var TupleArbitrary_generated_23 = TupleArbitrary_generated.tuple;

var TupleArbitrary = createCommonjsModule(function (module, exports) {
exports.__esModule = true;

exports.tuple = TupleArbitrary_generated.tuple;

exports.genericTuple = TupleArbitrary_generic.genericTuple;

});

unwrapExports(TupleArbitrary);
var TupleArbitrary_1 = TupleArbitrary.tuple;
var TupleArbitrary_2 = TupleArbitrary.genericTuple;

var IProperty = createCommonjsModule(function (module, exports) {
exports.__esModule = true;
/**
 * @hidden
 * Convert runId (IProperty) into a frequency (Arbitrary)
 *
 * @param runId Id of the run starting at 0
 * @returns Frequency of bias starting at 2
 */
exports.runIdToFrequency = function (runId) { return 2 + Math.floor(Math.log(runId + 1) / Math.log(10)); };

});

unwrapExports(IProperty);
var IProperty_1 = IProperty.runIdToFrequency;

var AsyncProperty_generic = createCommonjsModule(function (module, exports) {
var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;


/**
 * Asynchronous property, see {@link IProperty}
 *
 * Prefer using {@link asyncProperty} instead
 */
var AsyncProperty = /** @class */ (function () {
    function AsyncProperty(arb, predicate) {
        this.arb = arb;
        this.predicate = predicate;
        this.isAsync = function () { return true; };
    }
    AsyncProperty.prototype.generate = function (mrng, runId) {
        return runId != null ? this.arb.withBias(IProperty.runIdToFrequency(runId)).generate(mrng) : this.arb.generate(mrng);
    };
    AsyncProperty.prototype.run = function (v) {
        return __awaiter(this, void 0, void 0, function () {
            var output, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.predicate(v)];
                    case 1:
                        output = _a.sent();
                        return [2 /*return*/, output == null || output === true ? null : 'Property failed by returning false'];
                    case 2:
                        err_1 = _a.sent();
                        // precondition failure considered as success for the first version
                        if (PreconditionFailure_1.PreconditionFailure.isFailure(err_1))
                            return [2 /*return*/, err_1];
                        // exception as string in case of real failure
                        if (err_1 instanceof Error && err_1.stack)
                            return [2 /*return*/, err_1 + "\n\nStack trace: " + err_1.stack];
                        return [2 /*return*/, "" + err_1];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return AsyncProperty;
}());
exports.AsyncProperty = AsyncProperty;

});

unwrapExports(AsyncProperty_generic);
var AsyncProperty_generic_1 = AsyncProperty_generic.AsyncProperty;

var AsyncProperty_generated = createCommonjsModule(function (module, exports) {
exports.__esModule = true;


function asyncProperty(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19, arb20, arb21, arb22, arb23) {
    if (arb22) {
        var p_1 = arb22;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19, arb20, arb21), function (t) { return p_1(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15], t[16], t[17], t[18], t[19], t[20], t[21]); });
    }
    if (arb21) {
        var p_2 = arb21;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19, arb20), function (t) { return p_2(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15], t[16], t[17], t[18], t[19], t[20]); });
    }
    if (arb20) {
        var p_3 = arb20;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19), function (t) { return p_3(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15], t[16], t[17], t[18], t[19]); });
    }
    if (arb19) {
        var p_4 = arb19;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18), function (t) { return p_4(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15], t[16], t[17], t[18]); });
    }
    if (arb18) {
        var p_5 = arb18;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17), function (t) { return p_5(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15], t[16], t[17]); });
    }
    if (arb17) {
        var p_6 = arb17;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16), function (t) { return p_6(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15], t[16]); });
    }
    if (arb16) {
        var p_7 = arb16;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15), function (t) { return p_7(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15]); });
    }
    if (arb15) {
        var p_8 = arb15;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14), function (t) { return p_8(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14]); });
    }
    if (arb14) {
        var p_9 = arb14;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13), function (t) { return p_9(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13]); });
    }
    if (arb13) {
        var p_10 = arb13;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12), function (t) { return p_10(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12]); });
    }
    if (arb12) {
        var p_11 = arb12;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11), function (t) { return p_11(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11]); });
    }
    if (arb11) {
        var p_12 = arb11;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10), function (t) { return p_12(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10]); });
    }
    if (arb10) {
        var p_13 = arb10;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9), function (t) { return p_13(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9]); });
    }
    if (arb9) {
        var p_14 = arb9;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8), function (t) { return p_14(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8]); });
    }
    if (arb8) {
        var p_15 = arb8;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7), function (t) { return p_15(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7]); });
    }
    if (arb7) {
        var p_16 = arb7;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6), function (t) { return p_16(t[0], t[1], t[2], t[3], t[4], t[5], t[6]); });
    }
    if (arb6) {
        var p_17 = arb6;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5), function (t) { return p_17(t[0], t[1], t[2], t[3], t[4], t[5]); });
    }
    if (arb5) {
        var p_18 = arb5;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4), function (t) { return p_18(t[0], t[1], t[2], t[3], t[4]); });
    }
    if (arb4) {
        var p_19 = arb4;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2, arb3), function (t) { return p_19(t[0], t[1], t[2], t[3]); });
    }
    if (arb3) {
        var p_20 = arb3;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1, arb2), function (t) { return p_20(t[0], t[1], t[2]); });
    }
    if (arb2) {
        var p_21 = arb2;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0, arb1), function (t) { return p_21(t[0], t[1]); });
    }
    if (arb1) {
        var p_22 = arb1;
        return new AsyncProperty_generic.AsyncProperty(TupleArbitrary.tuple(arb0), function (t) { return p_22(t[0]); });
    }
}
exports.asyncProperty = asyncProperty;

});

unwrapExports(AsyncProperty_generated);
var AsyncProperty_generated_1 = AsyncProperty_generated.asyncProperty;

var AsyncProperty = createCommonjsModule(function (module, exports) {
exports.__esModule = true;

exports.asyncProperty = AsyncProperty_generated.asyncProperty;

exports.AsyncProperty = AsyncProperty_generic.AsyncProperty;

});

unwrapExports(AsyncProperty);
var AsyncProperty_1 = AsyncProperty.asyncProperty;
var AsyncProperty_2 = AsyncProperty.AsyncProperty;

var Property_generic = createCommonjsModule(function (module, exports) {
exports.__esModule = true;


/**
 * Property, see {@link IProperty}
 *
 * Prefer using {@link property} instead
 */
var Property = /** @class */ (function () {
    function Property(arb, predicate) {
        this.arb = arb;
        this.predicate = predicate;
        this.isAsync = function () { return false; };
    }
    Property.prototype.generate = function (mrng, runId) {
        return runId != null ? this.arb.withBias(IProperty.runIdToFrequency(runId)).generate(mrng) : this.arb.generate(mrng);
    };
    Property.prototype.run = function (v) {
        try {
            var output = this.predicate(v);
            return output == null || output === true ? null : 'Property failed by returning false';
        }
        catch (err) {
            // precondition failure considered as success for the first version
            if (PreconditionFailure_1.PreconditionFailure.isFailure(err))
                return err;
            // exception as string in case of real failure
            if (err instanceof Error && err.stack)
                return err + "\n\nStack trace: " + err.stack;
            return "" + err;
        }
    };
    return Property;
}());
exports.Property = Property;

});

unwrapExports(Property_generic);
var Property_generic_1 = Property_generic.Property;

var Property_generated = createCommonjsModule(function (module, exports) {
exports.__esModule = true;


function property(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19, arb20, arb21, arb22, arb23) {
    if (arb22) {
        var p_1 = arb22;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19, arb20, arb21), function (t) { return p_1(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15], t[16], t[17], t[18], t[19], t[20], t[21]); });
    }
    if (arb21) {
        var p_2 = arb21;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19, arb20), function (t) { return p_2(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15], t[16], t[17], t[18], t[19], t[20]); });
    }
    if (arb20) {
        var p_3 = arb20;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18, arb19), function (t) { return p_3(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15], t[16], t[17], t[18], t[19]); });
    }
    if (arb19) {
        var p_4 = arb19;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17, arb18), function (t) { return p_4(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15], t[16], t[17], t[18]); });
    }
    if (arb18) {
        var p_5 = arb18;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16, arb17), function (t) { return p_5(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15], t[16], t[17]); });
    }
    if (arb17) {
        var p_6 = arb17;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15, arb16), function (t) { return p_6(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15], t[16]); });
    }
    if (arb16) {
        var p_7 = arb16;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14, arb15), function (t) { return p_7(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15]); });
    }
    if (arb15) {
        var p_8 = arb15;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13, arb14), function (t) { return p_8(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14]); });
    }
    if (arb14) {
        var p_9 = arb14;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12, arb13), function (t) { return p_9(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13]); });
    }
    if (arb13) {
        var p_10 = arb13;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11, arb12), function (t) { return p_10(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12]); });
    }
    if (arb12) {
        var p_11 = arb12;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10, arb11), function (t) { return p_11(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11]); });
    }
    if (arb11) {
        var p_12 = arb11;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9, arb10), function (t) { return p_12(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10]); });
    }
    if (arb10) {
        var p_13 = arb10;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9), function (t) { return p_13(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9]); });
    }
    if (arb9) {
        var p_14 = arb9;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8), function (t) { return p_14(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8]); });
    }
    if (arb8) {
        var p_15 = arb8;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6, arb7), function (t) { return p_15(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7]); });
    }
    if (arb7) {
        var p_16 = arb7;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5, arb6), function (t) { return p_16(t[0], t[1], t[2], t[3], t[4], t[5], t[6]); });
    }
    if (arb6) {
        var p_17 = arb6;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4, arb5), function (t) { return p_17(t[0], t[1], t[2], t[3], t[4], t[5]); });
    }
    if (arb5) {
        var p_18 = arb5;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3, arb4), function (t) { return p_18(t[0], t[1], t[2], t[3], t[4]); });
    }
    if (arb4) {
        var p_19 = arb4;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2, arb3), function (t) { return p_19(t[0], t[1], t[2], t[3]); });
    }
    if (arb3) {
        var p_20 = arb3;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1, arb2), function (t) { return p_20(t[0], t[1], t[2]); });
    }
    if (arb2) {
        var p_21 = arb2;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0, arb1), function (t) { return p_21(t[0], t[1]); });
    }
    if (arb1) {
        var p_22 = arb1;
        return new Property_generic.Property(TupleArbitrary.tuple(arb0), function (t) { return p_22(t[0]); });
    }
}
exports.property = property;

});

unwrapExports(Property_generated);
var Property_generated_1 = Property_generated.property;

var Property = createCommonjsModule(function (module, exports) {
exports.__esModule = true;

exports.property = Property_generated.property;

exports.Property = Property_generic.Property;

});

unwrapExports(Property);
var Property_1 = Property.property;
var Property_2 = Property.Property;

var TimeoutProperty_1 = createCommonjsModule(function (module, exports) {
var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = commonjsGlobal;
exports.__esModule = true;
/** @hidden */
var timeoutAfter = function (timeMs) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                return setTimeout(function () {
                    resolve("Property timeout: exceeded limit of " + timeMs + " milliseconds");
                }, timeMs);
            })];
    });
}); };
/** @hidden */
var TimeoutProperty = /** @class */ (function () {
    function TimeoutProperty(property, timeMs) {
        this.property = property;
        this.timeMs = timeMs;
        this.isAsync = function () { return true; };
    }
    TimeoutProperty.prototype.generate = function (mrng, runId) {
        return this.property.generate(mrng, runId);
    };
    TimeoutProperty.prototype.run = function (v) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.race([this.property.run(v), timeoutAfter(this.timeMs)])];
            });
        });
    };
    return TimeoutProperty;
}());
exports.TimeoutProperty = TimeoutProperty;

});

unwrapExports(TimeoutProperty_1);
var TimeoutProperty_2 = TimeoutProperty_1.TimeoutProperty;

var UnbiasedProperty_1 = createCommonjsModule(function (module, exports) {
exports.__esModule = true;
/** @hidden */
var UnbiasedProperty = /** @class */ (function () {
    function UnbiasedProperty(property) {
        var _this = this;
        this.property = property;
        this.isAsync = function () { return _this.property.isAsync(); };
        this.generate = function (mrng, runId) { return _this.property.generate(mrng); };
        this.run = function (v) { return _this.property.run(v); };
    }
    return UnbiasedProperty;
}());
exports.UnbiasedProperty = UnbiasedProperty;

});

unwrapExports(UnbiasedProperty_1);
var UnbiasedProperty_2 = UnbiasedProperty_1.UnbiasedProperty;

var QualifiedParameters_1 = createCommonjsModule(function (module, exports) {
exports.__esModule = true;
/**
 * @hidden
 *
 * Configuration extracted from incoming Parameters
 *
 * It handles and set the default settings that will be used by runners.
 */
var QualifiedParameters = /** @class */ (function () {
    function QualifiedParameters() {
    }
    /**
     * Extract a runner configuration from Parameters
     * @param p Incoming Parameters
     */
    QualifiedParameters.read = function (p) {
        return {
            seed: QualifiedParameters.readSeed(p),
            numRuns: QualifiedParameters.readNumRuns(p),
            maxSkipsPerRun: QualifiedParameters.readMaxSkipsPerRun(p),
            timeout: QualifiedParameters.readTimeout(p),
            logger: QualifiedParameters.readLogger(p),
            path: QualifiedParameters.readPath(p),
            unbiased: QualifiedParameters.readUnbiased(p),
            verbose: QualifiedParameters.readVerbose(p),
            examples: QualifiedParameters.readExamples(p)
        };
    };
    /**
     * Extract a runner configuration from Parameters
     * or build one based on a maximal number of runs
     *
     * @param p Incoming Parameters or maximal number of runs
     */
    QualifiedParameters.readOrNumRuns = function (p) {
        if (p == null)
            return QualifiedParameters.read();
        if (typeof p === 'number')
            return QualifiedParameters.read({ numRuns: p });
        return QualifiedParameters.read(p);
    };
    QualifiedParameters.readSeed = function (p) { return (p != null && p.seed != null ? p.seed : Date.now()); };
    QualifiedParameters.readNumRuns = function (p) {
        var defaultValue = 100;
        if (p == null)
            return defaultValue;
        if (p.numRuns != null)
            return p.numRuns;
        if (p.num_runs != null)
            return p.num_runs;
        return defaultValue;
    };
    QualifiedParameters.readMaxSkipsPerRun = function (p) {
        return p != null && p.maxSkipsPerRun != null ? p.maxSkipsPerRun : 100;
    };
    QualifiedParameters.readTimeout = function (p) {
        return p != null && p.timeout != null ? p.timeout : null;
    };
    QualifiedParameters.readPath = function (p) { return (p != null && p.path != null ? p.path : ''); };
    QualifiedParameters.readUnbiased = function (p) { return p != null && p.unbiased === true; };
    QualifiedParameters.readVerbose = function (p) { return p != null && p.verbose === true; };
    QualifiedParameters.readLogger = function (p) {
        if (p != null && p.logger != null)
            return p.logger;
        return function (v) {
            // tslint:disable-next-line:no-console
            console.log(v);
        };
    };
    QualifiedParameters.readExamples = function (p) { return (p != null && p.examples != null ? p.examples : []); };
    return QualifiedParameters;
}());
exports.QualifiedParameters = QualifiedParameters;

});

unwrapExports(QualifiedParameters_1);
var QualifiedParameters_2 = QualifiedParameters_1.QualifiedParameters;

var RunExecution_1 = createCommonjsModule(function (module, exports) {
var __read = (commonjsGlobal && commonjsGlobal.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (commonjsGlobal && commonjsGlobal.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
exports.__esModule = true;
/**
 * @hidden
 *
 * Report the status of a run
 *
 * It receives notification from the runner in case of failures
 */
var RunExecution = /** @class */ (function () {
    function RunExecution(storeFailures) {
        var _this = this;
        this.storeFailures = storeFailures;
        this.isSuccess = function () { return _this.pathToFailure == null; };
        this.firstFailure = function () { return (_this.pathToFailure ? +_this.pathToFailure.split(':')[0] : -1); };
        this.numShrinks = function () { return (_this.pathToFailure ? _this.pathToFailure.split(':').length - 1 : 0); };
        this.allFailures = [];
        this.numSkips = 0;
        this.numSuccesses = 0;
    }
    RunExecution.prototype.fail = function (value, id, message) {
        if (this.storeFailures)
            this.allFailures.push(value);
        if (this.pathToFailure == null)
            this.pathToFailure = "" + id;
        else
            this.pathToFailure += ":" + id;
        this.value = value;
        this.failure = message;
    };
    RunExecution.prototype.skip = function () {
        if (this.pathToFailure == null) {
            ++this.numSkips;
        }
    };
    RunExecution.prototype.success = function () {
        if (this.pathToFailure == null) {
            ++this.numSuccesses;
        }
    };
    RunExecution.prototype.toRunDetails = function (seed, basePath, numRuns, maxSkips) {
        if (!this.isSuccess()) {
            // encountered a property failure
            return {
                failed: true,
                numRuns: this.firstFailure() + 1 - this.numSkips,
                numSkips: this.numSkips,
                numShrinks: this.numShrinks(),
                seed: seed,
                counterexample: this.value,
                counterexamplePath: RunExecution.mergePaths(basePath, this.pathToFailure),
                error: this.failure,
                failures: this.allFailures
            };
        }
        if (this.numSkips > maxSkips) {
            // too many skips
            return {
                failed: true,
                numRuns: this.numSuccesses,
                numSkips: this.numSkips,
                numShrinks: 0,
                seed: seed,
                counterexample: null,
                counterexamplePath: null,
                error: null,
                failures: []
            };
        }
        return {
            failed: false,
            numRuns: numRuns,
            numSkips: this.numSkips,
            numShrinks: 0,
            seed: seed,
            counterexample: null,
            counterexamplePath: null,
            error: null,
            failures: []
        };
    };
    RunExecution.mergePaths = function (offsetPath, path) {
        if (offsetPath.length === 0)
            return path;
        var offsetItems = offsetPath.split(':');
        var remainingItems = path.split(':');
        var middle = +offsetItems[offsetItems.length - 1] + +remainingItems[0];
        return __spread(offsetItems.slice(0, offsetItems.length - 1), ["" + middle], remainingItems.slice(1)).join(':');
    };
    return RunExecution;
}());
exports.RunExecution = RunExecution;

});

unwrapExports(RunExecution_1);
var RunExecution_2 = RunExecution_1.RunExecution;

var __read = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
function generateN(rng, num) {
    var cur = rng;
    var out = [];
    for (var idx = 0; idx != num; ++idx) {
        var _a = __read(cur.next(), 2), value = _a[0], next = _a[1];
        out.push(value);
        cur = next;
    }
    return [out, cur];
}
function skipN(rng, num) {
    return generateN(rng, num)[1];
}

var MULTIPLIER = 0x000343fd;
var INCREMENT = 0x00269ec3;
var MASK = 0xffffffff;
var MASK_2 = (1 << 31) - 1;
var LinearCongruential = (function () {
    function LinearCongruential(seed) {
        this.seed = seed;
    }
    LinearCongruential.prototype.min = function () {
        return LinearCongruential.min;
    };
    LinearCongruential.prototype.max = function () {
        return LinearCongruential.max;
    };
    LinearCongruential.prototype.next = function () {
        var nextseed = (this.seed * MULTIPLIER + INCREMENT) & MASK;
        return [(nextseed & MASK_2) >> 16, new LinearCongruential(nextseed)];
    };
    LinearCongruential.min = 0;
    LinearCongruential.max = Math.pow(2, 15) - 1;
    return LinearCongruential;
}());
function LinearCongruential$1 (seed) {
    return new LinearCongruential(seed);
}

var __read$1 = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (undefined && undefined.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read$1(arguments[i]));
    return ar;
};
function toUint32(num) {
    return (num | 0) >= 0 ? (num | 0) : (num | 0) + 4294967296;
}
function toInt32(num) {
    return num | 0;
}
function productInUint32(a, b) {
    var a32 = toUint32(a);
    var alo = a32 & 0xffff;
    var ahi = (a32 >> 16) & 0xffff;
    var b32 = toUint32(b);
    var blo = b32 & 0xffff;
    var bhi = (b32 >> 16) & 0xffff;
    return toUint32(alo * blo + (alo * bhi + ahi * blo) * 0x10000);
}
function rshiftInUint32(a, shift) {
    return a < 0x80000000
        ? a >> shift
        : ((a - 0x80000000) >> shift) + (1 << (31 - shift));
}
var MersenneTwister = (function () {
    function MersenneTwister(states, index) {
        if (index >= MersenneTwister.N) {
            this.states = MersenneTwister.twist(states);
            this.index = 0;
        }
        else {
            this.states = states;
            this.index = index;
        }
    }
    MersenneTwister.twist = function (prev) {
        var mt = prev.slice();
        for (var idx = 0; idx !== MersenneTwister.N; ++idx) {
            var x = toUint32(toUint32(mt[idx] & MersenneTwister.MASK_UPPER) +
                toUint32(mt[(idx + 1) % MersenneTwister.N] & MersenneTwister.MASK_LOWER));
            var xA = rshiftInUint32(x, 1);
            if (x & 1) {
                xA = toUint32(xA ^ MersenneTwister.A);
            }
            mt[idx] = toUint32(mt[(idx + MersenneTwister.M) % MersenneTwister.N] ^ xA);
        }
        return mt;
    };
    MersenneTwister.seeded = function (seed) {
        var out = __spread(Array(MersenneTwister.N)).map(function () { return 0; });
        out[0] = seed;
        for (var idx = 1; idx !== MersenneTwister.N; ++idx) {
            if (toInt32(out[idx - 1]) < 0) {
                var rescaled = toInt32(out[idx - 1]) + 0x80000000;
                var xored = (rescaled ^ ((rescaled >> 30) + 2)) + 0x80000000;
                out[idx] = toUint32(productInUint32(MersenneTwister.F, xored) + idx);
            }
            else {
                var xored = (out[idx - 1] ^ (out[idx - 1] >> 30));
                out[idx] = toUint32(productInUint32(MersenneTwister.F, xored) + idx);
            }
        }
        return out;
    };
    MersenneTwister.from = function (seed) {
        return new MersenneTwister(MersenneTwister.seeded(seed), MersenneTwister.N);
    };
    MersenneTwister.prototype.min = function () {
        return MersenneTwister.min;
    };
    MersenneTwister.prototype.max = function () {
        return MersenneTwister.max;
    };
    MersenneTwister.prototype.next = function () {
        var y = this.states[this.index];
        y = toUint32(y ^ rshiftInUint32(this.states[this.index], MersenneTwister.U));
        y = toUint32(y ^ ((y << MersenneTwister.S) & MersenneTwister.B));
        y = toUint32(y ^ ((y << MersenneTwister.T) & MersenneTwister.C));
        y = toUint32(y ^ rshiftInUint32(y, MersenneTwister.L));
        return [y, new MersenneTwister(this.states, this.index + 1)];
    };
    MersenneTwister.min = 0;
    MersenneTwister.max = 0xffffffff;
    MersenneTwister.N = 624;
    MersenneTwister.M = 397;
    MersenneTwister.R = 31;
    MersenneTwister.A = 0x9908B0DF;
    MersenneTwister.F = 1812433253;
    MersenneTwister.U = 11;
    MersenneTwister.S = 7;
    MersenneTwister.B = 0x9D2C5680;
    MersenneTwister.T = 15;
    MersenneTwister.C = 0xEFC60000;
    MersenneTwister.L = 18;
    MersenneTwister.MASK_LOWER = (Math.pow(2, MersenneTwister.R)) - 1;
    MersenneTwister.MASK_UPPER = (Math.pow(2, MersenneTwister.R));
    return MersenneTwister;
}());
function MersenneTwister$1 (seed) {
    return MersenneTwister.from(seed);
}

var __read$2 = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var uniformIntDistribution = function (from, to) {
    var diff = to - from + 1;
    function helper(rng) {
        var nrng = rng;
        var MIN_RNG = rng.min();
        var NUM_VALUES = rng.max() - rng.min() + 1;
        if (diff <= NUM_VALUES) {
            var MAX_ALLOWED = NUM_VALUES - (NUM_VALUES % diff);
            while (true) {
                var _a = __read$2(nrng.next(), 2), v = _a[0], tmpRng = _a[1];
                var deltaV = v - MIN_RNG;
                nrng = tmpRng;
                if (deltaV < MAX_ALLOWED) {
                    return [deltaV % diff + from, nrng];
                }
            }
        }
        var maxRandomValue = 1;
        var numIterationsRequired = 0;
        while (maxRandomValue < diff) {
            maxRandomValue *= NUM_VALUES;
            ++numIterationsRequired;
        }
        var maxAllowedRandom = diff * Math.floor(1. * maxRandomValue / diff);
        while (true) {
            var value = 0;
            for (var num = 0; num !== numIterationsRequired; ++num) {
                var _b = __read$2(nrng.next(), 2), v = _b[0], tmpRng = _b[1];
                value = NUM_VALUES * value + (v - MIN_RNG);
                nrng = tmpRng;
            }
            if (value < maxAllowedRandom) {
                var inDiff = value - diff * Math.floor(1. * value / diff);
                return [inDiff + from, nrng];
            }
        }
    }
    return helper;
};



var prand = /*#__PURE__*/Object.freeze({
	generateN: generateN,
	skipN: skipN,
	congruential: LinearCongruential$1,
	mersenne: MersenneTwister$1,
	uniformIntDistribution: uniformIntDistribution
});



var pureRand = /*#__PURE__*/Object.freeze({
	default: prand,
	generateN: generateN,
	skipN: skipN,
	congruential: LinearCongruential$1,
	mersenne: MersenneTwister$1,
	uniformIntDistribution: uniformIntDistribution
});

var prand$1 = ( pureRand && prand ) || pureRand;

var Random_1 = createCommonjsModule(function (module, exports) {
var __read = (commonjsGlobal && commonjsGlobal.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
exports.__esModule = true;

var Random = /** @class */ (function () {
    /**
     * Create a mutable random number generator
     * @param internalRng Immutable random generator from pure-rand library
     */
    function Random(internalRng) {
        this.internalRng = internalRng;
    }
    /**
     * Clone the random number generator
     */
    Random.prototype.clone = function () {
        return new Random(this.internalRng);
    };
    Random.prototype.uniformIn = function (rangeMin, rangeMax) {
        var _a = __read(prand$1.uniformIntDistribution(rangeMin, rangeMax)(this.internalRng), 2), v = _a[0], nrng = _a[1];
        this.internalRng = nrng;
        return v;
    };
    /**
     * Generate an integer having `bits` random bits
     * @param bits Number of bits to generate
     */
    Random.prototype.next = function (bits) {
        return this.uniformIn(0, (1 << bits) - 1);
    };
    /**
     * Generate a random boolean
     */
    Random.prototype.nextBoolean = function () {
        return this.uniformIn(0, 1) === 1;
    };
    Random.prototype.nextInt = function (min, max) {
        return this.uniformIn(min == null ? Random.MIN_INT : min, max == null ? Random.MAX_INT : max);
    };
    /**
     * Generate a random floating point number between 0.0 (included) and 1.0 (excluded)
     */
    Random.prototype.nextDouble = function () {
        var a = this.next(26);
        var b = this.next(27);
        return (a * Random.DBL_FACTOR + b) * Random.DBL_DIVISOR;
    };
    Random.MIN_INT = 0x80000000 | 0;
    Random.MAX_INT = 0x7fffffff | 0;
    Random.DBL_FACTOR = Math.pow(2, 27);
    Random.DBL_DIVISOR = Math.pow(2, -53);
    return Random;
}());
exports.Random = Random;

});

unwrapExports(Random_1);
var Random_2 = Random_1.Random;

var Tosser = createCommonjsModule(function (module, exports) {
var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (commonjsGlobal && commonjsGlobal.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
exports.__esModule = true;



/** @hidden */
function lazyGenerate(generator, rng, idx) {
    return function () { return generator.generate(new Random_1.Random(rng), idx); };
}
/** @hidden */
function toss(generator, seed, examples) {
    var idx, rng;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [5 /*yield**/, __values(examples.map(function (e) { return function () { return new Shrinkable_1.Shrinkable(e); }; }))];
            case 1:
                _a.sent();
                idx = 0;
                rng = prand$1.mersenne(seed);
                _a.label = 2;
            case 2:
                rng = prand$1.skipN(rng, 42);
                return [4 /*yield*/, lazyGenerate(generator, rng, idx++)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4: return [3 /*break*/, 2];
            case 5: return [2 /*return*/];
        }
    });
}
exports.toss = toss;

});

unwrapExports(Tosser);
var Tosser_1 = Tosser.toss;

var PathWalker = createCommonjsModule(function (module, exports) {
var __values = (commonjsGlobal && commonjsGlobal.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
exports.__esModule = true;

/** @hidden */
function pathWalk(path, initialValues) {
    var e_1, _a;
    var values = Stream_1.stream(initialValues);
    var segments = path.split(':').map(function (text) { return +text; });
    if (segments.length === 0)
        return values;
    if (!segments.every(function (v) { return !Number.isNaN(v); })) {
        throw new Error("Unable to replay, got invalid path=" + path);
    }
    values = values.drop(segments[0]);
    try {
        for (var _b = __values(segments.slice(1)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var s = _c.value;
            var valueToShrink = values.getNthOrLast(0);
            if (valueToShrink == null) {
                throw new Error("Unable to replay, got wrong path=" + path);
            }
            values = valueToShrink.shrink().drop(s);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return values;
}
exports.pathWalk = pathWalk;

});

unwrapExports(PathWalker);
var PathWalker_1 = PathWalker.pathWalk;

var utils = createCommonjsModule(function (module, exports) {
var __read = (commonjsGlobal && commonjsGlobal.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (commonjsGlobal && commonjsGlobal.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
exports.__esModule = true;
/** @hidden */
function prettyOne(value) {
    if (typeof value === 'string')
        return JSON.stringify(value);
    var defaultRepr = "" + value;
    if (/^\[object (Object|Null|Undefined)\]$/.exec(defaultRepr) === null)
        return defaultRepr;
    try {
        return JSON.stringify(value);
    }
    catch (err) {
        // ignored: object cannot be stringified using JSON.stringify
    }
    return defaultRepr;
}
/** @hidden */
function pretty(value) {
    if (Array.isArray(value))
        return "[" + __spread(value).map(pretty).join(',') + "]";
    return prettyOne(value);
}
/** @hidden */
function throwIfFailed(out) {
    if (out.failed) {
        if (out.counterexample == null) {
            throw new Error("Failed to run property, too many pre-condition failures encountered\n\nRan " + out.numRuns + " time(s)\nSkipped " + out.numSkips + " time(s)\n\nHint (1): Try to reduce the number of rejected values by combining map, flatMap and built-in arbitraries\nHint (2): Increase failure tolerance by setting maxSkipsPerRun to an higher value");
        }
        throw new Error("Property failed after " + out.numRuns + " tests\n{ seed: " + out.seed + ", path: \"" + out.counterexamplePath + "\" }\nCounterexample: " + pretty(out.counterexample) + "\nShrunk " + out.numShrinks + " time(s)\nGot error: " + out.error + "\n\n" + (out.failures.length === 0
            ? 'Hint: Enable verbose mode in order to have the list of all failing values encountered during the run'
            : "Encountered failures were:\n- " + out.failures.map(pretty).join('\n- ')));
    }
}
exports.throwIfFailed = throwIfFailed;

});

unwrapExports(utils);
var utils_1 = utils.throwIfFailed;

var Runner = createCommonjsModule(function (module, exports) {
var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (commonjsGlobal && commonjsGlobal.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = (commonjsGlobal && commonjsGlobal.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (commonjsGlobal && commonjsGlobal.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
exports.__esModule = true;








/** @hidden */
function runIt(property, initialValues, maxInitialIterations, remainingSkips, verbose) {
    var e_1, _a;
    var runExecution = new RunExecution_1.RunExecution(verbose);
    var done = false;
    function g() {
        var n;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(--maxInitialIterations !== -1 && remainingSkips >= 0)) return [3 /*break*/, 2];
                    n = initialValues.next();
                    if (n.done)
                        return [2 /*return*/];
                    return [4 /*yield*/, n.value()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 0];
                case 2: return [2 /*return*/];
            }
        });
    }
    var values = g();
    while (!done) {
        done = true;
        var idx = 0;
        try {
            for (var values_1 = __values(values), values_1_1 = values_1.next(); !values_1_1.done; values_1_1 = values_1.next()) {
                var v = values_1_1.value;
                var out = property.run(v.value);
                if (out != null && typeof out === 'string') {
                    runExecution.fail(v.value, idx, out);
                    values = v.shrink();
                    done = false;
                    break;
                }
                if (out != null) {
                    // skipped the run
                    runExecution.skip();
                    --remainingSkips;
                    ++maxInitialIterations;
                }
                else {
                    runExecution.success();
                }
                ++idx;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (values_1_1 && !values_1_1.done && (_a = values_1["return"])) _a.call(values_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    return runExecution;
}
/** @hidden */
function asyncRunIt(property, initialValues, maxInitialIterations, remainingSkips, verbose) {
    return __awaiter(this, void 0, void 0, function () {
        function g() {
            var n;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(--maxInitialIterations !== -1 && remainingSkips >= 0)) return [3 /*break*/, 2];
                        n = initialValues.next();
                        if (n.done)
                            return [2 /*return*/];
                        return [4 /*yield*/, n.value()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 0];
                    case 2: return [2 /*return*/];
                }
            });
        }
        var e_2, _a, runExecution, done, values, idx, values_2, values_2_1, v, out, e_2_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    runExecution = new RunExecution_1.RunExecution(verbose);
                    done = false;
                    values = g();
                    _b.label = 1;
                case 1:
                    if (!!done) return [3 /*break*/, 10];
                    done = true;
                    idx = 0;
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 7, 8, 9]);
                    values_2 = __values(values), values_2_1 = values_2.next();
                    _b.label = 3;
                case 3:
                    if (!!values_2_1.done) return [3 /*break*/, 6];
                    v = values_2_1.value;
                    return [4 /*yield*/, property.run(v.value)];
                case 4:
                    out = _b.sent();
                    if (out != null && typeof out === 'string') {
                        runExecution.fail(v.value, idx, out);
                        values = v.shrink();
                        done = false;
                        return [3 /*break*/, 6];
                    }
                    if (out != null) {
                        // skipped the run
                        runExecution.skip();
                        --remainingSkips;
                        ++maxInitialIterations;
                    }
                    else {
                        runExecution.success();
                    }
                    ++idx;
                    _b.label = 5;
                case 5:
                    values_2_1 = values_2.next();
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 9];
                case 7:
                    e_2_1 = _b.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 9];
                case 8:
                    try {
                        if (values_2_1 && !values_2_1.done && (_a = values_2["return"])) _a.call(values_2);
                    }
                    finally { if (e_2) throw e_2.error; }
                    return [7 /*endfinally*/];
                case 9: return [3 /*break*/, 1];
                case 10: return [2 /*return*/, runExecution];
            }
        });
    });
}
/** @hidden */
function decorateProperty(rawProperty, qParams) {
    var propA = rawProperty.isAsync() && qParams.timeout != null ? new TimeoutProperty_1.TimeoutProperty(rawProperty, qParams.timeout) : rawProperty;
    return qParams.unbiased === true ? new UnbiasedProperty_1.UnbiasedProperty(propA) : propA;
}
/** @hidden */
function runnerPathWalker(valueProducers, path) {
    var pathPoints = path.split(':');
    var pathStream = Stream_1.stream(valueProducers)
        .drop(pathPoints.length > 0 ? +pathPoints[0] : 0)
        .map(function (producer) { return producer(); });
    var adaptedPath = __spread(['0'], pathPoints.slice(1)).join(':');
    return Stream_1.stream(PathWalker.pathWalk(adaptedPath, pathStream)).map(function (v) { return function () { return v; }; });
}
function check(rawProperty, params) {
    if (rawProperty == null || rawProperty.generate == null)
        throw new Error('Invalid property encountered, please use a valid property');
    if (rawProperty.run == null)
        throw new Error('Invalid property encountered, please use a valid property not an arbitrary');
    var qParams = QualifiedParameters_1.QualifiedParameters.read(params);
    var property = decorateProperty(rawProperty, qParams);
    var generator = Tosser.toss(property, qParams.seed, qParams.examples);
    var maxInitialIterations = qParams.path.length === 0 ? qParams.numRuns : -1;
    var maxSkips = qParams.numRuns * qParams.maxSkipsPerRun;
    var initialValues = qParams.path.length === 0 ? generator : runnerPathWalker(generator, qParams.path);
    return property.isAsync()
        ? asyncRunIt(property, initialValues, maxInitialIterations, maxSkips, qParams.verbose).then(function (e) {
            return e.toRunDetails(qParams.seed, qParams.path, qParams.numRuns, maxSkips);
        })
        : runIt(property, initialValues, maxInitialIterations, maxSkips, qParams.verbose).toRunDetails(qParams.seed, qParams.path, qParams.numRuns, maxSkips);
}
exports.check = check;
function assert(property, params) {
    var out = check(property, params);
    if (property.isAsync())
        return out.then(utils.throwIfFailed);
    else
        utils.throwIfFailed(out);
}
exports.assert = assert;

});

unwrapExports(Runner);
var Runner_1 = Runner.check;
var Runner_2 = Runner.assert;

var polyfills = createCommonjsModule(function (module, exports) {
// All the implementations below are directly taken from https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference
exports.__esModule = true;
/** @hidden */
exports.ObjectEntriesImpl = function (obj) {
    var ownProps = Object.keys(obj);
    var i = ownProps.length;
    var resArray = new Array(i);
    while (i--)
        resArray[i] = [ownProps[i], obj[ownProps[i]]];
    return resArray;
};
/** @hidden */
exports.ObjectEntries = Object.entries ? Object.entries : exports.ObjectEntriesImpl;
/** @hidden */
var repeatUpToLength = function (src, targetLength) {
    for (; targetLength > src.length; src += src)
        ;
    return src;
};
/** @hidden */
exports.StringPadEndImpl = function (src, targetLength, padString) {
    targetLength = targetLength >> 0;
    if (padString === '' || src.length > targetLength)
        return String(src);
    targetLength = targetLength - src.length;
    padString = repeatUpToLength(typeof padString !== 'undefined' ? String(padString) : ' ', targetLength);
    return String(src) + padString.slice(0, targetLength);
};
/** @hidden */
exports.StringPadStartImpl = function (src, targetLength, padString) {
    targetLength = targetLength >> 0;
    if (padString === '' || src.length > targetLength)
        return String(src);
    targetLength = targetLength - src.length;
    padString = repeatUpToLength(typeof padString !== 'undefined' ? String(padString) : ' ', targetLength);
    return padString.slice(0, targetLength) + String(src);
};
/** @hidden */
var wrapStringPad = function (method) {
    return (method &&
        (function (src, targetLength, padString) { return method.call(src, targetLength, padString); }));
};
/** @hidden */
exports.StringPadEnd = wrapStringPad(String.prototype.padEnd) || exports.StringPadEndImpl;
/** @hidden */
exports.StringPadStart = wrapStringPad(String.prototype.padStart) || exports.StringPadStartImpl;
/** @hidden */
exports.StringFromCodePointLimitedImpl = function (codePoint) {
    if (codePoint < 0x10000)
        return String.fromCharCode(codePoint);
    codePoint -= 0x10000;
    return String.fromCharCode((codePoint >> 10) + 0xd800) + String.fromCharCode((codePoint % 0x400) + 0xdc00);
};
/** @hidden */
exports.StringFromCodePointLimited = String.fromCodePoint ? String.fromCodePoint : exports.StringFromCodePointLimitedImpl;
// only takes into account a single code point

});

unwrapExports(polyfills);
var polyfills_1 = polyfills.ObjectEntriesImpl;
var polyfills_2 = polyfills.ObjectEntries;
var polyfills_3 = polyfills.StringPadEndImpl;
var polyfills_4 = polyfills.StringPadStartImpl;
var polyfills_5 = polyfills.StringPadEnd;
var polyfills_6 = polyfills.StringPadStart;
var polyfills_7 = polyfills.StringFromCodePointLimitedImpl;
var polyfills_8 = polyfills.StringFromCodePointLimited;

var Sampler = createCommonjsModule(function (module, exports) {
var __read = (commonjsGlobal && commonjsGlobal.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (commonjsGlobal && commonjsGlobal.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __values = (commonjsGlobal && commonjsGlobal.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
exports.__esModule = true;







/** @hidden */
function toProperty(generator, qParams) {
    var prop = !generator.hasOwnProperty('isAsync')
        ? new Property.Property(generator, function () { return true; })
        : generator;
    return qParams.unbiased === true ? new UnbiasedProperty_1.UnbiasedProperty(prop) : prop;
}
/** @hidden */
function streamSample(generator, params) {
    var qParams = QualifiedParameters_1.QualifiedParameters.readOrNumRuns(params);
    var tossedValues = Stream_1.stream(Tosser.toss(toProperty(generator, qParams), qParams.seed, qParams.examples));
    if (qParams.path.length === 0) {
        return tossedValues.take(qParams.numRuns).map(function (s) { return s().value; });
    }
    return Stream_1.stream(PathWalker.pathWalk(qParams.path, tossedValues.map(function (s) { return s(); })))
        .take(qParams.numRuns)
        .map(function (s) { return s.value; });
}
/**
 * Generate an array containing all the values that would have been generated during {@link assert} or {@link check}
 *
 * @example
 * ```typescript
 * fc.sample(fc.nat(), 10); // extract 10 values from fc.nat() Arbitrary
 * fc.sample(fc.nat(), {seed: 42}); // extract values from fc.nat() as if we were running fc.assert with seed=42
 * ```
 *
 * @param generator {@link IProperty} or {@link Arbitrary} to extract the values from
 * @param params Integer representing the number of values to generate or {@link Parameters} as in {@link assert}
 */
function sample(generator, params) {
    return __spread(streamSample(generator, params));
}
exports.sample = sample;
/**
 * Gather useful statistics concerning generated values
 *
 * Print the result in `console.log` or `params.logger` (if defined)
 *
 * @example
 * ```typescript
 * fc.statistics(
 *     fc.nat(999),
 *     v => v < 100 ? 'Less than 100' : 'More or equal to 100',
 *     {numRuns: 1000, logger: console.log});
 * // Classify 1000 values generated by fc.nat(999) into two categories:
 * // - Less than 100
 * // - More or equal to 100
 * // The output will be sent line by line to the logger
 * ```
 *
 * @param generator {@link IProperty} or {@link Arbitrary} to extract the values from
 * @param classify Classifier function that can classify the generated value in zero, one or more categories (with free labels)
 * @param params Integer representing the number of values to generate or {@link Parameters} as in {@link assert}
 */
function statistics(generator, classify, params) {
    var e_1, _a, e_2, _b, e_3, _c;
    var qParams = QualifiedParameters_1.QualifiedParameters.readOrNumRuns(params);
    var recorded = {};
    try {
        for (var _d = __values(streamSample(generator, params)), _e = _d.next(); !_e.done; _e = _d.next()) {
            var g = _e.value;
            var out = classify(g);
            var categories = Array.isArray(out) ? out : [out];
            try {
                for (var categories_1 = __values(categories), categories_1_1 = categories_1.next(); !categories_1_1.done; categories_1_1 = categories_1.next()) {
                    var c = categories_1_1.value;
                    recorded[c] = (recorded[c] || 0) + 1;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (categories_1_1 && !categories_1_1.done && (_b = categories_1["return"])) _b.call(categories_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_e && !_e.done && (_a = _d["return"])) _a.call(_d);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var data = polyfills.ObjectEntries(recorded)
        .sort(function (a, b) { return b[1] - a[1]; })
        .map(function (i) { return [i[0], ((i[1] * 100.0) / qParams.numRuns).toFixed(2) + "%"]; });
    var longestName = data.map(function (i) { return i[0].length; }).reduce(function (p, c) { return Math.max(p, c); }, 0);
    var longestPercent = data.map(function (i) { return i[1].length; }).reduce(function (p, c) { return Math.max(p, c); }, 0);
    try {
        for (var data_1 = __values(data), data_1_1 = data_1.next(); !data_1_1.done; data_1_1 = data_1.next()) {
            var item = data_1_1.value;
            qParams.logger(polyfills.StringPadEnd(item[0], longestName, '.') + ".." + polyfills.StringPadStart(item[1], longestPercent, '.'));
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (data_1_1 && !data_1_1.done && (_c = data_1["return"])) _c.call(data_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
}
exports.statistics = statistics;

});

unwrapExports(Sampler);
var Sampler_1 = Sampler.sample;
var Sampler_2 = Sampler.statistics;

var BiasedArbitraryWrapper_1 = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;

/** @hidden */
var BiasedArbitraryWrapper = /** @class */ (function (_super) {
    __extends(BiasedArbitraryWrapper, _super);
    function BiasedArbitraryWrapper(freq, arb, biasedArbBuilder) {
        var _this = _super.call(this) || this;
        _this.freq = freq;
        _this.arb = arb;
        _this.biasedArbBuilder = biasedArbBuilder;
        return _this;
    }
    BiasedArbitraryWrapper.prototype.generate = function (mrng) {
        return mrng.nextInt(1, this.freq) === 1 ? this.biasedArbBuilder(this.arb).generate(mrng) : this.arb.generate(mrng);
    };
    return BiasedArbitraryWrapper;
}(Arbitrary_1.Arbitrary));
/**
 * @hidden
 *
 * Helper function automatically choosing between the biased and unbiased versions of an Arbitrary.
 * This helper has been introduced in order to provide higher performances when building custom biased arbitraries
 */
function biasWrapper(freq, arb, biasedArbBuilder) {
    return new BiasedArbitraryWrapper(freq, arb, biasedArbBuilder);
}
exports.biasWrapper = biasWrapper;

});

unwrapExports(BiasedArbitraryWrapper_1);
var BiasedArbitraryWrapper_2 = BiasedArbitraryWrapper_1.biasWrapper;

var ArbitraryWithShrink_1 = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;


/**
 * Abstract class able to generate and shrink values on type `T`
 */
var ArbitraryWithShrink = /** @class */ (function (_super) {
    __extends(ArbitraryWithShrink, _super);
    function ArbitraryWithShrink() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Build the Shrinkable associated to value
     *
     * @param value Value to shrink
     * @param shrunkOnce Indicate whether its the first shrink
     * @returns Shrinkable associated to value
     */
    ArbitraryWithShrink.prototype.shrinkableFor = function (value, shrunkOnce) {
        var _this = this;
        return new Shrinkable_1.Shrinkable(value, function () { return _this.shrink(value, shrunkOnce === true).map(function (v) { return _this.shrinkableFor(v, true); }); });
    };
    return ArbitraryWithShrink;
}(Arbitrary_1.Arbitrary));
exports.ArbitraryWithShrink = ArbitraryWithShrink;

});

unwrapExports(ArbitraryWithShrink_1);
var ArbitraryWithShrink_2 = ArbitraryWithShrink_1.ArbitraryWithShrink;

var IntegerArbitrary_1 = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;




/** @hidden */
var IntegerArbitrary = /** @class */ (function (_super) {
    __extends(IntegerArbitrary, _super);
    function IntegerArbitrary(min, max) {
        var _this = _super.call(this) || this;
        _this.biasedIntegerArbitrary = null;
        _this.min = min === undefined ? IntegerArbitrary.MIN_INT : min;
        _this.max = max === undefined ? IntegerArbitrary.MAX_INT : max;
        return _this;
    }
    IntegerArbitrary.prototype.wrapper = function (value, shrunkOnce) {
        var _this = this;
        return new Shrinkable_1.Shrinkable(value, function () { return _this.shrink(value, shrunkOnce).map(function (v) { return _this.wrapper(v, true); }); });
    };
    IntegerArbitrary.prototype.generate = function (mrng) {
        return this.wrapper(mrng.nextInt(this.min, this.max), false);
    };
    IntegerArbitrary.prototype.shrink_to = function (value, target, shrunkOnce) {
        var realGap = value - target;
        function shrink_decr() {
            var gap, toremove;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        gap = shrunkOnce ? Math.floor(realGap / 2) : realGap;
                        toremove = gap;
                        _a.label = 1;
                    case 1:
                        if (!(toremove > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, value - toremove];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        toremove = Math.floor(toremove / 2);
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        }
        function shrink_incr() {
            var gap, toremove;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        gap = shrunkOnce ? Math.ceil(realGap / 2) : realGap;
                        toremove = gap;
                        _a.label = 1;
                    case 1:
                        if (!(toremove < 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, value - toremove];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        toremove = Math.ceil(toremove / 2);
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        }
        return realGap > 0 ? Stream_1.stream(shrink_decr()) : Stream_1.stream(shrink_incr());
    };
    IntegerArbitrary.prototype.shrink = function (value, shrunkOnce) {
        if (this.min <= 0 && this.max >= 0) {
            return this.shrink_to(value, 0, shrunkOnce === true);
        }
        return value < 0
            ? this.shrink_to(value, this.max, shrunkOnce === true)
            : this.shrink_to(value, this.min, shrunkOnce === true);
    };
    IntegerArbitrary.prototype.pureBiasedArbitrary = function () {
        if (this.biasedIntegerArbitrary != null) {
            return this.biasedIntegerArbitrary;
        }
        var log2 = function (v) { return Math.floor(Math.log(v) / Math.log(2)); };
        if (this.min === this.max) {
            this.biasedIntegerArbitrary = new IntegerArbitrary(this.min, this.max);
        }
        else if (this.min < 0) {
            this.biasedIntegerArbitrary =
                this.max > 0
                    ? new IntegerArbitrary(-log2(-this.min), log2(this.max)) // min and max != 0
                    : new IntegerArbitrary(this.max - log2(this.max - this.min), this.max); // max-min != 0
        }
        else {
            // min >= 0, so max >= 0
            this.biasedIntegerArbitrary = new IntegerArbitrary(this.min, this.min + log2(this.max - this.min)); // max-min != 0
        }
        return this.biasedIntegerArbitrary;
    };
    IntegerArbitrary.prototype.withBias = function (freq) {
        return BiasedArbitraryWrapper_1.biasWrapper(freq, this, function (originalArbitrary) { return originalArbitrary.pureBiasedArbitrary(); });
    };
    IntegerArbitrary.MIN_INT = 0x80000000 | 0;
    IntegerArbitrary.MAX_INT = 0x7fffffff | 0;
    return IntegerArbitrary;
}(ArbitraryWithShrink_1.ArbitraryWithShrink));
function integer(a, b) {
    return b === undefined ? new IntegerArbitrary(undefined, a) : new IntegerArbitrary(a, b);
}
exports.integer = integer;
function nat(a) {
    return new IntegerArbitrary(0, a);
}
exports.nat = nat;

});

unwrapExports(IntegerArbitrary_1);
var IntegerArbitrary_2 = IntegerArbitrary_1.integer;
var IntegerArbitrary_3 = IntegerArbitrary_1.nat;

var ArrayArbitrary_1 = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (commonjsGlobal && commonjsGlobal.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (commonjsGlobal && commonjsGlobal.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
exports.__esModule = true;





/** @hidden */
var ArrayArbitrary = /** @class */ (function (_super) {
    __extends(ArrayArbitrary, _super);
    function ArrayArbitrary(arb, minLength, maxLength, preFilter, preShrink) {
        if (preFilter === void 0) { preFilter = function (tab) { return tab; }; }
        if (preShrink === void 0) { preShrink = function (tab) { return tab; }; }
        var _this = _super.call(this) || this;
        _this.arb = arb;
        _this.minLength = minLength;
        _this.maxLength = maxLength;
        _this.preFilter = preFilter;
        _this.preShrink = preShrink;
        _this.lengthArb = IntegerArbitrary_1.integer(minLength, maxLength);
        return _this;
    }
    ArrayArbitrary.prototype.wrapper = function (itemsRaw, shrunkOnce) {
        var _this = this;
        var items = this.preFilter(itemsRaw);
        return new Shrinkable_1.Shrinkable(items.map(function (s) { return s.value; }), function () {
            return _this.shrinkImpl(items, shrunkOnce).map(function (v) { return _this.wrapper(v, true); });
        });
    };
    ArrayArbitrary.prototype.generate = function (mrng) {
        var _this = this;
        var size = this.lengthArb.generate(mrng);
        var items = __spread(Array(size.value)).map(function () { return _this.arb.generate(mrng); });
        return this.wrapper(items, false);
    };
    ArrayArbitrary.prototype.shrinkImpl = function (itemsRaw, shrunkOnce) {
        var _this = this;
        // shrinking one by one is the not the most comprehensive
        // but allows a reasonable number of entries in the shrink
        var items = this.preShrink(itemsRaw);
        if (items.length === 0) {
            return Stream_1.Stream.nil();
        }
        var size = this.lengthArb.shrinkableFor(items.length, shrunkOnce);
        return size
            .shrink()
            .map(function (l) { return items.slice(items.length - l.value); })
            .join(items[0].shrink().map(function (v) { return [v].concat(items.slice(1)); }))
            .join(items.length > this.minLength
            ? this.shrinkImpl(items.slice(1), false)
                .filter(function (vs) { return _this.minLength <= vs.length + 1; })
                .map(function (vs) { return [items[0]].concat(vs); })
            : Stream_1.Stream.nil());
    };
    ArrayArbitrary.prototype.withBias = function (freq) {
        return BiasedArbitraryWrapper_1.biasWrapper(freq, this, function (originalArbitrary) {
            var lowBiased = new ArrayArbitrary(originalArbitrary.arb.withBias(freq), originalArbitrary.minLength, originalArbitrary.maxLength, originalArbitrary.preFilter);
            var highBiasedArbBuilder = function () {
                return originalArbitrary.minLength !== originalArbitrary.maxLength
                    ? new ArrayArbitrary(originalArbitrary.arb.withBias(freq), originalArbitrary.minLength, originalArbitrary.minLength +
                        Math.floor(Math.log(originalArbitrary.maxLength - originalArbitrary.minLength) / Math.log(2)), originalArbitrary.preFilter)
                    : new ArrayArbitrary(originalArbitrary.arb.withBias(freq), originalArbitrary.minLength, originalArbitrary.maxLength, originalArbitrary.preFilter);
            };
            return BiasedArbitraryWrapper_1.biasWrapper(freq, lowBiased, highBiasedArbBuilder);
        });
    };
    return ArrayArbitrary;
}(Arbitrary_1.Arbitrary));
exports.ArrayArbitrary = ArrayArbitrary;
function array(arb, aLength, bLength) {
    if (bLength == null)
        return new ArrayArbitrary(arb, 0, aLength == null ? 10 : aLength);
    return new ArrayArbitrary(arb, aLength || 0, bLength);
}
exports.array = array;

});

unwrapExports(ArrayArbitrary_1);
var ArrayArbitrary_2 = ArrayArbitrary_1.ArrayArbitrary;
var ArrayArbitrary_3 = ArrayArbitrary_1.array;

var BooleanArbitrary = createCommonjsModule(function (module, exports) {
exports.__esModule = true;

/**
 * For boolean values - `true` or `false`
 */
function boolean() {
    return IntegerArbitrary_1.integer(0, 1)
        .map(function (v) { return v === 1; })
        .noBias();
}
exports.boolean = boolean;

});

unwrapExports(BooleanArbitrary);

var CharacterArbitrary_1 = createCommonjsModule(function (module, exports) {
exports.__esModule = true;


/** @hidden */
function CharacterArbitrary(min, max, mapToCode) {
    return IntegerArbitrary_1.integer(min, max)
        .map(function (n) { return String.fromCharCode(mapToCode(n)); })
        .noBias();
}
/** @hidden */
var preferPrintableMapper = function (v) {
    if (v < 95)
        return v + 0x20; // 0x20-0x7e
    if (v <= 0x7e)
        return v - 95;
    return v;
};
/**
 * For single printable ascii characters - char code between 0x20 (included) and 0x7e (included)
 * @see https://www.ascii-code.com/
 */
function char() {
    // Only printable characters: https://www.ascii-code.com/
    return CharacterArbitrary(0x20, 0x7e, function (v) { return v; });
}
exports.char = char;
/**
 * For single hexadecimal characters - 0-9 or a-f
 */
function hexa() {
    function mapper(v) {
        return v < 10
            ? v + 48 // 0-9
            : v + 97 - 10; // a-f
    }
    return CharacterArbitrary(0, 15, mapper);
}
exports.hexa = hexa;
/**
 * For single base64 characters - A-Z, a-z, 0-9, + or /
 */
function base64() {
    function mapper(v) {
        if (v < 26)
            return v + 65; // A-Z
        if (v < 52)
            return v + 97 - 26; // a-z
        if (v < 62)
            return v + 48 - 52; // 0-9
        return v === 62 ? 43 : 47; // +/
    }
    return CharacterArbitrary(0, 63, mapper);
}
exports.base64 = base64;
/**
 * For single ascii characters - char code between 0x00 (included) and 0x7f (included)
 */
function ascii() {
    return CharacterArbitrary(0x00, 0x7f, preferPrintableMapper);
}
exports.ascii = ascii;
/**
 * For single characters - all values in 0x0000-0xffff can be generated
 *
 * WARNING:
 *
 * Some generated characters might appear invalid regarding UCS-2 and UTF-16 encoding.
 * Indeed values within 0xd800 and 0xdfff constitute surrogate pair characters and are illegal without their paired character.
 */
function char16bits() {
    return CharacterArbitrary(0x0000, 0xffff, preferPrintableMapper);
}
exports.char16bits = char16bits;
/**
 * For single unicode characters defined in the BMP plan - char code between 0x0000 (included) and 0xffff (included) and without the range 0xd800 to 0xdfff (surrogate pair characters)
 */
function unicode() {
    // Characters in the range: U+D800 to U+DFFF
    // are called 'surrogate pairs', they cannot be defined alone and come by pairs
    // JavaScript function 'fromCodePoint' can handle those
    // This unicode builder is able to produce a subset of UTF-16 characters called UCS-2
    // You can refer to 'fromCharCode' documentation for more details
    var gapSize = 0xdfff + 1 - 0xd800;
    function mapping(v) {
        if (v < 0xd800)
            return preferPrintableMapper(v);
        return v + gapSize;
    }
    return CharacterArbitrary(0x0000, 0xffff - gapSize, mapping);
}
exports.unicode = unicode;
/**
 * For single unicode characters - any of the code points defined in the unicode standard
 *
 * WARNING: Generated values can have a length greater than 1.
 *
 * @see https://tc39.github.io/ecma262/#sec-utf16encoding
 */
function fullUnicode() {
    // Might require a polyfill if String.fromCodePoint is missing
    // from the node version or web-browser
    // Be aware that 'characters' can have a length greater than 1
    // More details on: https://tc39.github.io/ecma262/#sec-utf16encoding
    // This unicode builder is able to produce all the UTF-16 characters
    // It only produces valid UTF-16 code points
    var gapSize = 0xdfff + 1 - 0xd800;
    function mapping(v) {
        if (v < 0xd800)
            return v;
        return v + gapSize;
    }
    // Do not call CharacterArbitrary or use fromCodePoint in it
    // String.fromCodePoint is unknown for older versions of node
    return IntegerArbitrary_1.integer(0x0000, 0x10ffff - gapSize)
        .map(function (n) { return polyfills.StringFromCodePointLimited(mapping(n)); })
        .noBias();
}
exports.fullUnicode = fullUnicode;

});

unwrapExports(CharacterArbitrary_1);
var CharacterArbitrary_2 = CharacterArbitrary_1.hexa;
var CharacterArbitrary_3 = CharacterArbitrary_1.base64;
var CharacterArbitrary_4 = CharacterArbitrary_1.ascii;
var CharacterArbitrary_5 = CharacterArbitrary_1.char16bits;
var CharacterArbitrary_6 = CharacterArbitrary_1.unicode;
var CharacterArbitrary_7 = CharacterArbitrary_1.fullUnicode;

var ConstantArbitrary_1 = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (commonjsGlobal && commonjsGlobal.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (commonjsGlobal && commonjsGlobal.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
exports.__esModule = true;



/** @hidden */
var ConstantArbitrary = /** @class */ (function (_super) {
    __extends(ConstantArbitrary, _super);
    function ConstantArbitrary(values) {
        var _this = _super.call(this) || this;
        _this.values = values;
        return _this;
    }
    ConstantArbitrary.prototype.generate = function (mrng) {
        var _this = this;
        if (this.values.length === 1)
            return new Shrinkable_1.Shrinkable(this.values[0]);
        var id = mrng.nextInt(0, this.values.length - 1);
        if (id === 0)
            return new Shrinkable_1.Shrinkable(this.values[0]);
        function g(v) {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Shrinkable_1.Shrinkable(v)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }
        return new Shrinkable_1.Shrinkable(this.values[id], function () { return Stream_1.stream(g(_this.values[0])); });
    };
    return ConstantArbitrary;
}(Arbitrary_1.Arbitrary));
/**
 * For `value`
 * @param value The value to produce
 */
function constant(value) {
    return new ConstantArbitrary([value]);
}
exports.constant = constant;
/**
 * For one `...values` values - all equiprobable
 *
 * **WARNING**: It expects at least one value, otherwise it should throw
 *
 * @param values Constant values to be produced (all values shrink to the first one)
 */
function constantFrom() {
    var values = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
    }
    if (values.length === 0) {
        throw new Error('fc.constantFrom expects at least one parameter');
    }
    return new ConstantArbitrary(__spread(values));
}
exports.constantFrom = constantFrom;

});

unwrapExports(ConstantArbitrary_1);
var ConstantArbitrary_2 = ConstantArbitrary_1.constant;
var ConstantArbitrary_3 = ConstantArbitrary_1.constantFrom;

var SetArbitrary = createCommonjsModule(function (module, exports) {
exports.__esModule = true;

/** @hidden */
function subArrayContains(tab, upperBound, includeValue) {
    for (var idx = 0; idx < upperBound; ++idx) {
        if (includeValue(tab[idx]))
            return true;
    }
    return false;
}
/** @hidden */
function swap(tab, idx1, idx2) {
    var temp = tab[idx1];
    tab[idx1] = tab[idx2];
    tab[idx2] = temp;
}
/** @hidden */
function buildCompareFilter(compare) {
    return function (tab) {
        var finalLength = tab.length;
        var _loop_1 = function (idx) {
            if (subArrayContains(tab, idx, function (t) { return compare(t.value, tab[idx].value); })) {
                --finalLength;
                swap(tab, idx, finalLength);
            }
        };
        for (var idx = tab.length - 1; idx !== -1; --idx) {
            _loop_1(idx);
        }
        return tab.slice(0, finalLength);
    };
}
exports.buildCompareFilter = buildCompareFilter;
function set(arb, aLength, bLength, compareFn) {
    var minLength = bLength == null || typeof bLength !== 'number' ? 0 : aLength;
    var maxLength = aLength == null || typeof aLength !== 'number' ? 10 : typeof bLength === 'number' ? bLength : aLength;
    var compare = compareFn != null
        ? compareFn
        : typeof bLength === 'function'
            ? bLength
            : typeof aLength === 'function'
                ? aLength
                : function (a, b) { return a === b; };
    var arrayArb = new ArrayArbitrary_1.ArrayArbitrary(arb, minLength, maxLength, buildCompareFilter(compare));
    if (minLength === 0)
        return arrayArb;
    return arrayArb.filter(function (tab) { return tab.length >= minLength; });
}
exports.set = set;

});

unwrapExports(SetArbitrary);
var SetArbitrary_1 = SetArbitrary.buildCompareFilter;
var SetArbitrary_2 = SetArbitrary.set;

var DictionaryArbitrary = createCommonjsModule(function (module, exports) {
var __values = (commonjsGlobal && commonjsGlobal.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
exports.__esModule = true;


/** @hidden */
function toObject(items) {
    var e_1, _a;
    var obj = {};
    try {
        for (var items_1 = __values(items), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
            var keyValue = items_1_1.value;
            obj[keyValue[0]] = keyValue[1];
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (items_1_1 && !items_1_1.done && (_a = items_1["return"])) _a.call(items_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return obj;
}
/**
 * For dictionaries with keys produced by `keyArb` and values from `valueArb`
 * @param keyArb Arbitrary used to generate the keys of the object
 * @param valueArb Arbitrary used to generate the values of the object
 */
function dictionary(keyArb, valueArb) {
    return SetArbitrary.set(TupleArbitrary.tuple(keyArb, valueArb), function (t1, t2) { return t1[0] === t2[0]; }).map(toObject);
}
exports.dictionary = dictionary;

});

unwrapExports(DictionaryArbitrary);
var DictionaryArbitrary_1 = DictionaryArbitrary.dictionary;

var FloatingPointArbitrary = createCommonjsModule(function (module, exports) {
exports.__esModule = true;


/** @hidden */
function next(n) {
    return IntegerArbitrary_1.integer(0, (1 << n) - 1);
}
/** @hidden */
var floatInternal = function () {
    // uniformaly in the range 0 (inc.), 1 (exc.)
    return next(24).map(function (v) { return v / (1 << 24); });
};
function float(a, b) {
    if (a === undefined)
        return floatInternal();
    if (b === undefined)
        return floatInternal().map(function (v) { return v * a; });
    return floatInternal().map(function (v) { return a + v * (b - a); });
}
exports.float = float;
/** @hidden */ var doubleFactor = Math.pow(2, 27);
/** @hidden */ var doubleDivisor = Math.pow(2, -53);
/** @hidden */
var doubleInternal = function () {
    // uniformaly in the range 0 (inc.), 1 (exc.)
    return TupleArbitrary.tuple(next(26), next(27)).map(function (v) { return (v[0] * doubleFactor + v[1]) * doubleDivisor; });
};
function double(a, b) {
    if (a === undefined)
        return doubleInternal();
    if (b === undefined)
        return doubleInternal().map(function (v) { return v * a; });
    return doubleInternal().map(function (v) { return a + v * (b - a); });
}
exports.double = double;

});

unwrapExports(FloatingPointArbitrary);

var FrequencyArbitrary_1 = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (commonjsGlobal && commonjsGlobal.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (commonjsGlobal && commonjsGlobal.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
exports.__esModule = true;

/** @hidden */
var FrequencyArbitrary = /** @class */ (function (_super) {
    __extends(FrequencyArbitrary, _super);
    function FrequencyArbitrary(warbs) {
        var _this = _super.call(this) || this;
        _this.warbs = warbs;
        _this.summedWarbs = warbs
            .reduce(function (p, c) {
            return p.concat({
                weight: p[p.length - 1].weight + c.weight,
                arbitrary: c.arbitrary
            });
        }, [{ weight: 0, arbitrary: warbs[0].arbitrary }])
            .slice(1);
        _this.totalWeight = _this.summedWarbs[_this.summedWarbs.length - 1].weight;
        return _this;
    }
    FrequencyArbitrary.prototype.generate = function (mrng) {
        var selected = mrng.nextInt(0, this.totalWeight - 1);
        return this.summedWarbs.find(function (warb) { return selected < warb.weight; }).arbitrary.generate(mrng);
    };
    FrequencyArbitrary.prototype.withBias = function (freq) {
        return new FrequencyArbitrary(this.warbs.map(function (v) { return ({ weight: v.weight, arbitrary: v.arbitrary.withBias(freq) }); }));
    };
    return FrequencyArbitrary;
}(Arbitrary_1.Arbitrary));
/**
 * For one of the values generated by `...warbs` - the probability of selecting the ith warb is of `warb[i].weight / sum(warb[j].weight)`
 *
 * **WARNING**: It expects at least one (Arbitrary, weight)
 *
 * @param warbs (Arbitrary, weight)s that might be called to produce a value
 */
function frequency() {
    var warbs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        warbs[_i] = arguments[_i];
    }
    if (warbs.length === 0) {
        throw new Error('fc.frequency expects at least one parameter');
    }
    return new FrequencyArbitrary(__spread(warbs));
}
exports.frequency = frequency;

});

unwrapExports(FrequencyArbitrary_1);
var FrequencyArbitrary_2 = FrequencyArbitrary_1.frequency;

var dictionary = {
  words: [
    'ad',
    'adipisicing',
    'aliqua',
    'aliquip',
    'amet',
    'anim',
    'aute',
    'cillum',
    'commodo',
    'consectetur',
    'consequat',
    'culpa',
    'cupidatat',
    'deserunt',
    'do',
    'dolor',
    'dolore',
    'duis',
    'ea',
    'eiusmod',
    'elit',
    'enim',
    'esse',
    'est',
    'et',
    'eu',
    'ex',
    'excepteur',
    'exercitation',
    'fugiat',
    'id',
    'in',
    'incididunt',
    'ipsum',
    'irure',
    'labore',
    'laboris',
    'laborum',
    'Lorem',
    'magna',
    'minim',
    'mollit',
    'nisi',
    'non',
    'nostrud',
    'nulla',
    'occaecat',
    'officia',
    'pariatur',
    'proident',
    'qui',
    'quis',
    'reprehenderit',
    'sint',
    'sit',
    'sunt',
    'tempor',
    'ullamco',
    'ut',
    'velit',
    'veniam',
    'voluptate'
  ]
};

var dictionary_1 = dictionary;

var generator_1 = createCommonjsModule(function (module) {
function generator() {
  var options = (arguments.length) ? arguments[0] : {}
    , count = options.count || 1
    , units = options.units || 'sentences'
    , sentenceLowerBound = options.sentenceLowerBound || 5
    , sentenceUpperBound = options.sentenceUpperBound || 15
    , paragraphLowerBound = options.paragraphLowerBound || 3
    , paragraphUpperBound = options.paragraphUpperBound || 7
    , format = options.format || 'plain'
    , words = options.words || dictionary_1.words
    , random = options.random || Math.random
    , suffix = options.suffix;

  if (!suffix) {
    var isNode = module.exports;
    var isReactNative = typeof product !== 'undefined' && product.navigator === 'ReactNative';

    if (!isReactNative && isNode) {
      suffix = os.EOL;
    } else {
      suffix = '\n';
    }
  }

  units = simplePluralize(units.toLowerCase());

  function randomInteger(min, max) {
    return Math.floor(random() * (max - min + 1) + min);
  }
  function randomWord(words) {
    return words[randomInteger(0, words.length - 1)];
  }
  function randomSentence(words, lowerBound, upperBound) {
    var sentence = ''
      , bounds = {min: 0, max: randomInteger(lowerBound, upperBound)};

    while (bounds.min < bounds.max) {
      sentence += ' ' + randomWord(words);
      bounds.min++;
    }

    if (sentence.length) {
      sentence = sentence.slice(1);
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }

    return sentence;
  }
  function randomParagraph(words, lowerBound, upperBound, sentenceLowerBound, sentenceUpperBound) {
    var paragraph = ''
      , bounds = {min: 0, max: randomInteger(lowerBound, upperBound)};

    while (bounds.min < bounds.max) {
      paragraph += '. ' + randomSentence(words, sentenceLowerBound, sentenceUpperBound);
      bounds.min++;
    }

    if (paragraph.length) {
      paragraph = paragraph.slice(2);
      paragraph += '.';
    }

    return paragraph;
  }

  var bounds = {min: 0, max: count}
    , string = ''
    , openingTag
    , closingTag;

  if (format === 'html') {
    openingTag = '<p>';
    closingTag = '</p>';
  }

  while (bounds.min < bounds.max) {
    switch (units.toLowerCase()) {
      case 'words':
        string += ' ' + randomWord(words);
        break;
      case 'sentences':
        string += '. ' + randomSentence(words, sentenceLowerBound, sentenceUpperBound);
        break;
      case 'paragraphs':
        var nextString = randomParagraph(words, paragraphLowerBound, paragraphUpperBound, sentenceLowerBound, sentenceUpperBound);

        if (format === 'html') {
          nextString = openingTag + nextString + closingTag;
          if (bounds.min < bounds.max - 1) {
            nextString += suffix; // Each paragraph on a new line
          }
        } else if (bounds.min < bounds.max - 1) {
          nextString += suffix + suffix; // Double-up the EOL character to make distinct paragraphs, like carriage return
        }

        string += nextString;

        break;
    }

    bounds.min++;
  }

  if (string.length) {
    var pos = 0;

    if (string.indexOf('. ') === 0) {
      pos = 2;
    } else if (string.indexOf('.') === 0 || string.indexOf(' ') === 0) {
      pos = 1;
    }

    string = string.slice(pos);

    if (units === 'sentences') {
      string += '.';
    }
  }

  return string;
}
function simplePluralize(string) {
  if (string.indexOf('s', string.length - 1) === -1) {
    return string + 's';
  }
  return string;
}

module.exports = generator;
});

var LoremArbitrary_1 = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;




/** @hidden */
var LoremArbitrary = /** @class */ (function (_super) {
    __extends(LoremArbitrary, _super);
    function LoremArbitrary(numWords, mode) {
        var _this = _super.call(this) || this;
        _this.numWords = numWords;
        _this.mode = mode;
        return _this;
    }
    LoremArbitrary.prototype.generate = function (mrng) {
        var loremString = generator_1({
            count: this.numWords,
            units: this.mode,
            random: function () { return mrng.nextDouble(); }
        });
        return new Shrinkable_1.Shrinkable(loremString);
    };
    return LoremArbitrary;
}(Arbitrary_1.Arbitrary));
function lorem(maxWordsCount, sentencesMode) {
    var mode = sentencesMode ? 'sentences' : 'words';
    return IntegerArbitrary_1.nat(maxWordsCount || 5).chain(function (numWords) { return new LoremArbitrary(numWords, mode); });
}
exports.lorem = lorem;

});

unwrapExports(LoremArbitrary_1);
var LoremArbitrary_2 = LoremArbitrary_1.lorem;

var OneOfArbitrary_1 = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (commonjsGlobal && commonjsGlobal.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (commonjsGlobal && commonjsGlobal.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
exports.__esModule = true;

/** @hidden */
var OneOfArbitrary = /** @class */ (function (_super) {
    __extends(OneOfArbitrary, _super);
    function OneOfArbitrary(arbs) {
        var _this = _super.call(this) || this;
        _this.arbs = arbs;
        return _this;
    }
    OneOfArbitrary.prototype.generate = function (mrng) {
        var id = mrng.nextInt(0, this.arbs.length - 1);
        return this.arbs[id].generate(mrng);
    };
    OneOfArbitrary.prototype.withBias = function (freq) {
        return new OneOfArbitrary(this.arbs.map(function (a) { return a.withBias(freq); }));
    };
    return OneOfArbitrary;
}(Arbitrary_1.Arbitrary));
/**
 * For one of the values generated by `...arbs` - with all `...arbs` equiprobable
 *
 * **WARNING**: It expects at least one arbitrary
 *
 * @param arbs Arbitraries that might be called to produce a value
 */
function oneof() {
    var arbs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        arbs[_i] = arguments[_i];
    }
    if (arbs.length === 0) {
        throw new Error('fc.oneof expects at least one parameter');
    }
    return new OneOfArbitrary(__spread(arbs));
}
exports.oneof = oneof;

});

unwrapExports(OneOfArbitrary_1);
var OneOfArbitrary_2 = OneOfArbitrary_1.oneof;

var StringArbitrary_1 = createCommonjsModule(function (module, exports) {
exports.__esModule = true;


/** @hidden */
function StringArbitrary(charArb, aLength, bLength) {
    var arrayArb = aLength != null ? (bLength != null ? ArrayArbitrary_1.array(charArb, aLength, bLength) : ArrayArbitrary_1.array(charArb, aLength)) : ArrayArbitrary_1.array(charArb);
    return arrayArb.map(function (tab) { return tab.join(''); });
}
/** @hidden */
function Base64StringArbitrary(minLength, maxLength) {
    if (minLength > maxLength)
        throw new Error('Minimal length should be inferior or equal to maximal length');
    if (minLength % 4 !== 0)
        throw new Error('Minimal length of base64 strings must be a multiple of 4');
    if (maxLength % 4 !== 0)
        throw new Error('Maximal length of base64 strings must be a multiple of 4');
    return StringArbitrary(CharacterArbitrary_1.base64(), minLength, maxLength).map(function (s) {
        switch (s.length % 4) {
            case 0:
                return s;
            case 3:
                return s + "=";
            case 2:
                return s + "==";
            default:
                return s.slice(1); // remove one extra char to get to %4 == 0
        }
    });
}
function stringOf(charArb, aLength, bLength) {
    return StringArbitrary(charArb, aLength, bLength);
}
exports.stringOf = stringOf;
function string(aLength, bLength) {
    return StringArbitrary(CharacterArbitrary_1.char(), aLength, bLength);
}
exports.string = string;
function asciiString(aLength, bLength) {
    return StringArbitrary(CharacterArbitrary_1.ascii(), aLength, bLength);
}
exports.asciiString = asciiString;
function string16bits(aLength, bLength) {
    return StringArbitrary(CharacterArbitrary_1.char16bits(), aLength, bLength);
}
exports.string16bits = string16bits;
function unicodeString(aLength, bLength) {
    return StringArbitrary(CharacterArbitrary_1.unicode(), aLength, bLength);
}
exports.unicodeString = unicodeString;
function fullUnicodeString(aLength, bLength) {
    return StringArbitrary(CharacterArbitrary_1.fullUnicode(), aLength, bLength);
}
exports.fullUnicodeString = fullUnicodeString;
function hexaString(aLength, bLength) {
    return StringArbitrary(CharacterArbitrary_1.hexa(), aLength, bLength);
}
exports.hexaString = hexaString;
function base64String(aLength, bLength) {
    var minLength = aLength != null && bLength != null ? aLength : 0;
    var maxLength = bLength == null ? (aLength == null ? 16 : aLength) : bLength;
    return Base64StringArbitrary(minLength + 3 - ((minLength + 3) % 4), maxLength - (maxLength % 4)); // base64 length is always a multiple of 4
}
exports.base64String = base64String;

});

unwrapExports(StringArbitrary_1);
var StringArbitrary_2 = StringArbitrary_1.stringOf;
var StringArbitrary_3 = StringArbitrary_1.string;
var StringArbitrary_4 = StringArbitrary_1.asciiString;
var StringArbitrary_5 = StringArbitrary_1.string16bits;
var StringArbitrary_6 = StringArbitrary_1.unicodeString;
var StringArbitrary_7 = StringArbitrary_1.fullUnicodeString;
var StringArbitrary_8 = StringArbitrary_1.hexaString;
var StringArbitrary_9 = StringArbitrary_1.base64String;

var ObjectArbitrary = createCommonjsModule(function (module, exports) {
var __read = (commonjsGlobal && commonjsGlobal.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (commonjsGlobal && commonjsGlobal.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
exports.__esModule = true;








var ObjectConstraints = /** @class */ (function () {
    function ObjectConstraints(key, values, maxDepth) {
        this.key = key;
        this.values = values;
        this.maxDepth = maxDepth;
    }
    ObjectConstraints.prototype.next = function () {
        return new ObjectConstraints(this.key, this.values, this.maxDepth - 1);
    };
    /**
     * Default value of ObjectConstraints.Settings.values field
     */
    ObjectConstraints.defaultValues = function () {
        return [
            BooleanArbitrary.boolean(),
            IntegerArbitrary_1.integer(),
            FloatingPointArbitrary.double(),
            StringArbitrary_1.string(),
            OneOfArbitrary_1.oneof(StringArbitrary_1.string(), ConstantArbitrary_1.constant(null), ConstantArbitrary_1.constant(undefined)),
            OneOfArbitrary_1.oneof(FloatingPointArbitrary.double(), ConstantArbitrary_1.constant(-0), ConstantArbitrary_1.constant(0), ConstantArbitrary_1.constant(Number.NaN), ConstantArbitrary_1.constant(Number.POSITIVE_INFINITY), ConstantArbitrary_1.constant(Number.NEGATIVE_INFINITY), ConstantArbitrary_1.constant(Number.EPSILON), ConstantArbitrary_1.constant(Number.MIN_VALUE), ConstantArbitrary_1.constant(Number.MAX_VALUE), ConstantArbitrary_1.constant(Number.MIN_SAFE_INTEGER), ConstantArbitrary_1.constant(Number.MAX_SAFE_INTEGER))
        ];
    };
    ObjectConstraints.from = function (settings) {
        function getOr(access, value) {
            return settings != null && access() != null ? access() : value;
        }
        return new ObjectConstraints(getOr(function () { return settings.key; }, StringArbitrary_1.string()), getOr(function () { return settings.values; }, ObjectConstraints.defaultValues()), getOr(function () { return settings.maxDepth; }, 2));
    };
    return ObjectConstraints;
}());
exports.ObjectConstraints = ObjectConstraints;
/** @hidden */
var anythingInternal = function (subConstraints) {
    var potentialArbValue = __spread(subConstraints.values); // base
    if (subConstraints.maxDepth > 0) {
        potentialArbValue.push(objectInternal(subConstraints.next())); // sub-object
        potentialArbValue.push.apply(// sub-object
        potentialArbValue, __spread(subConstraints.values.map(function (arb) { return ArrayArbitrary_1.array(arb); }))); // arrays of base
        potentialArbValue.push(ArrayArbitrary_1.array(anythingInternal(subConstraints.next()))); // mixed content arrays
    }
    if (subConstraints.maxDepth > 1) {
        potentialArbValue.push(ArrayArbitrary_1.array(objectInternal(subConstraints.next().next()))); // array of Object
    }
    return OneOfArbitrary_1.oneof.apply(void 0, __spread(potentialArbValue));
};
/** @hidden */
var objectInternal = function (constraints) {
    return DictionaryArbitrary.dictionary(constraints.key, anythingInternal(constraints));
};
function anything(settings) {
    return anythingInternal(ObjectConstraints.from(settings));
}
exports.anything = anything;
function object(settings) {
    return objectInternal(ObjectConstraints.from(settings));
}
exports.object = object;
/** @hidden */
function jsonSettings(stringArbitrary, maxDepth) {
    var key = stringArbitrary;
    var values = [BooleanArbitrary.boolean(), IntegerArbitrary_1.integer(), FloatingPointArbitrary.double(), stringArbitrary, ConstantArbitrary_1.constant(null)];
    return maxDepth != null ? { key: key, values: values, maxDepth: maxDepth } : { key: key, values: values };
}
function jsonObject(maxDepth) {
    return anything(jsonSettings(StringArbitrary_1.string(), maxDepth));
}
exports.jsonObject = jsonObject;
function unicodeJsonObject(maxDepth) {
    return anything(jsonSettings(StringArbitrary_1.unicodeString(), maxDepth));
}
exports.unicodeJsonObject = unicodeJsonObject;
function json(maxDepth) {
    var arb = maxDepth != null ? jsonObject(maxDepth) : jsonObject();
    return arb.map(JSON.stringify);
}
exports.json = json;
function unicodeJson(maxDepth) {
    var arb = maxDepth != null ? unicodeJsonObject(maxDepth) : unicodeJsonObject();
    return arb.map(JSON.stringify);
}
exports.unicodeJson = unicodeJson;

});

unwrapExports(ObjectArbitrary);
var ObjectArbitrary_1 = ObjectArbitrary.ObjectConstraints;
var ObjectArbitrary_2 = ObjectArbitrary.anything;
var ObjectArbitrary_3 = ObjectArbitrary.object;
var ObjectArbitrary_4 = ObjectArbitrary.jsonObject;
var ObjectArbitrary_5 = ObjectArbitrary.unicodeJsonObject;
var ObjectArbitrary_6 = ObjectArbitrary.json;
var ObjectArbitrary_7 = ObjectArbitrary.unicodeJson;

var OptionArbitrary_1 = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;



/** @hidden */
var OptionArbitrary = /** @class */ (function (_super) {
    __extends(OptionArbitrary, _super);
    function OptionArbitrary(arb, frequency) {
        var _this = _super.call(this) || this;
        _this.arb = arb;
        _this.frequency = frequency;
        _this.isOptionArb = IntegerArbitrary_1.nat(frequency); // 1 chance over <frequency> to have non null
        return _this;
    }
    OptionArbitrary.extendedShrinkable = function (s) {
        function g() {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Shrinkable_1.Shrinkable(null)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }
        return new Shrinkable_1.Shrinkable(s.value, function () {
            return s
                .shrink()
                .map(OptionArbitrary.extendedShrinkable)
                .join(g());
        });
    };
    OptionArbitrary.prototype.generate = function (mrng) {
        return this.isOptionArb.generate(mrng).value === 0
            ? new Shrinkable_1.Shrinkable(null)
            : OptionArbitrary.extendedShrinkable(this.arb.generate(mrng));
    };
    OptionArbitrary.prototype.withBias = function (freq) {
        return new OptionArbitrary(this.arb.withBias(freq), this.frequency);
    };
    return OptionArbitrary;
}(Arbitrary_1.Arbitrary));
function option(arb, freq) {
    return new OptionArbitrary(arb, freq == null ? 5 : freq);
}
exports.option = option;

});

unwrapExports(OptionArbitrary_1);
var OptionArbitrary_2 = OptionArbitrary_1.option;

var RecordArbitrary = createCommonjsModule(function (module, exports) {
var __values = (commonjsGlobal && commonjsGlobal.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
exports.__esModule = true;


/** @hidden */
function rawRecord(recordModel) {
    var keys = Object.keys(recordModel);
    var arbs = keys.map(function (v) { return recordModel[v]; });
    return TupleArbitrary.genericTuple(arbs).map(function (gs) {
        var obj = {};
        for (var idx = 0; idx !== keys.length; ++idx)
            obj[keys[idx]] = gs[idx];
        return obj;
    });
}
function record(recordModel, constraints) {
    var e_1, _a;
    if (constraints == null || (constraints.withDeletedKeys !== true && constraints.with_deleted_keys !== true))
        return rawRecord(recordModel);
    var updatedRecordModel = {};
    try {
        for (var _b = __values(Object.keys(recordModel)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var k = _c.value;
            updatedRecordModel[k] = OptionArbitrary_1.option(recordModel[k].map(function (v) { return ({ value: v }); }));
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return rawRecord(updatedRecordModel).map(function (obj) {
        var e_2, _a;
        var nobj = {};
        try {
            for (var _b = __values(Object.keys(obj)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var k = _c.value;
                if (obj[k] != null)
                    nobj[k] = obj[k].value;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return nobj;
    });
}
exports.record = record;

});

unwrapExports(RecordArbitrary);
var RecordArbitrary_1 = RecordArbitrary.record;

var CommandWrapper_1 = createCommonjsModule(function (module, exports) {
exports.__esModule = true;
/** @hidden */
var CommandWrapper = /** @class */ (function () {
    function CommandWrapper(cmd) {
        this.cmd = cmd;
        this.hasRan = false;
    }
    CommandWrapper.prototype.check = function (m) {
        return this.cmd.check(m);
    };
    CommandWrapper.prototype.run = function (m, r) {
        this.hasRan = true;
        return this.cmd.run(m, r);
    };
    CommandWrapper.prototype.clone = function () {
        return new CommandWrapper(this.cmd);
    };
    CommandWrapper.prototype.toString = function () {
        return this.hasRan ? this.cmd.toString() : '-';
    };
    return CommandWrapper;
}());
exports.CommandWrapper = CommandWrapper;

});

unwrapExports(CommandWrapper_1);
var CommandWrapper_2 = CommandWrapper_1.CommandWrapper;

var CommandsArbitrary = createCommonjsModule(function (module, exports) {
var __read = (commonjsGlobal && commonjsGlobal.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (commonjsGlobal && commonjsGlobal.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
exports.__esModule = true;




/**
 * For arrays of {@link ICommand} to be executed by {@link modelRun} or {@link asyncModelRun}
 *
 * This implementation comes with a shrinker adapted for commands.
 * It should shrink more efficiently than {@link array} for {@link ICommand} arrays.
 *
 * @param commandArbs Arbitraries responsible to build commands
 * @param maxCommands Maximal number of commands to build
 */
exports.commands = function (commandArbs, maxCommands) {
    var internalCommandArb = OneOfArbitrary_1.oneof.apply(void 0, __spread(commandArbs)).map(function (c) { return new CommandWrapper_1.CommandWrapper(c); });
    return new ArrayArbitrary_1.ArrayArbitrary(internalCommandArb, 0, maxCommands != null ? maxCommands : 10, function (cs) { return cs.map(function (c) { return new Shrinkable_1.Shrinkable(c.value.clone(), c.shrink); }); }, function (cs) { return cs.filter(function (c) { return c.value.hasRan; }); });
};

});

unwrapExports(CommandsArbitrary);
var CommandsArbitrary_1 = CommandsArbitrary.commands;

var ModelRunner = createCommonjsModule(function (module, exports) {
exports.__esModule = true;
/** @hidden */
var genericModelRun = function (s, cmds, initialValue, then) {
    var _a = s(), model = _a.model, real = _a.real;
    return cmds.reduce(function (r, c) {
        return then(r, function () {
            if (c.check(model))
                return c.run(model, real);
        });
    }, initialValue);
};
/**
 * Run synchronous commands over a `Model` and the `Real` system
 *
 * Throw in case of inconsistency
 *
 * @param s Initial state provider
 * @param cmds Synchronous commands to be executed
 */
exports.modelRun = function (s, cmds) {
    var then = function (p, c) { return c(); };
    genericModelRun(s, cmds, undefined, then);
};
/**
 * Run asynchronous commands over a `Model` and the `Real` system
 *
 * Throw in case of inconsistency
 *
 * @param s Initial state provider
 * @param cmds Asynchronous commands to be executed
 */
exports.asyncModelRun = function (s, cmds) {
    var then = function (p, c) { return p.then(c); };
    return genericModelRun(s, cmds, Promise.resolve(), then);
};

});

unwrapExports(ModelRunner);
var ModelRunner_1 = ModelRunner.modelRun;
var ModelRunner_2 = ModelRunner.asyncModelRun;

var fastCheckDefault = createCommonjsModule(function (module, exports) {
exports.__esModule = true;

exports.pre = Pre.pre;

exports.asyncProperty = AsyncProperty.asyncProperty;

exports.property = Property.property;

exports.assert = Runner.assert;
exports.check = Runner.check;

exports.sample = Sampler.sample;
exports.statistics = Sampler.statistics;

exports.array = ArrayArbitrary_1.array;

exports.boolean = BooleanArbitrary.boolean;

exports.ascii = CharacterArbitrary_1.ascii;
exports.base64 = CharacterArbitrary_1.base64;
exports.char = CharacterArbitrary_1.char;
exports.char16bits = CharacterArbitrary_1.char16bits;
exports.fullUnicode = CharacterArbitrary_1.fullUnicode;
exports.hexa = CharacterArbitrary_1.hexa;
exports.unicode = CharacterArbitrary_1.unicode;

exports.constant = ConstantArbitrary_1.constant;
exports.constantFrom = ConstantArbitrary_1.constantFrom;

exports.Arbitrary = Arbitrary_1.Arbitrary;

exports.Shrinkable = Shrinkable_1.Shrinkable;

exports.dictionary = DictionaryArbitrary.dictionary;

exports.double = FloatingPointArbitrary.double;
exports.float = FloatingPointArbitrary.float;

exports.frequency = FrequencyArbitrary_1.frequency;

exports.integer = IntegerArbitrary_1.integer;
exports.nat = IntegerArbitrary_1.nat;

exports.lorem = LoremArbitrary_1.lorem;

exports.anything = ObjectArbitrary.anything;
exports.json = ObjectArbitrary.json;
exports.jsonObject = ObjectArbitrary.jsonObject;
exports.object = ObjectArbitrary.object;
exports.ObjectConstraints = ObjectArbitrary.ObjectConstraints;
exports.unicodeJson = ObjectArbitrary.unicodeJson;
exports.unicodeJsonObject = ObjectArbitrary.unicodeJsonObject;

exports.oneof = OneOfArbitrary_1.oneof;

exports.option = OptionArbitrary_1.option;

exports.record = RecordArbitrary.record;

exports.set = SetArbitrary.set;

exports.asciiString = StringArbitrary_1.asciiString;
exports.base64String = StringArbitrary_1.base64String;
exports.fullUnicodeString = StringArbitrary_1.fullUnicodeString;
exports.hexaString = StringArbitrary_1.hexaString;
exports.string = StringArbitrary_1.string;
exports.string16bits = StringArbitrary_1.string16bits;
exports.stringOf = StringArbitrary_1.stringOf;
exports.unicodeString = StringArbitrary_1.unicodeString;

exports.genericTuple = TupleArbitrary.genericTuple;
exports.tuple = TupleArbitrary.tuple;

exports.commands = CommandsArbitrary.commands;

exports.asyncModelRun = ModelRunner.asyncModelRun;
exports.modelRun = ModelRunner.modelRun;

exports.Random = Random_1.Random;

exports.Stream = Stream_1.Stream;
exports.stream = Stream_1.stream;

});

unwrapExports(fastCheckDefault);
var fastCheckDefault_1 = fastCheckDefault.pre;
var fastCheckDefault_2 = fastCheckDefault.asyncProperty;
var fastCheckDefault_3 = fastCheckDefault.property;
var fastCheckDefault_4 = fastCheckDefault.assert;
var fastCheckDefault_5 = fastCheckDefault.check;
var fastCheckDefault_6 = fastCheckDefault.sample;
var fastCheckDefault_7 = fastCheckDefault.statistics;
var fastCheckDefault_8 = fastCheckDefault.array;
var fastCheckDefault_9 = fastCheckDefault.ascii;
var fastCheckDefault_10 = fastCheckDefault.base64;
var fastCheckDefault_11 = fastCheckDefault.char16bits;
var fastCheckDefault_12 = fastCheckDefault.fullUnicode;
var fastCheckDefault_13 = fastCheckDefault.hexa;
var fastCheckDefault_14 = fastCheckDefault.unicode;
var fastCheckDefault_15 = fastCheckDefault.constant;
var fastCheckDefault_16 = fastCheckDefault.constantFrom;
var fastCheckDefault_17 = fastCheckDefault.Arbitrary;
var fastCheckDefault_18 = fastCheckDefault.Shrinkable;
var fastCheckDefault_19 = fastCheckDefault.dictionary;
var fastCheckDefault_20 = fastCheckDefault.frequency;
var fastCheckDefault_21 = fastCheckDefault.integer;
var fastCheckDefault_22 = fastCheckDefault.nat;
var fastCheckDefault_23 = fastCheckDefault.lorem;
var fastCheckDefault_24 = fastCheckDefault.anything;
var fastCheckDefault_25 = fastCheckDefault.json;
var fastCheckDefault_26 = fastCheckDefault.jsonObject;
var fastCheckDefault_27 = fastCheckDefault.object;
var fastCheckDefault_28 = fastCheckDefault.ObjectConstraints;
var fastCheckDefault_29 = fastCheckDefault.unicodeJson;
var fastCheckDefault_30 = fastCheckDefault.unicodeJsonObject;
var fastCheckDefault_31 = fastCheckDefault.oneof;
var fastCheckDefault_32 = fastCheckDefault.option;
var fastCheckDefault_33 = fastCheckDefault.record;
var fastCheckDefault_34 = fastCheckDefault.set;
var fastCheckDefault_35 = fastCheckDefault.asciiString;
var fastCheckDefault_36 = fastCheckDefault.base64String;
var fastCheckDefault_37 = fastCheckDefault.fullUnicodeString;
var fastCheckDefault_38 = fastCheckDefault.hexaString;
var fastCheckDefault_39 = fastCheckDefault.string;
var fastCheckDefault_40 = fastCheckDefault.string16bits;
var fastCheckDefault_41 = fastCheckDefault.stringOf;
var fastCheckDefault_42 = fastCheckDefault.unicodeString;
var fastCheckDefault_43 = fastCheckDefault.genericTuple;
var fastCheckDefault_44 = fastCheckDefault.tuple;
var fastCheckDefault_45 = fastCheckDefault.commands;
var fastCheckDefault_46 = fastCheckDefault.asyncModelRun;
var fastCheckDefault_47 = fastCheckDefault.modelRun;
var fastCheckDefault_48 = fastCheckDefault.Random;
var fastCheckDefault_49 = fastCheckDefault.Stream;
var fastCheckDefault_50 = fastCheckDefault.stream;

var fastCheck = createCommonjsModule(function (module, exports) {
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
exports.__esModule = true;

exports["default"] = fastCheckDefault;
__export(fastCheckDefault);

});

unwrapExports(fastCheck);

console.log(fastCheck.sample(fastCheck.lorem(), {seed: 42, numRuns: 5}));

var main = {

};

module.exports = main;
