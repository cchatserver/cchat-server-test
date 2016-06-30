$(document).ready(function(){

      //Create socket client
      var socket = io.connect();

      
      //User registration form
      $('#formUser').submit(function(){
        var datArray = {};        
        
        var usr = $('#username').val();
        var password = $('#password').val();
        var phone =  $('#phone').val();
        var country = $('#codeCountry').val();

        datArray = [{'id': phone, 'userName': usr, 'pwd': password, 'confirmation': {'phone': phone, 'countryCode': country}}];

        //alert("Info: " + $('#username').val());
        
        //Send to server
        socket.emit('preLogin', datArray);

      });


      //User confirmation form
      $('#formConfirmation').submit(function(){
        
        var datArray = {};        
        var phoneConfirmation =  $('#phoneConfirmation').val();
        var codeConfirmation = $('#codeConfirmation').val();

        datArray = [{'id': phoneConfirmation, 'code': codeConfirmation}];

        //Send to server
        socket.emit('codeConfirmation', datArray);
      });

      //User Verify Contacts
      $('#formVerifyContacts').submit(function(){
        
        var phoneVerifyContacts =  $('#phoneVerifyContacts').val();        

        datArray = [];
        datArray.push(phoneVerifyContacts);

        //Send to server
        socket.emit('verifyContacts', datArray);
      });
     
     //Listen to server
      socket.on('contactsVerified', function(data){
       
       if (typeof data === "undefined") {
         alert("undefined");
       }
       else {
          var number = data[0]._id;
          var userName = data[0].userName;
          alert("Number: " + number +"\n Username: " + userName);
          
        }
       /*
       $.each(data, function( key, value ) {
        alert( key + ": " + value );
      });
      */      
      
      });

    });