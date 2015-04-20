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
	},

	events: {
		'keyup' : 'keyup',
		'click .remove' : 'removeTag',
		'click .suggestion' : 'addSuggestion'
	},

	initialize: function(options) {
		this.options = options;
		this.dictionary = ['javascript', 'nodejs', 'css', 'html', 'php'];
		this.dictionaryLong = ['jabot', 'jacal', 'jacks', 'jacky', 'jaded', 'jades', 'jager', 'jaggs', 'jaggy', 'jagra', 'jails', 'jakes', 'jalap', 'jalop', 'jambe', 'jambs', 'jammy', 'janes', 'janty', 'japan', 'japed', 'japer', 'japes', 'jarls', 'jatos', 'jauks', 'jaunt'];
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
	},

	onShow: function() {
		this.ui.input.focus();
	},

	keyup: function(e) {
		if (e.keyCode == 13) {
			var currentValue = this.ui.input.val();
			this.addTag(currentValue);
		} else {
			var searchMatches = this.search(this.ui.input.val());
			this.updateMatches(searchMatches);
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
					$(this).append('<span class="remove">x</span>');
				}
			});
		}
	},

	addSuggestion: function(e) {
		this.addTag($(e.currentTarget).text());
		this.ui.input.val('');
		this.ui.suggestions.empty();
	},

	addTag: function(value) {

		if (this.options.preventDuplicates) {
			if (_.contains(this.getTags(), value.toLowerCase())) {
			} else {
					this.ui.tags.append('<span class="tag">' + value + '</span>');
					this.ui.input.val('');
					this.mode();
			}
		} else {
			this.ui.tags.append('<span class="tag">' + value + '</span>');
			this.ui.input.val('');
			this.mode();
		}

		this.ui.input.focus();
	},

	removeTag: function(e) {
		$(e.currentTarget).parent().remove();
	},

	getTags: function() {
		var tags = [];
		$.each(this.$el.find('.tag'), function(index, value) {
			var tag = $(this).text().toLowerCase();
			tags.push(tag.substring(0, tag.length -1));
		});
		return tags;
	},

	updateMatches: function(matches) {

		var that = this;
		this.ui.suggestions.empty();

		var currentResults = this.getTags();
		var difference = _.difference(matches, currentResults);

		if (this.ui.input.val().length != 0) {
			$.each(difference, function(index, value) {
				that.ui.suggestions.append('<span class="suggestion">' + value + '</span>');
			});
		}
	}

});

app.regionMain.show(new Tagity({ preventDuplicates: true, characterLimit: 30 }));
