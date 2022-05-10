let mainNewsList = document.querySelectorAll(".news_area");
let subNewsList = document.querySelectorAll("span.sub_wrap");
let current = new Object();
let currentUrl = document.location.hostname;
let currentOnSearch = (currentUrl == "search.naver.com");
let popupFrame = document.createElement("iframe");
let outsideDiv = document.querySelector("div#wrap");
let contentDiv = document.querySelector("div#container");
let nodeDic = {};
let nodeDicKeySet = new Set([]);
let active = false;

current.title = '';
current.newsPaperName = '';
current.url = '';
popupFrame.setAttribute("id","popUpExtension");
popupFrame.setAttribute("src",chrome.runtime.getURL("popup.html"));
popupFrame.style.position = "fixed";
popupFrame.style["z-index"] = "51";
popupFrame.style.right = "0";
popupFrame.style["background-color"] = "white";
popupFrame.style.width = "350px";
popupFrame.setAttribute("allow","clipboard-read; clipboard-write");

const readLocalStorage = async (key,defaultValue) => {
    return new Promise((resolve, reject) => {
            chrome.storage.local.get(key, function (result) {
                if (result === undefined || result[key] === undefined) {
              resolve(defaultValue);
            }else{
                resolve(result[key]);
            }
        });
    });
};

async function getFromLocal(){
    console.log("getFromLocal");
    nodeDic = await readLocalStorage('nodeDic',{});
}

function setToLocal(_nodeDic){
  console.log("setToLocal");
  chrome.storage.local.set({'nodeDic':_nodeDic}, function () {});
}
  

function GetNewsPaperName(elem,selectorPara){
    let node = elem.querySelector(selectorPara).childNodes[1];
    for (var i = 0; i < node.childNodes.length; i++) {
        var curNode = node.childNodes[i];
        if (curNode.nodeName === "#text") {
            current.newsPaperName =  curNode.nodeValue;
            break;
        }
    }
}
function GetTitle(elem,selectorPara){
    current.title = elem.querySelector(selectorPara).title;
}
function GetUrl(elem,selectorPara,exceptPara){
    var siblings = elem.querySelector(selectorPara).childNodes;
    if(siblings.length > 2 && siblings[siblings.length-2].innerText == "네이버뉴스"){
        return siblings[siblings.length-2].href;
    }else{
        return elem.querySelector(exceptPara).href;
    }
}

function addToCurrent(titleQuery,infoQuery,elem){
    return function (e){
        GetTitle(e.currentTarget,titleQuery);
        GetNewsPaperName(e.currentTarget,infoQuery);
        current.url = GetUrl(e.currentTarget,infoQuery,titleQuery);
        current.node = elem;
    }
}

function resetCurrent(){
    current.title = '';
    current.newsPaperName = '';
    current.url = '';
    current.node = null;
}

function AddNewsToArray(NewsList,titleQuery,infoQuery) {
    for (let elem of NewsList) {
        elem.addEventListener("mouseenter", addToCurrent(titleQuery,infoQuery,elem));
        elem.addEventListener("mouseleave", resetCurrent);
    }
}

function RemoveNewsToArray(NewsList,titleQuery,infoQuery) {
    for (let elem of NewsList) {
        elem.removeEventListener("mouseenter", addToCurrent(titleQuery,infoQuery));
        elem.removeEventListener("mouseleave", resetCurrent);
        EditColorFromNodeDic(new Set([]),elem,GetUrl(elem,infoQuery,titleQuery));
    }
}

function AddNaverNewsToArray(){
    let newsTitlePanel = document.querySelector("div.article_header");
    current.title = newsTitlePanel.querySelector('h3.tts_head').innerText;
    current.newsPaperName = newsTitlePanel.querySelector('img[title]').title;
    current.url = location.href;
    current.node = newsTitlePanel;
}

function EditArrayNewsColor(NewsList,titleQuery,infoQuery){
    for (let elem of NewsList) {
        EditColorFromNodeDic(nodeDicKeySet,elem,GetUrl(elem,infoQuery,titleQuery));
    }
}

function EditColorFromNodeDic(nodeDicKeySet,elem,url){
    let containedUrl = false;
    if(nodeDicKeySet.has(url)){
        updateColor("add",elem);
        containedUrl = true;
    }
    else{
        updateColor("delete",elem);
    }
}

function getNodeDic(NodeDic){
    nodeDicKeySet.clear();
    Object.values(NodeDic).forEach((value) => {
        value.forEach(node => {
            nodeDicKeySet.add(node.url);
        });
    });
}

function updateColor(edit,node){
    if(edit == "add"){
        node.style.backgroundColor = "rgba(0,153,0,0.3)";
    }else{
        node.style.backgroundColor = "rgba(255,255,255,0)";
    }
}

function editNodeDic(current,edit){
    if(edit == "add"){
        let query = 'etc';
        if(nodeDic.hasOwnProperty(query)){
            nodeDic[query].push(current);
        }else{
            let array = [];
            array.push(current);
            nodeDic[query] = array;
        }
    }else if(edit == "delete"){
        Object.entries(nodeDic).some(([key, value]) => {
            let ind = value.findIndex(node => (node.url == current.url));
            if(ind != -1) value.splice(ind, 1);
            return (ind != -1);
        });
    }
    setToLocal(nodeDic);
}

function updateNodeDic(edit){
    // let currentCopy = JSON.parse(JSON.stringify(current));
    editNodeDic(current,edit);
    // chrome.runtime.sendMessage({action: "Update", current: currentCopy, edit: edit});
}

function addAndRemoveNewsByKeyDown(event){
    let edit = "";
    if((event.key == 'Shift' || event.char == 'Shift') && current.title != ''){
        edit = "add";
        updateNodeDic(edit);
        updateColor(edit,current.node);
    }
    if((event.key == 'Delete' || event.key == 'Backspace' || event.char == 'Delete' || event.char == 'Backspace') && current.title != ''){
        edit = "delete";
        updateNodeDic(edit);
        updateColor(edit,current.node);
    }
}

function listenUpdate(){
    getNodeDic(nodeDic);
    if(currentOnSearch){
        EditArrayNewsColor(mainNewsList,'[title][href]','div.info_group');
        EditArrayNewsColor(subNewsList,'[title][href]','span.sub_area');
    }else{
        EditColorFromNodeDic(nodeDicKeySet,current.node,current.url);
    }
}

async function Initiate(){
    let headerHeight ="0";
    let rightEdge = "0";
    if(currentOnSearch){
        AddNewsToArray(mainNewsList,'[title][href]','div.info_group');
        AddNewsToArray(subNewsList,'[title][href]','span.sub_area');
        await getFromLocal();
        console.log("nodeDic : %o",nodeDic);
        getNodeDic(nodeDic);
        EditArrayNewsColor(mainNewsList,'[title][href]','div.info_group');
        EditArrayNewsColor(subNewsList,'[title][href]','span.sub_area');
        outsideDiv.querySelector("#header_wrap")
        headerHeight = outsideDiv.querySelector("#header_wrap").scrollHeight;
        rightEdge = contentDiv.querySelector("#main_pack").getBoundingClientRect().right;
    }else{
        AddNaverNewsToArray();
        await getFromLocal();
        getNodeDic(nodeDic);
        EditColorFromNodeDic(nodeDicKeySet,current.node,current.url);
        contentDiv = document.querySelector("table.container");
        headerHeight = outsideDiv.querySelector("#header").scrollHeight;
        rightEdge = contentDiv.querySelector("td.content").getBoundingClientRect().right;
    }
    document.addEventListener("keydown",addAndRemoveNewsByKeyDown);
    popupFrame.style.height = "calc(100% - "+ headerHeight +"px)";
    popupFrame.style.width = "calc(100% - " +rightEdge +"px)";
    outsideDiv.insertBefore(popupFrame,contentDiv);
}

function DeActivate(){
    console.log("DeActivate");
    if(currentOnSearch){
        RemoveNewsToArray(mainNewsList,'[title][href]','div.info_group');
        RemoveNewsToArray(subNewsList,'[title][href]','span.sub_area');
    }else{
        EditColorFromNodeDic(new Set([]),current.node,current.url);
    }
    document.removeEventListener("keydown",addAndRemoveNewsByKeyDown);
    console.log("outsideDiv : %o",outsideDiv); 
    console.log("outsideDiv.querySelector('#popUpExtension') : %o",outsideDiv.querySelector("#popUpExtension")); 
    if(outsideDiv.querySelector("#popUpExtension") != null) outsideDiv.querySelector("#popUpExtension").remove();
}

async function start(Action){
    active = Action;
    if(active){
        await Initiate();
    }else{
        DeActivate();
    }
}

(async () => {
    await getFromLocal();
    active = await readLocalStorage('active',false);
    await start(active);
})();

chrome.storage.local.onChanged.addListener((changes,area)=>{
    console.log("changes : %o",changes);
    Object.entries(changes).forEach(async ([key, value]) => {
        // console.log("key : %s , value : %o , key = active: %s",key,value,(key == "active"));
        if(key == "nodeDic"){
            nodeDic = value.newValue;
            listenUpdate();
        }else if(key == "active"){
            // console.log("active : %s",value.newValue);
            await start(value.newValue); 
        }
    });
});

window.addEventListener('resize', function(event){
    let headerHeight ="0";
    let rightEdge = "0";
    if(currentOnSearch){
        headerHeight = outsideDiv.querySelector("#header_wrap").scrollHeight;
        rightEdge = contentDiv.querySelector("#main_pack").getBoundingClientRect().right;
    }else{
        headerHeight = outsideDiv.querySelector("#header").scrollHeight;
        rightEdge = contentDiv.querySelector("td.content").getBoundingClientRect().right;
    }
    popupFrame.style.height = "calc(100% - "+ headerHeight +"px)";
    popupFrame.style.width = "calc(100% - " +rightEdge +"px)";
});