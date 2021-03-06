

// works for steps and the workdown itself
function recalculateWorkdownAges() {
    var tds = document.getElementsByTagName( 'td' );
    for( var i=0 ; i<tds.length ; ++i ) {
        var td = tds[i];
        if( td.hasAttribute( 'data-lastupdated' )) {
            lastupdated = td.getAttribute( 'data-lastupdated' )
            if( lastupdated != '-' ) {
                td.innerHTML = lastupdated + '<br>' + relativeTimeFrom( lastupdated );
            } else {
                td.innerHTML = '&ndash;';
            }
        }
    }
}

function recalculateWorkdownStats() {
    var wodoSummaryTr  = document.getElementById( 'wodo-summary' );
    var wodoSummaryTds;
    if( wodoSummaryTr ) {
        // In a Workdown Page:
        wodoSummaryTds = wodoSummaryTr.getElementsByTagName( 'td' );
    } else {
        wodoSummaryTds = document.getElementsByTagName( 'td' );
    }

    for( var i=0 ; i<wodoSummaryTds.length ; ++i ) {
        wodoSummaryTd = wodoSummaryTds[i];
        if( wodoSummaryTd.hasAttribute( 'data-total' )) {

            // need to make thin bars wide enough so they can be seen, without creating overflow
            function perc( attr ) {
                return 100.0 * wodoSummaryTd.getAttribute( attr ) / wodoSummaryTd.getAttribute( 'data-total' );
            }

            var passedWidth  = perc( 'data-passed'  );
            var failedWidth  = perc( 'data-failed'  );
            var skippedWidth = perc( 'data-skipped'  );

            var adjustUp   = 0; // pixels we widened
            var adjustDown = 0; // number of wide bars that can potentially be adjusted down
            var delta      = 2;

            if( passedWidth > 0 && passedWidth < delta ) {
                passedWidth += delta;
                adjustUp    += delta;
            } else if( passedWidth > 25 ) {
                ++adjustDown;
            }
            if( failedWidth > 0 && failedWidth < delta ) {
                failedWidth += delta;
                adjustUp    += delta;
            } else if( failedWidth > 25 ) {
                ++adjustDown;
            }
            if( skippedWidth > 0 && skippedWidth < delta ) {
                skippedWidth += delta;
                adjustUp     += delta;
            } else if( skippedWidth > 25 ) {
                ++adjustDown;
            }
            if( adjustUp > 0 && adjustDown > 0 ) {
                if( passedWidth > 25 ) {
                    passedWidth -= adjustUp/adjustDown;
                }
                if( failedWidth > 25 ) {
                    failedWidth -= adjustUp/adjustDown;
                }
                if( skippedWidth > 25 ) {
                    skippedWidth -= adjustUp/adjustDown;
                }
            }

            var innerText = "    <div class=\"wodo-progress\">\n";
            if( passedWidth > 0 ) {
                innerText += "     <span class=\"wodo-progress-passed\" style=\"padding-left: "  + Math.round( passedWidth  ) + "%\"></span>\n";
            }
            if( failedWidth > 0 ) {
                innerText += "     <span class=\"wodo-progress-failed\" style=\"padding-left: "  + Math.round( failedWidth  ) + "%\"></span>\n";
            }
            if( skippedWidth > 0 ) {
                innerText += "     <span class=\"wodo-progress-skipped\" style=\"padding-left: " + Math.round( skippedWidth ) + "%\"></span>\n";
            }
            innerText += "    </div>\n"

            innerText += 'Passed:&nbsp;' + wodoSummaryTd.getAttribute( 'data-passed' );
            innerText += ', failed:&nbsp;' + wodoSummaryTd.getAttribute( 'data-failed' );
            innerText += ', skipped:&nbsp;' + wodoSummaryTd.getAttribute( 'data-skipped' );
            innerText += ' (of:&nbsp;' + wodoSummaryTd.getAttribute( 'data-total' ) + ')';
            wodoSummaryTd.innerHTML = innerText;
        }
    }
}

function workdownStepUpdated( name ) {
    var myform = document.forms['workdown_form']

    var http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {

            var dict = {};
            http.responseText.split( '&' ).forEach( function( pair ) {
                var pair2 = pair.split( '=', 2 );
                dict[pair2[0]] = pair2[1];
            } );


            // update Step
            if( 'steplastupdated' in dict ) {
                var stepTr = document.getElementById( name );

                var stepTds = stepTr.getElementsByTagName( 'td' );
                for( var i=0 ; i<stepTds.length ; ++i ) {
                    var stepTd = stepTds[i];
                    if( stepTd.hasAttribute( 'data-lastupdated' )) {
                        stepTd.setAttribute( 'data-lastupdated', dict['steplastupdated'] );
                    }
                }
            }

            // update Workdown
            if( 'workdownlastupdated' in dict ) {
                var wodoSummaryTr  = document.getElementById( 'wodo-summary' );
                var wodoSummaryTds = wodoSummaryTr.getElementsByTagName( 'td' );

                for( var i=0 ; i<wodoSummaryTds.length ; ++i ) {
                    var wodoSummaryTd = wodoSummaryTds[i];
                    if( wodoSummaryTd.hasAttribute( 'data-lastupdated' )) {
                        wodoSummaryTd.setAttribute( 'data-lastupdated', dict['workdownlastupdated'] );
                    }
                    if( wodoSummaryTd.hasAttribute( 'data-completed' )) {
                        wodoSummaryTd.setAttribute( 'data-completed', dict['workdownsstepscompleted'] );
                    }
                    if( wodoSummaryTd.hasAttribute( 'data-passed' )) {
                        wodoSummaryTd.setAttribute( 'data-passed', dict['workdownstepspassed'] );
                    }
                    if( wodoSummaryTd.hasAttribute( 'data-failed' )) {
                        wodoSummaryTd.setAttribute( 'data-failed', dict['workdownstepsfailed'] );
                    }
                    if( wodoSummaryTd.hasAttribute( 'data-skipped' )) {
                        wodoSummaryTd.setAttribute( 'data-skipped', dict['workdownstepsskipped'] );
                    }
                }
            }

            recalculateWorkdownStats();
            recalculateWorkdownAges();
        }
    };

    http.open( 'POST', myform.action, true);
    http.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
    http.send('verb=updateworkdown&stepname=' + name + '&stepstatus=' + myform[name].value);
}

function relativeTimeFrom( ts ) {
    var match = /^(\d\d\d\d)(\d\d)(\d\d)-(\d\d)(\d\d)(\d\d)/.exec( ts );
    if( !match ) {
        return '?';
    }

    var dts = new Date( match[1], match[2]-1, match[3], match[4], match[5], match[6] );
    var now = Date.now();
    var deltaSec = Math.round( ( now - dts )/1000 );

    if( deltaSec < 60 ) {
        return '&lt; 1 min ago';
    }

    deltaMin = Math.round( deltaSec/60 );
    if( deltaMin < 60 ) {
        return '&asymp; ' + deltaMin + ' min ago';
    }

    deltaHour = Math.round( deltaMin/60 );
    if( deltaHour < 24 ) {
        return '&asymp; ' + deltaHour + ' h ago';
    }

    deltaDay = Math.round( deltaHour/30 );
    return '&asymp; ' + deltaDay + ' d ago';
}

window.onload = function() {
    recalculateWorkdownStats();
    recalculateWorkdownAges();
}
