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

Provides native system notifications/alerts/reminders for various CentralReach features.

Depending on how you've configured your options, it will currently:

### [Notify on new Message](#notify-on-new-message)

If you have the [Show Message Notifications](#show-message-notifications) option enabled you will be notified upon receipt of a new message in the CentralReach platform.

### [Notify on Event Approaching](#notify-on-event-approaching)

If you have the [Show Event Notifications](#show-event-notifications) option enabled, you'll be notified as appointments in your CentralReach schedule are approaching.  The [minutes prior to event to notify](#minutes-prior-to-event-to-notify) option defines the number of minutes before the appointment that you'll be notified.


## [Options](#options)

### [Show Message Notifications](#show-message-notifications) 

Turn this option on to be notified when you receive [a new message](#notify-on-new-message) within the CentralReach Messages module. 

### [Show Event Notifications](#show-event-notifications) 

Turn this option on to be notified when an [appointment](#notify-on-event-approaching) on your CentralReach schedule is approaching.  If enabled you'll be notified prior to your appointment by the minutes you have specified in the [minutes prior to event to notify](#minutes-prior-to-event-to-notify) option.

### [Minutes prior to event to notify](#minutes-prior-to-event-to-notify)

Set this to the number of minutes prior to appointments on your schedule to be notified.

### [Snooze minutes](#snooze-minutes)

Always Open Notification Links in new tab
Never Open Notification Links in active tab
Auto clear notifications after (seconds, 0-10)
Event minutes offset (vs. scheduled event timezone, in minutes)





