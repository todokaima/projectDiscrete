document.addEventListener("DOMContentLoaded", function () {
    // From now on some data about the actual chatroom are able to be called and the chatID is learned
    const chatId = document.getElementById("chat_id").textContent; // Get chat ID
    const messagePostDiv = document.getElementById("new");
    const messageInput = document.getElementById("message-text");
    const sendMessageButton = document.getElementById("post_message");

    const dictionary = {
        'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9,
        'j': 10, 'k': 11, 'l': 12, 'm': 13, 'n': 14, 'o': 15, 'p': 16, 'q': 17, 'r': 18,
        's': 19, 't': 20, 'u': 21, 'v': 22, 'w': 23, 'x': 24, 'y': 25, 'z': 26,
        ' ': 27, '.': 28, ',': 29, '!': 30, '0': 31, '1': 32, '2': 33, '3': 34, '4': 35,
        '5': 36, '6': 37, '7': 38, '8': 39, '9': 40
    };
    const reverseDictionary = {
        1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e', 6: 'f', 7: 'g', 8: 'h', 9: 'i',
        10: 'j', 11: 'k', 12: 'l', 13: 'm', 14: 'n', 15: 'o', 16: 'p', 17: 'q', 18: 'r',
        19: 's', 20: 't', 21: 'u', 22: 'v', 23: 'w', 24: 'x', 25: 'y', 26: 'z',
        27: ' ', 28: '.', 29: ',', 30: '!', 31: '0', 32: '1', 33: '2', 34: '3', 35: '4',
        36: '5', 37: '6', 38: '7', 39: '8', 40: '9'
    }; //this is the basis for the encoding

    // like in the python digital signature this is what makes this all possible
    function modExp(base, exponent, modulus) {
        let result = 1;
        base = base % modulus; //this code is explained in the digital signature app
        while (exponent > 0) {
            if (exponent % 2 === 1) {
                result = (result * base) % modulus;
            }
            exponent = Math.floor(exponent / 2);
            base = (base * base) % modulus;
        }
        return result;
    }

    function encryptMessage(message, privateD, privateN) {
        //the text is broken from a string to a series of characters -->
        //these characters get a number with the dictionary-->
        //rsa encryption is done upon them with the senders private key.
        let encryptedMessage = [];
        for (let char of message) {
            let num = dictionary[char];
            if (num === undefined) {
                console.error(`Character not found in dictionary: ${char}`);
                continue; //characters that have not been encoded will not be converter properly
            }
            let encryptedChar = modExp(num, privateD, privateN); //we call the encrypt function for each character
            encryptedMessage.push(encryptedChar); //and the ciphers are added together
        }
        let encryptedText = encryptedMessage.join('-'); //where the numbers are joined with the delimiteer
        console.log("Encrypted message (with - delimiter):", encryptedText); //for debugging - can be accessed though inspect element
        return encryptedText;
    }

    function decryptMessage(myTag, mykE, mykN, otkE, otkN, encryptedText, encryptedTextTag) {
        let encryptedNumbers = encryptedText.split('-').map(Number); //continuing where we left off we split the numbers, this is what the delimiter is good for
        let decryptedNumbers = encryptedNumbers.map(c => {
            if (myTag === encryptedTextTag) { //if you are the one who has sent the message your public key is going to be used
                return modExp(c, mykE, mykN);  // here the same modExp function is used, rsa is "symmetric" to this extent
            } else {
                return modExp(c, otkE, otkN);  //if I am not the original sender then I must use the other persons keys
            }
        });
        //this is where the chat room could become more functional
        //one can allow to have multiple users
        //with the tags each user of the chat room will be able to decrypt everyone else's messages correctly and many users can be in the room and communicate at the same time,
        //&&actually the same is true right now as well, but only two people can read each others messages,
        //&they wont be able to read the other people messages

        let decryptedMessage = decryptedNumbers.map(num => reverseDictionary[num] || '?').join('');
        //now we reconstruct the message and it should
        return decryptedMessage;
    }

    // here is where the GET method starts & and the calls for the decryption are made
    function loadMessages() {
        fetch(`/chat/${chatId}/get_messages/`) //defining the meeting point for the GET method, this is going to use a specific view.
            .then(response => response.json()) //we are expecting a response, formatted in json.
            .then(data => {
                if (data.success) {
                    messagePostDiv.innerHTML = "";  // a bit redundant, but the code overall is simpler

                    const myTag = document.getElementById("role").value;  // My tag
                    const mykE = parseInt(document.getElementById("private-key-e").value, 10);  // public exponent
                    const mykN = parseInt(document.getElementById("private-key-n").value, 10);  // private/public moduli
                    const otkE = parseInt(document.getElementById("other-public-key-e").value, 10);  // stranger's public exponent
                    const otkN = parseInt(document.getElementById("other-public-key-n").value, 10);  // stranger's private/public exponent

                    // the below function is used to open up the json response to a list, so that we can access them one by one
                    let messagesTuple = data.messages.map(msg => {
                        let decryptedMessage = decryptMessage(myTag, mykE, mykN, otkE, otkN, msg.text, msg.tag);
                        //the decryptMessage function has inside it a check for the tags &
                        //&sees who's tag to use based on the logic described earlier
                        //&we could easily change that for "multichannel" communication
                        return [msg.timestamp, msg.tag, decryptedMessage];
                    });
                    //the code block below is used to
                    messagesTuple.forEach(([timestamp, tag, decryptedMessage]) => {
                        messagePostDiv.innerHTML += `<p><strong>${timestamp} [${tag}]</strong>: ${decryptedMessage}</p>`;
                    });
                } else {
                    console.error("Error:", data.error);
                }
            }) //chatGPT helped with the exceptions and error handling, this is not used if all the values are set properly by the user
            //&however it would crash if these checks are not here by small mistakes and accidental inputs of the user
            .catch(error => console.error("Error:", error));
    }
        // we now add an eventListener to the send message button:
        //&it's going to initialize a POST method for storing the message on the database table for messages
    sendMessageButton.addEventListener("click", function () {
        const text = messageInput.value.trim(); //the button is clicked and the message is taken, and the form for the text cleared
        const tag = document.getElementById("role").value; // we are going to need to use the user's tag

        let myTag = document.getElementById("role").value; // Your tag (A or B)
        let othersTag = (myTag === 'A') ? 'B' : 'A'; // If your tag is 'A', others is 'B', and vice versa
//otkE means others E key
//otkD means others D key
//mykE means my E key
//mykD means my D key
        let mykE = parseInt(document.getElementById("private-key-e").value, 10);
        let mykD = parseInt(document.getElementById("private-key-d").value, 10);
        let mykN = parseInt(document.getElementById("private-key-n").value, 10);

    let otkE = parseInt(document.getElementById("other-public-key-e").value, 10);
    let otkN = parseInt(document.getElementById("other-public-key-n").value, 10);

        const encryptedMessage = encryptMessage(text, mykD, mykN); //THIS IS WHERE THE ENCRYPTION IS HAPPENING!!!!!!!
        //on our way to the database we encrypt the message
        fetch(`/chat/${chatId}/post_message/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken(), // Get CSRF token
            },
            body: JSON.stringify({ text: encryptedMessage, tag: tag }) // this is the actual the json packet will transfer to the back end
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                messageInput.value = "";  // the text input field is cleared
                loadMessages();  // a refresh is automatically applied when sending a message
            } else {
                alert("Error : " + data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Failed.");
        });
    });

    // Function to get CSRF token
    function getCSRFToken() {
        return document.querySelector("[name=csrfmiddlewaretoken]").value;
    }

    loadMessages(); // load messages once because the page has loaded
    setInterval(loadMessages, 5000);  // Reload messages every 5 seconds
    //so that we can get the same function as a normal chat app,
    //only with a little bit of lag))))))))))))))))))))
});