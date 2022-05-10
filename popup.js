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

async function getFromLocal(){
    console.log("getFromLocal");
    TopicDic = await readLocalStorage('nodeDic',{});
}

async function getFromBackUp(){
    console.log("getFromBackUp");
    TopicDic = await readLocalStorage('BackUp',{});
}

function setToLocal(_nodeDic){
  console.log("setToLocal");
  chrome.storage.local.set({'nodeDic':_nodeDic}, function () {});
}

function setToBackUp(_nodeDic){
  console.log("setToBackUp");
  chrome.storage.local.set({'BackUp':_nodeDic}, function () {});
}

async function initilize(){
    updateText();
    await getFromLocal();
    updateText();
}

function MoveNewsContainer(moveBetweenArray,moveInsideArray){
    let currentIndex = topicList.indexOf(selected.query);
    currentIndex += moveBetweenArray + topicList.length;
    currentIndex %= topicList.length;
    let nextQuery = topicList[currentIndex];
    let ind = TopicDic[selected.query].findIndex(node => (node.url == selected.url));
    if(ind == -1) throw new Error('TopicDic에 찾는 url를 가진 노드가 존재 안 합니다.');
    let movingIndex = (TopicDic[selected.query].length+ind+moveInsideArray)%TopicDic[selected.query].length;
    // let moveOnHTMLidndex = (moveInsideArray>0)? moveInsideArray+1 : moveInsideArray;
    // document.querySelector("#"+nextQuery).insertBefore(selected.node,(nextQuery == selected.query && ind+moveOnHTMLidndex > -1&& ind+moveOnHTMLidndex < TopicDic[selected.query].length)?GetHTMLNodeFromUrl(TopicDic[selected.query][ind+moveOnHTMLidndex].url):null);
    if(TopicDic.hasOwnProperty(nextQuery)){
        if(moveBetweenArray != 0){
            TopicDic[nextQuery].push(TopicDic[selected.query][ind]);
        }else{
            let tempNode = TopicDic[selected.query][movingIndex];
            TopicDic[selected.query][movingIndex] = TopicDic[selected.query][ind];
            TopicDic[selected.query][ind] = tempNode;
        }
    }else{
        let array = [];
        array.push(TopicDic[selected.query][ind]);
        TopicDic[nextQuery] = array;
    }
    if(ind != -1 && moveBetweenArray != 0) TopicDic[selected.query].splice(ind, 1);
    // selected.node = GetHTMLNodeFromUrl(selected.url);
    // selected.node.querySelector('input[type=radio]').checked = true;
    // selected.node.querySelector('label').style = "background-color:#bfb;border-color: #4c4;";
    selected.query = nextQuery;
    setToLocal(TopicDic);
}

function GetHTMLNodeFromUrl(url){
    let para = (new URL(url)).searchParams;
    return document.querySelector("[id='"+para.get("oid")+para.get("aid")+"']");
}

function DeleteNewsContainer(){
    setToBackUp(TopicDic);
    let ind = TopicDic[selected.query].findIndex(node => (node.url == selected.url));
    if(ind == -1){
        throw new Error('TopicDic에 찾는 url를 가진 노드가 존재 안 합니다.');
    }else{
        TopicDic[selected.query].splice(ind, 1);
    }
    selected = {};
    setToLocal(TopicDic);
}

function OpenAtNewTab(e){
    e.preventDefault();
    chrome.tabs.create({ url: e.currentTarget.href });
}

function updateText(){    
    topicListPart.forEach((node)=>{
        node.innerHTML = '';
        if(!TopicDic.hasOwnProperty(node.id)) return;
        TopicDic[node.id].forEach(value => {
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
            if(selected.url == value.url){
                newsDivclone.querySelector('input[type=radio]').checked = true;
                // newsDivclone.querySelector('label').style = "background-color:#bfb;border-color: #4c4;";
            }
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
    setToLocal(TopicDic);
}

async function revertReset(){
    await getFromBackUp();
    setToLocal(TopicDic);
}

document.addEventListener("keydown",function(event){
    switch(event.key){
        case 'Delete' || 'Backspace':
            if(selected != {} && TopicDic.hasOwnProperty(selected.query) && TopicDic[selected.query].findIndex(node => (node.url == selected.url)) != -1){
                DeleteNewsContainer();
                countString();
            }
            break;

        case "ArrowUp":
            if(selected != {}){
                MoveNewsContainer(-1,0);
                console.log("selected.node.querySelector('input[type=radio]') : %o, checked : %s,label : %o,labelColor : %o" ,selected.node.querySelector('input[type=radio]') ,
                selected.node.querySelector('input[type=radio]').checked,selected.node.querySelector('label'),selected.node.querySelector('label').style);
            }
            break;

        case "ArrowDown":
            if(selected != {}){
                MoveNewsContainer(1,0);
                console.log("selected.node.querySelector('input[type=radio]') : %o, checked : %s,label : %o,labelColor : %o" ,selected.node.querySelector('input[type=radio]') ,
                selected.node.querySelector('input[type=radio]').checked,selected.node.querySelector('label'),selected.node.querySelector('label').style);
            }
            break;
        case "ArrowLeft":
            if(selected != {}){
                MoveNewsContainer(0,-1);
                console.log("selected.node.querySelector('input[type=radio]') : %o, checked : %s,label : %o,labelColor : %o" ,selected.node.querySelector('input[type=radio]') ,
                selected.node.querySelector('input[type=radio]').checked,selected.node.querySelector('label'),selected.node.querySelector('label').style);
            }
            break;
        case "ArrowRight":
            if(selected != {}){
                MoveNewsContainer(0,1);
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

