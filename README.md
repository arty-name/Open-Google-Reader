Discontinued
------------

[Google Reader is going away on July 1st, 2013](http://googleblog.blogspot.de/2013/03/a-second-spring-of-cleaning.html).
Since Open Google Reader relies on Google Reader servers to work, it will stop 
working too. There are many alternatives, including open source ones. These you
can have on your server and no big company will close it. I have hacked together
something for myself. It works as a server for OGR but it's in no state to become 
public yet.


What is this about?
-------------------

Google Reader is a great product, I prefer it over all other feed aggregators,
but it is not perfect. It misses some features I want it to have, and some
existing features do not work the way I want them to work. Also it is rather
bloated and takes ages to load on gadgets. There's some room for adjustments
via user javascripts, but not enough.

This intends to be the ultimate google reader javascript, slick rewrite from
scratch. It doesn't aim to cover all features of its elder brother, however
it is much more suitable for most day-to-day tasks. Any time you need something
not implemented here, there's a handy link to switch to full-featured interface.

Another goal is to be flexible and customizable for everyone who knows a bit of
javascript. I do not want to make this bloated victim of creeping featuristis,
thus feel free to fork the repo and roll your own.


Screenshot
----------

You can easily change looks using css.

![Screenshot of Open Google Reader in action](https://github.com/arty-name/Open-Google-Reader/raw/0c84631a1014e1fd52c48f24bed0f7c4d63d277b/screenshot.png)


Features
--------

 * do anything you like with entries: remove ads, tracking, useless images, whatever!
 * direct loading of content from webpages is possible
 * forced reload of all feeds
 * filtering of unwanted entries
 * no more reloading to read entries published just now
 * slick interface
 * customizable hotkeys (on non-us keyboard too)
 * instant load, even on handhelds
 * links open in background by default
 * hotkey to open first link in entry body
 * single click to assign tag
 * smart scrolling with spacebar
 * site favicons
 * as aggressive preloading as you like
 * convenient view of large images
 * shows original entry's tags
 * number of unread items goes first in title
 * unread view automatically reloads in background
 * when large image loads in read entry, page doesn't "jump"


Misfeatures
-----------

Sorry folks, do these yourself if you need them, it's easy anyway.

 * sort orders are hardcoded, modify them to fit your habits (1 character to change)
 * expanded view only 
 * subscriptions list is available only in 
 [ unsupported "subscriptsions" branch](https://github.com/arty-name/Open-Google-Reader/tree/subscriptions) 
 by [vasya1](https://github.com/vasya1)
 * mark as read on scrolling past view only


Hotkeys
-------

j/k - next/previous entry  
s - star entry  
shift+s - share entry  
v/shift+v - open main link of current entry in background/foreground  
c/shift+c - open first link in current entry in background/foreground  
spacebar - go to next entry / next page of same entry / next large image  
r/shift+r - reload/forced reload  
w/e - show unread/starred entries  
u/i - show unread/starred entries  
o - show shared entries  
q - remove from view entries which are read but not starred  


Compatibility
-------------

Works nice in Opera. Chrome has some hotkeys issues. Firefox's Greasemonkey
required lots of patching, but was defeated. Works in Opera Mobile 
on Nokia n810, but you might need unicode fonts for button images.


Installation
------------

Opera: <http://github.com/arty-name/Open-Google-Reader/raw/master/build/open-google-reader.js>
  (I highly recommend UJS Manager <http://unite.opera.com/application/401/> )

Chrome & Firefox: <http://github.com/arty-name/Open-Google-Reader/raw/master/build/open-google-reader.user.js>


FAQ
---

Q: I'm using Opera and links are opened in foreground, how do I fix that?  
A: Activate option <opera:config#UserPrefs|Allowscripttolowerwindow>.

Q: On which URLs does script work?  
A: By default it works exactly on:  
 * <http://www.google.com/reader/view/>  
 * <http://www.google.com/reader/view/1>  
  Adding *any* other character switches script off, thus on  
   <http://www.google.com/reader/view/#>  
  you will see standard interface of Google Reader. You can get there by
  clicking "Normal view" link in top right corner of the screen, and get back
  by clicking Google Reader logo.

Q: Page at <http://www.google.com/reader/view/> takes too long to load, how can I
   speed it up?  
A: That page contains lots of user data, which slows page down. You can use same
   interface on page <http://www.google.com/reader/view/1>, which loads in a
   blink of eye. 
   
Q: How to install user javascript in Opera Mobile on Nokia Maemo?  
A: Copy the script to /home/user/.opera/ and add following line 
   to [User Prefs] section of /home/user/.opera/opera.ini:    
   User JavaScript File=/home/user/.opera/open-google-reader.js