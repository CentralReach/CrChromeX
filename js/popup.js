document.addEventListener('DOMContentLoaded', function() {
	var settingsButton = document.getElementById('crsettings');
	var authSettingsButton = document.getElementById('crauthsettings');
	var enableEventsButton = document.getElementById('crenableevents');
	var stopEventsButton = document.getElementById('crstopevents');
	var getEventsButton = document.getElementById('crgetevents');

	settingsButton.addEventListener('click', function() {
		chrome.runtime.openOptionsPage();
	}, false);

	enableEventsButton.addEventListener('click', function() {
		chrome.runtime.sendMessage({ action: 'crEnableEvents'});
	}, false);

	stopEventsButton.addEventListener('click', function() {
		chrome.runtime.sendMessage({ action: 'crStopEvents'});
	}, false);

	getEventsButton.addEventListener('click', function() {
		chrome.runtime.sendMessage({ action: 'crGetEvents'});
	}, false);

	authSettingsButton.addEventListener('click', function() {
	    var crApiUser = document.getElementById('crapiuser').value;
		var crApiPw = document.getElementById('crapipw').value;
		var credstatus = document.getElementById('crsavecredsstatus');

		if (crApiUser && crApiPw) {
			crApi.authenticate(crApiUser, crApiPw)
				.then(r => {
						credstatus.textContent = 'Credentials saved.';

						chrome.runtime.sendMessage({ action: 'crCredentialsSaved'});

						return true;
					})
				.catch(x => {
						credstatus.textContent = `Error trying to authenticate - [${x}]`;
						console.error(x);
						return false;
					});			

		} else {			
			credstatus.textContent = 'Cannot update credentials - you must enter at least a CentralReach user and pw.';
		}
		
	}, false);

	
}, false);
