const week = ["日", "月", "火", "水", "木", "金", "土"];
const today = new Date();
let user_name = ""
// console.log(document.getElementsByClassName('modalClose'))
const modal = document.getElementById('shiftModal');
const buttonClose = document.getElementsByClassName('modalClose')[0];

// 月末だとずれる可能性があるため、1日固定で取得
let showDate = new Date(today.getFullYear(), today.getMonth(), 1);

// 初期表示
window.onload = function () {
    const url = window.location.href;
    user_name = decodeURIComponent(url.split("user_name=")[1]);
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

    createProcess(year, month)
        .then((calendar) => {
            document.querySelector('#calendar').innerHTML = calendar;
        })
        .catch((err) => {
            console.log('エラーが発生しました', err);
        });
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
async function getCalendarFromdb(date) {
    try {
        let calendarFromdb = await axios.get('/api/getCalendar', {
            params: {
                'month': `${date.getFullYear()}_${date.getMonth() + 1}`
            }
        });

        let own_shift = {};
        let shift_per_date = new Array(31);

        for (const user_data of calendarFromdb.data) {
            if (user_data["name"] === user_name) {
                own_shift = user_data;
            }
            for (let i = 0; i < 31; i++) {
                shift_per_date[i] = user_data[`${i+1}_`];
            }
        }
        return [own_shift, shift_per_date];
    } catch (err) {
        console.log(err);
    }
};


// カレンダー作成
async function createProcess(year, month) {
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
    let shift_time = "";

    try {
        const [own_shift, shift_per_date] = await getCalendarFromdb(today);
        console.log(own_shift);
        console.log(shift_per_date);

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
                    if (own_shift[`${count}_`] !== null) {
                        shift_time = `${own_shift[`${count}_`]}`;
                    } else {
                        shift_time = "";
                    }
                    if (year == today.getFullYear() && month == today.getMonth() && count == today.getDate()) {
                        calendar += `<td class='today' id='${count}'><button id='shiftOpen' type='button' onclick='changeShift(${count})'>` + count + `</button><p>${shift_time}</p></td>`;
                    } else {
                        calendar += `<td id='${count}'><button id='shiftOpen' type='button' onclick='changeShift(${count})'>` + count + `</button><p>${shift_time}</p></td>`;
                    }
                }
            }
            calendar += "</tr>";
        }
        return calendar;
    } catch (err) {
        console.log('エラーが発生しました', err);
        throw err;
    }
}
