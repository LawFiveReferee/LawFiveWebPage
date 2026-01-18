< !DOCTYPE html >
	<
	html lang = "en" >
	<
	head >
	<
	meta charset = "UTF-8" / >
	<
	meta name = "viewport"
content = "width=device-width, initial-scale=1.0" / >
	<
	title > Lineup Card Factory— Law 5 Referee < /title>

	<
	link rel = "icon"
href = "images/favicon.svg"
type = "image/svg+xml" / >
	<
	link rel = "stylesheet"
href = "/css/style.css" >
	<
	link rel = "stylesheet"
href = "css/fast-card-factory.css" >
	<
	/head>

	<
	body class = "admin-page" >

	<
	header >
	<
	h1 > Law Five Referee— Lineup Card Factory < /h1> <
	nav >
	<
	a href = "/index.html" > Home < /a> <
	a href = "/apps/game-card-factory/index.html" > Game Card Factory < /a> <
	a href = "/apps/lineup-card-factory/index.html" > Lineup Card Factory < /a> <
	/nav> <
	/header>

	<
	div class = "container" >

	<
	h1 > Lineup Card Factory < /h1>

	<
	!-- === === === === === === === === === === === === === === === === === === === ===
	1. Team Info & Roster ===
	=== === === === === === === === === === === === === === === === === === === -- >
	<
	section class = "collapsible-panel"
id = "section-1-team" >
	<
	button class = "collapsible-header" >
	<
	span class = "collapsible-icon" > + < /span> <
	span class = "collapsible-title" > 1. Paste / Edit Team Info & Roster < /span> <
	/button> <
	p class = "section-subtitle"
id = "status-section-1-team" > Load or create a team. < /p> <
	div class = "collapsible-body" >

	<
	!--Team selector-- >
	<
	div class = "team-selector-row" >
	<
	label
for = "teamSelect" > Select Team: < /label> <
	select id = "teamSelect" > < /select> <
	button id = "newTeamBtn"
class = "btn" > New Team < /button> <
	button id = "cloneTeamBtn"
class = "secondary" > Clone Team < /button> <
	button id = "deleteTeamBtn"
class = "secondary" > Delete Team < /button> <
	/div>

	<
	!--Team fields-- >
	<
	div class = "team-fields-grid" >
	<
	input id = "teamId"
placeholder = "Team ID (match schedule text)"
class = "macos-input" >
<
input id = "teamNumber"
placeholder = "Team Number"
class = "macos-input" >
<
input id = "teamName"
placeholder = "Team Name"
class = "macos-input" >
<
input id = "teamCoach"
placeholder = "Team Coach"
class = "macos-input" >
<
input id = "teamRegion"
placeholder = "Team Region"
class = "macos-input" >
<
input id = "teamAsstCoach"
placeholder = "Assistant Coach"
class = "macos-input" >
<
input id = "teamAgeDiv"
placeholder = "Age/Division"
class = "macos-input" >
<
input id = "teamColors"
placeholder = "Team Colors"
class = "macos-input" >
<
/div>

<
!--Roster input-- >
<
textarea id = "rosterInput"
class = "import-textarea"
placeholder = "Paste player roster: Number <tab> Player Name" > < /textarea>

	<
	div class = "roster-buttons" >
	<
	button id = "parseRosterBtn"
class = "btn" > Parse Roster < /button> <
	button id = "clearRosterBtn"
class = "secondary" > Clear Roster < /button> <
	button id = "saveTeamBtn"
class = "btn" > Save Team < /button> <
	/div>

	<
	div id = "rosterTableContainer" > < /div> <
	/div> <
	/section>

	<
	!-- === === === === === === === === === === === === === === === === === === === ===
	2. Paste Schedule Text ===
	=== === === === === === === === === === === === === === === === === === === -- >
	<
	section class = "collapsible-panel"
id = "section-2" >
	<
	button class = "collapsible-header" >
	<
	span class = "collapsible-icon" > + < /span> <
	span class = "collapsible-title" > 2. Paste Game / Schedule Text < /span> <
	/button> <
	p class = "section-subtitle"
id = "status-section-2" > Paste schedule here(optional). < /p> <
	div class = "collapsible-body" >
	<
	textarea id = "rawInput"
class = "import-textarea"
placeholder = "Paste schedule text here" > < /textarea> <
	div class = "parse-row" >
	<
	button id = "parseBtn"
class = "btn" > Extract Games < /button> <
	button id = "clearScheduleBtn"
class = "secondary" > Clear Schedule < /button> <
	/div> <
	/div> <
	/section>

	<
	!-- === === === === === === === === === === === === === === === === === === === ===
	3. Select & Filter Games ===
	=== === === === === === === === === === === === === === === === === === === -- >
	<
	section class = "collapsible-panel"
id = "section-3" >
	<
	button class = "collapsible-header" >
	<
	span class = "collapsible-icon" > + < /span> <
	span class = "collapsible-title" > 3. Select & Filter Games < /span> <
	/button> <
	p class = "section-subtitle"
id = "status-section-3" > Filter games involving this team. < /p> <
	div class = "collapsible-body" >
	<
	input id = "filterInput"
class = "macos-input"
placeholder = "Filter by opponent, date, etc" >
	<
	div class = "filter-buttons" >
	<
	button id = "applyFilterBtn"
class = "btn" > Apply Filter < /button> <
	button id = "clearFilterBtn"
class = "secondary" > Clear Filter < /button> <
	/div> <
	/div> <
	/section>

	<
	!-- === === === === === === === === === === === === === === === === === === === ===
	4. Bulk Edit Selected Lineups ===
	=== === === === === === === === === === === === === === === === === === === -- >
	<
	section class = "collapsible-panel"
id = "section-4" >
	<
	button class = "collapsible-header" >
	<
	span class = "collapsible-icon" > + < /span> <
	span class = "collapsible-title" > 4. Bulk Edit Selected Lineups < /span> <
	/button> <
	p class = "section-subtitle"
id = "status-section-4" > Edit selected games / lineups. < /p> <
	div class = "collapsible-body" >
	<
	!--Bulk edit fields(date / time, field, etc) -- >
	<
	div class = "macos-bulk-panel" >
	<
	div class = "macos-row" >
	<
	label > Date < /label> <
	input id = "bulkDate"
type = "date"
class = "macos-input" >
<
/div> <
div class = "macos-row" >
<
label > Location / Field < /label> <
	input id = "bulkLocation"
type = "text"
class = "macos-input" >
<
/div> <
div class = "macos-row two-columns" >
<
div class = "column" > < label > Opponent < /label><input id="bulkOpponent" class="macos-input"></div >
	<
	div class = "column" > < label > Notes < /label><input id="bulkNotes" class="macos-input"></div >
	<
	/div> <
	div class = "macos-button-row" >
	<
	button id = "applyBulkBtn"
class = "btn" > Apply to Selected < /button> <
	button id = "clearBulkBtn"
class = "secondary" > Clear < /button> <
	/div> <
	/div> <
	/div> <
	/section>

	<
	!-- === === === === === === === === === === === === === === === === === === === ===
	5. Lineup Card Preview ===
	=== === === === === === === === === === === === === === === === === === === -- >
	<
	section class = "collapsible-panel"
id = "section-5" >
	<
	button class = "collapsible-header" >
	<
	span class = "collapsible-icon" > + < /span> <
	span class = "collapsible-title" > 5. Lineup Card Preview < /span> <
	/button> <
	p class = "section-subtitle"
id = "status-section-5" > No cards to preview yet. < /p> <
	div class = "collapsible-body" >
	<
	div id = "previewContainer" > < /div> <
	/div> <
	/section>

	<
	!-- === === === === === === === === === === === === === === === === === === === ===
	6. Template Selector ===
	=== === === === === === === === === === === === === === === === === === === -- >
	<
	section class = "collapsible-panel"
id = "section-6" >
	<
	button class = "collapsible-header" >
	<
	span class = "collapsible-icon" > + < /span> <
	span class = "collapsible-title" > 6. Choose Template < /span> <
	/button> <
	p class = "section-subtitle"
id = "status-section-6" > Select lineup or roster template. < /p> <
	div class = "collapsible-body" >
	<
	div class = "template-carousel-wrapper" >
	<
	button id = "prevTemplate"
class = "carousel-arrow left" > & lsaquo; < /button> <
div class = "template-carousel" > < div class = "template-slide active" > < img id = "templateImage" > < /div></div >
	<
	button id = "nextTemplate"
class = "carousel-arrow right" > & rsaquo; < /button> <
/div> <
p id = "templateName"
class = "template-name" > < /p> <
p id = "templateStatus"
class = "template-status" > < /p> <
/div> <
/section>

<
!-- === === === === === === === === === === === === === === === === === === === ===
7. Generate PDF
	===
	=== === === === === === === === === === === === === === === === === === === -- >
	<
	section class = "collapsible-panel"
id = "section-7" >
	<
	button class = "collapsible-header" >
	<
	span class = "collapsible-icon" > + < /span> <
	span class = "collapsible-title" > 7. Generate Lineup Cards & Rosters < /span> <
	/button> <
	p class = "section-subtitle" > Export selected cards < /p> <
	div class = "collapsible-body" >
	<
	button id = "generateBtn"
class = "btn fullwidth" > Generate PDF < /button> <
	p id = "generateStatus" > < /p> <
	/div> <
	/section>

	<
	/div>

	<
	footer >
	<
	p > ©2026 Law Five Referee < /p> <
	/footer>

	<
	script type = "module"
src = "js/lineup-card-factory.js?v=20260113a" > < /script> <
	/body> <
	/html>