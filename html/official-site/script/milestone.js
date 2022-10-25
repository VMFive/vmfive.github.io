var milestone = document.querySelector(`.milestone`);
var m_yearList = milestone.querySelectorAll(`.years-item`);
var m_cardList = milestone.querySelectorAll(`.card-item`);
var m_currentIndex = 0;

function m_selectYear(index) {

    m_cardList[m_currentIndex].style.opacity = '0';
    m_yearList[m_currentIndex].classList.remove('active');

    m_cardList[index].style.opacity = '1';
    m_yearList[index].classList.add('active');

    m_currentIndex = index;
}

m_yearList.forEach((el, index) => {
    el.addEventListener('click', () => {
        m_selectYear(index);
    });
});

m_selectYear(0);


var events = document.querySelector(`.events`);
var e_yearList = events.querySelectorAll(`.years-item`);
var e_cardList = events.querySelectorAll(`.card-item`);
var e_currentIndex = 0;

function e_selectYear(index) {

    e_cardList[e_currentIndex].style.opacity = '0';
    e_yearList[e_currentIndex].classList.remove('active');

    e_cardList[index].style.opacity = '1';
    e_yearList[index].classList.add('active');

    e_currentIndex = index;
}

e_yearList.forEach((el, index) => {
    el.addEventListener('click', () => {
        e_selectYear(index);
    });
});

e_selectYear(0);