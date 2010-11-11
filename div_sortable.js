/**
 * div_sortable.js
 *
 * Table sorting for div-tables
 *
 * See the supplied README file for more details
 *
 **/

/*
 * make sure we can compare strings
 *
 */
String.prototype.cmp = function(b) {
    var a = this+'';
    return (a===b) ? 0 : (a>b) ? 1 : -1;
}

// keep track of the availble sortable tables
var tables = new Array();

// set the symbols (or images if you like) for selected and unselected up and
// down links
var sortLinkSymbols = $H({
    unselected: $H({ up: "&#x25b3;", down: "&#x25bd;" }),
    selected:   $H({ up: "&#x25b2;", down: "&#x25bc;" })
});

/*
 * find all the sortable tables and place sort links on the header row and
 * figure out if there are datatypes defined
 *
 */
function initSortable() {
    // keep track of the tables by index
    var tableCount = 0;

    $$('div.table.sortable').each(function(table) {
        // keep track of the columns by index
        var colCount  = 0;
        var dataTypes = new Array();

        table.select('div.header.row').each(function(header_row) {
            header_row.select('div.cell').each(function(cell) {
                if ( cell.readAttribute('data-unsortable') != "true" ) {
                  cell.insert("&nbsp;");
                  cell.insert(sortLink(tableCount, colCount, "down"));
                  cell.insert(sortLink(tableCount, colCount, "up"));
                  cell.insert("&nbsp;&nbsp;");

                  dataTypes[colCount] = getType(cell);
                }
                
                colCount++;
            });
        });

        tables[tableCount++] = $H( { element: table, dataTypes: dataTypes } );
    });
}

/*
 * generate a sort link for the table/column in the right direction
 *
 */
function sortLink(tableCount, colCount, direction) {
    var id     = "su";
    var func   = "sortUp";
    var symbol = sortLinkSymbols.get('unselected').get('up');

    // when sorting in a different direction, make different links
    if ( direction == "down" ) {
        id     = "sd";
        func   = "sortDown";
        symbol = sortLinkSymbols.get('unselected').get('down');
    }

    var fullId = id + "_" + tableCount + "_" + colCount;

    // TODO : create element by prototype
    return "<a data-noblock='true' " +
        "id='" + fullId + "' href='#' class='sortlink'" +
        "onclick='"+
          func + "(" + tableCount + "," + colCount + ");" +
          "setSelectedSortLink(\"" + fullId + "\"); return false;" +
        "'>" + symbol + "</a>";
}

/*
 * return the given link to the normal state
 *
 */
function unselectSortLink(element) {
    var symbol = sortLinkSymbols.get('unselected').get('up');
    if ( element.readAttribute('id').match(/sd_/) ) {
        symbol = sortLinkSymbols.get('unselected').get('down');
    }

    element.update(symbol);
}

/*
 * set the given link-id to a selected state
 *
 */
function setSelectedSortLink(id) {
    // get the table number from the id
    var table = id.sub(/s[du]_/, "").sub(/_\d+$/, "");

    $$('a.sortlink').each(function(item) {
        if ( item.readAttribute('id').include('_'+table+'_') ) {
            unselectSortLink(item);
        }
    });

    var symbol = sortLinkSymbols.get('selected').get('up');
    if ( id.match(/sd_/) ) {
        symbol = sortLinkSymbols.get('selected').get('down');
    }
    
    $(id).update(symbol);
}

/*
 * Sort the rows down for the given table/column
 * (call sortUp with reversed = true)
 *
 */
function sortDown(table_index, col_index) {
    sortUp(table_index, col_index, true);
}

/*
 * Sort the rows up for the given table/column.
 *
 * First remove and remember all the rows that are bottom rows.
 * Then remove the body rows and re-insert them in a sorted order.
 * Finally re-insert the bottom rows.
 *
 */
function sortUp(tableIndex, colIndex, reversed) {
    var table   = tables[tableIndex];
    var element = table.get('element');

    // remove the bottom rows
    var bottomRows = element.select('div.bottom.row')
    bottomRows.each(function(row) { row.remove() });

    // get the sorted rows (perhaps in reverse)
    var sorted = sortRows(table, colIndex)
    if ( reversed == true ) {
        sorted = sorted.reverse();
    }

    // first remove all the rows and make sure no row has class='last'
    sorted.each(function(item) {
        row = item.get('row');
        row.removeClassName('last');
        row.remove();
    });

    // make sure the last row has the class='last'
    sorted.last().get('row').addClassName('last');

    // then re-insert them in a sorted manner
    sorted.each(function(item) {
        element.insert(item.get('row'));
    });

    // finaly re-insert the bottom rows
    bottomRows.each(function(row) { element.insert(row); });
}

/*
 * The work horse
 *
 * iterates over the body rows and retrieves their values.
 * Then sorts them upwards.
 *
 */
function sortRows(table, colIndex) {
    var values    = new Array();

    // collect information from the rows
    table.get('element').select('div.body.row').each(function(row) {
        cells = row.select('div.cell');

        values.push($H( {
            value: getValue(cells[colIndex]),
            row:   row
        } ));
    });

    // make a sorted array
    sorted = new Array();
    type   = table.get('dataTypes')[colIndex];
    if ( type == "string" ) {
        sorted = values.sort(sortString);
    } else if ( type == "number" ) {
        sorted = values.sort(sortNumber);
    } // TODO: else if ( type == "date" ) { }


    return sorted;
}

/*
 * Get a sanitized, sortable value from the HTML. First check the data-value
 * attribute. Then use innerHTML. Fallback to 0
 * 
 */
function getValue(cell) {
    return cell.readAttribute('data-value') || cell.innerHTML || 0;
}

/*
 * Get the type from the data-type attribute. Fall back to 'number'
 *
 */
function getType(cell) {
    return cell.readAttribute('data-type') || 'number';
}

/*
 * Sort numeric
 *
 */
function sortNumber(a,b) {
    return a.get('value') - b.get('value');
}

/*
 * Sort by String.prototype.cmp
 *
 */
function sortString(a,b) {
    var aString = new String(a.get('value'));
    var bString = new String(b.get('value'));
    
    return aString.cmp(bString);
}
