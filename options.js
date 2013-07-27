

document.addEventListener("webkitvisibilitychange", showRules, false);

function save() {
	var prefs = JSON.parse(window.localStorage.cookies_on_off_prefs);
	prefs.showContextMenu = document.getElementById("contextMenu").checked;
	prefs.autoRefresh = document.getElementById("autoRefresh").checked;
	window.localStorage.cookies_on_off_prefs = JSON.stringify(prefs);
	
	chrome.extension.getBackgroundPage().init();
}
function showRules() {
	document.getElementById("cookiesTF_rules").value = chrome.extension.getBackgroundPage().getLocalStorageRules();
}

window.onload = function() {

	var prefs = JSON.parse(window.localStorage.cookies_on_off_prefs);

	showRules();

	document.getElementById("contextMenu").checked = prefs.showContextMenu;
	document.getElementById("autoRefresh").checked = prefs.autoRefresh;
	
	document.getElementById("contextMenu").onclick = function() { save(); };
	document.getElementById("autoRefresh").onclick = function() { save(); };
	
	document.getElementById("openCookieSettings").onclick = chrome.extension.getBackgroundPage().openCksPanel();

	document.getElementById("clearCookieSettings").onclick = function() {
		chrome.extension.getBackgroundPage().clearRules("contentSettings");
		chrome.extension.getBackgroundPage().openCksPanel().call();
	};

	document.getElementById("importRules").onclick = function() {
		if (document.getElementById("cookiesTF_rules").value !== "") {
			chrome.extension.getBackgroundPage().importRules(JSON.parse(document.getElementById("cookiesTF_rules").value));
			chrome.extension.getBackgroundPage().openCksPanel().call();
		}
	};

	document.getElementById("clearLocalStorageRules").onclick = function() {
		chrome.extension.getBackgroundPage().clearRules("localStorage");
		showRules();
	};

}

