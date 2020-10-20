# Queue Tracker for EVGA

A Chrome extension which parses the currently logged in EVGA user's "My Notifies" page. The data gathered from each user
is stored in firestore and used to inform the user which signup date the queue has made it up to so far. A very rough
estimate of when the current user may receive a notification email is also displayed if enough data is available. This
estimate is calculated by comparing the current user's signup date to the signup date of user who received the latest
notification for the given card model.

## Building

### Development build (not minified)

`npm run build`

### Rebuild on file changes (watcher)

`npm run watch`

### Minified build

`npm run build:minify`

### _Note: This repository and build instructions are provided for informational/auditing purposes only. The extension will not function properly without a valid firebase config, which is out of the scope of this readme. Running the above build commands will not result in a fully functioning extension._

## Releases

The latest release (which is fully functioning) can be procured from the [Releases](https://github.com/cnsumner/evga-queue-tracker/releases) page.

### Loading the extension in chrome

1. Download the latest release from the [Releases](https://github.com/cnsumner/evga-queue-tracker/releases) page
2. Unzip it somewhere
3. Go to `chrome://extensions/`, switch on the `Developer mode` toggle, and click the `Load unpacked` button.
4. Browse to the folder you unzipped and confirm
