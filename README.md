# Queue Tracker for EVGA

A Chrome extension which parses the currently logged in EVGA user's "My Notifies" page. The data gathered from each user
is stored in firestore and used to inform the user which signup date the queue has made it up to so far. A very rough
estimate of when the current user may receive a notification email is also displayed if enough data is available.  This
estimate is calculated by comparing the current user's signup date to the signup date of user who received the latest
notification for the given card model.
