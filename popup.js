let TopicDic = {};
const topicList = ["NK","EastAsia","etc"];
let topicListPart = document.querySelectorAll("p.Topic");
let countStringDiv = document.querySelector("p.countStr");
let newsDiv = document.createElement("p");
let selected = {};
selected.node = document.querySelector("#copyable");
selected.url = "";
selected.query = "etc";
newsDiv.setAttribute("class","news");
newsDiv.innerHTML = `
<input type="radio" id="news" name="news">
<label for="news">
<a class="newsPaperName" contenteditable="true"></a>
<a class="title" contenteditable="true"></a><br>
<a class="url" href="" contenteditable="false"></a>
</label>
`;

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

async function getFromSync(){
    console.log("getFromSync");
    TopicDic = await readLocalStorage('nodeDic',{});
}

async function getFromBackUp(){
    console.log("getFromBackUp");
    TopicDic = await readLocalStorage('BackUp',{});
}

function setToSync(_nodeDic){
  console.log("setToSync");
  chrome.storage.local.set({'nodeDic':_nodeDic}, function () {});
}

function setToBackUp(_nodeDic){
  console.log("setToBackUp");
  chrome.storage.local.set({'BackUp':_nodeDic}, function () {});
}


async function initilize(){
    updateText();
    await getFromSync();
    updateText();
}

function MoveNewsContainer(isUp){
    let currentIndex = topicList.indexOf(selected.query);
    if(isUp){
        currentIndex--;
    }else{
        currentIndex++;
    }
    currentIndex += topicList.length;
    currentIndex %= topicList.length;
    let nextQuery = topicList[currentIndex];
    if(TopicDic.hasOwnProperty(nextQuery)){
        TopicDic[nextQuery][selected.url] = TopicDic[selected.query][selected.url];
    }else{
        let obj = {};
        obj[selected.url] = TopicDic[selected.query][selected.url];
        TopicDic[nextQuery] = obj;
    }
    delete TopicDic[selected.query][selected.url];
    document.querySelector("#"+nextQuery).appendChild(selected.node);
    let para = (new URL(selected.url)).searchParams;
    selected.node = document.querySelector("[id='"+para.get("oid")+para.get("aid")+"']");
    selected.node.querySelector('input[type=radio]').checked = true;
    selected.node.querySelector('label').style = "background-color:#bfb;border-color: #4c4;";
    // console.log("selected.node.querySelector('input[type=radio]') : %o, checked : %s,label : %o,labelColor : %o" ,selected.node.querySelector('input[type=radio]') ,
    // selected.node.querySelector('input[type=radio]').checked,selected.node.querySelector('label'),selected.node.querySelector('label').style);
    selected.query = nextQuery;
    setToSync(TopicDic);
    // chrome.runtime.sendMessage({action: "SetNodeDic", nodeDic: TopicDic});
}

function DeleteNewsContainer(){
    setToBackUp(TopicDic);
    delete TopicDic[selected.query][selected.url];
    // console.log('afterDeleteTopicDic');
    // console.log(TopicDic);
    // selected.node.remove();
    selected = {};
    setToSync(TopicDic);
    // chrome.runtime.sendMessage({action: "SetNodeDic", nodeDic: TopicDic});
}

function OpenAtNewTab(e){
    e.preventDefault();
    chrome.tabs.create({ url: e.currentTarget.href });
}

function updateText(){    
    topicListPart.forEach((node)=>{
        node.innerHTML = '';
        if(!TopicDic.hasOwnProperty(node.id)) return;
        Object.entries(TopicDic[node.id]).forEach(([key, value]) => {
            let newsDivclone = newsDiv.cloneNode(true);
            let para = (new URL(value.url)).searchParams;
            newsDivclone.id = para.get("oid")+para.get("aid");
            newsDivclone.querySelector("input").id = value.url;
            newsDivclone.querySelector("input").addEventListener('click',(e)=>{
                selected.node = e.target.parentNode;
                selected.query = e.path[2].id;
                selected.url = value.url;
            });
            newsDivclone.querySelector("label").setAttribute("for",value.url);
            newsDivclone.querySelector(".newsPaperName").innerText = "<" + value.newsPaperName +">";
            newsDivclone.querySelector(".title").innerText = value.title;
            newsDivclone.querySelector(".url").innerText = value.url;
            newsDivclone.querySelector(".url").setAttribute("href",value.url);
            newsDivclone.querySelector(".url").addEventListener("click",OpenAtNewTab);
            node.appendChild(newsDivclone);
        });
    });
    countString();
}

function getCopy(node = document.querySelector("#copyable")){
    console.log("selected : %s",selected );
    let onelineText = node.innerText;
    onelineText.replaceAll(/\n/g, "\r\n");//document.querySelector("#copyable")
    let promise = navigator.clipboard.writeText(onelineText);
    let copiedPart = "전체";
    if(node != document.querySelector("#copyable")) copiedPart = onelineText + "\r\n\r\n";
    promise.then(()=>{
        alert(copiedPart + " 복사 완료");
    },()=>{
        alert("복사 실패");
    });
}

String.prototype.getBytes = function() {
    const contents = this;
    var l = 0;
    for (var i=0; i<contents.length; i++) l += (contents.charCodeAt(i) > 128) ? 2 : 1;
    return l;
}

function countString(){
    let onelineText = document.querySelector("#copyable").innerText;
    onelineText.replaceAll(/\n/g, "\r\n");
    countStringDiv.innerText = onelineText.getBytes();
}

function reset(){
    setToBackUp(TopicDic);
    TopicDic = {};
    selected = {};
    setToSync(TopicDic);
}

async function revertReset(){
    await getFromBackUp();
    setToSync(TopicDic);
}

document.addEventListener("keydown",function(event){
    switch(event.key){
        case 'Delete' || 'Backspace':
            if(selected != {} && TopicDic.hasOwnProperty(selected.query) && TopicDic[selected.query].hasOwnProperty(selected.url)){
                DeleteNewsContainer();
                countString();
            }
            break;

        case "ArrowUp":
            if(selected != {}){
                MoveNewsContainer(true);
                console.log("selected.node.querySelector('input[type=radio]') : %o, checked : %s,label : %o,labelColor : %o" ,selected.node.querySelector('input[type=radio]') ,
                selected.node.querySelector('input[type=radio]').checked,selected.node.querySelector('label'),selected.node.querySelector('label').style);
            }
            break;

        case "ArrowDown":
            if(selected != {}){
                MoveNewsContainer(false);
                console.log("selected.node.querySelector('input[type=radio]') : %o, checked : %s,label : %o,labelColor : %o" ,selected.node.querySelector('input[type=radio]') ,
                selected.node.querySelector('input[type=radio]').checked,selected.node.querySelector('label'),selected.node.querySelector('label').style);
            }
            break;

        case "c":
            // console.log(event.ctrlKey);
            if(event.ctrlKey){
                if(selected == {}){
                    getCopy();  
                }else{
                    getCopy(selected.node);
                }
            }
            break;

        case "z":
            // console.log(event.ctrlKey);
            if(event.ctrlKey){
                revertReset();
            }
            break;
    }
});

(async () => {
    await initilize();
    document.querySelector(".reset").addEventListener('click',()=>{
        reset();
    });
})();

chrome.storage.local.onChanged.addListener((changes,area)=>{
    console.log("changes : %o",changes);
    if(changes.hasOwnProperty("nodeDic")){
        console.log(changes["nodeDic"]);
        TopicDic = changes["nodeDic"].newValue;
        updateText();
    }
});
    
document.addEventListener("click",function(e){
    let isChild = Object.values(topicListPart).some((node) => {
        return node.contains(e.target);
    });
    if(!isChild){
        let radio = document.querySelector('input[type=radio]:checked');
        if(radio != null){
            radio.checked = false;
            selected = {};
        }
    }
});

