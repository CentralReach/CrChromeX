function saveOptions() {
    var crNotifyMessages = document.getElementById('crnotifymessages').checked;
    var crNotifyEvents = document.getElementById('crnotifyevents').checked;
    var crOpenNewTab = document.getElementById('cropennewtab').checked;
    var crNeverActiveTab = document.getElementById('crneveractivetab').checked;
    var crClearNotificationAfter = document.getElementById('crclearnotificationafter').value;
    var crEventsOffsetMinutes = document.getElementById('creventsoffsetminutes').value;
    var crEventReminderBuffer = document.getElementById('creventreminderbuffer').value;
    var crEventReminderSnooze = document.getElementById('creventremindersnooze').value;
    
    if (crClearNotificationAfter > 10) {
        crClearNotificationAfter = 10
    }

    if (crEventsOffsetMinutes > 1440) {
        crEventsOffsetMinutes = 0;
    } else if (crEventsOffsetMinutes < -1440) {
        crEventsOffsetMinutes = 0;
    }

    if (crEventReminderSnooze < 0 || crEventReminderSnooze > 300) {
        crEventReminderSnooze = 5;
    }

    if (!crNotifyEvents) {
        chrome.alarms.clearAll();
    }

    chrome.storage.sync.set({
        crNotifyMessages: crNotifyMessages,
        crNotifyEvents: crNotifyEvents,
        crOpenNewTab: crOpenNewTab,
        crNeverActiveTab: crNeverActiveTab,
        crClearNotificationAfter: crClearNotificationAfter,
        crEventsOffsetMinutes: crEventsOffsetMinutes,
        crEventReminderBuffer: crEventReminderBuffer,
        crEventReminderSnooze: crEventReminderSnooze
    }, function() {
        var status = document.getElementById('status');

        status.textContent = 'Options saved.';

        setTimeout(function() {
            status.textContent = '';
        }, 2000);

    });
}

function restoreOptions() {
    chrome.storage.sync.get({
        crNotifyMessages: true,
        crNotifyEvents: true,
        crOpenNewTab: false,
        crNeverActiveTab: false,
        crClearNotificationAfter: 0,
        crEventsOffsetMinutes: 0,
        crEventReminderBuffer: 5,
        crEventReminderSnooze: 2
    }, function(items) {
        document.getElementById('crnotifymessages').checked = items.crNotifyMessages;
        document.getElementById('crnotifyevents').checked = items.crNotifyEvents;
        document.getElementById('cropennewtab').checked = items.crOpenNewTab;
        document.getElementById('crneveractivetab').checked = items.crNeverActiveTab;
        document.getElementById('crclearnotificationafter').value = items.crClearNotificationAfter;
        document.getElementById('creventsoffsetminutes').value = items.crEventsOffsetMinutes;
        document.getElementById('creventreminderbuffer').value = items.crEventReminderBuffer;
        document.getElementById('creventremindersnooze').value = items.crEventReminderSnooze;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
