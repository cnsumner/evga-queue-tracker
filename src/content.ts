const usernameRgx = /Hello, (.*?) </gm;
// const tableRgx = /<tr><td.*?><a href.*?>(\S*?)\s*?<.*?<\/td><td.*?>(.*?)<\/td><td.*?>(.*?)<\/td>[\s\S]*?removeNotify\('(.*?)'/gm;
const tableRgx = /<tr><td.*?><a href.*?>(\S*?)\s*?<.*?<\/td><td.*?>(.*?)<\/td><td.*?>(.*?)<\/td>/gm;

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
	// If the received message has the expected format...
	if (msg.text === "report_back") {
		if (document.URL === "https://secure.evga.com/US/login.asp") {
			sendResponse({ error: true, type: "notLoggedIn" });
		}

		var username = null;
		var notifies = [];

		// parse username
		var loginDivs = document.body.getElementsByClassName("login-text");
		if (loginDivs.length != 0) {
			var loginDiv = loginDivs[0];

			var matches = usernameRgx.exec(loginDiv.innerHTML);
			if (matches.index === usernameRgx.lastIndex) {
				usernameRgx.lastIndex++;
			}

			if (matches.length === 2) {
				username = matches[1];
			} else {
				sendResponse({ error: true, type: "loginRegexError", html: loginDiv.innerHTML });
			}
		} else {
			sendResponse({ error: true, type: "getElementsError", html: document.body.innerHTML });
		}

		// parse notifications info
		var tableElems = document.body.getElementsByClassName("table-gotyourback");
		if (tableElems.length != 0) {
			let tableElem = tableElems[0];

			var matches: RegExpExecArray;

			while ((matches = tableRgx.exec(tableElem.innerHTML)) !== null) {
				if (matches.index === tableRgx.lastIndex) {
					tableRgx.lastIndex++;
				}

				if (matches.length === 4) {
					notifies.push({ product: matches[1], signupTime: matches[2].replace("PT", "America/Los_Angeles"), notified: matches[3] });
				} else {
					sendResponse({ error: true, type: "tableRegexError", html: tableElem.innerHTML });
				}
			}
		} else {
			sendResponse({ error: true, type: "getElementsError", html: document.body.innerHTML });
		}

		sendResponse({ error: false, userName: username, notificationInfo: notifies });
	}
});
