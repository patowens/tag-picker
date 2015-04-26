var app = Marionette.Application.extend({
  initialize: function(options) {
    console.log('App started in container:', options.container);
    var that = this;
  }
});

var app = new app({container: '#app'});
app.start();

app.addRegions({
	regionMain: '#regionMain'
});

var Tagity = Backbone.Marionette.ItemView.extend({

	className: "feature-tagity",

	template: '#tagity-template',

	ui: { 
		title: ".tagity-title",
		input : '.input',
		tags : '.tags',
		tag : '.tag',
		suggestions : '.suggestions',
		suggestion : '.suggestion',
		extras : '.extras',
		count: '.count',
		limit: '.limit'
	},

	events: {
		'keyup .input' : 'keyupOnInput',
		'keydown .input' : 'keydownOnInput',
		'click .remove' : 'removeTag',
		'click .suggestion' : 'addSuggestion',
		'click .add-tag' : 'addTag'
	},

	initialize: function(options) {
		this.options = options;
		this.currentTags = new Array();
		this.currentSuggestions = new Array();
		this.currentSuggestion = '';
		this.progressKeys = [9, 39, 40]; // tab, right arrow, down arrow
		this.functionalKeys = [8, 13, 46, 16, 37, 17, 18]; // backspace, enter, delete
		this.dictionary = this.options.data;
	},

	search: function(input) {
		var that = this;
		var reg = new RegExp(input.split('').join('\\w*').replace(/\W/, ""), 'i');
		if (!this.dictionary) {
			this.ui.suggestions.addClass('loading');
			if (this.ui.input.val().length)
				this.ui.suggestions.addClass('has-items');
		} else {
			this.ui.suggestions.removeClass('loading');

			if (this.options.valueField) {
				
				return this.dictionary.filter(function(tagObject) {
					if (tagObject[that.options.valueField].match(reg)) {
						return tagObject;
					}
				});
			
			} else {
			
			  return this.dictionary.filter(function(result) {
			    if (result.match(reg)) {
			      return result;
			    }
			  });

			}
		}
	},

	onRender: function() {
				
		this.ui.limit.text(this.options.characterLimit);
		var that = this;

		if (this.options.url) {

			this.ui.suggestions.empty();

			// Fetch data for the tag picker
			$.ajax({
		    type:'GET',
		    dataType:'jsonp',
		    fake: true,
		    url:this.options.url,
		    success:function(data, textStatus, XMLHttpRequest) {
	    		
		    	that.dictionary = data;
	    		that.ui.suggestions.empty();
	    		that.ui.suggestions.removeClass('loading');
	    		that.updateMatches(that.search(that.ui.input.val()));
		    }
			});
			
		}

		this.mode();

	},

	onShow: function() {
		var that = this;
		this.ui.input.focus();

		if (this.options.title) 
			this.ui.title.html(this.options.title)
		
		if (this.options.createTagAsYouType) {
			this.ui.tags.append('<span class="builder"></span>')
		}

		if (this.options.examples) {
		var examples = '';
			for (var i = 0; i < this.options.examples.length; i++) {
				var examplePrefix = '';
				if (i ==0) { examplePrefix = 'eg: '}
				examples += '<span class="example">' + examplePrefix + this.options.examples[i] + '</span>';
			}
			this.$el.find('.example').remove();
			this.ui.tags.prepend(examples);
		}

		if (this.options.prefill) {
			$.each(this.options.prefill, function(index, tagObject) {
				that.addTag(tagObject);
			});
		}

	},

	keyupOnInput: function(e) {

		this.updateCounter();
		var currentValue = this.ui.input.val();

		if (currentValue.length == 0) {
			this.ui.extras.removeClass('reveal');
			this.ui.input.removeClass('showing-extras');
		}

		// enter key (add tag)
		if (e.keyCode == 13) {

			// has user hit enter on a suggestion?
			if (this.currentSuggestion.length != 0) {
				
				// add tag

				if (this.options.valueField) {
					this.addTag(this.currentSuggestionObject);
				} else {
					this.addTag(this.currentSuggestion);
				}
				
				// if there was an example tag, hide it.
				if (this.options.examples)
					this.$el.find('.example').empty();

				// clear input
				this.ui.input.val('');
				this.currentSuggestion = '';

				// update suggestions (clear)
				var searchMatches = this.search(this.ui.input.val());
				this.updateMatches(searchMatches.slice(0, this.options.maxSuggestions || 99));
			} else if (currentValue.length != 0) {

				// is what the user typed an exact match to a suggestion?
				if (this.options.valueField) {
					var exactMatch = _.findWhere(this.dictionary, { name: currentValue }) || _.findWhere(this.dictionary, { name: currentValue.toLowerCase() });
					if (exactMatch) {
						this.addTag(exactMatch);						
					} else {
						this.addTag(currentValue);	
					}
				} else {
					this.addTag(currentValue);
				}
				
				// if there was an example tag, hide it.
				if (this.options.examples)
					this.$el.find('.example').empty();

				this.ui.extras.removeClass('reveal');
				this.ui.input.removeClass('showing-extras');

			}

		// there are no suggestions to worry about
		} else if (_.contains(this.progressKeys, e.keyCode)) {
			e.preventDefault();
		} else {
			// update suggestions
			
			if (this.ui.suggestions.hasClass('loading')) {
				return true;
			} else {


				var searchMatches = this.search(this.ui.input.val());
				if (searchMatches)
					this.updateMatches(searchMatches.slice(0, this.options.maxSuggestions || 99));

				if (this.options.createTagAsYouType) {
					if (this.ui.input.val().length) {
						this.ui.tags.find('.builder').text(' ' + this.ui.input.val() + '..');
					} else {
						if (this.currentTags.length == 0) {
							if (this.options.examples) {
								this.ui.tags.find('.builder').empty();

								var examples = '';
								for (var i = 0; i < this.options.examples.length; i++) {
									var examplePrefix = '';
									if (i ==0) { examplePrefix = 'eg: '}
									examples += '<span class="example">' + examplePrefix + this.options.examples[i] + '</span>';
								}
								this.$el.find('.example').remove();
								this.ui.tags.prepend(examples);

							}
						} else {
							this.ui.tags.find('.builder').empty();
							this.ui.tags.find('.example').text(this.ui.input.val());
						}
					}
				}

				if (this.ui.input.val()) {
					this.ui.extras.addClass('reveal');
					this.ui.input.addClass('showing-extras');
				}

			}

		}
	},

	keydownOnInput: function(e) {

		this.updateCounter();

		if (_.contains(this.progressKeys, e.keyCode)) {
			// tab key (cycle through suggestions)
			e.preventDefault();

			if (this.ui.input.val().length != 0 && this.currentSuggestions.length > 0) {
				// there are suggestions.  cycle through them.
				if (this.ui.suggestions.children('.focus').length == 0) {
					this.ui.suggestions.children(':first-child').addClass('focus');
					this.currentSuggestion = this.ui.suggestions.children(':first-child').text();

					if (this.options.valueField)
						this.currentSuggestionObject = _.findWhere(this.dictionary, { id : this.ui.suggestions.children(':first-child').attr('data-id') });

				} else {
					var currentFocus = this.ui.suggestions.find('.focus');
					this.ui.suggestions.children('.focus').removeClass('focus');
					currentFocus.next().addClass('focus');
					this.currentSuggestion = currentFocus.next().text();

					if (this.options.valueField)
						this.currentSuggestionObject = _.findWhere(this.dictionary, { id : currentFocus.next().attr('data-id') });

				}
			}
		} else if (_.contains(this.functionalKeys, e.keyCode)) {

			if (this.options.createTagAsYouType) {
				if (this.ui.input.val().length) {
					this.ui.tags.find('.builder').text(' ' + this.ui.input.val() + '..');
				}
			}

			return true;
		} else {

			this.$el.find('.example').empty();

			if (this.options.characterLimit) {
				if (this.ui.input.val().length >= this.options.characterLimit) {
					this.updateCounter();
					return false;
				}
			}

		}
	},

	mode: function() {
		var that = this;
		if (this.options.viewMode) {
			this.ui.input.hide();
			this.ui.extras.hide();
		} else {
			$.each(that.$el.find('.tag'), function(index, value) {
				if ($(this).find('.remove').length) {
				} else {
					$(this).append('<span class="remove"></span>');
				}
			});
		}
	},

	addSuggestion: function(e) {

		if (this.options.valueField) {
			// working with objects
			this.addTag((_.findWhere(this.dictionary, { id : $(e.currentTarget).attr('data-id') })));
		} else {
			// working with strings
			this.addTag($(e.currentTarget).text());
		}

		this.ui.input.val('');
		this.ui.suggestions.empty();
		this.ui.suggestions.removeClass('has-items');

		// if there was an example tag, hide it.
		if (this.options.examples)
		this.$el.find('.example').empty();

		this.ui.extras.removeClass('reveal');
		this.ui.input.removeClass('showing-extras');
	},

	addTag: function(value) {

		var tagHTML = ''; // we build that tag HTML here
		var tagObject;

		if(typeof value != 'string') {

			if (value.hasOwnProperty('originalEvent')) {
				tagObject = {
					name: this.ui.input.val()
				};
				value = tagObject[this.options.valueField];
				tagHTML = '<span class="tag">' + tagObject.name + '</span>';
			} else {

				tagObject = value;

				// Add meta fields to the tag if present.
				if (this.options.metaFields) {
					var allMetaFields = '';
					$.each(this.options.metaFields, function(index, meta) {
						if (tagObject[meta])
							allMetaFields += 'data-' + meta + '="' + tagObject[meta] + '" ';
					});
				}
				tagHTML = '<span class="tag" ' + allMetaFields + ' data-id="' + tagObject.id + '">' + tagObject[this.options.valueField] + '</span>';
				value = tagObject[this.options.valueField];
			}

		} else {
			
			tagObject = {
				name: value
			};

			tagHTML = '<span class="tag">' + tagObject.name + '</span>';
		}

		if (this.options.preventDuplicates) {

			var duplicatePosition = _.map(this.getTags(), function(tag) { return tag.name.toLowerCase() }).indexOf(value.toLowerCase());
			
			if (duplicatePosition != -1) {

				var tagOffset = 1;

				this.$el.find('.tag:nth-child(' + (duplicatePosition + tagOffset) + ')').addClass('tagErrorPulse');
				window.setTimeout(function() {
					this.$el.find('.tag:nth-child(' + (duplicatePosition + tagOffset) + ')').removeClass('tagErrorPulse');
				}.bind(this),500)
			} else {
				$(tagHTML).insertBefore('.example:first');
				this.currentTags.push(tagObject);
				this.ui.input.val('');
				this.mode();
			}
		} else {
			$(tagHTML).insertBefore('.example:first');
			this.currentTags.push(tagObject);
			this.ui.input.val('');
			this.mode();
		}

		this.updateCounter();
		this.ui.input.focus();
		this.ui.extras.removeClass('reveal');
		this.ui.input.removeClass('showing-extras');

		// if there were suggestions, clear them.
		this.ui.suggestions.empty();
		this.ui.suggestions.removeClass('has-items');

		// if there was an example tag, hide it.
		if (this.options.examples)
			this.$el.find('.example').empty();

		if (this.options.createTagAsYouType)
			this.$el.find('.builder').empty();

	},

	removeTag: function(e) {
		this.currentTags = _.reject(this.currentTags, function(tagObject) {
			return tagObject.name === $(e.currentTarget).parent().text()
		});
		$(e.currentTarget).parent().remove();
	},

	getTags: function(options) {

		var that = this;
		var tags = [];

		return this.currentTags;

		if (options && options.returnObjects) {

			// if (this.$el.find('.tag').length) {
			// 	$.each(this.$el.find('.tag'), function(index, value) {
			// 		var tagID = $(this).attr('data-id');
			// 		if (tagID) {
			// 			var tagObject = _.findWhere(that.dictionary, { id: tagID });
			// 			tags.push(tagObject);	
			// 		} else {
			// 			var tagName = $(this).text().toLowerCase();
			// 			tagName = tagName.substring(0, tagName.length);
			// 			var tag = { name: tagName };
			// 			tags.push(tag);
			// 		}
			// 	});
			// 	console.log(tags);
			// 	return _.without(tags, _.findWhere(tags, { name: "" }));
			// } else {
			// 	return false;
			// }

		} else {
			
			// if (this.$el.find('.tag').length) { 
			// 	$.each(this.$el.find('.tag'), function(index, value) {
			// 		var tag = $(this).text().toLowerCase();
			// 		tags.push(tag.substring(0, tag.length));
			// 	});
			// 	return tags;
			// } else {
			// 	return false;
			// }

		}

	},

	updateMatches: function(matches) {

		var that = this;
		this.ui.suggestions.empty();
		this.ui.suggestions.removeClass('has-items');

		var currentResults = _.map(this.getTags(), function(tag) {
			return tag.name;
		});

		if (!this.options.valueField) {

			// Working with strings
			matches = _.map(matches, function(data) { return data.toLowerCase() });
			var difference = _.difference(matches, currentResults);
			this.currentSuggestions = difference;

			if (this.ui.input.val().length != 0) {
				$.each(difference, function(index, value) {
					that.ui.suggestions.append('<span class="suggestion">' + value + '</span>');
					that.ui.suggestions.addClass('has-items');
				});
			}

		} else {

			// Working with objects 

			suggestions = _.filter(matches, function(tagObject) {
				return currentResults.indexOf(tagObject.name) === -1;
			});

			this.currentSuggestions = matches;

			if (this.ui.input.val().length != 0) {
				$.each(suggestions, function(index, suggestion) {

					var allMetaFields = '';

					// Add meta fields to the suggestion if present.
					if (that.options.metaFields) {
						$.each(that.options.metaFields, function(index, meta) {
							if (suggestion[meta])
								allMetaFields += 'data-' + meta + '="' + suggestion[meta] + '" ';
						});
					}
					that.ui.suggestions.append('<span class="suggestion" ' + allMetaFields + 'data-id="' + suggestion[that.options.idField] + '">' + suggestion[that.options.valueField] + '</span>');
					that.ui.suggestions.addClass('has-items');
				});
			}

		}

	},

	updateCounter: function() {
		var currentLength = this.ui.input.val().length;
		this.ui.count.text(this.ui.input.val().length);
		if (currentLength == this.options.characterLimit) {
			this.$el.find('.character-limit').addClass('errorPulse');
			window.setTimeout(function() {
				this.$el.find('.character-limit').removeClass('errorPulse');
			}.bind(this),500);
		} else {
			this.$el.find('.character-limit').removeClass('errorPulse');
		}

	}

});

app.regionMain.show(new Tagity({ 
	preventDuplicates: true, 
	characterLimit: 30,
	createTagAsYouType: true,
	examples: ['Spreadsheets', 'Databases'],
	maxSuggestions: 5,
	url: 'http://api.etaskr.com/tags/objects',
	idField: 'id',
	valueField: 'name',
	metaFields: ['category', 'foo'], // added to tag as data-fieldname="value",
	viewMode: false,
	title: "<i class='fa fa-tags'></i>Keywords",
	prefill: [{ id: '123', name: 'hello', category: 'C', foo: "bar" }, { id: '456', name: 'world', category: 'D' }],
}));