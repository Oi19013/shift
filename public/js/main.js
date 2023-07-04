const week = ["日", "月", "火", "水", "木", "金", "土"];
const today = new Date();
// console.log(document.getElementsByClassName('modalClose'))
const modal = document.getElementById('shiftModal');
const buttonClose = document.getElementsByClassName('modalClose')[0];

// 月末だとずれる可能性があるため、1日固定で取得
let showDate = new Date(today.getFullYear(), today.getMonth(), 1);

// 初期表示
window.onload = function () {
    showProcess(today, calendar);
};
// 前の月表示
function prev(){
    showDate.setMonth(showDate.getMonth() - 1);
    showProcess(showDate);
}

// 次の月表示
function next(){
    showDate.setMonth(showDate.getMonth() + 1);
    showProcess(showDate);
}

// カレンダー表示
function showProcess(date) {
    let year = date.getFullYear();
    let month = date.getMonth();
    document.querySelector('#header').innerHTML = year + "年 " + (month + 1) + "月";

    let calendar = createProcess(year, month);
    document.querySelector('#calendar').innerHTML = calendar;
}

// シフト編集画面表示
function changeShift(count) {
    modal.style.display = 'block';
    let count_date = count + "日"
    document.querySelector('#shiftDate').innerHTML = count_date;
}

// シフト編集画面非表示
buttonClose.addEventListener('click', modalClose);
function modalClose() {
  modal.style.display = 'none';
}
// モーダルコンテンツ以外がクリックされた時
addEventListener('click', outsideClose);
function outsideClose(e) {
  if (e.target == modal) {
    modal.style.display = 'none';
  }
}

// シフト提出
function submit() {
    let count = document.querySelector('#shiftDate').innerHTML.replace('日', '')
    let original = document.getElementById(count).innerHTML
    let time = document.getElementById('shiftTime');
    let index = time.selectedIndex;
    let str = time.options[index].value;
    document.getElementById(count).innerHTML = original.replace(/<p>(\d*:\d*~)*/, '<p>' + str);
    modalClose()
}

// dbから取得
const getCalenderFromdb = async (date) => {
    try {
        let calendarFromdb = await axios.get('/api/getCalender', {
            params: {
                'month': `${date.getFullYear()}_${date.getMonth()}`
            }
        });
        console.log(calendarFromdb)
    } catch (err) {
        console.log(err);
    }
};
getCalenderFromdb(today)

// カレンダー作成
function createProcess(year, month) {
    // 曜日
    let calendar = "<table><tr class='dayOfWeek'>";
    for (let i = 0; i < week.length; i++) {
        calendar += "<th>" + week[i] + "</th>";
    }
    calendar += "</tr>";

    let count = 0;
    let startDayOfWeek = new Date(year, month, 1).getDay();
    let endDate = new Date(year, month + 1, 0).getDate();
    let lastMonthEndDate = new Date(year, month, 0).getDate();
    let row = Math.ceil((startDayOfWeek + endDate) / week.length);

    // dbから取得
    // const 

    // 1行ずつ設定
    for (let i = 0; i < row; i++) {
        calendar += "<tr>";
        // 1colum単位で設定
        for (let j = 0; j < week.length; j++) {
            if (i == 0 && j < startDayOfWeek) {
                // 1行目で1日まで先月の日付を設定
                calendar += "<td class='disabled'>" + (lastMonthEndDate - startDayOfWeek + j + 1) + "</td>";
            } else if (count >= endDate) {
                // 最終行で最終日以降、翌月の日付を設定
                count++;
                calendar += "<td class='disabled'>" + (count - endDate) + "</td>";
            } else {
                // 当月の日付を曜日に照らし合わせて設定
                count++;
                if(year == today.getFullYear()
                  && month == (today.getMonth())
                  && count == today.getDate()){
                    calendar += `<td class='today' id='${count}'><button id='shiftOpen' type='button' onclick='changeShift(${count})'>` + count + "</button><p></p></td>";
                } else {
                    calendar += `<td id='${count}'><button id='shiftOpen' type='button' onclick='changeShift(${count})'>` + count + "</button><p></p></td>";
                }
            }
        }
        calendar += "</tr>";
    }
    return calendar;
}