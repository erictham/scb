
//The AppModel class represents the whole application state.
//Properties with ko.observable() and ko.computed() are bound
//to the UI so changing these properties will automatically update
//the UI.

function AppModel(JET) {

	//Model-View properties

	this.companyName = ko.observable("");

	this.lastPrice = ko.observable(0);

	this.percentChange = ko.observable(0);
	
	this.formatedPercentChange = ko.computed(function() {
		var pctChange = this.percentChange();
		return ((pctChange > 0) ? "+" : "") + pctChange + " %";
	}, this);
	
	this.percentChangeColor = ko.computed(function() {
		var pctChange = this.percentChange();
		return ((pctChange > 0) ? "pos" : (pctChange < 0) ? "neg" : "" );
	}, this);
	
	this.news = ko.observableArray();

	//Private properties / functions

	var _self = this;
	var _currentRic = null;
	var _quoteSubscription = null;
	var _newsSubscription = null;

	function ctxChangeHandler(contextData) {
		if (contextData.length > 0) {
			var ric = null;
			//From Linked Object
			if (contextData[0]["RIC"]) { 
				ric = contextData[0]["RIC"];
			} else
			//From Search Box
			if (contextData[0]["unknown"]) {
				ric = contextData[0]["unknown"];
			}
			_self.setRIC(ric);
		}
	}

	function onUpdateHandler(subscription, ric, updatedValues) {
		if (updatedValues["DSPLY_NAME"]) {
			_self.companyName(updatedValues["DSPLY_NAME"].formatted);		
		}
		if (updatedValues["CF_LAST"]) {
			_self.lastPrice(updatedValues["CF_LAST"].raw);			
		}
		if (updatedValues["PCTCHNG"]) {
			_self.percentChange(updatedValues["PCTCHNG"].raw);
		}
	}

	function onNewsAppendHandler(newsObj) {
		_self.news.push(newsObj);
	}

	function onNewsDeleteHandler(newsObj) {
		_self.news.splice(i, 1);
	}

	function onNewsInsertHandler(newsObj) {
		_self.news.splice(i, 0, newsObj);
	}	

	//Public methods

	this.openNews = function (newsObj) {
		JET.navigate({
			name: "News",
			entities: [{
				NewsQuery: newsObj.urn
			}]
		})
	}

	this.setRIC = function (ric) {

		//Do nothing if the same RIC is entered
		if (ric == _currentRic) {
			return;
		}
		_currentRic = ric;

		//Setup new Quote Data Subscription
		if (_quoteSubscription != null) {
			_quoteSubscription.stop();
		}
		_quoteSubscription = JET.Quotes.create();
		_quoteSubscription.rics(ric)
					 .formattedFields("DSPLY_NAME")
					 .rawFields("CF_LAST", "PCTCHNG")
					 .onUpdate(onUpdateHandler)
					 .start();

		//Setup new News Data Subscription
		if (_newsSubscription != null) {
			_newsSubscription.stop();
		}
		_self.news.removeAll();
		_newsSubscription = JET.News.create()
									.newsExpression(ric)
									.topSize(0)
									.basketSize(20)
									.onAppend(onNewsAppendHandler)
									.onInsert(onNewsInsertHandler)
									.onDelete(onNewsDeleteHandler)
									.start();

		//Notify the change of the context to the other part of Eikon
		//including the linked app and the Active Symbol in the Eikon Toolbar
		JET.contextChange([{RIC:_currentRic}]);
	}

	this.initialize = function() {
		JET.onContextChange(ctxChangeHandler.bind(this));
	}

}

//Application Initialization by hooking at DOM Ready event using jQuery. 
$(function() {

	var APP_ID = "LAST_PRICE_APP";
	var appModel = null;

	//Start The App when JET is ready
	JET.onLoad(function () {
		appModel = new AppModel(JET);
		ko.applyBindings(appModel);
		appModel.initialize();

		//If there's a current Active Symbol available, use it as the initial context.
		//If not, show GOOG.O as default
		var currentSymbol = JET.getActiveSymbol();
		if (currentSymbol && currentSymbol.RIC) {
			appModel.setRIC(currentSymbol.RIC);
		} else {
			appModel.setRIC("GOOG.O");
		}
	});

	//Initialize JET
	JET.init({
		ID: APP_ID,
		Toolbar: {  //Have this Toolbar property to enable Search Box
			commandBars: [{  
				items: [{
					item: "Search",  
					id: APP_ID  //Unique ID of your application  
				}]  
			}]  
		}
	});

});