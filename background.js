let apiKey = ''; // This is retreived from users input into popup
let groupId = 0; // This is retreived from users input into popup
let splitwiseBaseUrl = 'https://secure.splitwise.com/api/v3.0';

retreiveStripeSettings();

// chrome.runtime.onInstalled.addListener(() => {
// 	console.log('TEST!');
// });

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {

    if (data.type == 'getGroupUsers') {
        console.log("GETING GROUP USERS");
        getUsersFromSplitwiseGroup();
    }
    
    if (data.type == 'settleCosts') {
        console.log("SETTLING COSTS IN THE BACKGROUND");
        settleCosts(data.costsObj);
    }

	if (data.type == 'getStripeSettings') {
        console.log("GETING STRIPE SETTINGS");
        getStripeSettings();
    }

	if (data.type == 'saveStripeSettings') {
        console.log("SAVING STRIPE SETTINGS");
        saveStripeSettings(data.stripeSettingsObj);
    }

    sendResponse();
});

function settleCosts(costs) {
	let deliveryShare = null;
	let deliveryShareReminder = null;
	let uniquePersonsIds = null;

	if (costs.serviceFee) 
		costs.deliveryFee = (parseFloat(costs.deliveryFee) + parseFloat(costs.serviceFee)).toString();

	if (costs.deliveryFee) {
		let personsIdsArr = costs.paid_for.map(o => o.id*1);
		// personsIdsArr.push(costs.paid_by_person_id*1);

		uniquePersonsIds = personsIdsArr.filter((value, index, arr) => {
			return arr.indexOf(value) === index;
		});

		uniquePersonsIds = uniquePersonsIds.filter(id => id != -1);

		deliveryShareFloat = (parseFloat(costs.deliveryFee) / uniquePersonsIds.length).toFixed(2);
		deliveryShare = deliveryShareFloat.toString();

		// let deliveryShareReminder = parseFloat(costs.deliveryFee) - (deliveryShareFloat * uniquePersonsIds.length);
		let deliveryShareMultipleRounded = Math.round(((deliveryShareFloat * uniquePersonsIds.length) + Number.EPSILON) * 100) / 100;
		deliveryShareReminder =  (parseFloat(costs.deliveryFee) - deliveryShareMultipleRounded + Number.EPSILON).toFixed(2);
	}

	let numberOfRequestsMade = 0;
	let numberOfRequestsToMake = costs.paid_for.filter(o => o.id*1 != costs.paid_by_person_id*1 && o.id*1 != -1).length;

	if (deliveryShare)
		numberOfRequestsToMake += 1;


	costs.paid_for.forEach(order =>  {
		if (order.id*1 == costs.paid_by_person_id*1 || order.id*1 == -1)
			return;

		let expanseObj = {
			cost: order.price,
			description: `Wolt order - ${order.itemName}`,
			repeat_interval: "never",
			currency_code: "EUR",
			group_id: groupId,
			users__0__user_id: order.id,
			users__0__paid_share: "0",
			users__0__owed_share: order.price,
			users__1__user_id: costs.paid_by_person_id,
			users__1__paid_share: order.price,
			users__1__owed_share: "0",
		};

		makeSplitwisePOSTRequest(`/create_expense`, expanseObj, resp => {
			iterateSettleCostsRequests();
		});

	});

	if (deliveryShare) {
		let deliveryExpanseObj = {
			cost: costs.deliveryFee,
			description: "Wolt order delivery fee",
			repeat_interval: "never",
			currency_code: "EUR",
			group_id: groupId,
			users__0__user_id: costs.paid_by_person_id,
			users__0__paid_share: costs.deliveryFee,
			users__0__owed_share: uniquePersonsIds.includes(costs.paid_by_person_id*1) ? deliveryShare : '0'
		};

		let user_counter = 1;

		for (var i = 0; i < uniquePersonsIds.length; i++) {
			if (costs.paid_by_person_id*1 == uniquePersonsIds[i])
				continue;

			deliveryExpanseObj[`users__${user_counter}__user_id`] = uniquePersonsIds[i];
			deliveryExpanseObj[`users__${user_counter}__paid_share`] = '0';
			deliveryExpanseObj[`users__${user_counter}__owed_share`] = user_counter > 1 ? deliveryShare : (deliveryShare*1 + deliveryShareReminder*1).toString();

			user_counter += 1;
		}

		makeSplitwisePOSTRequest(`/create_expense`, deliveryExpanseObj, resp => {
			iterateSettleCostsRequests();
		});
	}

	function iterateSettleCostsRequests() {
		numberOfRequestsMade +=1;

		if (numberOfRequestsMade == numberOfRequestsToMake)
			finishedSettlingCosts()
	}
}

function saveStripeSettings(stripeSettings) {
	// TODO make validation

	chrome.storage.local.set({ 
		"stripeApiKey": stripeSettings.apiKey, 
		"stripeGroupId": stripeSettings.groupId 
	}, function(){
		retreiveStripeSettings();
	});
}

function retreiveStripeSettings() {
	// TODO make validation

	chrome.storage.local.get(["stripeApiKey", "stripeGroupId"], function(items) {
		apiKey = items.stripeApiKey;
		groupId = items.stripeGroupId;

		sendStripeSettings();
	});
}

async function finishedSettlingCosts() {
	let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

	chrome.tabs.sendMessage(tab.id, {
		type: "finishedSettleCosts"
	});
}

function getUsersFromSplitwiseGroup() {
	makeSplitwiseGETRequest(`/get_group/${groupId}`, async resp => {
		// console.log(resp);
		let groupUsers = resp.group.members.map(member => {
			return {
				id: member.id,
				name: `${member.first_name ? member.first_name : ''} ${member.last_name ? member.last_name : ''}`
			}
		});

		let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

		chrome.tabs.sendMessage(tab.id, {
			type: "setGroupUsers",
			groupUsers: groupUsers
		});

	});
}

function getStripeSettings() {
	sendStripeSettings();
}

function sendStripeSettings() {
	chrome.runtime.sendMessage({
		type: "setStripeSettings",
		stripeSettings: {
			"apiKey" : apiKey,
			"groupId" : groupId
		}
	});
}

function makeSplitwiseGETRequest(path, callback)
{
	let url = `${splitwiseBaseUrl}${path}`;

	fetch(url, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${apiKey}`,
			"Content-type": "application/json;charset=UTF-8"
		}
	})
	.then(response => response.json()) 
	.then(json => callback(json)) 
	.catch(err => console.log(err));
}

function makeSplitwisePOSTRequest(path, payload, callback)
{
	let url = `${splitwiseBaseUrl}${path}`;

	fetch(url, {
		method: "POST",
		headers: {
			"Authorization": `Bearer ${apiKey}`,
			"Content-type": "application/json;charset=UTF-8",
			'Accept': 'application/json',
		},
		body: JSON.stringify(payload)
	})
	.then(response => response.json()) 
	.then(json => callback(json)) 
	.catch(err => console.log(err));
}