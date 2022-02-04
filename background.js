// let nodeDic = {};
// chrome.storage.sync.clear();
// chrome.storage.sync.set({'nodeDic': {}}, function () {});

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

function changeIcon(active){
  console.log(active);
  if(active){
    chrome.action.setIcon({
      path: {
        "16":"icon/x-16.png",
        "32":"icon/x-32.png",
        "48":"icon/x-48.png",
        "128":"icon/x-128.png"
      }
  },()=>{});
  }else{
    chrome.action.setIcon({
      path: {
        "16":"icon/icon-for-news-16.png",
        "32":"icon/icon-for-news-32.png",
        "48":"icon/icon-for-news-48.png",
        "128":"icon/icon-for-news-128.png"
    }
    },()=>{});
  }
}

(async ()=>{
  let active  = await readLocalStorage('active',false);
  changeIcon(active);
})();

chrome.action.onClicked.addListener(async ()=>{
  let active  = await readLocalStorage('active',false);
  active = !active;
  changeIcon(active);
  chrome.storage.local.set({active: active}, function () {});
});