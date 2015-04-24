$.ajax.fake.registerWebservice('http://api.etaskr.com/tags/strings', function(data) {
    return ['One', 'Two', 'Three', 'Four', 'Five'];
});

$.ajax.fake.registerWebservice('http://api.etaskr.com/tags/objects', function(data) {
    return [
	    {
	    	id: "4dcfbb3c6a4f1d4c4a000012",
	    	name: 'one',
	    	category: 'A'
	    },
	    {
	    	id: "5dcfbb3c6a4f1d4c4a000012",
	    	name: 'two',
	    	category: 'A'
	    },
	    {
	    	id: "6dcfbb3c6a4f1d4c4a000012",
	    	name: 'three',
	    	category: 'B'
	    }
    ];
});