/**
 *
 *
 * */

//Init variables
var mongo = require('mongodb').MongoClient; //mongo client
var request = require('request'); //Allows to do HTTP request
var urlPack = require("url"); //use url functionalities
var multiparty = require('multiparty'); //allows to upload images
var fs = require("fs"); //file system
var cloudinary = require('cloudinary'); //cloudinary service
var inAppPurchaseVerification = require('in-app-purchase');
var sha1 = require('js-sha1');

const PARSE_APPLICATION_ID = "qKF9t2KQHM28ii6tCBJRePm9Z5U12lx4pTpGCmDc";
const PARSE_REST_API_KEY = "V6y67VEHvl4KdWUz9RyRWnwL1dS4LIB7pDvS96Vb";

const CONVERSATION_TYPE_PUBLIC = "Public-Conversation";
const CONVERSATION_TYPE_PERSONAL = "Personal-Conversation";

var port = process.env.PORT || 8080; //port
var url = process.env.MONGOLAB_URL || 'mongodb://127.0.0.1/chat'; //mongo lab url (if it's not a config var would use local)
var authyKey = process.env.AUTHY_DEV_KEY || 'tjr2LZXE1jWPToKVrdSqDJRED6hNk51M'; //provided by authy; cchat.server: ('c11f55317e229f48439bea2fcce22fbf')
//Array of keys to accept uploads to cloudinary
var keyArray = [process.env.PASSWORD_1,process.env.PASSWORD_2,process.env.PASSWORD_3];
var version = process.env.VERSION;

//Init Cloudinary service::
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
/**
 * Transaction receipt example form IAP Billin ANE.
 * For more information : http://airnativeextensions.com/extension/com.distriqt.InAppBilling#reference
 * TransactionState :transaction:purchased:
 * Error:
 * Receipt : {
    * 	"signature" = "AkVKoX0xjfe+Ku+CJAr7bO36QJqGXbU7nVf9p3CWAzaG+ZD7w0bB7Y0RMu2Q9r2Ch6SM4prGGpy09I/1d0XZe8Js50V19xNIcWkaHBamv0/Tmbd3eNX8m65zG4iZ1IDYl4sCOxV1WoHVEC7usQIwHBini/qCP2Ig30DnLuBm6m4gAAADVzCCA1MwggI7oAMCAQICCBup4+PAhm/LMA0GCSqGSIb3DQEBBQUAMH8xCzAJBgNVBAYTAlVTMRMwEQYDVQQKDApBcHBsZSBJbmMuMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTEzMDEGA1UEAwwqQXBwbGUgaVR1bmVzIFN0b3JlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MB4XDTE0MDYwNzAwMDIyMVoXDTE2MDUxODE4MzEzMFowZDEjMCEGA1UEAwwaUHVyY2hhc2VSZWNlaXB0Q2VydGlmaWNhdGUxGzAZBgNVBAsMEkFwcGxlIGlUdW5lcyBTdG9yZTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBAMmTEuLgjimLwRJxy1oEf0esUNDVEIe6wDsnnal14hNBt1v195X6n93YO7gi3orPSux9D554SkMp+Sayg84lTc362UtmYLpWnb34nqyGx9KBVTy5OGV4ljE1OwC+oTnRM+QLRCmeNxMbPZhS47T+eZtDEhVB9usk3+JM2Cogfwo7AgMBAAGjcjBwMB0GA1UdDgQWBBSJaEeNuq9Df6ZfN68Fe+I2u22ssDAMBgNVHRMBAf8EAjAAMB8GA1UdIwQYMBaAFDYd6OKdgtIBGLUyaw7XQwuRWEM6MA4GA1UdDwEB/wQEAwIHgDAQBgoqhkiG92NkBgUBBAIFADANBgkqhkiG9w0BAQUFAAOCAQEAeaJV2U51rxfcqAAe5C2/fEW8KUl4iO4lMuta7N6XzP1pZIz1NkkCtIIweyNj5URYHK+HjRKSU9RLguNl0nkfxqObiMckwRudKSq69NInrZyCD66R4K77nb9lMTABSSYlsKt8oNtlhgR/1kjSSRQcHktsDcSiQGKMdkSlp4AyXf7vnHPBe4yCwYV2PpSN04kboiJ3pBlxsGwV/ZlL26M2ueYHKYCuXhdqFwxVgm52h3oeJOOt/vY4EcQq7eqHm6m03Z9b7PRzYM2KGXHDmOMk7vDpeMVlLDPSGYz1+U3sDxJzebSpbaJmT7imzUKfggEY7xxf4czfH0yj5wNzSGTOvQ==";
    * 	"purchase-info" = "ewoJIm9yaWdpbmFsLXB1cmNoYXNlLWRhdGUtcHN0IiA9ICIyMDE2LTA0LTA1IDAxOjA2OjAxIEFtZXJpY2EvTG9zX0FuZ2VsZXMiOwoJInVuaXF1ZS1pZGVudGlmaWVyIiA9ICIxMzE1MmUzMDVjODkzYjZiNTQwMTMwYmY5NzAwZmQxZDc4MGFmNTEzIjsKCSJvcmlnaW5hbC10cmFuc2FjdGlvbi1pZCIgPSAiMTAwMDAwMDIwMzQzMDc0OSI7CgkiYnZycyIgPSAiMS4zLjEwIjsKCSJ0cmFuc2FjdGlvbi1pZCIgPSAiMTAwMDAwMDIwMzQzMDc0OSI7CgkicXVhbnRpdHkiID0gIjEiOwoJIm9yaWdpbmFsLXB1cmNoYXNlLWRhdGUtbXMiID0gIjE0NTk4NDM1NjEyMjciOwoJInVuaXF1ZS12ZW5kb3ItaWRlbnRpZmllciIgPSAiNjRCNDVBNkYtNEZDMy00Qzk0LUI3RDYtN0RFQjQ2RTBFNDU0IjsKCSJwcm9kdWN0LWlkIiA9ICJjb20uNHN0YXJzY2FzaW5vLmNvbnN1bWFibGUuMSI7CgkiaXRlbS1pZCIgPSAiOTY2NDk1Mjg2IjsKCSJiaWQiID0gImNvbS40c3RhcnNjYXNpbm8uNFN0YXJzQ2FzaW5vIjsKCSJwdXJjaGFzZS1kYXRlLW1zIiA9ICIxNDU5ODQzNTYxMjI3IjsKCSJwdXJjaGFzZS1kYXRlIiA9ICIyMDE2LTA0LTA1IDA4OjA2OjAxIEV0Yy9HTVQiOwoJInB1cmNoYXNlLWRhdGUtcHN0IiA9ICIyMDE2LTA0LTA1IDAxOjA2OjAxIEFtZXJpY2EvTG9zX0FuZ2VsZXMiOwoJIm9yaWdpbmFsLXB1cmNoYXNlLWRhdGUiID0gIjIwMTYtMDQtMDUgMDg6MDY6MDEgRXRjL0dNVCI7Cn0=";
    * 	"environment" = "Sandbox";
    * 	"pod" = "100";
    * 	"signing-status" = "0";
    * }:
 * Signature : :
 * Original message :
 */
/*
 //init IAP Verification
 inAppPurchaseVerification.config({
 applePassword: "XXXX-XXXX-XXXX-XXXX-XXXX"//, // this comes from iTunes Connect
 //googlePublicKeyStrSandbox: publicKeySandboxString,
 //googlePublicKeyStrLive: publicKeyLiveString
 });
 */

var app = require("http").createServer(function(request, response){
    
var path = urlPack.parse(request.url).pathname;

    switch(path){
        case '/':
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write('Welcome!!!');
            response.end();
            break;
        case '/html/userRegistration.html':
            fs.readFile(__dirname + path, function(error, data){
                if (error){
                    response.writeHead(404);
                    response.write("opps this doesn't exist - 404");
                    response.end();
                }
                else{
                    response.writeHead(200, {"Content-Type": "text/html"});
                    response.write(data, "utf8");
                    response.end();
                }
            });
            break;
        case '/js/main.js':
            fs.readFile(__dirname + path, function(error, data){
                if (error){
                    response.writeHead(404);
                    response.write("opps this doesn't exist - 404");
                    response.end();
                }
                else{
                    response.writeHead(200, {"Content-Type": "text/html"});
                    response.write(data, "utf8");
                    response.end();
                }
            });
            break;
        default:
            response.writeHead(404);
            response.write("opps this doesn't exist - 404");
            response.end();
            break;
    }
});


//var app = require("http").createServer(handler); //Init service and create http server (not mongo db). accept http requests
var client = require('socket.io').listen(app);
var authy = require('authy')(authyKey);


app.listen(port);


/* handler function comment Beging 
function handler (req, res) { //Handler to http request
    console.log("Express server listening on port " +port+" in TEST SERVER");
    // Simple path-based request dispatcher
    console.log(req.url);
    switch (urlPack.parse(req.url).pathname) { //depending on the path it would do different actions. For CheckChat we only user /upload
        case '/':
            display_form(req, res);
            break;
        case '/upload':
            if(req.method === 'POST') {
                //REQUIRE PASSWORD
                upload_file(req, res);
            }
            break;
        case '/tmp':
            display_image(req, res);
            break;
        default:
            show_404(req, res);
            break;
    }
}
function display_form(req, res) {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.write("Wrond access");
    res.end();
}

function display_image(req, res) {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.write("Wrond access");
    res.end();
}
handler function comment Beging */

/*
 * Handle file upload
 */
function upload_file(req, res) {
    var form = new multiparty.Form(); //multiparty used to handle upload of files. In this case images from a http request
    form.autoFiles = true; //option to save files in disc
    form.uploadDir = "/tmp"; //folder where it will be stored
    form.on('error', function(err) {
        console.log('Error parsing form: ' + err.stack);
    });
    var responseString;
    var userOrignalName = "";
    var key = "";
    var splittedArray = [];
    form.on('file', function(name,file) { //handler  when file is uploaded and stored
        // You *must* act on the part by reading it
        // NOTE: if you want to ignore it, just call "part.resume()"
        //console.log("Name :::"+name);
        //console.log("File fieldName :::"+file.fieldName);
        //console.log("File originalName :::"+file.originalFilename);
        //console.log("File path :::"+file.path);
        //console.log("File size :::"+file.size);
        //console.log("File headers :::"+JSON.stringify(file.headers));
        //

    });

// Close emitted after form parsed
    form.on('close', function() {
        //console.log('Upload completed!');
        //count++;
        //res.writeHead(200, {'content-type': 'text/html'});
        //res.end('Received ' + count + ' files');
    });

    // Parse req
    form.parse(req, function(err, fields, files) { // when upload is done this provide information about http request
        //fields contains fields attached in http request
        //files contains information about uploaded file
        if(err){
            console.log("Error uploading image ::"+err);
        }
        var userKey = ""; // empty key in case version previous to v0.11.0 upload image
        var position = 0;// position in array 0 in case version previous to v0.11.0 upload image
        userOrignalName = fields.publicIdFile[0]; //original name to upload it to cloudinary witht this name (validated phone number)
        var file = files.Filedata[0];
        //console.log('received upload:\n\n'+ JSON.stringify(fields));
        if(fields.hasOwnProperty('imageKey')) { //checking if there is key. introduced in v0.11.0.previous versions don't have this feature
            key = fields.imageKey[0];
            splittedArray = key.split("?");
            if (splittedArray.length == 2) {
                userKey = splittedArray[0];
                position = Number(splittedArray[1]);
                console.log("KEY :: " + userKey);
                console.log("Pos :: " + position);
            }
        }else{ // Can give an early response, ignored for now because it's sent if user key does not match with key in server
            //console.log("There is no key to authorize :: "+userKey);
            //fs.exists(file.path, function (exists) {
            //        if (exists) {
            //            fs.unlink(file.path);
            //        }
            //    }
            //);
            //res.writeHead(200, {'content-type': 'text/html'});
            //res.end('{"text": "This version is not allow to upload images, please update your App", "error": true}');
            //return;
        }
        //console.log("Files:: "+JSON.stringify(files));
        if(keyArray[position] == userKey) { // check that key provided by user matches key in server
            fs.exists(file.path, function (exists) {
                if (exists) {
                    //console.log('updated name:'+ userOrignalName);
                    if (userOrignalName != "") {
                        var publicIdOption = {"public_id": "", "invalidate": true}; // options when uploading to cloudinary
                        //public id will be valited phone number of file owner
                        // invalidate == true to allow download latest file uploaded
                        publicIdOption.public_id = userOrignalName;
                        var cloudinaryCallBack = function (result) {
                            responseString = JSON.stringify(result);
                            console.log("File " + file.originalFilename + " Uploaded to cloudinary");
                            //console.log(responseString);
                            //Once uploaded the file will be removed from server
                            fs.unlink(file.path);
                            res.writeHead(200, {'content-type': 'text/html'});
                            res.end(responseString); //Send response to uploader with response from cloudinary
                        };
                        cloudinary.uploader.upload(file.path,
                            function (result) {
                                cloudinaryCallBack(result);
                            },
                            publicIdOption);
                    } else {
                        console.log("User name not received, we do not proceed to update in clodinary");
                        //Send response to uploader with error
                        fs.unlink(file.path);
                        res.writeHead(200, {'content-type': 'text/html'});
                        res.end('{"text": "File could not be updated, user name not received please try again", "error": true}');
                    }
                }
            });
        }else{
            console.log("Key does not match :: "+userKey);
            //Send response to uploader with error that key provided does not match
            fs.exists(file.path, function (exists) {
                    if (exists) {
                        fs.unlink(file.path);
                    }
                }
            );
            res.writeHead(200, {'content-type': 'text/html'});
            res.end('{"text": "This version does not allow to upload images, please update your App", "error": true}');
        }
        //res.writeHead(200, {'content-type': 'text/plain'});
        //res.write('received upload:\n\n');
        //res.end(util.inspect({fields: fields, files: files}));
    });
}
/*
 * Handles page not found error
 */
function show_404(req, res) {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.write("You are doing it wrong!");
    res.end();
}


mongo.connect(url,function(err,db) {
    if(err) throw err;
    console.log("mongo db init");
    startIOServer (db);

});


function startIOServer (db) { // Once db is connected we can start listening sockets
    client.on('connection', function (socket) {
        console.log("on new connection connection");
        socket.on("disconnect", function(s){
            console.log("disconnected::"+socket.room);

        });
        /**
         * sendResponseLogin: send response to user who requested login
         * s == Object with response
         * id == phone number of user who requested login
         *
         * */
        var sendResponseLogin = function (s,id,conversations) {
            //console.log("Login response:::"+ s.toString());
            s.keys = keyArray;
            client.sockets.in(id).emit('loginResponse', s);
        };
        /**
         * onConversationStarted: notifies user a conversation was started
         * deprecated. this variable is not bein used.
         * s == Object with message
         *
         * */
        var onConversationStarted = function (s) {
            socket.emit('onConversationStarted', s);
        };
        /**
         * updateUserConversation: updates user's data in users collection. conversation id is introduced in
         * conversation array of user.
         * query == object that will set the query in database {_id: (Number)};
         * id == Id of new conversation to introduce in user's data
         * options == options when modifying file in database {'upsert': true, 'new': true}
         *
         * */
        var updateUserConversation = function (query, id, options) {
            var users = db.collection('users');
            //users.findAndModify(query, [['_id', 1]], {$push: {conversations: id}}, options, function (err, doc) {
            users.findAndModify(query, [['_id', 1]], {$addToSet: {conversations: id}}, options, function (err, doc) {
                if (err) {
                    console.log("error updateUserConversation:: " + err);
                }

                //console.log("id:" + id + " inserted in user:" + query._id);
            });
        };
        /**
         * insertConversationToDb: creates a file in conversations collection with conversation id and users that involve
         * that conversation
         * conversationData == object that will be introduced in collection
         * {_id: (Number), users: [(Number), (Number)], type: (String)}
         * */
        var insertConversationToDb = function (conversationData) {
            var conversations = db.collection('conversations');
            conversations.insert(conversationData, function (err, doc) {
                if (err) {
                    console.log("error insertConversationToDb:: " + err);
                }
                //console.log("conversation inserted");
            });
        };
        /**
         * createMessagesDb: creates file in checkmessages collection
         * that conversation
         * messagesData == object that will be introduced in collection
         * {_id: id, type: conversationType}
         * when receiving messages this will be updated
         * {_id: (Number), type: (String), conversations: [Array], deliver:[Array]}
         * */
        var createMessagesDb = function (messagesData) {
            var conversations = db.collection('checkmessages');
            conversations.insert(messagesData, function (err, doc) {
                if (err) {
                    console.log("error createMessagesDb:: " + err);
                }
                //console.log("messages inserted");
            });
        };
        /**
         * saveMessageInDb: introduce message in database when is sent to other user in case user is offline
         * message == message object that will be introduced in collection
         * message = {
                "from": (Number)
                , "to": (Number)
                , "message": (String)
                , 'sentAt': (String)
                , "convId": (Number)
                , "id": (String)
                , "conversationType": (String)
                , "isTask": (Boolean)
            };
         * */
        var saveMessageInDb = function (message) {
            var convId = message.convId;
            if(convId == 0){
                console.log("conversation id not updated,check it");
            }

            // Save NOW as the "receivedAt" property of the message
            var now = new Date();
            message.receivedAt = now.toJSON();

            //console.log(
            //    "Saving the message: " + message.id
            //    + "  at:" + message.receivedAt
            //    + "   with message: " + message.message
            //);

            var messages = db.collection('checkmessages');
            var query = {"_id": convId};
            var options = {'upsert': true, 'new': true};
            // TODO: Answer Q: Why is the array where the messages are called "conversations" in the Mongo collection?
            messages.findAndModify(
                query
                , [['_id', 1]]
                , {$push: {conversations: message}} //Push message to conversations array
                , options
                , function (err, doc) {
                    if (err) {
                        console.log("error in Saving Message in db::" + err);
                    }

                    //console.log("convId:" + convId + " updated with message ::" + message.message);
                });
        };
        /**
         * saveMessageInDb: introduce task message in database when is sent to other user in case user is offline
         * message == task object that will be introduced in collection
         *message = {
                "from": (Number)
                , "to": (Number)
                , "convId": (Number)
                , "id": (String)
                , "assignee": (Number)
                , "notificationCreatedAt": (String)
                , "dueDate": (String)
                , "createdAt": (String)
                , "solvedAt": (String)
                , "conversationType": (String)
                , "isTask": (Boolean)
                , "message": (String)
                , "action": (Number)
            };
         * */
        var saveTaskInDb = function (message) {
            var convId = message.convId;
            if(convId == 0){
                console.log("conversation id not updated,check it");
            }

            // Save NOW as the "receivedAt" property of the message
            //console.log(
            //    "Saving the message: " + message.id
            //    + "  at:" + message.receivedAt
            //    + "   with message: " + message.message
            //);

            var messages = db.collection('checkmessages');
            var query = {"_id": convId};
            var options = {'upsert': true, 'new': true};
            // TODO: Answer Q: Why is the array where the messages are called "conversations" in the Mongo collection?
            messages.findAndModify(
                query
                , [['_id', 1]]
                , {$push: {conversations: message}}
                , options
                , function (err, doc) {
                    if (err) {
                        console.log("error in Saving Message in db::" + err);
                    }

                    //console.log("convId:" + convId + " updated with message ::" + message.message);
                });
        };
        /**
         * saveErrorInDb: introduce error message in database in case some error occurs
         * message == either task or message object that will be introduced in collection
         * in addition with message.error = "Error task in convId::"+messageData.convId+" SENDING TO "+messageData.to;
         * */
        var saveErrorInDb = function (message) {
            var convId = message.convId;
            if(convId == 0){
                console.log("conversation id not updated,check it");
            }

            // Save NOW as the "receivedAt" property of the message
            //console.log(
            //    "Saving the message: " + message.id
            //    + "  at:" + message.receivedAt
            //    + "   with message: " + message.message
            //);

            var messages = db.collection('checkmessages');
            var query = {"_id": convId};
            var options = {'upsert': true, 'new': true};
            // TODO: Answer Q: Why is the array where the messages are called "conversations" in the Mongo collection?
            messages.findAndModify(
                query
                , [['_id', 1]]
                , {$push: {errors: message}}
                , options
                , function (err, doc) {
                    if (err) {
                        console.log("error in Saving Message in db::" + err);
                    }

                    //console.log("convId:" + convId + " updated with message ::" + message.message);
                });
        };
        /**
         * deleteMessageInDb: removes message from database, it occurs when destinee receives message and confirms
         * message == {messageId: (String), convId: (Number)}
         * */
        var deleteMessageInDb = function (message) {
            var messages = db.collection('checkmessages');
            var query = {"_id": message.convId};
            var options = {'upsert': true, 'new': true};
            // db.students.update( { _id: 1 }, { $pop: { scores: 1 } } )
            //messages.findAndModify(query, [['_id', 1]], {$pop: {conversations: 1}}, options, function (err, doc) {
            //console.log("messageId deleteMessageInDb:: " + message.messageId);
            messages.findAndModify(
                query
                , [['_id', 1]]
                , {$pull:  { conversations: { id: message.messageId } } }
                , options
                , function (err, doc) {
                    if (err) {
                        console.log("error deleteMessageInDb:: " + err);
                    }else{
                        //console.log("convId:" + message.messageId + " updated with removed message");
                    }
                });
        };

        /**
         * Used for login or registration in case user doesn't exists;
         * code:0 == pending confirmation code
         * code:1 == confirmation code accepted
         * code:2 == user already exists
         * code:10 == code confirmation does not match
         * code:11 == code invalid
         */
        socket.on('preLogin', function (data) {
            if(data == null){
                sendResponseLogin({"code":-1,"message":"Data cannot be null"},0,[]);
                return;
            }
            console.log("login required:" + data[0].id);
            var col = db.collection('users');
            var query = {"_id": data[0].id};

            //We check if that user already exists in database
            col.find(query).toArray(function (err, doc) {
                if (err) {
                    console.log("Error in server when login:: " + err);
                }
                //console.log("preLogin request, document required: " + doc.length);
                //we create a socket room for this user with his phone number
                createUserRoom(query._id);
                if (doc.length == 1) {
                    console.dir("User exists " + doc[0]._id);
                    //TODO:Check for password
                    var conversations = doc[0].conversations; //if user exists we check if he has already conversations
                    if(conversations) {
                        console.log("Conversations::" + conversations.toString());
                    }else{
                        console.log("No conversations for this user");
                    }
                    //in login user sends verification required when registering for the fist time or app was deleted and
                    //user is registering again with his number
                    if(data[0].verificationRequired){
                        if(doc[0].authyId != -1){ //we check if authy id is -1 this means this user was created in test
                            sendSMSToken(doc[0].authyId);
                        }else{
                            registerUserOrUpdateUserInfo(true,data,col);
                        }
                    }else{
                        sendResponseLogin({"code": 2, "message": "User already exists"}, data[0].id,conversations);
                    }
                } else if (doc.length == 0) {
                    console.log('Registering Authy user');
                    //var email = data[0].id+"@cc.com";
                    //var phone = data[0].confirmation.phone;
                    //var countryCode = data[0].confirmation.countryCode;
                    var test = false;
                    if(data[0].hasOwnProperty("testUser")){
                        test = data[0].testUser;
                    }
                    if(test){ //registering user on test
                        data[0].authyId = -1;
                        saveTestUser(col,data);
                        return;
                    }
                    //authy.register_user(email, phone, countryCode,
                    //    function(err, response) {
                    //
                    //        if (err || !response.user){
                    //            console.log("Failed to register user with Authy");
                    //            return ;
                    //        }
                    //        data[0].authyId = response.user.id;
                    //        saveNewUser(col,data);
                    //    });
                    //in case user is not created in development and test. user is registered
                    registerUserOrUpdateUserInfo(false,data,col);
                }
            });
        });
        /**
         * registerUserOrUpdateUserInfo == add new user or modify user in users collection
         * updateNecessary == Boolean set to true when is an update of already existing user. When false is a new registration
         * data == {id: (Number),userName:(String), pwd:(String), confirmation: (JSON), verificationRequired: (Boolean)}
         * confirmation == {phone: (Number),countryCode:(Number)}
         * col == users collection
         * */
        var registerUserOrUpdateUserInfo = function(updateNecessary,data,col){
            var email = data[0].id+"@cc.com";
            var phone = data[0].confirmation.phone;
            var countryCode = data[0].confirmation.countryCode;
            authy.register_user(email, phone, countryCode,
                function(err, response) {

                    if (err || !response.user){
                        console.log("Failed to register user with Authy");
                        sendResponseLogin({"code": -1, "message": "Failed to register user with Authy, registration do not proceed ", "status":"fail_registration","error":err}, data[0].id);
                        return ;
                    }
                    data[0].authyId = response.user.id;
                    if(updateNecessary){
                        updateUserInfo(col,data);
                    }else{
                        saveNewUser(col,data);
                    }
                });
        };
        /**
         * updateUserInfo == modify user in users collection
         * data == {id: (Number),userName:(String), pwd:(String), confirmation: (JSON), verificationRequired: (Boolean)}
         * confirmation == {phone: (Number),countryCode:(Number)}
         * col == users collection
         * */
        var updateUserInfo = function(col,data){
            var query = {"_id": data[0].id};
            var options = {'upsert': true, 'new': true};
            // db.students.update( { _id: 1 }, { $pop: { scores: 1 } } )
            col.findAndModify(query, [['_id', 1]], {$set: {authyId:data[0].authyId}}, options, function (err, doc) {
                if (err) {
                    console.log("error updateUserInfo:: " + err);
                }

                //console.log("User:" + data[0].id + " new status confirmed");
            });
        };
        /**
         * saveNewUser == add new user in users collection
         * data == {id: (Number),userName:(String), pwd:(String), confirmation: (JSON), verificationRequired: (Boolean)}
         * confirmation == {phone: (Number),countryCode:(Number)}
         * col == users collection
         * */
        var saveNewUser = function(col,data){
            var date = new Date();
            var newUser = {_id: data[0].id, "userName": data[0].userName,"pwd":data[0].pwd, authyId: data[0].authyId, registration: date, reg_status: "pending_confirmation"};
            col.insert(newUser, function (err, inserted) {
                if (err) {
                    console.log("Error in login saveNewUser::  " + err);
                }
                sendResponseLogin({"code": 0, "message": "New user inserted :: status:: "+newUser.reg_status, "status":newUser.reg_status}, data[0].id);
                sendSMSToken(data[0].authyId);
            });
        };
        /**
         * saveTestUser == add new test user in users collection // used when it's not release in CC flex-config.xml
         * data == {id: (Number),userName:(String), pwd:(String), confirmation: (JSON), verificationRequired: (Boolean)}
         * confirmation == {phone: (Number),countryCode:(Number)}
         * col == users collection
         * */
        var saveTestUser = function(col,data){
            var date = new Date();
            var newUser = {_id: data[0].id, "userName": data[0].userName,"pwd":data[0].pwd, authyId: data[0].authyId, registration: date, reg_status: "pending_confirmation"};
            col.insert(newUser, function (err, inserted) {
                if (err) {
                    console.log("Error in login::  " + err);
                }
                sendResponseLogin({"code": 1, "message": "New user inserted :: status:: confirmation code accepted", "status":"confirmation code accepted"}, data[0].id);
            });
        };
        /**
         * sendSMSToken == send sms to user through Authy
         * authyId == once user is registered in authy, authy provides to this user an authy id to send sms
         * */
        var sendSMSToken = function(authyId) {
            console.log("Sending SMS Token");
            authy.request_sms(authyId, function(err, response) {
                if(err){
                    console.log("Error on sending token:::"+JSON.stringify(err));
                }
            });
        };

        /**
         * Verify the code that was sent to user phone
         * Once the user receives the code through sms or authy app user confirms to server
         */
        socket.on('codeConfirmation', function (data) {
            if(data ==[] || data.length == 0){
                return;
            }
            var users = db.collection('users');
            var query = {"_id": data[0].id};
            users.find(query).toArray(function (err, doc) {
                if (err) {
                    console.log("Socket::codeConfirmation:: " + err);
                }
                authy.verify(doc[0].authyId, data[0].code, function(err, response) { // Authy verifies that code is correct
                    if(response){
                        console.log("Socket::codeConfirmation:: RESPONSE TO VERIFICATION  :: "+response);
                    }
                    if(err){ // if error, user is notified
                        sendResponseLogin({"code": 10, "message": "New user inserted :: status:: code confirmation does not match", "status":"code confirmation does not match"}, data[0].id);
                        return;
                    }
                    //Create two example conversations. A monologue and a conversation with CheckChat team
                    var monologueExample ={"conversationType":"","text":"Pick up kids from football","tittle":"TO-DO", "convType": CONVERSATION_TYPE_PERSONAL};
                    var ccTeamMessage = {
                        convId: 0
                        , id: ""
                        , from: 356243252428 //Malta prefix 356 + checkchat
                        , to: data[0].id
                        , message: "Welcome to CheckChat, the App from The Future! If you have any question, here we are to answer to you :)"
                        , sentAt: ""
                        , conversationType: CONVERSATION_TYPE_PUBLIC
                        , isTask: false
                        , userName: "CheckChat Team"
                        , messageType: "SERVER_INFO"
                    };
                    var testConversation = [monologueExample];
                    var response = {"code": 1, "message": "New user inserted :: status:: confirmation code accepted", "status":"confirmation code accepted"};
                    response.test = testConversation;
                    sendResponseLogin(response, data[0].id); //send response to user
                    startConversation([ccTeamMessage]); //start new conversation automatically with ccteam
                    updateUserInfoState(data[0].id);
                });
            });
        });
        /**
         * updateUserInfoState == updates user inforation with registration status confirmed
         * id == phone number of user
         * */
        var updateUserInfoState = function (id) {
            var users = db.collection('users');
            var query = {"_id": id};
            var options = {'upsert': true, 'new': true};
            // db.students.update( { _id: 1 }, { $pop: { scores: 1 } } )
            users.findAndModify(query, [['_id', 1]], {$set: {reg_status:"confirmed"}}, options, function (err, doc) {
                if (err) {
                    console.log("error resetConversation:: " + err);
                }

                //console.log("User:" + id + " new status confirmed");
            });
        };
        /**
         * Verify contacts, introduce an array with contacts numbers (with country prefix)
         * and gives back an array with users in our database and user name.
         *
         */
        socket.on('verifyContacts', function (data) {
            if(data ==[] || data.length == 0){
                return;
            }
            var users = db.collection('users');
            var query = {"_id": {$in:data}};
            //var query = {"_id": {$in:data},"status":"registered"};
            var projection = {"_id":1,"userName":1};
            users.find(query,projection).toArray(function (err, doc) {
                if (err) {
                    console.log("error verifyContacts:: " + err);
                }
                confirmUsersVerification(doc);
            });
        });

        /**
         * Save contacts, introduce an object with contacts numbers (with country prefix) and the proper Full-names
         * and saves the contacts in Parse on the Contacts table.
         *
         */
        /*
         curl -X POST \
         -H "Content-Type: application/json" \
         -H "X-Parse-Application-Id: qKF9t2KQHM28ii6tCBJRePm9Z5U12lx4pTpGCmDc" \
         -H "X-Parse-REST-API-Key: V6y67VEHvl4KdWUz9RyRWnwL1dS4LIB7pDvS96Vb" \
         -d "{\"contacts\":{\"385958546851\":\"Sergito\",\"385992073346\":\"Dijana bebe\"}, \"userNumber\":385919190060}" \
         https://api.parse.com/1/functions/saveContacts
         */
        socket.on('parse_saveContacts', function (data) {
            if(data ==[] || data.length == 0){
                return;
            }

            var contacts = data[0];
            var userNumber = data[1];

            var options = {
                //url:'https://api.parse.com/1/functions/saveContacts',
                //url:'http://localhost:1337/parse/functions/saveContacts',
                url:'https://parse-server-cchat.herokuapp.com/parse/saveContacts',
                method: "POST",
                headers: {
                    'X-Parse-Application-Id': PARSE_APPLICATION_ID,
                    'X-Parse-REST-API-Key': PARSE_REST_API_KEY,
                    "Content-Type" : "application/json"
                },
                json: true,
                body: {
                    contacts: contacts,
                    userNumber: userNumber
                }
            };

            function callback(error, response, body) {
                //console.log("On parse_saveContacts callback :: response.statusCode  = " + response.statusCode );
                if (!error && response.statusCode == 200) {

                    var response = body;

                    //console.log("PARSE contacts saved: " + response.result.updatedAt );

                    socket.emit('parse_contactsSaved', response.result);
                }else{
                    console.log("On parse_saveContacts callback :: error  = " +  error );
                }
            }

            request(options, callback);

        });

        /**
         * Returns a Parse Installation
         *
         * params in the data-array:
         * objectId [String] : The objectId of the requested Installation
         *
         */
        socket.on('parse_getInstallation', function (data) {
            if(data == [] || data.length == 0){
                return;
            }

            var objectId = data[0];

            var options = {
                url:'https://api.parse.com/1/installations/' + objectId,
                headers: {
                    'X-Parse-Application-Id': PARSE_APPLICATION_ID,
                    'X-Parse-REST-API-Key': PARSE_REST_API_KEY,
                    "Content-Type" : "application/json"
                }
            };

            function callback(error, response, body) {
                if (!error && response.statusCode == 200) {
                    /**
                     * The response body is a JSON object containing all the user-provided fields,
                     * plus the createdAt, updatedAt, and objectId fields:
                     * {
                          "deviceType": "ios",
                          "deviceToken": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
                          "channels": [
                            ""
                          ],
                          "createdAt": "2012-04-28T17:41:09.106Z",
                          "updatedAt": "2012-04-28T17:41:09.106Z",
                          "objectId": "mrmBZvsErB"
                        }
                     */
                    var response = body;

                    //console.log("PARSE returned this requested installation:");
                    //console.log("createdAt: " + response.createdAt);
                    //console.log("objectId: " + response.objectId);

                    socket.emit('parse_retrieved_installation', response);
                }
            }

            request(options, callback);
        });

        /**
         * Set's the badge value in a give Parse Installation
         *
         * params in the data-array:
         * objectId [String]    : The objectId of the requested Installation
         * badgeValue [int]     : The new badge value
         */
        socket.on('parse_setBadgeNumber', function (data) {
            if(data == [] || data.length == 0){
                return;
            }

            //console.log("On parse_setBadgeNumber:: objectId = "+data[0] + ", badgeValue = "+data[1]);

            var objectId = data[0];
            var badgeValue = data[1];

            var options = {
                url:'https://api.parse.com/1/installations/' + objectId,
                method: "PUT",
                headers: {
                    'X-Parse-Application-Id': PARSE_APPLICATION_ID,
                    'X-Parse-REST-API-Key': PARSE_REST_API_KEY,
                    "Content-Type" : "application/json"
                },
                json: true,
                body: {
                    badge: badgeValue
                }
            };

            function callback(error, response, body) {
                //console.log("On parse_setBadgeNumber callback :: response.statusCode  = " + response.statusCode );
                if (!error && response.statusCode == 200) {

                    var response = body;

                    //console.log("PARSE badge number updated at: " + response.updatedAt );

                    socket.emit('parse_setBadgeNumber_complete', response);
                }else{
                    console.log("On parse_setBadgeNumber callback :: error  = " +  error );
                }
            }

            request(options, callback);
        });

        /**
         * Parse.Install of the user after the user accepts the use of push notifications
         */
        socket.on('parse_install_PushNotification', function (data) {
            if(data == [] || data.length == 0){
                return;
            }

            //console.log("On parse_install_PushNotification::"+data[0].deviceToken+"::"+data[0].deviceType);

            var deviceToken = data[0].deviceToken;
            var deviceType = data[0].deviceType;

            var options = {
                url: 'https://api.parse.com/1/installations',
                method: 'POST',
                headers: {
                    'X-Parse-Application-Id': PARSE_APPLICATION_ID,
                    'X-Parse-REST-API-Key': PARSE_REST_API_KEY,
                    "Content-Type" : "application/json"
                },
                json: true,
                body: data[0]
            };

            function callback(error, response, body) {
                //console.log("Callback function::error"+ error +":: response.statusCode:: "+response.statusCode);
                if (!error && response.statusCode == 201) {
                    // When the creation is successful, the HTTP response is a 201 Created
                    // and the Location header contains the URL for the new installation:
                    // Status: 201 Created
                    // Location: https://api.parse.com/1/installations/mrmBZvsErB

                    // The response body is a JSON object containing the objectId
                    // and the createdAt timestamp of the newly-created installation:
                    //  {
                    //      "createdAt": "2012-04-28T17:41:09.106Z",
                    //      "objectId": "mrmBZvsErB"
                    //  }
                    var response = body;

                    //console.log("PARSE PushNotification installation");
                    //console.log("createdAt: " + response.createdAt);
                    //console.log("objectId: " + response.objectId);

                    socket.emit('parse_install_PushNotification_successful', response);

                }else{

                }
            }

            request(options, callback);
        });

        /**
         * Request info about conversations saved offline
         * data is {"userId":(Number)}
         */
        socket.on('requestConversationsOffline', function (data) {
            if(data ==[] || data.length == 0){
                return;
            }

            //console.log("requestConversationsOffline:: " + data[0].userId);

            var users = db.collection('users');
            var userId = data[0].userId;
            var query = {"_id": data[0].userId};

            users.find(query).toArray(function (err, doc) { // retrieve information about user in user collection
                if (err) {
                    console.log("error requestConversationsInfo:: " + err);
                }
                //console.log("requestConversationsOffline:: no error:: " + doc[0].conversations);

                var convArray = doc[0].conversations;
                if(doc[0].conversations == null || doc[0].conversations ==[]){ // check if user has conversations
                    console.log("conversations in checkMessagesInDb :: null or empty");
                    return;
                }

                var messages = db.collection('checkmessages'); // if user has conversations, retrieve messages in those conversations
                var query = {"_id": {$in:convArray}};
                //console.log("checkMessagesInDb:: query:: " + convArray);

                messages.find(query).toArray(function (err, result) {
                    //console.log("checkMessagesInDb::" + result +"::length::"+result.length);
                    if (err) {
                        console.log("error checkMessagesInDb:: " + err);
                    }

                    //console.log("checkMessagesInDb::step 2");
                    var conversationObject = result[0];
                    if(result.length == 0 || !conversationObject.conversations){ // if there are no pending messages in do nothing
                        return;
                    }

                    //console.log("checkMessagesInDb:: step 3" + result);
                    var conversationType = "";
                    if(result.length != 0)	{ // when pending messages check if messages are from user or to user who requested
                        var conversationToIterate;
                        var studiedMessage;
                        var deliveredMessages;
                        var messagesToUser;
                        var deliveryMessages;
                        for(var i = 0; i < result.length;i++) { //iterate all the results provided by database
                            conversationToIterate = result[i];
                            console.log("requestConversationsOffline :: "+result[i]._id);
                            studiedMessage = result[i].conversations[0];
                            //TODO:SV:StudyCase: When there are no messages but there are delivered time messages!
                            deliveredMessages = result[i].deliver;
                            messagesToUser = [];
                            if (studiedMessage != null) {
                                //check what messages are for the user who requested
                                for(var k = 0; k < conversationToIterate.conversations.length; k++){
                                    /* Check every message */
                                    if (conversationToIterate.conversations[k].to == userId){
                                        //console.log("iteration::" + k +" User :: "+conversationToIterate.conversations[k].to+"");
                                        messagesToUser.push(conversationToIterate.conversations[k]);
                                    }
                                }
                                if ((messagesToUser.length != 0)) {
                                    //console.log("convId::" + conversationToIterate._id);
                                    //console.log(" User :: "+messagesToUser[0].to);
                                    //console.log(",has "+messagesToUser.length+" messages;");
                                    conversationToIterate.conversations = messagesToUser;
                                    updateConversation(conversationToIterate, userId); // send these messages to user who requested

                                    /*
                                     if(conversationToIterate.hasOwnProperty("type")){
                                     conversationType = conversationToIterate.type;
                                     }else if(studiedMessage.hasOwnProperty("conversationType")){
                                     conversationType  = studiedMessage.conversationType;
                                     }
                                     console.log("Type of conversation:: "+conversationToIterate._id+" ::type:: "+ conversationType);

                                     if(conversationType == CONVERSATION_TYPE_PUBLIC){
                                     resetConversation(conversationToIterate._id);
                                     }else if(conversationType == CONVERSATION_TYPE_PERSONAL){
                                     // Reset also the conversation if it's personal. No reason not to.
                                     resetConversation(conversationToIterate._id);
                                     // console.log("This conversation is personal, no need to delete in server");
                                     }
                                     */

                                    resetConversation(conversationToIterate._id); //empty array of conversations

                                } else {
                                    console.log("Update request from last user that send the message,userId::" + userId);
                                }
                            }else{
                                //console.log("Doc::"+conversationToIterate._id+" :: is empty ::"+studiedMessage);
                                //We send it without messages but with delivery times;
                                deliveryMessages = []; //we check if there is information about delivery for the user
                                if(deliveredMessages) {
                                    if (conversationToIterate.deliver.length != 0) {
                                        /* Check every message */
                                        for(var l = 0; l < deliveredMessages.length;l++){
                                            if (conversationToIterate.deliver[l].to == userId){
                                                deliveryMessages.push(conversationToIterate.deliver[l]);
                                            }
                                        }
                                        if ((deliveryMessages.length != 0)) {
                                            conversationToIterate.deliver = deliveryMessages;
                                            //console.log("Delivery messages ::" + deliveryMessages.length);
                                            updateConversation(conversationToIterate, userId);
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            });
        });

        /**
         *     curl -X POST \
         *     *    -H "X-Parse-Application-Id: qKF9t2KQHM28ii6tCBJRePm9Z5U12lx4pTpGCmDc" \
         *    -H "X-Parse-REST-API-Key: V6y67VEHvl4KdWUz9RyRWnwL1dS4LIB7pDvS96Vb" \
         *    -H "Content-Type: application/json" \
         *    -d '{
         *            "where": {
         *                "channels": "Giants",
         *                    "scores": true
         *           },
         *            "data": {
         *                "alert": "The Giants scored a run! The score is now 2-2."
         *            }
         *        }' \
         *      https://api.parse.com/1/push
         **/
        var sendPushNotification = function (query, notification) {

            //    #######################
            //      WORKING VERSION - Start - v.0.1.4
            //    #######################

            /* var options = {
             url: 'https://api.parse.com/1/push',
             method: 'POST',
             headers: {
             'X-Parse-Application-Id': PARSE_APPLICATION_ID,
             'X-Parse-REST-API-Key': PARSE_REST_API_KEY,
             "Content-Type" : "application/json"
             },
             json: true,
             body: {
             where: query,
             data: notification
             }
             };

             function callback(error, response, body) {
             console.log("[sendPushNotification] Callback function::error"+ error +":: response.statusCode:: "+response.statusCode);
             if (!error && response.statusCode == 200) {

             var response = body;

             console.log("PARSE PushNotification successfully sent");

             }else{
             console.log("PARSE PushNotification ERROR");
             }
             }*/

            // This has been DISABLED to now send the number of the Sender in the Notification
            //request(options, callback);

            //    #######################
            //      WORKING VERSION - End - v.0.1.4
            //    #######################

            sendPushNotificationWithSendersInfo(notification);
        };

        var sendPushNotificationWithSendersInfo = function (notification) {
            var options = {
                //url: 'https://api.parse.com/1/functions/sendPushNotification',
                //url:'http://localhost:1337/parse/functions/sendPushNotification',
                url: 'https://parse-server-cchat.herokuapp.com/parse/sendPushNotification',
                method: 'POST',
                headers: {
                    'X-Parse-Application-Id': PARSE_APPLICATION_ID,
                    'X-Parse-REST-API-Key': PARSE_REST_API_KEY,
                    "Content-Type" : "application/json"
                },
                json: true,
                body: {
                    notification: notification
                }
            };

            function callback(error, response, body) {
                //console.log("[sendPushNotification] Callback function::error"+ error +":: response.statusCode:: "+response.statusCode);
                if (!error && response.statusCode == 200) {

                    var response = body;

                    //console.log("PARSE PushNotification successfully sent");

                }else{
                    console.log("PARSE PushNotification ERROR");
                }
            }

            request(options, callback);
        };
        /**
         * updateConversation == sends pending messages for the user who requested
         * s == array of messages and deliver
         * userId == phone number of user
         * */
        var updateConversation = function (s,userId) {
            client.sockets.in(userId).emit('updatePreviousConversations', s);
        };
        /**
         * resetConversation == deletes pending messages for the user who requested
         * ids == id of conversation to delete messages
         * */
        var resetConversation = function (ids) {
            var messages = db.collection('checkmessages');
            var query = {"_id": ids};
            var options = {'upsert': true, 'new': true};
            // db.students.update( { _id: 1 }, { $pop: { scores: 1 } } )
            messages.findAndModify(query, [['_id', 1]], {$set: {conversations:[]}}, options, function (err, doc) {
                if (err) {
                    console.log("error resetConversation:: " + err);
                }

                //console.log("convId:" + ids + " reseted");
            });
        };
        /**----------end of request previous conversations-----*/

        /**
         * Request user information, right now only user information
         * Provides ids of conversations for this user
         */
        socket.on('requestConversationsInfo', function (data) {
            if(data ==[] || data.length == 0){
                return;
            }
            var users = db.collection('users');
            var query = {"_id": data[0].userId};
            users.find(query).toArray(function (err, doc) {
                if (err) {
                    console.log("error requestConversationsInfo:: " + err);
                }
                if(!doc[0].hasOwnProperty("conversations")){
                    //console.log("No conversations for this user :: "+doc[0]._id);
                    return;
                }
                if(doc[0].conversations[0] != null){
                    retrieveUserConversations(doc[0].conversations);
                }else{
                    confirmUserConversations([]);
                }
            });
        });
        /**
         * retrieveUserConversations == retrieves information of conversation in conversation collection
         * conversationsId == array of ids of user who requested
         */
        var retrieveUserConversations = function (conversationsId) {
            var conversations = db.collection('conversations');
            var query = {"_id": {$in:conversationsId}};
            conversations.find(query).toArray(function (err, doc) {
                if (err) {
                    console.log("error retrieveUserConversations:: " + err);
                }
                confirmUserConversations(doc); // send information retrieved to user who requested
            });
        };

        var confirmUserConversations = function (s) {
            socket.emit('conversationsVerified', s);
        };

        var confirmUsersVerification = function (s) {
            socket.emit('contactsVerified', s);
        };
        /**
         * Used to start a conversation, still not sure if first message is send here
         * or not. For now it creates a room for a chat.
         */

        socket.on('startConversation', function (data) {
            startConversation(data);
        });

        var startConversation = function (data) {
            var messageData = data[0];
            //console.log("startConversation required:" + messageData.convId);
            var convId = messageData.convId;
            var conversations = db.collection('conversations');
            var query = {"users": {$all: [messageData.to,messageData.from]}};
            var messageType = "";
            if(data[0].hasOwnProperty("messageType")){
                messageType = messageData.messageType;
            }
            // Check if sender and destinee have already a conversation
            conversations.find(query).toArray(function (err, doc) {
                if (err) {
                    console.log("error startConversation service:: " + err);
                }

                if(doc == null){
                    console.log("startconversation doc null");
                }else{
                    //console.log("startconversation doc length:: "+doc.length);
                    var ids = "";
                    for(var i = 0; i < doc.length; i++){
                        ids += doc[i]._id+",";
                    }
                    console.log("startconversation doc id:: "+ids);
                }
                var newPublicConv = (messageData.from != messageData.to) && (doc.length == 0);
                var newMonologue = (messageData.from == messageData.to);
                //console.log("newPublicConv :: "+newPublicConv);
                //console.log("newMonologue :: "+newMonologue);
                /**
                 * For now MONOLOGUES ARE NOT BEING STORED IN DB
                 * */
                var query;
                var options;
                var conversationType = "";
                if(newMonologue || newPublicConv){
                    if (convId === 0) { // if conversation id is 0 AND is a new conversation we continue
                        //conversation id would be current time in milliseconds + random value between 0-1000 (In case
                        //   there are more than one request at the same time (1000 to make it as close as possible to
                        //   current time and avoid conflicts with future dates
                        var id = (new Date().getTime())+Math.round((Math.random() * 1000));

                        conversationType = CONVERSATION_TYPE_PUBLIC;

                        if (messageData.hasOwnProperty("conversationType")) {
                            conversationType = messageData.conversationType;
                        }

                        //console.log("New conversation of type:: " + conversationType);

                        var conversationData = {_id: id, users: [messageData.from, messageData.to], type: conversationType};
                        query = {_id: messageData.from};
                        var toInsert = {_id: id, type: conversationType};
                        options = {'upsert': true, 'new': true};
                        //create conversation file in conversations collection
                        insertConversationToDb(conversationData);
                        //introduce information in users files
                        updateUserConversation(query, id, options);
                        query = {_id: messageData.to};

                        if (conversationType == CONVERSATION_TYPE_PUBLIC) {
                            updateUserConversation(query, id, options);
                        }
                        //create file in checkmessages
                        createMessagesDb(toInsert);
                        messageData.convId = id;
                    }
                }else if(!newPublicConv){
                    //update users information in case this conversation has been requested.
                    conversationType = CONVERSATION_TYPE_PUBLIC;
                    messageData.convId = doc[0]._id;
                    query = {_id: messageData.from};
                    options = {'upsert': true, 'new': true};
                    updateUserConversation(query, doc[0]._id, options);
                    query = {_id: messageData.to};
                    updateUserConversation(query, doc[0]._id, options);
                }else{
                    console.log("This case does not count in here where NEW MONOLOGUE IS ::  "+newMonologue);
                }
                if(messageType == "") {
                    addUserToConversationRoom(messageData); //Sends back to owner message that started conv.
                }else if(messageType == "SERVER_INFO"){ //to create a new conversation with CheckChat team message type == SERVER_INFO is used.//Special type to send messages as check chat team.
                    //in this case only new registration user is notified. Not check chat team
                    newPublicConv = true;
                    conversationType = CONVERSATION_TYPE_PUBLIC;
                    var now = new Date();
                    messageData.id = id+"@"+now.getTime().toString(36);
                    messageData.sentAt = now.toJSON();
                }
                if (conversationType == CONVERSATION_TYPE_PUBLIC) {
                    notifyDestineePublicConversation(messageData, messageData.to, newPublicConv);
                } else if (conversationType == CONVERSATION_TYPE_PERSONAL) {
                    notifyDestineePersonalConversation(messageData, messageData.to);
                }
            })
        };

        /**
         * THIS SERVICE IS NOT BEING USED!
         * */
        socket.on('joinToConversation', function (data) {
            var messageData = data[0];

            //console.log("joinToConversation required:" + messageData.convId);

            var message = {
                "from": messageData.from
                , "to": messageData.to
                , "message": messageData.message
                , 'sentAt': messageData.sentAt
                , "receivedAt": messageData.receivedAt
                , "convId": messageData.convId
                , "id": messageData.id
                , "conversationType": messageData.conversationType
                , "isTask": messageData.isTask
            };
            addUserToConversationRoom(messageData);
            deleteMessageInDb(message);
        });
        /**
         * when user lost connection there is no need to login again, confirm user has been reconnected.
         * Client side will request information save while user was offline
         * */
        socket.on('reconnect', function (data) {
            console.log("on reconnection due to socket closed:: reconnect:" + data[0].id);
            createUserRoom(data[0].id);
            socket.emit("reconnectionConfirmation", {"confirm": 1});
        });

        /**
         * createUserRoom == create a room for the socket that an user created.
         * */
        var createUserRoom = function (id) {
            //var room = findClientsSocket(client, id);
            socket.room = id;
            socket.join(id);
            //console.log("createUserRoom:::room length: " +  socket.room.length+", room:: "+id);
        };
        /**
         * addUserToConversationRoom == confirms user who started a conversation that conversation was created, returns also conversation id
         * */
        var addUserToConversationRoom = function (message) {
            //console.log("conversation exists:" + message.convId);
            var now = new Date();
            //CC-132
            message.receivedAt = now.toJSON();
            socket.emit("convJoined", {"convId": message.convId, message:message});
            //var room = findClientsSocket(client, data[0].convId);
            //console.log("addUserToConversationRoom:: room length:, room:: "+message.convId);
        };
        /**
         * notifyDestineePublicConversation == send message to socket of destinee of the message
         * data == message
         * id == verified phone number of destinee
         * newPublicConversation == boolean that tells if its a new converastion or not. (Not used)
         * */
        var  notifyDestineePublicConversation = function (data,id,newPublicConversation) {
            console.log("Conversation request to user:: "+ id);
            saveMessageInDb(data);
            //if(newPublicConversation){ //Evaluate if this if is necessary.
            //    client.sockets.in(id).emit("conversationRequest", data);
            //}else{
                sendMessageSocket(data,newPublicConversation); //Only send message socket is necessary
            //}
            //push
        };
        /**
         * notifyDestineePersonalConversation == send message to user who created a monologue
         * data == message
         * id == verified phone number of destinee
         * */
        var  notifyDestineePersonalConversation = function (data,id) {
            //console.log("Conversation request to user:: "+id);
            saveMessageInDb(data);
            client.sockets.in(id).emit("monologueRequest", data);
        };
        /**
         * with a established conversation sends messages to destinee
         * */
        socket.on('messageToRoom', function (data) {
            // console.log("startConversation required:"+data[0].message);
            var messageData = data[0];
            //console.log("addressee:" + messageData.to);
            //console.log("sender:" + messageData.from);
            sendMessageSocket(messageData,true);

        });
        /**
         * with a established conversation sends messages tasks to destinee
         * */
        socket.on('taskToUser', function (data) {
            // console.log("startConversation required:"+data[0].message);
            var messageData = data[0];
            //console.log("addressee:" + messageData.to);
            //console.log("sender:" + messageData.from);
            var notifyOwner = (messageData.conversationType == CONVERSATION_TYPE_PUBLIC);
            sendTaskSocket(messageData,notifyOwner);

        });
        /**
         * sendMessageSocket == sends message to user. also prepares push notification to be sent
         * messsageData == message to send
         * notifyOwner == boolean, if true sends this message also to user who sent message
         * this flag is used to avoid send twice the same message to user who is writing in a monologue
         * */
        var sendMessageSocket = function (messageData, notifyOwner) {
            // TODO: Change the attribute 'date' to 'createdAt'. There will be more dates like 'deliveredAt' and 'readAt'.
            var message = {
                "from": messageData.from
                , "to": messageData.to
                , "message": messageData.message
                , 'sentAt': messageData.sentAt
                , "convId": messageData.convId
                , "id": messageData.id
                , "conversationType": messageData.conversationType
                , "isTask": messageData.isTask
            };
            if(messageData.hasOwnProperty("messageType")){
                message.messageType = messageData.messageType;
                message.userName = messageData.userName;
            }

            // socket.emit("messageReceived",message);
            if(notifyOwner) { // condition when we send to others. in monologue we don't save conversations and
                // from == to. No need to notify twice
                //console.log("Notify message owner");
                saveMessageInDb(message);
                client.sockets.in(messageData.from).emit("messageReceived", message);
            }

            if(messageData.to != 0 || messageData.to != null){
                client.sockets.in(messageData.to).emit("messageReceived", message);
            }else{
                console.log("Error task in convId::"+messageData.convId+" SENDING TO "+messageData.to);
                messageData.error = "Error task in convId::"+messageData.convId+" SENDING TO "+messageData.to;
                saveErrorInDb(messageData);
            }
            //CC-400
            //Proposal.There is no need to send push notifications if user is connected.
            //if(!client.sockets.adapter.rooms[messageData.to]) {
                preparePushNotification(message, "");
            //}
            //preparePushNotification(message, "");
        };
        /**
         * sendMessageSocket == sends message task to user. also prepares push notification to be sent
         * messsageData == message to send
         * notifyOwner == boolean, if true sends this message also to user who sent message
         * this flag is used to avoid send twice the same message to user who is writing in a monologue
         * */
        var sendTaskSocket = function (messageData, notifyOwner) {
            // TODO: Change the attribute 'date' to 'createdAt'. There will be more dates like 'deliveredAt' and 'readAt'.
            var now = new Date();
            var task = {
                "from": messageData.from
                , "to": messageData.to
                , "convId": messageData.convId
                , "id": messageData.id
                , "assignee": messageData.assignee
                , "notificationCreatedAt": now.toJSON()
                , "dueDate": messageData.dueDate
                , "createdAt": messageData.createdAt
                , "solvedAt": messageData.solvedAt
                , "conversationType": messageData.conversationType
                , "isTask": messageData.isTask
                , "message": messageData.message
                , "action": messageData.action
            };

            // socket.emit("messageReceived",message);
            if(notifyOwner) {
                //console.log("Notify sendTaskSocket owner");
                saveTaskInDb(task);
                client.sockets.in(messageData.from).emit("taskReceived", task);
            }
            /**
             * Let's void this happens!*/
            if(messageData.to != 0 || messageData.to != null){
                client.sockets.in(messageData.to).emit("taskReceived", task);
            }else{
                console.log("Error message in convId::"+messageData.convId+" SENDING TO "+messageData.to);
                task.error = "Error message in convId::"+messageData.convId+" SENDING TO "+messageData.to;
                saveErrorInDb(task);
            }

            var action = 0;
            if(messageData.hasOwnProperty('action')){
                action = messageData.action;
            }

            //The default value
            var prefix = "Assigned: ";

            if (action == 0){
                //Do nothing, take the default value: "Assigned: "
            }else if (action == 1){
                prefix = "Scheduled: ";
            }else if (action == 2){
                prefix = "SOLVED: ";
            }else if (action == 3){
                prefix = "Re-opened: ";
            }else if (action == 4){
            }else if (action == 5){
            }else if (action == 6){
            }else if (action == 7){
            }else if (action == 8){
            }else if (action == 9){
                prefix = "DELETED: ";
            }

            preparePushNotification(task,prefix);
        };

        var preparePushNotification = function (message, prefix) {
            //send push notification
            var where = {
                registeredPhoneNumbers: message.to
            };

            var notification = {
                alert : prefix+message.message
                ,badge: "Increment"
                ,sound: "NewMessage"
                ,from: message.from
                ,to: message.to
                //,content-available:(iOS only) If you are a writing a Newsstand app, or an app using the Remote
                //                      Notification Background Mode introduced in iOS7 (a.k.a. "Background Push"),
                //                      set this value to 1 to trigger a background download.
                //,category:(iOS only) the identifier of the UIUserNotificationCategory for this push notification.
                //,uri:(Android only) an optional field that contains a URI. When the notification is opened, an
                //     Activity associated with opening the URI is launched.
                //,title:(Android only) the value displayed in the Android system tray notification.

            };

            sendPushNotification(where, notification);
        };
        /**
         * sends monologue message to user
         * data == message to send
         * */
        socket.on('monologueToRoom', function (data) {
            // console.log("startConversation required:"+data[0].message);
            var messageData = data[0];
            //console.log("addressee:" + messageData.to);
            //console.log("sender:" + messageData.from);

            var message = {
                "from": messageData.from
                , "to": messageData.to
                , "message": messageData.message
                , 'sentAt': messageData.sentAt
                , "convId": messageData.convId
                , "id": messageData.id
                , "conversationType": messageData.conversationType
                , "isTask": messageData.isTask
            };
            var now = new Date();
            message.receivedAt = now.toJSON();
            // socket.emit("messageReceived",message);
            //saveMessageInDb(message);
            /**
             * No need to save messages in db. monologues are local
             * */
            client.sockets.in(messageData.to).emit("messageReceived", message);
        });
        /**
         * delete message in database when user confirms reception of message
         * data == message to delete
         * */
        socket.on('messageACK', function (data) {
            //console.log("user received mesage");
            message = data[0];
            // TODO:    This is passing the convId, it should pass the id.
            //          Necessary to ensure which message is being deleted. Better than poping the last from an Array.
            deleteMessageInDb(message);
        });
        /**
         * An array of deliver messages is received with information when messages were received and seen
         * then introduced
         * data == Array
         * */
        socket.on('messageTimeDeliver', function (data) {
                var message = data[0];
                if(message == null || message.length == 0){
                    return;
                }
                var convId = message[0].convId;
                var destinee = message[0].to;
                if(convId == 0){
                    //console.log("conversation id not updated,check it");
                }

                // Save NOW as the "receivedAt" property of the message

                //console.log(
                //    "Saving the message: " + message[0].id
                //    + "  at:" + message[0].deliveredAt
                //    + "   with message: " + message[0].to
                //);

                var messages = db.collection('checkmessages');
                var query = {"_id": convId};
                var inbox = {"deliver": { $each : message }};
                var options = {'upsert': true, 'new': true};
                messages.findAndModify(
                    query
                    , [['_id', 1]]
                    , {$addToSet: inbox}
                    , options
                    , function (err, doc) {
                        if (err) {
                            console.log("error in Saving Message in db::" + err);
                        }

                        //console.log("convId:" + convId + " updated with message ::");
                    });
                if(message[0].seenAt != ""){
                    socket.emit('messageTimeMessageConfirm',message);
                }
                //Part 2:Send it to the owner of the message and delete it:
                client.sockets.in(destinee).emit("messageTimeMessageConfirm", message);
            }
        );

        /**
         * When user received delivered data confirms and allows to delete this information from server
         * data == message
         * */
        socket.on("originMessageTimeConfirm",function (data) {
                var message = data[0];
                var convId = message[0].convId;
                var messages = db.collection('checkmessages');
                var query = {"_id": convId};
                var options = {'upsert': true, 'new': true};
                for(var i = 0; i < message.length; i++ ) {
                    messages.findAndModify(
                        query
                        , [['_id', 1]]
                        , {$pull:  { deliver: { id: message[i].id } } }
                        , options
                        , function (err, doc) {
                            if (err) {
                                console.log("error in Saving Message in db::" + err);
                            }

                            //console.log("convId:" + convId + " updated with message ::");
                        });
                }
            }
        );
        /**
         * introduce information about user. From user name, profile picture information(not used right now)
         * */
        socket.on("userInfoUpdate",function (data) {
                var updateInfoData = data[0];
                var userId = updateInfoData.userId;
                var messages = db.collection('users');
                var query = {"_id": userId};
                var updateInfo;
                var optionToUpdate;
                /**
                 * 1000 for Update UserName
                 * */
                var updateCode;
                if(updateInfoData.infoUpdate == "profilePictureInformation"){
                    optionToUpdate = {"profilePictureInfo":""};
                    optionToUpdate.profilePictureInfo = updateInfoData.serverInfo;
                    updateInfo = {"$set":""};
                    updateInfo.$set =  optionToUpdate;
                }else if(updateInfoData.infoUpdate == "username"){
                    optionToUpdate = {"userName":""};
                    optionToUpdate.userName = updateInfoData.userName;
                    updateInfo = {"$set":""};
                    updateInfo.$set =  optionToUpdate;
                    updateCode = 1000;
                }
                var options = {'upsert': true, 'new': true};
                messages.findAndModify(
                    query
                    , [['_id', 1]]
                    , updateInfo
                    , options
                    , function (err, doc) {
                        if (err) {
                            console.log("error in Saving Message in db::" + err);
                            socket.emit('userInfoUpdateConfirmation', {"data":"User information NOT updated", "code":-1});
                        }
                        socket.emit('userInfoUpdateConfirmation', {"data":"User information updated", "code":10000});
                    });
            }
        );
        /**
         * Used to verify purchases. Not finalized
         * */
        socket.on("verifyUserPurchase",function (data) {
                var purchaseInfoData = data[0];
                //We need userId
                var userId = purchaseInfoData.userId;
                //We need user collection
                var users = db.collection('users');
                //Query, info to update and options
                var query = {"_id": userId};
                var updateInfo;
                var optionToUpdate;
                var device = purchaseInfoData.device;
                var receipt = purchaseInfoData.receipt;
                switch (device){
                    case "iOS":
                        inAppPurchaseVerification.setup(function (error) {
                            if (error) {
                                console.error('something went wrong...');
                                socket.emit("purchaseVerification",[{"hasError":true,"message":"IAP Verification Service could not be set up,try later","code": 5000,"error":error,"response":""}]);
                                return;
                            }
                            // iap is ready
                            // It can be a string
                            inAppPurchaseVerification.validate(inAppPurchaseVerification.APPLE, receipt, function (err, appleRes) {
                                if (err) {
                                    console.error(err);
                                    socket.emit("purchaseVerification",[{"hasError":true,"message":"IAP Verification Service could not be set up,try later","code": 5001,"error":error,"response":""}]);
                                    return;
                                }
                                if (inAppPurchaseVerification.isValidated(appRes)) {
                                    socket.emit("purchaseVerification",[{"message":"Purchase verified","code": 1000,"response":appRes}]);
                                    // SAVE IN DB
                                    // yay good!
                                }
                            });
                        });
                        break;
                    case "Android":
                        inAppPurchaseVerification.setup(function (error) {
                            if (error) {
                                console.error('something went wrong...');
                                socket.emit("purchaseVerification",[{"hasError":true,"message":"IAP Verification Service could not be set up,try later","code": 5000,"error":error,"response":""}]);
                                return;
                            }
                            /*
                             google receipt must be provided as an object
                             {
                             "data": "{stringified data object}",
                             "signature": "signature from google"
                             }
                             */
                            // iap is ready
                            inAppPurchaseVerification.validate(inAppPurchaseVerification.GOOGLE, receipt, function (err, googleRes) {
                                if (err) {
                                    console.error(err);
                                    socket.emit("purchaseVerification",[{"hasError":true,"message":"IAP Verification Service could not be set up,try later","code": 5001,"error":error,"response":""}]);
                                    return;
                                }
                                if (inAppPurchaseVerification.isValidated(googleRes)) {
                                    socket.emit("purchaseVerification",[{"message":"Purchase verified","code": 1000,"response":googleRes}]);
                                    // SAVE IN DB
                                    // yay good!
                                }
                            });
                        });
                        break;
                    case "Windows":
                        break;
                    default :
                        console.log("Verification required cannot be handled, device unkown :: "+device);
                }
                /**
                 * 1010 for Purchase
                 * Accessig to DB disabled for now
                 * */
                //var updateCode = 1010;
                //optionToUpdate = {"purchase":"","product":""};
                //optionToUpdate.purchase = purchaseInfoData.purchase;
                //optionToUpdate.product = purchaseInfoData.product;
                //updateInfo = {"$set":""};
                //updateInfo.$set =  optionToUpdate;
                //var options = {'upsert': true, 'new': true};
                //messages.findAndModify(
                //    query
                //    , [['_id', 1]]
                //    , updateInfo
                //    , options
                //    , function (err, doc) {
                //        if (err) {
                //            console.log("error in Saving Message in db::" + err);
                //            socket.emit('userInfoUpdateConfirmation', {"data":"User information NOT updated", "code":-1});
                //        }
                //        socket.emit('userInfoUpdateConfirmation', {"data":"User information updated", "code":10000});
                //    });
            }
        );
        /**
         * Notifies when an user is typing in a conversations
         * */
        socket.on('userIsTyping', function (data) {
            // immediately forwarded
            //Message format {"convId":"","isTyping":true/false}
            var messageData = data[0];
            var numbersToSend = messageData.to; //Array with numbers to send typing state.
            //console.log("Numbers "+numbersToSend.toString());
            for(var i = 0; i < numbersToSend.length; i++) {
                client.sockets.in(numbersToSend[i]).emit("userIsTyping", messageData);
            }
        });
        //Profile picture version
        /**
         * Service to upload information about profile picture in cloudinary in profilePictureVersions collection
         *
         * */
        socket.on('uploadProfilePictureVersion', function (data) {

            //var projection = {"_id":1,"userName":1};
            console.log("uploadProfilePictureVersion");
            var profilePictureVersions = db.collection('profilePictureVersions');
            var userId = data[0].id; //phone number
            var query = {"_id": userId};
            var userData = data[0];
            var now = new Date();
            userData.lastUpdated = now.toJSON();
            //console.log("query :: "+JSON.stringify(query));
            //console.log("data :: "+JSON.stringify(userData));
            var options = {'upsert': true, 'new': true};
            profilePictureVersions.findAndModify(
                query
                , [['_id', 1]]
                , {$set: {data: userData}}
                , options
                , function (err, doc) {
                    if (err) {
                        console.log("error in Saving Message in db::" + err);
                    }

                    //console.log("convId:" + convId + " updated with message ::" + message.message);
                });
        });
        /**
         * Provides to user all information about profile pictures of verified contacts
         *
         * */
        socket.on('requestProfilePictureVersions', function (data) {

            var profilePictureVersions = db.collection('profilePictureVersions');
            var userId = data[0].id;
            var query = {"_id": {$in:data[0].verifiedContacts}};
            var projection = {"data":1};
            profilePictureVersions.find(query,projection).toArray(function (err, doc) {
                if (err) {
                    console.log("error verifyContacts:: " + err);
                }
                client.sockets.in(userId).emit('profilePicturesVersion', doc);
            });
        });
        //Test
        socket.emit('test', {"connected":true,"version":version});
    });
}
