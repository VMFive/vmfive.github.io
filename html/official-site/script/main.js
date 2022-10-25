particlesJS.load('bg-container', './script/particles.json', function () { });

AOS.init({
    duration: 1000,
    once: true
});
let brand_input = document.getElementById('brand-input');
let lan_input = document.getElementById('language-input');
brand_input.addEventListener('change', function () {
    if (this.checked) {
        lan_input.checked = false;
    }
});
lan_input.addEventListener('change', function () {
    if (this.checked) {
        brand_input.checked = false;
    }
});

window.onscroll = function () { scrollFunction() };

function scrollFunction() {
    if (window.innerWidth > 991) return;
    if (document.body.scrollTop > 150 || document.documentElement.scrollTop > 150) {
        document.querySelector(".navbar").style.backgroundColor = '#00000090';
        document.querySelector(".navbar").style.backdropFilter = 'blur(10px)';
    } else {
        document.querySelector(".navbar").style.backgroundColor = "transparent";
        document.querySelector(".navbar").style.backdropFilter = 'blur(0px)';
    }
}

document.body.scrollTop = 0;
document.documentElement.scrollTop = 0;