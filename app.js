// app.js - PlanMate 目标规划助手
App({
  onLaunch() {
    // 初始化本地存储
    this.initStorage()
  },

  // 初始化存储
  initStorage() {
    if (!wx.getStorageSync('goals')) {
      wx.setStorageSync('goals', [])
    }
    if (!wx.getStorageSync('tasks')) {
      wx.setStorageSync('tasks', [])
    }
    if (!wx.getStorageSync('dailyRecords')) {
      wx.setStorageSync('dailyRecords', {})
    }
    if (!wx.getStorageSync('settings')) {
      wx.setStorageSync('settings', {
        apiKey: '',
        apiProvider: 'qianwen',
        apiModel: 'qwen-turbo',
        reminderEnabled: false
      })
    }
  },

  // 全局数据
  globalData: {
    userInfo: null,
    // 分类配置
    categories: [
      { id: 'work', name: '工作', icon: '💼', color: '#4F7CFF' },
      { id: 'study', name: '学习', icon: '📚', color: '#FF9F43' },
      { id: 'health', name: '健康', icon: '💪', color: '#2ED573' },
      { id: 'finance', name: '财务', icon: '💰', color: '#FF6B6B' },
      { id: 'life', name: '生活', icon: '🌟', color: '#A55EEA' }
    ],
    // 优先级配置
    priorities: [
      { id: 1, name: '高', color: '#FF6B6B' },
      { id: 2, name: '中', color: '#FF9F43' },
      { id: 3, name: '低', color: '#2ED573' }
    ]
  }
})
