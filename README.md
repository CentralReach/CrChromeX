CentralReach Chrome Helper
==============================

## [Installing](#installing)

Now available in the chrome web store here:

https://chrome.google.com/webstore/detail/

If you prefer, you can also simply clone this repo and load it as an upacked extension, which requires running your extensions in developer mode.

See the following for help:

https://developer.chrome.com/extensions/getstarted#unpacked

After installing:
1. Set the [options](#options) you prefer
2. Enter your [CentralReach credentials](#popup)
3. All done.

## [How it works](#how-it-works)

Provides [native system notifications/alerts/reminders](https://developers.google.com/web/updates/2017/04/native-mac-os-notifications) for various CentralReach features, including:

* [ReachMe RM's](https://centralreach.com/features/reachme)
  * Receive notifications when new RMs are sent your way
* Saved Filter result count changes
  * Receive notifications when changes in the # of results are detected for your saved filters

### [Notify on new Messages](#notify-on-new-messages)

If you have the [Show Message Notifications](#show-message-notifications) option enabled you will be notified upon receipt of a new message in your CentralReach inbox.

### [Notify on Event Approaching](#notify-on-event-approaching)

If you have the [Show Event Notifications](#show-event-notifications) option enabled, you'll be notified as appointments in your CentralReach schedule are approaching.  The [minutes prior to event to notify](#minutes-prior-to-event-to-notify) option defines the number of minutes before the appointment that you'll be notified.

On notification you have the ability to dismiss or snooze the reminder, the amount of time snoozed depends on the value set in the [Snooze minutes](#snooze-minutes) option.

For those in timezones that differ from the time used by your organization to schedule appointments, the [event minutes offset](#event-minutes-offset) setting allows you to define the number of minutes that you are offset from your organizations scheduling timezone, and reminders/alerts will adjust appropriately.

### [Notify on ReachMe RM](#notify-on-reachme-rm)

If you have the [Show ReachMe Notifications](#show-reachme-notifications) option enabled you will receive a notification on each RM sent your way.

### [Notify on Saved Filter Updates](#notify-on-saved-filter-updates)

If you have the [Show Saved Filter Notifications](#show-saved-filter-notifications) option enabled you will receive a notification when changes are detected in the count of results produced by saved filters you have created and saved in the CentralReach platform.


## [Options](#options)

### [Show Message Notifications](#show-message-notifications) 

Turn this option on to be notified when you receive [a new message](#notify-on-new-messages) within the CentralReach Messages module. 

### [Show Event Notifications](#show-event-notifications) 

Turn this option on to be notified when an [appointment](#notify-on-event-approaching) on your CentralReach schedule is approaching.  If enabled you'll be notified prior to your appointment by the minutes you have specified in the [minutes prior to event to notify](#minutes-prior-to-event-to-notify) option.

### [Show ReachMe Notifications](#show-reachme-notifications) 

Turn this option on to be notified when you [receive a new RM](#notify-on-reachme-rm)

### [Show Saved Filter Notifications](#show-saved-filter-notifications) 

Turn this option on to be notified when [filters you have saved](#notify-on-saved-filter-updates) inside the CentralReach platform produce new and/or different result counts.

### [Always open notifications in new tab](#always-open-notifications-in-new-tab)

Enable this option to always open links associated with notifications in a new tab in your browser. By default links are opened in the first tab of a browser that is opened to the CentralReach members site.

### [Never open notifications in active tab](#never-open-notifications-in-active-tab)

Enable this option to keep links resulting from clicking on notifications from even opening in the active CentralReach tab within your browser. By default links are opened in the first tab of a browser that is opened to the CentralReach members site.

### [Auto clear notifications after](#auto-clear-notifications-after)

Set this to the # of seconds to clear notifications automatically.  Set to 0 to disable this and honor your browser notification settings.

### [Event minutes offset](#event-minutes-offset)

Set to the number of minutes your timezone is offset from the time your organization uses to schedule appointments/events

### [Minutes prior to event to notify](#minutes-prior-to-event-to-notify)

Set this to the number of minutes prior to appointments on your schedule to be reminded of each event.

### [Snooze minutes](#snooze-minutes)

Set this to the number of minutes to snooze reminders for if you choose to do so.

