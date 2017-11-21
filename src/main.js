// Entry point

// import other JS files
import * as validators from "./validators.js";
import * as utilities from "./utilities.js";
import * as api from "./api.js";
import * as figures from "./figures.js";

// import CSS files
import './style.css';
import './tabulator.css';
import './tippy.css';

// // Configure site to allow for getting address info via URL instead of search box
// // First check URL for an ETH address, and if it contains an address, use that
// if (window.location.pathname.length == 43) {
//     // save off address
//     var address = window.location.pathname.replace(/[^a-z0-9]/gi, ''); // sanitize address
//     // load main page
//     window.location.href = window.location.origin
//     jQuery("#addressInput").val(address)
//     jQuery('#addressForm').submit();

// }

// Once the page has loaded, do everything
jQuery(document).ready(function ($) {

    // Add tooltip for caveats
    tippy('.caveats', {
        theme: 'dark',
        arrow: true,

    })

    // if (typeof address != 'undefined') {
    //     // First check if we obtained an address for a URL, and if so fill in input field and submit form
    //     jQuery("#addressInput").val(address)
    //     jQuery('#addressForm').submit();
    // }

    // Register 'submit' handler on <form> element of full-width-page-enter-address.php.
    // The .on('submit') below calls the search() function whenever the form is submitted:
    $('#addressForm').on('submit', search)

});


async function search(event) {
    // A <form> will refresh the page by default when the data is submitted. We need to prevent
    // this default behavior when we are submitting data to our own page with preventDefault();
    event.preventDefault();

    // hide the keyboard on mobile by taking focus away (using .blur()) from the search box
    jQuery('#addressInput').blur();

    // Assign the entered address to a variable
    const enteredString = jQuery('#addressInput').val();

    // Remove all non-alphanumeric characters
    const address = enteredString.replace(/[^a-z0-9]/gi, ''); // sanitize address

    // Run main function
    main(address)
}

async function main(address) {

    // clear any existing figures/tables/headers
    jQuery("#horiz1").empty();
    jQuery("#horiz2").empty();
    jQuery("#horiz3").empty();
    jQuery("#horiz4").empty();
    jQuery("#balance").empty();
    jQuery("#NumAndQtyOfSentAndRecTX").empty();
    jQuery("#accountBalanceVsTime").empty();
    jQuery("#scatterOfTXValue").empty();
    jQuery("#boxPlotOfTXValue").empty();
    jQuery("#histogramOfTXValue").empty();
    jQuery("#totalGasCostVsTime").empty();
    jQuery("#scatterOfTXCost").empty();
    jQuery("#boxPlotOfTXCost").empty();
    jQuery("#frequencyTitle").empty();
    jQuery("#TXValueTitle").empty();
    jQuery("#TXCostTitle").empty();
    jQuery("#normalTXtitle").empty();
    jQuery("#internalTXtitle").empty();
    utilities.removeExistingTable("#tableOfSentAddressFrequency");
    utilities.removeExistingTable("#tableOfReceivedAddressFrequency");
    utilities.removeExistingTable("#tableOfNormalTXData");
    utilities.removeExistingTable("#tableOfInternalTXData");

    // check that the address is valid
    const isValid = validators.isValidETHAddress(address);

    // highlight input box accordingly and output text if address is invalid
    validators.changeInputBoxOutline(isValid)

    if (!isValid) {
        jQuery('#horiz1').html('<hr>');
        jQuery('#balance').html('<p>Invalid Address Entered</p>');
        jQuery('#horiz2').html('<hr>');
        return
    }

    // Get currency selected, or use ETH as default
    if (jQuery('#currencyDropdown').val() == undefined) {
        var currency = 'ETH'
    } else {
        var currency = jQuery('#currencyDropdown').val();
    }
    // Call All APIs
    const APIData = await api.callAPIs(address, isValid, currency)
    const balanceData = APIData[0].status == "1" ? APIData[0].result : null
    const normalTXData = APIData[1].status == "1" ? APIData[1].result : null
    const internalTXData = APIData[2].status == "1" ? APIData[2].result : null;
    const convfactor = APIData[3][0]['price_' + currency.toLowerCase()] / 1e18; // get conversion factor from Wei to selected currency

    // Take call from balance API, convert from Wei to Ether, then display result
    const accountBalance = utilities.convert(convfactor, balanceData);
    utilities.displayBalanceResults(accountBalance, currency)

    // Reformat and merge normal and internal transaction data, and reformat the normal/internal TX data to match this structure
    const allData = utilities.mergeNormalAndInternalTXData(normalTXData, internalTXData)
    const allTXData = allData[0];
    const refNormalTXData = allData[1];
    const refInternalTXData = allData[2];

    // Parse transaction data -- returns array where indices 0/1/2 = stats total/sent/received
    let statsM = utilities.parseTransactionData(address, allTXData) // merged normal/internal stats
    let statsN = utilities.parseTransactionData(address, refNormalTXData) // normal stats (for tx costs)

    // calculate statistics -- returns array where indices 0/1/2 = stats total/sent/received
    statsM = utilities.calculateStatistics(address, statsM, statsN)

    // generate figures, tables, and plots
    jQuery('#horiz3').html('<hr>');
    jQuery('#horiz4').html('<hr>');
    figures.generateFigures(...statsM, refNormalTXData, refInternalTXData, address, convfactor, currency)

}

// BEFORE PUSHING CHANGES TO LIVE SITE:
// 1. Create minified css file of table formatting
// 2. Update functions.php to use the minified version
// 3. Run regular build script

// UP NEXT:
// 1. How to handle/hide client side API keys?

// QUESTIONS:
// 1. How to left align the first tooltip?
// 2. How to shrink the width of the frequency tables?
// 3. How to configure site with JS so entering an address in the URL computes data, and can be linked to?

// EVENTUALLY:
// 1. Add support for  multiple address (with choice to sum results or compare them)
// 2. Change angle of text when floating over box plot