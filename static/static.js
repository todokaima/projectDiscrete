// Helper function to get CSRF token from cookies, got chat GPTs' help for this
function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    return csrfToken;
}
document.getElementById('register-form').addEventListener('submit', function (event) {
    event.preventDefault();  // we don't want "" to be submitted
    // all the data that is going to be available for the user registration to the back end
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        friend_name: document.getElementById('friend_name').value,
        friend_email: document.getElementById('friend_email').value
    };
    const responseDiv = document.getElementById('response');

    // initiating the POST method
    fetch("/register/", {
        method: "POST",
//we need to add the user to the db so we need to send information back
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),  // CSRF token from the form
        },
        body: JSON.stringify(formData)  // we convert the data to JSON
    })
    .then(response => response.json())  //and we are expecting a reply from the &
    //&server thisis going tobe the chatID
    .then(data => {
        if (data.success) {
            // go to the chatroom you initiated
            responseDiv.innerHTML = `
                <p>Chat successfully created!</p>
                <p>Chat ID: <strong>${data.chat_id}</strong></p>
                <form id="chat-form" method="GET" action="/chat/${data.chat_id}/"> //this links to the appropriate view
                    <button type="submit">Go to Chat Room</button>
                </form> //we create this go to chat room after it has been created and an Id HAS been set
            `;
        } else {
            // exception handling in order not to get a crash for a simple &
            responseDiv.innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
        }
    }) //& user misinput
    .catch(error => {
        console.error("Error:", error);
        responseDiv.innerHTML = `<p style="color:red;">Failed to register. Try again later.</p>`;
    }); //handles all kind of basic problems
});
