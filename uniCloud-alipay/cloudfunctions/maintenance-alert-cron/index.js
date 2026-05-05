'use strict';
const db = uniCloud.database()
const dbCmd = db.command

async function getDeviceName(deviceId) {
  if (!deviceId) return '未知设备'
  try {
    const res = await db.collection('medical-device').doc(deviceId).field({ name: true, code: true }).get()
    const device = res.result.data[0]
    return device ? device.name + (device.code ? ' (' + device.code + ')' : '') : '未知设备'
  } catch (e) {
    return '未知设备'
  }
}

exports.main = async (event, context) => {
  const now = Date.now()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartTs = todayStart.getTime()

  const plans = await db.collection('medical-device-maintenance')
    .where({
      deleted: 0,
      status: dbCmd.in([1, 3])
    })
    .get()

  const results = { checked: 0, created: 0, expired: 0, skipped: 0 }

  for (const plan of plans.result.data) {
    results.checked++

    // 获取到期日期：优先用 next_date，没有则用 plan_date
    const dueDate = plan.next_date || plan.plan_date
    if (!dueDate) {
      results.skipped++
      continue
    }

    // 计算提醒开始日期 = 到期日 - 提前提醒天数
    const remindBeforeMs = (plan.remind_before_days || 7) * 24 * 60 * 60 * 1000
    const alertThresholdDate = dueDate - remindBeforeMs

    // 检查是否已逾期
    if (dueDate < todayStartTs && plan.status !== 3) {
      await db.collection('medical-device-maintenance').doc(plan._id).update({
        status: 3,
        updated_at: now
      })
      results.expired++
    }

    // 在提醒窗口内（提醒日开始 ~ 到期日当天）
    if (now >= alertThresholdDate && now <= dueDate + 86400000) {
      // 去重检查：是否已存在同一保养计划的未删除提醒
      const existing = await db.collection('medical-device-alert')
        .where({
          related_id: plan._id,
          related_type: 'maintenance',
          deleted: 0
        })
        .get()

      if (existing.result.data.length === 0) {
        const deviceName = await getDeviceName(plan.device_id)
        const typeLabels = { 1: '定期保养', 2: '校准', 3: '其他' }
        const typeLabel = typeLabels[plan.maintenance_type] || '保养'

        await db.collection('medical-device-alert').add({
          device_id: plan.device_id,
          alert_type: 1,
          title: '保养到期提醒 - ' + deviceName,
          description: '设备' + deviceName + '的' + typeLabel + '计划"' + (plan.plan_name || '') + '"即将到期，计划日期：' + new Date(plan.plan_date).toLocaleDateString('zh-CN') + '，请及时处理。',
          alert_date: now,
          is_read: 0,
          related_id: plan._id,
          related_type: 'maintenance',
          deleted: 0
        })
        results.created++
      } else {
        results.skipped++
      }
    } else {
      results.skipped++
    }
  }

  return {
    code: 0,
    message: '保养提醒扫描完成',
    data: results
  }
};
