(function(){

// OVERVIEW
// To get general idea of how that script works,
// see OVERVIEW below or in file 30ui.js

if (!document.location.href.match(/^https?:..www.google.com.reader.view.1?$/)) return;

settings.css =
"html, body {" +
"  margin: 0;" +
"  padding: 0;" +
"}" +
"" +
"body {" +
"  padding-top: 26px;" +
"  font-family: Georgia, serif;" +
"}" +
"" +
"body.mobile {" +
"  padding-top: 40px;" +
"  font-size: 30px;" +
"}" +
"" +
"body > header {" +
"  display: block;" +
"  position: fixed;" +
"  top: 0;" +
"  left: 0;" +
"  right: 0;" +
"  height: 26px;" +
"  z-index: 100;" +
"  background-color: #c2cff1;" +
"}" +
"" +
"body.mobile > header {" +
"  height: 40px;" +
"}" +
"" +
"body.mobile > header > button {" +
"  padding: 2px 1px;" +
"  font-size: .95em;" +
"}" +
"" +
"" +
"body > header > button.unread, " +
"body > header > button.starred, " +
"body > header > button.shared, " +
"body > header > button.friends {" +
"  margin: 0;" +
"  border-radius: 5px 5px 0 0;" +
"  border: 1px solid #c2cff1;" +
"  height: 26px;" +
"  background-color: #ebeff9;" +
"}" +
"" +
"body.mobile > header > button.unread, " +
"body.mobile > header > button.starred, " +
"body.mobile > header > button.shared, " +
"body.mobile > header > button.friends {" +
"  height: 40px;" +
"  border-width: 4px;" +
"}" +
"" +
"body > header > button.friends {" +
"  margin-left: .5em;" +
"}" +
"" +
"body > header > button.shared {" +
"  margin-right: .5em;" +
"}" +
"" +
"body>header.unread button.unread, body>header.star button.starred, body>header.share button.shared, body>header.friends button.friends {" +
"  font-weight: bold;" +
"  background-color: white;" +
"  border-bottom-color: white;" +
"}" +
"" +
"body > header > a.resetView {" +
"  font-family: sans-serif;" +
"  position: absolute;" +
"  right: 0;" +
"  color: white;" +
"}" +
"" +
"body.mobile > header > a.resetView {" +
"  display: none;" +
"}" +
"" +
"body.mobile article img {" +
"  max-width: 100%;" +
"  -o-object-fit: contain;" +
"}" +
"" +
"body > div.container {" +
"  position: relative;" +
"}" +
"" +
"body.desktop > div.container {" +
"  padding: 0 .5em;" +
"}" +
"" +
"body.mobile > div.container {" +
"  padding-left: .2em;" +
"}" +
"" +
"div.shadow {" +
"  position: absolute;" +
"  top: 0;" +
"  width: 100%;" +
"  background: black;" +
"  opacity: .5;" +
"}" +
"" +
"section.entry {" +
"  display: block;" +
"  border: 0 solid #c2cff1;" +
"  border-bottom-width: 2px;" +
"  margin-bottom: .2em;" +
"}" +
"" +
"body.desktop section.entry {" +
"  padding-left: 1.4em;" +
"  padding-right: .5em;" +
"  width: 95%;" +
"}" +
"" +
"section.entry.active {" +
"  border-color: #70778c;" +
"}" +
"" +
"body.mobile section.entry > h2 {" +
"  font-size: 1em;" +
"  font-weight: normal;" +
"}" +
"" +
"section.entry > h2 {" +
"  font-family: sans-serif;" +
"}" +
"" +
"body.desktop section.entry > h2 {" +
"  margin-top: .1em;" +
"  margin-bottom: .3em;" +
"  margin-left: .3em;" +
"  text-indent: -1.4em;" +
"}" +
"" +
"body.mobile section.entry > h2 {" +
"  margin-bottom: .3em;" +
"}" +
"" +
"section.entry > h2 * {" +
"  display: inline;" +
"}" +
"" +
"section.entry > h2 > a {" +
"  text-decoration: none;" +
"  line-height: 1em;" +
"}" +
"" +
"body.desktop section.entry > h2 > button {" +
"  font-size: inherit;" +
"  width: 1em;" +
"  padding-right: 1.1em;" +
"}" +
"" +
"body.mobile section.entry > h2 > button {" +
"  display: none;" +
"}" +
"" +
"section.entry > h2 > input {" +
"  width: 95%;" +
"  font-size: inherit;" +
"}" +
"" +
"section.entry > article {" +
"  display: block;" +
"  overflow-x: auto;" +
"  clear: both;" +
"}" +
"" +
"section.entry > article > p {" +
"  line-height: 1.15em;" +
"}" +
"" +
"body.desktop section.entry > cite, " +
"body.desktop section.entry > article, " +
"body.desktop section.entry > footer {" +
"  margin-left: .5em;" +
"}" +
"" +
"section.entry > cite {" +
"  float: right;" +
"  text-align: right;" +
"}" +
"" +
"body.mobile section.entry > cite {" +
"  font-size: .5em;" +
"}" +
"" +
"body.desktop section.entry > cite > img {" +
"  margin: 6px;" +
"  vertical-align: middle;" +
"}" +
"" +
"section.entry > dl.comments {" +
"  display: block;" +
"  margin: .5em;" +
"  border: 2px dotted #70778c;" +
"  border-radius: 10px;" +
"  padding: .5em .5em 0 .5em;" +
"}" +
"" +
"section.entry > dl.comments > dt {" +
"  font-weight: bold;" +
"}" +
"" +
"section.entry > dl.comments > dt:after {" +
"  content: ':';" +
"}" +
"" +
"section.entry > dl.comments > dd {" +
"  margin-bottom: .5em;" +
"}" +
"" +
"section.entry > dl.comments > dd.addcomment.hidden .input {" +
"  display: none;" +
"}" +
"" +
"section.entry > footer {" +
"  clear: both;" +
"  display: block;" +
"  margin-left: 0;" +
"}" +
"" +
"section.entry > footer > span.buttons {" +
"  white-space: nowrap;" +
"}" +
"" +
"section.entry > footer > span.tags {" +
"  float: right;" +
"  opacity: .5;" +
"}" +
"" +
"section.entry div.spacer {" +
"  width: 90%;" +
"}" +
"" +
"body.mobile section.star button.star, body.mobile section.share button.share {" +
"  font-weight: bold;" +
"}" +
"" +
"button.star {" +
"  color: #8c8211;" +
"}" +
"" +
"button.share {" +
"  color: #8c6041;" +
"}" +
"" +
"button.edit, button.comment {" +
"  color: #4c8c4c;" +
"}" +
"" +
"button.star, button.share, button.edit, button.comment, button.cancel {" +
"  background: none;" +
"  border: none;" +
"}" +
"" +
"button {" +
"  cursor: pointer;" +
"}" +
"" +
"textarea {" +
"  width: 95%;" +
"}" +
"" +
"button var {" +
"  font-style: normal;" +
"}" +
"" +
"button var:empty:before, button var:empty:after {" +
"  content: '';" +
"}" +
"" +
"button var:after {" +
"  content: ' ';" +
"}" +
"";
})();