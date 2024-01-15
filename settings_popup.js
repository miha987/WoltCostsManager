document.querySelector('#save-stripe-settings-btn').addEventListener('click', (e) => {
    let apiKey = document.querySelector("#stripe-api-key").value;
    let groupId = document.querySelector("#stripe-group-id").value;

    // TODO - add validation

    let stripeSettingsObj = {
        apiKey: apiKey,
        groupId: groupId,
    }

    chrome.runtime.sendMessage({
        type: "saveStripeSettings",
        stripeSettingsObj: stripeSettingsObj
    });
});


chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
    if (data.type == 'setStripeSettings') {
        // TODO - add validation
        document.querySelector("#stripe-api-key").value = data.stripeSettings.apiKey;
        document.querySelector("#stripe-group-id").value = data.stripeSettings.groupId;
    }
});


function getStripeSettings() {
    chrome.runtime.sendMessage({type: "getStripeSettings"});
}

getStripeSettings();