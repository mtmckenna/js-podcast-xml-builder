/* Author:
 Matt McKenna

File API code mostly taken from examples on http://www.html5rocks.com/en/.
Thank you html5rocks.com!

*/

var xmlString = "empty";
var xml;
var selectedItem = "";


// Frequently used colors
var darkRed = '#9C4F50';
var lightRed = '#CC99CC';

var generator = "js-podcast-xml-builder";

// File type->content type map
var fileTypeMap = {
    "mp3":  "audio/mpeg",
    "m4a":  "audio/x-m4a",
    "mp4":  "video/mp4",
    "m4v":  "video/x-m4v",
    "mov":  "video/quicktime",
    "pdf":  "application/pdf",
    "epub": "document/x-epub",
    "other": "application/octet-stream"
};

// Language list
var languages = [
    {"name":"English","code":"en"},
    {"name":"Portuguese","code":"pt"},
    {"name":"Indonesian","code":"id"},
    {"name":"Italian","code":"it"},
    {"name":"Spanish","code":"es"},
    {"name":"Turkish","code":"tr"},
    {"name":"Korean","code":"ko"},
    {"name":"French","code":"fr"},
    {"name":"Dutch","code":"nl"},
    {"name":"Russian","code":"ru"},
    {"name":"German","code":"de"},
    {"name":"Japanese","code":"ja"},
    {"name":"Other","code":"other"}
];

// Explicit options
var explicitOptions = [
    "Yes",
    "No",
    "Clean"
];

$(document).ready(function() {
    console.log("Document ready...");

    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    } else {
        alert("The File APIs are not fully supported in this browser.");
    }

    // Open file listener
    document.getElementById('files').addEventListener('change', handleFileSelect, false);
    $(document.getElementById('add_item')).click(function(e){addItem(e);});

    // Populate language field in podcast properties
    for (i = 0; i < languages.length; i++) {
        option = document.createElement('option');
        option.value = languages[i].code;
        option.textContent = languages[i].name;

        // Rudely assume English is the default language
        if ("en" === option.value) {
            option.selected = true;
        }

        $(document.getElementById('podcast_language')).append(option);
    }


    // Populate explicit field in podcast properties
    for (i = 0; i < explicitOptions.length; i++) {
        option = document.createElement('option');
        option.value = explicitOptions[i];
        option.textContent = explicitOptions[i];

        // Rudely assume you don't have a dirty mouth
        if ("Yes" === option.value) {
            option.selected = true;
        }

        $(document.getElementById('podcast_explicit')).append(option);
    }
});

function handleFileLoaded(evt) {
    console.log("here in handleFileLoaded");
    xmlString = evt.target.result;
    xml = $.parseXML(xmlString);
    parsePodcastXML();
} 

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (i = 0; f = files[i]; i++) {
        var reader = new FileReader();
        reader.onloadend = handleFileLoaded;

        reader.readAsText(f);

        output.push('<li><strong>', f.name, '</strong> (', f.type || 'n/a', ') - ',
        f.size, ' bytes, last modified: ',
        f.lastModifiedDate.toLocaleDateString(), '</li>');
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

function parsePodcastXML() {
    //TODO: Test if object is [Object document]
    //TODO: Make case insensitive

    //parse podcast properties
    var title = $(xml).find('channel > title').text();
    $('[name=title]').val(title);

    var link = $(xml).find('channel > link').text();
    $('[name=link]').val(link);

    var description = $(xml).find('channel > description').text();
    $('[name=description]').val(description);

    //TODO: Mke the following two loops like the item loops
    var hasKnownLanguage = false;
    var language = $(xml).find('channel > language').text();
    for (i = 0; i < languages.length; i++) {
        if (language === languages[i].code) {
            $("#podcast_language option[value='" + language + "']").attr('selected', 'selected');
            hasKnownLanguage = true;
        }
    }

    if (hasKnownLanguage === false) {
        $("#podcast_language option[value='other']").attr('selected', 'selected');

    }

    var explicit = $(xml).find('channel > [nodeName=\'itunes:explicit\']').text();
    for (i = 0; i < explicitOptions.length; i++) {
        if (explicit === explicitOptions[i]) {
            $("#podcast_explicit option[value='" + explicit + "']").attr('selected', 'selected');
        }
    }

    var copyright = $(xml).find('channel > copyright').text();
    $('[name=copyright]').val(copyright);

    var itunes_author = $(xml).find('channel > [nodeName=\'itunes:author\']').text();
    $('[name=itunes_author]').val(itunes_author);
    
    var itunes_image = $(xml).find('channel > [nodeName=\'itunes:image\']').attr('href');
    $('[name=itunes_image]').val(itunes_image);

    var itunes_owner__itunes_name = $(xml).find('channel > [nodeName=\'itunes:owner\'] > [nodeName=\'itunes:name\']').text();
    $('[name=itunes_owner__itunes_name]').val(itunes_owner__itunes_name);

    var itunes_owner__itunes_email = $(xml).find('channel > [nodeName=\'itunes:owner\'] > [nodeName=\'itunes:email\']').text();
    $('[name=itunes_owner__itunes_email]').val(itunes_owner__itunes_email);

    var itunes_categories = $(xml).find('channel > [nodeName=\'itunes:category\']');
    var itunes_category = $(itunes_categories[0]).attr('text');
    var itunes_subcategory = $(itunes_categories[1]).attr('text');

    $('[name=itunes_category]').val(itunes_category);
    $('[name=itunes_subcategory]').val(itunes_subcategory);

    // TODO: First check if there are any items?
    //elItemsOL = document.createElement('ol');
    //$('#items').append(elItemsOL);

    // Parse items
    $(xml).find('item').each(function() {

        var title = $(this).find('title').text();
        var guid = $(this).find('guid').text();
        var itemExplicit = $(this).find('[nodeName=\'itunes:explicit\']').text();
        var itemAuthor = $(this).find('[nodeName=\'itunes:author\']').text();
        var itemSubtitle = $(this).find('[nodeName=\'itunes:subtitle\']').text();
        var itemSummary =  $(this).find('[nodeName=\'itunes:summary\']').text();
        var enclosureUrl = $(this).find('[nodeName=\'enclosure\']').attr('url');
        var type = $(this).find('[nodeName=\'enclosure\']').attr('type');
        var itemLength = $(this).find('[nodeName=\'enclosure\']').attr('length');
        var pubDate = $(this).find('[nodeName=\'pubDate\']').text();
        var duration = $(this).find('[nodeName=\'itunes:duration\']').text();
        var keywords = $(this).find('[nodeName=\'itunes:keywords\']').text();

        console.log('-> ' + title);

        var elItem = document.createElement('li');
        elItem.className = 'ui-state-default';
        elItem.id = guid;
        $(elItem).click(function(e){selectItem(e);});

        var elItemProps = document.createElement('div');
        elItemProps.className = 'item_properties';

        var elName = document.createElement('div');
        elName.className = 'item_name';

        var elItemRemove = document.createElement('div');
        elItemRemove.className = 'remove_item';
        $(elItemRemove).html('X');
        $(elItemRemove).click(function(e){removeItem(e);});
        $(elItem).append(elItemRemove);

        var elDetails = document.createElement('div');
        elDetails.className = 'item_details';

        var elTitle = document.createElement('input');
        elTitle.className = 'item_property';
        elTitle.setAttribute('name', 'title');
        elTitle.setAttribute('type', 'text');
        elTitle.setAttribute('value', title);

        var elUrl = document.createElement('input');
        elUrl.className = 'item_property';
        elUrl.setAttribute('name', 'url');
        elUrl.setAttribute('type', 'text');
        elUrl.setAttribute('value', enclosureUrl);

        var elType = document.createElement('select');
        elType.className = 'item_property';
        elType.setAttribute('name', 'type');

        var hasKnownFileType = false;
        for (var key in fileTypeMap) {
            if (fileTypeMap.hasOwnProperty(key)) {
                option = document.createElement('option');
                option.value = key;
                option.textContent = fileTypeMap[key];

                if (type === fileTypeMap[key]) {
                    option.selected = true;
                    hasKnownFileType = true;
                }

                $(elType).append(option);
            }
        }

        if (hasKnownFileType === false) {
            $(elType).find("option[value='other']").attr('selected', 'selected');
        }

        var elLength = document.createElement('input');
        elLength.className = 'item_property';
        elLength.setAttribute('name', 'length');
        elLength.setAttribute('type', 'text');
        elLength.setAttribute('value', itemLength);

        var elGuid = document.createElement('input');
        elGuid.className = 'item_property';
        elGuid.setAttribute('name', 'guid');
        elGuid.setAttribute('type', 'text');
        elGuid.setAttribute('value', guid);

        var elItemSubtitle = document.createElement('input');
        elItemSubtitle.className = 'item_property';
        elItemSubtitle.setAttribute('name', 'itemSubtitle');
        elItemSubtitle.setAttribute('type', 'text');
        elItemSubtitle.setAttribute('value', itemSubtitle);

        var elItemSummary = document.createElement('input');
        elItemSummary.className = 'item_property';
        elItemSummary.setAttribute('name', 'itemSummary');
        elItemSummary.setAttribute('type', 'text');
        elItemSummary.setAttribute('value', itemSummary);

        var elItemAuthor = document.createElement('input');
        elItemAuthor.className = 'item_property';
        elItemAuthor.setAttribute('name', 'itemAuthor');
        elItemAuthor.setAttribute('type', 'text');
        elItemAuthor.setAttribute('value', itemAuthor);       

        var elPubDate = document.createElement('input');
        elPubDate.className = 'item_property';
        elPubDate.setAttribute('name', 'pubDate');
        elPubDate.setAttribute('type', 'text');
        elPubDate.setAttribute('value', pubDate);

        var elDuration = document.createElement('input');
        elDuration.className = 'item_property';
        elDuration.setAttribute('name', 'duration');
        elDuration.setAttribute('type', 'text');
        elDuration.setAttribute('value', duration);
        
        var elKeywords = document.createElement('input');
        elKeywords.className = 'item_property';
        elKeywords.setAttribute('name', 'keywords');
        elKeywords.setAttribute('type', 'text');
        elKeywords.setAttribute('value', keywords);
        
        var elExplicit = document.createElement('select');
        elExplicit.setAttribute('name', 'explicit');
        elExplicit.className = 'item_property';

        for (i = 0; i < explicitOptions.length; i++) {
            option = document.createElement('option');
            option.value = explicitOptions[i];
            option.textContent = explicitOptions[i];

            if (itemExplicit === option.value) {
                option.selected = true;
            }

            $(elExplicit).append(option);
        }

        $(elItem).append(elItemProps);
        $(elItemProps).append(elName);
        $(elItemProps).append(elDetails);

        $(elName).append(elTitle);

        $(elDetails).append(elUrl);
        $(elDetails).append(elGuid);
        $(elDetails).append(elType);
        $(elDetails).append(elLength);
        $(elDetails).append(elItemSubtitle);
        $(elDetails).append(elItemSummary);
        $(elDetails).append(elItemAuthor);
        $(elDetails).append(elPubDate);
        $(elDetails).append(elDuration);
        $(elDetails).append(elKeywords);
        $(elDetails).append(elExplicit);

        $('#items ol').append(elItem);

        $(elItemProps).css('height', $(elName).height() + 5);
        $(elItemRemove).css('height', $(elName).height() + 5);
        $(elItem).css('height', $(elName).height() + 5);

    });

    // Make sortable. Also, since the size of the element can change,
    // must call refreshPositions when sorting starts, so jQuery-UI can adjust
    // to the potentially new size of the list.
    $('#items ol').sortable({
        placeholder: 'ui-state-highlight',
        tolerance: 'pointer',
        start: function(evt, ui) {
            $('#items ol').sortable("refreshPositions");
        }
    });

    $('#items ol').enableSelection();

}

function buildPodcastXML() {
    var elRss = document.createElement('rss');
    elRss.setAttribute('xmlns:itunes', 'http://www.itunes.com/dtds/podcast-1.0.dtd');
    elRss.setAttribute('version', '2.0');

    var elChannel = document.createElement('channel');
    var elItunesOwner = document.createElement('itunes:owner');
    
    var elTtl = document.createElement('ttl');
    $(elTtl).text('60');
    $(elChannel).append(elTtl);

    // Podcast Properties
    var title =  $('[name=title]').val();
    var elTitle = document.createElement('title');
    $(elTitle).text(title);

    var link =  $('[name=link]').val();
    //var elLink = document.createElement('link');
    var elLink = document.createElementNS('http://www.itunes.com/dtds/podcast-1.0.dtd','link');
    $(elLink).text(link);

    var description =  $('[name=description]').val();
    var elDescription = document.createElement('description');
    $(elDescription).text(description);

    var language =  $('#podcast_language').val();
    var elLanguage = document.createElement('language');
    $(elLanguage).text(language);

    var copyright=  $('[name=copyright]').val();
    var elCopyright = document.createElement('copyright');
    $(elCopyright).text(copyright);

    var itunes_author =  $('[name=itunes_author]').val();
    var elItunesAuthor = document.createElement('itunes:author');
    $(elItunesAuthor).text(itunes_author);

    var itunes_image = $('[name=itunes_image]').val();
    var elItunesImage = document.createElement('itunes:image');
    $(elItunesImage).attr('href', itunes_image);

    var itunes_explicit = $('[name=itunes_explicit]').val();
    var elItunesExplicit = document.createElement('itunes:explicit');
    $(elItunesExplicit).text(itunes_explicit);

    var itunes_owner__itunes_name = $('[name=itunes_owner__itunes_name]').val();
    var elItunesOwnerName = document.createElement('itunes:name');
    $(elItunesOwnerName).text(itunes_owner__itunes_name);

    var itunes_owner__itunes_email = $('[name=itunes_owner__itunes_email]').val();
    var elItunesOwnerEmail = document.createElement('itunes:email');
    $(elItunesOwnerEmail).text(itunes_owner__itunes_email);

    var itunes_category = $('[name=itunes_category]').val();
    var elItunesCategory = document.createElement('itunes:category');
    elItunesCategory.setAttribute('text', itunes_category);

    var itunes_subcategory = $('[name=itunes_subcategory]').val();
    var elItunesSubcategory = document.createElement('itunes:category');
    elItunesSubcategory.setAttribute('text', itunes_subcategory);

    $(elChannel).append(elTitle);
    $(elChannel).append(elLink);
    $(elChannel).append(elDescription);
    $(elChannel).append(elLanguage);
    $(elChannel).append(elCopyright);
    $(elChannel).append(elItunesAuthor);
    $(elChannel).append(elItunesImage);
    $(elChannel).append(elItunesExplicit);
    $(elChannel).append(elItunesCategory);
    $(elChannel).append(elItunesSubcategory);

    $(elItunesOwner).append(elItunesOwnerName);
    $(elItunesOwner).append(elItunesOwnerEmail);
    $(elChannel).append(elItunesOwner);

    // Items
    $('#items > ol > li').each(function() {
        var elItem = document.createElement('item');

        var title = $(this).find('[name=title]').val();
        var elItemTitle = document.createElement('title');
        $(elItemTitle).text(title);

        var explicit = $(this).find('[name=explicit]').val();
        var elItemExplicit = document.createElement('itunes:explicit');
        $(elItemExplicit).text(explicit);

        var author = $(this).find('[name=itemAuthor]').val();
        var elItemAuthor = document.createElement('itunes:author');
        $(elItemAuthor).text(author);

        var subtitle = $(this).find('[name=itemSubtitle]').val();
        var elItemSubtitle = document.createElement('itunes:subtitle');
        $(elItemSubtitle).text(subtitle);

        var summary = $(this).find('[name=itemSummary]').val();
        var elItemSummary = document.createElement('itunes:summary');
        $(elItemExplicit).text(explicit);

        var url = $(this).find('[name=url]').val();
        var type = $(this).find('[name=type]').val();
        var itemLength = $(this).find('[name=length]').val();
        var elItemEnclosure = document.createElement('enclosure');
        elItemEnclosure.setAttribute('url', url);
        elItemEnclosure.setAttribute('type', fileTypeMap[type]);
        elItemEnclosure.setAttribute('length', itemLength);

        var guid = $(this).find('[name=guid]').val();
        var elItemGuid = document.createElement('guid');
        $(elItemGuid).text(guid);

        var pubDate = $(this).find('[name=pubDate]').val();
        //var elItemPubDate = document.createElement('pubDate');
        var elItemPubDate = document.createElementNS('http://www.itunes.com/dtds/podcast-1.0.dtd', 'pubDate');
        $(elItemPubDate).text(pubDate);

        var duration = $(this).find('[name=duration]').val();
        var elItemDuration = document.createElement('itunes:duration');
        $(elItemDuration).text(duration);

        var keywords = $(this).find('[name=keywords]').val();
        var elItemKeywords = document.createElement('itunes:keywords');
        $(elItemKeywords).text(keywords);
        
        $(elItem).append(elItemTitle);
        $(elItem).append(elItemExplicit);
        $(elItem).append(elItemAuthor);
        $(elItem).append(elItemSubtitle);
        $(elItem).append(elItemSummary);
        $(elItem).append(elItemEnclosure);
        $(elItem).append(elItemGuid);
        $(elItem).append(elItemPubDate);
        $(elItem).append(elItemDuration);
        $(elItem).append(elItemKeywords);

        $(elChannel).append(elItem);
    });

    $(elRss).append(elChannel);

    return elRss;
}

//Stolen from: http://aspnetupload.com/Clear-HTML-File-Input.aspx
function clearFileInput() { 
    //Clear out old file
    var oldInput = document.getElementById('files');
    
    var newInput = document.createElement('input'); 
     
    newInput.type = 'file'; 
    newInput.id = oldInput.id; 
    newInput.name = oldInput.name; 
    newInput.className = oldInput.className; 
    //newInput.style.cssText = oldInput.style.cssText; 
     
    oldInput.parentNode.replaceChild(newInput, oldInput); 

    //Clear out old property values
    $("input[class=podcast_property]").val("");
    $("#items li").remove();
    document.getElementById('files').addEventListener('change', handleFileSelect, false);
}
 
function clearItems() {
}

function saveFile() {
    //buildPodcastXML();
    var bb = new BlobBuilder();
    //bb.append((new XMLSerializer).serializeToString(xml));
    bb.append((new XMLSerializer).serializeToString(buildPodcastXML()));
    var blob = bb.getBlob("application/xhtml+xml;charset=" + document.characterSet);
    saveAs(blob, "podcast.xml");
}

function contractItem(item) {
    var itemProps = $(item).find('.item_properties').first();
    var itemName = $(item).find('.item_name').first();
    var itemDetails = $(item).find('.item_details').first();
    var newItemHeight; 

    console.log('Is an div... hiding...');
    itemDetails.css('visibility', 'hidden');
    newItemHeight = itemName.height() + 5;

    $(item).css('height', newItemHeight);
    $(itemProps).css('height', newItemHeight);
}

function expandItem(item) {
    var itemProps = $(item).find('.item_properties').first();
    var itemName = $(item).find('.item_name').first();
    var itemDetails = $(item).find('.item_details').first();
    var newItemHeight; 

    console.log('Is an div... expanding...');
    itemDetails.css('visibility', 'visible');
    newItemHeight = itemName.height() + itemDetails.height() + 10;

    $(item).css('height', newItemHeight);
    $(itemProps).css('height', newItemHeight);
}

function addItem(e) {
    var elItem = document.createElement('li');
    elItem.className = 'ui-state-default';
    elItem.id = "";
    $(elItem).click(function(e){selectItem(e);});

    var elItemProps = document.createElement('div');
    elItemProps.className = 'item_properties';

    var elName = document.createElement('div');
    elName.className = 'item_name';

    var elItemRemove = document.createElement('div');
    elItemRemove.className = 'remove_item';
    $(elItemRemove).html('X');
    $(elItemRemove).click(function(e){removeItem(e);});
    $(elItem).append(elItemRemove);

    var elDetails = document.createElement('div');
    elDetails.className = 'item_details';

    var elTitle = document.createElement('input');
    elTitle.className = 'item_property';
    elTitle.setAttribute('name', 'title');
    elTitle.setAttribute('type', 'text');
    elTitle.setAttribute('value', 'Title');

    var elLink = document.createElement('input');
    elLink.className = 'item_property';
    elLink.setAttribute('name', 'link');
    elLink.setAttribute('type', 'text');
    elLink.setAttribute('value', 'http://you_url.com/whatever.m4v');

    var elItemSubtitle = document.createElement('input');
    elItemSubtitle.className = 'item_property';
    elItemSubtitle.setAttribute('name', 'itemSubtitle');
    elItemSubtitle.setAttribute('type', 'text');
    elItemSubtitle.setAttribute('value', 'Subtitle');

    var elItemSummary = document.createElement('input');
    elItemSummary.className = 'item_property';
    elItemSummary.setAttribute('name', 'itemSummary');
    elItemSummary.setAttribute('type', 'text');
    elItemSummary.setAttribute('value', 'Summary');

    var elItemAuthor = document.createElement('input');
    elItemAuthor.className = 'item_property';
    elItemAuthor.setAttribute('name', 'itemAuthor');
    elItemAuthor.setAttribute('type', 'text');
    elItemAuthor.setAttribute('value', 'Author');       

    var elPubDate = document.createElement('input');
    elPubDate.className = 'item_property';
    elPubDate.setAttribute('name', 'pubDate');
    elPubDate.setAttribute('type', 'text');
    elPubDate.setAttribute('value', 'Publication Date');

    var elDuration = document.createElement('input');
    elDuration.className = 'item_property';
    elDuration.setAttribute('name', 'duration');
    elDuration.setAttribute('type', 'text');
    elDuration.setAttribute('value', 'Duration');

    var elKeywords = document.createElement('input');
    elKeywords.className = 'item_property';
    elKeywords.setAttribute('name', 'keywords');
    elKeywords.setAttribute('type', 'text');
    elKeywords.setAttribute('value', 'Keywords');

    var elExplicit = document.createElement('select');
    elExplicit.className = 'item_property';

    for (i = 0; i < explicitOptions.length; i++) {
        var option = document.createElement('option');
        option.value = explicitOptions[i];
        option.textContent = explicitOptions[i];
        $(elExplicit).append(option);
    }

    $(elItem).append(elItemProps);
    $(elItemProps).append(elName);
    $(elItemProps).append(elDetails);

    $(elName).append(elTitle);

    $(elDetails).append(elLink);
    $(elDetails).append(elItemSubtitle);
    $(elDetails).append(elItemSummary);
    $(elDetails).append(elItemAuthor);
    $(elDetails).append(elPubDate);
    $(elDetails).append(elDuration);
    $(elDetails).append(elKeywords);
    $(elDetails).append(elExplicit);

    $('#items ol').prepend(elItem);

    $(elItemProps).css('height', $(elName).height() + 5);
    $(elItemRemove).css('height', $(elName).height() + 5);
    $(elItem).css('height', $(elName).height() + 5);
}

function removeItem(e) {

    var anElement = e.target;
    var item = $(anElement).closest('li');
    $(item).remove();
}

function selectItem(e) {

    var anElement = e.target;

    // If we have tapped inside one of our properties, don't futz with
    // the size.
    if (anElement.className == 'item_property') {
        return true;
    }

    //console.log("clicked on: " + anElement + " " + anElement.id + " " + anElement.className + $(anElement).parent());

    // Change height of item to include details
    var item = $(anElement).closest('li');
    var itemDetails = $(item).find('.item_details').first();

    if (itemDetails.css('visibility') == 'hidden') {
        expandItem(item); 
    }
    else if (itemDetails.css('visibility') == 'visible') {
        contractItem(item);
    } 
}
