// utils/date.js - 日期工具函数

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// 获取今天日期字符串
function getToday() {
    return formatDate(new Date())
}

// 获取星期几（中文）
function getWeekDay(date) {
    const days = ['日', '一', '二', '三', '四', '五', '六']
    return '周' + days[new Date(date).getDay()]
}

// 获取短格式日期 (M月D日)
function getShortDate(date) {
    const d = new Date(date)
    return `${d.getMonth() + 1}月${d.getDate()}日`
}

// 获取月份名称
function getMonthName(month) {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月']
    return months[month]
}

// 获取一周的日期范围
function getWeekRange(date) {
    const d = new Date(date)
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return {
        start: formatDate(monday),
        end: formatDate(sunday),
        days: Array.from({ length: 7 }, (_, i) => {
            const dt = new Date(monday)
            dt.setDate(monday.getDate() + i)
            return {
                date: formatDate(dt),
                day: dt.getDate(),
                weekDay: getWeekDay(dt),
                isToday: formatDate(dt) === getToday()
            }
        })
    }
}

// 获取某月的天数
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate()
}

// 获取一年中所有日期
function getYearDates(year) {
    const dates = []
    for (let month = 0; month < 12; month++) {
        const days = getDaysInMonth(year, month)
        for (let day = 1; day <= days; day++) {
            dates.push(formatDate(new Date(year, month, day)))
        }
    }
    return dates
}

// 日期相对描述
function getRelativeDate(dateStr) {
    const today = getToday()
    const d = new Date(dateStr)
    const t = new Date(today)
    const diff = Math.floor((d - t) / (1000 * 60 * 60 * 24))

    if (diff === 0) return '今天'
    if (diff === 1) return '明天'
    if (diff === -1) return '昨天'
    if (diff > 0 && diff <= 7) return `${diff}天后`
    if (diff < 0 && diff >= -7) return `${-diff}天前`
    return getShortDate(dateStr)
}

// 获取问候语
function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    if (hour < 22) return '晚上好'
    return '夜深了'
}

// 加减天数
function addDays(dateStr, days) {
    const d = new Date(dateStr)
    d.setDate(d.getDate() + days)
    return formatDate(d)
}

module.exports = {
    formatDate, getToday, getWeekDay, getShortDate, getMonthName,
    getWeekRange, getDaysInMonth, getYearDates,
    getRelativeDate, getGreeting, addDays
}
