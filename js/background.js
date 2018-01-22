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

	clearEventAlarmAndNotify(notificationId);
});

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
	if (buttonIndex == 0) {
		// Snooze the reminder to this event for x minutes
		chrome.storage.local.get({
			[notificationId]: null
		}, function(i) {
			if (chrome.runtime.lastError || !i) {
				return;
			}

			var alarmName = i[notificationId];

			chrome.storage.sync.get({
				crEventReminderSnooze: 2
			}, function(r) {
				if (chrome.runtime.lastError) {
					return;
				}

				var snoozeMinutes = r.crEventReminderSnooze

				chrome.storage.local.get({
					[alarmName]: null
				}, function(ar) {
					var now = Date.now();
					var alarmTime = now + (snoozeMinutes * 60000);

					if (ar && ar[alarmName]) {
						var eventModel = JSON.parse(forge.util.decode64(ar[alarmName]));

						// If we have the eventModel and know when it starts, if the alarmTime with the snooze
						// is after the event but the current time is still before the event, set the alarm for
						// the start of the event instead...
						if (eventModel && eventModel.occursAt && alarmTime > eventModel.occursAt && now < eventModel.occursAt) {
							alarmTime = eventModel.occursAt;
						}
					}

					chrome.alarms.create(alarmName, { when: alarmTime });
				});
			});
		});
	}
});

chrome.notifications.onClosed.addListener(function(notificationId, byUser) {
	// Close should clear, but to be safe on all versions...
	clearEventAlarmAndNotify(notificationId);
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

	return (url.substring(0,4) == 'http')
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

		chrome.notifications.clear(notificationId);

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
	}, function(sr) {
		if (chrome.runtime.lastError) {
			return;
		}
		if (!sr.crNotifyEvents) {
			return;
		}

		var alarmName = a.name;
		var crClearNotificationAfter = sr.crClearNotificationAfter;

		chrome.storage.local.get({
			[alarmName]: null
		}, function(ar) {
			if (chrome.runtime.lastError) {
				return;
			}
			if (!ar || !ar[alarmName]) {
				return;
			}

			var eventModel = JSON.parse(forge.util.decode64(ar[alarmName]));

			if (!eventModel) {
				return;
			}

			var notificationId = forge.util.encode64(eventModel.url);

			chrome.storage.local.set({
				[notificationId]: alarmName
			}, function() {
				if (chrome.runtime.lastError) {
					return;
				}

				chrome.notifications.clear(notificationId);

				chrome.notifications.create(notificationId, {
					type: 'basic',
					iconUrl: 'images/notify.png',
					title: 'Event: ' + eventModel.title,
					message: eventModel.message,
					isClickable: true,
					requireInteraction: false,
					buttons: [{
						title: "Snooze"
					}]
				}, function(nid) {
					if (crClearNotificationAfter > 0) {
						setTimeout(function() {
							clearEventAlarmAndNotify(nid, alarmName);
						}, (crClearNotificationAfter * 1000));
					}
				});
			});
		});
	});
}

function clearEventAlarmAndNotify(notificationId, alarmName) {
	chrome.storage.local.remove(notificationId);

	if (alarmName) {
		chrome.storage.local.remove(alarmName);
	} else {
		chrome.storage.local.get({
			[notificationId]: null
		}, function(r) {
			if (chrome.runtime.lastError) {
				return;
			}
			if (!r || !r[notificationId]) { 
				return;
			}

			chrome.storage.local.remove(r[notificationId]);
		});
	}

	chrome.notifications.clear(notificationId);
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
					var url = e.urlPath;

					if (!url) {
						var eventDateTime = new Date(e.eventStart * 1000);
						var displayMonth = `0${eventDateTime.getMonth() + 1}`.slice(-2);
						var displayDay = `0${eventDateTime.getDate()}`.slice(-2);
						var dateString = `${eventDateTime.getFullYear()}-${displayMonth}-${displayDay}`;

						url = `https://members.centralreach.com/#scheduling/edit/a/${e.courseId}/dt/${dateString}`;
					}

					createEventAlarm({
						occursAt: e.eventStart,
						recordId: e.courseId,
						urlPath: url,
						from: e.from || '',
						title: e.eventName,
						message: e.eventDescription
					}, s.crEventsOffsetMinutes);
				});
			});
		});
}

function createEventAlarm(msg, offsetMinutes) {
	var myEventOccursAt = (msg.occursAt * 1000) + offsetMinutes;
	var now = Date.now();
	var ignoreAfter = now + 200000000; // basically +2 day
	var eventLocalId = 'cre-' + msg.recordId;

	if (myEventOccursAt < now || myEventOccursAt > ignoreAfter) {
		return;
	}

	chrome.storage.sync.get({
		crEventReminderBuffer: 5
	}, function(r) {
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

			var alarmAt = (myEventOccursAt - (r.crEventReminderBuffer * 60000));
			chrome.alarms.create(eventLocalId, { when: alarmAt });
		});
	});
}

function getExisting() {
	chrome.storage.local.get(null, function(items) {
		if (chrome.runtime.lastError || !items) {
			return;
		}

		Object.keys(items).forEach(function(e) {
			if (!e || e.substring(0,4) != 'cre-') {
				return;
			}

			var eventModel = JSON.parse(forge.util.decode64(items[e]));

			if (!eventModel) {
				chrome.storage.local.remove(items[e]);
			}

			// var notificationId = forge.util.encode64(eventModel.url);

			// reschedule the alarm if it is still in the future...remove it if not...

		});
	});
}

