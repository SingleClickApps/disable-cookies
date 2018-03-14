/*
 * Disable Cookies Chrome Extension
 * www.singleclickapps.com
 *
 * Distributed under GPL License.
 * https://github.com/SingleClickApps
 */

var prefs;
var contextMenuId = null;

var chromeContentSettings = chrome.contentSettings;
/* currently (chrome 16), infobars is not implemented (only experimental...) */
var chromeInfobars = chrome.infobars;

var currHost = '';

init();

if(chromeContentSettings) {
	
	var forbiddenOrigin = /(chrome\:\/\/)/g,
		incognito,
		url,
		setting,
		tabId,
		matchForbiddenOrigin;

	chrome.tabs.onUpdated.addListener(function(tabId, props, tab) {
		// Prevent multiple calls
		if (props.status == "loading" && tab.selected) {
			//console.info("onUpdated");
			getSettings();
		}
	});

	chrome.tabs.onHighlighted.addListener(function() {
		//console.info("onHighlighted");
		getSettings();
	});

	chrome.windows.onFocusChanged.addListener(function() {
		//console.info("onFocusChanged");
		getSettings();
	});

	chrome.windows.getCurrent(function(win) {
		chrome.tabs.query( {'windowId': win.id, 'active': true}, function(){
			//console.info("getCurrent");
			getSettings();
		});
	});

	chrome.browserAction.onClicked.addListener(changeSettings);

} else {
	chrome.browserAction.onClicked.addListener(openCksPanel.call());
}

function updateIcon(setting) {
		chrome.browserAction.setIcon({path:"icon-" + setting + ".png"});
		
		/*
		//if you like useless caption changes...
		if(setting=="allow"){chrome.browserAction.setTitle({title:"Disable Cookies"});}
		else if(setting=="block"){chrome.browserAction.setTitle({title:"Enable Cookies"});}
		else {chrome.browserAction.setTitle({title:"Disable Cookies"});}
		*/
}

function getSettings() {
	chrome.tabs.getSelected(undefined, function(tab) {
		incognito = tab.incognito;
		url = tab.url;
		tabId = tab.id;
		
		//console.info("Current tab settings : "+url);
		chromeContentSettings.cookies.get({
			'primaryUrl': url,
			'incognito': incognito
		},
		function(details) {
			//console.info("Current tab settings : "+url);
			url ? matchForbiddenOrigin = url.match(forbiddenOrigin,'') : matchForbiddenOrigin = true;
			matchForbiddenOrigin ? updateIcon("inactive") : updateIcon(details.setting);				
		});
	});
}



function changeSettings() {
	if (!matchForbiddenOrigin) {
		chromeContentSettings.cookies.get({
			'primaryUrl': url,
			'incognito': incognito
		},
		function(details) {

			setting = details.setting;
			if (setting) {
				var urlParser = new URL(url);
				var pattern = /^file:/.test(url) ? url : (urlParser.hostname + '/*');

				// If this is not a file
				if (!/^file:/.test(url)) {
					pattern = prefs.allProtocols?'*://':(urlParser.protocol + '//');
					// Split hostname into parts, if more than 2 and allSubdomains is set, make it wildcard
					domParts = urlParser.hostname.split('.');
					if (prefs.allSubdomains && domParts.length > 2) {
						// Cut down hostname to two parts: domain.tld
						while (domParts.length > 2) {
							domParts.shift();
						}
						pattern += '*.' + domParts.join('.');
					} else {
						pattern += urlParser.hostname;
					}
					// If allPorts is set, add wildcard port, otherwise use given port, if set
					pattern += prefs.allPorts?':*':(urlParser.port?':'+urlParser.port:'');
					pattern += '/*';
				}
				
				currHost = pattern;
				
				// old method : url.replace(/\/[^\/]*?$/, '/*')
				var newSetting = (setting == 'allow' ? 'block' : 'allow');
				chromeContentSettings.cookies.set({
					'primaryPattern': pattern,
					'setting': newSetting,
					'scope': (incognito ? 'incognito_session_only' : 'regular')
				});
				
				updateIcon(newSetting);

				//clear cookies on "disable"
				if(newSetting=='block'){setTimeout(clearCurrentCookies(), 100);}

				if (prefs.autoRefresh) {
					setTimeout(chrome.tabs.reload(tabId,{"bypassCache":true}), 150 );
				}

				setLocalStorageRule(pattern, newSetting);

				//console.info("cookies is now "+newSetting+"ed on "+pattern);
			}
			else {
				//console.error("error, the setting is "+setting);
			}
		});
	}
	else {
		
		if(chromeInfobars) {
			chromeInfobars.show({"tabId": tabId, "path": "infobar.html"});
		}
		else {
			//console.error("You can't disable cookies on "+url);
		}
		
	}
}


/** Deletes all set cookies for current page */
function clearCurrentCookies(){
	
	
	var noDotDomain = currHost.match(/:\/\/(.[^/:]+)/)[1];
	var domain = "."+noDotDomain;
	var mainDomain =  domain; 
	var mainDomainNoDot = noDotDomain;
	if(domain.indexOf('.www.')==0){ mainDomain = '.'+domain.substr(5); }	
	if(domain.indexOf('www.')==0){ mainDomainNoDot = '.'+domain.substr(5); }	
	
		//alert(mainDomain);
		
	//delete all host cookies
	chrome.cookies.getAll({domain: domain}, function(cookies) {
		for(var i=0; i<cookies.length;i++) {
			chrome.cookies.remove({url: "http://" + domain+ cookies[i].path, name: cookies[i].name});
		}
	});
	//and for the actual domain, if starts with www. (not sure that's really proper behavior?)
	chrome.cookies.getAll({domain: mainDomain}, function(cookies) {
		for(var i=0; i<cookies.length;i++) {
			chrome.cookies.remove({url: "http://" + domain+ cookies[i].path, name: cookies[i].name});
		}
	});
	//delete all host cookies (no dot version)
	chrome.cookies.getAll({domain: noDotDomain}, function(cookies) {
		for(var i=0; i<cookies.length;i++) {
			chrome.cookies.remove({url: "http://" + noDotDomain+ cookies[i].path, name: cookies[i].name});
		}
	});
	//and for the actual domain, no dots
	chrome.cookies.getAll({domain: mainDomainNoDot}, function(cookies) {
		for(var i=0; i<cookies.length;i++) {
			chrome.cookies.remove({url: "http://" + mainDomainNoDot+ cookies[i].path, name: cookies[i].name});
		}
	});
	
}


function getLocalStorageRules() {
	return window.localStorage.cookiesTF_rules;
}

function setLocalStorageRule(pattern, newSetting) {

	if (!incognito) {

		var keyExist = false;

		if (rules.length) {
			for(i = 0; i < rules.length; i++) {
				if(pattern == rules[i].primaryPattern) {
					rules[i].setting = newSetting;
					keyExist = true;
					break;
				}
			}
		}

		if (!keyExist) {
			rules.push({
				'primaryPattern': pattern,
				'setting': newSetting,
				'scope': (incognito ? 'incognito_session_only' : 'regular')
			});
		}

		window.localStorage.setItem('cookiesTF_rules',JSON.stringify(rules));

	}

}

function importRules(localStorageRules) {

	var rules = localStorageRules;

	if (rules.length) {
		for(i = 0; i < rules.length; i++) {

			chrome.contentSettings.cookies.set({
				'primaryPattern': rules[i].primaryPattern,
				'setting': rules[i].setting,
				'scope': rules[i].scope
			});
		}
	}

	window.localStorage.setItem('cookiesTF_rules',JSON.stringify(rules));

}

function clearRules(arg) {
	
	if (arg == "contentSettings" || arg === undefined) {
		chromeContentSettings.cookies.clear({'scope': (incognito ? 'incognito_session_only' : 'regular')});
	}
	if (arg == "localStorage" || arg === undefined) {
		rules = [];
		window.localStorage.setItem('cookiesTF_rules',[]);
	}
}

function getLocalStoragePrefs() {
	
	// cookies_on_off_prefs
	if (!window.localStorage.cookies_on_off_prefs) {
		window.localStorage.cookies_on_off_prefs = JSON.stringify({ "showContextMenu": false, "autoRefresh": true });
	}
	prefs = JSON.parse(window.localStorage.cookies_on_off_prefs);

	// cookiesTF_rules
	if (!window.localStorage.cookiesTF_rules) {
		clearRules("localStorage");
	} else {
		rules = JSON.parse(window.localStorage.cookiesTF_rules);
	}

	// CksTF_version
	var currentVersion = getVersion();
	var previousVersion = window.localStorage.CksTF_version;
	if (currentVersion != previousVersion) {
		if (typeof previousVersion == 'undefined') {
			onInstall();
		} else {
			onUpdate();
		}
		window.localStorage.CksTF_version = currentVersion;
	}

}

// Check if the version has changed.
function onInstall() {
	if (rules.length) {	importRules(rules);	}
//  console.log("Extension Installed");
	if (navigator.onLine) {
		chrome.tabs.create({url: 'http://singleclickapps.com/disable-cookies/instructions.html'});
	}
}
function onUpdate() {
	if (rules.length) {	importRules(rules);	}
//  console.log("Extension Updated");
	if (navigator.onLine) {
		chrome.tabs.create({url: 'http://singleclickapps.com/disable-cookies/whatsnew.html'});
	}
}
function getVersion() {
	var details = chrome.app.getDetails();
	return details.version;
}

function toggleContextMenu() {

	if (prefs.showContextMenu && !contextMenuId) {
		
		contextMenuId = chrome.contextMenus.create({
			"title" : "Settings -> Cookie exceptions",
			"type" : "normal",
			"contexts" : ["all"],
			"onclick" : openCksPanel()
		});
		
	}

	if (!prefs.showContextMenu && contextMenuId) {
		
		chrome.contextMenus.remove(contextMenuId);
		contextMenuId = null;
		
	}

}
/** Opens Chrome's Cookie Settings panel */
function openCksPanel() {
	return function(info, tab) {
		chrome.tabs.create({"url":"chrome://settings/content/cookies", "selected":true});
	};
}

/** Loads preferences and adds/removes context menu entry. */
function init() {
	
	getLocalStoragePrefs();
	toggleContextMenu();
	
}

