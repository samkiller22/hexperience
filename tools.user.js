// ==UserScript==
// @name         Hexperience Tools
// @namespace    https://github.com/lee8oi/hexperience
// @version      0.6
// @description  Hacker Experience log helper tools. Includes auto hide-me, auto ip-scraper with database, and log clear buttons.
// @author       lee8oi
// @match        *://hackerexperience.com/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_listValues
// @grant        GM_deleteValue
// ==/UserScript==

/*
    IP database
*/

if (window.location.href.search('ipdb') > 0) {
    $('#sidebar ul li.active').attr('class','');
    $('#sidebar ul').append('<li class="active"><a href="log?ipdb"><i class="fa fa-inverse fa-list-ul"></i> <span>IP Database</span></a></li>');
    ipDBPage();
} else {
    $('#sidebar ul').append('<li><a href="log?ipdb"><i class="fa fa-inverse fa-list-ul"></i> <span>IP Database</span></a></li>');
}
GM_addStyle('.fa-list-ul {content: "\f0ca";}');

function ipDBPage(){
    document.title = 'IP Database';
    $('.nav.nav-tabs:first').html('<li class="link active" id="tablocal"><a href="#" id="locallog"><span class="icon-tab he16-internet_log"></span>Local</a></li>');
    $('.nav.nav-tabs:first').append('<li class="link" id="tabweb"><a href="#" id="weblog"><span class="icon-tab he16-internet_log"></span>Internet</a></li>');
    $('.nav.nav-tabs:first').append('<li class="link" id="tabignore"><a href="#" id="ignorelog"><span class="icon-tab he16-internet_log"></span>Ignored</a></li>');
    $('.label.label-info').remove();
    $('#link0').attr('href','log?ipdb'); $('#link0').html('IPDB');
    $('#content-header h1').html('IP Database');
    setupIpDbPage('local', 'Local');
    loadIpLogs("localDb");
}

function setupIpDbPage(dbtype, dbname){
    $('.widget-content').html(`
        <div class="span12">
            <div class="widget-box text-left" style="margin-left: auto;margin-right: auto; width: 350px;">
                <div class="widget-title"><span class="icon"><span class="he16-collect_info"></span></span>
                    <h5>Select ` + dbname + ` IP</h5>
                </div>
                <div class="widget-content ` + dbtype + `ipdb"><div id="logdblist"></div></div>
            </div>
        </div>` );
}

$('#tablocal').click(function(){
    $('#tablocal').attr('class','link active');
    $('#tabweb').attr('class','link');
    $('#tabignore').attr('class','link');
    setupIpDbPage('local', 'Local');
    loadIpLogs("localDb");
});

$('#tabweb').click(function(){
    $('#tabweb').attr('class','link active');
    $('#tablocal').attr('class','link');
    $('#tabignore').attr('class','link');
    setupIpDbPage('web', 'Internet');
    loadIpLogs("internetDb");
});

$('#tabignore').click(function(){
    $('#tabignore').attr('class','link active');
    $('#tablocal').attr('class','link');
    $('#tabweb').attr('class','link');
    setupIpDbPage('ignore', 'Ignored');
    loadIpLogs("ignoreDb");
});

function loadIpLogs(dbName){
    var text = GM_getValue(dbName);
    if (!text) {
        GM_setValue(dbName, "{}");
    }
    var db = JSON.parse(text);
    var whichBtns = function() {
        if (dbName != "ignoreDb") {
            return '<a href="#" id="deleteip" name="'+ i +'">[delete]</a><a href="#" id="ignoreip" name="'+ i +'">[ignore]</a>';
        } else {
            return '<a href="#" id="deleteip" name="'+ i +'">[delete]</a>'
        }
    }
    for (var i in db) {
        $('#logdblist').append('<div id="'+ i +'"><a href="http://hackerexperience.com/internet?ip=' + i + '" id="loadlocal" name="' + i + '">'+ i +'</a>&nbsp;&nbsp;&nbsp;' +
        whichBtns() + '</br></div>');
    }
    GM_addStyle('#logdblist a#loadlocal {float: left;}');
    GM_addStyle('#logdblist a#deleteip {float: right;}');
    if (dbName != "ignoreDb") {
        GM_addStyle('#logdblist a#ignoreip {float: right;}');
    }
    var removeFromAll = function (name) {
        var local = JSON.parse(GM_getValue("localDb"));
        var internet = JSON.parse(GM_getValue("internetDb"));
        var ignore = JSON.parse(GM_getValue("ignoreDb"));
        delete internet[name];
        delete local[name];
        delete ignore[name];
        GM_setValue("localDb", JSON.stringify(local));
        GM_setValue("internetDb", JSON.stringify(internet));
        GM_setValue("ignoreDb", JSON.stringify(ignore));
    }
    $('a[id=deleteip]').click(function(){
        var name = $(this).attr('name');
        removeFromAll(name);
        $('div[id="'+ name +'"]').remove();
    });

    if (dbName != "ignoreDb") {
        $('a[id=ignoreip]').click(function(){
            var name = $(this).attr('name'), db = JSON.parse(GM_getValue(dbName));
            removeFromAll(name);
            $('div[id="'+ name +'"]').remove();
            dbig = JSON.parse(GM_getValue("ignoreDb"));
            if (!dbig[name]) {
                dbig[name] = true;
            }
            GM_setValue("ignoreDb", JSON.stringify(dbig));
        });
    }
}

/*
    Auto ip-scraper
*/

function uniqueArray(arr) {
    var unique = [], map = [];
        for (var i in arr) {
            if (map[arr[i]]) {
                continue;
            } else {
                map[arr[i]] = true;
                unique[unique.length] = arr[i];
            }
        }
    return unique;
}

function scrapeIPs(text) {
    if (typeof(text) === "string") {
        var re = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
        var found = text.match(re);
        if (found && found.length > 0) {
            return uniqueArray(found);
        }
    }
    return;
}

function saveIPs(dbName, ipArray) {
    if (typeof(ipArray) == "object" && ipArray.length > 0) {
        var dbText = GM_getValue(dbName), myIp = GM_getValue("myIp"), igText = GM_getValue("ignoreDb");
        var db = new Object();
        if (igText && igText.length > 0) igDb = JSON.parse(igText)
        if (dbText && typeof(dbText) === 'string' && dbText.length > 0) {
            db = JSON.parse(dbText);
            for (i in ipArray) {
                if (ipArray[i] == myIp || igDb[ipArray[i]]) continue;
                if (!db[ipArray[i]] ) db[ipArray[i]] = true;
            }
        } else {
            for (i in ipArray) {
                if (ipArray[i] == myIp || igDb[ipArray[i]]) continue;
                db[ipArray[i]] = true;
            }
        }
        var json = JSON.stringify(db);
        GM_setValue(dbName, json);
    }
}

if (window.location.href.indexOf("hackerexperience.com/log") != -1) {
    var log = $('form.log').find('.logarea');
    if (log && log.length > 0) {
        text = log.val();
        saveIPs("localDb", scrapeIPs(text));
    }
}

if (window.location.href.indexOf("hackerexperience.com/internet") != -1) {
    var log = $('form.log').find('.logarea');
    if (log && log.length > 0) {
        text = log.val();
        saveIPs("internetDb", scrapeIPs(text));
    }
}

/*
    Alert handling
*/

function alertText() {
    var alertArray = $(".alert.alert-success").text().split("\n");
    var alertText = alertArray.filter(function(val) {
    	return val.length > 1;
    });
    if (alertText.length > 0) {
        return alertText[0].trim();
    } else {
        return;
    }
}

function successAlert(text) {
    if (text) {
        switch (true) {
            case text === "Success! Software installed.":
                return true;
            case text === "Success! Software successfully hidden.":
                return true;
            case text === "Success! Software successfully uploaded.":
                return true;
            case text === "Success! Software successfully deleted.":
                return true;
            case text === "Success! Software successfully downloaded.":
                return true;
            case text === "Success! Software successfully seeked.":
                return true;
            case text.indexOf("virus removed") != -1:
                return true;
            case text.indexOf("viruses removed") != -1:
                return true;
        }
    }
    return false;
}

// Switch to logs on success alert (to trigger auto hideme)
if (window.location.href.indexOf("internet") != -1 && successAlert(alertText())) {
    window.location.replace("http://hackerexperience.com/internet?view=logs");
}

if (window.location.href.indexOf("software") != -1 && alertText() === "Success! Software successfully downloaded.") {
    window.location.replace("http://hackerexperience.com/internet?view=logs");
}
/*
    Clear log buttons
*/

if ($('#link2').text() == " Log file" || $('#link0').text() == " Log File") {
    $('form.log input.btn').before('<input class="btn btn-inverse" id="clearlog" type="button" value="Clear" style="width: 80px;"><span>     </span>');
}

$('#clearlog').click(function(){
    if ($('form.log').length) {
        $('form.log').find('.logarea').val('');
        $('form.log').submit();
    } else {
        console.log('No log found');
    }
});

/*
    Auto hide-me
*/

function hideMe() {
    var logArea = $('form.log').find('.logarea'), val = logArea.val(), myIp = GM_getValue("myIp");
    if (typeof(val) != "undefined" && val.length > 0) {
        var logLines = val.split('\n'), newLines = [], foundIP = false;
        $.each(logLines, function(i, el) {
            if (el.indexOf(myIp) != -1) {
                foundIP = true;
            } else {
                if (el.length > 0) newLines.push(el);
            }
        });
        if (foundIP) {
            logArea.val(newLines.join('\n'));
            $('form.log').submit();
        }
    }
}

if (window.location.href.indexOf("internet") != -1) {
    if (!GM_getValue("myIp")) {
        setTimeout(hideMe, 500);
    } else {
        hideMe();
    }
}

$(document).on("ready", ".header-ip-show", function(){
     var myIp = $('.header-ip-show').text();
     var storedIp = GM_getValue("myIp");
     if (storedIp != myIp) {
         GM_setValue("myIp", myIp);
     }
});
