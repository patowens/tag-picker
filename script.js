var app = Marionette.Application.extend({
  initialize: function(options) {
    console.log('App started in container:', options.container);
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
		this.dictionary = ['javascript', 'nodejs', 'css', 'html', 'php'];
		this.dictionaryLong = ['jabot', 'jacal', 'jacks', 'jacky', 'jaded', 'jades', 'jager', 'jaggs', 'jaggy', 'jagra', 'jails', 'jakes', 'jalap', 'jalop', 'jambe', 'jambs', 'jammy', 'janes', 'janty', 'japan', 'japed', 'japer', 'japes', 'jarls', 'jatos', 'jauks', 'jaunt', 'jbhifi'];
		this.currentTags = new Array();
		this.currentSuggestions = new Array();
		this.currentSuggestion = '';
		this.progressKeys = [9, 39, 40]; // tab, right arrow, down arrow
		this.functionalKeys = [8, 13, 46, 16, 37]; // backspace, enter, delete
	},

	search: function(input) {
		var reg = new RegExp(input.split('').join('\\w*').replace(/\W/, ""), 'i');
	  return this.dictionaryLong.filter(function(result) {
	    if (result.match(reg)) {
	      return result;
	    }
	  });
	},

	onRender: function() {
		this.mode();
		this.ui.tags.prepend('<span class="tag example">eg: ' + this.options.exampleTag + '</span>')
		this.ui.limit.text(this.options.characterLimit);
	},

	onShow: function() {
		this.ui.input.focus();
	},

	keyupOnInput: function(e) {

		this.updateCounter();
		var currentValue = this.ui.input.val();

		if (currentValue.length == 0)
			this.ui.extras.removeClass('reveal');

		// enter key (add tag)
		if (e.keyCode == 13) {

			// has user hit enter on a suggestion?
			if (this.currentSuggestion.length != 0) {
				
				// add tag
				this.addTag(this.currentSuggestion);
				// if there was an example tag, hide it.
				if (this.options.exampleTag)
					this.$el.find('.example').empty();

				// clear input
				this.ui.input.val('');
				this.currentSuggestion = '';

				// update suggestions (clear)
				var searchMatches = this.search(this.ui.input.val());
				this.updateMatches(searchMatches.slice(0, this.options.maxSuggestions || 99));
			} else if (currentValue.length != 0) {
				this.addTag(currentValue);
				
				// if there was an example tag, hide it.
				if (this.options.exampleTag)
					this.$el.find('.example').empty();

				this.ui.extras.removeClass('reveal');

			}

		// there are no suggestions to worry about
		} else if (_.contains(this.progressKeys, e.keyCode)) {
			e.preventDefault();
		} else {
			// update suggestions
			var searchMatches = this.search(this.ui.input.val());
			this.updateMatches(searchMatches.slice(0, this.options.maxSuggestions || 99));

			if (this.options.createTagAsYouType) {

				if (this.ui.input.val()) {
					this.ui.tags.find('.example').text(' ' + this.ui.input.val() + '..');
				} else {
					if (this.currentTags.length == 0) {
						if (this.options.exampleTag)
							this.$el.find('.example').text('eg: ' + this.options.exampleTag);
					} else {
						this.ui.tags.find('.example').text(this.ui.input.val());
					}
				}
			}

			if (this.ui.input.val())
				this.ui.extras.addClass('reveal');

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
				} else {
					var currentFocus = this.ui.suggestions.find('.focus');
					this.ui.suggestions.children('.focus').removeClass('focus');
					currentFocus.next().addClass('focus');
					this.currentSuggestion = currentFocus.next().text();
				}
			}
		} else if (_.contains(this.functionalKeys, e.keyCode)) {
			return true;
		} else {
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
		if (this.mode == 'view') {
			this.$el.find('.tag').remove();
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
		this.addTag($(e.currentTarget).text());
		this.ui.input.val('');
		this.ui.suggestions.empty();

		// if there was an example tag, hide it.
		if (this.options.exampleTag)
		this.$el.find('.example').empty();

		this.ui.extras.removeClass('reveal');
	},

	addTag: function(value) {

		if(typeof value != 'string') {
			value = this.ui.input.val();
		}

		var tagHTML = '<span class="tag">' + value + '</span>';

		if (this.options.preventDuplicates) {
			var duplicatePosition = this.getTags().indexOf(value.toLowerCase());
			if (duplicatePosition != -1) {
				this.$el.find('.tag:nth-child(' + (duplicatePosition + 1) + ')').addClass('tagErrorPulse');
				window.setTimeout(function() {
					this.$el.find('.tag:nth-child(' + (duplicatePosition + 1) + ')').removeClass('tagErrorPulse');
				}.bind(this),500)
			} else {
				$(tagHTML).insertBefore('.example');
				this.currentTags.push(value);
				this.ui.input.val('');
				this.mode();
			}
		} else {
			$(tagHTML).insertBefore('.example');
			this.currentTags.push(value);
			this.ui.input.val('');
			this.mode();
		}

		this.updateCounter();
		this.ui.input.focus();
		this.ui.extras.removeClass('reveal');

		// if there was an example tag, hide it.
		if (this.options.exampleTag)
		this.$el.find('.example').empty();

	},

	removeTag: function(e) {
		_.pluck(this.currentTags, $(e.currentTarget).parent().text());
		$(e.currentTarget).parent().remove();
	},

	getTags: function() {
		var tags = [];
		if (this.$el.find('.tag').length) { 
			$.each(this.$el.find('.tag'), function(index, value) {
				var tag = $(this).text().toLowerCase();
				tags.push(tag.substring(0, tag.length));
			});
			return tags;
		}
		return false;	
	},

	updateMatches: function(matches) {

		var that = this;
		this.ui.suggestions.empty();

		var currentResults = this.getTags();
		var difference = _.difference(matches, currentResults);
		this.currentSuggestions = difference;

		if (this.ui.input.val().length != 0) {
			$.each(difference, function(index, value) {
				that.ui.suggestions.append('<span class="suggestion">' + value + '</span>');
			});
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
	characterLimit: 20,
	createTagAsYouType: true,
	exampleTag: 'Spreadsheets',
	maxSuggestions: 5
}));