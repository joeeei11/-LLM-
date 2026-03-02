// utils/storage.js - 本地数据存储工具
const KEYS = {
    GOALS: 'goals',
    TASKS: 'tasks',
    DAILY_RECORDS: 'dailyRecords',
    SETTINGS: 'settings'
}

// ===== 目标 (Goals) =====
function getGoals() {
    return wx.getStorageSync(KEYS.GOALS) || []
}

function saveGoals(goals) {
    wx.setStorageSync(KEYS.GOALS, goals)
}

function addGoal(goal) {
    const goals = getGoals()
    goal._id = generateId()
    goal.createdAt = Date.now()
    goal.progress = 0
    goal.status = 'active'
    goals.unshift(goal)
    saveGoals(goals)
    return goal
}

function updateGoal(id, data) {
    const goals = getGoals()
    const idx = goals.findIndex(g => g._id === id)
    if (idx !== -1) {
        goals[idx] = { ...goals[idx], ...data }
        saveGoals(goals)
        return goals[idx]
    }
    return null
}

function deleteGoal(id) {
    let goals = getGoals()
    goals = goals.filter(g => g._id !== id)
    saveGoals(goals)
    // 同时删除关联任务
    let tasks = getTasks()
    tasks = tasks.filter(t => t.goalId !== id)
    saveTasks(tasks)
}

function getGoalById(id) {
    const goals = getGoals()
    return goals.find(g => g._id === id) || null
}

// ===== 任务 (Tasks) =====
function getTasks() {
    return wx.getStorageSync(KEYS.TASKS) || []
}

function saveTasks(tasks) {
    wx.setStorageSync(KEYS.TASKS, tasks)
}

function addTask(task) {
    const tasks = getTasks()
    task._id = generateId()
    task.createdAt = Date.now()
    task.done = false
    tasks.push(task)
    saveTasks(tasks)
    updateGoalProgress(task.goalId)
    return task
}

function updateTask(id, data) {
    const tasks = getTasks()
    const idx = tasks.findIndex(t => t._id === id)
    if (idx !== -1) {
        tasks[idx] = { ...tasks[idx], ...data }
        saveTasks(tasks)
        updateGoalProgress(tasks[idx].goalId)
        return tasks[idx]
    }
    return null
}

function deleteTask(id) {
    const tasks = getTasks()
    const task = tasks.find(t => t._id === id)
    const filtered = tasks.filter(t => t._id !== id)
    saveTasks(filtered)
    if (task && task.goalId) {
        updateGoalProgress(task.goalId)
    }
}

function toggleTask(id) {
    const tasks = getTasks()
    const idx = tasks.findIndex(t => t._id === id)
    if (idx !== -1) {
        tasks[idx].done = !tasks[idx].done
        tasks[idx].completedAt = tasks[idx].done ? Date.now() : null
        saveTasks(tasks)
        updateGoalProgress(tasks[idx].goalId)
        updateDailyRecord(tasks[idx].date)
        return tasks[idx]
    }
    return null
}

function getTasksByDate(date) {
    const tasks = getTasks()
    return tasks.filter(t => t.date === date).sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1
        return (a.priority || 3) - (b.priority || 3)
    })
}

function getTasksByGoal(goalId) {
    const tasks = getTasks()
    return tasks.filter(t => t.goalId === goalId)
}

function getTasksByDateRange(startDate, endDate) {
    const tasks = getTasks()
    return tasks.filter(t => t.date >= startDate && t.date <= endDate)
}

// ===== 每日记录 =====
function getDailyRecords() {
    return wx.getStorageSync(KEYS.DAILY_RECORDS) || {}
}

function getDailyRecord(date) {
    const records = getDailyRecords()
    return records[date] || null
}

function updateDailyRecord(date) {
    if (!date) return
    const tasks = getTasksByDate(date)
    const total = tasks.length
    const completed = tasks.filter(t => t.done).length
    const score = total > 0 ? Math.round((completed / total) * 100) : 0

    const records = getDailyRecords()
    records[date] = { total, completed, score }
    wx.setStorageSync(KEYS.DAILY_RECORDS, records)
}

// ===== 目标进度更新 =====
function updateGoalProgress(goalId) {
    if (!goalId) return
    const tasks = getTasksByGoal(goalId)
    if (tasks.length === 0) return
    const completed = tasks.filter(t => t.done).length
    const progress = Math.round((completed / tasks.length) * 100)
    updateGoal(goalId, { progress })
}

// ===== 设置 =====
function getSettings() {
    return wx.getStorageSync(KEYS.SETTINGS) || {
        apiKey: '',
        apiProvider: 'qianwen',
        apiModel: 'qwen-turbo',
        reminderEnabled: false
    }
}

function saveSettings(settings) {
    wx.setStorageSync(KEYS.SETTINGS, settings)
}

// ===== 统计数据 =====
function getStats() {
    const tasks = getTasks()
    const goals = getGoals()
    const records = getDailyRecords()

    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.done).length
    const activeGoals = goals.filter(g => g.status === 'active').length
    const completedGoals = goals.filter(g => g.status === 'completed').length

    // 计算连续打卡天数
    let streak = 0
    const today = formatDate(new Date())
    let checkDate = new Date()
    while (true) {
        const dateStr = formatDate(checkDate)
        const record = records[dateStr]
        if (record && record.completed > 0) {
            streak++
            checkDate.setDate(checkDate.getDate() - 1)
        } else if (dateStr === today) {
            checkDate.setDate(checkDate.getDate() - 1)
        } else {
            break
        }
    }

    return {
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        activeGoals,
        completedGoals,
        streak
    }
}

// ===== 工具函数 =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function formatDate(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

module.exports = {
    getGoals, saveGoals, addGoal, updateGoal, deleteGoal, getGoalById,
    getTasks, saveTasks, addTask, updateTask, deleteTask, toggleTask,
    getTasksByDate, getTasksByGoal, getTasksByDateRange,
    getDailyRecords, getDailyRecord, updateDailyRecord,
    getSettings, saveSettings,
    getStats,
    generateId, formatDate
}
