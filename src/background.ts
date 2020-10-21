import "firebase/auth";
import "firebase/firestore";

import * as firebase from "firebase/app";
import { DateTime } from "luxon";

import { firebaseConfig } from "./firebase_config";

firebase.initializeApp(firebaseConfig);

function initApp() {
	firebase.auth().onAuthStateChanged(function (user: firebase.User) {
		console.log(user);
	});

	firebase
		.auth()
		.signInAnonymously()
		.catch(function (error) {
			console.log("Error signing in anonymously: ", error);
		});
}

window.onload = function () {
	initApp();
};

chrome.alarms.create("scraper_timer", { when: Date.now() + 1000, periodInMinutes: 5.0 });

function handleData(result: { error: boolean; type: string; userName: string; notificationInfo: { product: string; signupTime: string; notified: string }[] }) {
	if (result) {
		if (result.error === true && result.type !== "notLoggedIn") {
			chrome.notifications.create("errorParsing", {
				type: "basic",
				iconUrl: "./icon.png",
				title: "Queue Tracker for EVGA",
				message: "Error scraping data. Contact the developer about this one, chief.",
			});
		} else {
			let db = firebase.firestore();
			let now = new Date();

			result.notificationInfo.forEach((value) => {
				let data = {
					product: value.product,
					userName: result.userName,
					signupTime: DateTime.fromFormat(value.signupTime, "D tt z").toJSDate().valueOf(),
					notified: value.notified,
					lastUpdated: now.valueOf(),
				};

				let doc = {
					product: value.product,
					userName: result.userName,
					signupTime: DateTime.fromFormat(value.signupTime, "D tt z").toJSDate(),
					notified: value.notified,
					lastUpdated: now,
				};

				chrome.storage.local.set({ [value.product]: data });
				db.collection("signups").doc(`${doc.product}+${result.userName}`).set(doc, { merge: true });
			});
		}
	}
}

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
	if (notificationId === "notLoggedIn" && buttonIndex === 0) {
		chrome.tabs.create({ url: "https://secure.evga.com/us/login.asp" });
	}
});

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === "scraper_timer") {
		console.log("scraping notifications page...");
		chrome.tabs.create({ index: 0, active: false, url: "https://www.evga.com/community/myNotifies.asp" }, (createdTab) => {
			chrome.tabs.onUpdated.addListener(function evgaPageLoadedListener(tabId, changeInfo, tab) {
				if (changeInfo.status === "complete" && createdTab.id === tabId) {
					if (tab.url === "https://secure.evga.com/US/login.asp") {
						chrome.notifications.clear("notLoggedIn");
						chrome.notifications.create("notLoggedIn", {
							isClickable: false,
							type: "basic",
							iconUrl: "./icon.png",
							title: "Queue Tracker for EVGA",
							message: "Error: Not signed in to EVGA, please sign in to evga.com for this extension to work.",
							buttons: [{ title: "Sign In" }],
						});
						chrome.tabs.remove(tabId);
					} else {
						var handleAndCloseTab = (result: any) => {
							handleData(result);
							chrome.tabs.remove(tabId);
						};

						chrome.tabs.sendMessage(tab.id, { text: "report_back" }, handleAndCloseTab);
					}
				}
			});
		});
	}
});

chrome.runtime.onMessage.addListener(function (request: { msg: string; product: string; signupTime: number }, sender, sendResponse) {
	if (request.msg === "get_evga_queue_data" && request.product !== null && request.signupTime !== null) {
		let db = firebase.firestore();

		db.collection("signups")
			.where("product", "==", request.product)
			.where("notified", "==", "Yes")
			.orderBy("signupTime", "desc")
			.limit(1)
			.get()
			.then((docs) => {
				if (docs.size > 0) {
					console.log("got a yes");
					chrome.runtime.sendMessage({
						msg: "evga_queue_data",
						product: request.product,
						latestFulfilled: DateTime.fromSeconds(docs.docs[0].data().signupTime.seconds).toISO(),
						timeNotified: docs.docs[0].data().timeNotified === undefined ? null : DateTime.fromSeconds(docs.docs[0].data().timeNotified.seconds).toISO(),
						signupTime: DateTime.fromMillis(request.signupTime).toISO(),
					});
				} else {
					chrome.runtime.sendMessage({ msg: "evga_queue_data", product: request.product, latestFulfilled: null });
				}
			});

		db.collection("config")
			.doc("popup-config")
			.get()
			.then((document) => {
				chrome.runtime.sendMessage({ msg: "popup_config", data: document.data() });
			});
	}
});
