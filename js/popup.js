document.addEventListener('DOMContentLoaded', function() {
	const settingsButton = document.getElementById('crsettings');
	const authSettingsButton = document.getElementById('crauthsettings');
	const enableEventsButton = document.getElementById('crenableevents');
	const stopEventsButton = document.getElementById('crstopevents');
	const getEventsButton = document.getElementById('crgetevents');

	const updateCredsLink = document.getElementById("updateCredsLink");
	const cancelCredsUpdate = document.getElementById("cancelCredsUpdate");

	var status = document.getElementById("status");
	let hasSetupCredentials = false;

    const updateStatus = message => {
    	status.innerHTML = message;
    	setTimeout(() => (status.innerHTML = ""), 5000);
    };

    const statusError = message => {
    	updateStatus(`<span style="color: red; font-weigh: bold;">${message}</span>`);
    };

	settingsButton.addEventListener('click', function() {
		chrome.runtime.openOptionsPage();
	}, false);

	enableEventsButton.addEventListener('click', function() {
		chrome.runtime.sendMessage({ action: 'crEnableEvents'}, function(r) {
				updateStatus("Enabled/Re-Enabled all events and notifications.");
			});
	}, false);

	stopEventsButton.addEventListener('click', function() {
		chrome.runtime.sendMessage({ action: 'crStopEvents'}, function(r) {
				updateStatus("Stopped all remote events and notifications.");
			});
	}, false);

	getEventsButton.addEventListener('click', function() {
		chrome.runtime.sendMessage({ action: 'crGetEvents'}, function(r) {
				updateStatus("Retrieved all upcoming events from CentralReach.");
			});
	}, false);

	authSettingsButton.addEventListener('click', function() {
	    var crApiUser = document.getElementById('crapiuser').value;
		var crApiPw = document.getElementById('crapipw').value;
		
		if (crApiUser && crApiPw) {
			updateStatus("Authenticating...");

			crApi.authenticate(crApiUser, crApiPw)
				.then(r => {
						updateStatus("Credentials saved.");
						toggleCredentialsForm(false);

						chrome.runtime.sendMessage({ action: 'crCredentialsSaved'});

						return true;
					})
				.catch(x => {
						statusError(`Error trying to authenticate and/or store tokens - [${x}]</span>`);
						console.error(x);
						return false;
					});			

		} else {			
			statusError('Cannot update credentials - you must enter at least a CentralReach user and pw.');
		}
		
	}, false);

    updateCredsLink.addEventListener("click", () => {
      toggleCredentialsForm(true);
    });

    cancelCredsUpdate.addEventListener("click", () => {
      toggleCredentialsForm(false);
    });
	
    const toggleCredentialsForm = showForm => {
      credentialsInputForm.style.display = showForm ? "initial" : "none";
      credentialsSaved.style.display = showForm ? "none" : "initial";
      cancelCredsUpdate.style.display = hasSetupCredentials
        ? "initial"
        : "none";
    };

    // page init
    try {
		chrome.storage.local.get({
			crApiUser: '' 
		}, t => {
			if (t && t.crApiUser) {
			  // we have credentials stored
			  hasSetupCredentials = true;
			  toggleCredentialsForm(false);
			}
		});
	} catch (e) {
      console.error("Problem initializing CentralReach popup.", e);
    }

}, false);
