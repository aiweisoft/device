<template>
	<view class="warp">
		<!-- 下拉刷新指示器（APP/小程序） -->
		<uni-load-more v-if="refreshing" status="loading" :content-text="loadText"></uni-load-more>

		<view class="header">
			<view class="header-top">
				<view>
					<text class="header-greeting">{{ greeting }}</text>
					<text class="header-subtitle">医疗设备全生命周期管理</text>
				</view>
				<view class="header-user" @click="toUserOrLogin">
					<view class="header-avatar">
						<uni-icons type="person-filled" size="28" color="#fff"></uni-icons>
					</view>
					<text class="header-username">{{ userName || '请登录' }}</text>
				</view>
			</view>
		</view>

		<!-- 统计卡片 -->
		<view class="stats-grid">
			<view class="stat-card" v-for="(item, i) in stats" :key="i" @click="navigateToStat(item)">
				<view class="stat-icon-box" :style="{backgroundColor: item.bgColor}">
					<uni-icons :type="item.icon" size="22" :color="item.color"></uni-icons>
				</view>
				<view class="stat-body">
					<text class="stat-number" :style="{color: item.color}">{{ loading ? '--' : item.count }}</text>
					<text class="stat-label">{{ item.label }}</text>
				</view>
			</view>
		</view>

		<!-- 快捷操作 -->
		<view class="quick-actions">
			<view class="section-title">
				<text class="section-title-text">快捷操作</text>
			</view>
			<uni-grid :column="4" :highlight="false" :showBorder="false">
				<uni-grid-item v-for="(item, i) in actions" :key="i" @click="execAction(item.action)">
					<view class="action-item">
						<view class="action-icon" :style="{backgroundColor: item.bgColor}">
							<uni-icons :type="item.icon" size="18" color="#fff"></uni-icons>
						</view>
						<text class="action-text">{{ item.label }}</text>
					</view>
				</uni-grid-item>
			</uni-grid>
		</view>

		<!-- 统计图表 -->
		<view class="charts-row">
			<!-- 使用科室设备分布环形图 -->
			<view class="chart-card">
				<view class="section-title">
					<text class="section-title-text">使用科室设备分布</text>
				</view>
				<view class="donut-wrap" v-if="deptDeviceStats.length">
					<view class="donut-chart">
						<canvas class="donut-canvas" canvas-id="donutCanvas" :style="{ width: canvasSize + 'px', height: canvasSize + 'px' }"></canvas>
						<view class="donut-center">
							<text class="donut-total">{{ deptTotal }}</text>
							<text class="donut-label">设备总数</text>
						</view>
					</view>
					<view class="donut-legend">
						<view class="legend-item" v-for="(item, i) in deptDeviceStats" :key="i">
							<view class="legend-dot" :style="{backgroundColor: item.color}"></view>
							<text class="legend-name ellipsis">{{ item.name }}</text>
							<text class="legend-count">{{ item.count }}</text>
						</view>
					</view>
				</view>
				<view class="empty-state" v-else-if="!loading">
					<text class="empty-text">暂无科室分布数据</text>
				</view>
			</view>

			<!-- 设备状态统计 -->
			<view class="chart-card">
				<view class="section-title">
					<text class="section-title-text">设备状态统计</text>
				</view>
				<view class="status-list" v-if="statusDeviceStats.length">
					<view class="status-item" v-for="(item, i) in statusDeviceStats" :key="i">
						<view class="status-header">
							<view class="status-label">
								<view class="status-dot" :style="{backgroundColor: item.color}"></view>
								<text class="status-name">{{ item.label }}</text>
							</view>
							<text class="status-count">{{ item.count }}台</text>
						</view>
						<view class="status-bar-bg">
							<view class="status-bar" :style="{width: item.percent + '%', backgroundColor: item.color}"></view>
						</view>
					</view>
				</view>
				<view class="empty-state" v-else-if="!loading">
					<text class="empty-text">暂无状态数据</text>
				</view>
			</view>
		</view>

		<!-- 设备分类统计 -->
		<view class="category-section" v-if="!loading">
			<view class="section-title">
				<text class="section-title-text">设备分类统计</text>
			</view>
			<view class="category-list" v-if="categoryStats.length">
				<view class="category-item" v-for="(item, i) in categoryStats" :key="i" @click="toDeviceList">
					<view class="category-info">
						<text class="category-name">{{ item.name }}</text>
						<text class="category-count">{{ item.count }}台</text>
					</view>
					<view class="category-bar-bg">
						<view class="category-bar" :style="{ width: item.percent + '%', backgroundColor: categoryColors[i] }"></view>
					</view>
				</view>
			</view>
			<view class="empty-state" v-else>
				<text class="empty-text">暂无分类数据</text>
			</view>
		</view>

		<!-- 加载骨架 -->
		<view class="alert-section empty-section" v-if="loading">
			<view class="section-title">
				<text class="section-title-text">待处理提醒</text>
			</view>
			<view class="empty-state">
				<text class="empty-text">加载中...</text>
			</view>
		</view>

		<!-- 待处理提醒 -->
		<view class="alert-section" v-else-if="!error && recentAlerts.length">
			<view class="section-title">
				<text class="section-title-text">待处理提醒 <text class="alert-badge">{{ recentAlerts.length }}</text></text>
				<text class="section-more" @click="toAlerts">查看全部</text>
			</view>
			<view class="alert-list">
				<view class="alert-item" v-for="(item, i) in recentAlerts" :key="i" @click="toAlertDetail(item)">
					<view class="alert-dot" :class="item.is_read ? 'dot-read' : 'dot-unread'"></view>
					<view class="alert-content">
						<text class="alert-title">{{ item.title }}</text>
						<text class="alert-desc">{{ item.description || item.content }}</text>
					</view>
					<uni-dateformat :date="item.alert_date || item.create_date" format="MM-dd" :threshold="[86400000, 604800000]" />
				</view>
			</view>
		</view>

		<!-- 提醒空状态 -->
		<view class="alert-section empty-section" v-else-if="!error">
			<view class="section-title">
				<text class="section-title-text">待处理提醒</text>
			</view>
			<view class="empty-state">
				<uni-icons type="checkbox-filled" size="40" color="#d1d5db"></uni-icons>
				<text class="empty-text">暂无待处理提醒</text>
			</view>
		</view>

		<!-- 错误状态 -->
		<view class="alert-section empty-section" v-else>
			<view class="section-title">
				<text class="section-title-text">数据加载失败</text>
			</view>
			<view class="empty-state" @click="refreshAll">
				<uni-icons type="refresh" size="40" color="#d1d5db"></uni-icons>
				<text class="empty-text retry-text">点击重试</text>
			</view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database()
const dbCmd = db.command
import {
	store
} from '@/uni_modules/uni-id-pages/common/store.js'
export default {
	data() {
		return {
			loading: false,
			refreshing: false,
			error: false,
			loadText: {
				contentdown: '',
				contentrefresh: '加载中...',
				contentnomore: ''
			},
			stats: [
				{ label: '设备总数', count: 0, color: '#4f46e5', bgColor: '#eef2ff', icon: 'list', status: '' },
				{ label: '使用中', count: 0, color: '#059669', bgColor: '#ecfdf5', icon: 'checkmarkempty', status: 2 },
				{ label: '维修中', count: 0, color: '#d97706', bgColor: '#fffbeb', icon: 'undo', status: 3 },
				{ label: '待处理报修', count: 0, color: '#dc2626', bgColor: '#fef2f2', icon: 'paperplane', status: 'pending-repair' },
				{ label: '待保养', count: 0, color: '#0891b2', bgColor: '#ecfeff', icon: 'calendar', status: 'pending-maintenance' },
				{ label: '保修过期', count: 0, color: '#6b7280', bgColor: '#f3f4f6', icon: 'closeempty', status: '' }
			],
			actions: [
				{ label: '扫一扫', icon: 'scan', bgColor: '#6366f1', action: 'toScan' },
				{ label: '设备列表', icon: 'list', bgColor: '#10b981', action: 'toDeviceList' },
				{ label: '提交报修', icon: 'paperplane', bgColor: '#f59e0b', action: 'toAddRepair' },
				{ label: '我的报修', icon: 'chatboxes', bgColor: '#8b5cf6', action: 'toRepairs' },
				{ label: '保养提醒', icon: 'notification', bgColor: '#ef4444', action: 'toAlerts' },
				{ label: '维修记录', icon: 'search', bgColor: '#06b6d4', action: 'toRepairHistory' },
				{ label: '扫码记录', icon: 'eye', bgColor: '#f97316', action: 'toScanHistory' },
				{ label: '个人中心', icon: 'person', bgColor: '#14b8a6', action: 'toProfile' }
			],
			recentAlerts: [],
			categoryStats: [],
			categoryColors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
			deptDeviceStats: [],
			statusDeviceStats: [],
			deptColors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'],
			statusConfig: {
				1: { label: '正常', color: '#10b981' },
				2: { label: '使用中', color: '#6366f1' },
				3: { label: '维修中', color: '#f59e0b' },
				4: { label: '报废', color: '#ef4444' },
				5: { label: '未投入', color: '#6b7280' },
				6: { label: '其他', color: '#94a3b8' }
			}
		}
	},
	computed: {
		userName() {
			const info = store.userInfo
			return info && (info.nickname || info.username || info.mobile)
		},
		greeting() {
			const h = new Date().getHours()
			let g = '下午好'
			if (h < 6) g = '夜深了'
			else if (h < 9) g = '早上好'
			else if (h < 12) g = '上午好'
			else if (h < 14) g = '中午好'
			else if (h < 18) g = '下午好'
			else g = '晚上好'
			return g + '，欢迎使用<设备管家>'
		},
		hasLogin() {
			return uniCloud.getCurrentUserInfo().tokenExpired > Date.now()
		},
		deptTotal() {
			return this.deptDeviceStats.reduce((s, d) => s + d.count, 0)
		},
		canvasSize() {
			return uni.upx2px ? uni.upx2px(180) : 90
		}
	},
	onShow() {
		this.refreshAll()
	},
	onPullDownRefresh() {
		this.refreshing = true
		this.refreshAll().then(() => {
			this.refreshing = false
			uni.stopPullDownRefresh()
		}).catch(() => {
			this.refreshing = false
			uni.stopPullDownRefresh()
		})
	},
	methods: {
		async refreshAll() {
			this.error = false
			this.loading = true
			try {
				await Promise.all([this.loadStats(), this.loadRecentAlerts(), this.loadCategoryStats(), this.loadDeptDeviceStats(), this.loadStatusDeviceStats()])
				this.drawDonutChart()
			} catch (e) {
				console.error('refreshAll error:', e)
				this.error = true
			} finally {
				this.loading = false
			}
		},
		async loadStats() {
			try {
				const now = Date.now()
				const [
					totalRes,
					normalRes,
					repairRes,
					pendingRepairRes,
					pendingMaintRes,
					warrantyExpiredRes
				] = await Promise.all([
					db.collection('medical-device').where('deleted == 0').count(),
					db.collection('medical-device').where('deleted == 0 && status == 2').count(),
					db.collection('medical-device').where('deleted == 0 && status == 3').count(),
					db.collection('medical-device-repair-request').where('deleted == 0 && status == 1').count(),
					db.collection('medical-device-maintenance').where('deleted == 0 && status != 2 && plan_date < ' + now).count(),
					db.collection('medical-device').where('deleted == 0 && warranty_end < ' + now).count()
				])
				const getCount = (res) => res?.total ?? res?.result?.total ?? 0
				this.stats = [
					{ label: '设备总数', count: getCount(totalRes), color: '#4f46e5', bgColor: '#eef2ff', icon: 'list', status: '' },
					{ label: '使用中', count: getCount(normalRes), color: '#059669', bgColor: '#ecfdf5', icon: 'checkmarkempty', status: 2 },
					{ label: '维修中', count: getCount(repairRes), color: '#d97706', bgColor: '#fffbeb', icon: 'undo', status: 3 },
					{ label: '待处理报修', count: getCount(pendingRepairRes), color: '#dc2626', bgColor: '#fef2f2', icon: 'paperplane', status: 'pending-repair' },
					{ label: '待保养', count: getCount(pendingMaintRes), color: '#0891b2', bgColor: '#ecfeff', icon: 'calendar', status: 'pending-maintenance' },
					{ label: '保修过期', count: getCount(warrantyExpiredRes), color: '#6b7280', bgColor: '#f3f4f6', icon: 'closeempty', status: '' }
				]
			} catch (e) {
				console.error('loadStats error:', e)
				throw e
			}
		},
		async loadCategoryStats() {
			try {
				const res = await db.collection('medical-device')
					.where('deleted == 0')
					.field('category_id')
					.get({ getCount: false })
				const devices = res.data || res.result?.data || []
				if (!devices.length) { this.categoryStats = []; return }

				const countMap = {}
				devices.forEach(d => {
					const id = d.category_id || ''
					countMap[id] = (countMap[id] || 0) + 1
				})

				const sorted = Object.entries(countMap)
					.sort((a, b) => b[1] - a[1])
					.slice(0, 6)

				const ids = sorted.map(([id]) => id).filter(Boolean)
				let catMap = {}
				if (ids.length) {
					const catRes = await db.collection('medical-device-category')
						.where({ _id: dbCmd.in(ids) })
						.field('name')
						.get()
					const cats = catRes.data || catRes.result?.data || []
					catMap = Object.fromEntries(cats.map(c => [c._id, c.name]))
				}

				const maxCount = sorted.length ? sorted[0][1] : 1
				this.categoryStats = sorted.map(([id, count]) => {
					const name = id ? (catMap[id] || '未知') : '未分类'
					return { name, count, percent: Math.round(count / maxCount * 100) }
				})
			} catch (e) {
				console.error('loadCategoryStats error:', e)
			}
		},
		async loadDeptDeviceStats() {
			try {
				const res = await db.collection('medical-device')
					.where('deleted == 0')
					.field('dept_id')
					.get({ getCount: false })
				const devices = res.data || res.result?.data || []
				if (!devices.length) { this.deptDeviceStats = []; return }

				const countMap = {}
				devices.forEach(d => {
					const id = d.dept_id || ''
					countMap[id] = (countMap[id] || 0) + 1
				})

				const sorted = Object.entries(countMap)
					.sort((a, b) => b[1] - a[1])
					.slice(0, 8)

				const ids = sorted.map(([id]) => id).filter(Boolean)
				let deptMap = {}
				if (ids.length) {
					const deptRes = await db.collection('opendb-department')
						.where({ _id: dbCmd.in(ids) })
						.field('name')
						.get()
					const depts = deptRes.data || deptRes.result?.data || []
					deptMap = Object.fromEntries(depts.map(d => [d._id, d.name]))
				}

				this.deptDeviceStats = sorted.map(([id, count], i) => {
					const name = id ? (deptMap[id] || '未知科室') : '未分配'
					return { name, count, color: this.deptColors[i % this.deptColors.length] }
				})
			} catch (e) {
				console.error('loadDeptDeviceStats error:', e)
			}
		},
		async loadStatusDeviceStats() {
			try {
				const res = await db.collection('medical-device')
					.where('deleted == 0')
					.field('status')
					.get({ getCount: false })
				const devices = res.data || res.result?.data || []

				const countMap = {}
				devices.forEach(d => {
					const s = d.status || 0
					countMap[s] = (countMap[s] || 0) + 1
				})

				const maxCount = Math.max(...Object.values(countMap), 1)
				const sortedKeys = Object.entries(this.statusConfig).sort((a, b) => a[0] - b[0])
				const ordered = []
				for (const [key, cfg] of sortedKeys) {
					const count = countMap[key] || 0
					ordered.push({
						label: cfg.label,
						count,
						color: cfg.color,
						percent: Math.round(count / maxCount * 100)
					})
				}
				this.statusDeviceStats = ordered
			} catch (e) {
				console.error('loadStatusDeviceStats error:', e)
			}
		},
		drawDonutChart() {
			this.$nextTick(() => {
				const stats = this.deptDeviceStats
				if (!stats || !stats.length) return
				const total = stats.reduce((s, d) => s + d.count, 0)
				if (!total) return
				const sys = uni.getSystemInfoSync()
				const dpr = sys.pixelRatio || 1
				const size = uni.upx2px(180)
				const cx = size / 2
				const cy = size / 2
				const radius = size * 0.4
				const lineWidth = size * 0.1

				const ctx = uni.createCanvasContext('donutCanvas', this)

				ctx.setLineWidth(lineWidth)
				ctx.setLineCap('round')

				ctx.beginPath()
				ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
				ctx.setStrokeStyle('#f0f0f5')
				ctx.stroke()

				let startAngle = -Math.PI / 2
				stats.forEach((item) => {
					const pct = item.count / total
					const angle = pct * 2 * Math.PI
					const endAngle = startAngle + angle

					ctx.beginPath()
					ctx.arc(cx, cy, radius, startAngle, endAngle)
					ctx.setStrokeStyle(item.color)
					ctx.stroke()

					startAngle = endAngle
				})

				ctx.draw()
			})
		},
		async loadRecentAlerts() {
			try {
				const res = await db.collection('medical-device-alert')
					.where('is_read == 0')
					.orderBy('alert_date', 'desc')
					.limit(5)
					.get()
				this.recentAlerts = res.data || res.result?.data || []
			} catch (e) {
				console.error('loadRecentAlerts error:', e)
				throw e
			}
		},
		async markAlertRead(item) {
			if (item.is_read) return
			try {
				await db.collection('medical-device-alert').doc(item._id).update({
					is_read: 1,
					read_date: Date.now()
				})
				item.is_read = 1
			} catch (e) {
				console.error('markAlertRead error:', e)
			}
		},
		navigateToStat(item) {
			const routes = {
				'pending-repair': '/pages/repair-request/list',
				'pending-maintenance': '/pages/alert/list'
			}
			const route = routes[item.status]
			if (route) {
				uni.navigateTo({ url: route })
			} else {
				uni.switchTab({ url: '/pages/device/device-list' })
			}
		},
		execAction(name) {
			const map = {
				toScan: () => uni.navigateTo({ url: '/pages/device/scan' }),
				toDeviceList: () => uni.switchTab({ url: '/pages/device/device-list' }),
				toAddRepair: () => uni.navigateTo({ url: '/pages/repair-request/add' }),
				toRepairs: () => uni.navigateTo({ url: '/pages/repair-request/list' }),
				toAlerts: () => uni.navigateTo({ url: '/pages/alert/list' }),
				toRepairHistory: () => uni.navigateTo({ url: '/pages/repair-request/list' }),
				toScanHistory: () => uni.navigateTo({ url: '/pages/device/scan' }),
				toProfile: () => uni.switchTab({ url: '/pages/ucenter/ucenter' })
			}
			;(map[name] || (() => {}))()
		},
		toUserOrLogin() {
			if (this.hasLogin) {
				uni.switchTab({ url: '/pages/ucenter/ucenter' })
			} else {
				uni.navigateTo({ url: '/uni_modules/uni-id-pages/pages/login/login-withpwd' })
			}
		},
		toAlerts() {
			uni.navigateTo({ url: '/pages/alert/list' })
		},
		toAlertDetail(item) {
			this.markAlertRead(item)
			uni.navigateTo({ url: '/pages/alert/list?highlight=' + item._id })
		}
	}
}
</script>

<style lang="scss" scoped>
.warp {
	min-height: 100vh;
	background: linear-gradient(180deg, #f0eeff 0%, #f5f5f7 30%);
	padding-bottom: 20rpx;
}
.header {
	padding: 120rpx 30rpx 30rpx;
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
	color: #fff;
	position: relative;
	overflow: hidden;
	&::before {
		content: '';
		position: absolute;
		top: -60rpx;
		right: -60rpx;
		width: 240rpx;
		height: 240rpx;
		border-radius: 50%;
		background: rgba(255,255,255,0.06);
	}
	&::after {
		content: '';
		position: absolute;
		bottom: -40rpx;
		left: -40rpx;
		width: 160rpx;
		height: 160rpx;
		border-radius: 50%;
		background: rgba(255,255,255,0.04);
	}
	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: relative;
		z-index: 1;
	}
	.header-greeting {
		display: block;
		font-size: 38rpx;
		font-weight: 700;
	}
	.header-subtitle {
		display: block;
		font-size: 22rpx;
		opacity: 0.8;
		margin-top: 8rpx;
		padding-left: 0.5em;
	}
	.header-user {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.header-avatar {
		width: 68rpx;
		height: 68rpx;
		border-radius: 50%;
		background: rgba(255,255,255,0.2);
		border: 2rpx solid rgba(255,255,255,0.3);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.header-username {
		font-size: 20rpx;
		color: rgba(255,255,255,0.9);
		margin-top: 6rpx;
		max-width: 100rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}
.stats-grid {
	display: flex;
	flex-wrap: wrap;
	padding: 0 20rpx;
	margin-top: 20rpx;
	gap: 16rpx;
	.stat-card {
		width: calc(50% - 8rpx);
		box-sizing: border-box;
		background: #fff;
		border-radius: 20rpx;
		padding: 26rpx 20rpx;
		margin: 0;
		box-shadow: 0 4rpx 20rpx rgba(99,102,241,0.08);
		display: flex;
		align-items: center;
		gap: 14rpx;
		transition: all 0.25s ease;
		&:active {
			transform: scale(0.96);
			box-shadow: 0 2rpx 10rpx rgba(99,102,241,0.05);
		}
		.stat-icon-box {
			width: 56rpx;
			height: 56rpx;
			border-radius: 14rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}
		.stat-body {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 4rpx;
		}
		.stat-number {
			font-size: 36rpx;
			font-weight: 700;
			line-height: 1;
		}
		.stat-label {
			font-size: 22rpx;
			color: #999;
		}
	}
}
.section-title {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 22rpx 24rpx 14rpx;
	.section-title-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
		position: relative;
		padding-left: 20rpx;
		&::before {
			content: '';
			position: absolute;
			left: 0;
			top: 50%;
			transform: translateY(-50%);
			width: 6rpx;
			height: 24rpx;
			border-radius: 3rpx;
			background: linear-gradient(180deg, #6366f1, #8b5cf6);
		}
	}
	.section-more {
		font-size: 24rpx;
		color: #6366f1;
	}
}
.alert-badge {
	display: inline-block;
	background: linear-gradient(135deg, #ef4444, #dc2626);
	color: #fff;
	font-size: 20rpx;
	padding: 0 14rpx;
	border-radius: 20rpx;
	margin-left: 8rpx;
	font-weight: 500;
}
.quick-actions {
	background: #fff;
	margin: 20rpx;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
	.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 24rpx 0 20rpx;
		transition: transform 0.2s;
		&:active { transform: scale(0.92); }
		.action-icon {
			width: 76rpx;
			height: 76rpx;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08);
		}
		.action-text {
			font-size: 22rpx;
			color: #444;
			margin-top: 12rpx;
			font-weight: 500;
		}
	}
}
.category-section {
	background: #fff;
	margin: 20rpx;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
	.category-list {
		padding: 0 24rpx 20rpx;
	}
	.category-item {
		padding: 18rpx 0;
		border-bottom: 1rpx solid #f0f0f5;
		transition: opacity 0.2s;
		&:active { opacity: 0.7; }
		&:last-child { border-bottom: none; }
	}
	.category-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10rpx;
	}
	.category-name {
		font-size: 26rpx;
		color: #333;
		font-weight: 500;
	}
	.category-count {
		font-size: 24rpx;
		color: #999;
		font-weight: 500;
	}
	.category-bar-bg {
		height: 14rpx;
		background: #f0f0f5;
		border-radius: 7rpx;
		overflow: hidden;
	}
	.category-bar {
		height: 100%;
		border-radius: 7rpx;
		transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
	}
}
.alert-section {
	background: #fff;
	margin: 20rpx;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
	.alert-list {
		padding: 0 20rpx 10rpx;
	}
	.alert-item {
		display: flex;
		align-items: flex-start;
		padding: 18rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
		transition: opacity 0.2s;
		&:active { opacity: 0.7; }
		&:last-child { border-bottom: none; }
		.alert-dot {
			width: 16rpx;
			height: 16rpx;
			border-radius: 50%;
			margin-right: 16rpx;
			flex-shrink: 0;
			margin-top: 8rpx;
			box-shadow: 0 0 8rpx rgba(239,68,68,0.3);
		}
		.dot-unread { background-color: #ef4444; }
		.dot-read { background-color: #d1d5db; box-shadow: none; }
		.alert-content {
			flex: 1;
			min-width: 0;
			.alert-title {
				font-size: 26rpx;
				color: #333;
				font-weight: 500;
			}
			.alert-desc {
				font-size: 22rpx;
				color: #999;
				margin-top: 4rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
	}
}
.empty-section {
	padding-bottom: 20rpx;
}
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 30rpx 0;
	.empty-text {
		font-size: 24rpx;
		color: #bbb;
		margin-top: 12rpx;
	}
}
.retry-text {
	color: #6366f1;
	font-weight: 500;
}
.charts-row {
	padding: 0 20rpx;
	margin-top: 20rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}
.chart-card {
	background: #fff;
	border-radius: 20rpx;
	padding: 0 24rpx 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
	.section-title {
		padding-left: 0;
		padding-right: 0;
	}
}
.donut-wrap {
	display: flex;
	align-items: center;
	padding: 10rpx 0;
	gap: 20rpx;
}
.donut-chart {
	position: relative;
	flex: 1;
	height: 180rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.donut-canvas {
	width: 180rpx;
	height: 180rpx;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
.donut-center {
	position: absolute;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
.donut-total {
	font-size: 36rpx;
	font-weight: 700;
	color: #333;
	line-height: 1.2;
}
.donut-label {
	font-size: 20rpx;
	color: #999;
}
.donut-legend {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}
.legend-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
}
.legend-dot {
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	flex-shrink: 0;
}
.legend-name {
	flex: 1;
	font-size: 22rpx;
	color: #555;
	min-width: 0;
}
.legend-count {
	font-size: 22rpx;
	color: #999;
	font-weight: 500;
	flex-shrink: 0;
}
.ellipsis {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.status-list {
	padding: 0 0 10rpx;
}
.status-item {
	padding: 14rpx 0;
	border-bottom: 1rpx solid #f5f5f7;
	&:last-child { border-bottom: none; }
}
.status-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8rpx;
}
.status-label {
	display: flex;
	align-items: center;
	gap: 8rpx;
}
.status-dot {
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	flex-shrink: 0;
}
.status-name {
	font-size: 26rpx;
	color: #333;
}
.status-count {
	font-size: 24rpx;
	color: #999;
	font-weight: 500;
}
.status-bar-bg {
	height: 14rpx;
	background: #f0f0f5;
	border-radius: 7rpx;
	overflow: hidden;
}
.status-bar {
	height: 100%;
	border-radius: 7rpx;
	transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
