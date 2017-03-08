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