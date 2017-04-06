(function (angular) {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Config
  angular.module('hariRtc.config', [])
      .value('hariRtc.config', {
          debug: true
      });

  // Modules
  angular.module('hariRtc.directives', []);
  angular.module('hariRtc.services', []);
  angular.module('hariRtc',
      [
          'btford.socket-io',
          'app.config',
          'hariRtc.config',
          'hariRtc.directives',
          'hariRtc.services'
      ]);

})(angular);

angular.module('hariRtc').run(["signaling", "hariModal", function (signaling, hariModal) {
  signaling.on('messageReceived', function (name, message) {
    switch (message.type) {
      case 'call': //called by other party
        var params = {parameters: {isCalling : true, contactName: name}};
        hariModal({templateUrl: 'views/call.html', 
                        controller: 'CallCtrl', 
                        parameters : params
                    }).activate();
        break;
    }
  });
}])
// Platform: browser
// 6950f96eba7c2c0181bc76d98443446068e0ea1e
/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 
     http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
*/
;(function() {
var PLATFORM_VERSION_BUILD_LABEL = '4.0.0';
// file: src/scripts/require.js

/*jshint -W079 */
/*jshint -W020 */

var require,
    define;

(function () {
    var modules = {},
    // Stack of moduleIds currently being built.
        requireStack = [],
    // Map of module ID -> index into requireStack of modules currently being built.
        inProgressModules = {},
        SEPARATOR = ".";



    function build(module) {
        var factory = module.factory,
            localRequire = function (id) {
                var resultantId = id;
                //Its a relative path, so lop off the last portion and add the id (minus "./")
                if (id.charAt(0) === ".") {
                    resultantId = module.id.slice(0, module.id.lastIndexOf(SEPARATOR)) + SEPARATOR + id.slice(2);
                }
                return require(resultantId);
            };
        module.exports = {};
        delete module.factory;
        factory(localRequire, module.exports, module);
        return module.exports;
    }

    require = function (id) {
        if (!modules[id]) {
            throw "module " + id + " not found";
        } else if (id in inProgressModules) {
            var cycle = requireStack.slice(inProgressModules[id]).join('->') + '->' + id;
            throw "Cycle in require graph: " + cycle;
        }
        if (modules[id].factory) {
            try {
                inProgressModules[id] = requireStack.length;
                requireStack.push(id);
                return build(modules[id]);
            } finally {
                delete inProgressModules[id];
                requireStack.pop();
            }
        }
        return modules[id].exports;
    };

    define = function (id, factory) {
        if (modules[id]) {
            throw "module " + id + " already defined";
        }

        modules[id] = {
            id: id,
            factory: factory
        };
    };

    define.remove = function (id) {
        delete modules[id];
    };

    define.moduleMap = modules;
})();

//Export for use in node
if (typeof module === "object" && typeof require === "function") {
    module.exports.require = require;
    module.exports.define = define;
}

// file: src/cordova.js
define("cordova", function(require, exports, module) {

if(window.cordova){
    throw new Error("cordova already defined");
}


var channel = require('cordova/channel');
var platform = require('cordova/platform');


/**
 * Intercept calls to addEventListener + removeEventListener and handle deviceready,
 * resume, and pause events.
 */
var m_document_addEventListener = document.addEventListener;
var m_document_removeEventListener = document.removeEventListener;
var m_window_addEventListener = window.addEventListener;
var m_window_removeEventListener = window.removeEventListener;

/**
 * Houses custom event handlers to intercept on document + window event listeners.
 */
var documentEventHandlers = {},
    windowEventHandlers = {};

document.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof documentEventHandlers[e] != 'undefined') {
        documentEventHandlers[e].subscribe(handler);
    } else {
        m_document_addEventListener.call(document, evt, handler, capture);
    }
};

window.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof windowEventHandlers[e] != 'undefined') {
        windowEventHandlers[e].subscribe(handler);
    } else {
        m_window_addEventListener.call(window, evt, handler, capture);
    }
};

document.removeEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof documentEventHandlers[e] != "undefined") {
        documentEventHandlers[e].unsubscribe(handler);
    } else {
        m_document_removeEventListener.call(document, evt, handler, capture);
    }
};

window.removeEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof windowEventHandlers[e] != "undefined") {
        windowEventHandlers[e].unsubscribe(handler);
    } else {
        m_window_removeEventListener.call(window, evt, handler, capture);
    }
};

function createEvent(type, data) {
    var event = document.createEvent('Events');
    event.initEvent(type, false, false);
    if (data) {
        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                event[i] = data[i];
            }
        }
    }
    return event;
}


var cordova = {
    define:define,
    require:require,
    version:PLATFORM_VERSION_BUILD_LABEL,
    platformVersion:PLATFORM_VERSION_BUILD_LABEL,
    platformId:platform.id,
    /**
     * Methods to add/remove your own addEventListener hijacking on document + window.
     */
    addWindowEventHandler:function(event) {
        return (windowEventHandlers[event] = channel.create(event));
    },
    addStickyDocumentEventHandler:function(event) {
        return (documentEventHandlers[event] = channel.createSticky(event));
    },
    addDocumentEventHandler:function(event) {
        return (documentEventHandlers[event] = channel.create(event));
    },
    removeWindowEventHandler:function(event) {
        delete windowEventHandlers[event];
    },
    removeDocumentEventHandler:function(event) {
        delete documentEventHandlers[event];
    },
    /**
     * Retrieve original event handlers that were replaced by Cordova
     *
     * @return object
     */
    getOriginalHandlers: function() {
        return {'document': {'addEventListener': m_document_addEventListener, 'removeEventListener': m_document_removeEventListener},
        'window': {'addEventListener': m_window_addEventListener, 'removeEventListener': m_window_removeEventListener}};
    },
    /**
     * Method to fire event from native code
     * bNoDetach is required for events which cause an exception which needs to be caught in native code
     */
    fireDocumentEvent: function(type, data, bNoDetach) {
        var evt = createEvent(type, data);
        if (typeof documentEventHandlers[type] != 'undefined') {
            if( bNoDetach ) {
                documentEventHandlers[type].fire(evt);
            }
            else {
                setTimeout(function() {
                    // Fire deviceready on listeners that were registered before cordova.js was loaded.
                    if (type == 'deviceready') {
                        document.dispatchEvent(evt);
                    }
                    documentEventHandlers[type].fire(evt);
                }, 0);
            }
        } else {
            document.dispatchEvent(evt);
        }
    },
    fireWindowEvent: function(type, data) {
        var evt = createEvent(type,data);
        if (typeof windowEventHandlers[type] != 'undefined') {
            setTimeout(function() {
                windowEventHandlers[type].fire(evt);
            }, 0);
        } else {
            window.dispatchEvent(evt);
        }
    },

    /**
     * Plugin callback mechanism.
     */
    // Randomize the starting callbackId to avoid collisions after refreshing or navigating.
    // This way, it's very unlikely that any new callback would get the same callbackId as an old callback.
    callbackId: Math.floor(Math.random() * 2000000000),
    callbacks:  {},
    callbackStatus: {
        NO_RESULT: 0,
        OK: 1,
        CLASS_NOT_FOUND_EXCEPTION: 2,
        ILLEGAL_ACCESS_EXCEPTION: 3,
        INSTANTIATION_EXCEPTION: 4,
        MALFORMED_URL_EXCEPTION: 5,
        IO_EXCEPTION: 6,
        INVALID_ACTION: 7,
        JSON_EXCEPTION: 8,
        ERROR: 9
    },

    /**
     * Called by native code when returning successful result from an action.
     */
    callbackSuccess: function(callbackId, args) {
        cordova.callbackFromNative(callbackId, true, args.status, [args.message], args.keepCallback);
    },

    /**
     * Called by native code when returning error result from an action.
     */
    callbackError: function(callbackId, args) {
        // TODO: Deprecate callbackSuccess and callbackError in favour of callbackFromNative.
        // Derive success from status.
        cordova.callbackFromNative(callbackId, false, args.status, [args.message], args.keepCallback);
    },

    /**
     * Called by native code when returning the result from an action.
     */
    callbackFromNative: function(callbackId, isSuccess, status, args, keepCallback) {
        try {
            var callback = cordova.callbacks[callbackId];
            if (callback) {
                if (isSuccess && status == cordova.callbackStatus.OK) {
                    callback.success && callback.success.apply(null, args);
                } else if (!isSuccess) {
                    callback.fail && callback.fail.apply(null, args);
                }
                /*
                else
                    Note, this case is intentionally not caught.
                    this can happen if isSuccess is true, but callbackStatus is NO_RESULT
                    which is used to remove a callback from the list without calling the callbacks
                    typically keepCallback is false in this case
                */
                // Clear callback if not expecting any more results
                if (!keepCallback) {
                    delete cordova.callbacks[callbackId];
                }
            }
        }
        catch (err) {
            var msg = "Error in " + (isSuccess ? "Success" : "Error") + " callbackId: " + callbackId + " : " + err;
            console && console.log && console.log(msg);
            cordova.fireWindowEvent("cordovacallbackerror", { 'message': msg });
            throw err;
        }
    },
    addConstructor: function(func) {
        channel.onCordovaReady.subscribe(function() {
            try {
                func();
            } catch(e) {
                console.log("Failed to run constructor: " + e);
            }
        });
    }
};


module.exports = cordova;

});

// file: src/common/argscheck.js
define("cordova/argscheck", function(require, exports, module) {

var utils = require('cordova/utils');

var moduleExports = module.exports;

var typeMap = {
    'A': 'Array',
    'D': 'Date',
    'N': 'Number',
    'S': 'String',
    'F': 'Function',
    'O': 'Object'
};

function extractParamName(callee, argIndex) {
    return (/.*?\((.*?)\)/).exec(callee)[1].split(', ')[argIndex];
}

function checkArgs(spec, functionName, args, opt_callee) {
    if (!moduleExports.enableChecks) {
        return;
    }
    var errMsg = null;
    var typeName;
    for (var i = 0; i < spec.length; ++i) {
        var c = spec.charAt(i),
            cUpper = c.toUpperCase(),
            arg = args[i];
        // Asterix means allow anything.
        if (c == '*') {
            continue;
        }
        typeName = utils.typeName(arg);
        if ((arg === null || arg === undefined) && c == cUpper) {
            continue;
        }
        if (typeName != typeMap[cUpper]) {
            errMsg = 'Expected ' + typeMap[cUpper];
            break;
        }
    }
    if (errMsg) {
        errMsg += ', but got ' + typeName + '.';
        errMsg = 'Wrong type for parameter "' + extractParamName(opt_callee || args.callee, i) + '" of ' + functionName + ': ' + errMsg;
        // Don't log when running unit tests.
        if (typeof jasmine == 'undefined') {
            console.error(errMsg);
        }
        throw TypeError(errMsg);
    }
}

function getValue(value, defaultValue) {
    return value === undefined ? defaultValue : value;
}

moduleExports.checkArgs = checkArgs;
moduleExports.getValue = getValue;
moduleExports.enableChecks = true;


});

// file: src/common/base64.js
define("cordova/base64", function(require, exports, module) {

var base64 = exports;

base64.fromArrayBuffer = function(arrayBuffer) {
    var array = new Uint8Array(arrayBuffer);
    return uint8ToBase64(array);
};

base64.toArrayBuffer = function(str) {
    var decodedStr = typeof atob != 'undefined' ? atob(str) : new Buffer(str,'base64').toString('binary');
    var arrayBuffer = new ArrayBuffer(decodedStr.length);
    var array = new Uint8Array(arrayBuffer);
    for (var i=0, len=decodedStr.length; i < len; i++) {
        array[i] = decodedStr.charCodeAt(i);
    }
    return arrayBuffer;
};

//------------------------------------------------------------------------------

/* This code is based on the performance tests at http://jsperf.com/b64tests
 * This 12-bit-at-a-time algorithm was the best performing version on all
 * platforms tested.
 */

var b64_6bit = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var b64_12bit;

var b64_12bitTable = function() {
    b64_12bit = [];
    for (var i=0; i<64; i++) {
        for (var j=0; j<64; j++) {
            b64_12bit[i*64+j] = b64_6bit[i] + b64_6bit[j];
        }
    }
    b64_12bitTable = function() { return b64_12bit; };
    return b64_12bit;
};

function uint8ToBase64(rawData) {
    var numBytes = rawData.byteLength;
    var output="";
    var segment;
    var table = b64_12bitTable();
    for (var i=0;i<numBytes-2;i+=3) {
        segment = (rawData[i] << 16) + (rawData[i+1] << 8) + rawData[i+2];
        output += table[segment >> 12];
        output += table[segment & 0xfff];
    }
    if (numBytes - i == 2) {
        segment = (rawData[i] << 16) + (rawData[i+1] << 8);
        output += table[segment >> 12];
        output += b64_6bit[(segment & 0xfff) >> 6];
        output += '=';
    } else if (numBytes - i == 1) {
        segment = (rawData[i] << 16);
        output += table[segment >> 12];
        output += '==';
    }
    return output;
}

});

// file: src/common/builder.js
define("cordova/builder", function(require, exports, module) {

var utils = require('cordova/utils');

function each(objects, func, context) {
    for (var prop in objects) {
        if (objects.hasOwnProperty(prop)) {
            func.apply(context, [objects[prop], prop]);
        }
    }
}

function clobber(obj, key, value) {
    exports.replaceHookForTesting(obj, key);
    var needsProperty = false;
    try {
        obj[key] = value;
    } catch (e) {
        needsProperty = true;
    }
    // Getters can only be overridden by getters.
    if (needsProperty || obj[key] !== value) {
        utils.defineGetter(obj, key, function() {
            return value;
        });
    }
}

function assignOrWrapInDeprecateGetter(obj, key, value, message) {
    if (message) {
        utils.defineGetter(obj, key, function() {
            console.log(message);
            delete obj[key];
            clobber(obj, key, value);
            return value;
        });
    } else {
        clobber(obj, key, value);
    }
}

function include(parent, objects, clobber, merge) {
    each(objects, function (obj, key) {
        try {
            var result = obj.path ? require(obj.path) : {};

            if (clobber) {
                // Clobber if it doesn't exist.
                if (typeof parent[key] === 'undefined') {
                    assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                } else if (typeof obj.path !== 'undefined') {
                    // If merging, merge properties onto parent, otherwise, clobber.
                    if (merge) {
                        recursiveMerge(parent[key], result);
                    } else {
                        assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                    }
                }
                result = parent[key];
            } else {
                // Overwrite if not currently defined.
                if (typeof parent[key] == 'undefined') {
                    assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                } else {
                    // Set result to what already exists, so we can build children into it if they exist.
                    result = parent[key];
                }
            }

            if (obj.children) {
                include(result, obj.children, clobber, merge);
            }
        } catch(e) {
            utils.alert('Exception building Cordova JS globals: ' + e + ' for key "' + key + '"');
        }
    });
}

/**
 * Merge properties from one object onto another recursively.  Properties from
 * the src object will overwrite existing target property.
 *
 * @param target Object to merge properties into.
 * @param src Object to merge properties from.
 */
function recursiveMerge(target, src) {
    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            if (target.prototype && target.prototype.constructor === target) {
                // If the target object is a constructor override off prototype.
                clobber(target.prototype, prop, src[prop]);
            } else {
                if (typeof src[prop] === 'object' && typeof target[prop] === 'object') {
                    recursiveMerge(target[prop], src[prop]);
                } else {
                    clobber(target, prop, src[prop]);
                }
            }
        }
    }
}

exports.buildIntoButDoNotClobber = function(objects, target) {
    include(target, objects, false, false);
};
exports.buildIntoAndClobber = function(objects, target) {
    include(target, objects, true, false);
};
exports.buildIntoAndMerge = function(objects, target) {
    include(target, objects, true, true);
};
exports.recursiveMerge = recursiveMerge;
exports.assignOrWrapInDeprecateGetter = assignOrWrapInDeprecateGetter;
exports.replaceHookForTesting = function() {};

});

// file: src/common/channel.js
define("cordova/channel", function(require, exports, module) {

var utils = require('cordova/utils'),
    nextGuid = 1;

/**
 * Custom pub-sub "channel" that can have functions subscribed to it
 * This object is used to define and control firing of events for
 * cordova initialization, as well as for custom events thereafter.
 *
 * The order of events during page load and Cordova startup is as follows:
 *
 * onDOMContentLoaded*         Internal event that is received when the web page is loaded and parsed.
 * onNativeReady*              Internal event that indicates the Cordova native side is ready.
 * onCordovaReady*             Internal event fired when all Cordova JavaScript objects have been created.
 * onDeviceReady*              User event fired to indicate that Cordova is ready
 * onResume                    User event fired to indicate a start/resume lifecycle event
 * onPause                     User event fired to indicate a pause lifecycle event
 *
 * The events marked with an * are sticky. Once they have fired, they will stay in the fired state.
 * All listeners that subscribe after the event is fired will be executed right away.
 *
 * The only Cordova events that user code should register for are:
 *      deviceready           Cordova native code is initialized and Cordova APIs can be called from JavaScript
 *      pause                 App has moved to background
 *      resume                App has returned to foreground
 *
 * Listeners can be registered as:
 *      document.addEventListener("deviceready", myDeviceReadyListener, false);
 *      document.addEventListener("resume", myResumeListener, false);
 *      document.addEventListener("pause", myPauseListener, false);
 *
 * The DOM lifecycle events should be used for saving and restoring state
 *      window.onload
 *      window.onunload
 *
 */

/**
 * Channel
 * @constructor
 * @param type  String the channel name
 */
var Channel = function(type, sticky) {
    this.type = type;
    // Map of guid -> function.
    this.handlers = {};
    // 0 = Non-sticky, 1 = Sticky non-fired, 2 = Sticky fired.
    this.state = sticky ? 1 : 0;
    // Used in sticky mode to remember args passed to fire().
    this.fireArgs = null;
    // Used by onHasSubscribersChange to know if there are any listeners.
    this.numHandlers = 0;
    // Function that is called when the first listener is subscribed, or when
    // the last listener is unsubscribed.
    this.onHasSubscribersChange = null;
},
    channel = {
        /**
         * Calls the provided function only after all of the channels specified
         * have been fired. All channels must be sticky channels.
         */
        join: function(h, c) {
            var len = c.length,
                i = len,
                f = function() {
                    if (!(--i)) h();
                };
            for (var j=0; j<len; j++) {
                if (c[j].state === 0) {
                    throw Error('Can only use join with sticky channels.');
                }
                c[j].subscribe(f);
            }
            if (!len) h();
        },
        create: function(type) {
            return channel[type] = new Channel(type, false);
        },
        createSticky: function(type) {
            return channel[type] = new Channel(type, true);
        },

        /**
         * cordova Channels that must fire before "deviceready" is fired.
         */
        deviceReadyChannelsArray: [],
        deviceReadyChannelsMap: {},

        /**
         * Indicate that a feature needs to be initialized before it is ready to be used.
         * This holds up Cordova's "deviceready" event until the feature has been initialized
         * and Cordova.initComplete(feature) is called.
         *
         * @param feature {String}     The unique feature name
         */
        waitForInitialization: function(feature) {
            if (feature) {
                var c = channel[feature] || this.createSticky(feature);
                this.deviceReadyChannelsMap[feature] = c;
                this.deviceReadyChannelsArray.push(c);
            }
        },

        /**
         * Indicate that initialization code has completed and the feature is ready to be used.
         *
         * @param feature {String}     The unique feature name
         */
        initializationComplete: function(feature) {
            var c = this.deviceReadyChannelsMap[feature];
            if (c) {
                c.fire();
            }
        }
    };

function forceFunction(f) {
    if (typeof f != 'function') throw "Function required as first argument!";
}

/**
 * Subscribes the given function to the channel. Any time that
 * Channel.fire is called so too will the function.
 * Optionally specify an execution context for the function
 * and a guid that can be used to stop subscribing to the channel.
 * Returns the guid.
 */
Channel.prototype.subscribe = function(f, c) {
    // need a function to call
    forceFunction(f);
    if (this.state == 2) {
        f.apply(c || this, this.fireArgs);
        return;
    }

    var func = f,
        guid = f.observer_guid;
    if (typeof c == "object") { func = utils.close(c, f); }

    if (!guid) {
        // first time any channel has seen this subscriber
        guid = '' + nextGuid++;
    }
    func.observer_guid = guid;
    f.observer_guid = guid;

    // Don't add the same handler more than once.
    if (!this.handlers[guid]) {
        this.handlers[guid] = func;
        this.numHandlers++;
        if (this.numHandlers == 1) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Unsubscribes the function with the given guid from the channel.
 */
Channel.prototype.unsubscribe = function(f) {
    // need a function to unsubscribe
    forceFunction(f);

    var guid = f.observer_guid,
        handler = this.handlers[guid];
    if (handler) {
        delete this.handlers[guid];
        this.numHandlers--;
        if (this.numHandlers === 0) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Calls all functions subscribed to this channel.
 */
Channel.prototype.fire = function(e) {
    var fail = false,
        fireArgs = Array.prototype.slice.call(arguments);
    // Apply stickiness.
    if (this.state == 1) {
        this.state = 2;
        this.fireArgs = fireArgs;
    }
    if (this.numHandlers) {
        // Copy the values first so that it is safe to modify it from within
        // callbacks.
        var toCall = [];
        for (var item in this.handlers) {
            toCall.push(this.handlers[item]);
        }
        for (var i = 0; i < toCall.length; ++i) {
            toCall[i].apply(this, fireArgs);
        }
        if (this.state == 2 && this.numHandlers) {
            this.numHandlers = 0;
            this.handlers = {};
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};


// defining them here so they are ready super fast!
// DOM event that is received when the web page is loaded and parsed.
channel.createSticky('onDOMContentLoaded');

// Event to indicate the Cordova native side is ready.
channel.createSticky('onNativeReady');

// Event to indicate that all Cordova JavaScript objects have been created
// and it's time to run plugin constructors.
channel.createSticky('onCordovaReady');

// Event to indicate that all automatically loaded JS plugins are loaded and ready.
// FIXME remove this
channel.createSticky('onPluginsReady');

// Event to indicate that Cordova is ready
channel.createSticky('onDeviceReady');

// Event to indicate a resume lifecycle event
channel.create('onResume');

// Event to indicate a pause lifecycle event
channel.create('onPause');

// Channels that must fire before "deviceready" is fired.
channel.waitForInitialization('onCordovaReady');
channel.waitForInitialization('onDOMContentLoaded');

module.exports = channel;

});

// file: /Users/steveng/repo/cordova/cordova-browser/cordova-js-src/confighelper.js
define("cordova/confighelper", function(require, exports, module) {

var config;

function Config(xhr) {
    function loadPreferences(xhr) {
       var parser = new DOMParser();
       var doc = parser.parseFromString(xhr.responseText, "application/xml");

       var preferences = doc.getElementsByTagName("preference");
       return Array.prototype.slice.call(preferences);
    }

    this.xhr = xhr;
    this.preferences = loadPreferences(this.xhr);
}

function readConfig(success, error) {
    var xhr;

    if(typeof config != 'undefined') {
        success(config);
    }

    function fail(msg) {
        console.error(msg);

        if(error) {
            error(msg);
        }
    }

    var xhrStatusChangeHandler = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200 || xhr.status == 304 || xhr.status === 0 /* file:// */) {
                config = new Config(xhr);
                success(config);
            }
            else {
                fail('[Browser][cordova.js][xhrStatusChangeHandler] Could not XHR config.xml: ' + xhr.statusText);
            }
        }
    };

    if ("ActiveXObject" in window) {
        // Needed for XHR-ing via file:// protocol in IE
        xhr = new window.ActiveXObject("MSXML2.XMLHTTP");
        xhr.onreadystatechange = xhrStatusChangeHandler;
    } else {
        xhr = new XMLHttpRequest();
        xhr.addEventListener("load", xhrStatusChangeHandler);
    }

    try {
        xhr.open("get", "config.xml", true);
        xhr.send();
    } catch(e) {
        fail('[Browser][cordova.js][readConfig] Could not XHR config.xml: ' + JSON.stringify(e));
    }
}

/**
 * Reads a preference value from config.xml.
 * Returns preference value or undefined if it does not exist.
 * @param {String} preferenceName Preference name to read */
Config.prototype.getPreferenceValue = function getPreferenceValue(preferenceName) {
    var preferenceItem = this.preferences && this.preferences.filter(function(item) {
        return item.attributes.name && item.attributes.name.value === preferenceName;
    });

    if(preferenceItem && preferenceItem[0] && preferenceItem[0].attributes && preferenceItem[0].attributes.value) {
        return preferenceItem[0].attributes.value.value;
    }
};

exports.readConfig = readConfig;

});

// file: /Users/steveng/repo/cordova/cordova-browser/cordova-js-src/exec.js
define("cordova/exec", function(require, exports, module) {

var cordova = require('cordova');
var execProxy = require('cordova/exec/proxy');

module.exports = function(success, fail, service, action, args) {

    var proxy = execProxy.get(service, action);

    if (proxy) {
        var callbackId = service + cordova.callbackId++;

        if (typeof success == "function" || typeof fail == "function") {
            cordova.callbacks[callbackId] = {success:success, fail:fail};
        }

        try {
            proxy(success, fail, args);
        }
        catch(e) {
            // TODO throw maybe?
            var msg = "Exception calling :: " + service + " :: " + action  + " ::exception=" + e;
            console.log(msg);
        }
    }
    else {
        fail && fail("Missing Command Error");
    }
};

});

// file: src/common/exec/proxy.js
define("cordova/exec/proxy", function(require, exports, module) {


// internal map of proxy function
var CommandProxyMap = {};

module.exports = {

    // example: cordova.commandProxy.add("Accelerometer",{getCurrentAcceleration: function(successCallback, errorCallback, options) {...},...);
    add:function(id,proxyObj) {
        console.log("adding proxy for " + id);
        CommandProxyMap[id] = proxyObj;
        return proxyObj;
    },

    // cordova.commandProxy.remove("Accelerometer");
    remove:function(id) {
        var proxy = CommandProxyMap[id];
        delete CommandProxyMap[id];
        CommandProxyMap[id] = null;
        return proxy;
    },

    get:function(service,action) {
        return ( CommandProxyMap[service] ? CommandProxyMap[service][action] : null );
    }
};
});

// file: src/common/init.js
define("cordova/init", function(require, exports, module) {

var channel = require('cordova/channel');
var cordova = require('cordova');
var modulemapper = require('cordova/modulemapper');
var platform = require('cordova/platform');
var pluginloader = require('cordova/pluginloader');
var utils = require('cordova/utils');

var platformInitChannelsArray = [channel.onNativeReady, channel.onPluginsReady];

function logUnfiredChannels(arr) {
    for (var i = 0; i < arr.length; ++i) {
        if (arr[i].state != 2) {
            console.log('Channel not fired: ' + arr[i].type);
        }
    }
}

window.setTimeout(function() {
    if (channel.onDeviceReady.state != 2) {
        console.log('deviceready has not fired after 5 seconds.');
        logUnfiredChannels(platformInitChannelsArray);
        logUnfiredChannels(channel.deviceReadyChannelsArray);
    }
}, 5000);

// Replace navigator before any modules are required(), to ensure it happens as soon as possible.
// We replace it so that properties that can't be clobbered can instead be overridden.
function replaceNavigator(origNavigator) {
    var CordovaNavigator = function() {};
    CordovaNavigator.prototype = origNavigator;
    var newNavigator = new CordovaNavigator();
    // This work-around really only applies to new APIs that are newer than Function.bind.
    // Without it, APIs such as getGamepads() break.
    if (CordovaNavigator.bind) {
        for (var key in origNavigator) {
            if (typeof origNavigator[key] == 'function') {
                newNavigator[key] = origNavigator[key].bind(origNavigator);
            }
            else {
                (function(k) {
                    utils.defineGetterSetter(newNavigator,key,function() {
                        return origNavigator[k];
                    });
                })(key);
            }
        }
    }
    return newNavigator;
}

if (window.navigator) {
    window.navigator = replaceNavigator(window.navigator);
}

if (!window.console) {
    window.console = {
        log: function(){}
    };
}
if (!window.console.warn) {
    window.console.warn = function(msg) {
        this.log("warn: " + msg);
    };
}

// Register pause, resume and deviceready channels as events on document.
channel.onPause = cordova.addDocumentEventHandler('pause');
channel.onResume = cordova.addDocumentEventHandler('resume');
channel.onActivated = cordova.addDocumentEventHandler('activated');
channel.onDeviceReady = cordova.addStickyDocumentEventHandler('deviceready');

// Listen for DOMContentLoaded and notify our channel subscribers.
if (document.readyState == 'complete' || document.readyState == 'interactive') {
    channel.onDOMContentLoaded.fire();
} else {
    document.addEventListener('DOMContentLoaded', function() {
        channel.onDOMContentLoaded.fire();
    }, false);
}

// _nativeReady is global variable that the native side can set
// to signify that the native code is ready. It is a global since
// it may be called before any cordova JS is ready.
if (window._nativeReady) {
    channel.onNativeReady.fire();
}

modulemapper.clobbers('cordova', 'cordova');
modulemapper.clobbers('cordova/exec', 'cordova.exec');
modulemapper.clobbers('cordova/exec', 'Cordova.exec');

// Call the platform-specific initialization.
platform.bootstrap && platform.bootstrap();

// Wrap in a setTimeout to support the use-case of having plugin JS appended to cordova.js.
// The delay allows the attached modules to be defined before the plugin loader looks for them.
setTimeout(function() {
    pluginloader.load(function() {
        channel.onPluginsReady.fire();
    });
}, 0);

/**
 * Create all cordova objects once native side is ready.
 */
channel.join(function() {
    modulemapper.mapModules(window);

    platform.initialize && platform.initialize();

    // Fire event to notify that all objects are created
    channel.onCordovaReady.fire();

    // Fire onDeviceReady event once page has fully loaded, all
    // constructors have run and cordova info has been received from native
    // side.
    channel.join(function() {
        require('cordova').fireDocumentEvent('deviceready');
    }, channel.deviceReadyChannelsArray);

}, platformInitChannelsArray);


});

// file: src/common/init_b.js
define("cordova/init_b", function(require, exports, module) {

var channel = require('cordova/channel');
var cordova = require('cordova');
var modulemapper = require('cordova/modulemapper');
var platform = require('cordova/platform');
var utils = require('cordova/utils');

var platformInitChannelsArray = [channel.onDOMContentLoaded, channel.onNativeReady];

// setting exec
cordova.exec = require('cordova/exec');

function logUnfiredChannels(arr) {
    for (var i = 0; i < arr.length; ++i) {
        if (arr[i].state != 2) {
            console.log('Channel not fired: ' + arr[i].type);
        }
    }
}

window.setTimeout(function() {
    if (channel.onDeviceReady.state != 2) {
        console.log('deviceready has not fired after 5 seconds.');
        logUnfiredChannels(platformInitChannelsArray);
        logUnfiredChannels(channel.deviceReadyChannelsArray);
    }
}, 5000);

// Replace navigator before any modules are required(), to ensure it happens as soon as possible.
// We replace it so that properties that can't be clobbered can instead be overridden.
function replaceNavigator(origNavigator) {
    var CordovaNavigator = function() {};
    CordovaNavigator.prototype = origNavigator;
    var newNavigator = new CordovaNavigator();
    // This work-around really only applies to new APIs that are newer than Function.bind.
    // Without it, APIs such as getGamepads() break.
    if (CordovaNavigator.bind) {
        for (var key in origNavigator) {
            if (typeof origNavigator[key] == 'function') {
                newNavigator[key] = origNavigator[key].bind(origNavigator);
            }
            else {
                (function(k) {
                    utils.defineGetterSetter(newNavigator,key,function() {
                        return origNavigator[k];
                    });
                })(key);
            }
        }
    }
    return newNavigator;
}
if (window.navigator) {
    window.navigator = replaceNavigator(window.navigator);
}

if (!window.console) {
    window.console = {
        log: function(){}
    };
}
if (!window.console.warn) {
    window.console.warn = function(msg) {
        this.log("warn: " + msg);
    };
}

// Register pause, resume and deviceready channels as events on document.
channel.onPause = cordova.addDocumentEventHandler('pause');
channel.onResume = cordova.addDocumentEventHandler('resume');
channel.onActivated = cordova.addDocumentEventHandler('activated');
channel.onDeviceReady = cordova.addStickyDocumentEventHandler('deviceready');

// Listen for DOMContentLoaded and notify our channel subscribers.
if (document.readyState == 'complete' || document.readyState == 'interactive') {
    channel.onDOMContentLoaded.fire();
} else {
    document.addEventListener('DOMContentLoaded', function() {
        channel.onDOMContentLoaded.fire();
    }, false);
}

// _nativeReady is global variable that the native side can set
// to signify that the native code is ready. It is a global since
// it may be called before any cordova JS is ready.
if (window._nativeReady) {
    channel.onNativeReady.fire();
}

// Call the platform-specific initialization.
platform.bootstrap && platform.bootstrap();

/**
 * Create all cordova objects once native side is ready.
 */
channel.join(function() {
    modulemapper.mapModules(window);

    platform.initialize && platform.initialize();

    // Fire event to notify that all objects are created
    channel.onCordovaReady.fire();

    // Fire onDeviceReady event once page has fully loaded, all
    // constructors have run and cordova info has been received from native
    // side.
    channel.join(function() {
        require('cordova').fireDocumentEvent('deviceready');
    }, channel.deviceReadyChannelsArray);

}, platformInitChannelsArray);

});

// file: src/common/modulemapper.js
define("cordova/modulemapper", function(require, exports, module) {

var builder = require('cordova/builder'),
    moduleMap = define.moduleMap,
    symbolList,
    deprecationMap;

exports.reset = function() {
    symbolList = [];
    deprecationMap = {};
};

function addEntry(strategy, moduleName, symbolPath, opt_deprecationMessage) {
    if (!(moduleName in moduleMap)) {
        throw new Error('Module ' + moduleName + ' does not exist.');
    }
    symbolList.push(strategy, moduleName, symbolPath);
    if (opt_deprecationMessage) {
        deprecationMap[symbolPath] = opt_deprecationMessage;
    }
}

// Note: Android 2.3 does have Function.bind().
exports.clobbers = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('c', moduleName, symbolPath, opt_deprecationMessage);
};

exports.merges = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('m', moduleName, symbolPath, opt_deprecationMessage);
};

exports.defaults = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('d', moduleName, symbolPath, opt_deprecationMessage);
};

exports.runs = function(moduleName) {
    addEntry('r', moduleName, null);
};

function prepareNamespace(symbolPath, context) {
    if (!symbolPath) {
        return context;
    }
    var parts = symbolPath.split('.');
    var cur = context;
    for (var i = 0, part; part = parts[i]; ++i) {
        cur = cur[part] = cur[part] || {};
    }
    return cur;
}

exports.mapModules = function(context) {
    var origSymbols = {};
    context.CDV_origSymbols = origSymbols;
    for (var i = 0, len = symbolList.length; i < len; i += 3) {
        var strategy = symbolList[i];
        var moduleName = symbolList[i + 1];
        var module = require(moduleName);
        // <runs/>
        if (strategy == 'r') {
            continue;
        }
        var symbolPath = symbolList[i + 2];
        var lastDot = symbolPath.lastIndexOf('.');
        var namespace = symbolPath.substr(0, lastDot);
        var lastName = symbolPath.substr(lastDot + 1);

        var deprecationMsg = symbolPath in deprecationMap ? 'Access made to deprecated symbol: ' + symbolPath + '. ' + deprecationMsg : null;
        var parentObj = prepareNamespace(namespace, context);
        var target = parentObj[lastName];

        if (strategy == 'm' && target) {
            builder.recursiveMerge(target, module);
        } else if ((strategy == 'd' && !target) || (strategy != 'd')) {
            if (!(symbolPath in origSymbols)) {
                origSymbols[symbolPath] = target;
            }
            builder.assignOrWrapInDeprecateGetter(parentObj, lastName, module, deprecationMsg);
        }
    }
};

exports.getOriginalSymbol = function(context, symbolPath) {
    var origSymbols = context.CDV_origSymbols;
    if (origSymbols && (symbolPath in origSymbols)) {
        return origSymbols[symbolPath];
    }
    var parts = symbolPath.split('.');
    var obj = context;
    for (var i = 0; i < parts.length; ++i) {
        obj = obj && obj[parts[i]];
    }
    return obj;
};

exports.reset();


});

// file: src/common/modulemapper_b.js
define("cordova/modulemapper_b", function(require, exports, module) {

var builder = require('cordova/builder'),
    symbolList = [],
    deprecationMap;

exports.reset = function() {
    symbolList = [];
    deprecationMap = {};
};

function addEntry(strategy, moduleName, symbolPath, opt_deprecationMessage) {
    symbolList.push(strategy, moduleName, symbolPath);
    if (opt_deprecationMessage) {
        deprecationMap[symbolPath] = opt_deprecationMessage;
    }
}

// Note: Android 2.3 does have Function.bind().
exports.clobbers = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('c', moduleName, symbolPath, opt_deprecationMessage);
};

exports.merges = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('m', moduleName, symbolPath, opt_deprecationMessage);
};

exports.defaults = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('d', moduleName, symbolPath, opt_deprecationMessage);
};

exports.runs = function(moduleName) {
    addEntry('r', moduleName, null);
};

function prepareNamespace(symbolPath, context) {
    if (!symbolPath) {
        return context;
    }
    var parts = symbolPath.split('.');
    var cur = context;
    for (var i = 0, part; part = parts[i]; ++i) {
        cur = cur[part] = cur[part] || {};
    }
    return cur;
}

exports.mapModules = function(context) {
    var origSymbols = {};
    context.CDV_origSymbols = origSymbols;
    for (var i = 0, len = symbolList.length; i < len; i += 3) {
        var strategy = symbolList[i];
        var moduleName = symbolList[i + 1];
        var module = require(moduleName);
        // <runs/>
        if (strategy == 'r') {
            continue;
        }
        var symbolPath = symbolList[i + 2];
        var lastDot = symbolPath.lastIndexOf('.');
        var namespace = symbolPath.substr(0, lastDot);
        var lastName = symbolPath.substr(lastDot + 1);

        var deprecationMsg = symbolPath in deprecationMap ? 'Access made to deprecated symbol: ' + symbolPath + '. ' + deprecationMsg : null;
        var parentObj = prepareNamespace(namespace, context);
        var target = parentObj[lastName];

        if (strategy == 'm' && target) {
            builder.recursiveMerge(target, module);
        } else if ((strategy == 'd' && !target) || (strategy != 'd')) {
            if (!(symbolPath in origSymbols)) {
                origSymbols[symbolPath] = target;
            }
            builder.assignOrWrapInDeprecateGetter(parentObj, lastName, module, deprecationMsg);
        }
    }
};

exports.getOriginalSymbol = function(context, symbolPath) {
    var origSymbols = context.CDV_origSymbols;
    if (origSymbols && (symbolPath in origSymbols)) {
        return origSymbols[symbolPath];
    }
    var parts = symbolPath.split('.');
    var obj = context;
    for (var i = 0; i < parts.length; ++i) {
        obj = obj && obj[parts[i]];
    }
    return obj;
};

exports.reset();


});

// file: /Users/steveng/repo/cordova/cordova-browser/cordova-js-src/platform.js
define("cordova/platform", function(require, exports, module) {

module.exports = {
    id: 'browser',
    cordovaVersion: '3.4.0',

    bootstrap: function() {

        var modulemapper = require('cordova/modulemapper');
        var channel = require('cordova/channel');

        modulemapper.clobbers('cordova/exec/proxy', 'cordova.commandProxy');

        channel.onNativeReady.fire();

        // FIXME is this the right place to clobber pause/resume? I am guessing not
        // FIXME pause/resume should be deprecated IN CORDOVA for pagevisiblity api
        document.addEventListener('webkitvisibilitychange', function() {
            if (document.webkitHidden) {
                channel.onPause.fire();
            }
            else {
                channel.onResume.fire();
            }
        }, false);

    // End of bootstrap
    }
};

});

// file: src/common/pluginloader.js
define("cordova/pluginloader", function(require, exports, module) {

/*
    NOTE: this file is NOT used when we use the browserify workflow
*/

var modulemapper = require('cordova/modulemapper');
var urlutil = require('cordova/urlutil');

// Helper function to inject a <script> tag.
// Exported for testing.
exports.injectScript = function(url, onload, onerror) {
    var script = document.createElement("script");
    // onload fires even when script fails loads with an error.
    script.onload = onload;
    // onerror fires for malformed URLs.
    script.onerror = onerror;
    script.src = url;
    document.head.appendChild(script);
};

function injectIfNecessary(id, url, onload, onerror) {
    onerror = onerror || onload;
    if (id in define.moduleMap) {
        onload();
    } else {
        exports.injectScript(url, function() {
            if (id in define.moduleMap) {
                onload();
            } else {
                onerror();
            }
        }, onerror);
    }
}

function onScriptLoadingComplete(moduleList, finishPluginLoading) {
    // Loop through all the plugins and then through their clobbers and merges.
    for (var i = 0, module; module = moduleList[i]; i++) {
        if (module.clobbers && module.clobbers.length) {
            for (var j = 0; j < module.clobbers.length; j++) {
                modulemapper.clobbers(module.id, module.clobbers[j]);
            }
        }

        if (module.merges && module.merges.length) {
            for (var k = 0; k < module.merges.length; k++) {
                modulemapper.merges(module.id, module.merges[k]);
            }
        }

        // Finally, if runs is truthy we want to simply require() the module.
        if (module.runs) {
            modulemapper.runs(module.id);
        }
    }

    finishPluginLoading();
}

// Handler for the cordova_plugins.js content.
// See plugman's plugin_loader.js for the details of this object.
// This function is only called if the really is a plugins array that isn't empty.
// Otherwise the onerror response handler will just call finishPluginLoading().
function handlePluginsObject(path, moduleList, finishPluginLoading) {
    // Now inject the scripts.
    var scriptCounter = moduleList.length;

    if (!scriptCounter) {
        finishPluginLoading();
        return;
    }
    function scriptLoadedCallback() {
        if (!--scriptCounter) {
            onScriptLoadingComplete(moduleList, finishPluginLoading);
        }
    }

    for (var i = 0; i < moduleList.length; i++) {
        injectIfNecessary(moduleList[i].id, path + moduleList[i].file, scriptLoadedCallback);
    }
}

function findCordovaPath() {
    var path = null;
    var scripts = document.getElementsByTagName('script');
    var term = '/cordova.js';
    for (var n = scripts.length-1; n>-1; n--) {
        var src = scripts[n].src.replace(/\?.*$/, ''); // Strip any query param (CB-6007).
        if (src.indexOf(term) == (src.length - term.length)) {
            path = src.substring(0, src.length - term.length) + '/';
            break;
        }
    }
    return path;
}

// Tries to load all plugins' js-modules.
// This is an async process, but onDeviceReady is blocked on onPluginsReady.
// onPluginsReady is fired when there are no plugins to load, or they are all done.
exports.load = function(callback) {
    var pathPrefix = findCordovaPath();
    if (pathPrefix === null) {
        console.log('Could not find cordova.js script tag. Plugin loading may fail.');
        pathPrefix = '';
    }
    injectIfNecessary('cordova/plugin_list', pathPrefix + 'cordova_plugins.js', function() {
        var moduleList = require("cordova/plugin_list");
        handlePluginsObject(pathPrefix, moduleList, callback);
    }, callback);
};


});

// file: src/common/urlutil.js
define("cordova/urlutil", function(require, exports, module) {


/**
 * For already absolute URLs, returns what is passed in.
 * For relative URLs, converts them to absolute ones.
 */
exports.makeAbsolute = function makeAbsolute(url) {
    var anchorEl = document.createElement('a');
    anchorEl.href = url;
    return anchorEl.href;
};


});

// file: src/common/utils.js
define("cordova/utils", function(require, exports, module) {

var utils = exports;

/**
 * Defines a property getter / setter for obj[key].
 */
utils.defineGetterSetter = function(obj, key, getFunc, opt_setFunc) {
    if (Object.defineProperty) {
        var desc = {
            get: getFunc,
            configurable: true
        };
        if (opt_setFunc) {
            desc.set = opt_setFunc;
        }
        Object.defineProperty(obj, key, desc);
    } else {
        obj.__defineGetter__(key, getFunc);
        if (opt_setFunc) {
            obj.__defineSetter__(key, opt_setFunc);
        }
    }
};

/**
 * Defines a property getter for obj[key].
 */
utils.defineGetter = utils.defineGetterSetter;

utils.arrayIndexOf = function(a, item) {
    if (a.indexOf) {
        return a.indexOf(item);
    }
    var len = a.length;
    for (var i = 0; i < len; ++i) {
        if (a[i] == item) {
            return i;
        }
    }
    return -1;
};

/**
 * Returns whether the item was found in the array.
 */
utils.arrayRemove = function(a, item) {
    var index = utils.arrayIndexOf(a, item);
    if (index != -1) {
        a.splice(index, 1);
    }
    return index != -1;
};

utils.typeName = function(val) {
    return Object.prototype.toString.call(val).slice(8, -1);
};

/**
 * Returns an indication of whether the argument is an array or not
 */
utils.isArray = Array.isArray ||
                function(a) {return utils.typeName(a) == 'Array';};

/**
 * Returns an indication of whether the argument is a Date or not
 */
utils.isDate = function(d) {
    return (d instanceof Date);
};

/**
 * Does a deep clone of the object.
 */
utils.clone = function(obj) {
    if(!obj || typeof obj == 'function' || utils.isDate(obj) || typeof obj != 'object') {
        return obj;
    }

    var retVal, i;

    if(utils.isArray(obj)){
        retVal = [];
        for(i = 0; i < obj.length; ++i){
            retVal.push(utils.clone(obj[i]));
        }
        return retVal;
    }

    retVal = {};
    for(i in obj){
        if(!(i in retVal) || retVal[i] != obj[i]) {
            retVal[i] = utils.clone(obj[i]);
        }
    }
    return retVal;
};

/**
 * Returns a wrapped version of the function
 */
utils.close = function(context, func, params) {
    return function() {
        var args = params || arguments;
        return func.apply(context, args);
    };
};

//------------------------------------------------------------------------------
function UUIDcreatePart(length) {
    var uuidpart = "";
    for (var i=0; i<length; i++) {
        var uuidchar = parseInt((Math.random() * 256), 10).toString(16);
        if (uuidchar.length == 1) {
            uuidchar = "0" + uuidchar;
        }
        uuidpart += uuidchar;
    }
    return uuidpart;
}

/**
 * Create a UUID
 */
utils.createUUID = function() {
    return UUIDcreatePart(4) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(6);
};


/**
 * Extends a child object from a parent object using classical inheritance
 * pattern.
 */
utils.extend = (function() {
    // proxy used to establish prototype chain
    var F = function() {};
    // extend Child from Parent
    return function(Child, Parent) {

        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.__super__ = Parent.prototype;
        Child.prototype.constructor = Child;
    };
}());

/**
 * Alerts a message in any available way: alert or console.log.
 */
utils.alert = function(msg) {
    if (window.alert) {
        window.alert(msg);
    } else if (console && console.log) {
        console.log(msg);
    }
};





});

window.cordova = require('cordova');
// file: src/scripts/bootstrap.js

require('cordova/init');

})();
cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "phonertc.js",
        "id": "com.dooble.phonertc.PhoneRTC",
        "clobbers": [
            "cordova.plugins.phonertc"
        ]
    },
    {
        "file": "PhoneRTCProxy.js",
        "id": "com.dooble.phonertc.PhoneRTCProxy",
        "runs": true
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "com.dooble.phonertc": "2.1.0",
    "cordova-plugin-compat": "1.1.0"
}
// BOTTOM OF METADATA
});
cordova.define("com.dooble.phonertc.PhoneRTC", function(require, exports, module) { var exec = require('cordova/exec');
var videoViewConfig;

function createUUID() {
  // http://www.ietf.org/rfc/rfc4122.txt
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "-";

  var uuid = s.join("");
  return uuid;
}

function Session(config) { 
  // make sure that the config object is valid
  if (typeof config !== 'object') {
    throw {
      name: 'PhoneRTC Error',
      message: 'The first argument must be an object.'
    };
  }

  if (typeof config.isInitiator === 'undefined' ||
      typeof config.turn === 'undefined' ||
      typeof config.streams === 'undefined') {
    throw {
      name: 'PhoneRTC Error',
      message: 'isInitiator, turn and streams are required parameters.'
    };
  }

  var self = this;
  self.events = {};
  self.config = config;
  self.sessionKey = createUUID();

  // make all config properties accessible from this object
  Object.keys(config).forEach(function (prop) {
    Object.defineProperty(self, prop, {
      get: function () { return self.config[prop]; },
      set: function (value) { self.config[prop] = value; }
    });
  });

  function callEvent(eventName) {
    if (!self.events[eventName]) {
      return;
    }

    var args = Array.prototype.slice.call(arguments, 1);
    self.events[eventName].forEach(function (callback) {
      callback.apply(self, args);
    });
  }

  function onSendMessage(data) {
    if (data.type === '__answered') {
      callEvent('answer');
    } else if (data.type === '__disconnected') {
      callEvent('disconnect');
    } else {
      callEvent('sendMessage', data);
    }
  }

  exec(onSendMessage, null, 'PhoneRTCPlugin', 'createSessionObject', [self.sessionKey, config]);
};

Session.prototype.on = function (eventName, fn) {
  // make sure that the second argument is a function
  if (typeof fn !== 'function') {
    throw {
      name: 'PhoneRTC Error',
      message: 'The second argument must be a function.'
    };
  }

  // create the event if it doesn't exist
  if (!this.events[eventName]) {
    this.events[eventName] = [];
  } else {
    // make sure that this callback doesn't exist already
    for (var i = 0, len = this.events[eventName].length; i < len; i++) {
      if (this.events[eventName][i] === fn) {
        throw {
          name: 'PhoneRTC Error',
          message: 'This callback function was already added.'
        };
      }
    }
  }

  // add the event
  this.events[eventName].push(fn);
};

Session.prototype.off = function (eventName, fn) {
  // make sure that the second argument is a function
  if (typeof fn !== 'function') {
    throw {
      name: 'PhoneRTC Error',
      message: 'The second argument must be a function.'
    };
  }

  if (!this.events[eventName]) {
    return;
  }

  var indexesToRemove = [];
  for (var i = 0, len = this.events[eventName].length; i < len; i++) {
    if (this.events[eventName][i] === fn) {
      indexesToRemove.push(i);
    }
  }

  indexesToRemove.forEach(function (index) {
    this.events.splice(index, 1);
  })
};

Session.prototype.call = function (success, error) {
  exec(success, error, 'PhoneRTCPlugin', 'call', [{
    sessionKey: this.sessionKey
  }]);
};

Session.prototype.receiveMessage = function (data) {
  exec(null, null, 'PhoneRTCPlugin', 'receiveMessage', [{
    sessionKey: this.sessionKey,
    message: JSON.stringify(data)
  }]);
};

Session.prototype.renegotiate = function () {
  exec(null, null, 'PhoneRTCPlugin', 'renegotiate', [{
    sessionKey: this.sessionKey,
    config: this.config
  }]);
};

Session.prototype.close = function () {
  exec(null, null, 'PhoneRTCPlugin', 'disconnect', [{ 
    sessionKey: this.sessionKey
  }]);
};

exports.Session = Session;

function getLayoutParams(videoElement) {
  var boundingRect = videoElement.getBoundingClientRect();

  if (cordova.platformId === 'android') {
    return {
      position: [boundingRect.left + window.scrollX, boundingRect.top + window.scrollY],
      size: [boundingRect.width, boundingRect.height]
    };
  }

  return {
    position: [boundingRect.left, boundingRect.top],
    size: [boundingRect.width, boundingRect.height]
  };
}

function setVideoView(config) {
  videoViewConfig = config;

  var container = config.container;

  if (container) {
    config.containerParams = getLayoutParams(container);
    delete config.container;
  }

  config.devicePixelRatio = window.devicePixelRatio || 2;

  exec(null, null, 'PhoneRTCPlugin', 'setVideoView', [config]);

  if (container) {
    config.container = container;
  }
};

document.addEventListener('touchmove', function () {
  if (videoViewConfig) {
    setVideoView(videoViewConfig);
  }
});

exports.setVideoView = setVideoView;

exports.hideVideoView = function () {
  exec(null, null, 'PhoneRTCPlugin', 'hideVideoView', []);
};

exports.showVideoView = function () {
  exec(null, null, 'PhoneRTCPlugin', 'showVideoView', []);
};

exports.stopLocalStream = function () {
  exec(null, null, 'PhoneRTCPlugin', 'stopLocalStream', []);
};

exports.checkPermissions = function (success, fail) {
  exec(success, fail, 'PhoneRTCPlugin', 'checkPermissions', []);
};
});

cordova.define("com.dooble.phonertc.PhoneRTCProxy", function(require, exports, module) { 
var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
var MediaStream = window.webkitMediaStream || window.mozMediaStream || window.MediaStream;

navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

var localStreams = [];
var localVideoTrack, localAudioTrack;

function Session(sessionKey, config, sendMessageCallback) {
  var self = this;
  self.sessionKey = sessionKey;
  self.config = config;
  self.sendMessage = sendMessageCallback;

  self.onIceCandidate = function (event) {
    if (event.candidate) {
      self.sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    }
  };

  self.onRemoteStreamAdded = function (event) {
    self.videoView = addRemoteStream(event.stream);
    self.sendMessage({ type: '__answered' });
  };

  self.setRemote = function (message) {
    message.sdp = self.addCodecParam(message.sdp, 'opus/48000', 'stereo=1');

    this.peerConnection.setRemoteDescription(new SessionDescription(message), function () {
      console.log('setRemote success');
    }, function (error) { 
      console.log(error); 
    });
  };

  // Adds fmtp param to specified codec in SDP.
  self.addCodecParam = function (sdp, codec, param) {
    var sdpLines = sdp.split('\r\n');

    // Find opus payload.
    var index = self.findLine(sdpLines, 'a=rtpmap', codec);
    var payload;
    if (index) {
      payload = self.getCodecPayloadType(sdpLines[index]);
    }

    // Find the payload in fmtp line.
    var fmtpLineIndex = self.findLine(sdpLines, 'a=fmtp:' + payload.toString());
    if (fmtpLineIndex === null) {
      return sdp;
    }

    sdpLines[fmtpLineIndex] = sdpLines[fmtpLineIndex].concat('; ', param);

    sdp = sdpLines.join('\r\n');
    return sdp;
  };

  // Find the line in sdpLines that starts with |prefix|, and, if specified,
  // contains |substr| (case-insensitive search).
  self.findLine = function (sdpLines, prefix, substr) {
    return self.findLineInRange(sdpLines, 0, -1, prefix, substr);
  };

  // Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
  // and, if specified, contains |substr| (case-insensitive search).
  self.findLineInRange = function (sdpLines, startLine, endLine, prefix, substr) {
    var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
    for (var i = startLine; i < realEndLine; ++i) {
      if (sdpLines[i].indexOf(prefix) === 0) {
        if (!substr ||
            sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
          return i;
        }
      }
    }
    return null;
  };

  // Gets the codec payload type from an a=rtpmap:X line.
  self.getCodecPayloadType = function (sdpLine) {
    var pattern = new RegExp('a=rtpmap:(\\d+) \\w+\\/\\d+');
    var result = sdpLine.match(pattern);
    return (result && result.length === 2) ? result[1] : null;
  };

  // Returns a new m= line with the specified codec as the first one.
  self.setDefaultCodec = function (mLine, payload) {
    var elements = mLine.split(' ');
    var newLine = [];
    var index = 0;
    for (var i = 0; i < elements.length; i++) {
      if (index === 3) { // Format of media starts from the fourth.
        newLine[index++] = payload; // Put target payload to the first.
      }
      if (elements[i] !== payload) {
        newLine[index++] = elements[i];
      }
    }
    return newLine.join(' ');
  };
}

Session.prototype.createOrUpdateStream = function () {
  if (this.localStream) {
    this.peerConnection.removeStream(this.localStream);
  }

  this.localStream = new MediaStream();
  
  if (this.config.streams.audio) {
    this.localStream.addTrack(localAudioTrack);
  }

  if (this.config.streams.video) {
    this.localStream.addTrack(localVideoTrack);
  }

  this.peerConnection.addStream(this.localStream);
};

Session.prototype.sendOffer = function () {
  var self = this;
  self.peerConnection.createOffer(function (sdp) {
    self.peerConnection.setLocalDescription(sdp, function () {
      console.log('Set session description success.');
    }, function (error) {
      console.log(error);
    });

    self.sendMessage(sdp);
  }, function (error) {
    console.log(error);
  }, { mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: !!videoConfig }});
}

Session.prototype.sendAnswer = function () {
  var self = this;
  self.peerConnection.createAnswer(function (sdp) {
    self.peerConnection.setLocalDescription(sdp, function () {
      console.log('Set session description success.');
    }, function (error) {
      console.log(error);
    });

    self.sendMessage(sdp);
  }, function (error) {
    console.log(error);
  }, { mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: !!videoConfig }});
}

Session.prototype.call = function () {
  var self = this;

  function call() {
    // create the peer connection
    self.peerConnection = new PeerConnection({
      iceServers: [
        { 
          url: 'stun:stun.l.google.com:19302' 
        },
        { 
          url: self.config.turn.host, 
          username: self.config.turn.username, 
          password: self.config.turn.password 
        }
      ]
    }, { optional: [ { DtlsSrtpKeyAgreement: true } ]});

    self.peerConnection.onicecandidate = self.onIceCandidate;
    self.peerConnection.onaddstream = self.onRemoteStreamAdded;

    // attach the stream to the peer connection
    self.createOrUpdateStream.call(self);

    // if initiator - create offer
    if (self.config.isInitiator) {
      self.sendOffer.call(self);
    }
  }

  var missingStreams = { 
    video: self.config.streams.video && !localVideoTrack, 
    audio: self.config.streams.audio && !localAudioTrack 
  };

  if (missingStreams.audio || missingStreams.video) {
    navigator.getUserMedia(missingStreams, function (stream) {
      localStreams.push(stream);

      if (missingStreams.audio) {
        console.log('missing audio stream; retrieving');
        localAudioTrack = stream.getAudioTracks()[0];
      }

      if (missingStreams.video) {
        console.log('missing video stream; retrieving');
        localVideoTrack = stream.getVideoTracks()[0];
      }

      call();
    }, function (error) {
      console.log(error);
    });
  } else {
    call();
  } 
};

Session.prototype.receiveMessage = function (message) {
  var self = this;
  if (message.type === 'offer') {
    self.setRemote(message);
    self.sendAnswer.call(self);
  } else if (message.type === 'answer') {
    self.setRemote(message);
  } else if (message.type === 'candidate') {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    
    self.peerConnection.addIceCandidate(candidate, function () {
      console.log('Remote candidate added successfully.');
    }, function (error) {
      console.log(error);
    });
     
  } else if (message.type === 'bye') {
    this.disconnect(false);
  }
};

Session.prototype.renegotiate = function () {
  if (this.config.isInitiator) {
    this.sendOffer();
  } else {
    this.sendAnswer();
  }
};

Session.prototype.disconnect = function (sendByeMessage) {
  console.log(this.videoView);
  if (this.videoView) {
    removeRemoteStream(this.videoView);
  }

  if (sendByeMessage) {
    this.sendMessage({ type: 'bye' });
  }

  this.peerConnection.close();
  this.peerConnection = null;

  this.sendMessage({ type: '__disconnected' });

  onSessionDisconnect(this.sessionKey);
};


var sessions = {};
var videoConfig;
var localVideoView;
var remoteVideoViews = [];

module.exports = {
  createSessionObject: function (success, error, options) {
    var sessionKey = options[0];
    var session = new Session(sessionKey, options[1], success);

    session.sendMessage({
      type: '__set_session_key',
      sessionKey: sessionKey
    });

    sessions[sessionKey] = session;
  },
  call: function (success, error, options) {
    sessions[options[0].sessionKey].call();
  },
  receiveMessage: function (success, error, options) {
    sessions[options[0].sessionKey]
      .receiveMessage(JSON.parse(options[0].message));
  },
  renegotiate: function (success, error, options) {
    console.log('Renegotiation is currently only supported in iOS and Android.')
    // var session = sessions[options[0].sessionKey];
    // session.config = options[0].config;
    // session.createOrUpdateStream();
    // session.renegotiate();
  },
  disconnect: function (success, error, options) {
    var session = sessions[options[0].sessionKey];
    if (session) {
      session.disconnect(true);
    }
  },
  setVideoView: function (success, error, options) {
    videoConfig = options[0];

    if (videoConfig.containerParams.size[0] === 0 
        || videoConfig.containerParams.size[1] === 0) {
      return;
    }

    if (videoConfig.local) {
      if (!localVideoView) {
        localVideoView = document.createElement('video');
        localVideoView.autoplay = true;
        localVideoView.muted = true;
        localVideoView.style.position = 'absolute';
        localVideoView.style.zIndex = 1001; //need to change to 1001 because semantic modal use 999
        localVideoView.addEventListener("loadedmetadata", scaleToFill);

        refreshLocalVideoView();

        if (!localVideoTrack) {
          navigator.getUserMedia({ audio: true, video: true }, function (stream) {
            localStreams.push(stream);

            localAudioTrack = stream.getAudioTracks()[0];
            localVideoTrack = stream.getVideoTracks()[0];

            localVideoView.src = URL.createObjectURL(stream);
            localVideoView.load();
          }, function (error) {
            console.log(error);
          }); 
        } else {
          var stream = new MediaStream();
          stream.addTrack(localVideoTrack);

          localVideoView.src = URL.createObjectURL(stream);
          localVideoView.load();         
        }

        document.body.appendChild(localVideoView);
      } else {    
        refreshLocalVideoView();
        refreshVideoContainer();
      }
    }
  },
  hideVideoView: function (success, error, options) {
    localVideoView.style.display = 'none';
    remoteVideoViews.forEach(function (remoteVideoView) {
      remoteVideoView.style.display = 'none';
    });
  },
  showVideoView: function (success, error, options) {
    localVideoView.style.display = '';
    remoteVideoViews.forEach(function (remoteVideoView) {
      remoteVideoView.style.display = '';
    });
  },
  stopLocalStream: function (success, error, options) {
    if (localVideoView) {
      document.body.removeChild(localVideoView);
      localVideoView = null;
    }

    localStreams.forEach(function (stream) {
      stream.getTracks().forEach( function(track) { 
        track.stop();
      });
    });

    localStreams = [];
    localVideoTrack = null;
    localAudioTrack = null;
  }
};

function addRemoteStream(stream) {
  var videoView = document.createElement('video');
  videoView.autoplay = true;
  videoView.addEventListener("loadedmetadata", scaleToFill);
  videoView.style.position = 'absolute';
  videoView.style.zIndex = 998;

  videoView.src = URL.createObjectURL(stream);
  videoView.load();

  remoteVideoViews.push(videoView);
  document.body.appendChild(videoView);

  refreshVideoContainer();
  return videoView;
}

function removeRemoteStream(videoView) {
  console.log(remoteVideoViews);
  videoView.parentNode.removeChild(videoView);
  remoteVideoViews.splice(videoView, 1);
  console.log(remoteVideoViews);

  refreshVideoContainer();
}

function getCenter(videoCount, videoSize, containerSize) {
  return Math.round((containerSize - videoSize * videoCount) / 2); 
}

function refreshVideoContainer() {
  var n = remoteVideoViews.length;

  if (n === 0) {
    return;
  }

  var rows = n < 9 ? 2 : 3;
  var videosInRow = n === 2 ? 2 : Math.ceil(n/rows);    

  var videoSize = videoConfig.containerParams.size[0] / videosInRow;
  var actualRows = Math.ceil(n / videosInRow);

  var y = getCenter(actualRows, 
                    videoSize,
                    videoConfig.containerParams.size[1])
          + videoConfig.containerParams.position[1];

  var videoViewIndex = 0;

  for (var row = 0; row < rows && videoViewIndex < n; row++) {
    var x = videoConfig.containerParams.position[0] + 
      getCenter(row < rows - 1 || n % rows === 0 ? videosInRow : n - (Math.min(n, videoViewIndex + videosInRow) - 1), 
                videoSize,
                videoConfig.containerParams.size[0]);

    for (var video = 0; video < videosInRow && videoViewIndex < n; video++) {
      var videoView = remoteVideoViews[videoViewIndex++];
      videoView.style.width = videoSize + 'px';
      videoView.style.height = videoSize + 'px';

      videoView.style.left = x + 'px';
      videoView.style.top = y + 'px';

      x += videoSize;
    }

    y += videoSize;
  }
}

function refreshLocalVideoView() {
  localVideoView.style.width = videoConfig.local.size[0] + 'px';
  localVideoView.style.height = videoConfig.local.size[1] + 'px';

  localVideoView.style.left = 
    (videoConfig.containerParams.position[0] + videoConfig.local.position[0]) + 'px';

  localVideoView.style.top = 
    (videoConfig.containerParams.position[1] + videoConfig.local.position[1]) + 'px';       
}

function scaleToFill(event) {
  var element = this;
  var targetRatio = element.offsetWidth / element.offsetHeight;
  var lastScaleType, lastAdjustmentRatio;

  function refreshTransform () {
    var widthIsLargerThanHeight = element.videoWidth > element.videoHeight;
    var actualRatio = element.videoWidth / element.videoHeight;

    var scaleType = widthIsLargerThanHeight ? 'scaleY' : 'scaleX';
    var adjustmentRatio = widthIsLargerThanHeight ? 
      actualRatio / targetRatio : 
      targetRatio / actualRatio ; 

    if (lastScaleType !== scaleType || lastAdjustmentRatio !== adjustmentRatio) {
      var transform = scaleType + '(' + adjustmentRatio + ')';

      element.style.webkitTransform = transform;
      element.style.MozTransform = transform;
      element.style.msTransform = transform;
      element.style.OTransform = transform;
      element.style.transform = transform;

      lastScaleType = scaleType;
      lastAdjustmentRatio = adjustmentRatio;
    }

    setTimeout(refreshTransform, 100);
  }

  refreshTransform();
}

function onSessionDisconnect(sessionKey) {
  delete sessions[sessionKey];

  if (Object.keys(sessions).length === 0) {
    if (localVideoView) {
      document.body.removeChild(localVideoView);
      localVideoView = null;
    }

    localStreams.forEach(function (stream) {
      stream.getTracks().forEach( function(track) { 
        track.stop();
      });
    });

    localStreams = [];
    localVideoTrack = null;
    localAudioTrack = null;
  }
}

require("cordova/exec/proxy").add("PhoneRTCPlugin", module.exports);
});

angular.module("hariRtc").run(["$templateCache", function($templateCache) {$templateCache.put("views/call.html","<div class=\"ui modal\" on-scroll=\"updateVideoPosition()\" on-scroll-complete=\"updateVideoPosition()\">\n    <div class=\"calling-container\" ng-if=\"isCalling && !callInProgress\">\n      <p>Calling to <span class=\"balanced\">{{ contactName }}</span>...</p>\n\n      <div class=\"ui button red\" ng-click=\"ignore()\">\n        Nevermind\n      </div>\n    </div>\n\n    <div class=\"calling-container\" ng-if=\"!isCalling && !callInProgress\">\n      <p><span class=\"balanced\">{{ contactName }}</span> is calling you</p>\n\n      <div class=\"ui button primary\" ng-click=\"answer()\">\n        Answer\n      </div>\n\n      <div class=\"ui button red\" ng-click=\"ignore()\">\n        Ignore\n      </div>\n    </div>\n\n    <div class=\"calling-container\" ng-if=\"callInProgress\">\n      <p>\n        Call in progress...\n      </p>\n\n      <div class=\"ui button red\" ng-click=\"end()\">\n        End\n      </div>\n    </div>\n\n    <video-view></video-view>\n\n  </div>");
$templateCache.put("views/select_contact.html","<ion-modal-view>\n  <ion-header-bar class=\"bar-positive\">\n    <h1 class=\"title\">Add Contact to Call</h1>\n      <button class=\"button button-clear\" ng-click=\"closeSelectContactModal()\">\n        Close\n      </button>\n  </ion-header-bar>\n  <ion-content>\n    <ul class=\"list\">\n      <li class=\"item item-button-right\"\n          ng-repeat=\"contact in allContacts | filter:hideCurrentUsers()\">\n        <i class=\"icon ion-record\" style=\"color: green\"></i>\n        {{ contact }}\n        <button class=\"button button-positive\" \n                ng-click=\"addContact(contact)\">\n          <i class=\"icon ion-ios7-telephone\"></i>\n        </button>\n      </li>\n    </ul>\n  </ion-content>\n</ion-modal-view>");}]);
angular.module('hariRtc')
.controller('CallCtrl', ["$scope", "$rootScope", "$timeout", "signaling", "ContactsService", "parameters",function ($scope, $rootScope, $timeout, signaling, ContactsService, parameters) {

    console.log("parameter "+JSON.stringify(parameters));

    var duplicateMessages = [];

    $scope.callInProgress = false;

    $scope.isCalling = parameters.isCalling;
    $scope.contactName = parameters.contactName;

    $scope.allContacts = ContactsService.onlineUsers;
    $scope.contacts = {};
    $scope.hideFromContactList = [$scope.contactName];
    $scope.muted = false;

    /*
    $ionicModal.fromTemplateUrl('views/select_contact.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.selectContactModal = modal;
    });
    */

    //ring! well actually beep
    //navigator.notification.beep(1);
    //window.ringingIntervalId = setInterval(navigator.notification.beep, 2500, 1);

    function call(isInitiator, contactName) {
      console.log(new Date().toString() + ': calling to ' + contactName + ', isInitiator: ' + isInitiator);
      clearInterval(window.ringingIntervalId);

      var config = { 
        isInitiator: isInitiator,
        turn: {
          //host: 'turn:ec2-54-68-238-149.us-west-2.compute.amazonaws.com:3478',
          host: 'stun:stun.l.google.com:19302',
          username: 'test',
          password: 'test'
        },
        streams: {
          audio: true,
          video: true
        }
      };

      var session = new cordova.plugins.phonertc.Session(config);
      
      session.on('sendMessage', function (data) { 
        signaling.emit('sendMessage', contactName, { 
          type: 'phonertc_handshake',
          data: JSON.stringify(data)
        });
      });

      session.on('answer', function () {
        console.log('Answered!');
      });

      session.on('disconnect', function () {
        if ($scope.contacts[contactName]) {
          delete $scope.contacts[contactName];
        }

        if (Object.keys($scope.contacts).length === 0) {
          signaling.emit('sendMessage', contactName, { type: 'ignore' });
          $scope.closeMe();
        }
      });

      session.call();

      $scope.contacts[contactName] = session; 
    }

    if ($scope.isCalling) {
      signaling.emit('sendMessage', parameters.contactName, { type: 'call' });
    }

    $scope.ignore = function () {
      clearInterval(window.ringingIntervalId);
      var contactNames = Object.keys($scope.contacts);
      if (contactNames.length > 0) { 
        $scope.contacts[contactNames[0]].disconnect();
      } else {
        cordova.plugins.phonertc.stopLocalStream()
        signaling.emit('sendMessage', parameters.contactName, { type: 'ignore' });
        $scope.closeMe();
      }
      
    };

    $scope.end = function () {
      clearInterval(window.ringingIntervalId);
      Object.keys($scope.contacts).forEach(function (contact) {
        $scope.contacts[contact].close();
        delete $scope.contacts[contact];
      });
      $scope.closeMe();
    };

    $scope.answer = function () {
      if ($scope.callInProgress) { return; }

      $scope.callInProgress = true;
      $timeout($scope.updateVideoPosition, 1000);

      call(false, parameters.contactName);

      setTimeout(function () {
        console.log('sending answer');
        signaling.emit('sendMessage', parameters.contactName, { type: 'answer' });
      }, 1500);
    };

    $scope.updateVideoPosition = function () {
      $rootScope.$broadcast('videoView.updatePosition');
    };

    $scope.openSelectContactModal = function () {
      cordova.plugins.phonertc.hideVideoView();
      $scope.selectContactModal.show();
    };

    $scope.closeSelectContactModal = function () {
      cordova.plugins.phonertc.showVideoView();
      $scope.selectContactModal.hide();      
    };

    $scope.addContact = function (newContact) {
      $scope.hideFromContactList.push(newContact);
      signaling.emit('sendMessage', newContact, { type: 'call' });

      cordova.plugins.phonertc.showVideoView();
      $scope.selectContactModal.hide();
    };

    $scope.hideCurrentUsers = function () {
      return function (item) {
        return $scope.hideFromContactList.indexOf(item) === -1;
      };
    };

    $scope.toggleMute = function () {
      $scope.muted = !$scope.muted;

      Object.keys($scope.contacts).forEach(function (contact) {
        var session = $scope.contacts[contact];
        session.streams.audio = !$scope.muted;
        session.renegotiate();
      });
    };

    function onMessageReceive (name, message) {
      switch (message.type) {
        case 'answer':
          $scope.$apply(function () {
            $scope.callInProgress = true;
            $timeout($scope.updateVideoPosition, 1000);
          });

          var existingContacts = Object.keys($scope.contacts);
          if (existingContacts.length !== 0) {
            signaling.emit('sendMessage', name, {
              type: 'add_to_group',
              contacts: existingContacts,
              isInitiator: false
            });
          }

          call(true, name);
          break;

        case 'ignore':
          var len = Object.keys($scope.contacts).length;
          if (len > 0) { 
            if ($scope.contacts[name]) {
              $scope.contacts[name].close();
              delete $scope.contacts[name];
            }

            var i = $scope.hideFromContactList.indexOf(name);
            if (i > -1) {
              $scope.hideFromContactList.splice(i, 1);
            }

            if (Object.keys($scope.contacts).length === 0) {
              $scope.closeMe();
            }
          } else {
            $scope.closeMe();
          }

          break;

        case 'phonertc_handshake':
          if (duplicateMessages.indexOf(message.data) === -1) {
            $scope.contacts[name].receiveMessage(JSON.parse(message.data));
            duplicateMessages.push(message.data);
          }
          
          break;

        case 'add_to_group':
          message.contacts.forEach(function (contact) {
            $scope.hideFromContactList.push(contact);
            call(message.isInitiator, contact);

            if (!message.isInitiator) {
              $timeout(function () {
                signaling.emit('sendMessage', contact, { 
                  type: 'add_to_group',
                  contacts: [ContactsService.currentName],
                  isInitiator: true
                });
              }, 1500);
            }
          });

          break;
      } 
    }

    signaling.on('messageReceived', onMessageReceive);

    $scope.$on('$destroy', function() { 
      clearInterval(window.ringingIntervalId);
      signaling.removeListener('messageReceived', onMessageReceive);
    });
  }]);
angular.module('hariRtc.directives').directive('videoView', ["$rootScope", "$timeout", function ($rootScope, $timeout) {
    return {
      restrict: 'E',
      template: '<div class="video-container"></div>',
      replace: true,
      link: function (scope, element, attrs) {
        function updatePosition() {
          cordova.plugins.phonertc.setVideoView({
            container: element[0],
            local: { 
              position: [500, 500],
              size: [90, 90]
            }
          });
        }

        $timeout(updatePosition, 500);
        $rootScope.$on('videoView.updatePosition', updatePosition);
      }
    }
  }]);
angular.module('hariRtc.services')
.factory('ContactsService', ["signaling", function (signaling) {
    var onlineUsers = [];

    signaling.on('online', function (name) {
      if (onlineUsers.indexOf(name) === -1) {
        onlineUsers.push(name);
      }
    });

    signaling.on('offline', function (name) {
      var index = onlineUsers.indexOf(name);
      if (index !== -1) {
        onlineUsers.splice(index, 1);
      }
    });

    return {
      onlineUsers: onlineUsers,
      setOnlineUsers: function (users, currentName) {
        this.currentName = currentName;
        
        onlineUsers.length = 0;
        users.forEach(function (user) {
          if (user !== currentName) {
            onlineUsers.push(user);
          }
        });
      }
    }
  }]);

/*
 * hariModal (portal/semantic ui version)
 * (c) 2016 Wayan P
 * Based on angular-modal by Brian Ford
 */

'use strict';

angular
.module('hariRtc.services')
.factory('hariModal', ['$animate', '$compile', '$rootScope', '$controller', '$q', '$http', '$templateCache', modalFactoryFactory]);

function modalFactoryFactory($animate, $compile, $rootScope, $controller, $q, $http, $templateCache) {
  return function modalFactory (config) {
    if (!(!config.template ^ !config.templateUrl)) {
      throw new Error('Expected modal to have exacly one of either `template` or `templateUrl`');
    }

    var template      = config.template,
        controller    = config.controller || null,
        controllerAs  = config.controllerAs,
        parameters    = config.parameters,
        container     = angular.element(config.container || document.body),
        element       = null,
        html,
        scope;

    if (config.template) {
      html = $q.when(config.template);
    } else {
      html = $http.get(config.templateUrl, {
        cache: $templateCache
      }).
      then(function (response) {
        return response.data;
      });
    }

    function activate () {
      return html.then(function (html) {
        if (!element) {
          attach(html, parameters);
        }
      });
    }


    function attach (html, locals) {
      element = angular.element(html);
      if (element.length === 0) {
        throw new Error('The template contains no elements; you need to wrap text nodes')
      }
      scope = $rootScope.$new();
      if (controller) {
        if (!locals) {
          locals = {};
        }
        locals.$scope = scope;
        var ctrl = $controller(controller, locals);
        if (controllerAs) {
          scope[controllerAs] = ctrl;
        }
        scope.closeMe = deactivate;
      } else if (locals) {
        for (var prop in locals) {
          scope[prop] = locals[prop];
        }
      }
      var modalEl = $compile(element)(scope);
      return modalEl.modal({
                    closable: false,
                    duration: 100,
                    blurring: false
                })
                .modal("show");
      //return $animate.enter(element, container);
    }

    function deactivate () {
      if (!element) {
        return $q.when();
      }
      return $animate.leave(element).then(function () {
        scope.$destroy();
        scope = null;
        element.modal("hide");
        element.remove();
        element = null;
      });
    }

    function active () {
      return !!element;
    }

    return {
      activate: activate,
      deactivate: deactivate,
      active: active
    };
  };
}
angular.module('hariRtc.services').factory('signaling', ["socketFactory", "env",function (socketFactory, env) {

	if(!env.signalingEndpoint){
		env.signalingEndpoint = 'https://irest.pitt.edu:8080/';
	}
    var socket = io.connect(env.signalingEndpoint, {secure: true});
    
    var socketFactory = socketFactory({
      ioSocket: socket
    });

    return socketFactory;
  }]);