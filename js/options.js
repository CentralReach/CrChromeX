function saveOptions() {
    var crNotifyMessages = document.getElementById('crnotifymessages').checked;
    var crNotifyEvents = document.getElementById('crnotifyevents').checked;
    var crNotifyChats = document.getElementById('crnotifychats').checked;
    var crNotifyFilters = document.getElementById('crnotifyfilters').checked;
    var crOpenNewTab = document.getElementById('cropennewtab').checked;
    var crNeverActiveTab = document.getElementById('crneveractivetab').checked;
    var crClearNotificationAfter = document.getElementById('crclearnotificationafter').value;
    var crEventsOffsetMinutes = document.getElementById('creventsoffsetminutes').value;
    var crEventReminderBuffer = document.getElementById('creventreminderbuffer').value;
    var crEventReminderSnooze = document.getElementById('creventremindersnooze').value;
    var crMessageOnEventChanges = document.getElementById('crmessageoneventchanges').checked;
    
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

    chrome.storage.sync.get({
        crEventsOffsetMinutes: crEventsOffsetMinutes,
        crEventReminderBuffer: crEventReminderBuffer,
        crMessageOnEventChanges: crMessageOnEventChanges
    }, function(x) {
        var reloadEvents = (x.crEventsOffsetMinutes != crEventsOffsetMinutes || x.crEventReminderBuffer != crEventReminderBuffer);
        var messageSubscribeUpdate = x.crMessageOnEventChanges != crMessageOnEventChanges;

        chrome.storage.sync.set({
            crNotifyMessages: crNotifyMessages,
            crNotifyEvents: crNotifyEvents,
            crNotifyChats: crNotifyChats,
            crNotifyFilters: crNotifyFilters,
            crOpenNewTab: crOpenNewTab,
            crNeverActiveTab: crNeverActiveTab,
            crClearNotificationAfter: crClearNotificationAfter,
            crEventsOffsetMinutes: crEventsOffsetMinutes,
            crEventReminderBuffer: crEventReminderBuffer,
            crEventReminderSnooze: crEventReminderSnooze,
            crMessageOnEventChanges: crMessageOnEventChanges
        }, function() {
            var status = document.getElementById('status');

            status.textContent = 'Options saved.';

            setTimeout(function() {
                status.textContent = '';
            }, 2000);

            if (reloadEvents) {
                chrome.runtime.sendMessage({ action: 'crOnStartup'});
            }
            if (messageSubscribeUpdate) {
                chrome.runtime.sendMessage({ action: 'crMessageOnEventSubscription'});
            }
        });
    });

}

function restoreOptions() {
    chrome.storage.sync.get({
        crNotifyMessages: true,
        crNotifyEvents: true,
        crNotifyChats: true,
        crNotifyFilters: true,
        crOpenNewTab: false,
        crNeverActiveTab: false,
        crClearNotificationAfter: 0,
        crEventsOffsetMinutes: 0,
        crEventReminderBuffer: 5,
        crEventReminderSnooze: 2,
        crMessageOnEventChanges: false
    }, function(items) {
        document.getElementById('crnotifymessages').checked = items.crNotifyMessages;
        document.getElementById('crnotifyevents').checked = items.crNotifyEvents;
        document.getElementById('crnotifychats').checked = items.crNotifyChats;
        document.getElementById('crnotifyfilters').checked = items.crNotifyFilters;
        document.getElementById('cropennewtab').checked = items.crOpenNewTab;
        document.getElementById('crneveractivetab').checked = items.crNeverActiveTab;
        document.getElementById('crclearnotificationafter').value = items.crClearNotificationAfter;
        document.getElementById('creventsoffsetminutes').value = items.crEventsOffsetMinutes;
        document.getElementById('creventreminderbuffer').value = items.crEventReminderBuffer;
        document.getElementById('creventremindersnooze').value = items.crEventReminderSnooze;
        document.getElementById('crmessageoneventchanges').checked = items.crMessageOnEventChanges;        
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
