chrome.runtime.onInstalled.addListener(function(d) {
	crApi.listenForMyNotifications(m => handleMyNotification(m));
});

chrome.runtime.onMessage.addListener(function(request, sender, response) {
    if (request.action == 'crCredentialsSaved' ||
    	request.action == 'crEnableEvents') {

    	crApi.listenForMyNotifications(m => handleMyNotification(m))
    		 .then(r => response(r));

    } else if (request.action == 'crStopEvents') {
    	
    	crApi.stopMyNotifications()
    		 .then(r => response(r));

    } else if (request.action == 'crGetEvents') {
    	getEventsToMonitor();
    }
});

chrome.alarms.onAlarm.addListener(function(a) {
	if (a.name.substring(0,4) == 'cre-') {
		handleEventAlarm(a);
	}
});

window.addEventListener('online', function(e) {
	crApi.listenForMyNotifications(m => handleMyNotification(m));
}, false);

window.addEventListener('offline', function(e) {
	crApi.stopMyNotifications();
}, false);

chrome.notifications.onClicked.addListener(function(notificationId) {
	// Clicked on the notification, non-button area...open the link if it is one
	var url = getUrlFromNotificationId(notificationId);

	if (url) {
		goToNotificationUrl(url);
	}

	chrome.notifications.clear(notificationId);
});

chrome.notifications.onClosed.addListener(function(notificationId, byUser) {
	// Close should clear, but to be safe on all versions...
	chrome.notifications.clear(notificationId);
});

function handleMyNotification(msg) {
	if (!msg) {
		return;
	}

	if (msg.messageType == 'message') {
		processMessageNotification(msg);
	} else if (msg.messageType == 'event') {
		processEventNotification(msg);
	}
}

function getMsgNotificationId(msg, useUrl) {
	return useUrl && msg.urlPath 
				? forge.util.encode64(msg.urlPath) 
				: 'crmsg-' + msg.messageType + '-' + msg.recordId;
}

function getUrlFromNotificationId(notificationId) {
	if (notificationId.substring(0,6) == 'crmsg-') {
		return null;
	}

	var url = forge.util.decode64(notificationId);

	return url.substring(0,4) == 'http'
				? url
				: null;
}

function goToNotificationUrl(url) {
	chrome.storage.sync.get({
		crOpenNewTab: false,
		crNeverActiveTab: false
	}, function(r) {
		if (chrome.runtime.lastError) {
			return;
		}

		if (r.crOpenNewTab) {
			chrome.tabs.create({ url: url });
		} else {
			chrome.tabs.query({ url: '*://members*.centralreach.com/*' }, function(tabs) {
				if (!tabs || tabs.length <= 0) { 
					chrome.tabs.create({ url: url });
					return;
				}

				var tabIdToUpdate = 0;

				// Find either the current active members tab, or an inactive members tab if not supposed to use the active tab
				var tabToUse = tabs.find(function(t) { return t.active == !r.crNeverActiveTab; });
				
				if (tabToUse && tabToUse.id) {
					tabIdToUpdate = tabToUse.id;
				} else {
					// If we only looked for active tabs and didnt find one, just use the first one
					if (!r.crNeverActiveTab) {
						tabToUse = tabs.find(function(t) { return t.id > 0; });
						
						if (tabToUse && tabToUse.id) {
							tabIdToUpdate = tabToUse.id;
						}
					}
				}

				if (tabIdToUpdate > 0) {
					chrome.tabs.update(tabIdToUpdate, { url: url, active: true });
				} else {
					chrome.tabs.create({ url: url });
				}
			});
		}	
	});
}

function processMessageNotification(msg) {
	chrome.storage.sync.get({
		crNotifyMessages: true,
		crClearNotificationAfter: 0
	}, function(r) {
		if (chrome.runtime.lastError) {
			return;
		}
		if (!r.crNotifyMessages) {
			return;
		}

		var notificationId = getMsgNotificationId(msg, true);

		chrome.notifications.create(notificationId, {
			type: 'basic',
			iconUrl: 'images/notify.png',
			title: 'From: ' + msg.from,
			message: msg.title,
			isClickable: true,
			requireInteraction: false
		}, function(nid) {
			if (r.crClearNotificationAfter > 0) {
				setTimeout(function() {
					chrome.notifications.clear(nid);
				}, (r.crClearNotificationAfter * 1000));
			}
		});
	});
}

function processEventNotification(msg) {
	chrome.storage.sync.get({
		crNotifyEvents: true,
		crEventsOffsetMinutes: 0
	}, function(r) {
		if (chrome.runtime.lastError) {
			return;
		}
		if (!r.crNotifyEvents) {
			return;
		}

		createEventAlarm(msg, r.crEventsOffsetMinutes);
	});
}

function handleEventAlarm(a) {
	chrome.alarms.clear(a.name);

	chrome.storage.sync.get({
		crNotifyEvents: true,
		crClearNotificationAfter: 0
	}, function(r) {
		if (chrome.runtime.lastError) {
			return;
		}
		if (!r.crNotifyEvents) {
			return;
		}

		var alarmName = a.name;
		var crClearNotificationAfter = r.crClearNotificationAfter;

		chrome.storage.local.get({
			[alarmName]: null
		}, function(r) {
			if (chrome.runtime.lastError) {
				return;
			}
			if (!r || !r[alarmName]) {
				return;
			}

			var eventModel = JSON.parse(forge.util.decode64(r[alarmName]));

			chrome.storage.local.remove(alarmName);

			if (!eventModel) {
				return;
			}

			var notificationId = forge.util.encode64(eventModel.url);

			chrome.notifications.create(notificationId, {
				type: 'basic',
				iconUrl: 'images/notify.png',
				title: 'Event: ' + eventModel.title,
				message: eventModel.message,
				isClickable: true,
				requireInteraction: false
			}, function(nid) {
				if (crClearNotificationAfter > 0) {
					setTimeout(function() {
						chrome.notifications.clear(nid);
					}, (crClearNotificationAfter * 1000));
				}
			});
		});
	});
}

function getEventsToMonitor() {

	crApi.getEvents()
		.then(r => {
			if (!r || r.failed || !r.results) {
				return false;
			}

			chrome.storage.sync.get({
				crNotifyEvents: true,
				crEventsOffsetMinutes: 0
			}, function(s) {
				if (chrome.runtime.lastError) {
					return;
				}
				if (!s.crNotifyEvents) {
					return;
				}

				r.results.forEach(function(e) {
						createEventAlarm({
							occursAt: e.eventStart,
							recordId: e.courseId,
							urlPath: `https://members.centralreach.com/#scheduling/edit/a/${e.courseId}/dt/2018-01-17`,
							from: '',
							title: e.eventName,
							message: e.eventDescription
						}, s.crEventsOffsetMinutes);
					});
			});

			
		})
}

function createEventAlarm(msg, offsetMinutes) {

	var myEventOccursAt = (msg.occursAt * 1000) + offsetMinutes;
	var now = Date.now();
	var ignoreAfter = now + 100000000; // basically +1 day
	var eventLocalId = 'cre-' + msg.recordId;

	if (myEventOccursAt < now || myEventOccursAt > ignoreAfter) {
		return;
	}

	var eventModel64 = forge.util.encode64(JSON.stringify({
		url: msg.urlPath,
		from: msg.from,
		title: msg.title,
		occursAt: myEventOccursAt,
		message: msg.message
	}));

	chrome.storage.local.set({
		[eventLocalId]: eventModel64
	}, function() {
		if (chrome.runtime.lastError) {
			return;
		}

		chrome.alarms.create(eventLocalId, { when: myEventOccursAt });
	});
}