import { DateTime } from "luxon";

let table: HTMLTableElement = document.getElementById("product-table") as HTMLTableElement;

chrome.storage.local.get((items: { [key: string]: { product: string; userName: string; signupTime: number; notified: string; lastUpdated: number } }) => {
	let products = Object.keys(items);
	if (products && products.length > 0) {
		products.forEach((product) => {
			let row = table.insertRow(1);
			row.id = product;

			let productCell = row.insertCell(0);
			let signupTimeCell = row.insertCell(1);

			console.log(items[product]);

			productCell.innerHTML = product;
			signupTimeCell.innerHTML = DateTime.fromMillis(items[product].signupTime).toFormat("LLL dd, yyyy, hh:mm:ss a ZZZZ");

			chrome.runtime.sendMessage({
				msg: "get_evga_queue_data",
				product: product,
				signupTime: items[product].signupTime,
			});
		});
	}
});

chrome.runtime.onMessage.addListener(function (request: { msg: string }, sender, sendResponse) {
	if (request.msg === "evga_queue_data") {
		let queueData: { product: string; latestFulfilled: string; timeNotified: string; signupTime: string } = request as any;
		let row = table.rows.namedItem(queueData.product);

		let queuePositionCell = row.insertCell(2);
		let availabilityEstimateCell = row.insertCell(3);

		if (queueData.latestFulfilled !== null) {
			let latestFulfilled = DateTime.fromISO(queueData.latestFulfilled);
			let timeNotified = DateTime.fromISO(queueData.timeNotified);
			let signupTime = DateTime.fromISO(queueData.signupTime);
			queuePositionCell.innerHTML = latestFulfilled.toFormat("LLL dd, yyyy, hh:mm:ss a ZZZZ");

			let evgaEpoch = DateTime.fromISO("2020-09-17T00:00:00+0000");
			let now = DateTime.fromJSDate(new Date());

			if (latestFulfilled < evgaEpoch) {
				evgaEpoch = latestFulfilled.minus({ hours: 12 });
			}

			if (signupTime < evgaEpoch) {
				evgaEpoch = signupTime.minus({ hours: 12 });
			}

			let timeSinceEpoch = now.diff(evgaEpoch);

			let timeNotifiedEpochDiff = timeNotified.diff(evgaEpoch);
			let latestFulfilledEpochDiff = latestFulfilled.diff(evgaEpoch);
			let latestWaitFactor =
				queueData.timeNotified === null
					? timeSinceEpoch.as("days") / latestFulfilledEpochDiff.as("days")
					: timeNotifiedEpochDiff.as("days") / latestFulfilledEpochDiff.as("days");
			let signupTimeEpochDiff = DateTime.fromISO(queueData.signupTime).diff(evgaEpoch);

			let estimate = DateTime.fromMillis(evgaEpoch.toMillis() + signupTimeEpochDiff.as("milliseconds") * latestWaitFactor);

			if (estimate.diff(now).as("minutes") < 0) {
				availabilityEstimateCell.innerHTML = "Any time now...";
			} else if (estimate.diff(now).as("days") > 30) {
				availabilityEstimateCell.innerHTML = "More than a month away...";
			} else {
				availabilityEstimateCell.innerHTML = estimate.toFormat("LLL dd, yyyy");
			}
		} else {
			queuePositionCell.innerHTML = "No data yet...";
			availabilityEstimateCell.innerHTML = "";
		}
	} else if (request.msg === "popup_config") {
		let config: { data: any } = request as any;
		let header = document.getElementById("header");
		let footer = document.getElementById("footer");

		header.innerHTML = config.data.header || "";
		footer.innerHTML = config.data.footer || "";
	}
});
