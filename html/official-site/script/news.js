var newsContainer = document.getElementById('news-container');
var postContainer = document.getElementById('post-container');
var paginationContainer = document.getElementById('pagination-container');
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

if (news_id) {
    loadPost();
} else {
    loadNewsPage();
}

function loadPost() {
    var xhr_by_id = new XMLHttpRequest();
    xhr_by_id.onload = function () {
        try {
            if (xhr_by_id.status === 200) {
                let post_json = JSON.parse(xhr_by_id.responseText);
                loader.classList.add('hide');
                postContainer.style.visibility = 'visible';
                let htmlcontent = `
                    <div class="post-kv">
                        <img src="${post_json.jetpack_featured_media_url}">
                    </div>	
                    <div class="post-date">
                        ${processDate(post_json.date_gmt)}
                    </div>
                    <div class="post-title">
                        ${post_json.title.rendered.replace(/\<br>/g, '')}
                    </div>
                    <hr class="post-hr">
                    <div class="post-content">
                        ${post_json.content.rendered}
                    </div>
                `;
                postContainer.insertAdjacentHTML('afterbegin', htmlcontent);
            } else {
                loadNewsPage();
            }
        } catch (e) {
            console.log(e);
        }
    }
    xhr_by_id.open('GET', `https://blog.vmfive.com/wp-json/wp/v2/posts/${news_id}`);
    xhr_by_id.send(null);
}

function loadNewsPage() {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        try {
            var newsList = JSON.parse(xhr.responseText);
            loader.classList.add('hide');
            newsContainer.style.visibility = 'visible';
            paginationContainer.style.visibility = 'visible';
        } catch (e) {
            console.log(e);
        }

        $('#pagination-container').pagination({
            dataSource: newsList,
            pageSize: 9,
            prevText: `<svg class="arrow-shadow arrow-left" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.7958 22.3925L12.6066 23.6125C12.1031 24.1291 11.2889 24.1291 10.7908 23.6125L0.377635 12.9343C-0.12588 12.4177 -0.12588 11.5823 0.377635 11.0712L10.7908 0.387452C11.2943 -0.12915 12.1085 -0.12915 12.6066 0.387452L13.7958 1.60751C14.3047 2.12961 14.2939 2.98145 13.7744 3.49256L7.31972 9.80169L22.7144 9.80169C23.4269 9.80169 24 10.3897 24 11.1207L24 12.8793C24 13.6103 23.4269 14.1983 22.7144 14.1983L7.31972 14.1983L13.7744 20.5074C14.2993 21.0185 14.31 21.8704 13.7958 22.3925Z" fill="#FC981C" /></svg>`,
            nextText: `<svg class="arrow-shadow arrow-right" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.2042 1.60751L11.3934 0.387449C11.8969 -0.129153 12.7111 -0.129153 13.2092 0.387449L23.6224 11.0657C24.1259 11.5823 24.1259 12.4177 23.6224 12.9288L13.2092 23.6125C12.7057 24.1291 11.8915 24.1291 11.3934 23.6125L10.2042 22.3925C9.69535 21.8704 9.70606 21.0185 10.2256 20.5074L16.6803 14.1983L1.28557 14.1983C0.573153 14.1983 2.37969e-06 13.6103 2.25189e-06 12.8793L1.9444e-06 11.1207C1.8166e-06 10.3897 0.573152 9.80169 1.28557 9.80169L16.6803 9.80169L10.2256 3.49256C9.7007 2.98145 9.68999 2.12961 10.2042 1.60751Z" fill="#FC981C" /></svg>`,
            ulClassName: 'news-pagination m-auto',
            callback: function (data, pagination) {
                document.body.scrollTop = 0;
                document.documentElement.scrollTop = 0;
                function template(data) {
                    var html = '';
                    data.forEach((news, index) => {
                        let imgStr = news.jetpack_featured_media_url;
                        let dateStr = processDate(news.date_gmt);
                        let titleStr = news.title.rendered.replace(/\<br>/g, '');
                        let excerptStr = news.excerpt.rendered.replace(/\<br>/g, '');
                        let nid = news.id;
                        html += `
                        <div class="col-md-6 col-lg-4 col-news">
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
                    });
                    return html;
                }
                var html = template(data);
                $('#news-container').html(html);
            }
        })
    }
    xhr.open('GET', 'https://blog.vmfive.com/wp-json/wp/v2/posts?categories=4&per_page=100');
    xhr.send(null);
}