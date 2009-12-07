if (document.location.href.match(/^http:..www.google.com.reader.view.1?$/)) {
	window.opera.addEventListener('BeforeExternalScript', function(event){
		var re = new RegExp('http://www.google.com/reader/ui/');
		if (re.test(event.element.src)) event.preventDefault();
		window._FR_scrollMain = function(){};
	}, false);
	
	window.addEventListener('DOMContentLoaded', function(event){
		var script = document.createElement('script');
		script.charset = 'utf8';
		script.src = 'http://localhost/dev/greader/ui';
		document.body.appendChild(script);
		script.onload = function(){ lib(); ui(); };
	}, false);
}
