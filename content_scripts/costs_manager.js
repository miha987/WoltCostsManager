(function() {
	let groupUsers = [];

	let groupUsersSet = false;
	let componentInitialized = false;
	let onCheckout = false;

	let numberOfSplitsMapping = {};


	function getUsersFromSplitwiseGroup() {
	    chrome.runtime.sendMessage({type: "getGroupUsers"});
	}

	function generatePayForPersonDropdownHTML(price, itemName, canBeRemoved=false) {
		return `<select data-price="${price}" data-item_name="${itemName}" class="pay-for-person-select" style="border: 1px solid #e4e4e4; cursor: pointer; margin-top: 10px;">
				${(groupUsers.map(person => {
					return `<option value="${person.id}">${person.name}</option>`;
				})).join('')}
		</select>
		<div class="pay-for-person-price-label" style="margin-top: 10px; margin-left: 7px;">${price}€</div>
		${canBeRemoved ? '<div class="pay-for-person-split-cancel" style="background: #E74C3C; margin-top: 10px; margin-left: 7px; border-radius: 5px; padding: 1px 7px; color: white; font-size: 14px; font-weight: 700; cursor: pointer;">X</div>' : '' }`;
	}

	function generatePayForPersoDropdownElement(costsDropdownsContainer, price, itemName, canBeRemoved) {
		let payForPersonContainerElement = document.createElement("div");
		payForPersonContainerElement.classList.add('pay-for-person-container');

		payForPersonContainerElement.style.display = 'flex';
		payForPersonContainerElement.style.alignItems = 'center';

		console.log("THIS PRICE?1", price);

		let payForPersonDropdownHTML = generatePayForPersonDropdownHTML(price, itemName, canBeRemoved);

		payForPersonContainerElement.innerHTML = payForPersonDropdownHTML;

		if (canBeRemoved) {
			let cancelSplitBtn = payForPersonContainerElement.querySelector('.pay-for-person-split-cancel');

			cancelSplitBtn.addEventListener('click', e => {
				e.preventDefault();
				e.stopPropagation();

				removeCostSplitFromItem(costsDropdownsContainer, payForPersonContainerElement);
			});
		}

		return payForPersonContainerElement;
	}

	function generateItemCostsContainerElement(price, itemName, splitByNum) {
		let itemCostsContainerElement = document.createElement("div");
		itemCostsContainerElement.classList.add('item-costs-container');

		itemCostsContainerElement.style.borderBottom = '2px solid #e4e4e4';
		itemCostsContainerElement.style.paddingBottom = '10px';

		itemCostsContainerElement.dataset.price = price;

		let costsDropdownsContainer = document.createElement("div");
		costsDropdownsContainer.classList.add('costs-dropdowns-container');

		for (var i = 0; i < splitByNum; i++) {
			console.log("THIS PRICE?2", price);
			let payForPersonContainerElement = generatePayForPersoDropdownElement(costsDropdownsContainer, price, itemName, false);
			costsDropdownsContainer.appendChild(payForPersonContainerElement)
		}

		itemCostsContainerElement.appendChild(costsDropdownsContainer);

		let splitCostsBtnElement = document.createElement("div");
		
		splitCostsBtnElement.classList.add('split-costs-btn');
		splitCostsBtnElement.innerHTML = 'Split cost';
		// splitCostsBtnElement.style.textAlign = 'center';
		// splitCostsBtnElement.style.padding = '10px 0px';
		splitCostsBtnElement.style.textAlign =  'center';
		splitCostsBtnElement.style.padding =  '3px 10px';
		splitCostsBtnElement.style.background =  '#1fa9e4';
		splitCostsBtnElement.style.cursor =  'pointer';
		splitCostsBtnElement.style.borderRadius =  '8px';
		splitCostsBtnElement.style.fontSize =  '14px';
		splitCostsBtnElement.style.fontWeight =  '500';
		splitCostsBtnElement.style.color =  '#fff';
		splitCostsBtnElement.style.margin =  '12px auto 3px';
		splitCostsBtnElement.style.width =  'fit-content';

		splitCostsBtnElement.addEventListener('click', e => {
			e.preventDefault();
			e.stopPropagation();

			addCostSplitToItem(itemCostsContainerElement, itemName);
		});

		itemCostsContainerElement.appendChild(splitCostsBtnElement);

		return itemCostsContainerElement;
	}

	function calculateCostsForItem(itemCostsContainer) {
		let itemDropdownContainers = itemCostsContainer.querySelectorAll('.pay-for-person-container');
		// let itemDropdownContainers = itemCostsContainer.querySelectorAll('.pay-for-person-select');

		let itemPrice = itemCostsContainer.dataset.price;
		let numberOfSplits = itemDropdownContainers.length;

		let priceShareFloat = (parseFloat(itemPrice*1) / numberOfSplits).toFixed(2);
		let priceShare = priceShareFloat.toString();

		let priceShareMultipleRounded = Math.round(((priceShareFloat * numberOfSplits) + Number.EPSILON) * 100) / 100;
		let priceShareReminder =  (parseFloat(itemPrice) - priceShareMultipleRounded + Number.EPSILON).toFixed(2);

		console.log("CONTAINERS", itemDropdownContainers);

		for (var i = 0; i < itemDropdownContainers.length; i++) {
			let itemDropdown = itemDropdownContainers[i].querySelector('.pay-for-person-select');
			let itemPriceLabel = itemDropdownContainers[i].querySelector('.pay-for-person-price-label');
			console.log("DD", itemDropdown);
			console.log("LB", itemPriceLabel);

			let newPrice = priceShare;

			if (i == 0)
				newPrice = (priceShare*1 + priceShareReminder*1).toFixed(2).toString();

			console.log("NEW PRICEE!", newPrice);

			itemDropdown.dataset.price = newPrice;
			itemPriceLabel.innerHTML = `${newPrice}€`;
		}
	}

	function addCostSplitToItem(itemCostsContainer, itemName) {
		let costsDropdownsContainer = itemCostsContainer.querySelector('.costs-dropdowns-container');
		let payForPersonContainerElement = generatePayForPersoDropdownElement(itemCostsContainer, 1, itemName, true);

		payForPersonContainerElement.querySelector('.pay-for-person-select').addEventListener('click', e => {
			e.preventDefault();
			e.stopPropagation();
		});

		costsDropdownsContainer.appendChild(payForPersonContainerElement);

		calculateCostsForItem(itemCostsContainer);
	}

	function removeCostSplitFromItem(itemCostsContainer, payForPersonContainerElement) {
		let costsDropdownsContainer = itemCostsContainer.querySelector('.costs-dropdowns-container');

		costsDropdownsContainer.removeChild(payForPersonContainerElement);

		calculateCostsForItem(itemCostsContainer);
	}


	function generatePayForPersonDropdownsElements() {
		let orderedItems = document.querySelectorAll('[data-test-id="CartItem"]');

		for (var i = 0; i < orderedItems.length; i++) {
			let itemElement = orderedItems[i];
			
			// let priceElement = itemElement.querySelector('[data-test-id="menu-item-presentational.price"]');
			
			let priceElement = itemElement.querySelector('[data-test-id="CartItemName"]').nextElementSibling.nextElementSibling.firstChild;

			let price = priceElement.innerHTML.replaceAll('€', '').replaceAll(',', '.').replaceAll(' ', '').replaceAll('&nbsp;', '').trim();

			// console.log("AAAA", priceElement.innerHTML);


			let itemNameElement = itemElement.querySelector('[data-test-id="CartItemName"]');
			// let itemName = itemNameElement.childNodes[1].textContent;
			let itemName = itemNameElement.innerHTML;

			console.log("NAME", itemName);
			
			
			let numberOfOrderedItemsElement = itemElement.querySelector('[data-test-id="CartItemStepperValue"]');
			// let numberOfOrderedItems = numberOfOrderedItemsElement.dataset.value*1;
			let numberOfOrderedItems = numberOfOrderedItemsElement.innerHTML.trim()*1;
			
			console.log("SSS", numberOfOrderedItems);
			
			// TODO!! HANDLE  UNEQUAL SPLITS!!
			let singleItemPrice = (price*1) / numberOfOrderedItems*1;
			
			console.log("PRICE", price);
			console.log("SINGLE ITEM PRICE", singleItemPrice);
			let costsContainerElement = document.createElement("div");
			costsContainerElement.classList.add('costs-container');

			for (var j = 0; j < numberOfOrderedItems; j++) {
				// let payForPersonContainerElement = generatePayForPersoDropdownElement(singleItemPrice, itemName);
				let itemCostsContainerElement = generateItemCostsContainerElement(singleItemPrice, itemName, 1);

				costsContainerElement.appendChild(itemCostsContainerElement)
			}
			
			itemElement.appendChild(costsContainerElement)


			// console.log("CENA", price);
		}

		let personsSelects = document.querySelectorAll('.pay-for-person-select');
		for (var i = 0; i < personsSelects.length; i++) {
			personsSelects[i].addEventListener('click', e => {
				e.preventDefault();
				e.stopPropagation();
			});
		}
	}

	function generatePayByPersonTitleHTML() {
		return `<div style="font-weight: 700;">Paid by:</div>`;
	}

	function generatePayByPersonDropdownHTML() {
		return `<select id="pay-by-person-select" style="border: 1px solid #e4e4e4; cursor: pointer; margin: 5px 0px 10px 0px">
				${(groupUsers.map(person => {
					return `<option value="${person.id}">${person.name}</option>`;
				})).join('')}
		</select>`;
	}

	function generatePayByPersonComponent() {
		let selectedItemsHElementContainer = document.querySelector('[data-test-id="OrderItemsList"] h3').parentElement;

		console.log("selectedItemsHElementContainer");

		let payByPersonComponentContainerElement = document.createElement("div");
		payByPersonComponentContainerElement.classList.add('pay-by-person-container');

		let payByPersonComponentHtml = `
			${generatePayByPersonTitleHTML()}
			${generatePayByPersonDropdownHTML()}
		`;

		payByPersonComponentContainerElement.innerHTML = payByPersonComponentHtml;

		selectedItemsHElementContainer.appendChild(payByPersonComponentContainerElement);
	}

	function generateSettleCostsButtonHTML() {
		return `<button style="background: #1fa9e4; cursor: pointer; border-radius: 8px; padding: 16px; margin-top: 10px; font-size: 16px; font-weight: 500; color: #fff; width: 100%;">
			Settle costs
		</button>`;
	}

	function generateSettleCostsButton() {
		// let orderItemsListElement = document.querySelector('[data-test-id="TitledItemsList"]');
		let orderItemsListElement = document.querySelector('[data-test-id="OrderItemsList"]');
		console.log("MIHAAAAA!!");

		let settleCostsButtonContainerElement = document.createElement("div");
		settleCostsButtonContainerElement.id = 'settle-costs-btn';

		let settleCostsButtonHtml = `
			${generateSettleCostsButtonHTML()}
		`;

		settleCostsButtonContainerElement.innerHTML = settleCostsButtonHtml;


		settleCostsButtonContainerElement.addEventListener("click", e => {
			settleCosts();
		});


		orderItemsListElement.appendChild(settleCostsButtonContainerElement);
	}

	function generateLoadingDivHTML() {
		return `<div style="text-align: center; margin-top: 15px; font-weight: 500; font-size: 24px;">
			Settling costs...
		</div>`;
	}

	function generateCostsSettledDivHTML() {
		return `<div style="text-align: center; margin-top: 15px; font-weight: 500; font-size: 24px;">
			Costs settled!
		</div>`;
	}

	function settleCosts() {
		console.log("setling costs...");

		let settleCostsBtn = document.getElementById('settle-costs-btn');
		let settleCostsBtnParent = settleCostsBtn.parentElement;

		let loadingElement = document.createElement('div');
		loadingElement.id = 'settle-costs-loading';
		loadingElement.innerHTML = generateLoadingDivHTML();

		settleCostsBtn.remove();
		settleCostsBtnParent.appendChild(loadingElement);

		let payByPersonId = document.getElementById('pay-by-person-select').value;

		console.log("PAID BY", payByPersonId);

		let costsObj = {
			paid_by_person_id: payByPersonId,
			paid_for: [],
			deliveryFee: null,
			serviceFee: null,
		}

		let personsSelects = document.querySelectorAll('.pay-for-person-select');
		for (var i = 0; i < personsSelects.length; i++) {
			let personId = personsSelects[i].value;
			let personsPrice = personsSelects[i].dataset.price;
			let personsItemName = personsSelects[i].dataset.item_name;

			costsObj.paid_for.push({
				id: personId,
				price: personsPrice,
				itemName: personsItemName
			});
		}


		let deliveryFeeElement = document.querySelector('[data-test-id="order.checkout-delivery-default"] span');
		if (deliveryFeeElement)
		costsObj.deliveryFee = deliveryFeeElement.innerHTML;
	
	
		// let serviceFeeElement = document.querySelector('[class^="OrderSummary-module__priceItem"]');
		let serviceFeeElement = document.querySelector('[data-test-id="Order.ServiceFee"] span');
		if (serviceFeeElement)
			costsObj.serviceFee = serviceFeeElement.innerHTML;


		console.log("COSTS OBJ", costsObj);

		chrome.runtime.sendMessage({
			type: "settleCosts",
			costsObj: costsObj
		});


		

	}

	function initComponent() {
		console.log("INITIALIZING WOLT COMPONENT...");
		componentInitialized = true;


		generatePayByPersonComponent();
		generatePayForPersonDropdownsElements();
		generateSettleCostsButton();
	}
		
	getUsersFromSplitwiseGroup();

	setInterval(() => {
		// console.log("LOCATION PATHNAME", window.location.pathname);
		onCheckout = window.location.pathname.includes('/checkout');
		// onGroupOrder = window.location.pathname.includes('/group-order');

		if (!onCheckout)
			return;

		if (componentInitialized)
			return;

		let orderedItems = document.querySelectorAll('[data-test-id="CartItem"]');

		if (orderedItems.length == 0) {
			console.log("NO ELEMENTS YET, SKIPING...");
			return;
		}

		if (!groupUsersSet) {
			console.log("USERS NOT SET YET, SKIPING...");
			return;
		}

		initComponent();
	}, 300);

	// window.addEventListener('popstate', function (event) {
	// 	console.log("PAGE CHANGED!");
	// 	console.log(event.state);
	// });

	console.log("TUKI33!");

	chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
	    if (data.type == 'setGroupUsers') {
	        console.log("SETTING GROUP USERS");
	        groupUsers = data.groupUsers;

	        // groupUsers = groupUsers.sort((a, b) => a.name.toUpperCase() - b.name.toUpperCase());

	        groupUsers.sort(function(a, b) {
				const nameA = a.name.toUpperCase(); // ignore upper and lowercase
				const nameB = b.name.toUpperCase(); // ignore upper and lowercase
				if (nameA < nameB) {
					return -1;
				}
				if (nameA > nameB) {
					return 1;
				}

				// names must be equal
				return 0;
			});

	        console.log("GG", groupUsers);

	        groupUsers.push({
	        	id: -1,
	        	name: 'Other'
	        })

	        groupUsersSet = true;
	    }

	    if (data.type == 'finishedSettleCosts') {
	    	console.log("COSTS SETTLED!!");
	    	
	    	let costsSettledElement = document.createElement('div');
			costsSettledElement.innerHTML = generateCostsSettledDivHTML();

			let loadingElement = document.getElementById('settle-costs-loading');
			let settleCostsBtnParent = loadingElement.parentElement;

			loadingElement.remove();
			settleCostsBtnParent.appendChild(costsSettledElement);
	    }

	    sendResponse();
	});
})();