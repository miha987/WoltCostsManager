(function() {
	let privateGroup = [
		{
			id: 1,
			name: "Miha"
		},
		{
			id: 2,
			name: "Tomaž"
		},
		{
			id: 3,
			name: "Vanesa"
		},
		{
			id: -1,
			name: "Other"
		},
	];

	let componentInitialized = false;

	function generatePayForPersonDropdownHTML(price) {
		return `<select data-price="${price}" class="pay-for-person-select" style="border: 1px solid #e4e4e4; cursor: pointer; margin-top: 10px;">
				${(privateGroup.map(person => {
					return `<option value="${person.id}">${person.name}</option>`;
				})).join('')}
		</select>`;
	}

	function generatePayForPersoDropdownElement(price) {
		let payForPersonContainerElement = document.createElement("div");
		payForPersonContainerElement.classList.add('pay-for-person-container');

		let payForPersonDropdownHTML = generatePayForPersonDropdownHTML(price);

		payForPersonContainerElement.innerHTML = payForPersonDropdownHTML;

		return payForPersonContainerElement;
	}

	function generatePayForPersonDropdownsElements() {
		let orderedItems = document.querySelectorAll('[data-test-id="MenuItemContent"]');

		for (var i = 0; i < orderedItems.length; i++) {
			let itemElement = orderedItems[i];
			
			let priceElement = itemElement.querySelector('[data-test-id="menu-item-presentational.price"]');
			let price = priceElement.innerHTML.replaceAll('€', '')*1;

			let payForPersonContainerElement = generatePayForPersoDropdownElement(price);

			itemElement.appendChild(payForPersonContainerElement)

			console.log("CENA", price);
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
				${(privateGroup.map(person => {
					return `<option value="${person.id}">${person.name}</option>`;
				})).join('')}
		</select>`;
	}

	function generatePayByPersonComponent() {
		let selectedItemsHElementContainer = document.querySelector('[data-test-id="OrderItemsList"] h3').parentElement;

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
		let orderItemsListElement = document.querySelector('[data-test-id="OrderItemsList"]');

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
		loadingElement.innerHTML = generateLoadingDivHTML();

		settleCostsBtn.remove();
		settleCostsBtnParent.appendChild(loadingElement);

		let payByPersonId = document.getElementById('pay-by-person-select').value;

		console.log("PAID BY", payByPersonId);

		let personsSelects = document.querySelectorAll('.pay-for-person-select');
		for (var i = 0; i < personsSelects.length; i++) {
			let personId = personsSelects[i].value;
			let personsPrice = personsSelects[i].dataset.price;

			console.log("PAYING FOR", personId, personsPrice);
		}


		let costsSettledElement = document.createElement('div');
		costsSettledElement.innerHTML = generateCostsSettledDivHTML();

		loadingElement.remove();
		settleCostsBtnParent.appendChild(costsSettledElement);

	}

	function initComponent() {
		console.log("INITIALIZING WOLT COMPONENT...");
		componentInitialized = true;

		generatePayByPersonComponent();
		generatePayForPersonDropdownsElements();
		generateSettleCostsButton();
	}

	setInterval(() => {
		if (componentInitialized)
			return;

		let orderedItems = document.querySelectorAll('[data-test-id="MenuItemContent"]');

		if (orderedItems.length == 0) {
			console.log("NO ELEMENTS YET, SKIPING...");
			return;
		}

		initComponent();
	}, 300);
})();