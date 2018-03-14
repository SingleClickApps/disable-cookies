

document.addEventListener("webkitvisibilitychange", showRules, false);

function save() {
	var prefs = JSON.parse(window.localStorage.cookies_on_off_prefs);
	prefs.showContextMenu = document.getElementById("contextMenu").checked;
	prefs.autoRefresh = document.getElementById("autoRefresh").checked;
	prefs.allProtocols = document.getElementById("allProtocols").checked;
	prefs.allSubdomains = document.getElementById("allSubdomains").checked;
	prefs.allPorts = document.getElementById("allPorts").checked;
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
	document.getElementById("allProtocols").checked = prefs.allProtocols;
	document.getElementById("allSubdomains").checked = prefs.allSubdomains;
	document.getElementById("allPorts").checked = prefs.allPorts;
	
	document.getElementById("contextMenu").onclick = function() { save(); };
	document.getElementById("autoRefresh").onclick = function() { save(); };
	document.getElementById("allProtocols").onclick = function() { save(); };
	document.getElementById("allSubdomains").onclick = function() { save(); };
	document.getElementById("allPorts").onclick = function() { save(); };
	
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
