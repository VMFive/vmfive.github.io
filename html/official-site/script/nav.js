let nav = `<div class="container navbar">
<div class="wrap m-auto d-flex justify-content-between">
    <div class="d-inline-flex align-items-center">
        <a class=nav-index href="./index.html"><img src="./image/logo.svg" alt="logo"></a>
    </div>
    <nav class="pc-nav d-none d-lg-flex">
        <ul class="navbar-nav flex-row ms-auto mb-lg-0 main-menu">
            <li class="nav-item mx-4">
                <a class="nav-link nav-about" href="./about.html">About</a>
            </li>
            <li class="nav-item mx-4">
                <a class="nav-link nav-milestone" href="./milestone.html">Milestone</a>
            </li>
            <li class="nav-item mx-4">
                <a class="nav-link nav-brand">Brand</a>
                <ul class="sub-menu">
                    <li>
                        <a href="#vmfive-adison">ADiSOn</a>
                    </li>
                    <li>
                        <a href="./acxel.html">Acxel</a>
                    </li>
                </ul>
            </li>
            <li class="nav-item mx-4">
                <a class="nav-link nav-news" href="./news.html">News</a>
            </li>
            <li class="nav-item mx-4">
                <a class="nav-link nav-contact" href="./contact.html">Contact</a>
            </li>
            <li class="nav-item mx-4">
                <a class="nav-link nav-join" href="./join.html">Join</a>
            </li>
        </ul>
    </nav>
    <nav class="mobile-nav d-lg-none">
        <input class="menu-btn" type="checkbox" id="menu-btn" />
        <label class="menu-icon" for="menu-btn"><span class="navicon"></span></label>
        <ul class="main-menu">
            <li class="nav-item">
                <a class="nav-link nav-about" href="./about.html">About</a>
            </li>
            <li class="nav-item">
                <a class="nav-link nav-milestone" href="./milestone.html">Milestone</a>
            </li>
            <li class="nav-item">
                <input class="li-btn" type="checkbox" id="brand-input" />
                <label class="li-label nav-link nav-brand" for="brand-input">
                    Brand
                </label>
                <ul class="sub-menu">
                    <li>
                        <a href="#vmfive-adison">ADiSOn</a>
                    </li>
                    <li>
                        <a href="./acxel.html">Acxel</a>
                    </li>
                </ul>
            </li>
            <li class="nav-item">
                <a class="nav-link nav-news" href="./news.html">News</a>
            </li>
            <li class="nav-item">
                <a class="nav-link nav-contact" href="./contact.html">Contact</a>
            </li>
            <li class="nav-item">
                <a class="nav-link nav-join" href="./join.html">Join</a>
            </li>
        </ul>
    </nav>
</div>
</div>`;

document.getElementById('nav-container').insertAdjacentHTML('afterbegin', nav);
document.querySelectorAll(`.${document.getElementById('nav-container').dataset.name}`).forEach((el, index) => {
    switch (document.getElementById('nav-container').dataset.name) {
        case 'nav-index':
            el.href = '#';
            break;
        case 'nav-about':
            el.href = '#';
            el.classList.add('active');
            break;
        case 'nav-milestone':
            el.href = '#';
            el.classList.add('active');
            break;
        case 'nav-brand':
            el.href = '#';
            el.classList.add('active');
            break;
        case 'nav-news':
            el.href = './news.html';
            el.classList.add('active');
            break;
        case 'nav-contact':
            el.href = '#';
            el.classList.add('active');
            break;
        case 'nav-join':
            el.href = '#';
            el.classList.add('active');
            break;
        case 'nav-language':
            el.href = '#';
            el.classList.add('active');
            break;
    }
});
