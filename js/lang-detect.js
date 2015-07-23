(function(){
  var lang = window.navigator.userLanguage || window.navigator.language ;
  var pathname = window.location.pathname.slice(1).split('.')[0].split('_');
  console.log(lang);
  // console.log(window.location.search? "true":"false");

  // console.log(pathname.length);
  if(!window.location.search){
    switch (lang.toLowerCase()) {
      case "ja":
      case "ja-jp":
        if(pathname.length < 2 || (pathname.length > 1 && pathname[1] !== "japanese"))
          window.location.href = "home_japanese.html";
        break;
      default:
        if(pathname.length > 1)
          window.location.href = "home.html";
        break;
    }
  }


}());
