document.querySelector('#save-stripe-settings-btn').addEventListener('click', (e) => {
    let apiKey = document.querySelector("#stripe-api-key").value;
    let groupId = document.querySelector("#stripe-group-id").value;

    // TODO - add validation

    let stripeSettingsObj = {
        apiKey: apiKey,
        groupId: groupId,
    }

    console.log("CLICKED!!", stripeSettingsObj);

    chrome.runtime.sendMessage({
        type: "saveStripeSettings",
        stripeSettingsObj: stripeSettingsObj
    });
});


chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
    if (data.type == 'setStripeSettings') {
        console.log("GOT STRIPE SETTINGS", data);

        // TODO - add validation
        document.querySelector("#stripe-api-key").value = data.stripeSettings.apiKey;
        document.querySelector("#stripe-group-id").value = data.stripeSettings.groupId;
    }
});
// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//         if (request.msg === "something_completed") {
//             //  To do something
//             console.log(request.data.subject)
//             console.log(request.data.content)
//         }
//     }
// );

function getStripeSettings() {
    chrome.runtime.sendMessage({type: "getStripeSettings"});
}

getStripeSettings();