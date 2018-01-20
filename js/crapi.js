const crLocalGet = o => new Promise(r => chrome.storage.local.get(o, r));
const crLocalSet = o => new Promise(r => chrome.storage.local.set(o, r));

class CrApi {
	constructor(url, debug) {
		this.urlAppend = 'format=json';
		this.apiClientSource = 'crchromex'
		this.debug = debug;
		this.authenticated = false;
		this.badAuthAttempts = 0;

		this.baseApiUrl = url;
		this.apiToken = '';
		this.apiSession = '';

		chrome.storage.local.get({
	  			crApiToken: '',
	  			crApiCurrentSessionId: '',
	  			crApiUrl: ''
	  		}, function (r) {
	  			crApi.baseApiUrl = crApi.baseApiUrl || r.crApiUrl || 'https://members.centralreach.com/crxapi';
				crApi.apiToken = r.crApiToken || '';
				crApi.apiSession = r.crApiCurrentSessionId || '';
	  		});
  	}

  	//*****************************************************************************
  	// PUBLIC METHODS
	//*****************************************************************************

	monitor(secure) {
  		var path = `/monitor${secure ? 'auth' : ''}`

		this.crcl('monitor', secure, 'starting');

  		return  this.send('GET', path)
		  			.then(r => {
			  				return this.crcl('monitor', r.response);
			  			}, x => {
			  				return this.crclx('monitor', x);
			  			});
  	}

  	getEvents(startDate, endDate) {
		this.crcl('getEvents', 'starting');

		var now = Date.now();

		if (!startDate) {
			startDate = now - 72000000
		}
		if (!endDate) {
			endDate = now + 100800000
		}

  		return  this.send('GET', '/schedule/events', {
  							StartDate: startDate,
  							endDate: endDate
  						})
		  			.then(r => {
			  				return this.crcl('getEvents', r.response);
			  			}, x => {
			  				return this.crclx('getEvents', x);
			  			});
  	}

	listenForMyNotifications(msgCallback) {
		if (!navigator.onLine) {
			return Promise.resolve(false);
		}

		if (this.eventSource) {
			return Promise.resolve(false);
		}

		return  this.ensureAuthenticated()
					.then(() => {
							if (this.eventSource) {
								return false;
							}

							this.eventSource = new EventSource(this.baseApiUrl + '/event-stream?channels=ServerUserItemNotification', { withCredentials: true });

							$(this.eventSource).handleServerEvents({
						        handlers: {
						            ServerUserMessage: msgCallback
						        }
							});

							return true;
						})
					.then(r => {
							if (!r) {
								return false;
							}

							this.eventSource.addEventListener('error', function (e) {
									crApi.monitor(true)
										 .catch(x => {
												crApi.stopMyNotifications();
										 		return false;
										 	});
							    }, false);

							return true;
						});
	}

  	stopMyNotifications() {
  		if (!this.eventSource) {
  			return;
  		}

  		this.crcl('stopMyNotifications', 'closing and reloading');

  		if (this.eventSource) {
  			this.eventSource.close();
  		}

  		if ($.ss.eventSource) {
	 		$.ss.eventSource.close();
 		}

  		chrome.runtime.reload();
  	}

	//*****************************************************************************
  	// INTERNAL UTILITY METHODS
	//*****************************************************************************

  	crcl(method, obj, msg) {
  		if (this.debug) {
  			console.log(`CrApi.${method} :: ${msg || 'N/A'} :: ${obj || 'N/A'}`);
  		}

  		return obj;
  	}

  	crclx(method, x, msg) {
  		if (this.debug) {
  			console.error(`CrApi.${method} FAILED :: ${msg || 'N/A'}`);
  			console.error(x);
  		}

  		throw new Error(`Exception in CrApi.${method} :: ${x}`);

  		return false;
  	}

	//*****************************************************************************
  	// PRIVATE FUNCTIONAL METHODS
	//*****************************************************************************
	
	ajax(webMethod, url, data) {
  		this.crcl('ajax', url, 'starting');

  		return new Promise((r,x) => {
			$.ajax({
				accepts: 'application/json',
				contentType: 'application/json; charset=utf-8',
				timeout: 180000,
				type: webMethod,
				url: url,
				data: JSON.stringify(data),
				dataType: 'json',
				xhrFields: {
			       withCredentials: true
			    },
				headers: {
					'X-CrApi-ClientSource': this.apiClientSource,
					'X-CrApi-Token': this.apiToken,
					'X-ss-id': this.apiSession
				},
				success: function(msg) {
				    r({
				    	success: true,
				    	response: msg
				    });
				},
				error: function(jxhr) {
					x({
						success: false,
						response: jxhr,
						status: jxhr.status,
						errorMessage: jxhr.responseText
					});
				}
			});
  		});
  	}

  	authenticate(user, pw) {
  		this.crcl('authenticate', user, 'starting');

  		return crLocalGet({
	  			crApiToken: '',
	  			crApiUser: '',
	  			crApiCode: '',
	  			crApiCurrentSessionId: '',
	  			crApiUrl: ''
	  		})
  		.then(r => {
  				this.crcl('authenticate', r.crApiToken, 'starting 1st resolve');
	  			
	  			var u = user || r.crApiUser;
	  			var p = pw || r.crApiCode;

	  			if (!u && !p) {
	  				this.crcl('authenticate', null, 'no user or pw');

	  				this.invalidateAuthentication();

	  				throw new Error('Cannot authenticate - no credentials found');
			  	}

			  	if (this.badAuthAttempts > 3) {
			  		this.crcl('authenticate', null, 'exceeded bad auth attempts');

			  		this.invalidateAuthentication();
			  		
			  		throw new Error('Cannot authenticate - too many invalid attempts, re-enter your credentials');
			  	}

			  	var url = this.baseApiUrl;
			  	var isNewUrl = false;

			  	if (url != r.crApiUrl) {
			  		isNewUrl = true;
			  	}

			  	if (isNewUrl || !r.crApiToken) {
			  		this.apiToken = forge.util.encode64(forge.random.getBytesSync(50)).replace(/\+/g, '-').replace(/\//g,'_').replace(/=/g, '_');
			  		this.crcl('authenticate', this.apiToken, 'set api token due to new url or missing token');
			  	} else {
			  		this.apiToken = r.crApiToken;
			  	}

			  	chrome.storage.local.set({
			  		crApiToken: this.apiToken,
			  		crApiUser: u,
			  		crApiCode: p,
			  		crApiUrl: url,
			  	});

			  	return {
			  		user: u,
			  		code: p,
			  		sessionId: isNewUrl ? '' : r.crApiCurrentSessionId
			  	};
		  	})
	  	.then(ao => { 
		  		this.crcl('authenticate', ao.sessionId, 'starting 2nd resolve');

		  		if (this.badAuthAttempts <= 0 && !this.apiSession && ao.sessionId) {
  					this.crcl('authenticate', this.badAuthAttempts, 'first load authentication info pulled from storage');

				  	this.apiSession = ao.sessionId;

				  	return {
				  		success: true,
				  		response: {
				  			sessionId: this.apiSession,
				  			memo: 'first load auth info'
				  		}
				  	};

				} else {
					this.crcl('authenticate', 'logging out');

				  	this.apiSession = ao.sessionId;

				  	return  this.send('POST', '/auth/logout', {}, true)
							  	.then(lo => {
							  		this.crcl('authenticate', 'logging in');

									return this.send('POST', '/auth/credentials', {
										  			Username: ao.user,
													Password: ao.code,
													RememberMe: true,
													Meta: {
														_ClientSource: this.apiClientSource,
														_CrApiToken: this.apiToken,
														_CrApiSession: this.apiSession
													}
												}, true);
							  	});
			  	}
	  		})
		.then(ar => {
				this.crcl('authenticate', ar.response, 'starting 4th resolve');

				if (ar.success && ar.response.sessionId) {
					this.crcl('authenticate', ar.response, 'successfully authenticated');

					chrome.storage.local.set({
						crApiCurrentSessionId: ar.response.sessionId
					});

				  	this.apiSession = ar.response.sessionId;

					this.badAuthAttempts = 0;
		  			this.authenticated = true;
		  		} else {
		  			this.crcl('authenticate', ar.response, 'unsuccessful authentication');

		  			this.authenticated = false;

					this.badAuthAttempts++;

					if (this.badAuthAttempts > 3) {
						this.invalidateAuthentication();
					}
		  		}

		  		return ar;
			});
  	}

  	invalidateAuthentication() {
  		chrome.storage.local.remove(['crApiUser','crApiCode','crApiToken','crApiCurrentSessionId']);
		
		this.apiSession = '';
		this.apiToken = '';

		this.authenticated = false;

		return true;
  	}

  	ensureAuthenticated(isAuth) {
  		this.crcl('ensureAuthenticated', isAuth, 'starting');

  		return new Promise((r,x) => {

  			if (isAuth || this.authenticated) {
  				this.crcl('ensureAuthenticated', isAuth, 'short circuit already authenticated or isAuth request is true:');
  				r();
  			} else {
  				this.crcl('ensureAuthenticated', isAuth, 'starting auth call');

	  			this.authenticate()
	  				.then(ar => {
		  					if (this.authenticated) {
		  						this.crcl('ensureAuthenticated', ar.success, 'authenticated, resolving');
			  					return r(ar);
			  				} else {
			  					this.crcl('ensureAuthenticated', ar.success, 'not authenticated, rejecting');
			  					return x(ar);
			  				}
			  			}, arx => {
			  				this.crcl('ensureAuthenticated', arx.message, 'rejecting auth call');
			  				return x(arx);
			  			});
	  		}
  		});
  	}

  	authAndSend(webMethod, url, data, isAuth) {
  		this.crcl('authAndSend', url, 'starting');

  		return this.ensureAuthenticated(isAuth)
  			.then(() => {
  					this.crcl('authAndSend', null, 'starting 1st resolve');

	  				// Authenticated successfully or attempting to auth...
	  				return this.ajax(webMethod, url, data);
	  			}, arx => {
	  				this.crcl('authAndSend', arx.message, 'starting 1st reject, cannot auth');

	  				// Did not auth successfully via a new auth attempt...nothing we can do here
	  				// aside from throw...
	  				throw new Error(`Cannot authenticate - auth response exception of ${arx.message}`);
	  			});
	}

  	send(webMethod, path, data, isAuth) {
  		var haveQ = path.indexOf('?') >= 0;
  		var url = `${this.baseApiUrl}${path}${haveQ ? '&' : '?'}${this.urlAppend}`;
  		
  		this.crcl('send', url, 'starting');

  		return this.authAndSend(webMethod, url, data, isAuth)
  			.then(ajr => {
  					this.crcl('send', ajr, 'starting 1st resolve');
	  				
	  				// Success, return the response
	  				return ajr;
	  			}, ajx => {
	  				this.crcl('send', ajx.status, 'starting 1st reject');

	  				// Unsuccessful, if a 401 try to re-auth and retry
	  				if (!isAuth && !ajx.success && ajx.status == 401) {
	  					this.crcl('send', ajx.errorMessage, 'retrying on 401');

	  					this.authenticated = false;

	  					return this.authAndSend(webMethod, url, data, false)
	  						.then(a => {
		  							this.crcl('send', a, 'retried authAndSend success');
			  						return a
			  					});
	  				} else {
	  					return this.crclx('send', ajx.errorMessage || `Cannot authenticate - auth response of ${ajx}`, 'throwing cannot auth');
	  				}
  				});
  	}

}

var crApi = new CrApi();
