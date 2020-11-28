
//============================================
//================= config ===================

var urlAddressOfHTMLDocs = 'https://korona.gov.sk'; //string, url adresa HTML dokumentu, ktory sa bude nasledne spracovavat
var downloadedHTMLName = 'data.html'; //string, nazov suboru, pod  ktorym budeme ukladat stiahhnuty HTML dokument z url adresy vyssie
var downloadFile = false; //boolean, true- budeme stahovat nove data , false - pouzivame stiahnuty subor
var xlsxFileName = "data.xlsx"; //string, snazov suboru, pod ktorym budeme ukladat XLSX subor
//============================================

const fs = require('fs'); //nacitame si kniznicu pre pracu so subormi

//============================================
//================= downlaod ==================
if(downloadFile)
{
    //najprv si stiahneme dokument do  lokalu, kde s nim budeme dalej pracovat
    const https = require('https'); //nacitame si kniznicu pre pracu s https protokolom

    https.get(urlAddressOfHTMLDocs, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });

      //event sa nam spusti, ked  sa prenos dokonci
      resp.on('end', () => {
        console.log('prenos dat dokonceny');
        //tu sa nam prenos dat dokoncil,  mozeme pokracovat dalej
        //vystup z HTML si ulozime do suboru

        fs.writeFileSync(downloadedHTMLName, data);
        
        console.log('data sa nam zapisali na disk do suboru "'+downloadedHTMLName+'"');
        //============================================
        //teraz spustime funkciu ktora spracuje HTML data a vyexportuje XLSX subor
        parseAndExport(data);
      });

    }).on("error", (err) => {
      //toto sa nam spusti  ak nastala nejaka chyba
      console.log('nastala chyba pri  stahovani suboru');
      console.log("Error: " + err.message);
      return;
    });
  }
  else
  {
    console.log('pouzivame lokalne data zo suboru "'+downloadedHTMLName+'"');
   var file_content = "";
    try{
      file_content = fs.readFileSync(downloadedHTMLName, 'utf8');
    }
    catch(err){
        console.log('Chyba pri citani suboru');
        console.log(err.message);
    }

    if(file_content!="") //ak subor nie je prazdny
    {
      //teraz spustime funkciu "parseAndExport()", ktora nam data spracuje HTML parserom a zapise do XLSX suboru
      var data = file_content;
      parseAndExport(data);
    }
    else
    {
      console.log('Chyba, subor je prazdny');
    }
    
  }


function parseAndExport(data){
    //teraz prejdeme na HTML DOM parsing - prejdeme HTML dokument a ziskame z  neho potrebne data
    //https://github.com/taoqf/node-html-parser

    var HTMLParser = require('node-html-parser');
    
    var root = HTMLParser.parse(data);

    //v  premennej blok mame nacitane vsetky HTML v poli, ktore maju class="govuk-grid-column-one-quarter" podla zapisu selectora v jQuery
    var blok = root.querySelectorAll('.govuk-grid-column-one-quarter');
    //teraz prejdeme do  cyklu kde budeme spracovavat jednotlive bloky
    //kde key = je cislo v poli (0 - x) a value je hodnota pola

    var dataInArray = []; //ak hodnoty budeme zapisovat do pola
    blok.forEach( function(value, key){

      var elementHTML = value;
      var elementH2 = elementHTML.querySelector('h2').innerText; //najprv vyberieme h2, a potom v innerText ziskame z <h2>XYZ</h2> text XYZ
      var elementH2Value = elementH2.replace(/\s/g, ""); //odstranime vsetky medzery z textu (cislo evidujeme ako 1 000 000 000)

      if(key == 0 ) total_pcr = elementH2Value;
      else if(key == 1 ) pcr_positiv = elementH2Value;
      else if(key == 2 ) total_ag = elementH2Value;
      else if(key == 3 ) ag_positiv = elementH2Value;
      else if(key == 4 ) total_death = elementH2Value;
      else if(key == 5 ) total_heal = elementH2Value;
      
      //ak mame viac stlpcov a chceme  ich davat do pola
      dataInArray.push(elementH2Value); //zapisujeme hodnoty do riadku
    });

    //============================================
    //teraz si ulozime data do xlsx

    const XLSX = require('xlsx');
    //nacitame si kniznicu na xlsx
    //https://github.com/SheetJS/sheetjs

    var wb = XLSX.utils.book_new();
    var ws_name = "Data"; //nazov zalozky/pracovneho listu

    //data pracovneho listu
    ws_data = [];
    ws_data.push(['vsetky PCR','POZITIVNYCH S PCR','vsetky AG','POZIIVYCH S AG','vsetky umrtia','vyliecenych']); //1. riadok
    ws_data.push([total_pcr,pcr_positiv,total_ag,ag_positiv,total_death,total_heal]); //2. riadok
    ws_data.push(dataInArray); //3. riadok (obsauje rovnake data ako 2. riadok len s inym zapisom)
    
    //teraz zapiseme data do pracovneho listu
    var ws = XLSX.utils.aoa_to_sheet(ws_data);

    //pracovny list zapiseme do xlsx dokumentu
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, xlsxFileName);

    console.log('Koniec funkcie "parseAndExport()";');
}