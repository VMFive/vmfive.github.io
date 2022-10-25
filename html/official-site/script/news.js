var newsContainer = document.getElementById('news-container');
var postContainer = document.getElementById('post-container');
var sessionLogo = document.querySelector('.session-logo');
var loader = document.querySelector('.lds-hourglass');
var url_string = window.location;
var url = new URL(url_string);
var news_id = url.searchParams.get("nid");
var hasPost = false;
var selected_post = null;
function padLeft(str, len) {
    str = '' + str;
    return str.length >= len ? str : new Array(len - str.length + 1).join("0") + str;
}
function processDate(gmt_str) {
    let date = new Date(gmt_str);
    let dateStr = `${date.getFullYear()}.${padLeft(date.getMonth() + 1, 2)}.${padLeft(date.getDate(), 2)}`;
    return dateStr;
}

var xhr = new XMLHttpRequest();
xhr.onload = function () {
    var newsList = JSON.parse(xhr.responseText);
    try {
        let promise = new Promise((resolve, reject) => {
            for (let i = 0; i < newsList.length; i++) {
                if (String(newsList[i].id) === String(news_id)) {
                    selected_post = newsList[i];
                    hasPost = true;
                }
                if (i === newsList.length - 1) {
                    if (hasPost) {
                        let p_img = new Image()
                        p_img.src = selected_post.jetpack_featured_media_url;
                        p_img.onload = function () {
                            resolve();
                        }
                    } else {
                        resolve();
                    }
                }
            }
        });

        promise.then(function () {
            loader.classList.add('hide');
            if (hasPost) {
                postContainer.style.display = 'inline';
                let htmlcontent = `
					<div class="post-kv" data-aos="fade-up" data-aos-delay="300">
                        <img src="${selected_post.jetpack_featured_media_url}">
                    </div>	
                    <div class="post-date">
                        ${processDate(selected_post.date_gmt)}
                    </div>
                    <div class="post-title">
                        ${selected_post.title.rendered.replace(/\<br>/g, '')}
                    </div>
                    <hr class="post-hr">
                    <div class="post-content">
                        ${selected_post.content.rendered}
                    </div>
					`;
                postContainer.insertAdjacentHTML('afterbegin', htmlcontent);
            } else {
                newsContainer.style.display = 'inline-flex';
                newsList.forEach((news, index) => {
                    let imgStr = news.jetpack_featured_media_url;
                    let dateStr = processDate(news.date_gmt);
                    let titleStr = news.title.rendered.replace(/\<br>/g, '');
                    let excerptStr = news.excerpt.rendered;
                    let nid = news.id;

                    let htmlcontent = `
					<div class="col-4 col-news mx-auto" data-aos="fade-up">
						<div class="news-card">
							<div class="news-image">
								<img src="${imgStr}">
							</div>
							<div class="news-date mt-3">
								${dateStr}
							</div>
							<div class="news-title mt-3">
								${titleStr}
							</div>
							<div class="news-content mt-3">
								${excerptStr}
							</div>
							<div class="news-more mt-4 mt-lg-5">
								<a href="./news.html?nid=${nid}">Read more</a>
							</div>
							<div>
								<img class="matte-background" src="./image/matte.png">
							</div>
						</div>
					</div>
					`;
                    newsContainer.insertAdjacentHTML('beforeend', htmlcontent);
                });
            }
        });
    } catch (e) {
        console.log(e);
    }
}
xhr.open('GET', 'https://adison.com.tw/wp-json/wp/v2/posts?categories=1');
xhr.send(null);